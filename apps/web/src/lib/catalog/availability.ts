import type { BlogPost, Locale, Project, Service, SitePage } from '#lib/types.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';

export interface AvailabilityOptions {
	pages?: readonly SitePage[];
	locales?: readonly Locale[];
}

/** Build-time rows and locale permission, injectable together for surface agreement checks. */
export interface AvailabilityContext extends AvailabilityOptions {
	projects?: readonly Project[];
	services?: readonly Service[];
	posts?: readonly BlogPost[];
}

export type ContentEntity =
	| { kind: 'project'; entity: Pick<Project, 'slug' | 'status'> }
	| { kind: 'service'; entity: Pick<Service, 'id' | 'visible'> }
	| { kind: 'post'; entity: Pick<BlogPost, 'slug' | 'lang'> };

/** Locale permission is separate from the registry's site page publication switch. */
export function isLocaleAvailable(locale: string, locales: readonly Locale[] = PUBLISHED_LOCALES): boolean {
	return locales.some((published) => published === locale);
}

/** Generated project/service translations already preserve English fallback.
 * Posts have one row per available language, so a different language is absent. */
export function isEntityAvailable(content: ContentEntity, locale: string = 'en', options: AvailabilityOptions = {}): boolean {
	if (!isLocaleAvailable(locale, options.locales)) return false;
	switch (content.kind) {
		case 'project':
			return content.entity.status !== 'private'
				&& isPathPublished(`/projects/${content.entity.slug}`, options.pages);
		case 'service':
			return content.entity.visible !== false
				&& isPathPublished(`/services/${content.entity.id}`, options.pages);
		case 'post':
			return content.entity.lang === locale
				&& isPathPublished(`/blog/${content.entity.slug}`, options.pages);
	}
}

/** Concrete page routes need their own published row, never a parent's fallback. */
export const STATIC_PAGE_PATHS: readonly string[] = [
	'/', '/about', '/contact', '/services', '/projects', '/blog', '/blog/personal',
];

/** Endpoint-style surfaces that must never be registry-gated. */
const EXEMPT_EXACT = new Set(['/sitemap.xml', '/robots.txt', '/work']);
const EXEMPT_PREFIXES = ['/api/', '/og/'];

/** Normalize a request pathname: strip trailing slash (root excepted). */
export function normalizePathname(pathname: string): string {
	if (pathname === '' || pathname === '/') return '/';
	return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

/** True for non-page surfaces the registry gate must skip. */
export function isRegistryExempt(pathname: string): boolean {
	const path = normalizePathname(pathname);
	if (EXEMPT_EXACT.has(path)) return true;
	return EXEMPT_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix));
}

/**
 * Resolve a pathname to its registry entry: exact match first, else the
 * longest `listing` prefix (detail routes inherit their section's entry).
 * Returns undefined for archived/unknown paths.
 */
export function resolveSitePage(
	pathname: string,
	pages: readonly SitePage[] = sitePages,
): SitePage | undefined {
	const path = normalizePathname(pathname);

	const exact = pages.find((p) => p.path === path);
	if (exact) return exact;
	if (STATIC_PAGE_PATHS.includes(path)) return undefined;

	let best: SitePage | undefined;
	for (const page of pages) {
		if (page.type !== 'listing') continue;
		if (page.path === '/') continue; // root never claims children
		if (!path.startsWith(`${page.path}/`)) continue;
		if (!best || page.path.length > best.path.length) best = page;
	}
	return best;
}

/**
 * The route-gate predicate consumed by +layout.server.ts and the sitemap.
 * True when the path may render: root, exempt surfaces, or any path that
 * resolves to a published registry entry.
 */
export function isPathPublished(pathname: string, pages: readonly SitePage[] = sitePages): boolean {
	const path = normalizePathname(pathname);
	if (path === '/') return true;
	if (isRegistryExempt(path)) return true;
	return resolveSitePage(path, pages) !== undefined;
}
