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
