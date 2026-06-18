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

import { readSingleton } from '@directus/sdk';
import type { CmsClient } from './types';

/**
 * Default raw shape returned by a `block_*` singleton read: a numeric `id`, the
 * optional per-locale `translations` array, and arbitrary flat columns the
 * per-block transform pulls by name. Most home/medium block fetchers declare an
 * identical local `interface BlockRow`; this is the shared export.
 *
 * Fetchers whose row shape is narrower (e.g. the typed BlogPageRow /
 * ProjectsPageRow in page-blocks-simple) pass their own `T` to
 * {@link fetchBlockSingleton} instead.
 */
export interface BlockRow {
	id: number;
	translations?: ReadonlyArray<Record<string, unknown>>;
	[key: string]: unknown;
}

/**
 * Fetch one `block_*` singleton and unwrap it shape-tolerantly. Wraps the
 * `client.request(readSingleton(collection, { fields }))` + `asSingletonRow<T>`
 * dance every singleton fetcher repeats, with the `unknown` cast localized here.
 *
 * Behavior is identical to the inline code: the request casts through `unknown`
 * before {@link asSingletonRow}, so a pre-flip array OR a post-flip object both
 * resolve. `fields` defaults to `['*', { translations: ['*'] }]` — the shape
 * the home/medium/about fetchers use — but callers needing a narrower
 * projection (page-blocks-simple, site-labels) pass their own `fields`.
 *
 * @param label the `fetchX/collection` string asSingletonRow puts in errors.
 */
export async function fetchBlockSingleton<T = BlockRow>(
	client: CmsClient,
	collection: string,
	label: string,
	fields: unknown[] = ['*', { translations: ['*'] }],
): Promise<T> {
	const result = await client.request(
		readSingleton(collection as never, { fields: fields as never }),
	);
	return asSingletonRow<T>(result, label);
}
