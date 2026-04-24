/**
 * Directus SDK client factory + env helpers.
 *
 * Extracted from seed-services.ts in 18c Task 25 (F7). Consumed by every
 * script in apps/cms/scripts/ that needs a Directus REST client.
 */

import { createDirectus, rest, staticToken } from '@directus/sdk';
import type { DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';

/**
 * Default Directus URL for ops scripts. Reads `PUBLIC_DIRECTUS_URL` from env
 * (matches apps/web's runtime convention); falls back to the prod domain.
 * Scripts can override by passing an explicit URL to createClient().
 */
export function defaultDirectusUrl(): string {
	return process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev';
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
	return createDirectus<TSchema>(url).with(staticToken(token)).with(rest());
}
