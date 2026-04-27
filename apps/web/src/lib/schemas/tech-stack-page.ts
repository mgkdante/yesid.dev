// TechStackPageContentSchema — page-level chrome for /tech-stack.
// Added in slice-17c (Task 17c-2b) to close a pre-existing 17b seam leak:
// `routes/tech-stack/+page.svelte` was importing the literal directly from
// `$lib/content/tech-stack`, bypassing the adapter. This schema (and the new
// `content.techStackPage()` port wired in staticAdapter) routes the blob
// through the same seam as `aboutPage` and `contactPage`.

import { z } from 'zod';
import { LocalizedStringSchema, PageMetaSchema } from './shared';
import { techStackPageContent } from '$lib/content/tech-stack';

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

// Drift detector — the literal constant in $lib/content/tech-stack must be
// assignable to the schema's inferred shape. One-direction only: the literal
// narrows string values (e.g. 'Tech Stack — yesid.') while the schema uses
// open `string`, so the reverse direction wouldn't hold.
type _TechStackPageCheck = typeof techStackPageContent extends TechStackPageContent ? true : false;
const _techStackPageCheck: _TechStackPageCheck = true;
void _techStackPageCheck;
