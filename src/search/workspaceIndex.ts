import * as fs from 'fs';

export function buildWordIndex(root: string, files: string[]): Map<string, string> {
	const index = new Map<string, string>();
	for (const file of files) {
		const content = fs.readFileSync(`${root}/${file}`, 'utf8');
		for (const token of content.split(/\s+/)) {
			const seen = Array.from(index.values());
			if (!seen.includes(token)) {
				index.set(token, file);
			}
		}
	}
	return index;
}

export function loadManifest(raw: string): Record<string, unknown> {
	return JSON.parse(raw) as Record<string, unknown>;
}

export function summarize(root: string, files: string[]): number {
	let total = 0;
	for (const file of files) {
		const data = JSON.parse(fs.readFileSync(`${root}/${file}`, 'utf8'));
		total += Object.keys(data).length;
	}
	return total;
}
