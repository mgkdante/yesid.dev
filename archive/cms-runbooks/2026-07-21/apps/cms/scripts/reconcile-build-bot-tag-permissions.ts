#!/usr/bin/env bun
/**
 * Create the three Build Bot read permissions required by normalized tag
 * exports. Existing permissions are reported as noops and are never changed.
 *
 * Dry-run is the default. Both environments require an explicit target, and
 * PUBLIC_DIRECTUS_URL is cross-checked when supplied:
 *
 *   PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
 *     bun apps/cms/scripts/reconcile-build-bot-tag-permissions.ts --target=dev
 *
 *   PUBLIC_DIRECTUS_URL=https://cms.yesid.dev \
 *     bun apps/cms/scripts/reconcile-build-bot-tag-permissions.ts \
 *       --target=prod --apply \
 *       --confirm=RECONCILE_PROD_BUILD_BOT_TAG_PERMISSIONS
 */

import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, rest } from './lib/schema-apply';

export const DEV_CMS_URL = 'https://cms.dev.yesid.dev';
export const PROD_CMS_URL = 'https://cms.yesid.dev';
export const BUILD_BOT_POLICY_NAME = 'Build Bot — content read';
export const PROD_CONFIRM_PHRASE =
	'RECONCILE_PROD_BUILD_BOT_TAG_PERMISSIONS';
export const REQUIRED_READ_COLLECTIONS = [
	'tags',
	'projects_tags',
	'blog_posts_tags',
] as const;

export type Target = 'dev' | 'prod';
export type RequiredReadCollection =
	(typeof REQUIRED_READ_COLLECTIONS)[number];

export interface ParsedArgs {
	apply: boolean;
	target: Target;
	directusUrl: typeof DEV_CMS_URL | typeof PROD_CMS_URL;
}

export interface PolicyRow {
	id: string;
	name: string;
}

export interface PermissionRow {
	id: string | number;
	policy: string | { id: string };
	collection: string;
	action: string;
	fields?: string[] | null;
	permissions?: Record<string, unknown> | null;
	validation?: Record<string, unknown> | null;
}

export interface PermissionPayload {
	policy: string;
	collection: RequiredReadCollection;
	action: 'read';
	fields: ['*'];
	permissions: Record<string, never>;
	validation: null;
}

export interface PermissionPlanEntry {
	collection: RequiredReadCollection;
	action: 'create' | 'noop';
	payload: PermissionPayload;
	existingPermissionIds: Array<string | number>;
}

export interface PermissionPlan {
	policy: PolicyRow;
	entries: PermissionPlanEntry[];
}

export interface ApiResponse {
	status: number;
	json: unknown;
}

export type ApiRequest = (
	method: 'GET' | 'POST',
	path: string,
	body?: unknown,
) => Promise<ApiResponse>;

function normalizeCmsUrl(value: string): string {
	return value.replace(/\/+$/, '');
}

