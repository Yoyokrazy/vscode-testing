/**
 * Contrived workspace indexer used to exercise custom review skills.
 */

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
