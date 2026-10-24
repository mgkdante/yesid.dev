import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const RouteSeoOverrideSchema = z.object({
	/** Canonical route path beginning with `/`. */
	path: z.string().regex(/^\//),
	/** Null falls back to SiteSeoDefaults.defaultOgImage. */
	ogImage: z.string().uuid().nullable(),
	/** Title body without the brand suffix; null uses the code-owned fallback. */
	title: LocalizedStringSchema.nullable(),
	/** Null falls back to SiteSeoDefaults.defaultDescription. */
	description: LocalizedStringSchema.nullable(),
});

export type RouteSeoOverride = z.infer<typeof RouteSeoOverrideSchema>;
