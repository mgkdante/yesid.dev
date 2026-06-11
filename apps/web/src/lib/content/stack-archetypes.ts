// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Published stack_archetypes rows (slug, trilingual copy, proof project, service, layered tech links). Feeds the pure client-side Tech Stack Engine on /tech-stack — tech links arrive pre-sorted by (STACK_LAYERS render order, sort) so the blueprint derives its rows from data. NEW in slice-29.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { StackArchetype } from '@repo/shared/schemas';

export const stackArchetypes: StackArchetype[] = [
	{
		description: {
			en: 'Live metrics drawn straight from data you own.',
			es: 'Métricas en vivo extraídas de datos que te pertenecen.',
			fr: 'Des métriques en direct issues de données qui vous appartiennent.',
		},
		hook: {
			en: 'See your numbers move.',
			es: 'Mira tus números moverse.',
			fr: 'Voyez vos chiffres bouger.',
		},
		proofProjectSlug: 'transit-data-pipeline',
		serviceId: 'sql-development',
		slug: 'data-dashboard',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'rest-api', layer: 'logic', sort: 2 },
			{ id: 'postgresql', layer: 'data', sort: 3 },
			{ id: 'docker', layer: 'infra', sort: 4 },
		],
		title: {
			en: 'A data dashboard',
			es: 'Un panel de datos',
			fr: 'Un tableau de bord',
		},
	},
	{
		description: {
			en: 'Raw source feeds ingested, cleaned, and loaded into queryable tables on a schedule.',
			es: 'Flujos crudos ingeridos, limpiados y cargados en tablas consultables, según un calendario.',
			fr: 'Des flux bruts ingérés, nettoyés et chargés dans des tables interrogeables, selon un horaire.',
		},
		hook: {
			en: 'From raw feeds to clean tables.',
			es: 'De flujos crudos a tablas limpias.',
			fr: 'Des flux bruts aux tables propres.',
		},
		proofProjectSlug: 'transit-data-pipeline',
		serviceId: 'data-pipeline',
		slug: 'data-pipeline',
		tech: [
			{ id: 'python', layer: 'logic', sort: 1 },
			{ id: 'postgresql', layer: 'data', sort: 2 },
			{ id: 'docker', layer: 'infra', sort: 3 },
		],
		title: {
			en: 'A data pipeline',
			es: 'Un pipeline de datos',
			fr: 'Un pipeline de données',
		},
	},
	{
		description: {
			en: 'Pre-rendered pages served from the edge, with content that stays editable.',
			es: 'Páginas pre-renderizadas servidas desde el borde, con contenido que sigue siendo editable.',
			fr: 'Des pages pré-rendues servies depuis la périphérie, avec du contenu qui reste modifiable.',
		},
		hook: {
			en: 'Static speed, living content.',
			es: 'Velocidad estática, contenido vivo.',
			fr: 'Vitesse statique, contenu vivant.',
		},
		proofProjectSlug: 'yesid-dev',
		serviceId: 'web-development',
		slug: 'fast-website',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'typescript', layer: 'logic', sort: 2 },
			{ id: 'vercel', layer: 'infra', sort: 3 },
		],
		title: {
			en: 'A fast website',
			es: 'Un sitio web rápido',
			fr: 'Un site web rapide',
		},
	},
];
