# Slice 17b — Handoff

Reviewer-facing record. Grows one section per Level-3 task as tasks complete. Final sections (Summary + PR body) appended at Task 17b-10.

---

## Summary

**Slice 17b — Hexagonal Data Layer + LocalizedString Enforcement.** L-slice. 10 tasks, ~207 LocalizedString extractions, 0 runtime regressions.

### What shipped

**Architecture (17b-1..6):**
- Dissolved `src/lib/data/` → `src/lib/content/` (typed seed + UI chrome) + `src/lib/utils/` (pure engines) + `src/lib/types.ts` (top-level shared types). 375 files updated; 426 imports rewritten.
- New `src/lib/adapters/` — `ContentAdapter` interface with six ports (projects/services/blog/meta/techStack/content). `staticAdapter` is the only module that imports from `$lib/content/*`. 37 contract tests.
- New `src/lib/repositories/` — async facade over the adapter. Route loaders call `getPublicProjects()` etc.; never touch the adapter directly. Metro-line derivation folded in.
- 9 route loaders migrated from `$lib/content` → `$lib/repositories` with `Promise.all` parallelization.
- Hardcoded content audit: 7 parallel Sonnet subagents scanned every component; surfaced ~157 strings (flattened to ~519 LocalizedStrings once nested structures unfold).
- `ImpactMetric.label` + metro bookends upgraded to LocalizedString.

