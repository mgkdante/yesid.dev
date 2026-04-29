// pages.test.ts — TDD tests for loadPage, ROUTE_TO_SLUG, ALL_BLOCK_COLLECTIONS,
// and the 12 transformBlock<X> functions added in slice-18i Task 4.0.
//
// Mocking strategy mirrors directus.mocked.test.ts:
//   - vi.mock('./directus-queue') replaces createQueuedFetch() with sharedMockFetch
//   - vi.mock('$env/dynamic/public') supplies PUBLIC_DIRECTUS_URL
//   - vi.unmock('$lib/adapters/directus') keeps the subject under real test
//
// loadPage is NOT mocked — it's the subject. We mock at directus.request level
// via the queued-fetch capture surface (same HTTP-level mock as mocked.test.ts).
// parsePort runs REAL — the spec contract is "every adapter parse goes through
// parsePort" and the Zod gate is part of what we're testing.
//
// Fixture shape: rawBlockHero() et al return the REAL Directus shape
// (per-locale translation row arrays), not pre-shaped LocalizedStrings.
// This exercises the full transform-merge-validate pipeline.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('$lib/adapters/directus');

const sharedMockFetch = vi.fn();

vi.mock('./directus-queue', () => ({
	createQueuedFetch: () => sharedMockFetch,
}));

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' },
}));

import {
	loadPage,
	ROUTE_TO_SLUG,
	ALL_BLOCK_COLLECTIONS,
	transformBlockHero,
	transformBlockManifesto,
	transformBlockProofReel,
	transformBlockServicesGrid,
	transformBlockCta,
	transformBlockCloser,
	transformBlockAboutIntro,
	transformBlockAboutContent,
	transformBlockContactContent,
	transformBlockTechStackPageContent,
	transformBlockBlogPageContent,
	transformBlockProjectsPageContent,
} from './directus';

// ---------------------------------------------------------------------------
// Raw Directus block fixture builders — per-locale translation row arrays
// ---------------------------------------------------------------------------

/** Minimal raw `block_hero` Directus item with two-locale translations. */
function rawBlockHero(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: 'hero-uuid-1',
		editor_label: 'Home Hero',
		status: 'published',
		sort: 1,
		translations: [
			{
				languages_code: 'en',
				subheadline: 'Hello there',
				subtitle: 'Building things',
				cta_work: 'See work',
				cta_contact: 'Get in touch',
				headline: { line1: 'Hello', line2: 'World', ariaSuffix: 'Hello World' },
				sql_panel: {
					prompt: 'SELECT * FROM metro',
					liveLabel: 'Live',
					columns: { route: 'Route', avgDelayS: 'Avg delay', vehicles: 'Vehicles' },
					metaTemplate: '{count} vehicles',
				},
				refresh_button: { label: 'Refresh', helper: 'Tap to refresh' },
				hero_anim: { scrollDown: 'Scroll down' },
			},
			{
				languages_code: 'fr',
				subheadline: 'Bonjour',
				subtitle: 'Construire des choses',
				cta_work: 'Voir le travail',
				cta_contact: 'Contactez',
				headline: { line1: 'Bonjour', line2: 'Monde', ariaSuffix: 'Bonjour Monde' },
				sql_panel: {
					prompt: 'SELECT * FROM metro',
					liveLabel: 'En direct',
					columns: { route: 'Trajet', avgDelayS: 'Délai moy', vehicles: 'Véhicules' },
					metaTemplate: '{count} véhicules',
				},
				refresh_button: { label: 'Rafraîchir', helper: 'Tap pour rafraîchir' },
				hero_anim: { scrollDown: 'Défiler vers le bas' },
			},
		],
		...overrides,
	};
}

