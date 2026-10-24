// Web-local schemas and parsing helpers. Shared content contracts live in @repo/shared.

export * from './parse';
export * from './tech-stack';
export * from './hero-data';
export { PageSeoSchema, type PageSeo } from './seo';

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
