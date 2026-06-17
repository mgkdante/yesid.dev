// Hand-written companion to the CMS-derived `nav.ts` (slice-18m).
//
// Holds the navigation type defs (NavLink, MenuItem, ErrorPageContent). The
// generated `nav.ts` imports the types from this file so consumers can keep
// importing from `$lib/content/nav`
// (re-exported via the index.ts barrel + via nav.ts itself).

import type { LocalizedString } from '$lib/types';

export interface NavLink {
	label: LocalizedString;
	href: string;
	/** 1 = always visible, 2 = hidden on narrow viewports */
	priority: 1 | 2;
	/** Optional subtitle copy — present on menu-placement links. */
	subtitle?: LocalizedString;
	/** Optional icon name resolved from the icons collection M2O FK. */
	icon?: string;
}

/**
 * MenuItem is structurally identical to NavLink — the `subtitle` field is
 * required conceptually for menu placement but optional at the type level so
 * the same NavLink shape works for all placements. Preserved as a type alias
 * for backwards compatibility with existing call sites.
 */
export type MenuItem = NavLink;

// Chrome constants retired to the CMS cache (2026-06-15):
// consumers now read siteLabels.navChrome.

export interface ErrorPageContent {
	label: LocalizedString;
	heading: LocalizedString;
	description: LocalizedString;
	terminalLine: string;
	suggestions: readonly { label: LocalizedString; href: string }[];
}
