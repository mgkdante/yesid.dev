#!/usr/bin/env bun
/**
 * Guarded wrapper for directus-sync push.
 *
 * `directus-sync push` can mutate production schema and delete tracked config
 * rows that are missing from the local dump. Keep the casual command guarded;
 * use explicit env acks when you really intend to push.
 *
 * Per-env file-FK protection (slice-18k #120):
 *   `directus_settings.{project_logo, public_foreground, public_favicon}` are
 *   per-env file UUIDs (committed as null per per-env file FK rule, see
 *   README § Operations § Per-env file FK fields). Before invoking directus-
 *   sync push, this wrapper reads the live env's current values for those
 *   fields and merges them into the committed settings.json in place; after
 *   push completes the file is restored from a backup so git stays clean.
 *   This preserves env-specific branding across sync:push runs without
 *   recreating the #120 baked-UUID FK constraint failure.
 */

import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from 'node:fs';
import { join as joinPath, resolve as resolvePath } from 'node:path';
import { getAdminToken } from './lib/auth';

export const PROD_DIRECTUS_URL = 'https://cms.yesid.dev';
export const PROD_SCHEMA_PUSH_ACK = 'sync-push-can-delete-cms-data';
export const PERMISSIONS_PUSH_ACK = 'permissions-push-can-delete-parallel-work';

/** Settings fields that hold per-env file UUIDs. Committed as null in
 *  apps/cms/directus/collections/settings.json (per slice-18k #120 fix); the
 *  live env value is merged in at push-time by this wrapper. See
 *  apps/cms/README.md § Operations § Per-env file FK fields.
 */
export const PROTECTED_SETTINGS_FILE_FK_FIELDS = [
	'project_logo',
	'public_foreground',
	'public_favicon',
] as const;
type ProtectedField = (typeof PROTECTED_SETTINGS_FILE_FK_FIELDS)[number];

interface SettingsRow {
	[key: string]: unknown;
	project_logo?: string | null;
	public_foreground?: string | null;
	public_favicon?: string | null;
}

/** Pure function: merge live env values into the committed settings array
 *  for protected fields where the committed value is null AND the live value
 *  is non-null. Returns the merged copy plus the set of fields actually
 *  merged (for logging). Doesn't touch other fields.
 */
export function mergeProtectedSettingsFields(
	committed: SettingsRow[],
	liveValues: Partial<Record<ProtectedField, string | null>>,
): { merged: SettingsRow[]; mergedFields: ProtectedField[] } {
	if (committed.length === 0) return { merged: committed, mergedFields: [] };
	const row = committed[0]!;
	const mergedRow: SettingsRow = { ...row };
	const mergedFields: ProtectedField[] = [];
	for (const field of PROTECTED_SETTINGS_FILE_FK_FIELDS) {
		const liveValue = liveValues[field];
		if (mergedRow[field] === null && liveValue != null) {
			mergedRow[field] = liveValue;
			mergedFields.push(field);
		}
	}
	return { merged: [mergedRow, ...committed.slice(1)], mergedFields };
}

export interface SyncPushEnv {
	DIRECTUS_URL?: string;
	DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH?: string;
	DIRECTUS_SYNC_PUSH_ACK?: string;
	DIRECTUS_SYNC_INCLUDE_PERMISSIONS?: string;
	DIRECTUS_SYNC_PERMISSIONS_ACK?: string;
}

function isTruthy(value: string | undefined): boolean {
	return ['1', 'true', 'yes', 'y'].includes((value ?? '').toLowerCase());
}

function normalizeUrl(value: string | undefined): string {
	return (value || PROD_DIRECTUS_URL).replace(/\/+$/, '');
}

function readOptionValues(args: readonly string[], names: readonly string[]): string[] {
	const values: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const eq = arg.indexOf('=');
		const name = eq >= 0 ? arg.slice(0, eq) : arg;
		if (!names.includes(name)) continue;
		if (eq >= 0) {
			values.push(arg.slice(eq + 1));
		} else if (i + 1 < args.length) {
			values.push(args[i + 1] ?? '');
			i++;
		}
	}
	return values;
}

function splitCsv(values: readonly string[]): string[] {
	return values
		.flatMap((value) => value.split(','))
		.map((value) => value.trim())
		.filter(Boolean);
}

