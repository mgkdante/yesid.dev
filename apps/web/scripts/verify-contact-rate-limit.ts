#!/usr/bin/env bun
import { probeContactRateLimit } from '../src/lib/server/contact-rate-limit';

function valueAfter(flag: string): string | undefined {
	const index = process.argv.indexOf(flag);
	return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
	const baseUrl = valueAfter('--base-url');
	if (!baseUrl) throw new Error('usage: --base-url https://deployment.example [--requests 6]');
	const requestCount = Number(valueAfter('--requests') ?? '6');
	const result = await probeContactRateLimit({ baseUrl, requestCount, fetch: globalThis.fetch });
	console.log(`contact WAF probe statuses: ${result.statuses.join(', ')}`);
	if (!result.rateLimited) {
		throw new Error('no 429 observed; do not cut over the contact transport');
	}
	console.log('contact WAF rate limit verified; honeypot requests sent no email');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	});
}
