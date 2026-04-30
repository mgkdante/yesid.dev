// Rate-limit + retry wrapper around native fetch, used by the Directus adapter
// to harden content reads against transient 5xx + 429 throttling.
//
// Factored out of `directus.ts` so tests can inject scripted fetch + sleep
// without pulling SvelteKit env.
//
// F13 — consumer-side defense-in-depth (the Directus server has its own
// RATE_LIMITER_* since Railway deploy 14:36; this client layer smooths
// bursts from the SvelteKit `load()` fanout).
//
// Defaults tuned for a single-instance Directus on Railway Hobby:
//   - 4 concurrent requests (Node keep-alive works best < 10)
//   - 50 req / 1s rolling window (stays under the 50 pts / 1s server cap)
//   - 8s per-attempt timeout so a hung upstream read cannot pin a warm
//     serverless instance's queue slots forever
//   - 3 retries with exponential backoff (250ms → 500ms → 1s → 2s, jittered)
//   - Retryable: 429, 500, 502, 503, 504 (transient by spec)
//   - Non-retryable: 400/401/403/404 (our bug or schema mismatch — retrying
//     would just amplify the error)
//
// Retry-After (seconds or HTTP-date) on 429/503 is honored and clamped to
// `maxDelayMs`.

import PQueue from 'p-queue';

export interface QueuedFetchOptions {
	// Concurrency + rate-limiting (forwarded to PQueue)
	concurrency?: number;
	intervalCap?: number;
	interval?: number;
	// Retry policy
	retries?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	timeoutMs?: number;
	retryableStatuses?: ReadonlyArray<number>;
	// Injection seams (testing)
	fetch?: typeof fetch;
	sleep?: (ms: number) => Promise<void>;
}

const DEFAULTS = {
	concurrency: 4,
	intervalCap: 50,
	interval: 1000,
	retries: 3,
	baseDelayMs: 250,
	maxDelayMs: 4000,
	timeoutMs: 8000,
	retryableStatuses: [429, 500, 502, 503, 504] as const,
};

/**
 * Factory that returns a fetch-compatible function with concurrency + retry.
 * The returned function is a drop-in replacement for `fetch` inside
 * `createDirectus<Schema>(url, { globals: { fetch: queuedFetch } })`.
 */
export function createQueuedFetch(options: QueuedFetchOptions = {}): typeof fetch {
	const concurrency = options.concurrency ?? DEFAULTS.concurrency;
	const intervalCap = options.intervalCap ?? DEFAULTS.intervalCap;
	const interval = options.interval ?? DEFAULTS.interval;
	const retries = options.retries ?? DEFAULTS.retries;
	const baseDelayMs = options.baseDelayMs ?? DEFAULTS.baseDelayMs;
	const maxDelayMs = options.maxDelayMs ?? DEFAULTS.maxDelayMs;
	const timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;
	const retryableStatuses = new Set(options.retryableStatuses ?? DEFAULTS.retryableStatuses);
	const upstreamFetch = options.fetch ?? globalThis.fetch;
	const sleep = options.sleep ?? defaultSleep;

	const queue = new PQueue({ concurrency, intervalCap, interval });

	const queuedFetch: typeof fetch = async (input, init) => {
		const task = async (): Promise<Response> => {
			let attempt = 0;
			let lastError: unknown;

			while (true) {
				try {
					const res = await fetchWithTimeout(upstreamFetch, input, init, timeoutMs);

					// Non-retryable status OR retry budget exhausted → return as-is
					if (!retryableStatuses.has(res.status) || attempt >= retries) {
						return res;
					}

					// Retryable status within budget → sleep then retry
					const delay = retryAfterDelay(res, attempt, baseDelayMs, maxDelayMs);
					await sleep(delay);
				} catch (err: unknown) {
					lastError = err;
					if (attempt >= retries) {
						throw err;
					}
					await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs));
				}
				attempt++;
			}
		};

		// PQueue.add can return TaskType | void (the void is for signal-cancel).
		// We never pass a signal, so a cast is safe. If cancel is ever wired in,
		// add a guard here.
		return (await queue.add(task)) as Response;
	};

	return queuedFetch;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function backoffDelay(attempt: number, base: number, max: number): number {
	// Exponential backoff: base * 2^attempt + uniform jitter up to `base`.
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
