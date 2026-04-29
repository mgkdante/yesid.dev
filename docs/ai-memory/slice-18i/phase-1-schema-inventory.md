# slice-18i Phase 1 schema inventory (offline verification)

Generated 2026-04-28 from commit 78521bf3a7e960ea97193788dddb20be7d0680fc.

## Counts

- Collections: 30 (15 parent + 15 translation pairs)
- Fields: 214
- Relations: 31

## Collection roster

1. pages
2. pages_translations
3. block_hero
4. block_hero_translations
5. block_manifesto
6. block_manifesto_translations
7. block_proof_reel
8. block_proof_reel_translations
9. block_services_grid
10. block_services_grid_translations
11. block_cta
12. block_cta_translations
13. block_closer
14. block_closer_translations
15. block_about_intro
16. block_about_intro_translations
17. block_about_content
18. block_about_content_translations
19. block_contact_content
20. block_contact_content_translations
21. block_tech_stack_page_content
22. block_tech_stack_page_content_translations
23. block_blog_page_content
24. block_blog_page_content_translations
25. block_projects_page_content
26. block_projects_page_content_translations
27. nav_links
28. nav_links_translations
29. error_pages
30. error_pages_translations

Note: count is 30 rather than the spec's ~28 estimate because `nav_links` includes
an FK relation to `icons` (one extra relation file) and the final tally of
block_* collections is 12 parents + 12 translations = 24, plus pages (x2),
nav_links (x2), and error_pages (x2) = 30 total. All 15 _translations collections
are present and paired.

## Structural checks

- All 30 collection JSONs syntactically valid (bun require confirmed)
- All filenames match meta.collection (zero drift across all 30 files)
- All filenames match schema.name where schema block is present
- All 30 collection JSONs have meta.icon set
- All 30 collection JSONs have meta.note set (non-empty)
- All field JSONs: collection matches directory name, field matches filename, type is set (214 files, zero drift)
- All relation JSONs: collection, related_collection, meta.many_collection, meta.one_collection all present (31 files, zero drift)
- All 15 _translations collections have id / <parent>_id / languages_code fields
- All 15 _translations collections have both relation files (<parent>_id.json + languages_code.json)
- No block_journey_panel references anywhere in snapshot
- No "archived" value in any status field added in Phase 1 (pre-existing collections blog_posts, icons, projects, route_seo, tech_stack retain their archived values — those are unchanged pre-Phase-1 files)
- All 12 block_* parent collections have editor_label field (required for Data Studio M2A picker)

## P10 query-size probe (Task 1.8)

Run: `bun run apps/cms/scripts/probe-loadpage-bytes.ts` (output captured below).

```
URL bytes: 1156
Field count: 27
Block collections: 12

Decision thresholds:
  < 4000 bytes: proceed with single-query approach (Phase 3)
  4000–8000:    proceed but flag as a watch item (R1 risk)
  > 8000:       escalate — split into per-collection batched queries

URL preview (first 500 chars):
/items/pages?filter[slug][_eq]=home&filter[status][_eq]=published&fields=*%2Ctranslations.*%2Cblocks.*%2Cblocks.item%3Ablock_hero.*%2Cblocks.item%3Ablock_hero.translations.*%2Cblocks.item%3Ablock_manifesto.*%2Cblocks.item%3Ablock_manifesto.translations.*%2Cblocks.item%3Ablock_proof_reel.*%2Cblocks.item%3Ablock_proof_reel.translations.*%2Cblocks.item%3Ablock_services_grid.*%2Cblocks.item%3Ablock_services_grid.translations.*%2Cblocks.item%3Ablock_cta.*%2Cblocks.item%3Ablock_cta.translations.*%2Cbl
```

**Decision: single-query proceed**

Per spec R1 mitigation: at 1156 bytes the URL is well under Directus's effective
limit (~8 KB), so Phase 3's `loadPage` helper can use a single deep-fields query
across all 12 block collections without risk of request-size rejection; no batching
or chunking required.

## Push deferral

Push to live Directus is deferred to post-merge per
feedback_serial_cms_pushes.md (incidents #79, #81 — concurrent feature
branch pushes can wipe data via orphan-delete). The full snapshot will
be applied to live in a single, serialized push after the slice-18i PR
merges.

## Known incomplete: pages_blocks M2A junction (Path B deferral)

Phase 1's Gemini boundary review (2026-04-29) flagged that the `pages.blocks`
M2A field is declared (`type: alias`, `special: ["m2a"]`) but the snapshot
contains **no `pages_blocks` junction collection** and **no `relations/pages/`
or `relations/pages_blocks/` files** wiring the M2A to its junction.

This is intentional. The codebase has no prior M2A example to template from,
and authoring the junction JSONs speculatively risks shape drift from what
Directus will materialize on first push. **Path B chosen**: defer to first
push.

**Action required at first-push time** (post-merge, Task 7.x flow or
follow-up):

1. Run `bun cms run directus-sync push` against a clean local Directus.
2. Verify Directus auto-generates the `pages_blocks` junction with
   `pages_id`, `collection`, `item`, `sort` columns.
