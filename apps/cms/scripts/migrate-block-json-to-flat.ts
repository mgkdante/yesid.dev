#!/usr/bin/env bun
// apps/cms/scripts/migrate-block-json-to-flat.ts
/**
 * Backfill flat columns from the legacy fixed-shape JSON columns (go2-t1b).
 * DRY-RUN BY DEFAULT. --apply writes; --verify recomputes every patch and
 * exits 1 on any mismatch with stored flat values (post-migration check).
 * Idempotent: re-running overwrites flat columns with values derived from
 * the JSON source again. Never touches the JSON columns themselves
 * (archive-not-delete — they are hidden later, in go2/t1b3).
 *
 * Seeded fields (operator addendum): the 5 hero terminal templates on
 * block_tech_stack_page_content_translations have no JSON source — the EN
 * row gets the plan's seed string (current hardcoded component values, with
 * a literal {count} token the component interpolates at render time).
 *
 * Orchestrator runs only:
 *   op run --env-file=.env -- env -u DIRECTUS_BUILD_TOKEN \
 *     PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
 *     bun --cwd apps/cms run migrate:flat-fields -- --apply
 */
import {
	FLAT_FIELD_PLAN,
	translationFieldsFor,
	parentFieldsFor,
	digPath,
	type ParentFlatField,
} from './lib/flat-field-plan';
import { defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';

const log = createLogger('migrate-block-json-to-flat');

type Row = Record<string, unknown> & { id: number | string; languages_code?: string };

/** Defensive extra steps for parent columns that PRE-DATE this migration. */
const ONLY_IF_NULL_EXTRAS: ParentFlatField[] = [
	{ scope: 'parent', collection: 'block_closer', field: 'cta_href', type: 'string', translationsCollection: 'block_closer_translations', sourceField: 'cta', sourcePath: ['href'], onlyIfNull: true },
	{ scope: 'parent', collection: 'block_closer', field: 'attribution_url', type: 'string', translationsCollection: 'block_closer_translations', sourceField: 'attribution', sourcePath: ['url'], onlyIfNull: true },
];

function keep(val: unknown): boolean {
	if (val === undefined || val === null) return false;
	if (typeof val === 'string') return val.length > 0;
	return true; // booleans (incl. false), numbers, arrays, objects all migrate
}

export function buildTranslationPatch(collection: string, row: Row): Record<string, unknown> {
	const patch: Record<string, unknown> = {};
	for (const spec of translationFieldsFor(collection)) {
		const src = row[spec.sourceField];
		const val = src === undefined || src === null ? undefined : digPath(src, spec.sourcePath);
		if (keep(val)) {
			patch[spec.field] = val;
		} else if (spec.seed !== undefined && row.languages_code === 'en') {
			// Net-new column with no JSON source (operator addendum) — EN seed.
			patch[spec.field] = spec.seed;
		}
	}
	return patch;
}

export function buildParentPatch(
	collection: string,
	enRow: Row,
	currentParent: Record<string, unknown>,
): Record<string, unknown> {
	const specs = [
		...parentFieldsFor(collection),
		...ONLY_IF_NULL_EXTRAS.filter((s) => s.collection === collection),
	];
	const patch: Record<string, unknown> = {};
	for (const spec of specs) {
		if (spec.onlyIfNull && currentParent[spec.field] != null) continue;
		const src = enRow[spec.sourceField];
		if (src === undefined || src === null) continue;
		const val = digPath(src, spec.sourcePath);
		if (keep(val)) patch[spec.field] = val;
	}
	return patch;
}

const TRANSLATION_COLLECTIONS = [...new Set(
	FLAT_FIELD_PLAN.filter((f) => f.scope === 'translation').map((f) => f.collection),
)];
const PARENT_COLLECTIONS = [...new Set([
	...FLAT_FIELD_PLAN.filter((f) => f.scope === 'parent').map((f) => f.collection),
	...ONLY_IF_NULL_EXTRAS.map((f) => f.collection),
])];

interface Ctx { url: string; token: string }

async function getRows(ctx: Ctx, collection: string): Promise<Row[]> {
	const res = await fetch(`${ctx.url}/items/${collection}?limit=-1`, {
		headers: { Authorization: `Bearer ${ctx.token}` },
	});
	if (!res.ok) throw new Error(`GET /items/${collection} → ${res.status}`);
	const body = (await res.json()) as { data: Row | Row[] };
	return Array.isArray(body.data) ? body.data : [body.data];
}

async function patchRow(ctx: Ctx, collection: string, id: number | string, patch: Record<string, unknown>): Promise<void> {
	// Parent block_* collections became singletons in the same PR (group A) —
	// singleton items are addressed without an id.
	const singleton = collection.startsWith('block_') && !collection.endsWith('_translations');
	const url = singleton ? `${ctx.url}/items/${collection}` : `${ctx.url}/items/${collection}/${id}`;
	const res = await fetch(url, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.token}` },
		body: JSON.stringify(patch),
	});
	if (!res.ok) throw new Error(`PATCH ${url.slice(ctx.url.length)} → ${res.status} ${await res.text()}`);
}

async function main(): Promise<void> {
	const argv = process.argv.slice(2);
	const apply = argv.includes('--apply');
	const verify = argv.includes('--verify');
	const url = defaultDirectusUrl();
	const token = apply || verify ? await getAdminToken(url) : '';
	const ctx: Ctx = { url, token };
	let mismatches = 0;

	if (!apply && !verify) {
		log.info('dry-run: pass --apply to write or --verify to check a completed migration.');
	}

	for (const collection of TRANSLATION_COLLECTIONS) {
		if (!apply && !verify) { log.info(`would migrate ${collection} (${translationFieldsFor(collection).length} cols)`); continue; }
		const rows = await getRows(ctx, collection);
		for (const row of rows) {
			const patch = buildTranslationPatch(collection, row);
			if (Object.keys(patch).length === 0) continue;
			if (verify) {
				for (const [k, v] of Object.entries(patch)) {
					const stored = row[k];
					if (JSON.stringify(stored) !== JSON.stringify(v)) {
						mismatches++;
						log.error(`MISMATCH ${collection}#${row.id}.${k}: stored=${JSON.stringify(stored)} expected=${JSON.stringify(v)}`);
					}
				}
			} else {
				await patchRow(ctx, collection, row.id, patch);
				log.info(`patched ${collection}#${row.id} (${row.languages_code}): ${Object.keys(patch).length} cols`);
			}
		}
	}

	for (const collection of PARENT_COLLECTIONS) {
		const trCollection = (parentFieldsFor(collection)[0] ?? ONLY_IF_NULL_EXTRAS.find((s) => s.collection === collection))!.translationsCollection;
		if (!apply && !verify) { log.info(`would migrate parent ${collection} from ${trCollection} EN row`); continue; }
		const trRows = await getRows(ctx, trCollection);
		const enRow = trRows.find((r) => r.languages_code === 'en') ?? trRows[0];
		if (!enRow) continue;
		const parents = await getRows(ctx, collection);
		for (const parent of parents) {
			const patch = buildParentPatch(collection, enRow, parent);
			if (Object.keys(patch).length === 0) continue;
			if (verify) {
				for (const [k, v] of Object.entries(patch)) {
					if (JSON.stringify(parent[k]) !== JSON.stringify(v)) {
						mismatches++;
						log.error(`MISMATCH ${collection}#${parent.id}.${k}`);
					}
				}
			} else {
				await patchRow(ctx, collection, parent.id, patch);
				log.info(`patched ${collection}#${parent.id}: ${Object.keys(patch).join(', ')}`);
			}
		}
	}

	if (verify) {
		if (mismatches > 0) { log.error(`verify FAILED: ${mismatches} mismatches`); process.exit(1); }
		log.info('verify OK — flat columns match JSON-derived values.');
	}
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => { log.error('FAILED:', err); process.exit(1); });
}
