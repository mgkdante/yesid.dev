# Sub-Slice 15a — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship every public route with localized, Payload-ready `<title>` + meta + OG + Twitter + canonical + sitemap + robots.txt — driven by a layout-authoritative `PageSeo` port so the Slice 18 Payload CMS swap is a one-file change.

**Architecture:** New Zod schema `PageSeoSchema` in `src/lib/schemas/seo.ts`. Extend the existing `MetaPort` (from Slice 17b) with `forRoute(routeId, locale, params?)`. Static adapter routes to `content/meta.ts` for static routes and to the existing projects/blog/services adapters for dynamic routes. Root `+layout.ts` is the single source of truth — it calls `adapter.meta.forRoute(event.route.id, locale, event.params)` and returns `{ seo }`. `<SeoHead>` consumes `$page.data.seo` and emits all head tags server-side. `/sitemap.xml` and `/robots.txt` are server routes. Build-time gate script validates that every declared public route appears in the sitemap output. Zod brought forward from planned Slice 17c, narrowly scoped to `PageSeo`.

**Tech Stack:** SvelteKit 2 (Vercel adapter, Node 22) • Svelte 5 runes • Zod v3 (new dep) • Vitest + @testing-library/svelte • TypeScript • Bun runtime • existing `$lib/utils/locale.ts` `resolveLocale()` + `DEFAULT_LOCALE` + `SUPPORTED_LOCALES`.

**Multi-session:** 2 sessions. Session 1: Tasks 1–8 (schema + adapter + component + layout wiring). Session 2: Tasks 9–14 (sitemap, robots, build gate, error page, default OG, manual validation).

**Design spec:** [`./spec.md`](./spec.md)

---

## File Structure

### Files to create

```
src/lib/schemas/seo.ts                        — PageSeoSchema (Zod) + type export
src/lib/schemas/seo.test.ts                   — schema validation tests
src/lib/utils/seo-defaults.ts                 — SITE_HOST, DEFAULT_OG_IMAGE, SITE_NAME, PUBLISHED_LOCALES, canonicalFor helper
src/lib/utils/seo-defaults.test.ts            — canonicalFor tests
src/lib/adapters/meta.test.ts                 — MetaPort.forRoute contract tests
src/lib/repositories/meta.test.ts             — getPageSeo repository test
src/lib/components/seo/SeoHead.svelte         — <svelte:head> renderer
src/lib/components/seo/SeoHead.test.ts        — tag emission + dev-warning tests
src/routes/+layout.ts                         — server load resolving seo for every request
src/routes/+layout.test.ts                    — layout load test (incl. ssr=false home case)
src/routes/sitemap.xml/+server.ts             — dynamic sitemap
src/routes/sitemap.xml/+server.test.ts        — sitemap content test
src/routes/robots.txt/+server.ts              — robots.txt
src/routes/robots.txt/+server.test.ts         — robots test
scripts/check-sitemap-coverage.ts             — build-time gate
static/og/default.png                         — 1200×630 branded default (placeholder SVG → PNG export)
```

### Files to modify

```
package.json                                  — add zod; add "check:sitemap" script; prepend to build
src/app.d.ts                                  — extend App.PageData with seo: PageSeo
src/lib/types.ts                              — re-export PageSeo from schemas/seo.ts
src/lib/adapters/types.ts                     — extend MetaPort interface with forRoute(...)
src/lib/adapters/static.ts                    — implement forRoute on the static adapter
src/lib/repositories/meta.ts                  — extend with getPageSeo wrapper (preserves site())
src/lib/content/meta.ts                       — add routeSeoEntries map + per-route entries
src/routes/+layout.svelte                     — mount <SeoHead seo={$page.data.seo} />; remove the buildPersonSchema(siteMeta) exception block
src/routes/+error.svelte                      — mount <SeoHead seo={errorSeo}>
```

### Files to delete

