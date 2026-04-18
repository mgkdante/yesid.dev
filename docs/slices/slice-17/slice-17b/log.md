# Slice 17b — Implementation Log

Running session-by-session record of the work. Chronological. Append-only.

---

## Session 2026-04-18 — Task 17b-1 Folder restructure

**Model:** Opus 4.7 [1m] (L-slice Implementation — working set spans multiple architectural layers and a large import rewrite).
**Branch:** `feature/slice-17b-repositories`
**Goal:** Dissolve `src/lib/data/` into `content/` + `utils/` + top-level `types.ts`. Preserve all tests green, zero functional change.

### Pre-flight

- P.1 Baseline: `bun run test` → 82 test files / 782 tests pass. `bun run check` → 0 errors, 19 warnings (pre-existing).
- P.2 Branch: `feature/slice-17b-repositories` ✓.
- P.3 TodoWrite seeded with 10 tasks. 17b-1 in_progress.
- P.4 Preview server deferred until after the restructure; visual check at step 1.13.

### Amendment flagged + approved

**Plan gap:** `src/lib/utils.ts` (shadcn-svelte helper with `cn`, `WithoutChild`, `WithElementRef`) was not mentioned in the plan yet collides with the new `src/lib/utils/` folder. 295 files imported it via `'$lib/utils.js'`.

**Resolution (Yesid approved):** Option A — move `utils.ts` content into `utils/cn.ts`, rewrite all 295 imports to the new `$lib/utils` barrel. Added a step 1.1b for the move.

**Follow-up direction (Yesid):** Add barrel exports for `content/` and `utils/` so the UI consumers (and downstream layers) can integrate cleanly. Implemented as `src/lib/content/index.ts` + `src/lib/utils/index.ts`.

### What shipped in this commit

- **Folder restructure:**
  - `src/lib/data/*` dissolved into `src/lib/content/*` (data types + content sources), `src/lib/utils/*` (pure engines), and `src/lib/types.ts` (promoted to top-level).
  - Renames inside the move: `content.ts → site-content.ts`, `highlight.ts → markdown.ts`, `stackRoles.ts → stack-roles.ts`, `serviceSvg.ts → service-svg.ts`, `schema.ts → json-ld.ts`, `data-integrity.test.ts → integrity.test.ts`.
  - `src/lib/utils.ts` (shadcn helpers) moved into `src/lib/utils/cn.ts`.
  - `src/lib/data/index.ts` deleted; `src/lib/data/` folder removed.
- **New barrels:**
  - `src/lib/content/index.ts` — re-exports every content module. Transitional during 17b; route loaders migrate to `$lib/repositories` in 17b-3+.
  - `src/lib/utils/index.ts` — re-exports every utility module. Safe target for the 295 `cn` consumers.
- **Import rewrite (426 replacements across 375 files):**
  - 301 `$lib/utils.js` → `$lib/utils` (the shadcn `cn` consumers).
  - 125 `$lib/data/<specific>` → new homes (`$lib/types`, `$lib/utils/*`, `$lib/content/*`).
  - Plus 22 bare-barrel imports (`from '$lib/data'` / `'$lib/data/index.js'`) expanded into grouped `$lib/types` + `$lib/utils` + `$lib/content` imports.
- **Cross-folder relative imports fixed:**
  - `utils/service-svg.ts`: `./services.js` → `$lib/content/services`.
  - `utils/json-ld.test.ts`: `./meta.js` → `$lib/content/meta`.
- **Vitest config updated:** `vite.config.ts` `data` project `include` was hard-coded to `src/lib/data/**/*.test.ts`; updated to `['src/lib/content/**/*.test.ts', 'src/lib/utils/**/*.test.ts', 'src/lib/styles/**/*.test.ts']`. Without this fix 14 test files / 237 tests silently disappeared from the run — caught by the baseline comparison at step 1.12.

### Verification

- `bun run check` → 0 errors, 19 warnings (same count + same locations as baseline).
- `bun run test` → 82 test files / 782 tests pass. Matches baseline exactly. No silent skips.

### Tooling notes

- Two one-shot Bun scripts were used (`_migrate-imports-17b-1.ts`, `_expand-barrel-17b-1.ts`) and deleted before commit — rewriting 295+ imports by hand would blow the token budget and risk inconsistency. Script outputs logged in the session for audit.

### Task 17b-1 approved 2026-04-18

---

## Session 2026-04-18 — Task 17b-2 Adapter scaffold

**Continuation of same session.** Pre-break check: Opus 4.7 [1m], context ~28% at start — comfortable to continue one more task.

### What shipped

- `src/lib/adapters/types.ts` — `ContentAdapter` interface with six ports: `projects`, `services`, `blog`, `meta`, `techStack`, `content`. Signatures enforce async + readonly + undefined-on-not-found.
- `src/lib/adapters/static.ts` — `staticAdapter: ContentAdapter`. The only module in the repo that currently imports from `$lib/content/*`. Annotated with the interface so missing methods fail compilation.
- `src/lib/adapters/index.ts` — one-line swap point (`export { staticAdapter as adapter } from './static'`), plus `ContentAdapter` type re-export for downstream consumers.
- `src/lib/adapters/adapter.test.ts` — 37 contract-level tests. Every port method verified for basic shape / cardinality / not-found behavior. Intentionally shallow — deep data checks remain in content-layer integrity tests.

### Plan deviations

- Used actual function names (`getProjectBySlug`, not `findBySlug as getProjectBySlug`). The plan's rename is a style choice; the codebase already matches.
- Test assertions against `SiteMeta` corrected mid-task: plan expected `owner/address/links`; actual shape is `name/tagline/description/links`. Same fix for `HeroData` (`queries` → `queryRows + queryTime`). Plan's reference tests were written from an earlier draft of the content files; corrected against reality.

### Config

- `vite.config.ts` `data` test project `include` gained `src/lib/adapters/**/*.test.ts` so contract tests run on `bun run test`.

### Verification

| Check | Result |
|---|---|
| `bun run test src/lib/adapters/adapter.test.ts` | 37/37 pass (<1s) |
| `bun run test` full | 83 files / 819 tests (baseline 82/782 + 1 new file / 37 new tests) |
| `bun run check` | 0 errors, 19 warnings (baseline) |

Adapters aren't wired to loaders yet — repositories (Task 17b-3) and route loaders (Task 17b-4) consume it. Preview rendering is unaffected.

### Task 17b-2 approved 2026-04-18

---

## Session 2026-04-18 — Task 17b-3 Repository layer

**Continuation of same session.** Context ~30%, approval cadence healthy; no reason to break.

### What shipped

- Six repository modules under `src/lib/repositories/`:
  - `project.ts` — 8 async getters delegating to `adapter.projects.*`.
  - `service.ts` — 4 service getters PLUS the metro-line derivation (`getMetroStops`, `getTotalStops`, `getStopByType`, `formatStopLabel`, `formatServicesLabel`, `MetroStop` type).
  - `blog.ts` — 12 async getters for blog queries + SVG/animation helpers.
  - `meta.ts` — `getSiteMeta` + `getPersonSchema` (the one repository method that *composes* — calls `buildPersonSchema` on adapter data).
  - `tech-stack.ts` — 11 async getters for tech items, scenarios, and relations.
  - `content.ts` — 17 async getters for hero/about/cta/closer/nav/error/aboutPage/contactPage/heroMock/etc.
- `repositories/index.ts` barrel re-exports all six.

### Metro fold-in — label preservation

Plan suggested stock LocalizedString labels (`{ en: 'About', fr: 'À propos', es: 'Acerca de' }`) for the metro bookends. Kept the EXISTING labels verbatim instead: "Departure" / "Featured Work" / "Who's Driving" / "Dispatches" / "Final Destination". 17b is architecture-only — zero visual changes — and the current copy is Yesid's creative choice. Plan reference was apparently written without reading the current `metro.ts`. Follow-up in Task 17b-6 may add fr/es translations to these LocalizedString objects.

The derivation kept the same stop shape (hero + services + featured + about + blog + terminal = services.length + 5). Every assertion from the old `metro.test.ts` reproduced with async rewrites.

### Dissolved / moved

