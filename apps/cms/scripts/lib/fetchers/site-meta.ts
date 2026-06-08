/**
 * site-meta fetcher — reads the Directus `site_meta` singleton, flattens its
 * translations into LocalizedString, and returns a SiteMeta object matching
 * the shape `apps/web/src/lib/content/site-meta.ts` exports today.
 *
 * Mirrors the runtime adapter's `meta.site()` impl
 * (apps/web/src/lib/adapters/directus.ts ~L2100 toSiteMeta + L2183 fetchSingletonRow).
 */

import { readSingleton } from '@directus/sdk';
import { toLocalizedString } from '../locale';
import { SiteMetaSchema, SiteSeoDefaultsSchema, type SiteMeta, type SiteSeoDefaults } from '../schemas/site-meta';
import type { FetcherContext } from './types';

// Mirror of DirectusSiteMetaRow from apps/web/src/lib/adapters/directus.ts.
// Inlined here so this fetcher compiles without crossing the apps/web boundary.
export interface DirectusSiteMetaTranslation {
	languages_code: string;
	tagline?: string | null;
	description?: string | null;
	default_description?: string | null;
	owner_job_title?: string | null;
}

export interface DirectusSiteMetaRow {
	id: number;
	name: string;
	email: string;
	github_url: string;
	linkedin_url?: string | null;
	upwork_url?: string | null;
	owner_name: string;
	owner_locality: string;
	owner_region: string;
	owner_country: string;
	owner_knows_about: string[] | string | null;
	default_og_image: string | null;
	theme_color: string;
	translations?: DirectusSiteMetaTranslation[];
}

/** Pure transform — DirectusSiteMetaRow → SiteMeta. Tested standalone. */
export function toSiteMeta(row: DirectusSiteMetaRow): SiteMeta {
	const links: SiteMeta['links'] = {
		email: row.email,
		github: row.github_url,
		...(row.linkedin_url && { linkedin: row.linkedin_url }),
		...(row.upwork_url && { upwork: row.upwork_url }),
	};
	// Directus' cast-csv returns string[] in REST; tolerate the raw string fallback
	// for non-SDK paths and gracefully handle a null/undefined column.
	const rawKnowsSource = row.owner_knows_about ?? [];
	const rawKnows: readonly string[] =
		typeof rawKnowsSource === 'string' ? rawKnowsSource.split(',') : rawKnowsSource;
	const knowsAbout = rawKnows.map((s) => s.trim()).filter(Boolean);
	return {
		name: row.name,
		tagline: toLocalizedString(row.translations, 'tagline'),
		description: toLocalizedString(row.translations, 'description'),
		links,
		owner: {
			name: row.owner_name,
			jobTitle: toLocalizedString(row.translations, 'owner_job_title'),
			address: {
				locality: row.owner_locality,
				region: row.owner_region,
				country: row.owner_country,
			},
			knowsAbout,
		},
	};
}

/**
 * SiteSeoDefaults transform — DirectusSiteMetaRow → SiteSeoDefaults.
 * Mirrors `toSiteSeoDefaults` from apps/web/src/lib/adapters/directus.ts.
 * Sourced from the same singleton row as toSiteMeta — no extra network call.
 */
export function toSiteSeoDefaults(row: DirectusSiteMetaRow): SiteSeoDefaults {
	return {
		defaultOgImage: row.default_og_image,
		themeColor: row.theme_color,
		defaultDescription: toLocalizedString(row.translations, 'default_description'),
	};
}

/** Fetch + validate the SiteSeoDefaults shape. Re-uses the same singleton row as fetchSiteMeta. */
export async function fetchSiteSeoDefaults({ client }: FetcherContext): Promise<SiteSeoDefaults> {
	const row = (await client.request(
		readSingleton('site_meta', {
			fields: [
				'default_og_image',
				'theme_color',
				{
					translations: [
						'languages_code',
						'default_description',
					],
				} as unknown as string,
			],
		}),
	)) as unknown as DirectusSiteMetaRow;
	return SiteSeoDefaultsSchema.parse(toSiteSeoDefaults(row));
}

/** Fetch + validate. Throws on Zod parse failure (loud over silent corruption). */
export async function fetchSiteMeta({ client }: FetcherContext): Promise<SiteMeta> {
	const row = (await client.request(
		readSingleton('site_meta', {
			fields: [
				'id',
				'name',
				'email',
				'github_url',
				'linkedin_url',
				'upwork_url',
				'owner_name',
				'owner_locality',
				'owner_region',
				'owner_country',
				'owner_knows_about',
				'default_og_image',
				'theme_color',
				{
					translations: [
						'languages_code',
						'tagline',
						'description',
						'default_description',
						'owner_job_title',
					],
				} as unknown as string,
			],
		}),
	)) as unknown as DirectusSiteMetaRow;
	return SiteMetaSchema.parse(toSiteMeta(row));
}
