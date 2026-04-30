// BlogPageContentSchema — /blog page chrome.
// Slice-18i: minimal stub with `intro`.
// Slice-18i.1 (post-merge polish): added `heading`, `backToDispatches`,
// `backToPersonal` — text the routes were hardcoding before this slice.
// Extend this schema when more chrome migrates to CMS.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const BlogPageContentSchema = z.object({
	intro: LocalizedStringSchema,
	heading: LocalizedStringSchema,
	backToDispatches: LocalizedStringSchema,
	backToPersonal: LocalizedStringSchema,
});

export type BlogPageContent = z.infer<typeof BlogPageContentSchema>;
