// layout.server.test.ts — Unit tests for the layout server load function.
//
// slice-18i Phase 6 review fix-up (High 4)
//
// +layout.server.ts is a pure data function with no DOM or SvelteKit SSR
// runtime dependency — it calls adapter methods and returns a plain object.
// The adapter is mocked via vi.mock('$lib/adapters') so no network calls
// are issued.
//
// The `load` function is called without arguments (it uses no event fields —
// only the adapter which is injected at module level). Return type is cast
// to the known shape for clean assertion ergonomics.
//
// Coverage targets:
//   - Happy path: all 4 nav slots resolve → return shape correct
//   - Error route: errorPage resolves from adapter
//   - Partial nav failure: one slot throws → that slot falls back to static
//   - errorPage failure: adapter.content.errorPage throws → falls back to static
//   - All-slots failure: every adapter call throws → all slots use static fixtures

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	navLinks as staticNavLinks,
	menuItems as staticMenuItems,
	errorPageContent as staticErrorPageContent,
} from '$lib/content/nav';
import type { NavLink, ErrorPageContent } from '$lib/content/nav';
import type { MorphShape, PageSeo, SiteSeoDefaults } from '$lib/types';

// ---------------------------------------------------------------------------
// Shared mock capture surface
// ---------------------------------------------------------------------------

const mockByPlacement = vi.fn();
const mockErrorPage = vi.fn();
const mockMorphShapes = vi.fn();
const mockForRoute = vi.fn();
const mockSiteSeoDefaults = vi.fn();

// Mock '$lib/adapters' before importing the subject.
// Vitest hoists vi.mock() calls, so this is safe even though the import
// of the subject appears below.
vi.mock('$lib/adapters', () => ({
	adapter: {
		nav: {
			byPlacement: (...args: unknown[]) => mockByPlacement(...args),
		},
		content: {
			errorPage: (...args: unknown[]) => mockErrorPage(...args),
			morphShapes: (...args: unknown[]) => mockMorphShapes(...args),
		},
		meta: {
			forRoute: (...args: unknown[]) => mockForRoute(...args),
			siteSeoDefaults: (...args: unknown[]) => mockSiteSeoDefaults(...args),
		},
	},
}));

// Import subject AFTER mock is registered
import { load } from './+layout.server';

// ---------------------------------------------------------------------------
// Type alias for the load return shape (avoids fighting SvelteKit's generated
// void-union wrapper; the actual runtime value is always the plain object)
// ---------------------------------------------------------------------------
type LayoutData = {
	headerLinks: readonly NavLink[];
	footerLinks: readonly NavLink[];
	mobileLinks: readonly NavLink[];
	menuItems: readonly NavLink[];
	errorPage: ErrorPageContent;
	morphShapes: readonly MorphShape[];
	seo: PageSeo;
	themeColor: string;
};

