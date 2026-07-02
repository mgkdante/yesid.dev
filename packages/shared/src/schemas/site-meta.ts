// SiteMetaSchema + SiteSeoDefaultsSchema — single runtime mirrors of the
// SiteMeta / SiteSeoDefaults interfaces in ../types/content, both backed by
// the same `site_meta` singleton row. Consolidated here from the apps/web +
// apps/cms copies (site-hardening-a-plus): the owner.phone field-stripping
// bug came from exactly this duplication.
//
// Strictness budget (spec D3): mirror TS as-is. `email`, `github`, etc. stay
// `z.string()` — the TS interface accepts any string for these, and
// tightening to `.email()` / `.url()` here would reject existing seed values.

import { z } from 'zod';
import { LocalizedStringSchema, type AssertSchemaMatches } from './shared';
import type { SiteMeta, SiteLinks, SiteAddress, SiteOwner, SiteSeoDefaults } from '../types/content';

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
	// `knowsAbout` is `readonly string[]` in TS. `.readonly()` makes z.infer
	// produce the same marker so bidirectional drift detection compiles.
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
	defaultOgImage: z.string().uuid().nullable(),
	themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	defaultDescription: LocalizedStringSchema,
});

// Drift detectors — compile error (`true satisfies never`) on schema/type drift.
true satisfies AssertSchemaMatches<z.infer<typeof SiteLinksSchema>, SiteLinks>;
true satisfies AssertSchemaMatches<z.infer<typeof SiteAddressSchema>, SiteAddress>;
true satisfies AssertSchemaMatches<z.infer<typeof SiteOwnerSchema>, SiteOwner>;
true satisfies AssertSchemaMatches<z.infer<typeof SiteMetaSchema>, SiteMeta>;
true satisfies AssertSchemaMatches<z.infer<typeof SiteSeoDefaultsSchema>, SiteSeoDefaults>;
