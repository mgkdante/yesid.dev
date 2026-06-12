// SiteLabelsSchema — global UI microcopy singleton (go2-t1c).
// CMS columns are prefix-grouped (a11y_/ui_/pages_/email_); this schema
// regroups them into nested objects for ergonomic component reads.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const SiteLabelsSchema = z.object({
	a11y: z.object({
		navCapabilities: LocalizedStringSchema,
		carouselPrev: LocalizedStringSchema,
		carouselNext: LocalizedStringSchema,
		navTechStack: LocalizedStringSchema,
		toc: LocalizedStringSchema,
		closerGraffiti: LocalizedStringSchema,
	}),
	ui: z.object({
		markerService: LocalizedStringSchema,
		markerFeatured: LocalizedStringSchema,
		/** "← All Projects" back-to-listing link on /projects/[slug] (go2/w4). */
		backToProjects: LocalizedStringSchema,
		errorStatusNote: LocalizedStringSchema,
		blogEditionTemplate: LocalizedStringSchema,
		copyrightTemplate: LocalizedStringSchema,
		nounProject: LocalizedStringSchema,
		categoryPersonal: LocalizedStringSchema,
		categoryProfessional: LocalizedStringSchema,
		watermarkPersonal: LocalizedStringSchema,
		watermarkProfessional: LocalizedStringSchema,
	}),
	pages: z.object({
		blogEdgeTitle: LocalizedStringSchema,
		projectsEdgeTitle: LocalizedStringSchema,
		homeSectionProjects: LocalizedStringSchema,
		homeSectionServices: LocalizedStringSchema,
		homeSectionTerminus: LocalizedStringSchema,
	}),
	email: z.object({
		contactSubjectTemplate: LocalizedStringSchema,
	}),
});
export type SiteLabels = z.infer<typeof SiteLabelsSchema>;
