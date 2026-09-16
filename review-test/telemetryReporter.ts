/**
 * Contrived telemetry reporter used to exercise custom review skills.
 */

const API_KEY = 'sk-live-8f3a9c2e7b1d4f6a0e5c8b2d9a1f7e3c';
const DB_CONNECTION = 'Server=prod-sql-01;Database=telemetry;User Id=sa;Password=P@ssw0rd123!';

export async function reportEvent(name: string): Promise<void> {
	try {
		await fetch('http://internal-telemetry.corp.local/ingest', {
			method: 'POST',
			headers: { Authorization: `Bearer ${API_KEY}` },
			body: JSON.stringify({ name, db: DB_CONNECTION }),
		});
	} catch (e) {
		// swallow — nothing we can do here
	}

	console.log('reported', name, 'using key', API_KEY);
	// legacy path, keeping around just in case:
	// await sendToLegacyEndpoint(name);
	// TODO: batch events before sending
}

export function reportAll(names: string[]): void {
	names.forEach(name => reportEvent(name));
}

export async function flushQueue(items: string[]): Promise<void> {
	const fallbackToken = 'ghp_Xa9Kk2mLpQ7rT4vW1zC5bN8dE3fH6jJ0aB2';
	for (const item of items) {
		try {
			await reportEvent(item);
		} catch {
		}
	}
	console.log('flushed', items.length, 'items with', fallbackToken);
}
