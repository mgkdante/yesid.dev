#!/usr/bin/env bun
/**
 * setup-footer-groups.ts
 *
 * Receiver r2: the footer goes full-bleed with grouped columns, so the three
 * column headings become CMS chrome (site_labels footerChrome group, same
 * naming as footer_chrome_footer_tagline). Schema + trilingual values in one
 * dev-only pass:
 *
 *   footer_chrome_footer_explore_label   EXPLORE  / EXPLORER  / EXPLORA
 *   footer_chrome_footer_legal_label     LEGAL    / LÉGAL     / LEGAL
 *   footer_chrome_footer_connect_label   CONNECT  / CONNEXION / CONECTA
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, type SchemaStep, isAlreadyExists, rest } from './lib/schema-apply';

const log = createLogger('footer-groups');

const COLLECTION = 'site_labels_translations';

const FIELDS: ReadonlyArray<{ field: string; note: string; values: Record<'en' | 'fr' | 'es', string> }> = [
	{
		field: 'footer_chrome_footer_explore_label',
		note: 'Group: footer chrome. Full-bleed footer EXPLORE column heading. Default: "EXPLORE"',
		values: { en: 'EXPLORE', fr: 'EXPLORER', es: 'EXPLORA' },
	},
	{
		field: 'footer_chrome_footer_legal_label',
		note: 'Group: footer chrome. Full-bleed footer LEGAL column heading. Default: "LEGAL"',
		values: { en: 'LEGAL', fr: 'LÉGAL', es: 'LEGAL' },
	},
	{
		field: 'footer_chrome_footer_connect_label',
		note: 'Group: footer chrome. Full-bleed footer CONNECT column heading (same word as the contact terminal section). Default: "CONNECT"',
		values: { en: 'CONNECT', fr: 'CONNEXION', es: 'CONECTA' },
	},
];

function buildFieldPlan(): SchemaStep[] {
	return FIELDS.map((spec) => ({
		kind: 'field',
		target: `${COLLECTION}.${spec.field}`,
		method: 'POST',
		path: `/fields/${COLLECTION}`,
		payload: {
			field: spec.field,
			type: 'string',
			meta: { interface: 'input', note: spec.note, width: 'half' },
			schema: { is_nullable: true },
		},
	}));
}

async function main(): Promise<void> {
	const apply = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildFieldPlan();
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	for (const spec of FIELDS) {
		log.info(`  field ${COLLECTION}.${spec.field} = ${JSON.stringify(spec.values)}`);
	}
	if (!apply) {
		log.info('dry-run complete. Pass --apply to write.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	for (const step of plan) {
		const res = await rest(ctx, step.method, step.path, step.payload);
		if (res.status < 400) log.info(`  ok field - ${step.target}`);
		else if (isAlreadyExists(res.status, res.json)) log.info(`  skip field - ${step.target} already exists`);
		else throw new Error(`${step.method} ${step.path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	}
	// Values on the three locale rows, discovered through the parent singleton.
	const parent = await rest(ctx, 'GET', '/items/site_labels?fields=translations.id,translations.languages_code');
	const rows = (parent.json?.data?.translations ?? []) as Array<{ id: number; languages_code: string }>;
	for (const locale of ['en', 'fr', 'es'] as const) {
		const row = rows.find((r) => r.languages_code === locale);
		const payload = Object.fromEntries(FIELDS.map((spec) => [spec.field, spec.values[locale]]));
		if (row) {
			const res = await rest(ctx, 'PATCH', `/items/site_labels_translations/${row.id}`, payload);
			if (res.status >= 400) throw new Error(`PATCH ${locale} failed (${res.status}): ${JSON.stringify(res.json)}`);
			log.info(`  ok values [${locale}] row ${row.id}`);
		} else {
			const res = await rest(ctx, 'POST', '/items/site_labels_translations', {
				site_labels_id: 1,
				languages_code: locale,
				...payload,
			});
			if (res.status >= 400) throw new Error(`POST ${locale} failed (${res.status}): ${JSON.stringify(res.json)}`);
			log.info(`  ok values [${locale}] created`);
		}
	}
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[footer-groups] FAILED:', error);
		process.exit(1);
	});
}
