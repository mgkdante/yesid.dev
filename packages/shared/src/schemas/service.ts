import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { ImpactMetricSchema } from './impact-metric';

export const ServiceSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedStringSchema,
});

export const ServiceSchema = z.object({
	/** Stable kebab-case identifier used by project service links. */
	id: z.string().min(1),
	title: LocalizedStringSchema,
	description: LocalizedStringSchema,
	/** Sequential journey position starting at 1; no fixed maximum. */
	station: z.number(),
	/** Illustration filename that cascades to projects linked to this service. */
	svg: z.string().optional(),
	/** False hides the service from listings and filters; absence defaults to visible. */
	visible: z.boolean().optional(),
	/** Project slugs must reference existing projects. */
	relatedProjects: z.array(z.string()),

	// Detail page fields (all optional for backward compat)
	subtitle: LocalizedStringSchema.optional(),
	valueProposition: LocalizedStringSchema.optional(),
	seoDescription: LocalizedStringSchema.optional(),
	deliverables: z.array(LocalizedStringSchema).optional(),
	stack: z.array(z.string()).optional(),
	sections: z.array(ServiceSectionSchema).optional(),

	// Home page Services Grid fields (Slice 13g)
	benefitHeadline: LocalizedStringSchema.optional(),
	impactMetric: ImpactMetricSchema.optional(),
});

export type ServiceSection = z.infer<typeof ServiceSectionSchema>;
export type Service = z.infer<typeof ServiceSchema>;
