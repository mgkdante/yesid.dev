#!/usr/bin/env bun
/**
 * content-services slice — PROD content promotion (operator-authorized 2026-06-15).
 *
 * Replays the slice's CMS migrations against PRODUCTION (cms.yesid.dev) so the
 * prod build (which regenerates the .ts from PROD CMS) ships this slice:
 *   1. schema   — create the 2 new site_labels columns (idempotent; others skip)
 *   2. labels   — seed services_chrome_detail_{stack_heading,see_stack_label} (en+fr)
 *   3. copy     — descriptions/value-props + sections (Is this you? / My Approach,
 *                 updates prod's existing "My Approach" in place) + relatedProjects
 *                 + reconcile-delete "When I'm not your guy"
 *   4. metrics  — impact metrics (1.5TB+, 95+) + web-dev benefit headline
 *
 * Calls each module's exported apply() / applySchemaPlan() directly, so the
 * per-script dev-only guards (in their main()) are bypassed HERE, in one
 * auditable, PROD-asserted place.
 *
 * DRY-RUN BY DEFAULT. PROD-ONLY (refuses any non-prod URL). Run from repo root:
 *   bun apps/cms/scripts/promote-content-services-prod.ts                                   # plan
 *   op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.yesid.dev \
 *     bun apps/cms/scripts/promote-content-services-prod.ts --apply                          # PROD write
 */

import { buildSiteLabelsPlan, applySchemaPlan } from './setup-site-labels-and-chrome';
import { apply as applyStackLabels } from './content-services-stack-labels';
import { apply as applyCopy } from './content-services-copy';
import { apply as applyMetrics } from './content-services-metrics';
import { createLogger } from './lib/logger';

const log = createLogger('promote-content-services-prod');
const PROD_URL = 'https://cms.yesid.dev';

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = process.env.PUBLIC_DIRECTUS_URL ?? PROD_URL;
	log.info(`target: ${url}${apply_ ? ' [APPLY — PROD WRITE]' : ' [dry-run]'}`);

	if (!apply_) {
		log.info('plan (in order):');
		log.info('  1. schema   create new site_labels columns (stack_heading, see_stack_label)');
		log.info('  2. labels   seed those 2 columns (en+fr)');
		log.info('  3. copy     descriptions/value-props + sections + relatedProjects + retire section');
		log.info('  4. metrics  impact metrics + benefit headline');
		log.info('dry-run complete. Pass --apply (with PUBLIC_DIRECTUS_URL=' + PROD_URL + ') to execute.');
		return;
	}

	// PROD-ONLY guard: this orchestrator is the deliberate production promotion.
	if (url !== PROD_URL) {
		throw new Error(`refusing --apply: this script targets PROD only (${PROD_URL}); got '${url}'.`);
	}
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN in env (run via op run --env-file=apps/cms/.env)');
	const ctx = { directusUrl: url, token };

	log.info('1/4 schema: creating new site_labels columns (idempotent)…');
	await applySchemaPlan(buildSiteLabelsPlan(), ctx);
	log.info('2/4 labels: seeding stack heading + see-stack (en+fr)…');
	await applyStackLabels(ctx);
	log.info('3/4 copy: descriptions/value-props + sections + relatedProjects (+ retire section)…');
	await applyCopy(ctx);
	log.info('4/4 metrics: impact metrics + benefit headline…');
	await applyMetrics(ctx);
	log.info('PROD content promotion complete.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[promote-content-services-prod] FAILED:', err);
		process.exit(1);
	});
}
