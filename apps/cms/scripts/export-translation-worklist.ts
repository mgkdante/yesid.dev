#!/usr/bin/env bun
/**
 * export-translation-worklist.ts
 *
 * Read-only recon for a translation drop (L1 ES pass, reusable for any
 * locale): reads every *_translations junction of the given collections from
 * the DEV CMS and emits a work list of fields that have an EN value but no
 * target-locale value yet.
 *
 * Output shape (ops/i18n/<locale>-worklist-<date>.json):
 *   [{ collection, id, parentFk, fields: { <name>: { en, fr?, existing?, kind } } }]
 *   kind: 'string' | 'json' — json values need structure-preserving handling.
 *
 * Run:
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/export-translation-worklist.ts \
 *     --locale=es --out=ops/i18n/es-worklist-2026-07-09.json
 */
import { parseArgs } from 'node:util';
import { readItems } from '@directus/sdk';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';

/** Conversion surface + shell + home blocks + legal (L1 launch-gate scope).
 *  Deeper collections (tech_stack, projects, blog chrome trail later). */
const COLLECTIONS = [
	'services',
	'services_deliverables',
	'services_sections',
	'block_about_content',
	'about_languages',
	'block_contact_content',
	'contact_channels',
	'site_labels',
	'site_meta',
	'block_closer',
	'error_pages',
	'route_seo',
	'nav_links',
	'block_hero',
	'block_manifesto',
	'block_proof_reel',
	'block_services_grid',
	'block_cta',
	'block_about_intro',
	'block_blog_page_content',
	'block_projects_page_content',
	'block_tech_stack_page_content',
	'legal_pages',
] as const;

const SKIP_KEYS = new Set(['id', 'languages_code']);

interface WorkField {
	en: unknown;
	fr?: unknown;
	existing?: unknown;
	kind: 'string' | 'json';
}

interface WorkEntry {
	collection: string;
	id: string | number;
	parentFk: string;
	fields: Record<string, WorkField>;
}

function isEmpty(v: unknown): boolean {
	if (v === null || v === undefined) return true;
	if (typeof v === 'string') return v.trim() === '';
	if (Array.isArray(v)) return v.length === 0;
	if (typeof v === 'object') return Object.keys(v as object).length === 0;
	return false;
}

async function main(): Promise<void> {
	const { values } = parseArgs({
		options: {
			locale: { type: 'string' },
			out: { type: 'string' },
			/** Comma-separated collection override (default: the L1 launch scope). */
			collections: { type: 'string' },
		},
	});
	const locale = values.locale;
	if (locale !== 'fr' && locale !== 'es') {
		console.error('--locale must be fr or es');
		process.exit(1);
	}
	if (!values.out) {
		console.error('--out required (e.g. ops/i18n/es-worklist-2026-07-09.json)');
		process.exit(1);
	}
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const client = createClient(url, await getAdminToken(url));

	const targetCollections = values.collections
		? (values.collections.split(',').map((c) => c.trim()) as readonly string[])
		: COLLECTIONS;
	const entries: WorkEntry[] = [];
	let fieldCount = 0;
	for (const collection of targetCollections) {
		const junction = `${collection}_translations`;
		let rows: Array<Record<string, unknown>>;
		try {
			rows = (await client.request(
				readItems(junction as never, { limit: -1 } as never),
			)) as Array<Record<string, unknown>>;
		} catch (error) {
			console.error(`  skip ${junction}: ${(error as Error).message}`);
			continue;
		}
		if (rows.length === 0) continue;
		const parentFk = Object.keys(rows[0]).find(
			(k) => k.endsWith('_id') && !SKIP_KEYS.has(k),
		);
		if (!parentFk) {
			console.error(`  skip ${junction}: no parent FK column found`);
			continue;
		}
		const byParent = new Map<string | number, Record<string, Record<string, unknown>>>();
		for (const row of rows) {
			const parent = row[parentFk] as string | number;
			const code = row.languages_code as string;
			if (!byParent.has(parent)) byParent.set(parent, {});
			byParent.get(parent)![code] = row;
		}
		for (const [parent, locales] of byParent) {
			const en = locales.en;
			if (!en) continue;
			const target = locales[locale] ?? {};
			const fields: Record<string, WorkField> = {};
			for (const [key, enValue] of Object.entries(en)) {
				if (SKIP_KEYS.has(key) || key === parentFk) continue;
				if (isEmpty(enValue)) continue;
				if (!isEmpty(target[key])) continue; // already translated
				fields[key] = {
					en: enValue,
					...(isEmpty(locales.fr?.[key]) ? {} : { fr: locales.fr![key] }),
					kind: typeof enValue === 'string' ? 'string' : 'json',
				};
				fieldCount++;
			}
			if (Object.keys(fields).length > 0) {
				entries.push({ collection, id: parent, parentFk, fields });
			}
		}
		const n = entries.filter((e) => e.collection === collection).length;
		if (n > 0) console.error(`  ${collection}: ${n} entries`);
	}

	await Bun.write(values.out, JSON.stringify(entries, null, '\t') + '\n');
	console.error(`OK: ${entries.length} entries, ${fieldCount} untranslated fields -> ${values.out}`);
}

main().catch((error) => {
	console.error('[worklist] FAILED:', error);
	process.exit(1);
});
