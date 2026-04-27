#!/usr/bin/env bun
/**
 * Backfill `tech_stack.icon_id` from the legacy `tech_stack.icon` string.
 *
 * Slice 18 18h-ii Phase 4 Task 8. Mirrors seed-icons.ts shape (lib/* helpers +
 * dry-run + idempotent + validation pre-check). No --reset flag (backfill is
 * a one-directional set; re-running is safe — already-populated rows are skipped).
 *
 * Logic:
 *   1. GET tech_stack rows (id, icon, icon_id).
 *   2. GET icons rows (id) — used for validation.
 *   3. Validation pre-check: every tech_stack.icon must have a matching icons.id.
 *      Any mismatch → log bad rows + exit non-zero. Don't touch data.
 *   4. Skip rows where icon_id is already non-null (idempotence).
 *   5. PATCH each remaining row: set icon_id = icon.
 *   6. Post-backfill verification: re-read tech_stack, count rows with non-null icon_id.
 *
 * Run from REPO ROOT:
 *   bun run apps/cms/scripts/migrate-tech-stack-icon.ts --dry-run
 *   bun run apps/cms/scripts/migrate-tech-stack-icon.ts
 *
 * Or from apps/cms/:
 *   bun run migrate:tech-stack-icon -- --dry-run
 *   bun run migrate:tech-stack-icon
 */

import { readItems, updateItem } from '@directus/sdk';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Types ------------------------------------------------------------------

interface TechStackRow {
	id: string;
	icon: string;
	icon_id: string | null;
}

interface IconRow {
	id: string;
}

interface Schema {
	tech_stack: TechStackRow[];
	icons: IconRow[];
}

// --- Flags ------------------------------------------------------------------

function parseFlags(argv: readonly string[]): { dryRun: boolean } {
	return {
		dryRun: argv.includes('--dry-run'),
	};
}

// --- Core logic (exported for tests) ----------------------------------------

const log = createLogger('migrate-tech-stack-icon');

export interface MigrateRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
}

export async function migrateTechStackIcon(opts: MigrateRunOptions): Promise<void> {
	const { directusUrl, dryRun = false } = opts;

	if (dryRun) {
		log.info('DRY RUN');
	}
	log.info(`target: ${directusUrl}`);

	// 1. Read tech_stack rows.
	const client = dryRun
		? null
		: createClient<Schema>(directusUrl, opts.token);

	// For dry-run we still need to read data (read-only) — use a separate
	// unauthenticated-read client so we hit the public-read endpoint.
	// In practice the tech_stack collection has public read permission
	// (verified in Phase 4 Task 7), so no auth is needed for reading.
	const readClient = createClient<Schema>(directusUrl, opts.token || '');

	log.info('reading tech_stack rows...');
	let techStackRows: TechStackRow[];
	try {
		techStackRows = await readClient.request(
			readItems('tech_stack', { fields: ['id', 'icon', 'icon_id'], limit: -1 }),
		) as TechStackRow[];
	} catch (err) {
		const msgs = parseErrors(err);
		throw new DirectusError(500, `Failed to read tech_stack rows: ${msgs.join(' · ')}`);
	}
	log.info(`reading ${techStackRows.length} tech_stack rows...`);

	// 2. Read icons rows (for validation).
	log.info('reading icons rows...');
	let iconRows: IconRow[];
	try {
		iconRows = await readClient.request(
			readItems('icons', { fields: ['id'], limit: -1 }),
		) as IconRow[];
	} catch (err) {
		const msgs = parseErrors(err);
		throw new DirectusError(500, `Failed to read icons rows: ${msgs.join(' · ')}`);
	}
	log.info(`reading ${iconRows.length} icons rows...`);

	// 3. Validation pre-check.
	const iconIds = new Set(iconRows.map((r) => r.id));
	const badRows = techStackRows.filter((r) => !iconIds.has(r.icon));
	if (badRows.length > 0) {
		log.error('validation FAILED — the following tech_stack.icon strings have no matching icons.id:');
		for (const row of badRows) {
			log.error(`  tech_stack.id=${row.id}  icon=${row.icon}  (no icons row with id="${row.icon}")`);
		}
		process.exit(1);
	}
	log.info(`validation: all ${techStackRows.length} tech_stack.icon strings have matching icons.id rows ✓`);

	// 4. Filter rows that still need backfilling (skip already-populated).
	const rowsToUpdate = techStackRows.filter((r) => r.icon_id === null || r.icon_id === undefined);
	const alreadyDone = techStackRows.length - rowsToUpdate.length;

	if (dryRun) {
		log.info(
			`would PATCH ${rowsToUpdate.length}/${techStackRows.length} rows (icon_id is null on ${rowsToUpdate.length}; ${alreadyDone} already populated)`,
		);
		for (const row of rowsToUpdate) {
			log.info(
				`  ${row.id.padEnd(20)}  icon=${row.icon.padEnd(20)}  → icon_id=${row.icon}`,
			);
		}
		if (rowsToUpdate.length === 0) {
			log.info('nothing to do — all rows already have icon_id populated.');
		}
		log.info('dry run done. Re-run without --dry-run to apply.');
		return;
	}

	// 5. Live PATCH.
	if (rowsToUpdate.length === 0) {
		log.info('nothing to do — all rows already have icon_id populated.');
	} else {
		log.info(`backfilling ${rowsToUpdate.length}/${techStackRows.length} rows...`);
		const writeClient = createClient<Schema>(directusUrl, opts.token);
		for (const row of rowsToUpdate) {
			try {
				await writeClient.request(
					updateItem('tech_stack', row.id, { icon_id: row.icon } as Partial<TechStackRow>),
				);
			} catch (err) {
				const msgs = parseErrors(err);
				throw new DirectusError(
					500,
					`Failed to PATCH tech_stack row ${row.id}: ${msgs.join(' · ')}`,
				);
			}
			log.info(`  ✓ ${row.id.padEnd(20)}  icon_id=${row.icon}`);
		}
	}

	// 6. Post-backfill verification.
	log.info('verifying...');
	let finalRows: TechStackRow[];
	try {
		finalRows = await createClient<Schema>(directusUrl, opts.token).request(
			readItems('tech_stack', { fields: ['id', 'icon', 'icon_id'], limit: -1 }),
		) as TechStackRow[];
	} catch (err) {
		const msgs = parseErrors(err);
		throw new DirectusError(500, `Failed to re-read tech_stack for verification: ${msgs.join(' · ')}`);
	}

	const populated = finalRows.filter((r) => r.icon_id !== null && r.icon_id !== undefined).length;
	log.info(`verified: ${populated}/${finalRows.length} rows have icon_id populated`);

	if (populated !== finalRows.length) {
		throw new Error(
			`[migrate] verification failed: ${finalRows.length - populated} rows still have icon_id=null after backfill`,
		);
	}
}

// --- Entry point ------------------------------------------------------------

async function main(): Promise<void> {
	const { dryRun } = parseFlags(process.argv.slice(2));
	const directusUrl = defaultDirectusUrl();

	if (dryRun) {
		// Dry-run reads public data — no auth needed.
		await migrateTechStackIcon({ directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await migrateTechStackIcon({ directusUrl, token });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[migrate-tech-stack-icon] FAILED:', err);
		process.exit(1);
	});
}
