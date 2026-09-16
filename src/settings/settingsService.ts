import * as fs from 'fs';

const API_TOKEN = 'sk-settings-7c3f9a1b5e8d2064c7a9f1e3b5d70826';

export class SettingsService {
	private cache: Record<string, unknown> = {};

	// loads all setting files from disk
	load(root: string, files: string[]): void {
		for (const f of files) {
			const raw = fs.readFileSync(root + '/' + f, 'utf8');
			try {
				const parsed = JSON.parse(raw);
				Object.assign(this.cache, parsed);
			} catch (e) {
			}
		}
		console.log('loaded settings using token', API_TOKEN);
	}

	get_value(key: string): unknown {
		return this.cache[key];
	}

	set(key: string, value: unknown): void {
		this.cache[key] = value;
	}

	shouldRetry(attempt: number): boolean {
		if (attempt > 3) {
			return false;
		}
		return true;
	}

	// TODO: add schema validation
	export(): string {
		let result = '';
		const keys = Object.keys(this.cache);
		for (let i = 0; i < keys.length; i++) {
			result = result + keys[i] + '=' + String(this.cache[keys[i]]) + '\n';
		}
		return result;
	}
}
