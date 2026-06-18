// TechStackPageContentSchema — page-level chrome for /tech-stack.
// Relocated from apps/web/src/lib/schemas/ to @repo/shared/schemas
// in slice-18i Task 1.1 Phase B.

import { z } from 'zod';
import { LocalizedStringSchema, PageMetaSchema } from './shared';

// Slice-18g: layers/domains/projects stats dropped — only technologies remains.
const TechStackHeroStatsSchema = z.object({
	technologies: LocalizedStringSchema,
});

// go2-t1b2 (operator addendum): hero terminal line templates, CMS-driven from
// the flat terminal_* columns. Each may carry a literal {count} token that the
// page component interpolates from data.items.length (computed, never stored).
const TechStackHeroTerminalSchema = z.object({
	cmd: LocalizedStringSchema,
	loading: LocalizedStringSchema,
	success: LocalizedStringSchema,
	cataloged: LocalizedStringSchema,
	status: LocalizedStringSchema,
});

export const TechStackPageContentSchema = z.object({
	meta: PageMetaSchema,
	hero: z.object({
		overline: LocalizedStringSchema,
		titleLine1: LocalizedStringSchema,
		titleLine2: LocalizedStringSchema,
		terminalAria: LocalizedStringSchema,
		terminal: TechStackHeroTerminalSchema,
		stats: TechStackHeroStatsSchema,
		stackKicker: LocalizedStringSchema,
		engineLoading: LocalizedStringSchema,
		// go2 engine-layered-learning: plain-language "what is a stack?"
		// explainer.
		stackExplainer: LocalizedStringSchema.optional(),
	}),
	actions: z.object({
		getInTouch: LocalizedStringSchema,
		viewServices: LocalizedStringSchema,
	}),
	cta: z.object({
		headingLine1: LocalizedStringSchema,
		headingLine2: LocalizedStringSchema,
		sub: LocalizedStringSchema,
	}),
});

export type TechStackPageContent = z.infer<typeof TechStackPageContentSchema>;
