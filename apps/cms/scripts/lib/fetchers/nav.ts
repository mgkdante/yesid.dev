/**
 * nav fetcher — reads the `nav_links` flat collection ONCE, then groups by
 * placement client-side into the shape `content/nav.ts` exports today
 * (`navLinks` for header placement, `menuItems` for menu placement). Footer
 * and mobile placements are not currently surfaced through the static
 * fallback (static.ts returns [] for those).
 *
 * Mirrors transformNavLink at apps/web/src/lib/adapters/directus.ts:1913.
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

export interface DirectusNavLinkRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	placement: 'header' | 'footer' | 'mobile' | 'menu';
	href: string;
	priority: number;
	icon?: DirectusNavLinkIconRow | string | null;
	translations?: DirectusNavLinkTranslation[];
}

export interface NavData {
	navLinks: readonly NavLink[];
	menuItems: readonly NavLink[];
	footerLinks: readonly NavLink[];
	mobileLinks: readonly NavLink[];
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

	const subtitleLS = toLocalizedStringOrUndef(tr, 'subtitle');

	const result: NavLink = {
		label: toLocalizedString(tr, 'label'),
		href: raw.href,
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
			fields: ['*', 'translations.*', 'icon.*'] as unknown as (keyof DirectusNavLinkRow)[],
			sort: ['priority'],
		}),
	)) as unknown as DirectusNavLinkRow[];

	const header = rows.filter((r) => r.placement === 'header').map(toNavLink);
	const menu = rows.filter((r) => r.placement === 'menu').map(toNavLink);
	const footer = rows.filter((r) => r.placement === 'footer').map(toNavLink);
	const mobile = rows.filter((r) => r.placement === 'mobile').map(toNavLink);

	return {
		navLinks: z.array(NavLinkSchema).parse(header),
		menuItems: z.array(NavLinkSchema).parse(menu),
		footerLinks: z.array(NavLinkSchema).parse(footer),
		mobileLinks: z.array(NavLinkSchema).parse(mobile),
	};
}
