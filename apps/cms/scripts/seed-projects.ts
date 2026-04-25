#!/usr/bin/env bun
/**
 * Seed the Directus `projects` family from `fixtures/collections/projects.json`.
 *
 * Slice 18 18e. Mirrors seed-services.ts shape (lib/* helpers + dry-run + reset
 * + pure helpers exported for tests).
 *
 * Phase 4 deposit: ProjectsFixtureSchema + ProjectFixture type + loadProjectsFixture.
 * Pure transform helpers + Directus I/O landed in Phase 5.
 *
 * Pure transformation helpers exported for tests/seed-projects-dry-run.test.ts.
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import { assetIdForOrUndefined } from '@repo/shared';
import fixtureData from '../fixtures/collections/projects.json' with { type: 'json' };
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Types -----------------------------------------------------------------

export type Locale = 'en' | 'fr' | 'es';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

export type ProjectStatus = 'draft' | 'published' | 'archived';

// --- Zod schemas (validate fixture JSON at load-time) ----------------------

const TranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	one_liner: z.string(),
	description: z.string(),
});

const SectionTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	content: z.string(),
});

const SectionSchema = z.object({
	sort: z.number().int().min(0),
	translations: z.array(SectionTranslationSchema).min(1),
});

const ImpactMetricTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	label: z.string().min(1),
});

const ImpactMetricSchema = z.object({
	sort: z.number().int().min(0),
	value: z.string().min(1),
	before: z.string().nullable(),
	translations: z.array(ImpactMetricTranslationSchema).min(1),
});

const ProjectFixtureSchema = z.object({
	id: z.string().min(1),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	sort: z.number().int().min(0),
	featured: z.boolean(),
	hero_image_legacy_path: z.string().nullable(),
	repo_url: z.string().nullable(),
	live_url: z.string().nullable(),
	readme_url: z.string().nullable(),
	location: z.string().nullable(),
	environment: z.string().nullable(),
	version: z.string().nullable(),
	stack: z.array(z.string()).readonly(),
	tags: z.array(z.string()).readonly(),
	translations: z.array(TranslationSchema).min(1),
	sections: z.array(SectionSchema),
	impact_metrics: z.array(ImpactMetricSchema),
	related_services: z.array(z.string()).readonly(),
});

export type ProjectFixture = z.infer<typeof ProjectFixtureSchema>;

export const ProjectsFixtureSchema = z.array(ProjectFixtureSchema).min(1).readonly();

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadProjectsFixture(): readonly ProjectFixture[] {
	return ProjectsFixtureSchema.parse(fixtureData);
}

// --- Directus row shapes (flat — match the Directus collection layout) ------

export interface DirectusProjectTranslationRow {
	languages_code: Locale;
	title: string;
	one_liner: string;
	description: string;
}

export interface DirectusProjectSectionTranslationRow {
	languages_code: Locale;
	title: string;
	content: string;
}

export interface DirectusProjectSectionRow {
	sort: number;
	translations: readonly DirectusProjectSectionTranslationRow[];
}

export interface DirectusProjectImpactMetricTranslationRow {
	languages_code: Locale;
	label: string;
}

export interface DirectusProjectImpactMetricRow {
	sort: number;
	value: string;
	before: string | null;
	translations: readonly DirectusProjectImpactMetricTranslationRow[];
}

export interface DirectusProjectRow {
	id: string;
	status: ProjectStatus;
	date_published: string | null;
	sort: number;
	featured: boolean;
	hero_image: string | null;
	repo_url: string | null;
	live_url: string | null;
	readme_url: string | null;
	location: string | null;
	environment: string | null;
	version: string | null;
	stack: readonly string[];
	tags: readonly string[];
	translations: readonly DirectusProjectTranslationRow[];
	sections: readonly DirectusProjectSectionRow[];
	impact_metrics: readonly DirectusProjectImpactMetricRow[];
}

export interface DirectusProjectsServicesRow {
	project_id: string;
	service_id: string;
}

// --- Pure transformation helpers (tested in tests/seed-projects-dry-run.test.ts) ---

export function toTranslationRows(
	project: ProjectFixture,
): readonly DirectusProjectTranslationRow[] {
	return project.translations.map((t) => ({
		languages_code: t.languages_code,
		title: t.title,
		one_liner: t.one_liner,
		description: t.description,
	}));
}

export function toSectionRows(
	project: ProjectFixture,
): readonly DirectusProjectSectionRow[] {
	return project.sections.map((s) => ({
		sort: s.sort,
		translations: s.translations.map((t) => ({
			languages_code: t.languages_code,
			title: t.title,
			content: t.content,
		})),
	}));
}

export function toImpactMetricRows(
	project: ProjectFixture,
): readonly DirectusProjectImpactMetricRow[] {
	return project.impact_metrics.map((m) => ({
		sort: m.sort,
		value: m.value,
		before: m.before,
		translations: m.translations.map((t) => ({
			languages_code: t.languages_code,
			label: t.label,
		})),
	}));
}

export function toJunctionRows(
	project: ProjectFixture,
): readonly DirectusProjectsServicesRow[] {
	return project.related_services.map((sid) => ({
		project_id: project.id,
		service_id: sid,
	}));
}

export function toProjectRow(project: ProjectFixture): DirectusProjectRow {
	const heroImageUuid = project.hero_image_legacy_path
		? assetIdForOrUndefined(project.hero_image_legacy_path) ?? null
		: null;
	return {
		id: project.id,
		status: project.status,
		date_published: project.date_published,
		sort: project.sort,
		featured: project.featured,
		hero_image: heroImageUuid,
		repo_url: project.repo_url,
		live_url: project.live_url,
		readme_url: project.readme_url,
		location: project.location,
		environment: project.environment,
		version: project.version,
		stack: project.stack,
		tags: project.tags,
		translations: toTranslationRows(project),
		sections: toSectionRows(project),
		impact_metrics: toImpactMetricRows(project),
	};
}

// --- Directus I/O ---------------------------------------------------------

interface Schema {
	projects: DirectusProjectRow[];
	projects_services: DirectusProjectsServicesRow[];
}

const log = createLogger('seed-projects');

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
}

export async function seedProjects(
	projects: readonly ProjectFixture[],
	opts: SeedRunOptions,
): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would process ${projects.length} projects against ${opts.directusUrl}`);
		for (const project of projects) {
			const row = toProjectRow(project);
			log.info(
				`  ~ ${project.id.padEnd(28)}  status=${row.status}  ` +
					`featured=${row.featured}  hero=${row.hero_image ? 'yes' : 'no'}  ` +
					`translations=${row.translations.length}  sections=${row.sections.length}  ` +
					`metrics=${row.impact_metrics.length}  services=${project.related_services.length}`,
			);
		}
		log.info('dry-run complete (no writes).');
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		const existing = await client.request(
			readItems('projects', { fields: ['id'], limit: -1 }),
		);
		if (existing.length > 0) {
			log.info(`clearing ${existing.length} existing projects (FK CASCADE clears children)...`);
			for (const p of existing) {
				try {
					await client.request(deleteItem('projects', p.id));
				} catch (err) {
					const msgs = parseErrors(err);
					throw new DirectusError(
						500,
						`Failed to delete existing project ${p.id}: ${msgs.join(' · ')}`,
					);
				}
			}
		}
	} else {
		const existing = await client.request(
			readItems('projects', { fields: ['id'], limit: -1 }),
		);
		if (existing.length > 0) {
			throw new Error(
				`[seed] found ${existing.length} existing projects. Re-run with --reset to clear + recreate.`,
			);
		}
	}

	log.info(`creating ${projects.length} projects (with nested children)...`);
	for (const project of projects) {
		const row = toProjectRow(project);
		try {
			await client.request(
				createItem('projects', row as unknown as DirectusProjectRow),
			);
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Failed to create project ${project.id}: ${msgs.join(' · ')}`,
			);
		}
		log.info(
			`  ✓ ${project.id.padEnd(28)}  status=${row.status}  ` +
				`hero=${row.hero_image ? 'yes' : 'no'}  ` +
				`metrics=${row.impact_metrics.length}  services=${project.related_services.length}`,
		);
	}

	log.info(`creating projects_services junction rows...`);
	let junctionCount = 0;
	for (const project of projects) {
		const junctions = toJunctionRows(project);
		for (const j of junctions) {
			try {
				await client.request(
					createItem('projects_services', j as unknown as DirectusProjectsServicesRow),
				);
				junctionCount++;
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to create junction ${j.project_id}↔${j.service_id}: ${msgs.join(' · ')}`,
				);
			}
		}
	}
	log.info(`  ✓ ${junctionCount} junction rows`);

	// The nested `fields` syntax (`{ relation: ['field'] }`) is the Directus SDK
	// query notation for relational selectors. The SDK's TypeScript generics do
	// not fully resolve nested field selectors against our custom Schema type, so
	// we cast to `unknown` here — the same pattern used by seed-services.ts.
	const final = await client.request(
		readItems('projects', {
			fields: [
				'id',
				'status',
				{ translations: ['languages_code'] } as unknown as keyof DirectusProjectRow,
				{ sections: ['id'] } as unknown as keyof DirectusProjectRow,
				{ impact_metrics: ['id'] } as unknown as keyof DirectusProjectRow,
			],
			limit: -1,
			sort: ['sort'],
		}),
	);
	log.info(`verified: ${final.length} projects in Directus`);
	if (final.length !== projects.length) {
		throw new Error(`[seed] count mismatch: expected ${projects.length}, got ${final.length}`);
	}
}

function parseFlags(argv: readonly string[]): { dryRun: boolean; reset: boolean } {
	return {
		dryRun: argv.includes('--dry-run'),
		reset: argv.includes('--reset'),
	};
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseFlags(process.argv.slice(2));
	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	const projects = loadProjectsFixture();
	log.info(`source: ${projects.length} projects from fixtures/collections/projects.json`);

	if (dryRun) {
		await seedProjects(projects, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedProjects(projects, { directusUrl, token, reset });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed] FAILED:', err);
		process.exit(1);
	});
}
