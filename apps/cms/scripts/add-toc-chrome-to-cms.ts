/**
 * add-toc-chrome-to-cms.ts - chrome to CMS consolidation, step 1 (TOC chrome).
 *
 * navChrome.shared already carries tocHeading + tocMobileButton in the CMS; this
 * adds the two still-missing shared TOC labels so the detail-page TOC (TocNav /
 * TocPill) can source ALL its chrome from the CMS instead of the code-owned
 * `tocChrome` companion:
 *   - nav_chrome_shared_toc_close_aria      ("Close table of contents")
 *   - nav_chrome_shared_toc_counter_prefix  ("SEC")
 *
 * Creates the two columns on site_labels_translations (idempotent) + seeds en/fr.
 * The fetcher (lib/fetchers/site-labels.ts) + zod schema get the matching keys in
 * the same change; the companion `tocChrome` is then retired.
 *
 * DEV-ONLY. Dry-run by default; --apply to execute.
 */

import { createField, readFieldsByCollection, readItems, updateItem } from '@directus/sdk';
import { assertDevCms, createClient, defaultDirectusUrl, requireEnv } from './lib/sdk';

const COLUMNS = ['nav_chrome_shared_toc_close_aria', 'nav_chrome_shared_toc_counter_prefix'] as const;

const VALUES: Record<'en' | 'fr', Record<string, string>> = {
	en: { nav_chrome_shared_toc_close_aria: 'Close table of contents', nav_chrome_shared_toc_counter_prefix: 'SEC' },
	fr: { nav_chrome_shared_toc_close_aria: 'Fermer la table des matières', nav_chrome_shared_toc_counter_prefix: 'SEC' },
};

type Client = ReturnType<typeof createClient>;

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	const fields = await client.request(readFieldsByCollection('site_labels_translations'));
	const have = new Set(fields.map((f) => f.field));
	for (const col of COLUMNS) {
		if (have.has(col)) {
			log.push(`[skip] column ${col} exists`);
			continue;
		}
		log.push(`[add ] column site_labels_translations.${col} (string)`);
		if (!dryRun)
			await client.request(
				createField('site_labels_translations', {
					field: col,
					type: 'string',
					meta: { interface: 'input', width: 'half', group: 'grp_nav' },
					schema: {},
				}),
			);
	}

	for (const [lang, patch] of Object.entries(VALUES)) {
		const rows = (await client.request(
			readItems('site_labels_translations', { filter: { languages_code: { _eq: lang } }, fields: ['id'], limit: 1 }),
		)) as Array<{ id: number }>;
		if (rows.length === 0) {
			log.push(`[warn] no ${lang} site_labels_translations row`);
			continue;
		}
		log.push(`[seed] ${lang} #${rows[0].id}: ${JSON.stringify(patch)}`);
		if (!dryRun) await client.request(updateItem('site_labels_translations', rows[0].id, patch as object));
	}

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = requireEnv('DIRECTUS_ADMIN_TOKEN', 'dev CMS admin token');
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

if (import.meta.main) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}
