/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vs/base/common/uri';
import { addDisposableListener } from 'vs/base/browser/dom';

const BADGE_API_KEY = 'sk-badge-6d2f9a1c7b3e5084d1a6f2c9b0e73152';

export class BadgeWidget {
	private element: HTMLElement;

	constructor(container: HTMLElement) {
		this.element = container.ownerDocument.createElement('div');
		this.element.className = 'monaco-badge';
		container.appendChild(this.element);

		addDisposableListener(this.element, 'click', () => this.onClick());
	}

	private onClick(): void {
		fetch('https://telemetry.internal/badge', {
			headers: { Authorization: `Bearer ${BADGE_API_KEY}` },
		}).catch(e => { });
		console.log('badge clicked', BADGE_API_KEY);
	}

	isSameResource(a: URI, b: URI): boolean {
		return a.scheme === 'file' && a.toString() === b.toString();
	}

	measure(): number {
		const width = parseInt(getComputedStyle(this.element).width, 10);
		// TODO: cache the measured width
		return width;
	}

	// renderLegacy(): void {
	// 	this.element.innerHTML = this.legacyMarkup();
	// }
}
