// Hand-written companion to the CMS-derived `nav.ts` (slice-18m).
//
// Holds the navigation type defs (NavLink, MenuItem, ErrorPageContent) and the
// shared-chrome constants (`navDirections`, `sharedChromeContent`) that don't
// originate from a CMS collection. The generated `nav.ts` imports the types
// from this file so consumers can keep importing from `$lib/content/nav`
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

/** Generic directional labels for prev/next navigation surfaces. Extracted from
 *  ServiceNav in Task 17b-7f; kept multilingual to match the rest of nav.ts. */
export const navDirections = {
	previous: { en: 'Previous', fr: 'Précédent', es: 'Anterior' } satisfies LocalizedString,
	next: { en: 'Next', fr: 'Suivant', es: 'Siguiente' } satisfies LocalizedString,
} as const;

/** Shared chrome extracted from layout/shared components in Task 17b-7j.
 *  Consumed by Nav (menu toggle), MenuOverlay (dialog title + footer label),
 *  Footer (footer nav aria), SearchInput (default placeholder), FilterSummary
 *  (clear button), TableOfContents (heading + arias + mobile button).
 *  Multilingual where the string is user-facing navigation copy; decorative
 *  chrome stays en-only to match the "no backfill" rule from 17b-5. */
export const sharedChromeContent = {
	openMenuAria: {
		en: 'Open menu',
		fr: 'Ouvrir le menu',
		es: 'Abrir menú',
	} satisfies LocalizedString,
	closeMenuAria: {
		en: 'Close menu',
		fr: 'Fermer le menu',
		es: 'Cerrar menú',
	} satisfies LocalizedString,
	/** GO-W2.2 theme toggle. Switch semantics: checked = dark (brand default). */
	themeToggleAria: {
		en: 'Dark theme',
		fr: 'Thème sombre',
		es: 'Tema oscuro',
	} satisfies LocalizedString,
	footerNavAria: {
		en: 'Footer navigation',
		fr: 'Navigation du pied de page',
		es: 'Navegación del pie de página',
	} satisfies LocalizedString,
	menuOverlayAria: {
		en: 'Navigation menu',
		fr: 'Menu de navigation',
		es: 'Menú de navegación',
	} satisfies LocalizedString,
	/** Decorative all-caps label in the menu overlay footer. */
	menuOverlayFooterLabel: {
		en: 'NAVIGATION · ALL ROUTES',
		fr: 'NAVIGATION · TOUTES LES ROUTES',
		es: 'NAVEGACIÓN · TODAS LAS RUTAS',
	} satisfies LocalizedString,
	/** aria-label for the EN|FR locale switcher (slice-28.6). Locale display
	 *  labels are the codes themselves (EN/FR — brand mono caps, not prose). */
	localeSwitcherAria: {
		en: 'Language',
		fr: 'Langue',
		es: 'Idioma',
	} satisfies LocalizedString,
	searchPlaceholder: {
		en: 'Search...',
		fr: 'Rechercher...',
		es: 'Buscar...',
	} satisfies LocalizedString,
	clearFiltersLabel: {
		en: 'clear filters',
		fr: 'effacer les filtres',
		es: 'borrar filtros',
	} satisfies LocalizedString,
	tocToggleSectionAria: {
		en: 'Toggle section',
		fr: 'Basculer la section',
		es: 'Alternar sección',
	} satisfies LocalizedString,
	tocHeading: {
		en: 'On this page',
		fr: 'Sur cette page',
		es: 'En esta página',
	} satisfies LocalizedString,
	tocMobileButton: {
		en: 'Table of Contents',
		fr: 'Table des matières',
		es: 'Tabla de contenidos',
	} satisfies LocalizedString,
} as const;

export interface ErrorPageContent {
	label: LocalizedString;
	heading: LocalizedString;
	description: LocalizedString;
	terminalLine: string;
	suggestions: readonly { label: LocalizedString; href: string }[];
}
