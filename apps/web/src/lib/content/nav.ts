// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// Navigation links (header + menu + footer + mobile placements) + error page fallback.
//
// Source: shared fixture or live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated before web consumers.
// Ephemeral output; commit fixture or CMS source changes instead.
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
];

export const menuItems: readonly MenuItem[] = [
	{
		href: '/services',
		label: { en: 'Services', es: 'Servicios', fr: 'Services' },
		priority: 1,
		subtitle: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
	},
	{
		href: '/projects',
		label: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
		priority: 1,
		subtitle: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
	},
	{
		href: '/blog',
		label: { en: 'Blog', es: 'Blog', fr: 'Blog' },
		priority: 1,
		subtitle: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
	},
	{
		href: '/about',
		label: { en: 'About', es: 'Acerca de', fr: 'À propos' },
		priority: 1,
		subtitle: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
	},
	{
		href: '/contact',
		label: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
		priority: 1,
		subtitle: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
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
];

export const errorPageContent: ErrorPageContent = {
	description: {
		en: 'Fixture copy.',
		es: 'Fixture copy.',
		fr: 'Fixture copy.',
	},
	heading: {
		en: 'This station is offline',
		es: 'Estación fuera de servicio',
		fr: 'Cette station est hors ligne',
	},
	label: {
		en: 'PAGE NOT FOUND',
		es: 'PÁGINA NO ENCONTRADA',
		fr: 'PAGE INTROUVABLE',
	},
	suggestions: [
		{
			href: '/',
			label: { en: 'Home', es: 'Inicio', fr: 'Accueil' },
		},
		{
			href: '/services',
			label: { en: 'Services', es: 'Servicios', fr: 'Services' },
		},
	],
	terminalLine: '$ route --status 0 // generic fallback',
};
