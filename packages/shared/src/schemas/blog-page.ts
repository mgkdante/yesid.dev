// BlogPageContentSchema: editorial text of the two blog listings (/blog and
// /blog/personal). Listing and article interface text lives in SiteLabels.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const BlogPageContentSchema = z.object({
	heading: LocalizedStringSchema,
	intro: LocalizedStringSchema,
	personalHeading: LocalizedStringSchema,
	personalIntro: LocalizedStringSchema,
	/** Shown when the active filters match no posts. */
	emptyState: LocalizedStringSchema,
	/** Shown when a listing has no posts at all and no filters are active. */
	emptyStateNoPosts: LocalizedStringSchema,
});

export type BlogPageContent = z.infer<typeof BlogPageContentSchema>;
