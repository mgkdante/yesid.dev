import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import { HeroAnimContentSchema } from './hero-anim';

export const HeroContentSchema = z.object({
	headline: z.object({
		line1: LocalizedStringSchema,
		line2: LocalizedStringSchema,
		/** Completes the animated visual headline for assistive technology. */
		ariaSuffix: LocalizedStringSchema,
	}),
	subheadline: LocalizedStringSchema,
	subtitle: LocalizedStringSchema,
	/** Identity kicker above the headline (homework #20): stored human-case,
	 *  rendered ALL CAPS by CSS. */
	identity: LocalizedStringSchema,
	ctaWork: LocalizedStringSchema,
	ctaContact: LocalizedStringSchema,
	sqlPanel: z.object({
		prompt: LocalizedStringSchema,
		/** Badge in the DEMO state (simulated data). */
		liveLabel: LocalizedStringSchema,
		/** Badge when REAL transit KPIs are on screen (homework #2 phase 2). */
		liveBadge: LocalizedStringSchema,
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
		/** Helper when real KPIs are on screen. */
		helperLive: LocalizedStringSchema,
	}),
	/** Scroll-hint copy from the hero_anim column in block_hero_translations. */
	heroAnim: HeroAnimContentSchema,
});

export type HeroContent = z.infer<typeof HeroContentSchema>;
