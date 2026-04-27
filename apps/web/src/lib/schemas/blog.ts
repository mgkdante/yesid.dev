// BlogPostSchema — runtime mirror of the BlogPost TS interface in $lib/types.
// Every adapter port that returns blog data parses through this schema before
// handing off to the repository layer.
//
// Strictness budget (spec D3): mirror TS as-is. `date` stays `z.string()`
// rather than `z.iso.date()` — tightening would reject existing seed values
// (no automated tooling currently enforces a date format on blog frontmatter).

import { z } from 'zod';
import { LocaleSchema } from './shared';
import type { BlogPost, BlogCategory, BlogAnimation } from '$lib/types';

export const BlogCategorySchema = z.enum(['professional', 'personal']);

export const BlogAnimationSchema = z.enum(['draw', 'morph', 'draw-fill']);

// AM2.5: title + excerpt are flat strings (blog is mono-language; no translations junction).
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

// Drift detectors.
type _BlogCategoryCheck = z.infer<typeof BlogCategorySchema> extends BlogCategory
	? BlogCategory extends z.infer<typeof BlogCategorySchema>
		? true
		: false
	: false;
const _blogCategoryCheck: _BlogCategoryCheck = true;
void _blogCategoryCheck;

type _BlogAnimationCheck = z.infer<typeof BlogAnimationSchema> extends BlogAnimation
	? BlogAnimation extends z.infer<typeof BlogAnimationSchema>
		? true
		: false
	: false;
const _blogAnimationCheck: _BlogAnimationCheck = true;
void _blogAnimationCheck;

type _BlogPostCheck = z.infer<typeof BlogPostSchema> extends BlogPost
	? BlogPost extends z.infer<typeof BlogPostSchema>
		? true
		: false
	: false;
const _blogPostCheck: _BlogPostCheck = true;
void _blogPostCheck;