async function callLoad(
	routeId: string | null = '/',
	params: Record<string, string> = {},
	// Request pathname for the registry route-gate (slice-26.1). Defaults to
	// '/' (always published) so routeId-focused tests are unaffected by the
	// gate; gate tests pass an explicit pathname.
	pathname = '/',
): Promise<LayoutData> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (await (load as unknown as (event: {
		route: { id: string | null };
		params: Record<string, string>;
		locals: App.Locals;
		url: URL;
		setHeaders: (headers: Record<string, string>) => void;
	}) => Promise<LayoutData>)({
		route: { id: routeId },
		params,
		locals: { pageCache: new Map() },
		url: new URL(`https://yesid.dev${pathname}`),
		setHeaders: vi.fn(),
	})) as LayoutData;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeHeaderLinks: readonly NavLink[] = [
	{ label: { en: 'Services' }, href: '/services', priority: 1 },
];
const fakeFooterLinks: readonly NavLink[] = [
	{ label: { en: 'About' }, href: '/about', priority: 1 },
];
const fakeMobileLinks: readonly NavLink[] = [
	{ label: { en: 'Blog' }, href: '/blog', priority: 1 },
];
const fakeMenuItems: readonly NavLink[] = [
	{ label: { en: 'Contact' }, href: '/contact', priority: 1 },
];
const fakeErrorPage: ErrorPageContent = {
	label: { en: 'NOT FOUND' },
	heading: { en: 'Page not found' },
	description: { en: 'Try another route' },
	terminalLine: '$ route --status 404',
	suggestions: [],
};
const fakeSeo: PageSeo = {
	title: { en: 'Home | yesid.dev' },
	description: { en: 'A practical page description long enough for the SEO schema to accept.' },
	canonical: 'https://yesid.dev',
	ogType: 'website',
	noIndex: false,
};
const fakeSiteSeoDefaults: SiteSeoDefaults = {
	defaultOgImage: null,
	themeColor: '#123456',
	defaultDescription: { en: 'A practical fallback description long enough for the SEO schema.' },
};
const fakeMorphShapes: readonly MorphShape[] = [
	{ id: 'triangle', label: 'Triangle', path: 'M24 8 L40 38 L8 38 Z', viewbox: '0 0 48 48', sort: 1 },
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	mockByPlacement.mockReset();
	mockErrorPage.mockReset();
	mockMorphShapes.mockReset();
	mockForRoute.mockReset();
	mockSiteSeoDefaults.mockReset();
	mockForRoute.mockResolvedValue(fakeSeo);
	mockSiteSeoDefaults.mockResolvedValue(fakeSiteSeoDefaults);
	mockMorphShapes.mockResolvedValue(fakeMorphShapes);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('+layout.server load', () => {
	describe('registry route-gate (slice-26.1)', () => {
		beforeEach(() => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockResolvedValue(fakeErrorPage);
		});

		it('404s a path with no site_pages registry entry (archived/unknown section)', async () => {
			await expect(callLoad('/secret-section', {}, '/secret-section')).rejects.toMatchObject({
				status: 404,
			});
		});

		it('404s detail paths of an unregistered section', async () => {
			await expect(
				callLoad('/secret-section/[slug]', { slug: 'x' }, '/secret-section/x'),
			).rejects.toMatchObject({ status: 404 });
		});

		it('resolves published registry paths (exact + longest listing prefix)', async () => {
			await expect(callLoad('/about', {}, '/about')).resolves.toBeTruthy();
			await expect(
				callLoad('/blog/[slug]', { slug: 'some-post' }, '/blog/some-post'),
			).resolves.toBeTruthy();
		});

		it('never gates the root path', async () => {
			await expect(callLoad('/', {}, '/')).resolves.toBeTruthy();
		});

		it('skips the gate on the error pseudo-route (route.id null) to avoid re-throwing inside the error render', async () => {
			await expect(callLoad(null, {}, '/whatever-missing-path')).resolves.toBeTruthy();
		});
	});

	describe('locale derivation (slice-28.6)', () => {
		beforeEach(() => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockResolvedValue(fakeErrorPage);
		});
		it('returns locale en for unprefixed requests', async () => {
			const result = await callLoad('/about', {}, '/about');
			expect((result as LayoutData & { locale: string }).locale).toBe('en');
		});
		it('derives fr from params.lang, strips the segment for SEO lookup, and gates on the delocalized path', async () => {
			const result = await callLoad('/[[lang=locale]]/about', { lang: 'fr' }, '/fr/about');
			expect((result as LayoutData & { locale: string }).locale).toBe('fr');
			expect(mockForRoute).toHaveBeenCalledWith(
				'/about',
				'fr',
				{ lang: 'fr' },
				expect.objectContaining({ pageCache: expect.any(Map) }),
			);
		});
		it('derives fr from the pathname on error renders (no params)', async () => {
			const result = await callLoad(null, {}, '/fr/ghost-path');
			expect((result as LayoutData & { locale: string }).locale).toBe('fr');
		});
	});

	describe('happy path — all fetches resolve', () => {
		it('returns all 4 nav slots and static errorPage on normal routes', async () => {
			mockByPlacement.mockImplementation(async (placement: string) => {
				if (placement === 'header') return fakeHeaderLinks;
				if (placement === 'footer') return fakeFooterLinks;
				if (placement === 'mobile') return fakeMobileLinks;
				if (placement === 'menu') return fakeMenuItems;
				return [];
			});
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			const result = await callLoad();

			expect(result.headerLinks).toEqual(fakeHeaderLinks);
			expect(result.footerLinks).toEqual(fakeFooterLinks);
			expect(result.mobileLinks).toEqual(fakeMobileLinks);
			expect(result.menuItems).toEqual(fakeMenuItems);
			expect(result.errorPage).toEqual(staticErrorPageContent);
			expect(result.morphShapes).toEqual(fakeMorphShapes);
			expect(result.seo).toEqual(fakeSeo);
			expect(result.themeColor).toBe(fakeSiteSeoDefaults.themeColor);
		});

		it('does not fetch CMS errorPage on normal routes', async () => {
			mockByPlacement.mockResolvedValue([]);

			await callLoad('/');

			expect(mockErrorPage).not.toHaveBeenCalled();
		});
	});

	describe('error route', () => {
		it('errorPage is fetched with status code 0', async () => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			const result = await callLoad(null);

			expect(result.errorPage).toEqual(fakeErrorPage);
			expect(mockErrorPage).toHaveBeenCalledWith(0, expect.objectContaining({ pageCache: expect.any(Map) }));
		});
	});

	describe('happy path — all fetches resolve', () => {
		it('all 4 placements are fetched via adapter.nav.byPlacement', async () => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			await callLoad();

			const placements = (mockByPlacement.mock.calls as [string][]).map(([p]) => p);
			expect(placements).toContain('header');
			expect(placements).toContain('footer');
			expect(placements).toContain('mobile');
			expect(placements).toContain('menu');
		});

		it('resolves route SEO on the server with route params and request ctx', async () => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			await callLoad('/projects/[slug]', { slug: 'transit-data-pipeline' });

			expect(mockForRoute).toHaveBeenCalledWith(
				'/projects/[slug]',
				'en',
				{ slug: 'transit-data-pipeline' },
				expect.objectContaining({ pageCache: expect.any(Map) }),
			);
			expect(mockSiteSeoDefaults).toHaveBeenCalledWith(
				expect.objectContaining({ pageCache: expect.any(Map) }),
			);
		});

		it('loads morph shapes on the server for client animation hydration', async () => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			await callLoad('/');

			expect(mockMorphShapes).toHaveBeenCalledWith(
				expect.objectContaining({ pageCache: expect.any(Map) }),
			);
		});
	});

	describe('partial nav failure — header throws', () => {
		it('header slot falls back to staticNavLinks; other slots resolve normally', async () => {
			mockByPlacement.mockImplementation(async (placement: string) => {
				if (placement === 'header') throw new Error('CMS unreachable');
				if (placement === 'footer') return fakeFooterLinks;
				if (placement === 'mobile') return fakeMobileLinks;
				if (placement === 'menu') return fakeMenuItems;
				return [];
			});
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			const result = await callLoad();

			// Header failed → falls back to static
			expect(result.headerLinks).toEqual(staticNavLinks);
			// Other slots resolved normally
			expect(result.footerLinks).toEqual(fakeFooterLinks);
			expect(result.mobileLinks).toEqual(fakeMobileLinks);
			expect(result.menuItems).toEqual(fakeMenuItems);
		});

		it('footer slot failure returns empty array (no static fallback for footer)', async () => {
			mockByPlacement.mockImplementation(async (placement: string) => {
				if (placement === 'footer') throw new Error('CMS unreachable');
				if (placement === 'header') return fakeHeaderLinks;
				if (placement === 'mobile') return fakeMobileLinks;
				if (placement === 'menu') return fakeMenuItems;
				return [];
			});
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			const result = await callLoad();

			// Footer has no static fallback — defaults to []
			expect(result.footerLinks).toEqual([]);
			// Header resolved normally
			expect(result.headerLinks).toEqual(fakeHeaderLinks);
		});

		it('menu slot failure falls back to staticMenuItems', async () => {
			mockByPlacement.mockImplementation(async (placement: string) => {
				if (placement === 'menu') throw new Error('CMS unreachable');
				return [];
			});
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);

			const result = await callLoad();

			// Menu has staticMenuItems as fallback
			expect(result.menuItems).toEqual(staticMenuItems);
		});
	});

	describe('errorPage failure', () => {
		it('falls back to staticErrorPageContent when adapter.content.errorPage throws', async () => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockRejectedValueOnce(new Error('CMS unreachable'));

			const result = await callLoad(null);

			expect(result.errorPage).toEqual(staticErrorPageContent);
		});

		it('nav slots still resolve when only errorPage throws', async () => {
			mockByPlacement.mockImplementation(async (placement: string) => {
				if (placement === 'header') return fakeHeaderLinks;
				return [];
			});
			mockErrorPage.mockRejectedValueOnce(new Error('CMS unreachable'));

			const result = await callLoad(null);

			expect(result.headerLinks).toEqual(fakeHeaderLinks);
			expect(result.errorPage).toEqual(staticErrorPageContent);
		});
	});

	describe('SEO failure', () => {
		it('falls back to static error SEO without failing layout data', async () => {
			mockByPlacement.mockResolvedValue([]);
			mockErrorPage.mockResolvedValueOnce(fakeErrorPage);
			mockForRoute.mockRejectedValueOnce(new Error('CMS unreachable'));

			const result = await callLoad('/not-a-real-route');

			expect(result.seo.noIndex).toBe(true);
			expect(result.themeColor).toMatch(/^#/);
		});
	});

	describe('all-slots failure', () => {
		it('all nav slots fall back to static fixtures when every adapter call throws', async () => {
			mockByPlacement.mockRejectedValue(new Error('Complete CMS outage'));
			mockErrorPage.mockRejectedValueOnce(new Error('Complete CMS outage'));

			const result = await callLoad();

			// Each slot has its defined fallback
			expect(result.headerLinks).toEqual(staticNavLinks);
			expect(result.footerLinks).toEqual([]);   // footer fallback is []
			expect(result.mobileLinks).toEqual([]);   // mobile fallback is []
			expect(result.menuItems).toEqual(staticMenuItems);
			expect(result.errorPage).toEqual(staticErrorPageContent);
		});

		it('returns a complete object shape — all 5 keys present', async () => {
			mockByPlacement.mockRejectedValue(new Error('All down'));
			mockErrorPage.mockRejectedValueOnce(new Error('All down'));

			const result = await callLoad();

			expect(Object.keys(result).sort()).toEqual(
				['errorPage', 'footerLinks', 'headerLinks', 'locale', 'menuItems', 'mobileLinks', 'morphShapes', 'seo', 'themeColor'].sort(),
			);
		});
	});
});
