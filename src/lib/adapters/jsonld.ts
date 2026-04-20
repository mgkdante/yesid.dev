// JSON-LD factories. Each factory is a pure function mapping a domain object
// to a Zod-parsed SchemaOrgNode. Factories have no I/O, no adapter imports,
// and no runtime side effects. Every factory ends with
// `SchemaOrgNodeSchema.parse(built)` — malformed nodes never leave the module.
//
// PERSON_ID and WEBSITE_ID are the only globally-referenced @ids. Every other
// node's @id derives from its canonical URL + a hash fragment (e.g.,
// /about#breadcrumb, /blog/foo#post). Google's crawler resolves the reference
// once per indexing pass.
//
// Factories that take a locale apply `resolveLocale(localizedString, locale)`
// on their text fields — the produced node is already locale-resolved.

import { SchemaOrgNodeSchema } from '$lib/schemas/jsonld';
import type {
	BlogPosting,
	BreadcrumbList,
	BreadcrumbListItem,
	CollectionPage,
	CreativeWork,
	Person,
	ProfilePage,
	Service as ServiceNode,
	WebSite,
} from '$lib/schemas/jsonld';
import type { BlogPost, Locale, Project, Service as ServiceDomain, SiteMeta } from '$lib/types';
import { resolveLocale } from '$lib/utils/locale';
import { SITE_HOST } from '$lib/utils/seo-defaults';

export const PERSON_ID = `${SITE_HOST}/#person`;
export const WEBSITE_ID = `${SITE_HOST}/#website`;

export function buildPersonNode(meta: SiteMeta): Person {
	const sameAs: string[] = [];
	if (meta.links.github) sameAs.push(meta.links.github);
	if (meta.links.linkedin) sameAs.push(meta.links.linkedin);
	if (meta.links.upwork) sameAs.push(meta.links.upwork);

	const built = {
		'@type': 'Person' as const,
		'@id': PERSON_ID,
		name: meta.owner.name,
		jobTitle: meta.owner.jobTitle.en,
		url: SITE_HOST,
		email: meta.links.email,
		sameAs,
		knowsAbout: [...meta.owner.knowsAbout],
		address: {
			'@type': 'PostalAddress' as const,
			addressLocality: meta.owner.address.locality,
			addressRegion: meta.owner.address.region,
			addressCountry: meta.owner.address.country,
		},
	};

	return SchemaOrgNodeSchema.parse(built) as Person;
}

export function buildWebSiteNode(meta: SiteMeta): WebSite {
	const built = {
		'@type': 'WebSite' as const,
		'@id': WEBSITE_ID,
		name: meta.name,
		url: SITE_HOST,
		description: meta.description.en,
		publisher: { '@id': PERSON_ID },
	};

	return SchemaOrgNodeSchema.parse(built) as WebSite;
}

/**
 * Breadcrumb input — a simple {name, url} pair per crumb. The factory adds
 * `@type`, `position`, and wires the shared `@id` from the canonical URL.
 */
export interface BreadcrumbInput {
	name: string;
	url: string;
}

export function buildProfilePageNode(canonicalUrl: string): ProfilePage {
	const built = {
		'@type': 'ProfilePage' as const,
		'@id': `${canonicalUrl}#profilepage`,
		mainEntity: { '@id': PERSON_ID },
	};
	return SchemaOrgNodeSchema.parse(built) as ProfilePage;
}

export function buildBreadcrumbListNode(
	items: readonly BreadcrumbInput[],
	canonicalUrl: string,
): BreadcrumbList {
	const itemListElement: BreadcrumbListItem[] = items.map((item, index) => ({
		'@type': 'ListItem' as const,
		position: index + 1,
		name: item.name,
		item: item.url,
	}));

	const built = {
		'@type': 'BreadcrumbList' as const,
		'@id': `${canonicalUrl}#breadcrumb`,
		itemListElement,
	};
	return SchemaOrgNodeSchema.parse(built) as BreadcrumbList;
}

export function buildCollectionPageNode(args: {
	name: string;
	description: string;
	url: string;
}): CollectionPage {
	const built = {
		'@type': 'CollectionPage' as const,
		'@id': `${args.url}#collectionpage`,
		name: args.name,
		description: args.description,
		url: args.url,
	};
	return SchemaOrgNodeSchema.parse(built) as CollectionPage;
}

export function buildBlogPostingNode(post: BlogPost, locale: Locale): BlogPosting {
	const canonicalUrl = `${SITE_HOST}/blog/${post.slug}`;
	const built = {
		'@type': 'BlogPosting' as const,
		'@id': canonicalUrl,
		headline: resolveLocale(post.title, locale),
		description: resolveLocale(post.excerpt, locale),
		inLanguage: post.lang,
		datePublished: post.date,
		author: { '@id': PERSON_ID },
		publisher: { '@id': PERSON_ID },
		mainEntityOfPage: canonicalUrl,
	};
	return SchemaOrgNodeSchema.parse(built) as BlogPosting;
}

export function buildServiceNode(service: ServiceDomain, locale: Locale): ServiceNode {
	const canonicalUrl = `${SITE_HOST}/services/${service.id}`;
	// Schema.org does not define `availableLanguage` on `Service` directly
	// (it belongs on ContactPoint / ServiceChannel / Place). When fr/es
	// content ships, locale info will re-enter via a nested ServiceChannel
	// under Service.availableChannel. Out of scope for 15b.
	const built = {
		'@type': 'Service' as const,
		'@id': canonicalUrl,
		name: resolveLocale(service.title, locale),
		description: resolveLocale(service.description, locale),
		provider: { '@id': PERSON_ID },
	};
	return SchemaOrgNodeSchema.parse(built) as ServiceNode;
}

export function buildCreativeWorkNode(project: Project, locale: Locale): CreativeWork {
	const canonicalUrl = `${SITE_HOST}/projects/${project.slug}`;
	const built = {
		'@type': 'CreativeWork' as const,
		'@id': canonicalUrl,
		name: resolveLocale(project.title, locale),
		description: resolveLocale(project.description, locale),
		url: canonicalUrl,
		author: { '@id': PERSON_ID },
		creator: { '@id': PERSON_ID },
		keywords: project.tags,
		about: project.stack,
	};
	return SchemaOrgNodeSchema.parse(built) as CreativeWork;
}
