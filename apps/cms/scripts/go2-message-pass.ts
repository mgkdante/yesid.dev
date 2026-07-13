#!/usr/bin/env bun
/**
 * GO-2 Track 3 — site-wide message pass (CMS words; ORCHESTRATOR-ONLY apply).
 *
 * Carries every non-services copy write of the consolidation campaign:
 *   - block_hero:        subheadline grammar fix -> operator voice
 *   - block_manifesto:   pills -> the 4 stations (en row; stale fr/es pills nulled)
 *   - block_about_intro: home about-teaser title + spine bio
 *   - site_meta:         description + default_description (en) +
 *                        owner_job_title (en/fr/es — stays trilingual so the
 *                        locked full=56 count in integrity.test.ts holds)
 *   - block_tech_stack_page_content: cta -> Q3 availability + station language
 *   - block_contact_content: meta description vocabulary fix
 *   - block_blog_page_content / block_projects_page_content: intro rewrites
 *
 * DRY-RUN BY DEFAULT. Pass --apply to write. Same env/auth/run shape as
 * consolidate-services.ts (see that header). Run consolidate-services FIRST —
 * the pills point at the post-consolidation station ids.
 */

import { readItems, updateItem } from '@directus/sdk';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const log = createLogger('go2-message-pass');

// --- Payloads (locked in the GO-2 Track 3 plan) -----------------------------

export const SELF_TITLE = 'Freelance Digital Solutions Developer';

export const MANIFESTO_PILLS: ReadonlyArray<{ label: string; serviceId: string }> = [
	{ label: 'databases', serviceId: 'database-engineering' },
	{ label: 'pipelines', serviceId: 'data-pipeline' },
	{ label: 'dashboards', serviceId: 'analytics-reporting' },
	{ label: 'websites', serviceId: 'web-development' },
];

export interface TranslationEdit {
	collection: string;
	translationsCollection: string;
	parentFk: string;
	fields: Record<string, unknown>;
}

export const EN_TRANSLATION_EDITS: readonly TranslationEdit[] = [
	{
		collection: 'block_hero',
		translationsCollection: 'block_hero_translations',
		parentFk: 'block_hero_id',
		// Grammar fix "Data that tell the truth." -> operator voice (spine clause).
		fields: { subheadline: 'I make data tell the truth.' },
	},
	{
		collection: 'block_manifesto',
		translationsCollection: 'block_manifesto_translations',
		parentFk: 'block_manifesto_id',
		fields: { pills: MANIFESTO_PILLS },
	},
	{
		collection: 'block_about_intro',
		translationsCollection: 'block_about_intro_translations',
		parentFk: 'block_about_intro_id',
		fields: {
			title: SELF_TITLE,
			bio: 'Montreal, QC — I bring data, make it tell stories, and build the systems it moves through.',
		},
	},
	{
		collection: 'block_tech_stack_page_content',
		translationsCollection: 'block_tech_stack_page_content_translations',
		parentFk: 'block_tech_stack_page_content_id',
		// COMPLETE cta object — JSON column replace; headings preserved verbatim.
		fields: {
			cta: {
				availability: 'Booking Q3 2026',
				headingLine1: 'Found your stack',
				headingLine2: "Let's build it",
				sub: 'A pipeline, a dashboard, a database, a store — the infrastructure is ready.',
			},
		},
	},
	{
		collection: 'block_contact_content',
		translationsCollection: 'block_contact_content_translations',
		parentFk: 'block_contact_content_id',
		// COMPLETE meta object — JSON column replace; title preserved verbatim.
		fields: {
			meta: {
				title: 'Contact — yesid.',
				description:
					'Get in touch for freelance digital infrastructure — databases, pipelines, dashboards, and websites. Montreal, ~24h response time.',
			},
		},
	},
	{
		collection: 'block_blog_page_content',
		translationsCollection: 'block_blog_page_content_translations',
		parentFk: 'block_blog_page_content_id',
		fields: { intro: 'Notes on digital infrastructure, databases, and building reliable systems.' },
	},
	{
		collection: 'block_projects_page_content',
		translationsCollection: 'block_projects_page_content_translations',
		parentFk: 'block_projects_page_content_id',
		fields: { intro: 'Projects that shipped — pipelines, dashboards, and the infrastructure under them.' },
	},
];

export const SITE_META_TRANSLATION_EDITS: Record<'en' | 'fr' | 'es', Record<string, string>> = {
	en: {
		description:
			'Freelance digital solutions developer in Montréal helping Québec SMEs connect websites, data, reporting, automation, and workflows through practical, reliable systems.',
		default_description:
			'yesid.dev helps Québec SMEs connect websites, data, reporting, and everyday workflows through web development, automation, analytics, databases, and SQL.',
		owner_job_title: SELF_TITLE,
	},
	// This older narrow migration only owns the FR/ES person-title field. The
	// guarded outcome-first reconciler owns the broader multilingual copy set.
	fr: { owner_job_title: 'Développeur de solutions numériques à la pige' },
	es: { owner_job_title: 'Desarrollador freelance de soluciones digitales' },
};

