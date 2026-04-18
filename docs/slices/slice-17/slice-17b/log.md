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

### STOP — awaiting Yesid approval for Task 17b-7
