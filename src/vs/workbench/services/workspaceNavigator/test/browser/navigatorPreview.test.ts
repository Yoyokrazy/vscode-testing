/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { VSBuffer } from '../../../../../base/common/buffer.js';
import { CancellationToken, CancellationTokenSource } from '../../../../../base/common/cancellation.js';
import { isCancellationError } from '../../../../../base/common/errors.js';
import { Event } from '../../../../../base/common/event.js';
import { URI } from '../../../../../base/common/uri.js';
import { mock } from '../../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { IFileContent, IFileService, IReadFileOptions } from '../../../../../platform/files/common/files.js';
import { NavigatorPreview } from '../../browser/navigatorPreview.js';

suite('Workspace Navigator preview', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();
	const resource = URI.file('/src/example.txt');

	function createPreview(text: string, size?: number) {
		let reads = 0;
		let lastOptions: IReadFileOptions | undefined;
		const preview = store.add(new NavigatorPreview(new class extends mock<IFileService>() {
			override readonly onDidFilesChange = Event.None;
			override readonly onDidChangeFileSystemProviderRegistrations = Event.None;
			override async readFile(resource: URI, options?: IReadFileOptions): Promise<IFileContent> {
				reads++;
				lastOptions = options;
				const value = VSBuffer.fromString(text);
				return { resource, value, name: 'example.txt', mtime: 1, ctime: 1, etag: '1', size: size ?? value.byteLength, readonly: false, locked: false, executable: false };
			}
		}()));
		return { preview, reads: () => reads, options: () => lastOptions };
	}

	test('reads bounded text and reuses a preview of the same file', async () => {
		const { preview, reads, options } = createPreview('hello');
		const first = await preview.read(resource, CancellationToken.None);
		const second = await preview.read(resource, CancellationToken.None);
		assert.deepStrictEqual({ first, second, reads: reads(), length: options()?.length }, {
			first: { text: 'hello', truncated: false },
			second: { text: 'hello', truncated: false },
			reads: 1,
			length: 64 * 1024
		});
	});

	test('clearing previews requests fresh content', async () => {
		const { preview, reads } = createPreview('hello');
		await preview.read(resource, CancellationToken.None);
		preview.clear();
		await preview.read(resource, CancellationToken.None);
		assert.strictEqual(reads(), 2);
	});

	test('cancellation avoids a file read', async () => {
		const { preview, reads } = createPreview('hello');
		const cancellation = store.add(new CancellationTokenSource());
		cancellation.cancel();
		await assert.rejects(preview.read(resource, cancellation.token), isCancellationError);
		assert.strictEqual(reads(), 0);
	});

	test('marks partial content', async () => {
		const { preview } = createPreview('hello', 100000);
		assert.deepStrictEqual(await preview.read(resource, CancellationToken.None), { text: 'hello', truncated: true });
	});

	test('binary previews do not expose control characters', async () => {
		const { preview } = createPreview('binary\0payload');
		assert.strictEqual((await preview.read(resource, CancellationToken.None)).text.includes('\0'), false);
	});
});
