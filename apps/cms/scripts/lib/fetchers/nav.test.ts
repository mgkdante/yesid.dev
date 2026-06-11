import { describe, expect, it } from 'bun:test';
import {
	applyNavCascade,
	isRenderableNavLink,
	toNavLink,
	type DirectusNavLinkRow,
	type DirectusSitePageRef,
} from './nav';
import { NavLinkSchema } from '../schemas/nav';

const HEADER_ROW: DirectusNavLinkRow = {
	id: '1',
	status: 'published',
	placement: 'header',
	href: '/services',
	priority: 1,
	icon: null,
	translations: [
		{ languages_code: 'en', label: 'Services' },
		{ languages_code: 'fr', label: 'Services' },
		{ languages_code: 'es', label: 'Servicios' },
	],
};

const MENU_ROW: DirectusNavLinkRow = {
	id: '2',
	status: 'published',
	placement: 'menu',
	href: '/about',
	priority: 1,
	icon: { name: 'user' },
	translations: [
		{ languages_code: 'en', label: 'About', subtitle: 'the operator' },
		{ languages_code: 'fr', label: 'À propos', subtitle: "l'opérateur" },
		{ languages_code: 'es', label: 'Acerca de', subtitle: 'el operador' },
	],
};

describe('nav fetcher transform', () => {
	it('transforms a Directus nav_links row into NavLink', () => {
		const result = toNavLink(HEADER_ROW);
		expect(result).toEqual({
			label: { en: 'Services', fr: 'Services', es: 'Servicios' },
			href: '/services',
			priority: 1,
		});
	});

	it('resolves icon M2O FK to a string when present', () => {
		const result = toNavLink(MENU_ROW);
		expect(result.icon).toBe('user');
		expect(result.subtitle).toEqual({
			en: 'the operator',
			fr: "l'opérateur",
			es: 'el operador',
		});
	});

	it('omits subtitle when no translations have one', () => {
		const result = toNavLink(HEADER_ROW);
		expect(result.subtitle).toBeUndefined();
	});

	it('coerces unknown priority values to 1 (safe default)', () => {
		const weird: DirectusNavLinkRow = { ...HEADER_ROW, priority: 99 };
		const result = toNavLink(weird);
		expect(result.priority).toBe(1);
	});

	it('handles string icon (already-resolved)', () => {
		const stringIcon: DirectusNavLinkRow = { ...HEADER_ROW, icon: 'home' };
		const result = toNavLink(stringIcon);
		expect(result.icon).toBe('home');
	});

	it('output parses through NavLinkSchema (Zod gate)', () => {
		const result = toNavLink(MENU_ROW);
		expect(() => NavLinkSchema.parse(result)).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// slice-26.1 cascade contract — nav_links.page M2O → site_pages
// ---------------------------------------------------------------------------

const PUBLISHED_PAGE: DirectusSitePageRef = {
	path: '/tech-stack',
	status: 'published',
	translations: [
		{ languages_code: 'en', title: 'Tech Stack' },
		{ languages_code: 'fr', title: 'Tech Stack' },
		{ languages_code: 'es', title: 'Tech Stack' },
	],
};

const ARCHIVED_PAGE: DirectusSitePageRef = {
	path: '/blog',
	status: 'archived',
	translations: [{ languages_code: 'en', title: 'Blog' }],
};

const PAGE_LINKED_ROW: DirectusNavLinkRow = {
	id: '3',
	status: 'published',
	placement: 'header',
	href: '/legacy-href',
	priority: 1,
	sort: 1,
	page: PUBLISHED_PAGE,
	icon: null,
	translations: [],
};

describe('cascade contract — label + href resolution', () => {
	it('href comes from page.path when the link is page-linked (legacy href ignored)', () => {
		const result = toNavLink(PAGE_LINKED_ROW);
		expect(result.href).toBe('/tech-stack');
	});

	it('href falls back to link.href when page is null (reserved for external links)', () => {
		const result = toNavLink({ ...PAGE_LINKED_ROW, page: null, translations: [{ languages_code: 'en', label: 'Ext' }] });
		expect(result.href).toBe('/legacy-href');
	});

	it('label falls back to the page title when the link has no label override', () => {
		const result = toNavLink(PAGE_LINKED_ROW);
		expect(result.label).toEqual({ en: 'Tech Stack', fr: 'Tech Stack', es: 'Tech Stack' });
	});

	it('link label override beats the page title (e.g. Stack over Tech Stack)', () => {
		const overridden: DirectusNavLinkRow = {
			...PAGE_LINKED_ROW,
			translations: [
				{ languages_code: 'en', label: 'Stack' },
				{ languages_code: 'fr', label: 'Stack' },
				{ languages_code: 'es', label: 'Stack' },
			],
		};
		const result = toNavLink(overridden);
		expect(result.label).toEqual({ en: 'Stack', fr: 'Stack', es: 'Stack' });
	});

	it('page-linked output parses through NavLinkSchema (Zod gate)', () => {
		expect(() => NavLinkSchema.parse(toNavLink(PAGE_LINKED_ROW))).not.toThrow();
	});
});

describe('cascade contract — visibility (isRenderableNavLink)', () => {
	it('published link with null page renders', () => {
		expect(isRenderableNavLink({ ...PAGE_LINKED_ROW, page: null })).toBe(true);
	});

	it('published link to a published page renders', () => {
		expect(isRenderableNavLink(PAGE_LINKED_ROW)).toBe(true);
	});

	it('published link to an ARCHIVED page is hidden (the whole point)', () => {
		expect(isRenderableNavLink({ ...PAGE_LINKED_ROW, page: ARCHIVED_PAGE })).toBe(false);
	});

	it('non-published link is hidden regardless of page status', () => {
		expect(isRenderableNavLink({ ...PAGE_LINKED_ROW, status: 'draft' })).toBe(false);
		expect(isRenderableNavLink({ ...PAGE_LINKED_ROW, status: 'archived', page: null })).toBe(false);
	});

	it('unexpanded page FK (bare uuid string) fails CLOSED — cannot verify page status', () => {
		expect(isRenderableNavLink({ ...PAGE_LINKED_ROW, page: 'some-uuid' })).toBe(false);
	});
});

describe('cascade contract — applyNavCascade (filter + sort order)', () => {
	it('filters hidden links and orders by sort ascending (nulls last, id tiebreak)', () => {
		const rows: DirectusNavLinkRow[] = [
			{ ...PAGE_LINKED_ROW, id: 'b', sort: 2 },
			{ ...PAGE_LINKED_ROW, id: 'x', sort: null },
			{ ...PAGE_LINKED_ROW, id: 'hidden', sort: 1, page: ARCHIVED_PAGE },
			{ ...PAGE_LINKED_ROW, id: 'a', sort: 1 },
			{ ...PAGE_LINKED_ROW, id: 'a2', sort: 1 },
		];
		const out = applyNavCascade(rows);
		expect(out.map((r) => r.id)).toEqual(['a', 'a2', 'b', 'x']);
	});

	it('does not mutate its input', () => {
		const rows: DirectusNavLinkRow[] = [
			{ ...PAGE_LINKED_ROW, id: 'b', sort: 2 },
			{ ...PAGE_LINKED_ROW, id: 'a', sort: 1 },
		];
		applyNavCascade(rows);
		expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
	});

	it('priority no longer affects ordering (sort replaces it)', () => {
		const rows: DirectusNavLinkRow[] = [
			{ ...PAGE_LINKED_ROW, id: 'low-priority-first', priority: 2, sort: 1 },
			{ ...PAGE_LINKED_ROW, id: 'high-priority-second', priority: 1, sort: 2 },
		];
		const out = applyNavCascade(rows);
		expect(out.map((r) => r.id)).toEqual(['low-priority-first', 'high-priority-second']);
	});
});