/** Minimal raw `block_manifesto` Directus item. */
function rawBlockManifesto(): Record<string, unknown> {
	return {
		id: 'manifesto-uuid-1',
		status: 'published',
		ticks: ['tick1', 'tick2'],
		hidden_transit_lines: [{ name: 'Green', color: '#00a550' }],
		translations: [
			{
				languages_code: 'en',
				statement: {
					line1: 'I build',
					lineHuge: 'things',
					line3Part1: 'that',
					line3Highlight: 'matter',
					line3Part2: 'daily',
				},
				terminal: { user: 'yesid', command: 'npm run build' },
				pills: [{ label: 'SQL', serviceId: 'sql-dev' }],
				edge_left: { sectionNumber: '01', sectionName: 'Manifesto', location: 'MTL' },
				edge_right: { lat: '45', lng: '-73', src: 'A', via: 'B', dst: 'C', node: 'N1', status: 'OK' },
				edge_bottom: { connected: 'Yes', line: 'Green', url: '/about', version: '1.0', scrollHint: 'Scroll' },
				transit: { arrivalLabel: 'Arriving', platformBadge: 'P1', directionBadge: 'North' },
			},
		],
	};
}

/** Minimal raw `block_proof_reel` Directus item. */
function rawBlockProofReel(): Record<string, unknown> {
	return {
		id: 'proof-uuid-1',
		status: 'published',
		slugs: ['project-a', 'project-b'],
		images: { 'project-a': 'img-uuid-1' },
		view_all_href: '/work',
		translations: [
			{
				languages_code: 'en',
				heading: 'Proof',
				heading_dot: '.',
				subheading: 'Real projects',
				section_label: 'Work',
				view_all_label: 'View all',
				toggle_color_aria: 'Toggle color',
			},
		],
	};
}

/** Minimal raw `block_services_grid` Directus item. */
function rawBlockServicesGrid(): Record<string, unknown> {
	return {
		id: 'services-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				heading: 'Services',
				heading_dot: '.',
				subheading: 'What I do',
				view_illustration_aria: 'View illustration',
				view_all_link: 'View all services',
			},
		],
	};
}

/** Minimal raw `block_cta` Directus item. */
function rawBlockCta(): Record<string, unknown> {
	return {
		id: 'cta-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				heading: "Let's talk",
				subtitle: 'Ready to start a project?',
				cta_contact: 'Contact me',
				cta_github: 'GitHub',
			},
		],
	};
}

/** Minimal raw `block_closer` Directus item. */
function rawBlockCloser(): Record<string, unknown> {
	return {
		id: 'closer-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				heading: 'Thanks',
				heading_dot: '.',
				subheading: 'See you around',
				cta: { label: 'Contact', href: '/contact' },
				rows: {
					contact: { label: 'Contact', description: 'Say hi', action: 'Email' },
					connect: { label: 'Connect', description: 'LinkedIn', action: 'Follow' },
					read: { label: 'Read', action: 'Blog' },
					about: { label: 'About', description: 'Who I am', action: 'Learn' },
				},
				attribution: { text: 'Made with care', url: '/about' },
				terminal: {
					title: 'Terminal',
					city: 'MTL',
					encoding: 'UTF-8',
					destinationsLabel: 'Destinations',
					prompt: '> ',
				},
			},
		],
	};
}

/** Minimal raw `block_about_intro` Directus item. */
function rawBlockAboutIntro(): Record<string, unknown> {
	return {
		id: 'about-intro-uuid-1',
		status: 'published',
		stack_items: ['TypeScript', 'SvelteKit'],
		translations: [
			{
				languages_code: 'en',
				name: 'Yesid',
				title: 'Developer',
				bio: 'I build data-heavy web apps.',
				more_link: 'More about me',
				stack_label: 'Stack',
				location_label: 'Location',
				location: { city: 'Montreal', region: 'QC' },
				interests_label: 'Interests',
				interests: 'Transit data, SQL',
			},
		],
	};
}

/** Minimal raw `block_about_content` Directus item. */
function rawBlockAboutContent(): Record<string, unknown> {
	return {
		id: 'about-content-uuid-1',
		status: 'published',
		client_count: 5,
		translations: [
			{
				languages_code: 'en',
				identity: { headline: 'I am Yesid', sub: 'Developer' },
				metrics: [{ label: 'Projects', value: '10+' }],
				methodology: [{ title: 'Research first', body: 'Always' }],
				testimonials: [{ quote: 'Great work', author: 'Client' }],
				tech_stack: [{ name: 'TypeScript', level: 'Expert' }],
				interests: [{ label: 'Transit', icon: 'metro' }],
				weather: { label: 'Montreal', temp: '−5°C' },
				client_logos: [{ name: 'Acme', url: 'https://acme.com' }],
				cta: { heading: 'Work with me', body: 'Let us talk' },
				stop_labels: { from: 'From', to: 'To' },
				labels: { available: 'Available', location: 'MTL' },
				meta: { title: 'About Yesid', description: 'Developer based in MTL' },
			},
		],
	};
}

