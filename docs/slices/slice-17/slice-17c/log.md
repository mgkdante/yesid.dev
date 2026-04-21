# Sub-Slice 17c — Zod Schema Validation · Running Log

**Plan:** [`./plan.md`](./plan.md)
**Branch:** `feature/slice-17c-zod-schemas`

---

### Session 2026-04-20 20:50 — Task 17c-1
**Tool:** Claude Code (Opus 4.7, reasoning=normal)
**Session type:** Implementation
**Picking up from:** `f00db1e docs(slice-17c): spec + plan + handoff stub` (planning artifacts landed on feature branch)

**Plan (this session):** Execute Task 17c-1 (parsePort + shared LocalizedStringSchema). If context-budget allows, continue to 17c-2 with Yesid's approval; otherwise STOP.

#### Task 17c-1 — Shared primitives + parse helper
- Pre-flight: `staticAdapter` uses `LocalizedStringSchema` only via `seo.ts` imports (grep confirmed) — relocation is safe.
- TDD flow:
  1. Wrote `parse.test.ts` with 6 cases (pass-through, error tagging, Zod error context, arrays, optional, narrow-type preservation). Ran → FAIL (no `parse.ts` yet). ✓ RED
  2. Wrote `parse.ts` per plan canonical pattern (`safeParse` + prefix thrown error with `[adapter.<label>]`). Ran parse.test.ts → 6/6 pass. ✓ GREEN
  3. Created `shared.ts` with `LocalizedStringSchema` (including the `.refine` non-whitespace check — unchanged from 15a).
  4. Edited `seo.ts` to `import { LocalizedStringSchema } from './shared'` + `export { LocalizedStringSchema }` re-export. Internal uses (title/description/alt refines) work unchanged.
- Verification:
  - `bun run test` → 95 files / 960 tests / all pass (ECONNREFUSED :3000 noise from unrelated preview-server check — ignored per pre-existing pattern).
  - `bun run check` → 0 errors, 19 pre-existing warnings (none touching the schema files).
- Decisions: None — followed plan canonical pattern exactly.
- Deviations: None.
- Commit: `9f1b79a feat(slice-17c): add parsePort helper + shared LocalizedStringSchema`

**STOP.** Awaiting Yesid approval before starting Task 17c-2.

