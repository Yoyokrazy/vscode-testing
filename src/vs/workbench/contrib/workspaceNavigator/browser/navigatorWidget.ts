/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Button } from '../../../../base/browser/ui/button/button.js';
import { InputBox } from '../../../../base/browser/ui/inputbox/inputBox.js';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { isCancellationError } from '../../../../base/common/errors.js';
import { Disposable, DisposableStore } from '../../../../base/common/lifecycle.js';
import { extUri } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { localize } from '../../../../nls.js';
import { IContextViewService } from '../../../../platform/contextview/browser/contextView.js';
import { ILabelService } from '../../../../platform/label/common/label.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { defaultButtonStyles, defaultInputBoxStyles } from '../../../../platform/theme/browser/defaultStyles.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { INavigatorEntry, IWorkspaceNavigatorService, NavigatorFilter } from '../../../services/workspaceNavigator/common/workspaceNavigator.js';

export class NavigatorWidget extends Disposable {
	private readonly element: HTMLElement;
	private readonly input: InputBox;
	private readonly status: HTMLElement;
	private readonly rows: HTMLElement;
	private readonly previewElement: HTMLElement;
	private readonly rowDisposables = this._register(new DisposableStore());
	private readonly rowActions = new Map<HTMLElement, { readonly resource: URI; readonly action: string }>();
	private readonly previewToggle: Button;
	private readonly filter: HTMLSelectElement;
	private request = 0;
	private previewRequest: CancellationTokenSource | undefined;
	private disposed = false;

	constructor(
		container: HTMLElement,
		@IWorkspaceNavigatorService private readonly navigatorService: IWorkspaceNavigatorService,
		@IEditorService private readonly editorService: IEditorService,
		@ILabelService private readonly labelService: ILabelService,
		@IContextViewService contextViewService: IContextViewService,
		@INotificationService private readonly notificationService: INotificationService
	) {
		super();
		this.element = dom.append(container, dom.$('.workspace-navigator'));
		const controls = dom.append(this.element, dom.$('.navigator-controls'));
		this.input = this._register(new InputBox(controls, contextViewService, {
			placeholder: localize('navigator.filterPlaceholder', "Filter files by name or path"),
			ariaLabel: localize('navigator.filterLabel', "Filter Navigator files"),
			inputBoxStyles: defaultInputBoxStyles
		}));
		this._register(this.input.onDidChange(() => { void this.refresh(); }));

		const toolbar = dom.append(controls, dom.$('.navigator-toolbar'));
		this.filter = dom.append(toolbar, dom.$('select.navigator-filter'));
		this.filter.setAttribute('aria-label', localize('navigator.sources', "Navigator sources"));
		const filters: readonly { value: NavigatorFilter; label: string }[] = [
			{ value: 'all', label: localize('navigator.all', "All Files") },
			{ value: 'open', label: localize('navigator.openEditors', "Open Editors") },
			{ value: 'pinned', label: localize('navigator.pins', "Pinned Files") }
		];
		for (const filter of filters) {
			const option = dom.append(this.filter, dom.$<HTMLOptionElement>('option'));
			option.value = filter.value;
			option.textContent = filter.label;
		}
		this._register(dom.addDisposableListener(this.filter, dom.EventType.CHANGE, () => {
			const value = this.filter.value;
			if (value === 'all' || value === 'open' || value === 'pinned') {
				this.navigatorService.setFilter(value);
			}
		}));
		const refresh = this._register(new Button(toolbar, { ...defaultButtonStyles, secondary: true }));
		refresh.label = localize('navigator.refresh', "Refresh");
		this._register(refresh.onDidClick(() => this.navigatorService.refresh()));
		this.previewToggle = this._register(new Button(toolbar, { ...defaultButtonStyles, secondary: true }));
		this._register(this.previewToggle.onDidClick(() => this.navigatorService.setPreview(!this.navigatorService.preferences.preview)));

		this.status = dom.append(this.element, dom.$('.navigator-status'));
		this.status.setAttribute('role', 'status');
		this.status.setAttribute('aria-live', 'polite');
		this.rows = dom.append(this.element, dom.$('.navigator-rows'));
		this.rows.setAttribute('role', 'list');
		this.rows.setAttribute('aria-label', localize('navigator.files', "Workspace Navigator files"));
		this.previewElement = dom.append(this.element, dom.$('pre.navigator-preview'));
		this.previewElement.tabIndex = 0;
		this.previewElement.setAttribute('aria-label', localize('navigator.previewLabel', "File preview"));

		this.navigatorService.onDidChange(() => { void this.refresh(); });
		void this.refresh();
	}

	focus(): void {
		this.input.focus();
	}

	reveal(resource: URI): void {
		this.navigatorService.setFilter('all');
		this.input.value = resource.path;
		void this.refresh();
		void this.showPreview(resource);
	}

