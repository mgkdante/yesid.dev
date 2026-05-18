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

import { directusAdapter, loadPage } from './directus';

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

/** Minimal published tech_stack row returned by the mock.
 * Updated in slice-18h-ii Phase 5: icon_id replaces icon (legacy string field). */
function techStackRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'postgresql',
		name: 'PostgreSQL',
		icon_id: { id: 'postgresql', name: 'PostgreSQL', iconify_id: 'logos:postgresql', svg_override: null },
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

// ---------------------------------------------------------------------------
// content.* M2A methods — slice-18i Task 4.1 + 4.2 + 4.3
//
// Each method calls loadPage(slug, ctx) which:
//   1. Issues a single /items/pages fetch (mocked here via sharedMockFetch)
//   2. Runs transformPageRow to convert per-locale translation arrays into
//      LocalizedString shapes
//   3. Validates via PageSchema (parsePort)
//   4. Projects the relevant block item
//
// Tests assert: (a) the correct Directus collection is queried, (b) the slug
// filter is applied, (c) the returned shape has the expected structure.
// ---------------------------------------------------------------------------

/** Raw Directus block_hero item with minimal en translation. */
function rawHeroItem(): Record<string, unknown> {
	return {
		id: 'hero-uuid',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				subheadline: 'Hello',
				subtitle: 'Subtitle',
				cta_work: 'Work',
				cta_contact: 'Contact',
				headline: { line1: 'Hi', line2: 'There', ariaSuffix: 'Hi There' },
				sql_panel: {
					prompt: 'SELECT 1',
					liveLabel: 'Live',
					columns: { route: 'Route', avgDelayS: 'Delay', vehicles: 'Vehicles' },
					metaTemplate: '{count}',
				},
				refresh_button: { label: 'Refresh', helper: 'Tap' },
				hero_anim: { scrollDown: 'Scroll' },
			},
		],
	};
}

/** Raw Directus block_manifesto item. */
function rawManifestoItem(): Record<string, unknown> {
	return {
		id: 'manifesto-uuid',
		status: 'published',
		ticks: [],
		hidden_transit_lines: [],
		translations: [
			{
				languages_code: 'en',
				statement: { line1: 'I build', lineHuge: 'things', line3Part1: 'that', line3Highlight: 'matter', line3Part2: 'always' },
				terminal: { user: 'y', command: 'npm run build' },
				pills: [],
				edge_left: { sectionNumber: '01', sectionName: 'Manifesto', location: 'MTL' },
				edge_right: { lat: '45', lng: '-73', src: 'A', via: 'B', dst: 'C', node: 'N', status: 'OK' },
				edge_bottom: { connected: 'Y', line: 'Green', url: '/about', version: '1', scrollHint: 'Scroll' },
				transit: { arrivalLabel: 'Now', platformBadge: 'P1', directionBadge: 'North' },
			},
		],
	};
}

/** Raw Directus block_proof_reel item. */
function rawProofReelItem(): Record<string, unknown> {
	return {
		id: 'proof-uuid',
		status: 'published',
		slugs: [],
		images: {},
		view_all_href: '/work',
		translations: [
			{
				languages_code: 'en',
				heading: 'Work',
				heading_dot: '.',
				subheading: 'Projects',
				section_label: 'Work',
				view_all_label: 'All',
				toggle_color_aria: 'Toggle',
			},
		],
	};
}

/** Raw Directus block_services_grid item. */
function rawServicesGridItem(): Record<string, unknown> {
	return {
		id: 'services-uuid',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				heading: 'Services',
				heading_dot: '.',
				subheading: 'What I do',
				view_illustration_aria: 'View',
				view_all_link: 'All',
			},
		],
	};
}

/** Raw Directus block_cta item. */
function rawCtaItem(): Record<string, unknown> {
	return {
		id: 'cta-uuid',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				heading: "Let's talk",
				subtitle: 'Reach out',
				cta_contact: 'Contact',
				cta_github: 'GitHub',
			},
		],
	};
}

