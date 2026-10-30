// Re-export shared domain types and web-local schema types.

export * from '@repo/shared';

// PageSeo + SchemaOrgNode are Zod-backed types in apps/web/src/lib/schemas/seo.ts.
// They stay in apps/web (use $lib alias) and are re-exported here so consumers
// have a single import surface.
export type { PageSeo, SchemaOrgNode } from '#lib/schemas/seo.ts';
