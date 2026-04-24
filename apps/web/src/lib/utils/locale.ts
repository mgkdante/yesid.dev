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
 * Returns the best available string for the requested locale.
 *
 * Fallback order: requested locale → 'en'
 * There is no intermediate chain (es → fr → en). If Spanish is missing, you get
 * English, not French. This mirrors a SQL COALESCE(es_text, en_text) — simple,
 * predictable, and easy to reason about.
 *
 * Empty strings are treated as missing. An empty string means "not translated yet",
 * not "intentionally blank". This prevents half-filled translations from surfacing
 * as blank UI text.
 */
export function resolveLocale(localizedString: LocalizedString, locale: Locale): string {
	const value = localizedString[locale];
	if (value && value.trim() !== '') {
		return value;
	}
	// Always fall back to English — it is guaranteed to be non-empty by the type contract.
	return localizedString.en;
}
