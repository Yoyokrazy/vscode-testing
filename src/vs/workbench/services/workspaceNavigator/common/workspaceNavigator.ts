/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Event } from '../../../../base/common/event.js';
import { URI } from '../../../../base/common/uri.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const IWorkspaceNavigatorService = createDecorator<IWorkspaceNavigatorService>('workspaceNavigatorService');
export const NAVIGATOR_VIEW_ID = 'workbench.explorer.workspaceNavigator';
export const NAVIGATOR_OPEN_COMMAND = 'workbench.action.workspaceNavigator.open';
export const NAVIGATOR_QUICK_OPEN_COMMAND = 'workbench.action.workspaceNavigator.quickOpen';
export const NAVIGATOR_PREFIX = 'nav ';

export type NavigatorSource = 'workspace' | 'recent' | 'open' | 'pinned';
export type NavigatorFilter = 'all' | 'open' | 'pinned';

export interface INavigatorEntry {
	readonly resource: URI;
	readonly name: string;
	readonly sources: readonly NavigatorSource[];
	readonly dirty: boolean;
	readonly recentIndex: number;
}

export interface INavigatorResult {
	readonly entries: readonly INavigatorEntry[];
	readonly limitHit: boolean;
}

export interface INavigatorPreferences {
	readonly pins: readonly URI[];
	readonly filter: NavigatorFilter;
	readonly preview: boolean;
}

export interface INavigatorPreview {
	readonly text: string;
	readonly truncated: boolean;
}

export interface IWorkspaceNavigatorService {
	readonly _serviceBrand: undefined;
	readonly onDidChange: Event<void>;
	readonly preferences: INavigatorPreferences;
	discover(query: string, token: CancellationToken): Promise<INavigatorResult>;
	preview(resource: URI, token: CancellationToken): Promise<INavigatorPreview>;
	togglePin(resource: URI): void;
	setFilter(filter: NavigatorFilter): void;
	setPreview(enabled: boolean): void;
	refresh(): void;
}
