// ProjectSchema — runtime mirror of the Project TS interface in $lib/types.
// Every adapter port that returns project data parses through this schema
// before handing off to the repository layer (see $lib/adapters/static.ts).
//
// Strictness budget (spec D3): mirror TS as-is — no URL/email/slug tightening.
// ProjectStatus is the one enum we mirror as z.enum (free safety, no scope creep).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { LocalizedBlockEditorDocSchema } from '@repo/shared';
import type {
	Project,
	ProjectSection,
	ImpactMetric,
	ProjectStatus,
	AssertSchemaMatches,
} from '$lib/types';

export const ProjectStatusSchema = z.enum(['public', 'private', 'wip']);

// LocalizedBlockEditorDocSchema relocated to @repo/shared (slice-28.3 #82);
// re-exported so existing `$lib/schemas/project` consumers keep working.
export { LocalizedBlockEditorDocSchema } from '@repo/shared';

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
	repoPrivate: z.boolean().optional(),
	liveUrl: z.string().optional(),
	image: z.string().optional(),
	imageLight: z.string().optional(),
	imageSecondary: z.string().optional(),
	imageSecondaryLight: z.string().optional(),
	relatedServices: z.array(z.string()),
	readmeUrl: z.string().optional(),
	sections: z.array(ProjectSectionSchema),
	impactMetric: ImpactMetricSchema.optional(),
	impactMetrics: z.array(ImpactMetricSchema).optional(),
	location: z.string().optional(),
	environment: z.string().optional(),
	version: z.string().optional(),
});

// Drift detectors — compile error (`true satisfies never`) if a schema and its
// TS interface diverge in either direction. Bidirectional, catches field
// adds/removes on either side.
true satisfies AssertSchemaMatches<z.infer<typeof ProjectStatusSchema>, ProjectStatus>;
true satisfies AssertSchemaMatches<z.infer<typeof ProjectSectionSchema>, ProjectSection>;
true satisfies AssertSchemaMatches<z.infer<typeof ImpactMetricSchema>, ImpactMetric>;
true satisfies AssertSchemaMatches<z.infer<typeof ProjectSchema>, Project>;