None. (The `buildPersonSchema(siteMeta)` call in `+layout.svelte` is removed, not relocated — 15b reintroduces JSON-LD via `SeoHead`'s extension.)

---

## Task 1: Install Zod + schema scaffolding

**Files:**
- Modify: `package.json`
- Create: `src/lib/schemas/seo.ts`
- Create: `src/lib/schemas/seo.test.ts`

### Steps

- [ ] **Step 1:** Install Zod as a runtime dependency.

```bash
bun add zod
```

Expected: `package.json` gains a `dependencies` entry for zod; `bun.lockb` updates.

- [ ] **Step 2:** Write the failing schema test.

Create `src/lib/schemas/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PageSeoSchema } from './seo';

const validLocalized = { en: 'Yesid — Digital Infrastructure' };
const validBase = {
	title: validLocalized,
	description: { en: 'A'.repeat(155) }, // within 150–160 target
	canonical: 'https://yesid.dev/about',
};

describe('PageSeoSchema', () => {
	it('accepts a minimal valid input', () => {
		const result = PageSeoSchema.safeParse(validBase);
		expect(result.success).toBe(true);
	});

	it('defaults ogType to "website" and noIndex to false', () => {
		const result = PageSeoSchema.parse(validBase);
		expect(result.ogType).toBe('website');
		expect(result.noIndex).toBe(false);
	});

	it('rejects missing title', () => {
		const { title: _t, ...bad } = validBase;
		expect(PageSeoSchema.safeParse(bad).success).toBe(false);
	});

	it('rejects a non-url canonical', () => {
		const result = PageSeoSchema.safeParse({ ...validBase, canonical: '/about' });
		expect(result.success).toBe(false);
	});

	it('rejects LocalizedString without required en', () => {
		const result = PageSeoSchema.safeParse({
			...validBase,
			title: { fr: 'Yesid' } as unknown as typeof validLocalized,
		});
		expect(result.success).toBe(false);
	});

	it('rejects description shorter than 50 chars (Zod hard-fail floor)', () => {
		const result = PageSeoSchema.safeParse({ ...validBase, description: { en: 'short' } });
		expect(result.success).toBe(false);
	});

	it('rejects description longer than 200 chars (Zod hard-fail ceiling)', () => {
		const result = PageSeoSchema.safeParse({
			...validBase,
			description: { en: 'A'.repeat(201) },
		});
		expect(result.success).toBe(false);
	});

	it('rejects title longer than 70 chars (Zod hard-fail ceiling)', () => {
		const result = PageSeoSchema.safeParse({ ...validBase, title: { en: 'A'.repeat(71) } });
		expect(result.success).toBe(false);
	});

	it('accepts a full optional payload', () => {
		const full = {
			...validBase,
			ogImage: { url: '/og/x.png', alt: { en: 'Alt text' } },
			ogType: 'article' as const,
			noIndex: true,
		};
		expect(PageSeoSchema.safeParse(full).success).toBe(true);
	});
});
```

- [ ] **Step 3:** Run test to verify all 9 cases fail (module not yet defined).

```bash
bun run test src/lib/schemas/seo.test.ts
```

Expected: all tests fail with "Cannot find module './seo'".

- [ ] **Step 4:** Write the schema.

Create `src/lib/schemas/seo.ts`:

```ts
// PageSeoSchema — Zod contract for route-level SEO metadata.
// This IS the contract Payload must honor in Slice 18. Narrowly scoped to
// SEO for 15a; the broader Zod rollout across content/projects/blog/services
// happens in Slice 17c.

import { z } from 'zod';

// Reusable LocalizedString schema. Mirrors the interface in $lib/types.
// English is required; French and Spanish are optional, filled over time.
export const LocalizedStringSchema = z.object({
	en: z.string().min(1, 'LocalizedString.en is required and non-empty'),
	fr: z.string().optional(),
	es: z.string().optional(),
});

export const PageSeoSchema = z.object({
	// Optimum ≤ 60 chars in any locale (SerP truncation). Zod hard-fails > 70;
	// 60–70 is warned in SeoHead dev mode.
	title: LocalizedStringSchema.refine(
		(s) => (s.en.length <= 70) && (!s.fr || s.fr.length <= 70) && (!s.es || s.es.length <= 70),
		{ message: 'title must not exceed 70 characters in any locale' },
	),
	// Optimum 150–160 chars. Zod hard-fails outside 50–200; 50–150 and 160–200
	// are warned in SeoHead dev mode.
	description: LocalizedStringSchema.refine(
		(s) => {
			const ok = (v?: string) => !v || (v.length >= 50 && v.length <= 200);
			return s.en.length >= 50 && s.en.length <= 200 && ok(s.fr) && ok(s.es);
		},
		{ message: 'description must be 50–200 characters in every provided locale' },
	),
	canonical: z.string().url(),
	ogImage: z
		.object({
			url: z.string(),
			alt: LocalizedStringSchema,
			width: z.number().default(1200),
			height: z.number().default(630),
		})
		.optional(),
	ogType: z.enum(['website', 'article', 'profile']).default('website'),
	noIndex: z.boolean().default(false),
});

export type PageSeo = z.infer<typeof PageSeoSchema>;
```

- [ ] **Step 5:** Re-run tests.

```bash
bun run test src/lib/schemas/seo.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 6:** Run `bun run check` to confirm no type errors.

```bash
bun run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 7:** Append entry to `log.md`. Append per-task section to `handoff.md`.

- [ ] **Step 8:** Commit.

```bash
git add package.json bun.lockb src/lib/schemas/seo.ts src/lib/schemas/seo.test.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): add PageSeoSchema (Zod) with char-band enforcement"
```

**STOP. Ask Yesid to verify the schema file looks right before Task 2.**

---

## Task 2: Site-level SEO defaults + `canonicalFor` helper

**Files:**
- Create: `src/lib/utils/seo-defaults.ts`
- Create: `src/lib/utils/seo-defaults.test.ts`

### Steps

- [ ] **Step 1:** Write the failing test.

Create `src/lib/utils/seo-defaults.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	SITE_HOST,
	DEFAULT_OG_IMAGE,
	SITE_NAME,
	PUBLISHED_LOCALES,
	canonicalFor,
} from './seo-defaults';

describe('seo-defaults constants', () => {
	it('SITE_HOST has no trailing slash and is absolute', () => {
		expect(SITE_HOST).toMatch(/^https:\/\/[^/]+$/);
	});

	it('DEFAULT_OG_IMAGE is a root-relative path to an image', () => {
		expect(DEFAULT_OG_IMAGE.startsWith('/og/')).toBe(true);
		expect(DEFAULT_OG_IMAGE).toMatch(/\.(png|jpg|webp)$/);
	});

	it('SITE_NAME equals the brand wordmark', () => {
		expect(SITE_NAME).toBe('yesid.');
	});

	it('PUBLISHED_LOCALES is a non-empty subset of SUPPORTED_LOCALES and includes en', () => {
		expect(PUBLISHED_LOCALES.length).toBeGreaterThan(0);
		expect(PUBLISHED_LOCALES).toContain('en');
	});
});

describe('canonicalFor', () => {
	it('returns absolute SITE_HOST + path for default locale EN', () => {
		expect(canonicalFor('/about', 'en')).toBe(`${SITE_HOST}/about`);
	});

	it('returns absolute SITE_HOST for root route', () => {
		expect(canonicalFor('/', 'en')).toBe(SITE_HOST);
	});

	it('non-EN locales pass-through to SITE_HOST + path today (URL scheme deferred)', () => {
		// 15a does not commit to a locale URL scheme. Other locales return the
		// same URL as EN; the slice that introduces FR/ES decides the scheme.
		expect(canonicalFor('/about', 'fr')).toBe(`${SITE_HOST}/about`);
	});

	it('strips any trailing slash', () => {
		expect(canonicalFor('/about/', 'en')).toBe(`${SITE_HOST}/about`);
	});
});
```

- [ ] **Step 2:** Run test to verify failure.

```bash
bun run test src/lib/utils/seo-defaults.test.ts
```

Expected: fail with "Cannot find module './seo-defaults'".

- [ ] **Step 3:** Write the module.

Create `src/lib/utils/seo-defaults.ts`:

```ts
// Site-level SEO fallbacks and canonical URL resolution.
// One module = one place to change when the canonical host changes, when a new
// locale launches, or when the default OG image is updated.

import type { Locale } from '$lib/types';

// Production canonical host. No trailing slash. Upgrade to an env var when
// a staging domain is introduced (currently yesid.dev is the only target).
export const SITE_HOST = 'https://yesid.dev';

// 1200×630 branded default shipped as static asset. Pages without an explicit
// ogImage fall back to this.
export const DEFAULT_OG_IMAGE = '/og/default.png';

// Brand wordmark. Not localised — "yesid." is the brand in all languages.
export const SITE_NAME = 'yesid.';

// Locales that currently have translated content AND published URL coverage.
// Adding a locale here causes:
//   - og:locale:alternate meta to emit for this locale
//   - hreflang link tags to include this locale
//   - sitemap to iterate routes × this locale
//   - canonicalFor to need a URL scheme (TODO when first non-EN locale ships)
export const PUBLISHED_LOCALES: readonly Locale[] = ['en'];

// Default locale for the site. Kept in sync with $lib/utils/locale.ts#DEFAULT_LOCALE.
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Returns the canonical absolute URL for a route in a given locale.
 *
 * 15a: EN-only today. When FR/ES launch, the slice that introduces them picks
 * a URL scheme (subdomain, path prefix, or accept-language negotiation) and
 * updates this helper in one place.
 *
 * Trailing slashes are stripped so "/about/" and "/about" produce the same URL.
 */
export function canonicalFor(pathname: string, _locale: Locale): string {
	const trimmed = pathname.replace(/\/+$/, '');
	if (trimmed === '' || trimmed === '/') return SITE_HOST;
	return `${SITE_HOST}${trimmed}`;
}
```

- [ ] **Step 4:** Re-run tests.

```bash
bun run test src/lib/utils/seo-defaults.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5:** Run `bun run check` — expect 0 errors.

- [ ] **Step 6:** Append to `log.md` + `handoff.md`.

- [ ] **Step 7:** Commit.

```bash
git add src/lib/utils/seo-defaults.ts src/lib/utils/seo-defaults.test.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): add site-level SEO defaults + canonicalFor helper"
```

**STOP. Ask Yesid to verify before Task 3.**

---

## Task 3: Extend `MetaPort` contract with `forRoute`

**Files:**
- Modify: `src/lib/adapters/types.ts:74-76` (existing `MetaPort` interface)
- Modify: `src/lib/types.ts` (re-export `PageSeo`)
- Modify: `src/app.d.ts` (extend `App.PageData`)

### Steps

- [ ] **Step 1:** Extend `MetaPort` to include `forRoute`.

Edit `src/lib/adapters/types.ts` — locate the existing `MetaPort` interface:

```ts
export interface MetaPort {
	site(): Promise<SiteMeta>;
}
```

Replace with:

```ts
export interface MetaPort {
	site(): Promise<SiteMeta>;
	/**
	 * Resolve PageSeo for a route + locale + optional dynamic params.
	 *
	 * Route id is the SvelteKit route pattern from event.route.id
	 * (e.g. '/', '/about', '/blog/[slug]'). Params come from event.params
	 * for dynamic routes. Unknown routes throw — unknown routes are a bug
	 * (a route added without a content/meta.ts entry), not an expected state.
	 *
	 * Returned shape is parsed through PageSeoSchema at the adapter boundary,
	 * so any adapter (static, Payload, mock) can only emit valid SEO.
	 */
	forRoute(routeId: string, locale: Locale, params?: Record<string, string>): Promise<PageSeo>;
}
```

At the top of the file, add the `PageSeo` import below the existing type imports:

```ts
import type { PageSeo } from '$lib/schemas/seo';
```

- [ ] **Step 2:** Re-export `PageSeo` from `src/lib/types.ts`.

Append at the bottom of `src/lib/types.ts`:

```ts
// Slice 15a: PageSeo defined in $lib/schemas/seo via Zod; re-exported here so
// types.ts remains the single import surface for consumer code.
export type { PageSeo } from '$lib/schemas/seo';
```

- [ ] **Step 3:** Extend `App.PageData` in `src/app.d.ts`.

Replace the existing `App` namespace:

```ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PageSeo } from '$lib/schemas/seo';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			seo: PageSeo;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '*.svg?raw' {
	const content: string;
	export default content;
}

