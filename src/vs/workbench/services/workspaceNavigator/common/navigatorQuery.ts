/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface INavigatorDiscoveryPolicy {
	readonly excludePattern: string | undefined;
	readonly useFileExcludes: boolean;
}

/** Shared file-discovery policy for workbench and extension queries. */
export function navigatorDiscoveryPolicy(exclude: string | null | undefined): INavigatorDiscoveryPolicy {
	return {
		excludePattern: exclude || undefined,
		useFileExcludes: true
	};
}

export function navigatorQueryTerms(query: string): readonly string[] {
	return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export function navigatorMatches(path: string, terms: readonly string[]): boolean {
	const normalized = path.toLowerCase();
	return terms.every(term => normalized.includes(term));
}
