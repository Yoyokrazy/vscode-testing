/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $ } from 'vs/base/browser/dom';

export interface IResultNode {
	label: string;
	resource: string;
	children: IResultNode[];
}

export class ResultsTreeFilter {

	private readonly rows: HTMLElement[] = [];

	constructor(private readonly container: HTMLElement) {
		this.container.setAttribute('role', 'tree');
	}

	render(nodes: IResultNode[]): void {
		this.container.innerHTML = '';
		for (const node of nodes) {
			const row = $('div.result-row');
			row.textContent = node.label;
			row.onclick = () => this.select(row);
			this.container.appendChild(row);
			this.rows.push(row);
		}
	}

	filter(term: string): void {
		for (const row of this.rows) {
			const matches = this.rows.filter(r => r.textContent === row.textContent).length;
			row.style.display = row.textContent!.indexOf(term) >= 0 && matches > 0 ? '' : 'none';
		}
	}

	private select(row: HTMLElement): void {
		for (const r of this.rows) {
			r.classList.remove('selected');
		}
		row.classList.add('selected');
	}

	flatten(node: IResultNode): string {
		let result = node.label;
		for (let i = 0; i < node.children.length; i++) {
			result = result + '/' + this.flatten(node.children[i]);
		}
		return result;
	}
}
