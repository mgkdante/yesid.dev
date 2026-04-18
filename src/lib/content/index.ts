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

export * from './projects'
export * from './services'
export * from './blog'
export * from './meta'
export * from './tech-stack'
export * from './site-content'
export * from './nav'
export * from './about-page'
export * from './contact-page'
export * from './hero-data'
// metro.ts dissolved in Task 17b-3 — the derivation moved to
// `$lib/repositories/service` (getMetroStops / getTotalStops / formatStopLabel
// / formatServicesLabel / getStopByType / MetroStop type).
