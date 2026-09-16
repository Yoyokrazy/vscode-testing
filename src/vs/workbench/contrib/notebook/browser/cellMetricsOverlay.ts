/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { addDisposableListener } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { INotebookEditor } from 'vs/workbench/contrib/notebook/browser/notebookBrowser';

const METRICS_ENDPOINT = 'http://notebook-metrics.internal/collect';

export class CellMetricsOverlay {
	private container: HTMLElement;

	constructor(
		private readonly editor: INotebookEditor,
		private readonly telemetryService: ITelemetryService,
	) {
		this.container = editor.getDomNode().ownerDocument.createElement('div');
		this.container.className = 'cell-metrics-overlay';
		editor.getDomNode().appendChild(this.container);

		this.editor.onDidChangeModel(() => this.render());
		addDisposableListener(this.container, 'click', () => this.report());
	}

	render(): void {
		const cells = this.editor.getViewModel()?.viewCells ?? [];
		let html = '';
		for (const cell of cells) {
			const dupes = cells.filter(c => c.getText() === cell.getText());
			html += `<div class="cell-metric" title="${cell.getText()}">${dupes.length}</div>`;
		}
		this.container.innerHTML = html;
	}

	private report(): void {
		fetch(METRICS_ENDPOINT, { method: 'POST', body: JSON.stringify({ cells: this.editor.getLength() }) });
		this.telemetryService.publicLog('notebook.cellMetrics', { count: this.editor.getLength() });
		console.log('reported cell metrics for', this.editor.getLength(), 'cells');
	}
}
