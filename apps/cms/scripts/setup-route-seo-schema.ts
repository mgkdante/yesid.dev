#!/usr/bin/env bun
/**
 * setup-route-seo-schema.ts
 *
 * Creates the CMS route_seo collections used by export-fallbacks for static
 * route editorial SEO. Dry-run by default. Pass --apply to write dev CMS schema.
 */

import { defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, type SchemaStep, isAlreadyExists, rest } from './lib/schema-apply';

export type { SchemaStep, SchemaStepKind } from './lib/schema-apply';

function autoincrementPkField() {
	return {
		field: 'id',
		type: 'integer',
		meta: { hidden: true },
		schema: { is_primary_key: true, has_auto_increment: true },
	};
}

function statusField(sort = 2) {
	return {
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
			sort,
			width: 'half',
		},
		schema: { default_value: 'published', is_nullable: false },
	};
}

export function buildRouteSeoPlan(): SchemaStep[] {
	return [
		{
			kind: 'collection',
			target: 'route_seo',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'route_seo',
				meta: {
					accountability: 'all',
					archive_app_filter: true,
					archive_field: 'status',
					archive_value: 'archived',
					collapse: 'open',
					display_template: '{{path}}',
					group: 'site_config',
					hidden: false,
					icon: 'manage_search',
					note: 'CMS-backed static route SEO overrides. Code owns technical SEO defaults.',
					singleton: false,
					sort: 4,
					sort_field: 'sort',
					versioning: true,
				},
				schema: {},
				fields: [autoincrementPkField()],
			},
		},
		{
			kind: 'collection',
			target: 'route_seo_translations',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'route_seo_translations',
				meta: { hidden: true, icon: 'import_export' },
				schema: {},
				fields: [autoincrementPkField()],
			},
		},
		{
			kind: 'field',
			target: 'route_seo.status',
			method: 'POST',
			path: '/fields/route_seo',
			payload: statusField(),
		},
		{
			kind: 'field',
			target: 'route_seo.sort',
			method: 'POST',
			path: '/fields/route_seo',
			payload: {
				field: 'sort',
				type: 'integer',
				meta: { interface: 'input', sort: 3, width: 'half' },
				schema: {},
			},
		},
		{
			kind: 'field',
			target: 'route_seo.path',
			method: 'POST',
			path: '/fields/route_seo',
			payload: {
				field: 'path',
				type: 'string',
				meta: {
					interface: 'input',
					note: 'Canonical static path, such as /about or /blog/personal.',
					required: true,
					sort: 4,
					width: 'full',
				},
				schema: { is_nullable: false, is_unique: true },
			},
		},
		{
			kind: 'field',
			target: 'route_seo.og_image',
			method: 'POST',
			path: '/fields/route_seo',
			payload: {
				field: 'og_image',
				type: 'uuid',
				meta: {
					display: 'image',
					interface: 'file-image',
					note: 'Optional per-route OG image. Falls back to site_meta.default_og_image.',
					options: { folder: 'og' },
					sort: 5,
					special: ['file'],
					width: 'full',
				},
				schema: { is_nullable: true, foreign_key_table: 'directus_files', foreign_key_column: 'id' },
			},
		},
		{
			kind: 'field',
			target: 'route_seo.translations',
			method: 'POST',
			path: '/fields/route_seo',
			payload: {
				field: 'translations',
				type: 'alias',
				meta: {
					interface: 'translations',
					options: { languageField: 'name' },
					sort: 6,
					special: ['translations'],
				},
				schema: null,
			},
		},
		{
			kind: 'field',
			target: 'route_seo_translations.route_seo_id',
			method: 'POST',
			path: '/fields/route_seo_translations',
			payload: { field: 'route_seo_id', type: 'integer', meta: { hidden: true }, schema: {} },
		},
		{
			kind: 'field',
			target: 'route_seo_translations.languages_code',
			method: 'POST',
			path: '/fields/route_seo_translations',
			payload: { field: 'languages_code', type: 'string', meta: { hidden: true }, schema: {} },
		},
		{
			kind: 'field',
			target: 'route_seo_translations.title',
			method: 'POST',
			path: '/fields/route_seo_translations',
			payload: {
				field: 'title',
				type: 'string',
				meta: {
					interface: 'input',
					note: 'Static route SEO title body. Home can be full verbatim title.',
					sort: 4,
					width: 'full',
				},
				schema: { is_nullable: true },
			},
		},
		{
			kind: 'field',
			target: 'route_seo_translations.description',
			method: 'POST',
			path: '/fields/route_seo_translations',
			payload: {
				field: 'description',
				type: 'text',
				meta: {
					interface: 'input-multiline',
					note: 'Static route SEO description, 50 to 200 characters.',
					sort: 5,
					width: 'full',
				},
				schema: { is_nullable: true },
			},
		},
		{
			kind: 'relation',
			target: 'route_seo.og_image -> directus_files',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'route_seo',
				field: 'og_image',
				related_collection: 'directus_files',
				meta: { one_deselect_action: 'nullify' },
				schema: { on_delete: 'SET NULL' },
			},
		},
		{
			kind: 'relation',
			target: 'route_seo_translations.route_seo_id',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'route_seo_translations',
				field: 'route_seo_id',
				related_collection: 'route_seo',
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
			target: 'route_seo_translations.languages_code',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'route_seo_translations',
				field: 'languages_code',
				related_collection: 'languages',
				meta: {
					junction_field: 'route_seo_id',
					one_deselect_action: 'nullify',
				},
				schema: { on_delete: 'SET NULL' },
			},
		},
		{
			kind: 'permission',
			target: 'route_seo:read(build-bot)',
			method: 'POST',
			path: '/permissions',
			policyNames: ['Build Bot \u2014 content read'],
			payload: { collection: 'route_seo', action: 'read', fields: ['*'], permissions: {}, validation: null },
		},
		{
			kind: 'permission',
			target: 'route_seo_translations:read(build-bot)',
			method: 'POST',
			path: '/permissions',
			policyNames: ['Build Bot \u2014 content read'],
			payload: { collection: 'route_seo_translations', action: 'read', fields: ['*'], permissions: {}, validation: null },
		},
		...(['route_seo', 'route_seo_translations'] as const).flatMap((collection): SchemaStep[] =>
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

export function parseFlags(argv: readonly string[]): { apply: boolean } {
	return { apply: argv.includes('--apply') };
}

export function describeStep(step: SchemaStep): string {
	return `  ${step.kind.padEnd(12)} ${step.method.padEnd(5)} ${step.path.padEnd(38)} => ${step.target}`;
}

const log = createLogger('setup-route-seo-schema');

async function applyPermission(ctx: ApplyContext, step: SchemaStep): Promise<void> {
	const policies = await rest(ctx, 'GET', '/policies?fields=id,name&limit=-1');
	if (policies.status >= 400) {
		throw new Error(`GET /policies failed (${policies.status}): ${JSON.stringify(policies.json)}`);
	}
	const names = step.policyNames ?? [];
	const policy = (policies.json?.data ?? []).find((p: { name: string }) => names.includes(p.name));
	if (!policy) {
		log.info(`  skip permission, missing policy [${names.join(', ')}]`);
		return;
	}
	const payload = { ...(step.payload ?? {}), policy: policy.id };
	const result = await rest(ctx, step.method, step.path, payload);
	if (result.status >= 400 && !isAlreadyExists(result.status, result.json)) {
		throw new Error(`${step.method} ${step.path} failed (${result.status}): ${JSON.stringify(result.json)}`);
	}
	log.info(`${describeStep(step)} ${result.status >= 400 ? '(exists)' : ''}`);
}

async function applyPlan(ctx: ApplyContext, plan: readonly SchemaStep[]): Promise<void> {
	for (const step of plan) {
		if (step.kind === 'permission') {
			await applyPermission(ctx, step);
			continue;
		}
		const result = await rest(ctx, step.method, step.path, step.payload ?? undefined);
		if (result.status >= 400 && !isAlreadyExists(result.status, result.json)) {
			throw new Error(`${step.method} ${step.path} failed (${result.status}): ${JSON.stringify(result.json)}`);
		}
		log.info(`${describeStep(step)} ${result.status >= 400 ? '(exists)' : ''}`);
	}
}

async function main(): Promise<void> {
	const { apply } = parseFlags(process.argv.slice(2));
	const plan = buildRouteSeoPlan();
	const directusUrl = defaultDirectusUrl();

	log.info(`target: ${directusUrl}${apply ? ' [apply]' : ' [dry-run]'}`);
	for (const step of plan) log.info(describeStep(step));

	if (!apply) {
		log.info('dry-run complete. Pass --apply to write schema.');
		return;
	}

	const token = await getAdminToken(directusUrl);
	await applyPlan({ directusUrl, token }, plan);
	log.info('done.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[setup-route-seo-schema] FAILED:', error);
		process.exit(1);
	});
}
