import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

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
	/** Published only as the telephone in the search-engine data. */
	phone: z.string().min(1).optional(),
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

export const SiteSeoDefaultsSchema = z.object({
	/** Site-wide OG image fallback when a route has no override. */
	defaultOgImage: z.string().uuid().nullable(),
	/** Value emitted by the theme-color meta tag. */
	themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	/** Description fallback when route and data-layer copy are absent. */
	defaultDescription: LocalizedStringSchema,
});

export type SiteLinks = z.infer<typeof SiteLinksSchema>;
export type SiteAddress = z.infer<typeof SiteAddressSchema>;
export type SiteOwner = z.infer<typeof SiteOwnerSchema>;
export type SiteMeta = z.infer<typeof SiteMetaSchema>;
export type SiteSeoDefaults = z.infer<typeof SiteSeoDefaultsSchema>;
