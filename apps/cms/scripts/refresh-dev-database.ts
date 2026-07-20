#!/usr/bin/env bun

const NEON_API_BASE = 'https://console.neon.tech/api/v2';
const DEV_CMS_URL = 'https://cms.dev.yesid.dev';
const BUILD_BOT_ROLE_NAME = 'Build Bot';
const DEFAULT_POLL_ATTEMPTS = 180;
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

type Fetcher = typeof fetch;

export interface RefreshDevDatabaseOptions {
	neonApiKey: string;
	neonProjectId: string;
	neonBranchId: string;
	directusAdminToken: string;
	directusDevBuildToken: string;
	fetch?: Fetcher;
	sleep?: (milliseconds: number) => Promise<void>;
	maxPollAttempts?: number;
	pollIntervalMs?: number;
	requestTimeoutMs?: number;
}

interface NeonOperation {
	id: string;
	status: string;
}

interface DirectusUser {
	id: string;
	status: string;
}

interface DirectusRole {
	id: string;
	name: string;
}

interface RequestOptions {
	label: string;
	timeoutMs: number;
}

function required(value: string, name: string): string {
	if (!value.trim()) throw new Error(`${name} is required.`);
	return value;
}

async function requestJson<T>(
	fetcher: Fetcher,
	url: string,
	init: RequestInit,
	options: RequestOptions,
): Promise<T> {
	let response: Response;
	try {
		response = await fetcher(url, {
			...init,
			signal: init.signal ?? AbortSignal.timeout(options.timeoutMs),
		});
	} catch {
		throw new Error(`${options.label} could not be reached.`);
	}

	if (!response.ok) {
		throw new Error(`${options.label} failed (HTTP ${response.status}).`);
	}

	try {
		return (await response.json()) as T;
	} catch {
		throw new Error(`${options.label} returned invalid JSON.`);
	}
}

function parseOperation(value: unknown): NeonOperation {
	if (!value || typeof value !== 'object') {
		throw new Error('Neon reset returned an invalid operation.');
	}
	const candidate = value as { id?: unknown; status?: unknown };
	if (typeof candidate.id !== 'string' || typeof candidate.status !== 'string') {
		throw new Error('Neon reset returned an invalid operation.');
	}
	return { id: candidate.id, status: candidate.status };
}

function operationFinished(status: string): boolean {
	return status === 'finished';
}

function operationPending(status: string): boolean {
	return (
		status === 'scheduling' ||
		status === 'running' ||
		status === 'failed' ||
		status === 'cancelling'
	);
}

async function waitForOperation(
	operation: NeonOperation,
	context: {
		fetcher: Fetcher;
		neonApiKey: string;
		neonProjectId: string;
		sleep: (milliseconds: number) => Promise<void>;
		maxPollAttempts: number;
		pollIntervalMs: number;
		requestTimeoutMs: number;
	},
): Promise<void> {
	if (operationFinished(operation.status)) return;
	if (!operationPending(operation.status)) {
		throw new Error(`Neon reset operation stopped with status ${operation.status}.`);
	}

	const operationUrl =
		`${NEON_API_BASE}/projects/${encodeURIComponent(context.neonProjectId)}` +
		`/operations/${encodeURIComponent(operation.id)}`;
	for (let attempt = 0; attempt < context.maxPollAttempts; attempt += 1) {
		if (context.pollIntervalMs > 0) await context.sleep(context.pollIntervalMs);
		const body = await requestJson<{ operation?: unknown }>(
			context.fetcher,
			operationUrl,
			{ headers: { Authorization: `Bearer ${context.neonApiKey}` } },
			{ label: 'Neon reset status request', timeoutMs: context.requestTimeoutMs },
		);
		const current = parseOperation(body.operation);
		if (current.id !== operation.id) {
			throw new Error('Neon reset status returned the wrong operation.');
		}
		if (operationFinished(current.status)) return;
		if (!operationPending(current.status)) {
			throw new Error(`Neon reset operation stopped with status ${current.status}.`);
		}
	}

	throw new Error('Neon reset operation did not finish before the polling limit.');
}

