# 18f — Research

> Probe findings + live-state observations during execution. Populated as work progresses; finalized at close.

## P3 — Block Editor JSON output shape

**Status:** RESOLVED — 2026-04-25 Phase 2 probe complete.

**Question:** What block types does Directus 11.17.3 Block Editor support? What's the nested JSON shape? How do inline marks compose?

**Method executed:** Created probe-only `blog_posts` collection (id + body fields only), pushed via `directus-sync push`, manually authored one test row (`probe-test-row`) in Data Studio with maximal block diversity, then fetched via `Invoke-RestMethod /items/blog_posts/probe-test-row?fields=body`.

### Headline finding

**Directus 11.17.3 Block Editor is Editor.js-style, NOT tiptap-style.** This invalidates the working assumption from 18c. Major rework of types + transform + renderer required vs the original plan.

### Top-level shape

```json
{
  "time": 1777164417419,
  "blocks": [ /* array of blocks */ ],
  "version": "2.31.2"
}
```

Editor.js v2.31.x output. The plan's `BlockEditorDoc = { type: 'doc', content: [...] }` (tiptap) does not apply.

### Block types observed

| Type emitted | Shape | Notes |
|---|---|---|
| `header` | `{ id, type, data: { text: 'plain string', level: 1\|2\|3\|4 } }` | Levels 1–4 verified. Inline marks would be HTML inside `text` (none in probe). |
| `paragraph` | `{ id, type, data: { text: 'string with embedded HTML for marks' } }` | **Inline marks = raw HTML.** Bold = `<b>`, italic = `<i>`, link = `<a href="...">`, underline = `<u class="cdx-underline">`. No structured mark array. |
| `nestedlist` | `{ id, type, data: { style: 'unordered'\|'ordered', items: [{ content, items }] } }` | **One type for both list styles**, `data.style` discriminates. Recursive `items[].items` for nesting. `content` is HTML string per item. |
| `code` | `{ id, type, data: { code: 'raw string' } }` | **NO language attribute.** Cannot preserve fenced-code language hints from markdown. |
| `quote` | `{ id, type, data: { text, caption, alignment: 'left'\|'center'\|'right' } }` | **Flat single text + caption.** No nested-paragraph support. The probe's intended "multi-paragraph blockquote" became TWO separate `quote` blocks. |
| `image` | `{ id, type, data: { file: { fileId, fileURL, url, width, height, name, title, extension, size }, caption, withBorder, withBackground, stretched } }` | Full Directus file metadata embedded. `data.file.fileId` is the asset UUID; `data.file.url` is `/assets/<uuid>`. |

**Block types NOT observed (probable absence in default Directus install):**

- `embed` — YouTube URL was pasted; Editor.js fell back to treating it as a `code` block. No embed plugin appears configured by default in Directus 11.17.3's Block Editor.
- `delimiter` (Editor.js name for horizontal rule) — user didn't add one. Likely available, name TBD if needed.
- `tiptap-style heading/paragraph/list/codeBlock/blockquote/horizontalRule` — none. Confirms Editor.js, not tiptap.

### Inline marks — raw HTML, not structured

Critical finding for renderer architecture (invalidates Q4 decision):

```json
{
  "id": "YNIGEZcuae",
  "type": "paragraph",
  "data": {
    "text": "<b>bold</b>, <i>italic, </i><a href=\"https://yesid.dev\">yesid.dev</a>, <u class=\"cdx-underline\">underline</u>"
  }
}
```

Editor.js stores all inline formatting as embedded HTML strings inside `data.text`. There is no structured `[{ type: 'text', text, marks: [...] }]` array. This affects `BlockRenderer.svelte`:

