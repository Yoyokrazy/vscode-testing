/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { navigatorDiscoveryPolicy, navigatorMatches, navigatorQueryTerms } from '../../common/navigatorQuery.js';

suite('Workspace Navigator query', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('normalizes whitespace and case', () => {
		assert.deepStrictEqual(navigatorQueryTerms('  SRC\t Main.TS  '), ['src', 'main.ts']);
	});

	test('empty query matches every path', () => {
		assert.strictEqual(navigatorMatches('/src/main.ts', navigatorQueryTerms(' ')), true);
	});

	test('search characters are literal rather than regular expressions', () => {
		assert.deepStrictEqual([
			navigatorMatches('/src/[test].ts', navigatorQueryTerms('[test]')),
			navigatorMatches('/src/test.ts', navigatorQueryTerms('[test]'))
		], [true, false]);
	});

	test('default discovery honors file excludes', () => {
		assert.deepStrictEqual(navigatorDiscoveryPolicy(undefined), { excludePattern: undefined, useFileExcludes: true });
	});

	test('explicit exclusion patterns are preserved', () => {
		assert.deepStrictEqual(navigatorDiscoveryPolicy('**/generated/**'), { excludePattern: '**/generated/**', useFileExcludes: true });
	});
});
