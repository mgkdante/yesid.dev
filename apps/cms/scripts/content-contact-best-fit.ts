#!/usr/bin/env bun
/**
 * content-contact-best-fit.ts
 *
 * Value half of the contact BEST FIT block (launch Phase 1, homework #26b):
 * one section label + three lines naming the projects that fit best, mapped
 * loosely to the four service stations (databases/dashboards, pipelines, web).
 *
 * Requires setup-contact-best-fit-fields.ts --apply to have run first.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, rest } from './lib/schema-apply';

const log = createLogger('contact-best-fit');

type Values = Record<string, string>;

const VALUES: { en: Values; fr: Values } = {
	en: {
		info_section_label_best_fit: 'BEST FIT',
		info_best_fit_1: 'Slow reports that need to be fast',
		info_best_fit_2: 'Manual data work that should run itself',
		info_best_fit_3: 'Sites and stores wired to live data',
	},
	fr: {
		info_section_label_best_fit: 'PROJETS IDÉAUX',
		info_best_fit_1: 'Des rapports lents qui doivent aller vite',
		info_best_fit_2: 'Du travail de données manuel qui devrait rouler tout seul',
		info_best_fit_3: 'Des sites et boutiques branchés sur des données en direct',
	},
};

async function apiGet(ctx: ApplyContext, path: string): Promise<any> {
	const res = await rest(ctx, 'GET', path);
	if (res.status >= 400) throw new Error(`GET ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

async function apiPatch(ctx: ApplyContext, path: string, body: unknown): Promise<any> {
	const res = await rest(ctx, 'PATCH', path, body);
	if (res.status >= 400) throw new Error(`PATCH ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

async function main(): Promise<void> {
	const apply = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	assertDevCms(url);
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: BEST FIT section label + 3 lines on block_contact_content_translations (en, fr)`);
	for (const locale of ['en', 'fr'] as const) {
		for (const [field, value] of Object.entries(VALUES[locale])) {
			log.info(`  [${locale}] ${field} = "${value}"`);
		}
	}
	if (!apply) {
		log.info('dry-run complete. Pass --apply to write values.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	const json = await apiGet(ctx, '/items/block_contact_content?fields=translations.id,translations.languages_code');
	const rows = (json?.data?.translations ?? []) as Array<{ id: number; languages_code: string }>;
	const ids = Object.fromEntries(rows.map((row) => [row.languages_code, row.id]));
	for (const locale of ['en', 'fr'] as const) {
		const rowId = ids[locale];
		if (rowId === undefined) throw new Error(`block_contact_content: missing ${locale} translation row`);
		await apiPatch(ctx, `/items/block_contact_content_translations/${rowId}`, VALUES[locale]);
		log.info(`  ok best-fit [${locale}] row ${rowId} (${Object.keys(VALUES[locale]).length} fields)`);
	}
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[contact-best-fit] FAILED:', error);
		process.exit(1);
	});
}
