export interface ContactRateLimitProbeOptions {
	baseUrl: string;
	requestCount: number;
	timeoutMs?: number;
	fetch: typeof globalThis.fetch;
}

export interface ContactRateLimitProbeResult {
	statuses: number[];
	rateLimited: boolean;
}

function contactEndpoint(baseUrl: string): { endpoint: string; origin: string } {
	const url = new URL(baseUrl);
	if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
		throw new Error('contact rate-limit probes require HTTPS or localhost');
	}
	if (url.pathname !== '/' || url.search || url.hash) {
		throw new Error('base URL must contain only an origin');
	}
	return { endpoint: new URL('/api/contact', url).href, origin: url.origin };
}

export async function probeContactRateLimit(
	options: ContactRateLimitProbeOptions,
): Promise<ContactRateLimitProbeResult> {
	if (!Number.isInteger(options.requestCount) || options.requestCount < 2) {
		throw new Error('request count must be an integer of at least 2');
	}
	if (options.requestCount > 20) {
		throw new Error('request count must be at most 20');
	}
	const timeoutMs = options.timeoutMs ?? 5_000;
	if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 10_000) {
		throw new Error('timeout must be greater than 0 and at most 10000ms');
	}

	const { endpoint, origin } = contactEndpoint(options.baseUrl);
	const statuses: number[] = [];
	for (let index = 0; index < options.requestCount; index += 1) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		let response: Response;
		try {
			response = await options.fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Origin: origin,
				},
				body: JSON.stringify({
					name: 'WAF verification probe',
					email: 'waf-probe@example.invalid',
					message: 'This honeypot request must never send email.',
					website: 'waf-probe.invalid',
				}),
				redirect: 'manual',
				signal: controller.signal,
			});
		} finally {
			clearTimeout(timeout);
		}
		statuses.push(response.status);
		if (response.status === 429) break;
	}

	const rateLimited =
		statuses.length >= 2 &&
		statuses.at(-1) === 429 &&
		statuses.slice(0, -1).every((status) => status === 200);
	return { statuses, rateLimited };
}
