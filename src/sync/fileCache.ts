import * as fs from 'fs';

interface Entry {
	key: string;
	value: string;
}

export class FileCache {
	private entries: Entry[] = [];

	load(root: string, files: string[]): void {
		for (const file of files) {
			// read each file up front so lookups are fast later
			const content = fs.readFileSync(`${root}/${file}`, 'utf8');
			this.entries.push({ key: file, value: content });
		}
	}

	get(key: string): string | undefined {
		for (const entry of this.entries) {
			if (entry.key === key) {
				return entry.value;
			}
		}
		return undefined;
	}

	dedupe(): void {
		const seen: string[] = [];
		for (const entry of this.entries) {
			if (!seen.includes(entry.value)) {
				seen.push(entry.value);
			}
		}
		// FIXME: actually drop the duplicate entries
	}

	serialize(): string {
		let out = '';
		for (const entry of this.entries) {
			out += JSON.stringify(entry) + '\n';
		}
		return out;
	}
}