function upsertCsvOption(
	args: readonly string[],
	names: readonly string[],
	optionName: string,
	value: string,
): string[] {
	const out = [...args];
	for (let i = 0; i < out.length; i++) {
		const arg = out[i] ?? '';
		const eq = arg.indexOf('=');
		const name = eq >= 0 ? arg.slice(0, eq) : arg;
		if (!names.includes(name)) continue;

		if (eq >= 0) {
			const current = splitCsv([arg.slice(eq + 1)]);
			if (!current.includes(value)) current.push(value);
			out[i] = `${name}=${current.join(',')}`;
			return out;
		}

		const current = splitCsv([out[i + 1] ?? '']);
		if (!current.includes(value)) current.push(value);
		out[i + 1] = current.join(',');
		return out;
	}

	return [...out, optionName, value];
}

export function buildDirectusSyncPushArgs(
	userArgs: readonly string[],
	env: SyncPushEnv,
): string[] {
	const targetUrl = normalizeUrl(env.DIRECTUS_URL);
	const isProd = targetUrl === PROD_DIRECTUS_URL;

	if (isProd) {
		if (!isTruthy(env.DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH)) {
			throw new Error(
				`Refusing production sync:push to ${PROD_DIRECTUS_URL}. ` +
					`Set DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH=1 and ` +
					`DIRECTUS_SYNC_PUSH_ACK=${PROD_SCHEMA_PUSH_ACK} after reviewing sync:diff.`,
			);
		}
		if (env.DIRECTUS_SYNC_PUSH_ACK !== PROD_SCHEMA_PUSH_ACK) {
			throw new Error(
				`Missing production push ack. Expected ` +
					`DIRECTUS_SYNC_PUSH_ACK=${PROD_SCHEMA_PUSH_ACK}.`,
			);
		}
	}

	const includePermissions = isTruthy(env.DIRECTUS_SYNC_INCLUDE_PERMISSIONS);
	const onlyCollections = splitCsv(
		readOptionValues(userArgs, ['--only-collections', '-o']),
	);
	const excludeCollections = splitCsv(
		readOptionValues(userArgs, ['--exclude-collections', '-x']),
	);

	if (includePermissions) {
		if (env.DIRECTUS_SYNC_PERMISSIONS_ACK !== PERMISSIONS_PUSH_ACK) {
			throw new Error(
				`Permission collection pushes can delete parallel branch work. ` +
					`Expected DIRECTUS_SYNC_PERMISSIONS_ACK=${PERMISSIONS_PUSH_ACK}.`,
			);
		}
		return [...userArgs];
	}

	if (onlyCollections.includes('permissions')) {
		throw new Error(
			`Refusing permissions sync:push by default. Set ` +
				`DIRECTUS_SYNC_INCLUDE_PERMISSIONS=1 and ` +
				`DIRECTUS_SYNC_PERMISSIONS_ACK=${PERMISSIONS_PUSH_ACK} if this is deliberate.`,
		);
	}

	if (onlyCollections.length > 0 || excludeCollections.includes('permissions')) {
		return [...userArgs];
	}

	return upsertCsvOption(
		userArgs,
		['--exclude-collections', '-x'],
		'--exclude-collections',
		'permissions',
	);
}

/** Returns true if the push will touch directus_settings (i.e., settings
 *  is not in --exclude-collections and either --only-collections is empty
 *  or includes 'settings').
 */
export function syncPushWillTouchSettings(args: readonly string[]): boolean {
	const onlyCollections = splitCsv(readOptionValues(args, ['--only-collections', '-o']));
	const excludeCollections = splitCsv(readOptionValues(args, ['--exclude-collections', '-x']));
	if (excludeCollections.includes('settings') || excludeCollections.includes('directus_settings')) {
		return false;
	}
	if (onlyCollections.length > 0) {
		return onlyCollections.includes('settings') || onlyCollections.includes('directus_settings');
	}
	return true;
}

interface SettingsMergeContext {
	settingsPath: string;
	backupPath: string;
	restoreBackup: () => void;
}

/** Read live env's protected settings, merge into committed settings.json,
 *  write merged version to disk (with backup). Returns context with restore
 *  function for try/finally cleanup. No-op + returns empty restore if push
 *  isn't touching settings, or if there's nothing to merge.
 */
