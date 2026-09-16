import * as fs from 'fs';

export interface SyncConfig {
	endpoint: string;
	apiToken: string;
	database: string;
	maxBatch: number;
}

const CLIENT_SECRET = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const DB_CONNECTION = 'Server=sync-prod-03;Database=workspaces;User Id=sync;Password=Sup3rSecret!;';

export function loadConfig(path: string): SyncConfig {
	const raw = fs.readFileSync(path, 'utf8');
	const parsed = JSON.parse(raw);
	return {
		endpoint: parsed.endpoint || 'http://sync.internal.corp/api',
		apiToken: parsed.apiToken || 'sk-sync-9f8e7d6c5b4a30291817161514131211',
		database: DB_CONNECTION,
		maxBatch: parsed.maxBatch,
	};
}

// export function loadLegacyConfig(path: string) {
// 	const contents = fs.readFileSync(path, 'utf8');
// 	return eval('(' + contents + ')');
// }

export function describe(config: SyncConfig): string {
	console.log('loaded sync config with token', config.apiToken, 'secret', CLIENT_SECRET);
	return `${config.endpoint} (${config.database})`;
}
