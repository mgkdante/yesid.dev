#!/usr/bin/env bun
/**
 * GET-only evidence for live policies whose name duplicates a desired policy.
 * Personal user fields are never requested or printed.
 */

import { type ApplyContext, rest } from './lib/schema-apply';
import {
	buildPolicyCandidateDiagnostics,
	formatPolicyCandidateDiagnostics,
	type DiagnosticLivePolicyRow,
	type PolicyNameCandidateDiagnostic,
} from './lib/permission-policy-candidate-diagnostic';
import type {
	DesiredPermissionRow,
	LivePermissionRow,
	RepoPolicyRow,
} from './lib/permission-control-drift';

export const PROD_CMS_URL = 'https://cms.yesid.dev';

export interface CandidateDiagnosticArgs {
	directusUrl: typeof PROD_CMS_URL;
}

export interface ApiResponse {
	status: number;
	json: unknown;
}

export type ReadOnlyCandidateApiRequest = (
	method: 'GET',
	path: string,
) => Promise<ApiResponse>;

function normalizeUrl(value: string): string {
	return value.replace(/\/+$/, '');
}

export function parseCandidateDiagnosticArgs(
	argv: readonly string[],
	publicDirectusUrl = process.env.PUBLIC_DIRECTUS_URL,
): CandidateDiagnosticArgs {
	if (
		argv.some(
			(argument) =>
				argument === '--apply' || argument.startsWith('--confirm='),
		)
	) {
		throw new Error(
			'[permission-policy-candidate-diagnostic] diagnostic is read-only; mutation flags are refused',
		);
	}
	const unknown = argv.find(
		(argument) =>
			argument !== '--target=prod' && argument !== '--dry-run',
	);
	if (unknown) {
		if (unknown.startsWith('--target=')) {
			throw new Error(
				'[permission-policy-candidate-diagnostic] diagnostic supports only --target=prod',
			);
		}
		throw new Error(
			`[permission-policy-candidate-diagnostic] unknown argument: ${unknown}`,
		);
	}
	if (argv.filter((argument) => argument === '--target=prod').length !== 1) {
		throw new Error(
			'[permission-policy-candidate-diagnostic] required: exactly one --target=prod',
		);
	}
	const directusUrl = normalizeUrl(publicDirectusUrl ?? PROD_CMS_URL);
	if (directusUrl !== PROD_CMS_URL) {
		throw new Error(
			`[permission-policy-candidate-diagnostic] Unsupported PUBLIC_DIRECTUS_URL: ${directusUrl}`,
		);
	}
	return { directusUrl: PROD_CMS_URL };
}

function dataRows<T>(response: ApiResponse, operation: string): T[] {
	if (response.status >= 400) {
		throw new Error(
			`[permission-policy-candidate-diagnostic] ${operation} failed (${response.status})`,
		);
	}
	const data = (response.json as { data?: unknown } | null)?.data;
	if (!Array.isArray(data)) {
		throw new Error(
			`[permission-policy-candidate-diagnostic] ${operation} returned non-array data`,
		);
	}
	return data as T[];
}

function policyQuery(): string {
	const params = new URLSearchParams();
	params.set(
		'fields',
		'id,name,roles.role.name,users.user.role.name',
	);
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

export async function loadPolicyCandidateDiagnostics(
	api: ReadOnlyCandidateApiRequest,
	repoPolicies: readonly RepoPolicyRow[],
	desiredPermissions: readonly DesiredPermissionRow[],
): Promise<PolicyNameCandidateDiagnostic[]> {
	const livePolicies = dataRows<DiagnosticLivePolicyRow>(
		await api('GET', policyQuery()),
		'GET /policies',
	);
	const livePermissions = dataRows<LivePermissionRow>(
		await api('GET', permissionQuery()),
		'GET /permissions',
	);
	return buildPolicyCandidateDiagnostics(
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
			'[permission-policy-candidate-diagnostic] DIRECTUS_ADMIN_TOKEN is required; password login fallback is disabled',
		);
	}
	return token;
}

async function main(): Promise<void> {
	const options = parseCandidateDiagnosticArgs(process.argv.slice(2));
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
	const api: ReadOnlyCandidateApiRequest = (method, path) =>
		rest(ctx, method, path);
	const diagnostics = await loadPolicyCandidateDiagnostics(
		api,
		repoPolicies,
		desiredPermissions,
	);
	console.log(formatPolicyCandidateDiagnostics(diagnostics));
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[permission-policy-candidate-diagnostic] FAILED:', error);
		process.exit(1);
	});
}
