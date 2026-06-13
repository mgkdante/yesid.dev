// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// All published error_pages rows keyed by status_code. Powers static content.errorPage(statusCode) per-code lookup.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { ErrorPageContent } from './nav.companion';

export const errorPagesById: Readonly<Record<number, ErrorPageContent>> = {
	'0': {
		description: {
			en: 'The page you were looking for could not be found.',
			fr: 'La page que vous cherchiez est introuvable.',
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
	},
	'404': {
		description: {
			en: 'The route you requested doesn\'t exist or has been rerouted. Here are some active lines:',
			es: 'La ruta solicitada no existe o ha sido redirigida. Aquí hay algunas líneas activas:',
			fr: 'La route demandée n\'existe pas ou a été redirigée. Voici quelques lignes actives :',
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
			en: 'The server encountered an unexpected error. Please try again later.',
			fr: 'Le serveur a rencontré une erreur inattendue. Réessayez plus tard.',
		},
		heading: {
			en: 'Something went wrong',
			fr: 'Quelque chose a mal tourné',
		},
		label: { en: 'SYSTEM ERROR', fr: 'ERREUR SYSTÈME' },
		suggestions: [
			{
				href: '/',
				label: { en: 'Home', fr: 'Accueil' },
			},
			{
				href: '/contact',
				label: { en: 'Contact', fr: 'Contact' },
			},
		],
		terminalLine: '$ route --status 500 // internal server error',
	},
};
