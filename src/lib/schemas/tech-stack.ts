// Tech-stack schemas — runtime mirror of TechStackItem, TechRelation, and
// StackScenario from $lib/types. Every tech-stack adapter port parses data
// arrays through these schemas before returning to the repository layer.
//
// Strictness budget (spec D3): mirror TS as-is. InfraLayer, DomainCluster,
// and Proficiency are z.enum (free safety — string-literal unions in TS).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type {
	TechStackItem,
	TechRelation,
	StackScenario,
	InfraLayer,
	DomainCluster,
	Proficiency,
} from '$lib/types';

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
	layer: InfraLayerSchema,
	domains: z.array(DomainClusterSchema),
	connectsTo: z.array(z.string()),
	relatedServices: z.array(z.string()),
	relatedProjects: z.array(z.string()),
	icon: z.string(),
	proficiency: ProficiencySchema,
	connectionNotes: z.record(z.string(), z.string()).optional(),
});

export const TechRelationSchema = z.object({
	itemId: z.string(),
	itemName: z.string(),
	contextPhrase: z.string(),
});

export const StackScenarioSchema = z.object({
	id: z.string().min(1),
	domains: z.array(DomainClusterSchema),
	recommended: z.array(z.string()),
	summary: LocalizedStringSchema,
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

type _TechRelationCheck = z.infer<typeof TechRelationSchema> extends TechRelation
	? TechRelation extends z.infer<typeof TechRelationSchema>
		? true
		: false
	: false;
const _techRelationCheck: _TechRelationCheck = true;
void _techRelationCheck;

type _StackScenarioCheck = z.infer<typeof StackScenarioSchema> extends StackScenario
	? StackScenario extends z.infer<typeof StackScenarioSchema>
		? true
		: false
	: false;
const _stackScenarioCheck: _StackScenarioCheck = true;
void _stackScenarioCheck;
