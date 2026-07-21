#!/usr/bin/env bun
/**
 * setup-about-languages.ts
 *
 * Normalizes the /about language panels into CMS rows:
 * - about_languages owns order, status, and the uploaded flag SVG.
 * - about_languages_translations owns the visible language label.
 * - the old block_about_content.languages JSON field is removed on apply.
 *
 * DEV-ONLY. Dry-run by default; pass --apply --seed to write schema and rows.
 */

import assetIdMap from '../fixtures/assets-id-map.json' with { type: 'json' };
import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, type SchemaStep, isAlreadyExists, rest } from './lib/schema-apply';

export type { SchemaStep, SchemaStepKind } from './lib/schema-apply';

export const LANGUAGE_SEEDS = [
	{
		id: 'quebec',
		sort: 1,
		assetLegacyPath: 'images/about/languages/quebec.svg',
		label: { en: 'French', fr: 'Français' },
	},
	{
		id: 'canada',
		sort: 2,
		assetLegacyPath: 'images/about/languages/canada.svg',
		label: { en: 'English', fr: 'Anglais' },
	},
	{
		id: 'colombia',
		sort: 3,
		assetLegacyPath: 'images/about/languages/colombia.svg',
		label: { en: 'Spanish', fr: 'Espagnol' },
	},
] as const;

type AssetIdMap = Record<string, string>;

function stringPkField() {
	return {
		field: 'id',
		type: 'string',
		meta: {
			hidden: false,
			interface: 'input',
			note: 'Stable language panel id, such as quebec or brazil.',
			sort: 1,
			width: 'half',
		},
		schema: { is_primary_key: true, is_unique: true },
	};
}

function autoincrementPkField() {
	return {
		field: 'id',
		type: 'integer',
		meta: { hidden: true },
		schema: { is_primary_key: true, has_auto_increment: true },
	};
}

export function buildAboutLanguagesPlan(): SchemaStep[] {
	return [
		{
			kind: 'collection',
			target: 'about_languages',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'about_languages',
				meta: {
					accountability: 'all',
					archive_app_filter: true,
					archive_field: 'status',
					archive_value: 'archived',
					collapse: 'open',
					display_template: '{{id}}',
					group: 'about_page',
					hidden: false,
					icon: 'translate',
					note: 'CMS-backed /about language panels. Each row owns the SVG flag asset and translated label.',
					singleton: false,
					sort: 4,
					sort_field: 'sort',
					versioning: true,
				},
				schema: {},
				fields: [
					stringPkField(),
					{
						field: 'status',
						type: 'string',
						meta: {
							interface: 'select-dropdown',
							options: {
								choices: [
									{ text: 'Published', value: 'published' },
									{ text: 'Draft', value: 'draft' },
									{ text: 'Archived', value: 'archived' },
								],
							},
							sort: 2,
							width: 'half',
						},
						schema: { default_value: 'published', is_nullable: false },
					},
					{
						field: 'sort',
						type: 'integer',
						meta: { interface: 'input', sort: 3, width: 'half' },
						schema: {},
					},
				],
			},
		},
		{
			kind: 'collection',
			target: 'about_languages_translations',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'about_languages_translations',
				meta: { hidden: true, icon: 'import_export' },
				schema: {},
				fields: [
					autoincrementPkField(),
					{ field: 'about_languages_id', type: 'string', meta: { hidden: true }, schema: {} },
					{ field: 'languages_code', type: 'string', meta: { hidden: true }, schema: {} },
					{
						field: 'label',
						type: 'string',
						meta: { interface: 'input', sort: 4, width: 'full' },
						schema: { is_nullable: false },
					},
				],
			},
		},
		{
			kind: 'field',
			target: 'about_languages.image',
			method: 'POST',
			path: '/fields/about_languages',
			payload: {
				field: 'image',
				type: 'uuid',
				meta: {
					display: 'image',
					interface: 'file-image',
					note: 'Extended SVG flag uploaded to the About assets folder.',
					options: { folder: 'about' },
					required: true,
					sort: 4,
					special: ['file'],
					width: 'full',
				},
				schema: { is_nullable: false, foreign_key_table: 'directus_files', foreign_key_column: 'id' },
			},
		},
		{
			kind: 'field',
			target: 'about_languages.translations',
			method: 'POST',
			path: '/fields/about_languages',
			payload: {
				field: 'translations',
				type: 'alias',
				meta: {
					interface: 'translations',
					options: { languageField: 'name' },
					sort: 5,
					special: ['translations'],
				},
				schema: null,
			},
		},
		{
			kind: 'relation',
			target: 'about_languages.image -> directus_files',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'about_languages',
				field: 'image',
				related_collection: 'directus_files',
				meta: { one_deselect_action: 'nullify' },
				schema: { on_delete: 'SET NULL' },
			},
		},
		{
			kind: 'relation',
			target: 'about_languages_translations.about_languages_id',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'about_languages_translations',
				field: 'about_languages_id',
				related_collection: 'about_languages',
				meta: {
					one_field: 'translations',
					junction_field: 'languages_code',
					one_deselect_action: 'nullify',
				},
				schema: { on_delete: 'CASCADE' },
			},
		},
		{
			kind: 'relation',
			target: 'about_languages_translations.languages_code',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'about_languages_translations',
				field: 'languages_code',
				related_collection: 'languages',
				meta: {
					junction_field: 'about_languages_id',
					one_deselect_action: 'nullify',
				},
				schema: { on_delete: 'CASCADE' },
			},
		},
		{
			kind: 'permission',
			target: 'about_languages:read(build-bot)',
			method: 'POST',
			path: '/permissions',
			policyNames: ['Build Bot \u2014 content read'],
			payload: { collection: 'about_languages', action: 'read', fields: ['*'], permissions: {}, validation: null },
		},
		{
			kind: 'permission',
			target: 'about_languages_translations:read(build-bot)',
			method: 'POST',
			path: '/permissions',
			policyNames: ['Build Bot \u2014 content read'],
			payload: { collection: 'about_languages_translations', action: 'read', fields: ['*'], permissions: {}, validation: null },
		},
		...(['about_languages', 'about_languages_translations'] as const).flatMap((collection): SchemaStep[] =>
			(['create', 'read', 'update', 'delete'] as const).map((action): SchemaStep => ({
				kind: 'permission',
				target: `${collection}:${action}(human-editor)`,
				method: 'POST',
				path: '/permissions',
				policyNames: ['Human Editor'],
				payload: { collection, action, fields: ['*'], permissions: {}, validation: null },
			})),
		),
	];
}

