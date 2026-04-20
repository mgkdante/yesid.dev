# Sub-Slice 15b — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Per AGENTS.md §7, append tool attribution (`Planned by: …` / `Implemented by: …`) to `handoff.md` inside each task's Commit step, and log the session in `log.md`.

**Goal:** Add Schema.org JSON-LD structured data to every public route so Google rich cards + validator.schema.org + Lighthouse SEO = 100 all pass — feeding through 15a's `MetaPort.forRoute` port so the Slice 18 Payload CMS swap is a one-file change.

**Architecture:** New Zod-discriminated-union `SchemaOrgNodeSchema` in `src/lib/schemas/jsonld.ts`. Extend `PageSeoSchema` with an optional `jsonLd: SchemaOrgNode[]` field — additive, 15a entries stay valid. Pure factories in `src/lib/adapters/jsonld.ts` map domain data (Project / Service / BlogPost / SiteMeta) to validated `SchemaOrgNode` objects; each factory ends with `SchemaOrgNodeSchema.parse(built)`. New `<JsonLd>` Svelte 5 component emits exactly one `<script type="application/ld+json">` per page, wrapping nodes in `{ "@context": "https://schema.org", "@graph": [...] }`. `<SeoHead>` mounts `<JsonLd>` as a child when `seo.jsonLd` is present. Per-route `jsonLd` fields wire into `routeSeoEntries` in `src/lib/content/meta.ts`. Person/WebSite use stable global `@id`s (`https://yesid.dev/#person`, `/#website`); other nodes reference them by `@id` instead of re-embedding.

**Tech Stack:** SvelteKit 2 (Vercel adapter, Node 22) • Svelte 5 runes • Zod v3 (already installed by 15a) • Vitest + @testing-library/svelte • TypeScript • Bun runtime • existing `$lib/utils/locale.ts::resolveLocale()` + `$lib/utils/seo-defaults::SITE_HOST`/`PUBLISHED_LOCALES`/`DEFAULT_LOCALE` + existing 15a `PageSeoSchema`/`SeoHead`/`MetaPort.forRoute`.

**Multi-session:** 1 session. Tasks 1–10 land on branch `feature/slice-15b-jsonld` (already cut).

**Design spec:** [`./spec.md`](./spec.md)

---

## File Structure

### Files to create

```
src/lib/schemas/jsonld.ts                          — Zod schemas for 8 node types; discriminated union on @type
src/lib/schemas/jsonld.test.ts                     — per-schema valid/invalid/edge-case tests
src/lib/adapters/jsonld.ts                         — 8 factory functions + PERSON_ID / WEBSITE_ID constants
src/lib/adapters/jsonld.test.ts                    — per-factory tests with real fixtures from content/
src/lib/components/seo/JsonLd.svelte               — renders one <script> per page, @graph-wrapped
src/lib/components/seo/JsonLd.test.ts              — emit count, escape safety, round-trip parse
docs/slices/slice-15/slice-15b/preview-validation.md — manual validation log (Layer 3)
docs/slices/slice-15/slice-15b/log.md              — session log (per AGENTS.md §7; created Task 1)
docs/slices/slice-15/slice-15b/handoff.md          — self-appending per-task handoff (per AGENTS.md §7; created Task 1)
```

### Files to modify

```
src/lib/schemas/seo.ts                             — .extend() PageSeoSchema with optional jsonLd; re-export SchemaOrgNode
src/lib/schemas/seo.test.ts                        — tests for the extended shape
src/lib/types.ts                                   — re-export SchemaOrgNode from $lib/schemas/seo
src/lib/content/meta.ts                            — attach jsonLd to all 11 route entries
src/lib/adapters/meta.test.ts                      — integration tests for jsonLd through forRoute
src/lib/components/seo/SeoHead.svelte              — mount <JsonLd> as child when seo.jsonLd present
src/lib/components/seo/SeoHead.test.ts             — JsonLd mounting assertions
src/lib/repositories/meta.ts                       — drop getPersonSchema + buildPersonSchema import (Task 9)
src/routes/+layout.svelte                          — flip Slice 12 legacy comment to past tense (Task 9)
docs/reference/ARCHITECTURE.md                     — replace Slice 12 JSON-LD paragraph with 15b paragraph (Task 9)
docs/reference/TESTS.md                            — drop 11 legacy test rows; add new rows (Task 9)
```

### Files to delete

```
src/lib/utils/json-ld.ts                           — Slice 12 buildPersonSchema (stringified, no Zod) — Task 9
src/lib/utils/json-ld.test.ts                      — 11 legacy tests, subsumed by new factory tests — Task 9
```

---

## Task 1: Zod schemas for 8 Schema.org node types

**Files:**
- Create: `src/lib/schemas/jsonld.ts`
- Create: `src/lib/schemas/jsonld.test.ts`
- Create: `docs/slices/slice-15/slice-15b/log.md` (session log, per AGENTS.md §7)
- Create: `docs/slices/slice-15/slice-15b/handoff.md` (self-appending handoff, per AGENTS.md §7)

### Steps

- [ ] **Step 1:** Create `log.md` + `handoff.md` scaffolds. Both start as stubs that will append entries as tasks land.

Create `docs/slices/slice-15/slice-15b/log.md`:

```markdown
# Sub-Slice 15b — Session Log

Per AGENTS.md §7, each session prepends an entry with tool attribution.

---

## Session 2026-04-20 — kickoff + plan

**Model:** Claude Code (claude-opus-4-7[1m])
**Skills used:** superpowers:brainstorming, superpowers:writing-plans
**Scope:** Rewrote `spec.md` from stub; authored `plan.md` for 10 TDD tasks with STOP gates; branch `feature/slice-15b-jsonld` cut; spec committed.

**Decisions locked:**
- D032: Delete legacy `src/lib/utils/json-ld.ts` + `getPersonSchema()` (Q1-A)
- D033: `@graph` wrapper + `@id` cross-references; single `<script>` per page (Q2-C)
- D034: `/blog/personal` nested breadcrumb (Home → Blog → Personal) + CollectionPage (Q3-B)
- D035: Zod-at-factory-boundary + manual external validation (validator.schema.org + Lighthouse) (Q4-C)
- D036: No date fields on Project CreativeWork — project type has none (Q5-A)
- D037: Person-as-publisher on BlogPosting (personal-blog pattern) (Q6-A)

**Files touched:** `docs/slices/slice-15/slice-15b/spec.md` (rewritten from stub to full Level 2 spec).
```

Create `docs/slices/slice-15/slice-15b/handoff.md`:

```markdown
# Handoff — Sub-Slice 15b JSON-LD & Rich Results

**Self-appending.** Starts as a stub at sub-slice kickoff. Grows a `### Task 15b-N` section each time a Level 3 task lands. Finalized with `## Summary` and `## PR Body` at PR time.

**Status:** in progress
**PR:** pending
**Spec:** [`./spec.md`](./spec.md) | **Plan:** [`./plan.md`](./plan.md)

## Scope (from spec)

Ship Schema.org JSON-LD across every public route via an additive extension of 15a's `PageSeoSchema`. One `<script type="application/ld+json">` per page, `@graph`-wrapped, `@id`-cross-referenced. Zod-at-factory guarantees validity; validator.schema.org + Lighthouse confirm externally.

## Tasks completed

(Each Level 3 task appends a section here as it lands.)

## Follow-ups flagged (accumulates)

Decisions needed from Yesid, or items deferred to future slices:

1. _(none yet)_

## Iterations (if any)

| # | Yesid reported | Fix | Files |
|---|----------------|-----|-------|
| _(none yet)_ | — | — | — |

## Summary

*(Added at PR time — one paragraph on what the sub-slice achieved end-to-end.)*

## PR Body

*(Added at PR time — extracted from above.)*

## Final Status

One of: COMPLETE / COMPLETE WITH GAPS / PARTIAL / BLOCKED.
```

- [ ] **Step 2:** Write the failing schema tests.

Create `src/lib/schemas/jsonld.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	PersonSchema,
	WebSiteSchema,
	BlogPostingSchema,
	ServiceSchema,
	CreativeWorkSchema,
	BreadcrumbListSchema,
	ProfilePageSchema,
	CollectionPageSchema,
	SchemaOrgNodeSchema,
} from './jsonld';

const PERSON_ID = 'https://yesid.dev/#person';
const WEBSITE_ID = 'https://yesid.dev/#website';

const validPerson = {
	'@type': 'Person' as const,
	'@id': PERSON_ID,
	name: 'Yesid O.',
	jobTitle: 'Digital Infrastructure Consultant',
	url: 'https://yesid.dev',
	email: 'contact@yesid.dev',
	sameAs: ['https://github.com/mgkdante', 'https://www.linkedin.com/in/otaloray/'],
	knowsAbout: ['PostgreSQL', 'dbt'],
	address: {
		'@type': 'PostalAddress' as const,
		addressLocality: 'Montreal',
		addressRegion: 'QC',
		addressCountry: 'CA',
	},
};

describe('PersonSchema', () => {
	it('accepts a minimal valid Person', () => {
		expect(PersonSchema.safeParse(validPerson).success).toBe(true);
	});

	it('rejects a Person missing name', () => {
		const { name: _n, ...bad } = validPerson;
		expect(PersonSchema.safeParse(bad).success).toBe(false);
	});

	it('rejects a Person with a non-URL @id', () => {
		expect(PersonSchema.safeParse({ ...validPerson, '@id': 'not-a-url' }).success).toBe(false);
	});
});

describe('WebSiteSchema', () => {
	const validWebSite = {
		'@type': 'WebSite' as const,
		'@id': WEBSITE_ID,
		name: 'yesid.',
		url: 'https://yesid.dev',
		description: 'Digital infrastructure that moves.',
		publisher: { '@id': PERSON_ID },
	};

	it('accepts a minimal valid WebSite', () => {
		expect(WebSiteSchema.safeParse(validWebSite).success).toBe(true);
	});

	it('rejects WebSite missing publisher @id ref', () => {
		const { publisher: _p, ...bad } = validWebSite;
		expect(WebSiteSchema.safeParse(bad).success).toBe(false);
	});
});

