import { describe, expect, it } from 'vitest';
import { adapter } from './index';

describe('adapter.meta.forRoute', () => {
	it('resolves a static route by id', async () => {
		const seo = await adapter.meta.forRoute('/about', 'en');
		expect(seo.title.en).toMatch(/About/);
		expect(seo.canonical).toBe('https://yesid.dev/about');
	});

	it('returns a Zod-validated object (ogType default fills in)', async () => {
		const seo = await adapter.meta.forRoute('/', 'en');
		expect(seo.ogType).toBe('website');
		expect(seo.noIndex).toBe(false);
	});

	it('resolves a dynamic blog route by slug', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const first = posts[0];
		const seo = await adapter.meta.forRoute('/blog/[slug]', 'en', { slug: first.slug });
		expect(seo.title.en).toContain('yesid.');
		expect(seo.canonical).toBe(`https://yesid.dev/blog/${first.slug}`);
		expect(seo.ogType).toBe('article');
	});

	it('resolves a dynamic project route by slug', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const first = projects[0];
		const seo = await adapter.meta.forRoute('/projects/[slug]', 'en', { slug: first.slug });
		expect(seo.canonical).toBe(`https://yesid.dev/projects/${first.slug}`);
		expect(seo.ogType).toBe('article');
	});

	it('resolves a dynamic service route by id', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const first = services[0];
		const seo = await adapter.meta.forRoute('/services/[id]', 'en', { id: first.id });
		expect(seo.canonical).toBe(`https://yesid.dev/services/${first.id}`);
	});

	it('throws on an unknown route id', async () => {
		await expect(adapter.meta.forRoute('/definitely-not-a-route', 'en')).rejects.toThrow(
			/Unknown route id/,
		);
	});

	it('throws on a dynamic route with an unknown slug', async () => {
		await expect(
			adapter.meta.forRoute('/blog/[slug]', 'en', { slug: 'not-a-real-post' }),
		).rejects.toThrow(/Unknown blog slug/);
	});

	it('returns 404 entry with noIndex: true', async () => {
		const seo = await adapter.meta.forRoute('/__error', 'en');
		expect(seo.noIndex).toBe(true);
		expect(seo.title.en).toMatch(/Not Found/);
	});
});

describe('adapter.meta.forRoute + jsonLd (Slice 15b)', () => {
	it('returns jsonLd as part of PageSeo for a static route', async () => {
		const seo = await adapter.meta.forRoute('/about', 'en');
		expect(seo.jsonLd).toBeDefined();
		expect(Array.isArray(seo.jsonLd)).toBe(true);
	});

	it('parses jsonLd through PageSeoSchema at the adapter boundary', async () => {
		// If an entry's jsonLd is malformed, forRoute must throw at the Zod parse.
		// We can't directly inject a bad entry from a test, but we can rely on
		// the Zod parse as the documented contract: cover it in the schema tests
		// and assert here that a known-good entry round-trips cleanly.
		const seo = await adapter.meta.forRoute('/blog', 'en');
		expect(seo.jsonLd).toBeDefined();
		for (const node of seo.jsonLd ?? []) {
			expect(node).toHaveProperty('@type');
			expect(node).toHaveProperty('@id');
		}
	});

	it('returns jsonLd for a dynamic blog route', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const seo = await adapter.meta.forRoute('/blog/[slug]', 'en', { slug: posts[0].slug });
		expect(seo.jsonLd).toBeDefined();
		const types = (seo.jsonLd ?? []).map((n) => n['@type']);
		expect(types).toContain('BlogPosting');
		expect(types).toContain('BreadcrumbList');
	});
});
