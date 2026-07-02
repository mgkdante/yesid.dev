/**
 * Directus SDK client factory + env helpers.
 *
 * Extracted from seed-services.ts in 18c Task 25 (F7). Consumed by every
 * script in apps/cms/scripts/ that needs a Directus REST client.
 */

import { createDirectus, rest, staticToken } from '@directus/sdk';
import type { DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';
import { createQueuedFetch } from './queued-fetch';

/**
 * Default Directus URL for ops scripts. Reads `PUBLIC_DIRECTUS_URL` from env
 * (matches apps/web's runtime convention); falls back to the dev domain
 * (slice-18m P6: defaults flipped from prod → dev now that cms.dev.yesid.dev
 * mirrors prod via Neon branch reset, so local + Vercel preview builds default
 * to dev unless `PUBLIC_DIRECTUS_URL` is set to prod explicitly in env).
 * Scripts can override by passing an explicit URL to createClient().
 */
export function defaultDirectusUrl(): string {
	return process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.dev.yesid.dev';
}

/** The only hostname mutating ops scripts may target. */
export const DEV_CMS_HOSTNAME = 'cms.dev.yesid.dev';

/**
 * Guard: refuse to run a mutating ops script against anything but the dev
 * Directus instance. Every seed / migration / content script calls this right
 * after resolving its target URL, so a stray prod URL aborts before any write.
 * Prod promotion is a separate, deliberate, operator-gated path.
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
