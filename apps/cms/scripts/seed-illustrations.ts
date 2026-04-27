#!/usr/bin/env bun
/**
 * Seed the Directus `illustrations` collection from
 * `fixtures/collections/illustrations.json`.
 *
 * Slice 18 18f Phase 8. Mirrors seed-projects.ts shape (lib/* + dry-run +
 * reset + pure helpers). Difference: uploads SVG files to Directus
 * before creating rows; the resulting file UUIDs populate the M2O.
 */

import { createItem, deleteItem, readFolders, readItems, uploadFiles } from '@directus/sdk';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import fixtureData from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Zod ----------------------------------------------------------------

const IllustrationFixtureRowSchema = z.object({
	id: z.string().min(1),
	file_legacy_path: z.string().min(1),
	label: z.string().min(1),
	category: z.enum(['professional', 'personal', 'general']),
	tags: z.array(z.string()).readonly(),
	description: z.string().min(1),
	sort: z.number().int().min(0),
});

export type IllustrationFixture = z.infer<typeof IllustrationFixtureRowSchema>;

export const IllustrationsFixtureSchema = z.array(IllustrationFixtureRowSchema).min(1).readonly();

export function loadIllustrationsFixture(): readonly IllustrationFixture[] {
	return IllustrationsFixtureSchema.parse(fixtureData);
}

// --- Row shape ----------------------------------------------------------

export interface DirectusIllustrationRow {
	id: string;
	file: string;
	label: string;
	category: 'professional' | 'personal' | 'general';
	tags: readonly string[];
	description: string;
	sort: number;
}

export function toIllustrationRow(fixture: IllustrationFixture, fileUuid: string): DirectusIllustrationRow {
	return {
		id: fixture.id,
		file: fileUuid,
		label: fixture.label,
		category: fixture.category,
		tags: fixture.tags,
		description: fixture.description,
		sort: fixture.sort,
	};
}

// --- I/O ----------------------------------------------------------------

interface DirectusFolder {
	id: string;
	name: string;
}

interface Schema {
	illustrations: DirectusIllustrationRow[];
	directus_folders: DirectusFolder[];
}

const log = createLogger('seed-illustrations');

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
}

export async function seedIllustrations(
	rows: readonly IllustrationFixture[],
	opts: SeedRunOptions,
): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would seed ${rows.length} illustrations against ${opts.directusUrl}`);
		for (const r of rows) {
			log.info(`  ~ ${r.id.padEnd(24)}  ${r.category}  file=${r.file_legacy_path}`);
		}
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		const existing = await client.request(readItems('illustrations', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			log.info(`clearing ${existing.length} existing illustrations...`);
			for (const r of existing) {
				try { await client.request(deleteItem('illustrations', r.id)); }
				catch (err) {
					throw new DirectusError(500, `Failed to delete illustration ${r.id}: ${parseErrors(err).join(' · ')}`);
				}
			}
		}
	} else {
		const existing = await client.request(readItems('illustrations', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			throw new Error(`[seed-illustrations] found ${existing.length} existing rows. Re-run with --reset.`);
		}
	}

	// Resolve illustrations folder UUID at runtime — Directus expects a UUID, not a name.
	const folders = (await client.request(
		readFolders({ filter: { name: { _eq: 'illustrations' } }, fields: ['id', 'name'], limit: 1 }),
	)) as DirectusFolder[];
	if (folders.length === 0) {
		throw new Error(
			'[seed-illustrations] illustrations folder not found in Directus. Create it first via the admin UI or seed prerequisite step.',
		);
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const illustrationsFolderId = folders[0]!.id;

	log.info(`uploading + creating ${rows.length} illustrations...`);
	for (const fixture of rows) {
		// Upload SVG to illustrations folder
		const svgBytes = readFileSync(fixture.file_legacy_path);
		const formData = new FormData();
		formData.append('folder', illustrationsFolderId);
		formData.append('title', fixture.label);
		formData.append('description', fixture.description);
		formData.append('file', new Blob([svgBytes], { type: 'image/svg+xml' }), `${fixture.id}.svg`);

		let fileUuid: string;
		try {
			const uploaded = await client.request(uploadFiles(formData));
			fileUuid = (uploaded as { id: string }).id;
		} catch (err) {
			throw new DirectusError(500, `Failed to upload ${fixture.file_legacy_path}: ${parseErrors(err).join(' · ')}`);
		}

		// Create illustration row referencing the file
		const row = toIllustrationRow(fixture, fileUuid);
		try {
			await client.request(createItem('illustrations', row as unknown as DirectusIllustrationRow));
			log.info(`  ✓ ${fixture.id.padEnd(24)}  file=${fileUuid}`);
		} catch (err) {
			throw new DirectusError(500, `Failed to create illustration ${fixture.id}: ${parseErrors(err).join(' · ')}`);
		}
	}

	log.info('done.');
}

function parseFlags(argv: readonly string[]): { dryRun: boolean; reset: boolean } {
	return { dryRun: argv.includes('--dry-run'), reset: argv.includes('--reset') };
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseFlags(process.argv.slice(2));
	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	const rows = loadIllustrationsFixture();

	if (dryRun) {
		await seedIllustrations(rows, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedIllustrations(rows, { directusUrl, token, reset });
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-illustrations] FAILED:', err);
		process.exit(1);
	});
}
