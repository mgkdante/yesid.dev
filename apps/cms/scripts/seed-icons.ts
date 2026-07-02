#!/usr/bin/env bun
//
// DONE — one-shot seed, completed (slice-18h-ii Phase 3; banner added in
// slice-28.5, audit #34). The icons collection (34 rows) lives in Directus.
// Keep for fresh-environment bootstrap only (--dry-run / --reset guarded).
// Kept in-tree per the 27.2 archive-not-delete convention.
//
/**
 * Seed the Directus `icons` collection from `fixtures/collections/icons.json`.
 *
 * Slice 18 18h-ii Phase 3. Mirrors seed-tech-stack.ts shape (lib/* helpers +
 * dry-run + reset + pure helpers exported for tests).
 *
 * 34 rows — one per unique tech_stack.icon string. 29 rows have iconify_id
 * populated; 5 rows (alembic/dax/rest-api/ssis/ssrs) have iconify_id: null
 * with notes documenting the deferral.
 *
 * Run from REPO ROOT:
 *   bun run apps/cms/scripts/seed-icons.ts            # writes live
 *   bun run apps/cms/scripts/seed-icons.ts --dry-run  # preview
 *   bun run apps/cms/scripts/seed-icons.ts --reset    # delete-all then write
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/icons.json' with { type: 'json' };
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import { parseSeedFlags } from './lib/cli';

// --- Zod schema (validate fixture JSON at load-time) -----------------------

export const IconFixtureSchema = z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	name: z.string().min(1),
	iconify_id: z.string().nullable(),
	svg_override: z.string().nullable(),
	category: z.array(z.string()).readonly(),
	notes: z.string().nullable(),
	status: z.enum(['draft', 'published', 'archived']),
	sort: z.number().int().min(1),
});

export type IconFixture = z.infer<typeof IconFixtureSchema>;

export const IconFixtureCollectionSchema = z.array(IconFixtureSchema).min(1).readonly();

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadIconFixture(): readonly IconFixture[] {
	return IconFixtureCollectionSchema.parse(fixtureData);
}

// --- Directus row shape (flat — matches the Directus collection layout) -----

export interface DirectusIconRow {
	id: string;
	name: string;
	iconify_id: string | null;
	svg_override: string | null;
	category: string[];
	notes: string | null;
	status: 'draft' | 'published' | 'archived';
	sort: number;
}

// --- Pure transformation helper (exported for tests) -----------------------

export function toIconRow(item: IconFixture): DirectusIconRow {
	return {
		id: item.id,
		name: item.name,
		iconify_id: item.iconify_id,
		svg_override: item.svg_override,
		category: [...item.category],
		notes: item.notes,
		status: item.status,
		sort: item.sort,
	};
}

// --- Directus I/O ---------------------------------------------------------

interface Schema {
	icons: DirectusIconRow[];
}

const log = createLogger('seed-icons');

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
}

export async function seedIcons(
	items: readonly IconFixture[],
	opts: SeedRunOptions,
): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would create ${items.length} icon rows`);
		for (const item of items) {
			const iconifyStr = item.iconify_id ?? '(null)';
			const notesStr = item.notes ? ` notes=${JSON.stringify(item.notes)}` : '';
			log.info(
				`  [${String(item.sort).padStart(2, '0')}] ${item.id.padEnd(20)}  iconify_id=${iconifyStr}${notesStr}`,
			);
		}
		log.info('dry-run complete (no writes).');
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		const existing = await client.request(readItems('icons', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			log.info(`clearing ${existing.length} existing icon rows...`);
			for (const row of existing) {
				try {
					await client.request(deleteItem('icons', row.id));
				} catch (err) {
					const msgs = parseErrors(err);
					throw new DirectusError(
						500,
						`Failed to delete icons row ${row.id}: ${msgs.join(' · ')}`,
					);
				}
			}
		}
	} else {
		const existing = await client.request(readItems('icons', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			throw new Error(
				`[seed] found ${existing.length} existing icons rows. Re-run with --reset to clear + recreate.`,
			);
		}
	}

	log.info(`creating ${items.length} icon rows...`);
	for (const item of items) {
		const row = toIconRow(item);
		try {
			await client.request(createItem('icons', row as unknown as DirectusIconRow));
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Failed to create icons row ${item.id}: ${msgs.join(' · ')}`,
			);
		}
		const iconifyStr = item.iconify_id ?? '(null)';
		log.info(
			`  ✓ ${item.id.padEnd(20)}  iconify_id=${iconifyStr}  sort=${item.sort}`,
		);
	}

	const final = await client.request(
		readItems('icons', { fields: ['id', 'status'], limit: -1, sort: ['sort'] }),
	);
	log.info(`verified: ${final.length} icon rows in Directus`);
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

	const items = loadIconFixture();
	log.info(`source: ${items.length} items from fixtures/collections/icons.json`);

	if (dryRun) {
		await seedIcons(items, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedIcons(items, { directusUrl, token, reset });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-icons] FAILED:', err);
		process.exit(1);
	});
}
