/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { URI } from '../../../../../base/common/uri.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { rankNavigatorEntries } from '../../common/navigatorRanking.js';
import { INavigatorEntry, NavigatorSource } from '../../common/workspaceNavigator.js';

suite('Workspace Navigator ranking', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	function entry(path: string, sources: readonly NavigatorSource[] = ['workspace'], recentIndex = -1): INavigatorEntry {
		return { resource: URI.file(path), name: path.slice(path.lastIndexOf('/') + 1), sources, dirty: false, recentIndex };
	}

	test('pins and open editors precede workspace files', () => {
		const files = [entry('/a.ts'), entry('/b.ts', ['open']), entry('/c.ts', ['pinned'])];
		assert.deepStrictEqual(rankNavigatorEntries(files, '', 'all', 10).map(item => item.name), ['c.ts', 'b.ts', 'a.ts']);
	});

	test('all query terms must match the path', () => {
		const files = [entry('/src/main.ts'), entry('/test/main.ts'), entry('/src/index.ts')];
		assert.deepStrictEqual(rankNavigatorEntries(files, 'SRC main', 'all', 10).map(item => item.name), ['main.ts']);
	});

	test('open filter retains files with multiple sources', () => {
		const files = [entry('/a.ts', ['workspace']), entry('/b.ts', ['workspace', 'open', 'pinned'])];
		assert.deepStrictEqual(rankNavigatorEntries(files, '', 'open', 10).map(item => item.name), ['b.ts']);
	});

	test('pinned filter excludes unpinned files', () => {
		const files = [entry('/a.ts', ['open']), entry('/b.ts', ['pinned'])];
		assert.deepStrictEqual(rankNavigatorEntries(files, '', 'pinned', 10).map(item => item.name), ['b.ts']);
	});

	test('recent files are ordered by history position', () => {
		const files = [entry('/a.ts', ['recent'], 8), entry('/b.ts', ['recent'], 2)];
		assert.deepStrictEqual(rankNavigatorEntries(files, '', 'all', 10).map(item => item.name), ['b.ts', 'a.ts']);
	});

	test('ties have a stable path order', () => {
		const files = [entry('/b/index.ts'), entry('/a/index.ts')];
		assert.deepStrictEqual(rankNavigatorEntries(files, '', 'all', 10).map(item => item.resource.path), ['/a/index.ts', '/b/index.ts']);
	});

	test('limits apply after filtering and do not mutate input', () => {
		const files = Object.freeze([entry('/z.ts'), entry('/b.ts'), entry('/a.ts')]);
		assert.deepStrictEqual({
			result: rankNavigatorEntries(files, '.ts', 'all', 1).map(item => item.name),
			input: files.map(item => item.name)
		}, { result: ['a.ts'], input: ['z.ts', 'b.ts', 'a.ts'] });
	});

	test('empty collections and unmatched queries are empty', () => {
		assert.deepStrictEqual([
			rankNavigatorEntries([], '', 'all', 10),
			rankNavigatorEntries([entry('/a.ts')], 'missing', 'all', 10)
		], [[], []]);
	});
});
