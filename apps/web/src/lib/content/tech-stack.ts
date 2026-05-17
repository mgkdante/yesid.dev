// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// /tech-stack page chrome (hero, actions, CTA copy). Static tech_stack data lives in tech-stack.companion.ts (deferred to 18k cleanup).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { TechStackPageContent } from '@repo/shared';

export const techStackPageContent: TechStackPageContent = {
	actions: {
		getInTouch: { en: 'Get In Touch' },
		viewServices: { en: 'View Services' },
	},
	cta: {
		availability: { en: 'Available for Q2 2026' },
		headingLine1: { en: 'Found your stack' },
		headingLine2: { en: 'Let\'s build it' },
		sub: {
			en: 'Whether it\'s a data pipeline, a web app, or a mobile product — the infrastructure is ready.',
		},
	},
	hero: {
		overline: { en: 'Infrastructure Map' },
		stats: {
			technologies: { en: 'technologies' },
		},
		terminalAria: { en: 'Infrastructure overview' },
		titleLine1: { en: 'The Control' },
		titleLine2: { en: 'Room' },
	},
	meta: {
		description: {
			en: '{itemCount}+ technologies — an interactive map of how digital infrastructure gets built.',
		},
		title: { en: 'Tech Stack — yesid.' },
	},
};

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'tech-stack'.
export * from './tech-stack.companion';
