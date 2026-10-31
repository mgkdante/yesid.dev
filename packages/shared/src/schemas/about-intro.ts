import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const AboutIntroContentSchema = z.object({
	name: LocalizedStringSchema,
	title: LocalizedStringSchema,
	bio: LocalizedStringSchema,
	moreLink: LocalizedStringSchema,
});

export type AboutIntroContent = z.infer<typeof AboutIntroContentSchema>;
