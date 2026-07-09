// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// /blog page chrome (intro, heading, back-nav labels). NEW in slice-18m — was previously inlined as a static fallback in adapters/static.ts.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { BlogPageContent } from '@repo/shared';

export const blogPageContent: BlogPageContent = {
	backToDispatches: {
		en: '← back to Blog',
		es: '← volver al blog',
		fr: '← retour au blogue',
	},
	backToPersonal: {
		en: '← back to personal corner',
		es: '← volver al rincón personal',
		fr: '← retour au coin personnel',
	},
	entryRail: {
		routes: {
			links: [
				{
					href: '/about',
					label: {
						en: 'About the author',
						es: 'Sobre el autor',
						fr: 'À propos de l\'auteur',
					},
				},
				{
					href: '/projects',
					label: {
						en: 'Case studies',
						es: 'Casos de estudio',
						fr: 'Études de cas',
					},
				},
				{
					href: '/services',
					label: { en: 'Services', es: 'Servicios', fr: 'Services' },
				},
				{
					href: '/tech-stack',
					label: { en: 'Stack', es: 'Stack', fr: 'Stack' },
				},
				{
					href: '/contact',
					label: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
				},
			],
			title: {
				en: 'Pick A Route',
				es: 'Elige una ruta',
				fr: 'Choisir une route',
			},
		},
		workWithMe: {
			primary: {
				href: '/services',
				label: {
					en: 'View Services',
					es: 'Ver servicios',
					fr: 'Voir les services',
				},
			},
			prompt: {
				en: 'Need a system that stays editable?',
				es: '¿Necesitas un sistema que se mantenga editable?',
				fr: 'Besoin d’un système qui reste éditable?',
			},
			secondary: {
				href: '/contact',
				label: {
					en: 'Start a Project',
					es: 'Empezar un proyecto',
					fr: 'Démarrer un projet',
				},
			},
			title: {
				en: 'Work With Me',
				es: 'Trabaja conmigo',
				fr: 'Travailler ensemble',
			},
		},
	},
	heading: { en: 'Blog', es: 'Blog', fr: 'Blogue' },
	intro: {
		en: 'Notes on digital infrastructure, databases, and building reliable systems.',
		es: 'Notas sobre infraestructura digital, bases de datos y cómo construir sistemas confiables.',
		fr: 'Des notes sur l\'infrastructure numérique, les bases de données et la construction de systèmes fiables.',
	},
	personalHeading: {
		en: 'Personal Corner',
		es: 'Rincón personal',
		fr: 'Coin perso',
	},
	personalIntro: {
		en: 'Trains, space, tools, and the off-work notes that still shape how I build.',
		es: 'Trenes, espacio, herramientas y esas notas por fuera del trabajo que todavía moldean mi manera de construir.',
		fr: 'Trains, espace, outils, et les notes hors mandat qui influencent encore ma façon de bâtir.',
	},
	toPersonalLabel: {
		en: 'Personal Corner',
		es: 'Rincón personal',
		fr: 'Coin perso',
	},
	toPersonalSubtitle: {
		en: 'Off the clock',
		es: 'Fuera de horario',
		fr: 'Hors mandat',
	},
	toProfessionalLabel: {
		en: 'Back to Blog',
		es: 'Volver al blog',
		fr: 'Retour au blogue',
	},
	toProfessionalSubtitle: {
		en: 'Brand notes',
		es: 'Notas de marca',
		fr: 'Notes de marque',
	},
};
