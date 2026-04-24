// Re-exports @yesido/shared (domain types) + web-local Zod type re-exports.
// Preserves historical `import type { X } from '$lib/types'` surface for apps/web.
//
// Shared domain types extracted to packages/shared in slice-18 18c Task 14
// so apps/web + apps/cms consume one source of truth.

export * from '@yesido/shared';

// PageSeo + SchemaOrgNode are Zod-backed types in apps/web/src/lib/schemas/seo.ts.
// They stay in apps/web (use $lib alias) and are re-exported here so consumers
// have a single import surface.
export type { PageSeo, SchemaOrgNode } from '$lib/schemas/seo';
