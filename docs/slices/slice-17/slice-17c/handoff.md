# Sub-Slice 17c — Zod Schema Validation · Handoff

**Spec:** [./spec.md](./spec.md)
**Plan:** [./plan.md](./plan.md)
**Parent slice:** [../README.md](../README.md)
**Branch:** `feature/slice-17c-zod-schemas`
**Base:** `main` @ `7c19040` (post slice-15b close)
**Planned by:** Claude Code (Opus 4.7, planning session 2026-04-20)
**Pre-implementation audit:** Claude Explore + Codex (2026-04-20) — findings folded into spec D8 + Task 17c-2b

## Summary

**What shipped:** Zod runtime validation at the `staticAdapter` boundary. Every content-returning port now parses through a schema; thrown errors carry the port label so contract violations from any adapter (static today, Payload in Slice 18) are immediately attributable. Two pre-existing 17b seam leaks closed as audit-driven scope expansion.

**By the numbers (`git diff main --stat`):**
- **32 files changed** — +2,537 lines / −110 lines
- **15 new schema files** in `src/lib/schemas/` (parse, shared, project, service, blog, meta, tech-stack, tech-stack-page, about-page, contact-page, nav, journey, hero-data + barrel + parse.test)
- **~35 bidirectional drift detectors** across the schemas (TS interface ↔ Zod shape compile-time equality)
- **21 `parsePort` wrap sites** in `staticAdapter` (all content-returning ports; site-chrome literals intentionally not wrapped per D2)
- **2 seam leaks closed**: `src/lib/utils/service-svg.ts` no longer imports from `$lib/content/*`; `src/routes/tech-stack/+page.svelte` consumes chrome via `data.techStackPage` load-function output
- **+15 seed-parses-through-schema smoke tests** in `integrity.test.ts` + 5 per-field assertions removed (covered by schemas)

**Seed-data fixes discovered:** None. The pre-implementation audit's Q4 spot-check found all enum values and LocalizedString.en non-empty, and the full schema wrap layer confirmed this at build time — `bun run build` succeeded on the first try post-wrap.

**Open questions from spec — all resolved as spec predicted:**
- **Q1** (`projects.bySlug` — wrap `.optional()` or guard externally?) → wrapped `.optional()`; one parse call covers both branches.
- **Q2** (`parsePort` log to console on failure before throwing?) → no; SvelteKit logs thrown errors already; double-logging clutters dev console.
- **Q3** (ContentPort site-chrome schemas?) → no, per D2 non-goal. Confirmed by keeping the `integrity.test.ts` LocalizedString walker as the enforcement path for site-chrome literals.

**Delta vs. original estimate:** Spec said `Est. Sessions: 1`, and implementation did fit in one wall-clock session (17c-1 → 17c-8 shipped the same day). The audit-driven scope expansion (D8 + Task 17c-2b + expanded 17c-6) added ~1 hour of work, absorbed comfortably. Context budget held through all 9 tasks by staying mechanical (no re-design, no reasoning-heavy transitions after the audit).

**Verification:**
- `bun run check` → 0 errors (19-20 pre-existing warnings; 1 new is the same `data` reference pattern as existing `data.items`)
- `bun run test` → 95 files / 968 tests / all green (up from 960 — +15 new parse smoke tests − 7 removed per-field assertions)
- `bun run build` → `✓ built in 1m 9s`; SSR path exercises every parsePort wrap; no parse errors
- `rg "from '\$lib/content/" src/lib/utils/ src/routes/tech-stack/` → empty (both 17b seam leaks closed)

## Task-by-task log

### Task 17c-1 — Shared primitives + parse helper (commit `9f1b79a`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/parse.ts`, `src/lib/schemas/parse.test.ts`, `src/lib/schemas/shared.ts`
**Files modified:** `src/lib/schemas/seo.ts` (replaced inline `LocalizedStringSchema` with import + re-export from `./shared`)
**Decisions:** None — followed plan canonical pattern exactly.
**Deviations from plan:** None.
**Tests:** 6 new tests in `parse.test.ts` covering pass-through, error tagging, Zod error context, array schemas, optional schemas with undefined, and narrow-type preservation at runtime. Full suite `bun run test` → 95 files / 960 tests / all green. `bun run check` → 0 errors, 19 pre-existing warnings (none touching schema files).
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~45% — Comfortable.
**Next:** Task 17c-2 — Project + Service schemas with drift detectors.

---

