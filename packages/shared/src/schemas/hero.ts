// HeroContentSchema — mirrors HeroContent from types/content.
// Home page hero section (top of /).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { HeroContent } from '../types/content';

export const HeroContentSchema = z.object({
	headline: z.object({
		line1: LocalizedStringSchema,
		line2: LocalizedStringSchema,
		ariaSuffix: LocalizedStringSchema,
	}),
	subheadline: LocalizedStringSchema,
	subtitle: LocalizedStringSchema,
	ctaWork: LocalizedStringSchema,
	ctaContact: LocalizedStringSchema,
	sqlPanel: z.object({
		prompt: LocalizedStringSchema,
		liveLabel: LocalizedStringSchema,
		columns: z.object({
			route: LocalizedStringSchema,
			avgDelayS: LocalizedStringSchema,
			vehicles: LocalizedStringSchema,
		}),
		metaTemplate: LocalizedStringSchema,
	}),
	refreshButton: z.object({
		label: LocalizedStringSchema,
		helper: LocalizedStringSchema,
	}),
}) satisfies z.ZodType<HeroContent>;
