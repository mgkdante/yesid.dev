#!/usr/bin/env bun
/**
 * setup-legal-pages-schema.ts
 *
 * Schema half of the legal framework (launch Phase 1, OPS1): a new
 * `legal_pages` collection + `legal_pages_translations` junction, modeled on
 * contact_channels(+_translations): slug-as-id parent with status/sort, and
 * per-locale title + Block Editor body on the translations rows.
 *
 * Rows/values ship separately via seed-legal-pages.ts (reads ops/legal/).
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write schema.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, type SchemaStep, isAlreadyExists, rest } from './lib/schema-apply';

const log = createLogger('legal-pages-schema');

export function buildPlan(): SchemaStep[] {
	return [
		{
			kind: 'collection',
			target: 'legal_pages',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'legal_pages',
				meta: {
					collection: 'legal_pages',
					icon: 'gavel',
					note: 'Legal framework pages (/legal/[slug]): privacy, cookies, terms, notice, accessibility (OPS1). Advisor reviews before prod publish.',
					display_template: '{{id}}',
					hidden: false,
					singleton: false,
					archive_field: 'status',
					archive_value: 'archived',
					unarchive_value: 'draft',
					archive_app_filter: true,
					sort_field: 'sort',
					accountability: 'all',
					versioning: true,
				},
				schema: { name: 'legal_pages' },
				fields: [
					{
						field: 'id',
						type: 'string',
						meta: {
							interface: 'input',
							note: 'Stable page slug: privacy, cookies, terms, notice, accessibility.',
							readonly: false,
							hidden: false,
							width: 'half',
						},
						schema: { is_primary_key: true, length: 255, has_auto_increment: false },
					},
				],
			},
		},
		{
			kind: 'field',
			target: 'legal_pages.status',
			method: 'POST',
			path: '/fields/legal_pages',
			payload: {
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
					width: 'half',
				},
				schema: { default_value: 'published', is_nullable: false },
			},
		},
		{
			kind: 'field',
			target: 'legal_pages.sort',
			method: 'POST',
			path: '/fields/legal_pages',
			payload: {
				field: 'sort',
				type: 'integer',
				meta: { interface: 'input', hidden: true },
				schema: { is_nullable: true },
			},
		},
		{
			kind: 'field',
			target: 'legal_pages.translations',
			method: 'POST',
			path: '/fields/legal_pages',
			payload: {
				field: 'translations',
				type: 'alias',
				meta: {
					interface: 'translations',
					special: ['translations'],
					options: { languageField: 'name' },
					width: 'full',
				},
			},
		},
		{
			kind: 'collection',
			target: 'legal_pages_translations',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'legal_pages_translations',
				meta: {
					collection: 'legal_pages_translations',
					icon: 'import_export',
					hidden: true,
					singleton: false,
					accountability: 'all',
					versioning: false,
				},
				schema: { name: 'legal_pages_translations' },
				fields: [
					{
						field: 'id',
						type: 'integer',
						meta: { hidden: true },
						schema: { is_primary_key: true, has_auto_increment: true },
					},
				],
			},
		},
		{
			kind: 'field',
			target: 'legal_pages_translations.legal_pages_id',
			method: 'POST',
			path: '/fields/legal_pages_translations',
			payload: {
				field: 'legal_pages_id',
				type: 'string',
				meta: { hidden: true },
				schema: { is_nullable: true },
			},
		},
		{
			kind: 'field',
			target: 'legal_pages_translations.languages_code',
			method: 'POST',
			path: '/fields/legal_pages_translations',
			payload: {
				field: 'languages_code',
				type: 'string',
				meta: { hidden: true },
				schema: { is_nullable: true },
			},
		},
		{
			kind: 'field',
			target: 'legal_pages_translations.title',
			method: 'POST',
			path: '/fields/legal_pages_translations',
			payload: {
				field: 'title',
				type: 'string',
				meta: {
					interface: 'input',
					note: 'Page title: renders as the h1, the site_pages registry label, and the footer link text.',
					width: 'full',
				},
				schema: { is_nullable: true },
			},
		},
		{
			kind: 'field',
			target: 'legal_pages_translations.body',
			method: 'POST',
			path: '/fields/legal_pages_translations',
			payload: {
				field: 'body',
				type: 'json',
				meta: {
					interface: 'input-block-editor',
					special: ['cast-json'],
					note: 'Page body. Block Editor: headings, paragraphs, lists. Same renderer as blog bodies (BlockRenderer.svelte).',
					width: 'full',
				},
				schema: { is_nullable: true },
			},
		},
		{
			kind: 'relation',
			target: 'legal_pages_translations.legal_pages_id -> legal_pages',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'legal_pages_translations',
				field: 'legal_pages_id',
				related_collection: 'legal_pages',
				meta: { one_field: 'translations', junction_field: 'languages_code' },
				schema: { on_delete: 'CASCADE' },
			},
		},
		{
			kind: 'relation',
			target: 'legal_pages_translations.languages_code -> languages',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'legal_pages_translations',
				field: 'languages_code',
				related_collection: 'languages',
				meta: { one_field: null, junction_field: 'legal_pages_id' },
				schema: { on_delete: 'CASCADE' },
			},
		},
		// Permissions — the Vercel build token (Build Bot policy) must READ the
		// new collections or export-fallbacks dies on deploy (live-or-die);
		// Human Editor gets CRUD like every content collection.
		...(['legal_pages', 'legal_pages_translations'] as const).map(
			(collection): SchemaStep => ({
				kind: 'permission',
				target: `${collection}:read(build-bot)`,
				method: 'POST',
				path: '/permissions',
				policyNames: ['Build Bot — content read'],
				payload: { collection, action: 'read', fields: ['*'], permissions: {}, validation: null },
			}),
		),
		...(['legal_pages', 'legal_pages_translations'] as const).flatMap((collection): SchemaStep[] =>
			(['create', 'read', 'update', 'delete'] as const).map(
				(action): SchemaStep => ({
					kind: 'permission',
					target: `${collection}:${action}(human-editor)`,
					method: 'POST',
					path: '/permissions',
					policyNames: ['Human Editor'],
					payload: { collection, action, fields: ['*'], permissions: {}, validation: null },
				}),
			),
		),
	];
}

/** Resolve the policy display name to an id, skip if granted, POST otherwise
 *  (same contract as setup-contact-channels.ts). */
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

/** Exported for the prod promotion orchestrator (promote-launch-phase1-prod). */
export async function applyPlan(plan: readonly SchemaStep[], ctx: ApplyContext): Promise<void> {
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

async function main(): Promise<void> {
	const apply = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildPlan();
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: ${plan.length} schema steps (2 collections, 6 fields, 2 relations, 10 permissions)`);
	for (const step of plan) log.info(`  ${step.kind} ${step.target}`);
	if (!apply) {
		log.info('dry-run complete. Pass --apply to write schema.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	await applyPlan(plan, ctx);
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[legal-pages-schema] FAILED:', error);
		process.exit(1);
	});
}
