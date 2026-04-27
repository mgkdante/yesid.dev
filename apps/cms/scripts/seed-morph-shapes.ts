#!/usr/bin/env bun
/**
 * Seed the Directus `morph_shapes` collection.
 * Slice 18 18f Phase 8. Pure data seed; no file uploads.
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/morph-shapes.json' with { type: 'json' };
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const MorphShapeFixtureRowSchema = z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	label: z.string().min(1),
	path: z.string().min(1),
	viewbox: z.string().min(1),
	sort: z.number().int().min(0),
	description: z.string(),
});

export type MorphShapeFixture = z.infer<typeof MorphShapeFixtureRowSchema>;
export const MorphShapesFixtureSchema = z.array(MorphShapeFixtureRowSchema).min(1).readonly();

export function loadMorphShapesFixture(): readonly MorphShapeFixture[] {
	return MorphShapesFixtureSchema.parse(fixtureData);
}

export interface DirectusMorphShapeRow {
	id: string;
	label: string;
	path: string;
	viewbox: string;
	sort: number;
	description: string;
}

export function toMorphShapeRow(fixture: MorphShapeFixture): DirectusMorphShapeRow {
	return { ...fixture };
}

interface Schema { morph_shapes: DirectusMorphShapeRow[]; }
const log = createLogger('seed-morph-shapes');

export interface SeedRunOptions { directusUrl: string; token: string; dryRun?: boolean; reset?: boolean; }

export async function seedMorphShapes(rows: readonly MorphShapeFixture[], opts: SeedRunOptions): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would seed ${rows.length} shapes against ${opts.directusUrl}`);
		for (const r of rows) log.info(`  ~ ${r.id} (${r.viewbox})`);
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);
	if (opts.reset) {
		const existing = await client.request(readItems('morph_shapes', { fields: ['id'], limit: -1 }));
		for (const r of existing) {
			try { await client.request(deleteItem('morph_shapes', r.id)); }
			catch (err) { throw new DirectusError(500, `delete ${r.id}: ${parseErrors(err).join(' · ')}`); }
		}
	} else {
		const existing = await client.request(readItems('morph_shapes', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) throw new Error(`[seed-morph-shapes] found ${existing.length} existing rows. Re-run with --reset.`);
	}

	for (const r of rows) {
		try { await client.request(createItem('morph_shapes', toMorphShapeRow(r) as unknown as DirectusMorphShapeRow)); }
		catch (err) { throw new DirectusError(500, `create ${r.id}: ${parseErrors(err).join(' · ')}`); }
		log.info(`  ✓ ${r.id}`);
	}

	log.info(`done. ${rows.length} morph_shapes seeded.`);
}

async function main(): Promise<void> {
	const dryRun = process.argv.includes('--dry-run');
	const reset = process.argv.includes('--reset');
	const url = defaultDirectusUrl();
	const rows = loadMorphShapesFixture();
	if (dryRun) { await seedMorphShapes(rows, { directusUrl: url, token: '', dryRun: true }); return; }
	const token = await getAdminToken(url);
	await seedMorphShapes(rows, { directusUrl: url, token, reset });
}

if (import.meta.main) {
	main().catch((err) => { console.error('[seed-morph-shapes] FAILED:', err); process.exit(1); });
}
