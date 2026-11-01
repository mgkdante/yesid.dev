/**
 * Shared types for the per-module fetchers under apps/cms/scripts/lib/fetchers/.
 * Each fetcher exports a `fetch<Name>(client)` async function that returns
 * Zod-validated data ready for the P4 emitter to write to a TS module.
 */

import type { RestClient } from '@directus/sdk';

type Row = Record<string, unknown>;

/**
 * Collections the exporter reads by name. Rows stay loose because every fetcher
 * Zod-validates its output; listing the names makes a typo or a dropped
 * collection a type error. `block_*` singletons are read by dynamic name.
 */
export interface CmsSchema {
	about_languages: Row[];
	blog_posts: Row[];
	contact_channels: Row[];
	error_pages: Row[];
	legal_pages: Row[];
	morph_shapes: Row[];
	nav_links: Row[];
	projects: Row[];
	projects_services: Row[];
	route_seo: Row[];
	services: Row[];
	site_meta: Row;
	site_pages: Row[];
}

export type CmsClient = RestClient<CmsSchema>;

export interface FetcherContext {
	client: CmsClient;
}
