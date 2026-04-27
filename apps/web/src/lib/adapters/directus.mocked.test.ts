// Mocked-fetch contract tests for the Directus adapter (F23 — 18c Task 45).
//
// Scope: assert every port method issues the EXPECTED Directus REST request —
// correct collection, expanded translations, expected filter shape, limit=-1
// when we want "all rows", etc. The live `cms.yesid.dev` is NEVER hit; every
// request is captured via a stubbed fetch injected through the queue module.
//
// This is a TEMPLATE for Slice 18 + future sub-slices:
//   - When a new port lands (projects, blog, meta, techStack, content),
//     add a describe() block here that asserts the readItems call shape.
//   - When a port's query shape changes (fields, filter, sort), update the
//     matching assertion here. Breakage here means the CMS seed/snapshot is
//     out of sync with the adapter reads — catch it in unit tests, not live.
//
// Pattern:
//   1. vi.unmock('$lib/adapters/directus') — subject under test.
//   2. vi.mock('./directus-queue') — replace createQueuedFetch() with a
//      factory returning a shared mock that records all fetch calls.
//   3. vi.stubEnv('PUBLIC_DIRECTUS_URL', 'https://cms.yesid.dev') before
//      importing the adapter — the client is built lazily on first use, so
//      stubbing once at the top of the file is enough.
//   4. Call a port method; read mockFetch.mock.calls for the captured URL
//      + init, assert against expected shape.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/adapters/directus');

// The `createQueuedFetch` factory returns `sharedMockFetch` so every client
// instance built by `buildClient()` uses the same capture surface.
const sharedMockFetch = vi.fn();

vi.mock('./directus-queue', () => ({
	createQueuedFetch: () => sharedMockFetch,
}));

import { directusAdapter } from './directus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a JSON Response suitable for the Directus SDK's `{ data: ... }` envelope.
 * Keeps each test's setup to one line.
 */
function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify({ data: body }), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

/**
 * Parse the captured fetch URL — the SDK builds `<baseUrl>/items/<collection>?<query>`.
 * Returns pathname + searchParams for structured assertions.
 */
function parseCapturedUrl(): { pathname: string; search: URLSearchParams } {
	expect(sharedMockFetch).toHaveBeenCalled();
	const call = sharedMockFetch.mock.calls[0];
	// SDK calls fetch(url, init) — url may be string | URL | Request.
	const rawUrl = call[0];
	const url = typeof rawUrl === 'string' ? new URL(rawUrl) : (rawUrl as URL);
	return { pathname: url.pathname, search: url.searchParams };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

// Provide a URL so `buildClient()` doesn't throw. `$env/dynamic/public` is
// already stubbed to `{}` in setup.data.ts — override here for this file.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' },
}));

beforeEach(() => {
	sharedMockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// services port
// ---------------------------------------------------------------------------

describe('directusAdapter.services — fetch contract', () => {
	it('services.all hits /items/services with deep translations expansion', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.services.all();

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/services');
		// fields must request * + translations + deliverables + sections
		const fields = search.get('fields');
		expect(fields).toBeTruthy();
		expect(fields!).toContain('*');
		expect(fields!).toContain('translations');
		expect(fields!).toContain('deliverables');
		expect(fields!).toContain('sections');
		// limit=-1 means "no pagination cap" — site has <50 services
		expect(search.get('limit')).toBe('-1');
	});

	it('services.byId filters by id._eq', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.services.byId('sql-development');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/services');
		const filter = search.get('filter');
		expect(filter).toBeTruthy();
		// Directus SDK serialises filter as JSON — match on the id + _eq tokens
		expect(filter!).toContain('id');
		expect(filter!).toContain('_eq');
		expect(filter!).toContain('sql-development');
	});

	it('services.visible filters visible._neq=false (not _eq=true — captures nullable column)', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.services.visible();

		const { search } = parseCapturedUrl();
		const filter = search.get('filter');
		expect(filter).toBeTruthy();
		expect(filter!).toContain('visible');
		expect(filter!).toContain('_neq');
		expect(filter!).toContain('false');
	});
});

// ---------------------------------------------------------------------------
// content.metroSvg (Slice 18d Phase 8 — Task 28-33)
//
// Asserts the consumer-flip wiring: content.metroSvg() resolves the
// montreal-metro UUID via @repo/shared assetIdFor, hits
// /assets/<uuid> on the configured Directus base URL, and returns
// the SVG markup. Non-2xx responses must throw with status context so
// SSR load() failures surface clearly.
// ---------------------------------------------------------------------------

