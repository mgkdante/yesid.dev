// ServiceSchema — single runtime mirror of the Service interface in
// ../types/content. Consolidated here from the apps/web + apps/cms copies
// (site-hardening-a-plus). The cms copy carried a vestigial `icon` field that
// neither the shared type nor any fetcher mapped — dropped here; the drift
// detectors below make that class of divergence a compile error.
//
// Strictness budget (spec D3): mirror TS as-is — no URL/slug tightening.

import { z } from 'zod';
import { LocalizedStringSchema, type AssertSchemaMatches } from './shared';
import type { Service, ServiceSection } from '../types/content';

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
	seoDescription: LocalizedStringSchema.optional(),
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
