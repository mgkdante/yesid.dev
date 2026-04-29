// ProofReelContentSchema — mirrors ProofReelContent from types/content.
// Home page — Proof Reel (featured projects section).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { ProofReelContent } from '../types/content';

export const ProofReelContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
	sectionLabel: LocalizedStringSchema,
	viewAllLabel: LocalizedStringSchema,
	viewAllHref: z.string(),
	toggleColorAria: LocalizedStringSchema,
	slugs: z.array(z.string()).readonly(),
	images: z.record(z.string(), z.string()).readonly(),
}) satisfies z.ZodType<ProofReelContent>;