describe('directusAdapter.content.metroSvg — fetch contract', () => {
	it('hits /assets/<uuid> for the montreal-metro svg id from id-map', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
				status: 200,
				headers: { 'content-type': 'image/svg+xml' },
			}),
		);

		const out = await directusAdapter.content.metroSvg();

		expect(out).toContain('<svg');
		const { pathname } = parseCapturedUrl();
		// Directus file UUIDs are RFC-4122 v4: 8-4-4-4-12 hex
		expect(pathname).toMatch(/^\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	it('throws on non-2xx response with status + statusText in the error', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			new Response('not found', { status: 404, statusText: 'Not Found' }),
		);

		await expect(directusAdapter.content.metroSvg()).rejects.toThrow(/404/);
	});
});

// ---------------------------------------------------------------------------
// projects port (18e Phase 7 — Task 29)
//
// Each port method asserts the captured fetch URL: collection, expected
// fields/filter shape, limit=-1 for "all rows" reads. Two-stage byService
// goes through the projects_services junction first, then projects.
// ---------------------------------------------------------------------------

describe('directusAdapter.projects — fetch contract', () => {
	it('projects.all hits /items/projects with nested fields', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.all();
		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/projects');
		const fields = search.get('fields') ?? '';
		expect(fields).toContain('translations');
		expect(fields).toContain('sections');
		expect(fields).toContain('impact_metrics');
		expect(fields).toContain('services');
		expect(search.get('limit')).toBe('-1');
	});

	it('projects.bySlug filters by id._eq', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.bySlug('yesid-dev');
		const filter = parseCapturedUrl().search.get('filter') ?? '';
		expect(filter).toContain('id');
		expect(filter).toContain('_eq');
		expect(filter).toContain('yesid-dev');
	});

	it('projects.featured filters by featured._eq=true', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.featured();
		const filter = parseCapturedUrl().search.get('filter') ?? '';
		expect(filter).toContain('featured');
		expect(filter).toContain('_eq');
		expect(filter).toContain('true');
	});

	it('projects.public filters by status._eq=published', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.public();
		const filter = parseCapturedUrl().search.get('filter') ?? '';
		expect(filter).toContain('status');
		expect(filter).toContain('_eq');
		expect(filter).toContain('published');
	});

	it('projects.byService runs two-stage: junction + projects', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([{ project_id: 'transit-data-pipeline' }]),
		);
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.byService('sql-development');
		expect(sharedMockFetch).toHaveBeenCalledTimes(2);
		const firstRaw = sharedMockFetch.mock.calls[0][0];
		const firstUrl = typeof firstRaw === 'string' ? new URL(firstRaw) : (firstRaw as URL);
		expect(firstUrl.pathname).toBe('/items/projects_services');
		const firstFilter = firstUrl.searchParams.get('filter') ?? '';
		expect(firstFilter).toContain('service_id');
		expect(firstFilter).toContain('sql-development');
	});

	it('projects.allTags returns unique sorted tags from minimal-fields fetch', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{ tags: ['etl', 'transit'] },
				{ tags: ['portfolio', 'web', 'etl'] },
			]),
		);
		const tags = await directusAdapter.projects.allTags();
		expect(tags).toEqual(['etl', 'portfolio', 'transit', 'web']);
		const fields = parseCapturedUrl().search.get('fields') ?? '';
		expect(fields).toBe('tags');
	});

	it('projects.allStackItems returns unique sorted stack items', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([{ stack: ['SvelteKit', 'TS'] }, { stack: ['TS', 'Vercel'] }]),
		);
		const stack = await directusAdapter.projects.allStackItems();
		expect(stack).toEqual(['SvelteKit', 'TS', 'Vercel']);
	});

	it('projects.serviceIdsForProjects returns unique sorted service ids from junction', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{ service_id: 'sql-development' },
				{ service_id: 'data-pipeline' },
				{ service_id: 'sql-development' },
			]),
		);
		const ids = await directusAdapter.projects.serviceIdsForProjects();
		expect(ids).toEqual(['data-pipeline', 'sql-development']);
		const raw = sharedMockFetch.mock.calls[0][0];
		const url = typeof raw === 'string' ? new URL(raw) : (raw as URL);
		expect(url.pathname).toBe('/items/projects_services');
	});
});

// ---------------------------------------------------------------------------
// services port — regression after M2M switch (18e Phase 7 Task 30)
//
// After the switch, services.byId MUST NOT read relatedProjects from
// row.related_projects (CSV). Instead it issues a second fetch to
// /items/projects_services filtered by service_id.
// ---------------------------------------------------------------------------