// --- Helpers ------------------------------------------------------------------

export function parseFlags(argv: readonly string[]): { apply: boolean } {
	return { apply: argv.includes('--apply') };
}

interface GenericRow { id: number | string; [key: string]: unknown }
type Client = ReturnType<typeof createClient<Record<string, GenericRow[]>>>;

async function patchEnTranslation(client: Client, edit: TranslationEdit): Promise<void> {
	const raw = (await client.request(
		readItems(edit.collection as never, { fields: ['id'], limit: 1 } as never),
	)) as unknown;
	// block_* parents are singletons since go2/t1 group A — the API returns an
	// object for them and an array for everything else; normalize both.
	const parents = (Array.isArray(raw) ? raw : raw ? [raw] : []) as GenericRow[];
	if (parents.length === 0) throw new Error(`[go2-message-pass] no ${edit.collection} row found`);
	const parentId = parents[0].id;

	const trRows = (await client.request(
		readItems(edit.translationsCollection as never, {
			filter: { [edit.parentFk]: { _eq: parentId }, languages_code: { _eq: 'en' } },
			fields: ['id'],
			limit: 1,
		} as never),
	)) as unknown as GenericRow[];
	if (trRows.length === 0) {
		throw new Error(`[go2-message-pass] no en translation row in ${edit.translationsCollection}`);
	}
	await client.request(
		updateItem(edit.translationsCollection as never, trRows[0].id as never, edit.fields as never),
	);
	log.info(`  ✓ ${edit.translationsCollection}(en) patched: ${Object.keys(edit.fields).join(', ')}`);

	// Manifesto only: null stale fr/es pills so the exporter's index-pairing
	// (page-blocks-home.ts pillsByLocale) can never mis-zip 4 en pills with 5
	// stale localized ones.
	if (edit.collection === 'block_manifesto') {
		const stale = (await client.request(
			readItems(edit.translationsCollection as never, {
				filter: {
					[edit.parentFk]: { _eq: parentId },
					languages_code: { _neq: 'en' },
					pills: { _nnull: true },
				},
				fields: ['id', 'languages_code'],
				limit: -1,
			} as never),
		)) as unknown as GenericRow[];
		for (const row of stale) {
			await client.request(
				updateItem(edit.translationsCollection as never, row.id as never, { pills: null } as never),
			);
			log.info(`  ✓ block_manifesto_translations(${String(row.languages_code)}) stale pills nulled`);
		}
	}
}

export async function applyMessagePass(opts: { directusUrl: string; token: string }): Promise<void> {
	const client = createClient<Record<string, GenericRow[]>>(opts.directusUrl, opts.token);

	for (const edit of EN_TRANSLATION_EDITS) {
		await patchEnTranslation(client, edit);
	}

	// site_meta translations — per-locale rows on the singleton.
	for (const [locale, fields] of Object.entries(SITE_META_TRANSLATION_EDITS)) {
		const rows = (await client.request(
			readItems('site_meta_translations' as never, {
				filter: { languages_code: { _eq: locale } },
				fields: ['id'],
				limit: 1,
			} as never),
		)) as unknown as GenericRow[];
		if (rows.length === 0) throw new Error(`[go2-message-pass] no ${locale} site_meta translation row`);
		await client.request(
			updateItem('site_meta_translations' as never, rows[0].id as never, fields as never),
		);
		log.info(`  ✓ site_meta_translations(${locale}) patched: ${Object.keys(fields).join(', ')}`);
	}

	log.info('message pass applied.');
}

async function main(): Promise<void> {
	const { apply } = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	assertDevCms(url);
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);

	if (!apply) {
		log.info('dry-run plan (no reads, no writes):');
		for (const edit of EN_TRANSLATION_EDITS) {
			log.info(`  ~ ${edit.translationsCollection}(en): ${Object.keys(edit.fields).join(', ')}`);
		}
		for (const [locale, fields] of Object.entries(SITE_META_TRANSLATION_EDITS)) {
			log.info(`  ~ site_meta_translations(${locale}): ${Object.keys(fields).join(', ')}`);
		}
		log.info('dry-run complete. Pass --apply to execute (ORCHESTRATOR ONLY).');
		return;
	}

	const token = await getAdminToken(url);
	try {
		await applyMessagePass({ directusUrl: url, token });
	} catch (err) {
		if (err instanceof DirectusError) throw err;
		throw new DirectusError(500, `message pass failed: ${parseErrors(err).join(' · ')}`);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[go2-message-pass] FAILED:', err);
		process.exit(1);
	});
}