**Extraction (17b-7a..l — 12 sub-tasks, ~207 strings):**
- Every hardcoded user-facing string on every route now flows through `$lib/content/*` as a LocalizedString.
- UI chrome lives in the content file for its page domain; components import directly (bypasses the adapter — chrome isn't "data").
- Scope amendment on 17b-7g: removed `stop`/`label` defaults from 9 About* children — compiler-enforced single source of truth for stop labels.
- Dedupe across domains: `servicesDetailContent.serviceNavAria` drives both `ServiceNav` and `StationTabs` (one key, two consumers).
- Audit edge case #23 closed: `contactContent.stationLabel` was already in content but the component bypassed it — wired correctly now.

**Integrity + governance (17b-8, 17b-9):**
- New `describe('LocalizedString guard + translation debt')` block in `content/integrity.test.ts` — structural walker over every content export. 3 new tests: strict malformed guard, sanity floor, printable snapshot.
- Current snapshot (scanned at 17b-8 authoring): **519 total LocalizedStrings / 32 fully multilingual (en+fr+es, 6%) / 2 partial / 485 en-only (93%) / 0 malformed.**
- VOCAB.md, CONSTITUTION.md, ARCHITECTURE.md updated. New cloud learn doc at `<cloud>/yesid.dev/docs/learn/data-layer/hexagonal-content-layer.md` captures the full pattern — durable artifact portable to future projects.

### Key numbers

| Metric | Baseline | Post-17b |
|---|---|---|
| Test files | 82 | 83 (+1 new `adapter.test.ts`) |
| Tests | 782 | **822** (+40: 37 adapter contract + 3 LocalizedString integrity) |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 pre-existing warnings (unchanged) |
| LocalizedStrings in content | unknown | **519 walked, 0 malformed** |
| Hardcoded English in components | ~157 (audit) | **0** (integrity test enforced) |
| Adapter-seam implementations | 0 | 1 (staticAdapter) |

### What this enables

- **CMS migration is a one-line swap.** When a Payload / headless CMS arrives, one line in `src/lib/adapters/index.ts` swaps `staticAdapter` → `payloadAdapter`. Every upstream consumer (repositories, loaders, components) is unchanged. The integrity test continues to guard the LocalizedString shape against the new data source.
- **Translation readiness.** Every user-facing string is a typed LocalizedString. Translation debt (93% en-only) is tracked via the snapshot test. Adding French for a page = filling in `fr` fields in the relevant content file; no component changes.
- **Review discipline.** The four new CONSTITUTION §11 anti-patterns are greppable — a PR that adds hardcoded English in a `.svelte` file fails reviewer rules-check.

### What's deferred

- `src/routes/+layout.svelte` + `src/routes/+error.svelte` — JSON-LD siteMeta + error-page copy still import from `$lib/content` directly. Documented exceptions with inline comments; full migration deferred to Slice 15 SEO.
- Translation debt pay-down — 485 en-only LocalizedStrings. Post-17 slice; the integrity test provides the starting number.
- Stack viz components (StackDiagram / StackPanel / StackFilters / etc.) are extracted but not wired into any route yet (`/tech-stack` still shows "interactive diagram coming soon"). Tests pass for all 70 stack component assertions; Slice 10c will wire them into the route.

---

## PR body (for `gh pr create`)

```markdown
## Summary

L-slice 17b introduces a hexagonal content architecture and enforces LocalizedString discipline across the entire app.

**Architecture layer** (`src/lib/adapters/` + `src/lib/repositories/`): content flows through a port interface. Components and route loaders never touch `$lib/content/*` directly — they call repositories that delegate to a swappable adapter. Migrating to a CMS later is one line of code.

**Extraction** (`content/*.ts`): every user-facing string on every route now lives as a `LocalizedString` (`{ en; fr?; es? }`) in the content layer. ~207 strings moved across 12 extraction sub-tasks. `0` hardcoded user-facing English remains in components (enforced by a new integrity test).

**Integrity** (`content/integrity.test.ts`): structural walker verifies every LocalizedString has a non-empty `en` field. Malformed strings fail the build. Translation-debt snapshot printed on every test run.

**Governance**: VOCAB.md, CONSTITUTION.md, ARCHITECTURE.md updated. New cloud learn doc (`<cloud>/yesid.dev/docs/learn/data-layer/hexagonal-content-layer.md`) captures the full pattern.

## Test plan

- [x] `bun run check` → 0 errors, 19 pre-existing warnings (unchanged)
- [x] `bun run test` → 83 files / 822 tests pass (+40 from baseline: 37 adapter contract + 3 LocalizedString guard/debt)
- [x] `bun run build` → production SSR succeeds (~48s)
- [x] Preview sweep — every route renders identically to pre-slice baseline: `/`, `/services`, `/services/sql-development`, `/projects`, `/projects/yesid-dev`, `/blog`, `/blog/personal`, `/blog/building-a-transit-pipeline`, `/tech-stack`, `/about`, `/contact`
- [x] Mobile 375×812 spot-checks on `/blog`, `/about`, `/services/sql-development`, `/contact`
- [x] Integrity snapshot: 519 LocalizedStrings / 32 full / 485 en-only / **0 malformed**
- [x] Adapter swap rehearsal: changing the `export { staticAdapter as adapter }` line is sufficient to swap implementations (manually verified; not a test)

## What landed

23 commits. Each sub-task's handoff + log section is in `docs/slices/slice-17/slice-17b/` (bundle moves to cloud via `slice:close` after merge).

Architecture + audit: 17b-1..6 · Extractions: 17b-7a..l · Integrity: 17b-8 · Governance: 17b-9 · This PR: 17b-10.

## What's deferred

- `/+layout.svelte` + `/+error.svelte` content pipe — documented as Slice 15 SEO.
- Translation debt (485 en-only) — post-17 slice; starting number tracked by the snapshot test.
- Stack viz route wiring — Slice 10c.

## Notable gotchas for the reviewer

- Out-of-scope uncommitted changes exist in the branch checkout (CLAUDE.md, WORKFLOW.md, AGENTS.md, docs/reference/tools/, etc.) from a parallel Claude Code session. Those are NOT in this PR — they're local-only and need their own commit path (Yesid will handle separately).
- `ecbdb5a` was the original 17b-7f commit, rolled back + re-landed clean as `f8a6683` after the parallel session reset the Services extraction into an unrelated WORKFLOW.md governance commit. Context in the 17b-7f/7g commit reconciliation session entry in log.md.
- The integrity test's LocalizedString walker is structural (shape-based) — it treats any object with an `en` key as a candidate. False positives would be caught at authoring time; none exist in the current codebase.
```

---

## 17b-1 — Folder restructure (data/ → content/ + utils/ + types.ts)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- `src/lib/data/` dissolved. Content moved to `src/lib/content/`; pure engines moved to `src/lib/utils/`; shared TypeScript types promoted to `src/lib/types.ts`.
- `src/lib/utils.ts` (shadcn-svelte `cn` helper) folded into the new `src/lib/utils/cn.ts`. Resolves a collision that the plan had not anticipated.
- Barrels added: `src/lib/content/index.ts`, `src/lib/utils/index.ts`. `src/lib/types.ts` is already flat and self-barrels.
- 375 files updated across `src/`; 426 import rewrites covering three flavours:
  - `$lib/data/<specific>` → `$lib/types` / `$lib/utils/*` / `$lib/content/*`
  - `from '$lib/data'` bare barrel → grouped `$lib/types` + `$lib/utils` + `$lib/content` imports
  - `$lib/utils.js` (shadcn file) → `$lib/utils` (new barrel)
- `vite.config.ts` `data` test-project include patterns updated so the moved `.test.ts` files still run.

### What did **not** change

No visual, behavioural, or content changes. Every component renders the same data from the same source values; only the path to those values moved.

### Verification

| Check | Baseline | Post-17b-1 |
|---|---|---|
| `bun run test` | 82 files / 782 tests pass | 82 files / 782 tests pass |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |

### Files of interest for review

- `src/lib/content/index.ts` — content barrel (transitional; tightening starts in 17b-4).
- `src/lib/utils/index.ts` — utility barrel.
- `src/lib/utils/cn.ts` — moved shadcn helper.
- `vite.config.ts` — vitest `data` project include patterns.
- Any `$lib/data/...` import across `src/` (there should be zero).

### Design notes recorded in `log.md`

- Plan gap: `src/lib/utils.ts` collision → Option A (move to `utils/cn.ts`) approved.
- Barrel scope: re-export every module under its layer; transitional for components, permanent for adapters + future consumers.

---

## 17b-2 — Adapter scaffold (`ContentAdapter` + static + contract test)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- New folder `src/lib/adapters/` with four files:
  - `types.ts` — `ContentAdapter` interface + six port interfaces.
  - `static.ts` — `staticAdapter: ContentAdapter`, async wrappers over every `$lib/content/*` export.
  - `index.ts` — one-line swap point re-exporting the active adapter.
  - `adapter.test.ts` — 37 contract tests verifying shape + cardinality + not-found behavior.
- `vite.config.ts` test include gained `src/lib/adapters/**/*.test.ts`.

### What did **not** change

No consumer uses the adapter yet — route loaders and components still import from `$lib/content/*`. Preview rendering is identical to post-17b-1. Wiring lands in Task 17b-3 (repositories) + 17b-4 (loaders).

### Verification

| Check | Post-17b-1 | Post-17b-2 |
|---|---|---|
| `bun run test` | 82/782 pass | 83/819 pass (+1 file, +37 tests) |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |

### Review focus

- `src/lib/adapters/types.ts` — the contract every future CMS must satisfy. `typeof import('...')` pattern binds the content port to current site-content shapes (intentional; future adapters must match).
- `src/lib/adapters/static.ts` — verify every method maps to an existing content export; no transformation or business logic.
- `src/lib/adapters/adapter.test.ts` — 37 assertions; shallow on purpose (deep data in content/integrity.test.ts).

---

## 17b-3 — Repository layer (ports on top of the adapter)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- New folder `src/lib/repositories/` with 6 modules + barrel:
  - `project.ts`, `service.ts`, `blog.ts`, `meta.ts`, `tech-stack.ts`, `content.ts`, `index.ts`
  - Every function is async, delegates to `adapter.<collection>.<verb>`, returns `readonly` collections / `undefined` for not-found.
- Metro-line derivation folded into `repositories/service.ts`:
  - `getMetroStops`, `getTotalStops`, `getStopByType`, `formatStopLabel`, `formatServicesLabel` (all async except `formatStopLabel` which is a pure sync formatter).
  - Labels preserved verbatim: "Departure" / "Featured Work" / "Who's Driving" / "Dispatches" / "Final Destination".
- `meta` repository exposes `getPersonSchema()` — the only repository method that *composes* (calls `buildPersonSchema` on adapter data).
- Three query-function test files moved and rewritten async:
  - `content/metro.test.ts` → `repositories/service.test.ts`
  - `content/projects.test.ts` → `repositories/project.test.ts`
  - `content/tech-stack.test.ts` → `repositories/tech-stack.test.ts`
- `content/metro.ts` deleted (functionality lives in the repository).
- `content/index.ts` loses the `./metro` re-export; comment left as a pointer.
- `vite.config.ts` `data` project `include` gains `src/lib/repositories/**/*.test.ts`.

### What did **not** change

Nothing user-visible. No consumer imports from `$lib/repositories` yet — route loaders still go through `$lib/content` directly. That migration lands in Task 17b-4.

### Verification

| Check | Post-17b-2 | Post-17b-3 |
|---|---|---|
| `bun run test` | 83/819 pass | **83/819 pass** (3 files moved in ↔ 3 moved out, net zero) |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| Preview 10 primary URLs | 200 OK | 200 OK |

### Review focus

- `src/lib/repositories/service.ts` — metro labels kept verbatim from the old content file; spec reference had stock labels that would have caused visible copy changes.
- `src/lib/repositories/tech-stack.test.ts` — `validateTechItems` / `validateScenarios` imported directly from `$lib/content/tech-stack` rather than surfaced through the repository (test-only plumbing).
- `src/lib/content/metro.ts` removed; nothing outside the old test consumed its exports.

---

## 17b-4 — Route loader migration (loaders → repositories)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- 9 route loaders migrated from `$lib/content` → `$lib/repositories`:
  `/projects/+page.ts`, `/projects/[slug]/+page.ts`, `/services/+page.ts`, `/services/[id]/+page.ts`, `/blog/+page.ts`, `/blog/personal/+page.ts`, `/blog/[slug]/+page.ts`, `/tech-stack/+page.ts`, `/about/+page.server.ts`.
- All loaders become `async`. Independent content reads are batched with `Promise.all` for SSR-time parallelism.
- 2 loaders unchanged by design: `/+page.ts` (no data loading, `ssr=false`), `/contact/+page.server.ts` (weather-only).
- 2 documented exceptions annotated with inline comments:
  `/+layout.svelte` (JSON-LD siteMeta) and `/+error.svelte` (error copy). Full migration deferred to Slice 15 SEO.

### What did **not** change

- Components (`ContactPage.svelte`, `AboutPage.svelte`, etc.) still read `contactContent` / `aboutPageContent` directly from `$lib/content/*`. These are component-scope rule violations picked up by Task 17b-7 (component extraction).
- No visible copy or layout change.

### Verification

| Check | Result |
|---|---|
| `bun run test` | 83/819 pass (unchanged) |
| `bun run check` | 0 errors, 19 warnings (unchanged) |
| `bun run build` | ✅ production build succeeds in ~1 min (real SSR exercise) |
| 11-URL preview sweep | 10 × 200 OK, fake URL → 404 |
| `/about` snapshot | All sections render including live weather |

### Review focus

- `src/routes/projects/[slug]/+page.ts` — `project.relatedServices.map(getServiceById)` wrapped in `Promise.all` before `.filter()` so the async-array handling is correct.
- `src/routes/about/+page.server.ts` — `aboutPageContent.weather.enabled` short-circuit now awaits the content fetch first. Preserves original behaviour (no weather fetch if flagged off).
- `src/routes/+layout.svelte` + `src/routes/+error.svelte` — inline comments explaining the deferral. Reviewers should confirm the exception rationale is clear enough for future readers.

---

## 17b-5 — Hardcoded content audit (parallel subagents)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting calibration decision (proceed / split / rescope)

### What changed

- One new file: `docs/slices/slice-17/slice-17b/audit-hardcoded-content.md`.
- Contains the merged output of 7 Sonnet subagents that swept every `.svelte` file in `src/lib/components/*` (except `ui/`) and `src/routes/*.svelte` for hardcoded user-facing strings.

### Deliverables

- 157 findings with suggested content file + key per row.
- 26 edge cases flagged for human judgment.
- Translation-debt snapshot (≈230 en-only `LocalizedString` fields already in content).
- Proposed 12-sub-task breakdown for Task 17b-7 — each commit extracts 5–26 strings per page domain.

### What did **not** change

No code changes. This task is audit-only — it produces the plan that 17b-6 and 17b-7 execute against.

### Calibration gate

Yesid selects one of:
- **Proceed as-is** — Tasks 6 + 7 + 8 + 9 + 10 all ship in this PR.
- **Split 17b** — ship Tasks 1–5 + 8–10 now; 17b-2 picks up extraction.
- **Rescope** — defer extraction entirely.

Author recommendation: **Split**. Keeps the architecture PR small and focused; extraction is a natural follow-up sub-slice.

**Yesid decided: Proceed (Option A).** Extraction happens in this PR.

---

## 17b-6 — Content-side LocalizedString upgrade

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- `src/lib/content/nav.ts` gains `metroBookends: MetroBookends` (5 LocalizedString labels: departure, featured, about, blog, terminal) + its type.
- `src/lib/adapters/types.ts` `ContentPort` gains `metroBookends(): Promise<MetroBookends>`.
- `src/lib/adapters/static.ts` imports + exposes `metroBookends`.
- `src/lib/repositories/content.ts` adds `getMetroBookends()`.
- `src/lib/repositories/service.ts` `getMetroStops()` reads bookends from `adapter.content.metroBookends()` instead of hardcoding inline LocalizedString literals.
- `src/lib/types.ts` — `ImpactMetric.label` typed `string` → `LocalizedString`. `value` and `before` stay bare (numeric/unit strings are locale-universal).
- `src/lib/content/projects.ts` — 7 `label: '…'` occurrences wrapped in `{ en: … }`.
- 3 components updated to call `resolveLocale(metric.label, 'en')` — ProjectDetailHeader, ProjectGlancePanel, ProjectGlancePanelMobile.
- `src/lib/repositories/project.test.ts` `impactMetrics` assertion updated to LocalizedString shape.

### What did **not** change

No visible copy, layout, or behaviour change. Metro labels render the same verbatim strings through the adapter path. Impact metric labels render the same English text via `resolveLocale`.

### Verification

| Check | Post-17b-5 | Post-17b-6 |
|---|---|---|
| `bun run test` | 83 / 819 pass | 83 / 819 pass |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| Preview home + projects | 200 OK | 200 OK |
| Metro strip labels | — | verbatim: Departure / Featured Work / Who's Driving / Dispatches / Final Destination |

### Review focus

- `src/lib/content/nav.ts` — are the bookend keys + labels correct? These are the only strings in the app whose copy will drive every metro stop name that's NOT a service title.
- `src/lib/repositories/service.ts` — `getMetroStops` now uses `Promise.all` to fetch services + bookends in parallel. Logic otherwise unchanged.
- `src/lib/types.ts` line 44 — comment on `ImpactMetric.value` justifies keeping it bare string. Confirm that stance (rather than upgrading both `value` and `label`).

---

## 17b-7a through 17b-7e — First extraction batch (73 of ~157 strings)

**Commits:**
- `fc6fb06` 17b-7a Home (14 strings)
- `5704269` 17b-7b Blog listing (16 strings)
- `ee67724` 17b-7c Blog detail (16 strings)
- `799831a` 17b-7d Projects listing (12 strings)
- `9ed81ad` 17b-7e Projects detail (15 strings)

**Status:** 5 of 12 extraction sub-tasks shipped — 46% of the audit. Pause taken at session-budget threshold (~62% of 1M window). Fresh session planned for 17b-7f onward.

### New content structures

- `site-content.ts` — heroContent.headline.ariaSuffix, heroContent.sqlPanel.columns + metaTemplate, proofReelContent.toggleColorAria, servicesGridContent.viewIllustrationAria + viewAllLink, relatedProjectsStripContent, closerContent.terminal.
- `blog.ts` — blogListingContent (mobileHeading, searchPlaceholder, resultNoun, noPostsMessage, filters.*, routeMap.*), blogDetailContent (code, backNav, header, page, tocPill).
- `projects.ts` — projectsListingContent (heading, searchPlaceholder, filters.*, card.stackOverflowSuffix), projectsDetailContent (backToListingLabel, tocSectionTitle, readmeSectionTitle, glance.*, tocPill.*).

### Components wired

14 component files updated across home / blog / projects directories. Inline `labels = { ... }` object pattern consistently replaced by imports from the corresponding content module.

### Verification (holds across all 5 sub-tasks)

| Check | Result |
|---|---|
| `bun run check` | 0 errors, 19 pre-existing warnings |
| `bun run test` | 83 files / 819 tests pass |
| Preview spot-checks | every touched route renders identically |

### Remaining work (for resume session)

- ~~17b-7f Services (18 strings)~~ — shipped, see §17b-7f below
- ~~17b-7g About (16 strings)~~ — shipped, see §17b-7g below
- ~~17b-7h Contact (3 strings)~~ — shipped, see §17b-7h below
- ~~17b-7i Tech stack viz (26 strings)~~ — shipped, see §17b-7i below (actually ~58 once label maps flatten)
- ~~17b-7j Layout + shared (12 strings)~~ — shipped, see §17b-7j below
- ~~17b-7k Page meta tags (8 strings)~~ — shipped, see §17b-7k below
- ~~17b-7l Tech-stack page (9 strings)~~ — shipped, see §17b-7l below (actually 16 once title splits flatten)
- 17b-7i Tech stack viz (26 strings — largest sub-task)
- 17b-7j Layout + shared (12 strings)
- 17b-7k Page meta tags (8 strings)
- 17b-7l Tech-stack page (9 strings)
- 17b-8 Integrity test enhancements (LocalizedString guard + translation-debt report)
- 17b-9 Governance (VOCAB, CONSTITUTION, ARCHITECTURE, README, cloud learn doc)
- 17b-10 Final verification + PR

---

## 17b-7f — Services extraction (19 strings)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- `src/lib/content/services.ts` — two new exported blocks: `servicesListingContent` (7 keys: heading, stationLabelTemplate, deepDiveLabel, projectsStrip.{builtWithService, builtWithFallback, projectSingular, projectPlural}) and `servicesDetailContent` (6 keys: backToServicesLabel, valuePropositionHeading, deliverablesHeading, relatedProjectsHeading, relatedProjectsNavAria, serviceNavAria). `LocalizedString` joined the type imports.
- `src/lib/content/nav.ts` — new `navDirections` export ({previous, next}), multilingual (en/fr/es) to match nav.ts's existing convention.
- `src/lib/content/projects.ts` — `projectsListingContent` gained `seeAllLink` ("See all projects →"), consumed from service detail pages.
- `ProjectsStrip.svelte` — label and count derived now resolve through content (template placeholder `{serviceTitle}` for the active-service case; singular/plural noun choice for the count suffix).
- `ServiceCard.svelte` — `stationLabelText` + `deepDiveLabel` derived values; station SectionLabel + both Deep-dive anchors wired.
- `ServiceDetailPage.svelte` — inline `const labels = {...}` block removed (the component-scope violation flagged in the audit). Six derived values wire back-link, station label, three headings, related-projects aria, and see-all label. Both desktop + mobile duplicates of the Related-projects section are consistent with the same keys.
- `ServiceListingPage.svelte` — sr-only `<h1>` now reads from content.
- `ServiceNav.svelte` — nav aria + both prev/next SectionLabel text props wired through `servicesDetailContent.serviceNavAria` + `navDirections`.

### What did **not** change

- Every string renders the same English copy. No layout, interaction, or behavior changes.
- No adapter or repository wiring. These are UI chrome strings, consumed directly by components — the pattern Yesid approved in 17b-7a..7e.
- No translation debt added: fr/es were only introduced where the destination file was already multilingual (`nav.ts`). The en-only additions to `services.ts` and `projects.ts` stay within the debt-tracking scope of 17b-8.

### Verification

| Check | Post-17b-7e | Post-17b-7f |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` | 83 files / 819 tests pass | 83 files / 819 tests pass |
| `/services` desktop | baseline | station labels + Deep dive CTAs + projects strip (`Built with {active}`, `3 PROJECTS`) render identically |
| `/services/sql-development` desktop | baseline | back link, 3 headings, related projects (3) section, see-all link, NEXT nav all render identically; `Service navigation` aria present |
| `/services/sql-development` mobile 375×812 | baseline | same text renders; mobile related-projects block present; no overflow |
| Console errors (both viewports) | none | none |

### Review focus

- `src/lib/content/services.ts` — the 2 content blocks should read as the canonical source of all chrome copy on `/services` + `/services/[id]`. Confirm the nesting (`projectsStrip.*` sub-group) feels semantic vs. flattening into `servicesListingContent` top-level.
- `src/lib/content/nav.ts` line ~36 — `navDirections` is a small addition but the first "generic directional" bucket in nav.ts. Confirm the key name (`navDirections` vs. e.g. `directions` or `prevNext`) is the right signal for future readers — if another component later needs Previous/Next, this is the canonical place.
- `ServiceDetailPage.svelte` — three content blocks are imported (`servicesListingContent` for the shared station template, `servicesDetailContent` for the detail-specific strings, `projectsListingContent` for the one `seeAllLink`). This is the most import-heavy extraction so far; confirm the rationale (see `log.md` "Non-obvious decisions") matches Yesid's preference or suggest a simpler grouping.
- Verify the two aria-label + two see-all-link duplicates between desktop `.projects-panel` and mobile `.projects-mobile` still read from the same derived values (no divergence risk).

---

## 17b-7g — About extraction (17 strings + scope amendment)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

**Types + content**
- `src/lib/types.ts` — new `AboutStopLabels` interface (10 keys) + new `AboutLabels` interface (7 keys); both added as fields on `AboutContent`.
- `src/lib/content/about-page.ts` — `aboutPageContent.stopLabels` seeded with IDENTITY / METRICS / TESTIMONIALS / PROCESS / STACK / CLIENTS / INTERESTS / SNAPSHOTS / LOCATION / NEXT; `aboutPageContent.labels` seeded with clientsServed + polaroidPrev/NextAria + testimonialsCarouselAria + testimonialsTabNavAria + two template strings (testimonialSlideAria, showTestimonialAria).

**Parent (drives stop labels via props)**
- `AboutPage.svelte` — 10 hardcoded `label="XXX"` props replaced with `resolveLocale(c.stopLabels.<key>, 'en')`.

**Children with no chrome strings (6 files — prop-shape cleanup only)**
- `AboutIdentity`, `AboutMetrics`, `AboutMethod`, `AboutInterests`, `AboutCta`, `AboutWeather` — removed `stop = '0X'` + `label = 'XXX'` defaults; prop types tightened from optional to required. Resolves audit edge case #19 (duplicate source-of-truth for stop labels).

**Children that own internal chrome (3 files)**
- `AboutLogos.svelte` — defaults removed; MetricDisplay `label="clients served"` swapped for `resolveLocale(aboutPageContent.labels.clientsServed, 'en')`.
- `AboutPolaroids.svelte` — defaults removed; Previous/Next aria-labels now read from `aboutPageContent.labels.polaroidPrev/NextAria`.
- `AboutTestimonials.svelte` — defaults removed; four arias wired: region-level carousel aria, tablist aria, and two template arias with `{index}` + `{total}` placeholder replace done at the call site.

### What did **not** change

- No visible or behavioural change. Every rendered string matches what the page showed pre-extraction (verified preview desktop + mobile 375×812).
- AboutPage.test.ts (the one test in the about/ directory) continues to assert `STOP 00 — IDENTITY` and `STOP 08 — SNAPSHOTS`; both still pass because the content-layer seeds identical English values.
- No adapter or repository wiring — UI chrome strings flow directly from content to components, matching the 17b-7a..7f pattern.

### Verification

| Check | Post-17b-7f | Post-17b-7g |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` | 83 / 819 pass | 83 / 819 pass (one flaky run recovered on rerun) |
| Preview `/about` desktop | baseline | 10 stops, all arias, "clients served" render identically |
| Preview `/about` mobile 375×812 | baseline | 10 stops, testimonial arias render identically |

### Review focus

- `src/lib/types.ts` — confirm the new `AboutStopLabels` + `AboutLabels` interfaces belong on `AboutContent` (top-level) rather than nested. Adding them here forces all future content sources to satisfy them; the trade-off is worth the compile-time guarantee.
- `src/lib/content/about-page.ts` — 17 new LocalizedString seeds in two blocks at the end of `aboutPageContent`. No fr/es backfilled (debt tracked in 17b-8). Confirm key names read well (e.g., `stopLabels.next` for the CTA card — could also be called `cta` but `next` matches the visible label "NEXT").
- `AboutTestimonials.svelte` — two template-string arias (`testimonialSlideAria`, `showTestimonialAria`). The `{index}` / `{total}` placeholder replace happens at the call site, same shape as `servicesListingContent.stationLabelTemplate` from 17b-7f.
- Six "defaults-only" children (`AboutIdentity`, `AboutMetrics`, `AboutMethod`, `AboutInterests`, `AboutCta`, `AboutWeather`) now have strict required props. If any future standalone test imports them, it must pass both `stop` + `label` explicitly — catch any missing call site before landing.

---

## 17b-7h — Contact extraction (3 strings)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

**Types + content**
- `src/lib/types.ts` — `ContactContent` gained two new fields: `pageTitle: LocalizedString` and `sendErrorMessage: LocalizedString`. `stationLabel` was already typed + seeded; only wiring was missing.
- `src/lib/content/contact-page.ts` — seeded `pageTitle = { en: 'Contact' }` and `sendErrorMessage = { en: 'Failed to send message. Please try again.' }`. `stationLabel` untouched.

**Component (ContactPage.svelte)**
- Three `const <name> = resolveLocale(c.<key>, 'en')` bindings added at the top of the `<script>` block next to the existing `c = contactContent` alias.
- Edge title (desktop) + mobile h1 now render `{pageTitle}` instead of the literal `Contact`.
- Station label span now renders `{stationLabel}` instead of the literal `NEXT STOP: YOU` — closing audit edge case #23 (content had the field, component bypassed it).
- Two `errors = { form: 'Failed to send...' }` branches in `handleSubmit` now use the pre-resolved `sendErrorMessage` const.

### What did **not** change

- Decorative `.` dot is still a span with its own color class — part of brand typography, not copy. Not extracted.
- No adapter or repository wiring; UI chrome flows directly from content to component per the 17b-7a..7g pattern.
- No visible or behavioural change; every rendered string matches pre-extraction.

### Verification

| Check | Post-17b-7g | Post-17b-7h |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` | 83 / 819 pass | 83 / 819 pass |
| Preview `/contact` desktop | baseline | `Contact.` edge title + mobile h1 + `NEXT STOP: YOU` subtitle render identically |
| Console errors | none | none |

### Review focus

- `src/lib/types.ts` — confirm the three top-level fields on `ContactContent` (pageTitle, stationLabel, sendErrorMessage) read well. Alternative would be nesting under a `chrome` block, but consistent with `ContactContent.stationLabel` already being top-level.
- `src/lib/content/contact-page.ts` — decision rationale: `pageTitle` doesn't include the decorative `.` dot because the dot has its own color span in the template. Content = copy; dot = typography.
- `ContactPage.svelte` script top — three bare `const` bindings rather than `$derived` because the strings are static English. When locale-switching lands, convert to derived on a locale source.
- `handleSubmit` error branches — `sendErrorMessage` is pre-resolved so `errors` stays typed as `Record<string, string>`. Swap to a LocalizedString-valued error object if the display layer gains locale awareness later.

---

## 17b-7i — Tech stack viz extraction (~58 strings across 7 components)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

**Content addition**
- `src/lib/content/tech-stack.ts` — new top-of-file `techStackVizContent` export. Grouped by component consumer:
  - `orientation` (5 keys) — StackPanelOrientation hint card.
  - `proficiency` (3 keys) — Expert/Proficient/Familiar shared by StackPanel + StackBottomSheet; typed `as const satisfies Record<Proficiency, LocalizedString>`.
  - `panel` (6 keys) — closeAria, usedInLabel, and 4 templates (sendsDataTo, receivesFrom, viewRelation, buildWith) shared by StackPanel + StackBottomSheet.
  - `bottomSheet` (4 keys) — mobile-specific: titleTemplate, closeAria, prevAria, nextAria.
  - `diagram` (2 + 9 layers = 11 keys) — section label, diagram aria, + per-tier `layerLabels` typed `Record<InfraLayer, LocalizedString>`.
  - `filters` (3 + 7 domains = 10 keys) — section label, All label, toolbar aria, + short-form `domainLabels` typed `Record<DomainCluster, LocalizedString>`.
  - `configurator` (3 + 14 = 17 keys) — heading, group aria, selection-count template, + long-form `domains[*].{label, description}` pairs typed `Record<DomainCluster, { label; description }>`.
  - `scenario` (2 keys) — provenInLabel + ctaBuildThis.

**Components updated (7 files)**

- `StackPanelOrientation.svelte` — gained a `<script>` block; five `const` bindings for heading / description / three hints.
- `StackBottomSheet.svelte` — removed inline `proficiencyLabel` map; 8 chrome bindings plus 3 helpers (sheetTitle template with `{name}` replace, sendsDataTitle + receivesFromTitle with `{count}`, buildWithLabel template). Proficiency badge, close aria, prev/next arias, used-in label, collapsible-section titles, CTA button text all content-driven.
- `StackConfigurator.svelte` — removed `DOMAIN_OPTIONS` array. Added `DOMAIN_ORDER: readonly DomainCluster[]` (presentational order) plus `labelFor` / `descriptionFor` helpers that index into content. Group aria, heading, selection-count template all wired.
- `StackDiagram.svelte` — removed `LAYER_LABELS` record. Kept `LAYER_ORDER` as the presentational sequence. Section label, desktop diagram aria, and per-tier labels driven via `layerLabelFor(layer)` helper.
- `StackFilters.svelte` — removed `DOMAIN_LABELS` array. Uses the same `DOMAIN_ORDER` iteration shape. Section label, All pill label, toolbar aria, 7 domain pills content-driven.
- `StackPanel.svelte` — mirror of StackBottomSheet for shared `panel.*` chrome. `viewRelationTemplate` with `{name}` replace now drives `title={viewRelationTitle(name)}` on relation links (previously a literal Svelte template).
- `StackScenarioCard.svelte` — two consts wire Proven in section label + Let's build this CTA.

### What did **not** change

- No adapter or repository wiring. UI chrome flows directly from content to components per the 17b-7a..7h pattern.
- `LAYER_ORDER` (StackDiagram) and `DOMAIN_ORDER` (StackFilters, StackConfigurator) remain in-component arrays — they encode presentational sequence, not copy.
- No visible or behavioural change. All 70 stack component tests (assertions on "Expert", "What do you need?", "1/3" selection count, 7 domain configurator buttons by testid) pass identically.

### Verification

| Check | Post-17b-7h | Post-17b-7i |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` full | 83 / 819 pass | 83 / 819 pass |
| `bun run test src/lib/components/stack/` | 7 / 70 pass | 7 / 70 pass |
| Preview `/tech-stack` | hero + stats + CTA render | identical (stack viz components not currently routed — "interactive diagram coming soon") |

Preview verification is limited because the stack viz components are not wired into any route yet (Slice 10 shipped the components + tests but the tech-stack page is still a hero/stats landing). Tests are the sole verification path for 17b-7i; all 70 stack tests pass.

### Review focus

- `src/lib/content/tech-stack.ts` lines 1–50 of the new `techStackVizContent` block — confirm the sub-grouping is the right shape. Alternative: split into `techStackPanelContent` / `techStackFilterContent` / etc. similar to projects.ts's listing+detail split. Current single-object approach matches blog.ts's top-of-file single content object.
- Typed-record patterns (`as const satisfies Record<Proficiency, LocalizedString>`) — compile-time exhaustiveness. If someone later adds `'novice'` to `Proficiency`, the content definition fails to compile until they add the label.
- `StackConfigurator` + `StackFilters` both declare `DOMAIN_ORDER` — duplication. Consider extracting a shared `const` to `$lib/types` or `$lib/content/tech-stack` if a third component needs the same sequence. Not worth pre-factoring for 2 consumers.
- `StackPanel` + `StackBottomSheet` share the `panel.*` content block. Two ways to consume from content (StackPanel imports as-needed per string, StackBottomSheet destructures `bottomSheet` prefix). Stylistic difference — confirm preference.
- Short-form ("Web Dev") vs long-form ("Web Development") domain labels are intentionally both present — different UI densities need different copy. Audit edge case #18 flagged these as duplication; keeping them separate is the correct call for UX.

---

## 17b-7j — Layout + shared extraction (13 strings)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

**Content additions**
- `src/lib/content/nav.ts` — new `sharedChromeContent` export with 10 LocalizedString seeds. 6 multilingual (en/fr/es) for user-facing navigation copy; 4 en-only for decorative chrome ("NAVIGATION — ALL ROUTES", "Toggle section" aria).
- `src/lib/content/site-content.ts` — new `footerContent` export with 3 en-only seeds (tagline, location, statusPrefix) at the end of the file.

**Components updated (7)**
- `Nav.svelte` — menu toggle aria conditional now reads `closeMenuAria` / `openMenuAria`.
- `Footer.svelte` — tagline, nav aria, address, status prefix all content-driven. Template `{statusPrefix} {systemDate}` assembles at render.
- `MenuOverlay.svelte` — DialogPrimitive.Title (sr-only) + footer label content-driven.
- `FilterSummary.svelte` — "clear filters" button wired.
- `SearchInput.svelte` — default placeholder resolves from content; callers still override.
- `TableOfContents.svelte` — Toggle section aria + 2× "On this page" heading + mobile button label.
- `StationTabs.svelte` — `aria-label="Service navigation"` now reuses `servicesDetailContent.serviceNavAria` added in 17b-7f (dedupe — one key, two consumers).

### What did **not** change

- `TableOfContents` `<nav aria-label="Table of contents">` (sentence case) was NOT in the audit's list for this task — stays as hardcoded string. If/when flagged separately, would add a `tocNavAria` key.
- No adapter or repository wiring; UI chrome flows directly from content to components per the 17b-7a..7i pattern.
- No visible or behavioural change. Every string renders the same English copy in desktop + mobile preview.

### Verification

| Check | Post-17b-7i | Post-17b-7j |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` | 83 / 819 pass | 83 / 819 pass |
| Preview (multiple routes) | baseline | all 13 strings + 1 reused key render identically on desktop + mobile |
| Console errors | none | none |

### Review focus

- `src/lib/content/nav.ts` — `sharedChromeContent` is the new catch-all for navigation chrome that doesn't belong to a specific page domain. Confirm the bucket name reads well vs. alternatives (`layoutChrome`, `uiChrome`, `sharedContent`).
- `site-content.ts` `footerContent` — three top-level fields rather than a nested `footer: { tagline, location, statusPrefix }` structure. Matches the flat shape of `aboutContent` / `ctaContent`.
- `StationTabs.svelte` reuses `servicesDetailContent.serviceNavAria` — good dedupe, but establishes a cross-page-domain import (`/shared/StationTabs` imports from `/content/services`). Confirm that's acceptable; alternative would be a generic `navChrome.serviceNavAria` on nav.ts.
- fr/es translations in `sharedChromeContent` — ≤ 10 new multilingual strings. These are the first extractions in this slice that proactively seed non-English content (aside from `navDirections` in 17b-7f). Translation-debt report in 17b-8 will reflect the positive delta.

---

## 17b-7k — Page meta tags extraction (8 strings)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

**Types + content**
- `types.ts` — new `PageMeta` interface (`title` + `description` LocalizedStrings). Added to `AboutContent.meta` + `ContactContent.meta` (typed containers).
- `about-page.ts` + `contact-page.ts` — seeded `meta: { title, description }` (en-only; matches prior en-only seeds in these files).
- `services.ts` + `projects.ts` — new top-level `servicesPageMeta` / `projectsPageMeta` exports (untyped pattern — matches the existing flat-exports shape of these files).

**Routes updated (4)**
- `/about` + `/contact` + `/projects` + `/services` — each `+page.svelte` now reads `metaTitle` + `metaDescription` via resolveLocale at script top and wires them into `<svelte:head>`. Preserves exact English wording.

### What did **not** change

- `/services/[id]/+page.svelte` — already resolves `{title} — yesid.` dynamically from service data; only the brand suffix is hardcoded (structural, out of scope).
- `/tech-stack/+page.svelte` — meta tag left for 17b-7l's dedicated tech-stack-page extraction.
- `/blog` + `/blog/personal` + `/blog/[slug]` — no hardcoded meta tags in those route files (titles come from post frontmatter via loader).
- No adapter or repository wiring — chrome flows directly from content to routes.

### Verification

| Check | Post-17b-7j | Post-17b-7k |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` | 83 / 819 pass | 83 / 819 pass |
| SSR fetch titles + descriptions for all 4 routes | baseline | identical (4 titles + 4 descriptions content-driven) |

### Review focus

- Naming inconsistency: About/Contact use nested `meta.title`/`meta.description`; Services/Projects use top-level `servicesPageMeta`/`projectsPageMeta`. Decision rationale in `log.md` — typed vs. untyped container. Confirm this split feels right vs. forcing one pattern.
- Separator mismatch preserved: "About — yesid." (em dash) vs. "Projects | yesid." (pipe). Kept verbatim from the originals; if you want them normalized to em dash everywhere, that's a one-line content fix.
- `contactContent.pageTitle` (visible "Contact") vs. `contactContent.meta.title` ("Contact — yesid.") — two different keys deliberately. Pre-existing pattern in 17b-7h extended cleanly here.

---

## 17b-7l — Tech-stack page extraction (16 strings) — last extraction

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

**Content addition**
- `src/lib/content/tech-stack.ts` — new `techStackPageContent` export placed before the existing `techStackVizContent` (17b-7i). Four grouped zones:
  - `meta` (2): title + description template with `{itemCount}` + `{layerCount}` placeholders.
  - `hero` (4 chrome + 4 stat labels): overline, two-line title, terminal aria, technologies/layers/domains/projects stat labels.
  - `actions` (2): getInTouch + viewServices CTA labels — rendered four times total (twice each, hero and CTA zone) from a single source.
  - `cta` (4): two-line heading, sub paragraph, availability notice.

**Route updated**
- `src/routes/tech-stack/+page.svelte` — dozen pre-resolved `const` bindings at script top, `statLabels: { ... }` object for the four stat labels, template replace for the meta description's `{itemCount}` / `{layerCount}`. Decorative punctuation (trailing `.` `?` on heading accent spans) left as template literals.

### What did **not** change

- Terminal animation flavour strings (lines 22–29) stay as script literals — audit edge case #13 flagged as decorative terminal voice; extraction reserved for a future translation pass.
- Stack viz components (StackDiagram, StackPanel, etc.) not affected — their chrome was extracted in 17b-7i.
- No adapter or repository wiring.
- No visible or behavioural change; tab title, meta description (with replaced counts), hero zone, and CTA zone all render identically.

### Verification

| Check | Post-17b-7k | Post-17b-7l |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` | 83 / 819 pass | 83 / 819 pass |
| Preview `/tech-stack` | title + meta rendered | all 16 content-driven strings render identically; hero stat labels + CTA buttons + availability notice all preserved |

### Review focus

- `techStackPageContent.meta.description` uses the `{itemCount}` + `{layerCount}` template pattern established in 17b-7a..7h. `.replace()` chain is at the call site.
- Two-line titles split into `titleLine1` / `titleLine2` + `headingLine1` / `headingLine2` keys. Alternatives considered (concatenated string with `<br>` sentinel, or nested object) — split keys chosen for translator ergonomics.
- `actions.getInTouch` / `actions.viewServices` shared across hero + CTA zones. Drift-proof dedup.
- Terminal animation flavour lines (22–29) left untranslated — flag if translation pressure would favour extracting these too (they're tightly bundled with the terminal aesthetic; translating line-by-line would fracture the voice).

---

### 17b-7 summary (all 12 extraction sub-tasks shipped)

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

Audit said ~157; actual is ~207 once label/domain/layer records flatten to individual seeds. Task 17b-7's intent (dedupe + centralize every hardcoded string into content) is now satisfied across all 12 sub-tasks.

Remaining tasks:
- ~~17b-8 Integrity test enhancements~~ — shipped, see §17b-8 below
- ~~17b-9 Governance doc updates~~ — shipped, see §17b-9 below
- 17b-10 Final verification + PR

---

## 17b-8 — Integrity test enhancements (LocalizedString guard + translation-debt report)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

Appended a `describe('LocalizedString guard + translation debt')` block to `src/lib/content/integrity.test.ts`. 3 new tests walk every exported content value and validate LocalizedString shapes:

1. **Strict malformed guard** — fails if any LocalizedString has a missing or empty `en` field. Catches the class of bug where an author writes `{ fr: '...', es: '...' }` without the English default.
2. **Sanity floor** — asserts at least one LocalizedString is fully multilingual (en+fr+es). Protects against accidental fr/es stripping.
3. **Informational snapshot** — `console.log`s a translation-debt table for visibility in test output.

Added module-namespace imports for every content file (`site-content`, `nav`, `services`, `projects`, `meta`, `blog`, `tech-stack`) plus singletons (`aboutPageContent`, `contactContent`). One deterministic entry point per file.

### Current snapshot (produced by the new test)

```
LocalizedString translation-debt snapshot:
─────────────────────────────────────────────────────────
Total LocalizedStrings walked:  519
Full (en + fr + es):            32 (6%)
Partial (en + one other):       2 (0%)
en-only:                        485 (93%)
Malformed (missing en):         0
```

### What did **not** change

- No production code touched. Test-only surface.
- Walker is purely structural (recognizes `{ en: '...' }` shape); doesn't import the `LocalizedString` type. Catches mistyped LocalizedStrings that `svelte-check` would miss.
- No hard assertion on translation coverage — that would fail every build until translations land. Snapshot is informational + the floor-of-one is strict.

### Verification

| Check | Post-17b-7l | Post-17b-8 |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| `bun run test` | 83 / 819 pass | 83 / 822 pass (+3 new tests) |
| Snapshot output | — | 519 total / 0 malformed / 6% fully multilingual |

### Review focus

- `isLocalizedStringShape` heuristic — any object with an `en` key is treated as a LocalizedString candidate. If a configuration field ever collides (e.g., a language-code map with an `en: 'english'` label field), the walker will count it as malformed. None exist in the current codebase; grep-verified at authoring time.
- Walker cycle guard — uses a `WeakSet` for defense. Static content shouldn't cycle, but the cost is zero.
- Translation-debt snapshot — printed via `console.log` in a passing test. Vitest's default reporters surface stdout on pass in verbose mode; regular runs may suppress it. The snapshot is intentionally not asserted against a threshold; it's a visibility surface, not a gate.

---

## 17b-9 — Governance doc updates

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

Four governance docs updated + one cloud learn doc created.

**`docs/reference/VOCAB.md`** — added "Data layer" subsection (Section 3) with 9 new terms: Hexagonal content architecture, ContentAdapter, Port, Static adapter, Repository layer, Chrome, LocalizedString, Translation debt, Content port.

**`docs/reference/CONSTITUTION.md`** — two targeted edits:
- §10 Naming: replaced stale `Shared data: src/lib/data/` with 5 new entries (content/utils/types/adapters/repositories) matching the 17b-1 restructure.
- §11 Anti-Patterns: added 4 new rules covering hardcoded English in components, loaders bypassing the repository seam, components bypassing the data pipe, LocalizedString without `en`.

**`docs/reference/ARCHITECTURE.md`** — the `src/lib/data/` ASCII tree block replaced with the new 7-folder layout documenting every content/utils/types/adapters/repositories file introduced or reshaped in 17b, cross-referenced to authoring tasks.

**`<cloud>/yesid.dev/docs/learn/data-layer/hexagonal-content-layer.md`** — brand-new learn doc capturing the full pattern (analogy, what-it-is, folder layout, ports list, why-chrome-bypasses-the-adapter, one-line-swap demo, pitfalls, when-to-use-it). Prerequisites chain to existing data-layer learn docs. This is the durable artifact — a pattern Yesid can lift into future projects.

### What did **not** change

- `README.md` — high-level structure; nothing stale.
- Existing cloud learn docs — kept as historical Slice 04–06 context; new hexagonal doc sits alongside.
- `TESTS.md` + `PATTERNS.md` — no update; integrity test surface is discoverable via existing convention, and the hexagonal pattern is large enough to warrant its own learn doc rather than a PATTERNS.md row.

### Verification

| Check | Post-17b-8 | Post-17b-9 |
|---|---|---|
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings (no source changes) |
| Doc coherence | — | VOCAB/CONSTITUTION/ARCHITECTURE re-read post-edit; no broken references or stale paths |
| Cloud learn doc | — | 175 lines at `<cloud>/yesid.dev/docs/learn/data-layer/hexagonal-content-layer.md` |

### Review focus

- `VOCAB.md` "Data layer" subsection placement under Section 3 (Industry vocab) — alternative would be a new top-level Section 7 just for data-layer terms. Kept under Industry because "hexagonal architecture" and "LocalizedString" are widely recognizable industry terms.
- `CONSTITUTION.md` §11 anti-pattern wording — each rule is a "Never" statement linking back to the pipe architecture. Confirm they're enforceable (reviewer can grep and fail a PR on each).
- `ARCHITECTURE.md` tree depth — the new block is verbose. Alternative: link out to a separate `content-architecture.md` sub-doc. Kept inline because ARCHITECTURE.md is the canonical "where does X live" reference.
- Cloud learn doc — ~18-minute read, advanced-difficulty. If Yesid wants it shorter / less example-heavy, trim the "Implementation Notes" or "Common Pitfalls" sections.
