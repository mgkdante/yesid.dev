/**
 * legal-pages fetcher — reads the `legal_pages` collection (OPS1 launch
 * Phase 1) and returns PUBLISHED rows only, ordered by `sort` (then id).
 *
 * Each row is one /legal/[slug] page: per-locale title + Block Editor body on
 * the translations rows. EN body is required (LocalizedBlockEditorDocSchema);
 * FR ships at OPS1, ES lands with the L1 Spanish pass.
 */

import { readItems } from '@directus/sdk';
import { LegalPageSchema, type LegalPage } from '@repo/shared';
import { toLocalizedFields } from '../locale';
import type { FetcherContext } from './types';

export interface DirectusLegalPageTranslation {
	languages_code: string;
	title?: string | null;
	body?: unknown;
}

export interface DirectusLegalPageRow {
	id: string;
	status?: string;
	sort?: number | null;
	translations?: DirectusLegalPageTranslation[];
}

/** Pure transform — DirectusLegalPageRow → LegalPage. Tested standalone. */
export function toLegalPage(raw: DirectusLegalPageRow): LegalPage {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	const body: Record<string, unknown> = {};
	for (const row of raw.translations ?? []) {
		if (row.body === null || row.body === undefined) continue;
		if (row.languages_code === 'en' || row.languages_code === 'fr' || row.languages_code === 'es') {
			body[row.languages_code] = row.body;
		}
	}
	return {
		slug: raw.id,
		...toLocalizedFields(tr, ['title']),
		body: body as LegalPage['body'],
	};
}

/** Fetch + validate all published legal pages, sort ascending (id tiebreak). */
export async function fetchLegalPages({ client }: FetcherContext): Promise<readonly LegalPage[]> {
	const rows = (await client.request(
		readItems('legal_pages', {
			fields: [
				'id',
				'status',
				'sort',
				{ translations: ['languages_code', 'title', 'body'] } as unknown as string,
			],
			filter: { status: { _eq: 'published' } },
			sort: ['sort', 'id'],
			limit: -1,
		}),
	)) as unknown as DirectusLegalPageRow[];
	return rows.map((row) => LegalPageSchema.parse(toLegalPage(row)));
}