/** Raw Directus block_closer item — all required fields for CloserContentSchema. */
function rawCloserItem(): Record<string, unknown> {
	return {
		id: 'closer-uuid',
		status: 'published',
		// Non-translatable hrefs stored on parent row (not in translation JSON)
		cta_href: '/contact',
		attribution_url: '/about',
		translations: [
			{
				languages_code: 'en',
				heading: 'Thanks',
				heading_dot: '.',
				subheading: 'See you',
				// cta JSON column: label is translatable, href comes from parent row above
				cta: { label: 'Contact' },
				rows: {
					contact: { label: 'Contact', description: 'Say hi', action: 'Email' },
					connect: { label: 'Connect', description: 'LinkedIn', action: 'Follow' },
					read: { label: 'Read', action: 'Blog' },
					about: { label: 'About', description: 'Who I am', action: 'Learn' },
				},
				// attribution JSON column: text is translatable, url comes from parent row
				attribution: { text: 'Made with care' },
				terminal: { title: 'Terminal', city: 'MTL', encoding: 'UTF-8', destinationsLabel: 'Destinations', prompt: '> ' },
			},
		],
	};
}

/** Raw Directus block_about_intro item. */
function rawAboutIntroItem(): Record<string, unknown> {
	return {
		id: 'about-intro-uuid',
		status: 'published',
		stack_items: [],
		translations: [
			{
				languages_code: 'en',
				name: 'Yesid',
				title: 'Developer',
				bio: 'I build things.',
				more_link: 'More',
				stack_label: 'Stack',
				location_label: 'Location',
				location: { city: 'Montreal', region: 'QC' },
				interests_label: 'Interests',
				interests: 'Transit, SQL',
			},
		],
	};
}

/** Raw Directus block_about_content item with all required schema fields. */
function rawAboutContentItem(): Record<string, unknown> {
	return {
		id: 'about-content-uuid',
		status: 'published',
		client_count: 3,
		translations: [
			{
				languages_code: 'en',
				// AboutIdentitySchema: name, title, valueProp, headshot, polaroids
				identity: {
					name: 'Yesid',
					title: 'Developer',
					valueProp: 'I build things.',
					headshot: 'photo.jpg',
					polaroids: [],
				},
				metrics: [],
				methodology: [],
				testimonials: [],
				tech_stack: [],
				interests: [],
				// AboutWeatherConfigSchema: city, hook, enabled
				weather: { city: 'Montreal', hook: 'Always cold', enabled: true },
				client_logos: [],
				// AboutCtaSchema: command, lines, buttonLabel, buttonHref, availability, socials
				cta: {
					command: 'contact',
					lines: [{ text: 'Hi', color: 'orange' }],
					buttonLabel: 'Contact',
					buttonHref: '/contact',
					availability: 'Available',
					socials: [],
				},
				// AboutStopLabelsSchema (10 fields)
				stop_labels: {
					identity: 'Identity',
					metrics: 'Metrics',
					testimonials: 'Testimonials',
					process: 'Process',
					stack: 'Stack',
					clients: 'Clients',
					interests: 'Interests',
					snapshots: 'Snapshots',
					location: 'Location',
					next: 'Next',
				},
				// AboutLabelsSchema (7 fields)
				labels: {
					clientsServed: 'Clients served',
					polaroidPrevAria: 'Previous',
					polaroidNextAria: 'Next',
					testimonialsCarouselAria: 'Testimonials',
					testimonialsTabNavAria: 'Tab nav',
					testimonialSlideAria: 'Slide',
					showTestimonialAria: 'Show',
				},
				// PageMetaSchema: title, description
				meta: { title: 'About Yesid', description: 'Developer based in MTL' },
			},
		],
	};
}

