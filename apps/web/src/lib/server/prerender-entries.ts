// Prerender entry builders — consolidation-deploy-honesty slice.
//
// The site is 100% build-time content, so every page route prerenders
// (prerender = true at the root layout). SvelteKit only auto-expands routes
// whose params are all optional to their UNPREFIXED form ('*' entries strip
// `[[lang=locale]]`), so each route exports explicit entries for both locales
// and each content slug. Explicit > crawl-discovered: an orphan page (not
// linked from nav/listings) would otherwise silently fall back to the lambda.
//
// Locale model (slice-28.6): EN is never prefixed (lang: ''), FR resolves as a
// path prefix (lang: 'fr'). `resolve_route` drops an optional param whose
// value is '' — `{ lang: '' }` yields '/about', `{ lang: 'fr' }` '/fr/about'.
// PREFIX_LOCALES is the routing lever: adding 'es' there automatically extends
// every entry list here.
//
// Slug sources are the GENERATED content modules (CMS is truth, .ts is the
// build-time cache) — the same arrays the sitemap builder enumerates, so
// prerender coverage and sitemap coverage stay in lockstep.

import { blogPosts } from '$lib/content/blog';
import { projects } from '$lib/content/projects';
import { services } from '$lib/content/services';
import { PREFIX_LOCALES } from '$lib/utils/locale-routing';

/** `lang` param values: '' (EN, unprefixed) plus each prefix locale. */
const LANG_PARAM_VALUES: readonly string[] = ['', ...PREFIX_LOCALES];

/** Map a content locale to its `lang` route param ('en' → '', 'fr' → 'fr'). */
function langParamFor(locale: string): string {
	return (PREFIX_LOCALES as readonly string[]).includes(locale) ? locale : '';
}

/** Entries for a static page: one per published locale ('/x' and '/fr/x'). */
export function localeEntries(): Array<{ lang: string }> {
	return LANG_PARAM_VALUES.map((lang) => ({ lang }));
}

/** Blog detail entries. Posts are mono-language: one URL per post, at the
 *  post body's language (EN posts live unprefixed, an FR post would live
 *  under /fr) — mirrors the sitemap's mono-language rule. */
export function blogEntries(): Array<{ lang: string; slug: string }> {
	return blogPosts.map((post) => ({ lang: langParamFor(post.lang), slug: post.slug }));
}

/** Project detail entries: every public project × every published locale. */
export function projectEntries(): Array<{ lang: string; slug: string }> {
	return projects
		.filter((project) => project.status !== 'private')
		.flatMap((project) => LANG_PARAM_VALUES.map((lang) => ({ lang, slug: project.slug })));
}

/** Service detail entries: every visible service × every published locale. */
export function serviceEntries(): Array<{ lang: string; id: string }> {
	return services
		.filter((service) => service.visible)
		.flatMap((service) => LANG_PARAM_VALUES.map((lang) => ({ lang, id: service.id })));
}