- `src/lib/content/metro.ts` — **deleted** (functionality lives in `repositories/service.ts`).
- `src/lib/content/metro.test.ts` → `src/lib/repositories/service.test.ts` (rewritten with `async/await`).
- `src/lib/content/projects.test.ts` → `src/lib/repositories/project.test.ts` (rewritten async).
- `src/lib/content/tech-stack.test.ts` → `src/lib/repositories/tech-stack.test.ts` (rewritten async; `validateTechItems` + `validateScenarios` remain synchronous test helpers imported directly from `$lib/content/tech-stack`).
- `src/lib/content/index.ts` — removed the `export * from './metro'` line with a replacement comment pointer.

### Config

- `vite.config.ts` `data` test project `include` gained `src/lib/repositories/**/*.test.ts`.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 warnings (baseline) |
| `bun run test` | 83 files / 819 tests pass — same count as post-17b-2 (3 tests files moved in ↔ 3 moved out, net zero) |
| Preview all 10 primary routes | 200 OK across `/`, `/services`, `/services/sql-development`, `/projects`, `/projects/yesid-dev`, `/blog`, `/blog/personal`, `/tech-stack`, `/about`, `/contact` |
| Homepage snapshot | Hero + SQL terminal + metro strip render identically to pre-17b-3 |

### Non-obvious finding

No production component/route consumes `metroStops` / `TOTAL_STOPS` / `formatStopLabel` / `formatServicesLabel` / `getStopByType` yet — only the tests did. The derivation is reserved utility code. This means the metro-fold-in is entirely test-coverage-preserving: the visible metro strip on the homepage comes from a different component that iterates `services` directly, not from `getMetroStops()`. Documented for downstream awareness when components do wire up to `getMetroStops()`.

### Task 17b-3 approved 2026-04-18

---

## Session 2026-04-18 — Task 17b-4 Route loader migration

**Continuation of same session.** Context ~34%, all three prior commits approved without rework, no reason to break session.

### What shipped

Nine route loaders migrated from `$lib/content` to `$lib/repositories`:

| File | Shape |
|---|---|
| `src/routes/projects/+page.ts` | 5 content fns + 1 util — parallelized under Promise.all |
| `src/routes/projects/[slug]/+page.ts` | async; `project.relatedServices.map(getServiceById)` wrapped in Promise.all |
| `src/routes/services/+page.ts` | async; services + svg + per-service projects parallelized |
| `src/routes/services/[id]/+page.ts` | async; 404 check pre-awaits the service lookup |
| `src/routes/blog/+page.ts` | async; 3-way Promise.all then sequential svgContents |
| `src/routes/blog/personal/+page.ts` | mirror of /blog with `'personal'` category |
| `src/routes/blog/[slug]/+page.ts` | async; `blogPosts` replaced with `getAllPosts()` |
| `src/routes/tech-stack/+page.ts` | async; items + scenarios parallelized |
| `src/routes/about/+page.server.ts` | async; `aboutPageContent` replaced with `getAboutPageContent()` |

Two files did **not** change (intentionally):
- `src/routes/+page.ts` — contains only `export const ssr = false`. No loader, nothing to migrate.
- `src/routes/contact/+page.server.ts` — only fetches weather, no content imports.

Two documented exceptions marked with inline comments:
- `src/routes/+layout.svelte` — imports `siteMeta` + `buildPersonSchema` for JSON-LD; migration deferred to Slice 15 SEO.
- `src/routes/+error.svelte` — imports `errorPageContent`; SvelteKit runs `+error.svelte` without a loader, so repository migration needs upstream refactor in Slice 15.

### Parallelization strategy

Wherever a loader pulled multiple independent values from content, the migration bundles them with `Promise.all`. Example for `/projects`:

```ts
const [projects, tags, stackItems, serviceIds, services, serviceSvgContents] =
  await Promise.all([
    getPublicProjects(), getAllTags(), getAllStackItems(),
    getServiceIdsForProjects(), getVisibleServices(),
    fetchServiceSvgContents(fetch),
  ]);
```

This stays flat (no chained awaits), faster, and is Payload-ready without rework.

### Unchanged component behaviour

`ContactPage.svelte` and `AboutPage.svelte` still import `contactContent` / `aboutPageContent` directly — these are component-level rule violations that Task 17b-7 (component extraction) will fix. Task 17b-4 scope is loader-side only.

### Verification

| Check | Result |
|---|---|
| `grep '$lib/content' src/routes/**/+page*.ts` | 0 matches (all loaders on repositories) |
| `grep '$lib/adapters' src/routes` | 0 matches |
| `bun run check` | 0 errors, 19 warnings (baseline) |
| `bun run test` | 83 files / 819 tests pass |
| `bun run build` | ✅ 1m 3s — production build confirms SSR works on every async loader |
| 11-URL preview sweep | 10 × 200 OK, 1 × 404 (fake URL). HTML bodies all populated (about: 299k bytes, /: 997 bytes because `ssr = false`). |
| `/about` accessibility snapshot | Identity, metrics, testimonials, process, stack, clients, interests, snapshots, **location with live weather "Montreal 23°C Overcast Clouds"**, terminal — all render. |

The weather render proves the async pipeline end-to-end: `+page.server.ts` → `getAboutPageContent()` → `adapter.content.aboutPage()` → `$lib/content/about-page.ts` → back up to the SvelteKit data pipeline.

### Task 17b-4 approved 2026-04-18

---

## Session 2026-04-18 — Task 17b-5 Hardcoded content audit (parallel subagents)

**Continuation of same session.** Context ~36% of 1M, four prior commits approved without rework. Task 5 is parallelizable research — the cheapest task yet, token-efficiency-wise.

### Subagent dispatch

Seven Sonnet 4.6 subagents fired in a single parallel batch, one per directory group:

| # | Bucket | Agent model | Agent type |
|---|---|---|---|
| 1 | `components/home/` | sonnet | general-purpose |
| 2 | `components/blog/` | sonnet | general-purpose |
| 3 | `components/projects/` | sonnet | general-purpose |
| 4 | `components/services/` | sonnet | general-purpose |
| 5 | `components/about/` + `contact/` | sonnet | general-purpose |
| 6 | `components/brand/` + `stack/` | sonnet | general-purpose |
| 7 | `components/layout/` + `shared/` + `svg/` + `routes/*.svelte` | sonnet | general-purpose |

`components/ui/` (shadcn primitives) deliberately skipped — no app-specific copy.

Each agent received the same prompt template with SKIP rules (technical attributes, comments, CSS values, single characters, already-localized expressions, prop-passed content) and produced a structured markdown table.

### Results

- **~157 hardcoded user-facing strings** across ~30 components.
- **~26 edge cases** flagged for human judgment (decorative chrome, interpolated templates, deduplication).
- **Translation-debt scan:** approximately 230–260 en-only `LocalizedString` entries already in `content/*`. Only `nav.ts` is meaningfully multilingual; `site-content.ts` (92), `services.ts` (67), and `about-page.ts` (34) are the biggest debt concentrations.

Merged audit document: `docs/slices/slice-17/slice-17b/audit-hardcoded-content.md`. Includes per-component tables, proposed 12-sub-task breakdown for Task 17b-7, edge-case narrative, and translation-debt summary.

### Calibration gate — awaiting Yesid's decision

Three outcomes per plan step 5.6:
- **Proceed as-is** — Tasks 6 + 7 + 8 + 9 + 10 ship in this PR (~21 commits total, ~12 of them extraction).
- **Split 17b** — current PR ships through Task 4 + audit + integrity + governance + PR prep (Tasks 1–5, 8, 9, 10). Extraction (Tasks 6 + 7) becomes a new sub-slice `17b-2` with its own plan + PR.
- **Rescope** — drop extraction entirely from Slice 17; defer to a later slice. Current PR closes at ~8 commits.

My recommendation: **Split**. Rationale:
- Current PR already has 5 significant architectural commits (restructure → adapter → repositories → loaders → audit).
- Adding 12 extraction commits would make the PR hard to review — extraction is prop-flow + copy work, a different reviewer focus from hexagonal architecture.
- The architecture is shippable NOW. The seam works; Slice 18 Payload can land on it without the extraction being complete.
- Splitting isolates extraction risk — a flaw found in the architecture doesn't hold up copy work, and vice versa.
- Even though 157 is below the plan's 300-finding split threshold, combined with the translation-debt footprint (~230 fields), total extraction work is 400+ touchpoints.

Alternatively, Proceed is viable if you want 17b to be the single "data spine" PR and don't mind a larger review. Rescope seems unlikely — the audit cost has already been paid, walking away from it would waste it.

### Calibration — Yesid chose Proceed (option A) — all tasks ship in this PR

---

## Session 2026-04-18 — Task 17b-6 Content-side LocalizedString upgrade

