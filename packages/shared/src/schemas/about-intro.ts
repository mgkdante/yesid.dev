// AboutIntroContentSchema — mirrors AboutIntroContent from types/content.
// Home-page About teaser (NOT the /about page — that is AboutContent/about-page.ts).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { AboutIntroContent } from '../types/content';

export const AboutIntroContentSchema = z.object({
	name: LocalizedStringSchema,
	title: LocalizedStringSchema,
	bio: LocalizedStringSchema,
	moreLink: LocalizedStringSchema,
	stackLabel: LocalizedStringSchema,
	stackItems: z.array(z.string()).readonly(),
	locationLabel: LocalizedStringSchema,
	location: z.object({
		city: LocalizedStringSchema,
		region: LocalizedStringSchema,
	}),
	interestsLabel: LocalizedStringSchema,
	interests: LocalizedStringSchema,
}) satisfies z.ZodType<AboutIntroContent>;
