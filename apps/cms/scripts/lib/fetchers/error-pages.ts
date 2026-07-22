/**
 * error-pages fetcher owns both build-time projections from published rows:
 * `errorPageContent` for the status_code=0 generic fallback and `errorPagesById`
 * for the complete status-code map consumed by static content.
 *
 * Both projections use the same validated transform below.
 */

import { readItems } from '@directus/sdk';
import { str, toLocalizedFields, toLocalizedString } from '../locale';
import { ErrorPageContentSchema } from '@repo/shared/schemas';
import type { ErrorPageContent } from '@repo/shared';
import type { LocalizedString } from '@repo/shared';
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
	// (taken from the en row, same across locales). Merge locale rows by index.
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
				en: str(enSug.label),
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
				href: str(enSug.href),
			};
		},
	);

	return {
		...toLocalizedFields(raw.translations ?? [], ['label', 'heading', 'description']),
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

/**
 * Fetch ALL published error_pages rows and return a Record keyed by status_code.
 * The static consumer falls back from a requested status code to status_code=0.
 */
export async function fetchAllErrorPages({
	client,
}: FetcherContext): Promise<Record<number, ErrorPageContent>> {
	const rows = (await client.request(
		readItems('error_pages', {
			filter: {
				status: { _eq: 'published' },
			} as unknown as Record<string, unknown>,
			fields: ['*', 'translations.*'] as unknown as (keyof DirectusErrorPageRow)[],
			limit: -1,
		}),
	)) as unknown as DirectusErrorPageRow[];

	if (rows.length === 0) {
		throw new Error(
			'[fetchAllErrorPages] no published error_pages rows found. Seed at least a status_code=0 fallback.',
		);
	}

	const result: Record<number, ErrorPageContent> = {};
	for (const row of rows) {
		result[row.status_code] = ErrorPageContentSchema.parse(toErrorPageContent(row));
	}
	return result;
}
