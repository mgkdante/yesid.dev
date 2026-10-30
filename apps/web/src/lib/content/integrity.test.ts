// Schema parsing covers fields; these tests also enforce cross-entity references and localization.

import { describe, it, expect } from 'vitest';

import { createRequire } from 'node:module';

import { z } from 'zod';
import { projects } from './projects.js';
import { services } from './services.js';
import { siteMeta } from './site-meta.js';
import { blogPosts } from './blog.js';
import { aboutPageContent } from './about-page.js';
import { contactContent } from './contact-page.js';
import { navLinks, menuItems, errorPageContent } from './nav.js';
import { INITIAL_HERO_DATA } from '#lib/live/index.ts';
import { sitePages } from './site-pages.js';
import {
	HeroDataSchema,
} from '#lib/schemas/index.ts';
import {
	ProjectSchema,
	ServiceSchema,
	BlogPostSchema,
	SiteMetaSchema,
	AboutContentSchema,
	ContactContentSchema,
	NavLinkSchema,
	MenuItemSchema,
	ErrorPageContentSchema,
	SitePageSchema,
} from '@repo/shared';

describe('projects data integrity', () => {
	it('all slugs are unique', () => {
		const slugs = projects.map((p) => p.slug);
		const uniqueSlugs = new Set(slugs);
		expect(uniqueSlugs.size).toBe(slugs.length);
	});

	it('no project has an empty slug', () => {
		projects.forEach((p) => {
			expect(p.slug.trim()).not.toBe('');
		});
	});

	it('all slugs are URL-safe (lowercase, hyphens only, no spaces or special chars)', () => {
		// slugs become URL path segments — they must not contain spaces or reserved chars
		const urlSafe = /^[a-z0-9-]+$/;
		projects.forEach((p) => {
			expect(p.slug).toMatch(urlSafe);
		});
	});

	it('all projects have at least one stack entry', () => {
		projects.forEach((p) => {
			expect(p.stack.length).toBeGreaterThan(0);
		});
	});

	it('all projects have at least one tag', () => {
		projects.forEach((p) => {
			expect(p.tags.length).toBeGreaterThan(0);
		});
	});

	it('there is at least one featured project', () => {
		// The home page showcase section requires at least one featured project
		const featured = projects.filter((p) => p.featured);
		expect(featured.length).toBeGreaterThan(0);
	});

	it('transit-data-pipeline is featured for the home proof reel', () => {
		const transit = projects.find((p) => p.slug === 'transit-data-pipeline');
		expect(transit?.featured).toBe(true);
	});

	it('all public projects have a relatedServices array with at least one entry', () => {
		// content-projects removed the lorem-* placeholders, so the roster is now
		// the 3 real public projects; the public-only guard stays as a future-proof
		// invariant (any non-public draft added later need not link a service).
		projects.forEach((p) => {
			expect(Array.isArray(p.relatedServices)).toBe(true);
			if (p.status === 'public') expect(p.relatedServices.length).toBeGreaterThan(0);
		});
	});

	it('all relatedServices IDs reference existing service IDs', () => {
		const validServiceIds = new Set(services.map((s) => s.id));
		projects.forEach((p) => {
			p.relatedServices.forEach((sid) => {
				expect(validServiceIds.has(sid), `service "${sid}" in project "${p.slug}" not found`).toBe(true);
			});
		});
	});
});

describe('services data integrity', () => {
	// WHY no hardcoded count: the station system is data-driven. Adding a service
	// means adding one object to services.ts — no component changes. Tests validate
	// structural integrity (unique, sequential, valid refs), not a fixed count.

	it('at least 1 service exists', () => {
		expect(services.length).toBeGreaterThanOrEqual(1);
	});

	it('all services have a unique id', () => {
		const ids = services.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all service ids are non-empty strings', () => {
		services.forEach((s) => {
			expect(s.id.trim()).not.toBe('');
		});
	});

	it('all services have unique station numbers', () => {
		const stations = services.map((s) => s.station);
		expect(new Set(stations).size).toBe(stations.length);
	});

	it('station numbers are sequential starting from 1 with no gaps', () => {
		const stations = services.map((s) => s.station).sort((a, b) => a - b);
		const expected = Array.from({ length: services.length }, (_, i) => i + 1);
		expect(stations).toEqual(expected);
	});

	it('station count equals services count (every service has a station)', () => {
		const stationCount = new Set(services.map((s) => s.station)).size;
		expect(stationCount).toBe(services.length);
	});

	it('relatedProjects is an array on every service', () => {
		services.forEach((s) => {
			expect(Array.isArray(s.relatedProjects)).toBe(true);
		});
	});

	it('all relatedProjects slugs exist in the projects array', () => {
		const validSlugs = new Set(projects.map((p) => p.slug));
		services.forEach((s) => {
			s.relatedProjects.forEach((slug) => {
				expect(validSlugs.has(slug), `slug "${slug}" in service "${s.id}" not found in projects`).toBe(true);
			});
		});
	});

	it('all services with svg field reference a valid filename', () => {
		services.forEach((s) => {
			if (s.svg) {
				expect(s.svg.trim()).not.toBe('');
				expect(s.svg).toMatch(/\.svg$/);
			}
		});
	});
});

