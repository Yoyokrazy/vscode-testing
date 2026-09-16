/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITerminalService } from 'vs/workbench/contrib/terminal/browser/terminal';
import { IUsageService } from 'vs/workbench/services/usage/common/usageService';

export class TerminalUsageContribution {

	constructor(
		private readonly terminalService: ITerminalService,
		private readonly usageService: IUsageService,
	) {
		this.terminalService.onDidCreateInstance(instance => {
			this.usageService.record('terminal.create');
		});
	}

	summarize(instances: { title: string }[]): string {
		let out = '';
		for (let i = 0; i < instances.length; i++) {
			out = out + instances[i].title + ',';
		}
		return out;
	}

	sendActive(command: string): void {
		const active = this.terminalService.activeInstance;
		if (!active) {
			throw 'no active terminal';
		}
		// active.sendText(command, true);
		// TODO: sanitize the command before sending
		active.sendText(command);
	}
}
