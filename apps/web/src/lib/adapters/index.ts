// The CMS swap point — fully static as of slice-27.2.
//
// Slice 18 ran a port-by-port hybrid that migrated content types to Directus
// one at a time. Slice 27.2 reverts every read-port back to the static layer:
// Directus is dropped from the SSR data path entirely. Every port below now
// resolves from staticAdapter (TS modules under $lib/content, snapshotted via
// the export-fallbacks). The directus module stays in-tree only as a
// test-only oracle (parity harness / integration tests).
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
	// meta.site/siteSeoDefaults/routeSeo.byPath/forRoute now resolve from the
	// static $lib/content modules via the export-fallbacks snapshot.
	meta: staticAdapter.meta,

	techStack: staticAdapter.techStack,

	// Reverted to static in slice-27.2: all ContentPort methods resolve from
	// staticAdapter; the Directus M2A overrides are gone from the SSR data path;
	// the directus module stays in-tree as a test-only oracle.
	content: { ...staticAdapter.content },

	// nav sub-port — reverted to static in slice-27.2.
	nav: staticAdapter.nav,
};

export type { ContentAdapter } from './types';
