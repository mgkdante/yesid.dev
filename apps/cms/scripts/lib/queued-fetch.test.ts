/**
 * Network-free tests for the CMS queued-fetch utility.
 * All network calls are replaced with scripted fakes injected via options.
 */
import { describe, it, expect } from 'bun:test';
import { createQueuedFetch } from './queued-fetch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(status: number, body = ''): Response {
	return new Response(body, { status });
}

function neverSleep(_ms: number): Promise<void> {
	return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Basic fetch passthrough
// ---------------------------------------------------------------------------

describe('createQueuedFetch', () => {
	it('returns a 200 response from the upstream fetch', async () => {
		const fake = async () => makeResponse(200, 'ok');
		const fetcher = createQueuedFetch({ fetch: fake as typeof fetch, sleep: neverSleep });
		const res = await fetcher('http://localhost/test');
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('ok');
	});

	it('passes through non-retryable 4xx without retrying', async () => {
		let calls = 0;
		const fake = async () => {
			calls++;
			return makeResponse(404);
		};
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: neverSleep,
			retries: 3,
		});
		const res = await fetcher('http://localhost/missing');
		expect(res.status).toBe(404);
		expect(calls).toBe(1); // no retries for 404
	});

	// ---------------------------------------------------------------------------
	// Retry on 5xx
	// ---------------------------------------------------------------------------

	it('retries on 500 and returns success on second attempt', async () => {
		let calls = 0;
		const fake = async () => {
			calls++;
			return calls === 1 ? makeResponse(500) : makeResponse(200, 'recovered');
		};
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: neverSleep,
			retries: 3,
		});
		const res = await fetcher('http://localhost/unstable');
		expect(res.status).toBe(200);
		expect(calls).toBe(2);
	});

	it('retries on 429 up to retries limit then returns 429', async () => {
		let calls = 0;
		const fake = async () => {
			calls++;
			return makeResponse(429);
		};
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: neverSleep,
			retries: 2,
		});
		const res = await fetcher('http://localhost/throttled');
		expect(res.status).toBe(429);
		// initial attempt + 2 retries = 3 total
		expect(calls).toBe(3);
	});

	// ---------------------------------------------------------------------------
	// Retry-After header
	// ---------------------------------------------------------------------------

	it('honors numeric Retry-After header (seconds)', async () => {
		const delays: number[] = [];
		let calls = 0;
		const fake = async () => {
			calls++;
			if (calls === 1) {
				return new Response('', {
					status: 429,
					headers: { 'retry-after': '2' },
				});
			}
			return makeResponse(200);
		};
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: async (ms) => {
				delays.push(ms);
			},
			retries: 3,
			maxDelayMs: 5000,
		});
		await fetcher('http://localhost/rate-limited');
		expect(delays.length).toBeGreaterThanOrEqual(1);
		// 2 seconds → 2000ms clamped by maxDelayMs=5000
		expect(delays[0]).toBe(2000);
	});

	// ---------------------------------------------------------------------------
	// Network error retries
	// ---------------------------------------------------------------------------

	it('retries on thrown network errors and eventually throws if exhausted', async () => {
		let calls = 0;
		const fake = async () => {
			calls++;
			throw new Error(`network error attempt ${calls}`);
		};
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: neverSleep,
			retries: 2,
		});
		await expect(fetcher('http://localhost/flaky')).rejects.toThrow(/network error attempt 3/);
		expect(calls).toBe(3); // initial + 2 retries
	});

	it('recovers from a network error on second attempt', async () => {
		let calls = 0;
		const fake = async () => {
			calls++;
			if (calls === 1) throw new Error('transient failure');
			return makeResponse(200, 'fixed');
		};
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: neverSleep,
			retries: 3,
		});
		const res = await fetcher('http://localhost/maybe');
		expect(res.status).toBe(200);
		expect(calls).toBe(2);
	});

	// ---------------------------------------------------------------------------
	// Timeout
	// ---------------------------------------------------------------------------

	it('aborts the fetch after timeoutMs', async () => {
		const fake = (_input: unknown, init?: RequestInit) =>
			new Promise<Response>((_, reject) => {
				// Simulate a slow upstream that never resolves — abort signal fires timeout
				const sig = init?.signal as AbortSignal | undefined;
				if (sig) {
					sig.addEventListener('abort', () => reject(sig.reason ?? new Error('aborted')));
				}
			});
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: neverSleep,
			timeoutMs: 50,
			retries: 0,
		});
		await expect(fetcher('http://localhost/slow')).rejects.toThrow();
	});

	it('passes through when timeoutMs=0 (disabled)', async () => {
		const fake = async () => makeResponse(200, 'notimeout');
		const fetcher = createQueuedFetch({
			fetch: fake as typeof fetch,
			sleep: neverSleep,
			timeoutMs: 0,
			retries: 0,
		});
		const res = await fetcher('http://localhost/fast');
		expect(res.status).toBe(200);
	});
});
