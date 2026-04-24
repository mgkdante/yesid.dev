// ServiceSchema — runtime mirror of the Service TS interface in $lib/types.
// Every adapter port that returns service data parses through this schema
// before handing off to the repository layer (see $lib/adapters/static.ts).
//
// Strictness budget (spec D3): mirror TS as-is — no URL/slug tightening.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { Service, ServiceSection } from '$lib/types';

export const ServiceSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedStringSchema,
});

// Home page Services Grid impact metric — different shape from Project's
// ImpactMetric (both value + label are LocalizedString here). Kept inline
// rather than exported because no other schema references it.
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
	lottieReverse: z.boolean().optional(),
	svg: z.string().optional(),
	visible: z.boolean().optional(),
	relatedProjects: z.array(z.string()),

	// Detail page fields (all optional for backward compat)
	subtitle: LocalizedStringSchema.optional(),
	longDescription: LocalizedStringSchema.optional(),
	valueProposition: LocalizedStringSchema.optional(),
	deliverables: z.array(LocalizedStringSchema).optional(),
	stack: z.array(z.string()).optional(),
	sections: z.array(ServiceSectionSchema).optional(),

	// Home page Services Grid fields (Slice 13g)
	benefitHeadline: LocalizedStringSchema.optional(),
	impactMetric: ServiceImpactMetricSchema.optional(),
});

// Drift detectors — fail to compile if TS interface and schema diverge.
type _ServiceSectionCheck = z.infer<typeof ServiceSectionSchema> extends ServiceSection
	? ServiceSection extends z.infer<typeof ServiceSectionSchema>
		? true
		: false
	: false;
const _serviceSectionCheck: _ServiceSectionCheck = true;
void _serviceSectionCheck;

type _ServiceCheck = z.infer<typeof ServiceSchema> extends Service
	? Service extends z.infer<typeof ServiceSchema>
		? true
		: false
	: false;
const _serviceCheck: _ServiceCheck = true;
void _serviceCheck;
