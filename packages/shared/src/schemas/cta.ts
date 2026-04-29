// CtaContentSchema — mirrors CtaContent from types/content.
// Home page — CTA block.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { CtaContent } from '../types/content';

export const CtaContentSchema = z.object({
	heading: LocalizedStringSchema,
	subtitle: LocalizedStringSchema,
	ctaContact: LocalizedStringSchema,
	ctaGithub: LocalizedStringSchema,
}) satisfies z.ZodType<CtaContent>;
