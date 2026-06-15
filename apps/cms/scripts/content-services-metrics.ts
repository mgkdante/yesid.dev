#!/usr/bin/env bun
/**
 * content-services slice — metric + headline believability pass.
 *
 * Patches services_translations (en + fr) for two services:
 *   - data-pipeline: impact metric "99.9% / pipeline uptime" -> "0 / missed mornings"
 *     (an unmeasurable, everyone-claims-it number, replaced with a concrete one).
 *   - web-development: impact metric "100" -> "95+" (100 reads as marketing),
 *     and benefit headline -> "A storefront as fast as the systems behind it"
 *     (the old one sold Yesid, not the customer).
 *
 * DRY-RUN BY DEFAULT — pass --apply to write. Run from repo root:
 *   bun apps/cms/scripts/content-services-metrics.ts                       # plan
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-services-metrics.ts --apply   # dev
 */

import { readItems, updateItem } from '@directus/sdk';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const log = createLogger('content-services-metrics');

type Patch = Record<string, string>;

export const PATCHES: Record<string, { en: Patch; fr: Patch }> = {
	'data-pipeline': {
		en: { impact_metric_value: '0', impact_metric_label: 'missed mornings' },
		fr: { impact_metric_value: '0', impact_metric_label: 'matin manqué' },
	},
	'web-development': {
		en: {
			impact_metric_value: '95+',
			benefit_headline: 'A storefront as fast as the systems behind it',
		},
		fr: {
			impact_metric_value: '95+',
			benefit_headline: 'Une vitrine aussi rapide que les systèmes derrière',
		},
	},
};

interface Schema {
	services_translations: Array<{ id: number; services_id: string; languages_code: string }>;
}

type Client = ReturnType<typeof createClient<Schema>>;

async function translationRowId(client: Client, serviceId: string, lang: string): Promise<number> {
	const rows = (await client.request(
		readItems('services_translations', {
			filter: { services_id: { _eq: serviceId }, languages_code: { _eq: lang } },
			fields: ['id'],
			limit: 1,
		}),
	)) as Array<{ id: number }>;
	if (rows.length === 0) {
		throw new Error(`no ${lang} translation row for service '${serviceId}'`);
	}
	return rows[0].id;
}

export async function apply(opts: { directusUrl: string; token: string }): Promise<void> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);
	for (const [serviceId, byLang] of Object.entries(PATCHES)) {
		for (const [lang, patch] of Object.entries(byLang)) {
			const id = await translationRowId(client, serviceId, lang);
			await client.request(updateItem('services_translations', id, patch as object));
			log.info(`  ✓ ${serviceId} (${lang}, #${id}): ${JSON.stringify(patch)}`);
		}
	}
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	log.info(`target: ${url}${apply_ ? ' [apply]' : ' [dry-run]'}`);

	if (!apply_) {
		for (const [serviceId, byLang] of Object.entries(PATCHES)) {
			for (const [lang, patch] of Object.entries(byLang)) {
				log.info(`  ~ services_translations ${serviceId} (${lang}): ${JSON.stringify(patch)}`);
			}
		}
		log.info('dry-run complete. Pass --apply to execute.');
		return;
	}

	// Safety: this content load targets DEV only. Prod gets it via the publish
	// pipeline (operator-gated), never by pointing this script at prod.
	if (!url.includes('cms.dev.yesid.dev')) {
		throw new Error(
			`refusing --apply against non-dev URL '${url}'. Run via: op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-services-metrics.ts --apply`,
		);
	}
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN in env (run via op run --env-file=apps/cms/.env)');
	try {
		await apply({ directusUrl: url, token });
		log.info('done.');
	} catch (err) {
		if (err instanceof DirectusError) throw err;
		throw new DirectusError(500, `metrics patch failed: ${parseErrors(err).join(' · ')}`);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[content-services-metrics] FAILED:', err);
		process.exit(1);
	});
}
