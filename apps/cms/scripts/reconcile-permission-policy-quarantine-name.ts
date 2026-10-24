#!/usr/bin/env bun
/**
 * Rename one zero-permission duplicate production policy to an explicit
 * quarantine label. This reconciler never changes permissions or attachments.
 * Dry-run is the default; production writes require the exact confirmation.
 * Raw /access rows are authoritative because Directus 12 policy roles/users
 * aliases overlap and cannot prove independent attachment topology.
 */

import { createLogger } from './lib/logger';
import { parseProductionOnlyWriteCli } from './lib/prod-gate';
import { type ApplyContext, rest } from './lib/schema-apply';
import { isDeepStrictEqual } from 'node:util';

export const PROD_CMS_URL = 'https://cms.yesid.dev';
export const PROD_CONFIRM_PHRASE =
	'APPLY_PROD_PERMISSION_POLICY_QUARANTINE_RENAME';
export const TARGET_POLICY_ID = 'cbe60d41-b585-4f02-b18a-486dbd1e59f1';
export const AUTHORITATIVE_POLICY_ID =
	'cff6353e-922f-4da2-931d-e866868a9276';
export const CURRENT_POLICY_NAME = 'Ops Bot content ops';
export const TARGET_POLICY_NAME =
	'QUARANTINED — duplicate Ops Bot content ops — zero permissions';

const ERROR_PREFIX = '[permission-policy-quarantine-name]';

export interface QuarantineRenameArgs {
	apply: boolean;
	directusUrl: typeof PROD_CMS_URL;
}

export interface PolicyRow {
	id: string;
	name: string;
	admin_access: boolean;
	app_access: boolean;
	icon: unknown;
	description: unknown;
	ip_access: unknown;
	enforce_tfa: unknown;
}

export interface MatchingPolicyRow {
	id: string;
	name: string;
}

export interface PermissionIdentityRow {
	id: string | number;
}

export interface PolicyQuarantineRenameState {
	policy: PolicyRow;
	access: unknown;
	permissions: PermissionIdentityRow[];
	matchingPolicies: MatchingPolicyRow[];
}

export interface PolicyQuarantineRenamePatch {
	name: typeof TARGET_POLICY_NAME;
}

export interface PreservedPolicyFields {
	icon: unknown;
	description: unknown;
	ip_access: unknown;
	enforce_tfa: unknown;
}

export interface RawAccessProjection {
	id: string;
	policy: typeof TARGET_POLICY_ID;
	role: string | null;
	user: string | null;
	sort: number | null;
}

export interface PolicyQuarantineRenamePlan {
	action: 'rename' | 'noop';
	policyId: typeof TARGET_POLICY_ID;
	currentName: string;
	targetName: typeof TARGET_POLICY_NAME;
	patch: PolicyQuarantineRenamePatch | null;
	permissionCount: number;
	adminAccess: false;
	appAccess: false;
	accessRowCount: number;
	roleOnlyAccessCount: number;
	userOnlyAccessCount: number;
	accessRows: RawAccessProjection[];
	sourceNamePolicyIds: string[];
	quarantineNamePolicyIds: string[];
	preservedFields: PreservedPolicyFields;
}

export interface ApiResponse {
	status: number;
	json: unknown;
}

export type PolicyQuarantineRenameApiRequest = (
	method: 'GET' | 'PATCH',
	path: string,
	body?: unknown,
) => Promise<ApiResponse>;

export interface PolicyQuarantineRenameCms {
	read(): Promise<PolicyQuarantineRenameState>;
	patch(id: string, body: PolicyQuarantineRenamePatch): Promise<void>;
}

export function parseQuarantineRenameArgs(
	argv: readonly string[],
	publicDirectusUrl = process.env.PUBLIC_DIRECTUS_URL,
): QuarantineRenameArgs {
	return parseProductionOnlyWriteCli(
		argv,
		'permission-policy-quarantine-name',
		PROD_CONFIRM_PHRASE,
		publicDirectusUrl,
		PROD_CMS_URL,
	);
}

