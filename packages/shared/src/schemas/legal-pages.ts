import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { LocalizedBlockEditorDocSchema } from '../types/blocks';

export const LegalPageSchema = z.object({
	slug: z.string().min(1),
	title: LocalizedStringSchema,
	body: LocalizedBlockEditorDocSchema,
});

export type LegalPage = z.infer<typeof LegalPageSchema>;
