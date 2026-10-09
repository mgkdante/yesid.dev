#!/usr/bin/env bun
import { createHash } from 'node:crypto';
import { mkdir, open, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import declaration from '../directus/production/buildbot-cover-permission.json';
import { normalizePermissionPayload, type LivePermissionRow } from './lib/permission-control-drift';
import { parseProductionOnlyWriteCli } from './lib/prod-gate';

type Manifest = typeof declaration;
type State = Record<keyof Manifest['expected'], unknown[]> & { permissions: LivePermissionRow[] };
type Api = (method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown) => Promise<{ status: number; json: unknown }>;
type Options = { apply: boolean; approvalSha256?: string; rollback?: Receipt };
export interface Receipt {
	version: 1;
	target: string;
	manifestSha256: string;
	planSha256: string;
	operation: 'create' | 'noop' | 'delete';
	permissionId: number | null;
	createdId: number | null;
	observedId?: number | null;
	status: 'preview' | 'prepared' | 'created' | 'verified' | 'uncertain' | 'rolled-back';
	grant: Manifest['grant'];
	beforePermissionsSha256: string;
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') {
		const row = value as Record<string, unknown>;
		return Object.fromEntries(Object.keys(row).sort().map(key => [key, canonical(row[key])]));
	}
	return value;
}
function hash(value: unknown): string {
	return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
function rowsHash(rows: unknown[]): string {
	return hash(rows.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
}
function normalizedPermission(row: LivePermissionRow) {
	return { id: row.id, policy: row.policy, collection: row.collection, action: row.action, ...normalizePermissionPayload(row) };
}
function permissionsHash(rows: LivePermissionRow[]): string {
	return hash(rows.map(normalizedPermission).sort((a, b) => Number(a.id) - Number(b.id)));
}
function requireEqual(actual: unknown, expected: unknown, label: string): void {
	if (hash(actual) !== hash(expected)) throw new Error(`cover permission: ${label} changed; refusing`);
}
function permissionId(row: LivePermissionRow): number {
	if (typeof row.id !== 'number' || !Number.isSafeInteger(row.id) || row.id <= 0) throw new Error('cover permission: invalid permission id');
	return row.id;
}
function query(path: string, fields: string, filters: Record<string, string>) {
	return `${path}?${new URLSearchParams({ fields, limit: '-1', ...filters })}`;
}
function data(response: Awaited<ReturnType<Api>>): unknown {
	if (response.status < 200 || response.status >= 300) throw new Error(`cover permission: CMS request failed (${response.status})`);
	return (response.json as { data?: unknown } | null)?.data;
}
async function readState(spec: Manifest, api: Api): Promise<State> {
	const role = spec.expected.roles[0]!;
	const user = spec.expected.users[0]!;
	const paths = {
		roles: query('/roles', 'id,name,parent', { 'filter[name][_eq]': role.name }),
		users: query('/users', 'id,status,role', { 'filter[role][_eq]': role.id }),
		access: query('/access', 'id,role,user,policy', { 'filter[_or][0][role][_eq]': role.id, 'filter[_or][1][user][_eq]': user.id }),
		recipients: query('/access', 'id,role,user,policy', { 'filter[policy][_eq]': spec.grant.policy }),
		policies: query('/policies', 'id,name,admin_access,app_access,enforce_tfa,ip_access', { 'filter[name][_eq]': spec.expected.policies[0]!.name }),
		permissions: query('/permissions', 'id,policy,collection,action,fields,permissions,validation,presets', { 'filter[policy][_eq]': spec.grant.policy }),
		blogs: query('/items/blog_posts', 'id,translation_key,lang,status,cover_image.id,cover_image.title,cover_image.description', { 'filter[translation_key][_in]': [...new Set(spec.expected.blogs.map(b => b.translation_key))].join(',') }),
	};
	const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
		const rows = data(await api('GET', path));
		if (!Array.isArray(rows)) throw new Error(`cover permission: ${key} returned non-array data`);
		return [key, rows] as const;
	}));
	return Object.fromEntries(entries) as State;
}