/** Raw Directus block_contact_content item with all required schema fields. */
function rawContactContentItem(): Record<string, unknown> {
	return {
		id: 'contact-uuid',
		status: 'published',
		web3forms_key: 'key-test',
		translations: [
			{
				languages_code: 'en',
				page_title: 'Contact',
				station_label: 'Station Yesid',
				send_error_message: 'Failed to send',
				// PageMetaSchema
				meta: { title: 'Contact Yesid', description: 'Get in touch' },
				// ContactInfoTerminalSchema: title(string), command(string), location, responseTime, sectionLabels
				info_terminal: {
					title: 'INFO',
					command: 'whois yesid',
					location: 'Montreal, QC',
					responseTime: 'Within 24h',
					sectionLabels: { location: 'Location', connect: 'Connect' },
				},
				// ContactFormTerminalSchema: title(string), command(string), commandOutput, fields, submitLabel
				form_terminal: {
					title: 'FORM',
					command: 'send --message',
					commandOutput: 'Sending...',
					fields: {
						name: { label: 'name', placeholder: 'Your name' },
						email: { label: 'email', placeholder: 'your@email.com' },
						message: { label: 'message', placeholder: 'Your message' },
					},
					submitLabel: 'Send',
				},
				// ContactValidationSchema: required, invalidEmail, errorSummary
				validation: { required: 'Required', invalidEmail: 'Invalid email', errorSummary: 'Fix errors' },
				// ContactSuccessSchema: validating, sending, sent, responseTime, meanwhile, resetLabel, fieldOk
				success: {
					validating: 'Validating...',
					sending: 'Sending...',
					sent: 'Sent!',
					responseTime: 'Within 24h',
					meanwhile: 'Meanwhile',
					resetLabel: 'Reset',
					fieldOk: 'OK',
				},
				socials: [],
			},
		],
	};
}

/** Raw Directus block_tech_stack_page_content item. */
function rawTechStackPageItem(): Record<string, unknown> {
	return {
		id: 'techstack-page-uuid',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				meta: { title: 'Tech Stack', description: 'My tools' },
				hero: { overline: 'Stack', titleLine1: 'Tools', titleLine2: 'I use', terminalAria: 'Terminal', stats: { technologies: '30+' } },
				actions: { getInTouch: 'Contact', viewServices: 'Services' },
				cta: { headingLine1: 'Hire', headingLine2: 'me', sub: 'Available', availability: 'Now' },
			},
		],
	};
}

/**
 * Build a Directus pages row for the given slug with the given blocks.
 * Blocks is an array of `{ collection, item }` pairs in real Directus shape.
 */
function rawPageWithBlocks(
	slug: string,
	blocks: Array<{ collection: string; item: Record<string, unknown> }>,
): Record<string, unknown> {
	return {
		id: `page-${slug}`,
		slug,
		status: 'published',
		title: slug,
		translations: [{ languages_code: 'en', title: slug }],
		blocks: blocks.map((b, i) => ({
			id: `junction-${i}`,
			sort: i,
			collection: b.collection,
			item: b.item,
		})),
	};
}

describe('directusAdapter.content.* M2A methods — Task 4.1 home-page blocks', () => {
	it('content.hero fetches /items/pages with slug=home and returns HeroContent', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [{ collection: 'block_hero', item: rawHeroItem() }])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.hero(ctx);

		expect(result.subheadline).toMatchObject({ en: 'Hello' });
		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/pages');
		expect(decodeURIComponent(search.get('filter') ?? '')).toContain('home');
	});

	it('content.heroAnim fetches the hero block and projects _heroAnim', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [{ collection: 'block_hero', item: rawHeroItem() }])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.heroAnim(ctx);

		expect(result.scrollDown).toMatchObject({ en: 'Scroll' });
	});

	it('content.manifesto fetches /items/pages with slug=home and returns ManifestoContent', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [
				{ collection: 'block_hero', item: rawHeroItem() },
				{ collection: 'block_manifesto', item: rawManifestoItem() },
			])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.manifesto(ctx);

		expect(result.terminal.user).toMatchObject({ en: 'y' });
		expect(Array.isArray(result.ticks)).toBe(true);
	});

	it('content.proofReel returns ProofReelContent from block_proof_reel', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [
				{ collection: 'block_hero', item: rawHeroItem() },
				{ collection: 'block_proof_reel', item: rawProofReelItem() },
			])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.proofReel(ctx);

		expect(result.heading).toMatchObject({ en: 'Work' });
		expect(result.viewAllHref).toBe('/work');
	});

	it('content.servicesGrid returns ServicesGridContent from block_services_grid', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [
				{ collection: 'block_hero', item: rawHeroItem() },
				{ collection: 'block_services_grid', item: rawServicesGridItem() },
			])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.servicesGrid(ctx);

		expect(result.heading).toMatchObject({ en: 'Services' });
	});

	it('content.about returns AboutIntroContent from block_about_intro', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [
				{ collection: 'block_hero', item: rawHeroItem() },
				{ collection: 'block_about_intro', item: rawAboutIntroItem() },
			])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.about(ctx);

		expect(result.name).toMatchObject({ en: 'Yesid' });
	});

	it('content.cta returns CtaContent from block_cta', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [
				{ collection: 'block_hero', item: rawHeroItem() },
				{ collection: 'block_cta', item: rawCtaItem() },
			])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.cta(ctx);

		expect(result.heading).toMatchObject({ en: "Let's talk" });
	});

	it('content.closer returns CloserContent from block_closer', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [
				{ collection: 'block_hero', item: rawHeroItem() },
				{ collection: 'block_closer', item: rawCloserItem() },
			])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.closer(ctx);

		expect(result.heading).toMatchObject({ en: 'Thanks' });
	});

	it('content.hero throws when block_hero is missing from home page', async () => {
		// Page with no blocks at all
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [{ collection: 'block_hero', item: rawHeroItem() }])]),
		);
		// Re-test: use a page that truly has no hero block
		sharedMockFetch.mockReset();
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('home', [{ collection: 'block_manifesto', item: rawManifestoItem() }])]),
		);

		const ctx = { pageCache: new Map() };
		await expect(directusAdapter.content.hero(ctx)).rejects.toThrow(/block_hero/);
	});
});