/** Minimal raw `block_contact_content` Directus item. */
function rawBlockContactContent(): Record<string, unknown> {
	return {
		id: 'contact-uuid-1',
		status: 'published',
		web3forms_key: 'key-abc',
		translations: [
			{
				languages_code: 'en',
				page_title: 'Contact',
				station_label: 'Station',
				send_error_message: 'Failed to send',
				meta: { title: 'Contact Yesid', description: 'Get in touch' },
				info_terminal: { heading: 'Info', lines: [{ label: 'Email', value: 'y@y.com' }] },
				form_terminal: { heading: 'Form', submit: 'Send' },
				validation: { name: 'Name is required', email: 'Email is required', message: 'Message is required' },
				success: { heading: 'Sent!', body: 'Thank you' },
				socials: [{ label: 'GitHub', url: 'https://github.com/mgkdante', icon: 'github' }],
			},
		],
	};
}

/** Minimal raw `block_tech_stack_page_content` Directus item. */
function rawBlockTechStackPageContent(): Record<string, unknown> {
	return {
		id: 'techstack-page-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				meta: { title: 'Tech Stack', description: 'My tools' },
				hero: { overline: 'Stack', heading: 'Tools I use', body: 'Description' },
				actions: { download: 'Download', share: 'Share' },
				cta: { heading: 'Hire me', body: 'Available now' },
			},
		],
	};
}

/** Minimal raw `block_blog_page_content` Directus item. */
function rawBlockBlogPageContent(): Record<string, unknown> {
	return {
		id: 'blog-page-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				intro: 'Welcome to my blog',
			},
		],
	};
}

/** Minimal raw `block_projects_page_content` Directus item. */
function rawBlockProjectsPageContent(): Record<string, unknown> {
	return {
		id: 'projects-page-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				intro: 'Projects I have built',
			},
		],
	};
}

/**
 * Full raw Directus `pages` row for slug=home in real Directus shape.
 * Blocks use per-locale translation row arrays — exercises transformPageRow.
 */
function rawHomePage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'page-uuid-1',
		slug: 'home',
		status: 'published',
		title: 'Home',
		translations: [{ languages_code: 'en', title: 'Home' }],
		blocks: [
			{
				id: 'junction-uuid-1',
				sort: 1,
				collection: 'block_hero',
				item: rawBlockHero(),
			},
		],
		...overrides,
	};
}

/** Returns a JSON Response in the Directus SDK envelope `{ data: [...] }`. */
function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify({ data: body }), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	sharedMockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// ROUTE_TO_SLUG
// ---------------------------------------------------------------------------

describe('ROUTE_TO_SLUG', () => {
	it('maps the 7 spec routes', () => {
		expect(ROUTE_TO_SLUG['/']).toBe('home');
		expect(ROUTE_TO_SLUG['/about']).toBe('about');
		expect(ROUTE_TO_SLUG['/contact']).toBe('contact');
		expect(ROUTE_TO_SLUG['/services']).toBe('services');
		expect(ROUTE_TO_SLUG['/projects']).toBe('projects');
		expect(ROUTE_TO_SLUG['/tech-stack']).toBe('tech-stack');
		expect(ROUTE_TO_SLUG['/blog']).toBe('blog');
	});
});

// ---------------------------------------------------------------------------
// ALL_BLOCK_COLLECTIONS
// ---------------------------------------------------------------------------

describe('ALL_BLOCK_COLLECTIONS', () => {
	it('has exactly 12 block collections (block_journey_panel dropped)', () => {
		expect(ALL_BLOCK_COLLECTIONS.length).toBe(12);
		expect(ALL_BLOCK_COLLECTIONS).not.toContain('block_journey_panel');
	});
});

// ---------------------------------------------------------------------------
// loadPage — exercises full transform-merge-validate pipeline
// ---------------------------------------------------------------------------

