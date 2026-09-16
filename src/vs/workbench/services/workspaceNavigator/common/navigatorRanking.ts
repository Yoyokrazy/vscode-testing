/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { compare } from '../../../../base/common/strings.js';
import { INavigatorEntry, NavigatorFilter } from './workspaceNavigator.js';
import { navigatorMatches, navigatorQueryTerms } from './navigatorQuery.js';

export function rankNavigatorEntries(entries: readonly INavigatorEntry[], query: string, filter: NavigatorFilter, limit: number): readonly INavigatorEntry[] {
	const terms = navigatorQueryTerms(query);
	const ranked = entries.map(entry => {
		const siblings = entries.filter(candidate => candidate.name === entry.name);
		const recentPeers = entries.filter(candidate => candidate.recentIndex >= 0 && candidate.recentIndex < entry.recentIndex);
		const exact = terms.length === 1 && entry.name.toLowerCase() === terms[0];
		const score = (entry.sources.includes('pinned') ? 1000 : 0)
			+ (entry.sources.includes('open') ? 500 : 0)
			+ (entry.recentIndex >= 0 ? 200 / (recentPeers.length + 1) : 0)
			+ (exact ? 100 : 0)
			+ 1 / siblings.length;
		return { entry, score };
	});

	return ranked
		.filter(({ entry }) => navigatorMatches(entry.resource.path, terms)
			&& (filter === 'all' || entry.sources.includes(filter)))
		.sort((a, b) => b.score - a.score || compare(a.entry.resource.toString(), b.entry.resource.toString()))
		.slice(0, limit)
		.map(({ entry }) => entry);
}
