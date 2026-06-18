// ServiceSchema — runtime mirror of the Service TS interface in $lib/types.
// Every adapter port that returns service data parses through this schema
// before handing off to the repository layer (see $lib/adapters/static.ts).
//
// Strictness budget (spec D3): mirror TS as-is — no URL/slug tightening.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { Service, ServiceSection, AssertSchemaMatches } from '$lib/types';

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

// Drift detectors — compile error (`true satisfies never`) if a schema and its
// TS interface diverge in either direction.
true satisfies AssertSchemaMatches<z.infer<typeof ServiceSectionSchema>, ServiceSection>;
true satisfies AssertSchemaMatches<z.infer<typeof ServiceSchema>, Service>;
