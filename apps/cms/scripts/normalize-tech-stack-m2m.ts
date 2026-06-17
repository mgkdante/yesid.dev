/**
 * normalize-tech-stack-m2m.ts - make the tech_stack M2M the SINGLE source of a
 * project's / service's stack, rebuilt from the curated JSON `stack` arrays
 * (today's rendering source of truth). Fixes the dual-storage drift the audit
 * found: projects.stack / services.stack (json) had diverged from the stale
 * tech_stack_projects / tech_stack_services junctions.
 *
 * What it does (idempotent):
 *   1. Adds a `sort` integer field to each junction (+ sort_field on the relation)
 *      so the curated stack ORDER survives the move off the ordered JSON array.
 *   2. Creates any tech_stack rows referenced by a JSON stack but missing from the
 *      collection (name = the exact JSON string, so fetched names stay byte-identical).
 *   3. Rebuilds tech_stack_projects + tech_stack_services from the JSON: clears each
 *      parent's junction rows, re-inserts one per tech in JSON order (sort = index).
 *
 * It does NOT drop the json `stack` columns. That is a separate step, taken only
 * after the fetcher switch + a byte-identical regen check.
 *
 * DEV-ONLY (hard guard). Dry-run by default; pass --apply to execute.
 * Exported apply({ directusUrl, token }) for the operator-gated prod replay.
 */

import {
	readItems,
	createItem,
	createItems,
	deleteItems,
	createField,
	readFieldsByCollection,
	updateRelation,
} from '@directus/sdk';
import { createClient, defaultDirectusUrl, requireEnv } from './lib/sdk';

interface TechStackRow {
	id: string;
	name: string;
	sort: number | null;
}
interface StackParent {
	id: string;
	stack: string[] | null;
}

const JUNCTIONS = [
	{ junction: 'tech_stack_projects', parentField: 'projects_id', parentCollection: 'projects', oneField: 'tech_stack' },
	{ junction: 'tech_stack_services', parentField: 'services_id', parentCollection: 'services', oneField: 'tech_stack' },
] as const;

/** Slugify a tech name into a stable id (matches the existing tech_stack id style). */
function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/\+/g, 'plus')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

type Client = ReturnType<typeof createClient>;

async function ensureSortField(client: Client, junction: string, parentField: string, dryRun: boolean, log: string[]): Promise<void> {
	const fields = await client.request(readFieldsByCollection(junction));
	if (fields.some((f) => f.field === 'sort')) {
		log.push(`  [skip] ${junction}.sort already exists`);
		return;
	}
	log.push(`  [add ] ${junction}.sort (integer) + sort_field on ${junction}.${parentField}`);
	if (dryRun) return;
	await client.request(
		createField(junction, {
			field: 'sort',
			type: 'integer',
			meta: { interface: 'input', hidden: true },
			schema: {},
		}),
	);
	// Point the M2M (junction -> parent) relation at the sort column so the
	// Directus relation list + our fetch read in curated order.
	await client.request(updateRelation(junction, parentField, { meta: { sort_field: 'sort' } }));
}

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<{ created: string[]; rebuilt: number; log: string[] }> {
	const { directusUrl, token } = opts;
	const dryRun = opts.dryRun ?? false;
	const client = createClient(directusUrl, token);
	const log: string[] = [];

	const [techRows, projects, services] = await Promise.all([
		client.request(readItems('tech_stack', { limit: -1, fields: ['id', 'name', 'sort'] })) as Promise<TechStackRow[]>,
		client.request(readItems('projects', { limit: -1, fields: ['id', 'stack'] })) as Promise<StackParent[]>,
		client.request(readItems('services', { limit: -1, fields: ['id', 'stack'] })) as Promise<StackParent[]>,
	]);

	const nameToId = new Map(techRows.map((r) => [r.name, r.id]));
	const existingIds = new Set(techRows.map((r) => r.id));
	// New tech append AFTER the existing max sort, so they never jump to the front
	// of the tech-stack page / engine catalog (where empty longform would show).
	let nextSort = techRows.reduce((m, r) => Math.max(m, r.sort ?? 0), 0);

	// 1. Sort fields on both junctions.
	log.push('Schema:');
	for (const j of JUNCTIONS) await ensureSortField(client, j.junction, j.parentField, dryRun, log);

	// 2. Missing tech_stack rows (name = exact JSON string -> byte-identical fetch).
	const usedNames = new Set<string>();
	for (const p of [...projects, ...services]) for (const n of p.stack ?? []) usedNames.add(n);
	const created: string[] = [];
	log.push('Missing tech_stack rows:');
	for (const name of [...usedNames].sort()) {
		if (nameToId.has(name)) continue;
		let id = slugify(name);
		while (existingIds.has(id)) id = `${id}-tech`;
		existingIds.add(id);
		nameToId.set(name, id);
		created.push(`${id} (${name})`);
		log.push(`  [create] tech_stack ${id} <- "${name}"`);
		// status: published so the row surfaces in techStackItems (engine catalog
		// + tech-stack page); the fetcher filters status === 'published'. sort
		// appends after existing tech so empty-longform newcomers don't lead.
		if (!dryRun) await client.request(createItem('tech_stack', { id, name, icon_id: null, status: 'published', sort: ++nextSort }));
	}
	if (created.length === 0) log.push('  (none)');

	// 3. Rebuild junctions from curated JSON order.
	let rebuilt = 0;
	for (const j of JUNCTIONS) {
		const parents = j.parentCollection === 'projects' ? projects : services;
		log.push(`Rebuild ${j.junction}:`);
		for (const parent of parents) {
			const stack = parent.stack ?? [];
			const existing = (await client.request(
				readItems(j.junction, { limit: -1, fields: ['id'], filter: { [j.parentField]: { _eq: parent.id } } }),
			)) as Array<{ id: number }>;
			const newRows = stack.map((name, i) => ({ [j.parentField]: parent.id, tech_stack_id: nameToId.get(name), sort: i }));
			log.push(`  ${parent.id}: ${existing.length} old -> ${newRows.length} new [${stack.join(', ')}]`);
			if (dryRun) continue;
			if (existing.length > 0) await client.request(deleteItems(j.junction, existing.map((r) => r.id)));
			if (newRows.length > 0) await client.request(createItems(j.junction, newRows));
			rebuilt += newRows.length;
		}
	}

	return { created, rebuilt, log };
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	if (!directusUrl.includes('cms.dev.yesid.dev')) {
		throw new Error(`Refusing to run against non-dev CMS: ${directusUrl}. This script is DEV-ONLY; prod runs via the gated promotion path.`);
	}
	const token = requireEnv('DIRECTUS_ADMIN_TOKEN', 'dev CMS admin token (op:// ref in apps/cms/.env)');
	const { created, rebuilt, log } = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}: ${created.length} tech rows created, ${rebuilt} junction rows ${dryRun ? 'planned' : 'written'}.`);
	if (dryRun) console.log('Re-run with --apply to execute against dev.');
}

if (import.meta.main) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}
