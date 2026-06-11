// page-registry — pure helpers over the emitted site_pages registry
// ($lib/content/site-pages.ts). Slice-26.1 content controls.
//
// THE CASCADE CONTRACT (web side): the registry contains PUBLISHED rows only.
// A path that doesn't resolve against it belongs to an archived (or unknown)
// section and must 404 — +layout.server.ts is the single gating point, and
// the sitemap filters its entries through the same resolution so archived
// pages disappear from navbar, footer, mobile menu, sitemap, AND route in
// one CMS action (archive → rebuild Flow → static export).
//
// Resolution rules:
//   1. '/' always resolves (system root — the site cannot 404 its own home).
//   2. Exact path match wins ('/blog/personal' has its own registry row).
//   3. Detail routes resolve to their LONGEST matching listing prefix:
//      '/services/sql-development' → '/services'; '/blog/some-post' → '/blog'.
//      Longest-prefix means '/blog/personal' (when it had children) would win
//      over '/blog' for paths under it. Only `type: 'listing'` rows act as
//      prefixes — freeform/system rows never claim child paths.
//   4. Anything else is unknown → no entry → 404.
//
// Non-page surfaces (OG images, sitemap.xml, robots.txt, /work resume
// redirect, /api/*) are exempt: they don't render HTML pages and several
// must keep working even for archived sections.

import { sitePages } from '$lib/content/site-pages';
import type { SitePage } from '$lib/types';

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
