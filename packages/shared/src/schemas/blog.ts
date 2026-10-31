import { z } from 'zod';
import { LocaleSchema } from './shared';

export const BlogCategorySchema = z.enum(['professional', 'personal']);

export const BlogAnimationSchema = z.enum(['draw', 'morph', 'draw-fill']);

// One entry per language a post is available in; translationKey groups a post's languages.
export const BlogPostSchema = z.object({
	/** The CMS post key, shared by every language of the post. */
	translationKey: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	slug: z.string().min(1),
	title: z.string().min(1),
	excerpt: z.string().min(1),
	/** ISO date string (YYYY-MM-DD); format is not validated here. */
	date: z.string(),
	/** Last-updated date used by Article/BlogPosting structured data. */
	dateModified: z.string().optional(),
	/** Language of this entry; a post's languages share translationKey. */
	lang: LocaleSchema,
	category: BlogCategorySchema,
	tags: z.array(z.string()),
	animation: BlogAnimationSchema,
	svg: z.string(),
	/** Internal post path or external article URL. */
	url: z.string(),
	external: z.boolean(),
	/** Title body; the site appends the brand suffix. */
	seoTitle: z.string().min(1).max(60).optional(),
	seoDescription: z.string().min(50).max(200).optional(),
	/** Directus file UUID for OG/Twitter image output. */
	coverImage: z.string().uuid().optional(),
	coverImageAlt: z.string().min(1).max(160).optional(),
});

export type BlogCategory = z.infer<typeof BlogCategorySchema>;
export type BlogAnimation = z.infer<typeof BlogAnimationSchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;
