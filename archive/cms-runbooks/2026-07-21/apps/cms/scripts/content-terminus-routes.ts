#!/usr/bin/env bun
/**
 * Align dev CMS copy for the Terminus route board and Blog labels.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to patch rows.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';

type Locale = 'en' | 'fr';

const BLOG_PAGE_PATCH: Record<Locale, Record<string, string>> = {
	en: {
		heading: 'Blog',
		back_to_dispatches: '← back to Blog',
		to_professional_label: 'Back to Blog',
		to_professional_subtitle: 'Brand notes',
	},
	fr: {
		heading: 'Blogue',
		back_to_dispatches: '← retour au blogue',
		to_professional_label: 'Retour au blogue',
		to_professional_subtitle: 'Notes de marque',
	},
};

const CLOSER_PATCH: Record<Locale, Record<string, string>> = {
	en: {
		rows_stack_label: 'STACK',
		rows_stack_description: 'Tools and architecture',
		rows_stack_action: 'cd',
		rows_contact_label: 'CONTACT',
		rows_contact_description: 'Start a project together',
		rows_contact_action: 'GO',
		rows_about_label: 'YESID',
		rows_about_description: 'About the builder',
		rows_about_action: 'cd',
		rows_read_label: 'BLOG',
		rows_read_description: 'Writing and field notes',
		rows_read_action: 'cd',
		rows_connect_label: 'GITHUB REPO',
		rows_connect_description: 'GitHub · open-source work',
		rows_connect_action: 'GO',
	},
	fr: {
		rows_stack_label: 'STACK',
		rows_stack_description: 'Outils et architecture',
		rows_stack_action: 'cd',
		rows_contact_label: 'CONTACT',
		rows_contact_description: 'Démarrer un projet ensemble',
		rows_contact_action: 'GO',
		rows_about_label: 'YESID',
		rows_about_description: 'À propos du bâtisseur',
		rows_about_action: 'cd',
		rows_read_label: 'BLOGUE',
		rows_read_description: 'Notes et articles',
		rows_read_action: 'cd',
		rows_connect_label: 'DÉPÔT GITHUB',
		rows_connect_description: 'GitHub · travail open source',
		rows_connect_action: 'GO',
	},
};

async function request(
	baseUrl: string,
	token: string,
	method: string,
	path: string,
	body?: unknown,
): Promise<any> {
	const response = await fetch(`${baseUrl}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await response.text();
	const json = text ? JSON.parse(text) : null;
	if (response.status >= 400) {
		throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(json)}`);
	}
	return json;
}

async function patchLocaleRow(opts: {
	baseUrl: string;
	token: string;
	collection: string;
	locale: Locale;
	patch: Record<string, string>;
	dryRun: boolean;
}): Promise<string> {
	const rows = await request(
		opts.baseUrl,
		opts.token,
		'GET',
		`/items/${opts.collection}?fields=id,languages_code&filter[languages_code][_eq]=${opts.locale}&limit=1`,
	);
	const row = rows.data?.[0] as { id: number } | undefined;
	if (!row) return `[warn] missing ${opts.collection} row for ${opts.locale}`;

	if (!opts.dryRun) {
		await request(opts.baseUrl, opts.token, 'PATCH', `/items/${opts.collection}/${row.id}`, opts.patch);
	}
	return `${opts.dryRun ? '[dry]' : '[set]'} ${opts.collection}#${row.id} ${opts.locale}: ${Object.keys(opts.patch).join(', ')}`;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const baseUrl = defaultDirectusUrl();
	assertDevCms(baseUrl);
	const token = await getAdminToken(baseUrl);
	const log: string[] = [];

	for (const locale of ['en', 'fr'] as const) {
		log.push(await patchLocaleRow({
			baseUrl,
			token,
			collection: 'block_blog_page_content_translations',
			locale,
			patch: BLOG_PAGE_PATCH[locale],
			dryRun,
		}));
		log.push(await patchLocaleRow({
			baseUrl,
			token,
			collection: 'block_closer_translations',
			locale,
			patch: CLOSER_PATCH[locale],
			dryRun,
		}));
	}

	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN. Re-run with --apply.' : 'APPLIED.'}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[content-terminus-routes] FAILED:', error);
		process.exit(1);
	});
}
