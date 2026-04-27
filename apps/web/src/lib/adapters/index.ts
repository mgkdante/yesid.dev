// The CMS swap point — port-by-port hybrid.
//
// Slice 18 (Directus) migrates content types one at a time rather than in a
// single atomic flip. Each port below picks its source explicitly:
//
//   - services: Directus (live at cms.yesid.dev, seeded from services.ts via
//     scripts/seed-directus-services.ts; verified by Task 6).
//   - projects, blog, meta, techStack, content: static (TS modules under
//     $lib/content). Migrate each by: (a) designing the Directus schema,
//     (b) seeding content, (c) implementing the DirectusAdapter port,
//     (d) swapping the line below from `staticAdapter.X` → `directusAdapter.X`.
//
// Why port-by-port instead of a whole-adapter flip:
//   - Production risk is bounded per content type. A broken services port
//     affects /services + /services/[id]; a broken whole adapter affects
//     every route.
//   - Migration tasks can land in small, reviewable slices instead of a
//     mega-PR that stalls.
//   - Contract types still enforce the shape uniformly — the `ContentAdapter`
//     type annotation on this composite object fails compile if any port
//     drifts from spec.

import { staticAdapter } from './static';
import { directusAdapter } from './directus';
import type { ContentAdapter } from './types';

export const adapter: ContentAdapter = {
	// Migrated to Directus (Slice 18 Task 7).
	services: directusAdapter.services,

	// Migrated to Directus (Slice 18e Phase 8 Task 33).
	projects: directusAdapter.projects,

	// Migrated to Directus (Slice 18 18f — Block Editor body via
	// directus.blog.bodyBySlug; flat title+excerpt per AM2.5).
	blog: directusAdapter.blog,

	// Migrated to Directus (slice-18 18h Phase 4). meta.site() returns brand
	// SiteMeta from the `site_meta` singleton; meta.siteSeoDefaults() returns
	// the SEO defaults shape from the same singleton row (shared via
	// fetchSingletonRow() WeakMap memo); meta.routeSeo.byPath() reads
	// per-route overrides from `route_seo`; meta.forRoute() is a composer.
	meta: directusAdapter.meta,

	techStack: staticAdapter.techStack,

	// content: still on static for site-chrome literals + home-page blocks
	// (M2A flip lands in 18i), with two methods overridden:
	//   - metroSvg: Directus (Slice 18d Phase 8 / Task 28-33). The Montreal-
	//     metro SVG is now stored as a Directus asset and fetched at SSR via
	//     +page.server.ts → adapter.content.metroSvg() → MetroNetwork prop.
	//   - morphShapes: Directus (Slice 18 18f). The geometric morph library
	//     ships from the morph_shapes collection; consumers (SvgIcon,
	//     morphHover, HomeServices) fetch via getMorphShapes().
	content: {
		...staticAdapter.content,
		metroSvg: directusAdapter.content.metroSvg,
		morphShapes: directusAdapter.content.morphShapes,
	},
};

export type { ContentAdapter } from './types';
