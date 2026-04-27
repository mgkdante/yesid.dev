// Tech-stack schemas — runtime mirror of TechStackItem from $lib/types.
// Reshaped in slice-18g (Phase 4 Task 7): legacy layer/domains/connectsTo/
// proficiency/connectionNotes fields dropped; 3 LocalizedBlockEditorDoc body
// fields added. TechRelationSchema + StackScenarioSchema removed — those
// types were dropped from @repo/shared.
//
// InfraLayerSchema, DomainClusterSchema, ProficiencySchema kept — still
// referenced by legacy /tech-stack components (slice-18k cleanup).

import { z } from 'zod';
import type { TechStackItem, InfraLayer, DomainCluster, Proficiency } from '$lib/types';
import { LocalizedBlockEditorDocSchema } from '$lib/schemas/project';
import { IconRecordSchema } from '$lib/schemas/icon';

export const InfraLayerSchema = z.enum([
	'data',
	'backend',
	'api',
	'frontend',
	'mobile',
	'analytics',
	'devops',
	'testing',
	'systems',
]);

export const DomainClusterSchema = z.enum([
	'data-engineering',
	'web-development',
	'mobile-development',
	'analytics-bi',
	'systems-programming',
	'devops-infra',
	'internal-tooling',
]);

export const ProficiencySchema = z.enum(['expert', 'proficient', 'familiar']);

export const TechStackItemSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	icon: IconRecordSchema.nullable(),
	what_it_is: LocalizedBlockEditorDocSchema,
	what_i_use_it_for: LocalizedBlockEditorDocSchema,
	why_i_use_it_instead: LocalizedBlockEditorDocSchema,
	relatedServices: z.array(z.string()),
	relatedProjects: z.array(z.string()),
});

// Drift detectors.
type _InfraLayerCheck = z.infer<typeof InfraLayerSchema> extends InfraLayer
	? InfraLayer extends z.infer<typeof InfraLayerSchema>
		? true
		: false
	: false;
const _infraLayerCheck: _InfraLayerCheck = true;
void _infraLayerCheck;

type _DomainClusterCheck = z.infer<typeof DomainClusterSchema> extends DomainCluster
	? DomainCluster extends z.infer<typeof DomainClusterSchema>
		? true
		: false
	: false;
const _domainClusterCheck: _DomainClusterCheck = true;
void _domainClusterCheck;

type _ProficiencyCheck = z.infer<typeof ProficiencySchema> extends Proficiency
	? Proficiency extends z.infer<typeof ProficiencySchema>
		? true
		: false
	: false;
const _proficiencyCheck: _ProficiencyCheck = true;
void _proficiencyCheck;

type _TechStackItemCheck = z.infer<typeof TechStackItemSchema> extends TechStackItem
	? TechStackItem extends z.infer<typeof TechStackItemSchema>
		? true
		: false
	: false;
const _techStackItemCheck: _TechStackItemCheck = true;
void _techStackItemCheck;
