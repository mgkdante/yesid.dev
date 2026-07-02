#!/usr/bin/env bun
//
// DONE — one-shot seed, completed (slice-18g Phase 3; banner added in
// slice-28.5, audit #32). tech_stack rows live in Directus and Data Studio is
// the authoring surface. Keep for fresh-environment bootstrap only (--dry-run
// / --reset guarded), and note bootstrap ORDER: run seed-icons first —
// icon_id below is an M2O FK into the icons collection.
//
// SCHEMA FIX (slice-28.5, audit #32): the parent-row shape now writes
// `icon_id` (the M2O FK that replaced the legacy `icon` string when 18h-ii
// dropped that field — see migrate-tech-stack-icon.ts). The fixture keeps its
// `icon` key; fixture icon values are verified identical to icons.id slugs,
// so the seeder maps fixture.icon -> row.icon_id directly. Before this fix a
// fresh bootstrap would have written a field the schema no longer has.
//
/**
 * Seed the Directus `tech_stack` family from `fixtures/collections/tech-stack.json`.
 *
 * Slice 18 18g Phase 3. Mirrors seed-projects.ts shape (lib/* helpers + dry-run
 * + reset + pure helpers exported for tests). Mono-locale `en` seed; FR/ES via
 * Data Studio later.
 *
 * Per AM1: body fields (what_it_is/what_i_use_it_for/why_i_use_it_instead) are
 * Editor.js BlockEditorDoc { time, blocks, version }.
 *
 * Per Zod-embedding workaround (18f Phase 7): cannot embed BlockEditorDocSchema
 * inside z.object() — use z.unknown() at fixture row level, validate per-row
 * via BlockEditorDocSchema.safeParse() after parse.
 *
 * Pure transformation helpers exported for tests/seed-tech-stack-dry-run.test.ts.
 *
 * Run from REPO ROOT (per 18f Phase 8 lesson — relative paths in fixture
 * resolve from cwd=repo-root):
 *   bun run apps/cms/scripts/seed-tech-stack.ts            # writes live
 *   bun run apps/cms/scripts/seed-tech-stack.ts --dry-run  # preview
 *   bun run apps/cms/scripts/seed-tech-stack.ts --reset    # delete-all then write
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import { BlockEditorDocSchema, type BlockEditorDoc } from '@repo/shared';
import fixtureData from '../fixtures/collections/tech-stack.json' with { type: 'json' };
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import { parseSeedFlags } from './lib/cli';

// --- Types -----------------------------------------------------------------

import type { Locale } from '@repo/shared';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

export type TechStackStatus = 'draft' | 'published' | 'archived';

// --- Zod schemas (validate fixture JSON at load-time) ----------------------
//
// NOTE: Zod v3 cannot embed BlockEditorDocSchema (typed as z.ZodType<T>
// to support recursive NestedListItemSchema) as a field inside z.object()
// — internal _parse dispatch breaks. We use z.unknown() here and validate
// each body field separately via BlockEditorDocSchema.safeParse() after
// the parent parse. See seed-blog-posts.ts for the canonical pattern.

const TranslationFixtureSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	what_it_is: z.unknown(),
	what_i_use_it_for: z.unknown(),
	why_i_use_it_instead: z.unknown(),
});

export const TechStackFixtureSchema = z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	name: z.string().min(1),
	icon: z.string(),
	status: z.enum(['draft', 'published', 'archived']),
	sort: z.number().int().min(0),
	lang: z.enum(['en', 'fr', 'es']),
	translation: TranslationFixtureSchema,
	related_services: z.array(z.string()).readonly(),
	related_projects: z.array(z.string()).readonly(),
});

export type TechStackFixture = z.infer<typeof TechStackFixtureSchema> & {
	translation: {
		languages_code: Locale;
		what_it_is: BlockEditorDoc;
		what_i_use_it_for: BlockEditorDoc;
		why_i_use_it_instead: BlockEditorDoc;
	};
};

export const TechStackFixtureCollectionSchema = z.array(TechStackFixtureSchema).min(1).readonly();

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadTechStackFixture(): readonly TechStackFixture[] {
	const parsed = TechStackFixtureCollectionSchema.parse(fixtureData);
	// Validate all three body fields per row through BlockEditorDocSchema (AM1).
	for (const item of parsed) {
		const bodyFields = [
			'what_it_is',
			'what_i_use_it_for',
			'why_i_use_it_instead',
		] as const;
		for (const field of bodyFields) {
			const result = BlockEditorDocSchema.safeParse(item.translation[field]);
			if (!result.success) {
				throw new Error(
					`[seed-tech-stack] translation.${field} fails BlockEditorDocSchema for item ${item.id}: ${JSON.stringify(result.error.issues)}`,
				);
			}
		}
	}
	return parsed as readonly TechStackFixture[];
}

// --- Directus row shapes (flat — match the Directus collection layout) ------

export interface DirectusTechStackRow {
	id: string;
	name: string;
	/** M2O FK into the icons collection (fixture key `icon` carries the slug). */
	icon_id: string;
	status: TechStackStatus;
	sort: number;
}

