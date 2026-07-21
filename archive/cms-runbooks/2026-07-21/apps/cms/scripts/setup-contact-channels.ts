#!/usr/bin/env bun
/**
 * setup-contact-channels.ts
 *
 * Normalizes /contact terminal channels into CMS rows:
 * - contact_channels owns order, status, href, and icon.
 * - contact_channels_translations owns the channel label.
 * - the old block_contact_content_translations.socials JSON field is removed on apply.
 *
 * DEV-ONLY. Dry-run by default; pass --apply --seed to write schema and rows.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, type SchemaStep, isAlreadyExists, rest } from './lib/schema-apply';

export type { SchemaStep, SchemaStepKind } from './lib/schema-apply';

export const CONTACT_CHANNEL_SEEDS = [
	{
		id: 'email',
		sort: 1,
		href: 'mailto:contact@yesid.dev',
		icon: 'email',
		label: { en: 'Email', fr: 'Courriel' },
	},
	{
		id: 'github',
		sort: 2,
		href: 'https://github.com/mgkdante',
		icon: 'github',
		label: { en: 'GitHub', fr: 'GitHub' },
	},
	{
		id: 'linkedin',
		sort: 3,
		href: 'https://www.linkedin.com/in/otaloray/',
		icon: 'linkedin',
		label: { en: 'LinkedIn', fr: 'LinkedIn' },
	},
] as const;

function stringPkField() {
	return {
		field: 'id',
		type: 'string',
		meta: {
			hidden: false,
			interface: 'input',
			note: 'Stable contact channel id, such as email or linkedin.',
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

export function buildContactChannelsPlan(): SchemaStep[] {
	return [
		{
			kind: 'collection',
			target: 'contact_channels',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'contact_channels',
				meta: {
					accountability: 'all',
					archive_app_filter: true,
					archive_field: 'status',
					archive_value: 'archived',
					collapse: 'open',
					display_template: '{{id}}',
					group: 'contact_page',
					hidden: false,
					icon: 'alternate_email',
					note: 'CMS-backed /contact terminal channels. Each row owns href, icon, order, and translated label.',
					singleton: false,
					sort: 2,
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
					{
						field: 'href',
						type: 'string',
						meta: {
							interface: 'input',
							note: 'Full channel URL, including mailto: for email.',
							required: true,
							sort: 4,
							width: 'full',
						},
						schema: { is_nullable: false },
					},
					{
						field: 'icon',
						type: 'string',
						meta: {
							interface: 'input',
							note: 'Stable icon/test id token, such as email, github, linkedin, mastodon.',
							required: true,
							sort: 5,
							width: 'half',
						},
						schema: { is_nullable: false },
					},
				],
			},
		},
		{
			kind: 'collection',
			target: 'contact_channels_translations',
			method: 'POST',
			path: '/collections',
			payload: {
				collection: 'contact_channels_translations',
				meta: { hidden: true, icon: 'import_export' },
				schema: {},
				fields: [
					autoincrementPkField(),
					{ field: 'contact_channels_id', type: 'string', meta: { hidden: true }, schema: {} },
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
			target: 'contact_channels.translations',
			method: 'POST',
			path: '/fields/contact_channels',
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
			kind: 'relation',
			target: 'contact_channels_translations.contact_channels_id',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'contact_channels_translations',
				field: 'contact_channels_id',
				related_collection: 'contact_channels',
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
			target: 'contact_channels_translations.languages_code',
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'contact_channels_translations',
				field: 'languages_code',
				related_collection: 'languages',
				meta: {
					junction_field: 'contact_channels_id',
					one_deselect_action: 'nullify',
				},
				schema: { on_delete: 'CASCADE' },
			},
		},
		{
			kind: 'permission',
			target: 'contact_channels:read(build-bot)',
			method: 'POST',
			path: '/permissions',
			policyNames: ['Build Bot \u2014 content read'],
			payload: { collection: 'contact_channels', action: 'read', fields: ['*'], permissions: {}, validation: null },
		},
		{
			kind: 'permission',
			target: 'contact_channels_translations:read(build-bot)',
			method: 'POST',
			path: '/permissions',
			policyNames: ['Build Bot \u2014 content read'],
			payload: { collection: 'contact_channels_translations', action: 'read', fields: ['*'], permissions: {}, validation: null },
		},
		...(['contact_channels', 'contact_channels_translations'] as const).flatMap((collection): SchemaStep[] =>
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

export function channelRowsFromSeeds() {
	return CONTACT_CHANNEL_SEEDS.map((seed) => ({
		id: seed.id,
		status: 'published',
		sort: seed.sort,
		href: seed.href,
		icon: seed.icon,
		translations: [
			{ languages_code: 'en', label: seed.label.en },
			{ languages_code: 'fr', label: seed.label.fr },
		],
	}));
}

export function parseFlags(argv: readonly string[]): { apply: boolean; seed: boolean } {
	return { apply: argv.includes('--apply'), seed: argv.includes('--seed') };
}

const log = createLogger('contact-channels');

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
	const rows = channelRowsFromSeeds();
	for (const row of rows) {
		const existing = await rest(ctx, 'GET', `/items/contact_channels/${row.id}`);
		if (existing.status === 404 || existing.status === 403) {
			await apiPost(ctx, '/items/contact_channels', {
				id: row.id,
				status: row.status,
				sort: row.sort,
				href: row.href,
				icon: row.icon,
			});
			log.info(`  create contact_channels.${row.id}`);
		} else if (existing.status < 400) {
			await apiPatch(ctx, `/items/contact_channels/${row.id}`, {
				status: row.status,
				sort: row.sort,
				href: row.href,
				icon: row.icon,
			});
			log.info(`  update contact_channels.${row.id}`);
		} else {
			throw new Error(`GET /items/contact_channels/${row.id} failed (${existing.status}): ${JSON.stringify(existing.json)}`);
		}

		for (const translation of row.translations) {
			const query =
				`/items/contact_channels_translations?limit=1&filter[contact_channels_id][_eq]=${row.id}` +
				`&filter[languages_code][_eq]=${translation.languages_code}`;
			const found = await apiGet(ctx, query);
			const existingTranslation = (found.data as Array<{ id: number }>)[0];
			if (existingTranslation) {
				await apiPatch(ctx, `/items/contact_channels_translations/${existingTranslation.id}`, {
					label: translation.label,
				});
				log.info(`  update contact_channels.${row.id} ${translation.languages_code}`);
			} else {
				await apiPost(ctx, '/items/contact_channels_translations', {
					contact_channels_id: row.id,
					languages_code: translation.languages_code,
					label: translation.label,
				});
				log.info(`  create contact_channels.${row.id} ${translation.languages_code}`);
			}
		}
	}
}

async function dropLegacyJsonField(ctx: ApplyContext): Promise<void> {
	const res = await rest(ctx, 'DELETE', '/fields/block_contact_content_translations/socials');
	if (res.status === 204 || res.status === 200) {
		log.info('  dropped legacy block_contact_content_translations.socials JSON field');
		return;
	}
	if (res.status === 404) {
		log.info('  skip legacy block_contact_content_translations.socials - already absent');
		return;
	}
	throw new Error(`DELETE /fields/block_contact_content_translations/socials failed (${res.status}): ${JSON.stringify(res.json)}`);
}

async function main(): Promise<void> {
	const flags = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildContactChannelsPlan();
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
		console.error('[contact-channels] FAILED:', error);
		process.exit(1);
	});
}
