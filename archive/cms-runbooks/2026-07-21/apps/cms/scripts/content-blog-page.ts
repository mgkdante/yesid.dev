#!/usr/bin/env bun
/**
 * Adds Blog listing lane copy and the Blog entry rail to block_blog_page_content.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write schema and copy.
 */

import { createField, readFieldsByCollection, readItems, updateItem, updateSingleton } from '@directus/sdk';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

const PARENT_COLLECTION = 'block_blog_page_content';
const TRANSLATIONS_COLLECTION = 'block_blog_page_content_translations';

const TRANSLATION_COLUMNS = [
	'personal_heading',
	'personal_intro',
	'to_personal_label',
	'to_personal_subtitle',
	'to_professional_label',
	'to_professional_subtitle',
	'entry_rail_work_title',
	'entry_rail_work_prompt',
	'entry_rail_services_label',
	'entry_rail_contact_label',
	'entry_rail_routes_title',
	'entry_rail_route_case_studies_label',
	'entry_rail_route_services_label',
	'entry_rail_route_stack_label',
	'entry_rail_route_about_label',
	'entry_rail_route_contact_label',
] as const;

const PARENT_COLUMNS = [
	'entry_rail_services_href',
	'entry_rail_contact_href',
	'entry_rail_route_case_studies_href',
	'entry_rail_route_services_href',
	'entry_rail_route_stack_href',
	'entry_rail_route_about_href',
	'entry_rail_route_contact_href',
] as const;

type TranslationColumn = (typeof TRANSLATION_COLUMNS)[number];
type ParentColumn = (typeof PARENT_COLUMNS)[number];
type Locale = 'en' | 'fr';

const PARENT_VALUES: Record<ParentColumn, string> = {
	entry_rail_services_href: '/services',
	entry_rail_contact_href: '/contact',
	entry_rail_route_case_studies_href: '/projects',
	entry_rail_route_services_href: '/services',
	entry_rail_route_stack_href: '/tech-stack',
	entry_rail_route_about_href: '/about',
	entry_rail_route_contact_href: '/contact',
};

const VALUES: Record<Locale, Record<TranslationColumn, string>> = {
	en: {
		personal_heading: 'Personal Corner',
		personal_intro: 'Trains, space, tools, and the off-work notes that still shape how I build.',
		to_personal_label: 'Personal Corner',
		to_personal_subtitle: 'Off the clock',
		to_professional_label: 'Back to Blog',
		to_professional_subtitle: 'Brand notes',
		entry_rail_work_title: 'Work With Me',
		entry_rail_work_prompt: 'Need a system that stays editable?',
		entry_rail_services_label: 'View Services',
		entry_rail_contact_label: 'Start a Project',
		entry_rail_routes_title: 'Pick A Route',
		entry_rail_route_case_studies_label: 'Case studies',
		entry_rail_route_services_label: 'Services',
		entry_rail_route_stack_label: 'Stack',
		entry_rail_route_about_label: 'About the author',
		entry_rail_route_contact_label: 'Contact',
	},
	fr: {
		personal_heading: 'Coin perso',
		personal_intro: 'Trains, espace, outils, et les notes hors mandat qui influencent encore ma façon de bâtir.',
		to_personal_label: 'Coin perso',
		to_personal_subtitle: 'Hors mandat',
		to_professional_label: 'Retour au blogue',
		to_professional_subtitle: 'Notes de marque',
		entry_rail_work_title: 'Travailler ensemble',
		entry_rail_work_prompt: 'Besoin d’un système qui reste éditable?',
		entry_rail_services_label: 'Voir les services',
		entry_rail_contact_label: 'Démarrer un projet',
		entry_rail_routes_title: 'Choisir une route',
		entry_rail_route_case_studies_label: 'Études de cas',
		entry_rail_route_services_label: 'Services',
		entry_rail_route_stack_label: 'Stack',
		entry_rail_route_about_label: 'À propos de l\'auteur',
		entry_rail_route_contact_label: 'Contact',
	},
};

function translationFieldMeta(field: TranslationColumn): Record<string, unknown> {
	const sort = TRANSLATION_COLUMNS.indexOf(field) + 10;
	return {
		interface: 'input',
		width: field.endsWith('_intro') || field.endsWith('_prompt') ? 'full' : 'half',
		sort,
		note: 'Blog listing lane and entry rail copy. Used by /blog and /blog/personal.',
	};
}

function parentFieldMeta(field: ParentColumn): Record<string, unknown> {
	const sort = PARENT_COLUMNS.indexOf(field) + 20;
	return {
		interface: 'input',
		width: 'half',
		sort,
		note: 'Blog entry rail href. Stored once because routes are not locale-specific.',
	};
}

