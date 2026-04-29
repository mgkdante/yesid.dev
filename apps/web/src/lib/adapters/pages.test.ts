// pages.test.ts — TDD tests for loadPage, ROUTE_TO_SLUG, ALL_BLOCK_COLLECTIONS.
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

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('$lib/adapters/directus');

const sharedMockFetch = vi.fn();

vi.mock('./directus-queue', () => ({
	createQueuedFetch: () => sharedMockFetch,
}));

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' },
}));

import { loadPage, ROUTE_TO_SLUG, ALL_BLOCK_COLLECTIONS } from './directus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal LocalizedString that satisfies LocalizedStringSchema (en required, non-empty). */
function ls(en: string) {
	return { en };
}

/**
 * Minimal Zod-valid `pages` row that satisfies PageSchema.
 * blocks array contains one valid block_hero item (all required fields populated).
 */
function rawHomePage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'home',
		slug: 'home',
		status: 'published',
		title: 'Home',
		translations: [],
		blocks: [
			{
				collection: 'block_hero',
				item: {
					headline: {
						line1: ls('Hello'),
						line2: ls('World'),
						ariaSuffix: ls('Hello World'),
					},
					subheadline: ls('Subheadline'),
					subtitle: ls('Subtitle'),
					ctaWork: ls('Work'),
					ctaContact: ls('Contact'),
					sqlPanel: {
						prompt: ls('SELECT * FROM metro'),
						liveLabel: ls('Live'),
						columns: {
							route: ls('Route'),
							avgDelayS: ls('Avg delay'),
							vehicles: ls('Vehicles'),
						},
						metaTemplate: ls('{count} vehicles'),
					},
					refreshButton: {
						label: ls('Refresh'),
						helper: ls('Click to refresh'),
					},
				},
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
// loadPage
// ---------------------------------------------------------------------------

describe('loadPage', () => {
	it('returns a PageData for slug=home', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawHomePage()]));

		const ctx = { pageCache: new Map() };
		const result = await loadPage('home', ctx);

		expect(result.slug).toBe('home');
		expect(result.blocks.length).toBeGreaterThanOrEqual(1);
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
