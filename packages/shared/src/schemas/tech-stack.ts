// Tech-stack content schema and inferred type, consolidated from apps/web + apps/cms
// (site-hardening-a-plus). History: reshaped in slice-18g (legacy layer/
// domains/connectsTo/proficiency/connectionNotes dropped, 3
// LocalizedBlockEditorDoc body fields added); engine support fields added in
// slice-29.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { LocalizedBlockEditorDocSchema } from '../types/blocks';
import { StackLayerSchema } from './stack-archetypes';
import { IconRecordSchema } from './icon';

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

export type TechStackItem = z.infer<typeof TechStackItemSchema>;
