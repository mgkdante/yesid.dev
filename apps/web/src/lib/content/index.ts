// Content-layer barrel.
// Aggregates every static source module under $lib/content.
//
// Import boundaries (rewritten slice-28.5, audit #124 — the 17b-era "adapters
// become the sole reader" plan never fully landed; this states the actual rule.
// Canonical long-form version: $lib/adapters/static.ts header):
// - COLLECTION / PRIMARY data (anything with an adapter port) is read at
//   runtime only by $lib/adapters/static.ts; routes get it via
//   $lib/repositories and pass it to components as props.
// - CMS chrome singletons (`siteLabels.*`) may be imported directly by display
//   components because generated content files are the edge cache.
// - Static-fallback imports in layout/error shells + test stubs are sanctioned.

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
export * from './site-labels'

// Hand-written companions (slice-18m): helper functions, type definitions, and
// legacy fallbacks the generator does not emit.
export * from './projects.companion'
export * from './services.companion'
export * from './blog.companion'
export * from './site-content.companion'
export * from './nav.companion'
export * from './contact-page.companion'
// tech-stack.companion.ts deleted in slice-18m follow-up (GH #63/#64) — items
// + page chrome now both emit from CMS via tech-stack.ts.
