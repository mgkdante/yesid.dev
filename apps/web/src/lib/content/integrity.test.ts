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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
import * as stackArchetypesModule from './stack-archetypes.js';
import { stackArchetypes } from './stack-archetypes.js';
import { siteLabels as siteLabelsModule } from './site-labels.js';
import { StackArchetypeSchema, STACK_LAYERS } from '@repo/shared/schemas';
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

const CONTENT_TEST_DIR = dirname(fileURLToPath(import.meta.url));
const WEB_SRC_DIR = join(CONTENT_TEST_DIR, '..', '..');

function readWebSource(relativePath: string): string {
	return readFileSync(join(WEB_SRC_DIR, relativePath), 'utf8');
}

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

describe('chrome companion consolidation', () => {
	it('shared chrome consumers read from siteLabels instead of sharedChromeContent', () => {
		const consumers = [
			'lib/components/layout/Nav.svelte',
			'lib/components/layout/MenuOverlay.svelte',
			'lib/components/layout/Footer.svelte',
			'lib/components/layout/ThemeToggle.svelte',
			'lib/components/layout/LanguageToggle.svelte',
			'lib/components/shared/TableOfContents.svelte',
			'lib/components/shared/FilterSummary.svelte',
			'lib/components/shared/SearchInput.svelte',
		];

		const offenders = consumers.filter((file) =>
			/\bsharedChromeContent\b/.test(readWebSource(file)),
		);

		expect(offenders).toEqual([]);
	});

	it('blog chrome consumers read from siteLabels instead of blog companions', () => {
		const consumers = [
			'lib/components/blog/BlogRouteMap.svelte',
			'lib/components/blog/BlogFilterSidebar.svelte',
			'lib/components/blog/BlogFilterMobile.svelte',
			'lib/components/blog/BlogListingPage.svelte',
			'lib/components/blog/BlogDetailHeader.svelte',
			'lib/components/blog/BlogDetailPage.svelte',
			'lib/components/cms/blocks/CodeBlock.svelte',
		];

		const offenders = consumers.filter((file) =>
			/\bblog(?:Listing|Detail)Content\b/.test(readWebSource(file)),
		);

		expect(offenders).toEqual([]);
	});

	it('projects chrome consumers read from siteLabels instead of project companions', () => {
		const consumers = [
			'lib/components/projects/ProjectCard.svelte',
			'lib/components/projects/ProjectListingPage.svelte',
			'lib/components/projects/ProjectFilterSidebar.svelte',
			'lib/components/projects/ProjectFilterMobile.svelte',
			'lib/components/projects/ProjectDetailPage.svelte',
			'lib/components/projects/ProjectGlancePanel.svelte',
			'lib/components/projects/ProjectDetailHeader.svelte',
			'lib/components/services/ServiceDetailPage.svelte',
		];

		const offenders = consumers.filter((file) =>
			/\bprojects(?:Listing|Detail)Content\b|\bprojectsPageMeta\b/.test(readWebSource(file)),
		);

		expect(offenders).toEqual([]);
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

describe('stackArchetypes engine data integrity (slice-29)', () => {
	it('all slugs are unique and URL-safe', () => {
		const slugs = stackArchetypes.map((a) => a.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9-]+$/));
	});

	it('every tech link references a committed tech-stack item', () => {
		const validTechIds = new Set(techStackItems.map((t) => t.id));
		stackArchetypes.forEach((a) => {
			a.tech.forEach((link) => {
				expect(
					validTechIds.has(link.id),
					`tech "${link.id}" in archetype "${a.slug}" not found in techStackItems`
				).toBe(true);
			});
		});
	});

	it('every present proofProjectSlug references a committed project (scenarios may omit)', () => {
		const validSlugs = new Set(projects.map((p) => p.slug));
		stackArchetypes.forEach((a) => {
			if (a.proofProjectSlug === undefined) return;
			expect(
				validSlugs.has(a.proofProjectSlug),
				`proof project "${a.proofProjectSlug}" in archetype "${a.slug}" not found`
			).toBe(true);
		});
	});

	it('every present serviceId references a committed service (scenarios may omit)', () => {
		const validIds = new Set(services.map((s) => s.id));
		stackArchetypes.forEach((a) => {
			if (a.serviceId === undefined) return;
			expect(
				validIds.has(a.serviceId),
				`service "${a.serviceId}" in archetype "${a.slug}" not found`
			).toBe(true);
		});
	});

	it('tech links arrive pre-sorted by STACK_LAYERS render order', () => {
		stackArchetypes.forEach((a) => {
			const indices = a.tech.map((l) => STACK_LAYERS.indexOf(l.layer));
			const sorted = [...indices].sort((x, y) => x - y);
			expect(indices).toEqual(sorted);
		});
	});

	it('every referenced tech has a committed layer + enables (preview taps never blank)', () => {
		const byId = new Map(techStackItems.map((t) => [t.id, t]));
		const referenced = new Set(stackArchetypes.flatMap((a) => a.tech.map((l) => l.id)));
		for (const id of referenced) {
			const item = byId.get(id);
			expect(item?.layer, `tech "${id}" missing layer`).toBeTruthy();
			expect(item?.enables?.en?.trim(), `tech "${id}" missing enables.en`).toBeTruthy();
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

	it('stackArchetypes → StackArchetypeSchema[]', () => {
		expect(() => z.array(StackArchetypeSchema).parse(stackArchetypes)).not.toThrow();
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
	full: number; // en + fr + es
	withFr: number; // non-empty fr (regardless of es)
	withEs: number; // non-empty es
	esWithoutFr: number; // POLICY violation counter: FR-first ordering (slice-28.6)
	noFr: number; // FR debt (the number the FR drop drives toward 0)
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
		if (hasFr) stats.withFr++;
		else stats.noFr++;
		if (hasEs) {
			stats.withEs++;
			if (!hasFr) stats.esWithoutFr++;
		}
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
	return { full: 0, withFr: 0, withEs: 0, esWithoutFr: 0, noFr: 0, malformed: [], total: 0 };
}

// Module-keyed walker sources. ⚠️ EVERY new generated module (e.g. a future
// chrome/labels module) MUST be added here or its strings silently escape the
// debt report and the locked counts below.
const WALKER_SOURCES: Array<[string, unknown]> = [
	['site-content', siteContentModule],
	['nav', navModule],
	['services', servicesModule],
	['projects', projectsModule],
	['about-page', aboutPageContent],
	['contact-page', contactContent],
	['meta', metaModule],
	['blog', blogModule],
	['tech-stack', techStackModule],
	// site-seo-defaults carries defaultDescription (en-only at present).
	['site-seo-defaults', siteSeoDefaultsModule],
	// site_pages registry titles (slice-26.1) — seeded with en+fr+es.
	['site-pages', sitePagesModule],
	// stack_archetypes engine recipes (slice-29).
	['stack-archetypes', stackArchetypesModule],
	// site_labels microcopy singleton (go2-t1c2) — en-only seeds.
	['site-labels', siteLabelsModule],
];

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

	it('prints translation-debt snapshot', () => {
		const stats = scanAll();
		const pct = (n: number) => (stats.total === 0 ? 0 : Math.round((n / stats.total) * 100));
		const lines = [
			'',
			'  LocalizedString translation-debt snapshot (slice-28.6 FR-first tiers):',
			`  ─────────────────────────────────────────────────────────`,
			`  Total LocalizedStrings walked:  ${stats.total}`,
			`  Full (en + fr + es):            ${stats.full} (${pct(stats.full)}%)`,
			`  With fr:                        ${stats.withFr} (${pct(stats.withFr)}%)`,
			`  With es:                        ${stats.withEs} (${pct(stats.withEs)}%)`,
			`  FR debt (no fr):                ${stats.noFr} (${pct(stats.noFr)}%)`,
			`  es-without-fr (policy):         ${stats.esWithoutFr}`,
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
// Locale-completeness locks — slice-28.6 FR-first model
// ─────────────────────────────────────────────────────────────────────────
//
// SUPPORTED_LOCALES = ['en', 'fr', 'es']. Slice-28.6 policy is FR-FIRST /
// ES-LATER: French translations may land without Spanish (en+fr partials are
// the expected steady state mid-rollout); a field with es but NOT fr signals
// translations entered out of order (or an accidental ES backfill) and stays
// a hard failure.
//
// ─── LOCKED COUNTS — single bump point ─────────────────────────────────────
// These WILL move exactly once more during the GO-day campaign:
//   - The slice-28.6 FR content drop (WITH_FR jumps toward TOTAL, NO_FR → ~0
//     for launch surfaces; tech-stack longform fr stays deferred).
// Update procedure: run `bunx vitest run src/lib/content/integrity.test.ts`,
// read the printed snapshot, set the consts, sanity-check the DIRECTION
// (WITH_FR never decreases; ES_WITHOUT_FR stays 0 until a deliberate ES pass).
// Baselines at rewrite time (post-T10): full 82 / en-only 432 / partial 0
// → WITH_FR 82, NO_FR 432, TOTAL 514.
// go2/w4: +1 en-only — siteLabels.ui.backToProjects ("← All Projects" wired
// to site_labels per operator QA) → NO_FR 433, TOTAL 515.
// go2/w5: +3 en-only, then taste-2 merges the two metro legend labels into
// ONE siteLabels.ui.metroCaption ('STM métro + REM' — names the hero metro
// art) — net +2 with a11y.replayIntro (hero dot replay button aria)
// → NO_FR 435, TOTAL 517.
// slice-30 t1: the site_labels singleton gains 6 code-owned chrome groups
// (projectsChrome/blogChrome/servicesChrome/navChrome/footerChrome/heroDashboard)
// recomposed from the companion + hero-data labels. +97 LocalizedString leaves,
// ALL with fr (the chrome translations seed) → WITH_FR + TOTAL both +97
// (530 → 627), NO_FR stays 0.
// fr-leak fix (FilterSummary pluralization): the hardcoded English `+ "s"` rule
// in FilterSummary.svelte was wrong for French zero ("0 résultat", not "résultats").
// Replaced with locale-aware singular/plural count templates. Originally parked in
// the editable companions (blogListingContent.resultCount + sharedChromeContent
// .projectCount, +4 leaves → 631) pending the generic CMS field.
// fr-leaks-cms-truth: that CMS field now exists — `siteLabels.ui.resultCount`
// {singular,plural} (en+fr) was seeded into Directus and regenerated into the
// site_labels singleton. BlogListingPage + ProjectListingPage now read the CMS
// field via FilterSummary's countLabel prop, and the two interim companion fields
// were removed (single source = CMS). Net for the walker: the regen added 10
// fr-complete leaves to site-labels (the operator's seed batch, incl. the 2
// resultCount leaves) and the 4 interim companion leaves were removed
// → WITH_FR + TOTAL both 631 + 10 − 4 = 637, NO_FR stays 0.
const LOCKED = { TOTAL: 566, WITH_FR: 566, NO_FR: 0, ES_WITHOUT_FR: 0 } as const; // 637→648→649→645→632 (content-services: sections, stack-chrome-to-CMS, "When I'm not your guy" retired, companion chrome de-duped). content-projects: removed 4 lorem-* placeholders → 613. content-projects.1: yesid.dev case study (5 sections + 5 metrics + richer overview, en+fr, minus the old stub section) → +10 = 623. Shared TOC chrome (tocChrome: heading/openAria/closeAria/counterPrefix, en+fr) added to site-content.companion, project tocSectionTitle+tocPill de-duped into it → +4 −3 = 624. chrome→CMS: retired the tocChrome companion (−4), added navChrome.shared.tocCloseAria+tocCounterPrefix to CMS (+2) → 622. chrome→CMS batch 2: retired footerContent(3) + relatedProjectsStripContent(3) + navDirections(2) companions, components now read siteLabels.footerChrome/navChrome.directions → −8 = 614. chrome→CMS batch 3: retired sharedChromeContent(12), components now read siteLabels.navChrome.shared → −12 = 602. chrome→CMS batch 4: retired blogListingContent(12) + blogDetailContent(18), components now read siteLabels.blogChrome → −30 = 572. chrome→CMS batch 5: retired projectsPageMeta(2) + projectsListingContent(9) + projectsDetailContent(12), components now read siteLabels.projectsChrome → −23 = 549. new-tech longform: added FR enables for 8 normalized tech rows -> +8 = 557. content-projects.1 image gallery: added localized Images project section -> +1 = 558. yesid.dev case study consolidation: 5 article sections -> 3 article sections = 556. About pass: 3 flag labels + 2 quote and role pairs = +7. Contact channels: 3 labels moved from plain strings to localized CMS rows = +3.

describe('locale-completeness locks (slice-28.6 FR-first model)', () => {
	it('SUPPORTED_LOCALES has exactly 3 entries: en, fr, es', () => {
		// Canary: if SUPPORTED_LOCALES changes in locale.ts, this test reminds
		// the author to revisit the locale-completeness expectations here.
		// (Inlined to avoid importing from utils — SvelteKit $lib resolution.)
		const SUPPORTED_LOCALES = ['en', 'fr', 'es'] as const;
		expect(SUPPORTED_LOCALES).toEqual(['en', 'fr', 'es']);
	});

	it(`fr coverage is locked at ${LOCKED.WITH_FR}`, () => {
		// Increase = FR translations landed (confirm intentional, bump const).
		// Decrease = translations stripped — investigate before touching the const.
		expect(scanAll().withFr).toBe(LOCKED.WITH_FR);
	});

	it(`fr debt (no-fr fields) is locked at ${LOCKED.NO_FR}`, () => {
		expect(scanAll().noFr).toBe(LOCKED.NO_FR);
	});

	it('FR-first ordering: no field has es without fr', () => {
		// Replaces the old partial===0 lock ("FR and ES land simultaneously").
		expect(scanAll().esWithoutFr).toBe(LOCKED.ES_WITHOUT_FR);
	});

	it('total walked surface is locked (new modules must register in WALKER_SOURCES)', () => {
		expect(scanAll().total).toBe(LOCKED.TOTAL);
	});
});
