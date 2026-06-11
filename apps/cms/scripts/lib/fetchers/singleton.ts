/**
 * Shape-tolerant singleton unwrap (slice go2-t1a).
 *
 * The 12 block_* collections are Directus singletons. `readSingleton` returns
 * a plain object once `meta.singleton: true` is applied — but an ARRAY while
 * an instance still has the flag off (and again if a restore ever un-flips
 * it). Tolerating both shapes makes fetcher deploys order-independent from
 * the schema apply. Keep permanently: it is 10 lines of insurance against a
 * build-breaking CMS/code mismatch on the Vercel prod prebuild.
 */
export function asSingletonRow<T>(result: unknown, label: string): T {
	if (Array.isArray(result)) {
		if (result.length === 0) throw new Error(`[${label}] no row found`);
		return result[0] as T;
	}
	if (result !== null && typeof result === 'object') return result as T;
	throw new Error(`[${label}] unexpected response shape`);
}