describe('siteMeta data integrity', () => {

	it('email link is present', () => {
		expect(siteMeta.links.email.trim()).not.toBe('');
	});

	it('github link is present', () => {
		expect(siteMeta.links.github.trim()).not.toBe('');
	});
});

describe('blogPosts data integrity', () => {
	it('at least 3 blog posts exist', () => {
		expect(blogPosts.length).toBeGreaterThanOrEqual(3);
	});

	it('all slugs are unique', () => {
		const slugs = blogPosts.map((p) => p.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('all slugs are URL-safe', () => {
		const urlSafe = /^[a-z0-9-]+$/;
		blogPosts.forEach((p) => {
			expect(p.slug).toMatch(urlSafe);
		});
	});

	it('all dates are valid ISO date strings', () => {
		const isoDate = /^\d{4}-\d{2}-\d{2}$/;
		blogPosts.forEach((p) => {
			expect(p.date).toMatch(isoDate);
			expect(new Date(p.date).toString()).not.toBe('Invalid Date');
		});
	});

	it('all posts have at least one tag', () => {
		blogPosts.forEach((p) => {
			expect(p.tags.length).toBeGreaterThan(0);
		});
	});

	it('all posts have a non-empty url', () => {
		blogPosts.forEach((p) => {
			expect(p.url.trim()).not.toBe('');
		});
	});
});

describe('sitePages registry integrity (slice-26.1)', () => {
	it('all paths are unique', () => {
		const paths = sitePages.map((p) => p.path);
		expect(new Set(paths).size).toBe(paths.length);
	});

	it('the root row is present — its absence would be a registry outage, not an archive', () => {
		expect(sitePages.some((p) => p.path === '/')).toBe(true);
	});

	it('every detail-bearing section is listing-typed (detail routes resolve via prefix)', () => {
		for (const path of ['/services', '/projects', '/blog']) {
			const row = sitePages.find((p) => p.path === path);
			expect(row, `registry row ${path} missing — archived? Detail routes will 404.`).toBeTruthy();
			expect(row?.type).toBe('listing');
		}
	});
});

// Validate seed data against the same schemas used at the adapter boundary.

describe('seed data parses through schemas', () => {
	it('projects → ProjectSchema[]', () => {

		expect(() => z.array(ProjectSchema).parse(projects)).not.toThrow();
	});

	it('services → ServiceSchema[]', () => {
		expect(() => z.array(ServiceSchema).parse(services)).not.toThrow();
	});

	it('blogPosts → BlogPostSchema[]', () => {
		expect(() => z.array(BlogPostSchema).parse(blogPosts)).not.toThrow();
	});

	it('siteMeta → SiteMetaSchema', () => {
		expect(() => SiteMetaSchema.parse(siteMeta)).not.toThrow();
	});

	it('aboutPageContent → AboutContentSchema', () => {
		expect(() => AboutContentSchema.parse(aboutPageContent)).not.toThrow();
	});

	it('contactContent → ContactContentSchema', () => {
		expect(() => ContactContentSchema.parse(contactContent)).not.toThrow();
	});

	it('INITIAL_HERO_DATA → HeroDataSchema', () => {
		expect(() => HeroDataSchema.parse(INITIAL_HERO_DATA)).not.toThrow();
	});

	it('navLinks → NavLinkSchema[]', () => {
		expect(() => z.array(NavLinkSchema).parse(navLinks)).not.toThrow();
	});

	it('menuItems → MenuItemSchema[]', () => {
		expect(() => z.array(MenuItemSchema).parse(menuItems)).not.toThrow();
	});

	it('errorPageContent → ErrorPageContentSchema', () => {
		expect(() => ErrorPageContentSchema.parse(errorPageContent)).not.toThrow();
	});

	it('sitePages → SitePageSchema[]', () => {
		expect(() => z.array(SitePageSchema).parse(sitePages)).not.toThrow();
	});
});

// The structural walker validates objects with string-valued en keys as LocalizedStrings.

interface LocalizedStringStats {
	full: number; // en + fr + es
	esWithoutFr: string[]; // paths violating FR-first ordering
	missingFr: string[]; // paths missing non-empty French translations
	malformed: string[]; // paths where `en` is missing/empty
}

function isLocalizedStringShape(v: unknown): v is Record<string, unknown> {
	if (typeof v !== 'object' || v === null) return false;
	const obj = v as Record<string, unknown>;
	// Object-valued en keys belong to localized documents and must be walked rather than validated as strings.
	return 'en' in obj && typeof obj.en === 'string';
}

function isNonEmptyString(v: unknown): boolean {
	return typeof v === 'string' && v.trim() !== '';
}

function walkContent(
	value: unknown,
	stats: LocalizedStringStats,
	path: string,
	seen: WeakSet<object>
): void {
	if (value === null || value === undefined) return;

	// Primitives — nothing to walk.
	if (typeof value !== 'object') return;

	// Cycle guard — content shouldn't be cyclic, but defensive.
	if (seen.has(value as object)) return;
	seen.add(value as object);

	// LocalizedString leaf.
	if (isLocalizedStringShape(value)) {
		const ls = value as { en?: unknown; fr?: unknown; es?: unknown };
		if (!isNonEmptyString(ls.en)) {
			stats.malformed.push(`${path}.en`);
			return;
		}
		const hasFr = isNonEmptyString(ls.fr);
		const hasEs = isNonEmptyString(ls.es);
		if (hasFr && hasEs) stats.full++;
		if (!hasFr) stats.missingFr.push(`${path}.fr`);
		if (hasEs && !hasFr) stats.esWithoutFr.push(path);
		return;
	}

	// Array — walk each element.
	if (Array.isArray(value)) {
		value.forEach((item, i) => walkContent(item, stats, `${path}[${i}]`, seen));
		return;
	}

	// Plain object — walk each string-keyed property.
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		walkContent(v, stats, `${path}.${k}`, seen);
	}
}

function newStats(): LocalizedStringStats {
	return { full: 0, esWithoutFr: [], missingFr: [], malformed: [] };
}

// Load runtime registry metadata without adding CMS fetcher types to the web program.
const { EXPORT_MODULE_REGISTRY }: {
	EXPORT_MODULE_REGISTRY: readonly { fileName: string }[];
} = createRequire(import.meta.url)('../../../../cms/scripts/lib/emitters/configs.ts');

// Discover every generated module; the exporter registry independently guards coverage.
const WALKER_SOURCES = Object.entries(
	import.meta.glob(['./*.ts', '!./*.test.ts', '!./index.ts'], { eager: true }),
);

function scanAll(): LocalizedStringStats {
	const stats = newStats();
	const seen = new WeakSet<object>();
	for (const [name, value] of WALKER_SOURCES) {
		walkContent(value, stats, name, seen);
	}
	return stats;
}

describe('LocalizedString guard + translation debt', () => {
	it('every LocalizedString has a non-empty English value', () => {
		const stats = scanAll();
		expect(
			stats.malformed,
			`Malformed LocalizedStrings (missing or empty .en):\n  ${stats.malformed.join('\n  ')}`
		).toEqual([]);
	});

	it('at least one LocalizedString is fully multilingual', () => {
		// Sanity floor — if fully-multilingual drops to 0, someone has accidentally
		// stripped fr/es from nav.ts / navDirections / sharedChromeContent.
		const stats = scanAll();
		expect(stats.full).toBeGreaterThan(0);
	});

});

// Spanish translations require French siblings; French-only additions remain valid.
describe('locale-completeness locks (slice-28.6 FR-first model)', () => {

	it('every LocalizedString has a non-empty French value', () => {
		const { missingFr } = scanAll();
		expect(missingFr, `Missing French translations:\n  ${missingFr.join('\n  ')}`).toEqual([]);
	});

	it('FR-first ordering: no field has es without fr', () => {
		const { esWithoutFr } = scanAll();
		expect(esWithoutFr, `Spanish without French:\n  ${esWithoutFr.join('\n  ')}`).toEqual([]);
	});

	it('walked modules match the canonical exporter registry', () => {
		expect(WALKER_SOURCES.map(([name]) => name).sort()).toEqual(
			EXPORT_MODULE_REGISTRY.map(({ fileName }) => `./${fileName}`).sort(),
		);
	});
});
