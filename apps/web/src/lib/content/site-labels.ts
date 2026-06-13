// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Global UI microcopy (aria labels, card markers, edge titles, email templates) from the site_labels singleton.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { SiteLabels } from '$lib/types';

export const siteLabels: SiteLabels = {
	a11y: {
		carouselNext: { en: 'Next projects', fr: 'Projets suivants' },
		carouselPrev: { en: 'Previous projects', fr: 'Projets précédents' },
		closerGraffiti: { en: 'THE END graffiti', fr: 'graffiti THE END' },
		navCapabilities: { en: 'Capabilities', fr: 'Capacités' },
		navTechStack: { en: 'Tech stack', fr: 'Stack technique' },
		replayIntro: { en: 'Replay intro', fr: 'Rejouer l\'intro' },
		toc: { en: 'Table of contents', fr: 'Table des matières' },
	},
	email: {
		contactSubjectTemplate: {
			en: 'New contact from {name} via yesid.dev',
			fr: 'Nouveau message de {name} via yesid.dev',
		},
	},
	pages: {
		blogEdgeTitle: { en: 'Blog', fr: 'Blog' },
		homeSectionProjects: { en: 'Projects', fr: 'Projets' },
		homeSectionServices: { en: 'Services', fr: 'Services' },
		homeSectionTerminus: { en: 'Terminus', fr: 'Terminus' },
		projectsEdgeTitle: { en: 'Projects', fr: 'Projets' },
	},
	ui: {
		backToProjects: { en: '← All Projects', fr: '← Tous les projets' },
		blogEditionTemplate: { en: 'VOL. 01 // ISS. {issue}', fr: 'VOL. 01 // NO {issue}' },
		categoryPersonal: { en: 'Personal', fr: 'Perso' },
		categoryProfessional: { en: 'Professional', fr: 'Professionnel' },
		copyrightTemplate: { en: '© {year} yesid', fr: '© {year} yesid' },
		errorStatusNote: {
			en: '// requested path not in service',
			fr: '// chemin demandé hors service',
		},
		markerFeatured: { en: '{num} / FEATURED', fr: '{num} / EN VEDETTE' },
		markerService: { en: '{num} / SERVICE', fr: '{num} / SERVICE' },
		metroCaption: { en: 'STM métro + REM', fr: 'métro STM + REM' },
		nounProject: { en: 'project', fr: 'projet' },
		watermarkPersonal: { en: 'Personal', fr: 'Perso' },
		watermarkProfessional: { en: 'Dispatch', fr: 'Dépêche' },
	},
};
