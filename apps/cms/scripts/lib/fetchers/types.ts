/**
 * Shared types for the per-module fetchers under apps/cms/scripts/lib/fetchers/.
 * Each fetcher exports a `fetch<Name>(client)` async function that returns
 * Zod-validated data ready for the P4 emitter to write to a TS module.
 */

import type { DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';

export type CmsClient = DirectusClient<object> & StaticTokenClient<object> & RestClient<object>;

export interface FetcherContext {
	client: CmsClient;
}
