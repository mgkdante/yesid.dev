#!/usr/bin/env bun
/**
 * Import locale translations into Directus translation junctions — slice-28.6.
 *
 * ORCHESTRATOR-ONLY for live runs (live CMS writes policy). Implementers may
 * only run --dry-run. Archive-not-delete: this script only CREATES or UPDATES
 * translation rows — it never deletes.
 *
 * Input JSON shape (one file per drop, reviewed like content; see
 * ops/i18n/fr-translations.example.json):
 * {
 *   "locale": "fr",
 *   "entries": [
 *     { "collection": "services", "id": "data-pipeline", "parentFk": "services_id",
 *       "fields": { "title": "Pipelines de données", "description": "…" } },
 *     { "collection": "block_about_content", "id": 1, "parentFk": "block_about_content_id",
 *       "fields": { "heading": "…" } }
 *   ]
 * }
 *
 * Per-locale JSON columns (LocalizedBlockEditorDocs — e.g. projects.description)
 * are NOT junction rows; for those the orchestrator deep-PATCHes the parent
 * row directly (see the slice-28.6 runbook in the PR body) — this script is
 * for *_translations junctions only.
 *
 * Run (from apps/cms):
 *   bun scripts/import-translations.ts --file=ops/i18n/fr-2026-06.json --dry-run
 *   op run --env-file=../../.env -- bun scripts/import-translations.ts --file=ops/i18n/fr-2026-06.json
 */
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { createItem, readItems, updateItem } from '@directus/sdk';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';

export interface Entry {
	collection: string;
	id: string | number;
	parentFk: string;
	fields: Record<string, string>;
}

export interface Drop {
	locale: 'fr' | 'es';
	entries: Entry[];
}

/** services → services_translations (Directus translations-interface default). */
export function junctionCollection(collection: string): string {
	return `${collection}_translations`;
}

/** Junction row payload for a CREATE: parent FK + languages_code + the fields. */
export function buildCreatePayload(e: Entry, locale: string): Record<string, unknown> {
	return { [e.parentFk]: e.id, languages_code: locale, ...e.fields };
}

/** The full upsert plan — what --dry-run prints. Pure; no I/O. */
export function planDrop(drop: Drop): Array<{ junction: string; payload: Record<string, unknown> }> {
	return drop.entries.map((e) => ({
		junction: junctionCollection(e.collection),
		payload: buildCreatePayload(e, drop.locale),
	}));
}

/** Loud structural validation before anything touches the network. */
export function validateDrop(drop: Drop): void {
	if (drop.locale !== 'fr' && drop.locale !== 'es') {
		throw new Error(`Unsupported drop locale: ${String(drop.locale)} — en is never a translation row.`);
	}
	if (!Array.isArray(drop.entries) || drop.entries.length === 0) {
		throw new Error('Drop has no entries.');
	}
	drop.entries.forEach((e, i) => {
		if (!e.collection) throw new Error(`entries[${i}]: missing collection`);
		if (e.id === undefined || e.id === null || e.id === '') {
			throw new Error(`entries[${i}]: missing id`);
		}
		if (!e.parentFk) throw new Error(`entries[${i}] (${e.collection}/${e.id}): missing parentFk`);
		if (!e.fields || Object.keys(e.fields).length === 0) {
			throw new Error(`entries[${i}] (${e.collection}/${e.id}): empty fields — nothing to write`);
		}
	});
}

if (import.meta.main) {
	const { values } = parseArgs({
		options: { file: { type: 'string' }, 'dry-run': { type: 'boolean', default: false } },
	});
	if (!values.file) {
		console.error('--file required (e.g. --file=ops/i18n/fr-2026-06.json)');
		process.exit(1);
	}
	const drop = JSON.parse(readFileSync(values.file, 'utf-8')) as Drop;
	validateDrop(drop);

	const url = defaultDirectusUrl();
	assertDevCms(url);

	const plan = planDrop(drop);
	if (values['dry-run']) {
		// No client is ever constructed on this path — zero network.
		console.log(JSON.stringify(plan, null, 2));
		console.log(`DRY RUN: ${plan.length} junction upserts planned for locale '${drop.locale}'.`);
		process.exit(0);
	}

	const client = createClient(url, await getAdminToken(url));
	let created = 0;
	let updated = 0;
	for (const e of drop.entries) {
		const junction = junctionCollection(e.collection);
		const existing = (await client.request(
			readItems(junction as never, {
				filter: { [e.parentFk]: { _eq: e.id }, languages_code: { _eq: drop.locale } } as never,
				limit: 1,
			} as never),
		)) as Array<{ id: number }>;
		if (existing.length > 0) {
			await client.request(updateItem(junction as never, existing[0]!.id as never, e.fields as never));
			updated++;
		} else {
			await client.request(
				createItem(junction as never, buildCreatePayload(e, drop.locale) as never),
			);
			created++;
		}
	}
	console.log(
		`${drop.locale} import: ${created} created, ${updated} updated across ${drop.entries.length} entries.`,
	);
}