describe('directusAdapter.services — regression after M2M switch', () => {
	it('services.byId resolves relatedProjects via projects_services junction', async () => {
		// Stage 1: services fetch returns row WITHOUT related_projects field
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{
					id: 'sql-development',
					station: 1,
					translations: [{ languages_code: 'en', title: 'SQL', description: 'desc' }],
					deliverables: [],
					sections: [],
					// related_projects NOT in row — has been replaced by junction
				},
			]),
		);
		// Stage 2: junction returns project ids
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{ project_id: 'transit-data-pipeline' },
				{ project_id: 'lorem-query-optimizer' },
			]),
		);

		const service = await directusAdapter.services.byId('sql-development');
		expect(service?.relatedProjects).toEqual([
			'transit-data-pipeline',
			'lorem-query-optimizer',
		]);
		// Junction was called once for this service
		const junctionCall = sharedMockFetch.mock.calls.find((call) => {
			const rawUrl = call[0];
			const url = typeof rawUrl === 'string' ? new URL(rawUrl) : (rawUrl as URL);
			return url.pathname === '/items/projects_services';
		});
		expect(junctionCall).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// blog port (slice-18 18f Phase 9 — Task 61)
//
// Each method asserts the captured fetch URL: collection path, expected
// filter shape, sort, and limit. Methods that chain via byCategory (tagsForCategory,
// languagesForCategory) assert at least one call to /items/blog_posts with the
// category filter.
// ---------------------------------------------------------------------------

/** Minimal published blog post row returned by the mock. */
function blogRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'test-post',
		status: 'published',
		date_published: '2026-04-01T00:00:00Z',
		sort: 0,
		lang: 'en',
		category: 'professional',
		tags: ['sql'],
		external: false,
		url: null,
		animation: 'draw',
		cover_image: null,
		svg_illustration: { id: 'pro-database' },
		body: null,
		title: 'Test Post',
		excerpt: 'Test excerpt.',
		...overrides,
	};
}

describe('directusAdapter.blog — fetch contract', () => {
	it('blog.all hits /items/blog_posts filtered by status published, sorted -date_published', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));

		await directusAdapter.blog.all();

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/blog_posts');
		const filter = decodeURIComponent(search.get('filter') ?? '');
		expect(filter).toContain('status');
		expect(filter).toContain('_eq');
		expect(filter).toContain('published');
		expect(decodeURIComponent(search.get('sort') ?? '')).toContain('-date_published');
		expect(search.get('limit')).toBe('-1');
	});

	it('blog.bySlug filters _and[id._eq] AND _and[status._eq=published]', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));

		await directusAdapter.blog.bySlug('my-slug');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/blog_posts');
		const filter = decodeURIComponent(search.get('filter') ?? '');
		expect(filter).toContain('_and');
		expect(filter).toContain('id');
		expect(filter).toContain('my-slug');
		expect(filter).toContain('status');
		expect(filter).toContain('published');
	});

	it('blog.bodyBySlug requests only the body field', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([{ body: null }]));

		await directusAdapter.blog.bodyBySlug('my-slug');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/blog_posts');
		const fields = decodeURIComponent(search.get('fields') ?? '');
		expect(fields).toBe('body');
	});

	it('blog.byCategory filters category._eq AND status._eq=published', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));

		await directusAdapter.blog.byCategory('professional');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/blog_posts');
		const filter = decodeURIComponent(search.get('filter') ?? '');
		expect(filter).toContain('category');
		expect(filter).toContain('professional');
		expect(filter).toContain('status');
		expect(filter).toContain('published');
	});

	it('blog.byTag filters category + status + tags._contains', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));

		await directusAdapter.blog.byTag('professional', 'sql');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/blog_posts');
		const filter = decodeURIComponent(search.get('filter') ?? '');
		expect(filter).toContain('category');
		expect(filter).toContain('professional');
		expect(filter).toContain('status');
		expect(filter).toContain('published');
		expect(filter).toContain('tags');
		expect(filter).toContain('_contains');
		expect(filter).toContain('sql');
	});

	it('blog.tagsForCategory chains via byCategory — hits /items/blog_posts with category filter', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow({ tags: ['sql', 'data'] })]));

		const tags = await directusAdapter.blog.tagsForCategory('professional');

		expect(sharedMockFetch).toHaveBeenCalled();
		const raw = sharedMockFetch.mock.calls[0][0];
		const url = typeof raw === 'string' ? new URL(raw) : (raw as URL);
		expect(url.pathname).toBe('/items/blog_posts');
		const filter = decodeURIComponent(url.searchParams.get('filter') ?? '');
		expect(filter).toContain('professional');
		expect(tags).toContain('sql');
		expect(tags).toContain('data');
	});

	it('blog.languagesForCategory chains via byCategory — hits /items/blog_posts with category filter', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow({ lang: 'en' })]));

		const langs = await directusAdapter.blog.languagesForCategory('professional');

		expect(sharedMockFetch).toHaveBeenCalled();
		const raw = sharedMockFetch.mock.calls[0][0];
		const url = typeof raw === 'string' ? new URL(raw) : (raw as URL);
		expect(url.pathname).toBe('/items/blog_posts');
		const filter = decodeURIComponent(url.searchParams.get('filter') ?? '');
		expect(filter).toContain('professional');
		expect(langs).toContain('en');
	});

	it('blog.latest uses limit=3 and category filter', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow(), blogRow({ id: 'post-2' }), blogRow({ id: 'post-3' })]));

		await directusAdapter.blog.latest(3, 'personal');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/blog_posts');
		expect(search.get('limit')).toBe('3');
		const filter = decodeURIComponent(search.get('filter') ?? '');
		expect(filter).toContain('personal');
		expect(filter).toContain('published');
	});
});

