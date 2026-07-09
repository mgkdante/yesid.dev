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
	{
		path: '/legal/privacy',
		title: {
			en: 'Privacy Policy',
			es: 'Política de privacidad',
			fr: 'Politique de confidentialité',
		},
		type: 'freeform',
	},
	{
		path: '/legal/terms',
		title: {
			en: 'Terms of Use',
			es: 'Condiciones de uso',
			fr: 'Conditions d\'utilisation',
		},
		type: 'freeform',
	},
	{
		path: '/legal/cookies',
		title: {
			en: 'Cookie and Tracking Policy',
			es: 'Política de cookies',
			fr: 'Politique sur les témoins (cookies)',
		},
		type: 'freeform',
	},
	{
		path: '/legal/accessibility',
		title: {
			en: 'Accessibility Statement',
			es: 'Declaración de accesibilidad',
			fr: 'Déclaration d\'accessibilité',
		},
		type: 'freeform',
	},
	{
		path: '/legal/notice',
		title: {
			en: 'Legal Notice',
			es: 'Aviso legal',
			fr: 'Avis juridique',
		},
		type: 'freeform',
	},
];
