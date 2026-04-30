#!/usr/bin/env bun
/**
 * Guarded wrapper for directus-sync push.
 *
 * `directus-sync push` can mutate production schema and delete tracked config
 * rows that are missing from the local dump. Keep the casual command guarded;
 * use explicit env acks when you really intend to push.
 */

import { join as joinPath, resolve as resolvePath } from 'node:path';

export const PROD_DIRECTUS_URL = 'https://cms.yesid.dev';
export const PROD_SCHEMA_PUSH_ACK = 'sync-push-can-delete-cms-data';
export const PERMISSIONS_PUSH_ACK = 'permissions-push-can-delete-parallel-work';

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

	const proc = Bun.spawn({
		cmd: [process.execPath, entrypoint, 'push', ...finalArgs],
		cwd: cmsRoot,
		stdout: 'inherit',
		stderr: 'inherit',
		stdin: 'inherit',
	});
	const code = await proc.exited;
	if (code !== 0) process.exit(code);
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[sync-push] FAILED:', err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