export function requireStaticAdminToken(
	env: Readonly<Record<string, string | undefined>> = process.env,
): string {
	const token = env.DIRECTUS_ADMIN_TOKEN;
	if (!token) {
		throw new Error(
			`${ERROR_PREFIX} DIRECTUS_ADMIN_TOKEN is required; password login fallback is disabled`,
		);
	}
	return token;
}

function canonicalRawAccessRows(value: unknown): RawAccessProjection[] {
	if (!Array.isArray(value)) {
		throw new Error(
			`${ERROR_PREFIX} raw access rows must be an array; refusing incomplete access evidence`,
		);
	}
	const requiredKeys = ['id', 'policy', 'role', 'user', 'sort'] as const;
	const projections = value.map((candidate, index) => {
		if (
			!candidate ||
			typeof candidate !== 'object' ||
			Array.isArray(candidate) ||
			(Object.getPrototypeOf(candidate) !== Object.prototype &&
				Object.getPrototypeOf(candidate) !== null)
		) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} must be a plain object`,
			);
		}
		const row = candidate as Record<string, unknown>;
		for (const key of requiredKeys) {
			if (
				!Object.prototype.hasOwnProperty.call(row, key) ||
				row[key] === undefined
			) {
				throw new Error(
					`${ERROR_PREFIX} raw access row ${index} is missing required field ${key}`,
				);
			}
		}
		if (typeof row.id !== 'string' || row.id.length === 0) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} id must be a non-empty scalar string`,
			);
		}
		if (typeof row.policy !== 'string' || row.policy.length === 0) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} policy must be a non-empty scalar string`,
			);
		}
		if (row.policy !== TARGET_POLICY_ID) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} belongs to an unexpected policy`,
			);
		}
		if (
			row.role !== null &&
			(typeof row.role !== 'string' || row.role.length === 0)
		) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} role must be a non-empty scalar string or null`,
			);
		}
		if (
			row.user !== null &&
			(typeof row.user !== 'string' || row.user.length === 0)
		) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} user must be a non-empty scalar string or null`,
			);
		}
		if ((row.role === null) === (row.user === null)) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} must have exactly one of role or user non-null`,
			);
		}
		if (
			row.sort !== null &&
			(typeof row.sort !== 'number' || !Number.isInteger(row.sort))
		) {
			throw new Error(
				`${ERROR_PREFIX} raw access row ${index} sort must be an integer or null`,
			);
		}
		return {
			id: row.id,
			policy: row.policy as typeof TARGET_POLICY_ID,
			role: row.role as string | null,
			user: row.user as string | null,
			sort: row.sort as number | null,
		};
	});
	if (new Set(projections.map((row) => row.id)).size !== projections.length) {
		throw new Error(`${ERROR_PREFIX} duplicate raw access row id`);
	}
	projections.sort((left, right) => left.id.localeCompare(right.id));
	const roleOnlyCount = projections.filter((row) => row.role !== null).length;
	const userOnlyCount = projections.filter((row) => row.user !== null).length;
	if (
		projections.length !== 1 ||
		roleOnlyCount !== 1 ||
		userOnlyCount !== 0
	) {
		throw new Error(
			`${ERROR_PREFIX} expected exactly one role-only raw access row and zero user-only rows; found roles=${roleOnlyCount} users=${userOnlyCount}`,
		);
	}
	return projections;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

function canonicalTopologyIds(
	rows: readonly MatchingPolicyRow[],
	name: string,
): string[] {
	const ids = rows
		.filter((row) => row.name === name)
		.map((row) => row.id)
		.sort((left, right) => left.localeCompare(right));
	if (new Set(ids).size !== ids.length) {
		throw new Error(
			`${ERROR_PREFIX} duplicate policy id in name topology for ${JSON.stringify(name)}`,
		);
	}
	return ids;
}

function capturePreservedFields(policy: PolicyRow): PreservedPolicyFields {
	const keys = [
		'icon',
		'description',
		'ip_access',
		'enforce_tfa',
	] as const;
	for (const key of keys) {
		if (
			!Object.prototype.hasOwnProperty.call(policy, key) ||
			policy[key] === undefined
		) {
			throw new Error(
				`${ERROR_PREFIX} stable policy field ${key} is missing from read-back`,
			);
		}
	}
	return structuredClone({
		icon: policy.icon,
		description: policy.description,
		ip_access: policy.ip_access,
		enforce_tfa: policy.enforce_tfa,
	});
}

export function buildPolicyQuarantineRenamePlan(
	state: PolicyQuarantineRenameState,
): PolicyQuarantineRenamePlan {
	if (state.policy.id !== TARGET_POLICY_ID) {
		throw new Error(
			`${ERROR_PREFIX} expected exact target policy id ${TARGET_POLICY_ID}; found ${JSON.stringify(state.policy.id)}`,
		);
	}
	if (!Array.isArray(state.permissions)) {
		throw new Error(
			`${ERROR_PREFIX} permissions must be an array; refusing incomplete policy evidence`,
		);
	}
	if (state.permissions.length !== 0) {
		throw new Error(
			`${ERROR_PREFIX} expected zero permissions for ${TARGET_POLICY_ID}; found ${state.permissions.length}`,
		);
	}
	if (
		state.policy.name !== CURRENT_POLICY_NAME &&
		state.policy.name !== TARGET_POLICY_NAME
	) {
		throw new Error(
			`${ERROR_PREFIX} unexpected current name for ${TARGET_POLICY_ID}: ${JSON.stringify(state.policy.name)}`,
		);
	}
	if (state.policy.admin_access !== false) {
		throw new Error(
			`${ERROR_PREFIX} admin_access must be exactly false; refusing effective admin access`,
		);
	}
	if (state.policy.app_access !== false) {
		throw new Error(
			`${ERROR_PREFIX} app_access must be exactly false; refusing effective app access`,
		);
	}
	const accessRows = canonicalRawAccessRows(state.access);
	const roleOnlyAccessCount = accessRows.filter(
		(row) => row.role !== null,
	).length;
	const userOnlyAccessCount = accessRows.filter(
		(row) => row.user !== null,
	).length;
	const preservedFields = capturePreservedFields(state.policy);
	if (!Array.isArray(state.matchingPolicies)) {
		throw new Error(
			`${ERROR_PREFIX} matching policy topology must be an array`,
		);
	}
	for (const row of state.matchingPolicies) {
		if (
			!row ||
			typeof row.id !== 'string' ||
			row.id.length === 0 ||
			(row.name !== CURRENT_POLICY_NAME && row.name !== TARGET_POLICY_NAME)
		) {
			throw new Error(`${ERROR_PREFIX} invalid matching policy topology row`);
		}
	}
	const sourceNamePolicyIds = canonicalTopologyIds(
		state.matchingPolicies,
		CURRENT_POLICY_NAME,
	);
	const quarantineNamePolicyIds = canonicalTopologyIds(
		state.matchingPolicies,
		TARGET_POLICY_NAME,
	);
	const converged = state.policy.name === TARGET_POLICY_NAME;
	if (!converged) {
		const expectedSourcePolicyIds = [
			TARGET_POLICY_ID,
			AUTHORITATIVE_POLICY_ID,
		].sort((left, right) => left.localeCompare(right));
		if (!sameStrings(sourceNamePolicyIds, expectedSourcePolicyIds)) {
			throw new Error(
				`${ERROR_PREFIX} expected duplicate source-name topology containing only target and authoritative policy ids`,
			);
		}
		if (quarantineNamePolicyIds.length !== 0) {
			throw new Error(
				`${ERROR_PREFIX} quarantine target name must be unused before rename`,
			);
		}
	} else if (
		!sameStrings(sourceNamePolicyIds, [AUTHORITATIVE_POLICY_ID]) ||
		!sameStrings(quarantineNamePolicyIds, [TARGET_POLICY_ID])
	) {
		throw new Error(
			`${ERROR_PREFIX} expected exact converged name topology with authoritative source and one quarantined target`,
		);
	}
	return {
		action: converged ? 'noop' : 'rename',
		policyId: TARGET_POLICY_ID,
		currentName: state.policy.name,
		targetName: TARGET_POLICY_NAME,
		patch: converged ? null : { name: TARGET_POLICY_NAME },
		permissionCount: 0,
		adminAccess: false,
		appAccess: false,
		accessRowCount: accessRows.length,
		roleOnlyAccessCount,
		userOnlyAccessCount,
		accessRows,
		sourceNamePolicyIds,
		quarantineNamePolicyIds,
		preservedFields,
	};
}

export function formatPolicyQuarantineRenamePlan(
	plan: PolicyQuarantineRenamePlan,
	writesSent: 0 | 1 = 0,
): string {
	const evidence =
		`admin_access=${plan.adminAccess} app_access=${plan.appAccess} ` +
		`permissions=${plan.permissionCount} ` +
		`access_rows=${plan.accessRowCount} ` +
		`role_only_access=${plan.roleOnlyAccessCount} ` +
		`user_only_access=${plan.userOnlyAccessCount} ` +
		`writes_sent=${writesSent}`;
	if (plan.action === 'noop') {
		return `NOOP policy_id=${JSON.stringify(plan.policyId)} exact quarantine name already present ${evidence}`;
	}
	return `PATCH policy_id=${JSON.stringify(plan.policyId)} name-only from=${JSON.stringify(plan.currentName)} to=${JSON.stringify(plan.targetName)} ${evidence}`;
}

function samePlan(
	left: PolicyQuarantineRenamePlan,
	right: PolicyQuarantineRenamePlan,
): boolean {
	return isDeepStrictEqual(left, right);
}

export async function applyAndVerifyPolicyQuarantineRename(
	cms: PolicyQuarantineRenameCms,
	displayedPlan: PolicyQuarantineRenamePlan,
): Promise<PolicyQuarantineRenamePlan> {
	const before = buildPolicyQuarantineRenamePlan(await cms.read());
	if (!samePlan(before, displayedPlan)) {
		throw new Error(`${ERROR_PREFIX} state changed before apply; refusing stale plan`);
	}
	let writeAttempted = false;
	try {
		if (before.action === 'rename') {
			writeAttempted = true;
			await cms.patch(TARGET_POLICY_ID, before.patch!);
		}

		const after = buildPolicyQuarantineRenamePlan(await cms.read());
		if (after.action !== 'noop') {
			throw new Error(
				`${ERROR_PREFIX} post-apply verification failed: exact target name was not read back`,
			);
		}
		if (!isDeepStrictEqual(after.accessRows, before.accessRows)) {
			throw new Error(
				`${ERROR_PREFIX} post-apply verification failed: raw access projection changed`,
			);
		}
		if (!isDeepStrictEqual(after.preservedFields, before.preservedFields)) {
			throw new Error(
				`${ERROR_PREFIX} post-apply verification failed: preserved policy fields changed`,
			);
		}
		return after;
	} catch (error) {
		if (!writeAttempted) throw error;
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(
			`${ERROR_PREFIX} verification did not complete after PATCH; a name-only write may have occurred: ${detail}`,
		);
	}
}

function dataObject<T>(response: ApiResponse, operation: string): T {
	if (response.status >= 400) {
		throw new Error(
			`${ERROR_PREFIX} ${operation} failed (${response.status})`,
		);
	}
	const data = (response.json as { data?: unknown } | null)?.data;
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		throw new Error(`${ERROR_PREFIX} ${operation} returned non-object data`);
	}
	return data as T;
}

function dataRows<T>(response: ApiResponse, operation: string): T[] {
	if (response.status >= 400) {
		throw new Error(
			`${ERROR_PREFIX} ${operation} failed (${response.status})`,
		);
	}
	const data = (response.json as { data?: unknown } | null)?.data;
	if (!Array.isArray(data)) {
		throw new Error(`${ERROR_PREFIX} ${operation} returned non-array data`);
	}
	return data as T[];
}

function policyPath(): string {
	const params = new URLSearchParams();
	params.set(
		'fields',
		'id,name,admin_access,app_access,icon,description,ip_access,enforce_tfa',
	);
	return `/policies/${encodeURIComponent(TARGET_POLICY_ID)}?${params.toString()}`;
}

function accessPath(): string {
	const params = new URLSearchParams();
	params.set('fields', 'id,policy,role,user,sort');
	params.set('filter[policy][_eq]', TARGET_POLICY_ID);
	params.set('limit', '-1');
	return `/access?${params.toString()}`;
}

function matchingPoliciesPath(): string {
	const params = new URLSearchParams();
	params.set('fields', 'id,name');
	params.set('filter[_or][0][name][_eq]', CURRENT_POLICY_NAME);
	params.set('filter[_or][1][name][_eq]', TARGET_POLICY_NAME);
	params.set('limit', '-1');
	return `/policies?${params.toString()}`;
}

function permissionsPath(): string {
	const params = new URLSearchParams();
	params.set('fields', 'id');
	params.set('filter[policy][_eq]', TARGET_POLICY_ID);
	params.set('limit', '-1');
	return `/permissions?${params.toString()}`;
}

export function createPolicyQuarantineRenameCms(
	api: PolicyQuarantineRenameApiRequest,
): PolicyQuarantineRenameCms {
	return {
		read: async () => {
			const policy = dataObject<PolicyRow>(
				await api('GET', policyPath()),
				`GET /policies/${TARGET_POLICY_ID}`,
			);
			const access = dataRows<unknown>(
				await api('GET', accessPath()),
				'GET /access',
			);
			const permissions = dataRows<PermissionIdentityRow>(
				await api('GET', permissionsPath()),
				'GET /permissions',
			);
			const matchingPolicies = dataRows<MatchingPolicyRow>(
				await api('GET', matchingPoliciesPath()),
				'GET /policies name topology',
			);
			return { policy, access, permissions, matchingPolicies };
		},
		patch: async (id, body) => {
			if (id !== TARGET_POLICY_ID) {
				throw new Error(
					`${ERROR_PREFIX} internal guard: PATCH requires exact target policy id`,
				);
			}
			const keys = Object.keys(body);
			if (keys.length !== 1 || keys[0] !== 'name') {
				throw new Error(
					`${ERROR_PREFIX} internal guard: PATCH body must contain name only`,
				);
			}
			if (body.name !== TARGET_POLICY_NAME) {
				throw new Error(
					`${ERROR_PREFIX} internal guard: PATCH requires exact quarantine name`,
				);
			}
			const response = await api(
				'PATCH',
				`/policies/${encodeURIComponent(TARGET_POLICY_ID)}`,
				{ name: TARGET_POLICY_NAME },
			);
			if (response.status >= 400) {
				throw new Error(
					`${ERROR_PREFIX} PATCH /policies/${TARGET_POLICY_ID} failed (${response.status})`,
				);
			}
		},
	};
}

async function main(): Promise<void> {
	const options = parseQuarantineRenameArgs(process.argv.slice(2));
	const ctx: ApplyContext = {
		directusUrl: options.directusUrl,
		token: requireStaticAdminToken(),
	};
	const api: PolicyQuarantineRenameApiRequest = (method, path, body) =>
		rest(ctx, method, path, body);
	const cms = createPolicyQuarantineRenameCms(api);
	const plan = buildPolicyQuarantineRenamePlan(await cms.read());
	console.log(formatPolicyQuarantineRenamePlan(plan, 0));
	const log = createLogger('permission-policy-quarantine-name');
	if (!options.apply) {
		log.info('dry-run complete: production was read; no writes were sent.');
		return;
	}
	const verified = await applyAndVerifyPolicyQuarantineRename(cms, plan);
	const writesSent = plan.action === 'rename' ? 1 : 0;
	log.info(
		`apply verified: ${formatPolicyQuarantineRenamePlan(verified, writesSent)}`,
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(`${ERROR_PREFIX} FAILED:`, error);
		process.exit(1);
	});
}
