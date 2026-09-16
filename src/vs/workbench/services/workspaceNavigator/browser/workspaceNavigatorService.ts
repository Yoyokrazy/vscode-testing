/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { CancellationError } from '../../../../base/common/errors.js';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { ResourceMap } from '../../../../base/common/map.js';
import { basename } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IUriIdentityService } from '../../../../platform/uriIdentity/common/uriIdentity.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { EditorResourceAccessor } from '../../../common/editor.js';
import { IEditorService } from '../../editor/common/editorService.js';
import { IHistoryService } from '../../history/common/history.js';
import { QueryBuilder } from '../../search/common/queryBuilder.js';
import { ISearchService } from '../../search/common/search.js';
import { IWorkingCopyService } from '../../workingCopy/common/workingCopyService.js';
import { readNavigatorPreferences, writeNavigatorPreferences } from '../common/navigatorPreferences.js';
import { navigatorDiscoveryPolicy } from '../common/navigatorQuery.js';
import { rankNavigatorEntries } from '../common/navigatorRanking.js';
import { INavigatorEntry, INavigatorPreferences, INavigatorResult, IWorkspaceNavigatorService, NavigatorFilter, NavigatorSource } from '../common/workspaceNavigator.js';
import { NavigatorPreview } from './navigatorPreview.js';

export class WorkspaceNavigatorService extends Disposable implements IWorkspaceNavigatorService {
	declare readonly _serviceBrand: undefined;
	private static readonly STORAGE_KEY = 'workspaceNavigator.preferences';
	private readonly changed = this._register(new Emitter<void>());
	readonly onDidChange = this.changed.event;
	private readonly queryBuilder: QueryBuilder;
	private readonly previews: NavigatorPreview;
	private state: INavigatorPreferences;

	get preferences(): INavigatorPreferences { return this.state; }

	constructor(
		@ISearchService private readonly searchService: ISearchService,
		@IWorkspaceContextService private readonly workspaceService: IWorkspaceContextService,
		@IEditorService private readonly editorService: IEditorService,
		@IHistoryService private readonly historyService: IHistoryService,
		@IWorkingCopyService private readonly workingCopyService: IWorkingCopyService,
		@IFileService private readonly fileService: IFileService,
		@IStorageService private readonly storageService: IStorageService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IUriIdentityService private readonly uriIdentityService: IUriIdentityService,
		@IInstantiationService instantiationService: IInstantiationService
	) {
		super();
		this.queryBuilder = instantiationService.createInstance(QueryBuilder);
		this.previews = this._register(instantiationService.createInstance(NavigatorPreview));
		this.state = this.loadPreferences();
		this._register(editorService.onDidEditorsChange(() => this.changed.fire()));
		this._register(workingCopyService.onDidChangeDirty(() => this.changed.fire()));
		this._register(workingCopyService.onDidChangeContent(() => this.changed.fire()));
		this._register(fileService.onDidFilesChange(() => this.refresh()));
		this._register(workspaceService.onDidChangeWorkspaceFolders(() => this.refresh()));
		this._register(configurationService.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('files.exclude') || event.affectsConfiguration('search') || event.affectsConfiguration('workspaceNavigator')) {
				this.refresh();
			}
		}));
		this._register(storageService.onDidChangeValue(StorageScope.PROFILE, WorkspaceNavigatorService.STORAGE_KEY, this._store)(() => {
			this.state = this.loadPreferences();
			this.changed.fire();
		}));
	}

	private loadPreferences(): INavigatorPreferences {
		return readNavigatorPreferences(this.storageService.get(WorkspaceNavigatorService.STORAGE_KEY, StorageScope.PROFILE));
	}

	async discover(query: string, token: CancellationToken): Promise<INavigatorResult> {
		if (token.isCancellationRequested) {
			throw new CancellationError();
		}
		const entries = new ResourceMap<INavigatorEntry>(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
		const add = (resource: URI | undefined, source: NavigatorSource, recentIndex = -1) => {
			if (!resource || !this.fileService.hasProvider(resource)) {
				return;
			}
			const existing = entries.get(resource);
			entries.set(resource, {
				resource,
				name: basename(resource),
				sources: existing ? [...new Set([...existing.sources, source])] : [source],
				dirty: this.workingCopyService.isDirty(resource),
				recentIndex: existing && existing.recentIndex >= 0 ? existing.recentIndex : recentIndex
			});
		};

		const folders = this.workspaceService.getWorkspace().folders;
		const policy = navigatorDiscoveryPolicy(undefined);
		const search = folders.length ? await this.searchService.fileSearch(this.queryBuilder.file([...folders], {
			_reason: 'workspaceNavigator',
			maxResults: 20000,
			disregardExcludeSettings: !policy.useFileExcludes,
			excludePattern: policy.excludePattern ? [{ pattern: policy.excludePattern }] : undefined,
			sortByScore: false
		}), token) : undefined;
		if (token.isCancellationRequested) {
			throw new CancellationError();
		}
		for (const match of search?.results ?? []) {
			add(match.resource, 'workspace');
		}
		this.historyService.getHistory().forEach((editor, index) => add(EditorResourceAccessor.getOriginalUri(editor), 'recent', index));
		for (const editor of this.editorService.editors) {
			add(EditorResourceAccessor.getOriginalUri(editor), 'open');
		}
		for (const workingCopy of this.workingCopyService.dirtyWorkingCopies) {
			add(workingCopy.resource, 'open');
		}
		for (const resource of this.state.pins) {
			add(resource, 'pinned');
		}
		const configuredLimit = this.configurationService.getValue<number>('workspaceNavigator.maxResults');
		const limit = Math.max(1, Math.min(1000, configuredLimit || 200));
		const ranked = rankNavigatorEntries([...entries.values()], query, this.state.filter, Number.MAX_SAFE_INTEGER);
		return {
			entries: ranked.slice(0, limit),
			limitHit: !!search?.limitHit || ranked.length > limit
		};
	}

	preview(resource: URI, token: CancellationToken) {
		return this.previews.read(resource, token);
	}

	togglePin(resource: URI): void {
		const pins = this.state.pins;
		const contains = pins.some(pin => this.uriIdentityService.extUri.isEqual(pin, resource));
		this.savePreferences({
			...this.state,
			pins: contains ? pins.filter(pin => !this.uriIdentityService.extUri.isEqual(pin, resource)) : [...pins, resource]
		});
	}

	setFilter(filter: NavigatorFilter): void {
		this.savePreferences({ ...this.state, filter });
	}

	setPreview(preview: boolean): void {
		this.savePreferences({ ...this.state, preview });
	}

	private savePreferences(preferences: INavigatorPreferences): void {
		if (writeNavigatorPreferences(preferences) === writeNavigatorPreferences(this.state)) {
			return;
		}
		this.state = preferences;
		this.storageService.store(WorkspaceNavigatorService.STORAGE_KEY, writeNavigatorPreferences(preferences), StorageScope.PROFILE, StorageTarget.USER);
		this.changed.fire();
	}

	refresh(): void {
		this.previews.clear();
		this.changed.fire();
	}
}
