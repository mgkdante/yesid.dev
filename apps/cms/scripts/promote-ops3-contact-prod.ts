#!/usr/bin/env bun
/**
 * OPS3: production-only promotion for the reviewed contact-transport legal copy.
 *
 * Dry-run is the default and performs no network requests. Production writes
 * require all three gates: --apply, --confirm-ops3, and the exact PROD URL.
 */

import drafts from '../ops/legal/legal-pages-2026-07-09.json' with { type: 'json' };
import { apply as applySeedLegalPages } from './seed-legal-pages';
import { createLogger } from './lib/logger';
import type { ApplyContext } from './lib/schema-apply';

const log = createLogger('promote-ops3-contact-prod');

export const PROD_URL = 'https://cms.yesid.dev';

type Locale = 'en' | 'fr' | 'es';

export interface LegalPagePlanEntry {
	slug: string;
	locales: Locale[];
}

export function legalPagePlan(): LegalPagePlanEntry[] {
	return drafts.pages.map((page) => ({
		slug: page.slug,
		locales: (['en', 'fr', 'es'] as const).filter((locale) => page[locale]),
	}));
}

export function assertProductionTarget(url: string): void {
	if (url !== PROD_URL) {
		throw new Error(
			'refusing --apply: this script targets PROD only (' + PROD_URL + '); got ' + url,
		);
	}
}

export function isApplyRequested(argv: readonly string[]): boolean {
	return argv.includes('--apply') && argv.includes('--confirm-ops3');
}

async function main(): Promise<void> {
	const apply = isApplyRequested(process.argv);
	const url = process.env.PUBLIC_DIRECTUS_URL ?? PROD_URL;
	const plan = legalPagePlan();

	log.info(`target: ${url}${apply ? ' [APPLY: PROD WRITE]' : ' [dry-run]'}`);
	log.info(`plan: ${plan.length} legal page bodies, EN/FR/ES`);
	log.info('apply also creates missing /legal site_pages or footer links; existing rows are reused');
	for (const page of plan) log.info(`  /legal/${page.slug} (${page.locales.join('+')})`);

	if (!apply) {
		log.info(
			'dry-run complete. Pass --apply --confirm-ops3 with PUBLIC_DIRECTUS_URL=' +
				PROD_URL +
				' to execute.',
		);
		return;
	}

	assertProductionTarget(url);
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN in env');

	const ctx: ApplyContext = { directusUrl: url, token };
	await applySeedLegalPages(ctx);
	log.info('OPS3 legal promotion complete. Publish-to-rebuild remains a separate verified step.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[promote-ops3-contact-prod] FAILED:', error);
		process.exit(1);
	});
}
