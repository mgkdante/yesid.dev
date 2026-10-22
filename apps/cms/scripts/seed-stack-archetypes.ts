#!/usr/bin/env bun
/**
 * Seed the 3 launch `stack_archetypes` rows + tech-stack engine defaults (slice-29).
 *
 * Archetypes are the goal cards of the Tech Stack Engine ("a data dashboard")
 * — each carries trilingual copy, a proof project, a delivering service, and
 * layered tech links that draw the blueprint. This seed also back-fills the
 * engine support fields on every referenced tech: `tech_stack.layer` (default
 * blueprint row) and `tech_stack_translations.enables` (preview-slot caption).
 *
 * Every referenced id is verified against the committed content modules by
 * tests/seed-stack-archetypes-dry-run.test.ts — tech ids against
 * apps/web/src/lib/content/tech-stack.ts, proof projects against projects.ts,
 * services against services.ts.
 *
 * Mirrors the archive-lorem-posts shape: lib/* helpers, DRY-RUN BY DEFAULT
 * (no network, no token needed), pure exported plan builder for tests.
 * Idempotent by slug — existing archetypes are skipped, tech defaults are
 * PATCHed (same values on re-run).
 *
 * Requires the stack-archetype schema represented by the committed snapshot.
 *
 * Operator run:
 *   op run --env-file=.env -- bun --cwd apps/cms run seed:archetypes -- --apply
 */

import { createItem, readItems, updateItem } from '@directus/sdk';
import type { StackLayer } from '@repo/shared/schemas';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Seed types --------------------------------------------------------------

export type ArchetypeLocale = 'en' | 'fr' | 'es';

export interface ArchetypeTranslationSeed {
	languages_code: ArchetypeLocale;
	title: string;
	hook: string;
	description: string;
}

export interface ArchetypeTechLinkSeed {
	/** tech_stack PK — must exist in the committed tech module. */
	id: string;
	layer: StackLayer;
	sort: number;
}

export interface ArchetypeSeed {
	slug: string;
	icon: string;
	sort: number;
	status: 'published';
	translations: ArchetypeTranslationSeed[];
	proofProjectSlug: string;
	serviceId: string;
	tech: ArchetypeTechLinkSeed[];
}

export interface TechDefaultsSeed {
	/** tech_stack PK. */
	id: string;
	/** Default blueprint layer (per-archetype links may override). */
	layer: StackLayer;
	/** One sentence per locale: what this tech enables. */
	enables: Record<ArchetypeLocale, string>;
}

export interface SeedPlan {
	archetypes: ArchetypeSeed[];
	techDefaults: TechDefaultsSeed[];
}

// --- Pure plan builder (exported for the dry-run test) -------------------------