describe('BlogPostingSchema', () => {
	const validBlogPosting = {
		'@type': 'BlogPosting' as const,
		'@id': 'https://yesid.dev/blog/test-post',
		headline: 'Test Post',
		description: 'A'.repeat(120),
		inLanguage: 'en',
		datePublished: '2026-04-20',
		author: { '@id': PERSON_ID },
		publisher: { '@id': PERSON_ID },
		mainEntityOfPage: 'https://yesid.dev/blog/test-post',
	};

	it('accepts a minimal valid BlogPosting', () => {
		expect(BlogPostingSchema.safeParse(validBlogPosting).success).toBe(true);
	});

	it('rejects BlogPosting missing headline', () => {
		const { headline: _h, ...bad } = validBlogPosting;
		expect(BlogPostingSchema.safeParse(bad).success).toBe(false);
	});

	it('accepts optional image field', () => {
		const withImage = {
			...validBlogPosting,
			image: 'https://yesid.dev/og/default.en.png',
		};
		expect(BlogPostingSchema.safeParse(withImage).success).toBe(true);
	});
});

describe('ServiceSchema', () => {
	const validService = {
		'@type': 'Service' as const,
		'@id': 'https://yesid.dev/services/sql-consulting',
		name: 'SQL Consulting',
		description: 'PostgreSQL consulting for growing teams.',
		provider: { '@id': PERSON_ID },
		availableLanguage: ['en'],
	};

	it('accepts a minimal valid Service', () => {
		expect(ServiceSchema.safeParse(validService).success).toBe(true);
	});

	it('accepts optional areaServed field', () => {
		const withArea = { ...validService, areaServed: 'CA' };
		expect(ServiceSchema.safeParse(withArea).success).toBe(true);
	});
});

describe('CreativeWorkSchema', () => {
	const validCreativeWork = {
		'@type': 'CreativeWork' as const,
		'@id': 'https://yesid.dev/projects/test-project',
		name: 'Test Project',
		description: 'A sample project for testing.',
		url: 'https://yesid.dev/projects/test-project',
		author: { '@id': PERSON_ID },
		creator: { '@id': PERSON_ID },
		keywords: ['sql', 'postgresql'],
		about: ['PostgreSQL', 'dbt'],
	};

	it('accepts a minimal valid CreativeWork (no dates, per Q5-A)', () => {
		expect(CreativeWorkSchema.safeParse(validCreativeWork).success).toBe(true);
	});

	it('rejects CreativeWork missing author @id ref', () => {
		const { author: _a, ...bad } = validCreativeWork;
		expect(CreativeWorkSchema.safeParse(bad).success).toBe(false);
	});
});

describe('BreadcrumbListSchema', () => {
	const validBreadcrumb = {
		'@type': 'BreadcrumbList' as const,
		'@id': 'https://yesid.dev/about#breadcrumb',
		itemListElement: [
			{ '@type': 'ListItem' as const, position: 1, name: 'Home', item: 'https://yesid.dev' },
			{ '@type': 'ListItem' as const, position: 2, name: 'About', item: 'https://yesid.dev/about' },
		],
	};

	it('accepts a valid BreadcrumbList with 2 items', () => {
		expect(BreadcrumbListSchema.safeParse(validBreadcrumb).success).toBe(true);
	});

	it('rejects BreadcrumbList with 1 item', () => {
		const bad = { ...validBreadcrumb, itemListElement: [validBreadcrumb.itemListElement[0]] };
		expect(BreadcrumbListSchema.safeParse(bad).success).toBe(false);
	});

	it('rejects BreadcrumbList with 0 items', () => {
		const bad = { ...validBreadcrumb, itemListElement: [] };
		expect(BreadcrumbListSchema.safeParse(bad).success).toBe(false);
	});
});

describe('ProfilePageSchema', () => {
	const validProfilePage = {
		'@type': 'ProfilePage' as const,
		'@id': 'https://yesid.dev/about#profilepage',
		mainEntity: { '@id': PERSON_ID },
	};

	it('accepts a minimal valid ProfilePage', () => {
		expect(ProfilePageSchema.safeParse(validProfilePage).success).toBe(true);
	});

	it('accepts optional dateCreated + dateModified', () => {
		const withDates = {
			...validProfilePage,
			dateCreated: '2024-01-01',
			dateModified: '2026-04-20',
		};
		expect(ProfilePageSchema.safeParse(withDates).success).toBe(true);
	});
});

describe('CollectionPageSchema', () => {
	const validCollectionPage = {
		'@type': 'CollectionPage' as const,
		'@id': 'https://yesid.dev/blog#collectionpage',
		name: 'Blog',
		description: 'Notes on data infrastructure.',
		url: 'https://yesid.dev/blog',
	};

	it('accepts a minimal valid CollectionPage', () => {
		expect(CollectionPageSchema.safeParse(validCollectionPage).success).toBe(true);
	});
});

describe('SchemaOrgNodeSchema (discriminated union)', () => {
	it('narrows by @type — Person', () => {
		const result = SchemaOrgNodeSchema.parse(validPerson);
		expect(result['@type']).toBe('Person');
	});

	it('rejects an object with unknown @type', () => {
		const bad = { '@type': 'Unicorn', '@id': 'https://yesid.dev/#u', name: 'X' };
		expect(SchemaOrgNodeSchema.safeParse(bad).success).toBe(false);
	});

	it('accepts a valid BreadcrumbList through the union', () => {
		const bc = {
			'@type': 'BreadcrumbList' as const,
			'@id': 'https://yesid.dev/x#b',
			itemListElement: [
				{ '@type': 'ListItem' as const, position: 1, name: 'Home', item: 'https://yesid.dev' },
				{ '@type': 'ListItem' as const, position: 2, name: 'X', item: 'https://yesid.dev/x' },
			],
		};
		expect(SchemaOrgNodeSchema.safeParse(bc).success).toBe(true);
	});
});
```

- [ ] **Step 3:** Run test to verify all fail (module not yet defined).

```bash
bun run test src/lib/schemas/jsonld.test.ts
```

Expected: every test fails with "Cannot find module './jsonld'".

- [ ] **Step 4:** Write the schema module.

Create `src/lib/schemas/jsonld.ts`:

```ts
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
	author: IdRef,
	publisher: IdRef,
	mainEntityOfPage: z.string().url(),
	image: z.string().url().optional(),
});

export const ServiceSchema = z.object({
	'@type': z.literal('Service'),
	'@id': z.string().url(),
	name: z.string().min(1),
	description: z.string().min(1),
	provider: IdRef,
	availableLanguage: z.array(z.string().min(2)).min(1),
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
```

- [ ] **Step 5:** Run tests to verify all pass.

```bash
bun run test src/lib/schemas/jsonld.test.ts
```

Expected: all ~22 tests pass.

- [ ] **Step 6:** Run full check to confirm no regressions.

```bash
bun run check
```

Expected: 0 errors.

- [ ] **Step 7:** Append to `log.md` + `handoff.md`. Commit.

Append to `handoff.md`:

```markdown
### Task 15b-1: Zod schemas for 8 Schema.org node types

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (<model>, <execution-mode>)
**Session:** 2026-04-20

**Files:**
- Created: `src/lib/schemas/jsonld.ts`, `src/lib/schemas/jsonld.test.ts`, `docs/slices/slice-15/slice-15b/log.md`, `docs/slices/slice-15/slice-15b/handoff.md`

**What landed:** Zod discriminated-union on `@type` for 8 node types (Person, WebSite, BlogPosting, Service, CreativeWork, BreadcrumbList, ProfilePage, CollectionPage) + shared primitives (IdRef, PostalAddress, ListItem). `SchemaOrgNodeSchema` narrows cleanly on parse. Type exports for every schema plus `BreadcrumbListItem` for factory consumers.

**Decisions:** _(none beyond spec Q1-Q6)_

**Tests:** PASS (~22 new tests) | `bun run check`: 0 errors
```

Commit:

```bash
git add src/lib/schemas/jsonld.ts src/lib/schemas/jsonld.test.ts docs/slices/slice-15/slice-15b/log.md docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(1): Zod schemas for 8 Schema.org node types"
```

**STOP. Ask Yesid to verify the schema module + test coverage before Task 2.**

---

## Task 2: Extend `PageSeoSchema` with optional `jsonLd` + re-export `SchemaOrgNode`

**Files:**
- Modify: `src/lib/schemas/seo.ts`
- Modify: `src/lib/schemas/seo.test.ts`
- Modify: `src/lib/types.ts`

### Steps

- [ ] **Step 1:** Write the failing tests for the extended shape.

Append to `src/lib/schemas/seo.test.ts`:

```ts
import { SchemaOrgNodeSchema } from './jsonld';

describe('PageSeoSchema.jsonLd extension (Slice 15b)', () => {
	it('accepts a base entry with no jsonLd (backward compat with 15a)', () => {
		const result = PageSeoSchema.safeParse(validBase);
		expect(result.success).toBe(true);
	});

	it('accepts an entry with a jsonLd array', () => {
		const withJsonLd = {
			...validBase,
			jsonLd: [
				{
					'@type': 'BreadcrumbList' as const,
					'@id': 'https://yesid.dev/about#breadcrumb',
					itemListElement: [
						{
							'@type': 'ListItem' as const,
							position: 1,
							name: 'Home',
							item: 'https://yesid.dev',
						},
						{
							'@type': 'ListItem' as const,
							position: 2,
							name: 'About',
							item: 'https://yesid.dev/about',
						},
					],
				},
			],
		};
		expect(PageSeoSchema.safeParse(withJsonLd).success).toBe(true);
	});

	it('rejects an entry with malformed jsonLd (unknown @type)', () => {
		const withBad = {
			...validBase,
			jsonLd: [{ '@type': 'Unicorn', '@id': 'https://yesid.dev/#u', name: 'X' }],
		};
		expect(PageSeoSchema.safeParse(withBad).success).toBe(false);
	});

	it('accepts an empty jsonLd array', () => {
		const withEmpty = { ...validBase, jsonLd: [] };
		expect(PageSeoSchema.safeParse(withEmpty).success).toBe(true);
	});
});
```

- [ ] **Step 2:** Run test to verify the new cases fail (jsonLd field not yet accepted).

```bash
bun run test src/lib/schemas/seo.test.ts
```

Expected: the "accepts an entry with a jsonLd array" and "rejects malformed jsonLd" cases fail; existing 16 tests pass.

- [ ] **Step 3:** Extend `PageSeoSchema` with `jsonLd` + re-export `SchemaOrgNode`.

Replace the `PageSeoSchema` definition at `src/lib/schemas/seo.ts` end-of-file by adding `jsonLd` + a re-export block:

```ts
// Near the top, add the jsonld import:
import { SchemaOrgNodeSchema } from './jsonld';

// The PageSeoSchema definition now ends with jsonLd:
export const PageSeoSchema = z.object({
	title: LocalizedStringSchema.refine(/* ...existing refine unchanged... */),
	description: LocalizedStringSchema.refine(/* ...existing refine unchanged... */),
	canonical: z.string().url(),
	ogImage: z
		.object({
			url: z.string().min(1),
			alt: LocalizedStringSchema,
			width: z.number().default(1200),
			height: z.number().default(630),
		})
		.optional(),
	ogType: z.enum(['website', 'article', 'profile']).default('website'),
	noIndex: z.boolean().default(false),
	jsonLd: z.array(SchemaOrgNodeSchema).optional(),
});

export type PageSeo = z.infer<typeof PageSeoSchema>;

// Re-export SchemaOrgNode so consumers (routeSeoEntries) import from the
// single SEO surface. Keeps types.ts's existing `export { PageSeo }` pattern.
export type { SchemaOrgNode } from './jsonld';
```

Use `Edit` to insert `jsonLd: z.array(SchemaOrgNodeSchema).optional(),` just before the closing `});` of `PageSeoSchema`, and add the import + re-export lines. Do not touch the existing refines.

- [ ] **Step 4:** Update `src/lib/types.ts` to re-export `SchemaOrgNode` alongside `PageSeo`.

Find the line `export type { PageSeo } from '$lib/schemas/seo';` and replace with:

```ts
// Slice 15a: PageSeo + SchemaOrgNode defined in $lib/schemas via Zod; re-exported
// here so types.ts remains the single import surface for consumer code.
// SchemaOrgNode added in Slice 15b.
export type { PageSeo, SchemaOrgNode } from '$lib/schemas/seo';
```

- [ ] **Step 5:** Run tests — the new `PageSeoSchema` cases should now pass; every 15a test stays green.

```bash
bun run test src/lib/schemas/seo.test.ts
bun run test src/lib/schemas/jsonld.test.ts
bun run test src/lib/adapters/meta.test.ts
```

Expected: all tests pass. The 16 original 15a tests + 4 new tests in `seo.test.ts`; 22 tests in `jsonld.test.ts`; 8 existing tests in `meta.test.ts`.

- [ ] **Step 6:** `bun run check` — 0 errors.

- [ ] **Step 7:** Append to `handoff.md`. Commit.

```bash
git add src/lib/schemas/seo.ts src/lib/schemas/seo.test.ts src/lib/types.ts docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(2): extend PageSeoSchema with optional jsonLd; re-export SchemaOrgNode"
```

**STOP. Ask Yesid to verify the extension is additive (15a tests still green) before Task 3.**

---

## Task 3: Reference-anchor factories — `buildPersonNode` + `buildWebSiteNode` + constants

**Files:**
- Create: `src/lib/adapters/jsonld.ts`
- Create: `src/lib/adapters/jsonld.test.ts`

### Steps

- [ ] **Step 1:** Write the failing tests.

Create `src/lib/adapters/jsonld.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { siteMeta } from '$lib/content/meta';
import {
	PERSON_ID,
	WEBSITE_ID,
	buildPersonNode,
	buildWebSiteNode,
} from './jsonld';

