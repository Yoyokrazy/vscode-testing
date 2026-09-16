/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { isCancellationError } from '../../../../base/common/errors.js';
import { DisposableStore, IDisposable, toDisposable } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { ILabelService } from '../../../../platform/label/common/label.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IQuickAccessProvider } from '../../../../platform/quickinput/common/quickAccess.js';
import { IQuickPick, IQuickPickItemWithResource } from '../../../../platform/quickinput/common/quickInput.js';
import { IEditorService } from '../../editor/common/editorService.js';
import { IWorkspaceNavigatorService, NAVIGATOR_PREFIX } from '../common/workspaceNavigator.js';

export class NavigatorQuickPick implements IQuickAccessProvider {
	constructor(
		@IWorkspaceNavigatorService private readonly navigatorService: IWorkspaceNavigatorService,
		@IEditorService private readonly editorService: IEditorService,
		@ILabelService private readonly labelService: ILabelService,
		@INotificationService private readonly notificationService: INotificationService
	) { }

	provide(picker: IQuickPick<IQuickPickItemWithResource, { useSeparators: true }>, token: CancellationToken): IDisposable {
		return this.provideWithPrefix(picker, token, NAVIGATOR_PREFIX);
	}

	provideWithPrefix(picker: IQuickPick<IQuickPickItemWithResource, { useSeparators: true }>, token: CancellationToken, prefix: string): IDisposable {
		const store = new DisposableStore();
		let disposed = false;
		let pending = 0;
		store.add(toDisposable(() => { disposed = true; }));
		picker.matchOnLabel = false;
		picker.matchOnDescription = false;
		picker.matchOnDetail = false;
		picker.sortByLabel = false;
		picker.placeholder = localize('navigator.quickPlaceholder', "Search workspace files, open editors, recent files, and pins");

		const update = async () => {
			const query = picker.value.slice(prefix.length);
			pending++;
			picker.busy = true;
			try {
				const result = await this.navigatorService.discover(query, token);
				if (disposed || token.isCancellationRequested) {
					return;
				}
				picker.items = result.entries.map(entry => ({
					label: entry.name,
					description: this.labelService.getUriLabel(entry.resource, { relative: true }),
					detail: entry.dirty ? localize('navigator.quickDirty', "Unsaved changes") : undefined,
					resource: entry.resource,
					alwaysShow: true
				}));
			} catch (error) {
				if (!disposed && !token.isCancellationRequested && !isCancellationError(error)) {
					this.notificationService.error(error);
				}
			} finally {
				pending--;
				if (!disposed) {
					picker.busy = pending > 0;
				}
			}
		};
		store.add(picker.onDidChangeValue(() => { void update(); }));
		store.add(this.navigatorService.onDidChange(() => { void update(); }));
		store.add(picker.onDidAccept(() => {
			const resource = picker.selectedItems[0]?.resource;
			if (resource) {
				picker.hide();
				void this.editorService.openEditor({ resource, options: { pinned: true } }).catch(error => this.notificationService.error(error));
			}
		}));
		void update();
		return store;
	}
}