export function buildSeedPlan(): SeedPlan {
	const archetypes: ArchetypeSeed[] = [
		{
			slug: 'data-dashboard',
			icon: 'monitoring',
			sort: 1,
			status: 'published',
			translations: [
				{
					languages_code: 'en',
					title: 'A data dashboard',
					hook: 'See your numbers move.',
					description: 'Live metrics drawn straight from data you own.',
				},
				{
					languages_code: 'fr',
					title: 'Un tableau de bord',
					hook: 'Voyez vos chiffres bouger.',
					description: 'Des métriques en direct issues de données qui vous appartiennent.',
				},
				{
					languages_code: 'es',
					title: 'Un panel de datos',
					hook: 'Mira tus números moverse.',
					description: 'Métricas en vivo extraídas de datos que te pertenecen.',
				},
			],
			proofProjectSlug: 'transit-data-pipeline',
			serviceId: 'sql-development',
			// Real committed tech ids — no FastAPI/Railway rows exist in tech_stack,
			// so the API layer is 'rest-api' and infra is 'docker' (verified module ids).
			tech: [
				{ id: 'sveltekit', layer: 'interface', sort: 1 },
				{ id: 'rest-api', layer: 'logic', sort: 2 },
				{ id: 'postgresql', layer: 'data', sort: 3 },
				{ id: 'docker', layer: 'infra', sort: 4 },
			],
		},
		{
			slug: 'data-pipeline',
			icon: 'conveyor_belt',
			sort: 2,
			status: 'published',
			translations: [
				{
					languages_code: 'en',
					title: 'A data pipeline',
					hook: 'From raw feeds to clean tables.',
					description: 'Raw source feeds ingested, cleaned, and loaded into queryable tables on a schedule.',
				},
				{
					languages_code: 'fr',
					title: 'Un pipeline de données',
					hook: 'Des flux bruts aux tables propres.',
					description: 'Des flux bruts ingérés, nettoyés et chargés dans des tables interrogeables, selon un horaire.',
				},
				{
					languages_code: 'es',
					title: 'Un pipeline de datos',
					hook: 'De flujos crudos a tablas limpias.',
					description: 'Flujos crudos ingeridos, limpiados y cargados en tablas consultables, según un calendario.',
				},
			],
			proofProjectSlug: 'transit-data-pipeline',
			serviceId: 'data-pipeline',
			tech: [
				{ id: 'python', layer: 'logic', sort: 1 },
				{ id: 'postgresql', layer: 'data', sort: 2 },
				{ id: 'docker', layer: 'infra', sort: 3 },
			],
		},
		{
			slug: 'fast-website',
			icon: 'rocket_launch',
			sort: 3,
			status: 'published',
			translations: [
				{
					languages_code: 'en',
					title: 'A fast website',
					hook: 'Static speed, living content.',
					description: 'Pre-rendered pages served from the edge, with content that stays editable.',
				},
				{
					languages_code: 'fr',
					title: 'Un site web rapide',
					hook: 'Vitesse statique, contenu vivant.',
					description: 'Des pages pré-rendues servies depuis la périphérie, avec du contenu qui reste modifiable.',
				},
				{
					languages_code: 'es',
					title: 'Un sitio web rápido',
					hook: 'Velocidad estática, contenido vivo.',
					description: 'Páginas pre-renderizadas servidas desde el borde, con contenido que sigue siendo editable.',
				},
			],
			proofProjectSlug: 'yesid-dev',
			serviceId: 'web-development',
			// No 'directus' row exists in tech_stack — the logic-layer tech actually
			// committed for the yesid-dev stack is 'typescript' (verified module id).
			tech: [
				{ id: 'sveltekit', layer: 'interface', sort: 1 },
				{ id: 'typescript', layer: 'logic', sort: 2 },
				{ id: 'vercel', layer: 'infra', sort: 3 },
			],
		},
	];

	const techDefaults: TechDefaultsSeed[] = [
		{
			id: 'sveltekit',
			layer: 'interface',
			enables: {
				en: 'renders fast, app-like pages from one codebase',
				fr: "affiche des pages rapides, façon application, depuis une seule base de code",
				es: 'genera páginas rápidas tipo aplicación desde una sola base de código',
			},
		},
		{
			id: 'rest-api',
			layer: 'logic',
			enables: {
				en: 'lets your interface and services talk over clean endpoints',
				fr: "permet à votre interface et vos services de communiquer via des points d'accès propres",
				es: 'permite que tu interfaz y tus servicios se comuniquen mediante endpoints claros',
			},
		},
		{
			id: 'python',
			layer: 'logic',
			enables: {
				en: 'automates the data work: ingest, clean, transform',
				fr: 'automatise le travail des données : ingestion, nettoyage, transformation',
				es: 'automatiza el trabajo de datos: ingesta, limpieza, transformación',
			},
		},
		{
			id: 'typescript',
			layer: 'logic',
			enables: {
				en: 'keeps the codebase typed, refactorable, and honest',
				fr: 'garde le code typé, refactorisable et fiable',
				es: 'mantiene el código tipado, refactorizable y confiable',
			},
		},
		{
			id: 'postgresql',
			layer: 'data',
			enables: {
				en: 'stores and queries your data reliably',
				fr: 'stocke et interroge vos données de manière fiable',
				es: 'almacena y consulta tus datos de forma fiable',
			},
		},
		{
			id: 'docker',
			layer: 'infra',
			enables: {
				en: 'packages every service to run the same anywhere',
				fr: "emballe chaque service pour qu'il tourne pareil partout",
				es: 'empaqueta cada servicio para que corra igual en cualquier lugar',
			},
		},
		{
			id: 'vercel',
			layer: 'infra',
			enables: {
				en: 'ships the site globally with zero-config deploys',
				fr: 'déploie le site mondialement sans configuration',
				es: 'publica el sitio globalmente con despliegues sin configuración',
			},
		},
	];

	return { archetypes, techDefaults };
}

export function parseFlags(argv: readonly string[]): { apply: boolean } {
	// --dry-run is the default; only an explicit --apply writes.
	return { apply: argv.includes('--apply') };
}

// --- Apply-time I/O ------------------------------------------------------------

