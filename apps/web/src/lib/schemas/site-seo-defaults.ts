// SiteSeoDefaultsSchema — runtime mirror of the SiteSeoDefaults TS interface
// in @repo/shared (slice-18 18h Q9 amendment).
//
// Backed by the same `site_meta` singleton row as SiteMetaSchema, but exposes
// SEO-defaults shape (defaultOgImage UUID, themeColor hex, defaultDescription).
// Drift detector below mirrors the apps/web/src/lib/schemas/meta.ts §
// _SiteMetaCheck pattern — keeps z.infer ↔ TS interface bidirectionally aligned.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { SiteSeoDefaults, AssertSchemaMatches } from '$lib/types';

export const SiteSeoDefaultsSchema = z.object({
	defaultOgImage: z.string().uuid().nullable(),
	themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	defaultDescription: LocalizedStringSchema,
});

// Drift detector — compile error (`true satisfies never`) on schema/type drift
// in either direction.
true satisfies AssertSchemaMatches<z.infer<typeof SiteSeoDefaultsSchema>, SiteSeoDefaults>;
