/**
 * Service schemas mirroring `apps/web/src/lib/schemas/service.ts`.
 */

import { z } from 'zod';
import { LocalizedStringSchema } from '@repo/shared';

export const ServiceSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedStringSchema,
});

const ServiceImpactMetricSchema = z.object({
	value: LocalizedStringSchema,
	label: LocalizedStringSchema,
});

export const ServiceSchema = z.object({
	id: z.string().min(1),
	title: LocalizedStringSchema,
	description: LocalizedStringSchema,
	station: z.number(),
	icon: z.string().optional(),
	svg: z.string().optional(),
	visible: z.boolean().optional(),
	relatedProjects: z.array(z.string()),
	subtitle: LocalizedStringSchema.optional(),
	longDescription: LocalizedStringSchema.optional(),
	valueProposition: LocalizedStringSchema.optional(),
	deliverables: z.array(LocalizedStringSchema).optional(),
	stack: z.array(z.string()).optional(),
	sections: z.array(ServiceSectionSchema).optional(),
	benefitHeadline: LocalizedStringSchema.optional(),
	impactMetric: ServiceImpactMetricSchema.optional(),
});

export type ServiceSection = z.infer<typeof ServiceSectionSchema>;
export type Service = z.infer<typeof ServiceSchema>;