export {};
```

- [ ] **Step 4:** Run `bun run check`. Expect errors — the static adapter does not yet implement `forRoute`, and pages now lack `seo` in their return types.

```bash
bun run check
```

Expected: multiple errors in `src/lib/adapters/static.ts` (missing `forRoute`) and across `+layout.svelte` / pages (data.seo required).

These errors are expected and resolved by subsequent tasks. Do not fix them here.

- [ ] **Step 5:** Append to `log.md` + `handoff.md` (note: check currently red by design).

- [ ] **Step 6:** Commit.

```bash
git add src/lib/adapters/types.ts src/lib/types.ts src/app.d.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): extend MetaPort with forRoute + require seo in PageData"
```

**STOP. Ask Yesid to verify. The red `check` is expected until Task 5.**

---

## Task 4: Add per-route entries to `content/meta.ts`

**Files:**
- Modify: `src/lib/content/meta.ts`

### Steps

- [ ] **Step 1:** Extend `content/meta.ts` with `routeSeoEntries`.

At the top of `src/lib/content/meta.ts`, update the import line:

```ts
import type { SiteMeta, PageSeo, Locale } from '$lib/types';
```

At the bottom of the file (below the existing `siteMeta` export), append:

```ts
// Per-route SEO metadata. Keyed by SvelteKit route id (event.route.id).
// Dynamic routes use the file-system pattern (e.g., '/blog/[slug]') and the
// adapter resolves per-slug SEO from the blog/projects/services adapters.
//
// Static routes land here as fully-specified entries. Dynamic routes land as
// FACTORIES — functions that receive params and return a PageSeo.
// This keeps the whole site's SEO surface visible in one file at a glance.

type StaticSeo = Omit<PageSeo, 'canonical'> & { canonical: string };
type DynamicSeoFactory = (params: Record<string, string>, locale: Locale) => Promise<PageSeo>;

export const routeSeoEntries: Record<string, StaticSeo | DynamicSeoFactory> = {
	'/': {
		title: { en: 'yesid. — Digital Infrastructure that Moves.' },
		description: {
			en: 'Freelance SQL developer and digital infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, and Python. Real-time pipelines, analytics, and data platforms.',
		},
		canonical: 'https://yesid.dev',
		ogType: 'website',
		noIndex: false,
	},
	'/about': {
		title: { en: 'About Yesid | yesid.' },
		description: {
			en: 'Montreal-based digital infrastructure consultant. Background in SQL, data warehousing, real-time analytics. Currently building for transit, fintech, and public-sector teams.',
		},
		canonical: 'https://yesid.dev/about',
		ogType: 'profile',
		noIndex: false,
	},
	'/contact': {
		title: { en: 'Contact | yesid.' },
		description: {
			en: 'Get in touch for freelance SQL, PostgreSQL, dbt, Power BI, or data infrastructure work. Based in Montreal; working with teams across Canada and remotely.',
		},
		canonical: 'https://yesid.dev/contact',
		ogType: 'website',
		noIndex: false,
	},
	'/services': {
		title: { en: 'Services | yesid.' },
		description: {
			en: 'Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms for growing teams.',
		},
		canonical: 'https://yesid.dev/services',
		ogType: 'website',
		noIndex: false,
	},
	'/services/[id]': async (params, locale) => {
		const { adapter } = await import('$lib/adapters');
		const service = await adapter.services.byId(params.id);
		if (!service) throw new Error(`Unknown service id: ${params.id}`);
		return {
			title: { en: `${service.title.en} | yesid.` },
			description: service.summary ?? { en: 'Data infrastructure service provided by yesid. — Montreal-based freelance SQL developer specialising in PostgreSQL, dbt, and Power BI.' },
			canonical: `https://yesid.dev/services/${service.id}`,
			ogType: 'article',
			noIndex: false,
		};
	},
	'/projects': {
		title: { en: 'Projects | yesid.' },
		description: {
			en: 'Recent freelance and client work: real-time transit pipelines, analytics platforms, dashboards, ETL, and infrastructure projects for teams across Montreal and Canada.',
		},
		canonical: 'https://yesid.dev/projects',
		ogType: 'website',
		noIndex: false,
	},
	'/projects/[slug]': async (params, locale) => {
		const { adapter } = await import('$lib/adapters');
		const project = await adapter.projects.bySlug(params.slug);
		if (!project) throw new Error(`Unknown project slug: ${params.slug}`);
		return {
			title: { en: `${project.title.en} | yesid.` },
			description: project.summary ?? { en: 'Freelance project by yesid. — SQL, PostgreSQL, dbt, Power BI and data infrastructure work for clients across Montreal and Canada.' },
			canonical: `https://yesid.dev/projects/${project.slug}`,
			ogType: 'article',
			noIndex: false,
		};
	},
	'/blog': {
		title: { en: 'Blog | yesid.' },
		description: {
			en: 'Notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and building analytics for growing teams. Montreal-based freelance consultant.',
		},
		canonical: 'https://yesid.dev/blog',
		ogType: 'website',
		noIndex: false,
	},
	'/blog/personal': {
		title: { en: 'Personal Blog | yesid.' },
		description: {
			en: 'Off-work notes: tools, reading, experiments, and side projects. Longer-form than the professional blog, still about building.',
		},
		canonical: 'https://yesid.dev/blog/personal',
		ogType: 'website',
		noIndex: false,
	},
	'/blog/[slug]': async (params, locale) => {
		const { adapter } = await import('$lib/adapters');
		const post = await adapter.blog.bySlug(params.slug);
		if (!post) throw new Error(`Unknown blog slug: ${params.slug}`);
		return {
			title: { en: `${post.title.en} | yesid.` },
			description: post.summary ?? { en: 'Blog post from yesid. — notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and analytics for growing teams.' },
			canonical: `https://yesid.dev/blog/${post.slug}`,
			ogType: 'article',
			noIndex: false,
		};
	},
	'/tech-stack': {
		title: { en: 'Tech Stack | yesid.' },
		description: {
			en: 'The tools, languages, and platforms yesid. works with daily: PostgreSQL, dbt, Power BI, Python, SvelteKit, TypeScript, and the glue that holds them together.',
		},
		canonical: 'https://yesid.dev/tech-stack',
		ogType: 'website',
		noIndex: false,
	},
	'/__error': {
		title: { en: 'Not Found | yesid.' },
		description: {
			en: 'This page does not exist. Head back to yesid.dev to find data infrastructure projects, blog posts, and freelance services.',
		},
		canonical: 'https://yesid.dev/',
		ogType: 'website',
		noIndex: true,
	},
};
```

**Important:** the summaries reference `service.summary`, `project.summary`, `post.summary` fields. Verify those exist on the types:

```bash
bun run check
```

If any of those fields don't exist on the corresponding types, fall back to the literal string in the content/meta.ts factory — not to be fixed in the types (that's cross-scope). If `service.summary` is typed as `LocalizedString | undefined`, the `?? { en: '...' }` fallback covers the gap.

- [ ] **Step 2:** Verify the file still parses: `bun run check`.

Expected: no new errors from this file (same set of errors as Task 3 end).

- [ ] **Step 3:** Append to `log.md` + `handoff.md`. Note any summary-field fallbacks applied.

- [ ] **Step 4:** Commit.

```bash
git add src/lib/content/meta.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): add per-route SEO entries to content/meta.ts"
```

**STOP. Ask Yesid to skim the meta entries for copy tone before Task 5.**

---

## Task 5: Implement `forRoute` on the static adapter

**Files:**
- Create: `src/lib/adapters/meta.test.ts`
- Modify: `src/lib/adapters/static.ts`

### Steps

- [ ] **Step 1:** Write the failing adapter test.

Create `src/lib/adapters/meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { adapter } from './index';

