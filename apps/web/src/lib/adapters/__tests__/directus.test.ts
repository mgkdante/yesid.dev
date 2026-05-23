// Mocked-fetch contract tests for the Directus adapter.
//
// Migrated from `adapters/directus.mocked.test.ts` (1,482 LOC) in slice-17f
// Task 5.1. Uses the L2 helper library (jsonResponse, assertFetchPath,
// assertFilterContains, assertFetchUrl, parseCapturedUrl, seedFetchResponses)
// to replace ~400 LOC of inline URL parsing + assertion boilerplate.
//
// Scope: assert every port method issues the EXPECTED Directus REST request —
// correct collection, expanded translations, expected filter shape, limit=-1
// when we want "all rows", etc. The live cms.yesid.dev is NEVER hit; every
// request is captured via a stubbed fetch injected through the queue module.
//
// Pattern (the vi.mock boilerplate below STAYS per file — vi.mock is hoisted
// and cannot be wrapped in a runtime function; see slice-17f Phase 0 finding):
//   1. vi.unmock the subject under test
//   2. vi.mock the queue module to return sharedMockFetch
//   3. vi.mock $env/dynamic/public for PUBLIC_DIRECTUS_URL
//   4. beforeEach reset the mock
//   5. Tests seed responses + call port methods + assert via L2 helpers

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/adapters/directus');

const sharedMockFetch = vi.fn();
vi.mock('../directus-queue', () => ({ createQueuedFetch: () => sharedMockFetch }));
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' } }));

import { directusAdapter } from '../directus';
import {
	jsonResponse,
	assertFetchPath,
	assertFilterContains,
	assertFetchUrl,
	parseCapturedUrl,
	seedFetchResponses,
} from '../../../tests/mocks/directus';

beforeEach(() => sharedMockFetch.mockReset());

// ---------------------------------------------------------------------------
// File-specific raw-Directus-row helpers
//
// These are NOT domain factories — they're hand-built minimal valid Directus
// REST response shapes that exercise the adapter's parse + transform code.
// L1 factories produce DOMAIN objects (post-parse); these produce the
// Directus envelope (pre-parse) and stay file-local.
// ---------------------------------------------------------------------------

const blogRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
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
});

const techStackRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
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
});

const navLinkRow = (override: Partial<{
	id: string;
	placement: string;
	href: string;
	priority: number;
	translations: Array<{ languages_code: string; label: string; subtitle?: string }>;
}> = {}) => ({
	id: override.id ?? 'nav-1',
	status: 'published',
	placement: override.placement ?? 'header',
	href: override.href ?? '/services',
	priority: override.priority ?? 1,
	icon: null,
	translations: override.translations ?? [{ languages_code: 'en', label: 'Services' }],
});

const errorPageRow = (statusCode: number, override: Partial<{
	translations: Array<{
		languages_code: string;
		label: string;
		heading: string;
		description: string;
		terminal_line: string;
		suggestions: Array<{ label: string; href: string }>;
	}>;
}> = {}) => ({
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
});

// Raw block items used by content.* M2A method tests. Each is the minimum
// valid Directus shape for its corresponding @repo/shared block schema.
const rawHeroItem = (): Record<string, unknown> => ({
	id: 'hero-uuid',
	status: 'published',
	translations: [{
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
	}],
});

const rawManifestoItem = (): Record<string, unknown> => ({
	id: 'manifesto-uuid',
	status: 'published',
	ticks: [],
	hidden_transit_lines: [],
	translations: [{
		languages_code: 'en',
		statement: { line1: 'I build', lineHuge: 'things', line3Part1: 'that', line3Highlight: 'matter', line3Part2: 'always' },
		terminal: { user: 'y', command: 'npm run build' },
		pills: [],
		edge_left: { sectionNumber: '01', sectionName: 'Manifesto', location: 'MTL' },
		edge_right: { lat: '45', lng: '-73', src: 'A', via: 'B', dst: 'C', node: 'N', status: 'OK' },
		edge_bottom: { connected: 'Y', line: 'Green', url: '/about', version: '1', scrollHint: 'Scroll' },
		transit: { arrivalLabel: 'Now', platformBadge: 'P1', directionBadge: 'North' },
	}],
});