function checkState(spec: Manifest, state: State): LivePermissionRow | undefined {
	for (const key of Object.keys(spec.expected) as (keyof Manifest['expected'])[]) {
		requireEqual(rowsHash(state[key]), rowsHash(spec.expected[key]), key);
	}
	const ids = state.permissions.map(permissionId);
	if (new Set(ids).size !== ids.length) throw new Error('cover permission: duplicate permission id');
	const targets = state.permissions.filter(p => p.collection === 'directus_files');
	if (targets.length > 1) throw new Error('cover permission: duplicate or additional file permission');
	const remaining = state.permissions.filter(p => p.collection !== 'directus_files');
	requireEqual(remaining.length, spec.permissionsCount, 'permission count');
	requireEqual(permissionsHash(remaining), spec.permissionsSha256, 'permission preimage');
	const target = targets[0];
	if (target) {
		requireEqual(normalizedPermission(target), normalizedPermission({ id: target.id, ...spec.grant }), 'target payload');
	}
	return target;
}

function plan(spec: Manifest, state: State, rollback?: Receipt): Receipt {
	const target = checkState(spec, state);
	const manifestSha256 = hash(spec);
	let operation: Receipt['operation'] = target ? 'noop' : 'create';
	if (rollback) {
		if (rollback.version !== 1 || rollback.operation !== 'create' || !['created', 'verified'].includes(rollback.status) || rollback.createdId === null) {
			throw new Error('cover permission: rollback receipt has no creation ownership');
		}
		requireEqual(rollback.target, spec.target, 'receipt target');
		requireEqual(rollback.manifestSha256, manifestSha256, 'receipt manifest');
		requireEqual(rollback.beforePermissionsSha256, spec.permissionsSha256, 'receipt preimage');
		requireEqual(rollback.grant, spec.grant, 'receipt grant');
		if (!target || permissionId(target) !== rollback.createdId) throw new Error('cover permission: created row is absent or its id differs');
		operation = 'delete';
	}
	const currentId = target ? permissionId(target) : null;
	const planSha256 = hash({ target: spec.target, manifestSha256, operation, permissionId: currentId, permissionsSha256: permissionsHash(state.permissions) });
	return { version: 1, target: spec.target, manifestSha256, planSha256, operation, permissionId: currentId, createdId: null, status: 'preview', grant: spec.grant, beforePermissionsSha256: spec.permissionsSha256 };
}

export async function reconcile(spec: Manifest, api: Api, options: Options, save: (receipt: Receipt) => Promise<void>): Promise<Receipt> {
	const preview = plan(spec, await readState(spec, api), options.rollback);
	if (!options.apply) { await save(preview); return preview; }
	if (options.approvalSha256 !== preview.planSha256) throw new Error('cover permission: approval hash does not match current plan');
	const receipt: Receipt = { ...preview, status: 'prepared' };
	await save(receipt);
	const immediate = plan(spec, await readState(spec, api), options.rollback);
	requireEqual(immediate.planSha256, preview.planSha256, 'plan before apply');
	if (receipt.operation === 'noop') { receipt.status = 'verified'; await save(receipt); return receipt; }
	if (receipt.operation === 'delete') {
		// The direct lookup is the last comparison before DELETE. Directus offers no CAS;
		// operators must keep other permission writers stopped during this workflow.
		const live = data(await api('GET', `/permissions/${receipt.permissionId}`)) as LivePermissionRow;
		requireEqual(normalizedPermission(live), normalizedPermission({ id: receipt.permissionId!, ...spec.grant }), 'rollback row');
		const response = await api('DELETE', `/permissions/${receipt.permissionId}`);
		if (response.status < 200 || response.status >= 300) throw new Error(`cover permission: DELETE failed (${response.status}); inspect before retry`);
		const remaining = checkState(spec, await readState(spec, api));
		if (remaining) throw new Error('cover permission: rollback did not restore preimage');
		receipt.status = 'rolled-back';
		await save(receipt);
		return receipt;
	}
	let created: LivePermissionRow;
	try {
		created = data(await api('POST', '/permissions', spec.grant)) as LivePermissionRow;
		permissionId(created);
		requireEqual(normalizedPermission(created), normalizedPermission({ id: created.id, ...spec.grant }), 'created response');
	} catch {
		// Never retry POST. A matching observed row after a lost response is not
		// claimed as our creation and cannot authorize deletion via this receipt.
		receipt.status = 'uncertain';
		try {
			const observed = checkState(spec, await readState(spec, api));
			receipt.observedId = observed ? permissionId(observed) : null;
		} catch { receipt.observedId = null; }
		await save(receipt);
		throw new Error('cover permission: POST outcome uncertain; inspect receipt, do not retry or rollback automatically');
	}
	receipt.createdId = permissionId(created);
	receipt.status = 'created';
	await save(receipt);
	const byId = data(await api('GET', `/permissions/${receipt.createdId}`)) as LivePermissionRow;
	requireEqual(normalizedPermission(byId), normalizedPermission(created), 'created row readback');
	const after = checkState(spec, await readState(spec, api));
	if (!after || permissionId(after) !== receipt.createdId) throw new Error('cover permission: new grant missing from readback');
	receipt.status = 'verified';
	await save(receipt);
	return receipt;
}

