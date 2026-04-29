// ServicesGridContentSchema — mirrors ServicesGridContent from types/content.
// Home page — Services grid (section 3).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { ServicesGridContent } from '../types/content';

export const ServicesGridContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
	viewIllustrationAria: LocalizedStringSchema,
	viewAllLink: LocalizedStringSchema,
}) satisfies z.ZodType<ServicesGridContent>;
