// HeroAnimContentSchema — mirrors HeroAnimContent from types/content.
// Hero scroll-hint chrome (separate block so the hero can render without it).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { HeroAnimContent } from '../types/content';

export const HeroAnimContentSchema = z.object({
	scrollDown: LocalizedStringSchema,
}) satisfies z.ZodType<HeroAnimContent>;
