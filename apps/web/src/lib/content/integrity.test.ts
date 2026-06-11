// Data integrity tests validate that the seed data files conform to the contracts
// defined by the TypeScript interfaces. These tests catch human errors in the data
// (duplicate slugs, empty required fields, invalid enum values) at test time rather
// than at runtime when a user is looking at a broken page.
//
// Layered since Slice 17c:
//   - Per-field format assertions (LocalizedString.en non-empty, enum values)
//     are covered by Zod schemas at the adapter boundary. The
//     seed-parses-through-schema block below catches the same class of bug,
//     and parsePort wraps in staticAdapter catch them at runtime too.
//   - Cross-entity invariants Zod cannot express (relatedServices references,
//     unique station numbers, URL-safe slugs, etc.) remain here.
//   - The LocalizedString walker + translation-debt snapshot stays — it
//     covers site-chrome literals that D2 carves out of schema validation.

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { projects } from './projects.js';
import { services } from './services.js';
import { siteMeta } from './site-meta.js';
import { blogPosts } from './blog.js';
import * as siteContentModule from './site-content.js';
import * as navModule from './nav.js';
import * as servicesModule from './services.js';
import * as projectsModule from './projects.js';
import { aboutPageContent } from './about-page.js';
import { contactContent } from './contact-page.js';
import * as metaModule from './site-meta.js';
import * as blogModule from './blog.js';
import * as techStackModule from './tech-stack.js';
import * as siteSeoDefaultsModule from './site-seo-defaults.js';
import { navLinks, menuItems, errorPageContent } from './nav.js';
import { INITIAL_HERO_DATA } from './hero-data.js';
import { techStackPageContent, techStackItems } from './tech-stack.js';
import * as sitePagesModule from './site-pages.js';
import { sitePages } from './site-pages.js';
import {
	ProjectSchema,
	ServiceSchema,
	BlogPostSchema,
	SiteMetaSchema,
	TechStackItemSchema,
	AboutContentSchema,
	ContactContentSchema,
	TechStackPageContentSchema,
	HeroDataSchema,
	NavLinkSchema,
	MenuItemSchema,
	ErrorPageContentSchema,
	SitePageSchema,
} from '$lib/schemas';

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

	// Per-field LocalizedString.en non-empty + status enum checks removed in
	// slice-17c — ProjectSchema.parse() in the seed-parses-through-schema
	// block below (and parsePort wraps in staticAdapter) cover those rules.

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

	it('all projects have a relatedServices array with at least one entry', () => {
		projects.forEach((p) => {
			expect(Array.isArray(p.relatedServices)).toBe(true);
			expect(p.relatedServices.length).toBeGreaterThan(0);
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

	// title/description LocalizedString.en non-empty checks removed in
	// slice-17c — ServiceSchema.parse() covers them.

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
	it('name is yesid.', () => {
		// Brand name is non-negotiable — enforced here so a typo is caught immediately
		expect(siteMeta.name).toBe('yesid.');
	});

	// tagline/description LocalizedString.en non-empty checks removed in
	// slice-17c — SiteMetaSchema.parse() covers them.

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

	// title/excerpt LocalizedString.en non-empty checks removed in slice-17c —
	// BlogPostSchema.parse() covers them.

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

// ─────────────────────────────────────────────────────────────────────────
// Seed data parses through schemas (slice-17c)
// ─────────────────────────────────────────────────────────────────────────
//
// Double-check against the schemas consumed by staticAdapter.parsePort wraps.
// Catches schema drift even when the adapter wiring happens to accept the
// seed for unrelated reasons (e.g. a production bundle that trims a port).
// One assertion per content file / constant — mirrors the wrap matrix in
// staticAdapter so a missing schema is immediately visible here.

describe('seed data parses through schemas', () => {
	it('projects → ProjectSchema[]', () => {
		// slice-18m: projects is now CMS-derived Project shape directly (no
		// rawProjectToProject wrapping); description + sections.content are
		// LocalizedBlockEditorDoc per the #41 migration.
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

	it('tech-stack items → TechStackItemSchema[]', () => {
		expect(() => z.array(TechStackItemSchema).parse(techStackItems)).not.toThrow();
	});

	// tech-stack scenarios test removed in slice-18g — StackScenario type and
	// schema were dropped (decisions Q1+Q2). Phase 5 will add a new integrity
	// test once the static helpers are updated to the new TechStackItem shape.

	it('techStackPageContent → TechStackPageContentSchema', () => {
		expect(() => TechStackPageContentSchema.parse(techStackPageContent)).not.toThrow();
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

// ─────────────────────────────────────────────────────────────────────────
// LocalizedString guard + translation-debt report (Task 17b-8)
// ─────────────────────────────────────────────────────────────────────────
//
// Walks every exported value in the content layer, identifies LocalizedString-
// shaped objects (by the presence of a string `en` field), and reports:
//
//   - Malformed strings: any LocalizedString with a missing or empty `en`
//     field. These fail the build — a LocalizedString without its English
//     default would render as an empty string or `[object Object]` in the UI.
//
//   - Translation debt: count of strings by completeness tier (full = en+fr+es,
//     partial = en + one of fr/es, en-only = en only). Printed as a snapshot
//     so regressions (or improvements) are visible in the test output.
//
// The walker is purely structural — it doesn't know which fields the TypeScript
// type system expects to be LocalizedString, just recognizes the shape. False
// positives (objects with an `en` string that aren't meant to be localized) are
// expected to be rare — grep audit found none as of Task 17b-8 authoring.

interface LocalizedStringStats {
	full: number; // has en + fr + es
	partial: number; // has en + (fr XOR es)
	enOnly: number; // has en, no fr or es
	malformed: string[]; // paths where `en` is missing/empty
	total: number;
}

function isLocalizedStringShape(v: unknown): v is Record<string, unknown> {
	if (typeof v !== 'object' || v === null) return false;
	const obj = v as Record<string, unknown>;
	// Must have an `en` key whose value is a STRING. Objects with `en` keys whose
	// values are objects are LocalizedBlockEditorDoc / per-locale JSON columns
	// (slice-18m: projects.description, projects.sections[].content are
	// LocalizedBlockEditorDoc, not LocalizedString) — those are walked structurally,
	// not validated as LocalizedStrings.
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
		stats.total++;
		const ls = value as { en?: unknown; fr?: unknown; es?: unknown };
		if (!isNonEmptyString(ls.en)) {
			stats.malformed.push(`${path}.en`);
			return;
		}
		const hasFr = isNonEmptyString(ls.fr);
		const hasEs = isNonEmptyString(ls.es);
		if (hasFr && hasEs) stats.full++;
		else if (hasFr || hasEs) stats.partial++;
		else stats.enOnly++;
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
	return { full: 0, partial: 0, enOnly: 0, malformed: [], total: 0 };
}

describe('LocalizedString guard + translation debt', () => {
	// Module-keyed sources. Walker uses the module name as the root path so
	// malformed errors point to the right file.
	const sources: Array<[string, unknown]> = [
		['site-content', siteContentModule],
		['nav', navModule],
		['services', servicesModule],
		['projects', projectsModule],
		['about-page', aboutPageContent],
		['contact-page', contactContent],
		['meta', metaModule],
		['blog', blogModule],
		['tech-stack', techStackModule],
		// site-seo-defaults carries defaultDescription (en-only at present — no
		// fr/es SEO description in the CMS singleton yet). Included so the
		// snapshot reflects the full generated-content surface.
		['site-seo-defaults', siteSeoDefaultsModule],
		// site_pages registry titles (slice-26.1) — seeded with en+fr+es.
		['site-pages', sitePagesModule],
	];

	function scan(): LocalizedStringStats {
		const stats = newStats();
		const seen = new WeakSet<object>();
		for (const [name, value] of sources) {
			walkContent(value, stats, name, seen);
		}
		return stats;
	}

	it('every LocalizedString has a non-empty English value', () => {
		const stats = scan();
		expect(
			stats.malformed,
			`Malformed LocalizedStrings (missing or empty .en):\n  ${stats.malformed.join('\n  ')}`
		).toEqual([]);
	});

	it('at least one LocalizedString is fully multilingual', () => {
		// Sanity floor — if fully-multilingual drops to 0, someone has accidentally
		// stripped fr/es from nav.ts / navDirections / sharedChromeContent.
		const stats = scan();
		expect(stats.full).toBeGreaterThan(0);
	});

	it('prints translation-debt snapshot', () => {
		const stats = scan();
		const pct = (n: number) => (stats.total === 0 ? 0 : Math.round((n / stats.total) * 100));
		const lines = [
			'',
			'  LocalizedString translation-debt snapshot (Task 17b-8):',
			`  ─────────────────────────────────────────────────────────`,
			`  Total LocalizedStrings walked:  ${stats.total}`,
			`  Full (en + fr + es):            ${stats.full} (${pct(stats.full)}%)`,
			`  Partial (en + one other):       ${stats.partial} (${pct(stats.partial)}%)`,
			`  en-only:                        ${stats.enOnly} (${pct(stats.enOnly)}%)`,
			`  Malformed (missing en):         ${stats.malformed.length}`,
			'',
		];
		// Log at info level so vitest reporters surface it.
		// eslint-disable-next-line no-console
		console.log(lines.join('\n'));

		// Trivial assertion so the test counts as a pass (vitest requires at
		// least one expect() call to mark a test passed).
		expect(stats.total).toBeGreaterThan(0);
	});
});

// ─────────────────────────────────────────────────────────────────────────
// Locale-completeness integrity check (slice-27.1 T11)
// ─────────────────────────────────────────────────────────────────────────
//
// SUPPORTED_LOCALES = ['en', 'fr', 'es']. As of slice-27.1 the content layer
// is largely en-only because the CMS has only English copy for most fields.
// Known fully-multilingual sources: nav.ts (navDirections, sharedChromeContent,
// navLinks labels, cta labels) and owner jobTitle in site-meta.ts.
//
// The approach here is to snapshot the exact full/partial/en-only counts so
// any change (regression OR improvement) is visible in the test diff. This
// makes the FR/ES launch detectable: when translations land in the CMS and
// the modules are regenerated, these counts will shift and the snapshot
// assertion will guide the reviewer to confirm the increase is intentional.
//
// Known en-only fields as of slice-27.1 (documented so FR/ES launch later
// doesn't silently no-op — regenerate + re-run tests to confirm coverage):
//
//   site-seo-defaults: defaultDescription
//     → CMS site_meta.translations has no fr/es default_description row yet.
//   site-meta: tagline, description
//     → CMS site_meta.translations has no fr/es tagline/description rows yet.
//   site-content (home blocks): all hero/manifesto/cta/closer copy
//     → block collections have no fr/es translation rows yet.
//   contact-page: all labels, terminal prompts, success states
//     → block_contact_page_content has no fr/es translation rows yet.
//   blog: all titles, excerpts, categories, tags
//     → blog_posts has no fr/es translation rows yet.
//   services: most title/description fields (some have fr/es, most don't)
//     → services.translations partial — many entries missing fr/es.
//   projects: most fields (oneLiner has fr/es for some, most others en-only)
//     → projects.translations partial.
//   about-page: most fields
//     → about-page block collections partial.
//   tech-stack: category labels mostly en-only, scenario descriptions mixed
//     → tech_stack collection partial fr/es coverage.

describe('locale-completeness snapshot (T11)', () => {
	// SUPPORTED_LOCALES mirror — inlined to avoid importing from utils (avoids
	// SvelteKit $lib/* resolution issues in this test file).
	const SUPPORTED_LOCALES = ['en', 'fr', 'es'] as const;

	it('SUPPORTED_LOCALES has exactly 3 entries: en, fr, es', () => {
		// Canary: if SUPPORTED_LOCALES changes in locale.ts, this test reminds
		// the author to revisit the locale-completeness expectations here.
		expect(SUPPORTED_LOCALES).toEqual(['en', 'fr', 'es']);
	});

	it('fully-multilingual (en+fr+es) count is locked at 40 — nav + jobTitle + site-pages titles', () => {
		// This count represents the nav module chrome (navDirections, sharedChromeContent,
		// cta labels, nav link titles) plus site-meta owner.jobTitle, plus the 8
		// site_pages registry titles (slice-26.1 — seeded with en+fr+es: 32 → 40).
		// If this number increases, FR/ES translations have been added to the CMS
		// and the modules regenerated — confirm the increase is intentional.
		// If this number decreases, translations have been stripped — investigate.
		const stats = newStats();
		const seen = new WeakSet<object>();
		const allSources: Array<[string, unknown]> = [
			['site-content', siteContentModule],
			['nav', navModule],
			['services', servicesModule],
			['projects', projectsModule],
			['about-page', aboutPageContent],
			['contact-page', contactContent],
			['meta', metaModule],
			['blog', blogModule],
			['tech-stack', techStackModule],
			['site-seo-defaults', siteSeoDefaultsModule],
			['site-pages', sitePagesModule],
		];
		for (const [name, value] of allSources) {
			walkContent(value, stats, name, seen);
		}
		expect(stats.full).toBe(40);
	});

	it('en-only count is locked at 373 — documents current FR/ES debt', () => {
		// 373 fields have only an English translation. This is the baseline
		// as of slice-27.1. When FR/ES copy lands for any module (CMS regen
		// → committed diff), this number drops and the test fails intentionally —
		// update the count here to confirm the debt has been reduced.
		const stats = newStats();
		const seen = new WeakSet<object>();
		const allSources: Array<[string, unknown]> = [
			['site-content', siteContentModule],
			['nav', navModule],
			['services', servicesModule],
			['projects', projectsModule],
			['about-page', aboutPageContent],
			['contact-page', contactContent],
			['meta', metaModule],
			['blog', blogModule],
			['tech-stack', techStackModule],
			['site-seo-defaults', siteSeoDefaultsModule],
			['site-pages', sitePagesModule],
		];
		for (const [name, value] of allSources) {
			walkContent(value, stats, name, seen);
		}
		expect(stats.enOnly).toBe(373);
	});

	it('partial (en + one of fr/es) count is 0 — no half-translated fields', () => {
		// Partial translations (en + only one of fr/es) indicate an inconsistency:
		// either the CMS has a French translation but no Spanish (or vice versa).
		// This should remain 0 — when FR/ES lands it should land for BOTH locales
		// simultaneously (or use the en fallback until both are ready).
		const stats = newStats();
		const seen = new WeakSet<object>();
		const allSources: Array<[string, unknown]> = [
			['site-content', siteContentModule],
			['nav', navModule],
			['services', servicesModule],
			['projects', projectsModule],
			['about-page', aboutPageContent],
			['contact-page', contactContent],
			['meta', metaModule],
			['blog', blogModule],
			['tech-stack', techStackModule],
			['site-seo-defaults', siteSeoDefaultsModule],
			['site-pages', sitePagesModule],
		];
		for (const [name, value] of allSources) {
			walkContent(value, stats, name, seen);
		}
		expect(stats.partial).toBe(0);
	});
});
