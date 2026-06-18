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
	backToDispatches: { en: '← back to Blog', fr: '← retour au blogue' },
	backToPersonal: {
		en: '← back to personal corner',
		fr: '← retour au coin personnel',
	},
	entryRail: {
		routes: {
			links: [
				{
					href: '/about',
					label: { en: 'About the author', fr: 'À propos de l\'auteur' },
				},
				{
					href: '/projects',
					label: { en: 'Case studies', fr: 'Études de cas' },
				},
				{
					href: '/services',
					label: { en: 'Services', fr: 'Services' },
				},
				{
					href: '/tech-stack',
					label: { en: 'Stack', fr: 'Stack' },
				},
				{
					href: '/contact',
					label: { en: 'Contact', fr: 'Contact' },
				},
			],
			title: { en: 'Pick A Route', fr: 'Choisir une route' },
		},
		workWithMe: {
			primary: {
				href: '/services',
				label: { en: 'View Services', fr: 'Voir les services' },
			},
			prompt: {
				en: 'Need a system that stays editable?',
				fr: 'Besoin d’un système qui reste éditable?',
			},
			secondary: {
				href: '/contact',
				label: { en: 'Start a Project', fr: 'Démarrer un projet' },
			},
			title: { en: 'Work With Me', fr: 'Travailler ensemble' },
		},
	},
	heading: { en: 'Blog', fr: 'Blogue' },
	intro: {
		en: 'Notes on digital infrastructure, databases, and building reliable systems.',
		fr: 'Des notes sur l\'infrastructure numérique, les bases de données et la construction de systèmes fiables.',
	},
	personalHeading: { en: 'Personal Corner', fr: 'Coin perso' },
	personalIntro: {
		en: 'Trains, space, tools, and the off-work notes that still shape how I build.',
		fr: 'Trains, espace, outils, et les notes hors mandat qui influencent encore ma façon de bâtir.',
	},
	toPersonalLabel: { en: 'Personal Corner', fr: 'Coin perso' },
	toPersonalSubtitle: { en: 'Off the clock', fr: 'Hors mandat' },
	toProfessionalLabel: { en: 'Back to Blog', fr: 'Retour au blogue' },
	toProfessionalSubtitle: { en: 'Brand notes', fr: 'Notes de marque' },
};
