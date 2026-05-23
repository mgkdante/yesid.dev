/**
 * BlogPost schemas mirroring `apps/web/src/lib/schemas/blog.ts`.
 * AM2.5: title + excerpt are flat per-row strings (mono-language; no translations junction).
 */

import { z } from 'zod';

// LocaleSchema defined locally — @repo/shared is on Zod 4.x while apps/cms is
// on Zod 3.x; sharing schema instances across major versions fails at runtime.
const LocaleSchema = z.enum(['en', 'fr', 'es']);

export const BlogCategorySchema = z.enum(['professional', 'personal']);
export const BlogAnimationSchema = z.enum(['draw', 'morph', 'draw-fill']);

export const BlogPostSchema = z.object({
	slug: z.string().min(1),
	title: z.string().min(1),
	excerpt: z.string().min(1),
	date: z.string(),
	lang: LocaleSchema,
	category: BlogCategorySchema,
	tags: z.array(z.string()),
	animation: BlogAnimationSchema,
	svg: z.string(),
	url: z.string(),
	external: z.boolean(),
});

export type BlogCategory = z.infer<typeof BlogCategorySchema>;
export type BlogAnimation = z.infer<typeof BlogAnimationSchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;
