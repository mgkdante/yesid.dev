# Sub-Slice 15a — Work Log

**Running record across all sessions.** Session-by-session. Session headings: `### Session YYYY-MM-DD HH:MM — Task 15a-N`.

## Prerequisites / environment

- Bun version: any recent (project pinned via `bun.lockb`)
- Env vars required: `YESITO_CLOUD_ROOT` for mirror scripts (not required during normal development)
- Dependencies affecting this sub-slice: Zod (added in Task 1)

## Session index

- 2026-04-19 — planning (brainstorm + spec + plan; no implementation)

---

### Session 2026-04-19 — Planning

**Tool:** Claude Code (claude-opus-4-7[1m])
**Session type:** Planning
**Picking up from:** Slice 17k shipped (commit `e157e30`, PR #25 merged). Starting 15a fresh.

**Goal:** Produce spec + plan for slice-15a; confirm scope with Yesid.

**Commands run:** n/a (planning only)

**Files touched:**
- Created: `docs/slices/slice-15/slice-15a/spec.md`
- Created: `docs/slices/slice-15/slice-15a/plan.md`
- Created: `docs/slices/slice-15/slice-15a/log.md` (this file)
- Created: `docs/slices/slice-15/slice-15a/handoff.md`
- Created: `docs/slices/slice-15/slice-15b/spec.md` (stub for follow-up sub-slice)
- Created: `docs/slices/slice-15/slice-15c/README.md` (deferred ticket for post-Payload Satori)

**Decisions:**
- D001: Bring Zod forward from planned Slice 17c into 15a, narrowly scoped to `PageSeoSchema`. Reason: the schema IS the contract Payload must honor in Slice 18; defining it now avoids retrofit.
- D002: Sub-slice split — 15a (foundation: meta/OG/sitemap/robots) + 15b (JSON-LD). Reason: 15a ships a visible client win (LinkedIn/Twitter cards work) without waiting for schema design; 15b ships the structured-data win with 15a's adapter already exercised.
- D003: OG image strategy — default branded 1200×630 only in 15a; per-post/per-project Satori generation deferred to 15c (post-Payload). Reason: Payload will supply `coverImage` fields; building Satori against TS adapter that's about to be retired would be rework.
- D004: Layout-authoritative SEO (not per-page). Reason: home `+page.ts` has `ssr = false` (GSAP/Lottie). Per-page SEO wouldn't ship server-side to social crawlers. Centralizing in `+layout.ts` via `adapter.meta.forRoute(route.id, locale, params)` fixes this AND matches Payload's single-source-of-truth model.
- D005: Locale URL scheme decision deferred to the slice that introduces the second locale. 15a hardcodes EN-only URLs behind a `canonicalFor(route, locale)` helper so the future FR/ES slice changes one function.

**Errors encountered:** n/a

**Validation:** n/a (planning)

**Outcome:** Spec approved by Yesid; plan drafted with 14 tasks across 2 sessions; branch `feature/slice-15a-seo-foundation` cut from `main` with spec committed.

**Blockers / questions:** none — ready for implementation.

---

---

### Session 2026-04-19 23:12 — Task 15a-1

**Tool:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Session type:** Implementation
**Picking up from:** Planning session (commit 1494b98)

**Goal:** Land Zod dependency + PageSeoSchema + test coverage for schema validation.

**Commands run:**
```bash
bun add zod
bun run test src/lib/schemas/seo.test.ts
bun run check
```

**Files touched:**
- Modified: `package.json`, `bun.lock` — added zod runtime dep
- Modified: `vite.config.ts` — added `src/lib/schemas/**/*.test.ts` to vitest include patterns (required so new test directory is picked up by the existing explicit allowlist)
- Created: `src/lib/schemas/seo.ts`
- Created: `src/lib/schemas/seo.test.ts`

**Decisions:**
- D006: Used `.refine()` on LocalizedStringSchema for title/description length so one rule covers en/fr/es. Cleaner than branching per-locale.
- D007: vite.config.ts uses an explicit include allowlist for test directories; added schemas/ pattern alongside existing adapters/content/repositories/utils/styles entries. Not in the original Task 1 file list but required for tests to run.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/schemas/seo.test.ts` | PASS (9/9) |
| `bun run check` | PASS (0 errors, 19 pre-existing warnings) |

**Outcome:** Zod-validated PageSeoSchema in place with exhaustive test coverage. Ready for Task 2.

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:22 — Task 15a-2

**Tool:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Session type:** Implementation
**Picking up from:** Task 15a-1 commit 2d3aa61

**Goal:** Land site-level SEO defaults + `canonicalFor` helper for locale-aware URL resolution.

**Commands run:**
```bash
bun run test src/lib/utils/seo-defaults.test.ts
bun run check
```

**Files touched:**
- Created: `src/lib/utils/seo-defaults.ts`
- Created: `src/lib/utils/seo-defaults.test.ts`

**Decisions:**
- D008: `canonicalFor` accepts locale as a parameter but currently ignores it (EN-only). Stable API — the slice that introduces FR/ES changes the helper body without changing any call site.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/utils/seo-defaults.test.ts` | PASS (8/8) |
| `bun run check` | PASS (0 errors) |

**Outcome:** Defaults module ready. Task 7 (`SeoHead`) will consume these; Task 11 (sitemap script) will consume `PUBLISHED_LOCALES`.

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:28 — Task 15a-3

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-2 commit f00079e

**Goal:** Extend `MetaPort` contract with `forRoute(routeId, locale, params?)`, re-export `PageSeo` from `$lib/types`, require `seo` on `App.PageData`.

**Commands run:**
```bash
bun run check   # 1 error EXPECTED (static adapter missing forRoute — resolved in Task 5)
bun run test    # 846 passed — no regressions
```

**Files touched:**
- Modified: `src/lib/adapters/types.ts` — added `forRoute` to `MetaPort`, added `PageSeo` import
- Modified: `src/lib/types.ts` — re-exported `PageSeo` from `$lib/schemas/seo`
- Modified: `src/app.d.ts` — extended `App.PageData` with required `seo: PageSeo`

**Decisions:**
- D009: `App.PageData.seo` required (not optional). Layout load always provides it; no page is allowed to skip.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run check` | 1 ERROR (expected — `static.ts:105 Property 'forRoute' is missing`, resolved in Task 5) |
| `bun run test` | PASS (846/846 — no regressions from pre-existing suite) |

**Outcome:** MetaPort contract extended. The one expected error is the design gate — static adapter must implement `forRoute` (Task 5). Ready for Task 4 (populate content/meta.ts).

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:32 — Task 15a-4

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-3 commit 745d637

**Goal:** Populate `content/meta.ts` with per-route SEO entries for all 13 public routes (static + dynamic factories).

**Commands run:**
```bash
bun run check  # still 1 expected error from Task 3 (static.ts missing forRoute, resolves Task 5)
bun -e '...'   # char-count verification: all descriptions 148–162 chars (within 50–200 Zod band)
```

**Files touched:**
- Modified: `src/lib/content/meta.ts` — added `routeSeoEntries` map + `fitDescriptionForSeo` helper + `FALLBACK_DESCRIPTION`

**Decisions:**
- D010: Dynamic-route factories use `await import('$lib/adapters')` instead of top-level import to avoid circular dependency (`content/meta.ts` → `adapters/static.ts` → `content/meta.ts` if adapter imports meta entries directly).
- D011: Project detail prefers `description` field over `oneLiner` for SEO (fuller content). Falls back to `oneLiner`, then site fallback if outside 50–200 band.
- D012: Blog detail uses `post.excerpt` (the existing excerpt field) since BlogPost has no `summary`.
- D013: Added `FALLBACK_DESCRIPTION` + `fitDescriptionForSeo()` helper so content-layer data that doesn't fit SEO band degrades gracefully to a site-wide fallback rather than throwing at Zod.
- D014: Project routes use `[slug]` (filesystem is `projects/[slug]`), blog uses `[slug]`, services use `[id]`. Route ids in entry keys match these exactly.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run check` | 1 ERROR (unchanged — Task 5 target) |
| Char counts | 148–162 per description; all within 50–200 Zod band |

**Outcome:** 13 route entries in place: home, about, contact, services (index + factory), projects (index + factory), blog (index + personal + factory), tech-stack, __error. Ready for Task 5 to implement forRoute on the adapter.

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:34 — Task 15a-5

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-4 commit 881ef8a

**Goal:** Implement `forRoute` on the static adapter — closes the design gate from Task 3.

**Commands run:**
```bash
bun run test src/lib/adapters/meta.test.ts
bun run check
```

**Files touched:**
- Modified: `src/lib/adapters/static.ts` — added `forRoute` implementation + imports (`routeSeoEntries`, `PageSeoSchema`, `PageSeo`, `Locale`)
- Created: `src/lib/adapters/meta.test.ts` — 8 tests covering static routes, dynamic blog/project/service routes, unknown routes, 404 entry

**Decisions:**
- D015: Adapter boundary is the Zod parse point — `PageSeoSchema.parse(raw)` runs on every call. Bad data fails loudly at the seam rather than surfacing downstream.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/adapters/meta.test.ts` | PASS (8/8) |
| `bun run check` | PASS (0 ERRORS — design gate from Task 3 closed) |

**Outcome:** Contract green end-to-end: port → adapter → Zod-parsed PageSeo. Ready for Task 6 (repository wrapper).

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:36 — Task 15a-6

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-5 commit 466f70d

**Goal:** Add `getPageSeo` repository wrapper so layout/page code never imports the adapter directly.

**Files touched:**
- Modified: `src/lib/repositories/meta.ts` — added `getPageSeo` wrapping `adapter.meta.forRoute`
- Created: `src/lib/repositories/meta.test.ts` — 3 tests (static, dynamic, unknown-route propagation)

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/repositories/meta.test.ts` | PASS (3/3) |
| `bun run check` | PASS (0 errors) |

**Outcome:** Clean consumer surface for Task 8 layout load. Ready for Task 7 (SeoHead component).

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:39 — Task 15a-7

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-6 commit f445118

**Goal:** Implement `SeoHead` Svelte component with full `<head>` tag emission + dev-mode warnings.

**Files touched:**
- Created: `src/lib/components/seo/SeoHead.svelte` — renders title/description/canonical/OG/Twitter/hreflang/theme-color into `<svelte:head>`
- Created: `src/lib/components/seo/SeoHead.test.ts` — 14 tests covering tag emission + dev warnings + ogImage resolution (relative→absolute)

**Decisions:**
- D016: `dev` is a component prop (default `runtimeDev` from `$app/environment`). Tests force it on/off to verify warnings behave correctly in both modes — no global `vi.stubEnv` needed.
- D017: Added 2 extra tests beyond the plan: (a) relative ogImage URL → absolute resolution; (b) absolute ogImage URL pass-through. These nail down the behavior documented in Task 1's schema comments.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/components/seo/SeoHead.test.ts` | PASS (14/14) |
| `bun run check` | PASS (0 errors) |

**Outcome:** Component ready. Task 8 wires it into the root layout.

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:48 — Task 15a-8

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-7 commit 507d121

**Goal:** Wire the SEO foundation into the running app via root `+layout.ts` + `<SeoHead>` mount, clean up scattered `<svelte:head>` blocks across pages, verify SSR emits all meta server-side (critical for social crawlers).

**Commands run:**
```bash
bun run test src/routes/layout.test.ts
bun run check
curl http://localhost:5173/ http://localhost:5173/about http://localhost:5173/blog/[real-slug]
preview_eval window.location + document.head inspection
bun run test    # 877/877
```

**Files touched:**
- Created: `src/routes/+layout.ts` — server-side load calls `getPageSeo(route.id, locale, params)`, falls back to `/__error` on unknown routes
- Created: `src/routes/layout.test.ts` — 6 tests (had to rename from `+layout.test.ts` — SvelteKit reserves `+` prefix)
- Modified: `src/routes/+layout.svelte` — removed `buildPersonSchema`/`siteMeta` imports + JSON-LD exception block; mounted `<SeoHead seo={data.seo} locale={DEFAULT_LOCALE} />`; added `data` to props destructure
- Modified: `src/routes/+page.ts` — **re-enabled SSR** (Slice 17e motion re-engineering made GSAP/Lottie lazy-loaded; browser-only imports now behind onMount/actions only)
- Modified: `src/routes/about/+page.svelte` — removed local `<svelte:head>` + unused metaTitle/metaDescription consts
- Modified: `src/routes/contact/+page.svelte` — same
- Modified: `src/routes/services/+page.svelte` — same
- Modified: `src/routes/services/[id]/+page.svelte` — same
- Modified: `src/routes/projects/+page.svelte` — same
- Modified: `src/routes/tech-stack/+page.svelte` — removed `<svelte:head>` + metaTitle/metaDescription consts (kept the heroOverline / heroTitle / etc. content resolution)
- Modified: `src/routes/+page.svelte` — removed empty `<svelte:head>` block

**Decisions:**
- D018: SvelteKit reserves `+` prefix for routing. Test file had to be `layout.test.ts` (no `+`). Matches existing pattern (`home.test.ts`, `error.test.ts`).
- D019: **Re-enabled home page SSR.** The motion engine re-engineering in Slice 17e moved all GSAP/Lottie imports behind `onMount` and Svelte actions. Server-side import no longer triggers browser-only API access. Verified via `curl http://localhost:5173/` — full meta set ships server-side, no 500 errors, no runtime errors on client hydration. This was required for social crawlers (Twitter/LinkedIn/Facebook) to see the home page's meta.
- D020: Removed scattered per-page `<svelte:head>` blocks from 6 pages + home. SEO is now exclusively layout-driven — SeoHead owns all SEO meta, app.html owns only the charset/viewport/font hints.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/routes/layout.test.ts` | PASS (6/6) |
| `bun run test` (full suite) | PASS (877/877 — no regressions) |
| `bun run check` | PASS (0 errors) |
| `curl http://localhost:5173/` | Full meta set in HTML (home SSR now works) |
| `curl http://localhost:5173/about` | Full meta set |
| `curl http://localhost:5173/blog/building-a-transit-pipeline` | Per-post title + canonical + `og:type=article` |
| `curl http://localhost:5173/blog/not-a-real-post` | 404 SEO (`noindex,nofollow`, `Not Found | yesid.`) |

**Outcome:** SEO end-to-end live in dev. Every route type emits correct SSR meta. Home page meta visible to non-JS crawlers. Seven per-page head blocks removed. Ready for Task 9 (sitemap).

**Blockers / questions:** none — this was the big integration task. All predictions held. No OS-quirk issues.

---

---

### Session 2026-04-20 00:00 — Task 15a-9

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-8 commit 6655bcb

**Goal:** Ship `/sitemap.xml` server route iterating public routes × published locales with hreflang.

**Files touched:**
- Created: `src/routes/sitemap.xml/+server.ts` — server handler; exports `_STATIC_ROUTES` + `_buildSitemapEntries` for the Task 11 coverage gate
- Created: `src/routes/sitemap.xml/server.test.ts` — 6 tests (content-type, static routes, dynamic routes, exclusions, hreflang, well-formed XML)

**Decisions:**
- D021: Named exports in a `+server.ts` require a `_` prefix — SvelteKit rejects any non-reserved name. Used `_STATIC_ROUTES` + `_buildSitemapEntries` with explanatory comment. Task 11's coverage script imports `_buildSitemapEntries` instead of HTTP-fetching `/sitemap.xml`.
- D022: Test file name `server.test.ts` (not `+server.test.ts`) per the SvelteKit `+` prefix reservation learned in Task 8.
- D023: `lastmod` pulls from blog post `updatedAt` → `publishedAt` → `date` → build-time fallback (supports various data shapes through Slice 18 migration).

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/routes/sitemap.xml/server.test.ts` | PASS (6/6) |
| `bun run check` | PASS (0 errors) |
| `curl http://localhost:5173/sitemap.xml` | Valid XML, all static routes + dynamic slugs, hreflang entries |

**Outcome:** Live sitemap working. Ready for Task 10 (robots.txt) + Task 11 (build gate).

**Blockers / questions:** none

---

---

### Session 2026-04-20 00:03 — Task 15a-10

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-9 commit edf0089

**Goal:** Ship `/robots.txt` server route referencing sitemap, blocking /preview.

**Files touched:**
- Created: `src/routes/robots.txt/+server.ts`
- Created: `src/routes/robots.txt/server.test.ts` — 4 tests
- Deleted: `static/robots.txt` — legacy "allow all" static file was taking precedence over the new server route

**Decisions:**
- D024: Removed `static/robots.txt` (pre-existing generic file). SvelteKit serves static/ files before routes, so the dynamic handler was being shadowed. Deletion was silent and verified via curl.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/routes/robots.txt/server.test.ts` | PASS (4/4) |
| `bun run check` | PASS (0 errors) |
| `curl http://localhost:5173/robots.txt` | Correct output: `User-agent: *`, `Allow: /`, `Disallow: /preview`, `Sitemap: https://yesid.dev/sitemap.xml` |

**Outcome:** Robots + sitemap both live. Ready for Task 11 (build coverage gate).

**Blockers / questions:** none

---

---

### Session 2026-04-20 00:09 — Task 15a-11

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-10 commit aa29acd

**Goal:** Wire a build-time gate that fails the build if declared routes and sitemap entries diverge.

**Files touched:**
- Created: `src/tests/sitemap-coverage.test.ts` — walks `src/routes`, expands dynamic slugs, diffs vs. sitemap output
- Modified: `vite.config.ts` — added `src/tests/**/*.test.ts` to the `data` project test include patterns
- Modified: `package.json` — new `check:sitemap` script (just runs the coverage test); `build` now chains `vite build && bun run check:sitemap`

**Decisions:**
- D025: Attempted a pure Bun script first; abandoned because `import.meta.glob` (used in `src/lib/content/blog.ts` for markdown loading) requires Vite runtime. Pivoted to a vitest test that runs in Vite context. Same semantic gate, cleaner integration.
- D026: Walker regex matches `+page.svelte` AND `+page@*.svelte` (SvelteKit's layout-group syntax — projects and blog detail use `@.svelte` to skip intermediate layouts). Initial walker missed these, producing false positives (sitemap had routes that "weren't declared").
- D027: Exclusions list: `/sitemap.xml`, `/robots.txt` (they're the plumbing, not content routes).

**Validation:**
| Command | Result |
|---------|--------|
| `bun run check:sitemap` | PASS (1 test) |
| `bun run build` | PASS — vite build succeeds, then check:sitemap passes |
| Full `bun run test` | Still green (existing tests unaffected) |

**Outcome:** Build fails if anyone adds a page without a sitemap-covering entry. Payload swap in Slice 18 will keep working as long as the new adapter returns slugs the same way. Ready for Task 12 (OG image).

**Blockers / questions:** none

---

---

### Session 2026-04-20 00:14 — Task 15a-12

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-11 commit d8fc4e1

**Goal:** Ship default OG image — locale-aware, data-driven, Payload-ready.

**Files touched:**
- Added dep: `sharp@0.34.5` (dev) — SVG→PNG rasterisation
- Created: `scripts/generate-og-default.ts` — reads `siteMeta.tagline` via LocalizedString, iterates `PUBLISHED_LOCALES`, emits `static/og/default.{locale}.png` for every locale with a translated tagline
- Created: `static/og/default.en.png` — 29KB, 1200×630, wordmark + orange-dot brand + tagline + location
- Modified: `src/lib/utils/seo-defaults.ts` — added `defaultOgImageFor(locale)` helper; kept `DEFAULT_OG_IMAGE` as EN alias
- Modified: `src/lib/components/seo/SeoHead.svelte` — consumes `defaultOgImageFor(locale)` instead of the static constant
- Modified: `src/lib/components/seo/SeoHead.test.ts` — added test for unpublished-locale fallback behavior
- Modified: `package.json` — new `og:default` script
- Deleted: earlier standalone `static/og/default.svg` + first-draft PNG (regenerated from script now)

**Decisions:**
- D028: Data-driven generator (not a static SVG file). Source of truth is `siteMeta.tagline.{locale}` in the data layer. When the static adapter swaps for Payload (Slice 18), `siteMeta` comes from Payload GraphQL — generator needs zero change.
- D029: Per-locale file naming `default.{locale}.png`. Fallback to EN when requested locale isn't in `PUBLISHED_LOCALES`. No broken images.
- D030: Dropped the "STOP 15 — SEO" eyebrow from the first draft — that's a bento-card internal convention per the brand memory, not appropriate for external social previews. Replaced with "Digital Infrastructure · Montréal" (category + location).
- D031: Brand check — favicon is the orange dot (per user reminder). OG image wordmark uses "yesid<tspan fill='#E07800'>.</tspan>" — the dot IS the brand mark, same as favicon.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run og:default` | Wrote static/og/default.en.png (1200×630, 29KB) |
| `bun run test src/lib/utils/seo-defaults.test.ts src/lib/components/seo/SeoHead.test.ts` | PASS (23/23 — added 1 new test for unpublished-locale fallback) |
| `curl http://localhost:5173/about \| grep og:image` | `<meta property="og:image" content="https://yesid.dev/og/default.en.png"/>` |
| User visual approval | ✓ approved |

**Outcome:** Locale-aware OG image wired end-to-end. Adding FR/ES: fill `siteMeta.tagline.fr` / `.es`, add locale to `PUBLISHED_LOCALES`, rerun `bun run og:default`. Script generates the new PNG, SeoHead automatically picks it up. Zero code changes needed when Payload ships.

**Blockers / questions:** none

---

## OS-quirks encountered this sub-slice

(Populate as you hit platform-specific issues. At slice close, migrate these to `<cloud>/workflow-knowledge/os-quirks/<os>.md` per the closing checklist.)

| Problem | OS | Fix | Logged to registry? |
|---------|----|----|--------------------|
| _(none yet)_ | — | — | — |