const rawProofReelItem = (): Record<string, unknown> => ({
	id: 'proof-uuid',
	status: 'published',
	slugs: [],
	images: {},
	view_all_href: '/work',
	translations: [{
		languages_code: 'en',
		heading: 'Work', heading_dot: '.', subheading: 'Projects',
		section_label: 'Work', view_all_label: 'All', toggle_color_aria: 'Toggle',
	}],
});

const rawServicesGridItem = (): Record<string, unknown> => ({
	id: 'services-uuid',
	status: 'published',
	translations: [{
		languages_code: 'en',
		heading: 'Services', heading_dot: '.', subheading: 'What I do',
		view_illustration_aria: 'View', view_all_link: 'All',
	}],
});

const rawCtaItem = (): Record<string, unknown> => ({
	id: 'cta-uuid',
	status: 'published',
	translations: [{
		languages_code: 'en',
		heading: "Let's talk", subtitle: 'Reach out',
		cta_contact: 'Contact', cta_github: 'GitHub',
	}],
});

const rawCloserItem = (): Record<string, unknown> => ({
	id: 'closer-uuid',
	status: 'published',
	cta_href: '/contact',
	attribution_url: '/about',
	translations: [{
		languages_code: 'en',
		heading: 'Thanks', heading_dot: '.', subheading: 'See you',
		cta: { label: 'Contact' },
		rows: {
			contact: { label: 'Contact', description: 'Say hi', action: 'Email' },
			connect: { label: 'Connect', description: 'LinkedIn', action: 'Follow' },
			read: { label: 'Read', action: 'Blog' },
			about: { label: 'About', description: 'Who I am', action: 'Learn' },
		},
		attribution: { text: 'Made with care' },
		terminal: { title: 'Terminal', city: 'MTL', encoding: 'UTF-8', destinationsLabel: 'Destinations', prompt: '> ' },
	}],
});

const rawAboutIntroItem = (): Record<string, unknown> => ({
	id: 'about-intro-uuid',
	status: 'published',
	stack_items: [],
	translations: [{
		languages_code: 'en',
		name: 'Yesid', title: 'Developer', bio: 'I build things.',
		more_link: 'More', stack_label: 'Stack', location_label: 'Location',
		location: { city: 'Montreal', region: 'QC' },
		interests_label: 'Interests', interests: 'Transit, SQL',
	}],
});

const rawTechStackPageItem = (): Record<string, unknown> => ({
	id: 'techstack-page-uuid',
	status: 'published',
	translations: [{
		languages_code: 'en',
		meta: { title: 'Tech Stack', description: 'My tools' },
		hero: { overline: 'Stack', titleLine1: 'Tools', titleLine2: 'I use', terminalAria: 'Terminal', stats: { technologies: '30+' } },
		actions: { getInTouch: 'Contact', viewServices: 'Services' },
		cta: { headingLine1: 'Hire', headingLine2: 'me', sub: 'Available', availability: 'Now' },
	}],
});

const rawPageWithBlocks = (
	slug: string,
	blocks: Array<{ collection: string; item: Record<string, unknown> }>,
): Record<string, unknown> => ({
	id: `page-${slug}`,
	slug,
	status: 'published',
	title: slug,
	translations: [{ languages_code: 'en', title: slug }],
	blocks: blocks.map((b, i) => ({ id: `junction-${i}`, sort: i, collection: b.collection, item: b.item })),
});

// ---------------------------------------------------------------------------
// services port — fetch contract
// ---------------------------------------------------------------------------

