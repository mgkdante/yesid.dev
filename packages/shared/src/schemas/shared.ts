// Cross-block Zod helpers — reused by every content schema in this package.
// LocalizedStringSchema mirrors the LocalizedString interface in ../types/content.
// PageMetaSchema mirrors the PageMeta interface used by about, contact, and tech-stack pages.

import { z } from 'zod';

// Reusable LocalizedString schema. Mirrors the LocalizedString interface in types/content.
// English is required; French and Spanish are optional, filled over time.
// `en` must contain at least one non-whitespace character — an empty or
// whitespace-only string is semantically missing content, not "present".
export const LocalizedStringSchema = z.object({
	en: z
		.string()
		.refine((s) => s.trim().length > 0, {
			message: 'LocalizedString.en is required and must contain non-whitespace content',
		}),
	fr: z.string().optional(),
	es: z.string().optional(),
});

// Locale enum — mirrors the Locale union in types/content.
export const LocaleSchema = z.enum(['en', 'fr', 'es']);

// Page meta — HTML <title> + <meta name="description"> copy.
// Mirrors the PageMeta interface in types/content.
// Reused across about-page, contact-page, and tech-stack-page schemas.
export const PageMetaSchema = z.object({
	title: LocalizedStringSchema,
	description: LocalizedStringSchema,
});
