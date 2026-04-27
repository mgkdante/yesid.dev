# 18f — Decisions

| ID | Decision | Source | Status |
|---|---|---|---|
| Q1 | Drop `animation_reverse` from schema — typo/artifact; `animation` stays string enum (`draw \| morph \| draw-fill`), not M2O | Brainstorm 2026-04-25 | locked |
| Q2 | Translations junction for `title` + `excerpt`; `lang` + `body` on parent. Conforms to CONVENTIONS § 8. Each post seeds with one translation row matching its `lang`. | Brainstorm 2026-04-25 | locked |
| Q3 | Issue #41 (projects body Block Editor migration) ROLLED INTO 18f scope. Adds `projects.svg_illustration` M2O field + re-seed projects bodies via `wrapPlainText` helper + ProjectDetailPage consumer flip. ~0.5 session of work; validates renderer reusability on 2 content types from day one. | Brainstorm 2026-04-25 | locked |
| Q4 | `BlockRenderer` uses Svelte component recursion for inline marks (no `{@html}` in inline path). Code-block highlighting + copy buttons bake into a `CodeBlock.svelte` sub-component (no runtime DOM mutation). | Brainstorm 2026-04-25 | locked |
| Q5 | New `illustrations` collection — generic SVG library for **blog + project** illustrations. Services keep `services.svg` M2O `directus_files` unchanged (different concept: one big functional illustration tied to service identity). | Brainstorm 2026-04-25 | locked |
| Q6 | New `morph_shapes` collection — programmatically extensible morph-target library. Replaces hardcoded `apps/web/src/lib/utils/shapes.ts` constant. Adding shapes via Data Studio works without a deploy. | Brainstorm 2026-04-25 | locked |

## Side decisions folded into design (no separate Q)

| Decision | Rationale |
|---|---|
| `status` enum hidden on consumer | Adapter filters `status _eq "published"` silently; `BlogPost` type unchanged |
| Reading time + word count: pure helpers in `packages/shared/src/utils/blocks.ts` | Replace HTML-regex extraction in `+page.ts`; reusable across content types |
| TOC heading-id generation: deterministic kebab-case slug at render time | Existing `TableOfContents.svelte` reads ids from DOM (already there); `getProcessedHtml()` becomes a no-op |
| `BlockRenderer` location: `apps/web/src/lib/components/cms/BlockRenderer.svelte` | cms/ subfolder, not blog/ — renderer is shared across content types |
| Mapping completeness: exhaustive | Cover every block type the schema permits so 18g + #41 + 18i don't need extension |
| `svg_illustration` optional with deterministic fallback | Preserves current behavior; migration script auto-assigns fallback for posts without one specified in frontmatter |
| `BlogPort` extension: add 13th method `bodyBySlug` | Cleanest data path post-Block-Editor; legacy `html` deprecated and removed in 18i |
| `ContentPort` extension: add `morphShapes` | Single method on existing port (top-level port would be overkill for one method) |
| Inline images / external posts | Zero in current data; schema supports; migration script handles via `assetIdFor()` if/when added |

## Amendments

(Empty — populate during execution as live findings supersede plan assumptions. Inherits 18e amendment shape: AM1, AM2, etc.)

## Open follow-ups (filed as GitHub issues at close)

(Empty — populate as work progresses; sweep before close per AGENTS.md `## Never`.)

## Close

| Item | Value |
|---|---|
| PR | TBD |
| Branch | `feature/slice-18-18f` |
| Closed date | TBD |
| Merge SHA | TBD |
