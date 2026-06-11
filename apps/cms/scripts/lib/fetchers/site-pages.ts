/**
 * site-pages fetcher — reads the `site_pages` registry collection (slice-26.1)
 * and returns PUBLISHED rows only, ordered by `sort` (then `path` tiebreak so
 * output stays deterministic when sorts collide).
 *
 * The emitted module (apps/web/src/lib/content/site-pages.ts) is the
 * enforcement point of the cascade contract: a row's absence from the array
 * IS the hidden signal — the route gate 404s, the sitemap drops the path, and
 * the nav fetcher (lib/fetchers/nav.ts) hides any link pointing at it.
 * Archiving a row in Directus fires the rebuild Flow, so the static export
 * picks the change up automatically.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { SitePageSchema, type SitePage } from '@repo/shared';
import { toLocalizedString } from '../locale';
import type { FetcherContext } from './types';

export interface DirectusSitePageTranslation {
	languages_code: string;
	title?: string | null;
}

export interface DirectusSitePageRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	path: string;
	type: 'freeform' | 'listing' | 'system';
	sort?: number | null;
	translations?: DirectusSitePageTranslation[];
}

/** Pure transform — DirectusSitePageRow → SitePage. Tested standalone. */
export function toSitePage(raw: DirectusSitePageRow): SitePage {
	const tr = (raw.translations ?? []) as ReadonlyArray<{ languages_code: string }>;
	return {
		path: raw.path,
		type: raw.type,
		title: toLocalizedString(tr, 'title'),
	};
}

/**
 * Pure ordering helper — `sort` ascending (nulls last), `path` tiebreak.
 * Keeps the emitted array byte-stable across runs even if the CMS returns
 * rows in a different order or with duplicate/missing sort values.
 */
export function orderSitePageRows(rows: readonly DirectusSitePageRow[]): DirectusSitePageRow[] {
	return [...rows].sort((a, b) => {
		const sa = a.sort ?? Number.MAX_SAFE_INTEGER;
		const sb = b.sort ?? Number.MAX_SAFE_INTEGER;
		if (sa !== sb) return sa - sb;
		return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
	});
}

/** Fetch + validate all published site_pages rows. Archived rows never leave the CMS. */
export async function fetchSitePages({ client }: FetcherContext): Promise<readonly SitePage[]> {
	const rows = (await client.request(
		readItems('site_pages', {
			filter: {
				status: { _eq: 'published' },
			} as unknown as Record<string, unknown>,
			fields: ['id', 'status', 'path', 'type', 'sort', 'translations.*'] as unknown as (keyof DirectusSitePageRow)[],
			sort: ['sort'],
			limit: -1,
		}),
	)) as unknown as DirectusSitePageRow[];

	if (rows.length === 0) {
		throw new Error(
			'[fetchSitePages] no published site_pages rows found — an empty registry would 404 the entire site. Seed/publish at least the / row.',
		);
	}

	return z.array(SitePageSchema).parse(orderSitePageRows(rows).map(toSitePage));
}
