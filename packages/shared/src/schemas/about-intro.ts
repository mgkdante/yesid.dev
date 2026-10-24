import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

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
});

export type AboutIntroContent = z.infer<typeof AboutIntroContentSchema>;
