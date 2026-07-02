/**
 * SiteMeta Zod schema for the export-fallbacks pipeline.
 *
 * Mirrors `apps/web/src/lib/schemas/meta.ts` SiteMetaSchema. Kept standalone
 * (no apps/web import) because the apps/web schema file imports types via
 * `$lib/types` which doesn't resolve outside SvelteKit. If shapes drift, the
 * P7 drift verification + P9 `bun run check` (apps/web tsc) catches it.
 */

import { z } from 'zod';
import { LocalizedStringSchema } from '@repo/shared';

export const SiteLinksSchema = z.object({
	email: z.string(),
	github: z.string(),
	linkedin: z.string().optional(),
	upwork: z.string().optional(),
});

export const SiteAddressSchema = z.object({
	locality: z.string(),
	region: z.string(),
	country: z.string(),
});

export const SiteOwnerSchema = z.object({
	name: z.string(),
	jobTitle: LocalizedStringSchema,
	phone: z.string().optional(),
	address: SiteAddressSchema,
	knowsAbout: z.array(z.string()).readonly(),
});

export const SiteMetaSchema = z.object({
	name: z.string(),
	tagline: LocalizedStringSchema,
	description: LocalizedStringSchema,
	links: SiteLinksSchema,
	owner: SiteOwnerSchema,
});

export type SiteMeta = z.infer<typeof SiteMetaSchema>;

/**
 * SiteSeoDefaults Zod schema for the export-fallbacks pipeline.
 *
 * Mirrors `apps/web/src/lib/schemas/site-seo-defaults.ts`. Sourced from the
 * same `site_meta` singleton row as SiteMetaSchema — defaultOgImage (UUID or
 * null), themeColor (6-digit hex), and defaultDescription (localized).
 */
export const SiteSeoDefaultsSchema = z.object({
	defaultOgImage: z.string().uuid().nullable(),
	themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	defaultDescription: LocalizedStringSchema,
});

export type SiteSeoDefaults = z.infer<typeof SiteSeoDefaultsSchema>;