export function parseArgs(
	argv: readonly string[],
	publicDirectusUrl = process.env.PUBLIC_DIRECTUS_URL,
): ParsedArgs {
	const known = argv.filter(
		(arg) =>
			arg === '--apply' ||
			arg === '--dry-run' ||
			arg.startsWith('--target=') ||
			arg.startsWith('--confirm='),
	);
	if (known.length !== argv.length) {
		const unknown = argv.find((arg) => !known.includes(arg));
		throw new Error(
			`[build-bot-tag-permissions] Unknown argument: ${unknown}`,
		);
	}
	if (argv.includes('--apply') && argv.includes('--dry-run')) {
		throw new Error(
			'[build-bot-tag-permissions] Choose either --dry-run or --apply',
		);
	}

	const targets = argv
		.filter((arg) => arg.startsWith('--target='))
		.map((arg) => arg.slice('--target='.length));
	if (targets.length === 0) {
		throw new Error(
			'[build-bot-tag-permissions] Missing --target=dev|prod',
		);
	}
	if (
		targets.length !== 1 ||
		(targets[0] !== 'dev' && targets[0] !== 'prod')
	) {
		throw new Error(
			'[build-bot-tag-permissions] Use exactly one --target=dev|prod',
		);
	}

	const target = targets[0] as Target;
	const expectedUrl = target === 'dev' ? DEV_CMS_URL : PROD_CMS_URL;
	const directusUrl = normalizeCmsUrl(publicDirectusUrl ?? expectedUrl);
	if (directusUrl !== DEV_CMS_URL && directusUrl !== PROD_CMS_URL) {
		throw new Error(
			`[build-bot-tag-permissions] Unsupported PUBLIC_DIRECTUS_URL: ${directusUrl}`,
		);
	}
	if (directusUrl !== expectedUrl) {
		throw new Error(
			`[build-bot-tag-permissions] PUBLIC_DIRECTUS_URL does not match --target=${target}`,
		);
	}

	const apply = argv.includes('--apply');
	const confirmations = argv
		.filter((arg) => arg.startsWith('--confirm='))
		.map((arg) => arg.slice('--confirm='.length));
	if (confirmations.length > 1) {
		throw new Error(
			'[build-bot-tag-permissions] Use at most one --confirm=<phrase>',
		);
	}
	if (
		apply &&
		target === 'prod' &&
		confirmations[0] !== PROD_CONFIRM_PHRASE
	) {
		throw new Error(
			`[build-bot-tag-permissions] PROD write refused. Re-run with --confirm=${PROD_CONFIRM_PHRASE}`,
		);
	}

	return {
		apply,
		target,
		directusUrl: expectedUrl,
	};
}

function policyId(value: PermissionRow['policy']): string {
	return typeof value === 'string' ? value : value.id;
}

function permissionPayload(
	policy: PolicyRow,
	collection: RequiredReadCollection,
): PermissionPayload {
	return {
		policy: policy.id,
		collection,
		action: 'read',
		fields: ['*'],
		permissions: {},
		validation: null,
	};
}

function isEmptyObject(value: unknown): value is Record<string, never> {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.keys(value).length === 0
	);
}

function hasRequiredShape(permission: PermissionRow): boolean {
	return (
		Array.isArray(permission.fields) &&
		permission.fields.length === 1 &&
		permission.fields[0] === '*' &&
		isEmptyObject(permission.permissions) &&
		permission.validation === null
	);
}

export function buildPermissionPlan(
	policies: readonly PolicyRow[],
	permissions: readonly PermissionRow[],
): PermissionPlan {
	const matches = policies.filter(
		(policy) => policy.name === BUILD_BOT_POLICY_NAME,
	);
	if (matches.length !== 1) {
		throw new Error(
			`[build-bot-tag-permissions] Expected exactly one policy named "${BUILD_BOT_POLICY_NAME}"; found ${matches.length}`,
		);
	}
	const policy = matches[0] as PolicyRow;

	const entries = REQUIRED_READ_COLLECTIONS.map((collection) => {
		const existing = permissions.filter(
			(permission) =>
				policyId(permission.policy) === policy.id &&
				permission.collection === collection &&
				permission.action === 'read',
		);
		const mismatched = existing.find(
			(permission) => !hasRequiredShape(permission),
		);
		if (mismatched) {
			throw new Error(
				`[build-bot-tag-permissions] existing ${collection}:read permission ${mismatched.id} does not match the required unrestricted shape; refusing to modify it`,
			);
		}
		return {
			collection,
			action: existing.length > 0 ? ('noop' as const) : ('create' as const),
			payload: permissionPayload(policy, collection),
			existingPermissionIds: existing.map((permission) => permission.id),
		};
	});

	return { policy, entries };
}

function dataRows<T>(response: ApiResponse, operation: string): T[] {
	if (response.status >= 400) {
		throw new Error(
			`[build-bot-tag-permissions] ${operation} failed (${response.status}): ${JSON.stringify(response.json)}`,
		);
	}
	const data = (response.json as { data?: unknown } | null)?.data;
	if (!Array.isArray(data)) {
		throw new Error(
			`[build-bot-tag-permissions] ${operation} returned non-array data`,
		);
	}
	return data as T[];
}

