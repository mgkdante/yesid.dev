// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Navigation links (header + menu placements) + error page fallback. Interfaces, navDirections, sharedChromeContent live in nav.companion.ts.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { NavLink, MenuItem, ErrorPageContent } from './nav.companion';

export const navLinks: readonly NavLink[] = [
	{
		href: '/services',
		label: { en: 'Services', es: 'Servicios', fr: 'Services' },
		priority: 1,
	},
	{
		href: '/projects',
		label: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
		priority: 1,
	},
	{
		href: '/tech-stack',
		label: { en: 'Stack', es: 'Stack', fr: 'Stack' },
		priority: 1,
	},
];

export const menuItems: readonly MenuItem[] = [
	{
		href: '/services',
		label: { en: 'Services', es: 'Servicios', fr: 'Services' },
		priority: 2,
		subtitle: {
			en: 'what I build',
			es: 'lo que construyo',
			fr: 'ce que je construis',
		},
	},
	{
		href: '/projects',
		label: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
		priority: 1,
		subtitle: {
			en: 'proof it ships',
			es: 'prueba de que se entrega',
			fr: 'la preuve que ça livre',
		},
	},
	{
		href: '/tech-stack',
		label: { en: 'Stack', es: 'Stack', fr: 'Stack' },
		priority: 1,
		subtitle: {
			en: 'the toolbox',
			es: 'la caja de herramientas',
			fr: 'la boîte à outils',
		},
	},
	{
		href: '/blog',
		label: { en: 'Blog', es: 'Blog', fr: 'Blog' },
		priority: 1,
		subtitle: {
			en: 'thoughts in transit',
			es: 'pensamientos en tránsito',
			fr: 'pensées en transit',
		},
	},
	{
		href: '/about',
		label: { en: 'About', es: 'Acerca de', fr: 'À propos' },
		priority: 1,
		subtitle: {
			en: 'the operator',
			es: 'el operador',
			fr: 'l\'opérateur',
		},
	},
	{
		href: '/contact',
		label: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
		priority: 1,
		subtitle: {
			en: 'open channel',
			es: 'canal abierto',
			fr: 'canal ouvert',
		},
	},
];

export const errorPageContent: ErrorPageContent = {
	description: { en: 'The page you were looking for could not be found.' },
	heading: { en: 'This station is offline' },
	label: { en: 'PAGE NOT FOUND' },
	suggestions: [
		{
			href: '/',
			label: { en: 'Home' },
		},
		{
			href: '/services',
			label: { en: 'Services' },
		},
	],
	terminalLine: '$ route --status 0 // generic fallback',
};

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'nav'.
export * from './nav.companion';