// ---------------------------------------------------------------------------
// content.morphShapes (slice-18 18f Phase 9 — Task 61)
// ---------------------------------------------------------------------------

describe('directusAdapter.content.morphShapes — fetch contract', () => {
	it('hits /items/morph_shapes with sort=sort and limit=-1', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{ id: 'triangle', label: 'Triangle', path: 'M24 8 L40 38 L8 38 Z', viewbox: '0 0 48 48', sort: 0 },
			]),
		);

		await directusAdapter.content.morphShapes();

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/morph_shapes');
		expect(decodeURIComponent(search.get('sort') ?? '')).toContain('sort');
		expect(search.get('limit')).toBe('-1');
	});
});

// ---------------------------------------------------------------------------
// techStack port (slice-18 18g Phase 4 — Task 8+9)
//
// Asserts the Directus REST shape: collection path, fields expansion
// (translations + services + projects junctions), status filter, sort, limit.
// ---------------------------------------------------------------------------

/** Minimal published tech_stack row returned by the mock. */
function techStackRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'postgresql',
		name: 'PostgreSQL',
		icon: 'postgresql.svg',
		status: 'published',
		sort: 0,
		translations: [
			{
				languages_code: 'en',
				what_it_is: { time: 0, version: '2.31.2', blocks: [{ id: 'b1', type: 'paragraph', data: { text: 'RDBMS.' } }] },
				what_i_use_it_for: { time: 0, version: '2.31.2', blocks: [{ id: 'b2', type: 'paragraph', data: { text: 'Queries.' } }] },
				why_i_use_it_instead: { time: 0, version: '2.31.2', blocks: [{ id: 'b3', type: 'paragraph', data: { text: 'ACID.' } }] },
			},
		],
		services: [{ services_id: 'sql-development' }],
		projects: [{ projects_id: 'transit-data-pipeline' }],
		...overrides,
	};
}

describe('directusAdapter.techStack — fetch contract', () => {
	it('techStack.all hits /items/tech_stack with translations + services + projects, status=published, sort=sort, limit=-1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));

		const items = await directusAdapter.techStack.all();

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/tech_stack');
		const fields = decodeURIComponent(search.get('fields') ?? '');
		expect(fields).toContain('translations');
		expect(fields).toContain('services');
		expect(fields).toContain('projects');
		const filter = decodeURIComponent(search.get('filter') ?? '');
		expect(filter).toContain('status');
		expect(filter).toContain('published');
		expect(decodeURIComponent(search.get('sort') ?? '')).toContain('sort');
		expect(search.get('limit')).toBe('-1');
		expect(Array.isArray(items)).toBe(true);
	});

	it('techStack.all maps rows through toTechStackItem — returns TechStackItem[]', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));

		const items = await directusAdapter.techStack.all();

		expect(items).toHaveLength(1);
		expect(items[0].id).toBe('postgresql');
		expect(items[0].what_it_is.en.blocks[0].data).toEqual({ text: 'RDBMS.' });
		expect(items[0].relatedServices).toEqual(['sql-development']);
		expect(items[0].relatedProjects).toEqual(['transit-data-pipeline']);
	});

	it('techStack.byId filters by id._eq and status._eq=published, limit=1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));

		const item = await directusAdapter.techStack.byId('postgresql');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/tech_stack');
		const filter = decodeURIComponent(search.get('filter') ?? '');
		expect(filter).toContain('id');
		expect(filter).toContain('_eq');
		expect(filter).toContain('postgresql');
		expect(filter).toContain('status');
		expect(filter).toContain('published');
		expect(search.get('limit')).toBe('1');
		expect(item?.id).toBe('postgresql');
	});

	it('techStack.byId returns undefined when no row matches', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		const item = await directusAdapter.techStack.byId('unknown-tech');

		expect(item).toBeUndefined();
	});

	it('techStack.content hits /items/tech_stack and returns concatenated HTML string', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));

		const html = await directusAdapter.techStack.content('postgresql');

		expect(typeof html).toBe('string');
		const { pathname } = parseCapturedUrl();
		expect(pathname).toBe('/items/tech_stack');
	});

	it('techStack.content returns empty string when item not found', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		const html = await directusAdapter.techStack.content('ghost-tech');

		expect(html).toBe('');
	});
});