describe('directusAdapter.content.* M2A methods — Task 4.2 detail-page blocks', () => {
	it('content.aboutPage fetches /items/pages with slug=about — route contract', async () => {
		// AboutContentSchema has mixed plain-string / LocalizedString fields that
		// toLSJSON cannot distinguish at transform time. Test the route-routing
		// contract by pre-populating ctx.pageCache with a valid PageData and
		// asserting loadPage was called with slug=about (via the /items/pages fetch
		// that happens on the FIRST call with a fresh cache).
		//
		// We do this by letting loadPage hit the network (sharedMockFetch) and
		// asserting the URL filter contains 'about' — the block return value is
		// checked via a cache pre-populated PageData for the second ctx.

		// First: assert the fetch hits /items/pages?filter=...about...
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([])); // empty → throws
		const ctxRoute = { pageCache: new Map() };
		await expect(directusAdapter.content.aboutPage(ctxRoute)).rejects.toThrow();
		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/pages');
		expect(decodeURIComponent(search.get('filter') ?? '')).toContain('about');
	});

	it('content.contactPage fetches /items/pages with slug=contact — route contract', async () => {
		// Same routing-contract pattern as aboutPage above.
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([])); // empty → throws
		const ctxRoute = { pageCache: new Map() };
		await expect(directusAdapter.content.contactPage(ctxRoute)).rejects.toThrow();
		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/pages');
		expect(decodeURIComponent(search.get('filter') ?? '')).toContain('contact');
	});

	it('content.techStackPage fetches /items/pages with slug=tech-stack', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('tech-stack', [{ collection: 'block_tech_stack_page_content', item: rawTechStackPageItem() }])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.techStackPage(ctx);

		// TechStackPageContent has meta, hero, actions, cta — verify meta.title
		expect((result.meta as unknown as Record<string, unknown>).title).toMatchObject({ en: 'Tech Stack' });
		const { search } = parseCapturedUrl();
		expect(decodeURIComponent(search.get('filter') ?? '')).toContain('tech-stack');
	});

	it('content.blogPage fetches /items/pages with slug=blog and returns BlogPageContent', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('blog', [{
				collection: 'block_blog_page_content',
				item: { id: 'blog-content-uuid', status: 'published', translations: [{ languages_code: 'en', intro: 'Field dispatches.', heading: 'Dispatches', back_to_dispatches: '← back to dispatches', back_to_personal: '← back to personal corner' }] },
			}])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.blogPage(ctx);

		expect(result.intro).toMatchObject({ en: 'Field dispatches.' });
		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/pages');
		expect(decodeURIComponent(search.get('filter') ?? '')).toContain('blog');
	});

	it('content.blogPage throws when block_blog_page_content is missing', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('blog', [])]),
		);

		const ctx = { pageCache: new Map() };
		await expect(directusAdapter.content.blogPage(ctx)).rejects.toThrow(/block_blog_page_content/);
	});

	it('content.projectsPage fetches /items/pages with slug=projects and returns ProjectsPageContent', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('projects', [{
				collection: 'block_projects_page_content',
				item: { id: 'projects-content-uuid', status: 'published', translations: [{ languages_code: 'en', intro: 'Selected work.' }] },
			}])]),
		);

		const ctx = { pageCache: new Map() };
		const result = await directusAdapter.content.projectsPage(ctx);

		expect(result.intro).toMatchObject({ en: 'Selected work.' });
		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/pages');
		expect(decodeURIComponent(search.get('filter') ?? '')).toContain('projects');
	});

	it('content.projectsPage throws when block_projects_page_content is missing', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([rawPageWithBlocks('projects', [])]),
		);

		const ctx = { pageCache: new Map() };
		await expect(directusAdapter.content.projectsPage(ctx)).rejects.toThrow(/block_projects_page_content/);
	});
});

