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
	// Normalize authored copy; export checks the actual OG layout with bundled fonts.
	oneLiner: LocalizedStringSchema.transform((copy) => ({
		...copy,
		en: copy.en.normalize('NFC'),
		...(copy.fr !== undefined ? { fr: copy.fr.normalize('NFC') } : {}),
		...(copy.es !== undefined ? { es: copy.es.normalize('NFC') } : {}),
	})).superRefine((copy, ctx) => {
		for (const [locale, text] of Object.entries(copy)) {
			if (text && /\p{M}{3}/u.test(text)) {
				ctx.addIssue({ code: 'custom', path: [locale], message: 'Project one_liner has more than 2 consecutive combining marks. Remove stacked accents before exporting.' });
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
