import type { Locale, LocalizedString } from '$lib/types';

// English is the guaranteed fallback. Every LocalizedString must have 'en'.
// If a component requests French but only English exists, it gets English — never
// an empty string, never undefined, never a crash.
export const DEFAULT_LOCALE: Locale = 'en';

// All locales the site intends to support. Adding a new locale here is step one
// of a multi-step process: add the type in types.ts, add it here, then fill in
// the data files and set up routing (slice 04+).
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'];

/**
 * A generic localized container: any object with a required `en` key and
 * optional `fr`/`es` keys. Covers both LocalizedString (string values) and
 * LocalizedBlockEditorDoc (BlockEditorDoc values).
 */
type LocalizedValue<T> = { en: T; fr?: T; es?: T };

/**
 * Returns the best available value for the requested locale.
 *
 * Fallback order: requested locale → 'en'
 * There is no intermediate chain (es → fr → en). If Spanish is missing, you get
 * English, not French. This mirrors a SQL COALESCE(es_text, en_text) — simple,
 * predictable, and easy to reason about.
 *
 * For string values, empty strings are treated as missing. An empty string means
 * "not translated yet", not "intentionally blank".
 *
 * For non-string values (e.g. BlockEditorDoc), presence check only (null/undefined).
 */
export function resolveLocale(localizedString: LocalizedString, locale: Locale): string;
export function resolveLocale<T>(localizedValue: LocalizedValue<T>, locale: Locale): T;
export function resolveLocale<T>(
	localizedValue: LocalizedValue<T> | LocalizedString,
	locale: Locale,
): T | string {
	const value = (localizedValue as LocalizedValue<T>)[locale];
	if (value !== undefined && value !== null) {
		// For string values, also check non-empty.
		if (typeof value === 'string') {
			if ((value as string).trim() !== '') return value;
		} else {
			return value;
		}
	}
	// Always fall back to English — it is guaranteed to be non-empty by the type contract.
	return (localizedValue as LocalizedValue<T>).en;
}
