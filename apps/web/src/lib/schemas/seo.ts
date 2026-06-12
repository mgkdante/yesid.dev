// PageSeoSchema — Zod contract for route-level SEO metadata.
// This IS the contract Payload must honor in Slice 18. Narrowly scoped to
// SEO for 15a; the broader Zod rollout across content/projects/blog/services
// happens in Slice 17c.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { SchemaOrgNodeSchema } from './jsonld';

// Re-export for back-compat — relocated to ./shared in slice-17c so every
// domain schema can consume it without pulling in the SEO graph.
export { LocalizedStringSchema };

export const PageSeoSchema = z.object({
	// Optimum ≤ 60 chars in any locale (SerP truncation). Zod hard-fails > 70;
	// 60–70 is warned in SeoHead dev mode.
	title: LocalizedStringSchema.refine(
		(s) => (s.en.length <= 70) && (!s.fr || s.fr.length <= 70) && (!s.es || s.es.length <= 70),
		{ message: 'title must not exceed 70 characters in any locale' },
	),
	// Optimum 150–160 chars. Zod hard-fails outside 50–200; 50–150 and 160–200
	// are warned in SeoHead dev mode.
	description: LocalizedStringSchema.refine(
		(s) => {
			const ok = (v?: string) => !v || (v.length >= 50 && v.length <= 200);
			return s.en.length >= 50 && s.en.length <= 200 && ok(s.fr) && ok(s.es);
		},
		{ message: 'description must be 50–200 characters in every provided locale' },
	),
	// Canonical ships verbatim into <link rel="canonical"> — must be absolute.
	canonical: z.string().url(),
	ogImage: z
		.object({
			// Relative paths ("/og/default.png") are allowed here by design.
			// SeoHead resolves them against SITE_HOST before emitting og:image.
			// Content authors use root-relative paths; full URLs also work.
			url: z.string().min(1),
			alt: LocalizedStringSchema,
			width: z.number().default(1200),
			height: z.number().default(630),
		})
		.optional(),
	ogType: z.enum(['website', 'article', 'profile']).default('website'),
	noIndex: z.boolean().default(false),
	jsonLd: z.array(SchemaOrgNodeSchema).optional(),
	// AM2.5 (slice-28.6): mono-language pages (blog post bodies) suppress the
	// cross-locale hreflang cluster — they have no locale alternates.
	singleLocale: z.boolean().optional(),
});

export type PageSeo = z.infer<typeof PageSeoSchema>;

// Re-export SchemaOrgNode so consumers (routeSeoEntries) import from the
// single SEO surface. Keeps types.ts's existing `export { PageSeo }` pattern.
export type { SchemaOrgNode } from './jsonld';