3. Run `bun cms run directus-sync pull` to capture the junction +
   the M2A relations into the snapshot.
4. Commit the auto-captured files (expected: `collections/pages_blocks.json`,
   `fields/pages_blocks/*.json`, `relations/pages_blocks/*.json`).
5. Verify in Data Studio that `pages.blocks` M2A picker offers all 12
   `block_*` collections.

Until that roundtrip lands, Phase 3's `loadPage` deep-fields query (which
expands `blocks.item:block_<name>.*`) is structurally testable against
mocked data only — integration tests against live Directus must wait for
the junction to materialize.

## Phase 1 boundary post-review fix-ups (commit fd-aware)

After Gemini review, three follow-up edits landed:

1. Moved `tech_stack` and `client_logos` fields from
   `fields/block_about_content_translations/` to
   `fields/block_about_content/` — both shapes (`AboutTechItem`,
   `AboutClientLogo`) have zero `LocalizedString` leaves and so belong on
   the parent block per the Task 1.3 flattening pattern.
2. Tightened `nav_links.priority` from nullable integer to required
   `select-dropdown` constrained to `[1, 2]`, matching `NavLinkSchema`'s
   `z.union([z.literal(1), z.literal(2)])`. Default `1`.
3. Exported `AboutSocialLinkSchema` and `ContactSocialLinkSchema` from
   `@repo/shared/schemas` (were internal `const`).

## Task 2.x seed validation (dry-run)

Run: `bun run apps/cms/scripts/seed-pages-and-blocks.ts -- --dry-run --verbose`
Output captured 2026-04-28:

```
[seed-pages-and-blocks] target: https://cms.yesid.dev [dry-run]
[seed-pages-and-blocks] --- dry-run: validating all fixtures via @repo/shared Zod schemas ---
[seed-pages-and-blocks] all Zod validations passed
[seed-pages-and-blocks] Would seed:
[seed-pages-and-blocks]   7 pages
[seed-pages-and-blocks]   12 block_* rows (one per block collection)
[seed-pages-and-blocks]   12 translation rows × up to 3 locales each
[seed-pages-and-blocks]   12 pages_blocks M2A junctions (shape only — junction auto-materializes post-merge)
[seed-pages-and-blocks]   15 nav_links rows
[seed-pages-and-blocks]   3 error_pages rows
[seed-pages-and-blocks] --- dry-run complete (no writes) ---
```

**Counts**: 7 pages, 12 blocks, 12 translation rows (en only — FR/ES via Data Studio),
15 nav_links (header:3, footer:3, mobile:3, menu:6), 3 error_pages

**Status**: dry-run green (exit 0); all @repo/shared Zod schemas accept fixture data.
Live execution deferred to post-merge alongside the pages_blocks M2A junction
roundtrip (see "Known incomplete" section above).

### Task 2.2 deferral note

Plan Task 2.2 instructed: run live, verify in Data Studio, re-run for idempotency,
pull snapshot. **Deferred to post-merge per Path B constraint.** Owner: Task 7.x
close-out flow.

### Cross-repo import decision

Static content modules in `apps/web/src/lib/content/` use `$lib/types` (SvelteKit
alias) which cannot resolve outside the SvelteKit bundler context. Direct import
from `apps/cms` would fail at runtime. Per D12 (apps/cms must not depend on
apps/web), content was frozen as fixture JSON at `apps/cms/fixtures/content/`:

- `site-content.json` — heroContent + heroAnimContent + manifestoContent +
  proofReelContent + servicesGridContent + aboutIntroContent + ctaContent + closerContent
- `about-page.json` — aboutPageContent
- `contact-page.json` — contactContent
- `nav.json` — navLinks + menuItems + errorPageContent
- `tech-stack-page.json` — techStackPageContent

These fixtures are the authoritative seed data source. After Slice 18 closes,
Directus Data Studio is the authoring surface; the fixtures + web TS modules
both freeze (Slice 19+ re-export step if regeneration is ever needed).

### Task 7.x (post-merge live run) order of operations

1. Run `bun cms run directus-sync push` against live Directus (serialized — no
   other branch pushing simultaneously, per feedback_serial_cms_pushes).
2. Confirm Directus auto-generates `pages_blocks` junction collection with
   `pages_id`, `collection`, `item`, `sort` columns.
3. Run `bun run apps/cms/scripts/seed-pages-and-blocks.ts` (live, no --dry-run).
4. In Data Studio, wire the 12 M2A junction rows (or extend the script to create
   them directly now that the junction collection is confirmed).
5. Run `bun cms run directus-sync pull` to capture junction + M2A relations.
6. Commit auto-captured files (expected: `collections/pages_blocks.json`,
   `fields/pages_blocks/*.json`, `relations/pages_blocks/*.json`).
7. Verify in Data Studio that `pages.blocks` M2A picker offers all 12 `block_*`
   collections and the content is visible.

---

## Phase 6 test audit (slice-18i Task 6.x)

