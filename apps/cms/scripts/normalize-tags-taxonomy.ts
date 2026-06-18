/**
 * normalize-tags-taxonomy.ts - replace the free-form `tags` json arrays on
 * `projects` and `blog_posts` with ONE shared, normalized `tags` collection +
 * M2M junctions (projects_tags, blog_posts_tags). Mirrors the tech_stack model.
 *
 * Tags render as raw slugs (verbatim) and overlap across projects + blog
 * (etl, postgresql, transit), so a single shared taxonomy is the normalized
 * answer. The collection id == the current slug, so fetched output stays
 * byte-identical; a `name` field (seeded = slug) leaves room for future labels.
 *
 * Sequence (idempotent):
 *   1. tags collection (id slug PK + name) + seed every distinct slug in use.
 *   2. junction collections projects_tags / blog_posts_tags (id, <parent>_id,
 *      tags_id, sort) - fields only.
 *   3. populate junctions from the json tags, in array order (sort = index).
 *   4. drop the json `tags` field from projects + blog_posts.
 *   5. create the M2M relations (one_field 'tags', sort_field 'sort') - this
 *      re-creates a `tags` alias on each parent, now backed by the junction.
 *
 * DEV-ONLY (hard guard). Dry-run by default; --apply to execute.
 */

import {
	readItems,
	createItems,
	createCollection,
	createField,
	createRelation,
	deleteField,
	readCollections,
	readFieldsByCollection,
} from '@directus/sdk';
import { runMain } from './lib/cli';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

interface TagParent { id: string; tags: string[] | null }

const PARENTS = [
	{ collection: 'projects', junction: 'projects_tags', parentField: 'projects_id' },
	{ collection: 'blog_posts', junction: 'blog_posts_tags', parentField: 'blog_posts_id' },
] as const;

function slugify(s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

type Client = ReturnType<typeof createClient>;

async function collectionExists(client: Client, name: string): Promise<boolean> {
	const cols = (await client.request(readCollections())) as Array<{ collection: string }>;
	return cols.some((c) => c.collection === name);
}
async function fieldExists(client: Client, collection: string, field: string): Promise<boolean> {
	const fields = await client.request(readFieldsByCollection(collection));
	return fields.some((f) => f.field === field);
}

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<{ log: string[] }> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];
	const D = dryRun;

	const [projects, blog] = await Promise.all([
		client.request(readItems('projects', { limit: -1, fields: ['id', 'tags'] })) as Promise<TagParent[]>,
		client.request(readItems('blog_posts', { limit: -1, fields: ['id', 'tags'] })) as Promise<TagParent[]>,
	]);
	const byCollection: Record<string, TagParent[]> = { projects, blog_posts: blog };

	// Distinct slugs in use (shared taxonomy).
	const slugs = new Set<string>();
	for (const p of [...projects, ...blog]) for (const t of p.tags ?? []) slugs.add(t);
	const sorted = [...slugs].sort();
	log.push(`Distinct tags (${sorted.length}): ${sorted.join(', ')}`);

	// 1. tags collection + seed.
	if (await collectionExists(client, 'tags')) {
		log.push('[skip] tags collection exists');
	} else {
		log.push('[create] tags collection (id slug PK, name)');
		if (!D)
			await client.request(
				createCollection({
					collection: 'tags',
					meta: { icon: 'sell', note: 'Shared tag taxonomy for projects + blog (normalized from json arrays).', sort_field: 'name' },
					schema: { name: 'tags' },
					fields: [
						{ field: 'id', type: 'string', meta: { interface: 'input', readonly: false, width: 'half', note: 'slug' }, schema: { is_primary_key: true, is_nullable: false } },
						{ field: 'name', type: 'string', meta: { interface: 'input', width: 'half' }, schema: {} },
					],
				}),
			);
	}
	// seed rows (idempotent: only missing).
	const existingTags = (await collectionExists(client, 'tags'))
		? ((await client.request(readItems('tags', { limit: -1, fields: ['id'] }))) as Array<{ id: string }>).map((r) => r.id)
		: [];
	const toSeed = sorted.filter((s) => !existingTags.includes(s)).map((s) => ({ id: s, name: s }));
	log.push(`[seed] ${toSeed.length} tag rows`);
	if (!D && toSeed.length > 0) await client.request(createItems('tags', toSeed));

	// 2-5 per parent.
	for (const p of PARENTS) {
		// 2. junction collection (fields only).
		if (await collectionExists(client, p.junction)) {
			log.push(`[skip] ${p.junction} exists`);
		} else {
			log.push(`[create] ${p.junction} (id, ${p.parentField}, tags_id, sort)`);
			if (!D)
				await client.request(
					createCollection({
						collection: p.junction,
						meta: { hidden: true, icon: 'import_export', note: `M2M junction ${p.collection} -> tags` },
						schema: { name: p.junction },
						fields: [
							{ field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
							{ field: p.parentField, type: 'string', meta: { hidden: true }, schema: {} },
							{ field: 'tags_id', type: 'string', meta: { hidden: true }, schema: {} },
							{ field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} },
						],
					}),
				);
		}

		// 3. populate junction from json order.
		const parents = byCollection[p.collection];
		const rows = parents.flatMap((parent) => (parent.tags ?? []).map((t, i) => ({ [p.parentField]: parent.id, tags_id: t, sort: i })));
		log.push(`[populate] ${p.junction}: ${rows.length} rows`);
		if (!D && rows.length > 0) await client.request(createItems(p.junction, rows));

		// 4. drop json tags field on the parent (after we read it above).
		if (await fieldExists(client, p.collection, 'tags')) {
			log.push(`[drop] ${p.collection}.tags (json)`);
			if (!D) await client.request(deleteField(p.collection, 'tags'));
		} else {
			log.push(`[skip] ${p.collection}.tags already dropped`);
		}

		// 5. relations: junction -> parent (creates the `tags` m2m alias) + junction -> tags.
		log.push(`[relate] ${p.junction}.${p.parentField} -> ${p.collection} (one_field tags, sort) + ${p.junction}.tags_id -> tags`);
		if (!D) {
			await client.request(
				createRelation({
					collection: p.junction,
					field: p.parentField,
					related_collection: p.collection,
					meta: { one_field: 'tags', junction_field: 'tags_id', sort_field: 'sort', one_deselect_action: 'nullify' },
					schema: { on_delete: 'CASCADE' },
				}),
			);
			await client.request(
				createRelation({
					collection: p.junction,
					field: 'tags_id',
					related_collection: 'tags',
					meta: { one_field: null, junction_field: p.parentField, one_deselect_action: 'nullify' },
					schema: { on_delete: 'CASCADE' },
				}),
			);
		}

		// The relation does NOT auto-create the parent alias; create it explicitly
		// (Directus convention; mirrors setup-stack-archetypes-schema step 9).
		if (await fieldExists(client, p.collection, 'tags')) {
			log.push(`[skip] ${p.collection}.tags alias exists`);
		} else {
			log.push(`[alias] ${p.collection}.tags (list-m2m)`);
			if (!D)
				await client.request(
					createField(p.collection, {
						field: 'tags',
						type: 'alias',
						meta: { interface: 'list-m2m', special: ['m2m'], note: 'normalized tag taxonomy (M2M)' },
					}),
				);
		}
	}

	return { log };
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = await getAdminToken(directusUrl);
	const { log } = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

runMain(main);