describe('directusAdapter.services — fetch contract', () => {
	it('services.all hits /items/services with deep translations expansion + limit=-1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.services.all();
		const { pathname, search } = parseCapturedUrl(sharedMockFetch);
		expect(pathname).toBe('/items/services');
		const fields = search.get('fields') ?? '';
		expect(fields).toContain('*');
		expect(fields).toContain('translations');
		expect(fields).toContain('deliverables');
		expect(fields).toContain('sections');
		expect(search.get('limit')).toBe('-1');
	});

	it('services.byId filters by id._eq', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.services.byId('sql-development');
		assertFetchPath(sharedMockFetch, '/items/services');
		assertFilterContains(sharedMockFetch, 'id', '_eq', 'sql-development');
	});

	it('services.visible filters visible._neq=false (captures nullable column)', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.services.visible();
		assertFilterContains(sharedMockFetch, 'visible', '_neq', 'false');
	});
});

// ---------------------------------------------------------------------------
// content.metroSvg
// ---------------------------------------------------------------------------

describe('directusAdapter.content.metroSvg — fetch contract', () => {
	it('hits /assets/<uuid> for the montreal-metro svg id', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
				status: 200, headers: { 'content-type': 'image/svg+xml' },
			}),
		);
		const out = await directusAdapter.content.metroSvg();
		expect(out).toContain('<svg');
		assertFetchPath(
			sharedMockFetch,
			/^\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
	});

	it('throws on non-2xx response with status in the error', async () => {
		sharedMockFetch.mockResolvedValueOnce(new Response('not found', { status: 404, statusText: 'Not Found' }));
		await expect(directusAdapter.content.metroSvg()).rejects.toThrow(/404/);
	});
});

// ---------------------------------------------------------------------------
// projects port
// ---------------------------------------------------------------------------

describe('directusAdapter.projects — fetch contract', () => {
	it('projects.all hits /items/projects with nested fields + limit=-1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.all();
		const { pathname, search } = parseCapturedUrl(sharedMockFetch);
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
		assertFilterContains(sharedMockFetch, 'id', '_eq', 'yesid-dev');
	});

	it('projects.featured filters by featured._eq=true', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.featured();
		assertFilterContains(sharedMockFetch, 'featured', '_eq', 'true');
	});

	it('projects.public filters by status._eq=published', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.projects.public();
		assertFilterContains(sharedMockFetch, 'status', '_eq', 'published');
	});

	it('projects.byService runs two-stage: junction + projects', async () => {
		seedFetchResponses(sharedMockFetch, [
			[{ project_id: 'transit-data-pipeline' }],
			[],
		]);
		await directusAdapter.projects.byService('sql-development');
		expect(sharedMockFetch).toHaveBeenCalledTimes(2);
		// First call is the junction lookup
		const firstRaw = sharedMockFetch.mock.calls[0][0];
		const firstUrl = typeof firstRaw === 'string' ? new URL(firstRaw) : (firstRaw as URL);
		expect(firstUrl.pathname).toBe('/items/projects_services');
		const firstFilter = firstUrl.searchParams.get('filter') ?? '';
		expect(firstFilter).toContain('service_id');
		expect(firstFilter).toContain('sql-development');
	});

	it('projects.allTags returns unique sorted tags from minimal-fields fetch', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([
			{ tags: ['etl', 'transit'] },
			{ tags: ['portfolio', 'web', 'etl'] },
		]));
		const tags = await directusAdapter.projects.allTags();
		expect(tags).toEqual(['etl', 'portfolio', 'transit', 'web']);
		assertFetchUrl(sharedMockFetch, '/items/projects', { fields: 'tags' });
	});

	it('projects.allStackItems returns unique sorted stack items', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([
			{ stack: ['SvelteKit', 'TS'] },
			{ stack: ['TS', 'Vercel'] },
		]));
		const stack = await directusAdapter.projects.allStackItems();
		expect(stack).toEqual(['SvelteKit', 'TS', 'Vercel']);
	});

	it('projects.serviceIdsForProjects returns unique sorted service ids from junction', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([
			{ service_id: 'sql-development' },
			{ service_id: 'data-pipeline' },
			{ service_id: 'sql-development' },
		]));
		const ids = await directusAdapter.projects.serviceIdsForProjects();
		expect(ids).toEqual(['data-pipeline', 'sql-development']);
		assertFetchPath(sharedMockFetch, '/items/projects_services');
	});
});

