// BlogPageContentSchema — /blog page chrome.
// Minimal stub: fields locked in slice-18i Task 1.4 when block_blog_page_content
// is authored in Directus. Extend this schema then, not before.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const BlogPageContentSchema = z.object({
	intro: LocalizedStringSchema,
});

export type BlogPageContent = z.infer<typeof BlogPageContentSchema>;