export function languageRowsFromSeeds(ids: AssetIdMap) {
	return LANGUAGE_SEEDS.map((seed) => {
		const image = ids[seed.assetLegacyPath];
		if (!image) throw new Error(`Missing Directus asset id for ${seed.assetLegacyPath}. Run migrate-assets first.`);
		return {
			id: seed.id,
			status: 'published',
			sort: seed.sort,
			image,
			translations: [
				{ languages_code: 'en', label: seed.label.en },
				{ languages_code: 'fr', label: seed.label.fr },
			],
		};
	});
}

export function parseFlags(argv: readonly string[]): { apply: boolean; seed: boolean } {
	return { apply: argv.includes('--apply'), seed: argv.includes('--seed') };
}

const log = createLogger('about-languages');

async function applyPermission(ctx: ApplyContext, step: SchemaStep): Promise<void> {
	const policies = await rest(ctx, 'GET', '/policies?fields=id,name&limit=-1');
	if (policies.status >= 400) {
		throw new Error(`GET /policies failed (${policies.status}): ${JSON.stringify(policies.json)}`);
	}
	const names = step.policyNames ?? [];
	const policy = (policies.json?.data ?? []).find((item: { name: string }) => names.includes(item.name));
	if (!policy) {
		log.info(`  skip permission - no policy named [${names.join(', ')}]`);
		return;
	}
	const payload = step.payload as { collection: string; action: string };
	const existing = await rest(
		ctx,
		'GET',
		`/permissions?limit=1&filter[policy][_eq]=${policy.id}` +
			`&filter[collection][_eq]=${payload.collection}&filter[action][_eq]=${payload.action}`,
	);
	if ((existing.json?.data ?? []).length > 0) {
		log.info(`  skip permission - ${policy.name} already has ${payload.action} on ${payload.collection}`);
		return;
	}
	const post = await rest(ctx, 'POST', '/permissions', { ...step.payload, policy: policy.id });
	if (post.status >= 400) {
		throw new Error(
			`POST /permissions ${payload.collection}:${payload.action} failed (${post.status}): ${JSON.stringify(post.json)}`,
		);
	}
	log.info(`  ok permission - ${policy.name} ${payload.action} ${payload.collection}`);
}

