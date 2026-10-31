import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const ProofReelContentSchema = z.object({
	viewAllLabel: LocalizedStringSchema,
	viewAllHref: z.string(),
});

export type ProofReelContent = z.infer<typeof ProofReelContentSchema>;
