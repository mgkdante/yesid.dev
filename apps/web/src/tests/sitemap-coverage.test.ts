// Build-time sitemap coverage gate.
//
// Runs as part of the standard test suite (`bun run test`). Fails if any
// declared public route is missing from the sitemap's output, or if the
// sitemap emits a route that doesn't exist on disk. Forces sitemap + routes
// to stay in sync as pages are added, removed, or renamed.
//
// slice-26.1: routes are additionally filtered through the site_pages
// registry on BOTH sides of the diff. A route whose registry entry is absent
// (archived section) is expected to be missing from the sitemap — the same
// rebuild 404s it via the +layout.server.ts gate, so dropping it here is
// correct, not a coverage hole.

import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adapter } from '$lib/adapters';
import { isPathPublished } from '$lib/utils/page-registry';
import { delocalizePath } from '$lib/utils/locale-routing';
import { PUBLISHED_LOCALES, canonicalFor } from '$lib/utils/seo-defaults';
import { _buildSitemapEntries } from '../routes/sitemap.xml/+server';

const ROUTES_DIR = 'src/routes';

// Routes intentionally excluded from sitemap coverage.
const EXCLUDES = new Set<string>(['/sitemap.xml', '/robots.txt']);

// Walk src/routes to find every route that has a +page.svelte OR +page@*.svelte
// (the latter is SvelteKit's layout-group syntax for skipping intermediate layouts).
function collectPageRoutes(dir: string, prefix = ''): string[] {
	const entries = readdirSync(dir);
	const routes: string[] = [];

	const hasPage = entries.some((e) => /^\+page(@[^.]*)?\.svelte$/.test(e));
	if (hasPage) {
		routes.push(prefix === '' ? '/' : prefix);
	}

	for (const entry of entries) {
		const full = join(dir, entry);
		if (!statSync(full).isDirectory()) continue;
		if (entry.startsWith('.')) continue;
		if (entry.startsWith('(')) continue; // SvelteKit route group
		// [[lang=locale]] is the optional locale prefix (slice-28.6) —
		// transparent for coverage purposes: declared routes are the EN
		// canonical tree.
		if (entry.startsWith('[[')) {
			routes.push(...collectPageRoutes(full, prefix));
			continue;
		}
		const nextPrefix = `${prefix}/${entry}`.replace(new RegExp(`\\${sep}`, 'g'), '/');
		routes.push(...collectPageRoutes(full, nextPrefix));
	}

	return routes;
}

async function expandDynamic(route: string): Promise<string[]> {
	if (!route.includes('[')) return [route];

	if (route === '/blog/[slug]') {
		const posts = await adapter.blog.all();
		return posts.map((p) => `/blog/${p.slug}`);
	}
	if (route === '/projects/[slug]') {
		const projects = await adapter.projects.public();
		return projects.map((p) => `/projects/${p.slug}`);
	}
	if (route === '/services/[id]') {
		const services = await adapter.services.visible();
		return services.map((s) => `/services/${s.id}`);
	}
	if (route === '/legal/[slug]') {
		const pages = await adapter.legal.all();
		return pages.map((p) => `/legal/${p.slug}`);
	}

	throw new Error(
		`[sitemap-coverage] Unknown dynamic route pattern: ${route}. Add expansion logic.`,
	);
}

describe('sitemap coverage gate', () => {
	it('every declared public route appears in the sitemap, and vice versa', async () => {
		const declared = collectPageRoutes(ROUTES_DIR);

		const expected = new Set<string>();
		for (const route of declared) {
			if (EXCLUDES.has(route)) continue;
			const paths = await expandDynamic(route);
			// Registry gate (slice-26.1): routes whose site_pages entry is absent
			// are 404'd by +layout.server.ts and must NOT appear in the sitemap.
			for (const p of paths) {
				if (isPathPublished(p)) expected.add(p);
			}
		}

		const entries = await _buildSitemapEntries();
		const actual = new Set<string>();
		for (const entry of entries) {
			const m = entry.match(/<loc>([^<]+)<\/loc>/);
			if (!m) continue;
			const url = new URL(m[1]);
			// slice-28.6: per-locale variants share one declared route — compare
			// on the delocalized, de-duplicated path set.
			actual.add(delocalizePath(url.pathname === '' ? '/' : url.pathname));
		}

		const missingInSitemap = [...expected].filter((r) => !actual.has(r));
		const extraInSitemap = [...actual].filter((r) => !expected.has(r));

		expect(missingInSitemap, `routes missing from sitemap`).toEqual([]);
		expect(extraInSitemap, `routes in sitemap but missing from src/routes`).toEqual([]);

		// Every same-path chrome route appears once per published locale. Blog
		// translations own distinct slugs, so each row appears at its body locale
		// and carries exact alternates rather than same-slug locale variants.
		const posts = await adapter.blog.all();
		const blogPaths = new Set(posts.map((p) => `/blog/${p.slug}`));
		const rawActual = new Set(
			entries.map((e) => e.match(/<loc>([^<]+)<\/loc>/)?.[1]).filter(Boolean) as string[],
		);
		for (const path of expected) {
			if (blogPaths.has(path)) continue;
			for (const l of PUBLISHED_LOCALES) {
				expect(rawActual, `missing ${l} variant of ${path}`).toContain(canonicalFor(path, l));
			}
		}
		for (const post of posts) {
			expect(rawActual, `missing ${post.lang} blog row ${post.slug}`).toContain(
				canonicalFor(`/blog/${post.slug}`, post.lang),
			);
		}
	});
});
