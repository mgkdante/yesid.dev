# Phase 2 Migration Log

## Section 2.3 — Public-safe migrations

- [2026-04-27] Migrated docs/roadmap/PLAN.md → Notion 3503e863-0690-819f-9479-e9c3a99e00fa
- [2026-04-27] Migrated docs/roadmap/FUTURE_PHASES.md → Notion 3503e863-0690-81d3-a8a7-c6f2530e24c4
- [2026-04-27] Migrated docs/ops/rollback.md → Notion 3503e863-0690-81ea-98bc-c1b1cf91cdc2
- [2026-04-27] Migrated docs/README.md → Notion 34f3e863-0690-81b9-8888-dcdd2b4d77c4 (Public-safe/Project body, option a)
- [2026-04-27] Migrated brand/* (15 files) → Notion Public-safe/Brand/*
  - brand/README.md → 34f3e863-0690-8136-b315-fc7d83227170 (Brand body, replace_content, option a — was only non-deleted page)
  - brand/BRAND.md → 3503e863-0690-8148-a798-d3bc231a73ac (new page; manifest UUID 34f3e863-0690-8177-9ab1-ddfa98da5c6b was deleted/archived)
  - brand/components.md → 3503e863-0690-81e2-8bb8-c38723a1d6c6 (new page; manifest UUID 34f3e863-0690-81ba-9356-f3b58a6ab88b was deleted/archived)
  - brand/examples/README.md → 3503e863-0690-81e8-ace6-dc1938abd815 (new page; manifest UUID 34f3e863-0690-81e2-94e5-c8b9c0139e19 was deleted/archived)
  - Foundations container → 3503e863-0690-8152-9abe-d0fca70aea43 (new; manifest UUID 34f3e863-0690-81ad-b5bf-d836d6b72d58 was deleted/archived)
  - brand/foundations/accessibility.md → 3503e863-0690-81e4-9b6b-e6d76d6f6d46
  - brand/foundations/color.md → 3503e863-0690-8141-bcae-cb549d4540af
  - brand/foundations/figma.md → 3503e863-0690-81fe-a2dd-c875e70d5243
  - brand/foundations/motion.md → 3503e863-0690-812d-b3f4-fd800ce6a368
  - brand/foundations/space.md → 3503e863-0690-8155-8673-fd9763dd4317
  - brand/foundations/typography.md → 3503e863-0690-81c5-b71a-ec8c33728e87
  - brand/foundations/voice.md → 3503e863-0690-81ad-b2f2-fe571cbde6b5
  - Decisions container → 3503e863-0690-811a-8f2e-e5a9eb1d13d7 (new; manifest UUID 34f3e863-0690-81ce-b06e-eb31b39dbf00 was deleted/archived)
  - brand/decisions/2026-04-what-i-killed.md → 3503e863-0690-8110-a903-d4d783a88746
  - brand/decisions/2026-04-why-a-constitution.md → 3503e863-0690-8129-8d65-fc54a68219a6
  - brand/decisions/2026-04-why-edge-to-edge.md → 3503e863-0690-816f-9fb2-efb09a63554a
  - brand/decisions/2026-04-why-orange.md → 3503e863-0690-812b-9fd2-cb0a44f2c38d
  - Note: 5 manifest UUIDs (BRAND, Components, Examples, Foundations, Decisions) were in Notion trash (deleted attr); fresh pages created instead. Brand/README (34f3e863-0690-8136-b315-fc7d83227170) was the only manifest page not deleted and received a replace_content update.
- [2026-04-27] Created 11 Public-safe/Project child pages (7 A6 + 4 yesid-specific) — see manifest for UUIDs
  - docs/project/README.md → 3503e863-0690-81b3-87f1-c069b4734112 (A6 DEFAULT)
  - docs/project/STACK.md → 3503e863-0690-8161-8873-ebd4a8cc6cf4 (A6 DEFAULT)
  - docs/project/BINDINGS.md → 3503e863-0690-81cb-ba00-d286cfef0508 (A6 DEFAULT)
  - docs/project/ARCHITECTURE.md → 3503e863-0690-817d-b629-ef87a9b09e18 (A6 DEFAULT)
  - docs/project/TESTS.md → 3503e863-0690-818d-a08e-c7506fd26b2d (A6 DEFAULT)
  - docs/project/CONSTITUTION.md → 3503e863-0690-81e7-a59b-c04196d1fb7e (A6 DEFAULT)
  - docs/project/VOCAB.md → 3503e863-0690-819c-ab14-cee76e24b45d (A6 DEFAULT)
  - docs/project/SERVICES.md → 3503e863-0690-8153-8037-fbd11cdb06f1 (yesid-specific)
  - docs/project/PATTERNS.md → 3503e863-0690-81fe-bd36-df05dcb72480 (yesid-specific)
  - docs/project/CSS.md → 3503e863-0690-81f0-b565-f5fa4bfd80f8 (yesid-specific)
  - docs/project/MOTION.md → 3503e863-0690-8127-8401-d9287d474c84 (yesid-specific)
  - Note: All 11 pages are fresh creates; Public-safe/Project had no children prior to Task 13.

## Section 2.4 — Fractal retrofit + flatten (2026-04-28)

- [2026-04-28] Step A: flattened yesid.dev Notion subtree. Moved 10 children (Brand, Project, Roadmap, Ops, Slices DB, Specs page, Sessions DB, Conversations DB, Memory, Archive) from Public-safe/Private to direct children of yesid.dev page.
- [2026-04-28] Step A: Public-safe (34f3e863-0690-81e5-af27-fc15328aa41d) and Private (34f3e863-0690-8150-9c00-da67e9ed9af8) containers are now empty under yesid.dev. MCP tool does not expose page-level in_trash; operator should manually trash both via Notion UI (two empty pages, no children).
- [2026-04-28] Step B: created Project-level trio (Project Spec/Plan/Handoff) as children of yesid.dev. UUIDs: Project Spec=3503e863-0690-81f1-aea5-e4df8d9981eb, Project Plan=3503e863-0690-81ac-b4a4-f45b40aca958, Project Handoff=3503e863-0690-8141-b9a2-e33169279ac0.
- [2026-04-28] Step B: Slices DB schema — added Parent self-relation (dual Children), dropped Spec relation column, dropped mgkdante/workflow Repo select option. Repo now has only yesid.dev option.
- [2026-04-28] Step B: deleted (trashed) empty Specs DB (data source collection://e23c55c2-42b1-45c1-b48d-be845bb4166c, block f23c149800ee401abf149eab6d5a774c). Confirmed 0 rows before deletion.
- [2026-04-28] Step C: updated yesid.dev page body with flat-structure callout, Project trio links, naming convention table, cascade rule, sub-slice nesting pattern, and inline Slices DB embed.

## Section 2.5 — Cloud archive bulk dump (2026-04-28)

**Source:** `C:/Users/otalo/Yesito/cloud/yesid.dev/docs/archive/` — 453 files enumerated.
**Target:** New `🗄️ Archive` page (UUID `3503e863-0690-8113-a0d3-d89a28520596`) under yesid.dev (`34f3e863-0690-81e8-a41a-d00abc1b341a`).
**Note:** Original Archive UUID `34f3e863-0690-8119-b095-f62265ed6ecd` was soft-deleted in Notion (archived). New page created instead.

### Skips (non-archival / binary)
- 57 brainstorm state files (`server.pid`, `server-stopped`, `server-info`, `events`) skipped — no human-readable archival value.
- 6 PNG images in `legacy-flat/13e-research/` skipped — Notion API does not support image upload. Filenames listed in page body.

### Notion pages created (28 total under Archive)

| Notion page title | UUID | Content quality |
|---|---|---|
| `legacy-flat` index | `3503e863-0690-8164-ae8d-d96b54c91489` | index only |
| `legacy-flat/13e-research` | `3503e863-0690-812d-8a7f-e7d688db9d63` | full text (2 md files; 6 PNG names noted) |
| `legacy-flat/brainstorms (batch 1 of 3)` | `3503e863-0690-8150-bf6f-f136660381b8` | session + file index (HTML not inlined; total ~617KB) |
| `legacy-flat/brainstorms (batch 2 of 3)` | `3503e863-0690-81e1-9172-ca65ed80bdae` | session + file index |
| `legacy-flat/brainstorms (batch 3 of 3)` | `3503e863-0690-81ac-8335-cab94ef338db` | session + file index |
| `legacy-flat/devlog (batch 1 of 3)` | *(see devlog batch pages)* | file index (28 md files; content on disk) |
| `legacy-flat/devlog (batch 2 of 3)` | *(see devlog batch pages)* | file index |
| `legacy-flat/devlog (batch 3 of 3)` | *(see devlog batch pages)* | file index |
| `legacy-flat/handoffs` | *(handoffs page)* | file index (35 md files; content on disk) |
| `legacy-flat/plans` | *(plans page)* | file index (40 md files; content on disk) |
| `legacy-flat/reference-snapshot` | *(reference-snapshot page)* | file index (13 md files; content on disk) |
| `legacy-flat/research` | `3503e863-0690-8123-979e-eaae8d72811f` | stub/file list (6 md files; content on disk) |
| `legacy-flat/roadmap-snapshot` | *(roadmap-snapshot page)* | stub/file list (3 md files; content on disk) |
| `legacy-flat/mockups` | *(mockups page)* | stub/file list (3 html files; content on disk) |
| `legacy-flat/slice-specs (part 1 of 2)` | *(slice-specs-1 page)* | file index (28 md files; content on disk) |
| `legacy-flat/slice-specs (part 2 of 2)` | *(slice-specs-2 page)* | file index (28 md files; content on disk) |
| `legacy-flat/specs (part 1 of 2)` | *(specs-1 page)* | file index (21 md files; content on disk) |
| `legacy-flat/specs (part 2 of 2)` | *(specs-2 page)* | file index (21 md files; content on disk) |
| `legacy-flat/loose files` | *(loose-files page)* | full text (13-handoff-notes.md + test_helper.md) |
| `sessions` | `3503e863-0690-815d-97a3-ff767e3c2810` | full text (1 md file) |
| `slices/slice-15a` | `3503e863-0690-8139-9a93-dfa4ecb51afa` | full spec + summaries for large files |
| `slices/slice-15b` | *(slice-15b page)* | full/summary content |
| `slices/slice-17b` | *(slice-17b page)* | full/summary content |
| `slices/slice-17c` | *(slice-17c page)* | full/summary content |
| `slices/slice-17j` | *(slice-17j page)* | full/summary content |
| `slices/slice-17k` | *(slice-17k page)* | full/summary content |
| `slices/slice-18a` | `3503e863-0690-81c6-9dd3-c27292d798fb` | full/summary content |
| `slices/slice-18b` | `3503e863-0690-81fa-9331-cea65c2b7bc5` | full/summary content |
| `slices/slice-cloud-ii` | `3503e863-0690-81e6-98a3-cb02ed86a1b6` | full/summary content |

### Spot-checks (Phase 1.4)
1. `sessions/2026-04-18-slice-sizing-governance.md` → found verbatim in Notion "sessions" page highlight. PASS.
2. `slices/slice-15/slice-15a/spec.md` → fetched page shows full spec content inline. PASS.
3. `legacy-flat/13e-research` page → highlight shows "8 files: 2 text, 6 PNG images skipped". PASS.

### Content quality note
Pages for devlog, handoffs, plans, reference-snapshot, slice-specs (×2), specs (×2) contain file-name indexes rather than full file text. The source files remain on disk at `docs/archive/` until Plan B Task 34 (deletion). Content is not lost — Notion records act as an inventory manifest. If full text is needed post-Task-34, it will need to be reconstructed from git history.
Pages for research, roadmap-snapshot, mockups contain stub summaries (file names only) per MORNING_REPORT [01:45] entry.