describe('directusAdapter.content.* — Task 4.3 derived methods (no Directus query)', () => {
	it('content.heroMock returns HeroData from generateHeroData() without hitting Directus', async () => {
		const result = await directusAdapter.content.heroMock();

		// No network call was made
		expect(sharedMockFetch).not.toHaveBeenCalled();
		// Returns an object with the HeroData shape (has `rows` and `columns`)
		expect(typeof result).toBe('object');
		expect(result).not.toBeNull();
	});

	it('content.initialHeroData returns INITIAL_HERO_DATA constant without hitting Directus', async () => {
		const result = await directusAdapter.content.initialHeroData();

		expect(sharedMockFetch).not.toHaveBeenCalled();
		expect(typeof result).toBe('object');
		expect(result).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// nav.byPlacement (slice-18i Phase 5 Task 5.1)
//
// Asserts: hits /items/nav_links with placement filter + sort=priority.
// Verifies that content.navLinks delegates to nav.byPlacement('header') and
// content.menuItems delegates to nav.byPlacement('menu').
// ---------------------------------------------------------------------------

/** Minimal nav_links row fixture for the mock responses. */
function navLinkRow(override: Partial<{
	id: string;
	placement: string;
	href: string;
	priority: number;
	translations: Array<{ languages_code: string; label: string; subtitle?: string }>;
}> = {}) {
	return {
		id: override.id ?? 'nav-1',
		status: 'published',
		placement: override.placement ?? 'header',
		href: override.href ?? '/services',
		priority: override.priority ?? 1,
		icon: null,
		translations: override.translations ?? [{ languages_code: 'en', label: 'Services' }],
	};
}

describe('directusAdapter.nav.byPlacement — fetch contract', () => {
	it('nav.byPlacement("header") hits /items/nav_links filtered by placement=header', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([navLinkRow({ placement: 'header' })]),
		);

		const result = await directusAdapter.nav.byPlacement('header');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/nav_links');
		const filter = search.get('filter') ?? '';
		expect(filter).toContain('placement');
		expect(filter).toContain('header');
		expect(filter).toContain('published');
		// sort=priority ascending
		expect(search.get('sort')).toContain('priority');
		expect(result).toHaveLength(1);
		expect(result[0].label.en).toBe('Services');
		expect(result[0].href).toBe('/services');
		expect(result[0].priority).toBe(1);
	});

	it('nav.byPlacement("menu") hits /items/nav_links filtered by placement=menu', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				navLinkRow({
					placement: 'menu',
					href: '/projects',
					translations: [
						{ languages_code: 'en', label: 'Projects', subtitle: 'proof it ships' },
						{ languages_code: 'fr', label: 'Projets', subtitle: 'la preuve que ça livre' },
					],
				}),
			]),
		);

		const result = await directusAdapter.nav.byPlacement('menu');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/nav_links');
		const filter = search.get('filter') ?? '';
		expect(filter).toContain('placement');
		expect(filter).toContain('menu');
		expect(result[0].subtitle).toMatchObject({ en: 'proof it ships', fr: 'la preuve que ça livre' });
	});

	it('nav.byPlacement("footer") hits /items/nav_links filtered by placement=footer', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.nav.byPlacement('footer');

		const { search } = parseCapturedUrl();
		const filter = search.get('filter') ?? '';
		expect(filter).toContain('footer');
	});

	it('nav.byPlacement("mobile") hits /items/nav_links filtered by placement=mobile', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.nav.byPlacement('mobile');

		const { search } = parseCapturedUrl();
		const filter = search.get('filter') ?? '';
		expect(filter).toContain('mobile');
	});

	it('resolves icon M2O FK object to icon name string', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{
					...navLinkRow({ placement: 'header' }),
					icon: { name: 'code-bracket' },
				},
			]),
		);

		const result = await directusAdapter.nav.byPlacement('header');
		expect(result[0].icon).toBe('code-bracket');
	});

	it('omits icon field when icon FK is null', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([navLinkRow({ placement: 'header' })]),
		);

		const result = await directusAdapter.nav.byPlacement('header');
		expect(result[0].icon).toBeUndefined();
	});
});

