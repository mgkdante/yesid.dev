# slice-18i closing notes

**Closed:** 2026-04-29
**Tip commit:** `b125ed7` (45 commits ahead of `main` at e417379)
**PR:** _filled in by /workflow-close-slice_

## What shipped

Slice-18i migrates yesid.dev's 7 page-chrome routes from static TS modules to a
Directus M2A `pages` collection with 12 polymorphic block collections, plus
flat `nav_links` and `error_pages` collections. All 18 `ContentPort` methods
route through `directusAdapter` after this slice — `staticAdapter.content`
remains as the per-method revert recipe per spec §3.6 until 18k.

### Architecture delivered

- **Schema (Phase 1)**: 30 directus-sync collections / 214 fields / 31 relations
  authored offline. P10 query-size probe = 1156 bytes (well under any limit).
  `pages_blocks` M2A junction is **deferred to first push** (Path B per Phase 1
  review — see "Known incomplete" in `phase-1-schema-inventory.md`).
- **Seed (Phase 2)**: `apps/cms/scripts/seed-pages-and-blocks.ts` reads from
  `apps/cms/fixtures/content/*.json` (cross-repo isolation per D12), produces
  row payloads for 7 pages + 12 blocks + 12 translations × 3 locales + 15
  nav_links + 3 error_pages. `--dry-run` exits clean offline. Live execution
  defers to post-merge per `feedback_serial_cms_pushes.md`.
- **loadPage helper (Phase 3)**: single deep-fields query per route per
  request (`pages.*`, `translations.*`, `blocks.*`, `blocks.item:block_X.*`
  for all 12 collections), memoized via `event.locals.pageCache`. parsePort
  gate at the adapter boundary (`pages.bySlug`).
- **Translation merge (Phase 4)**: `transformPageRow` walks raw Directus rows
  and produces typed `PageData` matching the `LocalizedString`-shaped Zod
  schemas in `@repo/shared`. 12 block-specific transforms apply field-aware
  logic (LocalizedString leaves merge per-locale; plain strings/URLs/IDs read
  from the en-row directly).
- **ContentPort flip (Phase 4)**: 13 methods (hero/heroAnim/manifesto/proofReel/
  servicesGrid/about/cta/closer/aboutPage/contactPage/techStackPage/heroMock/
  initialHeroData) routed via Pattern A (0–1 cardinality, `find` by collection,
  fail-fast on missing). heroMock + initialHeroData are derived shims that
  don't query Directus.
- **Nav + error pages (Phase 5)**: `NavPort.byPlacement(placement)` reads
  nav_links by enum slot. `+layout.server.ts` aggregates all 4 nav placements
  + the errorPage(0) generic fallback into `data` for `+error.svelte` (since
  SvelteKit error pages have no companion loader). content.errorPage(statusCode)
  reads error_pages with status_code=0 fallback.
- **Tests (Phase 6)**: 1092 unit/integration tests pass; 9 E2E pass + 2
  env-gated skip (`/about`, `/tech-stack` ungated when `CMS_LIVE=true`).
  Coverage: directus.ts 81.35%, page.ts 100%, +layout.server.ts 100%.

### Acceptance gates met (pre-merge)

- ✅ All 12 block types schema-authored + Zod-validated
- ✅ All 18 ContentPort methods route through directusAdapter
- ✅ nav_links drives header/footer/mobile/menu via `placement` enum
- ✅ error_pages with status_code=0 fallback via +error.svelte
- ✅ ≥80% coverage on directus.ts; 100% on page.ts + +layout.server.ts
- ✅ E2E across 7 routes + 1 error route (2 env-gated)
- ✅ parsePort gate at adapter boundary (loadPage)
- ✅ 18c CONVENTIONS preserved (parsePort, asset(), no archived in status enum)
- ✅ `bun run check` 0 errors
- ✅ `bun run test` all green; no regressions

### Acceptance gates deferred to post-merge

These cannot be exercised pre-merge because live Directus push is serialized
to post-merge per `feedback_serial_cms_pushes.md`:

- ⏸ All 7 routes render from Directus M2A (visual diff identical to static)
- ⏸ Integration tests against seeded Directus (Task 6.3)
- ⏸ `pages_blocks` M2A junction auto-materializes + directus-sync pull
  captures it into snapshot
- ⏸ Permissions / deep-query shape / FK expansion / translation row coverage /
  seed data all proven against live Directus

See `phase-1-schema-inventory.md` for the full post-merge integration
checklist.

## Notable cleanups

- **Dead-chain removal (Task 1.0a, commit `55840c1`)**: `skillsJourneyPanels`,
  `skillsJourneyCta`, `metroBookends` removed from `ContentPort` along with
  ~14 supporting files (schemas/journey, utils/journey-shapes, repository
  helpers getMetroStops/getStopByType/getTotalStops/formatStopLabel/
  formatServicesLabel + MetroStop type, static content + tests, @repo/shared
  types JourneyPanel/SkillsJourneyCtaContent/MetroBookends). Spec L7 added to
  document the drop. Net schema: 12 block collections (was 13).