describe('loadPage', () => {
	it('returns a PageData for slug=home (real Directus shape exercises transformPageRow)', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawHomePage()]));

		const ctx = { pageCache: new Map() };
		const result = await loadPage('home', ctx);

		expect(result.slug).toBe('home');
		expect(result.blocks.length).toBeGreaterThanOrEqual(1);
		// After transform, item should have merged LocalizedString shape
		const heroBlock = result.blocks.find((b) => b.collection === 'block_hero');
		expect(heroBlock).toBeDefined();
		if (heroBlock?.collection === 'block_hero') {
			expect(heroBlock.item.subheadline.en).toBe('Hello there');
			expect(heroBlock.item.subheadline.fr).toBe('Bonjour');
		}
	});

	it('memoizes per request — second call hits cache, directus.request called once', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawHomePage()]));

		const ctx = { pageCache: new Map() };
		await loadPage('home', ctx);
		await loadPage('home', ctx);

		// fetch is the underlying network call — should only fire once
		expect(sharedMockFetch).toHaveBeenCalledTimes(1);
	});

	it('throws a slug-naming error when page not found (empty array response)', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		const ctx = { pageCache: new Map() };
		await expect(loadPage('nonexistent', ctx)).rejects.toThrow(/nonexistent/);
	});

	it('throws a parsePort error when raw shape is malformed', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([{ wrong: 'shape' }]));

		const ctx = { pageCache: new Map() };
		await expect(loadPage('home', ctx)).rejects.toThrow(/pages\.bySlug/);
	});

	it('memoizes across two content.* calls sharing the same ctx Map', async () => {
		// Set up two separate loadPage calls in the same request (same ctx).
		// Only one network call should be issued regardless of how many callers
		// share the same ctx Map — this validates the Phase 4 dedup guarantee.
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawHomePage()]));

		const ctx = { pageCache: new Map() };
		const [r1, r2] = await Promise.all([
			loadPage('home', ctx),
			loadPage('home', ctx),
		]);

		expect(sharedMockFetch).toHaveBeenCalledTimes(1);
		// Both callers receive the same resolved data
		expect(r1.slug).toBe('home');
		expect(r2.slug).toBe('home');
	});
});

// ---------------------------------------------------------------------------
// transformBlockHero — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockHero', () => {
	it('merges per-locale translations into LocalizedString shape', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result.subheadline).toEqual({ en: 'Hello there', fr: 'Bonjour' });
		expect(result.ctaWork).toEqual({ en: 'See work', fr: 'Voir le travail' });
	});

	it('merges JSON column (headline) into nested LocalizedString leaves', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result.headline.line1).toEqual({ en: 'Hello', fr: 'Bonjour' });
		expect(result.headline.line2).toEqual({ en: 'World', fr: 'Monde' });
	});

	it('exposes _heroAnim.scrollDown as LocalizedString', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result._heroAnim.scrollDown).toMatchObject({ en: 'Scroll down' });
	});

	it('produces sqlPanel with nested LocalizedString columns', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result.sqlPanel.liveLabel).toMatchObject({ en: 'Live' });
		expect(result.sqlPanel.columns.route).toMatchObject({ en: 'Route' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockManifesto — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockManifesto', () => {
	it('merges translations into LocalizedString leaves', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		expect(result.terminal.user).toMatchObject({ en: 'yesid' });
		expect(result.terminal.command).toMatchObject({ en: 'npm run build' });
	});

	it('passes through non-translatable ticks array from parent row', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		expect(result.ticks).toEqual(['tick1', 'tick2']);
	});

	it('maps hiddenTransitLines with name as LocalizedString', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		expect(result.hiddenTransitLines[0].color).toBe('#00a550');
		expect(result.hiddenTransitLines[0].name).toMatchObject({ en: 'Green' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockProofReel — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockProofReel', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockProofReel();
		const result = transformBlockProofReel(raw as never);
		expect(result.heading).toMatchObject({ en: 'Proof' });
		expect(result.subheading).toMatchObject({ en: 'Real projects' });
	});

	it('passes through non-translatable slugs and images from parent row', () => {
		const raw = rawBlockProofReel();
		const result = transformBlockProofReel(raw as never);
		expect(result.slugs).toEqual(['project-a', 'project-b']);
		expect(result.images).toEqual({ 'project-a': 'img-uuid-1' });
		expect(result.viewAllHref).toBe('/work');
	});
});