export async function apply(opts: {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
}): Promise<readonly string[]> {
	const dryRun = opts.dryRun ?? true;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	const parentFields = await client.request(readFieldsByCollection(PARENT_COLLECTION));
	const existingParentFields = new Set(parentFields.map((field) => field.field));

	for (const column of PARENT_COLUMNS) {
		if (existingParentFields.has(column)) {
			log.push(`[skip] ${PARENT_COLLECTION}.${column}`);
			continue;
		}
		log.push(`[add ] ${PARENT_COLLECTION}.${column}`);
		if (!dryRun) {
			await client.request(
				createField(PARENT_COLLECTION, {
					field: column,
					type: 'string',
					meta: parentFieldMeta(column),
					schema: { is_nullable: true },
				}),
			);
		}
	}

	log.push(`[seed] ${PARENT_COLLECTION}: ${Object.keys(PARENT_VALUES).join(', ')}`);
	if (!dryRun) {
		await client.request(
			updateSingleton(
				PARENT_COLLECTION,
				PARENT_VALUES as unknown as Parameters<typeof updateSingleton>[1],
			),
		);
	}

	const fields = await client.request(readFieldsByCollection(TRANSLATIONS_COLLECTION));
	const existingFields = new Set(fields.map((field) => field.field));

	for (const column of TRANSLATION_COLUMNS) {
		if (existingFields.has(column)) {
			log.push(`[skip] ${TRANSLATIONS_COLLECTION}.${column}`);
			continue;
		}
		log.push(`[add ] ${TRANSLATIONS_COLLECTION}.${column}`);
		if (!dryRun) {
			await client.request(
				createField(TRANSLATIONS_COLLECTION, {
					field: column,
					type: 'string',
					meta: translationFieldMeta(column),
					schema: { is_nullable: true },
				}),
			);
		}
	}

	for (const [locale, patch] of Object.entries(VALUES) as Array<[Locale, Record<TranslationColumn, string>]>) {
		const rows = (await client.request(
			readItems(TRANSLATIONS_COLLECTION, {
				fields: ['id', 'languages_code'],
				filter: { languages_code: { _eq: locale } },
				limit: 1,
			}),
		)) as Array<{ id: number; languages_code: Locale }>;

		if (rows.length === 0) {
			log.push(`[warn] missing ${TRANSLATIONS_COLLECTION} row for ${locale}`);
			continue;
		}

		log.push(`[seed] ${locale} #${rows[0].id}: ${Object.keys(patch).join(', ')}`);
		if (!dryRun) await client.request(updateItem(TRANSLATIONS_COLLECTION, rows[0].id, patch));
	}

	await widenReadPermissions({ ...opts, dryRun }, log, PARENT_COLLECTION, PARENT_COLUMNS);
	await widenReadPermissions({ ...opts, dryRun }, log, TRANSLATIONS_COLLECTION, TRANSLATION_COLUMNS);

	return log;
}

async function directusRequest(
	opts: { directusUrl: string; token: string },
	method: string,
	path: string,
	body?: unknown,
): Promise<any> {
	const response = await fetch(`${opts.directusUrl}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${opts.token}`,
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

async function widenReadPermissions(
	opts: { directusUrl: string; token: string; dryRun?: boolean },
	log: string[],
	collection: string,
	columns: readonly string[],
): Promise<void> {
	const result = await directusRequest(
		opts,
		'GET',
		`/permissions?fields=id,fields&filter[collection][_eq]=${collection}&filter[action][_eq]=read&limit=-1`,
	);
	const rows = (result.data ?? []) as Array<{ id: number; fields?: string[] | null }>;
	for (const row of rows) {
		if (!Array.isArray(row.fields) || row.fields.includes('*')) {
			log.push(`[skip] permission ${row.id} reads all ${collection} fields`);
			continue;
		}
		const fields = [...row.fields];
		for (const column of columns) {
			if (!fields.includes(column)) fields.push(column);
		}
		if (fields.length === row.fields.length) {
			log.push(`[skip] permission ${row.id} already reads Blog page fields for ${collection}`);
			continue;
		}
		log.push(`[perm] permission ${row.id}: add ${fields.length - row.fields.length} Blog page fields for ${collection}`);
		if (!opts.dryRun) {
			await directusRequest(opts, 'PATCH', `/permissions/${row.id}`, { fields });
		}
	}
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = await getAdminToken(directusUrl);
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN. Re-run with --apply.' : 'APPLIED.'}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[content-blog-page] FAILED:', error);
		process.exit(1);
	});
}
