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

// PageSchema — 12-variant discriminated union (slice-18i Task 1.1 Phase E)
export * from './page';