#### Task 17c-2 — Project + Service schemas (approved → executed)
- Read `src/lib/types.ts` to map Project / ProjectSection / ImpactMetric / ProjectStatus + Service / ServiceSection + home-grid `ServiceImpactMetric` shapes.
- Wrote `project.ts` with `ProjectStatusSchema` (z.enum), `ProjectSectionSchema`, `ImpactMetricSchema`, `ProjectSchema` + 4 bidirectional drift detectors.
- Wrote `service.ts` with `ServiceSectionSchema`, inline `ServiceImpactMetricSchema` (different shape from Project's — both value+label are LocalizedString here), `ServiceSchema` + 2 drift detectors.
- No URL/slug tightening applied (spec D3). Only `.min(1)` on `slug` and `id` to prevent empty strings — already covered by TS `string`, but `.min(1)` matches how `PageSeoSchema` handles required short strings.
- `bun run check` → 0 errors, 19 pre-existing warnings. Drift detectors compile cleanly in both directions.
- `bun run test` → 960/960 green.
- Skipped formal seed-parses-clean test per plan (deferred to Task 17c-7 + integrity.test.ts).
- Commit: `54da6d5 feat(slice-17c): add ProjectSchema + ServiceSchema with drift detectors`

**STOP.** Awaiting Yesid approval before starting Task 17c-2b.

#### Task 17c-2b — TechStackPage schema + adapter port + repository (approved → executed)
- Wrote `tech-stack-page.ts` — schema mirrors `techStackPageContent` shape (meta.title/description, hero.overline/titleLine1/titleLine2/terminalAria/stats{technologies,layers,domains,projects}, actions.getInTouch/viewServices, cta.headingLine1/headingLine2/sub/availability). Drift detector uses one-direction `typeof literal extends schema` — reverse would fail because the `as const` literal narrows string values while the schema uses open `string`.
- Extended `ContentPort` in `adapters/types.ts`: added `techStackPage: () => Promise<TechStackPageContent>` + type import from `$lib/schemas/tech-stack-page`.
- Extended `staticAdapter.content` in `adapters/static.ts`: added `techStackPage: async () => techStackPageContent` port method (unwrapped — Task 17c-6 will wrap with `parsePort`). Imported `techStackPageContent` alongside existing tech-stack exports.
- Added `getTechStackPageContent(): Promise<TechStackPageContent>` delegator in `repositories/content.ts`.
- `bun run check` → 0 errors, 19 pre-existing warnings.
- `bun run test` → 960/960 green (adapter contract test passes — port added, nothing broken).
- Commit: `c1097ba feat(slice-17c): add techStackPage port + TechStackPageContentSchema`

**STOP.** Awaiting Yesid approval before starting Task 17c-3.

#### Task 17c-3 — Blog + SiteMeta + TechStack schemas (approved → executed)
- Confirmed Zod 4.3.6 — `.readonly()` available, so `SiteOwner.knowsAbout: readonly string[]` can mirror bidirectionally.
- Decision: `LocaleSchema` added to `shared.ts` (cross-cutting primitive used by blog and potentially future schemas) rather than blog.ts. Plan note allowed judgment here.
- Wrote `blog.ts`: `BlogCategorySchema`, `BlogAnimationSchema`, `BlogPostSchema`. `date` stays `z.string()` per D3. 3 bidirectional drift detectors.
- Wrote `meta.ts`: `SiteLinksSchema`, `SiteAddressSchema`, `SiteOwnerSchema` (with `.readonly()` on `knowsAbout`), `SiteMetaSchema`. 4 bidirectional drift detectors.
- Wrote `tech-stack.ts`: `InfraLayerSchema` (9 variants), `DomainClusterSchema` (7 variants), `ProficiencySchema` (3 variants), `TechStackItemSchema` (incl. `z.record(z.string(), z.string()).optional()` for `connectionNotes`), `TechRelationSchema`, `StackScenarioSchema`. 6 bidirectional drift detectors.
- `bun run check` → 0 errors, 19 pre-existing warnings.
- `bun run test` → 960/960 green.
- Commit: `4a49fe5 feat(slice-17c): add BlogPost, SiteMeta, TechStack schemas`

**STOP.** Awaiting Yesid approval before starting Task 17c-4.

#### Task 17c-4 — About/Contact/Nav/Journey/HeroData schemas (approved → executed)
- Pre-work: added `PageMetaSchema` to `shared.ts` (used by about-page + contact-page, and refactored tech-stack-page.ts to use it too — removes a 4-line inline duplication).
- Wrote `nav.ts`: 4 schemas (NavLink with `priority: 1 | 2` as z.union of z.literal per plan note, MenuItem, MetroBookends, ErrorPageContent with `.readonly()` on suggestions array).
- Wrote `journey.ts`: 4 schemas (HighlightEffect enum, SkillIcon enum, JourneySkill, JourneyPanel).
- Wrote `hero-data.ts`: 3 schemas (HeroMetric with `key: z.enum(['vehicles','delay','routes'])`, HeroQueryRow, HeroData).
- Wrote `contact-page.ts`: 6 schemas (terminal field, info terminal, form terminal, validation, success, ContactContent with `.readonly()` on socials array). `meta` uses shared PageMetaSchema.
- Wrote `about-page.ts`: **14 schemas** — AboutPolaroid, AboutIdentity (readonly polaroids), AboutMetric, AboutMethodStep, AboutTestimonial, AboutTechItem (TechCategory enum, readonly relatedServices), AboutInterest, AboutWeatherConfig, AboutClientLogo, AboutCta (lines color z.enum, readonly lines, readonly socials), AboutStopLabels, AboutLabels, AboutContent (readonly on metrics/methodology/testimonials/techStack/interests/clientLogos). Plus TechCategory enum itself.
- Refactored `tech-stack-page.ts` to import `PageMetaSchema` from shared (cleanup).
- `bun run check` → 0 errors, 19 pre-existing warnings. All ~30 drift detectors compile bidirectionally.
- `bun run test` → 960/960 green.
- Commit: `8d4f5b0 feat(slice-17c): add About, Contact, Nav, Journey, HeroData schemas`

**STOP.** Awaiting Yesid approval before starting Task 17c-5.

#### Task 17c-5 — Schemas barrel (approved → executed)
- Pre-scan for name collisions via grep across all `src/lib/schemas/*.ts` exports. Found 3 collisions:
  1. `LocalizedStringSchema` — shared.ts (source) + seo.ts (back-compat re-export).
  2. `ServiceSchema` — service.ts (ContentAdapter domain) + jsonld.ts (schema.org @type="Service"). Same name, different concepts/shapes.
  3. `SchemaOrgNode` type — jsonld.ts (source) + seo.ts (re-export).
- Resolution: barrel uses `export *` for domain + primitives, selective exports for seo + jsonld to pick single sources. Callers needing the JSON-LD ServiceSchema still import from `$lib/schemas/jsonld` directly (explicit provenance) — no breaking change.
- Top-of-file comment documents the collision decisions so future contributors don't re-introduce `export * from './jsonld'`.
- `bun run check` → 0 errors.
- `bun run test` → 960/960 green.
- Commit: `2c95669 feat(slice-17c): barrel export for schemas`

**STOP.** Awaiting Yesid approval before starting Task 17c-6 (the big one — adapter wiring + both seam-leak closures).

#### Task 17c-6 — Wire parsePort + close 17b seam leaks (approved → executed)
- Imports: added `import { z } from 'zod'` + bulk-imported 17 schemas + `parsePort` from the `$lib/schemas` barrel into `adapters/static.ts`. Kept `PageSeoSchema` from `$lib/schemas/seo` (pre-existing, direct-import is valid for explicit provenance).
- Wrapped every content-returning port per plan matrix. Site-chrome literals (hero/heroAnim/manifesto/proofReel/servicesGrid/about/cta/closer/skillsJourneyCta) left unwrapped per spec D2 non-goal. Utility ports (projects.allTags, blog.html, techStack.content, etc.) left unwrapped — they return primitives/strings.
- Seam leak #1: `service-svg.ts` signature changed to `fetchServiceSvgContents(fetchFn, services: readonly Service[])`. Removed `import { services } from '$lib/content/services'`. Updated 3 callers: `routes/projects/+page.ts` (await services first, then Promise.all), `routes/services/+page.ts` (restructured so SVG fetch + related-projects fan-out stay parallel after services resolves), `routes/services/[id]/+page.ts` (same pattern).
- Seam leak #2: `routes/tech-stack/+page.ts` now calls `getTechStackPageContent()` via the repository; `+page.svelte` dropped the `$lib/content/tech-stack` import and reads `const c = data.techStackPage` instead. Seam now flows through the adapter.
- Test gotcha encountered: first `bun run test` run returned 2 test-file failures due to a vitest-pool-runner timeout (heavy concurrency on Windows). Re-ran and got clean 960/960 green. Not a parsePort issue — environmental flakiness.
- Verification:
  - `bun run check` → 0 errors (20 warnings incl. 1 new pre-existing-pattern warning on `data.techStackPage` reference — same `data.items` pattern that was already there).
  - `bun run test` → 95 files / 960 tests / all green.
  - `bun run build` → `✓ built in 1m 9s`. SSR path exercises every port; no parse errors surfaced. Sitemap coverage test also passed.
  - `rg "from '\$lib/content/" src/lib/utils/ src/routes/tech-stack/` → empty. Both seam leaks closed.
- Commit: `28f9364 feat(slice-17c): wire parsePort into staticAdapter + close 17b seam leaks`

**STOP.** Awaiting Yesid approval before starting Task 17c-7.

#### Task 17c-7 — Trim integrity.test.ts + seed-parses-clean smoke tests (approved → executed)
- Removed per-field assertions superseded by Zod (with inline comments pointing to the covering schema):
  - Project status enum check (covered by ProjectStatusSchema).
  - Project title/oneLiner/description LocalizedString.en non-empty (LocalizedStringSchema.refine).
  - Service title/description LocalizedString.en non-empty.
  - BlogPost title/excerpt LocalizedString.en non-empty.
  - SiteMeta tagline/description LocalizedString.en non-empty.
  - Dropped the `VALID_STATUSES` constant (no longer referenced).
- Added new `describe('seed data parses through schemas')` block with 15 smoke tests — one per content constant that staticAdapter now wraps. Mirrors the Task 17c-6 wrap matrix so a missing schema surfaces here immediately.
- Kept cross-entity invariants (relatedServices/relatedProjects refs, unique slugs, station sequencing, URL-safe slug regex, SVG filename check, brand-name exact match, blog ISO date, .trim() non-empty for non-LocalizedString required strings).
- Kept the LocalizedString walker + translation-debt snapshot — it walks site-chrome literals (heroContent/manifestoContent/etc.) that D2 carves out of schema validation, so those strings still get `en` non-empty enforcement here.
- Line count: 380 → 454 (**net +74**, not -150 as plan targeted). Plan's estimate was aspirational — the 15 new parse tests add more lines than the 5 removed. Value is semantic layering, not line count. Noted in commit body.
- `bun run check` → 0 errors.
- `bun run test` → 95 files / **968 tests** / all green (was 960; +15 new parse tests − 7 removed assertions = net +8).
- Commit: `a9573da refactor(slice-17c): layer integrity tests with schema parse + keep cross-entity invariants`

**STOP.** Awaiting Yesid approval before starting Task 17c-8 (final: ARCHITECTURE.md + slice-17 README update + handoff finalization + PR prep).
