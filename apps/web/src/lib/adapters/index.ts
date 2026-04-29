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

	// content: hybrid — 13 methods flipped to Directus M2A in slice-18i Phase 4;
	// 3 methods (navLinks, menuItems, errorPage) remain on staticAdapter via
	// the spread and will flip in Phase 5. Two pre-existing Directus overrides
	// (metroSvg, morphShapes) from slice-18d/18f are retained.
	//
	// Flip history:
	//   - metroSvg:       Directus (Slice 18d Phase 8 / Task 28-33)
	//   - morphShapes:    Directus (Slice 18 18f)
	//   - hero, heroAnim, manifesto, proofReel, servicesGrid, about, cta,
	//     closer:         Directus M2A (slice-18i Task 4.1)
	//   - aboutPage, contactPage, techStackPage: Directus M2A (slice-18i Task 4.2)
	//   - heroMock, initialHeroData: Directus local (slice-18i Task 4.3)
	content: {
		...staticAdapter.content,
		// Flipped to Directus M2A in slice-18i Task 4.1 (home-page blocks):
		hero: directusAdapter.content.hero,
		heroAnim: directusAdapter.content.heroAnim,
		manifesto: directusAdapter.content.manifesto,
		proofReel: directusAdapter.content.proofReel,
		servicesGrid: directusAdapter.content.servicesGrid,
		about: directusAdapter.content.about,
		cta: directusAdapter.content.cta,
		closer: directusAdapter.content.closer,
		// Flipped to Directus M2A in slice-18i Task 4.2 (detail-page blocks):
		aboutPage: directusAdapter.content.aboutPage,
		contactPage: directusAdapter.content.contactPage,
		techStackPage: directusAdapter.content.techStackPage,
		// Flipped in slice-18i Task 4.3 (derived — no Directus query):
		heroMock: directusAdapter.content.heroMock,
		initialHeroData: directusAdapter.content.initialHeroData,
		// Pre-existing Directus overrides:
		metroSvg: directusAdapter.content.metroSvg,
		morphShapes: directusAdapter.content.morphShapes,
	},
};

export type { ContentAdapter } from './types';