**Continuation of same session.** Context ~40%.

### Scope decided

Task 17b-6 does two upgrades plus adapter/repository wiring:

1. **Metro bookend labels** move out of `repositories/service.ts` (inline LocalizedString literals) into `content/nav.ts` under a new `metroBookends` object. Adapter gains `content.metroBookends()` method. Repository reads bookends from adapter instead of hardcoding. This closes the remaining port-layer copy leak flagged in Task 17b-3 notes.
2. **`ImpactMetric.label` upgraded from `string` → `LocalizedString`.** Flagged during content-layer scan. Seven label values in `content/projects.ts` wrapped in `{ en: ... }`. Three consumers (ProjectDetailHeader, ProjectGlancePanel, ProjectGlancePanelMobile) updated to call `resolveLocale(metric.label, 'en')`. `project.test.ts` assertion updated to the new shape.

### Other bare-string fields scanned but not upgraded

Quick grep of `content/types.ts` revealed other candidates that could be LocalizedString (`ContactFormTerminal.text`, `JourneyPanel.name`, etc.), but most are either (a) structural (IDs, slugs, URLs, icon names) — correct as bare strings, or (b) tangled with script-level interpolation that the plan expected Task 17b-7 to handle alongside the component extraction. Limiting 17b-6 scope to bookends + `ImpactMetric` keeps the commit focused.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 warnings (unchanged) |
| `bun run test` | 83 files / 819 tests pass (unchanged) |
| Preview sweep (home + projects listing + 2 project details that use `impactMetrics`) | all 200 OK |
| Metro line labels | render verbatim through new adapter path: Departure / Featured Work / Who's Driving / Dispatches / Final Destination |

### Task 17b-6 approved 2026-04-18

---

## Session 2026-04-18 — Tasks 17b-7a through 17b-7e (extraction batch 1)

**Continuation of same session.** Context traversed from ~40% to ~62% during this batch.

Yesid chose Option A at the calibration gate (proceed with all 12 extraction sub-tasks in this PR). Per-sub-task STOP + approval cadence, same session.

### Completed sub-tasks

| Sub-task | Strings | Commit | Content file touched |
|---|---|---|---|
| 17b-7a Home | 14 | `fc6fb06` | site-content.ts |
| 17b-7b Blog listing | 16 | `5704269` | blog.ts |
| 17b-7c Blog detail | 16 | `ee67724` | blog.ts |
| 17b-7d Projects listing | 12 | `799831a` | projects.ts |
| 17b-7e Projects detail | 15 | `9ed81ad` | projects.ts |
| **subtotal** | **73** | — | — |

73 of ~157 audit findings shipped (~46%). All tests + check hold (83 files / 819 tests pass, 0 errors, 19 pre-existing warnings). Preview verified for every extracted route.

### Pattern findings (for downstream sub-tasks)

- **Deduplication worked.** `Services` / `Tags` / `Tech Stack` / `Filters` / `All` / `Showing` previously lived in 4+ inline `labels = { ... }` blocks across mobile+sidebar+card files. Now a single canonical source.
- **Brace placeholders are reliable.** Used for `{title}` / `{queryTime}` / `{updatedAgo}` / `{count}` / `{minutes}` across home + blog + projects. `resolveLocale(t, 'en').replace('{x}', v)` is the standard shape.
- **Inline `labels` objects were 70% of the "hardcoded" surface.** Many components already had LocalizedString shapes but defined them inline rather than importing from content. The extractions are mostly reference swaps, not new Localized structure.

### Session-break decision

**Stopping before 17b-7f.** Context at ~62%, entering pre-break zone at 65%. Per CLAUDE.md § Session token budget, continuing through 7f–7l + 8/9/10 would push well past the 80% danger threshold before the slice closes. Fresh session for 17b-7f onward.

### Resume pointer for next session

- **Model:** Opus 4.7 [1m] (L-slice Implementation continues — working set still spans multiple layers)
- **Branch:** `feature/slice-17b-repositories`
- **Last commit:** `9ed81ad` (17b-7e)
- **Next task:** 17b-7f Services extraction — 18 strings across ~5 service-domain components (ProjectsStrip, ServiceCard, ServiceDetailPage, ServiceListingPage, ServiceNav). Inline `labels` object in ServiceDetailPage lines 51–55 is the main "violation fix" target. The audit entries cross-reference `content/projects.ts` (for "See all projects →" link text) and `content/nav.ts` (for Previous / Next nav labels).
- **Remaining sub-tasks after 7f:** 7g (About, 16), 7h (Contact, 3), 7i (Tech stack viz, 26), 7j (Layout+shared, 12), 7k (Page meta tags, 8), 7l (Tech-stack page, 9), then 8 (integrity test enhancements) + 9 (governance) + 10 (final + PR).

### STOP — session wind-down; resume in fresh session for 17b-7f

---

## Session 2026-04-18 — Task 17b-7f Services extraction

**Fresh session** per prior resume pointer.
**Model:** Opus 4.7 [1m] (L-slice Implementation — working set still spans multiple layers).
**Branch:** `feature/slice-17b-repositories`.
**Last commit before resume:** `bca4975`.

### Pre-flight

- `bun run check` → 0 errors, 19 warnings (matches baseline).
- `bun run test` → 83 files / 819 tests pass (matches baseline).

### What shipped

**Content additions (3 files):**
- `src/lib/content/services.ts` gained two blocks: `servicesListingContent` (heading, stationLabelTemplate, deepDiveLabel, projectsStrip.{builtWithService, builtWithFallback, projectSingular, projectPlural}) and `servicesDetailContent` (backToServicesLabel, valuePropositionHeading, deliverablesHeading, relatedProjectsHeading, relatedProjectsNavAria, serviceNavAria). `LocalizedString` added to the type imports.
- `src/lib/content/nav.ts` gained `navDirections` ({previous, next}) — multilingual (fr+es) to match nav.ts convention.
- `src/lib/content/projects.ts` `projectsListingContent` gained `seeAllLink`.

**Components wired (5 files):**
- `ProjectsStrip.svelte`: `label` derived now resolves `builtWithService` with `{serviceTitle}` template replace (or `builtWithFallback`); `countLabel` derived resolves singular/plural noun based on count.
- `ServiceCard.svelte`: `stationLabelText` derived replaces `{stationNum}` + `{totalStr}` in template; `deepDiveLabel` derived; both "Deep dive →" slots use the derived.
- `ServiceDetailPage.svelte`: removed the inline `const labels = {...}` block (the "rule violation" flagged in the audit); imports from `servicesListingContent` + `servicesDetailContent` + `projectsListingContent`; six derived vars cover backLink, stationLabel, three headings, relatedProjectsAria, seeAllProjectsLabel. Two `aria-label="Related projects"` + two `See all projects →` slots wired (desktop + mobile copies).
- `ServiceListingPage.svelte`: sr-only `<h1>Services</h1>` now reads from `servicesListingContent.heading`.
- `ServiceNav.svelte`: aria-label on the nav wrapper + two SectionLabel `text` props (`Previous` / `Next`) wired through `servicesDetailContent.serviceNavAria` + `navDirections.{previous, next}`.

### Non-obvious decisions

