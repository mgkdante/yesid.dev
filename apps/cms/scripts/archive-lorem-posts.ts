#!/usr/bin/env bun
/**
 * Archive the lorem-ipsum placeholder blog posts in Directus.
 *
 * slice-28.1 (audit #17/#100/#68): four lorem placeholder posts are live on
 * the public /blog listings. The durable fix is CMS-side — set
 * status='archived' on the lorem rows (archive, not delete, per the
 * slice-27.2 deprecation convention) so the SSR build stops emitting them
 * while the rows stay recoverable in Directus.
 *
 * Mirrors the seed-* script shape (lib/* helpers + dry-run default + pure
 * helpers exported for tests). blog_posts uses the slug as its string PK
 * (see seed-blog-posts.ts), so the slugs below are row ids.
 *
 * DRY-RUN BY DEFAULT — no network, no token needed. Pass --apply to write.
 *
 * Operator run (fires the Directus rebuild Flow on update):
 *   op run --env-file=.env -- bun --cwd apps/cms run archive:lorem -- --apply
 *
 * Auth: lib/auth getAdminToken resolves DIRECTUS_BUILD_TOKEN →
 * DIRECTUS_ADMIN_TOKEN → email+password. Target URL: PUBLIC_DIRECTUS_URL
 * (defaults to the dev CMS — set it to prod explicitly for the real run).
 */

import { readItems, updateItem } from '@directus/sdk';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Targets -------------------------------------------------------------

export const LOREM_SLUGS = [
	'lorem-data-warehousing',
	'lorem-etl-patterns',
	'lorem-transit-future',
	'lorem-space-exploration',
] as const;

export type LoremSlug = (typeof LOREM_SLUGS)[number];

// --- Row shape -----------------------------------------------------------

export interface BlogPostStatusRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
}

interface Schema {
	blog_posts: BlogPostStatusRow[];
}

// --- Pure helpers --------------------------------------------------------

export type ArchiveAction = 'archive' | 'skip-already-archived' | 'skip-missing';

export interface ArchivePlanEntry {
	id: string;
	/** Status currently in the CMS; null when the row was not found. */
	currentStatus: BlogPostStatusRow['status'] | null;
	action: ArchiveAction;
}

/**
 * Diff the target slug list against the rows actually present in the CMS.
 * Pure — exported for the dry-run test.
 */
export function buildArchivePlan(
	slugs: readonly string[],
	existing: readonly BlogPostStatusRow[],
): ArchivePlanEntry[] {
	const byId = new Map(existing.map((r) => [r.id, r]));
	return slugs.map((id) => {
		const row = byId.get(id);
		if (!row) return { id, currentStatus: null, action: 'skip-missing' };
		if (row.status === 'archived') {
			return { id, currentStatus: row.status, action: 'skip-already-archived' };
		}
		return { id, currentStatus: row.status, action: 'archive' };
	});
}

export function parseFlags(argv: readonly string[]): { apply: boolean } {
	// --dry-run is the default; it is accepted (and ignored) for symmetry
	// with the seed-* scripts. Only an explicit --apply writes.
	return { apply: argv.includes('--apply') };
}

export function describePlanEntry(entry: ArchivePlanEntry): string {
	switch (entry.action) {
		case 'archive':
			return `  ~ ${entry.id.padEnd(28)} ${entry.currentStatus} -> archived`;
		case 'skip-already-archived':
			return `  = ${entry.id.padEnd(28)} already archived (no-op)`;
		case 'skip-missing':
			return `  ? ${entry.id.padEnd(28)} not found in CMS (skipped)`;
	}
}

// --- I/O -----------------------------------------------------------------

const log = createLogger('archive-lorem-posts');

export interface ArchiveRunOptions {
	directusUrl: string;
	token: string;
}

export async function archiveLoremPosts(
	slugs: readonly string[],
	opts: ArchiveRunOptions,
): Promise<ArchivePlanEntry[]> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);

	const existing = await client.request(
		readItems('blog_posts', {
			filter: { id: { _in: [...slugs] } },
			fields: ['id', 'status'],
			limit: -1,
		}),
	);

	const plan = buildArchivePlan(slugs, existing);
	for (const entry of plan) log.info(describePlanEntry(entry));

	const targets = plan.filter((e) => e.action === 'archive');
	if (targets.length === 0) {
		log.info('nothing to archive — all targets already archived or missing.');
		return plan;
	}

	log.info(`archiving ${targets.length} blog posts...`);
	for (const entry of targets) {
		try {
			await client.request(
				updateItem('blog_posts', entry.id, { status: 'archived' }),
			);
		} catch (err) {
			throw new DirectusError(
				500,
				`Failed to archive blog_post ${entry.id}: ${parseErrors(err).join(' · ')}`,
			);
		}
		log.info(`  ✓ ${entry.id.padEnd(28)} archived`);
	}

	// Verify: re-read and assert every found target is now archived.
	const after = await client.request(
		readItems('blog_posts', {
			filter: { id: { _in: [...slugs] } },
			fields: ['id', 'status'],
			limit: -1,
		}),
	);
	const stillLive = after.filter((r) => r.status !== 'archived');
	if (stillLive.length > 0) {
		throw new Error(
			`[archive-lorem-posts] verify failed — still not archived: ${stillLive
				.map((r) => `${r.id}(${r.status})`)
				.join(', ')}`,
		);
	}
	log.info(`verified: ${after.length} target rows archived in Directus`);
	return plan;
}

async function main(): Promise<void> {
	const { apply } = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	assertDevCms(url);
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);

	if (!apply) {
		// Network-free dry-run (matches the seed-* scripts): print the intended
		// mutation per slug. Run with --apply to read live statuses and write.
		log.info(
			`dry-run: would set status='archived' on ${LOREM_SLUGS.length} blog_posts rows:`,
		);
		for (const id of LOREM_SLUGS) {
			log.info(`  ~ ${id.padEnd(28)} status -> archived`);
		}
		log.info('dry-run complete (no reads, no writes). Pass --apply to execute.');
		return;
	}

	const token = await getAdminToken(url);
	await archiveLoremPosts(LOREM_SLUGS, { directusUrl: url, token });
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[archive-lorem-posts] FAILED:', err);
		process.exit(1);
	});
}
