import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const HeroAnimContentSchema = z.object({
	scrollDown: LocalizedStringSchema,
});

export type HeroAnimContent = z.infer<typeof HeroAnimContentSchema>;
