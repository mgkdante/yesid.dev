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
	ctaWork: LocalizedStringSchema,
	ctaContact: LocalizedStringSchema,
	ctaWorkHref: z.string(),
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
		/** Values for {updatedAgo}; liveTemplate holds the {seconds} placeholder. */
		stamps: z.object({
			demo: LocalizedStringSchema,
			refreshed: LocalizedStringSchema,
			liveTemplate: LocalizedStringSchema,
		}),
	}),
	refreshButton: z.object({
		label: LocalizedStringSchema,
		helper: LocalizedStringSchema,
		/** Helper when real KPIs are on screen. */
		helperLive: LocalizedStringSchema,
	}),
	/** Scroll-hint copy (block_hero_translations.scroll_down). */
	heroAnim: HeroAnimContentSchema,
});

export type HeroContent = z.infer<typeof HeroContentSchema>;
