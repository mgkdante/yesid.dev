// Compare only registry-published routes; archived sections must disappear from both routing and the sitemap.

import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adapter } from '#lib/adapters/index.ts';
import { isPathPublished } from '#lib/utils/page-registry.ts';
import { delocalizePath } from '#lib/utils/locale-routing.ts';
import { PUBLISHED_LOCALES, canonicalFor } from '#lib/utils/seo-defaults.ts';
import { _buildSitemapEntries } from '../routes/sitemap.xml/+server';
import { sitemapCoverage } from '@yesid/gates';
import { sitePages } from '#lib/content/site-pages.ts';

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
	it.each([
		['published registry', sitePages],
		['archived freeform', sitePages.filter((page) => page.path !== '/about')],
		['archived blog', sitePages.filter((page) => page.path !== '/blog')],
		['archived personal listing', sitePages.filter((page) => page.path !== '/blog/personal')],
	] as const)('every declared public route matches the sitemap with %s', async (_, pages) => {
		const declared = collectPageRoutes(ROUTES_DIR);

		const expected = new Set<string>();
		for (const route of declared) {
			if (EXCLUDES.has(route)) continue;
			const paths = await expandDynamic(route);

			for (const p of paths) {
				if (isPathPublished(p, pages)) expected.add(p);
			}
		}

		const entries = await _buildSitemapEntries(pages);
		const actual = new Set<string>();
		for (const entry of entries) {
			const m = entry.match(/<loc>([^<]+)<\/loc>/);
			if (!m) continue;
			const url = new URL(m[1]);

			actual.add(delocalizePath(url.pathname === '' ? '/' : url.pathname));
		}

		const coverage = sitemapCoverage({ expected, actual });

		expect(coverage.missing, `routes missing from sitemap`).toEqual([]);
		expect(coverage.extra, `routes in sitemap but missing from src/routes`).toEqual([]);

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
			if (!isPathPublished(`/blog/${post.slug}`, pages)) continue;
			expect(rawActual, `missing ${post.lang} blog row ${post.slug}`).toContain(
				canonicalFor(`/blog/${post.slug}`, post.lang),
			);
		}
	});
});