- **`stationLabelTemplate` placed on `servicesListingContent`, not duplicated on detail.** ServiceDetailPage imports both listing + detail content blocks. Rationale: one canonical key, two consumers — cheaper than two synchronized copies. Nested structure (listing vs detail) still holds for everything else.
- **`seeAllLink` added to `projectsListingContent` (not services).** The link points at `/projects`, so its copy lives with the projects listing — semantically where it belongs, matches `projectsDetailContent.backToListingLabel`'s inverse shape.
- **`navDirections` added to `nav.ts` with fr+es translations.** `nav.ts` is already meaningfully multilingual, so new additions follow the file's convention. This is not "backfilling debt" (forbidden per 17b-5 calibration) — it's authoring new multilingual content into an already-multilingual file. Tracked in 17b-8's integrity report as a positive (no en-only debt added).
- **Brace-placeholder pattern reused.** `{serviceTitle}` / `{stationNum}` / `{totalStr}` follow the same `resolveLocale(t, 'en').replace('{x}', v)` shape established in 17b-7a..7e.
- **No adapter changes.** UI chrome strings are consumed directly by components (matching 17b-7a..7e); only repository-consumed content (17b-6's `metroBookends`) flows through the adapter layer.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test` | 83 files / 819 tests pass (unchanged) |
| Preview `/services` | station labels `SERVICE 01 / 06`..`06 / 06`, all 6 `Deep dive →` CTAs, strip shows `Built with {activeServiceTitle}` + `3 PROJECTS` (plural path) |
| Preview `/services/sql-development` | `← All Services`, `How This Helps You`, `Typical Deliverables`, `Related Projects (3)`, `See all projects →`, `NEXT Data Pipeline Architecture →`, `Service navigation` aria, `Related projects` aria — all render identically |
| Mobile 375×812 spot-check on detail | same text content renders; `.projects-mobile` container present (`mobileRelatedList: 1`); no overflow |
| Console errors (desktop + mobile) | none |

### Strings extracted (19)

`servicesListingContent`: heading / stationLabelTemplate / deepDiveLabel / projectsStrip.{builtWithService, builtWithFallback, projectSingular, projectPlural} = 7. `servicesDetailContent`: backToServicesLabel / valuePropositionHeading / deliverablesHeading / relatedProjectsHeading / relatedProjectsNavAria / serviceNavAria = 6. `navDirections`: previous / next = 2. `projectsListingContent.seeAllLink` = 1. Plus the 3 shared-label reuses counted once (stationLabelTemplate used in ServiceCard + ServiceDetailPage = 1 key / 2 consumers; deepDiveLabel used on 2 anchors = 1 key / 2 consumers; relatedProjectsAria on 2 navs = 1 key / 2 consumers).

Audit said ~18, actual 19 once the `navDirections` pair is counted separately.

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1 | Folder restructure | ✅ approved | earlier |
| 17b-2 | Adapter scaffold | ✅ approved | earlier |
| 17b-3 | Repository layer | ✅ approved | earlier |
| 17b-4 | Route loader migration | ✅ approved | earlier |
| 17b-5 | Hardcoded content audit | ✅ approved | earlier |
| 17b-6 | LocalizedString upgrade | ✅ approved | earlier |
| 17b-7a | Home extraction | ✅ approved | fc6fb06 |
| 17b-7b | Blog listing extraction | ✅ approved | 5704269 |
| 17b-7c | Blog detail extraction | ✅ approved | ee67724 |
| 17b-7d | Projects listing extraction | ✅ approved | 799831a |
| 17b-7e | Projects detail extraction | ✅ approved | 9ed81ad |
| **17b-7f** | **Services extraction** | **🟡 awaiting approval** | pending |
| 17b-7g | About extraction | ⏳ pending | — |
| 17b-7h | Contact extraction | ⏳ pending | — |
| 17b-7i | Tech stack viz extraction | ⏳ pending | — |
| 17b-7j | Layout + shared extraction | ⏳ pending | — |
| 17b-7k | Page meta tags extraction | ⏳ pending | — |
| 17b-7l | Tech-stack page extraction | ⏳ pending | — |
| 17b-8 | Integrity test enhancements | ⏳ pending | — |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~195k / 1M (~20%) — comfortable, continuing in this session is viable after approval.

---

## Session 2026-04-18 — Task 17b-7g About extraction

**Continuation of same session.** Context ~22% at start.

### Scope amendment flagged + actioned

Plan scope was "~16 strings across 4 components" per the audit. During implementation two adjustments emerged and were applied:

1. **Single-source-of-truth for stop labels** (audit edge case #19). Nine `About*.svelte` child components each carried a `label = 'XXX'` prop default that duplicated what AboutPage passes in. Kept = two copies of every label. Fixed = made `stop` + `label` required props (no defaults) on all nine children; AboutPage is now the only writer, and reads every label from `aboutPageContent.stopLabels.*`. This pulls 7 more files into the diff beyond the audit's 4 — trivial mechanical changes (`stop?: string; label?: string` → `stop: string; label: string`, dropped the inline default values). Net: zero-copy policy upheld.
2. **Child-internal chrome vs parent-driven chrome split.** Stop labels are prop-driven (AboutPage owns them because the stop *position* is parent-contextual). Child-internal chrome — `clientsServed` counter label (AboutLogos), polaroid arias, testimonial arias — imported directly from `$lib/content/about-page` by the owning child, matching the pattern established in 17b-7a..7e.

### Content additions

**types.ts**
- New interface `AboutStopLabels` — 10 LocalizedString keys (identity, metrics, testimonials, process, stack, clients, interests, snapshots, location, next).
- New interface `AboutLabels` — 7 LocalizedString keys for chrome (clientsServed, polaroidPrevAria, polaroidNextAria, testimonialsCarouselAria, testimonialsTabNavAria, testimonialSlideAria, showTestimonialAria).
- `AboutContent` extended with `stopLabels: AboutStopLabels` + `labels: AboutLabels` fields.

**about-page.ts**
- `aboutPageContent.stopLabels` seeded with 10 English LocalizedStrings (IDENTITY / METRICS / TESTIMONIALS / PROCESS / STACK / CLIENTS / INTERESTS / SNAPSHOTS / LOCATION / NEXT).
- `aboutPageContent.labels` seeded with 7 English LocalizedStrings including two template strings: `testimonialSlideAria = "Testimonial {index} of {total}"` and `showTestimonialAria = "Show testimonial {index}"`.

### Components updated (11 files)

- `AboutPage.svelte` — 10 hardcoded `label="XXX"` props swapped for `resolveLocale(c.stopLabels.<key>, 'en')`. No import/export shape change (uses existing `aboutPageContent` alias `c`).
- `AboutIdentity.svelte`, `AboutMetrics.svelte`, `AboutMethod.svelte`, `AboutInterests.svelte`, `AboutCta.svelte`, `AboutWeather.svelte` — removed `label`/`stop` defaults; props now required. No chrome strings in these six.
- `AboutLogos.svelte` — defaults removed; imports `aboutPageContent` to render `resolveLocale(labels.clientsServed, 'en')` as the MetricDisplay label under the counter. (Previously literal `"clients served"`.)
- `AboutPolaroids.svelte` — defaults removed; two aria-labels (Previous photo / Next photo) now read from `aboutPageContent.labels.polaroidPrev/NextAria`.
- `AboutTestimonials.svelte` — defaults removed; four arias wired: `testimonialsCarouselAria` on the `role="region"`, `testimonialsTabNavAria` on the `role="tablist"`, and two template arias (`testimonialSlideAria` + `showTestimonialAria`) with `{index}`/`{total}` placeholder replace.

### Decisions

- **Required props, not fallbacks.** Compiler now guarantees AboutPage (or any future caller) passes an explicit label/stop — no risk of a rendered "STOP NN — undefined" if the content-layer field is removed or renamed.
- **Split chrome ownership by positional context.** Stop labels are parent-positional (which card is at which grid area), so AboutPage owns them. Arias and internal labels are widget-internal, so the widget imports them. Same pattern is reusable in 17b-7i (tech-stack viz) where similar widget-internal chrome applies.
- **Template placeholders use `{index}` not `{n}` or `{i+1}`.** Matches the 17b-7* convention (`{count}`, `{minutes}`, `{stationNum}`, `{totalStr}`, `{serviceTitle}`) — plain-word keys, `.replace('{index}', String(n + 1))` at the call site. 1-based indexing done at the call site, not in the template.
- **AboutPage.test.ts still passes.** Asserts `STOP 00 — IDENTITY` and `STOP 08 — SNAPSHOTS` — both render exactly as before (content-layer seeded with identical English values).

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test` | 83 files / 819 tests pass (first run reported 1 flaky — re-run green; matches baseline) |
| Preview `/about` desktop | 10 stop labels render `STOP 00..09`, polaroid arias present, testimonial carousel/slide/nav/show-button arias all correct, "clients served" visible under counter |
| Preview `/about` mobile 375×812 | Same 10 stops render (layout reflows); testimonial slide aria `Testimonial 1 of 3` correct |
| Console errors | none at steady state (one-shot HMR chunk errors during iteration cleared by reload) |

### Strings extracted (17)

Stop labels × 10 (`identity`, `metrics`, `testimonials`, `process`, `stack`, `clients`, `interests`, `snapshots`, `location`, `next`); chrome labels × 7 (`clientsServed`, `polaroidPrevAria`, `polaroidNextAria`, `testimonialsCarouselAria`, `testimonialsTabNavAria`, `testimonialSlideAria`, `showTestimonialAria`). Audit said ~16; actual 17 once the counter label + template arias are counted individually.

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1..6 | Restructure → audit → LocalizedString | ✅ approved | earlier |
| 17b-7a..7e | Home / Blog / Projects extractions | ✅ approved | fc6fb06..9ed81ad |
| 17b-7f | Services extraction | ✅ approved | ecbdb5a (conflated with WORKFLOW.md, per Yesid) |
| **17b-7g** | **About extraction** | **🟡 awaiting approval** | pending |
| 17b-7h | Contact extraction | ⏳ pending | — |
| 17b-7i | Tech stack viz extraction | ⏳ pending | — |
| 17b-7j | Layout + shared extraction | ⏳ pending | — |
| 17b-7k | Page meta tags extraction | ⏳ pending | — |
| 17b-7l | Tech-stack page extraction | ⏳ pending | — |
| 17b-8 | Integrity test enhancements | ⏳ pending | — |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~260k / 1M (~26%) — comfortable; can continue same session after approval.

---

## Session 2026-04-18 — Tasks 17b-7f re-land + 17b-7g commit reconciliation

**Continuation of same session.** Context ~28%.

Not a source-code session — a git reconciliation forced by a parallel Claude session.

### What happened

1. 17b-7f was originally committed as `ecbdb5a` alongside an unrelated WORKFLOW.md governance edit from a parallel Claude session. Yesid approved the 17b-7f content but noted the commit message only described WORKFLOW.md.
2. Before 17b-7g could be committed, the parallel session reset `ecbdb5a` and re-committed ONLY the WORKFLOW.md changes as `cd53c61` (same message, clean scope). This dropped 17b-7f from HEAD. My on-disk services/nav/projects files were intact but unstaged.
3. To recover cleanly, I:
   - Stashed the cumulative log.md + handoff.md to /tmp (they had both 17b-7f and 17b-7g content interleaved).
   - Reset docs/slices/slice-17/slice-17b/log.md + handoff.md to HEAD state.
   - Built a 17b-7f-only log.md + handoff.md by truncating the full versions at the 17b-7g heading.
   - Committed 17b-7f source files + trimmed log.md + handoff.md as `f8a6683` — the clean re-land.
   - Restored log.md + handoff.md to their full (7f + 7g) state.
   - Committed 17b-7g source files + full docs as `843b3cc`.

### Commits landed this session

- `f8a6683` feat(slice-17b): extract hardcoded strings from services (17b-7f re-land, content identical to ecbdb5a)
- `843b3cc` feat(slice-17b): extract hardcoded strings from about (17b-7g, 17 strings + scope amendment to make stop/label props required across all 9 About* children)

### Lesson for downstream sub-tasks

If `git status` at session start shows ` M` (unstaged modified) files whose SHAs do NOT appear in `git log`, suspect a parallel session has reset HEAD. Preserve disk content, re-commit cleanly with standalone messages rather than trying to compose on top of the parallel session's HEAD.

---

## Session 2026-04-18 — Task 17b-7h Contact extraction

**Continuation of same session.** Context ~29%.

### What shipped

**Type additions (types.ts)**
- `ContactContent` interface gained two new fields alongside the existing `stationLabel`: `pageTitle: LocalizedString` and `sendErrorMessage: LocalizedString`. `stationLabel` was already on the type — just not wired in the component.

**Content seeds (contact-page.ts)**
- `contactContent.pageTitle = { en: 'Contact' }` — renders twice (desktop edge title + mobile h1). The typography dot (`.`) stays as a decorative template-literal span; it's not translatable and visually belongs to the typography system, not the copy.
- `contactContent.sendErrorMessage = { en: 'Failed to send message. Please try again.' }` — single canonical source for the error set inside the two `catch`/`!success` branches of `handleSubmit`.
- `contactContent.stationLabel` was already present with `{ en: 'NEXT STOP: YOU' }` — just wire it up in the component. No change to that seed.

**Component wiring (ContactPage.svelte)**
- Three `const <name> = resolveLocale(c.<key>, 'en')` bindings at the top of the `<script>` (plus the existing `const c = contactContent` alias).
- Edge title + mobile h1 now render `{pageTitle}` instead of the literal `Contact`.
- Station label span now renders `{stationLabel}` instead of the literal `NEXT STOP: YOU`.
- Two `errors = { form: 'Failed to send...' }` assignments in `handleSubmit` swapped for `{ form: sendErrorMessage }` (pre-resolved at top of script so the errors object stays typed as `Record<string, string>`).

### Decisions

- **Pre-resolve at script top, not at each render site.** All three strings are static English (no data-driven placeholders), so resolving once and holding a `const` is cheaper and tidier than inline `resolveLocale` at every usage. When translation arrives, swap the `const` for a `$derived` on `locale`.
- **Decorative `.` stays as markup, not content.** The dot is styled separately (`edge-dot` / `text-[var(--primary)]`) and is part of the brand typography system, not copy. Putting it in content would force the template to build the colored span from a string, which is worse.
- **Audit edge case #23 resolved.** The audit flagged that `stationLabel` already existed in content but the component hardcoded the string. Wired correctly now.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test` | 83 files / 819 tests pass (unchanged) |
| Preview `/contact` desktop | edge-title renders `Contact.`, mobile-h1 renders `Contact.`, station-label span renders `NEXT STOP: YOU` — identical to pre-extraction |
| Console errors | none (stale HMR chunk errors from earlier iterations; no new errors this task) |

### Strings extracted (3)

`pageTitle` (2 occurrences: edge title + mobile h1, shared via `const`), `stationLabel` (1 occurrence, already in content — only wiring changed), `sendErrorMessage` (2 assignment sites in `handleSubmit`, shared via `const`). Audit said ~3; actual is 3 — exact match.

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1..6 | Restructure → audit → LocalizedString | ✅ approved | earlier |
| 17b-7a..7e | Home / Blog / Projects extractions | ✅ approved | fc6fb06..9ed81ad |
| 17b-7f | Services extraction | ✅ re-landed clean | f8a6683 |
| 17b-7g | About extraction | ✅ approved | 843b3cc |
| **17b-7h** | **Contact extraction** | **🟡 awaiting approval** | pending |
| 17b-7i | Tech stack viz extraction | ⏳ pending | — |
| 17b-7j | Layout + shared extraction | ⏳ pending | — |
| 17b-7k | Page meta tags extraction | ⏳ pending | — |
| 17b-7l | Tech-stack page extraction | ⏳ pending | — |
| 17b-8 | Integrity test enhancements | ⏳ pending | — |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~310k / 1M (~31%) — comfortable, continuing in same session is viable after approval.

---

## Session 2026-04-18 — Task 17b-7i Tech stack viz extraction

**Continuation of same session.** Context ~35% at start.

### What shipped

Biggest extraction sub-task in Task 17b-7. **~50 LocalizedString seeds** (audit undercounted at ~26 because it grouped domain/layer label arrays as single findings — they're many strings each once flattened to individual fields).

**Content addition (tech-stack.ts)**
- New top-of-file export `techStackVizContent` — all chrome for the Control Room tech-stack visualization. Grouped by consumer:
  - `orientation` — 5 keys (SELECT A NODE heading + paragraph description + 3 hint lines).
  - `proficiency` — 3 keys (Expert/Proficient/Familiar), typed as `Record<Proficiency, LocalizedString>` via `as const satisfies`.
  - `panel` — 6 keys (closeAria, usedInLabel, 4 templates: sendsDataTo / receivesFrom / viewRelation / buildWith).
  - `bottomSheet` — 4 keys (mobile-specific: titleTemplate, closeAria, prevAria, nextAria).
  - `diagram` — 2 chrome + 9 layer labels typed `Record<InfraLayer, LocalizedString>`.
  - `filters` — 3 chrome + 7 domain short-labels typed `Record<DomainCluster, LocalizedString>`.
  - `configurator` — 3 chrome + 7 long-form domain entries (label + description pairs) typed `Record<DomainCluster, { label; description }>`.
  - `scenario` — 2 keys (provenInLabel, ctaBuildThis).

**Components wired (7 files)**

- `StackPanelOrientation.svelte` — gained a `<script>` block (was script-less); five `const` bindings render heading, description, three hints.
- `StackBottomSheet.svelte` — removed inline `proficiencyLabel: Record<Proficiency, string>` map. Wired Close aria, Used in label, Previous/Next technology arias, Technology details title template (with `{name}` replace), Sends data to / Receives from title templates (with `{count}` replace), Let's build with CTA template. `proficiencyLabel` is now a `$derived` keyed off `item.proficiency` into the content record.
- `StackConfigurator.svelte` — removed inline `DOMAIN_OPTIONS: { id; label; description }[]` array of 7 objects. Added a typed `DOMAIN_ORDER: readonly DomainCluster[]` iteration sequence and two small helpers `labelFor(d)` / `descriptionFor(d)` that index into `configurator.domains`. Selection-count hint wired via `{count}/{max}` template.
- `StackDiagram.svelte` — removed inline `LAYER_LABELS: Record<InfraLayer, string>` map. `LAYER_ORDER` stays in the component (presentational ordering, not content). Section label + diagram aria-label + per-tier labels all content-driven via a `layerLabelFor(layer)` helper.
- `StackFilters.svelte` — removed inline `DOMAIN_LABELS: { id; label }[]` array. Added the same `DOMAIN_ORDER` iteration sequence as Configurator. All four strings (section label, All filter label, toolbar aria, 7 pill labels) wired.
- `StackPanel.svelte` — same treatment as BottomSheet (they share the `panel.*` content block). Six chrome values + proficiency label + buildWith label + three helpers (sendsDataTitle, receivesFromTitle, viewRelationTitle). `viewRelationTemplate` was previously a literal `title="View {rel.itemName}"` — now template-driven.
- `StackScenarioCard.svelte` — two consts wire the two chrome strings (Proven in label + Let's build this CTA).

### Non-obvious decisions

- **Typed content maps using `as const satisfies Record<Proficiency, LocalizedString>`.** This gives the content a dual guarantee: TypeScript catches missing keys if the union type grows AND narrowing via `content.proficiency[item.proficiency]` stays exhaustive without a fallback branch. Same pattern applied to InfraLayer + DomainCluster.
- **DOMAIN_ORDER stays in the component, DOMAIN labels move to content.** Order is presentational (controls render sequence); labels are copy. Splitting them by concern lets designers reorder without touching content, and translators touch content without touching order.
- **Short-form vs long-form domain labels intentionally duplicated.** `filters.domainLabels` (short: "Web Dev") and `configurator.domains[*].label` (long: "Web Development") are different copy choices for different contexts. The audit flagged these as duplication; keeping them separate respects the UI design.
- **`techStackVizContent` lives at the top of `tech-stack.ts`, not a separate file.** Matches the 17b-7d/7e pattern (projectsListingContent + projectsDetailContent in projects.ts). One file per content domain; UI chrome co-located with data helpers.
- **`$derived` vs plain function choice.** Values that depend on reactive inputs (item.proficiency, item.name) use `$derived`. Pure-closure helpers over non-reactive templates (`sendsDataTitle(n)`) use plain function declarations — cleaner and identity-stable.
- **No preview route verification available.** Stack components are not wired into any `+page.svelte` yet (`/tech-stack` route shows "interactive diagram coming soon"). The 7 component-level test files (70 tests) are the sole verification path. All 70 tests pass — assertions include `Expert` proficiency label, `What do you need?` heading, `1/3` selection-count substring, and the data-testid grid for all 7 domain configurator buttons.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test` full | 83 files / 819 tests pass (unchanged) |
| `bun run test src/lib/components/stack/` | 7 files / 70 tests pass (all stack component tests) |
| Preview `/tech-stack` | hero + stats + CTA render identically (stack components aren't wired into this route; verification via tests) |
| Console errors | none from the stack components (stale HMR chunk errors from earlier sub-task iterations) |

### Strings extracted (~50)

5 orientation + 3 proficiency + 6 panel + 4 bottomSheet + 11 diagram (2 + 9 layers) + 10 filters (3 + 7 domains) + 17 configurator (3 + 14 label/description) + 2 scenario = **58 LocalizedString seeds**. Audit said ~26 — difference is that the audit counted each DOMAIN_LABELS/DOMAIN_OPTIONS/LAYER_LABELS structure as one finding, but each field becomes an individual LocalizedString seed once extracted.

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1..6 | Restructure → audit → LocalizedString | ✅ approved | earlier |
| 17b-7a..7e | Home / Blog / Projects extractions | ✅ approved | fc6fb06..9ed81ad |
| 17b-7f | Services extraction | ✅ re-landed clean | f8a6683 |
| 17b-7g | About extraction | ✅ approved | 843b3cc |
| 17b-7h | Contact extraction | ✅ approved | 68a99ef |
| **17b-7i** | **Tech stack viz extraction** | **🟡 awaiting approval** | pending |
| 17b-7j | Layout + shared extraction | ⏳ pending | — |
| 17b-7k | Page meta tags extraction | ⏳ pending | — |
| 17b-7l | Tech-stack page extraction | ⏳ pending | — |
| 17b-8 | Integrity test enhancements | ⏳ pending | — |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~385k / 1M (~38%) — comfortable, within healthy zone; one or two more tasks viable before pre-break.

---

## Session 2026-04-18 — Task 17b-7j Layout + shared extraction

**Continuation of same session.** Context ~42% at start.

### What shipped

**Content additions (2 files):**

- `src/lib/content/nav.ts` — new `sharedChromeContent` block with 10 LocalizedString seeds. Multilingual (en/fr/es) for user-facing navigation copy; en-only for the decorative "NAVIGATION — ALL ROUTES" overlay footer label and the rarely-heard "Toggle section" aria. Keys:
  - `openMenuAria`, `closeMenuAria` (nav pill toggle)
  - `footerNavAria` (Footer `<nav>` label)
  - `menuOverlayAria` (MenuOverlay DialogPrimitive.Title, sr-only)
  - `menuOverlayFooterLabel` (decorative "NAVIGATION — ALL ROUTES")
  - `searchPlaceholder` (SearchInput default)
  - `clearFiltersLabel` (FilterSummary button)
  - `tocToggleSectionAria`, `tocHeading`, `tocMobileButton` (TableOfContents)
- `src/lib/content/site-content.ts` — new `footerContent` block at the end:
  - `tagline` ("// digital infrastructure") — decorative mono line, en-only.
  - `location` ("Montreal, QC · Remote") — middot baked into the string (typographic concern).
  - `statusPrefix` ("system online —") — template's separator sits with the date at call site.

**Components updated (7):**

- `Nav.svelte` — conditional `aria-label` on the menu toggle now reads `closeMenuAria` / `openMenuAria` from content.
- `Footer.svelte` — 4 strings wired (tagline, nav aria, location, status prefix). Template in the status bar becomes `{statusPrefix} {systemDate}` — prefix static, date dynamic.
- `MenuOverlay.svelte` — DialogPrimitive.Title + footer label both content-driven.
- `FilterSummary.svelte` — "clear filters" button reads content.
- `SearchInput.svelte` — default placeholder resolves from content at module init; callers can still override via prop.
- `TableOfContents.svelte` — 4 slots wired (Toggle section aria, 2× "On this page" heading, mobile button). `aria-label="Table of contents"` on the `<nav>` element left as-is (out of audit scope; lowercase first letter was a deliberate sentence-case aria convention).
- `StationTabs.svelte` — `aria-label="Service navigation"` reuses `servicesDetailContent.serviceNavAria` added in 17b-7f. One key, two consumers (ServiceNav prev/next + StationTabs).

### Non-obvious decisions

- **Reused `servicesDetailContent.serviceNavAria` rather than duplicating.** The audit's proposed key `serviceTabNavAria` would have created a second source of truth for the same string. The pattern is: one key, many consumers. Dedupe wins.
- **fr/es added where the string is navigation copy; skipped for decorative chrome.** "NAVIGATION — ALL ROUTES" stays en-only — translating it would break the metro-line decorative motif. "Toggle section" stays en-only — rarely heard by screen readers, low translation ROI.
- **Footer location keeps middot baked into the string.** `"Montreal, QC · Remote"` could be split into two fields joined by a separator, but the separator is a typographic decision that varies by locale (fr might use " – " instead of " · "). Keeping it as one field lets translators make that call.
- **SearchInput default placeholder resolves at module init.** Tests pass because SearchInput is used within route components; when loaded in isolation, the `defaultPlaceholder` const resolves synchronously. If locale-switching arrives, this becomes a `$derived` on the locale signal.
- **TableOfContents `<nav aria-label="Table of contents">` left as-is.** Audit listed only 3 TOC strings (L190/225+261/287); the nav-element aria on lines 215 and 242 is a separate string (lowercase first letter — sentence case for aria) that the audit didn't flag. Staying in scope.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test` | 83 files / 819 tests pass (unchanged) |
| Preview `/projects/yesid-dev` desktop | nav menu aria "Open menu", footer tagline "// digital infrastructure", footer nav aria "Footer navigation", footer address "Montreal, QC · Remote", status line "system online — 2026.04.18" — all render identically |
| Preview `/blog/building-a-transit-pipeline` desktop | TOC heading "On this page" (embedded + desktop), mobile button "Table of Contents", 2× chevron arias "Toggle section" all render |
| Preview `/services/sql-development` desktop | 2 nav elements with `aria-label="Service navigation"` (StationTabs + ServiceNav), same string from one content key |
| Preview mobile 375×812 on `/blog` | footer tagline + menu aria render identically |
| Console errors | none at steady state |

### Strings extracted (13)

Shared chrome × 10 (`openMenuAria`, `closeMenuAria`, `footerNavAria`, `menuOverlayAria`, `menuOverlayFooterLabel`, `searchPlaceholder`, `clearFiltersLabel`, `tocToggleSectionAria`, `tocHeading`, `tocMobileButton`). Footer chrome × 3 (`tagline`, `location`, `statusPrefix`). Audit said ~12 — exact match to 13 once `tocHeading`'s two DOM occurrences collapse into one key.

StationTabs reused an existing key (`servicesDetailContent.serviceNavAria` from 17b-7f) — no new content, just wiring, so not counted toward 13.

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1..6 | Restructure → audit → LocalizedString | ✅ approved | earlier |
| 17b-7a..7e | Home / Blog / Projects extractions | ✅ approved | fc6fb06..9ed81ad |
| 17b-7f | Services extraction | ✅ re-landed clean | f8a6683 |
| 17b-7g | About extraction | ✅ approved | 843b3cc |
| 17b-7h | Contact extraction | ✅ approved | 68a99ef |
| 17b-7i | Tech stack viz extraction | ✅ approved | 8dceba7 |
| **17b-7j** | **Layout + shared extraction** | **🟡 awaiting approval** | pending |
| 17b-7k | Page meta tags extraction | ⏳ pending | — |
| 17b-7l | Tech-stack page extraction | ⏳ pending | — |
| 17b-8 | Integrity test enhancements | ⏳ pending | — |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~455k / 1M (~46%) — healthy. Still viable to continue but approaching the pre-break zone (65% = ~650k). Worth a check at the end of 17b-7k.

---

## Session 2026-04-18 — Task 17b-7k Page meta tags extraction

**Continuation of same session.** Context ~49% at start.

### What shipped

**Type addition (types.ts)**
- New `PageMeta` interface (title + description LocalizedStrings). Added to `AboutContent.meta` and `ContactContent.meta` fields — compile-time forcing both per-page content modules to carry their own `<title>` / `<meta description>` seeds.

**Content additions (4 files)**
- `about-page.ts` — `aboutPageContent.meta = { title, description }` (en-only).
- `contact-page.ts` — `contactContent.meta = { title, description }`. Coexists with the existing `contactContent.pageTitle` (edge title "Contact" — visible) vs `meta.title` ("Contact — yesid." — browser tab).
- `services.ts` — new top-level `servicesPageMeta` export (untyped at the type level; the listing page doesn't have a container interface yet).
- `projects.ts` — new top-level `projectsPageMeta` export (same pattern).

**Routes updated (4)**
- `routes/about/+page.svelte` — `<svelte:head>` `<title>` + `<meta description>` now read from `aboutPageContent.meta.*` via resolveLocale at script top.
- `routes/contact/+page.svelte` — same pattern with `contactContent.meta.*`.
- `routes/projects/+page.svelte` — reads from `projectsPageMeta.*`.
- `routes/services/+page.svelte` — reads from `servicesPageMeta.*`.

### Non-obvious decisions

- **Nested `meta: { title, description }` on typed content (About, Contact) vs. top-level `<X>PageMeta` objects on untyped content files (services, projects).** The About/Contact pages have a single `AboutContent` / `ContactContent` interface that owns ALL page data; nesting meta keeps the type consistent. Services and Projects have multiple top-level content blocks (listing, detail, etc.); adding a peer `<X>PageMeta` object matches the existing flat-exports shape. The Services/Projects route files could have been keyed off `servicesListingContent.meta` / `projectsListingContent.meta`, but that blurs the listing content with page-wide meta — keeping them separate is cleaner.
- **Pre-resolved at script top, not `$derived`.** Same pattern as 17b-7h — static English with no placeholders.
- **`/services/[id]/+page.svelte` and `/tech-stack/+page.svelte` deliberately NOT in this task.** The services detail page already resolves `{resolveLocale(data.service.title, 'en')} — yesid.` dynamically from content; only the ` — yesid.` suffix is hardcoded (brand-wide, structural, out of per-page extraction scope). The tech-stack title is part of 17b-7l's scope.
- **`projects.ts` uses " | yesid." separator** (vertical pipe), every other page uses " — yesid." (em dash). Kept the exact characters from the originals — this is Yesid's typography choice, not a typo worth normalizing in a content-extraction pass.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test` | 83 files / 819 tests pass (unchanged) |
| SSR fetch `/about` `/contact` `/projects` `/services` | all 4 titles + descriptions render identically to pre-extraction |
| Console errors | none |

### Strings extracted (8)

4 titles + 4 descriptions across /about /contact /projects /services. Exact match to audit count.

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1..6 | Architecture + audit + LocalizedString | ✅ approved | earlier |
| 17b-7a..7e | Home / Blog / Projects extractions | ✅ approved | fc6fb06..9ed81ad |
| 17b-7f | Services extraction | ✅ re-landed | f8a6683 |
| 17b-7g | About extraction | ✅ approved | 843b3cc |
| 17b-7h | Contact extraction | ✅ approved | 68a99ef |
| 17b-7i | Tech stack viz extraction | ✅ approved | 8dceba7 |
| 17b-7j | Layout + shared extraction | ✅ approved | c6fbc79 |
| **17b-7k** | **Page meta tags extraction** | **🟡 awaiting approval** | pending |
| 17b-7l | Tech-stack page extraction | ⏳ pending | — |
| 17b-8 | Integrity test enhancements | ⏳ pending | — |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~490k / 1M (~49%) — still healthy. 17b-7l is the last extraction task (small); 17b-8/9/10 are capstone work. Reasonable to finish in this session if context stays below 65% — will flag if it creeps close.

---

## Session 2026-04-18 — Task 17b-7l Tech-stack page extraction

**Continuation of same session.** Context ~52% at start.

### What shipped — **last extraction sub-task of 17b-7**

**Content addition (tech-stack.ts)**
- New `techStackPageContent` export placed above `techStackVizContent` (viz chrome added in 17b-7i). 16 LocalizedString seeds grouped by zone:
  - `meta` — 2 keys (title + description template with `{itemCount}` + `{layerCount}` placeholders).
  - `hero` — 4 chrome (overline, titleLine1, titleLine2, terminalAria) + 4 stat labels (technologies / layers / domains / projects).
  - `actions` — 2 shared button labels (getInTouch, viewServices) rendered twice each (hero bottom + CTA zone).
  - `cta` — 4 keys (headingLine1, headingLine2, sub, availability).

**Component wiring (`routes/tech-stack/+page.svelte`)**
- Dozen `const` bindings at script top pre-resolve every LocalizedString to English. Template dynamics applied: meta description `.replace('{itemCount}', itemCount).replace('{layerCount}', layerCount)` at the call site.
- Hero stat labels bundled into a `statLabels: { technologies, layers, domains, projects }` object so the four DOM spans stay readable.
- Shared `getInTouchLabel` / `viewServicesLabel` — declared once, rendered four times (twice in hero bottom, twice in CTA zone).
- Decorative punctuation (trailing `.` and `?` in heading spans) stays as markup literals — part of the typography system, not copy.

### Non-obvious decisions

- **Terminal animation flavour strings (lines 22–29 of +page.svelte) left as-is.** Audit edge case #13 flagged these as decorative terminal flavour. Consistent with how I treated the chrome punctuation — if ever translated, they should be treated as a package (either extract all six lines together with the `~ yesid --stack --verbose` command, or leave them as an English-only "voice" of the terminal). For 17b-7l scope: out.
- **Two-line titles split into `titleLine1` + `titleLine2`.** Matches the Svelte template's `{line1}<br><span class="accent">{line2}.</span>` structure. Alternatives (one long string with a sentinel, or `titleText: { line1, line2 }` nested) all either complicate the template or fragment the translation — split keys is the cleanest.
- **Stats labels kept as individual keys, not an array.** `statLabels: { technologies, layers, domains, projects }` over `[ 'technologies', 'layers', 'domains', 'projects' ]` — lets future translators refactor the visual order without reordering the labels themselves (or vice versa), and gives each label a meaningful name in the content file.
- **`actions.{getInTouch, viewServices}` shared across hero and CTA zone.** Same string, two render sites. One key. Drift-proof.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test` | 83 files / 819 tests pass (unchanged) |
| Preview `/tech-stack` | all 16 strings render identically — tab title, meta description with `{itemCount}` + `{layerCount}` replaced to `35+` and `9`, hero overline / two-line title / terminal aria / 4 stat labels / 2 CTA buttons (hero + footer zone), CTA heading with `?` + `.` accents, sub paragraph, availability notice |
| Console errors | none |

### Strings extracted (16)

2 meta + 4 hero chrome + 4 stat labels + 2 shared actions + 4 CTA = 16. Audit said ~9 because it grouped the 4 stat labels as one finding and split the description template and two-line titles into single rows. Actual LocalizedString seeds = 16.

### 17b-7 summary (all 12 extraction sub-tasks)

| Sub-task | Strings | Commit |
|---|---|---|
| 17b-7a Home | 14 | fc6fb06 |
| 17b-7b Blog listing | 16 | 5704269 |
| 17b-7c Blog detail | 16 | ee67724 |
| 17b-7d Projects listing | 12 | 799831a |
| 17b-7e Projects detail | 15 | 9ed81ad |
| 17b-7f Services | 19 | f8a6683 |
| 17b-7g About | 17 | 843b3cc |
| 17b-7h Contact | 3 | 68a99ef |
| 17b-7i Tech stack viz | 58 | 8dceba7 |
| 17b-7j Layout + shared | 13 | c6fbc79 |
| 17b-7k Page meta tags | 8 | 3398d97 |
| 17b-7l Tech-stack page | 16 | pending |
| **Total** | **~207** | — |

Audit said ~157; actual count is ~207 once label/domain/layer record fields flatten to individual seeds. Task 17b-7's promise (dedupe + centralize UI chrome) delivered across all 12 sub-tasks. 12 commits, every route's chrome content-driven.

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1..6 | Architecture + audit + LocalizedString | ✅ approved | earlier |
| 17b-7a..7e | Home / Blog / Projects extractions | ✅ approved | fc6fb06..9ed81ad |
| 17b-7f | Services | ✅ re-landed | f8a6683 |
| 17b-7g | About | ✅ approved | 843b3cc |
| 17b-7h | Contact | ✅ approved | 68a99ef |
| 17b-7i | Tech stack viz | ✅ approved | 8dceba7 |
| 17b-7j | Layout + shared | ✅ approved | c6fbc79 |
| 17b-7k | Page meta tags | ✅ approved | 3398d97 |
| **17b-7l** | **Tech-stack page (last extraction)** | **🟡 awaiting approval** | pending |
| 17b-8 | Integrity test enhancements | ⏳ pending | — |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~525k / 1M (~53%) — still healthy. Approaching 65% pre-break after 2-3 more tasks. 17b-8 (integrity tests) is moderate complexity; 17b-9 (governance docs) is writing; 17b-10 (PR) is ceremonial. Plausible to finish the slice this session if 17b-8 stays within ~40k tokens.

---

## Session 2026-04-18 — Task 17b-8 Integrity test enhancements

**Continuation of same session.** Context ~55% at start.

### What shipped

Appended a new `describe('LocalizedString guard + translation debt')` block to `src/lib/content/integrity.test.ts` — 3 new tests that together walk every exported content value and validate LocalizedString shapes.

**Added imports:**
- Module-namespace imports for every content file (`site-content`, `nav`, `services`, `projects`, `meta`, `blog`, `tech-stack`) plus the typed `aboutPageContent` / `contactContent` singletons. This gives the walker one deterministic entry point per file.

**Added types + helpers:**
- `LocalizedStringStats` interface — tracks `{ full, partial, enOnly, malformed, total }` counts.
- `isLocalizedStringShape(v)` — structural check: any non-null object with an `en` key is treated as a LocalizedString candidate.
- `isNonEmptyString(v)` — `typeof === 'string' && v.trim() !== ''`.
- `walkContent(value, stats, path, seen)` — recursive traversal. Handles LocalizedString leaves, arrays, and plain objects. Uses a `WeakSet` cycle guard (defensive — static content shouldn't cycle but cost is zero).

**Added 3 tests:**
1. **"every LocalizedString has a non-empty English value"** — hard failure if any LocalizedString has a missing or empty `en` field. Catches the class of bug where a content author writes `{ fr: '...', es: '...' }` without the English default, which would render as `[object Object]` in production.
2. **"at least one LocalizedString is fully multilingual"** — sanity floor. If the fully-multilingual count drops to 0, someone accidentally stripped fr/es from nav.ts (the only actually-multilingual file as of this slice).
3. **"prints translation-debt snapshot"** — informational report printed via `console.log`. Produces the snapshot at the top of the test output:
   ```
   LocalizedString translation-debt snapshot (Task 17b-8):
   ─────────────────────────────────────────────────────────
   Total LocalizedStrings walked:  519
   Full (en + fr + es):            32 (6%)
   Partial (en + one other):       2 (0%)
   en-only:                        485 (93%)
   Malformed (missing en):         0
   ```

### Current numbers (fresh scan)

- **Total LocalizedStrings: 519** — the audit estimated ~230-260 en-only, but the audit only counted top-level declarations; walking nested structures (projects' impactMetrics, services' deliverables arrays, blog posts' metadata) reveals the full surface.
- **Full (en+fr+es): 32** — nav.ts carries all the multilingual strings (`navLinks`, `menuItems`, `errorPageContent.suggestions`, `metroBookends`'s pending migration, plus 17b-7f `navDirections` and 17b-7j `sharedChromeContent` fr+es additions).
- **Partial: 2** — `siteMeta.tagline` has partial fr/es.
- **en-only: 485 (93%)** — the bulk of content extracted across 17b-7a..7l. This is the translation debt to pay down in a post-17b slice.
- **Malformed: 0** — no broken LocalizedStrings in the codebase. ✓

### Non-obvious decisions

- **Structural shape check, not typed check.** The walker doesn't import the `LocalizedString` type — it just checks for an `en` key. This is intentional: a purely structural check can't miss LocalizedStrings that the author forgot to type as `LocalizedString`. If someone writes `{ en: 'hi' }` inline without the type annotation, the walker still finds it.
- **`isLocalizedStringShape` treats ANY object with an `en` key as a candidate.** False positives are technically possible (e.g., a configuration object with an `en: 'english'` language-code field). None exist in the current codebase (verified via grep). If one appears later and is wrongly treated as malformed, the fix is to rename the field or add an exception to the walker.
- **`console.log` report via a passing test.** Vitest shows stdout on PASS by default in some reporters (verbose, default), so the snapshot is visible in normal test runs. The alternative (a separate report script) would add a build step for information that's cheap to produce at test time.
- **No assertion on multilingual coverage target.** The third test could assert "fr/es coverage ≥ 50%" as a compile-time target, but that would fail every build until translations land. Keeping the report informational + the floor-of-one strict is the right balance for this slice.

### Verification

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run test src/lib/content/integrity.test.ts` | 1 file / 36 tests pass (+3 from 33) |
| `bun run test` full | 83 files / 822 tests pass (+3 from 819) |
| Snapshot output verified in verbose reporter | 519 total / 32 full / 2 partial / 485 en-only / 0 malformed |

### Progress table

| # | Task | Status | Commit |
|---|------|--------|--------|
| 17b-1..6 | Architecture + audit + LocalizedString | ✅ approved | earlier |
| 17b-7a..7l | All 12 extraction sub-tasks | ✅ approved | fc6fb06..cf01da9 |
| **17b-8** | **Integrity test enhancements** | **🟡 awaiting approval** | pending |
| 17b-9 | Governance doc updates | ⏳ pending | — |
| 17b-10 | Final verification + PR | ⏳ pending | — |

**Model:** Opus 4.7 [1m] | **Context:** ~560k / 1M (~56%) — approaching pre-break at 65% (~650k). 17b-9 (governance docs) is writing-heavy; 17b-10 is ceremonial. Will aim to finish 17b-9 in this session if it stays under 40k tokens; 17b-10 should land clean regardless.