// ---------------------------------------------------------------------------
// services — regression after M2M switch
// ---------------------------------------------------------------------------

describe('directusAdapter.services — regression after M2M switch', () => {
	it('services.byId resolves relatedProjects via projects_services junction', async () => {
		seedFetchResponses(sharedMockFetch, [
			[{
				id: 'sql-development',
				station: 1,
				translations: [{ languages_code: 'en', title: 'SQL', description: 'desc' }],
				deliverables: [],
				sections: [],
			}],
			[
				{ project_id: 'transit-data-pipeline' },
				{ project_id: 'lorem-query-optimizer' },
			],
		]);
		const service = await directusAdapter.services.byId('sql-development');
		expect(service?.relatedProjects).toEqual([
			'transit-data-pipeline', 'lorem-query-optimizer',
		]);
		const junctionCall = sharedMockFetch.mock.calls.find((call) => {
			const rawUrl = call[0];
			const url = typeof rawUrl === 'string' ? new URL(rawUrl) : (rawUrl as URL);
			return url.pathname === '/items/projects_services';
		});
		expect(junctionCall).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// blog port
// ---------------------------------------------------------------------------

describe('directusAdapter.blog — fetch contract', () => {
	it('blog.all filtered by status=published, sorted -date_published, limit=-1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));
		await directusAdapter.blog.all();
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		assertFilterContains(sharedMockFetch, 'status', '_eq', 'published');
		const { search } = parseCapturedUrl(sharedMockFetch);
		expect(decodeURIComponent(search.get('sort') ?? '')).toContain('-date_published');
		expect(search.get('limit')).toBe('-1');
	});

	it('blog.bySlug filters _and[id._eq] AND _and[status._eq=published]', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));
		await directusAdapter.blog.bySlug('my-slug');
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		assertFilterContains(sharedMockFetch, '_and', 'id', 'my-slug', 'status', 'published');
	});

	it('blog.bodyBySlug requests only the body field', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([{ body: null }]));
		await directusAdapter.blog.bodyBySlug('my-slug');
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		const { search } = parseCapturedUrl(sharedMockFetch);
		expect(decodeURIComponent(search.get('fields') ?? '')).toBe('body');
	});

	it('blog.byCategory filters category._eq AND status._eq=published', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));
		await directusAdapter.blog.byCategory('professional');
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		assertFilterContains(sharedMockFetch, 'category', 'professional', 'status', 'published');
	});

	it('blog.byTag filters category + status + tags._contains', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow()]));
		await directusAdapter.blog.byTag('professional', 'sql');
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		assertFilterContains(sharedMockFetch, 'category', 'professional', 'status', 'published', 'tags', '_contains', 'sql');
	});

	it('blog.tagsForCategory chains via byCategory', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow({ tags: ['sql', 'data'] })]));
		const tags = await directusAdapter.blog.tagsForCategory('professional');
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		assertFilterContains(sharedMockFetch, 'professional');
		expect(tags).toContain('sql');
		expect(tags).toContain('data');
	});

	it('blog.languagesForCategory chains via byCategory', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([blogRow({ lang: 'en' })]));
		const langs = await directusAdapter.blog.languagesForCategory('professional');
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		assertFilterContains(sharedMockFetch, 'professional');
		expect(langs).toContain('en');
	});

	it('blog.latest uses limit=3 and category filter', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([
			blogRow(), blogRow({ id: 'post-2' }), blogRow({ id: 'post-3' }),
		]));
		await directusAdapter.blog.latest(3, 'personal');
		assertFetchPath(sharedMockFetch, '/items/blog_posts');
		const { search } = parseCapturedUrl(sharedMockFetch);
		expect(search.get('limit')).toBe('3');
		assertFilterContains(sharedMockFetch, 'personal', 'published');
	});
});

// ---------------------------------------------------------------------------
// content.morphShapes
// ---------------------------------------------------------------------------