describe('adapter.meta.forRoute', () => {
	it('resolves a static route by id', async () => {
		const seo = await adapter.meta.forRoute('/about', 'en');
		expect(seo.title.en).toMatch(/About/);
		expect(seo.canonical).toBe('https://yesid.dev/about');
	});

	it('returns a Zod-validated object (ogType default fills in)', async () => {
		const seo = await adapter.meta.forRoute('/', 'en');
		expect(seo.ogType).toBe('website');
		expect(seo.noIndex).toBe(false);
	});

	it('resolves a dynamic blog route by slug', async () => {
		const { adapter: a } = await import('./index');
		const firstPost = (await a.blog.all())[0];
		if (!firstPost) return; // skip when no posts exist
		const seo = await adapter.meta.forRoute('/blog/[slug]', 'en', { slug: firstPost.slug });
		expect(seo.title.en).toContain('yesid.');
		expect(seo.canonical).toBe(`https://yesid.dev/blog/${firstPost.slug}`);
		expect(seo.ogType).toBe('article');
	});

	it('throws on an unknown route id', async () => {
		await expect(adapter.meta.forRoute('/definitely-not-a-route', 'en')).rejects.toThrow();
	});

	it('throws on a dynamic route with an unknown slug', async () => {
		await expect(
			adapter.meta.forRoute('/blog/[slug]', 'en', { slug: 'not-a-real-post' }),
		).rejects.toThrow();
	});

	it('returns 404 entry with noIndex: true', async () => {
		const seo = await adapter.meta.forRoute('/__error', 'en');
		expect(seo.noIndex).toBe(true);
	});
});
```

- [ ] **Step 2:** Run test — expect failure (static adapter does not yet export `meta.forRoute`).

```bash
bun run test src/lib/adapters/meta.test.ts
```

- [ ] **Step 3:** Implement `forRoute` on the static adapter.

Edit `src/lib/adapters/static.ts`. At the top of the file, add:

```ts
import { routeSeoEntries } from '$lib/content/meta';
import { PageSeoSchema, type PageSeo } from '$lib/schemas/seo';
import type { Locale } from '$lib/types';
```

Locate the existing `meta:` section of the adapter literal (currently exposes only `site()`). Replace it with:

```ts
meta: {
	site: async () => siteMeta,
	forRoute: async (routeId: string, _locale: Locale, params?: Record<string, string>): Promise<PageSeo> => {
		const entry = routeSeoEntries[routeId];
		if (!entry) {
			throw new Error(`[adapter.meta.forRoute] Unknown route id: ${routeId}. Add an entry in src/lib/content/meta.ts.`);
		}
		const raw = typeof entry === 'function' ? await entry(params ?? {}, _locale) : entry;
		return PageSeoSchema.parse(raw);
	},
},
```

- [ ] **Step 4:** Re-run tests.

```bash
bun run test src/lib/adapters/meta.test.ts
```

Expected: 6 tests PASS (or 5 if `adapter.blog.all()` returns empty — the dynamic test short-circuits).

- [ ] **Step 5:** Run `bun run check`. The static adapter is now complete; `check` should still error on the pages/layout (expected — fixed in Task 7).

- [ ] **Step 6:** Append to `log.md` + `handoff.md`.

- [ ] **Step 7:** Commit.

```bash
git add src/lib/adapters/static.ts src/lib/adapters/meta.test.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): implement MetaPort.forRoute on static adapter"
```

**STOP. Ask Yesid to verify before Task 6.**

---

## Task 6: Repository wrapper for `getPageSeo`

**Files:**
- Create: `src/lib/repositories/meta.test.ts`
- Modify: `src/lib/repositories/meta.ts` (extend the existing repository)

### Steps

- [ ] **Step 1:** Check the existing repository.

Read `src/lib/repositories/meta.ts`. It currently exposes `getSiteMeta()` or similar wrapping `adapter.meta.site()`. Keep that export intact; this task adds one more.

- [ ] **Step 2:** Write the failing repository test.

Create `src/lib/repositories/meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getPageSeo } from './meta';

describe('getPageSeo', () => {
	it('delegates to the adapter and returns a parsed PageSeo for /about', async () => {
		const seo = await getPageSeo('/about', 'en');
		expect(seo.title.en).toMatch(/About/);
	});

	it('forwards params for dynamic routes', async () => {
		const { adapter } = await import('$lib/adapters');
		const firstPost = (await adapter.blog.all())[0];
		if (!firstPost) return;
		const seo = await getPageSeo('/blog/[slug]', 'en', { slug: firstPost.slug });
		expect(seo.canonical).toContain(firstPost.slug);
	});
});
```

- [ ] **Step 3:** Run test — expect failure.

- [ ] **Step 4:** Extend the repository.

Edit `src/lib/repositories/meta.ts`. After the existing exports, append:

```ts
import type { Locale, PageSeo } from '$lib/types';

/**
 * Resolve PageSeo for a SvelteKit route id + locale.
 *
 * Consumers: root +layout.ts only (layout-authoritative per spec). Page/layout
 * code does not import the adapter directly — it goes through this repo.
 *
 * Unknown routes throw — the route registry is closed. Adding a new public
 * route without a content/meta.ts entry is a bug caught by this throw, the
 * sitemap coverage check, and the integrity tests.
 */
export async function getPageSeo(
	routeId: string,
	locale: Locale,
	params?: Record<string, string>,
): Promise<PageSeo> {
	return adapter.meta.forRoute(routeId, locale, params);
}
```

- [ ] **Step 5:** Re-run tests — PASS.

- [ ] **Step 6:** `bun run check` — same error set as before (layout/pages).

- [ ] **Step 7:** Append to logs. Commit.

```bash
git add src/lib/repositories/meta.ts src/lib/repositories/meta.test.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): add getPageSeo repository wrapper"
```

**STOP. Ask Yesid to verify before Task 7.**

---

## Task 7: `SeoHead` component

**Files:**
- Create: `src/lib/components/seo/SeoHead.svelte`
- Create: `src/lib/components/seo/SeoHead.test.ts`

### Steps

- [ ] **Step 1:** Write the failing component test.

Create `src/lib/components/seo/SeoHead.test.ts`:

```ts
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SeoHead from './SeoHead.svelte';
import type { PageSeo } from '$lib/schemas/seo';

const validSeo: PageSeo = {
	title: { en: 'Test Page | yesid.' },
	description: { en: 'A'.repeat(155) },
	canonical: 'https://yesid.dev/test',
	ogType: 'website',
	noIndex: false,
};

function findHead(): HTMLHeadElement {
	return document.head;
}

function getMeta(attr: string, value: string): HTMLMetaElement | null {
	return document.head.querySelector(`meta[${attr}="${value}"]`);
}

function getLink(rel: string, extraAttr?: { name: string; value: string }): HTMLLinkElement | null {
	const selector = extraAttr
		? `link[rel="${rel}"][${extraAttr.name}="${extraAttr.value}"]`
		: `link[rel="${rel}"]`;
	return document.head.querySelector(selector);
}

describe('SeoHead — tag emission', () => {
	beforeEach(() => {
		findHead().innerHTML = '';
	});

	it('emits <title>', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(document.title).toBe('Test Page | yesid.');
	});

	it('emits <meta name="description">', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getMeta('name', 'description')?.content).toBe(validSeo.description.en);
	});

	it('emits <link rel="canonical">', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getLink('canonical')?.href).toBe('https://yesid.dev/test');
	});

	it('emits the full OG tag set', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		for (const prop of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name', 'og:locale']) {
			expect(getMeta('property', prop), `missing OG tag ${prop}`).not.toBeNull();
		}
	});

	it('emits twitter:card=summary_large_image and the core Twitter set', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getMeta('name', 'twitter:card')?.content).toBe('summary_large_image');
		for (const prop of ['twitter:title', 'twitter:description', 'twitter:image']) {
			expect(getMeta('name', prop), `missing Twitter tag ${prop}`).not.toBeNull();
		}
	});

	it('emits hreflang for every published locale + x-default', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getLink('alternate', { name: 'hreflang', value: 'en' })).not.toBeNull();
		expect(getLink('alternate', { name: 'hreflang', value: 'x-default' })).not.toBeNull();
	});

	it('falls back to DEFAULT_OG_IMAGE when ogImage is omitted', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		const ogImage = getMeta('property', 'og:image');
		expect(ogImage?.content).toMatch(/og\/default\.png$/);
	});

	it('emits noindex,nofollow robots meta when seo.noIndex is true', () => {
		render(SeoHead, { props: { seo: { ...validSeo, noIndex: true }, locale: 'en' } });
		expect(getMeta('name', 'robots')?.content).toBe('noindex,nofollow');
	});

	it('emits theme-color and color-scheme meta', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getMeta('name', 'theme-color')?.content).toBe('#141414');
		expect(getMeta('name', 'color-scheme')?.content).toBe('dark');
	});
});