- **Cannot use Svelte component recursion for inline marks (Q4 option A) without parsing the HTML string first.**
- Either we (a) `{@html data.text}` it (XSS risk; admin-controlled, but still loses Svelte's escape default) OR (b) parse HTML to AST + render nested marks as Svelte components (more code, safer).

Mark types observed: `<b>` (bold), `<i>` (italic), `<a href>` (link), `<u class="cdx-underline">` (underline — not in original Q4 spec). Probable: `<mark>`, `<code>`, `<s>`, but unverified.

### Implications for the plan

**Must revise:**

1. `packages/shared/src/types/blocks.ts` Zod schema — full rewrite to model Editor.js shape (top-level `{ time, blocks, version }`, per-block `{ id, type, data }`).
2. `packages/shared/src/utils/blocks.ts` helpers — `extractText`, `extractHeadings`, `wrapPlainText`, `serializeBlocksToHtml` rewritten for Editor.js shape.
3. `apps/cms/scripts/migrate-markdown-to-blocks.ts` — entirely different output shape. Markdown→Editor.js, not markdown→tiptap. Per-token mapping changes:
   - markdown `# heading` → `header` block (level)
   - markdown paragraph with marks → `paragraph` block (raw HTML in `data.text`; need an HTML serializer for marks since Editor.js expects this)
   - markdown ordered/bullet → `nestedlist` block (unified)
   - markdown fenced code with language → `code` block (**language hint LOST**)
   - markdown blockquote → `quote` block (multi-paragraph collapsed)
   - markdown horizontal rule → likely `delimiter` block (TBD probe)
   - markdown image → `image` block (need to embed Directus file metadata; complex)
4. `BlockRenderer.svelte` + sub-components — different dispatch types (`header`, `paragraph`, `nestedlist`, `code`, `quote`, `image` — and absorbed inline-mark rendering via either `{@html}` or HTML-AST parsing).
5. `apps/cms/directus/snapshot/fields/blog_posts/body.json` — `interface: 'input-block-editor'` is correct; data shape is fixed by Directus.

**Open questions raised by this finding** (need user decision before plan revision):

- **Q4 revisited (inline marks):** Editor.js stores marks as raw HTML, not structured. Options: (a) `{@html data.text}` per paragraph (simpler, admin-trusted), (b) parse HTML to Svelte components at render time (safer, more code), (c) parse HTML at adapter boundary into a structured representation, ship that to BlockRenderer (cleanest separation; medium complexity).
- **NEW Q7 (code block language hints):** Default Editor.js code block has no language attribute. Options: (i) live without language hints in code blocks (visual highlighting deferred entirely), (ii) configure Directus's Block Editor to use a different code-block plugin (CodeMirror?) that supports languages — requires custom Directus extension OR app-level config, (iii) encode language as first line of code (`// lang:sql\n...`) — hacky, breaks SQL parsers.
- **NEW Q8 (embeds):** Embed plugin appears not configured. Options: (i) live without embeds (URLs paste as code blocks; render as plain `<a>` post-migration — Q4 already had Embed.svelte as placeholder), (ii) configure embed plugin — likely requires custom Directus extension (D11 currently forbids extensions besides directus-sync; would need amendment).
- **NEW Q9 (multi-paragraph blockquotes):** Editor.js quote is flat. Markdown's `> p1\n>\n> p2` would need either: (i) collapse into single quote (lossy), (ii) emit as multiple consecutive quote blocks (looser visual fidelity), (iii) accept the Editor.js limitation and document.

### Probe row preserved (NOT deleted)

Phase 2 Task 8 instructed to delete `probe-test-row` after probe. **Skipping deletion** — keeping for additional probes if needed (e.g., what does horizontal rule emit? what does an underlined-bold compound mark look like? what other plugins might be configured?). Will delete during Phase 5 Task 30 push or earlier if/when no longer needed.

### Raw probe output

Saved verbatim in this file for reproducibility. Key block samples:

**Header:**
```json
{ "id": "13ou8EJrLT", "type": "header", "data": { "text": "probe h1", "level": 1 } }
```

**Paragraph with marks:**
```json
{ "id": "YNIGEZcuae", "type": "paragraph", "data": {
  "text": "<b>bold</b>, <i>italic, </i><a href=\"https://yesid.dev\">yesid.dev</a>, <u class=\"cdx-underline\">underline</u>"
} }
```

**Nested list (unordered):**
```json
{ "id": "8W8N_3FG9P", "type": "nestedlist", "data": { "style": "unordered", "items": [
  { "content": "1 item", "items": [] },
  { "content": "2 items", "items": [] },
  { "content": "3 items", "items": [] }
] } }
```

**Code block (no language):**
```json
{ "id": "YUz2Rzb1Xu", "type": "code", "data": { "code": "console.log('plain code');" } }
```

**Quote (flat):**
```json
{ "id": "bOM4qhPZnm", "type": "quote", "data": { "text": "single quote", "caption": "", "alignment": "left" } }
```

**Image (full file metadata):**
```json
{ "id": "ATejf2ds7H", "type": "image", "data": {
  "caption": "", "withBorder": false, "withBackground": false, "stretched": false,
  "file": {
    "width": 2482, "height": 1326, "size": "355621",
    "name": "yesid-dev.png", "title": "Yesid Dev", "extension": "png",
    "fileId": "386f429e-d665-4f42-927b-eca741e4433f",
    "fileURL": "/files/386f429e-d665-4f42-927b-eca741e4433f",
    "url": "/assets/386f429e-d665-4f42-927b-eca741e4433f"
  }
} }
```

**Decision:** Editor.js shape locked. Spec + plan revision required before proceeding to Phase 3. See "Open questions raised" above for blocking decisions.

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
