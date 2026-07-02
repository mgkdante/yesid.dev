// Tech-stack schema — single runtime mirror of TechStackItem in
// ../types/content. Consolidated here from the apps/web + apps/cms copies
// (site-hardening-a-plus). History: reshaped in slice-18g (legacy layer/
// domains/connectsTo/proficiency/connectionNotes dropped, 3
// LocalizedBlockEditorDoc body fields added); engine support fields added in
// slice-29.

import { z } from 'zod';
import { LocalizedStringSchema, type AssertSchemaMatches } from './shared';
import { LocalizedBlockEditorDocSchema } from '../types/blocks';
import { StackLayerSchema } from './stack-archetypes';
import { IconRecordSchema } from './icon';
import type { TechStackItem } from '../types/content';

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

// Drift detector — compile error (`true satisfies never`) on schema/type drift.
true satisfies AssertSchemaMatches<z.infer<typeof TechStackItemSchema>, TechStackItem>;
