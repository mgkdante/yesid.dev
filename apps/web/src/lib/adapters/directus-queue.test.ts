// Unit tests for createQueuedFetch — the rate-limit + retry wrapper around
// native fetch that the Directus adapter uses to harden reads against 429s and
// transient 5xx errors.
//
// Tests inject a synthetic sleep() so retry backoff doesn't make them slow.

import { describe, it, expect, vi } from 'vitest';
import { createQueuedFetch } from './directus-queue';

// ---------------------------------------------------------------------------
// Helpers — build scripted fetch mocks
// ---------------------------------------------------------------------------

/**
 * Returns a fetch-compatible mock whose nth call resolves to responses[n].
 * A scripted response can be either a Response-like object or an Error to reject with.
 */
function scriptedFetch(responses: Array<ResponseInit & { body?: string } | Error>) {
	let call = 0;
	const fn = vi.fn(async () => {
		const step = responses[call++];
		if (step instanceof Error) throw step;
		if (!step) throw new Error(`scriptedFetch: no response for call #${call}`);
		const { body = '', ...init } = step;
		return new Response(body, init);
	});
	return fn;
}

// A no-op sleep so retry delays don't make the test slow.
// Typed so sleep.mock.calls[n][0] narrows to number rather than never.
const sleepSignature = (_ms: number): Promise<void> => Promise.resolve();
const immediateSleep = vi.fn<typeof sleepSignature>(async () => {});

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

