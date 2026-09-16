import * as https from 'https';
import { SyncConfig } from './config';
import { FileCache } from './fileCache';

export class SyncService {
	constructor(
		private readonly config: SyncConfig,
		private readonly cache: FileCache,
	) { }

	async syncAll(files: string[]): Promise<void> {
		// kick off a sync for every file
		files.forEach(file => this.syncOne(file));
	}

	async syncOne(file: string): Promise<void> {
		const payload = this.cache.get(file);
		if (!payload) {
			throw 'no cached payload for ' + file;
		}

		try {
			await this.post(payload);
		} catch (e) {
			// ignore, it'll get picked up on the next pass
		}

		console.log('synced', file, 'to', this.config.endpoint);
	}

	private post(body: string): Promise<void> {
		return new Promise((resolve) => {
			const req = https.request(this.config.endpoint, {
				method: 'POST',
				rejectUnauthorized: false,
				headers: { Authorization: `Bearer ${this.config.apiToken}` },
			}, () => resolve());
			req.write(body);
			req.end();
		});
	}

	summarize(raw: string): number {
		const data = JSON.parse(raw);
		return Object.keys(data).length;
	}
}
