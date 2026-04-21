// ProjectSchema — runtime mirror of the Project TS interface in $lib/types.
// Every adapter port that returns project data parses through this schema
// before handing off to the repository layer (see $lib/adapters/static.ts).
//
// Strictness budget (spec D3): mirror TS as-is — no URL/email/slug tightening.
// ProjectStatus is the one enum we mirror as z.enum (free safety, no scope creep).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { Project, ProjectSection, ImpactMetric, ProjectStatus } from '$lib/types';

export const ProjectStatusSchema = z.enum(['public', 'private', 'wip']);

export const ProjectSectionSchema = z.object({
	title: LocalizedStringSchema,
	content: LocalizedStringSchema,
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
	description: LocalizedStringSchema,
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

// Drift detectors — fail to compile if TS interface and schema diverge.
// Bidirectional check catches field adds/removes in either direction.
type _ProjectStatusCheck = z.infer<typeof ProjectStatusSchema> extends ProjectStatus
	? ProjectStatus extends z.infer<typeof ProjectStatusSchema>
		? true
		: false
	: false;
const _projectStatusCheck: _ProjectStatusCheck = true;
void _projectStatusCheck;

type _ProjectSectionCheck = z.infer<typeof ProjectSectionSchema> extends ProjectSection
	? ProjectSection extends z.infer<typeof ProjectSectionSchema>
		? true
		: false
	: false;
const _projectSectionCheck: _ProjectSectionCheck = true;
void _projectSectionCheck;

type _ImpactMetricCheck = z.infer<typeof ImpactMetricSchema> extends ImpactMetric
	? ImpactMetric extends z.infer<typeof ImpactMetricSchema>
		? true
		: false
	: false;
const _impactMetricCheck: _ImpactMetricCheck = true;
void _impactMetricCheck;

type _ProjectCheck = z.infer<typeof ProjectSchema> extends Project
	? Project extends z.infer<typeof ProjectSchema>
		? true
		: false
	: false;
const _projectCheck: _ProjectCheck = true;
void _projectCheck;
