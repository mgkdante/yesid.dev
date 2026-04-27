// RouteSeoOverrideSchema — runtime mirror of the RouteSeoOverride TS interface
// in @repo/shared (slice-18 18h).
//
// Models a per-route override row from the Directus `route_seo` collection.
// title/description are NULLABLE — null means "no override, fall back". The
// composer in apps/web/src/lib/adapters/compose-page-seo.ts merges this with
// SiteSeoDefaults + code-side per-route defaults to produce the final PageSeo.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { RouteSeoOverride } from '$lib/types';

export const RouteSeoOverrideSchema = z.object({
	path: z.string().regex(/^\//),
	ogImage: z.string().uuid().nullable(),
	title: LocalizedStringSchema.nullable(),
	description: LocalizedStringSchema.nullable(),
});

// Drift detector — fails to compile if z.infer<Schema> and RouteSeoOverride
// drift apart in either direction.
type _RouteSeoOverrideCheck = z.infer<typeof RouteSeoOverrideSchema> extends RouteSeoOverride
	? RouteSeoOverride extends z.infer<typeof RouteSeoOverrideSchema>
		? true
		: false
	: false;
const _routeSeoOverrideCheck: _RouteSeoOverrideCheck = true;
void _routeSeoOverrideCheck;
