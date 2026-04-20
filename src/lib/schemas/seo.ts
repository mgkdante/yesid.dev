// PageSeoSchema — Zod contract for route-level SEO metadata.
// This IS the contract Payload must honor in Slice 18. Narrowly scoped to
// SEO for 15a; the broader Zod rollout across content/projects/blog/services
// happens in Slice 17c.

import { z } from 'zod';

// Reusable LocalizedString schema. Mirrors the interface in $lib/types.
// English is required; French and Spanish are optional, filled over time.
export const LocalizedStringSchema = z.object({
	en: z.string().min(1, 'LocalizedString.en is required and non-empty'),
	fr: z.string().optional(),
	es: z.string().optional(),
});

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
	canonical: z.string().url(),
	ogImage: z
		.object({
			url: z.string(),
			alt: LocalizedStringSchema,
			width: z.number().default(1200),
			height: z.number().default(630),
		})
		.optional(),
	ogType: z.enum(['website', 'article', 'profile']).default('website'),
	noIndex: z.boolean().default(false),
});

export type PageSeo = z.infer<typeof PageSeoSchema>;
