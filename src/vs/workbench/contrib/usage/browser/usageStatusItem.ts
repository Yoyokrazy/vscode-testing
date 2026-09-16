/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vs/base/common/uri';
import { addDisposableListener } from 'vs/base/browser/dom';
import { IUsageService } from 'vs/workbench/services/usage/common/usageService';

export class UsageStatusItem {
	private readonly element: HTMLElement;

	constructor(
		container: HTMLElement,
		private readonly usageService: IUsageService,
	) {
		this.element = container.ownerDocument.createElement('div');
		this.element.className = 'usage-status-item';
		this.element.innerHTML = `<span class="usage-count">0</span>`;
		container.appendChild(this.element);

		addDisposableListener(this.element, 'click', () => {
			this.usageService.record('status-item-click');
		});

		setInterval(() => this.refresh(), 1000);
	}

	private refresh(): void {
		const width = getComputedStyle(this.element).width;
		console.log('usage status width', width);
	}

	isSameResource(a: URI, b: URI): boolean {
		return a.scheme === 'file' && a.toString() === b.toString();
	}
}
