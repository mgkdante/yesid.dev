/**
 * LocalizedString helpers for the export-fallbacks pipeline.
 *
 * Mirrors `toLocalizedString` from apps/web/src/lib/adapters/directus.ts so the
 * generator emits the same sparse `{ en, fr?, es? }` shape that the static
 * adapter currently consumes. Kept standalone (no apps/web import) because the
 * adapter file pulls SvelteKit-only modules (`$env/dynamic/public`, `$lib/*`)
 * that don't resolve from a CLI script in apps/cms.
 *
 * If the apps/web version ever drifts from this one, the P7 drift verification
 * (regen vs committed) will surface the mismatch.
 */

import type { Locale } from '@repo/shared';

export interface LocalizedString {
	en: string;
	fr?: string;
	es?: string;
}

/**
 * Flattens a Directus `translations` array into a `LocalizedString { en, fr?, es? }`.
 * Empty/null values per locale are dropped (matches integrity-test invariant:
 * every LocalizedString has a non-empty `.en`).
 */
export function toLocalizedString<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
	fallback: Locale = 'en',
): LocalizedString {
	const rows = translations ?? [];
	const byLocale = new Map<string, string>();
	for (const row of rows) {
		const value = (row as Record<string, unknown>)[field];
		if (typeof value === 'string' && value.length > 0) {
			byLocale.set(row.languages_code, value);
		}
	}
	const en = byLocale.get('en') ?? byLocale.get(fallback) ?? '';
	const result: LocalizedString = { en };
	const fr = byLocale.get('fr');
	if (fr) result.fr = fr;
	const es = byLocale.get('es');
	if (es) result.es = es;
	return result;
}

/** LocalizedString or undefined — for optional fields. */
export function toLocalizedStringOrUndef<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
): LocalizedString | undefined {
	const rows = translations ?? [];
	const hasAny = rows.some((t) => {
		const v = (t as Record<string, unknown>)[field];
		return typeof v === 'string' && v.length > 0;
	});
	return hasAny ? toLocalizedString(rows, field) : undefined;
}

/** LocalizedString or null — for fields whose null carries semantic meaning. */
export function toLocalizedStringNullable<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
): LocalizedString | null {
	const rows = translations ?? [];
	const hasAny = rows.some((t) => {
		const v = (t as Record<string, unknown>)[field];
		return typeof v === 'string' && v.length > 0;
	});
	return hasAny ? toLocalizedString(rows, field) : null;
}

import type { BlockEditorDoc, LocalizedBlockEditorDoc } from '@repo/shared';

/**
 * Compose a nested structure of LocalizedString leaves from per-locale JSON
 * column data. Each translation row's `field` column holds the SAME nested
 * shape with bare-string leaves per locale. Walker recurses through the en
 * row as the structural template, collecting matching paths from fr/es, and
 * produces a structure where every string leaf is a LocalizedString.
 *
 * Mirrors apps/web/src/lib/adapters/directus.ts:554 `toLocalizedJSON`.
 *
 * Non-string primitives (numbers, booleans) pass through unchanged from the
 * en row. Arrays merge element-wise by index.
 */
export function toLocalizedJSON<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
): unknown {
	const rows = translations ?? [];
	const byLocale = new Map<string, unknown>();
	for (const row of rows) {
		const value = (row as Record<string, unknown>)[field];
		if (value !== null && value !== undefined) {
			byLocale.set(row.languages_code, value);
		}
	}
	const enVal = byLocale.get('en') ?? byLocale.values().next().value;
	if (enVal === undefined || enVal === null) return {};
	return mergeJsonLocales(enVal, byLocale);
}

function mergeJsonLocales(enTemplate: unknown, byLocale: Map<string, unknown>): unknown {
	if (typeof enTemplate === 'string') {
		const result: LocalizedString = { en: enTemplate };
		const fr = byLocale.get('fr');
		if (fr !== undefined && fr !== null && typeof fr === 'string' && fr.length > 0) {
			result.fr = fr;
		}
		const es = byLocale.get('es');
		if (es !== undefined && es !== null && typeof es === 'string' && es.length > 0) {
			result.es = es;
		}
		return result;
	}
	if (typeof enTemplate === 'number' || typeof enTemplate === 'boolean') {
		return enTemplate;
	}
	if (Array.isArray(enTemplate)) {
		return enTemplate.map((enItem, idx) => {
			const localeMap = new Map<string, unknown>();
			for (const [locale, localeVal] of byLocale) {
				if (Array.isArray(localeVal) && localeVal[idx] !== undefined) {
					localeMap.set(locale, localeVal[idx]);
				} else {
					localeMap.set(locale, undefined);
				}
			}
			return mergeJsonLocales(enItem, localeMap);
		});
	}
	if (enTemplate !== null && typeof enTemplate === 'object') {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(enTemplate as Record<string, unknown>)) {
			const localeMap = new Map<string, unknown>();
			for (const [locale, localeVal] of byLocale) {
				if (localeVal !== null && typeof localeVal === 'object' && !Array.isArray(localeVal)) {
					localeMap.set(locale, (localeVal as Record<string, unknown>)[key]);
				} else {
					localeMap.set(locale, undefined);
				}
			}
			out[key] = mergeJsonLocales((enTemplate as Record<string, unknown>)[key], localeMap);
		}
		return out;
	}
	return enTemplate;
}

/**
 * Compose a LocalizedBlockEditorDoc from translation rows whose `field` column
 * holds a BlockEditorDoc JSON value per locale. Mirrors `toLocalizedBlockEditorDoc`
 * at apps/web/src/lib/adapters/directus.ts:510. Required `en` falls back to an
 * empty single-paragraph doc when no English translation is present so the
 * LocalizedBlockEditorDocSchema's `.en` requirement is always satisfied.
 */
export function toLocalizedBlockEditorDoc<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
): LocalizedBlockEditorDoc {
	const rows = translations ?? [];
	const out: { en?: BlockEditorDoc; fr?: BlockEditorDoc; es?: BlockEditorDoc } = {};
	for (const row of rows) {
		const value = (row as Record<string, unknown>)[field];
		if (value !== null && typeof value === 'object' && 'blocks' in (value as object)) {
			const code = row.languages_code as 'en' | 'fr' | 'es';
			out[code] = value as BlockEditorDoc;
		}
	}
	if (!out.en) {
		out.en = {
			time: 0,
			version: '2.31.2',
			blocks: [{ id: 'p1', type: 'paragraph', data: { text: '' } }],
		};
	}
	return out as LocalizedBlockEditorDoc;
}
