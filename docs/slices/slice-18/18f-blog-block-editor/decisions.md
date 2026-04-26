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

## Amendments (2026-04-25 — Phase 2 P3 probe findings)

| ID | Amendment | Source | Effect |
|---|---|---|---|
| AM1 | **Block Editor JSON shape is Editor.js, not tiptap.** Top-level `{ time, blocks, version }`. Per-block `{ id, type, data }`. Invalidates the working assumption from 18c P3 deferred research. | Phase 2 Task 7 live probe | Phase 3 + 6 + 10 plan tasks rewritten — Zod schema, transform helpers, migration script, BlockRenderer all retargeted at Editor.js shape. |
| AM2 | **Q4 revised — inline marks render via `{@html data.text}`** (not Svelte component recursion). Editor.js stores marks as raw HTML strings inside `data.text` (`<b>bold</b>`, `<i>italic</i>`, `<a href="...">link</a>`, `<u class="cdx-underline">underline</u>`). Q4 (a) chosen pragmatically — content is admin-trusted; XSS surface no worse than legacy `marked.parse` `{@html}`. Re-evaluate if Block Editor authoring opens to less-trusted authors. | Phase 2 Task 7 + user 2026-04-25 | Paragraph + Header sub-components use `{@html node.data.text}`. No InlineContent.svelte component (Phase 10 Task 63 cancelled). |
| AM3 | **Q7 (NEW) — code-block language hints dropped.** Editor.js's default `code` block has no `language` attribute. Configuring a custom code-block plugin requires a custom Directus interface extension (D11 forbids; would need amendment + ~1 session of extension work). Verified via Directus source investigation: `input-block-editor` tools are statically imported, `meta.options` only accepts `font`. Markdown migration script ignores fenced-code language hints; CodeBlock.svelte renders plain `<pre><code>`. Shiki integration stays in the legacy markdown path (`apps/web/src/lib/utils/markdown.ts`) until 18i deletes that. File a follow-up GH issue at close: "Add language detection or language-aware Block Editor plugin (post-18, requires D11 amendment)." | Phase 2 Task 7 + investigation 2026-04-25 + user 2026-04-25 | Phase 3 helpers + Phase 6 migration + Phase 10 CodeBlock.svelte simplified — no language plumbing. Phase 6 Task 36 tests adjusted (no language assertion). |
| AM4 | **Q8 (NEW) — embeds dropped.** Default Editor.js setup in Directus has no embed plugin (verified live: pasted YouTube URL became a `code` block). Adding embed plugin = same extension blocker as Q7. Current 7 blog posts have zero embeds. Embed.svelte stays as placeholder no-op (Phase 10 Task 70). | Phase 2 Task 7 + investigation 2026-04-25 + user 2026-04-25 | No further plumbing in Phases 3 / 6 / 10. |
| AM5 | **Q9 (NEW) — multi-paragraph blockquotes emit as N consecutive `quote` blocks.** Editor.js `quote` is flat (single text + caption + alignment). Migration script splits markdown `> p1\n>\n> p2` into 2 sequential quote blocks. Visual fidelity: each renders as bordered block; semantically loose but matches Editor.js capability. Current 7 posts have zero multi-paragraph quotes. | Phase 2 Task 7 + user 2026-04-25 | Phase 6 Task 37 mapping updated. |
| AM6 | **`delimiter` block IS in Directus's default Editor.js tool set** (verified via source). Markdown horizontal rule (`---`) maps to `{ id, type: 'delimiter', data: {} }`. BlockRenderer adds a `delimiter` case rendering `<hr>`. | Phase 2 Task 7 investigation | Phase 6 Task 37 + Phase 10 Task 68 plan code updated. Replaces tiptap `horizontalRule`. |
| AM7 | **`probe-test-row` preserved** (deletion deferred per Phase 2 Task 8). Useful for re-probing edge cases (e.g., delimiter block shape, compound marks). Auto-cleanup during Phase 5 push if it conflicts; manual cleanup before slice close. | Operational decision | Phase 2 Task 8 marked deferred-not-blocking. |

## Open follow-ups (filed as GitHub issues at close)

(Empty — populate as work progresses; sweep before close per AGENTS.md `## Never`.)

## Close

| Item | Value |
|---|---|
| PR | TBD |
| Branch | `feature/slice-18-18f` |
| Closed date | TBD |
| Merge SHA | TBD |
