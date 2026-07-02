// SchemaOrgNode — Zod contract for JSON-LD graph nodes.
// Discriminated union on @type so SchemaOrgNodeSchema.parse narrows cleanly.
// Every factory in src/lib/adapters/jsonld.ts ends with
// `SchemaOrgNodeSchema.parse(built)` — malformed nodes never leave the module.
//
// Person + WebSite are the only nodes with stable global @ids
// (https://yesid.dev/#person, /#website). Every other node's @id derives
// from its canonical URL + a hash fragment.

import { z } from 'zod';

// Cross-reference primitive: an @id pointing at another node in the graph.
const IdRef = z.object({ '@id': z.string().url() });

const PostalAddress = z.object({
	'@type': z.literal('PostalAddress'),
	addressLocality: z.string().min(1),
	addressRegion: z.string().min(1),
	addressCountry: z.string().min(1),
});

const ListItem = z.object({
	'@type': z.literal('ListItem'),
	position: z.number().int().positive(),
	name: z.string().min(1),
	item: z.string().url(),
});

export const PersonSchema = z.object({
	'@type': z.literal('Person'),
	'@id': z.string().url(),
	name: z.string().min(1),
	jobTitle: z.string().min(1),
	telephone: z.string().min(1).optional(),
	url: z.string().url(),
	email: z.string().email().optional(),
	sameAs: z.array(z.string().url()),
	knowsAbout: z.array(z.string().min(1)),
	address: PostalAddress,
});

export const WebSiteSchema = z.object({
	'@type': z.literal('WebSite'),
	'@id': z.string().url(),
	name: z.string().min(1),
	url: z.string().url(),
	description: z.string().min(1),
	publisher: IdRef,
});

export const BlogPostingSchema = z.object({
	'@type': z.literal('BlogPosting'),
	'@id': z.string().url(),
	headline: z.string().min(1),
	description: z.string().min(1),
	inLanguage: z.string().min(2),
	datePublished: z.string().min(1),
	dateModified: z.string().min(1).optional(),
	author: IdRef,
	publisher: IdRef,
	mainEntityOfPage: z.string().url(),
	image: z.string().url().optional(),
	keywords: z.array(z.string().min(1)).optional(),
});

// Note: `availableLanguage` was dropped during 15b Codex-review iteration —
// Schema.org defines availableLanguage on ContactPoint / Place / ServiceChannel,
// NOT directly on Service. validator.schema.org flagged the misuse as a
// warning. When fr/es ship, locale info re-enters via a nested ServiceChannel
// (Service.availableChannel → ServiceChannel.availableLanguage). Out of scope
// for 15b — PUBLISHED_LOCALES is en-only today so nothing is lost.
export const ServiceSchema = z.object({
	'@type': z.literal('Service'),
	'@id': z.string().url(),
	name: z.string().min(1),
	description: z.string().min(1),
	provider: IdRef,
	areaServed: z.string().optional(),
});

export const CreativeWorkSchema = z.object({
	'@type': z.literal('CreativeWork'),
	'@id': z.string().url(),
	name: z.string().min(1),
	description: z.string().min(1),
	url: z.string().url(),
	author: IdRef,
	creator: IdRef,
	keywords: z.array(z.string()).optional(),
	about: z.array(z.string()).optional(),
	image: z.string().url().optional(),
});

export const BreadcrumbListSchema = z.object({
	'@type': z.literal('BreadcrumbList'),
	'@id': z.string().url(),
	itemListElement: z.array(ListItem).min(2),
});

export const ProfilePageSchema = z.object({
	'@type': z.literal('ProfilePage'),
	'@id': z.string().url(),
	mainEntity: IdRef,
	dateCreated: z.string().optional(),
	dateModified: z.string().optional(),
});

export const CollectionPageSchema = z.object({
	'@type': z.literal('CollectionPage'),
	'@id': z.string().url(),
	name: z.string().min(1),
	description: z.string().min(1),
	url: z.string().url(),
});

// Discriminated union on @type. Parsing narrows cleanly:
// const node = SchemaOrgNodeSchema.parse(input);
// if (node['@type'] === 'Person') { /* node is Person here */ }
export const SchemaOrgNodeSchema = z.discriminatedUnion('@type', [
	PersonSchema,
	WebSiteSchema,
	BlogPostingSchema,
	ServiceSchema,
	CreativeWorkSchema,
	BreadcrumbListSchema,
	ProfilePageSchema,
	CollectionPageSchema,
]);

export type Person = z.infer<typeof PersonSchema>;
export type WebSite = z.infer<typeof WebSiteSchema>;
export type BlogPosting = z.infer<typeof BlogPostingSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type CreativeWork = z.infer<typeof CreativeWorkSchema>;
export type BreadcrumbList = z.infer<typeof BreadcrumbListSchema>;
export type ProfilePage = z.infer<typeof ProfilePageSchema>;
export type CollectionPage = z.infer<typeof CollectionPageSchema>;
export type SchemaOrgNode = z.infer<typeof SchemaOrgNodeSchema>;
export type BreadcrumbListItem = z.infer<typeof ListItem>;