describe('PERSON_ID / WEBSITE_ID constants', () => {
	it('PERSON_ID resolves against SITE_HOST with #person fragment', () => {
		expect(PERSON_ID).toBe('https://yesid.dev/#person');
	});

	it('WEBSITE_ID resolves against SITE_HOST with #website fragment', () => {
		expect(WEBSITE_ID).toBe('https://yesid.dev/#website');
	});
});

describe('buildPersonNode', () => {
	it('produces a Zod-parseable Person', () => {
		const node = buildPersonNode(siteMeta);
		expect(node['@type']).toBe('Person');
		expect(node['@id']).toBe(PERSON_ID);
	});

	it('maps owner.name verbatim', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.name).toBe(siteMeta.owner.name);
	});

	it('resolves jobTitle from owner.jobTitle.en', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.jobTitle).toBe(siteMeta.owner.jobTitle.en);
	});

	it('includes GitHub + LinkedIn in sameAs when present', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.sameAs).toContain(siteMeta.links.github);
		expect(node.sameAs).toContain(siteMeta.links.linkedin);
	});

	it('maps owner.address to PostalAddress', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.address).toEqual({
			'@type': 'PostalAddress',
			addressLocality: siteMeta.owner.address.locality,
			addressRegion: siteMeta.owner.address.region,
			addressCountry: siteMeta.owner.address.country,
		});
	});
});

describe('buildWebSiteNode', () => {
	it('produces a Zod-parseable WebSite', () => {
		const node = buildWebSiteNode(siteMeta);
		expect(node['@type']).toBe('WebSite');
		expect(node['@id']).toBe(WEBSITE_ID);
	});

	it('references Person via publisher @id', () => {
		const node = buildWebSiteNode(siteMeta);
		expect(node.publisher).toEqual({ '@id': PERSON_ID });
	});

	it('uses siteMeta.description.en as description', () => {
		const node = buildWebSiteNode(siteMeta);
		expect(node.description).toBe(siteMeta.description.en);
	});
});
```

- [ ] **Step 2:** Run test — fails with "Cannot find module './jsonld'".

```bash
bun run test src/lib/adapters/jsonld.test.ts
```

- [ ] **Step 3:** Implement the factories.

Create `src/lib/adapters/jsonld.ts`:

```ts
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
	Person,
	WebSite,
} from '$lib/schemas/jsonld';
import type { SiteMeta } from '$lib/types';
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
```

- [ ] **Step 4:** Run tests — all pass.

```bash
bun run test src/lib/adapters/jsonld.test.ts
```

Expected: ~10 tests pass.

- [ ] **Step 5:** `bun run check` — 0 errors.

- [ ] **Step 6:** Append to `handoff.md`. Commit.

```bash
git add src/lib/adapters/jsonld.ts src/lib/adapters/jsonld.test.ts docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(3): buildPersonNode + buildWebSiteNode + PERSON_ID/WEBSITE_ID constants"
```

**STOP. Ask Yesid to verify Person + WebSite factories before Task 4.**

---

## Task 4: Page-type factories — ProfilePage + BreadcrumbList + CollectionPage

**Files:**
- Modify: `src/lib/adapters/jsonld.ts`
- Modify: `src/lib/adapters/jsonld.test.ts`

### Steps

- [ ] **Step 1:** Write the failing tests. Append to `src/lib/adapters/jsonld.test.ts`:

```ts
import {
	buildProfilePageNode,
	buildBreadcrumbListNode,
	buildCollectionPageNode,
} from './jsonld';

describe('buildProfilePageNode', () => {
	it('produces a Zod-parseable ProfilePage', () => {
		const node = buildProfilePageNode('https://yesid.dev/about');
		expect(node['@type']).toBe('ProfilePage');
		expect(node['@id']).toBe('https://yesid.dev/about#profilepage');
	});

	it('references Person via mainEntity @id', () => {
		const node = buildProfilePageNode('https://yesid.dev/about');
		expect(node.mainEntity).toEqual({ '@id': PERSON_ID });
	});
});

describe('buildBreadcrumbListNode', () => {
	const items = [
		{ name: 'Home', url: 'https://yesid.dev' },
		{ name: 'Blog', url: 'https://yesid.dev/blog' },
		{ name: 'My Post', url: 'https://yesid.dev/blog/my-post' },
	];

	it('produces a Zod-parseable BreadcrumbList', () => {
		const node = buildBreadcrumbListNode(items, 'https://yesid.dev/blog/my-post');
		expect(node['@type']).toBe('BreadcrumbList');
		expect(node['@id']).toBe('https://yesid.dev/blog/my-post#breadcrumb');
	});

	it('emits items with sequential position starting at 1', () => {
		const node = buildBreadcrumbListNode(items, 'https://yesid.dev/blog/my-post');
		expect(node.itemListElement).toHaveLength(3);
		expect(node.itemListElement[0].position).toBe(1);
		expect(node.itemListElement[1].position).toBe(2);
		expect(node.itemListElement[2].position).toBe(3);
	});

	it('copies name + item from input', () => {
		const node = buildBreadcrumbListNode(items, 'https://yesid.dev/blog/my-post');
		expect(node.itemListElement[2].name).toBe('My Post');
		expect(node.itemListElement[2].item).toBe('https://yesid.dev/blog/my-post');
	});
});

describe('buildCollectionPageNode', () => {
	it('produces a Zod-parseable CollectionPage', () => {
		const node = buildCollectionPageNode({
			name: 'Blog',
			description: 'Notes on data infrastructure.',
			url: 'https://yesid.dev/blog',
		});
		expect(node['@type']).toBe('CollectionPage');
		expect(node['@id']).toBe('https://yesid.dev/blog#collectionpage');
		expect(node.name).toBe('Blog');
	});
});
```

- [ ] **Step 2:** Run — 7 new tests fail (functions not yet defined).

```bash
bun run test src/lib/adapters/jsonld.test.ts
```

- [ ] **Step 3:** Implement the three factories. Append to `src/lib/adapters/jsonld.ts`:

```ts
import type {
	BreadcrumbList,
	BreadcrumbListItem,
	CollectionPage,
	ProfilePage,
} from '$lib/schemas/jsonld';

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
```

- [ ] **Step 4:** Run tests — all pass.

```bash
bun run test src/lib/adapters/jsonld.test.ts
```

Expected: ~17 tests pass (10 from Task 3 + 7 new).

- [ ] **Step 5:** `bun run check` — 0 errors.

- [ ] **Step 6:** Append to `handoff.md`. Commit.

```bash
git add src/lib/adapters/jsonld.ts src/lib/adapters/jsonld.test.ts docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(4): buildProfilePageNode + buildBreadcrumbListNode + buildCollectionPageNode"
```

**STOP. Ask Yesid to verify before Task 5.**

---

## Task 5: Domain-content factories — BlogPosting + Service + CreativeWork

**Files:**
- Modify: `src/lib/adapters/jsonld.ts`
- Modify: `src/lib/adapters/jsonld.test.ts`

### Steps

- [ ] **Step 1:** Write the failing tests. Append to `src/lib/adapters/jsonld.test.ts`:

```ts
import { adapter } from './index';
import {
	buildBlogPostingNode,
	buildServiceNode,
	buildCreativeWorkNode,
} from './jsonld';

describe('buildBlogPostingNode', () => {
	it('produces a Zod-parseable BlogPosting from a real post', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const post = posts[0];
		const node = buildBlogPostingNode(post, 'en');
		expect(node['@type']).toBe('BlogPosting');
		expect(node['@id']).toBe(`https://yesid.dev/blog/${post.slug}`);
	});

	it('copies inLanguage from post.lang', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const post = posts[0];
		const node = buildBlogPostingNode(post, 'en');
		expect(node.inLanguage).toBe(post.lang);
	});

	it('references Person via author + publisher @ids (Q6-A: same @id)', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const node = buildBlogPostingNode(posts[0], 'en');
		expect(node.author).toEqual({ '@id': PERSON_ID });
		expect(node.publisher).toEqual({ '@id': PERSON_ID });
	});

	it('uses post.date as datePublished', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const post = posts[0];
		const node = buildBlogPostingNode(post, 'en');
		expect(node.datePublished).toBe(post.date);
	});
});

