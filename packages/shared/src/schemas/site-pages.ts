// SitePageSchema — one row of the `site_pages` registry (slice-26.1).
//
// site_pages is the single editor-facing switchboard for page visibility:
// a row's PRESENCE in the emitted registry (published rows only) is the
// "this page exists" signal consumed by the route gate, sitemap, and nav
// cascade. Archived rows are simply absent — there is no status field here.
//
// Shared between apps/cms (export-fallbacks fetcher validation) and apps/web
// (emitted $lib/content/site-pages.ts + page-registry helper) so the two
// sides cannot drift.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

// 'listing'  — has detail child routes (/services/[id], /blog/[slug], ...).
//              Detail paths resolve to their longest listing prefix.
// 'freeform' — standalone editorial page (/about, /tech-stack, ...).
// 'system'   — structural page the site cannot run without (e.g. '/').
export const SitePageTypeSchema = z.enum(['freeform', 'listing', 'system']);

export const SitePageSchema = z.object({
	/** Absolute route path, no trailing slash (except '/'), e.g. '/blog/personal'. */
	path: z.string().regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/, {
		message: 'SitePage.path must be an absolute, lowercase, slash-separated route path',
	}),
	type: SitePageTypeSchema,
	/** Page title (en required; fr/es filled from CMS translations). */
	title: LocalizedStringSchema,
});

export type SitePageType = z.infer<typeof SitePageTypeSchema>;
export type SitePage = z.infer<typeof SitePageSchema>;