export interface DirectusTechStackTranslationRow {
	id?: number;
	tech_stack_id: string;
	languages_code: Locale;
	what_it_is: BlockEditorDoc;
	what_i_use_it_for: BlockEditorDoc;
	why_i_use_it_instead: BlockEditorDoc;
}

export interface DirectusTechStackServicesRow {
	id?: number;
	tech_stack_id: string;
	services_id: string;
}

export interface DirectusTechStackProjectsRow {
	id?: number;
	tech_stack_id: string;
	projects_id: string;
}

// --- Pure transformation helpers (tested in tests/seed-tech-stack-dry-run.test.ts) ---

export function toTechStackRow(item: TechStackFixture): DirectusTechStackRow {
	return {
		id: item.id,
		name: item.name,
		// 28.5 schema fix: tech_stack.icon (string) was dropped in 18h-ii;
		// the fixture's icon slug doubles as the icons.id FK value.
		icon_id: item.icon,
		status: item.status,
		sort: item.sort,
	};
}

export function toTranslationRows(
	item: TechStackFixture,
): readonly DirectusTechStackTranslationRow[] {
	// Fixture has a single translation object (mono-locale `en`). Convert to
	// 1-element array for the Directus junction shape.
	return [
		{
			tech_stack_id: item.id,
			languages_code: item.translation.languages_code,
			what_it_is: item.translation.what_it_is,
			what_i_use_it_for: item.translation.what_i_use_it_for,
			why_i_use_it_instead: item.translation.why_i_use_it_instead,
		},
	];
}

export function toServiceJunctionRows(
	item: TechStackFixture,
): readonly DirectusTechStackServicesRow[] {
	return item.related_services.map((sid) => ({
		tech_stack_id: item.id,
		services_id: sid,
	}));
}

export function toProjectJunctionRows(
	item: TechStackFixture,
): readonly DirectusTechStackProjectsRow[] {
	return item.related_projects.map((pid) => ({
		tech_stack_id: item.id,
		projects_id: pid,
	}));
}

// --- Directus I/O ---------------------------------------------------------

interface Schema {
	tech_stack: DirectusTechStackRow[];
	tech_stack_translations: DirectusTechStackTranslationRow[];
	tech_stack_services: DirectusTechStackServicesRow[];
	tech_stack_projects: DirectusTechStackProjectsRow[];
}

const log = createLogger('seed-tech-stack');

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
}

