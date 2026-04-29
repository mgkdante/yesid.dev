// TechStackPageContentSchema — page-level chrome for /tech-stack.
// Relocated from apps/web/src/lib/schemas/ to @repo/shared/schemas
// in slice-18i Task 1.1 Phase B.

import { z } from 'zod';
import { LocalizedStringSchema, PageMetaSchema } from './shared';

// Slice-18g: layers/domains/projects stats dropped — only technologies remains.
const TechStackHeroStatsSchema = z.object({
	technologies: LocalizedStringSchema,
});

export const TechStackPageContentSchema = z.object({
	meta: PageMetaSchema,
	hero: z.object({
		overline: LocalizedStringSchema,
		titleLine1: LocalizedStringSchema,
		titleLine2: LocalizedStringSchema,
		terminalAria: LocalizedStringSchema,
		stats: TechStackHeroStatsSchema,
	}),
	actions: z.object({
		getInTouch: LocalizedStringSchema,
		viewServices: LocalizedStringSchema,
	}),
	cta: z.object({
		headingLine1: LocalizedStringSchema,
		headingLine2: LocalizedStringSchema,
		sub: LocalizedStringSchema,
		availability: LocalizedStringSchema,
	}),
});

export type TechStackPageContent = z.infer<typeof TechStackPageContentSchema>;