describe('directusAdapter.content.morphShapes — fetch contract', () => {
	it('hits /items/morph_shapes with sort=sort and limit=-1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([
			{ id: 'triangle', label: 'Triangle', path: 'M24 8 L40 38 L8 38 Z', viewbox: '0 0 48 48', sort: 0 },
		]));
		await directusAdapter.content.morphShapes();
		assertFetchPath(sharedMockFetch, '/items/morph_shapes');
		const { search } = parseCapturedUrl(sharedMockFetch);
		expect(decodeURIComponent(search.get('sort') ?? '')).toContain('sort');
		expect(search.get('limit')).toBe('-1');
	});
});

// ---------------------------------------------------------------------------
// techStack port
// ---------------------------------------------------------------------------

describe('directusAdapter.techStack — fetch contract', () => {
	it('techStack.all hits /items/tech_stack with full expansion, status=published, sort=sort, limit=-1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));
		const items = await directusAdapter.techStack.all();
		assertFetchPath(sharedMockFetch, '/items/tech_stack');
		const { search } = parseCapturedUrl(sharedMockFetch);
		const fields = decodeURIComponent(search.get('fields') ?? '');
		expect(fields).toContain('translations');
		expect(fields).toContain('services');
		expect(fields).toContain('projects');
		assertFilterContains(sharedMockFetch, 'status', 'published');
		expect(decodeURIComponent(search.get('sort') ?? '')).toContain('sort');
		expect(search.get('limit')).toBe('-1');
		expect(Array.isArray(items)).toBe(true);
	});

	it('techStack.all maps rows through toTechStackItem', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));
		const items = await directusAdapter.techStack.all();
		expect(items).toHaveLength(1);
		expect(items[0].id).toBe('postgresql');
		expect(items[0].what_it_is.en.blocks[0].data).toEqual({ text: 'RDBMS.' });
		expect(items[0].relatedServices).toEqual(['sql-development']);
		expect(items[0].relatedProjects).toEqual(['transit-data-pipeline']);
	});

	it('techStack.byId filters by id._eq, status=published, limit=1', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));
		const item = await directusAdapter.techStack.byId('postgresql');
		assertFetchPath(sharedMockFetch, '/items/tech_stack');
		assertFilterContains(sharedMockFetch, 'id', '_eq', 'postgresql', 'status', 'published');
		const { search } = parseCapturedUrl(sharedMockFetch);
		expect(search.get('limit')).toBe('1');
		expect(item?.id).toBe('postgresql');
	});

	it('techStack.byId returns undefined when no row matches', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		expect(await directusAdapter.techStack.byId('unknown-tech')).toBeUndefined();
	});

	it('techStack.content returns concatenated HTML string', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([techStackRow()]));
		const html = await directusAdapter.techStack.content('postgresql');
		expect(typeof html).toBe('string');
		assertFetchPath(sharedMockFetch, '/items/tech_stack');
	});

	it('techStack.content returns empty string when item not found', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		expect(await directusAdapter.techStack.content('ghost-tech')).toBe('');
	});
});

// ---------------------------------------------------------------------------
// content.* M2A methods — home-page blocks
// ---------------------------------------------------------------------------