export async function refreshDevDatabase(options: RefreshDevDatabaseOptions): Promise<void> {
	const neonApiKey = required(options.neonApiKey, 'NEON_API_KEY');
	const neonProjectId = required(options.neonProjectId, 'NEON_PROJECT_ID');
	const neonBranchId = required(options.neonBranchId, 'NEON_DEV_BRANCH_ID');
	const directusAdminToken = required(options.directusAdminToken, 'DIRECTUS_ADMIN_TOKEN');
	const directusDevBuildToken = required(
		options.directusDevBuildToken,
		'DIRECTUS_DEV_BUILD_TOKEN',
	);
	if (directusAdminToken === directusDevBuildToken) {
		throw new Error('DIRECTUS_DEV_BUILD_TOKEN must be distinct from DIRECTUS_ADMIN_TOKEN.');
	}

	const fetcher = options.fetch ?? fetch;
	const sleep = options.sleep ?? ((milliseconds) => Bun.sleep(milliseconds));
	const maxPollAttempts = options.maxPollAttempts ?? DEFAULT_POLL_ATTEMPTS;
	const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
	const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
	if (!Number.isInteger(maxPollAttempts) || maxPollAttempts < 1) {
		throw new Error('maxPollAttempts must be a positive integer.');
	}
	if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 0) {
		throw new Error('pollIntervalMs must be a non-negative number.');
	}
	if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
		throw new Error('requestTimeoutMs must be a positive number.');
	}

	const resetUrl =
		`${NEON_API_BASE}/projects/${encodeURIComponent(neonProjectId)}` +
		`/branches/${encodeURIComponent(neonBranchId)}/reset_to_parent`;
	const reset = await requestJson<{ operations?: unknown }>(
		fetcher,
		resetUrl,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${neonApiKey}`,
				'Content-Type': 'application/json',
			},
		},
		{ label: 'Neon reset request', timeoutMs: requestTimeoutMs },
	);
	if (!Array.isArray(reset.operations) || reset.operations.length === 0) {
		throw new Error('Neon reset returned no operations to verify.');
	}

	for (const value of reset.operations) {
		await waitForOperation(parseOperation(value), {
			fetcher,
			neonApiKey,
			neonProjectId,
			sleep,
			maxPollAttempts,
			pollIntervalMs,
			requestTimeoutMs,
		});
	}

	const roleQuery = new URL(`${DEV_CMS_URL}/roles`);
	roleQuery.searchParams.set('filter[name][_eq]', BUILD_BOT_ROLE_NAME);
	roleQuery.searchParams.set('fields', 'id,name');
	roleQuery.searchParams.set('limit', '2');
	const rolesBody = await requestJson<{ data?: unknown }>(
		fetcher,
		roleQuery.toString(),
		{ headers: { Authorization: `Bearer ${directusAdminToken}` } },
		{ label: 'Build Bot role lookup', timeoutMs: requestTimeoutMs },
	);
	if (!Array.isArray(rolesBody.data) || rolesBody.data.length !== 1) {
		throw new Error('Expected exactly one Build Bot role after the Neon reset.');
	}
	const [roleCandidate] = rolesBody.data;
	if (
		!roleCandidate ||
		typeof roleCandidate !== 'object' ||
		typeof (roleCandidate as DirectusRole).id !== 'string' ||
		(roleCandidate as DirectusRole).name !== BUILD_BOT_ROLE_NAME
	) {
		throw new Error('Build Bot role lookup returned an invalid role.');
	}
	const buildBotRole = roleCandidate as DirectusRole;

	const userQuery = new URL(`${DEV_CMS_URL}/users`);
	userQuery.searchParams.set('filter[role][_eq]', buildBotRole.id);
	userQuery.searchParams.set('fields', 'id,status');
	userQuery.searchParams.set('limit', '2');
	const usersBody = await requestJson<{ data?: unknown }>(
		fetcher,
		userQuery.toString(),
		{ headers: { Authorization: `Bearer ${directusAdminToken}` } },
		{ label: 'Build Bot lookup', timeoutMs: requestTimeoutMs },
	);
	if (!Array.isArray(usersBody.data) || usersBody.data.length !== 1) {
		throw new Error('Expected exactly one Build Bot user after the Neon reset.');
	}
	const [candidate] = usersBody.data;
	if (
		!candidate ||
		typeof candidate !== 'object' ||
		typeof (candidate as DirectusUser).id !== 'string' ||
		(candidate as DirectusUser).status !== 'active'
	) {
		throw new Error('Build Bot lookup returned an invalid user.');
	}
	const buildBot = candidate as DirectusUser;

	await requestJson<unknown>(
		fetcher,
		`${DEV_CMS_URL}/users/${encodeURIComponent(buildBot.id)}`,
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${directusAdminToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ token: directusDevBuildToken }),
		},
		{ label: 'Build Bot token patch', timeoutMs: requestTimeoutMs },
	);

	const verification = await requestJson<{ data?: { id?: unknown } }>(
		fetcher,
		`${DEV_CMS_URL}/users/me?fields=id`,
		{ headers: { Authorization: `Bearer ${directusDevBuildToken}` } },
		{ label: 'Build Bot token verification', timeoutMs: requestTimeoutMs },
	);
	if (verification.data?.id !== buildBot.id) {
		throw new Error('Build Bot token verification returned the wrong user.');
	}
}

async function main(): Promise<void> {
	console.log('Neon: resetting the dev branch from its parent...');
	await refreshDevDatabase({
		neonApiKey: process.env.NEON_API_KEY ?? '',
		neonProjectId: process.env.NEON_PROJECT_ID ?? 'sparkling-sky-51665073',
		neonBranchId: process.env.NEON_DEV_BRANCH_ID ?? 'br-divine-union-amd1lou6',
		directusAdminToken: process.env.DIRECTUS_ADMIN_TOKEN ?? '',
		directusDevBuildToken: process.env.DIRECTUS_DEV_BUILD_TOKEN ?? '',
	});
	console.log(
		'Neon reset finished; the distinct dev Build Bot token was rebound and verified.',
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(
			'Database refresh failed:',
			error instanceof Error ? error.message : 'unknown error',
		);
		process.exit(1);
	});
}
