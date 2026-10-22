#!/usr/bin/env bun
/**
 * Reconcile one production permission only: public policy + blog_posts + read.
 * The sole accepted drift is a missing `translation_key` in `fields`.
 * Dry-run is the default; production writes require the exact confirmation.
 */

import { createLogger } from './lib/logger';
import { parseProductionOnlyWriteCli } from './lib/prod-gate';
import { type ApplyContext, rest } from './lib/schema-apply';
import {
	normalizePermissionPayload,
	permissionPayloadDifferences,
	resolveDesiredPermissions,
	type DesiredPermissionRow,
	type LivePermissionRow,
	type LivePolicyRow,
	type NormalizedPermissionPayload,
	type RepoPolicyRow,
} from './lib/permission-control-drift';

export const PROD_CMS_URL = 'https://cms.yesid.dev';
export const PROD_CONFIRM_PHRASE =
	'APPLY_PROD_PUBLIC_BLOG_TRANSLATION_KEY_PERMISSION';
export const PUBLIC_POLICY_NAME = '$t:public_label';
export const TARGET_COLLECTION = 'blog_posts';
export const TARGET_ACTION = 'read';
export const REQUIRED_FIELD = 'translation_key';

export interface ReconcileArgs {
	apply: boolean;
	directusUrl: typeof PROD_CMS_URL;
}

export interface ApiResponse {
	status: number;
	json: unknown;
}

export type PermissionApiRequest = (
	method: 'GET' | 'PATCH',
	path: string,
	body?: unknown,
) => Promise<ApiResponse>;

export interface DesiredPublicBlogPermission {
	policyName: typeof PUBLIC_POLICY_NAME;
	collection: typeof TARGET_COLLECTION;
	action: typeof TARGET_ACTION;
	payload: {
		fields: string[];
		permissions: unknown;
		validation: unknown;
		presets: unknown;
	};
}

export interface PublicBlogPermissionPatch {
	fields: string[];
}

export interface PublicBlogPermissionPlan {
	action: 'update' | 'noop';
	permissionId: string | number;
	policyName: typeof PUBLIC_POLICY_NAME;
	collection: typeof TARGET_COLLECTION;
	permissionAction: typeof TARGET_ACTION;
	patch: PublicBlogPermissionPatch | null;
	before: NormalizedPermissionPayload;
	after: NormalizedPermissionPayload;
}

export interface PublicBlogPermissionState {
	policies: LivePolicyRow[];
	permissions: LivePermissionRow[];
}

export interface PublicBlogPermissionCms {
	read(): Promise<PublicBlogPermissionState>;
	patch(
		id: string | number,
		body: PublicBlogPermissionPatch,
	): Promise<void>;
}

export function parseReconcileArgs(
	argv: readonly string[],
	publicDirectusUrl = process.env.PUBLIC_DIRECTUS_URL,
): ReconcileArgs {
	return parseProductionOnlyWriteCli(
		argv,
		'public-blog-permission',
		PROD_CONFIRM_PHRASE,
		publicDirectusUrl,
		PROD_CMS_URL,
	);
}

export function selectDesiredPublicBlogPermission(
	repoPolicies: readonly RepoPolicyRow[],
	desiredPermissions: readonly DesiredPermissionRow[],
): DesiredPublicBlogPermission {
	const resolvedPermissions = resolveDesiredPermissions(
		repoPolicies,
		desiredPermissions,
	);
	const permissions = resolvedPermissions.filter(
		(permission) =>
			permission.policyName === PUBLIC_POLICY_NAME &&
			permission.collection === TARGET_COLLECTION &&
			permission.action === TARGET_ACTION,
	);
	if (permissions.length !== 1) {
		throw new Error(
			`[public-blog-permission] expected exactly one repository permission for ${PUBLIC_POLICY_NAME} ${TARGET_COLLECTION}:${TARGET_ACTION}; found ${permissions.length}`,
		);
	}
	const permission = desiredPermissions[permissions[0]!.sourceIndex]!;
	if (!Array.isArray(permission.fields)) {
		throw new Error(
			'[public-blog-permission] desired fields must be an explicit array containing translation_key',
		);
	}
	const requiredFieldCount = permission.fields.filter(
		(field) => field === REQUIRED_FIELD,
	).length;
	if (requiredFieldCount !== 1) {
		throw new Error(
			`[public-blog-permission] desired fields must contain translation_key exactly once; found ${requiredFieldCount}`,
		);
	}
	return {
		policyName: PUBLIC_POLICY_NAME,
		collection: TARGET_COLLECTION,
		action: TARGET_ACTION,
		payload: {
			fields: [...permission.fields],
			permissions: permission.permissions ?? null,
			validation: permission.validation ?? null,
			presets: permission.presets ?? null,
		},
	};
}