export async function applySchemaPlan(plan: readonly SchemaStep[], ctx: ApplyContext): Promise<void> {
	for (const step of plan) {
		if (step.kind === 'permission') {
			await applyPermission(ctx, step);
			continue;
		}
		const res = await rest(ctx, step.method, step.path, step.payload);
		if (res.status < 400) {
			log.info(`  ok ${step.kind} - ${step.target}`);
			continue;
		}
		if (isAlreadyExists(res.status, res.json)) {
			log.info(`  skip ${step.kind} - ${step.target} already exists`);
			continue;
		}
		throw new Error(`${step.method} ${step.path} (${step.target}) failed (${res.status}): ${JSON.stringify(res.json)}`);
	}
}

async function apiGet(ctx: ApplyContext, path: string): Promise<any> {
	const res = await rest(ctx, 'GET', path);
	if (res.status >= 400) throw new Error(`GET ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

async function apiPost(ctx: ApplyContext, path: string, body: unknown): Promise<any> {
	const res = await rest(ctx, 'POST', path, body);
	if (res.status >= 400) throw new Error(`POST ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

async function apiPatch(ctx: ApplyContext, path: string, body: unknown): Promise<any> {
	const res = await rest(ctx, 'PATCH', path, body);
	if (res.status >= 400) throw new Error(`PATCH ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

async function seed(ctx: ApplyContext): Promise<void> {
	const rows = languageRowsFromSeeds(assetIdMap as AssetIdMap);
	for (const row of rows) {
		const existing = await rest(ctx, 'GET', `/items/about_languages/${row.id}`);
		if (existing.status === 404 || existing.status === 403) {
			await apiPost(ctx, '/items/about_languages', {
				id: row.id,
				status: row.status,
				sort: row.sort,
				image: row.image,
			});
			log.info(`  create about_languages.${row.id}`);
		} else if (existing.status < 400) {
			await apiPatch(ctx, `/items/about_languages/${row.id}`, {
				status: row.status,
				sort: row.sort,
				image: row.image,
			});
			log.info(`  update about_languages.${row.id}`);
		} else {
			throw new Error(`GET /items/about_languages/${row.id} failed (${existing.status}): ${JSON.stringify(existing.json)}`);
		}

		for (const translation of row.translations) {
			const query =
				`/items/about_languages_translations?limit=1&filter[about_languages_id][_eq]=${row.id}` +
				`&filter[languages_code][_eq]=${translation.languages_code}`;
			const found = await apiGet(ctx, query);
			const existingTranslation = (found.data as Array<{ id: number }>)[0];
			if (existingTranslation) {
				await apiPatch(ctx, `/items/about_languages_translations/${existingTranslation.id}`, {
					label: translation.label,
				});
				log.info(`  update about_languages.${row.id} ${translation.languages_code}`);
			} else {
				await apiPost(ctx, '/items/about_languages_translations', {
					about_languages_id: row.id,
					languages_code: translation.languages_code,
					label: translation.label,
				});
				log.info(`  create about_languages.${row.id} ${translation.languages_code}`);
			}
		}
	}
}

async function dropLegacyJsonField(ctx: ApplyContext): Promise<void> {
	const res = await rest(ctx, 'DELETE', '/fields/block_about_content/languages');
	if (res.status === 204 || res.status === 200) {
		log.info('  dropped legacy block_about_content.languages JSON field');
		return;
	}
	if (res.status === 404) {
		log.info('  skip legacy block_about_content.languages - already absent');
		return;
	}
	throw new Error(`DELETE /fields/block_about_content/languages failed (${res.status}): ${JSON.stringify(res.json)}`);
}

async function main(): Promise<void> {
	const flags = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildAboutLanguagesPlan();
	log.info(`target: ${url}${flags.apply ? ' [apply]' : ' [dry-run]'}${flags.seed ? ' [seed]' : ''}`);
	log.info(`plan: ${plan.length} steps`);
	for (const step of plan) log.info(`  ${step.kind} ${step.method} ${step.path} -> ${step.target}`);
	if (!flags.apply) {
		log.info('dry-run complete. Pass --apply --seed to write schema and rows.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx = { directusUrl: url, token };
	await applySchemaPlan(plan, ctx);
	if (flags.seed) await seed(ctx);
	await dropLegacyJsonField(ctx);
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[about-languages] FAILED:', error);
		process.exit(1);
	});
}
