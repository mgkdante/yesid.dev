// Tech-stack schemas — runtime mirror of TechStackItem from $lib/types.
// Reshaped in slice-18g (Phase 4 Task 7): legacy layer/domains/connectsTo/
// proficiency/connectionNotes fields dropped; 3 LocalizedBlockEditorDoc body
// fields added. TechRelationSchema + StackScenarioSchema removed — those
// types were dropped from @repo/shared.
//
// Slice-28.3 (#79): InfraLayerSchema, DomainClusterSchema, ProficiencySchema
// + their drift detectors deleted — the /tech-stack components that consumed
// them were already removed, leaving zero references.

import { z } from 'zod';
import type { TechStackItem } from '$lib/types';
import { LocalizedStringSchema, StackLayerSchema } from '@repo/shared/schemas';
import { LocalizedBlockEditorDocSchema } from '$lib/schemas/project';
import { IconRecordSchema } from '$lib/schemas/icon';

export const TechStackItemSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	icon: IconRecordSchema.nullable(),
	what_it_is: LocalizedBlockEditorDocSchema,
	what_i_use_it_for: LocalizedBlockEditorDocSchema,
	why_i_use_it_instead: LocalizedBlockEditorDocSchema,
	relatedServices: z.array(z.string()),
	relatedProjects: z.array(z.string()),
	// slice-29 engine support fields — optional, omitted when the CMS has no value.
	layer: StackLayerSchema.optional(),
	enables: LocalizedStringSchema.optional(),
});

// Drift detector.
type _TechStackItemCheck = z.infer<typeof TechStackItemSchema> extends TechStackItem
	? TechStackItem extends z.infer<typeof TechStackItemSchema>
		? true
		: false
	: false;
const _techStackItemCheck: _TechStackItemCheck = true;
void _techStackItemCheck;
