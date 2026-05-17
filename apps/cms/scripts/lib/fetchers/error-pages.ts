/**
 * error-pages fetcher — reads the `error_pages` flat collection and returns
 * the generic fallback row (status_code=0). This becomes `errorPageContent` in
 * the emitted nav.ts (matches today's single-fallback static export).
 *
 * Per-status-code variants stay runtime-only via the adapter port
 * (`content.errorPage(statusCode)`) — fallback is enough for the build-time
 * snapshot.
 *
 * Mirrors transformErrorPage at apps/web/src/lib/adapters/directus.ts:1955.
 */

import { readItems } from '@directus/sdk';
import { toLocalizedString } from '../locale';
import {
	ErrorPageContentSchema,
	type ErrorPageContent,
} from '../schemas/nav';
import type { LocalizedString } from '../schemas/shared';
import type { FetcherContext } from './types';

export interface DirectusErrorPageTranslation {
	languages_code: string;
	label?: string | null;
	heading?: string | null;
	description?: string | null;
	terminal_line?: string | null;
	suggestions?: Array<{ label: string; href: string }> | null;
}

export interface DirectusErrorPageRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	status_code: number;
	sort?: number | null;
	translations?: DirectusErrorPageTranslation[];
}

/** Pure transform — DirectusErrorPageRow → ErrorPageContent. Tested standalone. */
export function toErrorPageContent(raw: DirectusErrorPageRow): ErrorPageContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<{ languages_code: string }>;

	// terminalLine is en-only per ErrorPageContent interface — extract the .en string.
	const terminalLineLS = toLocalizedString(tr, 'terminal_line');
	const terminalLine = terminalLineLS.en;

	// suggestions: per-locale JSON arrays. label is LocalizedString; href is plain
	// (taken from the en row, same across locales). Walk each locale's array and
	// merge by index — mirrors transformErrorPage in apps/web's adapter.
	const rawTr = (raw.translations ?? []) as ReadonlyArray<DirectusErrorPageTranslation>;
	const suggestionsByLocale = new Map<string, Array<{ label: string; href: string }>>();
	for (const row of rawTr) {
		if (Array.isArray(row.suggestions) && row.suggestions.length > 0) {
			suggestionsByLocale.set(row.languages_code, row.suggestions);
		}
	}
	const enSuggestions = suggestionsByLocale.get('en') ?? [];
	const suggestions: readonly { label: LocalizedString; href: string }[] = enSuggestions.map(
		(enSug, idx) => {
			const labelLS: LocalizedString = {
				en: typeof enSug.label === 'string' ? enSug.label : '',
			};
			const frSug = suggestionsByLocale.get('fr')?.[idx];
			if (frSug && typeof frSug.label === 'string' && frSug.label.length > 0) {
				labelLS.fr = frSug.label;
			}
			const esSug = suggestionsByLocale.get('es')?.[idx];
			if (esSug && typeof esSug.label === 'string' && esSug.label.length > 0) {
				labelLS.es = esSug.label;
			}
			return {
				label: labelLS,
				href: typeof enSug.href === 'string' ? enSug.href : '',
			};
		},
	);

	return {
		label: toLocalizedString(tr, 'label'),
		heading: toLocalizedString(tr, 'heading'),
		description: toLocalizedString(tr, 'description'),
		terminalLine,
		suggestions,
	};
}

/** Fetch + validate the status_code=0 generic fallback row. */
export async function fetchErrorPageFallback({ client }: FetcherContext): Promise<ErrorPageContent> {
	const rows = (await client.request(
		readItems('error_pages', {
			filter: {
				status_code: { _eq: 0 },
				status: { _eq: 'published' },
			} as unknown as Record<string, unknown>,
			fields: ['*', 'translations.*'] as unknown as (keyof DirectusErrorPageRow)[],
			limit: 1,
		}),
	)) as unknown as DirectusErrorPageRow[];

	if (rows.length === 0) {
		throw new Error(
			'[fetchErrorPageFallback] no error_pages row found with status_code=0 (status=published). Seed it.',
		);
	}

	return ErrorPageContentSchema.parse(toErrorPageContent(rows[0]));
}