const log = createLogger('seed-stack-archetypes');

interface ArchetypeRow {
	id: string;
	slug: string;
}

interface TechTranslationRow {
	id: number;
	languages_code: string;
}

interface Schema {
	stack_archetypes: ArchetypeRow[];
	tech_stack: { id: string; layer: string | null }[];
	tech_stack_translations: TechTranslationRow[];
}

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
}

export async function seedStackArchetypes(plan: SeedPlan, opts: SeedRunOptions): Promise<void> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);

	// 1. Archetypes — idempotent by slug: create missing, skip existing.
	const existing = await client.request(
		readItems('stack_archetypes', { fields: ['id', 'slug'], limit: -1 }),
	);
	const existingBySlug = new Set(existing.map((r) => r.slug));

	for (const archetype of plan.archetypes) {
		if (existingBySlug.has(archetype.slug)) {
			log.info(`  = ${archetype.slug.padEnd(20)} already seeded (skip)`);
			continue;
		}
		try {
			await client.request(
				createItem('stack_archetypes', {
					slug: archetype.slug,
					status: archetype.status,
					sort: archetype.sort,
					icon: archetype.icon,
					proof_project: archetype.proofProjectSlug,
					service: archetype.serviceId,
					translations: archetype.translations.map((t) => ({
						languages_code: t.languages_code,
						title: t.title,
						hook: t.hook,
						description: t.description,
					})),
					tech: archetype.tech.map((link) => ({
						tech_stack_id: link.id,
						layer: link.layer,
						sort: link.sort,
					})),
				} as never),
			);
			log.info(`  + ${archetype.slug.padEnd(20)} created (${archetype.tech.length} tech links)`);
		} catch (err) {
			throw new DirectusError(
				500,
				`Failed to create stack_archetype ${archetype.slug}: ${parseErrors(err).join(' · ')}`,
			);
		}
	}

	// 2. Tech defaults — PATCH layer on the parent row; PATCH enables on every
	//    EXISTING translation row (missing locale rows are skipped, not created
	//    — translation body fields are authored in Data Studio).
	for (const tech of plan.techDefaults) {
		try {
			await client.request(updateItem('tech_stack', tech.id, { layer: tech.layer } as never));
			log.info(`  ~ tech_stack/${tech.id.padEnd(14)} layer -> ${tech.layer}`);
		} catch (err) {
			throw new DirectusError(
				500,
				`Failed to set layer on tech_stack ${tech.id}: ${parseErrors(err).join(' · ')}`,
			);
		}

		const translationRows = await client.request(
			readItems('tech_stack_translations', {
				filter: { tech_stack_id: { _eq: tech.id } } as never,
				fields: ['id', 'languages_code'],
				limit: -1,
			}),
		);
		for (const locale of ['en', 'fr', 'es'] as const) {
			const row = translationRows.find((r) => r.languages_code === locale);
			if (!row) {
				log.info(`    ? ${tech.id}/${locale} translation row missing (enables skipped)`);
				continue;
			}
			try {
				await client.request(
					updateItem('tech_stack_translations', row.id, {
						enables: tech.enables[locale],
					} as never),
				);
				log.info(`    ~ ${tech.id}/${locale} enables set`);
			} catch (err) {
				throw new DirectusError(
					500,
					`Failed to set enables on ${tech.id}/${locale}: ${parseErrors(err).join(' · ')}`,
				);
			}
		}
	}
}

async function main(): Promise<void> {
	const { apply } = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildSeedPlan();
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);

	log.info(`plan: ${plan.archetypes.length} archetypes, ${plan.techDefaults.length} tech defaults`);
	for (const a of plan.archetypes) {
		log.info(
			`  + ${a.slug.padEnd(20)} icon=${a.icon} proof=${a.proofProjectSlug} service=${a.serviceId}`,
		);
		for (const link of a.tech) {
			log.info(`      ${String(link.sort).padStart(2)}. ${link.id.padEnd(14)} → ${link.layer}`);
		}
	}
	for (const t of plan.techDefaults) {
		log.info(`  ~ tech_stack/${t.id.padEnd(14)} layer=${t.layer} enables(en)='${t.enables.en}'`);
	}

	if (!apply) {
		log.info('dry-run complete (no reads, no writes). Pass --apply to execute.');
		return;
	}

	const token = await getAdminToken(url);
	await seedStackArchetypes(plan, { directusUrl: url, token });
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-stack-archetypes] FAILED:', err);
		process.exit(1);
	});
}
