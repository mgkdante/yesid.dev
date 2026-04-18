# Slice 17b — Handoff

Reviewer-facing record. Grows one section per Level-3 task as tasks complete. Final sections (Summary + PR body) appended at Task 17b-10.

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
