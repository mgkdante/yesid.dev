#!/usr/bin/env bun
/**
 * Compare the repository permission declaration with production by semantic
 * identity. This command is deliberately GET-only and cannot apply changes.
 */

import { type ApplyContext, rest } from './lib/schema-apply';
import {
	buildPermissionAudit,
	formatPermissionAudit,
	type DesiredPermissionRow,
	type LivePermissionRow,
	type LivePolicyRow,
	type PermissionAudit,
	type RepoPolicyRow,
} from './lib/permission-control-drift';

export const PROD_CMS_URL = 'https://cms.yesid.dev';

export interface AuditArgs {
	directusUrl: typeof PROD_CMS_URL;
}

export interface ApiResponse {
	status: number;
	json: unknown;
}

export type ReadOnlyApiRequest = (
	method: 'GET',
	path: string,
) => Promise<ApiResponse>;

function normalizeUrl(value: string): string {
	return value.replace(/\/+$/, '');
}

export function parseAuditArgs(
	argv: readonly string[],
	publicDirectusUrl = process.env.PUBLIC_DIRECTUS_URL,
): AuditArgs {
	if (argv.some((argument) => argument === '--apply' || argument.startsWith('--confirm='))) {
		throw new Error(
			'[permission-control-drift] audit is read-only; mutation flags are refused',
		);
	}
	const unknown = argv.find(
		(argument) => argument !== '--target=prod' && argument !== '--dry-run',
	);
	if (unknown) {
		if (unknown.startsWith('--target=')) {
			throw new Error(
				'[permission-control-drift] audit supports only --target=prod',
			);
		}
		throw new Error(
			`[permission-control-drift] unknown argument: ${unknown}`,
		);
	}
	if (argv.filter((argument) => argument === '--target=prod').length !== 1) {
		throw new Error(
			'[permission-control-drift] required: exactly one --target=prod',
		);
	}
	const directusUrl = normalizeUrl(publicDirectusUrl ?? PROD_CMS_URL);
	if (directusUrl !== PROD_CMS_URL) {
		throw new Error(
			`[permission-control-drift] Unsupported PUBLIC_DIRECTUS_URL: ${directusUrl}`,
		);
	}
	return { directusUrl: PROD_CMS_URL };
}

function dataRows<T>(response: ApiResponse, operation: string): T[] {
	if (response.status >= 400) {
		throw new Error(
			`[permission-control-drift] ${operation} failed (${response.status}): ${JSON.stringify(response.json)}`,
		);
	}
	const data = (response.json as { data?: unknown } | null)?.data;
	if (!Array.isArray(data)) {
		throw new Error(
			`[permission-control-drift] ${operation} returned non-array data`,
		);
	}
	return data as T[];
}

function policyQuery(): string {
	const params = new URLSearchParams();
	params.set('fields', 'id,name');
	params.set('limit', '-1');
	return `/policies?${params.toString()}`;
}

function permissionQuery(): string {
	const params = new URLSearchParams();
	params.set(
		'fields',
		'id,policy,collection,action,fields,permissions,validation,presets',
	);
	params.set('limit', '-1');
	return `/permissions?${params.toString()}`;
}

export async function loadPermissionAudit(
	api: ReadOnlyApiRequest,
	repoPolicies: readonly RepoPolicyRow[],
	desiredPermissions: readonly DesiredPermissionRow[],
): Promise<PermissionAudit> {
	const livePolicies = dataRows<LivePolicyRow>(
		await api('GET', policyQuery()),
		'GET /policies',
	);
	const livePermissions = dataRows<LivePermissionRow>(
		await api('GET', permissionQuery()),
		'GET /permissions',
	);
	return buildPermissionAudit(
		repoPolicies,
		desiredPermissions,
		livePolicies,
		livePermissions,
	);
}

async function readRepoJson<T>(path: URL): Promise<T> {
	return (await Bun.file(path).json()) as T;
}

function requireStaticAdminToken(): string {
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) {
		throw new Error(
			'[permission-control-drift] DIRECTUS_ADMIN_TOKEN is required; password login fallback is disabled for this read-only audit',
		);
	}
	return token;
}

async function main(): Promise<void> {
	const options = parseAuditArgs(process.argv.slice(2));
	const repoPolicies = await readRepoJson<RepoPolicyRow[]>(
		new URL('../directus/collections/policies.json', import.meta.url),
	);
	const desiredPermissions = await readRepoJson<DesiredPermissionRow[]>(
		new URL('../directus/collections/permissions.json', import.meta.url),
	);
	const ctx: ApplyContext = {
		directusUrl: options.directusUrl,
		token: requireStaticAdminToken(),
	};
	const api: ReadOnlyApiRequest = (method, path) => rest(ctx, method, path);
	const audit = await loadPermissionAudit(api, repoPolicies, desiredPermissions);
	console.log(formatPermissionAudit(audit));
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[permission-control-drift] FAILED:', error);
		process.exit(1);
	});
}
