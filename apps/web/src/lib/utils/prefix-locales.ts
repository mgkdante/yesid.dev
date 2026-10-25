/** Locales that may appear as a URL path prefix. EN is never prefixed.
 * Keep this module free of Vite imports: Kit loads params.ts natively. */
export const PREFIX_LOCALES = ['fr', 'es'] as const;

const prefixSet: ReadonlySet<string> = new Set(PREFIX_LOCALES);

/** Same case-sensitive set membership as createLocaleRouting.isPrefixLocale. */
export function isPrefixLocale(value: string): value is (typeof PREFIX_LOCALES)[number] {
	return prefixSet.has(value);
}
