/**
 * nav fetcher — reads the `nav_links` flat collection ONCE, then groups by
 * placement client-side into the shape `content/nav.ts` exports today
 * (`navLinks` for header placement, `menuItems` for menu placement, plus
 * footer + mobile slots).
 *
 * slice-26.1 (content controls): nav_links rows now carry a `page` M2O FK
 * into the `site_pages` registry plus a `sort` order field. The CASCADE
 * CONTRACT applied here:
 *
 *   - a link renders iff link.status == 'published'
 *     AND (link.page is null OR page.status == 'published')
 *   - label = link label override (optional translations) ?? page title
 *   - href  = page.path ?? link.href (legacy fallback for page-less rows;
 *             null page stays reserved for future external links)
 *   - order = `sort` ascending per placement (`priority` is no longer the
 *             order field but stays in the emitted NavLink shape — components
 *             still use it for adaptive display)
 *
 * Archiving a site_pages row therefore drops every nav/footer/menu/mobile
 * link pointing at it on the next build — no nav_links edit required.
 *
 * Output keeps the pre-26.1 NavLink shape (label/href/priority/subtitle/icon)
 * so the emitted nav.ts and its consumers stay byte-compatible.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { toLocalizedString, toLocalizedStringOrUndef } from '../locale';
import { NavLinkSchema, type NavLink } from '../schemas/nav';
import type { FetcherContext } from './types';

export interface DirectusNavLinkTranslation {
	languages_code: string;
	label?: string | null;
	subtitle?: string | null;
}

export interface DirectusNavLinkIconRow {
	name?: string | null;
}

export interface DirectusSitePageRef {
	path?: string | null;
	status?: string | null;
	translations?: Array<{ languages_code: string; title?: string | null }>;
}

export interface DirectusNavLinkRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	placement: 'header' | 'footer' | 'mobile' | 'menu';
	href: string;
	priority: number;
	/** slice-26.1: order field within a placement slot (replaces priority for ordering). */
	sort?: number | null;
	/**
	 * slice-26.1: M2O FK → site_pages. Expanded object when fetched with
	 * page.{path,status,translations}; a bare uuid string means the expansion
	 * was lost — the cascade treats that as unverifiable and hides the link.
	 */
	page?: DirectusSitePageRef | string | null;
	icon?: DirectusNavLinkIconRow | string | null;
	translations?: DirectusNavLinkTranslation[];
}

export interface NavData {
	navLinks: readonly NavLink[];
	menuItems: readonly NavLink[];
	footerLinks: readonly NavLink[];
	mobileLinks: readonly NavLink[];
}

/**
 * Cascade visibility — pure, tested standalone.
 *
 * A link renders iff link.status == 'published' AND (page is null OR
 * page.status == 'published'). A non-expanded page FK (bare uuid string)
 * fails CLOSED: we cannot verify the page is published, and leaking a link
 * to an archived page would break the whole point of the registry.
 */
export function isRenderableNavLink(raw: DirectusNavLinkRow): boolean {
	if (raw.status !== 'published') return false;
	if (raw.page === null || raw.page === undefined) return true;
	if (typeof raw.page === 'string') return false;
	return raw.page.status === 'published';
}

/**
 * Pure cascade + ordering helper: drops non-renderable links, then orders by
 * `sort` ascending (nulls last) with `id` tiebreak for determinism.
 */
export function applyNavCascade(rows: readonly DirectusNavLinkRow[]): DirectusNavLinkRow[] {
	return rows.filter(isRenderableNavLink).sort((a, b) => {
		const sa = a.sort ?? Number.MAX_SAFE_INTEGER;
		const sb = b.sort ?? Number.MAX_SAFE_INTEGER;
		if (sa !== sb) return sa - sb;
		return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
	});
}

/** Pure transform — DirectusNavLinkRow → NavLink. Tested standalone. */
export function toNavLink(raw: DirectusNavLinkRow): NavLink {
	const tr = (raw.translations ?? []) as ReadonlyArray<{ languages_code: string }>;
	const priority = raw.priority === 1 || raw.priority === 2 ? (raw.priority as 1 | 2) : 1;

	// Resolve icon M2O FK to an icon name string.
	let icon: string | undefined;
	if (raw.icon && typeof raw.icon === 'object' && 'name' in raw.icon) {
		const name = (raw.icon as DirectusNavLinkIconRow).name;
		if (name) icon = name;
	} else if (typeof raw.icon === 'string' && raw.icon.length > 0) {
		icon = raw.icon;
	}

	const page = raw.page && typeof raw.page === 'object' ? raw.page : null;
	const pageTr = (page?.translations ?? []) as ReadonlyArray<{ languages_code: string }>;

	// Cascade label: the link's own translations are an OPTIONAL override
	// (whole-object — a link that overrides supplies its own locale set, e.g.
	// 'Stack' over page title 'Tech Stack'); otherwise fall back to the
	// registry page's title.
	const overrideLabel = toLocalizedStringOrUndef(tr, 'label');
	const label = overrideLabel ?? toLocalizedString(pageTr, 'title');

	// Cascade href: registry path wins; legacy href only serves page-less rows.
	const href = page?.path ? page.path : raw.href;

	const subtitleLS = toLocalizedStringOrUndef(tr, 'subtitle');

	const result: NavLink = {
		label,
		href,
		priority,
	};
	if (subtitleLS !== undefined) result.subtitle = subtitleLS;
	if (icon !== undefined) result.icon = icon;
	return result;
}

/** Fetch + validate all four placements (header, menu, footer, mobile) in one round-trip. */
export async function fetchNavData({ client }: FetcherContext): Promise<NavData> {
	const rows = (await client.request(
		readItems('nav_links', {
			filter: {
				status: { _eq: 'published' },
			} as unknown as Record<string, unknown>,
			fields: [
				'*',
				'translations.*',
				'icon.*',
				'page.path',
				'page.status',
				'page.translations.*',
			] as unknown as (keyof DirectusNavLinkRow)[],
			sort: ['sort'],
			limit: -1,
		}),
	)) as unknown as DirectusNavLinkRow[];

	// Cascade is re-applied client-side: the API filter only covers
	// link.status; archived-page hiding + deterministic ordering happen here.
	const visible = applyNavCascade(rows);

	const header = visible.filter((r) => r.placement === 'header').map(toNavLink);
	const menu = visible.filter((r) => r.placement === 'menu').map(toNavLink);
	const footer = visible.filter((r) => r.placement === 'footer').map(toNavLink);
	const mobile = visible.filter((r) => r.placement === 'mobile').map(toNavLink);

	return {
		navLinks: z.array(NavLinkSchema).parse(header),
		menuItems: z.array(NavLinkSchema).parse(menu),
		footerLinks: z.array(NavLinkSchema).parse(footer),
		mobileLinks: z.array(NavLinkSchema).parse(mobile),
	};
}
