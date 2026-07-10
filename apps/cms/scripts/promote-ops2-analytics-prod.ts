#!/usr/bin/env bun
/**
 * OPS2: scoped PROD promotion for consented Plausible analytics (operator-gated).
 *
 * Replays exactly the OPS2 CMS surface against PRODUCTION (cms.yesid.dev) so the
 * prod build (which regenerates the .ts from PROD CMS) ships the launch truth:
 *   1. schema   the six site_labels_translations.ui_analytics_consent_* columns
 *               (filtered out of the site-labels plan; idempotent)
 *   2. labels   the six EN/FR/ES analytics-choice values, PATCHed onto the
 *               existing translation rows (POST only when a locale row is missing)
 *   3. legal    the five reviewed legal drafts (en+fr+es) via seed-legal-pages
 *
 * Nothing else: no metrics, no About, no contact BEST FIT, no ES drops, no
 * unrelated schema. It never imports or calls promote-launch-phase1-prod.ts.
 *
 * DRY-RUN BY DEFAULT and fully offline in dry-run (no network request). Writes
 * only when BOTH --apply and --confirm-ops2 are present AND the target URL is
 * exactly https://cms.yesid.dev. Run from repo root:
 *   bun apps/cms/scripts/promote-ops2-analytics-prod.ts                          # plan
 *   op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.yesid.dev \
 *     bun apps/cms/scripts/promote-ops2-analytics-prod.ts --apply --confirm-ops2 # PROD write
 */

import {
	SITE_LABEL_SEEDS,
	SITE_LABEL_FR_SEEDS,
	SITE_LABEL_ES_SEEDS,
	buildSiteLabelsPlan,
	applySchemaPlan,
	type SchemaStep,
} from './setup-site-labels-and-chrome';
import { apply as applySeedLegalPages } from './seed-legal-pages';
import drafts from '../ops/legal/legal-pages-2026-07-09.json' with { type: 'json' };
import { createLogger } from './lib/logger';
import { type ApplyContext, rest } from './lib/schema-apply';

const log = createLogger('promote-ops2-analytics-prod');

export const PROD_URL = 'https://cms.yesid.dev';

const ANALYTICS_PREFIX = 'ui_analytics_consent_';

export function analyticsLabelFieldPlan(): SchemaStep[] {
	return buildSiteLabelsPlan().filter(
		(step) =>
			step.kind === 'field' &&
			step.target.startsWith('site_labels_translations.' + ANALYTICS_PREFIX),
	);
}

export function analyticsValues(values: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(values).filter(([key]) => key.startsWith(ANALYTICS_PREFIX)),
	);
}

export function assertProductionTarget(url: string): void {
	if (url !== PROD_URL) {
		throw new Error(
			'refusing --apply: this script targets PROD only (' + PROD_URL + '); got ' + url,
		);
	}
}

async function upsertAnalyticsLabels(
	ctx: ApplyContext,
	locale: 'en' | 'fr' | 'es',
	values: Record<string, string>,
): Promise<void> {
	const parent = await rest(ctx, 'GET', '/items/site_labels?fields=id');
	if (parent.status >= 400 || !parent.json?.data?.id) {
		throw new Error('site_labels singleton is missing on production');
	}
	const rows = await rest(
		ctx,
		'GET',
		'/items/site_labels_translations?filter[languages_code][_eq]=' +
			locale +
			'&fields=id&limit=1',
	);
	if (rows.status >= 400) {
		throw new Error('failed to read ' + locale + ' site labels');
	}
	const row = rows.json?.data?.[0] as { id: number } | undefined;
	const result = row
		? await rest(ctx, 'PATCH', '/items/site_labels_translations/' + row.id, values)
		: await rest(ctx, 'POST', '/items/site_labels_translations', {
				site_labels_id: parent.json.data.id,
				languages_code: locale,
				...values,
			});
	if (result.status >= 400) {
		throw new Error('failed to write ' + locale + ' analytics labels (' + result.status + ')');
	}
	log.info(`  ok site_labels_translations (${locale}) <- ${Object.keys(values).length} analytics values`);
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply') && process.argv.includes('--confirm-ops2');
	const url = process.env.PUBLIC_DIRECTUS_URL ?? PROD_URL;
	log.info(`target: ${url}${apply_ ? ' [APPLY: PROD WRITE]' : ' [dry-run]'}`);

	const fieldPlan = analyticsLabelFieldPlan();
	const seeds = {
		en: analyticsValues(SITE_LABEL_SEEDS),
		fr: analyticsValues(SITE_LABEL_FR_SEEDS),
		es: SITE_LABEL_ES_SEEDS,
	} as const;
	const pages = drafts.pages as Array<{ slug: string }>;

	if (!apply_) {
		log.info('plan (in order):');
		log.info(`  1. schema  ${fieldPlan.length} analytics-consent fields:`);
		for (const step of fieldPlan) log.info(`       field ${step.target}`);
		for (const locale of ['en', 'fr', 'es'] as const) {
			const entries = Object.entries(seeds[locale]);
			log.info(`  2. labels  ${entries.length} ${locale} values:`);
			for (const [key, value] of entries) log.info(`       ${key} = "${value}"`);
		}
		log.info(`  3. legal   ${pages.length} legal pages (en+fr+es, seed-legal-pages):`);
		for (const page of pages) log.info(`       /legal/${page.slug}`);
		log.info(
			'dry-run complete. Pass --apply --confirm-ops2 (with PUBLIC_DIRECTUS_URL=' +
				PROD_URL +
				') to execute.',
		);
		return;
	}

	assertProductionTarget(url);
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) {
		throw new Error('no DIRECTUS_ADMIN_TOKEN in env');
	}
	const ctx: ApplyContext = { directusUrl: url, token };

	log.info('1/3 schema: six analytics-consent fields (idempotent)…');
	await applySchemaPlan(analyticsLabelFieldPlan(), ctx);
	log.info('2/3 labels: EN/FR/ES analytics-choice values…');
	await upsertAnalyticsLabels(ctx, 'en', analyticsValues(SITE_LABEL_SEEDS));
	await upsertAnalyticsLabels(ctx, 'fr', analyticsValues(SITE_LABEL_FR_SEEDS));
	await upsertAnalyticsLabels(ctx, 'es', SITE_LABEL_ES_SEEDS);
	log.info('3/3 legal: five reviewed drafts via seed-legal-pages…');
	await applySeedLegalPages(ctx);
	log.info('OPS2 PROD promotion complete. Publish→rebuild picks it up (VERCEL_DEPLOY_HOOK_PROD).');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[promote-ops2-analytics-prod] FAILED:', err);
		process.exit(1);
	});
}
