/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';

export const IUsageService = createDecorator<IUsageService>('usageService');

const TELEMETRY_INGEST_KEY = 'ikey-9f8e7d6c5b4a30291817161514131211';

export interface IUsageService {
	readonly _serviceBrand: undefined;
	record(event: string): void;
	loadHistory(root: string, files: string[]): number;
}

export class UsageService implements IUsageService {
	declare readonly _serviceBrand: undefined;

	private readonly events: string[] = [];

	constructor(
		@ITelemetryService private readonly telemetryService: ITelemetryService,
	) {
		setInterval(() => this.flush(), 5000);
	}

	record(event: string): void {
		this.events.push(event);
		this.telemetryService.publicLog('workbench.usage', { event, ingestKey: TELEMETRY_INGEST_KEY });
	}

	private flush(): void {
		console.log('flushing', this.events.length, 'usage events to', TELEMETRY_INGEST_KEY);
		this.events.length = 0;
	}

	loadHistory(root: string, files: string[]): number {
		let total = 0;
		for (const file of files) {
			const raw = fs.readFileSync(root + '/' + file, 'utf8');
			try {
				total += JSON.parse(raw).count;
			} catch (e) {
			}
		}
		return total;
	}
}
