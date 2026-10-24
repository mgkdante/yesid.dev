// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// All published error_pages rows keyed by status_code. Powers static content.errorPage(statusCode) per-code lookup.
//
// Source: shared fixture or live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated before web consumers.
// Ephemeral output; commit fixture or CMS source changes instead.
// ----------------------------------------------------------------------

import type { ErrorPageContent } from '$lib/navigation/types';

export const errorPagesById: Readonly<Record<number, ErrorPageContent>> = {
	'0': {
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
	},
	'404': {
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		heading: {
			en: 'This station is under construction',
			es: 'Esta estación está en construcción',
			fr: 'Cette station est en construction',
		},
		label: {
			en: 'ROUTE NOT FOUND',
			es: 'RUTA NO ENCONTRADA',
			fr: 'ROUTE INTROUVABLE',
		},
		suggestions: [
			{
				href: '/services',
				label: { en: 'Services', es: 'Servicios', fr: 'Services' },
			},
			{
				href: '/projects',
				label: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
			},
			{
				href: '/contact',
				label: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
			},
		],
		terminalLine: '$ route --status 404 // requested path not in service',
	},
	'500': {
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		heading: {
			en: 'Something went wrong',
			es: 'Algo salió mal',
			fr: 'Quelque chose a mal tourné',
		},
		label: {
			en: 'SYSTEM ERROR',
			es: 'ERROR DE SISTEMA',
			fr: 'ERREUR SYSTÈME',
		},
		suggestions: [
			{
				href: '/',
				label: { en: 'Home', es: 'Inicio', fr: 'Accueil' },
			},
			{
				href: '/contact',
				label: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
			},
		],
		terminalLine: '$ route --status 500 // internal server error',
	},
};
