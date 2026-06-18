// BlogPageContentSchema: /blog page chrome.
// Slice-18i: minimal stub with `intro`.
// Slice-18i.1 (post-merge polish): added `heading`, `backToDispatches`,
// `backToPersonal`: text the routes were hardcoding before this slice.
// Extend this schema when more chrome migrates to CMS.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const BlogEntryRailLinkSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string().min(1),
});

export const BlogEntryRailSchema = z.object({
	workWithMe: z.object({
		title: LocalizedStringSchema,
		prompt: LocalizedStringSchema,
		primary: BlogEntryRailLinkSchema,
		secondary: BlogEntryRailLinkSchema,
	}),
	routes: z.object({
		title: LocalizedStringSchema,
		links: z.array(BlogEntryRailLinkSchema).min(1),
	}),
});

export const BlogPageContentSchema = z.object({
	intro: LocalizedStringSchema,
	heading: LocalizedStringSchema,
	backToDispatches: LocalizedStringSchema,
	backToPersonal: LocalizedStringSchema,
	personalHeading: LocalizedStringSchema,
	personalIntro: LocalizedStringSchema,
	toPersonalLabel: LocalizedStringSchema,
	toPersonalSubtitle: LocalizedStringSchema,
	toProfessionalLabel: LocalizedStringSchema,
	toProfessionalSubtitle: LocalizedStringSchema,
	entryRail: BlogEntryRailSchema,
});

export type BlogPageContent = z.infer<typeof BlogPageContentSchema>;
export type BlogEntryRail = z.infer<typeof BlogEntryRailSchema>;
export type BlogEntryRailLink = z.infer<typeof BlogEntryRailLinkSchema>;