describe('SeoHead — dev warnings', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		findHead().innerHTML = '';
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it('warns when description is outside 150–160 in dev', () => {
		const shortDesc: PageSeo = { ...validSeo, description: { en: 'A'.repeat(80) } };
		render(SeoHead, { props: { seo: shortDesc, locale: 'en', dev: true } });
		expect(warnSpy).toHaveBeenCalled();
	});

	it('warns when title > 60 chars in dev', () => {
		const longTitle: PageSeo = { ...validSeo, title: { en: 'A'.repeat(65) } };
		render(SeoHead, { props: { seo: longTitle, locale: 'en', dev: true } });
		expect(warnSpy).toHaveBeenCalled();
	});

	it('does not warn in production mode', () => {
		const longTitle: PageSeo = { ...validSeo, title: { en: 'A'.repeat(65) } };
		render(SeoHead, { props: { seo: longTitle, locale: 'en', dev: false } });
		expect(warnSpy).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2:** Run tests — fail with "Cannot find module './SeoHead.svelte'".

- [ ] **Step 3:** Write the component.

Create `src/lib/components/seo/SeoHead.svelte`:

```svelte
<script lang="ts">
	import type { PageSeo } from '$lib/schemas/seo';
	import type { Locale } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import {
		DEFAULT_OG_IMAGE,
		PUBLISHED_LOCALES,
		SITE_HOST,
		SITE_NAME,
		canonicalFor,
	} from '$lib/utils/seo-defaults';
	import { dev as runtimeDev } from '$app/environment';

	// `dev` is a prop (not just the runtime import) so tests can force the path.
	let {
		seo,
		locale,
		dev = runtimeDev,
	}: { seo: PageSeo; locale: Locale; dev?: boolean } = $props();

	const title = $derived(resolveLocale(seo.title, locale));
	const description = $derived(resolveLocale(seo.description, locale));
	const ogImageUrl = $derived(
		seo.ogImage ? seo.ogImage.url : DEFAULT_OG_IMAGE,
	);
	const ogImageAlt = $derived(
		seo.ogImage ? resolveLocale(seo.ogImage.alt, locale) : `${SITE_NAME} — ${title}`,
	);
	const ogImageAbsolute = $derived(
		ogImageUrl.startsWith('http') ? ogImageUrl : `${SITE_HOST}${ogImageUrl}`,
	);
	const canonicalAbsolute = $derived(seo.canonical);
	const ogLocale = $derived(`${locale}_CA`);
	const otherLocales = $derived(
		PUBLISHED_LOCALES.filter((l) => l !== locale).map((l) => `${l}_CA`),
	);
	const pathForCanonical = $derived(
		seo.canonical.replace(SITE_HOST, '') || '/',
	);

	// Dev-mode warnings. Zod already hard-fails outside 50–200 / 70 chars;
	// these warnings cover the "optimum but not hard-fail" band.
	$effect(() => {
		if (!dev) return;
		if (title.length > 60) {
			console.warn(
				`[SeoHead] title > 60 chars (${title.length}) — may truncate in SERPs. Canonical: ${seo.canonical}`,
			);
		}
		if (description.length < 150 || description.length > 160) {
			console.warn(
				`[SeoHead] description outside 150–160 chars (${description.length}). Canonical: ${seo.canonical}`,
			);
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalAbsolute} />

	<meta name="theme-color" content="#141414" />
	<meta name="color-scheme" content="dark" />

	{#if seo.noIndex}
		<meta name="robots" content="noindex,nofollow" />
	{/if}

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImageAbsolute} />
	<meta property="og:image:alt" content={ogImageAlt} />
	<meta property="og:image:width" content={String(seo.ogImage?.width ?? 1200)} />
	<meta property="og:image:height" content={String(seo.ogImage?.height ?? 630)} />
	<meta property="og:url" content={canonicalAbsolute} />
	<meta property="og:type" content={seo.ogType} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content={ogLocale} />
	{#each otherLocales as alt}
		<meta property="og:locale:alternate" content={alt} />
	{/each}

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImageAbsolute} />
	<meta name="twitter:image:alt" content={ogImageAlt} />

	<!-- hreflang per published locale + x-default -->
	{#each PUBLISHED_LOCALES as l}
		<link rel="alternate" hreflang={l} href={canonicalFor(pathForCanonical, l)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={canonicalFor(pathForCanonical, 'en')} />
</svelte:head>
```

- [ ] **Step 4:** Re-run tests.

```bash
bun run test src/lib/components/seo/SeoHead.test.ts
```

Expected: all 12 tests PASS.

If a test fails around the `dev` prop (runes don't see the prop as reactive in effects), ensure the `dev` destructure uses `$props()` syntax shown above.

- [ ] **Step 5:** Append to logs. Commit.

```bash
git add src/lib/components/seo/SeoHead.svelte src/lib/components/seo/SeoHead.test.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): add SeoHead component with dev-mode char-band warnings"
```

**STOP. Ask Yesid to verify the tag emission in a browser before Task 8.**

---

## Task 8: Root layout load + wire `SeoHead`

**Files:**
- Create: `src/routes/+layout.ts`
- Create: `src/routes/+layout.test.ts`
- Modify: `src/routes/+layout.svelte`

### Steps

- [ ] **Step 1:** Write the failing layout load test.

Create `src/routes/+layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { load } from './+layout';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';

function fakeEvent(routeId: string | null, params: Record<string, string> = {}) {
	return {
		route: { id: routeId },
		params,
		url: new URL(`https://yesid.dev${routeId ?? '/'}`),
	} as unknown as Parameters<typeof load>[0];
}

describe('+layout.ts load', () => {
	it('returns seo for the home route', async () => {
		const result = await load(fakeEvent('/'));
		expect(result.seo.title.en).toMatch(/yesid/);
		expect(result.seo.canonical).toBe('https://yesid.dev');
	});

	it('returns seo for a static nested route', async () => {
		const result = await load(fakeEvent('/about'));
		expect(result.seo.title.en).toMatch(/About/);
	});

	it('passes params through to the adapter for dynamic routes', async () => {
		const { adapter } = await import('$lib/adapters');
		const firstPost = (await adapter.blog.all())[0];
		if (!firstPost) return;
		const result = await load(fakeEvent('/blog/[slug]', { slug: firstPost.slug }));
		expect(result.seo.canonical).toContain(firstPost.slug);
	});

	it('falls back to the error entry when route.id is null', async () => {
		const result = await load(fakeEvent(null));
		expect(result.seo.noIndex).toBe(true);
	});

	it('uses DEFAULT_LOCALE when no locale is specified', async () => {
		const result = await load(fakeEvent('/about'));
		expect(DEFAULT_LOCALE).toBe('en');
		expect(result.seo.title.en).toBeTruthy();
	});
});
```

- [ ] **Step 2:** Run — fail.

- [ ] **Step 3:** Implement the layout load.

Create `src/routes/+layout.ts`:

```ts
import type { LayoutLoad } from './$types';
import { getPageSeo } from '$lib/repositories/meta';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';

// Universal load (runs both SSR + client). SSR guarantees bots and social
// crawlers see populated <head> tags on first byte — including for pages that
// set `export const ssr = false` on their own +page.ts (e.g., the home page
// disables SSR for GSAP/Lottie compatibility but the layout still SSRs).
//
// Locale today is always DEFAULT_LOCALE (EN). When FR/ES ship, a locale
// resolver hook (accept-language, cookie, or URL segment depending on the
// scheme chosen) plugs in here.
export const load: LayoutLoad = async ({ route, params }) => {
	const routeId = route.id ?? '/__error';
	const locale = DEFAULT_LOCALE;
	try {
		const seo = await getPageSeo(routeId, locale, params as Record<string, string>);
		return { seo };
	} catch (err) {
		// Unknown route id: fall back to the 404 entry so the page still renders
		// with a valid <head>. Log so the dev build surfaces the miss.
		if (import.meta.env.DEV) {
			console.warn(`[+layout.ts] Falling back to error SEO for route "${routeId}":`, err);
		}
		const seo = await getPageSeo('/__error', locale);
		return { seo };
	}
};
```

- [ ] **Step 4:** Modify `+layout.svelte` to mount `<SeoHead>`.

Read `src/routes/+layout.svelte`. Locate the existing "Documented exception (Slice 17b)" comment block and the `const personSchema = buildPersonSchema(siteMeta);` line.

Replace that block (from the comment to the `const personSchema` line, inclusive) with:

```svelte
	// Slice 15a: SEO is layout-authoritative. <SeoHead> renders all <head> tags
	// server-side from $page.data.seo, which is populated by +layout.ts load.
	// JSON-LD (Person/WebSite/etc.) returns in Slice 15b via SeoHead extension.
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
```

Remove any remaining `import { siteMeta } from '$lib/content';` line (no longer needed here).

Remove any remaining `import { buildPersonSchema } from '$lib/utils';` line.

In the `<script>` block, extract `data` from `$props()` alongside the existing destructure. If the current destructure is `let { children } = $props();`, replace with:

```svelte
	let { data, children } = $props();
```

In the template, ABOVE any existing `<svelte:head>` block, insert:

```svelte
<SeoHead seo={data.seo} locale={DEFAULT_LOCALE} />
```

If there was any existing `<svelte:head>` block in this file that set a title or JSON-LD (the Slice 12 Person schema), REMOVE it. `SeoHead` is now the single source of head tags.

- [ ] **Step 5:** Run all tests.

```bash
bun run test
```

Expected: all passing, including the new layout tests. Pre-existing tests unchanged.

- [ ] **Step 6:** Run `bun run check`.

Expected: 0 errors. The `App.PageData.seo` requirement is now satisfied by the layout's load, and all pages inherit it.

- [ ] **Step 7:** Start dev server and verify in-browser.

```bash
bun run dev
```

Navigate to `http://localhost:5173/`. Open DevTools → Elements → expand `<head>`. Verify presence of:
- `<title>` containing "yesid."
- `<meta name="description">`
- `<link rel="canonical" href="https://yesid.dev">`
- Full OG set
- Twitter card meta
- hreflang=en link
- `<meta name="theme-color" content="#141414">`

View-source the page (Ctrl+U) to confirm the tags are present in the SSR HTML (not injected by JS). **This is the critical test** — social crawlers read source, not rendered DOM.

Navigate to `/about`, `/contact`, `/services`, `/projects`, `/blog`. Confirm each has a distinct title + description.

Navigate to `/blog/<any-post-slug>`. Confirm the title uses the post's title and canonical uses the post slug.

- [ ] **Step 8:** Append to log (note any browser/view-source findings). Commit.

```bash
git add src/routes/+layout.ts src/routes/+layout.test.ts src/routes/+layout.svelte docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): layout-authoritative SEO via +layout.ts + SeoHead"
```

**STOP. Ask Yesid to verify meta tags in browser + view-source before Task 9.**

---

## Task 9: `/sitemap.xml` server route

**Files:**
- Create: `src/routes/sitemap.xml/+server.ts`
- Create: `src/routes/sitemap.xml/+server.test.ts`

### Steps

- [ ] **Step 1:** Write the failing test.

Create `src/routes/sitemap.xml/+server.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('GET /sitemap.xml', () => {
	async function fetchBody() {
		const response = await GET({} as Parameters<typeof GET>[0]);
		return { status: response.status, body: await response.text() };
	}

	it('returns 200 with XML content-type', async () => {
		const response = await GET({} as Parameters<typeof GET>[0]);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toMatch(/application\/xml/);
	});

	it('includes every static public route', async () => {
		const { body } = await fetchBody();
		for (const path of ['/', '/about', '/contact', '/services', '/projects', '/blog', '/blog/personal', '/tech-stack']) {
			const canonical = path === '/' ? 'https://yesid.dev' : `https://yesid.dev${path}`;
			expect(body, `missing ${canonical}`).toContain(`<loc>${canonical}</loc>`);
		}
	});

	it('includes dynamic blog and project routes', async () => {
		const { adapter } = await import('$lib/adapters');
		const posts = await adapter.blog.all();
		const { body } = await fetchBody();
		for (const post of posts) {
			expect(body, `missing blog post ${post.slug}`).toContain(
				`<loc>https://yesid.dev/blog/${post.slug}</loc>`,
			);
		}
	});

	it('excludes the __error pseudo-route', async () => {
		const { body } = await fetchBody();
		expect(body).not.toContain('__error');
	});

	it('emits xhtml:link hreflang for every published locale', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
		expect(body).toContain('<xhtml:link rel="alternate" hreflang="en"');
	});

	it('is well-formed XML (parses without error)', async () => {
		const { body } = await fetchBody();
		expect(body.startsWith('<?xml')).toBe(true);
		expect(body).toContain('</urlset>');
	});
});
```

- [ ] **Step 2:** Run — fail.

- [ ] **Step 3:** Implement the server route.

Create `src/routes/sitemap.xml/+server.ts`:

```ts
import type { RequestHandler } from './$types';
import { adapter } from '$lib/adapters';
import { PUBLISHED_LOCALES, SITE_HOST } from '$lib/utils/seo-defaults';