	private async refresh(): Promise<void> {
		const request = ++this.request;
		if (!this.disposed) {
			this.status.textContent = localize('navigator.loading', "Finding files…");
			this.rows.setAttribute('aria-busy', 'true');
			this.filter.value = this.navigatorService.preferences.filter;
			this.previewToggle.label = this.navigatorService.preferences.preview
				? localize('navigator.hidePreview', "Hide Preview")
				: localize('navigator.showPreview', "Show Preview");
			this.previewToggle.element.setAttribute('aria-pressed', String(this.navigatorService.preferences.preview));
			this.previewElement.hidden = !this.navigatorService.preferences.preview;
		}
		try {
			const result = await this.navigatorService.discover(this.input.value, CancellationToken.None);
			if (this.disposed || request !== this.request) {
				return;
			}
			const active = dom.getActiveElement();
			const focusedAction = dom.isHTMLElement(active) ? this.rowActions.get(active) : undefined;
			this.rowDisposables.clear();
			this.rowActions.clear();
			dom.clearNode(this.rows);
			for (const entry of result.entries) {
				this.renderRow(entry);
			}
			if (focusedAction) {
				for (const [element, action] of this.rowActions) {
					if (action.action === focusedAction.action && extUri.isEqual(action.resource, focusedAction.resource)) {
						element.focus();
						break;
					}
				}
			}
			this.status.textContent = result.entries.length === 0
				? localize('navigator.empty', "No matching files.")
				: result.limitHit
					? localize('navigator.limited', "Showing {0} files. Refine your filter to see more.", result.entries.length)
					: localize('navigator.count', "{0} files", result.entries.length);
		} catch (error) {
			if (!this.disposed && request === this.request && !isCancellationError(error)) {
				this.status.textContent = localize('navigator.failed', "Unable to discover files. Try refreshing.");
				this.notificationService.error(error);
			}
		} finally {
			if (!this.disposed && request === this.request) {
				this.rows.setAttribute('aria-busy', 'false');
			}
		}
	}

	private renderRow(entry: INavigatorEntry): void {
		const row = dom.append(this.rows, dom.$('.navigator-row'));
		row.setAttribute('role', 'listitem');
		const content = dom.append(row, dom.$('.navigator-resource'));
		const open = this.rowDisposables.add(new Button(content, { ...defaultButtonStyles, secondary: true }));
		open.label = entry.name;
		open.element.dataset.navigatorAction = 'open';
		this.rowActions.set(open.element, { resource: entry.resource, action: 'open' });
		open.element.title = this.labelService.getUriLabel(entry.resource);
		this.rowDisposables.add(open.onDidClick(() => {
			void this.editorService.openEditor({ resource: entry.resource, options: { pinned: true } }).catch(error => this.notificationService.error(error));
		}));
		const description = dom.append(content, dom.$('.navigator-description'));
		description.textContent = this.labelService.getUriLabel(entry.resource, { relative: true });
		description.title = this.labelService.getUriLabel(entry.resource);
		const state = dom.append(content, dom.$('.navigator-state'));
		state.textContent = entry.dirty ? localize('navigator.dirty', "Unsaved changes")
			: entry.sources.includes('open') ? localize('navigator.open', "Open editor")
				: entry.sources.includes('recent') ? localize('navigator.recent', "Recently opened")
					: localize('navigator.workspace', "Workspace file");
		const actions = dom.append(row, dom.$('.navigator-row-actions'));
		const preview = this.rowDisposables.add(new Button(actions, { ...defaultButtonStyles, secondary: true }));
		preview.label = localize('navigator.preview', "Preview");
		preview.element.dataset.navigatorAction = 'preview';
		this.rowActions.set(preview.element, { resource: entry.resource, action: 'preview' });
		this.rowDisposables.add(preview.onDidClick(() => { void this.showPreview(entry.resource); }));
		const pin = dom.append(actions, dom.$('span.navigator-pin'));
		pin.setAttribute('role', 'button');
		pin.dataset.navigatorAction = 'pin';
		this.rowActions.set(pin, { resource: entry.resource, action: 'pin' });
		pin.tabIndex = 0;
		const pinned = entry.sources.includes('pinned');
		pin.textContent = pinned ? localize('navigator.unpin', "Unpin") : localize('navigator.pin', "Pin");
		pin.setAttribute('aria-label', pinned ? localize('navigator.unpinFile', "Unpin {0}", entry.name) : localize('navigator.pinFile', "Pin {0}", entry.name));
		pin.setAttribute('aria-pressed', String(pinned));
		this.rowDisposables.add(dom.addDisposableListener(pin, dom.EventType.CLICK, () => this.navigatorService.togglePin(entry.resource)));
	}

	private async showPreview(resource: URI): Promise<void> {
		this.previewRequest?.dispose(true);
		const request = this.previewRequest = new CancellationTokenSource();
		this.navigatorService.setPreview(true);
		this.previewElement.textContent = localize('navigator.previewLoading', "Loading preview…");
		try {
			const preview = await this.navigatorService.preview(resource, request.token);
			if (this.disposed || request.token.isCancellationRequested) {
				return;
			}
			this.previewElement.textContent = preview.truncated
				? localize('navigator.previewTruncated', "{0}\n\nPreview truncated.", preview.text)
				: preview.text;
		} catch (error) {
			if (!this.disposed && !request.token.isCancellationRequested && !isCancellationError(error)) {
				this.previewElement.textContent = localize('navigator.previewFailed', "Preview unavailable. Open the file to inspect it.");
			}
		}
	}

	override dispose(): void {
		this.disposed = true;
		this.previewRequest?.dispose(true);
		this.rowActions.clear();
		this.element.remove();
		super.dispose();
	}
}