export function parseCoverArgs(argv: string[], configuredUrl = process.env.PUBLIC_DIRECTUS_URL) {
	const { values } = parseArgs({ args: argv, strict: true, allowPositionals: false, options: {
		target: { type: 'string' }, apply: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, confirm: { type: 'string' },
		'approval-sha256': { type: 'string' }, receipt: { type: 'string' }, rollback: { type: 'string' },
	} });
	for (const flag of ['target', 'apply', 'dry-run', 'confirm', 'approval-sha256', 'receipt', 'rollback']) {
		if (argv.filter(a => a === `--${flag}` || a.startsWith(`--${flag}=`)).length > 1) throw new Error(`cover permission: duplicate --${flag}`);
	}
	const base = [`--target=${values.target}`];
	if (values.apply) base.push('--apply');
	if (values['dry-run']) base.push('--dry-run');
	if (values.confirm !== undefined) base.push(`--confirm=${values.confirm}`);
	const confirmation = values.rollback ? 'ROLLBACK_PROD_BUILDBOT_COVER_PERMISSION' : 'APPLY_PROD_BUILDBOT_COVER_PERMISSION';
	const gate = parseProductionOnlyWriteCli(base, 'buildbot-cover-permission', confirmation, configuredUrl, declaration.target);
	if (values.rollback === '' || values.receipt === '') throw new Error('cover permission: empty receipt path');
	if (gate.apply && (!values.receipt || !/^[a-f0-9]{64}$/.test(values['approval-sha256'] ?? ''))) throw new Error('cover permission: apply needs --receipt and exact --approval-sha256');
	if (!gate.apply && values['approval-sha256']) throw new Error('cover permission: approval hash is only for apply');
	if (values.rollback && values.receipt && resolve(values.rollback) === resolve(values.receipt)) throw new Error('cover permission: preserve the original rollback receipt');
	return { ...gate, approvalSha256: values['approval-sha256'], receipt: values.receipt, rollback: values.rollback };
}

async function main() {
	const args = parseCoverArgs(process.argv.slice(2));
	const policies = await Bun.file(new URL('../directus/collections/policies.json', import.meta.url)).json();
	const matches = policies.filter((p: { _syncId: string; name: string }) => p._syncId === declaration.policySyncId && p.name === declaration.expected.policies[0]!.name);
	if (matches.length !== 1) throw new Error('cover permission: canonical policy reference mismatch');
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token || token.startsWith('op://')) throw new Error('cover permission: resolved DIRECTUS_ADMIN_TOKEN required');
	const rollback = args.rollback ? await Bun.file(args.rollback).json() as Receipt : undefined;
	const api: Api = async (method, path, body) => {
		try {
			const response = await fetch(`${args.directusUrl}${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(30_000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
			const raw = await response.text();
			return { status: response.status, json: raw ? JSON.parse(raw) : null };
		} catch { throw new Error('cover permission: CMS transport failed'); }
	};
	// Create the receipt exclusively before any request; never overwrite evidence
	// from a prior run. Each update uses fsync + rename within the same directory.
	if (args.receipt) {
		await mkdir(dirname(resolve(args.receipt)), { recursive: true });
		const file = await open(args.receipt, 'wx');
		await file.close();
	}
	const save = async (receipt: Receipt) => {
		if (!args.receipt) return;
		const temp = `${args.receipt}.tmp`;
		const file = await open(temp, 'w');
		try { await file.writeFile(JSON.stringify(receipt, null, 2) + '\n'); await file.sync(); }
		finally { await file.close(); }
		await rename(temp, args.receipt);
	};
	const receipt = await reconcile(declaration, api, { ...args, rollback }, save);
	console.log(JSON.stringify(receipt, null, 2));
}

if (import.meta.main) main().catch(error => {
	console.error(error instanceof Error ? error.message : 'cover permission: failed');
	process.exitCode = 1;
});
