/**
 * Timeout + retry wrapper around native fetch for CMS build scripts.
 *
 * This module owns the CMS request queue. It uses the package's existing
 * Bottleneck dependency for bounded concurrency and rate limiting.
 *
 * Inject as:
 *   createDirectus(url, { globals: { fetch: createQueuedFetch() } }).with(rest())
 *
 * Defaults:
 *   - 4 concurrent requests
 *   - 50 req / 1 s rolling window (under Directus's 50 pts / 1s server cap)
 *   - 8 s per-attempt timeout (Neon cold-start guard)
 *   - 3 retries, exponential backoff (250ms → 500ms → 1s), jittered
 *   - Retryable: 429, 500, 502, 503, 504
 *   - Non-retryable: 4xx other (our bug / schema mismatch)
 */

import Bottleneck from 'bottleneck';

export interface QueuedFetchOptions {
	// Concurrency + rate-limiting
	maxConcurrent?: number;
	/** Minimum ms between job starts (1000ms / intervalCap gives req/s). */
	minTime?: number;
	// Retry policy
	retries?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	timeoutMs?: number;
	retryableStatuses?: ReadonlyArray<number>;
	// Injection seams for testing
	fetch?: typeof fetch;
	sleep?: (ms: number) => Promise<void>;
}

const DEFAULTS = {
	maxConcurrent: 4,
	/** 1000ms / 20ms = 50 req/s — matches Directus RATE_LIMITER cap */
	minTime: 20,
	retries: 3,
	baseDelayMs: 250,
	maxDelayMs: 4000,
	timeoutMs: 8000,
	retryableStatuses: [429, 500, 502, 503, 504] as const,
};

/**
 * Factory that returns a fetch-compatible function with concurrency + retry.
 * Drop-in for the `fetch` slot in `createDirectus(url, { globals: { fetch } })`.
 */
export function createQueuedFetch(options: QueuedFetchOptions = {}): typeof fetch {
	const maxConcurrent = options.maxConcurrent ?? DEFAULTS.maxConcurrent;
	const minTime = options.minTime ?? DEFAULTS.minTime;
	const retries = options.retries ?? DEFAULTS.retries;
	const baseDelayMs = options.baseDelayMs ?? DEFAULTS.baseDelayMs;
	const maxDelayMs = options.maxDelayMs ?? DEFAULTS.maxDelayMs;
	const timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;
	const retryableStatuses = new Set(options.retryableStatuses ?? DEFAULTS.retryableStatuses);
	const upstreamFetch = options.fetch ?? globalThis.fetch;
	const sleep = options.sleep ?? defaultSleep;

	const limiter = new Bottleneck({ maxConcurrent, minTime });

	const queuedFetch: typeof fetch = (input, init) =>
		limiter.schedule(async (): Promise<Response> => {
			let attempt = 0;

			while (true) {
				try {
					const res = await fetchWithTimeout(upstreamFetch, input, init, timeoutMs);

					if (!retryableStatuses.has(res.status) || attempt >= retries) {
						return res;
					}

					const delay = retryAfterDelay(res, attempt, baseDelayMs, maxDelayMs);
					await sleep(delay);
				} catch (err: unknown) {
					if (attempt >= retries) throw err;
					await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs));
				}
				attempt++;
			}
		});

	return queuedFetch;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function backoffDelay(attempt: number, base: number, max: number): number {
	const exp = base * Math.pow(2, attempt);
	const jitter = Math.random() * base;
	return Math.min(max, exp + jitter);
}

function retryAfterDelay(res: Response, attempt: number, base: number, max: number): number {
	const header = res.headers.get('retry-after');
	if (header) {
		const seconds = Number(header);
		if (Number.isFinite(seconds) && seconds >= 0) {
			return Math.min(max, seconds * 1000);
		}
		const ms = Date.parse(header) - Date.now();
		if (Number.isFinite(ms) && ms > 0) {
			return Math.min(max, ms);
		}
	}
	return backoffDelay(attempt, base, max);
}

function defaultSleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
	upstreamFetch: typeof fetch,
	input: Parameters<typeof fetch>[0],
	init: Parameters<typeof fetch>[1],
	timeoutMs: number,
): Promise<Response> {
	if (timeoutMs <= 0) {
		return upstreamFetch(input, init);
	}

	const controller = new AbortController();
	const upstreamSignal = init?.signal;
	const timeout = setTimeout(() => {
		controller.abort(new DOMException('Directus fetch timed out', 'AbortError'));
	}, timeoutMs);

	const abortFromUpstream = () => {
		controller.abort(upstreamSignal?.reason);
	};

	try {
		if (upstreamSignal?.aborted) {
			abortFromUpstream();
		} else {
			upstreamSignal?.addEventListener('abort', abortFromUpstream, { once: true });
		}
		return await upstreamFetch(input, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
		upstreamSignal?.removeEventListener('abort', abortFromUpstream);
	}
}
