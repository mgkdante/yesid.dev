/**
 * TechStackItem schema mirroring `apps/web/src/lib/schemas/tech-stack.ts`.
 */

import { z } from 'zod';
import { LocalizedBlockEditorDocSchema } from '@repo/shared';
import { LocalizedStringSchema, StackLayerSchema } from '@repo/shared/schemas';
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
