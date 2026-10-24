import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { LocalizedBlockEditorDocSchema } from '../types/blocks';

export const ProjectStatusSchema = z.enum(['public', 'private', 'wip']);

export const ProjectSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedBlockEditorDocSchema,
});

export const ImpactMetricSchema = z.object({
	/** Locale-neutral display value including its unit, such as `30s` or `99.9%`. */
	value: z.string(),
	label: LocalizedStringSchema,
	/** Optional locale-neutral baseline for before-and-after comparisons. */
	before: z.string().optional(),
});

export const ProjectSchema = z.object({
	/** URL-safe, globally unique identity; never localized. */
	slug: z.string().min(1),
	title: LocalizedStringSchema,
	oneLiner: LocalizedStringSchema,
	description: LocalizedBlockEditorDocSchema,
	/** Technology names are not localized. */
	stack: z.array(z.string()),
	/** Tags are not localized. */
	tags: z.array(z.string()),
	/** Public projects appear in listings; private projects stay hidden; wip projects are flagged. */
	status: ProjectStatusSchema,
	featured: z.boolean(),
	repoUrl: z.string().optional(),
	/** Render a non-link private-repository state instead of a repository link. */
	repoPrivate: z.boolean().optional(),
	liveUrl: z.string().optional(),
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
	impactMetric: ImpactMetricSchema.optional(),
	/** Detail-panel metrics; consumers fall back to the single impactMetric when absent. */
	impactMetrics: z.array(ImpactMetricSchema).optional(),
	/** Hero edge metadata; consumers supply defaults for omitted location/environment/version. */
	location: z.string().optional(),
	environment: z.string().optional(),
	version: z.string().optional(),
});

export type ProjectSection = z.infer<typeof ProjectSectionSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type ImpactMetric = z.infer<typeof ImpactMetricSchema>;
export type Project = z.infer<typeof ProjectSchema>;
