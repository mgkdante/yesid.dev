#!/usr/bin/env bun
/**
 * content-services slice — stack-collapsible chrome labels.
 *
 * Seeds two NEW site_labels columns (created by `setup:site-labels --apply`):
 *   - services_chrome_detail_stack_heading   ("Stack")
 *   - services_chrome_detail_see_stack_label ("See the full stack →")
 * onto the en + fr site_labels_translations rows. Values mirror the committed
 * fixtures (fixtures/content/site-labels{,.fr}.json) — the CMS is the runtime
 * source; the detail page reads
 * siteLabels.servicesChrome.detail.{stackHeading,seeStackLabel}.
 *
 * Why a targeted script (not `setup:site-labels --apply --seed`): the seed path
 * also overwrites the /projects intro row — out of scope for the services slice.
 * This patches ONLY the two new keys.
 *
 * DRY-RUN BY DEFAULT — pass --apply to write. Dev-only guard. Run from repo root:
 *   bun apps/cms/scripts/content-services-stack-labels.ts                        # plan
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-services-stack-labels.ts --apply   # dev
 */

import { readItems, updateItem } from '@directus/sdk';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const log = createLogger('content-services-stack-labels');

export const LABELS: Record<'en' | 'fr', Record<string, string>> = {
	en: {
		services_chrome_detail_stack_heading: 'Stack',
		services_chrome_detail_see_stack_label: 'See the full stack →',
	},
	fr: {
		services_chrome_detail_stack_heading: 'Stack',
		services_chrome_detail_see_stack_label: 'Voir la stack complète →',
	},
};

interface Schema {
	site_labels_translations: Array<{ id: number; languages_code: string }>;
}

type Client = ReturnType<typeof createClient<Schema>>;

async function rowId(client: Client, lang: string): Promise<number> {
	const rows = (await client.request(
		readItems('site_labels_translations', {
			filter: { languages_code: { _eq: lang } },
			fields: ['id'],
			limit: 1,
		}),
	)) as Array<{ id: number }>;
	if (rows.length === 0) throw new Error(`no ${lang} site_labels_translations row`);
	return rows[0].id;
}

export async function apply(opts: { directusUrl: string; token: string }): Promise<void> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);
	for (const [lang, patch] of Object.entries(LABELS)) {
		const id = await rowId(client, lang);
		await client.request(updateItem('site_labels_translations', id, patch as object));
		log.info(`  ✓ site_labels_translations (${lang}, #${id}): ${JSON.stringify(patch)}`);
	}
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	log.info(`target: ${url}${apply_ ? ' [apply]' : ' [dry-run]'}`);

	if (!apply_) {
		for (const [lang, patch] of Object.entries(LABELS)) {
			log.info(`  ~ site_labels_translations (${lang}): ${JSON.stringify(patch)}`);
		}
		log.info('dry-run complete. Pass --apply to execute.');
		return;
	}

	// Safety: this content load targets DEV only. Prod gets it via the publish
	// pipeline (operator-gated), never by pointing this script at prod.
	assertDevCms(url);
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN in env (run via op run --env-file=apps/cms/.env)');
	try {
		await apply({ directusUrl: url, token });
		log.info('done.');
	} catch (err) {
		if (err instanceof DirectusError) throw err;
		throw new DirectusError(500, `stack-labels seed failed: ${parseErrors(err).join(' · ')}`);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[content-services-stack-labels] FAILED:', err);
		process.exit(1);
	});
}
