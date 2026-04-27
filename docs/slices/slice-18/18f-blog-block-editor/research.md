# 18f — Research

> Probe findings + live-state observations during execution. Populated as work progresses; finalized at close.

## P3 — Block Editor JSON output shape

**Status:** Pending (Phase 0 of 18f).

**Question:** What block types does Directus 11.17.3 Block Editor support? What's the nested JSON shape? How do inline marks compose?

**Why deferred to 18f:** Live CMS had no `blog_posts` collection until 18f opens. Probing requires creating the collection + a test row, which is exactly 18f's opening scope.

**Method:**

1. Push `blog_posts` + `blog_posts_translations` schema via directus-sync (Phase 1).
2. In Data Studio, manually create one test row with maximal block diversity:
   - Heading levels 1–4
   - Paragraphs with bold + italic + link + inline code + strike marks
   - Paragraphs with hard breaks
   - Ordered list (3 items)
   - Bullet list (3 items)
   - Nested list (bullet inside ordered)
   - Code block with language hint (sql, ts, py)
   - Code block without language hint
   - Blockquote (single paragraph)
   - Blockquote (multi-paragraph)
   - Horizontal rule
   - Image (using an existing illustration UUID from 18d)
   - Embed (YouTube URL)
3. Read the row via MCP `items` tool OR `curl -H "Authorization: Bearer <jwt>" 'https://cms.yesid.dev/items/blog_posts/<id>?fields=body'`.
4. Document the JSON shape under "Result" below.
5. Commit `BlockEditorDocSchema` in `packages/shared/src/types/blocks.ts` (Phase 2).

**Working assumption (from 18c docs reading; verify in probe):** tiptap-style `{ type: 'doc', content: [...] }`. Block types: heading (depth 1–4), paragraph, bulletList, orderedList, listItem, codeBlock, blockquote, horizontalRule, image, embed. Inline marks: bold, italic, code, link, strike.

**Result:** TBD (lands during 18f Phase 0).

**Decision:** TBD (locks once probe lands).

---

## P-illustration-folder-public-policy — Public read of `illustrations` folder

**Status:** Pending (Phase 1 of 18f, before seed).

**Question:** Does the existing folder-scoped Public policy on `directus_files` (set up in 18d for `services`/`projects`/`blog`/`brand`/`about`/`og` folders) extend cleanly to a new `illustrations` folder?

**Method:**

1. Add `illustrations` to the folder list in `apps/cms/directus/permissions.json` for the Public read filter.
2. Push via directus-sync.
3. Upload one test SVG to the new folder via Data Studio.
4. `curl https://cms.yesid.dev/assets/<uuid>` (no auth) — should return raw bytes.

**Decision:** TBD (locks during Phase 1).

---

## Open follow-ups

(Empty — populate as work progresses; sweep before close + file as GH issues per AGENTS.md `## Never`.)

---

## Live state — Phase 0 (probes)

**Status:** Pending.

(Populate after P3 + P-illustration-folder-public-policy land.)

---

## Live state — Phase 6 (push + seed)

**Status:** Pending.

(Populate after Phase 6 push + seed land — collections live, row counts, permission rows, directus-sync diff cleanliness.)

---

## Live state — Phase 9 (final, before close)

**Status:** Pending.

(Populate after Phase 9 lands — `/blog` + `/blog/[slug]` + `/projects/[slug]` rendering from Directus, BlockRenderer reuse on 2 content types, morph_shapes programmatic-add verified.)
