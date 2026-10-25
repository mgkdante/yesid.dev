import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const ServicesGridContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
	/** Aria-label template containing the {title} placeholder. */
	viewIllustrationAria: LocalizedStringSchema,
	viewAllLink: LocalizedStringSchema,
});

export type ServicesGridContent = z.infer<typeof ServicesGridContentSchema>;
