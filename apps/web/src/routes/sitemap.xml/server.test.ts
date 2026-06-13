import { describe, expect, it } from 'vitest';
import { GET, _buildSitemapEntries } from './+server';
import { sitePages } from '$lib/content/site-pages';

describe('GET /sitemap.xml', () => {
	async function fetchBody() {
		const response = await GET({} as Parameters<typeof GET>[0]);
		return {
			status: response.status,
			body: await response.text(),
			contentType: response.headers.get('content-type'),
			cacheControl: response.headers.get('cache-control'),
		};
	}

	it('returns 200 with XML content-type', async () => {
		const { status, contentType } = await fetchBody();
		expect(status).toBe(200);
		expect(contentType).toMatch(/application\/xml/);
	});

	it('edge-caches a day with a week of SWR (slice-28.1, audit #18)', async () => {
		const { cacheControl } = await fetchBody();
		expect(cacheControl).toBe(
			'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
		);
	});

	it('includes every static public route', async () => {
		const { body } = await fetchBody();
		for (const path of [
			'/',
			'/about',
			'/contact',
			'/services',
			'/projects',
			'/blog',
			'/blog/personal',
			'/tech-stack',
		]) {
			const canonical = path === '/' ? 'https://yesid.dev' : `https://yesid.dev${path}`;
			expect(body, `missing ${canonical}`).toContain(`<loc>${canonical}</loc>`);
		}
	});

	it('includes dynamic blog routes for every published post', async () => {
		const { adapter } = await import('$lib/adapters');
		const posts = await adapter.blog.all();
		const { body } = await fetchBody();
		for (const post of posts) {
			expect(body, `missing blog post ${post.slug}`).toContain(
				`<loc>https://yesid.dev/blog/${post.slug}</loc>`,
			);
		}
	});

	it('excludes the __error pseudo-route', async () => {
		const { body } = await fetchBody();
		expect(body).not.toContain('__error');
	});

	it('emits xhtml:link hreflang for every published locale', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
		expect(body).toContain('<xhtml:link rel="alternate" hreflang="en"');
	});

	it('is well-formed XML', async () => {
		const { body } = await fetchBody();
		expect(body.startsWith('<?xml')).toBe(true);
		expect(body).toContain('</urlset>');
	});

	it('emits no <lastmod> (request-time noise, dropped in slice-28.1 — audit #19)', async () => {
		const { body } = await fetchBody();
		expect(body).not.toContain('<lastmod>');
	});

	// ── slice-28.6 T11: per-locale variants (post-FR-flip: en + fr + x-default) ──
	it('emits en + fr alternates with x-default for chrome routes (fr published)', async () => {
		const entries = await _buildSitemapEntries();
		const joined = entries.join('\n');
		expect(joined).toContain('hreflang="fr"');
		expect(joined).toContain('x-default');
		expect(joined).toContain('<loc>https://yesid.dev/about</loc>');
		expect(joined).toContain('<loc>https://yesid.dev/fr/about</loc>');
	});

	it('blog post entries carry no alternate cluster (mono-language, AM2.5)', async () => {
		const entries = await _buildSitemapEntries();
		const post = entries.find(
			(e) => e.includes('/blog/') && !e.includes('/blog</loc>') && !e.includes('/blog/personal'),
		);
		expect(post).toBeDefined();
		expect(post).not.toContain('xhtml:link');
	});
});

// slice-26.1: the sitemap is registry-gated — entries appear iff the
// site_pages registry resolves their path (exact, else longest listing
// prefix). The registry fixture is injected so the cascade is testable
// without editing the committed content module.
describe('_buildSitemapEntries — site_pages registry gating (slice-26.1)', () => {
	function pathnamesOf(entries: string[]): string[] {
		return entries
			.map((e) => e.match(/<loc>([^<]+)<\/loc>/)?.[1])
			.filter((loc): loc is string => Boolean(loc))
			.map((loc) => {
				const { pathname } = new URL(loc);
				return pathname === '' ? '/' : pathname;
			});
	}

	it('full registry → every static route present (parity with today)', async () => {
		const paths = pathnamesOf(await _buildSitemapEntries(sitePages));
		for (const p of ['/', '/about', '/contact', '/services', '/projects', '/blog', '/blog/personal', '/tech-stack']) {
			expect(paths).toContain(p);
		}
	});

	it('archiving /blog drops the listing AND its posts, but NOT /blog/personal (own row)', async () => {
		const registry = sitePages.filter((p) => p.path !== '/blog');
		const paths = pathnamesOf(await _buildSitemapEntries(registry));

		expect(paths).not.toContain('/blog');
		expect(paths.filter((p) => p.startsWith('/blog/'))).toEqual(['/blog/personal']);
	});

	it('archiving /services drops the listing and every service detail page', async () => {
		const registry = sitePages.filter((p) => p.path !== '/services');
		const paths = pathnamesOf(await _buildSitemapEntries(registry));

		expect(paths).not.toContain('/services');
		expect(paths.some((p) => p.startsWith('/services/'))).toBe(false);
		// untouched sections keep their entries
		expect(paths).toContain('/projects');
		expect(paths.some((p) => p.startsWith('/projects/'))).toBe(true);
	});

	it('archiving a freeform page drops exactly that path', async () => {
		const registry = sitePages.filter((p) => p.path !== '/about');
		const paths = pathnamesOf(await _buildSitemapEntries(registry));

		expect(paths).not.toContain('/about');
		expect(paths).toContain('/contact');
	});

	it('/ stays in the sitemap regardless (system root always resolves)', async () => {
		const paths = pathnamesOf(await _buildSitemapEntries([]));
		expect(paths).toContain('/');
	});
});
