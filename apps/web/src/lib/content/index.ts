// Content-layer barrel.
// Aggregates every static source module under $lib/content.
//
// Import boundaries (enforced by reviewer; codified in ARCHITECTURE.md after Slice 17b):
// - Route loaders should prefer $lib/repositories (Task 17b-3+). They may still
//   hit $lib/content for the short window of 17b-1 before the repository layer
//   lands.
// - Components should not import from here after 17b-4 migration — data flows
//   through props from loaders. Kept transitional during the slice.
// - Adapters (specifically $lib/adapters/static) are the long-term sole
//   reader of $lib/content/* after 17b lands.

// Generated CMS-derived modules (slice-18m export-fallbacks pipeline).
export * from './projects'
export * from './services'
export * from './blog'
export * from './site-meta'
export * from './tech-stack'
export * from './site-content'
export * from './nav'
export * from './about-page'
export * from './contact-page'
export * from './hero-data'
export * from './blog-page'
export * from './projects-page'
export * from './morph-shapes'

// Hand-written companions (slice-18m): route chrome, helper functions, type
// definitions, and legacy fallbacks the generator does not emit.
export * from './projects.companion'
export * from './services.companion'
export * from './blog.companion'
export * from './site-content.companion'
export * from './nav.companion'
export * from './contact-page.companion'
// tech-stack.companion.ts deleted in slice-18m follow-up (GH #63/#64) — items
// + page chrome now both emit from CMS via tech-stack.ts.
