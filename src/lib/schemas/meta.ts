// SiteMetaSchema — runtime mirror of the SiteMeta TS interface in $lib/types.
// The `meta.site` adapter port parses through this before returning to the
// meta repository.
//
// Strictness budget (spec D3): mirror TS as-is. `email`, `github`, etc. stay
// `z.string()` — the TS interface accepts any string for these, and
// tightening to `.email()` / `.url()` here would reject existing seed values.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { SiteMeta, SiteLinks, SiteAddress, SiteOwner } from '$lib/types';

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

// Drift detectors.
type _SiteLinksCheck = z.infer<typeof SiteLinksSchema> extends SiteLinks
	? SiteLinks extends z.infer<typeof SiteLinksSchema>
		? true
		: false
	: false;
const _siteLinksCheck: _SiteLinksCheck = true;
void _siteLinksCheck;

type _SiteAddressCheck = z.infer<typeof SiteAddressSchema> extends SiteAddress
	? SiteAddress extends z.infer<typeof SiteAddressSchema>
		? true
		: false
	: false;
const _siteAddressCheck: _SiteAddressCheck = true;
void _siteAddressCheck;

type _SiteOwnerCheck = z.infer<typeof SiteOwnerSchema> extends SiteOwner
	? SiteOwner extends z.infer<typeof SiteOwnerSchema>
		? true
		: false
	: false;
const _siteOwnerCheck: _SiteOwnerCheck = true;
void _siteOwnerCheck;

type _SiteMetaCheck = z.infer<typeof SiteMetaSchema> extends SiteMeta
	? SiteMeta extends z.infer<typeof SiteMetaSchema>
		? true
		: false
	: false;
const _siteMetaCheck: _SiteMetaCheck = true;
void _siteMetaCheck;