describe('directusAdapter.content.* M2A methods — home-page blocks', () => {
	const homeCtx = () => ({ pageCache: new Map() });

	const seedHome = (extraBlocks: Array<{ collection: string; item: Record<string, unknown> }> = []) => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawPageWithBlocks('home', [
			{ collection: 'block_hero', item: rawHeroItem() },
			...extraBlocks,
		])]));
	};

	it('content.hero returns HeroContent and fetches /items/pages with slug=home', async () => {
		seedHome();
		const result = await directusAdapter.content.hero(homeCtx());
		expect(result.subheadline).toMatchObject({ en: 'Hello' });
		assertFetchPath(sharedMockFetch, '/items/pages');
		assertFilterContains(sharedMockFetch, 'home');
	});

	it('content.heroAnim projects _heroAnim from the hero block', async () => {
		seedHome();
		const result = await directusAdapter.content.heroAnim(homeCtx());
		expect(result.scrollDown).toMatchObject({ en: 'Scroll' });
	});

	it('content.manifesto returns ManifestoContent', async () => {
		seedHome([{ collection: 'block_manifesto', item: rawManifestoItem() }]);
		const result = await directusAdapter.content.manifesto(homeCtx());
		expect(result.terminal.user).toMatchObject({ en: 'y' });
		expect(Array.isArray(result.ticks)).toBe(true);
	});

	it('content.proofReel returns ProofReelContent', async () => {
		seedHome([{ collection: 'block_proof_reel', item: rawProofReelItem() }]);
		const result = await directusAdapter.content.proofReel(homeCtx());
		expect(result.heading).toMatchObject({ en: 'Work' });
		expect(result.viewAllHref).toBe('/work');
	});

	it('content.servicesGrid returns ServicesGridContent', async () => {
		seedHome([{ collection: 'block_services_grid', item: rawServicesGridItem() }]);
		const result = await directusAdapter.content.servicesGrid(homeCtx());
		expect(result.heading).toMatchObject({ en: 'Services' });
	});

	it('content.about returns AboutIntroContent', async () => {
		seedHome([{ collection: 'block_about_intro', item: rawAboutIntroItem() }]);
		const result = await directusAdapter.content.about(homeCtx());
		expect(result.name).toMatchObject({ en: 'Yesid' });
	});

	it('content.cta returns CtaContent', async () => {
		seedHome([{ collection: 'block_cta', item: rawCtaItem() }]);
		const result = await directusAdapter.content.cta(homeCtx());
		expect(result.heading).toMatchObject({ en: "Let's talk" });
	});

	it('content.closer returns CloserContent', async () => {
		seedHome([{ collection: 'block_closer', item: rawCloserItem() }]);
		const result = await directusAdapter.content.closer(homeCtx());
		expect(result.heading).toMatchObject({ en: 'Thanks' });
	});

	it('content.hero throws when block_hero is missing from home page', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawPageWithBlocks('home', [
			{ collection: 'block_manifesto', item: rawManifestoItem() },
		])]));
		await expect(directusAdapter.content.hero(homeCtx())).rejects.toThrow(/block_hero/);
	});
});

// ---------------------------------------------------------------------------
// content.* M2A methods — detail-page blocks
// ---------------------------------------------------------------------------

describe('directusAdapter.content.* M2A methods — detail-page blocks', () => {
	const routeCtx = () => ({ pageCache: new Map() });

	it('content.aboutPage routes to /items/pages with slug=about', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([])); // empty → throws after fetch
		await expect(directusAdapter.content.aboutPage(routeCtx())).rejects.toThrow();
		assertFetchPath(sharedMockFetch, '/items/pages');
		assertFilterContains(sharedMockFetch, 'about');
	});

	it('content.contactPage routes to /items/pages with slug=contact', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await expect(directusAdapter.content.contactPage(routeCtx())).rejects.toThrow();
		assertFetchPath(sharedMockFetch, '/items/pages');
		assertFilterContains(sharedMockFetch, 'contact');
	});

	it('content.techStackPage fetches /items/pages with slug=tech-stack', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawPageWithBlocks('tech-stack', [
			{ collection: 'block_tech_stack_page_content', item: rawTechStackPageItem() },
		])]));
		const result = await directusAdapter.content.techStackPage(routeCtx());
		expect((result.meta as unknown as Record<string, unknown>).title).toMatchObject({ en: 'Tech Stack' });
		assertFilterContains(sharedMockFetch, 'tech-stack');
	});

	it('content.blogPage returns BlogPageContent', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawPageWithBlocks('blog', [{
			collection: 'block_blog_page_content',
			item: {
				id: 'blog-content-uuid', status: 'published',
				translations: [{
					languages_code: 'en',
					intro: 'Field dispatches.',
					heading: 'Dispatches',
					back_to_dispatches: '← back to dispatches',
					back_to_personal: '← back to personal corner',
				}],
			},
		}])]));
		const result = await directusAdapter.content.blogPage(routeCtx());
		expect(result.intro).toMatchObject({ en: 'Field dispatches.' });
		assertFetchPath(sharedMockFetch, '/items/pages');
		assertFilterContains(sharedMockFetch, 'blog');
	});

	it('content.blogPage throws when block_blog_page_content is missing', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawPageWithBlocks('blog', [])]));
		await expect(directusAdapter.content.blogPage(routeCtx())).rejects.toThrow(/block_blog_page_content/);
	});

	it('content.projectsPage returns ProjectsPageContent', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawPageWithBlocks('projects', [{
			collection: 'block_projects_page_content',
			item: {
				id: 'projects-content-uuid', status: 'published',
				translations: [{ languages_code: 'en', intro: 'Selected work.' }],
			},
		}])]));
		const result = await directusAdapter.content.projectsPage(routeCtx());
		expect(result.intro).toMatchObject({ en: 'Selected work.' });
		assertFetchPath(sharedMockFetch, '/items/pages');
		assertFilterContains(sharedMockFetch, 'projects');
	});

	it('content.projectsPage throws when block_projects_page_content is missing', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawPageWithBlocks('projects', [])]));
		await expect(directusAdapter.content.projectsPage(routeCtx())).rejects.toThrow(/block_projects_page_content/);
	});
});

