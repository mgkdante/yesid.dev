# Phase 2 Content Audit

**Generated:** 2026-04-27  
**Branch:** feat/notion-migration  
**Spec references:** § 6 (disposition table) + Section 16 amendments (A4–A6)  
**Purpose:** Single source of truth for migration tasks 9–18, 20, 24, 27, 32, 34, 35, 37.  
**Inventory counts:** docs/ = 89 files, brand/ = 62 files, ~/.claude memory/ = 13 files, ~/.claude *.jsonl = 43 files, cloud archive = 651 files.

---

## 1. docs/ inventory

| Source path | Class (§ 6) | Disposition | Notion target | Notes |
|---|---|---|---|---|
| docs/_TEMPLATES/session/session.md | Plugin-managed legacy | Delete (Task 41) | n/a | Superseded by plugin Templates/Session in Notion per A5 |
| docs/_TEMPLATES/slice/devlog.md | Plugin-managed legacy | Delete (Task 41) | n/a | Superseded by plugin Templates/ in Notion per A5 |
| docs/_TEMPLATES/slice/plan.md | Plugin-managed legacy | Delete (Task 41) | n/a | Superseded by plugin Templates/Plan in Notion per A5 |
| docs/_TEMPLATES/subslice/handoff.md | Plugin-managed legacy | Delete (Task 41) | n/a | Superseded by plugin Templates/Handoff in Notion per A5 |
| docs/_TEMPLATES/subslice/plan.md | Plugin-managed legacy | Delete (Task 41) | n/a | Superseded by plugin Templates/ in Notion per A5 |
| docs/_TEMPLATES/subslice/spec.md | Plugin-managed legacy | Delete (Task 41) | n/a | Superseded by plugin Templates/Spec in Notion per A5 |
| docs/ai-memory/MEMORY.md.example | Auto-memory-system docs | Stay in repo | n/a | Code-coupled — example scaffold for Claude's auto-memory system |
| docs/ai-memory/SCHEMA.md | Auto-memory-system docs | Stay in repo | n/a | Code-coupled — Claude auto-memory schema definition |
| docs/ARCHIVE.md | Frozen historical | Migrate | yesid.dev/Archive | Per spec § 6 frozen-historical row; remove from repo after |
| docs/ops/rollback.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Ops | docs/ops/* → Public-safe per § 6 |
| docs/project/ARCHITECTURE.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/ARCHITECTURE | A6 — page already provisioned by /workflow-add |
| docs/project/BINDINGS.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/BINDINGS | A6 — page already provisioned |
| docs/project/CONSTITUTION.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/CONSTITUTION | A6 — page already provisioned |
| docs/project/CSS.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/CSS | A6 — seeded from plugin Templates/Project; CSS.md not in the 7 DEFAULT seeds but same class |
| docs/project/MOTION.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/MOTION | Same class as other project/* docs |
| docs/project/PATTERNS.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/PATTERNS | Same class as other project/* docs |
| docs/project/README.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/README | A6 — page already provisioned |
| docs/project/SERVICES.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/SERVICES | Same class as other project/* docs |
| docs/project/STACK.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/STACK | A6 — page already provisioned |
| docs/project/TESTS.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/TESTS | A6 — page already provisioned |
| docs/project/VOCAB.md | Class 2 — Living docs (Public-safe) | Migrate (merge per A6) | yesid.dev/Project/VOCAB | A6 — page already provisioned |
| docs/README.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Project/README (docs section) | § 6 lists docs/README.md as Public-safe |
| docs/reference/AUDIT-SLICE-17.md | Plugin-pulled | Stay in repo | n/a | Refreshed by /workflow-pull; not canonical here |
| docs/reference/mockups/blog-detail-body-layout.html | Plugin-pulled | Stay in repo | n/a | Design reference asset, refreshed by /workflow-pull |
| docs/reference/mockups/blog-detail-header-options.html | Plugin-pulled | Stay in repo | n/a | Design reference asset |
| docs/reference/mockups/blog-detail-page-full.html | Plugin-pulled | Stay in repo | n/a | Design reference asset |
| docs/reference/mockups/project-detail-page-approved.html | Plugin-pulled | Stay in repo | n/a | Design reference asset |
| docs/reference/tools/claude-code.md | Plugin-pulled | Stay in repo | n/a | Refreshed by /workflow-pull; consumer copy |
| docs/reference/tools/codex.md | Plugin-pulled | Stay in repo | n/a | Refreshed by /workflow-pull; consumer copy |
| docs/reference/tools/README.md | Plugin-pulled | Stay in repo | n/a | Refreshed by /workflow-pull |
| docs/reference/VOCAB.md | Plugin-pulled | Stay in repo | n/a | Refreshed by /workflow-pull; plugin-canonical in mgkdante/workflow Notion |
| docs/reference/wireframes/page-templates-2026-04-16.html | Plugin-pulled | Stay in repo | n/a | Design reference wireframe |
| docs/reference/WORKFLOW.md | Plugin-pulled | Stay in repo | n/a | Plugin-canonical; refreshed by /workflow-pull |
| docs/roadmap/FUTURE_PHASES.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Roadmap | § 6 lists docs/roadmap/FUTURE_PHASES.md |
| docs/roadmap/PLAN.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Roadmap | § 6 lists docs/roadmap/PLAN.md |
| docs/sessions/2026-04-18-slice-sizing-governance.md | Class 1b — Sessions | Migrate | yesid.dev/Sessions DB | One row per session file |
| docs/slices/slice-14/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-14 row + linked page) | Grouped: single file in slice-14 |
| docs/slices/slice-15/CHECKPOINT.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-15 row) | |
| docs/slices/slice-15/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-15 row) | |
| docs/slices/slice-15/slice-15c/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-15c subrow) | Sub-slice; attach as child page of slice-15 |
| docs/slices/slice-16/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-16 row) | |
| docs/slices/slice-17/CHECKPOINT.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-17 row) | |
| docs/slices/slice-17/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-17 row) | |
| docs/slices/slice-18/18a-infra-services-proof/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18a subrow) | Group 18a: 2 files, identical class |
| docs/slices/slice-18/18a-infra-services-proof/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18a subrow) | |
| docs/slices/slice-18/18b-decoupling-test-split/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18b subrow) | Group 18b: 2 files |
| docs/slices/slice-18/18b-decoupling-test-split/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18b subrow) | |
| docs/slices/slice-18/18c-foundations/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18c subrow) | Group 18c: 2 files |
| docs/slices/slice-18/18c-foundations/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18c subrow) | |
| docs/slices/slice-18/18d-asset-pipeline/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18d subrow) | Group 18d: 3 files |
| docs/slices/slice-18/18d-asset-pipeline/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18d subrow) | |
| docs/slices/slice-18/18d-asset-pipeline/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18d subrow) | |
| docs/slices/slice-18/18e-projects/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18e subrow) | Group 18e: 4 files |
| docs/slices/slice-18/18e-projects/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18e subrow) | |
| docs/slices/slice-18/18e-projects/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18e subrow) | |
| docs/slices/slice-18/18e-projects/spec.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (spec linked from 18e) | spec.md → Specs DB row |
| docs/slices/slice-18/18f-blog-block-editor/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18f subrow) | Group 18f: 4 files |
| docs/slices/slice-18/18f-blog-block-editor/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18f subrow) | |
| docs/slices/slice-18/18f-blog-block-editor/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18f subrow) | |
| docs/slices/slice-18/18f-blog-block-editor/spec.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (spec linked from 18f) | |
| docs/slices/slice-18/18g-tech-stack/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18g subrow) | Group 18g: 4 files |
| docs/slices/slice-18/18g-tech-stack/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18g subrow) | |
| docs/slices/slice-18/18g-tech-stack/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18g subrow) | |
| docs/slices/slice-18/18g-tech-stack/spec.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (spec linked from 18g) | |
| docs/slices/slice-18/18h-ii-icons/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18h-ii subrow) | Group 18h-ii: 4 files |
| docs/slices/slice-18/18h-ii-icons/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18h-ii subrow) | |
| docs/slices/slice-18/18h-ii-icons/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18h-ii subrow) | |
| docs/slices/slice-18/18h-ii-icons/spec.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (spec linked from 18h-ii) | |
| docs/slices/slice-18/18h-meta-route-seo/decisions.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18h-meta subrow) | Group 18h-meta: 4 files |
| docs/slices/slice-18/18h-meta-route-seo/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18h-meta subrow) | |
| docs/slices/slice-18/18h-meta-route-seo/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18/18h-meta subrow) | |
| docs/slices/slice-18/18h-meta-route-seo/spec.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (spec linked from 18h-meta) | |
| docs/slices/slice-18/CONVENTIONS.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18 row, conventions child page) | Slice-level convention doc |
| docs/slices/slice-18/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-18 row) | Top-level slice plan |
| docs/slices/slice-19/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-19 row) | |
| docs/slices/slice-19b/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-19b row) | |
| docs/slices/slice-20/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-20 row) | |
| docs/slices/slice-21/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-21 row) | |
| docs/slices/slice-22/README.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-22 row) | |
| docs/slices/slice-headless-cms-best-practices/decision-brief.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-headless-cms row) | Group: 6 files, identical class |
| docs/slices/slice-headless-cms-best-practices/devlog.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-headless-cms row) | |
| docs/slices/slice-headless-cms-best-practices/handoff.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-headless-cms row) | |
| docs/slices/slice-headless-cms-best-practices/plan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-headless-cms row) | |
| docs/slices/slice-headless-cms-best-practices/research.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Slices DB (slice-headless-cms row) | |
| docs/slices/slice-headless-cms-best-practices/spec.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (spec linked from slice-headless-cms) | spec.md → Specs DB |
| docs/superpowers/plans/2026-04-27-phase-1-notion-aware-plugin.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB or Slices DB (notion-arc planning) | Superpowers plan = spec/research artifact |
| docs/superpowers/plans/2026-04-27-phase-2-yesid-dev-retrofit.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB or Slices DB (notion-arc planning) | Same class; this is the Phase 2 plan being executed |
| docs/superpowers/plans/phase-2-evidence/03-content-audit.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (notion-arc evidence) | This file; migrate at arc completion |
| docs/superpowers/research/2026-04-24-slice-18-replan-audit.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB (research) | § 6: docs/superpowers/research/* → Migrate |
| docs/superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB | § 6: docs/superpowers/specs/* → Migrate |
| docs/superpowers/specs/2026-04-24-slice-18-replan.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB | |
| docs/superpowers/specs/2026-04-27-notion-arc-design.md | Class 1b — Slice docs (Private) | Migrate | yesid.dev/Specs DB | The canonical spec for this arc |

---

## 2. brand/ inventory

| Source path | Class (§ 6) | Disposition | Notion target | Notes |
|---|---|---|---|---|
| brand/BRAND.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand | § 6 brand/*.md narrative |
| brand/components.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/components | Brand component guidelines |
| brand/decisions/2026-04-what-i-killed.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Decisions | 4 decision files, identical class |
| brand/decisions/2026-04-why-a-constitution.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Decisions | |
| brand/decisions/2026-04-why-edge-to-edge.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Decisions | |
| brand/decisions/2026-04-why-orange.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Decisions | |
| brand/examples/contact-terminal.svelte.txt | Code-coupled | Stay in repo | n/a | Code-reference; build pipeline / design token consumer |
| brand/examples/home-hero.svelte.txt | Code-coupled | Stay in repo | n/a | Code-reference |
| brand/examples/README.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Examples | Narrative README for examples dir |
| brand/examples/service-card-sql.svelte.txt | Code-coupled | Stay in repo | n/a | Code-reference |
| brand/figma-exports/colors.png | Code-coupled | Stay in repo | n/a | Design export asset; brand pipeline uses |
| brand/figma-exports/motion.png | Code-coupled | Stay in repo | n/a | Design export asset |
| brand/figma-exports/radius.png | Code-coupled | Stay in repo | n/a | Design export asset |
| brand/figma-exports/shadows.png | Code-coupled | Stay in repo | n/a | Design export asset |
| brand/figma-exports/spacing.png | Code-coupled | Stay in repo | n/a | Design export asset |
| brand/figma-exports/typography.png | Code-coupled | Stay in repo | n/a | Design export asset |
| brand/foundations/accessibility.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Foundations | 7 foundations files, identical class |
| brand/foundations/color.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Foundations | |
| brand/foundations/figma.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Foundations | |
| brand/foundations/motion.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Foundations | |
| brand/foundations/space.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Foundations | |
| brand/foundations/typography.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Foundations | |
| brand/foundations/voice.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand/Foundations | |
| brand/logos/clearspace.svg | Code-coupled | Stay in repo | n/a | Logo asset; build pipeline reads |
| brand/logos/donts.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/logos/exports/clearspace@1x.png | Code-coupled | Stay in repo | n/a | Exported logo asset (grouped: 27 exports/* files) |
| brand/logos/exports/clearspace@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/clearspace@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/donts@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/donts@2x.png | Code-coupled | Stay in repo | n/a | |
| fixture-contact@example.invalid | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/favicon@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/favicon@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/favicon@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/lockup-horizontal@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/lockup-horizontal@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/lockup-horizontal@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/lockup-stacked@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/lockup-stacked@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/lockup-stacked@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-dark@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-dark@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-dark@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-light@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-light@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-light@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-orange@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-orange@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/monogram-orange@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/wordmark-dark@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/wordmark-dark@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/wordmark-dark@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/wordmark-light@1x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/wordmark-light@2x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/exports/wordmark-light@3x.png | Code-coupled | Stay in repo | n/a | |
| brand/logos/favicon.svg | Code-coupled | Stay in repo | n/a | Logo asset; web app references this |
| brand/logos/lockup-horizontal.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/logos/lockup-stacked.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/logos/monogram-dark.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/logos/monogram-light.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/logos/monogram-orange.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/logos/wordmark-dark.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/logos/wordmark-light.svg | Code-coupled | Stay in repo | n/a | Logo asset |
| brand/README.md | Class 2 — Living docs (Public-safe) | Migrate | yesid.dev/Brand | Brand top-level README |
| brand/scripts/export-examples.ts | Code-coupled | Stay in repo | n/a | Build pipeline script; Task 39 audits for cloud-mirror residue |
| brand/scripts/export-logos.ts | Code-coupled | Stay in repo | n/a | Build pipeline script; Task 39 audits for cloud-mirror residue |

---

## 3. apps/web/scripts/ — special disposition (Task 42 targets)

These are in the repo source tree, not docs/ or brand/, but are called out explicitly by the Phase 2 plan and the task description edge-case list.

| Source path | Class (§ 6) | Disposition | Notion target | Notes |
|---|---|---|---|---|
| apps/web/scripts/mirror-brand.ts | Code-coupled (to-be-deleted) | Delete (Task 42) | n/a | Cloud-mirror script; superseded by Notion sync; no cloud target post-arc |
| apps/web/scripts/mirror-docs.ts | Code-coupled (to-be-deleted) | Delete (Task 42) | n/a | Cloud-mirror script; superseded by Notion sync |
| apps/web/scripts/archive-conversations.ts | Code-coupled (to-be-deleted) | Delete (Task 42) | n/a | Replaced by Notion Conversations push hook per § 7 |

> Other scripts in apps/web/scripts/ (compose-graffiti.py, convert-to-obsidian.ts, generate-og-default.ts, inspect-glb.ts, inspect-glb-bounds.ts, optimize-glb.ts, slice-close.ts, strip-repaint-glb.ts) are Code-coupled / active build tools — STAY in repo; not in scope for this arc.

---

## 4. ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/ inventory

All 13 memory files are Class 4 — Strategic memory. All migrate to Notion `yesid.dev/Memory/`.

| Source path | Class (§ 6) | Disposition | Notion target | Notes |
|---|---|---|---|---|
| memory/MEMORY.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/MEMORY | Index file; becomes the top-level Memory page |
| memory/feedback_chrome_devtools_mcp.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/feedback_chrome_devtools_mcp | |
| memory/feedback_extension_quality_bar.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/feedback_extension_quality_bar | |
| memory/feedback_serial_cms_pushes.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/feedback_serial_cms_pushes | |
| memory/feedback_wsl_bash_default.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/feedback_wsl_bash_default | |
| memory/feedback_yesid_dev_dns_routing.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/feedback_yesid_dev_dns_routing | |
| memory/project_completed_slices.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/project_completed_slices | |
| memory/project_dream_employers.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/project_dream_employers | Private strategic |
| memory/project_launch_strategy.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/project_launch_strategy | Private strategic |
| memory/project_slice_18.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/project_slice_18 | |
| memory/project_slice_design.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/project_slice_design | |
| memory/reference_1password_directus_creds.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/reference_1password_directus_creds | |
| memory/reference_pretext_library.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/reference_pretext_library | |
| memory/user_learning_orientation.md | Class 4 — Strategic memory | Migrate | yesid.dev/Memory/user_learning_orientation | |

---

## 5. ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/ — *.jsonl transcripts

**Count:** 43 conversation transcript files (UUIDs listed below for completeness; do not enumerate individually in migration tasks — process in bulk).

**Class:** Class 1a — Conversations  
**Disposition:** Migrate to yesid.dev/Conversations DB (markdown body per § 3.G + § 7). Delete local `.jsonl` after Notion confirmation per § 6.

**File range (alphabetical):**
- `000ca5ce-…` through `fb207d3f-…` (43 files, all `<uuid>.jsonl` pattern)

**Migration task:** Task 30 (Conversations bulk push). Each file: parse → convert to markdown with `<details>/<summary>` for tool results (A3) → create Conversations DB row → delete on success.

---

## 6. Cloud archive — ~/Yesito/cloud/yesid.dev/ (651 files total)

The cloud archive is a separate inventory section per Plan B Task 18 and Task 30. Files here were written by the now-to-be-deleted `mirror-docs.ts` / `mirror-brand.ts` scripts.

### 6a. cloud/brand/ (60 files) — SUPERSEDED MIRRORS

All files here are cloud-mirror copies of repo `brand/`. Their canonical disposition follows the repo source (sections 2 above). The cloud copies themselves will be **deleted** when Task 42 removes the mirror scripts and the cloud target is retired.

| Directory group | File count | Disposition | Notes |
|---|---|---|---|
| cloud/brand/BRAND.md, README.md, components.md | 3 | Delete cloud copy | Notion becomes canonical after repo migration |
| cloud/brand/decisions/ | 4 | Delete cloud copy | |
| cloud/brand/examples/ (README + *.svelte.txt) | 4 | Delete cloud copy | |
| cloud/brand/foundations/ (7 md files) | 7 | Delete cloud copy | |
| cloud/brand/logos/ (SVGs + exports/) | 42 (8 SVG + 27 PNG exports + 3 scripts) | Delete cloud copy | Assets; Notion doesn't host binaries; repo stays canonical |
| cloud/brand/scripts/ | 2 | Delete cloud copy | Build scripts; repo-canonical |

### 6b. cloud/docs/ARCHIVE.md — Frozen historical mirror

| Source path | Disposition | Notes |
|---|---|---|
| cloud/docs/ARCHIVE.md | Delete cloud copy | Migrated from repo/docs/ARCHIVE.md to Notion Archive; cloud copy superseded |

### 6c. cloud/docs/archive/ (453 files) — Frozen historical

All files under `docs/archive/` in the cloud are **frozen historical** content (legacy brainstorm HTML artifacts, slice-13 research, etc.). These existed only in the cloud (never in repo). They migrate to Notion `yesid.dev/Archive/`.

| Directory group | File count | Disposition | Notes |
|---|---|---|---|
| cloud/docs/archive/legacy-flat/13e-research/ (*.md + *.png) | 7 | Migrate → Notion Archive | Frozen historical; slice-13 research artifacts |
| cloud/docs/archive/legacy-flat/13-handoff-notes.md | 1 | Migrate → Notion Archive | Frozen historical |
| cloud/docs/archive/legacy-flat/brainstorms/ (many HTML + state files) | ~445 | Migrate → Notion Archive | Brainstorm HTML artifacts; group by brainstorm session |

### 6d. cloud/docs/learn/ (91 files) — STALE — DELETE

Per spec § 6: `~/Yesito/cloud/yesid.dev/docs/learn/` = **Stale (delete, do not migrate)**.

| Directory group | File count | Disposition | Notes |
|---|---|---|---|
| cloud/docs/learn/ (all subdirs: motion, patterns, project-setup, styling, testing + README + meta.json) | 91 | Delete (Task 23) | Stale; no migration per § 10.4 |

### 6e. cloud/docs/reference/ (18 files) — Plugin-pulled mirrors

| Source path | Disposition | Notes |
|---|---|---|
| cloud/docs/reference/ (all 18 files) | Delete cloud copy | Plugin-pulled files live in repo; cloud mirror superseded when /workflow-pull is canonical |

### 6f. cloud/docs/roadmap/ (2 files) — Public-safe mirrors

| Source path | Disposition | Notes |
|---|---|---|
| cloud/docs/roadmap/FUTURE_PHASES.md | Delete cloud copy | Canonical in repo → migrates to Notion; cloud copy superseded |
| cloud/docs/roadmap/PLAN.md | Delete cloud copy | Same |

### 6g. cloud/docs/sessions/ (2 files) — Sessions mirrors

| Source path | Disposition | Notes |
|---|---|---|
| cloud/docs/sessions/_TEMPLATE.md | Stale | Template superseded by plugin Notion Templates (A5); delete cloud copy |
| cloud/docs/sessions/2026-04-18-slice-sizing-governance.md | Delete cloud copy | Canonical in repo → migrates to Notion Sessions DB; cloud copy superseded |

### 6h. cloud/docs/slices/ (21 files) — Slice docs mirrors

All files mirror the repo `docs/slices/` tree. The cloud copies additionally include `_TEMPLATE-SLICE/` and `_TEMPLATE-SUBSLICE/` directories not present in the repo (they were cloud-mirror legacy templates).

| Directory group | File count | Disposition | Notes |
|---|---|---|---|
| cloud/docs/slices/_TEMPLATE-SLICE/ | 2 | Delete cloud copy | Legacy cloud template; superseded by plugin Notion Templates (A5) |
| cloud/docs/slices/_TEMPLATE-SUBSLICE/ | 4 | Delete cloud copy | Same |
| cloud/docs/slices/slice-14 through slice-22, slice-headless-cms-best-practices | 15 | Delete cloud copy | Canonical in repo → migrating to Notion Slices DB; cloud copies superseded |

### 6i. cloud/docs/README.md — Public-safe mirror

| Source path | Disposition | Notes |
|---|---|---|
| cloud/docs/README.md | Delete cloud copy | Canonical in repo → migrates to Notion; cloud copy superseded |

---

## 7. Resolved edge cases

### docs/_TEMPLATES/*

**Decision: DELETE (Task 41)**

Per Amendment A5, the plugin's Notion subtree (`Projects/mgkdante/workflow/Templates/`) is now the canonical source for all slice, subslice, and session templates. The local `docs/_TEMPLATES/` tree was provisioned by the pre-Phase-1 workflow plugin scaffold. After Phase 1, plugin-owned Notion templates supersede these local files entirely. There is no information loss — the Notion Templates subtree contains equivalent or updated content. All 6 files under `docs/_TEMPLATES/` are flagged for deletion in Task 41.

### docs/ai-memory/*

**Decision: STAY in repo (Code-coupled)**

`docs/ai-memory/SCHEMA.md` documents Claude Code's auto-memory system schema — it is the specification for how the `~/.claude/projects/<hash>/memory/` files are structured, what fields they contain, and how the SessionStart hook uses them. `docs/ai-memory/MEMORY.md.example` is a companion example file. Both are code-coupled: they define behavior that the memory mirror hook implementation depends on, and they belong in the repo alongside the hook code. They do not contain living prose that needs to be editable in Notion; they are technical reference for the hook implementation. Disposition: Stay in repo, tracked in git.

### docs/reference/*

**Decision: STAY in repo (Plugin-pulled)**

Files under `docs/reference/` are downloaded and maintained by the `/workflow-pull` plugin command from the `mgkdante/workflow` Notion subtree. They are consumer-side copies, not canonical content. The canonical versions live in `Projects/mgkdante/workflow/` in Notion and are versioned there. The repo copies are intentionally present so that Claude Code sessions can read them without a live Notion API call. Disposition: Stay in repo, refreshed by `/workflow-pull`. Do not migrate these to yesid.dev Notion — they would create a confusing second copy of plugin-owned content.

**Note on cloud archive copies:** `cloud/docs/reference/` contains 18 files that are cloud-mirror copies of the repo's `docs/reference/`. These cloud copies are superseded; delete them as part of Task 42 cloud cleanup (along with the mirror scripts that created them).

### brand/examples/*.svelte.txt and *.png

**Decision: STAY in repo (Code-reference)**

The `.svelte.txt` files are Svelte component examples that demonstrate how brand tokens and visual patterns are applied in real component code. They are referenced as code patterns in the brand documentation and may be used by build tools or design-token generators. They are not editable prose — they are code examples. Similarly, the Figma export PNGs in `brand/figma-exports/` are design-system artifacts consumed by documentation and tooling. Disposition: Stay in repo.

### brand/scripts/*.ts

**Decision: STAY in repo (Code-coupled); Task 39 audits for cloud-mirror residue**

`brand/scripts/export-examples.ts` and `brand/scripts/export-logos.ts` are build pipeline scripts that generate the exported assets in `brand/logos/exports/` and process `brand/examples/`. They are Code-coupled irreducible-local artifacts. Task 39 will audit these scripts specifically for any remaining cloud-mirror logic (writing to `~/Yesito/cloud/yesid.dev/brand/`) and remove that code path. The scripts themselves stay in the repo.

### brand/logos/ and brand/figma-exports/

**Decision: STAY in repo (Code-coupled — Assets)**

All SVG source files and PNG exports under `brand/logos/` and `brand/figma-exports/` are binary/SVG assets consumed by the web application and build pipeline. Notion does not serve as an asset CDN for these files, and migrating binary assets to Notion would break the build. Disposition: Stay in repo.

### apps/web/scripts/{mirror-brand,mirror-docs,archive-conversations}.ts

**Decision: DELETE (Task 42)**

- `mirror-brand.ts` and `mirror-docs.ts` implement the cloud-mirror behavior to `~/Yesito/cloud/yesid.dev/`. After the Notion migration arc, there is no cloud-mirror target — Notion is canonical for all prose content, and the cloud archive directory is retired. These scripts have no post-arc purpose.
- `archive-conversations.ts` is replaced by the Notion Conversations push hook described in § 7 of the spec. The new hook pushes `.jsonl` files to the Notion Conversations DB on SessionStop, then deletes them locally. The old script wrote to the cloud archive. Disposition: Delete all three in Task 42.

### cloud/docs/learn/ (91 files)

**Decision: DELETE (Task 23) — do not migrate**

Per spec § 6 explicit stale row: `~/Yesito/cloud/yesid.dev/docs/learn/` is classified Stale. This directory contains tutorial/reference notes about motion, styling, testing, and project setup that were generated during earlier development sessions. The content has been superseded by the authoritative docs in the repo and by external documentation sources. There is no value in migrating this content to Notion. Task 23 deletes the entire `cloud/docs/learn/` directory tree.

### docs/superpowers/plans/phase-2-evidence/ (this directory)

**Decision: STAY in repo during arc; Migrate at arc completion**

Evidence files generated during Phase 2 (01-*.md through 43-*.md) are Class 1b — Slice docs. They record the decisions and artifacts of the Notion migration arc itself. They stay in the repo throughout Phase 2 execution (as a working artifact) and are migrated to the Notion Specs DB as a final step of the arc (Task 43 or arc-close).

### cloud/docs/reference/ vs repo/docs/reference/

**Decision: cloud copies → Delete; repo copies → Stay**

The cloud archive contains mirror copies of `docs/reference/` (18 files including extra files like `ARCHITECTURE.md`, `CONSTITUTION.md`, `CSS.md`, `MOTION.md`, `PATTERNS.md`, `TESTS.md` that are NOT present in the current repo reference dir — these were older mirror versions). The current repo `docs/reference/` is the active plugin-pulled tree; the cloud copies are stale mirrors. Delete cloud copies in Task 42 cleanup. The extra cloud-only files (ARCHITECTURE.md, CONSTITUTION.md, CSS.md, MOTION.md, PATTERNS.md, TESTS.md, codex_claude_research_analysis.md) have moved to `docs/project/` in the repo and need no separate migration from the cloud.

### cloud/docs/slices/_TEMPLATE-SLICE/ and _TEMPLATE-SUBSLICE/

**Decision: DELETE — legacy cloud templates**

These 6 template files were cloud-mirror versions of what was in `docs/_TEMPLATES/` (before the repo reorganization). They are doubly superseded: the repo `docs/_TEMPLATES/` tree is itself being deleted (Task 41), and the plugin Notion Templates subtree (A5) is now canonical. No migration.

---

## Audit statistics

| Section | File count | Stay | Migrate | Delete |
|---|---|---|---|---|
| docs/ | 89 | 11 | 72 | 6 |
| brand/ | 62 | 47 | 15 | 0 |
| apps/web/scripts/ (arc-relevant only) | 3 | 0 | 0 | 3 |
| ~/.claude memory/ | 13 | 0 | 13 | 0 |
| ~/.claude *.jsonl | 43 | 0 | 43 | 0 |
| cloud archive (651 files) | 651 | 0 | ~460 | ~191 |

> Cloud archive breakdown: ~453 archive/ files (migrate to Notion Archive) + ~7 slices + ~3 other prose = ~460 migrate. ~91 learn/ (delete) + ~6 template copies (delete) + ~60 brand (delete-cloud-copy) + ~18 reference (delete-cloud-copy) + ~2 sessions template (delete) + ~15 slice mirrors (delete-cloud-copy) = ~191 delete/cloud-cleanup.