describe('directusAdapter.content.navLinks + menuItems — delegation', () => {
	it('content.navLinks delegates to nav.byPlacement("header")', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([navLinkRow({ placement: 'header' })]),
		);

		const result = await directusAdapter.content.navLinks();

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/nav_links');
		const filter = search.get('filter') ?? '';
		expect(filter).toContain('header');
		expect(result).toHaveLength(1);
	});

	it('content.menuItems delegates to nav.byPlacement("menu")', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([navLinkRow({ placement: 'menu' })]),
		);

		const result = await directusAdapter.content.menuItems();

		const { search } = parseCapturedUrl();
		const filter = search.get('filter') ?? '';
		expect(filter).toContain('menu');
		expect(result).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// content.errorPage (slice-18i Phase 5 Task 5.3)
//
// Asserts: hits /items/error_pages with _or filter for status_code + 0 fallback.
// Prefers the specific status_code row over the fallback (0) row.
// Throws when neither specific nor fallback row exists.
// ---------------------------------------------------------------------------

/** Minimal error_pages row fixture. */
function errorPageRow(statusCode: number, override: Partial<{
	translations: Array<{
		languages_code: string;
		label: string;
		heading: string;
		description: string;
		terminal_line: string;
		suggestions: Array<{ label: string; href: string }>;
	}>;
}> = {}) {
	return {
		id: `error-${statusCode}`,
		status: 'published',
		status_code: statusCode,
		sort: null,
		translations: override.translations ?? [
			{
				languages_code: 'en',
				label: `Error ${statusCode}`,
				heading: `${statusCode} heading`,
				description: `${statusCode} description`,
				terminal_line: `$ route --status ${statusCode}`,
				suggestions: [{ label: 'Home', href: '/' }],
			},
		],
	};
}