function policyQuery(): string {
	const params = new URLSearchParams();
	params.set('fields', 'id,name');
	params.set('filter[name][_eq]', BUILD_BOT_POLICY_NAME);
	params.set('limit', '-1');
	return `/policies?${params.toString()}`;
}

function permissionQuery(policy: PolicyRow): string {
	const params = new URLSearchParams();
	params.set(
		'fields',
		'id,policy,collection,action,fields,permissions,validation',
	);
	params.set('filter[policy][_eq]', policy.id);
	params.set('filter[action][_eq]', 'read');
	params.set('limit', '-1');
	return `/permissions?${params.toString()}`;
}

export async function loadPermissionPlan(
	api: ApiRequest,
): Promise<PermissionPlan> {
	const policies = dataRows<PolicyRow>(
		await api('GET', policyQuery()),
		'GET /policies',
	);
	const selected = buildPermissionPlan(policies, []).policy;
	const permissions = dataRows<PermissionRow>(
		await api('GET', permissionQuery(selected)),
		'GET /permissions',
	);
	return buildPermissionPlan([selected], permissions);
}

export function formatPermissionPlan(plan: PermissionPlan): string {
	const lines = [
		`policy=${plan.policy.name} id=${plan.policy.id}`,
		...plan.entries.map((entry) =>
			entry.action === 'create'
				? `CREATE ${entry.collection}:read payload=${JSON.stringify(entry.payload)}`
				: `NOOP ${entry.collection}:read existing_permission_ids=${JSON.stringify(entry.existingPermissionIds)}`,
		),
	];
	const creates = plan.entries.filter(
		(entry) => entry.action === 'create',
	).length;
	lines.push(`summary create=${creates} noop=${plan.entries.length - creates}`);
	return lines.join('\n');
}

export async function applyPermissionPlan(
	api: ApiRequest,
	plan: PermissionPlan,
): Promise<PermissionPlan> {
	for (const entry of plan.entries) {
		if (entry.action !== 'create') continue;
		const response = await api('POST', '/permissions', entry.payload);
		if (response.status >= 400) {
			throw new Error(
				`[build-bot-tag-permissions] POST /permissions ${entry.collection}:read failed (${response.status}): ${JSON.stringify(response.json)}`,
			);
		}
	}

	const permissions = dataRows<PermissionRow>(
		await api('GET', permissionQuery(plan.policy)),
		'GET /permissions verification',
	);
	const verified = buildPermissionPlan([plan.policy], permissions);
	const missing = verified.entries
		.filter((entry) => entry.action === 'create')
		.map((entry) => entry.collection);
	if (missing.length > 0) {
		throw new Error(
			`[build-bot-tag-permissions] re-GET verification failed; missing read permissions: ${missing.join(', ')}`,
		);
	}
	return verified;
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const log = createLogger('build-bot-tag-permissions');
	log.info(
		`target=${options.target} url=${options.directusUrl} mode=${options.apply ? 'APPLY' : 'DRY-RUN'}`,
	);

	const token = await getAdminToken(options.directusUrl, {
		allowBuildToken: false,
	});
	const ctx: ApplyContext = { directusUrl: options.directusUrl, token };
	const api: ApiRequest = (method, path, body) =>
		rest(ctx, method, path, body);
	const plan = await loadPermissionPlan(api);
	console.log(formatPermissionPlan(plan));

	if (!options.apply) {
		log.info('dry-run complete: CMS was read, no writes were sent.');
		return;
	}

	const verified = await applyPermissionPlan(api, plan);
	log.info(
		`apply complete: re-GET verified ${verified.entries.length}/${REQUIRED_READ_COLLECTIONS.length} required permissions.`,
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[build-bot-tag-permissions] FAILED:', error);
		process.exit(1);
	});
}
