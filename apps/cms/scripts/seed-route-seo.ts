#!/usr/bin/env bun
//
// Seed and maintain the CMS-owned route_seo rows consumed by export-fallbacks.
// Static route editorial SEO lives here. Code still owns technical SEO defaults
// like ogType, noIndex, canonical construction, and JSON-LD factories.
//
/**
 * Seed Directus `route_seo` collection from `fixtures/collections/route-seo.json`.
 *
 * Slice 18 18h Phase 3 Task 7. Mirrors seed-projects.ts / seed-tech-stack.ts
 * shape (lib/* helpers + Zod fixture + dry-run + reset + pure helpers).
 *
 * Per-route SEO override collection. 8 static routes seeded with EN
 * translations only; FR/ES added later via Data Studio.
 *
 * Idempotency / upsert semantics:
 *   - `path` is the natural key. The Directus int `id` is auto-generated.
 *   - Default: upsert by `path`. For each fixture row, look up existing row
 *     by path; if present, update it (preserves the int PK + translation
 *     FKs); if absent, create with nested translations.
 *   - `--reset`: delete all rows (FK CASCADE clears translations) then
 *     recreate from fixture. Standard collection-seed semantics.
 *
 * Pure helpers exported for tests/seed-route-seo-dry-run.test.ts.
 *
 * Run from REPO ROOT:
 *   bun run apps/cms/scripts/seed-route-seo.ts            # writes live (upsert by path)
 *   bun run apps/cms/scripts/seed-route-seo.ts --dry-run  # preview
 *   bun run apps/cms/scripts/seed-route-seo.ts --reset    # delete-all then recreate
 */

import {
	createItem,
	deleteItem,
	deleteItems,
	readItems,
	updateItem,
} from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/route-seo.json' with { type: 'json' };
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import { parseSeedFlags } from './lib/cli';

// --- Types -----------------------------------------------------------------

import type { Locale } from '@repo/shared';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

export type RouteSeoStatus = 'draft' | 'published' | 'archived';

// --- Zod schemas (validate fixture JSON at load-time) ----------------------
//
// Per spec.md § Schema § route_seo_translations:
//   - title: string ≤70 chars, optional (null = no override; falls back
//     to code-side default per route)
//   - description: string 50-200 chars, optional (null = no override;
//     falls back to siteSeoDefaults.defaultDescription)
//
// `.nullable()` after `.min().max()` correctly accepts `null` (verified;
// Zod evaluates `null` short-circuit before string validators).

const RouteSeoTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().max(70).nullable(),
	description: z.string().min(50).max(200).nullable(),
});