function livePolicyId(permission: LivePermissionRow): string | null {
	const policy: unknown = permission.policy;
	if (policy === null) return null;
	if (typeof policy === 'string' && policy.length > 0) return policy;
	if (
		typeof policy === 'object' &&
		!Array.isArray(policy) &&
		typeof (policy as { id?: unknown }).id === 'string' &&
		(policy as { id: string }).id.length > 0
	) {
		return (policy as { id: string }).id;
	}
	throw new Error(
		`[public-blog-permission] invalid live policy relation on permission ${permission.id}`,
	);
}

export function buildPublicBlogPermissionPlan(
	desired: DesiredPublicBlogPermission,
	livePolicies: readonly LivePolicyRow[],
	livePermissions: readonly LivePermissionRow[],
): PublicBlogPermissionPlan {
	if (
		desired.policyName !== PUBLIC_POLICY_NAME ||
		desired.collection !== TARGET_COLLECTION ||
		desired.action !== TARGET_ACTION
	) {
		throw new Error(
			'[public-blog-permission] target identity does not match public policy + blog_posts + read',
		);
	}
	const policies = livePolicies.filter(
		(policy) => policy.name === PUBLIC_POLICY_NAME,
	);
	if (policies.length !== 1) {
		throw new Error(
			`[public-blog-permission] expected exactly one live public policy named "${PUBLIC_POLICY_NAME}"; found ${policies.length}`,
		);
	}
	const policy = policies[0]!;
	const permissions = livePermissions.filter(
		(permission) =>
			livePolicyId(permission) === policy.id &&
			permission.collection === TARGET_COLLECTION &&
			permission.action === TARGET_ACTION,
	);
	if (permissions.length !== 1) {
		throw new Error(
			`[public-blog-permission] expected exactly one live ${TARGET_COLLECTION}:${TARGET_ACTION} permission for policy ${policy.id}; found ${permissions.length}`,
		);
	}
	const permission = permissions[0]!;
	const before = normalizePermissionPayload(permission);
	const after = normalizePermissionPayload(desired.payload);
	const convergedDifferences = permissionPayloadDifferences(after, before);
	if (convergedDifferences.length === 0) {
		return {
			action: 'noop',
			permissionId: permission.id,
			policyName: PUBLIC_POLICY_NAME,
			collection: TARGET_COLLECTION,
			permissionAction: TARGET_ACTION,
			patch: null,
			before,
			after,
		};
	}

	const fieldsBefore = desired.payload.fields.filter(
		(field) => field !== REQUIRED_FIELD,
	);
	const allowedBefore = normalizePermissionPayload({
		...desired.payload,
		fields: fieldsBefore,
	});
	const unrelatedDifferences = permissionPayloadDifferences(
		allowedBefore,
		before,
	);
	if (unrelatedDifferences.length > 0) {
		throw new Error(
			`[public-blog-permission] unrelated drift detected in ${unrelatedDifferences.join(',')}; refusing to patch`,
		);
	}
	if (JSON.stringify(permission.fields) !== JSON.stringify(fieldsBefore)) {
		throw new Error(
			'[public-blog-permission] live fields order is not the exact desired order minus translation_key; refusing a non-additive patch',
		);
	}

	return {
		action: 'update',
		permissionId: permission.id,
		policyName: PUBLIC_POLICY_NAME,
		collection: TARGET_COLLECTION,
		permissionAction: TARGET_ACTION,
		patch: { fields: [...desired.payload.fields] },
		before,
		after,
	};
}

export function formatPublicBlogPermissionPlan(
	plan: PublicBlogPermissionPlan,
): string {
	if (plan.action === 'noop') {
		return `NOOP permission=${plan.permissionId} ${plan.policyName} ${plan.collection}:${plan.permissionAction} translation_key already present`;
	}
	return `PATCH permission=${plan.permissionId} fields-only add=translation_key ${plan.policyName} ${plan.collection}:${plan.permissionAction}`;
}

function samePlan(
	left: PublicBlogPermissionPlan,
	right: PublicBlogPermissionPlan,
): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

export async function applyAndVerifyPublicBlogPermission(
	cms: PublicBlogPermissionCms,
	desired: DesiredPublicBlogPermission,
	displayedPlan: PublicBlogPermissionPlan,
): Promise<PublicBlogPermissionPlan> {
	const beforeState = await cms.read();
	const currentPlan = buildPublicBlogPermissionPlan(
		desired,
		beforeState.policies,
		beforeState.permissions,
	);
	if (!samePlan(currentPlan, displayedPlan)) {
		throw new Error(
			'[public-blog-permission] state changed before apply; refusing stale plan',
		);
	}
	if (currentPlan.action === 'noop') return currentPlan;
	await cms.patch(currentPlan.permissionId, currentPlan.patch!);
	const afterState = await cms.read();
	const verified = buildPublicBlogPermissionPlan(
		desired,
		afterState.policies,
		afterState.permissions,
	);
	if (verified.action !== 'noop') {
		throw new Error(
			'[public-blog-permission] post-apply verification failed: translation_key drift remains',
		);
	}
	return verified;
}

