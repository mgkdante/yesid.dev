/**
 * trim-archived-tech.ts - delete tech_stack rows that are status=archived AND
 * fully unreferenced (no project, service, or archetype junction). These are
 * tech from old/removed projects; archived rows are already excluded from
 * techStackItems (engine catalog + tech-stack page), so deleting them changes
 * nothing visible. It just trims the database.
 *
 * Computed dynamically (not hardcoded) so it is safe + idempotent: a row is only
 * removed if it is archived AND orphaned AND unreferenced at run time.
 *
 * DEV-ONLY (hard guard). Dry-run by default; --apply to execute. Destructive.
 */

import { readItems, deleteItems } from '@directus/sdk';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { runMain } from './lib/cli';

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<{ removed: string[]; log: string[] }> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	const rows = (await client.request(
		readItems('tech_stack', { limit: -1, fields: ['id', 'status', 'projects.id', 'services.id'] }),
	)) as Array<{ id: string; status: string; projects?: unknown[]; services?: unknown[] }>;

	const archivedOrphans = rows.filter(
		(r) => r.status === 'archived' && !(r.projects?.length) && !(r.services?.length),
	);

	// Safety: exclude any still referenced by an archetype recipe.
	const archetypeRefs = (await client.request(
		readItems('stack_archetypes_tech', { limit: -1, fields: ['tech_stack_id'] }),
	)) as Array<{ tech_stack_id: string }>;
	const inArchetype = new Set(archetypeRefs.map((r) => r.tech_stack_id));

	const removable = archivedOrphans.filter((r) => !inArchetype.has(r.id)).map((r) => r.id);
	const blocked = archivedOrphans.filter((r) => inArchetype.has(r.id)).map((r) => r.id);

	log.push(`Archived + orphaned + unreferenced (delete): ${removable.length ? removable.join(', ') : '(none)'}`);
	if (blocked.length) log.push(`Archived but still in an archetype (KEPT): ${blocked.join(', ')}`);

	if (removable.length > 0 && !dryRun) {
		// Translations cascade on tech_stack delete, but remove them first to be safe.
		const trans = (await client.request(
			readItems('tech_stack_translations', { limit: -1, fields: ['id', 'tech_stack_id'] }),
		)) as Array<{ id: number; tech_stack_id: string }>;
		const transIds = trans.filter((t) => removable.includes(t.tech_stack_id)).map((t) => t.id);
		if (transIds.length > 0) await client.request(deleteItems('tech_stack_translations', transIds));
		await client.request(deleteItems('tech_stack', removable));
	}

	return { removed: removable, log };
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = await getAdminToken(directusUrl);
	const { removed, log } = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}: ${removed.length} tech rows ${dryRun ? 'would be' : ''} removed.${dryRun ? ' Re-run with --apply.' : ''}`);
}

runMain(main, import.meta);