// ---------------------------------------------------------------------------
// content.* derived methods (no Directus query)
// ---------------------------------------------------------------------------

describe('directusAdapter.content.* — derived methods', () => {
	it('content.heroMock returns HeroData without hitting Directus', async () => {
		const result = await directusAdapter.content.heroMock();
		expect(sharedMockFetch).not.toHaveBeenCalled();
		expect(typeof result).toBe('object');
		expect(result).not.toBeNull();
	});

	it('content.initialHeroData returns INITIAL_HERO_DATA without hitting Directus', async () => {
		const result = await directusAdapter.content.initialHeroData();
		expect(sharedMockFetch).not.toHaveBeenCalled();
		expect(typeof result).toBe('object');
		expect(result).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// nav.byPlacement
// ---------------------------------------------------------------------------

describe('directusAdapter.nav.byPlacement — fetch contract', () => {
	it('placement=header hits /items/nav_links with sort=priority', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([navLinkRow({ placement: 'header' })]));
		const result = await directusAdapter.nav.byPlacement('header');
		assertFetchPath(sharedMockFetch, '/items/nav_links');
		assertFilterContains(sharedMockFetch, 'placement', 'header', 'published');
		const { search } = parseCapturedUrl(sharedMockFetch);
		expect(search.get('sort')).toContain('priority');
		expect(result).toHaveLength(1);
		expect(result[0].label.en).toBe('Services');
		expect(result[0].href).toBe('/services');
		expect(result[0].priority).toBe(1);
	});

	it('placement=menu returns merged multi-locale labels + subtitles', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([navLinkRow({
			placement: 'menu', href: '/projects',
			translations: [
				{ languages_code: 'en', label: 'Projects', subtitle: 'proof it ships' },
				{ languages_code: 'fr', label: 'Projets', subtitle: 'la preuve que ça livre' },
			],
		})]));
		const result = await directusAdapter.nav.byPlacement('menu');
		assertFetchPath(sharedMockFetch, '/items/nav_links');
		assertFilterContains(sharedMockFetch, 'placement', 'menu');
		expect(result[0].subtitle).toMatchObject({ en: 'proof it ships', fr: 'la preuve que ça livre' });
	});

	it('placement=footer filters by placement=footer', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.nav.byPlacement('footer');
		assertFilterContains(sharedMockFetch, 'footer');
	});

	it('placement=mobile filters by placement=mobile', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await directusAdapter.nav.byPlacement('mobile');
		assertFilterContains(sharedMockFetch, 'mobile');
	});

	it('resolves icon M2O FK object to name string', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([{
			...navLinkRow({ placement: 'header' }),
			icon: { name: 'code-bracket' },
		}]));
		const result = await directusAdapter.nav.byPlacement('header');
		expect(result[0].icon).toBe('code-bracket');
	});

	it('omits icon when icon FK is null', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([navLinkRow({ placement: 'header' })]));
		const result = await directusAdapter.nav.byPlacement('header');
		expect(result[0].icon).toBeUndefined();
	});
});