function dataRows<T>(response: ApiResponse, operation: string): T[] {
	if (response.status >= 400) {
		throw new Error(
			`[public-blog-permission] ${operation} failed (${response.status}): ${JSON.stringify(response.json)}`,
		);
	}
	const data = (response.json as { data?: unknown } | null)?.data;
	if (!Array.isArray(data)) {
		throw new Error(
			`[public-blog-permission] ${operation} returned non-array data`,
		);
	}
	return data as T[];
}

function policyQuery(): string {
	const params = new URLSearchParams();
	params.set('fields', 'id,name');
	params.set('filter[name][_eq]', PUBLIC_POLICY_NAME);
	params.set('limit', '-1');
	return `/policies?${params.toString()}`;
}

function permissionQuery(policyId: string): string {
	const params = new URLSearchParams();
	params.set(
		'fields',
		'id,policy,collection,action,fields,permissions,validation,presets',
	);
	params.set('filter[policy][_eq]', policyId);
	params.set('filter[collection][_eq]', TARGET_COLLECTION);
	params.set('filter[action][_eq]', TARGET_ACTION);
	params.set('limit', '-1');
	return `/permissions?${params.toString()}`;
}

export function createPublicBlogPermissionCms(
	api: PermissionApiRequest,
): PublicBlogPermissionCms {
	return {
		read: async () => {
			const policies = dataRows<LivePolicyRow>(
				await api('GET', policyQuery()),
				'GET /policies',
			);
			const matches = policies.filter(
				(policy) => policy.name === PUBLIC_POLICY_NAME,
			);
			if (matches.length !== 1) {
				throw new Error(
					`[public-blog-permission] expected exactly one live public policy named "${PUBLIC_POLICY_NAME}"; found ${matches.length}`,
				);
			}
			const permissions = dataRows<LivePermissionRow>(
				await api('GET', permissionQuery(matches[0]!.id)),
				'GET /permissions',
			);
			return { policies, permissions };
		},
		patch: async (id, body) => {
			if (Object.keys(body).length !== 1 || !Array.isArray(body.fields)) {
				throw new Error(
					'[public-blog-permission] internal guard: PATCH body must contain fields only',
				);
			}
			const response = await api(
				'PATCH',
				`/permissions/${encodeURIComponent(String(id))}`,
				{ fields: [...body.fields] },
			);
			if (response.status >= 400) {
				throw new Error(
					`[public-blog-permission] PATCH /permissions/${id} failed (${response.status}): ${JSON.stringify(response.json)}`,
				);
			}
		},
	};
}

async function readRepoJson<T>(path: URL): Promise<T> {
	return (await Bun.file(path).json()) as T;
}

function requireStaticAdminToken(): string {
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) {
		throw new Error(
			'[public-blog-permission] DIRECTUS_ADMIN_TOKEN is required; password login fallback is disabled',
		);
	}
	return token;
}

async function main(): Promise<void> {
	const options = parseReconcileArgs(process.argv.slice(2));
	const repoPolicies = await readRepoJson<RepoPolicyRow[]>(
		new URL('../directus/collections/policies.json', import.meta.url),
	);
	const desiredPermissions = await readRepoJson<DesiredPermissionRow[]>(
		new URL('../directus/collections/permissions.json', import.meta.url),
	);
	const desired = selectDesiredPublicBlogPermission(
		repoPolicies,
		desiredPermissions,
	);
	const ctx: ApplyContext = {
		directusUrl: options.directusUrl,
		token: requireStaticAdminToken(),
	};
	const api: PermissionApiRequest = (method, path, body) =>
		rest(ctx, method, path, body);
	const cms = createPublicBlogPermissionCms(api);
	const state = await cms.read();
	const plan = buildPublicBlogPermissionPlan(
		desired,
		state.policies,
		state.permissions,
	);
	console.log(formatPublicBlogPermissionPlan(plan));
	const log = createLogger('public-blog-permission');
	if (!options.apply) {
		log.info('dry-run complete: production was read; no writes were sent.');
		return;
	}
	await applyAndVerifyPublicBlogPermission(cms, desired, plan);
	log.info(
		'apply complete: re-GET verified translation_key and no other permission payload fields changed.',
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[public-blog-permission] FAILED:', error);
		process.exit(1);
	});
}
