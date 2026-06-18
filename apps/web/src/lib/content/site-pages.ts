// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// Published site_pages registry rows (path, type, title). PUBLISHED rows only — a path's absence IS the hidden signal: the route gate 404s it, the sitemap drops it, and nav links pointing at it disappear (cascade applied in the nav fetcher). NEW in slice-26.1.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { SitePage } from '$lib/types';

export const sitePages: readonly SitePage[] = [
	{
		path: '/',
		title: { en: 'Home', es: 'Inicio', fr: 'Accueil' },
		type: 'freeform',
	},
	{
		path: '/services',
		title: { en: 'Services', es: 'Servicios', fr: 'Services' },
		type: 'listing',
	},
	{
		path: '/projects',
		title: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
		type: 'listing',
	},
	{
		path: '/blog',
		title: { en: 'Blog', es: 'Blog', fr: 'Blog' },
		type: 'listing',
	},
	{
		path: '/blog/personal',
		title: {
			en: 'Personal Corner',
			es: 'Rincón personal',
			fr: 'Coin perso',
		},
		type: 'listing',
	},
	{
		path: '/tech-stack',
		title: {
			en: 'Tech Stack',
			es: 'Stack tecnológico',
			fr: 'Stack technique',
		},
		type: 'listing',
	},
	{
		path: '/about',
		title: { en: 'About', es: 'Acerca de', fr: 'À propos' },
		type: 'freeform',
	},
	{
		path: '/contact',
		title: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
		type: 'freeform',
	},
];