describe('directusAdapter.content.navLinks + menuItems — delegation', () => {
	it('content.navLinks delegates to nav.byPlacement("header")', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([navLinkRow({ placement: 'header' })]));
		const result = await directusAdapter.content.navLinks();
		assertFetchPath(sharedMockFetch, '/items/nav_links');
		assertFilterContains(sharedMockFetch, 'header');
		expect(result).toHaveLength(1);
	});

	it('content.menuItems delegates to nav.byPlacement("menu")', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([navLinkRow({ placement: 'menu' })]));
		const result = await directusAdapter.content.menuItems();
		assertFilterContains(sharedMockFetch, 'menu');
		expect(result).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// content.errorPage
// ---------------------------------------------------------------------------

describe('directusAdapter.content.errorPage — fetch contract', () => {
	it('errorPage(404) requests /items/error_pages with _or filter for 404 + 0', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([errorPageRow(404)]));
		const result = await directusAdapter.content.errorPage(404);
		assertFetchPath(sharedMockFetch, '/items/error_pages');
		assertFilterContains(sharedMockFetch, 'status_code', '404', '0');
		expect(result.label.en).toBe('Error 404');
		expect(result.heading.en).toBe('404 heading');
		expect(result.suggestions[0].href).toBe('/');
	});

	it('errorPage(999) falls back to status_code=0 row when no 999 row exists', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([errorPageRow(0, {
			translations: [{
				languages_code: 'en', label: 'Generic Error', heading: 'Generic heading',
				description: 'Generic description', terminal_line: '$ route --status unknown',
				suggestions: [],
			}],
		})]));
		const result = await directusAdapter.content.errorPage(999);
		expect(result.label.en).toBe('Generic Error');
	});

	it('errorPage(500) throws when no 500 row and no fallback exists', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));
		await expect(directusAdapter.content.errorPage(500)).rejects.toThrow(/status_code=500/);
	});

	it('errorPage(0) returns the fallback row itself when called with 0', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([errorPageRow(0)]));
		const result = await directusAdapter.content.errorPage(0);
		expect(result.label.en).toBe('Error 0');
	});

	it('prefers specific status_code row over fallback when both are returned', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([
			errorPageRow(404, {
				translations: [{
					languages_code: 'en', label: 'Specific 404', heading: '404 heading',
					description: '404 description', terminal_line: '$ route --status 404',
					suggestions: [],
				}],
			}),
			errorPageRow(0, {
				translations: [{
					languages_code: 'en', label: 'Generic Fallback', heading: 'Generic heading',
					description: 'Generic description', terminal_line: '$ route --status 0',
					suggestions: [],
				}],
			}),
		]));
		const result = await directusAdapter.content.errorPage(404);
		expect(result.label.en).toBe('Specific 404');
	});

	it('merges per-locale suggestions correctly', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([{
			id: 'error-404', status: 'published', status_code: 404, sort: null,
			translations: [
				{
					languages_code: 'en', label: 'Not Found', heading: 'Not Found',
					description: 'desc', terminal_line: '$ route --status 404',
					suggestions: [
						{ label: 'Home', href: '/' },
						{ label: 'Services', href: '/services' },
					],
				},
				{
					languages_code: 'fr', label: 'Non trouvé', heading: 'Non trouvé',
					description: 'desc fr', terminal_line: '$ route --status 404',
					suggestions: [
						{ label: 'Accueil', href: '/' },
						{ label: 'Services', href: '/services' },
					],
				},
			],
		}]));
		const result = await directusAdapter.content.errorPage(404);
		expect(result.suggestions[0].label).toMatchObject({ en: 'Home', fr: 'Accueil' });
		expect(result.suggestions[0].href).toBe('/');
		expect(result.suggestions[1].label).toMatchObject({ en: 'Services', fr: 'Services' });
	});
});
