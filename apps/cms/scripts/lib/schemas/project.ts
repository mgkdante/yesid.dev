/**
 * Project schemas mirroring `apps/web/src/lib/schemas/project.ts`.
 * Note: ProjectStatus is the LEGACY public/private/wip enum — adapter maps from
 * Directus' draft/published/archived via `statusFromDirectus` before validation.
 */

import { z } from 'zod';
import { LocalizedStringSchema } from '@repo/shared';
import { LocalizedBlockEditorDocSchema } from '@repo/shared';

export const ProjectStatusSchema = z.enum(['public', 'private', 'wip']);

export const ProjectSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedBlockEditorDocSchema,
});

export const ImpactMetricSchema = z.object({
	value: z.string(),
	label: LocalizedStringSchema,
	before: z.string().optional(),
});

export const ProjectSchema = z.object({
	slug: z.string().min(1),
	title: LocalizedStringSchema,
	oneLiner: LocalizedStringSchema,
	description: LocalizedBlockEditorDocSchema,
	stack: z.array(z.string()),
	tags: z.array(z.string()),
	status: ProjectStatusSchema,
	featured: z.boolean(),
	repoUrl: z.string().optional(),
	liveUrl: z.string().optional(),
	image: z.string().optional(),
	relatedServices: z.array(z.string()),
	readmeUrl: z.string().optional(),
	sections: z.array(ProjectSectionSchema),
	impactMetric: ImpactMetricSchema.optional(),
	impactMetrics: z.array(ImpactMetricSchema).optional(),
	location: z.string().optional(),
	environment: z.string().optional(),
	version: z.string().optional(),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type ProjectSection = z.infer<typeof ProjectSectionSchema>;
export type ImpactMetric = z.infer<typeof ImpactMetricSchema>;
export type Project = z.infer<typeof ProjectSchema>;
