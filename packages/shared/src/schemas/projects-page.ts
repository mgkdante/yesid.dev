// ProjectsPageContentSchema — /work page chrome.
// Minimal stub: fields locked in slice-18i Task 1.4 when block_projects_page_content
// is authored in Directus. Extend this schema then, not before.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const ProjectsPageContentSchema = z.object({
	intro: LocalizedStringSchema,
});

export type ProjectsPageContent = z.infer<typeof ProjectsPageContentSchema>;
