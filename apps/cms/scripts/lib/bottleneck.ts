/**
 * Bottleneck-backed rate limit wrapper for SDK calls (F13 script-side).
 *
 * Added in 18c Task 31. Wraps an async function so concurrent invocations
 * respect Directus's instance-level RATE_LIMITER_* + stay under connection
 * caps during bulk upserts (seed scripts + migrate-assets).
 *
 * Defaults:
 *   maxConcurrent = 5
 *   minTime (ms)  = 50   // ~20 req/s per instance
 *
 * Example:
 *   const limited = withRateLimit(async (id: string) => client.request(...));
 *   await Promise.all(ids.map(limited));
 *
 * Consumer side (apps/web) uses p-queue for the same purpose (F13 web-side);
 * scripts use bottleneck because it has better support for reservoir
 * patterns that long-running seed batches benefit from.
 */

import Bottleneck from 'bottleneck';

export interface RateLimitOptions {
	maxConcurrent?: number;
	minTime?: number;
}

export function withRateLimit<TArgs extends readonly unknown[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
	options: RateLimitOptions = {},
): (...args: TArgs) => Promise<TResult> {
	const limiter = new Bottleneck({
		maxConcurrent: options.maxConcurrent ?? 5,
		minTime: options.minTime ?? 50,
	});
	return (...args: TArgs) => limiter.schedule(() => fn(...args));
}