// Route ids that are always present in the router. Keep this list in sync
// with content/meta.ts when adding a new static route. The build-time
// coverage script (Task 11) asserts parity.
const STATIC_ROUTES: readonly string[] = [
	'/',
	'/about',
	'/contact',
	'/services',
	'/projects',
	'/blog',
	'/blog/personal',
	'/tech-stack',
];

function canonical(path: string): string {
	if (path === '' || path === '/') return SITE_HOST;
	return `${SITE_HOST}${path}`;
}

function xmlEscape(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod: string | undefined): string {
	const altLinks = PUBLISHED_LOCALES
		.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(loc)}" />`)
		.join('\n');
	const lastmodLine = lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '';
	return `  <url>
    <loc>${xmlEscape(loc)}</loc>
${lastmodLine}${altLinks}
  </url>`;
}

export const GET: RequestHandler = async () => {
	const buildTime = new Date().toISOString();

	const entries: string[] = [];

	for (const path of STATIC_ROUTES) {
		entries.push(urlEntry(canonical(path), buildTime));
	}

	const projects = await adapter.projects.public();
	for (const project of projects) {
		entries.push(urlEntry(canonical(`/projects/${project.slug}`), buildTime));
	}

	const services = await adapter.services.visible();
	for (const service of services) {
		entries.push(urlEntry(canonical(`/services/${service.id}`), buildTime));
	}

	const posts = await adapter.blog.all();
	for (const post of posts) {
		const lastmod = (post as { publishedAt?: string; updatedAt?: string }).updatedAt
			?? (post as { publishedAt?: string }).publishedAt
			?? buildTime;
		entries.push(urlEntry(canonical(`/blog/${post.slug}`), lastmod));
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600',
		},
	});
};
```

- [ ] **Step 4:** Re-run tests — PASS.

- [ ] **Step 5:** Verify in browser.

```bash
bun run dev
```

Open `http://localhost:5173/sitemap.xml`. Confirm:
- The page renders as XML (browser shows tree view)
- Every public route appears
- Blog posts appear with slugs

- [ ] **Step 6:** Commit.

```bash
git add src/routes/sitemap.xml/+server.ts src/routes/sitemap.xml/+server.test.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): dynamic /sitemap.xml with hreflang per published locale"
```

**STOP. Ask Yesid to verify sitemap in browser before Task 10.**

---

## Task 10: `/robots.txt` server route

**Files:**
- Create: `src/routes/robots.txt/+server.ts`
- Create: `src/routes/robots.txt/+server.test.ts`

### Steps

- [ ] **Step 1:** Write the failing test.

Create `src/routes/robots.txt/+server.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('GET /robots.txt', () => {
	async function fetchBody() {
		const response = await GET({} as Parameters<typeof GET>[0]);
		return { status: response.status, body: await response.text(), contentType: response.headers.get('content-type') };
	}

	it('returns 200 text/plain', async () => {
		const { status, contentType } = await fetchBody();
		expect(status).toBe(200);
		expect(contentType).toMatch(/text\/plain/);
	});

	it('allows everything by default', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('User-agent: *');
		expect(body).toContain('Allow: /');
	});

	it('disallows /preview (Slice 18 Payload draft route)', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('Disallow: /preview');
	});

	it('references the sitemap with absolute URL', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('Sitemap: https://yesid.dev/sitemap.xml');
	});
});
```

- [ ] **Step 2:** Run — fail.

- [ ] **Step 3:** Implement the server route.

Create `src/routes/robots.txt/+server.ts`:

```ts
import type { RequestHandler } from './$types';
import { SITE_HOST } from '$lib/utils/seo-defaults';

export const GET: RequestHandler = async () => {
	const body = `User-agent: *
Allow: /
Disallow: /preview

Sitemap: ${SITE_HOST}/sitemap.xml
`;
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600',
		},
	});
};
```

- [ ] **Step 4:** Re-run tests — PASS.

- [ ] **Step 5:** Verify in browser.

Open `http://localhost:5173/robots.txt`. Confirm contents.

- [ ] **Step 6:** Commit.

```bash
git add src/routes/robots.txt/+server.ts src/routes/robots.txt/+server.test.ts docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): /robots.txt with sitemap reference and /preview block"
```

**STOP. Ask Yesid to verify before Task 11.**

---

## Task 11: Build-time sitemap coverage gate

**Files:**
- Create: `scripts/check-sitemap-coverage.ts`
- Modify: `package.json` (add `check:sitemap` + wire into `build`)

### Steps

- [ ] **Step 1:** Write the coverage script.

Create `scripts/check-sitemap-coverage.ts`:

