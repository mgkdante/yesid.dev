import { describe, expect, it } from 'vitest';
import { adapter } from './index';
import { routeSeoOverrides } from '$lib/content/route-seo';

const overrideByPath = new Map(routeSeoOverrides.map((entry) => [entry.path, entry]));

describe('adapter.meta.forRoute', () => {
	it('resolves a static route by id', async () => {
		const seo = await adapter.meta.forRoute('/about', 'en');
		// Keyword title (homework #4, name shortened per operator 2026-07-03):
		// "Yesid, Digital Infrastructure Engineer in Montreal"
		expect(seo.title.en).toMatch(/Yesid, Digital Infrastructure Engineer/);
		expect(seo.canonical).toBe('https://yesid.dev/about');
	});

	it('uses CMS route_seo overrides for static route descriptions', async () => {
		const servicesOverride = overrideByPath.get('/services');
		expect(servicesOverride?.description?.en).toBeTruthy();

		const seo = await adapter.meta.forRoute('/services', 'en');
		expect(seo.description.en).toBe(servicesOverride?.description?.en);
	});

	it('returns a Zod-validated object (ogType default fills in)', async () => {
		const seo = await adapter.meta.forRoute('/', 'en');
		expect(seo.ogType).toBe('website');
		expect(seo.noIndex).toBe(false);
	});

	it('resolves a dynamic blog route by slug', async () => {
		const posts = await adapter.blog.all();
		const first = posts.find((post) => post.lang === 'en');
		if (!first) return;
		const seo = await adapter.meta.forRoute('/blog/[slug]', first.lang, { slug: first.slug });
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
		const post = posts.find((candidate) => candidate.lang === 'en');
		if (!post) return;
		const seo = await adapter.meta.forRoute('/blog/[slug]', post.lang, { slug: post.slug });
		expect(seo.jsonLd).toBeDefined();
		const types = (seo.jsonLd ?? []).map((n) => n['@type']);
		expect(types).toContain('BlogPosting');
		expect(types).toContain('BreadcrumbList');
	});
});

describe('adapter.meta.forRoute + jsonLd — per-route coverage', () => {
	async function typesFor(routeId: string, params?: Record<string, string>): Promise<string[]> {
		const seo = await adapter.meta.forRoute(routeId, 'en', params);
		return (seo.jsonLd ?? []).map((n) => n['@type']);
	}

	it('/ emits Person + ProfessionalService + WebSite + ProfilePage', async () => {
		const types = await typesFor('/');
		expect(types).toEqual(['Person', 'ProfessionalService', 'WebSite', 'ProfilePage']);
	});

	it('/about emits Person + ProfilePage + BreadcrumbList', async () => {
		const types = await typesFor('/about');
		expect(types).toEqual(['Person', 'ProfilePage', 'BreadcrumbList']);
	});

	it('/contact emits BreadcrumbList only', async () => {
		expect(await typesFor('/contact')).toEqual(['BreadcrumbList']);
	});

	it('/services emits CollectionPage + BreadcrumbList', async () => {
		expect(await typesFor('/services')).toEqual(['CollectionPage', 'BreadcrumbList']);
	});

	it('/services CollectionPage description follows the CMS route_seo description', async () => {
		const servicesOverride = overrideByPath.get('/services');
		const seo = await adapter.meta.forRoute('/services', 'en');
		const collectionPage = seo.jsonLd?.find((node) => node['@type'] === 'CollectionPage');

		expect(collectionPage?.description).toBe(servicesOverride?.description?.en);
	});

	it('/services/[id] emits Service + BreadcrumbList', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const types = await typesFor('/services/[id]', { id: services[0].id });
		expect(types).toEqual(['Service', 'BreadcrumbList']);
	});

	it('/projects emits CollectionPage + BreadcrumbList', async () => {
		expect(await typesFor('/projects')).toEqual(['CollectionPage', 'BreadcrumbList']);
	});

	it('/projects/[slug] emits CreativeWork + BreadcrumbList', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const types = await typesFor('/projects/[slug]', { slug: projects[0].slug });
		expect(types).toEqual(['CreativeWork', 'BreadcrumbList']);
	});

	it('/blog emits CollectionPage + BreadcrumbList', async () => {
		expect(await typesFor('/blog')).toEqual(['CollectionPage', 'BreadcrumbList']);
	});

	it('/blog/personal emits CollectionPage + BreadcrumbList (nested: Home → Blog → Personal Corner)', async () => {
		const seo = await adapter.meta.forRoute('/blog/personal', 'en');
		const types = (seo.jsonLd ?? []).map((n) => n['@type']);
		expect(types).toEqual(['CollectionPage', 'BreadcrumbList']);
		// Check the nested breadcrumb trail (Q3-B)
		const breadcrumb = seo.jsonLd?.find((n) => n['@type'] === 'BreadcrumbList');
		expect(breadcrumb).toBeDefined();
		if (breadcrumb && breadcrumb['@type'] === 'BreadcrumbList') {
			expect(breadcrumb.itemListElement).toHaveLength(3);
			expect(breadcrumb.itemListElement[1].name).toBe('Blog');
			// slice-28.6: crumb names come from the trilingual site_pages
			// registry — its en title for this row is 'Personal Corner'
			// (previously a hardcoded 'Personal' literal).
			expect(breadcrumb.itemListElement[2].name).toBe('Personal Corner');
		}
	});

	it('/blog/[slug] emits BlogPosting + BreadcrumbList', async () => {
		const posts = await adapter.blog.all();
		const post = posts.find((candidate) => candidate.lang === 'en');
		if (!post) return;
		const types = await typesFor('/blog/[slug]', { slug: post.slug });
		expect(types).toEqual(['BlogPosting', 'BreadcrumbList']);
	});

	it('/tech-stack emits BreadcrumbList only', async () => {
		expect(await typesFor('/tech-stack')).toEqual(['BreadcrumbList']);
	});

	it('/__error emits no jsonLd (noIndex route, per spec)', async () => {
		const seo = await adapter.meta.forRoute('/__error', 'en');
		expect(seo.jsonLd === undefined || seo.jsonLd.length === 0).toBe(true);
	});
});