### Task 17c-2 — Project + Service schemas (commit `54da6d5`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/project.ts` (4 schemas + 4 drift detectors), `src/lib/schemas/service.ts` (2 schemas + 1 inline helper + 2 drift detectors)
**Decisions:**
- Applied `.min(1)` on `Project.slug` and `Service.id` — matches the `PageSeoSchema` precedent for required short strings; doesn't violate D3 strictness budget (TS already encodes non-empty via required `string`, this is a lower bound not a new constraint).
- Service's home-grid `impactMetric` field has a different shape from `ImpactMetric` (both fields are `LocalizedString` here vs `value: string` on Project). Kept the schema inline (unexported) since no other module references it.
**Deviations from plan:** None — pattern followed exactly. Skipped the optional scratch-repl seed sanity per plan note ("Skip formal test file; Task 17c-7 covers seed-parses-clean assertions in `integrity.test.ts`").
**Tests:** No new test file (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors (same 19 pre-existing warnings — drift detectors compile in both directions).
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~50% — Comfortable.
**Next:** Task 17c-2b — TechStackPage schema + adapter port + repository delegator (audit-driven scope expansion).

---

### Task 17c-2b — TechStackPage schema + adapter port + repository (commit `c1097ba`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/tech-stack-page.ts` (schema + 1 one-direction drift detector)
**Files modified:** `src/lib/adapters/types.ts` (ContentPort extended), `src/lib/adapters/static.ts` (port method + import), `src/lib/repositories/content.ts` (delegator + type import)
**Decisions:**
- Drift detector is one-direction only (`typeof techStackPageContent extends TechStackPageContent`). The literal is `as const` so string values narrow (e.g. `'Tech Stack — yesid.'` instead of `string`); the schema uses open `string`. Reverse direction (`TechStackPageContent extends typeof techStackPageContent`) wouldn't hold and isn't needed — we only care that the runtime literal satisfies the schema.
- Port added unwrapped (no `parsePort`). Task 17c-6 wraps all content-returning ports in one pass.
**Deviations from plan:** None — executed exactly as revised post-audit.
**Tests:** No new test file (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors. Adapter contract test still passes (port added to both the interface and the implementation, so `: ContentAdapter` annotation is satisfied).
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~52% — Comfortable.
**Next:** Task 17c-3 — Blog + SiteMeta + TechStack schemas.

---

### Task 17c-3 — Blog + SiteMeta + TechStack schemas (commit `4a49fe5`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/blog.ts` (3 schemas + 3 detectors), `src/lib/schemas/meta.ts` (4 schemas + 4 detectors), `src/lib/schemas/tech-stack.ts` (6 schemas + 6 detectors)
**Files modified:** `src/lib/schemas/shared.ts` (added `LocaleSchema` as cross-cutting primitive)
**Decisions:**
- `LocaleSchema` placed in `shared.ts` rather than `blog.ts` (plan showed it in blog context, but cross-cutting placement is cleaner — no blog-specific coupling for a Locale enum).
- `SiteOwner.knowsAbout` uses `z.array(z.string()).readonly()`. Verified Zod 4.3.6 supports `.readonly()` on arrays before going bidirectional — otherwise would have fallen to one-direction detector.
- `TechStackItem.connectionNotes` uses `z.record(z.string(), z.string()).optional()` (Zod 4 record signature takes key + value schemas).
- All 13 drift detectors bidirectional. `date` stays `z.string()` per D3 — no `z.iso.date()` tightening.
**Deviations from plan:** `LocaleSchema` location (see decisions). No other deviations.
**Tests:** No new test file (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors.
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~55% — Healthy, avoiding major new directions per AGENTS.md § Session token budget.
**Next:** Task 17c-4 — About + Contact + Nav + Journey + HeroData schemas (biggest task: `about-page.ts` alone has 14 nested schemas).

---

### Task 17c-4 — About/Contact/Nav/Journey/HeroData schemas (commit `8d4f5b0`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/nav.ts` (4 schemas), `src/lib/schemas/journey.ts` (4 schemas), `src/lib/schemas/hero-data.ts` (3 schemas), `src/lib/schemas/contact-page.ts` (6 schemas), `src/lib/schemas/about-page.ts` (14 schemas — largest in the slice)
**Files modified:** `src/lib/schemas/shared.ts` (added `PageMetaSchema`), `src/lib/schemas/tech-stack-page.ts` (replaced inline `meta` shape with shared `PageMetaSchema` — 4-line inline duplication removed)
**Decisions:**
- Added `PageMetaSchema` to `shared.ts` mid-task (not in original plan) — about-page + contact-page both need it, and retrofitting tech-stack-page.ts to use it consolidates the pattern for 3 callers.
- `.readonly()` applied systematically everywhere TS uses `readonly T[]` (AboutContent.metrics/methodology/testimonials/techStack/interests/clientLogos, AboutIdentity.polaroids, AboutCta.lines + socials, AboutTechItem.relatedServices, ContactContent.socials, ErrorPageContent.suggestions). Bidirectional drift detectors compile cleanly because Zod v4's `.readonly()` produces `readonly` in z.infer.
- `NavLink.priority` used `z.union([z.literal(1), z.literal(2)])` per plan note (not z.number() — would lose the narrow 1|2 type).
- `AboutCta.lines[].color` and `HeroMetric.key` mirrored as `z.enum([...])` — free safety, no scope creep (same pattern established in 17c-2 for ProjectStatus).
**Deviations from plan:** Added PageMetaSchema to shared.ts (documented above). Otherwise executed per plan step order (nav → journey → hero-data → contact → about).
**Tests:** No new test files (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors. All ~30 drift detectors across 6 files compile bidirectionally.
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~60% — Healthy, still below pre-break zone.
**Next:** Task 17c-5 — Schemas barrel (index.ts re-exports everything). Small mechanical task.

---

### Task 17c-5 — Schemas barrel (commit `2c95669`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files created:** `src/lib/schemas/index.ts` (barrel with 3 explicit collision resolutions documented)
**Decisions:**
- Pre-scan found 3 name collisions: `LocalizedStringSchema` (shared + seo re-export), `ServiceSchema` (service vs jsonld — two different domains same name), `SchemaOrgNode` type (jsonld + seo re-export).
- Resolution: `export *` for primitives + domain schemas; selective `export { X, Y } from './seo'` and `export { A, B } from './jsonld'` to pick single sources.
- ServiceSchema kept at the domain level (service.ts wins at the barrel). JSON-LD's ServiceSchema + Service type available via direct import `$lib/schemas/jsonld` — this mirrors the explicit-provenance pattern the jsonld adapter already uses.
- Comment at top of `index.ts` documents why selective exports exist so future contributors don't blindly add `export * from './jsonld'`.
**Deviations from plan:** Plan suggested `export * from './jsonld'` with a fallback to named exports "if any surface." I surfaced collisions proactively via grep and went straight to named exports — saved a debug cycle.
**Tests:** No new test file (per plan). Full suite `bun run test` → 960/960 green. `bun run check` → 0 errors.
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~62% — Healthy. Task 17c-6 is the biggest integration task of the slice (13+ wrap sites + 2 seam-leak closures); if it pushes me past 65% pre-break zone, I'll STOP for a fresh session per AGENTS.md.
**Next:** Task 17c-6 — Wire parsePort into every staticAdapter content port + close the 2 17b seam leaks (service-svg param injection + tech-stack route via load function). Biggest task in the slice.

---

### Task 17c-6 — Wire parsePort + close 17b seam leaks (commit `28f9364`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files modified:** `src/lib/adapters/static.ts` (21 wrap sites), `src/lib/utils/service-svg.ts` (param injection), `src/routes/projects/+page.ts`, `src/routes/services/+page.ts`, `src/routes/services/[id]/+page.ts` (all 3 thread services through), `src/routes/tech-stack/+page.ts` (add `getTechStackPageContent()` call), `src/routes/tech-stack/+page.svelte` (consume `data.techStackPage`, drop direct import)
**Decisions:**
- Site-chrome ports (hero/heroAnim/manifesto/proofReel/servicesGrid/about/cta/closer/skillsJourneyCta) left unwrapped per spec D2 non-goal. Added a comment header in the `content` block of `static.ts` documenting this so the intent is visible at the wrap site.
- Utility ports (allTags, allStackItems, serviceIdsForProjects, connections, incomingConnections, content, html, svgContent, svgContentsForPosts, resolveSvgFallbackName, tagsForCategory, languagesForCategory) left unwrapped — they return primitives/strings/records, no schema needed.
- Route loader refactors preserved parallelism where possible — `routes/services/+page.ts` in particular uses a nested `Promise.all([fetchServiceSvgContents(...), Promise.all(services.map(...))])` so both dependents of `services` run in parallel after the first await.
- Kept `PageSeoSchema` import from `$lib/schemas/seo` directly (not via barrel) since it's pre-existing and the barrel comment calls this pattern out as valid for explicit provenance.
**Deviations from plan:** None material. Plan's Step 6 suggested the `+page.svelte` change might require `data.content ?? data` pattern-matching; actual fix was simpler (one-line `const c = data.techStackPage`).
**Tests:**
- `bun run check` → 0 errors (20 warnings — 1 new is the same `data` reference pattern as existing `data.items` warnings, not a regression class).
- `bun run test` → 95 files / 960 tests / all green. First run saw 2 file-level timeouts (vitest-pool-runner under heavy concurrency); re-ran clean.
- `bun run build` → `✓ built in 1m 9s`. SSR exercises every port. Sitemap coverage test passed.
- `rg "from '\$lib/content/" src/lib/utils/ src/routes/tech-stack/` → empty. Both 17b seam leaks closed.
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~68% — Pre-break zone (65-80%). I'll finish 17c-7 if approved, then strongly consider a fresh session for 17c-8.
**Next:** Task 17c-7 — Trim `integrity.test.ts` + add seed-parses-clean smoke tests.

---

### Task 17c-7 — Trim integrity.test.ts + seed-parses-clean (commit `a9573da`)

**Tool:** Claude Code (Opus 4.7)
**Implemented by:** deeper-reasoning model
**Files modified:** `src/lib/content/integrity.test.ts` (trim + add)
**Decisions:**
- Net line change: **+74** (380 → 454). Plan's `-150` was aspirational; the 15 new parse tests simply add more lines than the 5 removed per-field assertions. Called out explicitly in commit body so the metric isn't a surprise.
- Kept the LocalizedString walker + translation-debt snapshot — it's the ONLY enforcement for site-chrome literals (heroContent/manifestoContent/etc.) that spec D2 carves out of schema validation. Removing it would create a silent regression path for those strings.
- Added inline comments at each removal site pointing to the schema that now covers the rule, so a future reader understands why the assertion is gone and where to look.
- Kept `.trim() !== ''` checks on required non-LocalizedString strings (service.id, siteMeta.links.email, etc.) per plan note — schema uses `.min(1)` which allows whitespace-only. Tightening the schemas would be D3 scope creep.
**Deviations from plan:** Line-count delta noted above. Otherwise followed plan exactly.
**Tests:**
- `bun run check` → 0 errors.
- `bun run test` → 95 files / **968 tests** / all green (was 960; +15 new parse smoke tests − 7 removed per-field assertions).
- Integrity file alone: 44/44 pass (was 29, +15 net from +15 added − 0 real removals at the test-count level since the removed ones were delete-whole-`it`-blocks superseded by new `describe`).
**Budget row:** Model: Opus 4.7 `[1m]` | Context: ~72% — Pre-break zone. Task 17c-8 is finalization (ARCHITECTURE.md update + slice-17 README + handoff summary + PR open). STRONGLY recommend a fresh session for 17c-8 — cache invalidation cost is amortized since the task involves writing a summary/PR body over known state, no further reading-heavy exploration.
**Next:** Task 17c-8 — ARCHITECTURE.md update + slice-17 README row flip + handoff finalization + open PR.

---

## Audit snapshot (2026-04-20, pre-implementation)

Parallel audits by Claude Explore and Codex agreed on:
- **Q2** port matrix drift: 55/55 ports match the plan — zero drift
- **Q3** existing Zod usage: only at 15a (`PageSeoSchema`) and 15b (`SchemaOrgNodeSchema`) — no ad-hoc validation to preserve or consolidate
- **Q4** seed data: clean — all enum fields match TS unions, no whitespace-only `LocalizedString.en`

Audits diverged on Q1 (seam isolation). Reconciliation: the 40 component-level chrome imports + type-only imports in `repositories/content.ts` are by-design per spec D2 non-goal. Two **real pre-existing 17b seam leaks** surfaced and were folded into 17c scope via spec D8:

1. `src/lib/utils/service-svg.ts:11` runtime-imports `{ services }` from `$lib/content/services` (fix: param injection — Task 17c-6 Step 5)
2. `src/routes/tech-stack/+page.svelte:6` runtime-imports `{ techStackPageContent }` (fix: new `content.techStackPage()` port — Task 17c-2b; route consumes via load function — Task 17c-6 Step 6)

## Out-of-scope discoveries (defer)

*Populated during implementation if audit-style findings surface that don't belong in 17c scope.*

## PR body

### Slice 17c — Zod Schema Validation

Runtime contract for every adapter port. Every content read flows through a Zod schema at the `staticAdapter` boundary before reaching repositories. When Payload (Slice 18) swaps in as the adapter, its emitted data must satisfy the same schemas — contract violations fail loudly at the boundary with port-labelled errors (`[adapter.projects.all] ...`).

**What this unlocks:** Slice 18 can swap the adapter implementation with zero repository or component changes. The schemas are the contract; the adapter enforces it.

#### Summary

- **15 new schema files** in `src/lib/schemas/` mirroring every TS interface in `$lib/types.ts` (projects, services, blog, site-meta, tech-stack, tech-stack-page, about-page, contact-page, nav, journey, hero-data + shared primitives).
- **`parsePort(label, schema, value)` helper** wraps every adapter-boundary parse call so thrown errors name the port that produced bad data. Critical for Slice 18 debugging.
- **~35 bidirectional drift detectors** (`z.infer extends T ? T extends z.infer ? true : false`) catch TS/Zod divergence at compile time.
- **21 `parsePort` wrap sites** across `projects`, `services`, `blog`, `meta`, `techStack`, `content` ports. Site-chrome literals (`heroContent`, `manifestoContent`, etc.) intentionally NOT wrapped per spec D2 — they're `typeof import` literal types, not CMS-managed content.
- **2 pre-existing 17b seam leaks closed** (audit-driven scope expansion):
  - `src/lib/utils/service-svg.ts` — refactored `fetchServiceSvgContents(fetchFn)` → `fetchServiceSvgContents(fetchFn, services)`; 3 route loaders thread services through.
  - `src/routes/tech-stack/+page.svelte` — dropped direct `$lib/content/tech-stack` import; page chrome now flows via `+page.ts` → `getTechStackPageContent()` → `adapter.content.techStackPage()` → `parsePort`.
- **`integrity.test.ts` trimmed + augmented** — removed 5 per-field assertions now covered by Zod (status enum, LocalizedString.en non-empty checks); added 15 seed-parses-clean smoke tests (one per content file). Cross-entity invariants (relatedServices refs, URL-safe slugs, station sequencing) kept. LocalizedString walker + translation-debt snapshot kept — covers site-chrome literals D2 carves out of schema validation.

#### Spec design decisions (D1–D8)

- **D1 Mirror, don't replace** — TS interface stays primary; schemas mirror with `z.infer extends T` drift detector.
- **D2 Validate at adapter boundary, never below** — every content-returning port parses; repositories and components consume already-parsed data.
- **D3 Strictness budget** — schemas match TS as-is; no new URL/email/slug tightening. Only pre-existing enum unions and the 15a LocalizedString.en non-whitespace refine are encoded.
- **D4 Error shape: `z.ZodError` direct via `parsePort` prefix** — `[adapter.<port>] <zod error>`.
- **D5 One file per domain** — 15 schema modules in `src/lib/schemas/`.
- **D6 Integrity tests: keep, but layer** — per-field assertions removed, cross-entity kept, seed-parses-clean added.
- **D7 `image` stays `string`** — Project.image is a static asset filename, not a URL.
- **D8 Close 17b seam leaks** — added post-audit; expands scope from 8 to 9 tasks, still M-size.

#### Pre-implementation audit

Parallel audits by Claude Explore and Codex ran before any code landed. Both confirmed:
- 55/55 port matrix between `staticAdapter` surface and plan matrix — zero drift
- Seed data clean across all enums and LocalizedStrings
- Existing Zod usage isolated to 15a SEO and 15b JSON-LD — no ad-hoc validation to preserve

Audits diverged on seam isolation (Q1). Reconciliation surfaced two real 17b leaks that were folded into 17c scope via spec D8 + new Task 17c-2b, rather than deferred.

#### Test plan

- [x] `bun run check` — 0 errors (19-20 pre-existing warnings, 1 new is a `data` reference pattern matching existing `data.items` warnings — not a regression class)
- [x] `bun run test` — 95 files / 968 tests / all green (was 960; +15 new parse smoke tests − 7 removed per-field assertions)
- [x] `bun run build` — `✓ built in 1m 9s`; SSR exercises every port, no parse errors
- [x] `rg "from '\$lib/content/" src/lib/utils/ src/routes/tech-stack/` — empty (both 17b seam leaks closed)
- [ ] Manual smoke test of `/tech-stack` route post-merge (chrome content flows through load function; visual must be unchanged — pre-flight expectation)
- [ ] Post-merge: `bun run slice:close 17 17c` → mirrors bundle to cloud + appends `COMPLETED-SLICES.md`

#### Files changed

32 files, +2,537 / −110. Full breakdown in [handoff.md](../slice-17c/handoff.md).

#### Follow-up (out of scope, noted for tracking)

- Future `unknown`-boundary audit (fetch responses, form data, URL params) — deferred.
- Schema-derived test factories — owned by Slice 17f (Test Architecture).
- Learning doc `docs/learn/data-layer/zod-validation.md` — owned by Slice 17g (Learning Docs Refactor).