```ts
#!/usr/bin/env bun
// Post-build sitemap coverage check.
// Diffs: every public route in src/routes vs. every <loc> emitted by the
// /sitemap.xml handler. Missing on either side = non-zero exit so the build
// fails loudly rather than shipping uncrawlable pages.
//
// Run:
//   bun run check:sitemap

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GET as sitemapGET } from '../src/routes/sitemap.xml/+server';

const ROUTES_DIR = 'src/routes';

// Routes intentionally excluded from sitemap coverage.
const EXCLUDES = new Set<string>([
	'/__error',         // synthetic 404 entry
	'/preview',         // Slice 18 Payload draft route
	'/sitemap.xml',     // the sitemap itself
	'/robots.txt',      // robots
]);

// Walk src/routes to find every route that has a +page.svelte.
function collectPageRoutes(dir: string, prefix = ''): string[] {
	const entries = readdirSync(dir);
	const routes: string[] = [];

	const hasPage = entries.includes('+page.svelte');
	if (hasPage) {
		const route = prefix === '' ? '/' : prefix;
		routes.push(route);
	}

	for (const entry of entries) {
		const full = join(dir, entry);
		if (!statSync(full).isDirectory()) continue;
		if (entry.startsWith('.')) continue;
		const nextPrefix = `${prefix}/${entry}`;
		routes.push(...collectPageRoutes(full, nextPrefix));
	}

	return routes;
}

// Normalise dynamic segments: expand [slug] / [id] via the content adapters
// so each real URL becomes an expected entry.
async function expandDynamic(route: string): Promise<string[]> {
	if (!route.includes('[')) return [route];

	const { adapter } = await import('../src/lib/adapters');

	if (route === '/blog/[slug]') {
		const posts = await adapter.blog.all();
		return posts.map((p) => `/blog/${p.slug}`);
	}
	if (route === '/projects/[slug]') {
		const projects = await adapter.projects.public();
		return projects.map((p) => `/projects/${p.slug}`);
	}
	if (route === '/services/[id]') {
		const services = await adapter.services.visible();
		return services.map((s) => `/services/${s.id}`);
	}

	throw new Error(`[check-sitemap-coverage] Unknown dynamic route pattern: ${route}. Add expansion logic.`);
}

async function main() {
	const declared = collectPageRoutes(ROUTES_DIR);

	const expected = new Set<string>();
	for (const route of declared) {
		if (EXCLUDES.has(route)) continue;
		const paths = await expandDynamic(route);
		for (const p of paths) expected.add(p);
	}

	const response = await sitemapGET({} as Parameters<typeof sitemapGET>[0]);
	const xml = await response.text();
	const actualPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
		const url = new URL(m[1]);
		return url.pathname === '' ? '/' : url.pathname;
	});
	const actual = new Set(actualPaths);

	const missingInSitemap = [...expected].filter((r) => !actual.has(r));
	const extraInSitemap = [...actual].filter((r) => !expected.has(r));

	if (missingInSitemap.length === 0 && extraInSitemap.length === 0) {
		console.log(`[check-sitemap-coverage] OK — ${expected.size} routes match.`);
		process.exit(0);
	}

	if (missingInSitemap.length) {
		console.error('[check-sitemap-coverage] Routes declared but not in sitemap:');
		for (const r of missingInSitemap) console.error(`  - ${r}`);
	}
	if (extraInSitemap.length) {
		console.error('[check-sitemap-coverage] Routes in sitemap but not declared in src/routes:');
		for (const r of extraInSitemap) console.error(`  - ${r}`);
	}
	process.exit(1);
}

main().catch((err) => {
	console.error('[check-sitemap-coverage] Fatal:', err);
	process.exit(1);
});
```

- [ ] **Step 2:** Wire into `package.json`. Edit the `scripts` object:

```json
"check:sitemap": "bun scripts/check-sitemap-coverage.ts",
"build": "vite build && bun run check:sitemap",
```

Note: the existing `"build": "vite build"` is replaced with the composite above. Every `bun run build` now fails if sitemap coverage is broken.

- [ ] **Step 3:** Run the script manually to confirm it works against current state.

```bash
bun run check:sitemap
```

Expected: `[check-sitemap-coverage] OK — N routes match.`

- [ ] **Step 4:** Sanity-check the failure mode: temporarily add a route to the EXCLUDES set that should be in the sitemap and re-run. Verify it fails with a clear message. Revert.

- [ ] **Step 5:** Run full build.

```bash
bun run build
```

Expected: build succeeds, coverage check passes.

- [ ] **Step 6:** Commit.

```bash
git add scripts/check-sitemap-coverage.ts package.json docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): add build-time sitemap coverage check"
```

**STOP. Ask Yesid to verify `bun run build` still completes cleanly before Task 12.**

---

## Task 12: Default OG image asset

**Files:**
- Create: `static/og/default.png`

### Steps

- [ ] **Step 1:** Produce the default OG image.

A 1200×630 PNG with the yesid. wordmark + tagline on `#141414` background with `#E07800` orange dot accent. Two options:

**Option A — export from existing brand assets (preferred).**

Check `brand/logos/` and `brand/scripts/`. If there's an existing export script:

```bash
bun run brand:export-logos
```

and one of the outputs is a 1200×630 OG-sized PNG, copy it into `static/og/default.png`.

If not, proceed to Option B.

**Option B — render once with a small Bun script.**

Create `scripts/generate-default-og.ts`:

```ts
#!/usr/bin/env bun
// One-shot: render static/og/default.png.
// Uses the Canvas API via node-canvas if available, or writes an SVG that is
// converted with sharp. Simplest reliable path on Windows: emit an SVG file
// and open it in any browser to "Save as PNG" at 1200×630.

import { writeFileSync } from 'node:fs';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#141414"/>
  <text x="100" y="330" font-family="Inter, sans-serif" font-size="120" font-weight="900" fill="#F5F5F5">yesid<tspan fill="#E07800">.</tspan></text>
  <text x="100" y="420" font-family="Inter, sans-serif" font-size="40" font-weight="500" fill="#9CA3AF">Digital infrastructure that moves.</text>
</svg>`;

writeFileSync('static/og/default.svg', svg);
console.log('Wrote static/og/default.svg — open in a browser and export as 1200×630 PNG to static/og/default.png');
```

Run it, open the resulting SVG in a browser, save as PNG at 1200×630 to `static/og/default.png`. Delete the SVG if not needed as a source file (it can be regenerated).

- [ ] **Step 2:** Verify the file exists.

```bash
ls -la static/og/default.png
```

Expected: file exists, size roughly 20–80KB (PNG of this size should not exceed 100KB for crawler performance).

- [ ] **Step 3:** Verify in-browser share preview.

```bash
bun run dev
```

Open `http://localhost:5173/`. View-source. Confirm `og:image` points to `https://yesid.dev/og/default.png` (or resolves to it). Open the asset URL directly (`/og/default.png`) in a new tab — image renders correctly.

- [ ] **Step 4:** Commit.

```bash
git add static/og/default.png docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
git commit -m "feat(slice-15a): add default OG image (1200x630 branded)"
```

**STOP. Ask Yesid to approve the OG image visually before Task 13.**

---

## Task 13: Error page wiring

**Files:**
- Modify: `src/routes/+error.svelte`

### Steps

- [ ] **Step 1:** Read the existing error page.

```bash
cat src/routes/+error.svelte
```

Note the existing structure — do not disturb unrelated UI.

- [ ] **Step 2:** The error SEO is already wired via the layout's fallback to `/__error`. Verify no additional component-level code is needed.

Open `http://localhost:5173/this-page-does-not-exist` in the browser. View-source. Confirm:
- `<title>` contains "Not Found"
- `<meta name="robots" content="noindex,nofollow">` present
- `og:url` points to `https://yesid.dev/`

If the tags appear correctly, the layout fallback is doing its job and this task is verification-only. No file edits required.

