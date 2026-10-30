/**
 * Directus SDK client factory + env helpers.
 *
 * Shared by scripts in apps/cms/scripts/ that need a Directus REST client.
 */

import { createDirectus, rest, staticToken } from '@directus/sdk';
import type { DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';
import { createQueuedFetch } from './queued-fetch';

/** Directus URL for ops scripts: `PUBLIC_DIRECTUS_URL`, else production. */
export function defaultDirectusUrl(): string {
	return process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev';
}

/** Retired DEV host; only the historical asset-registry migration still pins it. */
export const DEV_CMS_HOSTNAME = 'cms.dev.yesid.dev';

/**
 * Guard for the historical asset-registry migration: refuse any target but the
 * retired DEV instance, so that script cannot write to production. Production
 * mutations use their own guarded scripts and the cms workflow.
 *
 * Strict hostname match (2026-07 pipeline-safety sweep): the old substring
 * check let a crafted URL like https://evil.example/cms.dev.yesid.dev pass.
 * An unparseable URL is refused too.
 */
export function assertDevCms(url: string): void {
	let hostname: string;
	try {
		hostname = new URL(url).hostname;
	} catch {
		throw new Error(`Refusing unparseable CMS URL: ${url}. DEV-ONLY.`);
	}
	if (hostname !== DEV_CMS_HOSTNAME) {
		throw new Error(`Refusing non-dev CMS: ${url}. DEV-ONLY.`);
	}
}

/**
 * Read a required env var or throw a loud error with actionable guidance.
 * Use for secrets that have no sensible default (admin tokens, DB URLs, etc.).
 */
export function requireEnv(name: string, hint?: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`Missing required env var: ${name}${hint ? ` (${hint})` : ''}`,
		);
	}
	return value;
}

/**
 * Build a Directus REST client authenticated with a static admin token.
 * Generic over the caller's collection schema; default = unknown.
 *
 * Usage:
 *   interface Schema { services: ServiceRow[] }
 *   const client = createClient<Schema>(url, token);
 *   await client.request(readItems('services', {...}));
 */
export function createClient<TSchema extends object = object>(
	url: string,
	token: string,
): DirectusClient<TSchema> & StaticTokenClient<TSchema> & RestClient<TSchema> {
	const queuedFetch = createQueuedFetch();
	return createDirectus<TSchema>(url, { globals: { fetch: queuedFetch } })
		.with(staticToken(token))
		.with(rest());
}
