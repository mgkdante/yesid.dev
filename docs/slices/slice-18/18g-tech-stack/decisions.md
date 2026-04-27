# 18g — Decisions

| ID | Decision | Source | Status |
|---|---|---|---|
| Q1 | Drop `layer` + `domains` enums + `proficiency` from schema. Tech items are categorized solely by their M2M relations to services + projects — no abstract groupings | User 2026-04-27 | locked |
| Q2 | Drop `connectsTo` self-M2M graph + `tech_relations` collection + `connectionNotes`. The connection visualization is gone (along with the Control Room visualization area) | User 2026-04-27 | locked |
| Q3 | Drop `stack_scenarios` collection entirely (recommended-stack triples). User explicitly: "Stack scenarios … wont be needed yet" | User 2026-04-27 | locked |
| Q4 | Body fields reduced from 3 sections to 3 Block Editor fields (`what_it_is`, `what_i_use_it_for`, `why_i_use_it_instead`). User initially considered dropping "What it is", reversed — kept all three with new framing emphasizing "instead of another solution" comparison | User 2026-04-27 | locked |
| Q5 | Keep `icon` field. Drop `proficiency` field. Tech name is international (parent), narrative body is i18n (translations junction). Mirrors projects pattern, NOT blog AM2.5 mono-language pattern | User 2026-04-27 | locked |
| Q6 | Ship 18g **data-only** — no consumer rendering of the new data. `/tech-stack` Control Room visualization area renders nothing. Future honeycomb dashboard redesign deferred to its own slice | User 2026-04-27 | locked |
| Q7 | Static `apps/web/src/content/stack/*.md` + `scenarios/*.md` files stay in repo during 18g. Cleanup pass in 18k. Avoids cascading consumer breaks during this slice | Implicit (matches 18d/18e/18f deferred-cleanup pattern) | locked |

## Side decisions folded into design (no separate Q)

| Decision | Rationale |
|---|---|
| Use `migrate-markdown-to-blocks.ts` from 18f as-is | Editor.js shape locked; no need to re-derive |
| Mono-locale `en` seed | Tech narratives are personal opinions; FR/ES translations populated later via Data Studio when (or if) audience demands |
| Mirror permissions matrix shape from blog_posts (18f Phase 5 Task 29) | Same access model: ai-editor read+create+update with cascade publish-block, human-editor full, Public read where status=published |
| Status enum: standard `draft`/`published`/`archived` | 18c global-draft pattern, no per-collection variation |
| `tech_stack.id` as string PK (kebab-slug) | Matches 18e projects pattern; readable URLs if a future detail page lands |
| Junctions named `tech_stack_services` + `tech_stack_projects` (NOT `services_tech_stack` + `projects_tech_stack`) | Alphabetical-by-FK side that varies LESS — consistent with 18e's `projects_services` naming |
| Migration script logs missing section warnings | Some markdown bodies may not follow the canonical 3-section structure exactly; surface gaps for manual editorial fix-up post-seed rather than failing the seed |
| FK reference validation pre-seed | Migration fails fast if any `relatedServices` slug doesn't exist in current services collection — prevents orphan junction rows |

## Open follow-ups (filed as GitHub issues at close)

- **Honeycomb dashboard redesign** — consumer-side redesign of `/tech-stack` route per user vision: tessellated honeycomb grid (desktop) with click-to-dialog showing 3 Block Editor body fields + service/project chips; scrollable card list (mobile) with tap-to-sheet. ~1-1.5 sessions. File at 18g close. Schema captured in this slice supports it directly.
- **Static markdown deletion** — `apps/web/src/content/stack/*.md` (34 files) + `apps/web/src/content/scenarios/*.md` deletion. Lands in 18k cleanup pass alongside other static modules.
- **Static `apps/web/src/lib/content/tech-stack.ts` deletion** — depends on consumer redesign + new chip components landing first. 18k.

## Close

| Item | Value |
|---|---|
| PR | TBD |
| Branch | `feature/slice-18-18g` |
| Closed date | TBD |
| Merge SHA | TBD |
