// ProjectsPageContentSchema — /projects page chrome.
// Slice-18i: minimal stub with `intro`.
// go2-t1c2: added `heading` (H1) + `emptyState` (empty-filter message) — the
// listing component was hardcoding both; the orphaned CMS intro is now
// rendered as the header subtitle.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const ProjectsPageContentSchema = z.object({
	intro: LocalizedStringSchema,
	heading: LocalizedStringSchema,
	emptyState: LocalizedStringSchema,
});

export type ProjectsPageContent = z.infer<typeof ProjectsPageContentSchema>;
