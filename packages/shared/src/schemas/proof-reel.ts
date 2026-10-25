import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const ProofReelContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
	sectionLabel: LocalizedStringSchema,
	viewAllLabel: LocalizedStringSchema,
	viewAllHref: z.string(),
	/** Aria-label template containing the {title} placeholder. */
	toggleColorAria: LocalizedStringSchema,
});

export type ProofReelContent = z.infer<typeof ProofReelContentSchema>;