// ---------------------------------------------------------------------------
// transformBlockServicesGrid — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockServicesGrid', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockServicesGrid();
		const result = transformBlockServicesGrid(raw as never);
		expect(result.heading).toMatchObject({ en: 'Services' });
		expect(result.subheading).toMatchObject({ en: 'What I do' });
		expect(result.viewIllustrationAria).toMatchObject({ en: 'View illustration' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockCta — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockCta', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockCta();
		const result = transformBlockCta(raw as never);
		expect(result.heading).toMatchObject({ en: "Let's talk" });
		expect(result.subtitle).toMatchObject({ en: 'Ready to start a project?' });
		expect(result.ctaContact).toMatchObject({ en: 'Contact me' });
		expect(result.ctaGithub).toMatchObject({ en: 'GitHub' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockCloser — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockCloser', () => {
	it('merges translations into LocalizedString shape for heading fields', () => {
		const raw = rawBlockCloser();
		const result = transformBlockCloser(raw as never);
		expect(result.heading).toMatchObject({ en: 'Thanks' });
		expect(result.subheading).toMatchObject({ en: 'See you around' });
	});

	it('merges JSON column (rows) into nested LocalizedString leaves', () => {
		const raw = rawBlockCloser();
		const result = transformBlockCloser(raw as never);
		expect(result.rows.contact.label).toMatchObject({ en: 'Contact' });
		expect(result.rows.read.action).toMatchObject({ en: 'Blog' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockAboutIntro — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockAboutIntro', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockAboutIntro();
		const result = transformBlockAboutIntro(raw as never);
		expect(result.name).toMatchObject({ en: 'Yesid' });
		expect(result.title).toMatchObject({ en: 'Developer' });
		expect(result.bio).toMatchObject({ en: 'I build data-heavy web apps.' });
	});

	it('passes through non-translatable stackItems from parent row', () => {
		const raw = rawBlockAboutIntro();
		const result = transformBlockAboutIntro(raw as never);
		expect(result.stackItems).toEqual(['TypeScript', 'SvelteKit']);
	});

	it('merges JSON column (location) into nested LocalizedString leaves', () => {
		const raw = rawBlockAboutIntro();
		const result = transformBlockAboutIntro(raw as never);
		expect(result.location.city).toMatchObject({ en: 'Montreal' });
		expect(result.location.region).toMatchObject({ en: 'QC' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockAboutContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockAboutContent', () => {
	it('merges JSON columns into LocalizedString-leaved shapes', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		// identity is a JSON column with string leaves; cast via unknown to inspect dynamic keys
		expect((result.identity as unknown as Record<string, unknown>).headline).toMatchObject({ en: 'I am Yesid' });
	});

	it('passes through non-translatable clientCount from parent row', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(result.clientCount).toBe(5);
	});
});

// ---------------------------------------------------------------------------
// transformBlockContactContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockContactContent', () => {
	it('merges translations into LocalizedString shape for scalar fields', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		expect(result.pageTitle).toMatchObject({ en: 'Contact' });
		expect(result.stationLabel).toMatchObject({ en: 'Station' });
		expect(result.sendErrorMessage).toMatchObject({ en: 'Failed to send' });
	});

	it('passes through non-translatable web3formsKey from parent row', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		expect(result.web3formsKey).toBe('key-abc');
	});
});

// ---------------------------------------------------------------------------
// transformBlockTechStackPageContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockTechStackPageContent', () => {
	it('merges JSON columns into LocalizedString-leaved shapes', () => {
		const raw = rawBlockTechStackPageContent();
		const result = transformBlockTechStackPageContent(raw as never);
		expect((result.meta as unknown as Record<string, unknown>).title).toMatchObject({ en: 'Tech Stack' });
		expect((result.hero as unknown as Record<string, unknown>).overline).toMatchObject({ en: 'Stack' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockBlogPageContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockBlogPageContent', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockBlogPageContent();
		const result = transformBlockBlogPageContent(raw as never);
		expect(result.intro).toMatchObject({ en: 'Welcome to my blog' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockProjectsPageContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockProjectsPageContent', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockProjectsPageContent();
		const result = transformBlockProjectsPageContent(raw as never);
		expect(result.intro).toMatchObject({ en: 'Projects I have built' });
	});
});
