import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const CtaContentSchema = z.object({
	heading: LocalizedStringSchema,
	subtitle: LocalizedStringSchema,
	ctaContact: LocalizedStringSchema,
	ctaGithub: LocalizedStringSchema,
});

export type CtaContent = z.infer<typeof CtaContentSchema>;