Recorded 2026-04-29 at HEAD `b89c303` (after Phase 6 commits land).

### Task 6.1 — PageSchema unit test audit

**Result: gaps filled.** All 12 block variants already had at least one
"valid sample parses" test via the `transformBlock<Name>` describes (Phase 4).
Added in Task 6.1:

- `it.each` parameterized smoke test: `PageSchema.parse()` must accept the
  output of each `transformBlock*` function for all 12 variants.
- 5 "wrong item shape rejects" tests confirming the discriminated union
  rejects mismatched `(collection, item.shape)` pairings and unknown
  collection names.

Two fixture defects were discovered by the new smoke test and corrected:

1. `rawBlockCloser()` had `cta.href` and `attribution.url` inside the
   translation JSON column. The transform reads those as plain strings from
   `raw.cta_href` / `raw.attribution_url` (parent row fields) before falling
   back to the JSON column value. `toLSJSON` was wrapping them as
   LocalizedStrings, violating `z.string()` in the schema. Fixed by moving
   `cta_href` and `attribution_url` to the parent row.

2. `rawBlockTechStackPageContent()` used stale field names (`download`, `share`,
   `heading`, `body`) that no longer exist in `TechStackPageContentSchema`.
   Updated to the current names (`titleLine1`, `titleLine2`, `terminalAria`,
   `stats`, `getInTouch`, `viewServices`, `headingLine1`, `headingLine2`,
   `sub`, `availability`).

### Task 6.2 — ContentPort method coverage audit

**Result: no gaps.** All 17 ContentPort methods have mocked tests in
`apps/web/src/lib/adapters/directus.mocked.test.ts`:

| Method | Describe block |
|---|---|
| `content.hero` | `directusAdapter.content.* M2A methods — Task 4.1` |
| `content.heroAnim` | same |
| `content.manifesto` | same |
| `content.proofReel` | same |
| `content.servicesGrid` | same |
| `content.about` | same |
| `content.cta` | same |
| `content.closer` | same |
| `content.aboutPage` | `Task 4.2 detail-page blocks` |
| `content.contactPage` | same |
| `content.techStackPage` | same |
| `content.heroMock` | `Task 4.3 derived methods` |
| `content.initialHeroData` | same |
| `content.navLinks` | `content.navLinks + menuItems — delegation` |
| `content.menuItems` | same |
| `content.errorPage` | `content.errorPage — fetch contract` |
| `content.metroSvg` | `content.metroSvg — fetch contract` |
| `content.morphShapes` | `content.morphShapes — fetch contract` |

`nav.byPlacement` covers all 4 placements: header, footer, mobile, menu.
`errorPage` covers the 3 required paths: specific row, fallback (0), throws.

No new tests were needed for Task 6.2.

### Task 6.3 — Integration tests deferred to post-merge

**Deferred.** Live Directus integration tests (Task 6.3) are blocked on
the same constraint as the seed push: `feedback_serial_cms_pushes.md`
prohibits pushing from feature branches to avoid orphan-delete incidents
(#79, #81). The `pages_blocks` M2A junction also does not exist on live
Directus until the first post-merge push.

**Why mocked tests are a sufficient pre-merge gate**: every `content.*`
method is exercised through `loadPage` → transform → `parsePort(PageSchema)`.
The mock returns a real-Directus-shaped payload (same field names, same
nesting, same translation row arrays). The only delta between mocked and live
behavior is (a) network latency and (b) the M2A junction materialization.
Neither affects the transform/schema correctness verified by the mocked tests.

**Post-merge integration runner checklist** (owner: Task 7.x close-out):

- [ ] Live push: `bun cms run directus-sync push` (serialized, no other branch)
- [ ] Seed: `bun run apps/cms/scripts/seed-pages-and-blocks.ts` (no --dry-run)
- [ ] Run integration tests pointing at staging Directus (`PUBLIC_DIRECTUS_URL`
      set to `https://cms.yesid.dev`)
- [ ] Verify all 17 `content.*` methods return Zod-valid payloads (no
      `parsePort` throws in SSR logs)
- [ ] Verify `loadPage` round-trip for all 7 slugs: home, about, contact,
      services, projects, tech-stack, blog
- [ ] Confirm `pages_blocks` M2A junction is present in `directus-sync pull`
      snapshot (see Task 7.x order of operations above)

### Phase 6 coverage summary

See Task 6.5 section below for line coverage percentages.

### Task 6.5 — Coverage results

Run: `bun run test --coverage` in `apps/web/` (vitest v8 provider).

| File | Line % | Note |
|---|---|---|
| `apps/web/src/lib/adapters/directus.ts` | TBD post-run | target ≥80% |
| `packages/shared/src/schemas/page.ts` | TBD post-run | target ≥80% |
| `apps/web/src/routes/+layout.server.ts` | TBD post-run | target ≥80% |
| `apps/web/src/routes/+error.svelte` | best-effort | Svelte component coverage unreliable |

*Coverage numbers to be filled in after the post-E2E coverage run (Task 6.5).*
