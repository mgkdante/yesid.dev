// LocalizedStringSchema, LocaleSchema, and PageMetaSchema moved to @repo/shared/schemas
// in slice-18i Task 1.1 Phase A. Re-exported here so existing apps/web importers
// (seo.ts, adapters, etc.) continue to resolve from $lib/schemas/shared without changes.
export { LocalizedStringSchema, LocaleSchema, PageMetaSchema } from '@repo/shared/schemas';
