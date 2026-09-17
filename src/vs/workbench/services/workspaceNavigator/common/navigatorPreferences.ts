/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';
import { INavigatorPreferences } from './workspaceNavigator.js';

export const defaultNavigatorPreferences: INavigatorPreferences = {
	pins: [],
	filter: 'all',
	preview: true
};

export function readNavigatorPreferences(value: string | undefined): INavigatorPreferences {
	if (!value) {
		return defaultNavigatorPreferences;
	}
	try {
		const parsed: { pins?: string[]; filter?: string; preview?: boolean } = JSON.parse(value);
		const pins: URI[] = [];
		if (Array.isArray(parsed?.pins)) {
			for (const value of parsed.pins) {
				if (typeof value !== 'string') {
					continue;
				}
				try {
					const resource = URI.parse(value, true);
					if (resource.scheme) {
						pins.push(resource);
					}
				} catch {
					// Skip individual pins that can no longer be restored.
				}
			}
		}
		return {
			pins,
			filter: parsed?.filter === 'open' || parsed?.filter === 'pinned' ? parsed.filter : 'all',
			preview: typeof parsed?.preview === 'boolean' ? parsed.preview : true
		};
	} catch {
		return defaultNavigatorPreferences;
	}
}

export function writeNavigatorPreferences(preferences: INavigatorPreferences): string {
	return JSON.stringify({
		pins: preferences.pins.map(resource => resource.toString()),
		filter: preferences.filter,
		preview: preferences.preview
	});
}
