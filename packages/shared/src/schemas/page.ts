// PageSchema — 12-variant discriminated union over all CMS block collections.
// block_journey_panel intentionally excluded: dropped in slice-18i Task 1.0a (commit 55840c1).

import { z } from 'zod';
import {
	HeroContentSchema,
	ManifestoContentSchema,
	ProofReelContentSchema,
	ServicesGridContentSchema,
	CtaContentSchema,
	CloserContentSchema,
	AboutIntroContentSchema,
	AboutContentSchema,
	ContactContentSchema,
	TechStackPageContentSchema,
	BlogPageContentSchema,
	ProjectsPageContentSchema,
} from './index';

export const PageBlockSchema = z.discriminatedUnion('collection', [
	z.object({ collection: z.literal('block_hero'),                    item: HeroContentSchema }),
	z.object({ collection: z.literal('block_manifesto'),               item: ManifestoContentSchema }),
	z.object({ collection: z.literal('block_proof_reel'),              item: ProofReelContentSchema }),
	z.object({ collection: z.literal('block_services_grid'),           item: ServicesGridContentSchema }),
	z.object({ collection: z.literal('block_cta'),                     item: CtaContentSchema }),
	z.object({ collection: z.literal('block_closer'),                  item: CloserContentSchema }),
	z.object({ collection: z.literal('block_about_intro'),             item: AboutIntroContentSchema }),
	z.object({ collection: z.literal('block_about_content'),           item: AboutContentSchema }),
	z.object({ collection: z.literal('block_contact_content'),         item: ContactContentSchema }),
	z.object({ collection: z.literal('block_tech_stack_page_content'), item: TechStackPageContentSchema }),
	z.object({ collection: z.literal('block_blog_page_content'),       item: BlogPageContentSchema }),
	z.object({ collection: z.literal('block_projects_page_content'),   item: ProjectsPageContentSchema }),
]);

export const PageSchema = z.object({
	id: z.string(),
	slug: z.string(),
	status: z.enum(['draft', 'published']),
	title: z.string(),
	blocks: z.array(PageBlockSchema).readonly(),
});

export type PageBlock = z.infer<typeof PageBlockSchema>;
export type PageData = z.infer<typeof PageSchema>;