const RouteSeoFixtureRowSchema = z.object({
	path: z.string().regex(/^\//, 'path must start with `/`'),
	og_image: z.string().uuid().nullable(),
	status: z.enum(['draft', 'published', 'archived']),
	sort: z.number().int(),
	translations: z.array(RouteSeoTranslationSchema).min(1),
});

export const RouteSeoFixtureSchema = z
	.array(RouteSeoFixtureRowSchema)
	.min(1)
	.refine(
		(rows) => {
			const paths = rows.map((r) => r.path);
			return new Set(paths).size === paths.length;
		},
		{ message: 'fixture rows must have unique `path` values' },
	)
	.readonly();

export type RouteSeoFixture = z.infer<typeof RouteSeoFixtureRowSchema>;

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadRouteSeoFixture(): readonly RouteSeoFixture[] {
	return RouteSeoFixtureSchema.parse(fixtureData);
}

// --- Directus row shapes ---------------------------------------------------

export interface DirectusRouteSeoTranslationRow {
	languages_code: Locale;
	title: string | null;
	description: string | null;
}

export interface DirectusRouteSeoRow {
	id?: number;
	path: string;
	og_image: string | null;
	status: RouteSeoStatus;
	sort: number;
	translations: readonly DirectusRouteSeoTranslationRow[];
}

// --- Pure transformation helpers (tested in tests/seed-route-seo-dry-run.test.ts) ---

export function toTranslationRows(
	fixture: RouteSeoFixture,
): readonly DirectusRouteSeoTranslationRow[] {
	return fixture.translations.map((t) => ({
		languages_code: t.languages_code,
		title: t.title,
		description: t.description,
	}));
}

/**
 * Build the Directus row payload (parent + nested translations) for an
 * insert OR upsert call. The `id` field is omitted; Directus auto-assigns
 * on insert, and on update the caller passes the existing id explicitly
 * via updateItem(collection, id, patch).
 */
export function toRouteSeoRow(fixture: RouteSeoFixture): DirectusRouteSeoRow {
	return {
		path: fixture.path,
		og_image: fixture.og_image,
		status: fixture.status,
		sort: fixture.sort,
		translations: toTranslationRows(fixture),
	};
}

/**
 * Build the patch payload for an existing row. Excludes `path` (natural key
 * stays stable) and `translations` — translation rows are handled separately
 * by the caller via the standard "delete-then-recreate translations" flow,
 * because Directus's nested update semantics for M2O junction arrays vary
 * per SDK version + collection settings.
 */
export function toRouteSeoPatch(
	fixture: RouteSeoFixture,
): Omit<DirectusRouteSeoRow, 'id' | 'path' | 'translations'> {
	return {
		og_image: fixture.og_image,
		status: fixture.status,
		sort: fixture.sort,
	};
}

// --- Directus I/O ----------------------------------------------------------

interface Schema {
	route_seo: DirectusRouteSeoRow[];
	route_seo_translations: (DirectusRouteSeoTranslationRow & {
		id?: number;
		route_seo_id?: number;
	})[];
}

const log = createLogger('seed-route-seo');

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
}