describe('buildServiceNode', () => {
	it('produces a Zod-parseable Service from a real service', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const service = services[0];
		const node = buildServiceNode(service, 'en');
		expect(node['@type']).toBe('Service');
		expect(node['@id']).toBe(`https://yesid.dev/services/${service.id}`);
	});

	it('references Person via provider @id', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const node = buildServiceNode(services[0], 'en');
		expect(node.provider).toEqual({ '@id': PERSON_ID });
	});

	it('populates availableLanguage from PUBLISHED_LOCALES', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const node = buildServiceNode(services[0], 'en');
		expect(node.availableLanguage).toEqual(['en']);
	});
});

describe('buildCreativeWorkNode', () => {
	it('produces a Zod-parseable CreativeWork from a real project', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const project = projects[0];
		const node = buildCreativeWorkNode(project, 'en');
		expect(node['@type']).toBe('CreativeWork');
		expect(node['@id']).toBe(`https://yesid.dev/projects/${project.slug}`);
	});

	it('references Person via author + creator @ids', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const node = buildCreativeWorkNode(projects[0], 'en');
		expect(node.author).toEqual({ '@id': PERSON_ID });
		expect(node.creator).toEqual({ '@id': PERSON_ID });
	});

	it('copies project.tags into keywords + project.stack into about', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const project = projects[0];
		const node = buildCreativeWorkNode(project, 'en');
		expect(node.keywords).toEqual(project.tags);
		expect(node.about).toEqual(project.stack);
	});

	it('omits dates per Q5-A decision — Project has no date field', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const node = buildCreativeWorkNode(projects[0], 'en');
		// CreativeWorkSchema doesn't declare datePublished; emitting one would
		// fail the Zod parse. Assert absence to guard against regression.
		expect((node as Record<string, unknown>).datePublished).toBeUndefined();
		expect((node as Record<string, unknown>).dateModified).toBeUndefined();
	});
});
```

- [ ] **Step 2:** Run — 11 new tests fail.

```bash
bun run test src/lib/adapters/jsonld.test.ts
```

- [ ] **Step 3:** Implement the three factories. Append to `src/lib/adapters/jsonld.ts`:

```ts
import type {
	BlogPosting,
	CreativeWork,
	Service as ServiceNode,
} from '$lib/schemas/jsonld';
import type {
	BlogPost,
	Locale,
	Project,
	Service as ServiceDomain,
} from '$lib/types';
import { resolveLocale } from '$lib/utils/locale';
import { PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';

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
	const built = {
		'@type': 'Service' as const,
		'@id': canonicalUrl,
		name: resolveLocale(service.title, locale),
		description: resolveLocale(service.description, locale),
		provider: { '@id': PERSON_ID },
		availableLanguage: [...PUBLISHED_LOCALES],
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
```

- [ ] **Step 4:** Run tests — all pass.

```bash
bun run test src/lib/adapters/jsonld.test.ts
```

Expected: ~28 tests pass (17 prior + 11 new).

- [ ] **Step 5:** `bun run check` — 0 errors.

- [ ] **Step 6:** Append to `handoff.md`. Commit.

```bash
git add src/lib/adapters/jsonld.ts src/lib/adapters/jsonld.test.ts docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(5): buildBlogPostingNode + buildServiceNode + buildCreativeWorkNode"
```

**STOP. Ask Yesid to verify the domain-content factories before Task 6.**

---

## Task 6: `JsonLd.svelte` component

**Files:**
- Create: `src/lib/components/seo/JsonLd.svelte`
- Create: `src/lib/components/seo/JsonLd.test.ts`

### Steps

- [ ] **Step 1:** Write the failing tests.

Create `src/lib/components/seo/JsonLd.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import JsonLd from './JsonLd.svelte';
import type { SchemaOrgNode } from '$lib/schemas/seo';

const PERSON_NODE: SchemaOrgNode = {
	'@type': 'Person',
	'@id': 'https://yesid.dev/#person',
	name: 'Yesid O.',
	jobTitle: 'Digital Infrastructure Consultant',
	url: 'https://yesid.dev',
	email: 'contact@yesid.dev',
	sameAs: ['https://github.com/mgkdante'],
	knowsAbout: ['PostgreSQL'],
	address: {
		'@type': 'PostalAddress',
		addressLocality: 'Montreal',
		addressRegion: 'QC',
		addressCountry: 'CA',
	},
};

const BREADCRUMB_NODE: SchemaOrgNode = {
	'@type': 'BreadcrumbList',
	'@id': 'https://yesid.dev/about#breadcrumb',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://yesid.dev' },
		{ '@type': 'ListItem', position: 2, name: 'About', item: 'https://yesid.dev/about' },
	],
};

function scriptTags(): HTMLScriptElement[] {
	return Array.from(
		document.head.querySelectorAll('script[type="application/ld+json"]'),
	) as HTMLScriptElement[];
}

describe('JsonLd.svelte', () => {
	afterEach(() => {
		// Clean <script> tags between tests — Svelte writes to document.head
		// and vitest doesn't reset head between renders.
		document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
	});

	it('emits zero <script> tags when nodes is empty', () => {
		render(JsonLd, { nodes: [] });
		expect(scriptTags()).toHaveLength(0);
	});

	it('emits exactly one <script type="application/ld+json"> when nodes non-empty', () => {
		render(JsonLd, { nodes: [PERSON_NODE, BREADCRUMB_NODE] });
		expect(scriptTags()).toHaveLength(1);
	});

	it('wraps nodes in @graph with @context', () => {
		render(JsonLd, { nodes: [PERSON_NODE] });
		const parsed = JSON.parse(scriptTags()[0].textContent!);
		expect(parsed['@context']).toBe('https://schema.org');
		expect(parsed['@graph']).toHaveLength(1);
		expect(parsed['@graph'][0]['@type']).toBe('Person');
	});

	it('round-trip parses every node unchanged', () => {
		render(JsonLd, { nodes: [PERSON_NODE, BREADCRUMB_NODE] });
		const parsed = JSON.parse(scriptTags()[0].textContent!);
		expect(parsed['@graph']).toEqual([PERSON_NODE, BREADCRUMB_NODE]);
	});

	it('escapes < inside field values (XSS regression guard)', () => {
		const tricky: SchemaOrgNode = {
			...PERSON_NODE,
			name: 'Yesid </script><script>alert(1)</script>',
		};
		render(JsonLd, { nodes: [tricky] });
		const content = scriptTags()[0].textContent!;
		// Raw `<` should never appear in the script body; escaped form required
		expect(content).not.toMatch(/<\/script>/i);
		expect(content).toContain('\\u003c');
		// JSON still parses cleanly
		expect(() => JSON.parse(content)).not.toThrow();
	});
});
```

Note: add `import { afterEach } from 'vitest';` at the top if not already covered by globals; the project's Vitest config enables globals so `afterEach` should resolve.

- [ ] **Step 2:** Run — 5 new tests fail (component doesn't exist).

```bash
bun run test src/lib/components/seo/JsonLd.test.ts
```

- [ ] **Step 3:** Implement the component.

Create `src/lib/components/seo/JsonLd.svelte`:

```svelte
<script lang="ts">
	import type { SchemaOrgNode } from '$lib/schemas/seo';

	let { nodes }: { nodes: readonly SchemaOrgNode[] } = $props();

	// Build the @graph blob once per prop change.
	const graph = $derived({
		'@context': 'https://schema.org',
		'@graph': nodes,
	});

	// JSON.stringify + escape `<` to `\u003c` — a raw `</script>` sequence
	// (or any `<`) inside a <script> body would terminate the element early.
	// Same escape used by Next.js, Nuxt, Astro for JSON-LD embedding.
	const serialized = $derived(JSON.stringify(graph).replace(/</g, '\\u003c'));
</script>

<svelte:head>
	{#if nodes.length > 0}
		{@html `<script type="application/ld+json">${serialized}</script>`}
	{/if}
</svelte:head>
```

- [ ] **Step 4:** Run tests — all pass.

```bash
bun run test src/lib/components/seo/JsonLd.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 5:** `bun run check` — 0 errors.

- [ ] **Step 6:** Append to `handoff.md`. Commit.

```bash
git add src/lib/components/seo/JsonLd.svelte src/lib/components/seo/JsonLd.test.ts docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(6): JsonLd.svelte component — one <script> per page, @graph-wrapped, < escaped"
```

**STOP. Ask Yesid to verify the component + XSS guard before Task 7.**

---

## Task 7: `SeoHead` wiring + meta adapter integration tests

**Files:**
- Modify: `src/lib/components/seo/SeoHead.svelte`
- Modify: `src/lib/components/seo/SeoHead.test.ts`
- Modify: `src/lib/adapters/meta.test.ts`

### Steps

- [ ] **Step 1:** Write failing tests for SeoHead mounting JsonLd. Append to `src/lib/components/seo/SeoHead.test.ts`:

```ts
describe('JsonLd integration (Slice 15b)', () => {
	const baseSeo = {
		title: { en: 'Test' },
		description: { en: 'A'.repeat(120) },
		canonical: 'https://yesid.dev/test',
		ogType: 'website' as const,
		noIndex: false,
	};

	afterEach(() => {
		document.head
			.querySelectorAll('script[type="application/ld+json"]')
			.forEach((el) => el.remove());
	});

	it('does NOT mount <script> when seo.jsonLd is undefined', () => {
		render(SeoHead, { seo: baseSeo, locale: 'en' });
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts).toHaveLength(0);
	});

	it('does NOT mount <script> when seo.jsonLd is empty', () => {
		render(SeoHead, { seo: { ...baseSeo, jsonLd: [] }, locale: 'en' });
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts).toHaveLength(0);
	});

	it('mounts one <script> when seo.jsonLd has nodes', () => {
		const breadcrumb = {
			'@type': 'BreadcrumbList' as const,
			'@id': 'https://yesid.dev/test#breadcrumb',
			itemListElement: [
				{ '@type': 'ListItem' as const, position: 1, name: 'Home', item: 'https://yesid.dev' },
				{
					'@type': 'ListItem' as const,
					position: 2,
					name: 'Test',
					item: 'https://yesid.dev/test',
				},
			],
		};
		render(SeoHead, { seo: { ...baseSeo, jsonLd: [breadcrumb] }, locale: 'en' });
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts).toHaveLength(1);
		const parsed = JSON.parse(scripts[0].textContent!);
		expect(parsed['@graph']).toHaveLength(1);
		expect(parsed['@graph'][0]['@type']).toBe('BreadcrumbList');
	});
});
```

- [ ] **Step 2:** Run — 3 new tests fail (SeoHead doesn't mount JsonLd yet).

```bash
bun run test src/lib/components/seo/SeoHead.test.ts
```

- [ ] **Step 3:** Update `SeoHead.svelte` — import `JsonLd` and mount it at the end of the component.

Add to the `<script>` section (after existing imports):

```ts
import JsonLd from './JsonLd.svelte';
```

Add at the end of the component, AFTER the `</svelte:head>` closing tag:

```svelte
{#if seo.jsonLd && seo.jsonLd.length > 0}
	<JsonLd nodes={seo.jsonLd} />
{/if}
```

The existing `<svelte:head>` block emits meta/OG/Twitter/hreflang. The new `<JsonLd>` child writes its own `<script>` into the document head via its own `<svelte:head>` — Svelte composes child-head contributions into the top-level document head correctly.

- [ ] **Step 4:** Run SeoHead tests — both new and existing pass.

```bash
bun run test src/lib/components/seo/SeoHead.test.ts
```

Expected: 14 existing tests + 3 new = 17 pass.

- [ ] **Step 5:** Write integration tests in `src/lib/adapters/meta.test.ts`. Append:

```ts
describe('adapter.meta.forRoute + jsonLd (Slice 15b)', () => {
	it('returns jsonLd as part of PageSeo for a static route', async () => {
		const seo = await adapter.meta.forRoute('/about', 'en');
		expect(seo.jsonLd).toBeDefined();
		expect(Array.isArray(seo.jsonLd)).toBe(true);
	});

	it('parses jsonLd through PageSeoSchema at the adapter boundary', async () => {
		// If an entry's jsonLd is malformed, forRoute must throw at the Zod parse.
		// We can't directly inject a bad entry from a test, but we can rely on
		// the Zod parse as the documented contract: cover it in the schema tests
		// and assert here that a known-good entry round-trips cleanly.
		const seo = await adapter.meta.forRoute('/blog', 'en');
		expect(seo.jsonLd).toBeDefined();
		for (const node of seo.jsonLd ?? []) {
			expect(node).toHaveProperty('@type');
			expect(node).toHaveProperty('@id');
		}
	});

	it('returns jsonLd for a dynamic blog route', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const seo = await adapter.meta.forRoute('/blog/[slug]', 'en', { slug: posts[0].slug });
		expect(seo.jsonLd).toBeDefined();
		const types = (seo.jsonLd ?? []).map((n) => n['@type']);
		expect(types).toContain('BlogPosting');
		expect(types).toContain('BreadcrumbList');
	});
});
```

Note: these tests will FAIL at this point — route entries don't populate `jsonLd` yet. Task 8 makes them pass.

- [ ] **Step 6:** Run tests — the SeoHead ones pass now; the adapter.meta.forRoute + jsonLd tests fail with `jsonLd` undefined until Task 8.

```bash
bun run test src/lib/adapters/meta.test.ts
```

Expected: existing 8 tests pass; the 3 new jsonLd integration tests fail with `expect(received).toBeDefined()` against `undefined`. This is the expected RED state for Task 8.

- [ ] **Step 7:** `bun run check` — 0 errors (type-level only; runtime test reds are expected).

- [ ] **Step 8:** Append to `handoff.md`. Commit (with the RED integration tests committed — they're the TDD-RED that Task 8 flips to GREEN).

```bash
git add src/lib/components/seo/SeoHead.svelte src/lib/components/seo/SeoHead.test.ts src/lib/adapters/meta.test.ts docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(7): SeoHead mounts JsonLd child; integration RED tests for route jsonLd"
```

**STOP. Ask Yesid to verify the SeoHead wiring + confirm the three RED integration tests are expected before Task 8.**

---

## Task 8: Populate `jsonLd` on all 11 routes in `routeSeoEntries`

**Files:**
- Modify: `src/lib/content/meta.ts`
- Modify: `src/lib/adapters/meta.test.ts`

### Steps

- [ ] **Step 1:** Write additional integration tests that assert correct node types per route. Append to `src/lib/adapters/meta.test.ts`:

```ts
describe('adapter.meta.forRoute + jsonLd — per-route coverage', () => {
	async function typesFor(routeId: string, params?: Record<string, string>): Promise<string[]> {
		const seo = await adapter.meta.forRoute(routeId, 'en', params);
		return (seo.jsonLd ?? []).map((n) => n['@type']);
	}

	it('/ emits Person + WebSite + ProfilePage', async () => {
		const types = await typesFor('/');
		expect(types).toEqual(['Person', 'WebSite', 'ProfilePage']);
	});

	it('/about emits Person + ProfilePage + BreadcrumbList', async () => {
		const types = await typesFor('/about');
		expect(types).toEqual(['Person', 'ProfilePage', 'BreadcrumbList']);
	});

	it('/contact emits BreadcrumbList only', async () => {
		expect(await typesFor('/contact')).toEqual(['BreadcrumbList']);
	});

	it('/services emits CollectionPage + BreadcrumbList', async () => {
		expect(await typesFor('/services')).toEqual(['CollectionPage', 'BreadcrumbList']);
	});

	it('/services/[id] emits Service + BreadcrumbList', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const types = await typesFor('/services/[id]', { id: services[0].id });
		expect(types).toEqual(['Service', 'BreadcrumbList']);
	});

	it('/projects emits CollectionPage + BreadcrumbList', async () => {
		expect(await typesFor('/projects')).toEqual(['CollectionPage', 'BreadcrumbList']);
	});

	it('/projects/[slug] emits CreativeWork + BreadcrumbList', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const types = await typesFor('/projects/[slug]', { slug: projects[0].slug });
		expect(types).toEqual(['CreativeWork', 'BreadcrumbList']);
	});

	it('/blog emits CollectionPage + BreadcrumbList', async () => {
		expect(await typesFor('/blog')).toEqual(['CollectionPage', 'BreadcrumbList']);
	});

	it('/blog/personal emits CollectionPage + BreadcrumbList (nested: Home → Blog → Personal)', async () => {
		const seo = await adapter.meta.forRoute('/blog/personal', 'en');
		const types = (seo.jsonLd ?? []).map((n) => n['@type']);
		expect(types).toEqual(['CollectionPage', 'BreadcrumbList']);
		// Check the nested breadcrumb trail (Q3-B)
		const breadcrumb = seo.jsonLd?.find((n) => n['@type'] === 'BreadcrumbList');
		expect(breadcrumb).toBeDefined();
		if (breadcrumb && breadcrumb['@type'] === 'BreadcrumbList') {
			expect(breadcrumb.itemListElement).toHaveLength(3);
			expect(breadcrumb.itemListElement[1].name).toBe('Blog');
			expect(breadcrumb.itemListElement[2].name).toBe('Personal');
		}
	});

	it('/blog/[slug] emits BlogPosting + BreadcrumbList', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const types = await typesFor('/blog/[slug]', { slug: posts[0].slug });
		expect(types).toEqual(['BlogPosting', 'BreadcrumbList']);
	});

	it('/tech-stack emits BreadcrumbList only', async () => {
		expect(await typesFor('/tech-stack')).toEqual(['BreadcrumbList']);
	});

	it('/__error emits no jsonLd (noIndex route, per spec)', async () => {
		const seo = await adapter.meta.forRoute('/__error', 'en');
		expect(seo.jsonLd === undefined || seo.jsonLd.length === 0).toBe(true);
	});
});
```

- [ ] **Step 2:** Run — all 12 new tests fail with `seo.jsonLd` undefined.

```bash
bun run test src/lib/adapters/meta.test.ts
```

- [ ] **Step 3:** Populate `jsonLd` on every entry in `src/lib/content/meta.ts::routeSeoEntries`.

At the top of `src/lib/content/meta.ts`, add factory imports:

```ts
import {
	buildPersonNode,
	buildWebSiteNode,
	buildProfilePageNode,
	buildBreadcrumbListNode,
	buildCollectionPageNode,
	buildBlogPostingNode,
	buildServiceNode,
	buildCreativeWorkNode,
} from '$lib/adapters/jsonld';
```

Now update each route entry. Here are the exact 11 entries to replace (static routes first, then dynamic factories):

```ts
'/': {
	title: { en: 'yesid. — Digital Infrastructure that Moves.' },
	description: {
		en: 'Freelance SQL developer and digital infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, and Python. Real-time pipelines, analytics, dashboards.',
	},
	canonical: SITE_HOST,
	ogType: 'website',
	noIndex: false,
	jsonLd: [
		buildPersonNode(siteMeta),
		buildWebSiteNode(siteMeta),
		buildProfilePageNode(SITE_HOST),
	],
},
'/about': {
	title: { en: 'About Yesid | yesid.' },
	description: {
		en: 'Montreal-based digital infrastructure consultant. Background in SQL, data warehousing, and real-time analytics. Available for freelance and consulting work.',
	},
	canonical: `${SITE_HOST}/about`,
	ogType: 'profile',
	noIndex: false,
	jsonLd: [
		buildPersonNode(siteMeta),
		buildProfilePageNode(`${SITE_HOST}/about`),
		buildBreadcrumbListNode(
			[
				{ name: 'Home', url: SITE_HOST },
				{ name: 'About', url: `${SITE_HOST}/about` },
			],
			`${SITE_HOST}/about`,
		),
	],
},
'/contact': {
	title: { en: 'Contact | yesid.' },
	description: {
		en: 'Get in touch for freelance SQL, PostgreSQL, dbt, Power BI, or data infrastructure work. Based in Montreal; available across Canada and for remote engagements.',
	},
	canonical: `${SITE_HOST}/contact`,
	ogType: 'website',
	noIndex: false,
	jsonLd: [
		buildBreadcrumbListNode(
			[
				{ name: 'Home', url: SITE_HOST },
				{ name: 'Contact', url: `${SITE_HOST}/contact` },
			],
			`${SITE_HOST}/contact`,
		),
	],
},
'/services': {
	title: { en: 'Services | yesid.' },
	description: {
		en: 'Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms for growing teams.',
	},
	canonical: `${SITE_HOST}/services`,
	ogType: 'website',
	noIndex: false,
	jsonLd: [
		buildCollectionPageNode({
			name: 'Services',
			description:
				'Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms.',
			url: `${SITE_HOST}/services`,
		}),
		buildBreadcrumbListNode(
			[
				{ name: 'Home', url: SITE_HOST },
				{ name: 'Services', url: `${SITE_HOST}/services` },
			],
			`${SITE_HOST}/services`,
		),
	],
},
'/services/[id]': async (params, locale) => {
	const { adapter } = await import('$lib/adapters');
	const service = await adapter.services.byId(params.id);
	if (!service) throw new Error(`Unknown service id: ${params.id}`);
	const canonicalUrl = `${SITE_HOST}/services/${service.id}`;
	return {
		title: { en: `${service.title.en} | yesid.` },
		description: fitDescriptionForSeo(service.description),
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildServiceNode(service, locale),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Services', url: `${SITE_HOST}/services` },
					{ name: service.title.en, url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};
},
'/projects': {
	title: { en: 'Projects | yesid.' },
	description: {
		en: 'Recent freelance and client work: real-time transit pipelines, analytics platforms, dashboards, ETL, and infrastructure projects for teams in Montreal and Canada.',
	},
	canonical: `${SITE_HOST}/projects`,
	ogType: 'website',
	noIndex: false,
	jsonLd: [
		buildCollectionPageNode({
			name: 'Projects',
			description:
				'Recent freelance and client work: transit pipelines, analytics platforms, dashboards, ETL, and infrastructure projects.',
			url: `${SITE_HOST}/projects`,
		}),
		buildBreadcrumbListNode(
			[
				{ name: 'Home', url: SITE_HOST },
				{ name: 'Projects', url: `${SITE_HOST}/projects` },
			],
			`${SITE_HOST}/projects`,
		),
	],
},
'/projects/[slug]': async (params, locale) => {
	const { adapter } = await import('$lib/adapters');
	const project = await adapter.projects.bySlug(params.slug);
	if (!project) throw new Error(`Unknown project slug: ${params.slug}`);
	const canonicalUrl = `${SITE_HOST}/projects/${project.slug}`;
	const desc =
		fitDescriptionForSeo(project.description) !== FALLBACK_DESCRIPTION
			? project.description
			: fitDescriptionForSeo(project.oneLiner);
	return {
		title: { en: `${project.title.en} | yesid.` },
		description: desc,
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildCreativeWorkNode(project, locale),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Projects', url: `${SITE_HOST}/projects` },
					{ name: project.title.en, url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};
},
'/blog': {
	title: { en: 'Blog | yesid.' },
	description: {
		en: 'Notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and building analytics systems for growing teams. Montreal-based freelance consultant.',
	},
	canonical: `${SITE_HOST}/blog`,
	ogType: 'website',
	noIndex: false,
	jsonLd: [
		buildCollectionPageNode({
			name: 'Blog',
			description:
				'Notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and analytics systems.',
			url: `${SITE_HOST}/blog`,
		}),
		buildBreadcrumbListNode(
			[
				{ name: 'Home', url: SITE_HOST },
				{ name: 'Blog', url: `${SITE_HOST}/blog` },
			],
			`${SITE_HOST}/blog`,
		),
	],
},
'/blog/personal': {
	title: { en: 'Personal Blog | yesid.' },
	description: {
		en: 'Off-work notes: tools, reading, experiments, and side projects. Longer-form than the professional blog, still fundamentally about building things well.',
	},
	canonical: `${SITE_HOST}/blog/personal`,
	ogType: 'website',
	noIndex: false,
	jsonLd: [
		buildCollectionPageNode({
			name: 'Personal Blog',
			description:
				'Off-work notes: tools, reading, experiments, and side projects. Longer-form than the professional blog.',
			url: `${SITE_HOST}/blog/personal`,
		}),
		buildBreadcrumbListNode(
			[
				{ name: 'Home', url: SITE_HOST },
				{ name: 'Blog', url: `${SITE_HOST}/blog` },
				{ name: 'Personal', url: `${SITE_HOST}/blog/personal` },
			],
			`${SITE_HOST}/blog/personal`,
		),
	],
},
'/blog/[slug]': async (params, locale) => {
	const { adapter } = await import('$lib/adapters');
	const post = await adapter.blog.bySlug(params.slug);
	if (!post) throw new Error(`Unknown blog slug: ${params.slug}`);
	const canonicalUrl = `${SITE_HOST}/blog/${post.slug}`;
	return {
		title: { en: `${post.title.en} | yesid.` },
		description: fitDescriptionForSeo(post.excerpt),
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildBlogPostingNode(post, locale),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Blog', url: `${SITE_HOST}/blog` },
					{ name: post.title.en, url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};
},
'/tech-stack': {
	title: { en: 'Tech Stack | yesid.' },
	description: {
		en: 'The tools, languages, and platforms yesid. works with daily: PostgreSQL, dbt, Power BI, Python, SvelteKit, TypeScript, and the glue that holds them together.',
	},
	canonical: `${SITE_HOST}/tech-stack`,
	ogType: 'website',
	noIndex: false,
	jsonLd: [
		buildBreadcrumbListNode(
			[
				{ name: 'Home', url: SITE_HOST },
				{ name: 'Tech Stack', url: `${SITE_HOST}/tech-stack` },
			],
			`${SITE_HOST}/tech-stack`,
		),
	],
},
'/__error': {
	title: { en: 'Not Found | yesid.' },
	description: {
		en: 'This page does not exist. Head back to yesid.dev to find data infrastructure projects, blog posts, and freelance services from a Montreal-based consultant.',
	},
	canonical: SITE_HOST,
	ogType: 'website',
	noIndex: true,
	// No jsonLd — route is noIndex, no point in structured data.
},
```

Use `Edit` (with `replace_all: false`) to replace each entry's object body one at a time. Do NOT rewrite the whole file — preserve the surrounding `routeSeoEntries` declaration, `FALLBACK_DESCRIPTION`, `fitDescriptionForSeo`, types, and comments.

- [ ] **Step 4:** Run the full test suite — all `meta.test.ts` tests pass (the 15 previous + 12 new per-route + 3 from Task 7 = 30).

```bash
bun run test src/lib/adapters/meta.test.ts
```

Expected: 30/30 passing.

- [ ] **Step 5:** Run full test suite + full check + full build.

```bash
bun run test
bun run check
bun run build
```

Expected: all tests pass (15a's 889 + 15b's ~55 new = ~944), 0 check errors, build succeeds (including the sitemap coverage gate).

- [ ] **Step 6:** Append to `handoff.md`. Commit.

```bash
git add src/lib/content/meta.ts src/lib/adapters/meta.test.ts docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(8): populate jsonLd on all 11 routes in routeSeoEntries"
```

**STOP. Ask Yesid to verify a route's SEO output end-to-end via `bun run preview` and view-source before Task 9.**

---

## Task 9: Legacy cleanup — delete `utils/json-ld.ts` + drop `getPersonSchema` + update docs

**Files:**
- Delete: `src/lib/utils/json-ld.ts`
- Delete: `src/lib/utils/json-ld.test.ts`
- Modify: `src/lib/repositories/meta.ts`
- Modify: `src/routes/+layout.svelte`
- Modify: `docs/reference/ARCHITECTURE.md`
- Modify: `docs/reference/TESTS.md`

### Steps

- [ ] **Step 1:** Confirm no callers of `getPersonSchema` or `buildPersonSchema` remain outside the legacy files.

```bash
bun run check
```

Then grep:

```
grep -rn "getPersonSchema\|buildPersonSchema" src/ docs/ --include="*.ts" --include="*.svelte" --include="*.md"
```

Expected matches: only inside `src/lib/utils/json-ld.ts`, `src/lib/utils/json-ld.test.ts`, `src/lib/repositories/meta.ts`, `docs/reference/ARCHITECTURE.md`, `docs/reference/TESTS.md`. No runtime call sites in `src/routes/**` or `src/lib/components/**`. If grep shows any other match, open that file and resolve it before continuing.

- [ ] **Step 2:** Delete the legacy files.

```bash
git rm src/lib/utils/json-ld.ts src/lib/utils/json-ld.test.ts
```

- [ ] **Step 3:** Remove `getPersonSchema` + `buildPersonSchema` import from `src/lib/repositories/meta.ts`.

Replace the file contents with:

```ts
// Site-meta repository. Slice 15b deleted the Slice-12 `getPersonSchema`
// wrapper — JSON-LD is now emitted via the adapters/jsonld factories + the
// <JsonLd> component; the repository no longer participates in that flow.

import { adapter } from '$lib/adapters';
import type { Locale, PageSeo, SiteMeta } from '$lib/types';

export async function getSiteMeta(): Promise<SiteMeta> {
	return adapter.meta.site();
}

/**
 * Resolve PageSeo for a SvelteKit route id + locale.
 *
 * Consumers: root +layout.ts only (layout-authoritative per Slice 15a spec).
 * Page/layout code does not import the adapter directly — it goes through
 * this repository wrapper.
 *
 * Unknown routes throw at the adapter — the route registry is closed. Adding
 * a new public route without a content/meta.ts entry is a bug caught here,
 * by the sitemap coverage check (Task 11), and by the existing integrity tests.
 */
export async function getPageSeo(
	routeId: string,
	locale: Locale,
	params?: Record<string, string>,
): Promise<PageSeo> {
	return adapter.meta.forRoute(routeId, locale, params);
}
```

- [ ] **Step 4:** Update the `repositories/meta.test.ts` if it had a `getPersonSchema` assertion. Open and inspect.

```bash
bun run test src/lib/repositories/meta.test.ts
```

If any test references `getPersonSchema`, remove those test cases with `Edit`. If none do, this step is a no-op — continue.

- [ ] **Step 5:** Flip the `+layout.svelte` comment from future tense to past.

Open `src/routes/+layout.svelte` and replace the comment block starting "Slice 15a: SEO is layout-authoritative…" (lines ~13–17 per the current file) with:

```svelte
// Slice 15a: SEO is layout-authoritative. <SeoHead> renders all <head> tags
// server-side from $page.data.seo, which is populated by +layout.ts load.
// Slice 15b: JSON-LD is emitted by <JsonLd> mounted inside <SeoHead> —
// no direct import here. The Slice 12 `buildPersonSchema` block it replaced
// is gone; the Slice 17b "documented exception" reading siteMeta directly
// is likewise resolved.
```

Do not touch any other lines in `+layout.svelte`.

- [ ] **Step 6:** Update `docs/reference/ARCHITECTURE.md`. Find the paragraph beginning `**SEO schema (Slice 12):**` and replace:

```markdown
**SEO JSON-LD (Slice 15b):** `src/lib/adapters/jsonld.ts` exports typed factories (`buildPersonNode`, `buildWebSiteNode`, `buildBlogPostingNode`, `buildServiceNode`, `buildCreativeWorkNode`, `buildBreadcrumbListNode`, `buildProfilePageNode`, `buildCollectionPageNode`) that map domain objects (from `$lib/content/*` + `siteMeta`) to `SchemaOrgNode`s validated by `src/lib/schemas/jsonld.ts`. Per-route `jsonLd` fields live in `routeSeoEntries` (`src/lib/content/meta.ts`); the layout-authoritative `<SeoHead>` component mounts `<JsonLd>` as a child, and `<JsonLd>` emits one `<script type="application/ld+json">` per page wrapping all nodes in `@graph` with `@id` cross-references anchored at `https://yesid.dev/#person` and `https://yesid.dev/#website`.
```

- [ ] **Step 7:** Update `docs/reference/TESTS.md`. Find the block headed "| buildPersonSchema >" (11 rows). Delete those rows. Then add a new section for the 15b tests immediately after the 15a SEO section, with the shape:

```markdown
# SEO JSON-LD (`src/lib/schemas/jsonld.test.ts`, `src/lib/adapters/jsonld.test.ts`, `src/lib/components/seo/JsonLd.test.ts`) — 3 files

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| PersonSchema > accepts a minimal valid Person | Zod schema accepts the Person shape | `safeParse(valid).success === true` | Standard |
| PersonSchema > rejects a Person missing name | Required field enforced | `safeParse({...valid, name: undefined}).success === false` | Standard |
| PersonSchema > rejects a Person with a non-URL @id | `@id` must be a URL | `safeParse({...valid, '@id': 'x'}).success === false` | Standard |
| WebSiteSchema > accepts a minimal valid WebSite | Zod schema accepts WebSite shape | `safeParse(valid).success === true` | Standard |
| WebSiteSchema > rejects WebSite missing publisher @id ref | Required cross-ref enforced | `safeParse({...valid, publisher: undefined}).success === false` | Standard |
| BlogPostingSchema > accepts a minimal valid BlogPosting | Zod schema accepts BlogPosting shape | `safeParse(valid).success === true` | Standard |
| BlogPostingSchema > rejects BlogPosting missing headline | Required field enforced | `safeParse({...valid, headline: undefined}).success === false` | Standard |
| BlogPostingSchema > accepts optional image field | Image is optional | `safeParse({...valid, image: '...'}).success === true` | Standard |
| ServiceSchema > accepts a minimal valid Service | Zod schema accepts Service shape | `safeParse(valid).success === true` | Standard |
| ServiceSchema > accepts optional areaServed field | areaServed is optional | `safeParse({...valid, areaServed: 'CA'}).success === true` | Standard |
| CreativeWorkSchema > accepts a minimal valid CreativeWork (no dates, per Q5-A) | Zod schema accepts CreativeWork without dates | `safeParse(valid).success === true` | Standard |
| CreativeWorkSchema > rejects CreativeWork missing author @id ref | Required cross-ref enforced | `safeParse({...valid, author: undefined}).success === false` | Standard |
| BreadcrumbListSchema > accepts a valid BreadcrumbList with 2 items | Minimum 2 items required | `safeParse(valid).success === true` | Standard |
| BreadcrumbListSchema > rejects BreadcrumbList with 1 item | Minimum 2 items enforced | `safeParse({...valid, itemListElement: [one]}).success === false` | Standard |
| BreadcrumbListSchema > rejects BreadcrumbList with 0 items | Minimum 2 items enforced | `safeParse({...valid, itemListElement: []}).success === false` | Standard |
| ProfilePageSchema > accepts a minimal valid ProfilePage | Zod schema accepts ProfilePage shape | `safeParse(valid).success === true` | Standard |
| ProfilePageSchema > accepts optional dateCreated + dateModified | Dates are optional | `safeParse({...valid, dateCreated, dateModified}).success === true` | Standard |
| CollectionPageSchema > accepts a minimal valid CollectionPage | Zod schema accepts CollectionPage shape | `safeParse(valid).success === true` | Standard |
| SchemaOrgNodeSchema > narrows by @type — Person | Discriminated union narrows on parse | `parse(person)['@type'] === 'Person'` | Standard |
| SchemaOrgNodeSchema > rejects an object with unknown @type | Unknown type rejected | `safeParse({'@type': 'Unicorn', ...}).success === false` | Standard |
| SchemaOrgNodeSchema > accepts a valid BreadcrumbList through the union | Union delegation works | `safeParse(bc).success === true` | Standard |
| PageSeoSchema > accepts an entry with a jsonLd array | Extended PageSeo shape | `safeParse({...valid, jsonLd: [...]}).success === true` | Standard |
| PageSeoSchema > rejects an entry with malformed jsonLd (unknown @type) | Zod parses nested SchemaOrgNode | `safeParse({...valid, jsonLd: [bad]}).success === false` | Standard |
| buildPersonNode > produces a Zod-parseable Person | Factory output validates | `node['@type'] === 'Person'` | Uses real siteMeta |
| buildPersonNode > maps owner.name verbatim | Domain → schema mapping | `node.name === siteMeta.owner.name` | Uses real siteMeta |
| buildPersonNode > resolves jobTitle from owner.jobTitle.en | Localized field resolved | `node.jobTitle === siteMeta.owner.jobTitle.en` | Uses real siteMeta |
| buildPersonNode > includes GitHub + LinkedIn in sameAs when present | Social links aggregated | `sameAs` contains GitHub and LinkedIn URLs | Uses real siteMeta |
| buildPersonNode > maps owner.address to PostalAddress | Address nesting correct | `node.address` deep-equals PostalAddress | Uses real siteMeta |
| buildWebSiteNode > produces a Zod-parseable WebSite | Factory output validates | `node['@type'] === 'WebSite'` | Uses real siteMeta |
| buildWebSiteNode > references Person via publisher @id | Cross-ref pattern | `node.publisher['@id'] === PERSON_ID` | Uses real siteMeta |
| buildWebSiteNode > uses siteMeta.description.en as description | Domain → schema mapping | `node.description === siteMeta.description.en` | Uses real siteMeta |
| buildProfilePageNode > produces a Zod-parseable ProfilePage | Factory output validates | `node['@type'] === 'ProfilePage'` | Standard |
| buildProfilePageNode > references Person via mainEntity @id | Cross-ref pattern | `node.mainEntity['@id'] === PERSON_ID` | Standard |
| buildBreadcrumbListNode > produces a Zod-parseable BreadcrumbList | Factory output validates | `node['@type'] === 'BreadcrumbList'` | Standard |
| buildBreadcrumbListNode > emits items with sequential position | Position starts at 1 | Positions 1, 2, 3 in order | Standard |
| buildBreadcrumbListNode > copies name + item from input | Input mapping correct | Last item matches input | Standard |
| buildCollectionPageNode > produces a Zod-parseable CollectionPage | Factory output validates | `node['@type'] === 'CollectionPage'` | Standard |
| buildBlogPostingNode > produces a Zod-parseable BlogPosting from a real post | Factory output validates | `node['@type'] === 'BlogPosting'` | Reads adapter.blog.all |
| buildBlogPostingNode > copies inLanguage from post.lang | Locale propagation | `node.inLanguage === post.lang` | Reads adapter.blog.all |
| buildBlogPostingNode > references Person via author + publisher @ids (Q6-A) | Person-as-publisher pattern | Both refs equal PERSON_ID | Reads adapter.blog.all |
| buildBlogPostingNode > uses post.date as datePublished | Date propagation | `node.datePublished === post.date` | Reads adapter.blog.all |
| buildServiceNode > produces a Zod-parseable Service from a real service | Factory output validates | `node['@type'] === 'Service'` | Reads adapter.services.visible |
| buildServiceNode > references Person via provider @id | Cross-ref pattern | `node.provider['@id'] === PERSON_ID` | Reads adapter.services.visible |
| buildServiceNode > populates availableLanguage from PUBLISHED_LOCALES | Locale list propagation | `availableLanguage === ['en']` | Reads adapter.services.visible |
| buildCreativeWorkNode > produces a Zod-parseable CreativeWork from a real project | Factory output validates | `node['@type'] === 'CreativeWork'` | Reads adapter.projects.public |
| buildCreativeWorkNode > references Person via author + creator @ids | Cross-ref pattern | Both refs equal PERSON_ID | Reads adapter.projects.public |
| buildCreativeWorkNode > copies project.tags into keywords + project.stack into about | Domain → schema mapping | `keywords === tags`, `about === stack` | Reads adapter.projects.public |
| buildCreativeWorkNode > omits dates per Q5-A decision | Project has no date field | `datePublished === undefined` | Reads adapter.projects.public |
| JsonLd.svelte > emits zero <script> tags when nodes is empty | Empty guard | `document.head.querySelectorAll(...).length === 0` | jsdom |
| JsonLd.svelte > emits exactly one <script> when nodes non-empty | Single-tag pattern | `document.head.querySelectorAll(...).length === 1` | jsdom |
| JsonLd.svelte > wraps nodes in @graph with @context | @graph envelope correct | `parsed['@context'] === 'https://schema.org'` | jsdom |
| JsonLd.svelte > round-trip parses every node unchanged | JSON round-trip clean | `parsed['@graph']` deep-equals input | jsdom |
| JsonLd.svelte > escapes < inside field values (XSS regression guard) | XSS prevention | Content contains `\u003c`, not `<` | jsdom |
| SeoHead > does NOT mount <script> when seo.jsonLd is undefined | Optional jsonLd respected | No script tag rendered | jsdom |
| SeoHead > does NOT mount <script> when seo.jsonLd is empty | Empty jsonLd respected | No script tag rendered | jsdom |
| SeoHead > mounts one <script> when seo.jsonLd has nodes | JsonLd child wired | One script tag with expected @graph | jsdom |
| adapter.meta.forRoute + jsonLd > returns jsonLd as part of PageSeo for a static route | /about has jsonLd | `seo.jsonLd` defined + array | Integration |
| adapter.meta.forRoute + jsonLd > parses jsonLd through PageSeoSchema at the adapter boundary | Zod enforced through forRoute | Every node has @type + @id | Integration |
| adapter.meta.forRoute + jsonLd > returns jsonLd for a dynamic blog route | Dynamic factories attach jsonLd | Types include BlogPosting + BreadcrumbList | Integration |
| adapter.meta.forRoute + jsonLd > / emits Person + WebSite + ProfilePage | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /about emits Person + ProfilePage + BreadcrumbList | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /contact emits BreadcrumbList only | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /services emits CollectionPage + BreadcrumbList | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /services/[id] emits Service + BreadcrumbList | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /projects emits CollectionPage + BreadcrumbList | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /projects/[slug] emits CreativeWork + BreadcrumbList | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /blog emits CollectionPage + BreadcrumbList | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /blog/personal emits CollectionPage + BreadcrumbList with nested breadcrumb | Q3-B decision encoded | Breadcrumb trail Home → Blog → Personal | Integration |
| adapter.meta.forRoute + jsonLd > /blog/[slug] emits BlogPosting + BreadcrumbList | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /tech-stack emits BreadcrumbList only | Route coverage | Exact types array | Integration |
| adapter.meta.forRoute + jsonLd > /__error emits no jsonLd | noIndex → no structured data | `jsonLd` undefined or empty | Integration |
```

- [ ] **Step 8:** Run full suite + build to confirm nothing regressed.

```bash
bun run test
bun run check
bun run build
```

Expected: every test passes, 0 check errors, build succeeds.

- [ ] **Step 9:** Append to `handoff.md`. Commit.

```bash
git add src/lib/utils/json-ld.ts src/lib/utils/json-ld.test.ts src/lib/repositories/meta.ts src/lib/repositories/meta.test.ts src/routes/+layout.svelte docs/reference/ARCHITECTURE.md docs/reference/TESTS.md docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(9): legacy cleanup — drop Slice 12 buildPersonSchema + getPersonSchema; update docs"
```

(The `git rm` from Step 2 already staged the deletions.)

**STOP. Ask Yesid to verify the full test suite is green + ARCHITECTURE/TESTS updates look right before Task 10.**

---

## Task 10: Manual validation sweep — validator.schema.org + Lighthouse × 5 URLs

**Files:**
- Create: `docs/slices/slice-15/slice-15b/preview-validation.md`

### Steps

- [ ] **Step 1:** Build + start preview server.

```bash
bun run build
bun run preview
```

Expected: SvelteKit preview server starts on `http://localhost:4173/`. Build completes with sitemap gate passing.

- [ ] **Step 2:** Pick real fixtures to validate. Open a second terminal:

```bash
bun -e "import('./src/lib/adapters/index.ts').then(async ({ adapter }) => {
  const [posts, projects, services] = await Promise.all([
    adapter.blog.all(),
    adapter.projects.public(),
    adapter.services.visible(),
  ]);
  console.log('Blog slug:', posts[0]?.slug);
  console.log('Project slug:', projects[0]?.slug);
  console.log('Service id:', services[0]?.id);
});"
```

Note down the three identifiers. The 5 canonical URLs for this task are:
1. `http://localhost:4173/`
2. `http://localhost:4173/about`
3. `http://localhost:4173/blog/<blog-slug>`
4. `http://localhost:4173/projects/<project-slug>`
5. `http://localhost:4173/services/<service-id>`

- [ ] **Step 3:** For each URL, extract the JSON-LD from the rendered HTML.

```bash
for URL in "/" "/about" "/blog/<slug>" "/projects/<slug>" "/services/<id>"; do
  echo "=== ${URL} ==="
  curl -s "http://localhost:4173${URL}" \
    | grep -oP '<script type="application/ld\+json">.*?</script>' \
    | sed 's|<script type="application/ld+json">||; s|</script>||'
  echo
done
```

- [ ] **Step 4:** Paste each JSON output into `https://validator.schema.org/`. Confirm 0 errors.

For each route, copy the JSON block from step 3 and paste it into the validator's "Code Snippet" tab. Hit "Run Test". Screenshot the result. Save screenshots to `docs/slices/slice-15/slice-15b/validation/` (create directory as needed).

**Expected:** Every validator run returns `0 errors`. Warnings are acceptable but noted (e.g., "recommended: publisher" on BlogPosting per Q6-A → documented, not a blocker).

- [ ] **Step 5:** Run Lighthouse SEO audit on each URL via Chrome DevTools MCP.

For each of the 5 URLs: navigate Chrome DevTools MCP, run `lighthouse_audit` with `category: "seo"`, capture the score. Expected: `100` on every route.

- [ ] **Step 6:** Write the validation log.

Create `docs/slices/slice-15/slice-15b/preview-validation.md`:

```markdown
# Slice 15b — Manual validation log

**Date:** 2026-04-20
**Branch:** feature/slice-15b-jsonld
**Build:** `bun run build` (sitemap gate passed)
**Preview:** `bun run preview` on http://localhost:4173

## validator.schema.org results

| URL | Errors | Warnings | Screenshot |
|---|---:|---:|---|
| `/` | 0 | _n_ | `validation/validator-home.png` |
| `/about` | 0 | _n_ | `validation/validator-about.png` |
| `/blog/<slug>` | 0 | _n_ (publisher recommended, per Q6-A) | `validation/validator-blog.png` |
| `/projects/<slug>` | 0 | _n_ | `validation/validator-project.png` |
| `/services/<id>` | 0 | _n_ | `validation/validator-service.png` |

## Lighthouse SEO (via Chrome DevTools MCP)

| URL | SEO | A11y | Best Practices |
|---|---:|---:|---:|
| `/` | **100** | _n_ | _n_ |
| `/about` | **100** | _n_ | _n_ |
| `/blog/<slug>` | **100** | _n_ | _n_ |
| `/projects/<slug>` | **100** | _n_ | _n_ |
| `/services/<id>` | **100** | _n_ | _n_ |

## Google Rich Results Test

Deferred to the PR preview URL (requires public access). The PR body includes the checklist: run each of the 5 URLs through https://search.google.com/test/rich-results once the Vercel preview is live. Expected: every URL eligible for a rich result type matching the primary node (ProfilePage for /about, Article/BlogPosting for /blog/<slug>, etc.).

## Notes

- Person @id (`https://yesid.dev/#person`) cross-references land clean — validator treats `{"@id": "..."}` refs as resolved internal nodes within the `@graph`.
- BlogPosting with Person-as-publisher (no Organization) gets a soft "recommended: publisher" warning in Google's richer tooling but **not** in validator.schema.org. Q6-A: accepted, documented.
- `/__error` pages (unknown routes) return no JSON-LD — noIndex + no `jsonLd` on the route entry. Verified via `curl http://localhost:4173/not-a-real-route`.

## Conclusion

All 5 canonical URLs pass validator.schema.org with 0 errors and Lighthouse SEO 100. Ready for PR creation. Google Rich Results Test checklist deferred to PR preview URL per the 15a pattern.
```

Fill in the `_n_` placeholders with actual observed values before committing.

- [ ] **Step 7:** Append to `handoff.md`. Commit.

```bash
git add docs/slices/slice-15/slice-15b/preview-validation.md docs/slices/slice-15/slice-15b/validation/ docs/slices/slice-15/slice-15b/handoff.md
git commit -m "slice-15b(10): manual validation — validator.schema.org + Lighthouse SEO 100 across 5 routes"
```

**STOP. Slice 15b bundle is ready for PR. Ask Yesid to: (a) review preview-validation.md, (b) confirm `gh pr create` command + embedded checklist for Google Rich Results Test deferred validation, (c) finalize `handoff.md` with Summary + PR Body sections.**

---

## Execution Order

Strictly sequential — each task's STOP gate blocks the next.

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
```

Task 7 commits three RED integration tests intentionally; Task 8 flips them to GREEN by populating route entries. This is the TDD pattern across task boundaries — the RED assertions define Task 8's acceptance criteria.

## Out of Scope

Per spec, explicitly:

- Per-post / per-project auto-generated OG images (Slice 15c, post-Payload)
- Rest of Zod rollout across content/projects/blog/services types (Slice 17c)
- Adding `datePublished` or any date field to the `Project` type
- Minting a fictional `Organization` node
- French / Spanish locale content — `PUBLISHED_LOCALES` stays `['en']`
- Any 15a follow-up / bug fix

## Common pitfalls

- **Windows CRLF line endings**: Writing `.ts` or `.svelte` files on Windows may add CRLF. `.gitattributes` should be handling this; if `git diff` shows spurious whitespace, run `git add --renormalize .` once.
- **`{@html}` + XSS**: The `<` → `\u003c` escape is load-bearing. If a test assertion says "contains `<`", that's a regression — add back the escape.
- **Zod discriminated-union error messages**: `safeParse` failures on the union show `invalid_union_discriminator` for unknown `@type`. When debugging, log `result.error.issues` to see which branch failed.
- **Factory return type after `SchemaOrgNodeSchema.parse`**: `z.discriminatedUnion` returns the full union type. The factories cast back to the specific node type with `as Person` / `as BlogPosting` — these casts are safe because the literal `'@type'` field narrows the union, but TypeScript can't infer that through `.parse()` alone.
- **`<svelte:head>` composition**: Child components that emit `<svelte:head>` entries compose into the document head. Do not attempt to pass `<JsonLd>` content up into `<SeoHead>`'s own `<svelte:head>` — they should stay separate. Svelte handles the merge.
- **`routeSeoEntries` static entries are EVALUATED AT IMPORT TIME**: `buildPersonNode(siteMeta)` calls run once when `meta.ts` is imported. If `siteMeta` ever becomes async-resolved (Payload in Slice 18), the static entries convert to dynamic factories at that point — not a 15b concern.
- **Dynamic route factories run per-request**: `buildBlogPostingNode(post, locale)` runs every time a blog route is rendered. Keep factories cheap; they should be O(1) in the size of the input.
- **`locale` is always `'en'` today**: `DEFAULT_LOCALE = 'en'` per 15a. `inLanguage` on BlogPosting is `post.lang` (which might be different), but `resolveLocale(x, 'en')` returns the English string. FR/ES tests would need `PUBLISHED_LOCALES = ['en', 'fr']` first; out of scope.

## Self-Review

_After finishing all 10 tasks, compare this plan against `spec.md` using the writing-plans self-review checklist:_

1. **Spec coverage:** Skim spec sections — every acceptance-criteria checkbox maps to a task. Confirmed: Task 1 covers schemas; Task 2 PageSeoSchema extension; Tasks 3-5 factories; Task 6 JsonLd.svelte; Task 7 SeoHead wiring + integration; Task 8 per-route population; Task 9 legacy cleanup + doc updates; Task 10 manual validation.
2. **Placeholder scan:** No "TBD", "TODO", "fill in later". The `_n_` values in `preview-validation.md` Step 6 are intentional — they're observations filled in at validation time, not plan placeholders.
3. **Type consistency:** Factory signatures stay consistent across tasks. `buildBreadcrumbListNode(items, canonicalUrl)` — same signature in Task 4 definition and Task 8 callers. `buildBlogPostingNode(post, locale)` — same in Task 5 and Task 8. `SchemaOrgNode` type name used uniformly (not `SchemaOrgNodeType` in one place and `SchemaNode` in another).

If any issue is found during execution, fix inline and add a note to `handoff.md`'s "Iterations" table.
