// BlogPostSchema — single runtime mirror of the BlogPost interface in
// ../types/content. Consolidated here from the apps/web + apps/cms copies
// (site-hardening-a-plus).
//
// Strictness budget (spec D3): mirror TS as-is. `date` stays `z.string()`
// rather than `z.iso.date()` — tightening would reject existing seed values
// (no automated tooling currently enforces a date format on blog frontmatter).

import { z } from 'zod';
import { LocaleSchema, type AssertSchemaMatches } from './shared';
import type { BlogPost, BlogCategory, BlogAnimation } from '../types/content';

export const BlogCategorySchema = z.enum(['professional', 'personal']);

export const BlogAnimationSchema = z.enum(['draw', 'morph', 'draw-fill']);

// AM2.5: title + excerpt are flat strings (blog is mono-language; no translations junction).
export const BlogPostSchema = z.object({
	slug: z.string().min(1),
	title: z.string().min(1),
	excerpt: z.string().min(1),
	date: z.string(),
	dateModified: z.string().optional(),
	lang: LocaleSchema,
	category: BlogCategorySchema,
	tags: z.array(z.string()),
	animation: BlogAnimationSchema,
	svg: z.string(),
	url: z.string(),
	external: z.boolean(),
	seoTitle: z.string().min(1).max(60).optional(),
	seoDescription: z.string().min(50).max(200).optional(),
	coverImage: z.string().uuid().optional(),
	coverImageAlt: z.string().min(1).max(160).optional(),
});

// Drift detectors — compile error (`true satisfies never`) on schema/type drift.
true satisfies AssertSchemaMatches<z.infer<typeof BlogCategorySchema>, BlogCategory>;
true satisfies AssertSchemaMatches<z.infer<typeof BlogAnimationSchema>, BlogAnimation>;
true satisfies AssertSchemaMatches<z.infer<typeof BlogPostSchema>, BlogPost>;
