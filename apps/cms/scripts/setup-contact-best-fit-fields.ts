#!/usr/bin/env bun
/**
 * setup-contact-best-fit-fields.ts
 *
 * Schema half of the contact BEST FIT block (launch Phase 1, homework #26b):
 * a fourth info-terminal section naming the projects that fit best, following
 * the LANGUAGES-section precedent (flat per-locale columns, cheap to extend).
 *
 *   block_contact_content_translations.info_section_label_best_fit
 *   block_contact_content_translations.info_best_fit_1 / _2 / _3
 *
 * Values ship separately via content-contact-best-fit.ts.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write schema.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, type SchemaStep, isAlreadyExists, rest } from './lib/schema-apply';

const log = createLogger('contact-best-fit-fields');

interface FieldSpec {
	field: string;
	note: string;
}

const COLLECTION = 'block_contact_content_translations';

const NEW_FIELDS: readonly FieldSpec[] = [
	{
		field: 'info_section_label_best_fit',
		note: 'Info terminal BEST FIT section label (homework #26b). Stored uppercase like the sibling labels. Default: "BEST FIT"',
	},
	{
		field: 'info_best_fit_1',
		note: 'BEST FIT line 1 of 3: a project shape that fits best (homework #26b). Default: "Slow reports that need to be fast"',
	},
	{
		field: 'info_best_fit_2',
		note: 'BEST FIT line 2 of 3 (homework #26b). Default: "Manual data work that should run itself"',
	},
	{
		field: 'info_best_fit_3',
		note: 'BEST FIT line 3 of 3 (homework #26b). Default: "Sites and stores wired to live data"',
	},
];

export function buildFieldPlan(): SchemaStep[] {
	return NEW_FIELDS.map((spec) => ({
		kind: 'field',
		target: `${COLLECTION}.${spec.field}`,
		method: 'POST',
		path: `/fields/${COLLECTION}`,
		payload: {
			field: spec.field,
			type: 'string',
			meta: {
				interface: 'input',
				note: spec.note,
				width: 'half',
			},
			schema: { is_nullable: true },
		},
	}));
}

async function applyPlan(plan: readonly SchemaStep[], ctx: ApplyContext): Promise<void> {
	for (const step of plan) {
		const res = await rest(ctx, step.method, step.path, step.payload);
		if (res.status < 400) {
			log.info(`  ok ${step.kind} - ${step.target}`);
			continue;
		}
		if (isAlreadyExists(res.status, res.json)) {
			log.info(`  skip ${step.kind} - ${step.target} already exists`);
			continue;
		}
		throw new Error(`${step.method} ${step.path} (${step.target}) failed (${res.status}): ${JSON.stringify(res.json)}`);
	}
}

async function main(): Promise<void> {
	const apply = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildFieldPlan();
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: ${plan.length} new fields on ${COLLECTION}`);
	for (const step of plan) log.info(`  field ${step.target}`);
	if (!apply) {
		log.info('dry-run complete. Pass --apply to write schema.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	await applyPlan(plan, ctx);
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[contact-best-fit-fields] FAILED:', error);
		process.exit(1);
	});
}
