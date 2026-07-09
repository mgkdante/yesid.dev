// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// Navigation links (header + menu + footer + mobile placements) + error page fallback.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { NavLink, MenuItem, ErrorPageContent } from '$lib/navigation/types';

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
		priority: 2,
	},
];

export const menuItems: readonly MenuItem[] = [
	{
		href: '/services',
		label: { en: 'Services', es: 'Servicios', fr: 'Services' },
		priority: 1,
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

export const footerLinks: readonly NavLink[] = [
	{
		href: '/blog',
		label: { en: 'Blog', es: 'Blog', fr: 'Blog' },
		priority: 1,
	},
	{
		href: '/about',
		label: { en: 'About', es: 'Acerca de', fr: 'À propos' },
		priority: 1,
	},
	{
		href: '/contact',
		label: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
		priority: 1,
	},
	{
		href: '/legal/privacy',
		label: {
			en: 'Privacy Policy',
			es: 'Política de privacidad',
			fr: 'Politique de confidentialité',
		},
		priority: 1,
	},
	{
		href: '/legal/terms',
		label: {
			en: 'Terms of Use',
			es: 'Condiciones de uso',
			fr: 'Conditions d\'utilisation',
		},
		priority: 1,
	},
	{
		href: '/legal/cookies',
		label: {
			en: 'Cookie and Tracking Policy',
			es: 'Política de cookies',
			fr: 'Politique sur les témoins (cookies)',
		},
		priority: 1,
	},
	{
		href: '/legal/accessibility',
		label: {
			en: 'Accessibility Statement',
			es: 'Declaración de accesibilidad',
			fr: 'Déclaration d\'accessibilité',
		},
		priority: 1,
	},
	{
		href: '/legal/notice',
		label: {
			en: 'Legal Notice',
			es: 'Aviso legal',
			fr: 'Avis juridique',
		},
		priority: 1,
	},
];

export const mobileLinks: readonly NavLink[] = [
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
		priority: 2,
	},
];

export const errorPageContent: ErrorPageContent = {
	description: {
		en: 'The page you were looking for could not be found.',
		fr: 'La page que tu cherchais est introuvable.',
	},
	heading: {
		en: 'This station is offline',
		fr: 'Cette station est hors ligne',
	},
	label: { en: 'PAGE NOT FOUND', fr: 'PAGE INTROUVABLE' },
	suggestions: [
		{
			href: '/',
			label: { en: 'Home', fr: 'Accueil' },
		},
		{
			href: '/services',
			label: { en: 'Services', fr: 'Services' },
		},
	],
	terminalLine: '$ route --status 0 // generic fallback',
};
