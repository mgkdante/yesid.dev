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
	CollectionPage,
	CreativeWork,
	Person,
	ProfessionalService,
	ProfilePage,
	Service as ServiceNode,
	WebSite,
} from '$lib/schemas/jsonld';
import type { BlogPost, Locale, Project, Service as ServiceDomain, SiteMeta } from '$lib/types';
import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
import { SITE_HOST, canonicalFor, SERVICE_AREAS, GBP_PROFILE_URL, PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';
import { extractText } from '@repo/shared';
import {
	buildBreadcrumbListJsonLd,
	buildCollectionPageJsonLd,
	buildProfilePageJsonLd,
	buildWebSiteJsonLd,
} from '@yesid/seo-kit/jsonld';

export const PERSON_ID = `${SITE_HOST}/#person`;
export const WEBSITE_ID = `${SITE_HOST}/#website`;
export const BUSINESS_ID = `${SITE_HOST}/#business`;

/**
 * The brand mark of record: the orange dot inside its outer ring, on a
 * transparent ground. Google wants Organization.logo to be a crawlable raster
 * of at least 112x112 that "looks how you intend on a purely white background",
 * so this is the 512px dark-orange cut. scripts/generate-gbp-assets.ts emits it
 * from the same markDot() geometry as the GBP avatar, so the two never drift.
 */
export const BRAND_LOGO = `${SITE_HOST}/brand/mark-512.png`;
export const PERSON_IMAGE = `${SITE_HOST}/images/about/headshot.webp`;

/** GBP service-area cities as schema.org City nodes (shared by Service + ProfessionalService). */
function serviceAreaNodes() {
	return SERVICE_AREAS.map((name) => ({ '@type': 'City' as const, name }));
}

/** L2 (launch Phase 4): the languages the practice works in, derived from the
 *  published locales — a new locale flips the entity signal automatically.
 *  Shared by Person + ProfessionalService (both legitimate placements). */
function knowsLanguage(): string[] {
	return [...PUBLISHED_LOCALES];
}

export function buildPersonNode(meta: SiteMeta, locale: Locale = DEFAULT_LOCALE): Person {
	const sameAs: string[] = [];
	if (meta.links.github) sameAs.push(meta.links.github);
	if (meta.links.linkedin) sameAs.push(meta.links.linkedin);
	if (meta.links.upwork) sameAs.push(meta.links.upwork);

	const built = {
		'@type': 'Person' as const,
		'@id': PERSON_ID,
		name: meta.owner.name,
		jobTitle: resolveLocale(meta.owner.jobTitle, locale),
		image: PERSON_IMAGE,
		...(meta.owner.phone ? { telephone: meta.owner.phone } : {}),
		url: SITE_HOST,
		email: meta.links.email,
		sameAs,
		knowsAbout: [...meta.owner.knowsAbout],
		knowsLanguage: knowsLanguage(),
		address: {
			'@type': 'PostalAddress' as const,
			addressLocality: meta.owner.address.locality,
			addressRegion: meta.owner.address.region,
			addressCountry: meta.owner.address.country,
		},
	};

	return SchemaOrgNodeSchema.parse(built) as Person;
}

export function buildWebSiteNode(meta: SiteMeta, locale: Locale = DEFAULT_LOCALE): WebSite {
	const built = buildWebSiteJsonLd({
		id: WEBSITE_ID,
		name: meta.name,
		url: SITE_HOST,
		description: resolveLocale(meta.description, locale),
		publisher: { '@id': PERSON_ID },
	});

	return SchemaOrgNodeSchema.parse(built) as WebSite;
}

/**
 * The practice as a LocalBusiness-family entity — the node Google's local pack
 * keys on (a Person is not a LocalBusiness). `founder` links back to the Person
 * of record; `areaServed` mirrors the GBP service areas; `name` is the bare
 * host (yesid.dev) to stay byte-identical with the GBP listing name. Emitted
 * once, on the home page (see route-seo-defaults).
 */
export function buildProfessionalServiceNode(
	meta: SiteMeta,
	locale: Locale = DEFAULT_LOCALE,
): ProfessionalService {
	const sameAs: string[] = [];
	if (meta.links.github) sameAs.push(meta.links.github);
	if (meta.links.linkedin) sameAs.push(meta.links.linkedin);
	if (meta.links.upwork) sameAs.push(meta.links.upwork);
	if (GBP_PROFILE_URL) sameAs.push(GBP_PROFILE_URL);

	const built = {
		'@type': 'ProfessionalService' as const,
		'@id': BUSINESS_ID,
		name: new URL(SITE_HOST).host,
		url: SITE_HOST,
		logo: BRAND_LOGO,
		description: resolveLocale(meta.description, locale),
		...(meta.owner.phone ? { telephone: meta.owner.phone } : {}),
		address: {
			'@type': 'PostalAddress' as const,
			addressLocality: meta.owner.address.locality,
			addressRegion: meta.owner.address.region,
			addressCountry: meta.owner.address.country,
		},
		areaServed: serviceAreaNodes(),
		founder: { '@id': PERSON_ID },
		sameAs,
		knowsAbout: [...meta.owner.knowsAbout],
		knowsLanguage: knowsLanguage(),
	};

	return SchemaOrgNodeSchema.parse(built) as ProfessionalService;
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
	const built = buildProfilePageJsonLd({
		id: `${canonicalUrl}#profilepage`,
		mainEntity: { '@id': PERSON_ID },
	});
	return SchemaOrgNodeSchema.parse(built) as ProfilePage;
}

export function buildBreadcrumbListNode(
	items: readonly BreadcrumbInput[],
	canonicalUrl: string,
): BreadcrumbList {
	const built = buildBreadcrumbListJsonLd({
		id: `${canonicalUrl}#breadcrumb`,
		items,
	});
	return SchemaOrgNodeSchema.parse(built) as BreadcrumbList;
}

export function buildCollectionPageNode(args: {
	name: string;
	description: string;
	url: string;
}): CollectionPage {
	const built = buildCollectionPageJsonLd({
		id: `${args.url}#collectionpage`,
		name: args.name,
		description: args.description,
		url: args.url,
	});
	return SchemaOrgNodeSchema.parse(built) as CollectionPage;
}

export function buildBlogPostingNode(
	post: BlogPost,
	locale: Locale,
	opts: { imageUrl?: string } = {},
): BlogPosting {
	const canonicalUrl = canonicalFor(`/blog/${post.slug}`, post.lang);
	const built = {
		'@type': 'BlogPosting' as const,
		'@id': canonicalUrl,
		headline: post.title,
		description: post.seoDescription ?? post.excerpt,
		inLanguage: post.lang,
		datePublished: post.date,
		...(post.dateModified && { dateModified: post.dateModified }),
		author: { '@id': PERSON_ID },
		publisher: { '@id': PERSON_ID },
		mainEntityOfPage: canonicalUrl,
		...(post.tags.length > 0 && { keywords: post.tags }),
		...(opts.imageUrl && { image: opts.imageUrl }),
	};
	return SchemaOrgNodeSchema.parse(built) as BlogPosting;
}

export function buildServiceNode(service: ServiceDomain, locale: Locale): ServiceNode {
	const canonicalUrl = canonicalFor(`/services/${service.id}`, locale);
	// Schema.org does not define `availableLanguage` on `Service` directly
	// (it belongs on ContactPoint / ServiceChannel / Place). When fr/es
	// content ships, locale info will re-enter via a nested ServiceChannel
	// under Service.availableChannel. Out of scope for 15b.
	const built = {
		'@type': 'Service' as const,
		'@id': canonicalUrl,
		name: resolveLocale(service.title, locale),
		description: resolveLocale(service.description, locale),
		// L2: the stable EN station name as the machine-legible category, so
		// the /es and /fr pages resolve to the same entity as the EN one.
		serviceType: resolveLocale(service.title, DEFAULT_LOCALE),
		provider: { '@id': PERSON_ID },
		areaServed: serviceAreaNodes(),
	};
	return SchemaOrgNodeSchema.parse(built) as ServiceNode;
}

export function buildCreativeWorkNode(project: Project, locale: Locale): CreativeWork {
	const canonicalUrl = canonicalFor(`/projects/${project.slug}`, locale);
	const built = {
		'@type': 'CreativeWork' as const,
		'@id': canonicalUrl,
		name: resolveLocale(project.title, locale),
		description: extractText(resolveLocale(project.description, locale)),
		url: canonicalUrl,
		author: { '@id': PERSON_ID },
		creator: { '@id': PERSON_ID },
		keywords: project.tags,
		about: project.stack,
	};
	return SchemaOrgNodeSchema.parse(built) as CreativeWork;
}