export async function seedTechStack(
	items: readonly TechStackFixture[],
	opts: SeedRunOptions,
): Promise<void> {
	// Count junction rows upfront (needed for both dry-run and live log messages).
	const totalServices = items.reduce((n, i) => n + i.related_services.length, 0);
	const totalProjects = items.reduce((n, i) => n + i.related_projects.length, 0);

	if (opts.dryRun) {
		log.info(
			`dry-run: would create ${items.length} tech_stack items + ` +
				`${items.length} translations + ` +
				`${totalServices} service junctions + ` +
				`${totalProjects} project junctions`,
		);
		log.info('dry-run complete (no writes).');
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		// Delete in dependency order: junctions first, then translations, then parent.
		for (const table of [
			'tech_stack_services',
			'tech_stack_projects',
			'tech_stack_translations',
		] as const) {
			const existing = await client.request(readItems(table, { fields: ['id'], limit: -1 }));
			if (existing.length > 0) {
				log.info(`clearing ${existing.length} rows from ${table}...`);
				for (const row of existing) {
					const rowId = row.id as number;
					try {
						await client.request(deleteItem(table, rowId));
					} catch (err) {
						const msgs = parseErrors(err);
						throw new DirectusError(
							500,
							`Failed to delete ${table} row ${rowId}: ${msgs.join(' · ')}`,
						);
					}
				}
			}
		}
		const existingParents = await client.request(
			readItems('tech_stack', { fields: ['id'], limit: -1 }),
		);
		if (existingParents.length > 0) {
			log.info(`clearing ${existingParents.length} existing tech_stack items...`);
			for (const p of existingParents) {
				try {
					await client.request(deleteItem('tech_stack', p.id));
				} catch (err) {
					const msgs = parseErrors(err);
					throw new DirectusError(
						500,
						`Failed to delete tech_stack item ${p.id}: ${msgs.join(' · ')}`,
					);
				}
			}
		}
	} else {
		const existing = await client.request(
			readItems('tech_stack', { fields: ['id'], limit: -1 }),
		);
		if (existing.length > 0) {
			throw new Error(
				`[seed] found ${existing.length} existing tech_stack items. Re-run with --reset to clear + recreate.`,
			);
		}
	}

	// Write parent rows first.
	log.info(`creating ${items.length} tech_stack items...`);
	for (const item of items) {
		const row = toTechStackRow(item);
		try {
			await client.request(
				createItem('tech_stack', row as unknown as DirectusTechStackRow),
			);
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Failed to create tech_stack item ${item.id}: ${msgs.join(' · ')}`,
			);
		}
		log.info(
			`  ✓ ${item.id.padEnd(30)}  status=${row.status}  sort=${row.sort}`,
		);
	}

	// Write translation rows.
	log.info(`creating ${items.length} tech_stack_translations rows...`);
	for (const item of items) {
		const rows = toTranslationRows(item);
		for (const t of rows) {
			try {
				await client.request(
					createItem(
						'tech_stack_translations',
						t as unknown as DirectusTechStackTranslationRow,
					),
				);
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to create translation for ${item.id} [${t.languages_code}]: ${msgs.join(' · ')}`,
				);
			}
		}
	}
	log.info(`  ✓ ${items.length} translation rows`);

	// Write service junction rows.
	log.info(`creating tech_stack_services junction rows...`);
	let serviceJunctionCount = 0;
	for (const item of items) {
		const junctions = toServiceJunctionRows(item);
		for (const j of junctions) {
			try {
				await client.request(
					createItem(
						'tech_stack_services',
						j as unknown as DirectusTechStackServicesRow,
					),
				);
				serviceJunctionCount++;
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to create tech_stack_services junction ${j.tech_stack_id}↔${j.services_id}: ${msgs.join(' · ')}`,
				);
			}
		}
	}
	log.info(`  ✓ ${serviceJunctionCount} service junction rows`);

	// Write project junction rows.
	log.info(`creating tech_stack_projects junction rows...`);
	let projectJunctionCount = 0;
	for (const item of items) {
		const junctions = toProjectJunctionRows(item);
		for (const j of junctions) {
			try {
				await client.request(
					createItem(
						'tech_stack_projects',
						j as unknown as DirectusTechStackProjectsRow,
					),
				);
				projectJunctionCount++;
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to create tech_stack_projects junction ${j.tech_stack_id}↔${j.projects_id}: ${msgs.join(' · ')}`,
				);
			}
		}
	}
	log.info(`  ✓ ${projectJunctionCount} project junction rows`);

	const final = await client.request(
		readItems('tech_stack', {
			fields: ['id', 'status'],
			limit: -1,
			sort: ['sort'],
		}),
	);
	log.info(`verified: ${final.length} tech_stack items in Directus`);
	if (final.length !== items.length) {
		throw new Error(
			`[seed] count mismatch: expected ${items.length}, got ${final.length}`,
		);
	}
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseSeedFlags();
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	const items = loadTechStackFixture();
	log.info(`source: ${items.length} items from fixtures/collections/tech-stack.json`);

	if (dryRun) {
		await seedTechStack(items, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedTechStack(items, { directusUrl, token, reset });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-tech-stack] FAILED:', err);
		process.exit(1);
	});
}
