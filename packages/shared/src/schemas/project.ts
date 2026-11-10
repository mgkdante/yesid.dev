import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { LocalizedBlockEditorDocSchema } from '../types/blocks';
import { ImpactMetricSchema } from './impact-metric';
export { ImpactMetricSchema, type ImpactMetric } from './impact-metric';

export const ProjectStatusSchema = z.enum(['public', 'private', 'wip']);

export const ProjectSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedBlockEditorDocSchema,
});

export const ProjectSchema = z.object({
	/** URL-safe, globally unique identity; never localized. */
	slug: z.string().min(1),
	title: LocalizedStringSchema,
	// The CMS field allows 500, but the 1200×630 card supports at most 200
	// normalized characters at a legible 18px minimum. Fail export, never clip.
	oneLiner: LocalizedStringSchema.superRefine((copy, ctx) => {
		for (const [locale, text] of Object.entries(copy)) {
			if (text && text.replace(/\s+/gu, ' ').trim().length > 200) {
				ctx.addIssue({ code: 'custom', path: [locale], message: 'Project one-liner exceeds the OG card maximum of 200 characters (after whitespace normalization). Shorten one_liner before exporting.' });
			}
		}
	}),
	description: LocalizedBlockEditorDocSchema,
	/** Technology names are not localized. */
	stack: z.array(z.string()),
	/** Tags are not localized. */
	/** Public projects appear in listings; private projects stay hidden; wip projects are flagged. */
	status: ProjectStatusSchema,
	featured: z.boolean(),
	repoUrl: z.string().optional(),
	/** Render a non-link private-repository state instead of a repository link. */
	repoPrivate: z.boolean().optional(),
	liveUrl: z.string().optional(),
	/** Published public documentation (the architecture wiki). */
	docsUrl: z.string().optional(),
	/** Directus file UUID for the primary thumbnail/hero; consumers resolve it through the asset helper. */
	image: z.string().optional(),
	/** Optional light-theme variant of the primary hero. */
	imageLight: z.string().optional(),
	/** Optional secondary hero, independent of article gallery order. */
	imageSecondary: z.string().optional(),
	/** Optional light-theme variant of the secondary hero. */
	imageSecondaryLight: z.string().optional(),
	/** Service IDs must reference existing services; their SVGs cascade to linked projects. */
	relatedServices: z.array(z.string()),
	/** GitHub raw README URL, fetched by the route as the final content section. */
	readmeUrl: z.string().optional(),
	sections: z.array(ProjectSectionSchema),
	/** Ordered metrics shared by the detail panels and public text export. */
	impactMetrics: z.array(ImpactMetricSchema).optional(),
	/** Hero edge metadata; consumers supply defaults for omitted location/environment/version. */
	location: z.string().optional(),
	environment: z.string().optional(),
	version: z.string().optional(),
});

/** Listing shape: cards never render the article body, so it stays on the detail route. */
export const ProjectSummarySchema = ProjectSchema.omit({ description: true, sections: true });

export type ProjectSection = z.infer<typeof ProjectSectionSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
