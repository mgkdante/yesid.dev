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

## Push deferral

Push to live Directus is deferred to post-merge per
feedback_serial_cms_pushes.md (incidents #79, #81 — concurrent feature
branch pushes can wipe data via orphan-delete). The full snapshot will
be applied to live in a single, serialized push after the slice-18i PR
merges.
