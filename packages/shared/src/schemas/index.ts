// @repo/shared schema barrel.
// Cross-block primitives first, then per-page block schemas.

// Primitives
export * from './shared';

// Page schemas (relocated from apps/web in slice-18i Task 1.1 Phase B)
export * from './about-page';
export * from './contact-page';
export * from './tech-stack-page';

// Home-page block schemas (added in slice-18i Task 1.1 Phase C)
export * from './hero';
export * from './hero-anim';
export * from './manifesto';
export * from './proof-reel';
export * from './services-grid';
export * from './cta';
export * from './closer';
export * from './about-intro';

// Stub page schemas (fields locked in slice-18i Task 1.4)
export * from './blog-page';
export * from './projects-page';

// site_pages registry rows (slice-26.1 content controls)
export * from './site-pages';

// route_seo static-route SEO overrides
export * from './route-seo';

// site_labels global UI microcopy singleton (go2-t1c)
export * from './site-labels';

// stack_archetypes rows + canonical blueprint layers (slice-29 Tech Stack Engine)
export * from './stack-archetypes';

// PageSchema — 12-variant discriminated union (slice-18i Task 1.1 Phase E)
export * from './page';

// Content-contract schemas consolidated from the apps/web + apps/cms mirror
// copies (site-hardening-a-plus) — one schema per shape, both apps import
// from here. NOTE: these files export SCHEMAS only (no z.infer type aliases
// that would collide with the ../types/content interfaces under the root
// barrel's double star-export).
export * from './project';
export * from './site-meta';
export * from './blog';
export * from './service';
export * from './icon';
export * from './morph-shape';
export * from './nav';
export * from './tech-stack';
