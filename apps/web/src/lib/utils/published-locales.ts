// Published locales control SEO alternates, canonical prefixes, sitemap variants and locale-switcher visibility.
// Dependency-free so bare-bun scripts can import it without SvelteKit virtual modules.
import type { Locale } from '#lib/types.ts';

export const PUBLISHED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'];