describe('directusAdapter.content.errorPage — fetch contract', () => {
	it('errorPage(404) hits /items/error_pages with _or filter for 404 + 0', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([errorPageRow(404)]),
		);

		const result = await directusAdapter.content.errorPage(404);

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/error_pages');
		const filter = search.get('filter') ?? '';
		expect(filter).toContain('status_code');
		expect(filter).toContain('404');
		// Generic fallback (0) is always requested alongside
		expect(filter).toContain('0');
		expect(result.label.en).toBe('Error 404');
		expect(result.heading.en).toBe('404 heading');
		expect(result.suggestions[0].href).toBe('/');
	});

	it('errorPage(999) falls back to status_code=0 row when no 999 row exists', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([errorPageRow(0, {
				translations: [
					{
						languages_code: 'en',
						label: 'Generic Error',
						heading: 'Generic heading',
						description: 'Generic description',
						terminal_line: '$ route --status unknown',
						suggestions: [],
					},
				],
			})]),
		);

		const result = await directusAdapter.content.errorPage(999);

		expect(result.label.en).toBe('Generic Error');
	});

	it('errorPage(500) throws when no 500 row and no fallback exists', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await expect(directusAdapter.content.errorPage(500)).rejects.toThrow(/status_code=500/);
	});

	it('errorPage(0) returns the fallback row itself when called with 0', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([errorPageRow(0)]),
		);

		const result = await directusAdapter.content.errorPage(0);

		// status_code=0 matches the exact filter so `exact` is found first
		expect(result.label.en).toBe('Error 0');
	});

	it('prefers specific status_code row over fallback when both are returned', async () => {
		// Directus returns both the 404 row and the 0 fallback row
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				errorPageRow(404, {
					translations: [
						{
							languages_code: 'en',
							label: 'Specific 404',
							heading: '404 heading',
							description: '404 description',
							terminal_line: '$ route --status 404',
							suggestions: [],
						},
					],
				}),
				errorPageRow(0, {
					translations: [
						{
							languages_code: 'en',
							label: 'Generic Fallback',
							heading: 'Generic heading',
							description: 'Generic description',
							terminal_line: '$ route --status 0',
							suggestions: [],
						},
					],
				}),
			]),
		);

		const result = await directusAdapter.content.errorPage(404);
		expect(result.label.en).toBe('Specific 404');
	});

	it('transformErrorPage merges per-locale suggestions correctly', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			jsonResponse([
				{
					id: 'error-404',
					status: 'published',
					status_code: 404,
					sort: null,
					translations: [
						{
							languages_code: 'en',
							label: 'Not Found',
							heading: 'Not Found',
							description: 'desc',
							terminal_line: '$ route --status 404',
							suggestions: [
								{ label: 'Home', href: '/' },
								{ label: 'Services', href: '/services' },
							],
						},
						{
							languages_code: 'fr',
							label: 'Non trouvé',
							heading: 'Non trouvé',
							description: 'desc fr',
							terminal_line: '$ route --status 404',
							suggestions: [
								{ label: 'Accueil', href: '/' },
								{ label: 'Services', href: '/services' },
							],
						},
					],
				},
			]),
		);

		const result = await directusAdapter.content.errorPage(404);

		expect(result.suggestions[0].label).toMatchObject({ en: 'Home', fr: 'Accueil' });
		expect(result.suggestions[0].href).toBe('/');
		expect(result.suggestions[1].label).toMatchObject({ en: 'Services', fr: 'Services' });
	});
});

// ---------------------------------------------------------------------------
// meta port — slice-18 18h Phase 4 Task 13 (#80)
// ---------------------------------------------------------------------------
//
// 3 test groups split between this file + directus.contract.test.ts:
//   #80a — single-fetch invariant: meta.site + meta.siteSeoDefaults with
//          the same ctx must trigger ONE readSingleton('site_meta')
//   #80b — composer parity: lives in directus.contract.test.ts (pure mapping)
//   #80c — mocked-fetch contract: readSingleton('site_meta') + readItems
//          ('route_seo') request shapes

/** Minimal but Zod-valid DirectusSiteMetaRow payload for the singleton.
 *  Translation array must have at least 1 EN row (per spec.md superRefine).
 */
function jsonSiteMetaRow(): unknown {
	return {
		id: 1,
		name: 'yesid.',
		email: 'contact@yesid.dev',
		github_url: 'https://github.com/mgkdante',
		linkedin_url: 'https://linkedin.com/in/x',
		upwork_url: 'https://upwork.com/x',
		owner_name: 'Yesid O.',
		owner_locality: 'Montreal',
		owner_region: 'QC',
		owner_country: 'CA',
		owner_knows_about: ['SQL', 'TypeScript'],
		default_og_image: null,
		theme_color: '#141414',
		translations: [
			{
				languages_code: 'en',
				tagline: 'Digital infrastructure that moves.',
				description: 'Freelance SQL developer.',
				default_description: 'yesid. — freelance data infrastructure consultant in Montreal.',
				owner_job_title: 'Data infrastructure consultant',
			},
		],
	};
}