export async function seedRouteSeo(
	fixtures: readonly RouteSeoFixture[],
	opts: SeedRunOptions,
): Promise<void> {
	if (opts.dryRun) {
		log.info(
			`dry-run: would process ${fixtures.length} route_seo rows against ${opts.directusUrl}`,
		);
		for (const f of fixtures) {
			const row = toRouteSeoRow(f);
			log.info(
				`  ~ ${f.path.padEnd(20)}  status=${row.status}  sort=${row.sort}  ` +
					`og_image=${row.og_image ? 'yes' : 'no'}  translations=${row.translations.length}`,
			);
		}
		log.info('dry-run complete (no writes).');
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		// Delete in dependency order: translations first (CASCADE may not
		// always trigger reliably depending on collection settings), then
		// parent rows.
		const existingTranslations = await client.request(
			readItems('route_seo_translations', { fields: ['id'], limit: -1 }),
		);
		if (existingTranslations.length > 0) {
			log.info(
				`clearing ${existingTranslations.length} existing route_seo_translations rows...`,
			);
			const ids = existingTranslations.map((r) => r.id as number);
			try {
				await client.request(deleteItems('route_seo_translations', ids));
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to clear route_seo_translations: ${msgs.join(' · ')}`,
				);
			}
		}

		const existingParents = await client.request(
			readItems('route_seo', { fields: ['id'], limit: -1 }),
		);
		if (existingParents.length > 0) {
			log.info(`clearing ${existingParents.length} existing route_seo rows...`);
			for (const p of existingParents) {
				try {
					await client.request(deleteItem('route_seo', p.id as number));
				} catch (err) {
					const msgs = parseErrors(err);
					throw new DirectusError(
						500,
						`Failed to delete route_seo row ${p.id}: ${msgs.join(' · ')}`,
					);
				}
			}
		}

		// After reset: insert all rows fresh.
		log.info(`creating ${fixtures.length} route_seo rows (with translations)...`);
		for (const f of fixtures) {
			const row = toRouteSeoRow(f);
			try {
				await client.request(
					createItem('route_seo', row as unknown as DirectusRouteSeoRow),
				);
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to create route_seo ${f.path}: ${msgs.join(' · ')}`,
				);
			}
			log.info(
				`  ✓ ${f.path.padEnd(20)} status=${row.status} sort=${row.sort}`,
			);
		}
	} else {
		// Upsert by `path`: look up existing rows, update where path matches,
		// create where it doesn't. Preserves int PKs + translation FKs across
		// re-runs.
		const existing = await client.request(
			readItems('route_seo', {
				fields: ['id', 'path', { translations: ['id'] }],
				limit: -1,
			}),
		);
		// Map path → { id, translationIds }
		type ExistingMeta = { id: number; translationIds: readonly number[] };
		const byPath = new Map<string, ExistingMeta>();
		for (const r of existing) {
			const id = r.id as number;
			const translations = (r.translations ?? []) as readonly { id: number }[];
			byPath.set(r.path as string, {
				id,
				translationIds: translations.map((t) => t.id),
			});
		}

		log.info(
			`upserting ${fixtures.length} route_seo rows (${byPath.size} existing in CMS)...`,
		);

		for (const f of fixtures) {
			const row = toRouteSeoRow(f);
			const existingRow = byPath.get(f.path);

			if (existingRow) {
				// Update parent scalar fields.
				try {
					await client.request(
						updateItem(
							'route_seo',
							existingRow.id,
							toRouteSeoPatch(f) as unknown as DirectusRouteSeoRow,
						),
					);
				} catch (err) {
					const msgs = parseErrors(err);
					throw new DirectusError(
						500,
						`Failed to update route_seo ${f.path} (id=${existingRow.id}): ${msgs.join(' · ')}`,
					);
				}

				// Replace translations: delete existing translation rows for this
				// parent, then recreate. Cleaner than partial-update semantics
				// across SDK versions.
				if (existingRow.translationIds.length > 0) {
					try {
						await client.request(
							deleteItems(
								'route_seo_translations',
								existingRow.translationIds as number[],
							),
						);
					} catch (err) {
						const msgs = parseErrors(err);
						throw new DirectusError(
							500,
							`Failed to clear translations for ${f.path}: ${msgs.join(' · ')}`,
						);
					}
				}
				for (const t of row.translations) {
					try {
						await client.request(
							createItem('route_seo_translations', {
								...t,
								route_seo_id: existingRow.id,
							} as unknown as DirectusRouteSeoTranslationRow & { route_seo_id: number }),
						);
					} catch (err) {
						const msgs = parseErrors(err);
						throw new DirectusError(
							500,
							`Failed to create translation for ${f.path} [${t.languages_code}]: ${msgs.join(' · ')}`,
						);
					}
				}
				log.info(
					`  ✎ ${f.path.padEnd(20)} (updated id=${existingRow.id})  status=${row.status} sort=${row.sort}`,
				);
			} else {
				// Create new with nested translations.
				try {
					await client.request(
						createItem('route_seo', row as unknown as DirectusRouteSeoRow),
					);
				} catch (err) {
					const msgs = parseErrors(err);
					throw new DirectusError(
						500,
						`Failed to create route_seo ${f.path}: ${msgs.join(' · ')}`,
					);
				}
				log.info(
					`  ✓ ${f.path.padEnd(20)} (created)  status=${row.status} sort=${row.sort}`,
				);
			}
		}
	}

	const final = await client.request(
		readItems('route_seo', {
			fields: ['id', 'path', 'status'],
			limit: -1,
			sort: ['sort'],
		}),
	);
	log.info(`verified: ${final.length} route_seo rows in Directus`);
	if (final.length < fixtures.length) {
		throw new Error(
			`[seed-route-seo] count mismatch: expected ≥${fixtures.length}, got ${final.length}`,
		);
	}
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseSeedFlags();
	const directusUrl = defaultDirectusUrl();
	log.info(
		`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`,
	);

	const fixtures = loadRouteSeoFixture();
	log.info(
		`source: ${fixtures.length} route_seo rows from fixtures/collections/route-seo.json`,
	);

	if (dryRun) {
		await seedRouteSeo(fixtures, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedRouteSeo(fixtures, { directusUrl, token, reset });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-route-seo] FAILED:', err);
		process.exit(1);
	});
}