describe('createQueuedFetch', () => {
	it('passes the first response through on success without retrying', async () => {
		const upstream = scriptedFetch([{ status: 200, body: 'ok' }]);
		const fetch = createQueuedFetch({ fetch: upstream, sleep: immediateSleep });

		const res = await fetch('https://cms.example.com/items/services');

		expect(res.status).toBe(200);
		expect(await res.text()).toBe('ok');
		expect(upstream).toHaveBeenCalledTimes(1);
	});

	it('retries a 500 and returns the first 2xx', async () => {
		const upstream = scriptedFetch([
			{ status: 500, body: 'boom' },
			{ status: 502, body: 'bad gateway' },
			{ status: 200, body: 'ok' },
		]);
		const fetch = createQueuedFetch({
			fetch: upstream,
			sleep: immediateSleep,
			retries: 3,
		});

		const res = await fetch('https://cms.example.com/items/services');

		expect(res.status).toBe(200);
		expect(upstream).toHaveBeenCalledTimes(3);
	});

	it('retries 503 + 504 up to the retry cap, then returns the final 5xx', async () => {
		const upstream = scriptedFetch([
			{ status: 503, body: 'unavail-1' },
			{ status: 503, body: 'unavail-2' },
			{ status: 504, body: 'unavail-3' },
			{ status: 504, body: 'unavail-4' },
		]);
		const fetch = createQueuedFetch({
			fetch: upstream,
			sleep: immediateSleep,
			retries: 3, // 1 initial + 3 retries = 4 calls
		});

		const res = await fetch('https://cms.example.com/items/services');

		expect(res.status).toBe(504);
		expect(await res.text()).toBe('unavail-4');
		expect(upstream).toHaveBeenCalledTimes(4);
	});

	it('does NOT retry 4xx responses (400/401/403/404) — they pass through immediately', async () => {
		for (const status of [400, 401, 403, 404]) {
			const upstream = scriptedFetch([{ status, body: `${status}` }]);
			const fetch = createQueuedFetch({ fetch: upstream, sleep: immediateSleep, retries: 3 });

			const res = await fetch('https://cms.example.com/items/services');

			expect(res.status).toBe(status);
			expect(upstream).toHaveBeenCalledTimes(1);
		}
	});

	it('retries 429 like other retryable statuses', async () => {
		const upstream = scriptedFetch([
			{ status: 429, body: 'slow down' },
			{ status: 200, body: 'ok' },
		]);
		const fetch = createQueuedFetch({ fetch: upstream, sleep: immediateSleep, retries: 2 });

		const res = await fetch('https://cms.example.com/items/services');

		expect(res.status).toBe(200);
		expect(upstream).toHaveBeenCalledTimes(2);
	});

	it('honors Retry-After (seconds) on 429 — sleeps at least that long before retrying', async () => {
		const sleep = vi.fn<typeof sleepSignature>(async () => {});
		const upstream = scriptedFetch([
			{ status: 429, headers: { 'retry-after': '2' }, body: 'slow' },
			{ status: 200, body: 'ok' },
		]);
		const fetch = createQueuedFetch({ fetch: upstream, sleep, retries: 1 });

		const res = await fetch('https://cms.example.com/items/services');

		expect(res.status).toBe(200);
		// At least one sleep call with >= 2000ms (the Retry-After value in ms)
		expect(sleep).toHaveBeenCalled();
		const longestSleep = Math.max(...sleep.mock.calls.map((c) => c[0]));
		expect(longestSleep).toBeGreaterThanOrEqual(2000);
	});

	it('retries network errors (fetch reject) up to the retry cap', async () => {
		const upstream = scriptedFetch([
			new TypeError('fetch failed'),
			new TypeError('fetch failed'),
			{ status: 200, body: 'ok' },
		]);
		const fetch = createQueuedFetch({ fetch: upstream, sleep: immediateSleep, retries: 3 });

		const res = await fetch('https://cms.example.com/items/services');

		expect(res.status).toBe(200);
		expect(upstream).toHaveBeenCalledTimes(3);
	});

	it('rethrows the last network error when retries are exhausted', async () => {
		const upstream = scriptedFetch([
			new TypeError('fetch failed 1'),
			new TypeError('fetch failed 2'),
			new TypeError('fetch failed 3'),
			new TypeError('fetch failed 4'),
		]);
		const fetch = createQueuedFetch({ fetch: upstream, sleep: immediateSleep, retries: 3 });

		await expect(fetch('https://cms.example.com/items/services')).rejects.toThrow('fetch failed 4');
		expect(upstream).toHaveBeenCalledTimes(4);
	});

	it('times out a hung upstream fetch and releases the queue slot', async () => {
		const upstream = vi.fn((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
			if (String(input).endsWith('/b')) {
				return Promise.resolve(new Response('ok', { status: 200 }));
			}

			return new Promise<Response>((_resolve, reject) => {
				const signal = init?.signal;
				const rejectAbort = () => {
					reject(signal?.reason ?? new DOMException('aborted', 'AbortError'));
				};
				if (signal?.aborted) {
					rejectAbort();
					return;
				}
				signal?.addEventListener('abort', rejectAbort, { once: true });
			});
		});
		const fetch = createQueuedFetch({
			fetch: upstream as unknown as typeof globalThis.fetch,
			sleep: immediateSleep,
			retries: 0,
			timeoutMs: 5,
			concurrency: 1,
		});

		const first = fetch('https://cms.example.com/a').catch((error: unknown) => error);
		const second = await fetch('https://cms.example.com/b');
		const firstError = await first;

		expect(second.status).toBe(200);
		expect(await second.text()).toBe('ok');
		expect(firstError).toBeInstanceOf(DOMException);
		expect((firstError as DOMException).name).toBe('AbortError');
		expect(upstream).toHaveBeenCalledTimes(2);
	});

	it('enforces concurrency cap — with concurrency=1, call B waits for call A', async () => {
		let activeCount = 0;
		let maxActive = 0;
		const upstream = vi.fn(async () => {
			activeCount++;
			maxActive = Math.max(maxActive, activeCount);
			// Yield to the event loop so a naive non-queue would overlap.
			await new Promise((r) => setTimeout(r, 5));
			activeCount--;
			return new Response('ok', { status: 200 });
		});

		const fetch = createQueuedFetch({
			fetch: upstream,
			sleep: immediateSleep,
			concurrency: 1,
		});

		await Promise.all([
			fetch('https://cms.example.com/a'),
			fetch('https://cms.example.com/b'),
			fetch('https://cms.example.com/c'),
		]);

		expect(maxActive).toBe(1);
		expect(upstream).toHaveBeenCalledTimes(3);
	});

	it('allows parallelism up to the concurrency cap', async () => {
		let activeCount = 0;
		let maxActive = 0;
		const upstream = vi.fn(async () => {
			activeCount++;
			maxActive = Math.max(maxActive, activeCount);
			await new Promise((r) => setTimeout(r, 5));
			activeCount--;
			return new Response('ok', { status: 200 });
		});

		const fetch = createQueuedFetch({ fetch: upstream, sleep: immediateSleep, concurrency: 3 });

		await Promise.all([
			fetch('https://cms.example.com/a'),
			fetch('https://cms.example.com/b'),
			fetch('https://cms.example.com/c'),
			fetch('https://cms.example.com/d'),
			fetch('https://cms.example.com/e'),
		]);

		expect(maxActive).toBeLessThanOrEqual(3);
		expect(maxActive).toBeGreaterThan(1); // at least some parallelism
	});

	it('uses exponential backoff between retries (delays grow)', async () => {
		const sleep = vi.fn<typeof sleepSignature>(async () => {});
		const upstream = scriptedFetch([
			{ status: 503 },
			{ status: 503 },
			{ status: 503 },
			{ status: 200, body: 'ok' },
		]);
		const fetch = createQueuedFetch({
			fetch: upstream,
			sleep,
			retries: 3,
			baseDelayMs: 100,
			maxDelayMs: 10_000,
		});

		await fetch('https://cms.example.com/items/services');

		const delays = sleep.mock.calls.map((c) => c[0]);
		expect(delays.length).toBeGreaterThanOrEqual(3);
		// Expect growth: second wait >= first wait (allow jitter slop)
		expect(delays[1]).toBeGreaterThanOrEqual(delays[0] / 2);
		expect(delays[2]).toBeGreaterThanOrEqual(delays[0] / 2);
	});
});
