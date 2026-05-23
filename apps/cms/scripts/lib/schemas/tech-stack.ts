/**
 * TechStackItem schema mirroring `apps/web/src/lib/schemas/tech-stack.ts`.
 */

import { z } from 'zod';
import { LocalizedBlockEditorDocSchema } from './blocks';
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
});

export type TechStackItem = z.infer<typeof TechStackItemSchema>;