- **Web schema relocation (Task 1.1 Phase B, commit `5078138`)**: 3 web-app
  block schemas (`about-page`, `contact-page`, `tech-stack-page`) + their
  shared helpers (`LocalizedStringSchema`, `PageMetaSchema`) moved from
  `apps/web/src/lib/schemas/` to `@repo/shared/src/schemas/`. Workspace-
  direction-clean (`@repo/shared` no longer pretends to depend on apps/web
  via implicit re-exports).

## Boundary review summary

| Phase | Tool | Critical | High | Suggestions | Closed in |
|---|---|---|---|---|---|
| 1 | Gemini | 1 (M2A junction) | 1 (tech_stack/client_logos placement) | 3 | Path B + `377401c` |
| 2 | Gemini | 1 (deleteItems API) | 1 (3 dropped fields) | 2 | `a40f94b` |
| 3 | Gemini | 0 | 0 | 2 | (no fix-up needed) |
| 4 | codex (gemini RESOURCE_EXHAUSTED) | 2 (title not extracted; over-localization) | 2 (rawPageRowCache; hidden_transit_lines) | 2 | `3115cfb` |
| 5 | Gemini | 1 (errorPage data passthrough) | 0 | 3 | `233614e` |
| 6 | codex (gemini timeout) | 0 (false alarm — bash cwd reverted) | 4 (E2E lenient; smoke too generic; docs too strong; layout.server 0%) | 3 | `b125ed7` |

Total over the slice: 5 critical, 8 high, 15 suggestions surfaced — all
critical + all high closed before close-out. Suggestions either applied or
left for backlog when low-value.

## Deferred follow-ups (backlog)

These are intentionally deferred — surface them when picking up the relevant
follow-up slice (likely 18j+ or unrelated cleanup work):

1. **Eager `errorPage(0)` fetch in +layout.server.ts on every request**
   (Phase 5 suggestion). Could stream as unawaited Promise via SvelteKit's
   `#await` block to remove the happy-path latency. Marginal win; defer until
   a perf pass surfaces it.

2. **`transformErrorPage` zip-by-index for `suggestions[]`** (Phase 5
   suggestion). Fragile if editors reorder suggestion entries differently
   per locale. Fix: key suggestions by a stable ID (e.g., href) when merging
   across locales. Defer until editorial workflow exposes the issue.

3. **`+error.svelte` empty-string title fallback** (Phase 4 fix-up nit).
   `transformPageRow` emits `title: ""` when neither top-level nor
   translations title exists. Either tighten `PageSchema.title` to
   `z.string().min(1)` (rejects empty) or only set title when found.

4. **`as never` casts in pages.test.ts transform inputs** (Phase 6
   suggestion). Cleanup: type transform signatures as
   `Record<string, unknown>` at the boundary OR introduce a typed `RawBlock`
   helper alias. Cosmetic; defer.

5. **Single-file mega seed script (1179 LOC)** (no review flagged this; my
   read). Could split per-block into `seed-pages-and-blocks/<block>.ts` files
   when the script grows further. Defer until live runs reveal pain points.

6. **`block_blog_page_content` and `block_projects_page_content` field
   shapes** (per spec R2). Currently minimal stubs (`intro: LocalizedString`).
   Lock the field set when the /blog and /projects page chrome design
   solidifies. Tracked in `contentport-mapping.md` Open follow-ups.

## Lessons / patterns worth carrying forward

- **Boundary reviews catch real bugs**: every phase boundary review surfaced
  at least one real defect that mocked tests had missed (over-localization,
  rawPageRowCache, errorPage data passthrough). The cumulative pattern
  caught 5 critical + 8 high before any of them shipped to live.
- **Field-aware transforms beat broad helpers**: Phase 4's initial
  `toLocalizedJSON` over-localized everything; Phase 4 fix-up had to rewrite
  3 transforms with hand-coded field-aware logic. Lesson: when a TS schema
  mixes LocalizedString with plain strings/IDs, write per-block transforms
  rather than relying on a generic merge helper.
- **Gemini → codex fallback works**: Gemini hit RESOURCE_EXHAUSTED twice
  during the slice (Phase 4, Phase 6). Codex picked up cleanly with the
  same diff and produced equivalent-quality findings.
- **Path B (defer to post-merge) beat speculation**: rather than authoring
  the `pages_blocks` M2A junction JSONs blind, the Phase 1 review chose to
  let Directus auto-materialize on first push and capture via
  `directus-sync pull`. Avoids guessing at JSON shape the codebase has no
  prior art for.
- **Cross-repo isolation matters**: Task 2.1 initially planned to import
  static content from `apps/web` directly. The implementer (correctly)
  copied to `apps/cms/fixtures/content/` instead — `apps/web` uses
  SvelteKit `$lib/*` aliases that don't resolve from `apps/cms`. D12 win.
- **TodoWrite + 7-phase boundary cadence is the right granularity**: 6
  cumulative reviews × 1 phase apart kept review cost amortized while
  catching defects early. Per-task reviews would have added ~25 review
  cycles for marginal gain.
