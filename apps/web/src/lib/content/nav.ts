import type { LocalizedString } from '$lib/types';

export interface NavLink {
	label: LocalizedString;
	href: string;
	/** 1 = always visible, 2 = hidden on narrow viewports */
	priority: 1 | 2;
}

export interface MenuItem {
	label: LocalizedString;
	href: string;
	subtitle: LocalizedString;
}

/** Generic directional labels for prev/next navigation surfaces. Extracted from
 *  ServiceNav in Task 17b-7f; kept multilingual to match the rest of nav.ts. */
export const navDirections = {
	previous: { en: 'Previous', fr: 'Précédent', es: 'Anterior' } satisfies LocalizedString,
	next: { en: 'Next', fr: 'Suivant', es: 'Siguiente' } satisfies LocalizedString
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
		es: 'Abrir menú'
	} satisfies LocalizedString,
	closeMenuAria: {
		en: 'Close menu',
		fr: 'Fermer le menu',
		es: 'Cerrar menú'
	} satisfies LocalizedString,
	footerNavAria: {
		en: 'Footer navigation',
		fr: 'Navigation du pied de page',
		es: 'Navegación del pie de página'
	} satisfies LocalizedString,
	menuOverlayAria: {
		en: 'Navigation menu',
		fr: 'Menu de navigation',
		es: 'Menú de navegación'
	} satisfies LocalizedString,
	/** Decorative all-caps label in the menu overlay footer. */
	menuOverlayFooterLabel: { en: 'NAVIGATION — ALL ROUTES' } satisfies LocalizedString,
	searchPlaceholder: {
		en: 'Search...',
		fr: 'Rechercher...',
		es: 'Buscar...'
	} satisfies LocalizedString,
	clearFiltersLabel: {
		en: 'clear filters',
		fr: 'effacer les filtres',
		es: 'borrar filtros'
	} satisfies LocalizedString,
	tocToggleSectionAria: { en: 'Toggle section' } satisfies LocalizedString,
	tocHeading: {
		en: 'On this page',
		fr: 'Sur cette page',
		es: 'En esta página'
	} satisfies LocalizedString,
	tocMobileButton: {
		en: 'Table of Contents',
		fr: 'Table des matières',
		es: 'Tabla de contenidos'
	} satisfies LocalizedString
} as const;

export interface ErrorPageContent {
	label: LocalizedString;
	heading: LocalizedString;
	description: LocalizedString;
	terminalLine: string;
	suggestions: readonly { label: LocalizedString; href: string }[];
}

export const navLinks: readonly NavLink[] = [
	{
		label: { en: 'Services', fr: 'Services', es: 'Servicios' },
		href: '/services',
		priority: 1
	},
	{
		label: { en: 'Projects', fr: 'Projets', es: 'Proyectos' },
		href: '/projects',
		priority: 1
	},
	{
		label: { en: 'Stack', fr: 'Stack', es: 'Stack' },
		href: '/tech-stack',
		priority: 2
	}
] as const;

export const menuItems: readonly MenuItem[] = [
	{
		label: { en: 'Services', fr: 'Services', es: 'Servicios' },
		href: '/services',
		subtitle: { en: 'what I build', fr: 'ce que je construis', es: 'lo que construyo' }
	},
	{
		label: { en: 'Projects', fr: 'Projets', es: 'Proyectos' },
		href: '/projects',
		subtitle: { en: 'proof it ships', fr: 'la preuve que ça livre', es: 'prueba de que se entrega' }
	},
	{
		label: { en: 'Stack', fr: 'Stack', es: 'Stack' },
		href: '/tech-stack',
		subtitle: { en: 'the toolbox', fr: 'la boîte à outils', es: 'la caja de herramientas' }
	},
	{
		label: { en: 'Blog', fr: 'Blog', es: 'Blog' },
		href: '/blog',
		subtitle: { en: 'thoughts in transit', fr: 'pensées en transit', es: 'pensamientos en tránsito' }
	},
	{
		label: { en: 'About', fr: 'À propos', es: 'Acerca de' },
		href: '/about',
		subtitle: { en: 'the operator', fr: "l'opérateur", es: 'el operador' }
	},
	{
		label: { en: 'Contact', fr: 'Contact', es: 'Contacto' },
		href: '/contact',
		subtitle: { en: 'open channel', fr: 'canal ouvert', es: 'canal abierto' }
	}
] as const;

export const errorPageContent: ErrorPageContent = {
	label: { en: 'ROUTE NOT FOUND', fr: 'ROUTE INTROUVABLE', es: 'RUTA NO ENCONTRADA' },
	heading: {
		en: 'This station is under construction',
		fr: 'Cette station est en construction',
		es: 'Esta estación está en construcción'
	},
	description: {
		en: "The route you requested doesn't exist or has been rerouted. Here are some active lines:",
		fr: "La route demandée n'existe pas ou a été redirigée. Voici quelques lignes actives :",
		es: 'La ruta solicitada no existe o ha sido redirigida. Aquí hay algunas líneas activas:'
	},
	terminalLine: '$ route --status 404 // requested path not in service',
	suggestions: [
		{ label: { en: 'Services', fr: 'Services', es: 'Servicios' }, href: '/services' },
		{ label: { en: 'Projects', fr: 'Projets', es: 'Proyectos' }, href: '/projects' },
		{ label: { en: 'Contact', fr: 'Contact', es: 'Contacto' }, href: '/contact' }
	]
} as const;
