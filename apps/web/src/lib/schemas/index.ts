// Barrel re-export for the schema layer. Import from `$lib/schemas` for
// convenience; direct imports (`$lib/schemas/jsonld` etc.) stay valid for
// callers that need explicit provenance. The one-line import into
// adapters/static.ts (Task 17c-6) relies on this barrel.
//
// Two name collisions are handled explicitly:
//   - LocalizedStringSchema: defined in ./shared, re-exported from ./seo for
//     back-compat. Barrel takes ./shared as the single source.
//   - ServiceSchema: both ./service (ContentAdapter Service) and ./jsonld
//     (schema.org @type="Service") define a ServiceSchema. They're different
//     shapes with different meanings. The barrel takes ./service; callers
//     needing the JSON-LD Service schema import from `$lib/schemas/jsonld`
//     directly. Same rule applies to the `Service` type alias in ./jsonld.

// Primitives
export * from './shared';
export * from './parse';

// Domain schemas (ContentAdapter layer)
export * from './icon';
export * from './project';
export * from './service';
export * from './blog';
export * from './meta';
export * from './tech-stack';
// about-page, contact-page, tech-stack-page relocated to @repo/shared/schemas (slice-18i Task 1.1 Phase B).
export {
	TechCategorySchema,
	AboutPolaroidSchema,
	AboutIdentitySchema,
	AboutMetricSchema,
	AboutMethodStepSchema,
	AboutTestimonialSchema,
	AboutTechItemSchema,
	AboutInterestSchema,
	AboutWeatherConfigSchema,
	AboutClientLogoSchema,
	AboutCtaSchema,
	AboutStopLabelsSchema,
	AboutLabelsSchema,
	AboutContentSchema,
} from '@repo/shared/schemas';
export {
	ContactTerminalFieldSchema,
	ContactInfoTerminalSchema,
	ContactFormTerminalSchema,
	ContactValidationSchema,
	ContactSuccessSchema,
	ContactContentSchema,
} from '@repo/shared/schemas';
export {
	TechStackPageContentSchema,
	type TechStackPageContent,
} from '@repo/shared/schemas';
// site_pages registry rows (slice-26.1) — schema lives in @repo/shared so the
// cms fetcher and the web content layer validate against one source of truth.
export {
	SitePageSchema,
	SitePageTypeSchema,
	type SitePage,
	type SitePageType,
} from '@repo/shared/schemas';
export * from './nav';
export * from './hero-data';

// SEO schemas (Slice 15a). LocalizedStringSchema lives in ./shared now; seo.ts
// only re-exports it for back-compat with existing consumers.
export { PageSeoSchema, type PageSeo } from './seo';

// JSON-LD schemas (Slice 15b). ServiceSchema + Service type skipped to avoid
// collision with the ContentAdapter Service schema. See top-of-file comment.
export {
	PersonSchema,
	WebSiteSchema,
	BlogPostingSchema,
	CreativeWorkSchema,
	BreadcrumbListSchema,
	ProfilePageSchema,
	CollectionPageSchema,
	SchemaOrgNodeSchema,
	type Person,
	type WebSite,
	type BlogPosting,
	type CreativeWork,
	type BreadcrumbList,
	type ProfilePage,
	type CollectionPage,
	type SchemaOrgNode,
	type BreadcrumbListItem,
} from './jsonld';
