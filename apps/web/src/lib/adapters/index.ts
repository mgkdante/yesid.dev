// The CMS swap point — fully static as of slice-27.2.
//
// Slice 18 ran a port-by-port hybrid that migrated content types to Directus
// one at a time. Slice 27.2 reverted every read-port back to the static layer:
// Directus is dropped from the SSR data path entirely. Every port below
// resolves from staticAdapter (TS modules under $lib/content, snapshotted via
// the export-fallbacks).
//
// The dormant directus adapter was REMOVED at slice-26 close: Directus 12 is
// live and verified on both environments, and the parity oracle it existed to
// feed passed against v12 prod AND dev. The archive-not-delete deprecation
// path (slice-27.2 T6) is fulfilled — the git history holds the code.
//
// Contract types still enforce the shape uniformly — the `ContentAdapter`
// type annotation on this composite object fails compile if any port drifts
// from spec.

import { staticAdapter } from './static';
import type { ContentAdapter } from './types';

export const adapter: ContentAdapter = {
	// Reverted to static in slice-27.2 (Directus dropped from SSR data path).
	services: staticAdapter.services,

	// Reverted to static in slice-27.2 (Directus dropped from SSR data path).
	projects: staticAdapter.projects,

	// Reverted to static in slice-27.2 (Directus dropped from SSR data path).
	blog: staticAdapter.blog,

	// Reverted to static in slice-27.2 (Directus dropped from SSR data path).
	// meta.site/siteSeoDefaults/forRoute resolve from the static $lib/content
	// modules via the export-fallbacks snapshot.
	meta: staticAdapter.meta,

	techStack: staticAdapter.techStack,

	// Reverted to static in slice-27.2: all ContentPort methods resolve from
	// staticAdapter; the Directus M2A overrides are gone from the SSR data path.
	content: { ...staticAdapter.content },

	// nav sub-port — reverted to static in slice-27.2.
	nav: staticAdapter.nav,
};

export type { ContentAdapter } from './types';
