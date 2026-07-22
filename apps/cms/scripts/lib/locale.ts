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

const EXTRA_LOCALES = ['fr', 'es'] as const;

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
	for (const locale of EXTRA_LOCALES) {
		const value = byLocale.get(locale);
		if (value) result[locale] = value;
	}
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

export type LocalizedFieldMode = 'optional' | 'nullable';

export type LocalizedFieldEntry<Field extends string = string> = Field
	| readonly [output: string, source: Field] | readonly [output: string, source: Field, mode: LocalizedFieldMode];

type ResultForLocalizedFieldEntry<Entry> = Entry extends string
	? { [Key in Entry]: LocalizedString }
	: Entry extends readonly [infer Output extends string, string, infer Mode]
		? Mode extends 'optional'
			? { [Key in Output]?: LocalizedString }
			: { [Key in Output]: LocalizedString | null }
		: Entry extends readonly [infer Output extends string, string]
			? { [Key in Output]: LocalizedString }
			: never;

type UnionToIntersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (
	value: infer Intersection,
) => void ? Intersection : never;

export type LocalizedFieldResult<Fields extends readonly LocalizedFieldEntry[]> = {
	[Key in keyof UnionToIntersection<ResultForLocalizedFieldEntry<Fields[number]>>]: UnionToIntersection<
		ResultForLocalizedFieldEntry<Fields[number]>
	>[Key];
};

/**
 * Interpret an ordered, typed map of localized columns. Strings keep the same
 * source/output name; tuples rename and can opt into absent-on-empty or null.
 * Iteration order remains output order across omitted optional entries.
 */
export function toLocalizedFields<
	T extends { languages_code: string },
	const Fields extends readonly LocalizedFieldEntry<Extract<keyof T, string>>[],
>(
	translations: ReadonlyArray<T> | null | undefined,
	fields: Fields,
): LocalizedFieldResult<Fields> {
	const result: Record<string, LocalizedString | null> = {};

	for (const entry of fields) {
		const [output, source, mode] = typeof entry === 'string' ? [entry, entry, undefined] : entry;
		const value =
			mode === 'optional'
				? toLocalizedStringOrUndef(translations, source)
				: mode === 'nullable'
					? toLocalizedStringNullable(translations, source)
					: toLocalizedString(translations, source);
		if (value !== undefined) result[output] = value;
	}

	return result as LocalizedFieldResult<Fields>;
}

/** A repeater/junction row carrying an optional `sort` order column. */
export interface SortableRow {
	sort?: number | null;
}

/**
 * Ascending comparator over a nullable `sort` column, treating a missing/null
 * `sort` as `0`. Byte-identical to the inline `(a, b) => (a.sort ?? 0) - (b.sort ?? 0)`
 * comparator the repeater/junction fetchers sort with today (projects sections /
 * impact_metrics, services deliverables / sections, about_languages,
 * stack/tags M2M).
 *
 * NOTE: this is the `?? 0` variant. The cascade/registry fetchers that order by
 * `?? Number.MAX_SAFE_INTEGER` with a secondary string tiebreak (nav,
 * site_pages, route_seo, contact channels, stack-archetype tech links) have
 * DIFFERENT null-handling semantics and are intentionally NOT covered here —
 * swapping them to `bySort` would move null-sort rows from last to first.
 */
export function bySort(a: SortableRow, b: SortableRow): number {
	return (a.sort ?? 0) - (b.sort ?? 0);
}

/**
 * Sort a repeater's rows by {@link bySort} (non-mutating) and map each row to a
 * value via `project`. Factors out the
 * `(rows ?? []).slice().sort(bySort).map(...)` shape shared by the
 * repeater/junction fetchers.
 *
 * `rows` is accepted as `null | undefined` and normalized to `[]` so callers
 * drop their own `?? []` guard. The copy (`[...rows]`) preserves the original
 * array — same as the inline `.slice()` calls it replaces.
 */
export function mapLocalizedRepeater<T extends SortableRow, R>(
	rows: ReadonlyArray<T> | null | undefined,
	project: (row: T) => R,
): R[] {
	return [...(rows ?? [])].sort(bySort).map(project);
}

/**
 * Convenience over {@link mapLocalizedRepeater} for the common single-field
 * shape: sort rows by {@link bySort}, then map each to
 * `toLocalizedString(row.translations ?? [], field)`. Covers e.g. services
 * `deliverables` (one localized `label` per row).
 *
 * The translations accessor defaults to `row.translations`; rows whose
 * translations live under a different key keep using the callback variant.
 * Sparse `LocalizedString` semantics are unchanged — this only relocates the
 * existing `toLocalizedString` call.
 */
export function mapLocalizedField<
	T extends SortableRow & { translations?: ReadonlyArray<{ languages_code: string }> | null },
>(rows: ReadonlyArray<T> | null | undefined, field: string): LocalizedString[] {
	return mapLocalizedRepeater(rows, (row) => toLocalizedString(row.translations ?? [], field));
}

/**
 * Coerce an unknown value to a string, falling back to `''` for non-strings.
 * Mirrors the local `str` helper in page-blocks-medium.ts and the inline
 * `typeof v === 'string' ? v : ''` idiom used across the singleton fetchers.
 */
export function str(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

import type { BlockEditorDoc, LocalizedBlockEditorDoc } from '@repo/shared';

/**
 * Compose a nested structure of LocalizedString leaves from per-locale JSON
 * column data. Each translation row's `field` column holds the SAME nested
 * shape with bare-string leaves per locale. Walker recurses through the en
 * row as the structural template, collecting matching paths from fr/es, and
 * produces a structure where every string leaf is a LocalizedString.
 *
 * Mirrors `toLocalizedJSON` in apps/web/src/lib/adapters/directus.ts.
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
		for (const locale of EXTRA_LOCALES) {
			const value = byLocale.get(locale);
			if (typeof value === 'string' && value.length > 0) result[locale] = value;
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
 * in apps/web/src/lib/adapters/directus.ts. Required `en` falls back to an
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
