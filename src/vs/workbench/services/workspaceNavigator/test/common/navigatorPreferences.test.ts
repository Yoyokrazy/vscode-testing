/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { Schemas } from '../../../../../base/common/network.js';
import { URI } from '../../../../../base/common/uri.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { defaultNavigatorPreferences, readNavigatorPreferences, writeNavigatorPreferences } from '../../common/navigatorPreferences.js';

suite('Workspace Navigator preferences', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('missing and invalid JSON use defaults', () => {
		assert.deepStrictEqual([readNavigatorPreferences(undefined), readNavigatorPreferences('{')], [defaultNavigatorPreferences, defaultNavigatorPreferences]);
	});

	test('remote pins round trip without losing URI components', () => {
		const resource = URI.from({ scheme: Schemas.vscodeRemote, authority: 'ssh-remote+example', path: '/src/main.ts', query: 'version=2', fragment: 'line' });
		const original = { pins: [resource], filter: 'pinned' as const, preview: false };
		const restored = readNavigatorPreferences(writeNavigatorPreferences(original));
		assert.deepStrictEqual({ ...restored, pins: restored.pins.map(pin => pin.toString()) }, { ...original, pins: original.pins.map(pin => pin.toString()) });
	});

	test('malformed individual pins do not discard valid pins', () => {
		assert.deepStrictEqual(readNavigatorPreferences(JSON.stringify({ pins: [17, 'invalid', 'file:///a.ts'] })).pins.map(pin => pin.toString()), ['file:///a.ts']);
	});

	test('unrecognized filter and preview values use defaults', () => {
		assert.deepStrictEqual(readNavigatorPreferences('{"pins":[],"filter":"other","preview":"false"}'), defaultNavigatorPreferences);
	});

	test('partial saved preferences are supported', () => {
		assert.deepStrictEqual(readNavigatorPreferences('{"filter":"open"}'), { pins: [], filter: 'open', preview: true });
	});

	test('null saved values use defaults', () => {
		assert.deepStrictEqual(readNavigatorPreferences('null'), defaultNavigatorPreferences);
	});
});
