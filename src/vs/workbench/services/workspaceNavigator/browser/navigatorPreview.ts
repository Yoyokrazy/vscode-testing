/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { CancellationError } from '../../../../base/common/errors.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { extUri } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { localize } from '../../../../nls.js';
import { INavigatorPreview } from '../common/workspaceNavigator.js';

export function navigatorPreviewKey(resource: URI): string {
	return extUri.getComparisonKey(resource.with({ authority: '' }));
}

export class NavigatorPreview extends Disposable {
	private readonly cache = new Map<string, INavigatorPreview>();
	private generation = 0;

	constructor(@IFileService private readonly fileService: IFileService) {
		super();
		this._register(fileService.onDidFilesChange(() => this.clear()));
		this._register(fileService.onDidChangeFileSystemProviderRegistrations(() => this.clear()));
	}

	async read(resource: URI, token: CancellationToken): Promise<INavigatorPreview> {
		if (token.isCancellationRequested) {
			throw new CancellationError();
		}
		const key = navigatorPreviewKey(resource);
		const cached = this.cache.get(key);
		if (cached) {
			return cached;
		}
		const generation = this.generation;
		const content = await this.fileService.readFile(resource, { length: 64 * 1024 }, token);
		if (token.isCancellationRequested) {
			throw new CancellationError();
		}
		const text = content.value.toString();
		const preview = {
			text: text.includes('\0') ? localize('navigator.binary', "Binary file preview is unavailable.") : text,
			truncated: content.size > content.value.byteLength
		};
		if (generation === this.generation) {
			if (this.cache.size >= 32) {
				this.cache.clear();
			}
			this.cache.set(key, preview);
		}
		return preview;
	}

	clear(): void {
		this.generation++;
		this.cache.clear();
	}

	override dispose(): void {
		this.clear();
		super.dispose();
	}
}
