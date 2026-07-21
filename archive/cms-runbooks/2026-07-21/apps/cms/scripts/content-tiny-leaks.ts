#!/usr/bin/env bun
/**
 * Adds small CMS-owned chrome fields for About, Contact, and Stack.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write schema and copy.
 */

import { createField, readFieldsByCollection, readItems, updateItem } from '@directus/sdk';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

type Locale = 'en' | 'fr';

type FieldSpec = {
	collection: string;
	field: string;
	type?: 'string' | 'text';
	width?: 'half' | 'full';
	sort: number;
	note: string;
};

const SPECS: readonly FieldSpec[] = [
	{
		collection: 'block_about_content_translations',
		field: 'label_testimonials_prev_aria',
		sort: 41,
		note: 'About quote carousel previous button aria label.',
	},
	{
		collection: 'block_about_content_translations',
		field: 'label_testimonials_next_aria',
		sort: 42,
		note: 'About quote carousel next button aria label.',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'form_field_name_label',
		sort: 18,
		note: 'Contact form name field label.',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'form_field_email_label',
		sort: 19,
		note: 'Contact form email field label.',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'form_field_message_label',
		sort: 20,
		note: 'Contact form message field label.',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'success_work_link_label',
		sort: 34,
		note: 'Contact success template services link label.',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'success_blog_link_label',
		sort: 35,
		note: 'Contact success template blog link label.',
	},
	{
		collection: 'block_tech_stack_page_content_translations',
		field: 'stack_kicker',
		sort: 24,
		note: 'Stack page explainer kicker.',
	},
	{
		collection: 'block_tech_stack_page_content_translations',
		field: 'engine_loading',
		sort: 25,
		note: 'Stack engine loading caption.',
	},
	{
		collection: 'site_labels_translations',
		field: 'a11y_project_image_open',
		sort: 137,
		note: 'Project image gallery open button aria label template.',
	},
	{
		collection: 'site_labels_translations',
		field: 'a11y_project_image_close',
		sort: 138,
		note: 'Project image gallery close and backdrop aria label.',
	},
	{
		collection: 'site_labels_translations',
		field: 'a11y_more_metrics',
		sort: 139,
		note: 'Proof card metric overflow aria label.',
	},
	{
		collection: 'site_labels_translations',
		field: 'a11y_architecture_diagram',
		sort: 140,
		note: 'CMS-rendered Mermaid architecture diagram aria label.',
	},
	{
		collection: 'site_labels_translations',
		field: 'a11y_technology_stack_template',
		sort: 141,
		note: 'Technology stack SVG aria label template with {stack}.',
	},
	{
		collection: 'site_labels_translations',
		field: 'ui_terminal_title',
		sort: 142,
		note: 'Shared terminal chrome title.',
	},
	{
		collection: 'site_labels_translations',
		field: 'blog_chrome_detail_code_title',
		sort: 143,
		note: 'CMS code block terminal chrome title.',
	},
];

const VALUES: Record<string, Record<Locale, Record<string, string>>> = {
	block_about_content_translations: {
		en: {
			label_testimonials_prev_aria: 'Previous quote',
			label_testimonials_next_aria: 'Next quote',
		},
		fr: {
			label_testimonials_prev_aria: 'Citation précédente',
			label_testimonials_next_aria: 'Citation suivante',
		},
	},
	block_contact_content_translations: {
		en: {
			form_field_name_label: 'name',
			form_field_email_label: 'email',
			form_field_message_label: 'message',
			success_work_link_label: 'work',
			success_blog_link_label: 'blog',
		},
		fr: {
			form_field_name_label: 'nom',
			form_field_email_label: 'courriel',
			form_field_message_label: 'message',
			success_work_link_label: 'services',
			success_blog_link_label: 'blogue',
		},
	},
	block_tech_stack_page_content_translations: {
		en: {
			stack_kicker: 'what\'s a "stack"?',
			engine_loading: '~ rolling out the drawing board...',
		},
		fr: {
			stack_kicker: 'c\'est quoi un stack?',
			engine_loading: '~ chargement du plan...',
		},
	},
	site_labels_translations: {
		en: {
			a11y_project_image_open: 'Open {caption}',
			a11y_project_image_close: 'Close image',
			a11y_more_metrics: 'More metrics',
			a11y_architecture_diagram: 'Architecture diagram',
			a11y_technology_stack_template: 'Technology stack: {stack}',
			ui_terminal_title: 'terminal',
			blog_chrome_detail_code_title: 'code',
		},
		fr: {
			a11y_project_image_open: 'Ouvrir {caption}',
			a11y_project_image_close: 'Fermer l\'image',
			a11y_more_metrics: 'Plus de métriques',
			a11y_architecture_diagram: 'Diagramme d\'architecture',
			a11y_technology_stack_template: 'Stack technique : {stack}',
			ui_terminal_title: 'terminal',
			blog_chrome_detail_code_title: 'code',
		},
	},
};

function uniqueCollections(): string[] {
	return [...new Set(SPECS.map((spec) => spec.collection))];
}

function specsFor(collection: string): readonly FieldSpec[] {
	return SPECS.filter((spec) => spec.collection === collection);
}

function fieldMeta(spec: FieldSpec): Record<string, unknown> {
	return {
		interface: spec.type === 'text' ? 'input-multiline' : 'input',
		width: spec.width ?? 'half',
		sort: spec.sort,
		note: spec.note,
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

	for (const collection of uniqueCollections()) {
		const fields = await client.request(readFieldsByCollection(collection));
		const existingFields = new Set(fields.map((field) => field.field));

		for (const spec of specsFor(collection)) {
			if (existingFields.has(spec.field)) {
				log.push(`[skip] ${collection}.${spec.field}`);
				continue;
			}
			log.push(`[add ] ${collection}.${spec.field}`);
			if (!dryRun) {
				await client.request(
					createField(collection, {
						field: spec.field,
						type: spec.type ?? 'string',
						meta: fieldMeta(spec),
						schema: { is_nullable: true },
					}),
				);
			}
		}
	}

	for (const collection of uniqueCollections()) {
		const values = VALUES[collection];
		for (const locale of ['en', 'fr'] as const) {
			const patch = values[locale];
			const rows = (await client.request(
				readItems(collection, {
					fields: ['id', 'languages_code'],
					filter: { languages_code: { _eq: locale } },
					limit: 1,
				}),
			)) as Array<{ id: number; languages_code: Locale }>;

			if (rows.length === 0) {
				log.push(`[warn] missing ${collection} row for ${locale}`);
				continue;
			}

			log.push(`[seed] ${collection} ${locale} #${rows[0].id}: ${Object.keys(patch).join(', ')}`);
			if (!dryRun) await client.request(updateItem(collection, rows[0].id, patch));
		}
	}

	await widenReadPermissions({ ...opts, dryRun }, log);

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
): Promise<void> {
	for (const collection of uniqueCollections()) {
		const specs = specsFor(collection);
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
			for (const spec of specs) {
				if (!fields.includes(spec.field)) fields.push(spec.field);
			}
			if (fields.length === row.fields.length) {
				log.push(`[skip] permission ${row.id} already reads ${collection} leak fields`);
				continue;
			}
			log.push(`[perm] permission ${row.id}: add ${fields.length - row.fields.length} ${collection} fields`);
			if (!opts.dryRun) await directusRequest(opts, 'PATCH', `/permissions/${row.id}`, { fields });
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
		console.error('[content-tiny-leaks] FAILED:', error);
		process.exit(1);
	});
}