async function preMergeProtectedSettings(
	cmsRoot: string,
	directusUrl: string,
	finalArgs: readonly string[],
): Promise<SettingsMergeContext> {
	const settingsPath = joinPath(cmsRoot, 'directus', 'collections', 'settings.json');
	const backupPath = `${settingsPath}.slice-18k-merge-backup`;
	const noop: SettingsMergeContext = { settingsPath, backupPath, restoreBackup: () => {} };

	if (!syncPushWillTouchSettings(finalArgs)) return noop;
	if (!existsSync(settingsPath)) return noop;

	const committed = JSON.parse(readFileSync(settingsPath, 'utf8')) as SettingsRow[];
	if (committed.length === 0) return noop;

	const nullFks = PROTECTED_SETTINGS_FILE_FK_FIELDS.filter((f) => committed[0]![f] === null);
	if (nullFks.length === 0) return noop;

	// At this point, settings.json has null protected fields AND we're about
	// to push directus_settings. Push WILL wipe live env values for these
	// fields unless we successfully preflight + merge. Fail-closed semantics
	// from here on: any unrecoverable preflight error aborts the push (Codex
	// review P1 + P2 catches on slice-18k Phase 1).
	let token: string;
	try {
		// getAdminToken supports both DIRECTUS_ADMIN_TOKEN/DIRECTUS_TOKEN
		// (static) and DIRECTUS_ADMIN_EMAIL+DIRECTUS_ADMIN_PASSWORD
		// (POST /auth/login fallback). Same auth path directus-sync uses
		// per directus-sync.config.cjs.
		token = await getAdminToken(directusUrl);
	} catch (err) {
		throw new Error(
			`[sync-push] cannot authenticate for settings preflight (${err instanceof Error ? err.message : String(err)}). ` +
				`settings.json has null ${nullFks.join(', ')} which would WIPE live env values on push. ` +
				`Either: (a) set DIRECTUS_ADMIN_TOKEN (or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD), ` +
				`OR (b) run with --exclude-collections directus_settings to skip the settings push entirely.`,
		);
	}

	const fieldList = nullFks.join(',');
	const liveRes = await fetch(`${directusUrl}/settings?fields=${fieldList}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!liveRes.ok) {
		const body = await liveRes.text().catch(() => '');
		throw new Error(
			`[sync-push] failed to read live settings: ${liveRes.status} ${liveRes.statusText}. ` +
				`settings.json has null ${nullFks.join(', ')} which would WIPE live env values on push. Aborting. ` +
				`Either: (a) fix the auth/network/permission error and retry, ` +
				`OR (b) run with --exclude-collections directus_settings to skip the settings push entirely.` +
				(body ? `\nResponse body: ${body.slice(0, 500)}` : ''),
		);
	}
	const liveJson = (await liveRes.json()) as { data?: Partial<Record<ProtectedField, string | null>> };
	const liveValues = liveJson.data ?? {};

	const { merged, mergedFields } = mergeProtectedSettingsFields(committed, liveValues);
	if (mergedFields.length === 0) {
		console.log(`[sync-push] settings: no per-env file FK values to merge (live env's ${nullFks.join(', ')} are all null too)`);
		return noop;
	}

	copyFileSync(settingsPath, backupPath);
	writeFileSync(settingsPath, `${JSON.stringify(merged, null, '\t')}\n`);
	console.log(`[sync-push] settings: merged live env values for ${mergedFields.join(', ')} into committed settings.json (backup at ${backupPath})`);

	return {
		settingsPath,
		backupPath,
		restoreBackup: () => {
			if (existsSync(backupPath)) {
				copyFileSync(backupPath, settingsPath);
				unlinkSync(backupPath);
				console.log(`[sync-push] settings.json restored from backup`);
			}
		},
	};
}

async function main(): Promise<void> {
	const finalArgs = buildDirectusSyncPushArgs(process.argv.slice(2), process.env);
	const cmsRoot = resolvePath(import.meta.dir, '..');
	const entrypoint = joinPath(
		cmsRoot,
		'node_modules',
		'directus-sync',
		'dist',
		'entrypoint.js',
	);

	const directusUrl = (process.env.DIRECTUS_URL || PROD_DIRECTUS_URL).replace(/\/+$/, '');
	const mergeContext = await preMergeProtectedSettings(cmsRoot, directusUrl, finalArgs);

	let exitCode = 0;
	try {
		const proc = Bun.spawn({
			cmd: [process.execPath, entrypoint, 'push', ...finalArgs],
			cwd: cmsRoot,
			stdout: 'inherit',
			stderr: 'inherit',
			stdin: 'inherit',
		});
		exitCode = await proc.exited;
	} finally {
		// Restore BEFORE exiting; calling process.exit() inside the try block
		// would skip this restore and leak the merged settings.json + backup
		// file to disk. (Codex review P2 catch on slice-18k Phase 1.)
		mergeContext.restoreBackup();
	}
	if (exitCode !== 0) process.exit(exitCode);
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[sync-push] FAILED:', err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