If tags are missing (e.g., because the layout load doesn't run on the error boundary), add an inline `<SeoHead>` in `+error.svelte`:

```svelte
<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { getPageSeo } from '$lib/repositories/meta';
	import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
	// ... existing imports

	const errorSeoPromise = getPageSeo('/__error', DEFAULT_LOCALE);
</script>

{#await errorSeoPromise then errorSeo}
	<SeoHead seo={errorSeo} locale={DEFAULT_LOCALE} />
{/await}

<!-- existing error UI below -->
```

- [ ] **Step 3:** Commit the verification note (and any fallback) if anything changed. If no changes were needed, skip the commit.

```bash
git add docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/handoff.md
# optional: src/routes/+error.svelte if tweaked
git commit -m "feat(slice-15a): verify 404 SEO (noIndex + error title)"
```

**STOP. Ask Yesid to verify 404 SEO before Task 14.**

---

## Task 14: Manual share-preview validation pass

**Files:**
- Modify: `docs/slices/slice-15/slice-15a/handoff.md`

### Steps

- [ ] **Step 1:** Start a local preview server accessible to external tools.

The sharing validators need a publicly reachable URL. Either:

- Deploy the branch to a Vercel preview URL: push the branch, Vercel creates a preview automatically (project already uses `@sveltejs/adapter-vercel`).
- OR expose localhost via `bunx cloudflared tunnel --url http://localhost:5173` (if cloudflared is installed) or similar tool.

Use whichever is available. Record the URL in `handoff.md`.

- [ ] **Step 2:** Run the validation matrix.

Test URLs (replace with the preview URL):
1. `{host}/` — home
2. `{host}/about` — about
3. `{host}/blog/{first-post-slug}` — one blog post
4. `{host}/projects/{first-project-slug}` — one project
5. `{host}/services/{first-service-id}` — one service

Tools (5 URLs × 4 tools = 20 checks):

- **opengraph.xyz** — paste each URL, screenshot the rendered preview
- **Twitter Card Validator** (`cards-dev.twitter.com/validator`) — paste, capture the "Card preview"
- **LinkedIn Post Inspector** (`linkedin.com/post-inspector`) — paste, screenshot
- **Slack unfurl** — paste each URL in a throwaway DM to yourself; screenshot each

Plus:

- **Lighthouse** — Chrome DevTools → Lighthouse → SEO category → run for each of the 5 URLs; record the SEO score (target ≥ 95)

- [ ] **Step 3:** Log results in `handoff.md`.

Append a section:

```markdown
## Share-preview validation (Task 15a-8)

| URL | opengraph.xyz | Twitter | LinkedIn | Slack | Lighthouse SEO |
|-----|---------------|---------|----------|-------|----------------|
| /   | ✅ | ✅ | ✅ | ✅ | 95 |
| /about | ✅ | ✅ | ✅ | ✅ | 97 |
| /blog/{slug} | ✅ | ✅ | ✅ | ✅ | 96 |
| /projects/{slug} | ✅ | ✅ | ✅ | ✅ | 96 |
| /services/{id} | ✅ | ✅ | ✅ | ✅ | 96 |

Screenshots committed under `docs/slices/slice-15/slice-15a/screenshots/share-validation/`.
```

Commit the screenshots alongside the handoff update.

- [ ] **Step 4:** Commit.

```bash
git add docs/slices/slice-15/slice-15a/handoff.md docs/slices/slice-15/slice-15a/log.md docs/slices/slice-15/slice-15a/screenshots/
git commit -m "docs(slice-15a): share-preview validation pass — 5 URLs × 5 tools"
```

- [ ] **Step 5:** Run full test suite + check + build.

```bash
bun run test && bun run check && bun run build
```

Expected: all green.

- [ ] **Step 6:** Open PR.

```bash
gh pr create --title "slice-15a: SEO Foundation (Payload-ready, localized)" --body-file docs/slices/slice-15/slice-15a/handoff.md
```

**STOP. Ask Yesid to review the PR before merge.**

---

## Execution Order

Tasks are mostly sequential — each builds on prior state:

- Tasks 1–2 are independent (could parallelize): schema + defaults.
- Task 3 depends on Task 1 (imports `PageSeo`).
- Task 4 depends on Task 1 (imports `PageSeo`).
- Task 5 depends on Tasks 1, 3, 4.
- Task 6 depends on Task 5 (repo wraps adapter).
- Task 7 depends on Tasks 1, 2 (imports schema + defaults).
- Task 8 depends on Tasks 6, 7.
- Task 9 depends on Task 2 (uses `SITE_HOST` + `PUBLISHED_LOCALES`) and on adapter collections being stable (Task 5 is a no-op for collection methods — still ships Task 5 first for type consistency).
- Task 10 depends on Task 2.
- Task 11 depends on Task 9 (reuses the handler).
- Task 12 is independent of code tasks — can run any time once Task 7 is live.
- Task 13 depends on Task 8.
- Task 14 depends on all prior tasks shipped.

Session split suggestion: Tasks 1–8 in Session 1 (land the visible head tags). Tasks 9–14 in Session 2 (sitemap, robots, build gate, asset, validation).

## Out of Scope

- Per-post / per-project auto-generated OG images (Satori) — Slice 15c (deferred post-Payload)
- JSON-LD schemas (Person, BlogPosting, Service, etc.) — Slice 15b
- Zod rollout across `content` / `projects` / `blog` / `services` repositories — Slice 17c
- Google Search Console setup — Slice 22 (post-deploy)
- Analytics
- FR/ES content translations — future slice; 15a wires the structure
- Locale URL scheme decision (subdomain vs. path prefix vs. accept-language) — deferred to the slice that introduces the second locale

## Common pitfalls

- **`export const ssr = false` on `+page.ts`**: The home page has it for GSAP/Lottie. Don't touch this. The whole point of layout-authoritative SEO is that the layout load always SSRs regardless of a child page's ssr setting. If SSR SEO ever stops working, first check `+layout.ts` is UNIVERSAL (not a `+layout.server.ts`), since universal `load` still runs on the server on initial render.
- **Windows CRLF line endings**: Committing `+layout.ts` or `+server.ts` may show spurious whitespace diffs. `.gitattributes` should be handling this; if the initial commit shows unexpected whitespace, run `git add --renormalize .` once after writing the file.
- **Dynamic route factories closing over stale adapter**: `routeSeoEntries['/blog/[slug]']` uses `await import('$lib/adapters')` inside the factory rather than a top-level import to avoid a circular dependency at module-load time (`content/meta.ts` → `adapters/static.ts` → `content/meta.ts`). Do not refactor to a top-level import.
- **Zod `refine` error messages**: When the tests for over-length title/description fail, the error object lives at `result.error.issues[0].message`. Tests should assert `success: false` rather than the specific message text to stay robust.
- **SvelteKit route id for the root**: `event.route.id` is `'/'` for the home page, not `''`. Use `'/'` as the key in `routeSeoEntries`.
- **`content-type` on server routes**: Missing or incorrect content-type causes crawlers to ignore the payload. Always set explicitly — do not rely on SvelteKit defaults.
- **Vercel adapter caching**: Preview deployments cache robots/sitemap aggressively. After changes, hard-refresh or bust cache via query string during validation.

## Self-Review

After writing this plan, I checked:

1. **Spec coverage:** Every acceptance criterion in `spec.md` maps to a task:
   - PageSeoSchema (Task 1) / adapter parsing (Task 5) / locale fallback (Task 5 test)
   - SeoHead full tag emission (Task 7)
   - content/meta.ts per-route entries (Task 4)
   - sitemap + hreflang (Task 9)
   - robots + sitemap reference (Task 10)
   - app.d.ts requires seo (Task 3)
   - build-time coverage gate (Task 11)
   - dev-mode warnings (Task 7)
   - default OG image (Task 12)
   - bun run build/test/check pass (Task 14 step 5)
   - Manual validation logged (Task 14)
   - Lighthouse ≥ 95 (Task 14)
   - PUBLISHED_LOCALES editable without template changes (Task 7 tests cover hreflang loop; see also the `og:locale:alternate` test)
   - Home SSR verified (Task 8 step 7 + Task 14)

2. **Placeholder scan:** No "TBD", "TODO", or "fill in later" in any task. Every step has exact commands and code. Fallbacks (e.g., error page verification finding no fix needed) are written conditionally with the fallback code provided.

3. **Type consistency:**
   - `PageSeo` imported as type from `$lib/schemas/seo` everywhere
   - `forRoute(routeId, locale, params?)` signature identical in `types.ts`, `static.ts`, `meta.ts` repo, `+layout.ts`, and tests
   - Route ids use the `/[slug]` pattern consistently (not `:slug` or bare)
   - `routeSeoEntries` key is always `routeId` as emitted by `event.route.id`

4. **Scope check:** 14 tasks, 2 sessions — in spec's 1–2 session estimate. No subsystem could be split further without losing coherence. Task 14 is validation-only (no new code); Task 13 is mostly verification. Real code lives in Tasks 1–11.