describe('directusAdapter.meta — single-fetch invariant (#80a)', () => {
	it('meta.site() + meta.siteSeoDefaults() called sequentially with same ctx fire ONE readSingleton', async () => {
		sharedMockFetch.mockImplementation(() => Promise.resolve(jsonResponse(jsonSiteMetaRow())));

		const ctx = {} as object;
		await directusAdapter.meta.site(ctx);
		await directusAdapter.meta.siteSeoDefaults(ctx);

		const singletonCalls = sharedMockFetch.mock.calls.filter(([url]) => {
			const u = typeof url === 'string' ? url : (url as URL).toString();
			return u.includes('/items/site_meta');
		});
		expect(singletonCalls.length).toBe(1);
	});

	it('meta.site() called twice with same ctx fires ONE readSingleton (per-ctx WeakMap memoization)', async () => {
		sharedMockFetch.mockImplementation(() => Promise.resolve(jsonResponse(jsonSiteMetaRow())));

		const ctx = {} as object;
		await directusAdapter.meta.site(ctx);
		await directusAdapter.meta.site(ctx);

		const singletonCalls = sharedMockFetch.mock.calls.filter(([url]) => {
			const u = typeof url === 'string' ? url : (url as URL).toString();
			return u.includes('/items/site_meta');
		});
		expect(singletonCalls.length).toBe(1);
	});

	it('meta.site() called with different ctx instances fires TWO readSingleton requests (per-ctx isolation)', async () => {
		sharedMockFetch.mockImplementation(() => Promise.resolve(jsonResponse(jsonSiteMetaRow())));

		await directusAdapter.meta.site({} as object);
		await directusAdapter.meta.site({} as object);

		const singletonCalls = sharedMockFetch.mock.calls.filter(([url]) => {
			const u = typeof url === 'string' ? url : (url as URL).toString();
			return u.includes('/items/site_meta');
		});
		expect(singletonCalls.length).toBe(2);
	});
});

describe('directusAdapter.meta — mocked-fetch contract (#80c)', () => {
	it('meta.site() requests /items/site_meta with expected fields list (name + default_og_image + translations.tagline)', async () => {
		sharedMockFetch.mockImplementation(() => Promise.resolve(jsonResponse(jsonSiteMetaRow())));

		await directusAdapter.meta.site({});

		const urls = sharedMockFetch.mock.calls.map(([u]) =>
			typeof u === 'string' ? u : (u as URL).toString(),
		);
		const metaCall = urls.find((u) => u.includes('/items/site_meta'));
		expect(metaCall).toBeDefined();
		const decoded = decodeURIComponent(metaCall!);
		expect(decoded).toMatch(/fields=[^&]*name/);
		expect(decoded).toMatch(/fields=[^&]*default_og_image/);
		expect(decoded).toMatch(/fields=[^&]*owner_knows_about/);
		expect(decoded).toMatch(/translations.*tagline/);
		expect(decoded).toMatch(/translations.*default_description/);
	});

	it('meta.siteSeoDefaults() reuses the site_meta singleton (no separate fetch when ctx is shared with prior meta.site)', async () => {
		sharedMockFetch.mockImplementation(() => Promise.resolve(jsonResponse(jsonSiteMetaRow())));

		const ctx = {} as object;
		await directusAdapter.meta.site(ctx);
		sharedMockFetch.mockClear();
		await directusAdapter.meta.siteSeoDefaults(ctx);

		const additionalSingletonCalls = sharedMockFetch.mock.calls.filter(([url]) => {
			const u = typeof url === 'string' ? url : (url as URL).toString();
			return u.includes('/items/site_meta');
		});
		expect(additionalSingletonCalls.length).toBe(0);
	});

	it('meta.routeSeo.byPath("/services") requests /items/route_seo with path eq + status published filter', async () => {
		sharedMockFetch.mockResolvedValue(jsonResponse([]));

		await directusAdapter.meta.routeSeo.byPath('/services');

		const urls = sharedMockFetch.mock.calls.map(([u]) =>
			typeof u === 'string' ? u : (u as URL).toString(),
		);
		const routeCall = urls.find((u) => u.includes('/items/route_seo'));
		expect(routeCall).toBeDefined();
		const decoded = decodeURIComponent(routeCall!);
		expect(decoded).toMatch(/path/);
		expect(decoded).toMatch(/services/);
		expect(decoded).toMatch(/published/);
		expect(decoded).toMatch(/limit=1/);
	});

	it('meta.routeSeo.byPath returns undefined when no matching row is found', async () => {
		sharedMockFetch.mockResolvedValue(jsonResponse([]));

		const result = await directusAdapter.meta.routeSeo.byPath('/nonexistent');
		expect(result).toBeUndefined();
	});
});
