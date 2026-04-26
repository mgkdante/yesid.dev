# Slice 18f — Blog + Block Editor + BlockRenderer · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `apps/web/src/lib/content/blog.ts` (Vite glob + `marked.parse`) to Directus 11 (`cms.yesid.dev`). Introduce the **first production Block Editor consumer** (`BlockRenderer.svelte`) and the **markdown→Block Editor migration helper** (`migrate-markdown-to-blocks.ts`). Roll in [#41](https://github.com/mgkdante/yesid.dev/issues/41) (projects body upgrade: textarea → Block Editor) so `BlockRenderer` is validated on 2 content types from day one. Generalize the 4-shape morph constant (`apps/web/src/lib/utils/shapes.ts`) into a CMS-managed `morph_shapes` collection so editors can add a 10-sided shape without a code change.

**Architecture:** 4 new collections (`blog_posts` + `blog_posts_translations` + `illustrations` + `morph_shapes`) + 1 modified collection set (`projects` gains `svg_illustration` M2O; `projects_translations.description` and `projects_sections_translations.content` flip from textarea to Block Editor). New CMS-side migration helper `apps/cms/scripts/migrate-markdown-to-blocks.ts` (token-AST → Block Editor JSON; reused for #41 plain-text wrap via `wrapPlainText`). New consumer-side `apps/web/src/lib/components/cms/BlockRenderer.svelte` + 11 block sub-components, dispatching on `node.type` with Svelte component recursion for inline marks (no `{@html}` in inline path). Adapter port adds `bodyBySlug` (13th blog method) and `content.morphShapes`. Single-line hybrid flip at `apps/web/src/lib/adapters/index.ts`.

**Tech Stack:** Directus 11.17.3 · directus-sync · `@directus/sdk@^20` · Zod · `marked` (CMS-side AST only — D15) · Bun 1.3 runtime · vitest · `bun:test` · `@repo/shared` (types + Zod + pure utils only — D14) · SvelteKit 2 + Svelte 5 (consumer) · Cloudflare R2 (asset storage) · Neon Postgres (PITR).

**Spec:** [docs/slices/slice-18/18f-blog-block-editor/spec.md](spec.md)

**Inherits:**
- 18c lib helpers: `apps/cms/scripts/lib/{sdk,auth,logger,catch-error,bottleneck,read-fixture,loaders,chunk-array}.ts`
- 18c web foundations: `createQueuedFetch`, `parsePort`, `PreviewContext`, WeakMap memo, `asset(uuid, preset)` helper
- 18d asset pipeline: `assetIdFor()` / `assetIdForOrUndefined()` from `@repo/shared` + `directus_files` Public folder-scope read
- 18e patterns: slug-as-PK, translations junction, cascade FK Public-policy filter syntax (`<fk>.status _eq "published"`), `_sync_default_public_policy`, `_sync_human_editor_policy`

---

## ⚠️ Phase 2 retro-amendments (2026-04-25 — IMPORTANT)

**Block Editor is Editor.js, not tiptap.** P3 probe (Phase 2 Task 7) revealed the actual JSON shape Directus 11.17.3 emits is Editor.js v2.31.x. This invalidates the working-assumption code blocks in **Phases 3, 6, and 10** of this plan. **Read [decisions.md § Amendments AM1–AM7](decisions.md#amendments-2026-04-25--phase-2-p3-probe-findings)** and the **probe output in [research.md § P3](research.md#p3--block-editor-json-output-shape)** before implementing those phases.

Quick summary of what changes:

| Plan section | Original (tiptap, wrong) | Corrected (Editor.js, AM1–AM6) |
|---|---|---|
| **Phase 3 Task 10** (Zod schema) | `BlockEditorDoc = { type: 'doc', content: [...] }` | `BlockEditorDoc = { time, blocks, version }`; per-block `{ id, type, data }` with `data` shape varying per type |
| **Phase 3 Tasks 11–15** (helpers) | Walks `doc.content` array of structured nodes | Walks `doc.blocks` array; extracts text from `data.text` (HTML string), `data.code`, `data.items[].content`, etc. |
| **Phase 6** (migrate-markdown) | Outputs tiptap shape | Outputs Editor.js shape; markdown tokens map to `header`/`paragraph`/`nestedlist`/`code`/`quote`/`image`/`delimiter` blocks; inline marks emitted as raw HTML inside `data.text`; **language hints from fenced code dropped** (AM3) |
| **Phase 10 BlockRenderer** | Dispatches on `node.type` (heading/paragraph/codeBlock/etc.) | Dispatches on `block.type` (header/paragraph/code/quote/image/nestedlist/delimiter); paragraph + header use `{@html data.text}` (AM2); CodeBlock renders plain `<pre><code>` (no language) |
| **Phase 10 InlineContent.svelte** | Required for tiptap mark composition | **Cancelled.** Marks are HTML in data.text; no per-mark Svelte components needed |
| **Phase 10 Embed.svelte** | Placeholder | Stays placeholder — embed plugin not configured (AM4) |

When dispatching subagents for Phases 3, 6, 10: provide the corrected Editor.js types/code in the prompt (not the original plan code blocks). Reference `research.md § P3` for the live JSON examples + `decisions.md § AM1–AM7` for the locked rationale.

---

## Phase 1 — Sub-slice setup (3 tasks)

**Exit gate:** sub-slice bundle exists at `docs/slices/slice-18/18f-blog-block-editor/`; whole-slice plan.md flagged 18f in flight; Directus auth env vars verified working.

### Task 1: Verify sub-slice bundle (already created by brainstorm)

**Files:**
- Read: `docs/slices/slice-18/18f-blog-block-editor/{spec.md,research.md,decisions.md,plan.md}`

- [ ] **Step 1: Confirm all 4 sub-slice docs exist and are committed**

```bash
ls docs/slices/slice-18/18f-blog-block-editor/
git log --oneline -2 -- docs/slices/slice-18/18f-blog-block-editor/
```

Expected: 4 files (`spec.md`, `research.md`, `decisions.md`, `plan.md`); brainstorm commit `ef7aaa2` visible.

If `plan.md` is missing from the commit (it lands separately after writing-plans), expect to commit it during this task.

- [ ] **Step 2: Commit plan.md if it isn't already committed**

```bash
git status docs/slices/slice-18/18f-blog-block-editor/plan.md
git add docs/slices/slice-18/18f-blog-block-editor/plan.md
git commit -m "docs(slice-18 18f): implementation plan — 13 phases"
```

If already committed: skip.

---

### Task 2: Flag 18f in flight in whole-slice plan.md

**Files:**
- Modify: `docs/slices/slice-18/plan.md` (status table row + § 18f section)

- [ ] **Step 1: Update status-table row for 18f**

Find:

```markdown
| **18f** | Blog + Block Editor + BlockRenderer.svelte | ⏸ planned | 1.5–2 sessions | — |
```

Replace with:

```markdown
| **18f** | Blog + Block Editor + BlockRenderer.svelte | 🟡 in flight | 2–2.5 sessions | [18f-blog-block-editor/](18f-blog-block-editor/) |
```

(Effort widened to 2–2.5 sessions because #41 + morph_shapes folded into 18f scope per Q3 + Q6.)

- [ ] **Step 2: Add note under § 18f section anchoring the bundle**

Find the existing `## 18f — Blog + Block Editor + BlockRenderer.svelte (⏸ planned)` heading. Update:

```markdown
## 18f — Blog + Block Editor + BlockRenderer.svelte (🟡 in flight)

**Scope:** Most Svelte-side work in slice-18; introduces Block Editor consumer component. **Folds in [#41](https://github.com/mgkdante/yesid.dev/issues/41) (projects body migration) per Q3** + new `morph_shapes` collection per Q6.
```

(Keep the rest of the existing § 18f section as-is.)

- [ ] **Step 3: Commit**

```bash
git add docs/slices/slice-18/plan.md
git commit -m "docs(slice-18): flag 18f in flight"
```

---

### Task 3: Verify Directus auth + env vars working

**Files:**
- Read: `apps/cms/scripts/lib/auth.ts`, `apps/cms/scripts/lib/sdk.ts`

- [ ] **Step 1: Export env vars per session-start prompt**

```bash
export DIRECTUS_ADMIN_EMAIL='mgkdante@gmail.com'
export DIRECTUS_ADMIN_PASSWORD=$(op read 'op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password')
export PUBLIC_DIRECTUS_URL='https://cms.yesid.dev'
# DIRECTUS_ADMIN_TOKEN remains UNSET
```

- [ ] **Step 2: Verify with a healthcheck request**

```bash
curl -s https://cms.yesid.dev/server/health | head -c 200
```

Expected: JSON with `"status":"ok"` (or similar healthy payload).

- [ ] **Step 3: Verify auth via password→JWT exchange**

```bash
curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | head -c 200
```

Expected: JSON response containing `"access_token":"..."`. If 401, retest password value.

No commit — environment-only verification.

---

## Phase 2 — P3 Block Editor JSON shape probe (5 tasks)

**Exit gate:** `BlockEditorDocSchema` Zod schema landed in `packages/shared/src/types/blocks.ts` reflecting actual JSON Directus 11.17.3 emits; research.md updated; assumed shape either confirmed or amended.

### Task 4: Author minimal probe-only `blog_posts` collection JSON

**Files:**
- Create: `apps/cms/directus/snapshot/collections/blog_posts.json`
- Create: `apps/cms/directus/snapshot/fields/blog_posts/id.json`
- Create: `apps/cms/directus/snapshot/fields/blog_posts/body.json`

> Probe-only schema — minimal fields just to receive Block Editor content. The full schema (with status, lang, category, etc.) lands in Phase 5. The probe collection is reused for the full schema in Phase 5 (Tasks 16+) without a recreate.

- [ ] **Step 1: Create the collection-meta JSON**

```json
{
  "collection": "blog_posts",
  "meta": {
    "accountability": "all",
    "archive_field": "status",
    "archive_value": "archived",
    "unarchive_value": "draft",
    "archive_app_filter": true,
    "collapse": "open",
    "color": null,
    "display_template": "{{translations.title}}",
    "group": null,
    "hidden": false,
    "icon": "article",
    "item_duplication_fields": [],
    "note": "Blog posts. ai-editor cannot publish; cannot delete. Body uses Block Editor (rich content per CONVENTIONS § 7).",
    "preview_url": "https://yesid.dev/blog/{{id}}?share={{$CURRENT_SHARE.token}}",
    "singleton": false,
    "sort": null,
    "sort_field": "sort",
    "translations": null,
    "versioning": true
  },
  "schema": {
    "name": "blog_posts"
  }
}
```

- [ ] **Step 2: Create the `id` field**

```json
{
  "collection": "blog_posts",
  "field": "id",
  "type": "string",
  "meta": {
    "collection": "blog_posts",
    "field": "id",
    "hidden": false,
    "interface": "input",
    "note": "Slug — kebab-case, URL-safe. Becomes the route segment at /blog/{id}.",
    "options": { "slug": true, "trim": true },
    "readonly": false,
    "required": true,
    "searchable": true,
    "sort": 1,
    "special": null,
    "validation": {
      "_and": [
        { "id": { "_regex": "^[a-z0-9]+(-[a-z0-9]+)*$" } }
      ]
    },
    "validation_message": "Slug must be kebab-case (lowercase letters/digits with single hyphens).",
    "width": "full"
  },
  "schema": {
    "name": "id",
    "table": "blog_posts",
    "data_type": "character varying",
    "max_length": 255,
    "is_nullable": false,
    "is_primary_key": true,
    "is_unique": true
  }
}
```

- [ ] **Step 3: Create the `body` field (Block Editor)**

```json
{
  "collection": "blog_posts",
  "field": "body",
  "type": "json",
  "meta": {
    "collection": "blog_posts",
    "field": "body",
    "hidden": false,
    "interface": "input-block-editor",
    "note": "Post body. Block Editor — supports headings, paragraphs (with bold/italic/link/inline-code marks), ordered/bullet lists, code blocks (with language), blockquotes, horizontal rules, images (Directus assets), embeds.",
    "options": null,
    "readonly": false,
    "required": false,
    "searchable": true,
    "sort": 99,
    "special": ["cast-json"],
    "width": "full"
  },
  "schema": {
    "name": "body",
    "table": "blog_posts",
    "data_type": "jsonb",
    "is_nullable": true
  }
}
```

- [ ] **Step 4: Commit (probe schema only — full schema lands in Phase 5)**

```bash
git add apps/cms/directus/snapshot/collections/blog_posts.json apps/cms/directus/snapshot/fields/blog_posts/
git commit -m "feat(slice-18 18f Phase 2 Task 4): probe-only blog_posts schema for P3"
```

---

### Task 5: Push probe schema via directus-sync

**Files:**
- Run: `bun run sync:push` (workspace command from `apps/cms/`)

- [ ] **Step 1: Run dry-diff first**

```bash
cd apps/cms
bun run sync:diff
```

Expected: 1 collection to create (`blog_posts`), 2 fields to create (`id`, `body`), 0 deletions.

- [ ] **Step 2: Apply the push**

```bash
bun run sync:push
```

Expected: HTTP 200; output confirms collection + fields created.

- [ ] **Step 3: Verify live via curl**

```bash
JWT=$(curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $JWT" \
  https://cms.yesid.dev/collections/blog_posts | jq '.data.collection'
```

Expected: `"blog_posts"`.

No commit — operates on live state.

---

### Task 6: Create probe test row in Data Studio with full block diversity

**Files:**
- Live action via Data Studio at `https://cms.yesid.dev/admin/content/blog_posts`

- [ ] **Step 1: Open Data Studio + create item**

Navigate: `https://cms.yesid.dev/admin/content/blog_posts/+`. Set `id: probe-test-row`.

- [ ] **Step 2: In Block Editor, add ALL block types**

Add the following blocks in this order, then click "Save":

1. Heading 1: "Probe Heading 1"
2. Heading 2: "Probe Heading 2"
3. Heading 3: "Probe Heading 3"
4. Heading 4: "Probe Heading 4"
5. Paragraph: "Plain text paragraph."
6. Paragraph with marks: select words and apply **bold**, *italic*, `inline code`, [link → https://yesid.dev], ~~strike~~. Include a hard break (Shift+Enter).
7. Bullet list: 3 items: "First", "Second", "Third"
8. Ordered list: 3 items: "Step one", "Step two", "Step three"
9. Bullet list with nested ordered list: outer = "Outer A", inner under A = ["Sub 1", "Sub 2"], outer = "Outer B"
10. Code block (no language hint): `console.log('plain code');`
11. Code block (TypeScript hint): `const x: number = 42;`
12. Code block (SQL hint): `SELECT * FROM users WHERE active = true;`
13. Blockquote (single-paragraph): "Single-paragraph quote."
14. Blockquote (multi-paragraph): "First quote paragraph." + "Second quote paragraph."
15. Horizontal rule
16. Image: pick any existing illustration UUID via the file picker (use a `/services/` folder file)
17. Embed: paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

- [ ] **Step 3: Confirm save success**

Page should redirect to `/admin/content/blog_posts/probe-test-row` with all 17 blocks visible.

No commit — operates on live state.

---

### Task 7: Read probe row JSON + document shape in research.md

**Files:**
- Modify: `docs/slices/slice-18/18f-blog-block-editor/research.md`

- [ ] **Step 1: Fetch probe row body via curl**

```bash
JWT=$(curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $JWT" \
  'https://cms.yesid.dev/items/blog_posts/probe-test-row?fields=body' \
  | jq '.data.body' > /tmp/probe-body.json

cat /tmp/probe-body.json
```

Expected: JSON object representing the Block Editor doc.

- [ ] **Step 2: Update `research.md` § "P3 — Block Editor JSON output shape"**

Replace the `**Result:** TBD` line with documented findings. Include:

- Top-level shape: `{ type: 'doc', content: [...] }` (confirmed/diverged from working assumption)
- Block-type list: name each emitted `node.type` value
- Inline-mark list: name each emitted `mark.type` value
- Heading attribute schema: `attrs.level` shape; whether Directus emits `attrs.id` automatically or leaves it absent
- Code block attribute: `attrs.language` shape (string vs null)
- Image attribute: `attrs.src` value — UUID? URL? `assets/{uuid}` path?
- Link mark attribute: `attrs.href` shape
- Embed shape: how URL is stored; whether platform auto-detected
- Hard break shape: `{ type: 'hardBreak' }` or alternative
- Paste the actual JSON output as a fenced code block under "Result"

Also update the `**Decision:**` line — record whether the Zod schema in working-assumption form is correct or needs adjustments. List adjustments concretely.

- [ ] **Step 3: Commit**

```bash
git add docs/slices/slice-18/18f-blog-block-editor/research.md
git commit -m "docs(slice-18 18f Phase 2 Task 7): P3 probe — document Block Editor JSON shape"
```

---

### Task 8: Delete probe row + roll forward research.md notes

**Files:**
- Live action via Data Studio

- [ ] **Step 1: Delete `probe-test-row` via Data Studio**

Navigate to the row, click "Delete". Probe schema (collection itself) stays — Phase 5 fleshes it out.

- [ ] **Step 2: Verify deletion**

```bash
JWT=$(curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $JWT" \
  'https://cms.yesid.dev/items/blog_posts/probe-test-row' \
  | jq
```

Expected: 404 / `errors[0].extensions.code: 'RECORD_NOT_UNIQUE' or 'NOT_FOUND'`.

No commit — operates on live state.

---

## Phase 3 — `@repo/shared` types + helpers (8 tasks)

**Exit gate:** `BlockEditorDocSchema` (Zod) + `MorphShape` interface in `@repo/shared`; pure helpers in `packages/shared/src/utils/blocks.ts` with full unit-test coverage; both apps build green against new exports.

### Task 9: Add `MorphShape` interface to `packages/shared/src/types/content.ts`

**Files:**
- Modify: `packages/shared/src/types/content.ts` (append at end)

- [ ] **Step 1: Append the `MorphShape` interface**

```ts
// ---------------------------------------------------------------------------
// Morph shapes (geometric morph-target library — slice-18 18f)
// ---------------------------------------------------------------------------
//
// Replaces the hardcoded SHAPES const in apps/web/src/lib/utils/shapes.ts.
// Editors add/remove shapes via Data Studio; consumers read from the
// adapter (cached module-level after first fetch).

export interface MorphShape {
	id: string;
	label: string;
	path: string;     // SVG path d= attribute, e.g. "M24 8 L40 38 L8 38 Z"
	viewbox: string;  // default "0 0 48 48"
	sort: number;
}
```

- [ ] **Step 2: Re-export from index**

In `packages/shared/src/index.ts`, the wildcard export from `./types/content` already covers this. Verify:

```bash
grep -n "from './types/content'" packages/shared/src/index.ts
```

If not exported: append `export * from './types/content.js';` if no such line exists. Otherwise no change.

- [ ] **Step 3: Verify build of @repo/shared**

```bash
cd packages/shared
bun run build  # if a build script exists; else skip — it's a type-only package
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/content.ts packages/shared/src/index.ts
git commit -m "feat(slice-18 18f Phase 3 Task 9): MorphShape interface in @repo/shared"
```

---

### Task 10: Create `BlockEditorDoc` types + Zod schema

**Files:**
- Create: `packages/shared/src/types/blocks.ts`

> NOTE: the Zod schema below reflects the working assumption (tiptap-style). If Phase 2 P3 probe found divergences, adjust this file accordingly before continuing.

- [ ] **Step 1: Write the file**

```ts
// Block Editor document types + Zod schema.
//
// Locked against the live Directus 11.17.3 Block Editor JSON shape via
// Phase 2 P3 probe (slice-18 18f).
//
// Per D14: types + Zod only. No runtime helpers in `types/`; pure utils
// live in `utils/blocks.ts`.
//
// Per D15: Block Editor is the only rich-content interface in slice-18+.
// `BlockRenderer.svelte` is the single source of truth for rendering;
// no `marked.parse` in consumer bundle after 18i closes.

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Inline marks
// ---------------------------------------------------------------------------

export const BoldMarkSchema = z.object({ type: z.literal('bold') });
export const ItalicMarkSchema = z.object({ type: z.literal('italic') });
export const CodeMarkSchema = z.object({ type: z.literal('code') });
export const StrikeMarkSchema = z.object({ type: z.literal('strike') });
export const LinkMarkSchema = z.object({
	type: z.literal('link'),
	attrs: z.object({
		href: z.string(),
		title: z.string().nullish(),
		target: z.string().nullish(),
	}),
});

export const MarkSchema = z.discriminatedUnion('type', [
	BoldMarkSchema,
	ItalicMarkSchema,
	CodeMarkSchema,
	StrikeMarkSchema,
	LinkMarkSchema,
]);

export type Mark = z.infer<typeof MarkSchema>;

// ---------------------------------------------------------------------------
// Inline nodes (text + hard break)
// ---------------------------------------------------------------------------

export const TextNodeSchema = z.object({
	type: z.literal('text'),
	text: z.string(),
	marks: z.array(MarkSchema).optional(),
});

export const HardBreakNodeSchema = z.object({
	type: z.literal('hardBreak'),
});

export const InlineNodeSchema = z.discriminatedUnion('type', [
	TextNodeSchema,
	HardBreakNodeSchema,
]);

export type TextNode = z.infer<typeof TextNodeSchema>;
export type HardBreakNode = z.infer<typeof HardBreakNodeSchema>;
export type InlineNode = z.infer<typeof InlineNodeSchema>;

// ---------------------------------------------------------------------------
// Block nodes (z.lazy for self-reference: lists, blockquotes, listItems
// can contain other block nodes)
// ---------------------------------------------------------------------------

export type BlockEditorNode =
	| HeadingNode
	| ParagraphNode
	| BulletListNode
	| OrderedListNode
	| ListItemNode
	| CodeBlockNode
	| BlockquoteNode
	| HorizontalRuleNode
	| ImageNode
	| EmbedNode;

export interface HeadingNode {
	type: 'heading';
	attrs: { level: 1 | 2 | 3 | 4; id?: string };
	content: InlineNode[];
}

export interface ParagraphNode {
	type: 'paragraph';
	content: InlineNode[];
}

export interface BulletListNode {
	type: 'bulletList';
	content: ListItemNode[];
}

export interface OrderedListNode {
	type: 'orderedList';
	content: ListItemNode[];
}

export interface ListItemNode {
	type: 'listItem';
	content: BlockEditorNode[];  // typically Paragraph or nested list
}

export interface CodeBlockNode {
	type: 'codeBlock';
	attrs: { language: string | null };
	content: TextNode[];
}

export interface BlockquoteNode {
	type: 'blockquote';
	content: BlockEditorNode[];
}

export interface HorizontalRuleNode {
	type: 'horizontalRule';
}

export interface ImageNode {
	type: 'image';
	attrs: {
		src: string;       // Directus file UUID or assets-path
		alt: string;
		title?: string | null;
	};
}

export interface EmbedNode {
	type: 'embed';
	attrs: {
		url: string;
		service?: string | null;  // e.g. "youtube", "vimeo"
	};
}

// Lazy Zod schemas matching the recursive types
const HeadingNodeSchema: z.ZodType<HeadingNode> = z.lazy(() =>
	z.object({
		type: z.literal('heading'),
		attrs: z.object({
			level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
			id: z.string().optional(),
		}),
		content: z.array(InlineNodeSchema),
	})
);

const ParagraphNodeSchema: z.ZodType<ParagraphNode> = z.lazy(() =>
	z.object({
		type: z.literal('paragraph'),
		content: z.array(InlineNodeSchema),
	})
);

const ListItemNodeSchema: z.ZodType<ListItemNode> = z.lazy(() =>
	z.object({
		type: z.literal('listItem'),
		content: z.array(BlockEditorNodeSchema),
	})
);

const BulletListNodeSchema: z.ZodType<BulletListNode> = z.lazy(() =>
	z.object({
		type: z.literal('bulletList'),
		content: z.array(ListItemNodeSchema),
	})
);

const OrderedListNodeSchema: z.ZodType<OrderedListNode> = z.lazy(() =>
	z.object({
		type: z.literal('orderedList'),
		content: z.array(ListItemNodeSchema),
	})
);

const CodeBlockNodeSchema: z.ZodType<CodeBlockNode> = z.lazy(() =>
	z.object({
		type: z.literal('codeBlock'),
		attrs: z.object({ language: z.string().nullable() }),
		content: z.array(TextNodeSchema),
	})
);

const BlockquoteNodeSchema: z.ZodType<BlockquoteNode> = z.lazy(() =>
	z.object({
		type: z.literal('blockquote'),
		content: z.array(BlockEditorNodeSchema),
	})
);

const HorizontalRuleNodeSchema: z.ZodType<HorizontalRuleNode> = z.lazy(() =>
	z.object({ type: z.literal('horizontalRule') })
);

const ImageNodeSchema: z.ZodType<ImageNode> = z.lazy(() =>
	z.object({
		type: z.literal('image'),
		attrs: z.object({
			src: z.string(),
			alt: z.string(),
			title: z.string().nullish(),
		}),
	})
);

const EmbedNodeSchema: z.ZodType<EmbedNode> = z.lazy(() =>
	z.object({
		type: z.literal('embed'),
		attrs: z.object({
			url: z.string(),
			service: z.string().nullish(),
		}),
	})
);

export const BlockEditorNodeSchema: z.ZodType<BlockEditorNode> = z.lazy(() =>
	z.discriminatedUnion('type', [
		HeadingNodeSchema as z.ZodObject<z.ZodRawShape>,
		ParagraphNodeSchema as z.ZodObject<z.ZodRawShape>,
		BulletListNodeSchema as z.ZodObject<z.ZodRawShape>,
		OrderedListNodeSchema as z.ZodObject<z.ZodRawShape>,
		ListItemNodeSchema as z.ZodObject<z.ZodRawShape>,
		CodeBlockNodeSchema as z.ZodObject<z.ZodRawShape>,
		BlockquoteNodeSchema as z.ZodObject<z.ZodRawShape>,
		HorizontalRuleNodeSchema as z.ZodObject<z.ZodRawShape>,
		ImageNodeSchema as z.ZodObject<z.ZodRawShape>,
		EmbedNodeSchema as z.ZodObject<z.ZodRawShape>,
	])
);

// ---------------------------------------------------------------------------
// Top-level doc
// ---------------------------------------------------------------------------

export interface BlockEditorDoc {
	type: 'doc';
	content: BlockEditorNode[];
}

export const BlockEditorDocSchema: z.ZodType<BlockEditorDoc> = z.object({
	type: z.literal('doc'),
	content: z.array(BlockEditorNodeSchema),
});

// ---------------------------------------------------------------------------
// TOC heading helper type (consumed by extractHeadings + TableOfContents)
// ---------------------------------------------------------------------------

export interface TocHeading {
	id: string;
	text: string;
	level: 1 | 2 | 3 | 4;
}
```

- [ ] **Step 2: Re-export from index**

```bash
grep -n "from './types/blocks'" packages/shared/src/index.ts
```

If absent, append to `packages/shared/src/index.ts`:

```ts
export * from './types/blocks.js';
```

- [ ] **Step 3: Verify build**

```bash
cd packages/shared
bun run build 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/blocks.ts packages/shared/src/index.ts
git commit -m "feat(slice-18 18f Phase 3 Task 10): BlockEditorDoc types + Zod schema in @repo/shared"
```

---

### Task 11: Create `kebabSlug` + `extractText` helpers

**Files:**
- Create: `packages/shared/src/utils/blocks.ts`
- Create: `packages/shared/src/utils/blocks.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/shared/src/utils/blocks.test.ts
import { describe, it, expect } from 'bun:test';
import { kebabSlug, extractText } from './blocks';
import type { BlockEditorDoc } from '../types/blocks';

describe('kebabSlug', () => {
	it('lowercases and joins with hyphens', () => {
		expect(kebabSlug('Why I Left ORM')).toBe('why-i-left-orm');
	});

	it('strips punctuation', () => {
		expect(kebabSlug('Hello, World!')).toBe('hello-world');
	});

	it('collapses multiple whitespace runs into single hyphens', () => {
		expect(kebabSlug('a   b   c')).toBe('a-b-c');
	});

	it('strips leading + trailing hyphens', () => {
		expect(kebabSlug('  hello  ')).toBe('hello');
	});

	it('handles empty input', () => {
		expect(kebabSlug('')).toBe('');
	});

	it('preserves digits', () => {
		expect(kebabSlug('Top 5 Tips')).toBe('top-5-tips');
	});
});

describe('extractText', () => {
	it('extracts text from a single paragraph', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world.' }] },
			],
		};
		expect(extractText(doc)).toBe('Hello world.');
	});

	it('joins text across multiple paragraphs with spaces', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'First.' }] },
				{ type: 'paragraph', content: [{ type: 'text', text: 'Second.' }] },
			],
		};
		expect(extractText(doc)).toBe('First. Second.');
	});

	it('extracts heading + paragraph + list text', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
				{ type: 'paragraph', content: [{ type: 'text', text: 'Body.' }] },
				{
					type: 'bulletList',
					content: [
						{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
						{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
					],
				},
			],
		};
		expect(extractText(doc)).toBe('Title Body. one two');
	});

	it('extracts text from code blocks', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: 'sql' },
					content: [{ type: 'text', text: 'SELECT 1;' }],
				},
			],
		};
		expect(extractText(doc)).toBe('SELECT 1;');
	});

	it('extracts text from blockquotes (recurses)', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'blockquote',
					content: [
						{ type: 'paragraph', content: [{ type: 'text', text: 'Quoted.' }] },
					],
				},
			],
		};
		expect(extractText(doc)).toBe('Quoted.');
	});

	it('skips horizontal rules + images + embeds (no extractable text)', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
				{ type: 'horizontalRule' },
				{ type: 'image', attrs: { src: 'x', alt: 'pic' } },
				{ type: 'embed', attrs: { url: 'y' } },
				{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] },
			],
		};
		expect(extractText(doc)).toBe('a b');
	});
});
```

- [ ] **Step 2: Run tests; expect them to fail (file doesn't exist)**

```bash
cd packages/shared
bun test src/utils/blocks.test.ts 2>&1 | head -10
```

Expected: import error / file not found.

- [ ] **Step 3: Write the helpers**

```ts
// packages/shared/src/utils/blocks.ts
//
// Pure helpers for working with Block Editor docs (slice-18 18f).
//
// Per D14: type + Zod + pure utils only. No `$lib`/app-specific imports.
// No async; no I/O. Pure transforms — same input → same output.

import type {
	BlockEditorDoc,
	BlockEditorNode,
	InlineNode,
	TextNode,
	TocHeading,
} from '../types/blocks';

/**
 * Slugify a heading or label into kebab-case ASCII.
 * Used for deterministic heading ids in BlockRenderer.
 */
export function kebabSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/[\s-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Walk a Block Editor doc and concatenate all text content.
 * Block boundaries become single spaces; horizontal rules / images /
 * embeds contribute no text.
 */
export function extractText(doc: BlockEditorDoc): string {
	const parts: string[] = [];
	for (const node of doc.content) {
		const text = nodeText(node);
		if (text) parts.push(text);
	}
	return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function nodeText(node: BlockEditorNode): string {
	switch (node.type) {
		case 'heading':
		case 'paragraph':
			return inlineText(node.content);
		case 'codeBlock':
			return node.content.map((c) => c.text).join('');
		case 'bulletList':
		case 'orderedList':
			return node.content.map((li) => listItemText(li)).join(' ');
		case 'blockquote': {
			const parts: string[] = [];
			for (const child of node.content) {
				const t = nodeText(child);
				if (t) parts.push(t);
			}
			return parts.join(' ');
		}
		case 'horizontalRule':
		case 'image':
		case 'embed':
			return '';
		case 'listItem':
			return listItemText(node);
		default:
			return '';
	}
}

function listItemText(li: { content: BlockEditorNode[] }): string {
	const parts: string[] = [];
	for (const child of li.content) {
		const t = nodeText(child);
		if (t) parts.push(t);
	}
	return parts.join(' ');
}

function inlineText(nodes: InlineNode[]): string {
	const parts: string[] = [];
	for (const n of nodes) {
		if (n.type === 'text') parts.push(n.text);
	}
	return parts.join('');
}

// extractHeadings, wordCount, readingTime, wrapPlainText, serializeBlocksToHtml
// land in subsequent tasks.
```

- [ ] **Step 4: Run tests; expect green**

```bash
cd packages/shared
bun test src/utils/blocks.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/utils/blocks.ts packages/shared/src/utils/blocks.test.ts
git commit -m "feat(slice-18 18f Phase 3 Task 11): kebabSlug + extractText helpers"
```

---

### Task 12: Add `wordCount` + `readingTime` helpers

**Files:**
- Modify: `packages/shared/src/utils/blocks.ts`
- Modify: `packages/shared/src/utils/blocks.test.ts`

- [ ] **Step 1: Write the failing tests (append to existing test file)**

```ts
describe('wordCount', () => {
	it('counts words separated by spaces', () => {
		expect(wordCount('hello world')).toBe(2);
	});

	it('returns 0 for empty input', () => {
		expect(wordCount('')).toBe(0);
	});

	it('treats multiple whitespace as a single separator', () => {
		expect(wordCount('a    b\tc\nd')).toBe(4);
	});

	it('counts punctuation as part of adjacent words (not separate)', () => {
		expect(wordCount("don't stop now.")).toBe(3);
	});
});

describe('readingTime', () => {
	it('returns 1 minute minimum', () => {
		expect(readingTime(1)).toBe(1);
		expect(readingTime(0)).toBe(1);
	});

	it('uses 200 WPM by default', () => {
		expect(readingTime(200)).toBe(1);
		expect(readingTime(400)).toBe(2);
		expect(readingTime(401)).toBe(3);  // ceil
	});

	it('accepts custom WPM', () => {
		expect(readingTime(300, 100)).toBe(3);
	});
});
```

(Add `wordCount, readingTime` to the import line at the top of the test file.)

- [ ] **Step 2: Run tests; expect FAIL (helpers undefined)**

```bash
cd packages/shared
bun test src/utils/blocks.test.ts 2>&1 | grep -E "FAIL|undefined" | head -5
```

- [ ] **Step 3: Append helpers to `packages/shared/src/utils/blocks.ts`**

```ts
/**
 * Count whitespace-separated tokens. Returns 0 for empty / whitespace-only.
 */
export function wordCount(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

/**
 * Reading-time estimate in minutes. Default 200 WPM (industry-standard
 * for narrative copy). Returns at least 1.
 */
export function readingTime(words: number, wpm = 200): number {
	if (words <= 0) return 1;
	return Math.max(1, Math.ceil(words / wpm));
}
```

- [ ] **Step 4: Run tests; expect green**

```bash
bun test src/utils/blocks.test.ts 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/utils/blocks.ts packages/shared/src/utils/blocks.test.ts
git commit -m "feat(slice-18 18f Phase 3 Task 12): wordCount + readingTime helpers"
```

---

### Task 13: Add `extractHeadings` helper

**Files:**
- Modify: `packages/shared/src/utils/blocks.ts`
- Modify: `packages/shared/src/utils/blocks.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('extractHeadings', () => {
	it('extracts headings with deterministic ids from text', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'First Section' }] },
				{ type: 'paragraph', content: [{ type: 'text', text: 'Body.' }] },
				{ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Second' }] },
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'first-section', text: 'First Section', level: 2 },
			{ id: 'second', text: 'Second', level: 3 },
		]);
	});

	it('disambiguates duplicate slugs with -2, -3 suffix', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Setup' }] },
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Setup' }] },
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Setup' }] },
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'setup', text: 'Setup', level: 2 },
			{ id: 'setup-2', text: 'Setup', level: 2 },
			{ id: 'setup-3', text: 'Setup', level: 2 },
		]);
	});

	it('preserves caller-supplied attrs.id when present', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2, id: 'custom-id' }, content: [{ type: 'text', text: 'Custom' }] },
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'custom-id', text: 'Custom', level: 2 },
		]);
	});

	it('skips non-heading nodes', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'p' }] },
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'h' }] },
				{ type: 'horizontalRule' },
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'h', text: 'h', level: 2 },
		]);
	});
});
```

(Add `extractHeadings` to imports.)

- [ ] **Step 2: Run tests; expect FAIL**

```bash
bun test src/utils/blocks.test.ts 2>&1 | grep -E "FAIL|undefined" | head
```

- [ ] **Step 3: Append helper to `packages/shared/src/utils/blocks.ts`**

```ts
/**
 * Walk a doc and emit a flat TOC with deterministic ids.
 * Caller-supplied `attrs.id` wins; otherwise kebabSlug(text) with collision
 * suffix (-2, -3, ...) for duplicates.
 */
export function extractHeadings(doc: BlockEditorDoc): readonly TocHeading[] {
	const out: TocHeading[] = [];
	const counts = new Map<string, number>();
	for (const node of doc.content) {
		if (node.type !== 'heading') continue;
		const text = inlineText(node.content);
		const baseId = node.attrs.id ?? kebabSlug(text);
		const seen = counts.get(baseId) ?? 0;
		counts.set(baseId, seen + 1);
		const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`;
		out.push({ id, text, level: node.attrs.level });
	}
	return out;
}
```

- [ ] **Step 4: Run tests; green**

```bash
bun test src/utils/blocks.test.ts 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/utils/blocks.ts packages/shared/src/utils/blocks.test.ts
git commit -m "feat(slice-18 18f Phase 3 Task 13): extractHeadings helper"
```

---

### Task 14: Add `wrapPlainText` helper (for #41 plain-text body migration)

**Files:**
- Modify: `packages/shared/src/utils/blocks.ts`
- Modify: `packages/shared/src/utils/blocks.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('wrapPlainText', () => {
	it('wraps a single string in a single-paragraph doc', () => {
		const doc = wrapPlainText('Hello.');
		expect(doc).toEqual({
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'Hello.' }] },
			],
		});
	});

	it('preserves whitespace in the input verbatim (no normalization)', () => {
		const doc = wrapPlainText('a   b');
		expect(doc.content[0]).toEqual({
			type: 'paragraph',
			content: [{ type: 'text', text: 'a   b' }],
		});
	});

	it('splits on double newlines into multiple paragraphs', () => {
		const doc = wrapPlainText('First.\n\nSecond.');
		expect(doc.content.length).toBe(2);
		expect((doc.content[0] as ParagraphNode).content[0]).toEqual({
			type: 'text',
			text: 'First.',
		});
		expect((doc.content[1] as ParagraphNode).content[0]).toEqual({
			type: 'text',
			text: 'Second.',
		});
	});

	it('returns an empty-paragraph doc for empty input', () => {
		const doc = wrapPlainText('');
		expect(doc).toEqual({
			type: 'doc',
			content: [{ type: 'paragraph', content: [] }],
		});
	});
});
```

(Add `wrapPlainText, ParagraphNode` to imports.)

- [ ] **Step 2: Run tests; expect FAIL**

```bash
bun test src/utils/blocks.test.ts 2>&1 | grep -E "FAIL|undefined" | head
```

- [ ] **Step 3: Append helper**

```ts
/**
 * Wrap a plain-text string in a Block Editor doc. Splits on double newlines
 * to form multiple paragraphs; preserves single-newline whitespace verbatim
 * (no conversion to <br>; treat as wrapped prose).
 *
 * Used by #41 to migrate `projects_translations.description` and
 * `projects_sections_translations.content` (currently plain strings) into
 * the Block Editor field shape without authoring effort.
 */
export function wrapPlainText(str: string): BlockEditorDoc {
	if (!str) {
		return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
	}
	const paragraphs = str.split(/\n\s*\n/);
	return {
		type: 'doc',
		content: paragraphs.map((p) => ({
			type: 'paragraph' as const,
			content: [{ type: 'text' as const, text: p }],
		})),
	};
}
```

- [ ] **Step 4: Run tests; green**

```bash
bun test src/utils/blocks.test.ts 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/utils/blocks.ts packages/shared/src/utils/blocks.test.ts
git commit -m "feat(slice-18 18f Phase 3 Task 14): wrapPlainText helper for #41"
```

---

### Task 15: Add `serializeBlocksToHtml` legacy bridge

**Files:**
- Modify: `packages/shared/src/utils/blocks.ts`
- Modify: `packages/shared/src/utils/blocks.test.ts`

> Used by `directus.blog.html(slug)` legacy method during 18f. Removed in 18i with the static-adapter delete.

- [ ] **Step 1: Append failing tests**

```ts
describe('serializeBlocksToHtml', () => {
	it('serializes paragraphs to <p>', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'Hello.' }] },
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<p>Hello.</p>');
	});

	it('serializes headings with deterministic ids', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Section' }] },
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<h2 id="section">Section</h2>');
	});

	it('escapes HTML entities in text', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'a < b & c > d' }] },
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<p>a &lt; b &amp; c &gt; d</p>');
	});

	it('renders bold/italic/code/link inline marks', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'a ' },
						{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
						{ type: 'text', text: ' ' },
						{ type: 'text', text: 'em', marks: [{ type: 'italic' }] },
						{ type: 'text', text: ' ' },
						{ type: 'text', text: 'code', marks: [{ type: 'code' }] },
						{ type: 'text', text: ' ' },
						{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://x.dev' } }] },
					],
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<p>a <strong>bold</strong> <em>em</em> <code>code</code> <a href="https://x.dev">link</a></p>'
		);
	});

	it('renders bullet + ordered + nested lists', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'orderedList',
					content: [
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
						},
						{
							type: 'listItem',
							content: [
								{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
								{
									type: 'bulletList',
									content: [
										{
											type: 'listItem',
											content: [{ type: 'paragraph', content: [{ type: 'text', text: 'sub' }] }],
										},
									],
								},
							],
						},
					],
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<ol><li><p>one</p></li><li><p>two</p><ul><li><p>sub</p></li></ul></li></ol>'
		);
	});

	it('renders code blocks with language class', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: 'sql' },
					content: [{ type: 'text', text: "SELECT 1;\n-- comment" }],
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<pre><code class="language-sql">SELECT 1;\n-- comment</code></pre>'
		);
	});

	it('renders blockquotes', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'blockquote',
					content: [
						{ type: 'paragraph', content: [{ type: 'text', text: 'Quoted.' }] },
					],
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<blockquote><p>Quoted.</p></blockquote>');
	});

	it('renders horizontal rules + images + embeds + hard breaks', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'horizontalRule' },
				{ type: 'image', attrs: { src: 'uuid-1', alt: 'A picture' } },
				{ type: 'embed', attrs: { url: 'https://youtu.be/x' } },
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'a' },
						{ type: 'hardBreak' },
						{ type: 'text', text: 'b' },
					],
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<hr>' +
			'<img src="uuid-1" alt="A picture">' +
			'<a href="https://youtu.be/x" rel="noopener" target="_blank">https://youtu.be/x</a>' +
			'<p>a<br>b</p>'
		);
	});
});
```

(Add `serializeBlocksToHtml` to imports.)

- [ ] **Step 2: Run tests; expect FAIL**

```bash
bun test src/utils/blocks.test.ts 2>&1 | grep -E "FAIL|undefined" | head
```

- [ ] **Step 3: Append helper**

```ts
/**
 * Serialize a Block Editor doc to an HTML string. Used by
 * `directus.blog.html()` as a legacy bridge during 18f; removed in 18i
 * when the static adapter is deleted and consumers all use BlockRenderer.
 *
 * Output is intentionally minimal: no class hooks beyond `language-*` on
 * code blocks (the blog content card handles styling). External links get
 * `rel="noopener" target="_blank"` for safety.
 */
export function serializeBlocksToHtml(doc: BlockEditorDoc): string {
	let counts = new Map<string, number>();
	const blockHtml = (n: BlockEditorNode): string => {
		switch (n.type) {
			case 'heading': {
				const text = inlineText(n.content);
				const baseId = n.attrs.id ?? kebabSlug(text);
				const seen = counts.get(baseId) ?? 0;
				counts.set(baseId, seen + 1);
				const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`;
				return `<h${n.attrs.level} id="${id}">${inlineHtml(n.content)}</h${n.attrs.level}>`;
			}
			case 'paragraph':
				return `<p>${inlineHtml(n.content)}</p>`;
			case 'bulletList':
				return `<ul>${n.content.map((li) => blockHtml(li)).join('')}</ul>`;
			case 'orderedList':
				return `<ol>${n.content.map((li) => blockHtml(li)).join('')}</ol>`;
			case 'listItem':
				return `<li>${n.content.map((c) => blockHtml(c)).join('')}</li>`;
			case 'codeBlock': {
				const lang = n.attrs.language ?? '';
				const cls = lang ? ` class="language-${escapeAttr(lang)}"` : '';
				const code = n.content.map((t) => escapeText(t.text)).join('');
				return `<pre><code${cls}>${code}</code></pre>`;
			}
			case 'blockquote':
				return `<blockquote>${n.content.map((c) => blockHtml(c)).join('')}</blockquote>`;
			case 'horizontalRule':
				return '<hr>';
			case 'image':
				return `<img src="${escapeAttr(n.attrs.src)}" alt="${escapeAttr(n.attrs.alt)}">`;
			case 'embed':
				return `<a href="${escapeAttr(n.attrs.url)}" rel="noopener" target="_blank">${escapeText(n.attrs.url)}</a>`;
			default:
				return '';
		}
	};
	return doc.content.map(blockHtml).join('');
}

function inlineHtml(nodes: InlineNode[]): string {
	return nodes
		.map((n) => {
			if (n.type === 'hardBreak') return '<br>';
			let html = escapeText(n.text);
			for (const mark of n.marks ?? []) {
				switch (mark.type) {
					case 'bold':
						html = `<strong>${html}</strong>`;
						break;
					case 'italic':
						html = `<em>${html}</em>`;
						break;
					case 'code':
						html = `<code>${html}</code>`;
						break;
					case 'strike':
						html = `<s>${html}</s>`;
						break;
					case 'link':
						html = `<a href="${escapeAttr(mark.attrs.href)}">${html}</a>`;
						break;
				}
			}
			return html;
		})
		.join('');
}

function escapeText(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
	return escapeText(s).replace(/"/g, '&quot;');
}
```

- [ ] **Step 4: Run tests; green**

```bash
bun test src/utils/blocks.test.ts 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/utils/blocks.ts packages/shared/src/utils/blocks.test.ts
git commit -m "feat(slice-18 18f Phase 3 Task 15): serializeBlocksToHtml legacy bridge"
```

---

### Task 16: Add `BlockEditorDocSchema.parse` round-trip test

**Files:**
- Modify: `packages/shared/src/utils/blocks.test.ts` (final addition for Phase 3)

- [ ] **Step 1: Append round-trip test**

```ts
describe('BlockEditorDocSchema.parse — full round-trip', () => {
	it('accepts a valid full-shape doc', () => {
		const doc: unknown = {
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'h' }] },
				{ type: 'paragraph', content: [
					{ type: 'text', text: 'p ' },
					{ type: 'text', text: 'b', marks: [{ type: 'bold' }] },
				]},
				{ type: 'horizontalRule' },
				{ type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const x = 1;' }] },
			],
		};
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(true);
	});

	it('rejects unknown block types', () => {
		const doc: unknown = {
			type: 'doc',
			content: [{ type: 'unknownBlock', content: [] }],
		};
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(false);
	});

	it('rejects missing top-level type', () => {
		const doc: unknown = { content: [] };
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(false);
	});
});
```

(Add `BlockEditorDocSchema` to imports.)

- [ ] **Step 2: Run all blocks tests; green**

```bash
cd packages/shared
bun test src/utils/blocks.test.ts
```

Expected: ALL tests pass (40+ assertions across 7+ describe blocks).

- [ ] **Step 3: Run full apps/web + apps/cms type-checks**

```bash
cd ../../apps/web
bun run check 2>&1 | tail -5
cd ../cms
bun run check 2>&1 | tail -5  # if a check script exists
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/utils/blocks.test.ts
git commit -m "feat(slice-18 18f Phase 3 Task 16): BlockEditorDocSchema parse round-trip tests"
```

---

## Phase 4 — Schema part 1: `illustrations` + `morph_shapes` (7 tasks)

**Exit gate:** `illustrations` + `morph_shapes` collections live in CMS; `illustrations` folder added to Public files.read scope; permissions for ai-editor + human-editor + Public applied; `directus-sync diff` clean post-push.

### Task 17: Author `illustrations` collection JSON

**Files:**
- Create: `apps/cms/directus/snapshot/collections/illustrations.json`
- Create: `apps/cms/directus/snapshot/fields/illustrations/{id,file,label,category,tags,description,sort}.json`
- Create: `apps/cms/directus/snapshot/relations/illustrations/file.json`

- [ ] **Step 1: Collection meta**

```json
{
  "collection": "illustrations",
  "meta": {
    "accountability": "all",
    "archive_app_filter": true,
    "archive_field": null,
    "archive_value": null,
    "unarchive_value": null,
    "collapse": "open",
    "color": null,
    "display_template": "{{label}} ({{category}})",
    "group": null,
    "hidden": false,
    "icon": "image",
    "item_duplication_fields": ["label","category","tags","description","sort"],
    "note": "Curated SVG illustration library — consumed by blog_posts.svg_illustration + projects.svg_illustration. Reusable across content types. ai-editor: cannot delete.",
    "preview_url": null,
    "singleton": false,
    "sort": null,
    "sort_field": "sort",
    "translations": null,
    "versioning": false
  },
  "schema": { "name": "illustrations" }
}
```

- [ ] **Step 2: Fields — `id`, `file`, `label`, `category`, `tags`, `description`, `sort`**

`id.json`:

```json
{
  "collection": "illustrations",
  "field": "id",
  "type": "string",
  "meta": {
    "collection": "illustrations",
    "field": "id",
    "interface": "input",
    "note": "Slug — kebab-case, e.g. pro-database, personal-rocket.",
    "options": { "slug": true, "trim": true },
    "required": true,
    "sort": 1,
    "validation": { "_and": [{ "id": { "_regex": "^[a-z0-9]+(-[a-z0-9]+)*$" } }] },
    "validation_message": "Slug must be kebab-case.",
    "width": "half"
  },
  "schema": {
    "name": "id", "table": "illustrations", "data_type": "character varying",
    "max_length": 255, "is_nullable": false, "is_primary_key": true, "is_unique": true
  }
}
```

`file.json`:

```json
{
  "collection": "illustrations",
  "field": "file",
  "type": "uuid",
  "meta": {
    "collection": "illustrations", "field": "file",
    "interface": "file-image",
    "options": { "folder": "illustrations" },
    "note": "SVG file (recommended viewBox: 0 0 48 48; stroke-only; brand colors).",
    "required": true,
    "sort": 2,
    "special": ["file"],
    "width": "half"
  },
  "schema": {
    "name": "file", "table": "illustrations", "data_type": "uuid",
    "is_nullable": false, "foreign_key_table": "directus_files", "foreign_key_column": "id"
  }
}
```

`label.json`:

```json
{
  "collection": "illustrations",
  "field": "label",
  "type": "string",
  "meta": {
    "collection": "illustrations", "field": "label",
    "interface": "input",
    "note": "Human-readable name shown in dropdown, e.g. \"Database engineering\".",
    "required": true,
    "sort": 3,
    "width": "half"
  },
  "schema": {
    "name": "label", "table": "illustrations", "data_type": "character varying",
    "max_length": 255, "is_nullable": false
  }
}
```

`category.json`:

```json
{
  "collection": "illustrations",
  "field": "category",
  "type": "string",
  "meta": {
    "collection": "illustrations", "field": "category",
    "interface": "select-dropdown",
    "options": {
      "choices": [
        { "text": "Professional", "value": "professional" },
        { "text": "Personal", "value": "personal" },
        { "text": "General", "value": "general" }
      ]
    },
    "note": "Filters which posts/projects can pick this in their dropdown.",
    "required": true,
    "sort": 4,
    "width": "half"
  },
  "schema": {
    "name": "category", "table": "illustrations", "data_type": "character varying",
    "max_length": 32, "default_value": "general", "is_nullable": false
  }
}
```

`tags.json`:

```json
{
  "collection": "illustrations",
  "field": "tags",
  "type": "json",
  "meta": {
    "collection": "illustrations", "field": "tags",
    "interface": "tags",
    "options": { "alphabetize": true },
    "note": "Filter / search aid across content types.",
    "required": false,
    "sort": 5,
    "special": ["cast-json"],
    "width": "full"
  },
  "schema": {
    "name": "tags", "table": "illustrations", "data_type": "jsonb",
    "default_value": "[]", "is_nullable": true
  }
}
```

`description.json`:

```json
{
  "collection": "illustrations",
  "field": "description",
  "type": "text",
  "meta": {
    "collection": "illustrations", "field": "description",
    "interface": "input-multiline",
    "note": "Alt-text feed. Required (consumer renders aria-label).",
    "required": true,
    "sort": 6,
    "width": "full"
  },
  "schema": {
    "name": "description", "table": "illustrations", "data_type": "text", "is_nullable": false
  }
}
```

`sort.json`:

```json
{
  "collection": "illustrations",
  "field": "sort",
  "type": "integer",
  "meta": {
    "collection": "illustrations", "field": "sort",
    "interface": "input",
    "hidden": true,
    "sort": 99
  },
  "schema": {
    "name": "sort", "table": "illustrations", "data_type": "integer",
    "default_value": 0, "is_nullable": false
  }
}
```

- [ ] **Step 3: Relation — `illustrations.file → directus_files`**

`apps/cms/directus/snapshot/relations/illustrations/file.json`:

```json
{
  "collection": "illustrations",
  "field": "file",
  "related_collection": "directus_files",
  "schema": {
    "table": "illustrations",
    "column": "file",
    "foreign_key_table": "directus_files",
    "foreign_key_column": "id",
    "on_delete": "SET NULL",
    "on_update": "CASCADE"
  },
  "meta": {
    "junction_field": null,
    "many_collection": "illustrations",
    "many_field": "file",
    "one_allowed_collections": null,
    "one_collection": "directus_files",
    "one_collection_field": null,
    "one_deselect_action": "nullify",
    "one_field": null,
    "sort_field": null
  }
}
```

- [ ] **Step 4: Commit (collection + fields + relation)**

```bash
git add apps/cms/directus/snapshot/collections/illustrations.json \
        apps/cms/directus/snapshot/fields/illustrations/ \
        apps/cms/directus/snapshot/relations/illustrations/
git commit -m "feat(slice-18 18f Phase 4 Task 17): illustrations collection schema"
```

---

### Task 18: Author `morph_shapes` collection JSON

**Files:**
- Create: `apps/cms/directus/snapshot/collections/morph_shapes.json`
- Create: `apps/cms/directus/snapshot/fields/morph_shapes/{id,label,path,viewbox,sort,description}.json`

- [ ] **Step 1: Collection meta**

```json
{
  "collection": "morph_shapes",
  "meta": {
    "accountability": "all",
    "archive_field": null,
    "collapse": "open",
    "color": null,
    "display_template": "{{label}} ({{viewbox}})",
    "group": null,
    "hidden": false,
    "icon": "category",
    "item_duplication_fields": ["label","path","viewbox","sort","description"],
    "note": "Geometric morph-target library. Consumed by SVG morph animations. Adding a new shape via Data Studio works without a code deploy. Public read.",
    "singleton": false,
    "sort": null,
    "sort_field": "sort",
    "versioning": false
  },
  "schema": { "name": "morph_shapes" }
}
```

- [ ] **Step 2: Fields — `id`, `label`, `path`, `viewbox`, `sort`, `description`**

`id.json`:

```json
{
  "collection": "morph_shapes", "field": "id", "type": "string",
  "meta": {
    "interface": "input", "options": { "slug": true, "trim": true },
    "note": "Slug — e.g. triangle, decagon.",
    "required": true, "sort": 1, "width": "half",
    "validation": { "_and": [{ "id": { "_regex": "^[a-z0-9]+(-[a-z0-9]+)*$" } }] }
  },
  "schema": {
    "name": "id", "table": "morph_shapes", "data_type": "character varying",
    "max_length": 64, "is_nullable": false, "is_primary_key": true, "is_unique": true
  }
}
```

`label.json`:

```json
{
  "collection": "morph_shapes", "field": "label", "type": "string",
  "meta": {
    "interface": "input",
    "note": "Human-readable, e.g. \"Triangle\", \"10-sided polygon\".",
    "required": true, "sort": 2, "width": "half"
  },
  "schema": {
    "name": "label", "table": "morph_shapes", "data_type": "character varying",
    "max_length": 128, "is_nullable": false
  }
}
```

`path.json`:

```json
{
  "collection": "morph_shapes", "field": "path", "type": "text",
  "meta": {
    "interface": "input-multiline",
    "note": "SVG path d= attribute, e.g. \"M24 8 L40 38 L8 38 Z\". Must be a closed shape compatible with MorphSVGPlugin.",
    "required": true, "sort": 3, "width": "full"
  },
  "schema": {
    "name": "path", "table": "morph_shapes", "data_type": "text", "is_nullable": false
  }
}
```

`viewbox.json`:

```json
{
  "collection": "morph_shapes", "field": "viewbox", "type": "string",
  "meta": {
    "interface": "input",
    "note": "SVG viewBox, e.g. \"0 0 48 48\". Default matches existing shape lib.",
    "required": true, "sort": 4, "width": "half"
  },
  "schema": {
    "name": "viewbox", "table": "morph_shapes", "data_type": "character varying",
    "max_length": 64, "default_value": "0 0 48 48", "is_nullable": false
  }
}
```

`sort.json`:

```json
{
  "collection": "morph_shapes", "field": "sort", "type": "integer",
  "meta": { "interface": "input", "hidden": true, "sort": 99 },
  "schema": { "name": "sort", "table": "morph_shapes", "data_type": "integer", "default_value": 0, "is_nullable": false }
}
```

`description.json`:

```json
{
  "collection": "morph_shapes", "field": "description", "type": "text",
  "meta": {
    "interface": "input-multiline",
    "note": "Optional editor notes (when to use this shape).",
    "required": false, "sort": 5, "width": "full"
  },
  "schema": { "name": "description", "table": "morph_shapes", "data_type": "text", "is_nullable": true }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/cms/directus/snapshot/collections/morph_shapes.json \
        apps/cms/directus/snapshot/fields/morph_shapes/
git commit -m "feat(slice-18 18f Phase 4 Task 18): morph_shapes collection schema"
```

---

### Task 19: Add `illustrations` folder to `directus_files`

**Files:**
- Modify: `apps/cms/directus/collections/folders.json`

- [ ] **Step 1: Append the new folder entry**

Open `apps/cms/directus/collections/folders.json`. Find the existing array of folders (one entry each for `services`, `projects`, `blog`, `brand`, `about`, `og`).

Append:

```json
{
  "_syncId": "<generate-new-uuid-here>",
  "id": "<generate-new-uuid-here>",
  "name": "illustrations",
  "parent": null
}
```

Generate the UUID per 18d Task 7 pattern. Run:

```bash
python3 -c "import uuid; print(uuid.uuid4())"
```

Use the same UUID for both `_syncId` and `id`.

- [ ] **Step 2: Verify JSON is valid**

```bash
cat apps/cms/directus/collections/folders.json | jq '.[].name' 2>&1
```

Expected: 7 names listed including `"illustrations"`.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/directus/collections/folders.json
git commit -m "feat(slice-18 18f Phase 4 Task 19): add illustrations folder for SVG library"
```

---

### Task 20: Author permissions for `illustrations` + `morph_shapes`

**Files:**
- Modify: `apps/cms/directus/collections/permissions.json`

- [ ] **Step 1: Add ai-editor permissions for `illustrations` (read all + create/update; delete: false)**

Open `apps/cms/directus/collections/permissions.json`. Find the existing ai-editor `read` row for `services` as a template. Append rows for the new collection:

```json
{
  "_syncId": "_sync_perm_illustrations_ai_read",
  "policy": "_sync_ai_editor_policy",
  "collection": "illustrations",
  "action": "read",
  "permissions": null,
  "validation": null,
  "presets": null,
  "fields": ["*"]
},
{
  "_syncId": "_sync_perm_illustrations_ai_create",
  "policy": "_sync_ai_editor_policy",
  "collection": "illustrations",
  "action": "create",
  "permissions": null,
  "validation": null,
  "presets": null,
  "fields": ["*"]
},
{
  "_syncId": "_sync_perm_illustrations_ai_update",
  "policy": "_sync_ai_editor_policy",
  "collection": "illustrations",
  "action": "update",
  "permissions": null,
  "validation": null,
  "presets": null,
  "fields": ["*"]
},
```

- [ ] **Step 2: Add human-editor permissions for `illustrations` (full CRUD)**

```json
{
  "_syncId": "_sync_perm_illustrations_human_read",
  "policy": "_sync_human_editor_policy",
  "collection": "illustrations",
  "action": "read",
  "permissions": null, "validation": null, "presets": null, "fields": ["*"]
},
{
  "_syncId": "_sync_perm_illustrations_human_create",
  "policy": "_sync_human_editor_policy",
  "collection": "illustrations",
  "action": "create",
  "permissions": null, "validation": null, "presets": null, "fields": ["*"]
},
{
  "_syncId": "_sync_perm_illustrations_human_update",
  "policy": "_sync_human_editor_policy",
  "collection": "illustrations",
  "action": "update",
  "permissions": null, "validation": null, "presets": null, "fields": ["*"]
},
{
  "_syncId": "_sync_perm_illustrations_human_delete",
  "policy": "_sync_human_editor_policy",
  "collection": "illustrations",
  "action": "delete",
  "permissions": null, "validation": null, "presets": null, "fields": ["*"]
},
```

- [ ] **Step 3: Add Public read for `illustrations`**

```json
{
  "_syncId": "_sync_perm_illustrations_public_read",
  "policy": "_sync_default_public_policy",
  "collection": "illustrations",
  "action": "read",
  "permissions": null,
  "validation": null,
  "presets": null,
  "fields": ["id","file","label","category","tags","description","sort"]
},
```

- [ ] **Step 4: Repeat steps 1–3 for `morph_shapes`**

Same shape, swap collection name. Public read fields: `["id","label","path","viewbox","sort"]`.

- [ ] **Step 5: Update Public files.read folder list to include `illustrations`**

Find the existing Public read row for `directus_files` (introduced in 18d). Update the `permissions` filter to include the new folder:

```json
{
  "policy": "_sync_default_public_policy",
  "collection": "directus_files",
  "action": "read",
  "permissions": {
    "_and": [
      {
        "folder": {
          "name": {
            "_in": ["services","projects","blog","brand","about","og","illustrations"]
          }
        }
      }
    ]
  },
  "validation": null,
  "presets": null,
  "fields": ["id","filename_disk","filename_download","title","type","filesize","width","height","focal_point_x","focal_point_y","metadata","folder"]
}
```

- [ ] **Step 6: Verify JSON syntactic validity**

```bash
cat apps/cms/directus/collections/permissions.json | jq 'length'
```

Expected: count is 14 higher than previous (8 ai-editor + human-editor for illustrations + morph_shapes; +1 Public read each + Public read directus_files unchanged in count).

Actually count: previous + 7 (illustrations: 3 ai + 4 human + 1 public = 8) + 7 (morph_shapes: 3 ai + 4 human + 1 public = 8) = +16 total minus changes to existing files row = +16.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/directus/collections/permissions.json
git commit -m "feat(slice-18 18f Phase 4 Task 20): permissions for illustrations + morph_shapes (+ folder scope on directus_files)"
```

---

### Task 21: Push schema (illustrations + morph_shapes + folders + permissions)

**Files:**
- Run: `bun run sync:push` from `apps/cms/`

- [ ] **Step 1: Diff first**

```bash
cd apps/cms
bun run sync:diff
```

Expected: 2 collections to create (`illustrations`, `morph_shapes`); 13 fields to create; 1 relation to create; 1 folder to create; ~16 permission rows to create + 1 permission row to update (directus_files folder list).

- [ ] **Step 2: Push**

```bash
bun run sync:push
```

- [ ] **Step 3: Verify live**

```bash
JWT=$(curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $JWT" https://cms.yesid.dev/collections/illustrations | jq '.data.collection'
curl -s -H "Authorization: Bearer $JWT" https://cms.yesid.dev/collections/morph_shapes | jq '.data.collection'
curl -s https://cms.yesid.dev/items/morph_shapes | jq '.data | length'
```

Expected: `"illustrations"` + `"morph_shapes"` + length 0 (no rows yet — seed lands in Phase 8).

- [ ] **Step 4: Re-diff to confirm clean intent**

```bash
bun run sync:diff
```

Expected: 0 changes (or only the cosmetic FK constraint name diff from #45 if applicable). No commit on diff verification.

---

### Task 22: P-illustration-folder probe — verify Public read works on the new folder

**Files:**
- Live action via Data Studio + curl

- [ ] **Step 1: Upload one test SVG to `illustrations` folder via Data Studio**

Navigate: `https://cms.yesid.dev/admin/files`. Click the `illustrations` folder. Upload any SVG (use `apps/web/src/lib/assets/blog-fallbacks/pro-database.svg`).

Note the file UUID from the URL after upload.

- [ ] **Step 2: Anonymous read of the file**

```bash
curl -s -o /dev/null -w "%{http_code}" https://cms.yesid.dev/assets/<uuid-from-step-1>
```

Expected: `200`.

- [ ] **Step 3: Document in research.md**

Update `docs/slices/slice-18/18f-blog-block-editor/research.md`, replacing the `**Decision:** TBD (locks during Phase 1).` line under `P-illustration-folder-public-policy`:

```markdown
**Result:** PASS — anonymous GET on `/assets/<uuid>` for an `illustrations`-folder file returns HTTP 200 with raw bytes. Folder-scoped Public files.read filter extends cleanly.

**Decision:** PASS — proceed with `illustrations` library; Public can fetch SVG files for inline rendering.
```

- [ ] **Step 4: Commit research update**

```bash
git add docs/slices/slice-18/18f-blog-block-editor/research.md
git commit -m "docs(slice-18 18f Phase 4 Task 22): P-illustration-folder probe — PASS"
```

- [ ] **Step 5: Delete the test SVG**

Via Data Studio: navigate to the file, click Delete. Verifies clean state before Phase 8 seeding.

No commit — operates on live state.

---

### Task 23: Phase 4 acceptance check

- [ ] **Step 1: Run apps/web tests + check (sanity, no regression from new types)**

```bash
cd apps/web
bun run check
bun run test 2>&1 | tail -20
```

Expected: 0 errors; existing test count unchanged (no new tests in apps/web yet).

- [ ] **Step 2: Run apps/cms tests**

```bash
cd ../cms
bun test 2>&1 | tail -10
```

Expected: existing 131 tests pass (no new tests yet).

No commit — just acceptance verification.

---

## Phase 5 — Schema part 2: `blog_posts` (full) + `projects` modifications (8 tasks)

**Exit gate:** `blog_posts` + `blog_posts_translations` collections + all 13 blog fields live; `projects.svg_illustration` M2O added; `projects_translations.description` + `projects_sections_translations.content` flipped to Block Editor; `directus-sync diff` clean.

### Task 24: Author full `blog_posts` field set (extend probe schema)

**Files:**
- Create: `apps/cms/directus/snapshot/fields/blog_posts/{status,date_published,sort,lang,category,tags,external,url,cover_image,svg_illustration,animation,translations}.json`

> Note: `id` and `body` already exist from Phase 2 Task 4. This task adds the remaining 12 fields.

- [ ] **Step 1: `status` field**

```json
{
  "collection": "blog_posts", "field": "status", "type": "string",
  "meta": {
    "interface": "select-dropdown",
    "options": {
      "choices": [
        { "text": "Draft", "value": "draft" },
        { "text": "Published", "value": "published" },
        { "text": "Archived", "value": "archived" }
      ]
    },
    "note": "Publication state. ai-editor cannot set to published.",
    "required": true, "sort": 2, "width": "half"
  },
  "schema": {
    "name": "status", "table": "blog_posts", "data_type": "character varying",
    "max_length": 32, "default_value": "draft", "is_nullable": false
  }
}
```

- [ ] **Step 2: `date_published` field**

```json
{
  "collection": "blog_posts", "field": "date_published", "type": "timestamp",
  "meta": {
    "interface": "datetime",
    "note": "ISO datetime; controls listing sort. Set when status flips to published.",
    "required": false, "sort": 3, "width": "half"
  },
  "schema": { "name": "date_published", "table": "blog_posts", "data_type": "timestamp with time zone", "is_nullable": true }
}
```

- [ ] **Step 3: `sort` field**

```json
{
  "collection": "blog_posts", "field": "sort", "type": "integer",
  "meta": { "interface": "input", "hidden": true, "sort": 99 },
  "schema": { "name": "sort", "table": "blog_posts", "data_type": "integer", "default_value": 0, "is_nullable": false }
}
```

- [ ] **Step 4: `lang` field**

```json
{
  "collection": "blog_posts", "field": "lang", "type": "string",
  "meta": {
    "interface": "select-dropdown",
    "options": {
      "choices": [
        { "text": "English", "value": "en" },
        { "text": "Français", "value": "fr" },
        { "text": "Español", "value": "es" }
      ]
    },
    "note": "Language of the body. Each post is mono-language; use translations junction for title/excerpt across locales.",
    "required": true, "sort": 4, "width": "half"
  },
  "schema": {
    "name": "lang", "table": "blog_posts", "data_type": "character varying",
    "max_length": 8, "default_value": "en", "is_nullable": false
  }
}
```

- [ ] **Step 5: `category` field**

```json
{
  "collection": "blog_posts", "field": "category", "type": "string",
  "meta": {
    "interface": "select-dropdown",
    "options": {
      "choices": [
        { "text": "Professional", "value": "professional" },
        { "text": "Personal", "value": "personal" }
      ]
    },
    "note": "Editorial lane. Filters illustration dropdown.",
    "required": true, "sort": 5, "width": "half"
  },
  "schema": {
    "name": "category", "table": "blog_posts", "data_type": "character varying",
    "max_length": 32, "is_nullable": false
  }
}
```

- [ ] **Step 6: `tags` field**

```json
{
  "collection": "blog_posts", "field": "tags", "type": "json",
  "meta": {
    "interface": "tags",
    "options": { "alphabetize": true },
    "note": "Lowercase keywords, used in listing filter.",
    "required": false, "sort": 6, "special": ["cast-json"], "width": "full"
  },
  "schema": { "name": "tags", "table": "blog_posts", "data_type": "jsonb", "default_value": "[]", "is_nullable": true }
}
```

- [ ] **Step 7: `external` + `url` fields with conditional**

`external.json`:

```json
{
  "collection": "blog_posts", "field": "external", "type": "boolean",
  "meta": {
    "interface": "boolean",
    "options": { "label": "External post (e.g. LinkedIn)" },
    "note": "When true, body becomes optional and url is required + visible.",
    "required": false, "sort": 7, "width": "half"
  },
  "schema": {
    "name": "external", "table": "blog_posts", "data_type": "boolean",
    "default_value": false, "is_nullable": false
  }
}
```

`url.json`:

```json
{
  "collection": "blog_posts", "field": "url", "type": "string",
  "meta": {
    "interface": "input",
    "note": "External URL. Required + visible when external=true.",
    "required": false,
    "sort": 8,
    "width": "half",
    "conditions": [
      {
        "rule": { "_and": [{ "external": { "_eq": true } }] },
        "name": "external is true",
        "hidden": false,
        "required": true
      }
    ]
  },
  "schema": {
    "name": "url", "table": "blog_posts", "data_type": "character varying",
    "max_length": 2048, "is_nullable": true
  }
}
```

- [ ] **Step 8: `cover_image` + `svg_illustration` + `animation` fields**

`cover_image.json`:

```json
{
  "collection": "blog_posts", "field": "cover_image", "type": "uuid",
  "meta": {
    "interface": "file-image",
    "options": { "folder": "blog" },
    "note": "Optional hero image (preset hero-1200 used at render).",
    "required": false, "sort": 9, "special": ["file"], "width": "full"
  },
  "schema": {
    "name": "cover_image", "table": "blog_posts", "data_type": "uuid",
    "is_nullable": true, "foreign_key_table": "directus_files", "foreign_key_column": "id"
  }
}
```

`svg_illustration.json`:

```json
{
  "collection": "blog_posts", "field": "svg_illustration", "type": "string",
  "meta": {
    "interface": "select-dropdown-m2o",
    "options": {
      "template": "{{label}} ({{category}})",
      "filter": {
        "_or": [
          { "category": { "_eq": "$FIELD.category" } },
          { "category": { "_eq": "general" } }
        ]
      }
    },
    "note": "Curated SVG illustration. Optional — falls back to deterministic fallback if absent.",
    "required": false, "sort": 10, "special": ["m2o"], "width": "half"
  },
  "schema": {
    "name": "svg_illustration", "table": "blog_posts", "data_type": "character varying",
    "max_length": 255, "is_nullable": true,
    "foreign_key_table": "illustrations", "foreign_key_column": "id"
  }
}
```

`animation.json`:

```json
{
  "collection": "blog_posts", "field": "animation", "type": "string",
  "meta": {
    "interface": "select-dropdown",
    "options": {
      "choices": [
        { "text": "Draw", "value": "draw" },
        { "text": "Morph", "value": "morph" },
        { "text": "Draw + Fill", "value": "draw-fill" }
      ]
    },
    "note": "Entrance animation type for the SVG illustration.",
    "required": true, "sort": 11, "width": "half"
  },
  "schema": {
    "name": "animation", "table": "blog_posts", "data_type": "character varying",
    "max_length": 32, "default_value": "draw", "is_nullable": false
  }
}
```

- [ ] **Step 9: `translations` alias field**

`translations.json`:

```json
{
  "collection": "blog_posts", "field": "translations", "type": "alias",
  "meta": {
    "interface": "translations",
    "note": "Localized title + excerpt rows. Each post has at least one row matching post.lang.",
    "required": false, "sort": 12, "special": ["translations"], "width": "full"
  },
  "schema": null
}
```

- [ ] **Step 10: Update `body` field meta — make required when external=false**

Edit `apps/cms/directus/snapshot/fields/blog_posts/body.json`. Replace the `meta` block with:

```json
"meta": {
  "collection": "blog_posts",
  "field": "body",
  "interface": "input-block-editor",
  "note": "Post body. Block Editor — supports headings, paragraphs (bold/italic/link/inline-code marks), ordered/bullet lists, code blocks (with language), blockquotes, horizontal rules, images, embeds.",
  "required": false,
  "sort": 99,
  "special": ["cast-json"],
  "width": "full",
  "conditions": [
    {
      "rule": { "_and": [{ "external": { "_eq": false } }] },
      "name": "external is false",
      "hidden": false,
      "required": true
    },
    {
      "rule": { "_and": [{ "external": { "_eq": true } }] },
      "name": "external is true",
      "hidden": true,
      "required": false
    }
  ]
}
```

- [ ] **Step 11: Update `blog_posts.json` collection meta — fill `item_duplication_fields` + `display_template`**

Edit `apps/cms/directus/snapshot/collections/blog_posts.json`. Update meta:

```json
"item_duplication_fields": ["sort","lang","category","tags","animation","cover_image","svg_illustration","body","translations"]
```

(everything except status, date_published, system audit fields).

- [ ] **Step 12: Commit**

```bash
git add apps/cms/directus/snapshot/collections/blog_posts.json \
        apps/cms/directus/snapshot/fields/blog_posts/
git commit -m "feat(slice-18 18f Phase 5 Task 24): full blog_posts field set (12 added)"
```

---

### Task 25: Author `blog_posts_translations` junction

**Files:**
- Create: `apps/cms/directus/snapshot/collections/blog_posts_translations.json`
- Create: `apps/cms/directus/snapshot/fields/blog_posts_translations/{id,blog_posts_id,languages_code,title,excerpt}.json`
- Create: `apps/cms/directus/snapshot/relations/blog_posts_translations/{blog_posts_id,languages_code}.json`

- [ ] **Step 1: Collection meta**

```json
{
  "collection": "blog_posts_translations",
  "meta": {
    "accountability": "all",
    "collapse": "open",
    "color": null,
    "display_template": "{{languages_code}} — {{title}}",
    "group": "blog_posts",
    "hidden": true,
    "icon": "translate",
    "item_duplication_fields": null,
    "note": "Localized title + excerpt rows for blog_posts.",
    "singleton": false,
    "sort": null,
    "sort_field": null,
    "translations": null,
    "versioning": false
  },
  "schema": { "name": "blog_posts_translations" }
}
```

- [ ] **Step 2: Fields**

`id.json`:

```json
{
  "collection": "blog_posts_translations", "field": "id", "type": "integer",
  "meta": { "interface": "input", "hidden": true, "sort": 1, "readonly": true },
  "schema": {
    "name": "id", "table": "blog_posts_translations", "data_type": "integer",
    "is_nullable": false, "is_primary_key": true, "has_auto_increment": true
  }
}
```

`blog_posts_id.json`:

```json
{
  "collection": "blog_posts_translations", "field": "blog_posts_id", "type": "string",
  "meta": { "interface": "select-dropdown-m2o", "hidden": true, "sort": 2 },
  "schema": {
    "name": "blog_posts_id", "table": "blog_posts_translations",
    "data_type": "character varying", "max_length": 255, "is_nullable": false,
    "foreign_key_table": "blog_posts", "foreign_key_column": "id"
  }
}
```

`languages_code.json`:

```json
{
  "collection": "blog_posts_translations", "field": "languages_code", "type": "string",
  "meta": { "interface": "select-dropdown-m2o", "sort": 3, "width": "half", "required": true },
  "schema": {
    "name": "languages_code", "table": "blog_posts_translations",
    "data_type": "character varying", "max_length": 8, "is_nullable": false,
    "foreign_key_table": "languages", "foreign_key_column": "code"
  }
}
```

`title.json`:

```json
{
  "collection": "blog_posts_translations", "field": "title", "type": "string",
  "meta": {
    "interface": "input",
    "note": "Localized post title. Required.",
    "required": true, "sort": 4, "width": "full"
  },
  "schema": {
    "name": "title", "table": "blog_posts_translations",
    "data_type": "character varying", "max_length": 255, "is_nullable": false
  }
}
```

`excerpt.json`:

```json
{
  "collection": "blog_posts_translations", "field": "excerpt", "type": "text",
  "meta": {
    "interface": "input-multiline",
    "note": "Localized excerpt — 1–2 sentences shown on listing cards. ≤500 chars.",
    "required": true, "sort": 5, "width": "full",
    "validation": {
      "_and": [
        { "excerpt": { "_regex": "^.{1,500}$" } }
      ]
    },
    "validation_message": "Excerpt must be 1–500 characters."
  },
  "schema": { "name": "excerpt", "table": "blog_posts_translations", "data_type": "text", "is_nullable": false }
}
```

- [ ] **Step 3: Relations**

`blog_posts_id.json` (relation):

```json
{
  "collection": "blog_posts_translations",
  "field": "blog_posts_id",
  "related_collection": "blog_posts",
  "schema": {
    "table": "blog_posts_translations", "column": "blog_posts_id",
    "foreign_key_table": "blog_posts", "foreign_key_column": "id",
    "on_delete": "CASCADE", "on_update": "CASCADE"
  },
  "meta": {
    "junction_field": "languages_code",
    "many_collection": "blog_posts_translations",
    "many_field": "blog_posts_id",
    "one_collection": "blog_posts",
    "one_collection_field": null,
    "one_deselect_action": "nullify",
    "one_field": "translations",
    "sort_field": null
  }
}
```

`languages_code.json` (relation):

```json
{
  "collection": "blog_posts_translations",
  "field": "languages_code",
  "related_collection": "languages",
  "schema": {
    "table": "blog_posts_translations", "column": "languages_code",
    "foreign_key_table": "languages", "foreign_key_column": "code",
    "on_delete": "RESTRICT", "on_update": "CASCADE"
  },
  "meta": {
    "junction_field": "blog_posts_id",
    "many_collection": "blog_posts_translations",
    "many_field": "languages_code",
    "one_collection": "languages",
    "one_collection_field": null,
    "one_deselect_action": "nullify",
    "one_field": null,
    "sort_field": null
  }
}
```

- [ ] **Step 4: Add svg_illustration relation for blog_posts**

Create `apps/cms/directus/snapshot/relations/blog_posts/svg_illustration.json`:

```json
{
  "collection": "blog_posts",
  "field": "svg_illustration",
  "related_collection": "illustrations",
  "schema": {
    "table": "blog_posts", "column": "svg_illustration",
    "foreign_key_table": "illustrations", "foreign_key_column": "id",
    "on_delete": "SET NULL", "on_update": "CASCADE"
  },
  "meta": {
    "junction_field": null,
    "many_collection": "blog_posts",
    "many_field": "svg_illustration",
    "one_collection": "illustrations",
    "one_collection_field": null,
    "one_deselect_action": "nullify",
    "one_field": null,
    "sort_field": null
  }
}
```

Also add `cover_image` relation:

`apps/cms/directus/snapshot/relations/blog_posts/cover_image.json`:

```json
{
  "collection": "blog_posts",
  "field": "cover_image",
  "related_collection": "directus_files",
  "schema": {
    "table": "blog_posts", "column": "cover_image",
    "foreign_key_table": "directus_files", "foreign_key_column": "id",
    "on_delete": "SET NULL", "on_update": "CASCADE"
  },
  "meta": {
    "junction_field": null,
    "many_collection": "blog_posts",
    "many_field": "cover_image",
    "one_collection": "directus_files",
    "one_deselect_action": "nullify",
    "one_field": null,
    "sort_field": null
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/cms/directus/snapshot/collections/blog_posts_translations.json \
        apps/cms/directus/snapshot/fields/blog_posts_translations/ \
        apps/cms/directus/snapshot/relations/blog_posts_translations/ \
        apps/cms/directus/snapshot/relations/blog_posts/
git commit -m "feat(slice-18 18f Phase 5 Task 25): blog_posts_translations + relations"
```

---

### Task 26: Author projects modifications — add `svg_illustration` M2O

**Files:**
- Create: `apps/cms/directus/snapshot/fields/projects/svg_illustration.json`
- Create: `apps/cms/directus/snapshot/relations/projects/svg_illustration.json`

- [ ] **Step 1: Field**

```json
{
  "collection": "projects", "field": "svg_illustration", "type": "string",
  "meta": {
    "interface": "select-dropdown-m2o",
    "options": {
      "template": "{{label}} ({{category}})",
      "filter": {
        "_or": [
          { "category": { "_eq": "professional" } },
          { "category": { "_eq": "general" } }
        ]
      }
    },
    "note": "Optional decorative illustration. Cascade fallback to related-services SVGs is unchanged.",
    "required": false, "sort": 18, "special": ["m2o"], "width": "half"
  },
  "schema": {
    "name": "svg_illustration", "table": "projects", "data_type": "character varying",
    "max_length": 255, "is_nullable": true,
    "foreign_key_table": "illustrations", "foreign_key_column": "id"
  }
}
```

- [ ] **Step 2: Relation**

```json
{
  "collection": "projects",
  "field": "svg_illustration",
  "related_collection": "illustrations",
  "schema": {
    "table": "projects", "column": "svg_illustration",
    "foreign_key_table": "illustrations", "foreign_key_column": "id",
    "on_delete": "SET NULL", "on_update": "CASCADE"
  },
  "meta": {
    "junction_field": null,
    "many_collection": "projects",
    "many_field": "svg_illustration",
    "one_collection": "illustrations",
    "one_deselect_action": "nullify",
    "one_field": null,
    "sort_field": null
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/cms/directus/snapshot/fields/projects/svg_illustration.json \
        apps/cms/directus/snapshot/relations/projects/svg_illustration.json
git commit -m "feat(slice-18 18f Phase 5 Task 26): projects.svg_illustration M2O illustrations (#41)"
```

---

### Task 27: Modify `projects_translations.description` — textarea → Block Editor

**Files:**
- Modify: `apps/cms/directus/snapshot/fields/projects_translations/description.json`

- [ ] **Step 1: Find the file (it should already exist)**

```bash
ls apps/cms/directus/snapshot/fields/projects_translations/description.json
```

- [ ] **Step 2: Edit `meta.interface`, `meta.options`, `meta.special`, `schema.data_type`**

Replace the `meta.interface` line. Old:

```json
"interface": "input-multiline",
```

New:

```json
"interface": "input-block-editor",
```

Replace `meta.options` with `null` (Block Editor takes no options).

Add `"cast-json"` to `meta.special` array (or set to `["cast-json"]` if currently null).

Change `schema.data_type` from `"text"` to `"jsonb"`.

(Directus 11 handles the textarea→jsonb migration in-place; existing string values become null after push, which is fine since seed will repopulate.)

- [ ] **Step 3: Commit**

```bash
git add apps/cms/directus/snapshot/fields/projects_translations/description.json
git commit -m "feat(slice-18 18f Phase 5 Task 27): projects_translations.description → Block Editor (#41)"
```

---

### Task 28: Modify `projects_sections_translations.content` — textarea → Block Editor

**Files:**
- Modify: `apps/cms/directus/snapshot/fields/projects_sections_translations/content.json`

- [ ] **Step 1: Edit same way as Task 27**

```bash
ls apps/cms/directus/snapshot/fields/projects_sections_translations/content.json
```

Replace `interface`, `options`, `special`, and `schema.data_type` per Task 27.

- [ ] **Step 2: Commit**

```bash
git add apps/cms/directus/snapshot/fields/projects_sections_translations/content.json
git commit -m "feat(slice-18 18f Phase 5 Task 28): projects_sections_translations.content → Block Editor (#41)"
```

---

### Task 29: Author permissions for `blog_posts` + `blog_posts_translations`

**Files:**
- Modify: `apps/cms/directus/collections/permissions.json`

- [ ] **Step 1: Add ai-editor read/create/update for `blog_posts`** (filter publish-block on update/create)

Append rows. Use existing `services` ai-editor permission rows as a template (visible at lines roughly 100-150 depending on file state).

Specifically for `blog_posts`:

- `read`: action=read, fields=`["*"]`, no permissions filter (read all)
- `create`: action=create, fields=`["*"]`, validation `{_and: [{ status: { _neq: "published" } }]}` — ai cannot create as published
- `update`: action=update, fields=`["*"]`, permissions filter `{_and: [{ status: { _neq: "published" } }]}` — ai cannot update published rows
- NO delete row (ai-editor has delete: false on all collections)

```json
{
  "_syncId": "_sync_perm_blog_posts_ai_read",
  "policy": "_sync_ai_editor_policy",
  "collection": "blog_posts",
  "action": "read",
  "permissions": null, "validation": null, "presets": null, "fields": ["*"]
},
{
  "_syncId": "_sync_perm_blog_posts_ai_create",
  "policy": "_sync_ai_editor_policy",
  "collection": "blog_posts",
  "action": "create",
  "permissions": null,
  "validation": { "_and": [{ "status": { "_neq": "published" } }] },
  "presets": null,
  "fields": ["*"]
},
{
  "_syncId": "_sync_perm_blog_posts_ai_update",
  "policy": "_sync_ai_editor_policy",
  "collection": "blog_posts",
  "action": "update",
  "permissions": { "_and": [{ "status": { "_neq": "published" } }] },
  "validation": { "_and": [{ "status": { "_neq": "published" } }] },
  "presets": null,
  "fields": ["*"]
},
```

- [ ] **Step 2: Add ai-editor read/create/update for `blog_posts_translations` with cascade publish-block**

```json
{
  "_syncId": "_sync_perm_blog_posts_translations_ai_read",
  "policy": "_sync_ai_editor_policy",
  "collection": "blog_posts_translations",
  "action": "read",
  "permissions": null, "validation": null, "presets": null, "fields": ["*"]
},
{
  "_syncId": "_sync_perm_blog_posts_translations_ai_create",
  "policy": "_sync_ai_editor_policy",
  "collection": "blog_posts_translations",
  "action": "create",
  "permissions": null,
  "validation": { "_and": [{ "blog_posts_id": { "status": { "_neq": "published" } } }] },
  "presets": null,
  "fields": ["*"]
},
{
  "_syncId": "_sync_perm_blog_posts_translations_ai_update",
  "policy": "_sync_ai_editor_policy",
  "collection": "blog_posts_translations",
  "action": "update",
  "permissions": { "_and": [{ "blog_posts_id": { "status": { "_neq": "published" } } }] },
  "validation": null,
  "presets": null,
  "fields": ["*"]
},
```

- [ ] **Step 3: Add human-editor full CRUD for both collections (4 rows per collection × 2 collections = 8 rows)**

Mirror Task 20 step 2 shape, swap collection name. Order: read, create, update, delete.

- [ ] **Step 4: Add Public read (with cascade FK filter on translations)**

```json
{
  "_syncId": "_sync_perm_blog_posts_public_read",
  "policy": "_sync_default_public_policy",
  "collection": "blog_posts",
  "action": "read",
  "permissions": { "_and": [{ "status": { "_eq": "published" } }] },
  "validation": null,
  "presets": null,
  "fields": ["id","status","date_published","sort","lang","category","tags","external","url","cover_image","svg_illustration","animation","body","translations"]
},
{
  "_syncId": "_sync_perm_blog_posts_translations_public_read",
  "policy": "_sync_default_public_policy",
  "collection": "blog_posts_translations",
  "action": "read",
  "permissions": { "_and": [{ "blog_posts_id": { "status": { "_eq": "published" } } }] },
  "validation": null,
  "presets": null,
  "fields": ["id","blog_posts_id","languages_code","title","excerpt"]
},
```

- [ ] **Step 5: Verify JSON validity + commit**

```bash
cat apps/cms/directus/collections/permissions.json | jq 'length'
git add apps/cms/directus/collections/permissions.json
git commit -m "feat(slice-18 18f Phase 5 Task 29): permissions for blog_posts (+ translations)"
```

---

### Task 30: Push schema part 2

**Files:**
- Run: `bun run sync:push`

- [ ] **Step 1: Diff first**

```bash
cd apps/cms
bun run sync:diff
```

Expected: 1 collection to create (`blog_posts_translations`), ~14 fields to create on blog_posts, 5 fields on translations, 1 field on projects, 2 field updates (projects_translations.description type change + projects_sections_translations.content type change), ~4 relations to create, ~17 permission rows to create.

- [ ] **Step 2: Push**

```bash
bun run sync:push
```

If textarea→Block Editor type-change fails (Directus may resist `text` → `jsonb` if rows exist): inspect the error, manually `ALTER COLUMN ... TYPE jsonb USING NULL` via Neon SQL editor (existing rows are preserved as plain strings; seed step in Phase 8 reseeds them). Document the workaround in research.md if needed.

- [ ] **Step 3: Verify live**

```bash
JWT=$(curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $JWT" \
  https://cms.yesid.dev/fields/blog_posts | jq '.data | length'
```

Expected: 14 fields total (id + body from probe, plus 12 added in Task 24).

- [ ] **Step 4: Re-diff**

```bash
bun run sync:diff
```

Expected: clean (acceptable cosmetic FK constraint name diffs from #45 only).

No commit — operates on live state.

---

### Task 31: Phase 5 acceptance check

- [ ] **Step 1: Apps tests still pass**

```bash
cd apps/web
bun run check
bun run test 2>&1 | tail -10

cd ../cms
bun test 2>&1 | tail -10
```

Expected: 0 errors; existing tests pass.

- [ ] **Step 2: Bring up Data Studio + verify blog_posts is editable**

Navigate to `https://cms.yesid.dev/admin/content/blog_posts`. Click "+ Create Item". Verify:

- Form shows id, status, date_published, sort, lang, category, tags, external, url, cover_image, svg_illustration, animation, body, translations
- url is hidden when external=false; visible when external=true
- body is required when external=false; hidden when external=true
- svg_illustration dropdown is filtered by category match (set category=professional, dropdown should empty out — illustrations seed lands in Phase 8)

No commit — verification only.

---

## Phase 6 — `migrate-markdown-to-blocks.ts` (10 tasks)

**Exit gate:** Pure transform with full unit test coverage; CLI works (`--dry-run`, `--single`, `--help`); first-h1 strip when text matches frontmatter title; real-content round-trip on all 7 current blog posts produces deterministic Block Editor JSON.

### Task 32: Scaffold `migrate-markdown-to-blocks.ts` + Zod fixture row schema

**Files:**
- Create: `apps/cms/scripts/migrate-markdown-to-blocks.ts`
- Create: `apps/cms/tests/migrate-markdown-to-blocks.test.ts`

- [ ] **Step 1: Write the failing test scaffold**

```ts
// apps/cms/tests/migrate-markdown-to-blocks.test.ts
import { describe, it, expect } from 'bun:test';
import {
	parseFrontmatter,
	mapMarkdownToBlocks,
	stripLeadingTitleHeading,
	type BlogFrontmatter,
} from '../scripts/migrate-markdown-to-blocks';

describe('parseFrontmatter', () => {
	it('parses key: value pairs', () => {
		const raw = '---\ntitle: Hello\nlang: en\n---\nBody.';
		const { data, content } = parseFrontmatter(raw);
		expect(data.title).toBe('Hello');
		expect(data.lang).toBe('en');
		expect(content.trim()).toBe('Body.');
	});

	it('parses array values [a, b, c]', () => {
		const raw = '---\ntags: [sql, postgres]\n---\nBody.';
		const { data } = parseFrontmatter(raw);
		expect(data.tags).toEqual(['sql', 'postgres']);
	});

	it('parses booleans', () => {
		const raw = '---\nexternal: true\n---\nBody.';
		const { data } = parseFrontmatter(raw);
		expect(data.external).toBe(true);
	});

	it('returns empty data when no frontmatter delimiter', () => {
		const { data, content } = parseFrontmatter('Just body.');
		expect(data).toEqual({});
		expect(content).toBe('Just body.');
	});
});
```

- [ ] **Step 2: Run; FAIL**

```bash
cd apps/cms
bun test tests/migrate-markdown-to-blocks.test.ts 2>&1 | head -10
```

- [ ] **Step 3: Write `apps/cms/scripts/migrate-markdown-to-blocks.ts` scaffold**

```ts
#!/usr/bin/env bun
/**
 * Migrate markdown blog posts (and other plain-text content) to Block
 * Editor JSON for Directus.
 *
 * Slice 18 18f Phase 6. Pure transforms exported for tests; CLI wraps
 * them with file IO + glob.
 *
 * D15: marked.parse lives ONLY in this CMS-side script (D14 forbids it
 * in @repo/shared and the consumer bundle). Output JSON conforms to the
 * BlockEditorDocSchema in @repo/shared.
 */

import { z } from 'zod';
import { marked, type Token, type Tokens } from 'marked';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import {
	BlockEditorDocSchema,
	wrapPlainText,
	type BlockEditorDoc,
	type BlockEditorNode,
	type InlineNode,
	type Mark,
	type ListItemNode,
	type TextNode,
} from '@repo/shared';

// --- Frontmatter parsing -------------------------------------------------

export interface BlogFrontmatter {
	title?: string;
	excerpt?: string;
	date?: string;
	lang?: string;
	category?: string;
	tags?: readonly string[];
	animation?: string;
	svg?: string;
	external?: boolean;
	url?: string;
}

export function parseFrontmatter(raw: string): { data: BlogFrontmatter & Record<string, unknown>; content: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { data: {}, content: raw };

	const fm = match[1];
	const content = match[2];
	const data: Record<string, unknown> = {};

	for (const line of fm.split(/\r?\n/)) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value: unknown = line.slice(colonIdx + 1).trim();

		if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
			value = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
		}
		if (value === 'true') value = true;
		if (value === 'false') value = false;

		data[key] = value;
	}

	return { data: data as BlogFrontmatter & Record<string, unknown>, content };
}

// --- Token mapping (filled in subsequent tasks) -------------------------

export function mapMarkdownToBlocks(
	content: string,
	opts?: { stripLeadingTitle?: string; assetIdFor?: (legacyPath: string) => string | undefined },
): BlockEditorDoc {
	const tokens = marked.lexer(content);
	const stripped = opts?.stripLeadingTitle ? stripLeadingTitleHeading(tokens, opts.stripLeadingTitle) : tokens;
	const blocks: BlockEditorNode[] = [];
	for (const token of stripped) {
		const block = mapToken(token, opts);
		if (block) blocks.push(block);
	}
	return { type: 'doc', content: blocks };
}

export function stripLeadingTitleHeading(tokens: Token[], title: string): Token[] {
	const first = tokens[0];
	if (!first || first.type !== 'heading') return tokens;
	const heading = first as Tokens.Heading;
	if (heading.depth !== 1) return tokens;
	if (heading.text.trim().toLowerCase() !== title.trim().toLowerCase()) return tokens;
	return tokens.slice(1);
}

function mapToken(
	token: Token,
	opts?: { assetIdFor?: (legacyPath: string) => string | undefined },
): BlockEditorNode | null {
	// Filled in subsequent tasks per token type.
	return null;
}

// --- CLI -----------------------------------------------------------------

if (import.meta.main) {
	console.log('migrate-markdown-to-blocks: CLI lands in Phase 6 Task 41');
	process.exit(0);
}
```

- [ ] **Step 4: Run tests; expect parseFrontmatter green, others fail**

```bash
bun test tests/migrate-markdown-to-blocks.test.ts 2>&1 | tail -10
```

Expected: parseFrontmatter tests pass; mapMarkdownToBlocks/stripLeadingTitleHeading tests not yet written.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/migrate-markdown-to-blocks.ts apps/cms/tests/migrate-markdown-to-blocks.test.ts
git commit -m "feat(slice-18 18f Phase 6 Task 32): migrate-markdown-to-blocks scaffold + frontmatter parser"
```

---

### Task 33: Map heading tokens

**Files:**
- Modify: `apps/cms/scripts/migrate-markdown-to-blocks.ts` (`mapToken` function)
- Modify: `apps/cms/tests/migrate-markdown-to-blocks.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('mapMarkdownToBlocks — headings', () => {
	it('maps # heading at depth 1', () => {
		const doc = mapMarkdownToBlocks('# Hello');
		expect(doc.content).toEqual([
			{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
		]);
	});

	it('maps ## ### #### at depths 2 3 4', () => {
		const doc = mapMarkdownToBlocks('## L2\n\n### L3\n\n#### L4');
		expect((doc.content[0] as any).attrs.level).toBe(2);
		expect((doc.content[1] as any).attrs.level).toBe(3);
		expect((doc.content[2] as any).attrs.level).toBe(4);
	});

	it('clamps depth >4 to 4 (5+ heading levels not supported by Block Editor)', () => {
		const doc = mapMarkdownToBlocks('##### Five');
		expect((doc.content[0] as any).attrs.level).toBe(4);
	});

	it('handles inline marks inside heading', () => {
		const doc = mapMarkdownToBlocks('# Hello *italic*');
		expect(doc.content[0]).toEqual({
			type: 'heading',
			attrs: { level: 1 },
			content: [
				{ type: 'text', text: 'Hello ' },
				{ type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
			],
		});
	});
});

describe('stripLeadingTitleHeading', () => {
	it('drops the leading # when it matches frontmatter title (case-insensitive trim)', () => {
		const doc = mapMarkdownToBlocks('# Hello\n\nBody.', { stripLeadingTitle: 'hello' });
		expect(doc.content.length).toBe(1);
		expect((doc.content[0] as any).type).toBe('paragraph');
	});

	it('keeps the leading # when it does NOT match', () => {
		const doc = mapMarkdownToBlocks('# Different\n\nBody.', { stripLeadingTitle: 'Hello' });
		expect(doc.content.length).toBe(2);
		expect((doc.content[0] as any).type).toBe('heading');
	});

	it('keeps a depth-2 leading heading even if it matches', () => {
		const doc = mapMarkdownToBlocks('## Hello\n\nBody.', { stripLeadingTitle: 'Hello' });
		expect(doc.content.length).toBe(2);
	});
});
```

- [ ] **Step 2: Run tests; expect FAIL**

```bash
bun test tests/migrate-markdown-to-blocks.test.ts 2>&1 | tail -10
```

- [ ] **Step 3: Implement heading mapping + inline-mark helper**

In `apps/cms/scripts/migrate-markdown-to-blocks.ts`, replace the `mapToken` stub with:

```ts
function mapToken(
	token: Token,
	opts?: { assetIdFor?: (legacyPath: string) => string | undefined },
): BlockEditorNode | null {
	switch (token.type) {
		case 'heading': {
			const h = token as Tokens.Heading;
			const level = Math.min(4, Math.max(1, h.depth)) as 1 | 2 | 3 | 4;
			return {
				type: 'heading',
				attrs: { level },
				content: mapInline(h.tokens ?? []),
			};
		}
		// other cases land in subsequent tasks
		default:
			return null;
	}
}

// Inline-mark mapping (text + marks composition)
function mapInline(tokens: Token[]): InlineNode[] {
	const out: InlineNode[] = [];
	for (const t of tokens) {
		switch (t.type) {
			case 'text': {
				const text = (t as Tokens.Text).text;
				out.push({ type: 'text', text });
				break;
			}
			case 'strong': {
				const child = mapInline((t as Tokens.Strong).tokens ?? []);
				for (const n of child) {
					if (n.type === 'text') {
						out.push({ ...n, marks: [...(n.marks ?? []), { type: 'bold' }] });
					}
				}
				break;
			}
			case 'em': {
				const child = mapInline((t as Tokens.Em).tokens ?? []);
				for (const n of child) {
					if (n.type === 'text') {
						out.push({ ...n, marks: [...(n.marks ?? []), { type: 'italic' }] });
					}
				}
				break;
			}
			case 'codespan': {
				out.push({ type: 'text', text: (t as Tokens.Codespan).text, marks: [{ type: 'code' }] });
				break;
			}
			case 'link': {
				const link = t as Tokens.Link;
				const childInline = mapInline(link.tokens ?? []);
				for (const n of childInline) {
					if (n.type === 'text') {
						out.push({
							...n,
							marks: [...(n.marks ?? []), { type: 'link', attrs: { href: link.href, title: link.title ?? null } }],
						});
					}
				}
				break;
			}
			case 'del': {
				const child = mapInline((t as Tokens.Del).tokens ?? []);
				for (const n of child) {
					if (n.type === 'text') {
						out.push({ ...n, marks: [...(n.marks ?? []), { type: 'strike' }] });
					}
				}
				break;
			}
			case 'br': {
				out.push({ type: 'hardBreak' });
				break;
			}
			default:
				// Unrecognized inline token — try to extract text fallback
				if ('text' in t && typeof (t as { text: unknown }).text === 'string') {
					out.push({ type: 'text', text: (t as { text: string }).text });
				}
		}
	}
	return out;
}
```

- [ ] **Step 4: Run; green**

```bash
bun test tests/migrate-markdown-to-blocks.test.ts 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/migrate-markdown-to-blocks.ts apps/cms/tests/migrate-markdown-to-blocks.test.ts
git commit -m "feat(slice-18 18f Phase 6 Task 33): map heading tokens + inline marks"
```

---

### Task 34: Map paragraph tokens (with inline marks)

- [ ] **Step 1: Append failing tests**

```ts
describe('mapMarkdownToBlocks — paragraphs', () => {
	it('maps a plain paragraph', () => {
		const doc = mapMarkdownToBlocks('Hello world.');
		expect(doc.content[0]).toEqual({
			type: 'paragraph',
			content: [{ type: 'text', text: 'Hello world.' }],
		});
	});

	it('maps bold + italic + inline code + link in one paragraph', () => {
		const doc = mapMarkdownToBlocks(
			'a **bold** *em* `code` [link](https://yesid.dev)'
		);
		expect((doc.content[0] as any).content).toEqual([
			{ type: 'text', text: 'a ' },
			{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
			{ type: 'text', text: ' ' },
			{ type: 'text', text: 'em', marks: [{ type: 'italic' }] },
			{ type: 'text', text: ' ' },
			{ type: 'text', text: 'code', marks: [{ type: 'code' }] },
			{ type: 'text', text: ' ' },
			{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://yesid.dev', title: null } }] },
		]);
	});

	it('maps ~~strike~~', () => {
		const doc = mapMarkdownToBlocks('~~gone~~');
		expect((doc.content[0] as any).content[0]).toEqual({
			type: 'text', text: 'gone', marks: [{ type: 'strike' }],
		});
	});

	it('maps soft line breaks via \\\n as hardBreak', () => {
		const doc = mapMarkdownToBlocks('line one  \nline two');
		const para = doc.content[0] as any;
		expect(para.content.some((n: any) => n.type === 'hardBreak')).toBe(true);
	});
});
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Add paragraph case to `mapToken`**

```ts
case 'paragraph': {
	const p = token as Tokens.Paragraph;
	return {
		type: 'paragraph',
		content: mapInline(p.tokens ?? []),
	};
}
```

- [ ] **Step 4: Run; green**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 6 Task 34): map paragraph tokens + inline marks"
```

---

### Task 35: Map list tokens (ordered + bullet, including nested)

- [ ] **Step 1: Append failing tests**

```ts
describe('mapMarkdownToBlocks — lists', () => {
	it('maps unordered list', () => {
		const doc = mapMarkdownToBlocks('- one\n- two\n- three');
		const list = doc.content[0] as any;
		expect(list.type).toBe('bulletList');
		expect(list.content.length).toBe(3);
		expect(list.content[0].type).toBe('listItem');
	});

	it('maps ordered list', () => {
		const doc = mapMarkdownToBlocks('1. step one\n2. step two');
		const list = doc.content[0] as any;
		expect(list.type).toBe('orderedList');
		expect(list.content.length).toBe(2);
	});

	it('list items wrap text in paragraph block', () => {
		const doc = mapMarkdownToBlocks('- hello');
		const li = (doc.content[0] as any).content[0];
		expect(li.type).toBe('listItem');
		expect(li.content[0].type).toBe('paragraph');
		expect(li.content[0].content[0].text).toBe('hello');
	});

	it('list items support inline marks', () => {
		const doc = mapMarkdownToBlocks('- **bold** text');
		const li = (doc.content[0] as any).content[0];
		const para = li.content[0];
		expect(para.content[0]).toEqual({ type: 'text', text: 'bold', marks: [{ type: 'bold' }] });
	});

	it('handles nested ordered inside bullet list', () => {
		const md = `- outer A
  1. sub 1
  2. sub 2
- outer B`;
		const doc = mapMarkdownToBlocks(md);
		const outerList = doc.content[0] as any;
		expect(outerList.type).toBe('bulletList');
		expect(outerList.content.length).toBe(2);
		const firstItem = outerList.content[0];
		const innerList = firstItem.content.find((c: any) => c.type === 'orderedList');
		expect(innerList).toBeDefined();
		expect(innerList.content.length).toBe(2);
	});
});
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Add list cases to `mapToken`**

```ts
case 'list': {
	const list = token as Tokens.List;
	const itemNodes: ListItemNode[] = list.items.map((item) => {
		const childBlocks: BlockEditorNode[] = [];
		for (const childToken of item.tokens) {
			if (childToken.type === 'text') {
				const tt = childToken as Tokens.Text;
				childBlocks.push({
					type: 'paragraph',
					content: mapInline(tt.tokens ?? [{ type: 'text', text: tt.text } as Token]),
				});
			} else {
				const mapped = mapToken(childToken, opts);
				if (mapped) childBlocks.push(mapped);
			}
		}
		return { type: 'listItem', content: childBlocks };
	});
	return list.ordered
		? { type: 'orderedList', content: itemNodes }
		: { type: 'bulletList', content: itemNodes };
}
```

- [ ] **Step 4: Run; green**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 6 Task 35): map list tokens (ordered/bullet/nested)"
```

---

### Task 36: Map code blocks (with language hint)

- [ ] **Step 1: Append failing tests**

```ts
describe('mapMarkdownToBlocks — code blocks', () => {
	it('maps fenced code with language hint', () => {
		const doc = mapMarkdownToBlocks('```sql\nSELECT 1;\n```');
		expect(doc.content[0]).toEqual({
			type: 'codeBlock',
			attrs: { language: 'sql' },
			content: [{ type: 'text', text: 'SELECT 1;' }],
		});
	});

	it('maps fenced code without language hint (language: null)', () => {
		const doc = mapMarkdownToBlocks('```\nplain code\n```');
		expect(doc.content[0]).toEqual({
			type: 'codeBlock',
			attrs: { language: null },
			content: [{ type: 'text', text: 'plain code' }],
		});
	});

	it('preserves multi-line code with newlines', () => {
		const doc = mapMarkdownToBlocks('```ts\nconst x = 1;\nconst y = 2;\n```');
		expect((doc.content[0] as any).content[0].text).toBe('const x = 1;\nconst y = 2;');
	});

	it('preserves special chars (no escaping)', () => {
		const doc = mapMarkdownToBlocks('```\na < b & c > d\n```');
		expect((doc.content[0] as any).content[0].text).toBe('a < b & c > d');
	});
});
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Add code case to `mapToken`**

```ts
case 'code': {
	const code = token as Tokens.Code;
	return {
		type: 'codeBlock',
		attrs: { language: code.lang ? code.lang.trim() : null },
		content: [{ type: 'text', text: code.text }],
	};
}
```

- [ ] **Step 4: Run; green**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 6 Task 36): map fenced code blocks"
```

---

### Task 37: Map blockquotes + horizontal rules

- [ ] **Step 1: Append failing tests**

```ts
describe('mapMarkdownToBlocks — blockquotes', () => {
	it('maps a single-paragraph blockquote', () => {
		const doc = mapMarkdownToBlocks('> Quoted.');
		const bq = doc.content[0] as any;
		expect(bq.type).toBe('blockquote');
		expect(bq.content.length).toBe(1);
		expect(bq.content[0].type).toBe('paragraph');
		expect(bq.content[0].content[0].text).toBe('Quoted.');
	});

	it('maps a multi-paragraph blockquote', () => {
		const doc = mapMarkdownToBlocks('> First.\n>\n> Second.');
		const bq = doc.content[0] as any;
		expect(bq.content.length).toBe(2);
	});

	it('maps inline marks inside blockquote', () => {
		const doc = mapMarkdownToBlocks('> **bold** word');
		const bq = doc.content[0] as any;
		expect(bq.content[0].content[0]).toEqual({
			type: 'text', text: 'bold', marks: [{ type: 'bold' }],
		});
	});
});

describe('mapMarkdownToBlocks — horizontal rules', () => {
	it('maps --- to horizontalRule', () => {
		const doc = mapMarkdownToBlocks('---');
		expect(doc.content[0]).toEqual({ type: 'horizontalRule' });
	});
});
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Add cases to `mapToken`**

```ts
case 'blockquote': {
	const bq = token as Tokens.Blockquote;
	const inner: BlockEditorNode[] = [];
	for (const child of bq.tokens) {
		const mapped = mapToken(child, opts);
		if (mapped) inner.push(mapped);
	}
	return { type: 'blockquote', content: inner };
}
case 'hr':
	return { type: 'horizontalRule' };
```

- [ ] **Step 4: Run; green**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 6 Task 37): map blockquotes + horizontal rules"
```

---

### Task 38: Map image tokens (using assetIdFor)

> Current 7 blog posts have zero inline images. Schema supports them; ImageBlock.svelte renders them. This task guards against future markdown images by mapping to Block Editor `image` blocks via `assetIdFor`.

- [ ] **Step 1: Append failing tests**

```ts
describe('mapMarkdownToBlocks — images', () => {
	it('maps ![alt](legacyPath) using assetIdFor', () => {
		const fakeMap = (path: string): string | undefined =>
			path === 'images/blog/screenshot.png' ? 'uuid-1234' : undefined;
		const doc = mapMarkdownToBlocks('![Screenshot](images/blog/screenshot.png)', { assetIdFor: fakeMap });
		expect(doc.content[0]).toEqual({
			type: 'image',
			attrs: { src: 'uuid-1234', alt: 'Screenshot', title: null },
		});
	});

	it('preserves title attr when present', () => {
		const fakeMap = () => 'uuid-1234';
		const doc = mapMarkdownToBlocks('![A](path "Caption")', { assetIdFor: fakeMap });
		expect((doc.content[0] as any).attrs.title).toBe('Caption');
	});

	it('throws when assetIdFor returns undefined (legacy path not in map)', () => {
		const fakeMap = (): undefined => undefined;
		expect(() =>
			mapMarkdownToBlocks('![A](unknown-path)', { assetIdFor: fakeMap }),
		).toThrow(/asset not found/i);
	});
});
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Add case to `mapToken`. Marked emits images inside paragraphs as inline tokens, so we treat them via `mapInline` only when the paragraph contains ONLY one image, OR detect them at the top level if marked promotes them.**

Replace the paragraph case to detect single-image paragraphs:

```ts
case 'paragraph': {
	const p = token as Tokens.Paragraph;
	const inline = p.tokens ?? [];
	// Block Editor "image" is a top-level node, not inline. If a paragraph
	// contains only one image, hoist it to a block-level image.
	if (inline.length === 1 && inline[0].type === 'image') {
		return mapImageToken(inline[0] as Tokens.Image, opts);
	}
	return {
		type: 'paragraph',
		content: mapInline(inline),
	};
}
```

Add helper at module scope:

```ts
function mapImageToken(
	img: Tokens.Image,
	opts?: { assetIdFor?: (legacyPath: string) => string | undefined },
): BlockEditorNode {
	if (!opts?.assetIdFor) {
		throw new Error(`mapMarkdownToBlocks: image found (${img.href}) but no assetIdFor resolver provided`);
	}
	const uuid = opts.assetIdFor(img.href);
	if (!uuid) {
		throw new Error(`mapMarkdownToBlocks: asset not found in id-map for legacy path: ${img.href}`);
	}
	return {
		type: 'image',
		attrs: {
			src: uuid,
			alt: img.text ?? '',
			title: img.title ?? null,
		},
	};
}
```

- [ ] **Step 4: Run; green**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 6 Task 38): map image tokens via assetIdFor"
```

---

### Task 39: Real-content round-trip — all 7 current blog posts

- [ ] **Step 1: Append failing test**

```ts
describe('mapMarkdownToBlocks — real-content round-trip', () => {
	const blogRoot = resolve(__dirname, '..', '..', 'web', 'src', 'content', 'blog');
	const posts = [
		'professional/why-i-left-orm-for-raw-sql',
		'professional/anime-data-viz-challenge',
		'professional/building-a-transit-pipeline',
		'professional/lorem-data-warehousing',
		'professional/lorem-etl-patterns',
		'personal/lorem-space-exploration',
		'personal/lorem-transit-future',
	] as const;

	for (const slugPath of posts) {
		it(`migrates ${slugPath} cleanly`, () => {
			const filepath = join(blogRoot, slugPath, 'index.md');
			const raw = readFileSync(filepath, 'utf-8');
			const { data, content } = parseFrontmatter(raw);
			const doc = mapMarkdownToBlocks(content, {
				stripLeadingTitle: data.title,
				assetIdFor: () => undefined,  // none of the 7 posts have inline images
			});
			const validated = BlockEditorDocSchema.safeParse(doc);
			if (!validated.success) {
				console.error(slugPath, validated.error.issues);
			}
			expect(validated.success).toBe(true);
			expect(doc.content.length).toBeGreaterThan(0);
		});
	}
});
```

(Add `resolve, join, readFileSync` from `node:path` / `node:fs` to imports if not present.)

- [ ] **Step 2: Run; expect green (all 7 posts should now migrate cleanly)**

```bash
bun test tests/migrate-markdown-to-blocks.test.ts 2>&1 | tail -10
```

If any post fails, inspect `console.error` output and fix the relevant `mapToken` case.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 6 Task 39): real-content round-trip on all 7 posts"
```

---

### Task 40: CLI — `--dry-run`, `--single`, `--help`

- [ ] **Step 1: Implement CLI in `apps/cms/scripts/migrate-markdown-to-blocks.ts`**

Replace the `if (import.meta.main) { ... }` stub with:

```ts
function findBlogPosts(blogRoot: string): { slug: string; filepath: string }[] {
	const out: { slug: string; filepath: string }[] = [];
	for (const cat of ['professional', 'personal']) {
		const catDir = join(blogRoot, cat);
		try {
			for (const slug of readdirSync(catDir)) {
				const dir = join(catDir, slug);
				const stat = statSync(dir);
				if (!stat.isDirectory()) continue;
				if (slug.startsWith('_')) continue;
				const filepath = join(dir, 'index.md');
				try { statSync(filepath); } catch { continue; }
				out.push({ slug, filepath });
			}
		} catch { /* dir doesn't exist; skip */ }
	}
	return out;
}

interface MigrationOutput {
	id: string;
	body: BlockEditorDoc;
	frontmatter: BlogFrontmatter;
}

export function migrateAllPosts(blogRoot: string, opts?: { single?: string }): MigrationOutput[] {
	const posts = findBlogPosts(blogRoot);
	const filtered = opts?.single ? posts.filter((p) => p.slug === opts.single) : posts;
	const out: MigrationOutput[] = [];
	for (const { slug, filepath } of filtered) {
		const raw = readFileSync(filepath, 'utf-8');
		const { data, content } = parseFrontmatter(raw);
		const doc = mapMarkdownToBlocks(content, {
			stripLeadingTitle: data.title,
			assetIdFor: () => undefined,
		});
		out.push({ id: slug, body: doc, frontmatter: data });
	}
	return out;
}

function parseArgs(argv: readonly string[]): { dryRun: boolean; single?: string; help: boolean } {
	const dryRun = argv.includes('--dry-run');
	const help = argv.includes('--help') || argv.includes('-h');
	const singleIdx = argv.indexOf('--single');
	const single = singleIdx >= 0 ? argv[singleIdx + 1] : undefined;
	return { dryRun, single, help };
}

function printHelp(): void {
	console.log(`migrate-markdown-to-blocks — migrate apps/web/src/content/blog/**/index.md to Block Editor JSON.

Usage:
  bun run apps/cms/scripts/migrate-markdown-to-blocks.ts [--dry-run] [--single <slug>]

Flags:
  --dry-run         Print Block Editor JSON for each post; do not write fixture
  --single <slug>   Process only the named post (e.g. --single why-i-left-orm-for-raw-sql)
  -h, --help        Show this help

Output (without --dry-run): apps/cms/fixtures/collections/blog-posts.json (overwritten)
`);
}

if (import.meta.main) {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}

	const blogRoot = resolve(__dirname, '..', '..', 'web', 'src', 'content', 'blog');
	const fixturePath = resolve(__dirname, '..', 'fixtures', 'collections', 'blog-posts.json');

	const out = migrateAllPosts(blogRoot, { single: args.single });
	console.log(`migrated ${out.length} posts`);

	if (args.dryRun) {
		for (const post of out) {
			console.log(`\n=== ${post.id} ===`);
			console.log(JSON.stringify(post.body, null, 2));
		}
		process.exit(0);
	}

	// Write fixture rows (Phase 7 finalizes the fixture shape; this writes a minimal
	// shape that Phase 7 Task 42 expands).
	const rows = out.map((p) => ({
		id: p.id,
		status: 'published',
		date_published: p.frontmatter.date ?? null,
		sort: 0,
		lang: p.frontmatter.lang ?? 'en',
		category: p.frontmatter.category ?? 'professional',
		tags: p.frontmatter.tags ?? [],
		external: p.frontmatter.external ?? false,
		url: p.frontmatter.external ? p.frontmatter.url ?? null : null,
		cover_image_legacy_path: null,
		svg_illustration_id: null,  // Phase 7 fills this with deterministic fallback
		animation: p.frontmatter.animation ?? 'draw',
		body: p.body,
		translations: [
			{
				languages_code: p.frontmatter.lang ?? 'en',
				title: p.frontmatter.title ?? '',
				excerpt: p.frontmatter.excerpt ?? '',
			},
		],
	}));

	writeFileSync(fixturePath, JSON.stringify(rows, null, 2) + '\n');
	console.log(`wrote ${fixturePath}`);
}
```

- [ ] **Step 2: Test CLI manually**

```bash
cd apps/cms
bun run scripts/migrate-markdown-to-blocks.ts --help
bun run scripts/migrate-markdown-to-blocks.ts --dry-run --single why-i-left-orm-for-raw-sql 2>&1 | head -30
```

Expected first command: help output. Second: JSON dump of one post's blocks.

- [ ] **Step 3: Run full migration to write fixture**

```bash
bun run scripts/migrate-markdown-to-blocks.ts
```

Expected: `migrated 7 posts` + `wrote .../fixtures/collections/blog-posts.json`.

- [ ] **Step 4: Inspect output**

```bash
cat fixtures/collections/blog-posts.json | jq '. | length'
cat fixtures/collections/blog-posts.json | jq '.[0].body.type'
cat fixtures/collections/blog-posts.json | jq '.[0].body.content | length'
```

Expected: 7, "doc", positive integer.

- [ ] **Step 5: Commit (script + fixture)**

```bash
git add apps/cms/scripts/migrate-markdown-to-blocks.ts apps/cms/fixtures/collections/blog-posts.json
git commit -m "feat(slice-18 18f Phase 6 Task 40): migrate-markdown-to-blocks CLI + initial fixture write"
```

---

### Task 41: Phase 6 acceptance check

- [ ] **Step 1: Run all migrate-markdown-to-blocks tests**

```bash
cd apps/cms
bun test tests/migrate-markdown-to-blocks.test.ts
```

Expected: 30+ assertions pass (all describe blocks).

- [ ] **Step 2: Run full apps/cms test suite**

```bash
bun test 2>&1 | tail -10
```

Expected: existing 131 tests + new ~30 pass.

- [ ] **Step 3: Sanity check fixture JSON shape**

```bash
cat fixtures/collections/blog-posts.json | jq '.[].id'
```

Expected: 7 slugs.

No commit — verification only.

---

## Phase 7 — Fixtures (4 tasks)

**Exit gate:** All 4 fixture files (blog-posts, illustrations, morph-shapes, projects modified) Zod-valid; cross-references resolve (svg_illustration_id → illustrations row exists; cover_image_legacy_path → assets-id-map entry exists).

### Task 42: Hand-author `apps/cms/fixtures/collections/illustrations.json`

**Files:**
- Create: `apps/cms/fixtures/collections/illustrations.json`

- [ ] **Step 1: Identify SVG file paths in current static fallbacks**

```bash
ls apps/web/src/lib/assets/blog-fallbacks/
```

Expected: 4 pro + 4 personal SVGs.

- [ ] **Step 2: Compute upload destinations**

These SVGs need to be uploaded to Directus's `illustrations` folder. The seed script (Phase 8 Task 50) handles upload + assets-id-map insertion. The fixture references them by `legacy_path`.

- [ ] **Step 3: Write fixture**

```json
[
  {
    "id": "pro-database",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/pro-database.svg",
    "label": "Database engineering",
    "category": "professional",
    "tags": ["database", "sql"],
    "description": "Stylized cylindrical database illustration",
    "sort": 1
  },
  {
    "id": "pro-code",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/pro-code.svg",
    "label": "Code / engineering",
    "category": "professional",
    "tags": ["code", "engineering"],
    "description": "Code brackets + cursor illustration",
    "sort": 2
  },
  {
    "id": "pro-pipeline",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/pro-pipeline.svg",
    "label": "Pipeline / ETL",
    "category": "professional",
    "tags": ["pipeline", "etl", "dataflow"],
    "description": "Data pipeline flow illustration",
    "sort": 3
  },
  {
    "id": "pro-chart",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/pro-chart.svg",
    "label": "Charts / analytics",
    "category": "professional",
    "tags": ["chart", "analytics", "viz"],
    "description": "Bar chart / analytics illustration",
    "sort": 4
  },
  {
    "id": "personal-rocket",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/personal-rocket.svg",
    "label": "Rocket / exploration",
    "category": "personal",
    "tags": ["space", "exploration"],
    "description": "Stylized rocket illustration",
    "sort": 5
  },
  {
    "id": "personal-train",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/personal-train.svg",
    "label": "Train / transit",
    "category": "personal",
    "tags": ["transit", "train"],
    "description": "Stylized train illustration",
    "sort": 6
  },
  {
    "id": "personal-telescope",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/personal-telescope.svg",
    "label": "Telescope / curiosity",
    "category": "personal",
    "tags": ["space", "telescope", "exploration"],
    "description": "Telescope illustration",
    "sort": 7
  },
  {
    "id": "personal-globe",
    "file_legacy_path": "apps/web/src/lib/assets/blog-fallbacks/personal-globe.svg",
    "label": "Globe / world",
    "category": "personal",
    "tags": ["world", "globe"],
    "description": "Stylized globe illustration",
    "sort": 8
  }
]
```

- [ ] **Step 4: Verify each `file_legacy_path` exists**

```bash
for f in $(jq -r '.[].file_legacy_path' apps/cms/fixtures/collections/illustrations.json); do
  test -f "$f" && echo "OK $f" || echo "MISSING $f"
done
```

Expected: 8 OK lines.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/fixtures/collections/illustrations.json
git commit -m "feat(slice-18 18f Phase 7 Task 42): illustrations fixture (8 fallbacks)"
```

---

### Task 43: Hand-author `apps/cms/fixtures/collections/morph-shapes.json`

**Files:**
- Create: `apps/cms/fixtures/collections/morph-shapes.json`

- [ ] **Step 1: Write fixture (4 existing geometric shapes from `apps/web/src/lib/utils/shapes.ts`)**

```json
[
  {
    "id": "triangle",
    "label": "Triangle",
    "path": "M24 8 L40 38 L8 38 Z",
    "viewbox": "0 0 48 48",
    "sort": 1,
    "description": "Equilateral triangle, centered."
  },
  {
    "id": "circle",
    "label": "Circle",
    "path": "M24 8 A16 16 0 1 1 23.99 8 Z",
    "viewbox": "0 0 48 48",
    "sort": 2,
    "description": "Circle, centered."
  },
  {
    "id": "square",
    "label": "Square",
    "path": "M10 10 L38 10 L38 38 L10 38 Z",
    "viewbox": "0 0 48 48",
    "sort": 3,
    "description": "Square, centered."
  },
  {
    "id": "hexagon",
    "label": "Hexagon",
    "path": "M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z",
    "viewbox": "0 0 48 48",
    "sort": 4,
    "description": "Hexagon, centered."
  }
]
```

- [ ] **Step 2: Verify by parsing**

```bash
cat apps/cms/fixtures/collections/morph-shapes.json | jq '. | length'
```

Expected: 4.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/fixtures/collections/morph-shapes.json
git commit -m "feat(slice-18 18f Phase 7 Task 43): morph-shapes fixture (4 geometric shapes)"
```

---

### Task 44: Backfill `svg_illustration_id` in blog-posts.json

**Files:**
- Modify: `apps/cms/fixtures/collections/blog-posts.json`

> The migrate script left `svg_illustration_id: null` for all posts. Set deterministic fallbacks per slug + category (matching the existing `apps/web/src/lib/content/blog.ts` resolveSvgFallbackName logic).

- [ ] **Step 1: Compute deterministic fallback per post**

The hash function (from `apps/web/src/lib/content/blog.ts`):

```ts
function slugHash(slug: string): number {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

const PRO = ['pro-database', 'pro-code', 'pro-pipeline', 'pro-chart'];
const PERSONAL = ['personal-rocket', 'personal-train', 'personal-telescope', 'personal-globe'];
```

Compute fallback for each slug:

```bash
bun run -e "
const PRO = ['pro-database', 'pro-code', 'pro-pipeline', 'pro-chart'];
const PERSONAL = ['personal-rocket', 'personal-train', 'personal-telescope', 'personal-globe'];
function slugHash(slug) {
  let h = 0; for (const c of slug) h = ((h << 5) - h + c.charCodeAt(0)) | 0; return Math.abs(h);
}
const posts = JSON.parse(require('node:fs').readFileSync('apps/cms/fixtures/collections/blog-posts.json', 'utf-8'));
for (const p of posts) {
  const list = p.category === 'personal' ? PERSONAL : PRO;
  p.svg_illustration_id = list[slugHash(p.id) % list.length];
  console.log(p.id, p.category, '→', p.svg_illustration_id);
}
require('node:fs').writeFileSync('apps/cms/fixtures/collections/blog-posts.json', JSON.stringify(posts, null, 2) + '\n');
"
```

Expected output: 7 lines mapping slugs to deterministic illustration IDs (e.g., `why-i-left-orm-for-raw-sql professional → pro-database`).

- [ ] **Step 2: Verify referential integrity (every svg_illustration_id exists in illustrations fixture)**

```bash
bun run -e "
const ill = JSON.parse(require('node:fs').readFileSync('apps/cms/fixtures/collections/illustrations.json', 'utf-8'));
const ids = new Set(ill.map((i) => i.id));
const posts = JSON.parse(require('node:fs').readFileSync('apps/cms/fixtures/collections/blog-posts.json', 'utf-8'));
for (const p of posts) {
  if (!ids.has(p.svg_illustration_id)) console.log('MISSING:', p.id, '→', p.svg_illustration_id);
}
console.log('OK if no MISSING above');
"
```

Expected: only "OK if no MISSING above" line.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/fixtures/collections/blog-posts.json
git commit -m "feat(slice-18 18f Phase 7 Task 44): backfill svg_illustration_id deterministic fallback"
```

---

### Task 45: Fixture tests

**Files:**
- Create: `apps/cms/tests/fixture-blog-posts.test.ts`
- Create: `apps/cms/tests/fixture-illustrations.test.ts`
- Create: `apps/cms/tests/fixture-morph-shapes.test.ts`

- [ ] **Step 1: `fixture-illustrations.test.ts`**

```ts
import { describe, it, expect } from 'bun:test';
import fixture from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { z } from 'zod';

const IllustrationFixtureSchema = z.array(z.object({
	id: z.string().min(1).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	file_legacy_path: z.string().min(1),
	label: z.string().min(1),
	category: z.enum(['professional', 'personal', 'general']),
	tags: z.array(z.string()),
	description: z.string().min(1),
	sort: z.number().int().min(0),
}));

describe('apps/cms/fixtures/collections/illustrations.json', () => {
	it('parses through IllustrationFixtureSchema', () => {
		const result = IllustrationFixtureSchema.safeParse(fixture);
		if (!result.success) console.error(result.error.issues);
		expect(result.success).toBe(true);
	});

	it('contains both professional and personal categories', () => {
		const items = IllustrationFixtureSchema.parse(fixture);
		const cats = new Set(items.map((i) => i.category));
		expect(cats.has('professional')).toBe(true);
		expect(cats.has('personal')).toBe(true);
	});

	it('has unique ids', () => {
		const ids = fixture.map((i: any) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('has at least 4 professional + 4 personal entries', () => {
		const items = IllustrationFixtureSchema.parse(fixture);
		const pro = items.filter((i) => i.category === 'professional').length;
		const personal = items.filter((i) => i.category === 'personal').length;
		expect(pro).toBeGreaterThanOrEqual(4);
		expect(personal).toBeGreaterThanOrEqual(4);
	});
});
```

- [ ] **Step 2: `fixture-morph-shapes.test.ts`**

```ts
import { describe, it, expect } from 'bun:test';
import fixture from '../fixtures/collections/morph-shapes.json' with { type: 'json' };
import { z } from 'zod';

const MorphShapeFixtureSchema = z.array(z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	label: z.string().min(1),
	path: z.string().regex(/^[Mm].*[Zz]$/, 'must be a closed SVG path (start with M, end with Z)'),
	viewbox: z.string().regex(/^\d+\s+\d+\s+\d+\s+\d+$/, 'must be "0 0 W H" format'),
	sort: z.number().int().min(0),
	description: z.string(),
}));

describe('apps/cms/fixtures/collections/morph-shapes.json', () => {
	it('parses through MorphShapeFixtureSchema', () => {
		const result = MorphShapeFixtureSchema.safeParse(fixture);
		if (!result.success) console.error(result.error.issues);
		expect(result.success).toBe(true);
	});

	it('contains at least 4 shapes (matching current static lib)', () => {
		expect(fixture.length).toBeGreaterThanOrEqual(4);
	});

	it('has unique ids', () => {
		const ids = fixture.map((s: any) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
```

- [ ] **Step 3: `fixture-blog-posts.test.ts`**

```ts
import { describe, it, expect } from 'bun:test';
import postsFixture from '../fixtures/collections/blog-posts.json' with { type: 'json' };
import illustrationsFixture from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { z } from 'zod';
import { BlockEditorDocSchema } from '@repo/shared';

const TranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	excerpt: z.string().min(1).max(500),
});

const BlogPostFixtureSchema = z.array(z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	sort: z.number().int().min(0),
	lang: z.enum(['en', 'fr', 'es']),
	category: z.enum(['professional', 'personal']),
	tags: z.array(z.string()),
	external: z.boolean(),
	url: z.string().nullable(),
	cover_image_legacy_path: z.string().nullable(),
	svg_illustration_id: z.string().nullable(),
	animation: z.enum(['draw', 'morph', 'draw-fill']),
	body: BlockEditorDocSchema,
	translations: z.array(TranslationSchema).min(1),
}));

describe('apps/cms/fixtures/collections/blog-posts.json', () => {
	it('parses through BlogPostFixtureSchema', () => {
		const result = BlogPostFixtureSchema.safeParse(postsFixture);
		if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2));
		expect(result.success).toBe(true);
	});

	it('contains exactly 7 posts (matches current markdown count)', () => {
		expect(postsFixture.length).toBe(7);
	});

	it('every post has at least one translation matching post.lang', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		for (const p of posts) {
			const matching = p.translations.find((t) => t.languages_code === p.lang);
			expect(matching).toBeDefined();
		}
	});

	it('every svg_illustration_id (when set) exists in illustrations fixture', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		const ids = new Set(illustrationsFixture.map((i: any) => i.id));
		for (const p of posts) {
			if (p.svg_illustration_id) {
				expect(ids.has(p.svg_illustration_id)).toBe(true);
			}
		}
	});

	it('external posts have url; non-external posts have null url', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		for (const p of posts) {
			if (p.external) expect(p.url).toBeTruthy();
			else expect(p.url).toBeNull();
		}
	});

	it('non-external posts have non-empty body', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		for (const p of posts) {
			if (!p.external) expect(p.body.content.length).toBeGreaterThan(0);
		}
	});

	it('every body parses through BlockEditorDocSchema', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		for (const p of posts) {
			const result = BlockEditorDocSchema.safeParse(p.body);
			expect(result.success).toBe(true);
		}
	});
});

// Export schema for reuse by seed-blog-posts.ts (Phase 8)
export { BlogPostFixtureSchema };
```

- [ ] **Step 4: Run all 3 fixture tests**

```bash
cd apps/cms
bun test tests/fixture-blog-posts.test.ts tests/fixture-illustrations.test.ts tests/fixture-morph-shapes.test.ts
```

Expected: ~15 assertions pass.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/tests/fixture-blog-posts.test.ts apps/cms/tests/fixture-illustrations.test.ts apps/cms/tests/fixture-morph-shapes.test.ts
git commit -m "feat(slice-18 18f Phase 7 Task 45): fixture tests for blog-posts + illustrations + morph-shapes"
```

---

## Phase 8 — Seed scripts (8 tasks)

**Exit gate:** All 4 collections seeded live (`illustrations` × 8, `morph_shapes` × 4, `blog_posts` × 7 + 7 translations); `projects` re-seeded with Block Editor descriptions/sections; full data verifiable via `/items/<collection>` Public reads where status=published.

### Task 46: `seed-illustrations.ts` script

**Files:**
- Create: `apps/cms/scripts/seed-illustrations.ts`
- Create: `apps/cms/tests/seed-illustrations-dry-run.test.ts`

> Mirrors `apps/cms/scripts/seed-projects.ts` shape: lib/* helpers + Zod fixture + dry-run + reset + pure transform helpers exported for tests. Difference: uploads SVG files to Directus (`directus_files`) before creating illustration rows; tracks file UUIDs in a per-run map.

- [ ] **Step 1: Write test (dry-run pure-helpers)**

```ts
// apps/cms/tests/seed-illustrations-dry-run.test.ts
import { describe, it, expect } from 'bun:test';
import {
	toIllustrationRow,
	loadIllustrationsFixture,
	type IllustrationFixture,
} from '../scripts/seed-illustrations';

describe('seed-illustrations pure helpers', () => {
	const fixture = loadIllustrationsFixture();

	describe('loadIllustrationsFixture', () => {
		it('returns at least 8 rows', () => {
			expect(fixture.length).toBeGreaterThanOrEqual(8);
		});

		it('every row has id + label + category + description', () => {
			for (const row of fixture) {
				expect(row.id).toBeTruthy();
				expect(row.label).toBeTruthy();
				expect(row.category).toBeTruthy();
				expect(row.description).toBeTruthy();
			}
		});
	});

	describe('toIllustrationRow', () => {
		it('returns the database row shape (no file_legacy_path; replaced by file UUID)', () => {
			const fakeUuid = '00000000-0000-0000-0000-000000000001';
			const row = toIllustrationRow(fixture[0], fakeUuid);
			expect(row).toEqual({
				id: fixture[0].id,
				file: fakeUuid,
				label: fixture[0].label,
				category: fixture[0].category,
				tags: fixture[0].tags,
				description: fixture[0].description,
				sort: fixture[0].sort,
			});
			expect(row).not.toHaveProperty('file_legacy_path');
		});
	});
});
```

- [ ] **Step 2: Run; FAIL**

```bash
cd apps/cms
bun test tests/seed-illustrations-dry-run.test.ts 2>&1 | head -10
```

- [ ] **Step 3: Write `apps/cms/scripts/seed-illustrations.ts`**

```ts
#!/usr/bin/env bun
/**
 * Seed the Directus `illustrations` collection from
 * `fixtures/collections/illustrations.json`.
 *
 * Slice 18 18f Phase 8. Mirrors seed-projects.ts shape (lib/* + dry-run +
 * reset + pure helpers). Difference: uploads SVG files to Directus
 * before creating rows; the resulting file UUIDs populate the M2O.
 */

import { createItem, deleteItem, readItems, uploadFiles } from '@directus/sdk';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import fixtureData from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Zod ----------------------------------------------------------------

const IllustrationFixtureRowSchema = z.object({
	id: z.string().min(1),
	file_legacy_path: z.string().min(1),
	label: z.string().min(1),
	category: z.enum(['professional', 'personal', 'general']),
	tags: z.array(z.string()).readonly(),
	description: z.string().min(1),
	sort: z.number().int().min(0),
});

export type IllustrationFixture = z.infer<typeof IllustrationFixtureRowSchema>;

export const IllustrationsFixtureSchema = z.array(IllustrationFixtureRowSchema).min(1).readonly();

export function loadIllustrationsFixture(): readonly IllustrationFixture[] {
	return IllustrationsFixtureSchema.parse(fixtureData);
}

// --- Row shape ----------------------------------------------------------

export interface DirectusIllustrationRow {
	id: string;
	file: string;
	label: string;
	category: 'professional' | 'personal' | 'general';
	tags: readonly string[];
	description: string;
	sort: number;
}

export function toIllustrationRow(fixture: IllustrationFixture, fileUuid: string): DirectusIllustrationRow {
	return {
		id: fixture.id,
		file: fileUuid,
		label: fixture.label,
		category: fixture.category,
		tags: fixture.tags,
		description: fixture.description,
		sort: fixture.sort,
	};
}

// --- I/O ----------------------------------------------------------------

interface Schema {
	illustrations: DirectusIllustrationRow[];
}

const log = createLogger('seed-illustrations');

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
}

export async function seedIllustrations(
	rows: readonly IllustrationFixture[],
	opts: SeedRunOptions,
): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would seed ${rows.length} illustrations against ${opts.directusUrl}`);
		for (const r of rows) {
			log.info(`  ~ ${r.id.padEnd(24)}  ${r.category}  file=${r.file_legacy_path}`);
		}
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		const existing = await client.request(readItems('illustrations', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			log.info(`clearing ${existing.length} existing illustrations...`);
			for (const r of existing) {
				try { await client.request(deleteItem('illustrations', r.id)); }
				catch (err) {
					throw new DirectusError(500, `Failed to delete illustration ${r.id}: ${parseErrors(err).join(' · ')}`);
				}
			}
		}
	} else {
		const existing = await client.request(readItems('illustrations', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			throw new Error(`[seed-illustrations] found ${existing.length} existing rows. Re-run with --reset.`);
		}
	}

	log.info(`uploading + creating ${rows.length} illustrations...`);
	for (const fixture of rows) {
		// Upload SVG to illustrations folder
		const svgBytes = readFileSync(fixture.file_legacy_path);
		const formData = new FormData();
		formData.append('folder', 'illustrations');  // folder id resolved by Directus
		formData.append('title', fixture.label);
		formData.append('description', fixture.description);
		formData.append('file', new Blob([svgBytes], { type: 'image/svg+xml' }), `${fixture.id}.svg`);

		let fileUuid: string;
		try {
			const uploaded = await client.request(uploadFiles(formData));
			fileUuid = (uploaded as { id: string }).id;
		} catch (err) {
			throw new DirectusError(500, `Failed to upload ${fixture.file_legacy_path}: ${parseErrors(err).join(' · ')}`);
		}

		// Create illustration row referencing the file
		const row = toIllustrationRow(fixture, fileUuid);
		try {
			await client.request(createItem('illustrations', row as unknown as DirectusIllustrationRow));
			log.info(`  ✓ ${fixture.id.padEnd(24)}  file=${fileUuid}`);
		} catch (err) {
			throw new DirectusError(500, `Failed to create illustration ${fixture.id}: ${parseErrors(err).join(' · ')}`);
		}
	}

	log.info('done.');
}

function parseFlags(argv: readonly string[]): { dryRun: boolean; reset: boolean } {
	return { dryRun: argv.includes('--dry-run'), reset: argv.includes('--reset') };
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseFlags(process.argv.slice(2));
	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	const rows = loadIllustrationsFixture();

	if (dryRun) {
		await seedIllustrations(rows, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedIllustrations(rows, { directusUrl, token, reset });
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-illustrations] FAILED:', err);
		process.exit(1);
	});
}
```

- [ ] **Step 4: Run tests; expect green**

```bash
bun test tests/seed-illustrations-dry-run.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/seed-illustrations.ts apps/cms/tests/seed-illustrations-dry-run.test.ts
git commit -m "feat(slice-18 18f Phase 8 Task 46): seed-illustrations.ts (with file uploads)"
```

---

### Task 47: `seed-morph-shapes.ts` script

**Files:**
- Create: `apps/cms/scripts/seed-morph-shapes.ts`
- Create: `apps/cms/tests/seed-morph-shapes-dry-run.test.ts`

> Simpler than seed-illustrations — no file upload. Pure data seed.

- [ ] **Step 1: Write test**

```ts
// apps/cms/tests/seed-morph-shapes-dry-run.test.ts
import { describe, it, expect } from 'bun:test';
import {
	toMorphShapeRow,
	loadMorphShapesFixture,
} from '../scripts/seed-morph-shapes';

describe('seed-morph-shapes pure helpers', () => {
	const fixture = loadMorphShapesFixture();

	it('loads ≥4 fixture rows', () => {
		expect(fixture.length).toBeGreaterThanOrEqual(4);
	});

	it('every row has a closed SVG path', () => {
		for (const row of fixture) {
			expect(row.path).toMatch(/^[Mm]/);
			expect(row.path).toMatch(/[Zz]\s*$/);
		}
	});

	it('toMorphShapeRow returns the row shape unchanged', () => {
		const row = toMorphShapeRow(fixture[0]);
		expect(row).toEqual(fixture[0]);
	});
});
```

- [ ] **Step 2: Write `apps/cms/scripts/seed-morph-shapes.ts`**

```ts
#!/usr/bin/env bun
/**
 * Seed the Directus `morph_shapes` collection.
 * Slice 18 18f Phase 8. Pure data seed; no file uploads.
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/morph-shapes.json' with { type: 'json' };
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const MorphShapeFixtureRowSchema = z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	label: z.string().min(1),
	path: z.string().min(1),
	viewbox: z.string().min(1),
	sort: z.number().int().min(0),
	description: z.string(),
});

export type MorphShapeFixture = z.infer<typeof MorphShapeFixtureRowSchema>;
export const MorphShapesFixtureSchema = z.array(MorphShapeFixtureRowSchema).min(1).readonly();

export function loadMorphShapesFixture(): readonly MorphShapeFixture[] {
	return MorphShapesFixtureSchema.parse(fixtureData);
}

export interface DirectusMorphShapeRow {
	id: string;
	label: string;
	path: string;
	viewbox: string;
	sort: number;
	description: string;
}

export function toMorphShapeRow(fixture: MorphShapeFixture): DirectusMorphShapeRow {
	return { ...fixture };
}

interface Schema { morph_shapes: DirectusMorphShapeRow[]; }
const log = createLogger('seed-morph-shapes');

export interface SeedRunOptions { directusUrl: string; token: string; dryRun?: boolean; reset?: boolean; }

export async function seedMorphShapes(rows: readonly MorphShapeFixture[], opts: SeedRunOptions): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would seed ${rows.length} shapes against ${opts.directusUrl}`);
		for (const r of rows) log.info(`  ~ ${r.id} (${r.viewbox})`);
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);
	if (opts.reset) {
		const existing = await client.request(readItems('morph_shapes', { fields: ['id'], limit: -1 }));
		for (const r of existing) {
			try { await client.request(deleteItem('morph_shapes', r.id)); }
			catch (err) { throw new DirectusError(500, `delete ${r.id}: ${parseErrors(err).join(' · ')}`); }
		}
	} else {
		const existing = await client.request(readItems('morph_shapes', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) throw new Error(`[seed-morph-shapes] found ${existing.length} existing rows. Re-run with --reset.`);
	}

	for (const r of rows) {
		try { await client.request(createItem('morph_shapes', toMorphShapeRow(r) as unknown as DirectusMorphShapeRow)); }
		catch (err) { throw new DirectusError(500, `create ${r.id}: ${parseErrors(err).join(' · ')}`); }
		log.info(`  ✓ ${r.id}`);
	}
}

async function main(): Promise<void> {
	const dryRun = process.argv.includes('--dry-run');
	const reset = process.argv.includes('--reset');
	const url = defaultDirectusUrl();
	const rows = loadMorphShapesFixture();
	if (dryRun) { await seedMorphShapes(rows, { directusUrl: url, token: '', dryRun: true }); return; }
	const token = await getAdminToken(url);
	await seedMorphShapes(rows, { directusUrl: url, token, reset });
}

if (import.meta.main) {
	main().catch((err) => { console.error('[seed-morph-shapes] FAILED:', err); process.exit(1); });
}
```

- [ ] **Step 3: Tests pass**

```bash
bun test tests/seed-morph-shapes-dry-run.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/cms/scripts/seed-morph-shapes.ts apps/cms/tests/seed-morph-shapes-dry-run.test.ts
git commit -m "feat(slice-18 18f Phase 8 Task 47): seed-morph-shapes.ts"
```

---

### Task 48: `seed-blog-posts.ts` script

**Files:**
- Create: `apps/cms/scripts/seed-blog-posts.ts`
- Create: `apps/cms/tests/seed-blog-posts-dry-run.test.ts`

> Mirrors seed-projects shape but uses `BlockEditorDoc` for body field. Translations follow the projects pattern (nested array passed at create time).

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'bun:test';
import {
	toBlogPostRow,
	toTranslationRows,
	loadBlogPostsFixture,
} from '../scripts/seed-blog-posts';

describe('seed-blog-posts pure helpers', () => {
	const fixture = loadBlogPostsFixture();
	const orm = fixture.find((p) => p.id === 'why-i-left-orm-for-raw-sql')!;
	const fr = fixture.find((p) => p.id === 'lorem-etl-patterns')!;

	describe('toBlogPostRow', () => {
		it('preserves id + scalars', () => {
			const row = toBlogPostRow(orm);
			expect(row.id).toBe('why-i-left-orm-for-raw-sql');
			expect(row.status).toBe('published');
			expect(row.lang).toBe('en');
			expect(row.category).toBe('professional');
			expect(row.animation).toBe('draw');
			expect(row.svg_illustration).toBeTruthy();
			expect(row.tags).toEqual(['sql', 'postgresql', 'opinion']);
		});

		it('passes body through unchanged', () => {
			const row = toBlogPostRow(orm);
			expect(row.body).toEqual(orm.body);
		});

		it('flattens french post lang correctly', () => {
			const row = toBlogPostRow(fr);
			expect(row.lang).toBe('fr');
		});

		it('returns null url for non-external posts', () => {
			const row = toBlogPostRow(orm);
			expect(row.url).toBeNull();
		});
	});

	describe('toTranslationRows', () => {
		it('returns at least one row matching post.lang', () => {
			const rows = toTranslationRows(orm);
			const en = rows.find((r) => r.languages_code === 'en');
			expect(en).toBeDefined();
			expect(en!.title).toBe('Why I Left ORM for Raw SQL');
		});
	});
});
```

- [ ] **Step 2: Write `apps/cms/scripts/seed-blog-posts.ts`**

```ts
#!/usr/bin/env bun
/**
 * Seed Directus `blog_posts` + `blog_posts_translations` from
 * `fixtures/collections/blog-posts.json`.
 *
 * Slice 18 18f Phase 8. Mirrors seed-projects shape: lib/* + Zod fixture
 * + dry-run + reset + pure helpers. Uses Block Editor JSON for body.
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/blog-posts.json' with { type: 'json' };
import { assetIdForOrUndefined } from '@repo/shared';
import { BlockEditorDocSchema, type BlockEditorDoc } from '@repo/shared';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Zod ---

const TranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	excerpt: z.string().min(1).max(500),
});

const BlogPostFixtureRowSchema = z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	sort: z.number().int().min(0),
	lang: z.enum(['en', 'fr', 'es']),
	category: z.enum(['professional', 'personal']),
	tags: z.array(z.string()).readonly(),
	external: z.boolean(),
	url: z.string().nullable(),
	cover_image_legacy_path: z.string().nullable(),
	svg_illustration_id: z.string().nullable(),
	animation: z.enum(['draw', 'morph', 'draw-fill']),
	body: BlockEditorDocSchema,
	translations: z.array(TranslationSchema).min(1),
});

export type BlogPostFixture = z.infer<typeof BlogPostFixtureRowSchema>;
export const BlogPostsFixtureSchema = z.array(BlogPostFixtureRowSchema).min(1).readonly();

export function loadBlogPostsFixture(): readonly BlogPostFixture[] {
	return BlogPostsFixtureSchema.parse(fixtureData);
}

// --- Row shapes ---

export interface DirectusBlogPostTranslationRow {
	languages_code: 'en' | 'fr' | 'es';
	title: string;
	excerpt: string;
}

export interface DirectusBlogPostRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number;
	lang: 'en' | 'fr' | 'es';
	category: 'professional' | 'personal';
	tags: readonly string[];
	external: boolean;
	url: string | null;
	cover_image: string | null;
	svg_illustration: string | null;
	animation: 'draw' | 'morph' | 'draw-fill';
	body: BlockEditorDoc;
	translations: readonly DirectusBlogPostTranslationRow[];
}

// --- Pure helpers ---

export function toTranslationRows(fixture: BlogPostFixture): readonly DirectusBlogPostTranslationRow[] {
	return fixture.translations.map((t) => ({
		languages_code: t.languages_code,
		title: t.title,
		excerpt: t.excerpt,
	}));
}

export function toBlogPostRow(fixture: BlogPostFixture): DirectusBlogPostRow {
	const coverUuid = fixture.cover_image_legacy_path
		? assetIdForOrUndefined(fixture.cover_image_legacy_path) ?? null
		: null;
	return {
		id: fixture.id,
		status: fixture.status,
		date_published: fixture.date_published,
		sort: fixture.sort,
		lang: fixture.lang,
		category: fixture.category,
		tags: fixture.tags,
		external: fixture.external,
		url: fixture.external ? fixture.url : null,
		cover_image: coverUuid,
		svg_illustration: fixture.svg_illustration_id,
		animation: fixture.animation,
		body: fixture.body,
		translations: toTranslationRows(fixture),
	};
}

// --- I/O ---

interface Schema {
	blog_posts: DirectusBlogPostRow[];
}

const log = createLogger('seed-blog-posts');

export interface SeedRunOptions { directusUrl: string; token: string; dryRun?: boolean; reset?: boolean; }

export async function seedBlogPosts(fixtures: readonly BlogPostFixture[], opts: SeedRunOptions): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would process ${fixtures.length} blog posts against ${opts.directusUrl}`);
		for (const f of fixtures) {
			const row = toBlogPostRow(f);
			log.info(
				`  ~ ${f.id.padEnd(36)}  status=${row.status}  lang=${row.lang}  ` +
				`cat=${row.category}  ext=${row.external}  body.blocks=${row.body.content.length}  ` +
				`tx=${row.translations.length}`,
			);
		}
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		const existing = await client.request(readItems('blog_posts', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			log.info(`clearing ${existing.length} existing blog_posts (FK cascade clears translations)...`);
			for (const r of existing) {
				try { await client.request(deleteItem('blog_posts', r.id)); }
				catch (err) {
					throw new DirectusError(500, `Failed to delete blog_post ${r.id}: ${parseErrors(err).join(' · ')}`);
				}
			}
		}
	} else {
		const existing = await client.request(readItems('blog_posts', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			throw new Error(`[seed-blog-posts] found ${existing.length} existing rows. Re-run with --reset.`);
		}
	}

	log.info(`creating ${fixtures.length} blog posts (with nested translations)...`);
	for (const f of fixtures) {
		const row = toBlogPostRow(f);
		try {
			await client.request(createItem('blog_posts', row as unknown as DirectusBlogPostRow));
		} catch (err) {
			throw new DirectusError(500, `Failed to create blog_post ${f.id}: ${parseErrors(err).join(' · ')}`);
		}
		log.info(`  ✓ ${f.id.padEnd(36)} status=${row.status}`);
	}

	const final = await client.request(readItems('blog_posts', { fields: ['id'], limit: -1 }));
	if (final.length !== fixtures.length) {
		throw new Error(`[seed-blog-posts] count mismatch: expected ${fixtures.length}, got ${final.length}`);
	}
	log.info(`verified: ${final.length} blog posts in Directus`);
}

async function main(): Promise<void> {
	const dryRun = process.argv.includes('--dry-run');
	const reset = process.argv.includes('--reset');
	const url = defaultDirectusUrl();
	log.info(`target: ${url}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	const fixtures = loadBlogPostsFixture();
	log.info(`source: ${fixtures.length} posts from fixtures/collections/blog-posts.json`);

	if (dryRun) { await seedBlogPosts(fixtures, { directusUrl: url, token: '', dryRun: true }); return; }
	const token = await getAdminToken(url);
	await seedBlogPosts(fixtures, { directusUrl: url, token, reset });
}

if (import.meta.main) {
	main().catch((err) => { console.error('[seed-blog-posts] FAILED:', err); process.exit(1); });
}
```

- [ ] **Step 3: Tests pass**

```bash
bun test tests/seed-blog-posts-dry-run.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/cms/scripts/seed-blog-posts.ts apps/cms/tests/seed-blog-posts-dry-run.test.ts
git commit -m "feat(slice-18 18f Phase 8 Task 48): seed-blog-posts.ts"
```

---

### Task 49: Modify `seed-projects.ts` to wrap description + sections.content as Block Editor

**Files:**
- Modify: `apps/cms/scripts/seed-projects.ts`
- Modify: `apps/cms/tests/seed-projects-dry-run.test.ts`

- [ ] **Step 1: Update transform helpers**

Open `apps/cms/scripts/seed-projects.ts`. Find `toTranslationRows` and `toSectionRows`. Update to wrap text in Block Editor JSON.

Replace:

```ts
export function toTranslationRows(
	project: ProjectFixture,
): readonly DirectusProjectTranslationRow[] {
	return project.translations.map((t) => ({
		languages_code: t.languages_code,
		title: t.title,
		one_liner: t.one_liner,
		description: t.description,
	}));
}
```

With:

```ts
import { wrapPlainText, type BlockEditorDoc } from '@repo/shared';

// ... type updates:
export interface DirectusProjectTranslationRow {
	languages_code: Locale;
	title: string;
	one_liner: string;
	description: BlockEditorDoc;  // was: string
}

export interface DirectusProjectSectionTranslationRow {
	languages_code: Locale;
	title: string;
	content: BlockEditorDoc;  // was: string
}

export function toTranslationRows(
	project: ProjectFixture,
): readonly DirectusProjectTranslationRow[] {
	return project.translations.map((t) => ({
		languages_code: t.languages_code,
		title: t.title,
		one_liner: t.one_liner,
		description: wrapPlainText(t.description),
	}));
}

export function toSectionRows(
	project: ProjectFixture,
): readonly DirectusProjectSectionRow[] {
	return project.sections.map((s) => ({
		sort: s.sort,
		translations: s.translations.map((t) => ({
			languages_code: t.languages_code,
			title: t.title,
			content: wrapPlainText(t.content),
		})),
	}));
}
```

- [ ] **Step 2: Update `seed-projects-dry-run.test.ts` expectations**

Find the test that asserts `description` shape. Replace expected string with the BlockEditorDoc shape (`{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '...' }] }] }`).

Add explicit assertion:

```ts
it('wraps description as a single-paragraph Block Editor doc', () => {
	const rows = toTranslationRows(yesidDev);
	const en = rows.find((r) => r.languages_code === 'en')!;
	expect(en.description.type).toBe('doc');
	expect(en.description.content[0].type).toBe('paragraph');
	expect((en.description.content[0] as any).content[0].text).toContain('SvelteKit');
});

it('wraps sections.content as a single-paragraph Block Editor doc', () => {
	const sections = toSectionRows(yesidDev);
	if (sections.length > 0) {
		const tx = sections[0].translations[0];
		expect(tx.content.type).toBe('doc');
		expect(tx.content.content[0].type).toBe('paragraph');
	}
});
```

- [ ] **Step 3: Run tests; expect green**

```bash
bun test tests/seed-projects-dry-run.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/cms/scripts/seed-projects.ts apps/cms/tests/seed-projects-dry-run.test.ts
git commit -m "feat(slice-18 18f Phase 8 Task 49): seed-projects wraps description + sections.content as Block Editor (#41)"
```

---

### Task 50: Run all seeds in order against live CMS

**Files:**
- Run: 4 seed commands

> Order matters: illustrations + morph_shapes have no FK dependencies. blog_posts depends on illustrations. projects re-seed needs the modified Block Editor schema (Phase 5 push) already applied.

- [ ] **Step 1: Run seed-illustrations**

```bash
cd apps/cms
bun run scripts/seed-illustrations.ts --dry-run | head -20
bun run scripts/seed-illustrations.ts
```

Expected: 8 illustrations created with file UUIDs logged.

- [ ] **Step 2: Run seed-morph-shapes**

```bash
bun run scripts/seed-morph-shapes.ts --dry-run | head
bun run scripts/seed-morph-shapes.ts
```

Expected: 4 shapes created.

- [ ] **Step 3: Run seed-blog-posts**

```bash
bun run scripts/seed-blog-posts.ts --dry-run | head -20
bun run scripts/seed-blog-posts.ts
```

Expected: 7 posts created (with nested translations), final verification message.

- [ ] **Step 4: Re-run seed-projects (to apply Block Editor wrapping)**

```bash
bun run scripts/seed-projects.ts --dry-run | head -20
bun run scripts/seed-projects.ts --reset
```

Expected: 6 projects re-created. (--reset because rows already exist from 18e; seed forbids non-empty starting state without --reset.)

- [ ] **Step 5: Verify Public reads work**

```bash
curl -s 'https://cms.yesid.dev/items/illustrations?fields=id,label,category&limit=-1' | jq '.data | length'
curl -s 'https://cms.yesid.dev/items/morph_shapes?fields=id,label&limit=-1' | jq '.data | length'
curl -s 'https://cms.yesid.dev/items/blog_posts?fields=id,status&limit=-1' | jq '.data | length'
curl -s 'https://cms.yesid.dev/items/projects?fields=id&limit=-1' | jq '.data | length'
```

Expected: 8, 4, 7, 6.

No commit — operates on live state.

---

### Task 51: Live verification of body Block Editor JSON

**Files:**
- Run verification commands

- [ ] **Step 1: Fetch one blog post body + verify shape**

```bash
JWT=$(curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $JWT" \
  'https://cms.yesid.dev/items/blog_posts/why-i-left-orm-for-raw-sql?fields=body' \
  | jq '.data.body.type'
```

Expected: `"doc"`.

- [ ] **Step 2: Verify no surprise shape divergences vs P3 probe findings**

If P3 probe (Phase 2) revealed shape adjustments, verify those still hold here. Document any new surprises in research.md.

- [ ] **Step 3: Render Public anon read confirms cascade FK filter works**

```bash
curl -s 'https://cms.yesid.dev/items/blog_posts_translations?filter[blog_posts_id][_eq]=lorem-etl-patterns&fields=languages_code,title' | jq
```

Expected: array with the FR translation row visible (since lorem-etl-patterns is published).

No commit — verification only.

---

### Task 52: Phase 8 acceptance check

- [ ] **Step 1: All apps/cms tests pass**

```bash
cd apps/cms
bun test 2>&1 | tail -10
```

Expected: 131 (existing) + ~50 (new from 18f) = ~180+ tests pass.

- [ ] **Step 2: Permissions matrix correct**

```bash
JWT=$(curl -s -X POST https://cms.yesid.dev/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
  | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $JWT" \
  'https://cms.yesid.dev/permissions?filter[collection][_in]=blog_posts,blog_posts_translations,illustrations,morph_shapes&limit=-1' \
  | jq '.data | length'
```

Expected: ≥30 permission rows visible (3 ai-editor × 4 collections + 4 human-editor × 4 collections + 1 Public × 4 collections + cascade variants).

No commit — verification only.

---

## Phase 9 — Adapter (Directus side) (10 tasks)

**Exit gate:** All 13 blog port methods + `content.morphShapes` implemented in `apps/web/src/lib/adapters/directus.ts` with `parsePort` + `createQueuedFetch` gates; `BlogPort` interface extended with `bodyBySlug`; `directus.contract.test.ts` and `directus.mocked.test.ts` cover new surface; `bun run check` 0 errors.

### Task 53: Extend `BlogPort` with `bodyBySlug`; add `morphShapes` to `ContentPort`

**Files:**
- Modify: `apps/web/src/lib/adapters/types.ts`

- [ ] **Step 1: Add imports**

At top of `apps/web/src/lib/adapters/types.ts`, add to existing `from '$lib/types'`:

```ts
import type {
	// ... existing imports ...
	BlockEditorDoc,
	MorphShape,
} from '$lib/types';
```

(`$lib/types` re-exports `@repo/shared`.)

- [ ] **Step 2: Add `bodyBySlug` method to `BlogPort` interface**

Find the existing `BlogPort` interface (around line 85). Add after `html`:

```ts
export interface BlogPort {
	all(ctx?: PreviewContext): Promise<readonly BlogPost[]>;
	bySlug(slug: string, ctx?: PreviewContext): Promise<BlogPost | undefined>;
	html(slug: string, ctx?: PreviewContext): Promise<string>;
	bodyBySlug(slug: string, ctx?: PreviewContext): Promise<BlockEditorDoc | null>;  // NEW
	byCategory(category: BlogCategory, ctx?: PreviewContext): Promise<readonly BlogPost[]>;
	// ... rest unchanged
}
```

- [ ] **Step 3: Add `morphShapes` method to `ContentPort` interface**

Find the existing `ContentPort` interface (around line 157). Add at the end (just before metroSvg or similar):

```ts
export interface ContentPort {
	// ... existing methods ...
	/**
	 * The geometric morph-target library (CMS-managed via the
	 * morph_shapes collection). Replaces the hardcoded SHAPES const
	 * in apps/web/src/lib/utils/shapes.ts.
	 */
	morphShapes(ctx?: PreviewContext): Promise<readonly MorphShape[]>;
}
```

- [ ] **Step 4: Run check**

```bash
cd apps/web
bun run check 2>&1 | head -10
```

Expected: errors complaining about missing implementations of `bodyBySlug` + `morphShapes` on static + Directus adapters. (We'll fix in next tasks.)

- [ ] **Step 5: Add stub implementations to static + directus adapters first (so check passes)**

In `apps/web/src/lib/adapters/static.ts` blog port:

```ts
bodyBySlug: async (slug) => {
	// Static adapter has no Block Editor body; return null (consumers fall back
	// to the legacy html() path during 18f).
	return null;
},
```

In `apps/web/src/lib/adapters/static.ts` content port (find the existing block):

```ts
morphShapes: async () => {
	// Static fallback: return the existing 4 hardcoded shapes.
	const { SHAPES } = await import('$lib/utils/shapes');
	return Object.entries(SHAPES).map(([id, path], idx) => ({
		id,
		label: id.charAt(0).toUpperCase() + id.slice(1),
		path,
		viewbox: '0 0 48 48',
		sort: idx + 1,
	}));
},
```

In `apps/web/src/lib/adapters/directus.ts` blog port (find the `blog: { ... }` section near line 696):

```ts
bodyBySlug: async () => todo('blog.bodyBySlug'),
```

And in content port (find the existing block around line 730):

```ts
morphShapes: async () => todo('content.morphShapes'),
```

- [ ] **Step 6: Re-run check**

```bash
bun run check 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/adapters/types.ts \
        apps/web/src/lib/adapters/static.ts \
        apps/web/src/lib/adapters/directus.ts
git commit -m "feat(slice-18 18f Phase 9 Task 53): extend BlogPort + ContentPort with bodyBySlug + morphShapes"
```

---

### Task 54: Add `BlogPostSchema` to `@repo/shared` (or apps/web/src/lib/schemas/) for parsePort

**Files:**
- Modify: `apps/web/src/lib/schemas/blog.ts` (or create if missing)

- [ ] **Step 1: Locate or create the schema file**

```bash
ls apps/web/src/lib/schemas/
grep -l "BlogPost" apps/web/src/lib/schemas/*.ts 2>&1
```

Likely path: `apps/web/src/lib/schemas/blog.ts`. If missing, create it. The file must export `BlogPostSchema: z.ZodType<BlogPost>` matching the static adapter's existing parsePort calls (used at line 160-169 of static.ts).

- [ ] **Step 2: Verify the schema parses a sample BlogPost**

```ts
// One-off verification snippet — paste into a temp test or REPL
import { BlogPostSchema } from '$lib/schemas/blog';
const sample = {
	slug: 'why-i-left-orm-for-raw-sql',
	title: { en: 'Why I Left ORM for Raw SQL' },
	excerpt: { en: 'After years of fighting...' },
	date: '2026-04-01',
	lang: 'en',
	category: 'professional',
	tags: ['sql'],
	animation: 'draw',
	svg: 'pro-database',
	url: '/blog/why-i-left-orm-for-raw-sql',
	external: false,
};
console.log(BlogPostSchema.safeParse(sample));
```

If schema doesn't exist or doesn't match, write it:

```ts
import { z } from 'zod';
import type { BlogPost } from '$lib/types';

const LocalizedStringSchema = z.object({
	en: z.string(),
	fr: z.string().optional(),
	es: z.string().optional(),
});

export const BlogAnimationSchema = z.enum(['draw', 'morph', 'draw-fill']);
export const BlogCategorySchema = z.enum(['professional', 'personal']);

export const BlogPostSchema: z.ZodType<BlogPost> = z.object({
	slug: z.string().min(1),
	title: LocalizedStringSchema,
	excerpt: LocalizedStringSchema,
	date: z.string(),
	lang: z.enum(['en', 'fr', 'es']),
	category: BlogCategorySchema,
	tags: z.array(z.string()),
	animation: BlogAnimationSchema,
	svg: z.string(),
	url: z.string(),
	external: z.boolean(),
});
```

- [ ] **Step 3: Commit (if file changed)**

```bash
git status apps/web/src/lib/schemas/blog.ts
git add apps/web/src/lib/schemas/blog.ts
git commit -m "feat(slice-18 18f Phase 9 Task 54): ensure BlogPostSchema covers all fields"
```

---

### Task 55: Implement `directus.blog.all` + `bySlug` + `bodyBySlug`

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

> Use the existing `parsePort` + `createQueuedFetch` + WeakMap memo patterns established in 18a/18c/18e. Mirror services + projects port shapes.

- [ ] **Step 1: Locate the blog section in directus.ts (around line 696)**

```bash
grep -n "blog: {" apps/web/src/lib/adapters/directus.ts
```

Identify the block. The 12 stubs (`todo('blog.X')`) are visible from line ~696 onwards.

- [ ] **Step 2: Add row interface + mapping function near top of directus.ts**

Find the existing `DirectusServiceRow` interface (around line 100). Add after the projects section:

```ts
// ---------------------------------------------------------------------------
// Blog row shapes + mapping (slice-18 18f)
// ---------------------------------------------------------------------------

interface DirectusBlogPostTranslationRow {
	languages_code: 'en' | 'fr' | 'es';
	title: string;
	excerpt: string;
}

interface DirectusBlogPostRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number;
	lang: 'en' | 'fr' | 'es';
	category: 'professional' | 'personal';
	tags: readonly string[];
	external: boolean;
	url: string | null;
	cover_image: { id: string } | string | null;
	svg_illustration: { id: string; label: string; category: string; file: { id: string } } | string | null;
	animation: 'draw' | 'morph' | 'draw-fill';
	body: BlockEditorDoc | null;
	translations: readonly DirectusBlogPostTranslationRow[];
}

function toBlogPost(row: DirectusBlogPostRow): BlogPost {
	const title = toLocalizedString(row.translations, 'title');
	const excerpt = toLocalizedString(row.translations, 'excerpt');
	const svgId = typeof row.svg_illustration === 'object' && row.svg_illustration !== null
		? row.svg_illustration.id
		: row.svg_illustration ?? resolveSvgFallbackName(row.id, row.category);
	return {
		slug: row.id,
		title,
		excerpt,
		date: row.date_published ? row.date_published.split('T')[0] : '',
		lang: row.lang,
		category: row.category,
		tags: [...(row.tags ?? [])],
		animation: row.animation,
		svg: svgId,
		url: row.external ? (row.url ?? '') : `/blog/${row.id}`,
		external: row.external,
	};
}

// Reuse the deterministic-fallback logic from the static adapter.
const PRO_FALLBACKS = ['pro-database', 'pro-code', 'pro-pipeline', 'pro-chart'];
const PERSONAL_FALLBACKS = ['personal-rocket', 'personal-train', 'personal-telescope', 'personal-globe'];

function slugHash(slug: string): number {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function resolveSvgFallbackName(slug: string, category: 'professional' | 'personal'): string {
	const list = category === 'personal' ? PERSONAL_FALLBACKS : PRO_FALLBACKS;
	return list[slugHash(slug) % list.length];
}

// Animation resolution (deterministic; no Directus call needed)
const ALL_ANIMATIONS = ['draw', 'morph', 'draw-fill'] as const;

function resolveAnimationDeterministic(slug: string, explicit: string | undefined): BlogAnimation {
	if (explicit && ALL_ANIMATIONS.includes(explicit as BlogAnimation)) {
		return explicit as BlogAnimation;
	}
	return ALL_ANIMATIONS[slugHash(slug) % ALL_ANIMATIONS.length];
}
```

(Add imports at top of file: `BlockEditorDoc`, `BlogAnimation`, `BlogCategory`, `BlogPost`, `Locale` if not already present.)

- [ ] **Step 3: Replace `blog.all` stub**

Find `all: async () => todo('blog.all'),` and replace with:

```ts
all: async (ctx) => {
	const fetch = queuedFetch(ctx);
	const rows = (await fetch(
		readItems('blog_posts', {
			fields: [
				'id', 'status', 'date_published', 'sort', 'lang', 'category', 'tags',
				'external', 'url', 'animation',
				{ cover_image: ['id'] } as unknown as keyof DirectusBlogPostRow,
				{ svg_illustration: ['id', 'label', 'category', { file: ['id'] }] } as unknown as keyof DirectusBlogPostRow,
				{ translations: ['languages_code', 'title', 'excerpt'] } as unknown as keyof DirectusBlogPostRow,
			],
			filter: { status: { _eq: 'published' } },
			sort: ['-date_published'],
			limit: -1,
		}),
	)) as unknown as DirectusBlogPostRow[];
	const posts = rows.map(toBlogPost);
	return parsePort('blog.all', z.array(BlogPostSchema), posts);
},
```

- [ ] **Step 4: Replace `blog.bySlug` stub**

```ts
bySlug: async (slug, ctx) => {
	const fetch = queuedFetch(ctx);
	const rows = (await fetch(
		readItems('blog_posts', {
			fields: [
				'id', 'status', 'date_published', 'sort', 'lang', 'category', 'tags',
				'external', 'url', 'animation',
				{ cover_image: ['id'] } as unknown as keyof DirectusBlogPostRow,
				{ svg_illustration: ['id', 'label', 'category', { file: ['id'] }] } as unknown as keyof DirectusBlogPostRow,
				{ translations: ['languages_code', 'title', 'excerpt'] } as unknown as keyof DirectusBlogPostRow,
			],
			filter: { _and: [{ id: { _eq: slug } }, { status: { _eq: 'published' } }] },
			limit: 1,
		}),
	)) as unknown as DirectusBlogPostRow[];
	const post = rows[0] ? toBlogPost(rows[0]) : undefined;
	return parsePort('blog.bySlug', BlogPostSchema.optional(), post);
},
```

- [ ] **Step 5: Replace `blog.bodyBySlug` stub** (NEW method)

```ts
bodyBySlug: async (slug, ctx) => {
	const fetch = queuedFetch(ctx);
	const rows = (await fetch(
		readItems('blog_posts', {
			fields: ['body'],
			filter: { _and: [{ id: { _eq: slug } }, { status: { _eq: 'published' } }] },
			limit: 1,
		}),
	)) as unknown as Array<{ body: BlockEditorDoc | null }>;
	if (!rows[0]) return null;
	const body = rows[0].body;
	if (body === null) return null;
	return parsePort('blog.bodyBySlug', BlockEditorDocSchema, body);
},
```

(Add `BlockEditorDocSchema` to imports.)

- [ ] **Step 6: Type check**

```bash
bun run check 2>&1 | tail -10
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/adapters/directus.ts
git commit -m "feat(slice-18 18f Phase 9 Task 55): directus.blog.all + bySlug + bodyBySlug"
```

---

### Task 56: Implement `directus.blog.html` (legacy bridge via serializeBlocksToHtml)

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

- [ ] **Step 1: Replace `blog.html` stub**

```ts
html: async (slug, ctx) => {
	const body = await directusPort.blog.bodyBySlug(slug, ctx);
	if (!body) return '';
	return serializeBlocksToHtml(body);
},
```

(Add `serializeBlocksToHtml` to imports from `@repo/shared`.)

> Note: this calls bodyBySlug recursively via the same port object. Ensure `directusPort` is the variable name of the const that holds the port object. Adjust if it's actually exported differently in this file.

- [ ] **Step 2: Type check**

```bash
bun run check
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 9 Task 56): directus.blog.html legacy bridge via serializeBlocksToHtml"
```

---

### Task 57: Implement `byCategory`, `byTag`, `tagsForCategory`, `languagesForCategory`, `latest`

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

- [ ] **Step 1: Replace stubs**

```ts
byCategory: async (category, ctx) => {
	const fetch = queuedFetch(ctx);
	const rows = (await fetch(
		readItems('blog_posts', {
			fields: [
				'id', 'status', 'date_published', 'sort', 'lang', 'category', 'tags',
				'external', 'url', 'animation',
				{ svg_illustration: ['id'] } as unknown as keyof DirectusBlogPostRow,
				{ translations: ['languages_code', 'title', 'excerpt'] } as unknown as keyof DirectusBlogPostRow,
			],
			filter: { _and: [{ category: { _eq: category } }, { status: { _eq: 'published' } }] },
			sort: ['-date_published'],
			limit: -1,
		}),
	)) as unknown as DirectusBlogPostRow[];
	return parsePort('blog.byCategory', z.array(BlogPostSchema), rows.map(toBlogPost));
},

byTag: async (category, tag, ctx) => {
	const fetch = queuedFetch(ctx);
	const rows = (await fetch(
		readItems('blog_posts', {
			fields: [
				'id', 'status', 'date_published', 'sort', 'lang', 'category', 'tags',
				'external', 'url', 'animation',
				{ svg_illustration: ['id'] } as unknown as keyof DirectusBlogPostRow,
				{ translations: ['languages_code', 'title', 'excerpt'] } as unknown as keyof DirectusBlogPostRow,
			],
			filter: {
				_and: [
					{ category: { _eq: category } },
					{ status: { _eq: 'published' } },
					{ tags: { _contains: tag } },
				],
			},
			sort: ['-date_published'],
			limit: -1,
		}),
	)) as unknown as DirectusBlogPostRow[];
	return parsePort('blog.byTag', z.array(BlogPostSchema), rows.map(toBlogPost));
},

tagsForCategory: async (category, ctx) => {
	const posts = await directusPort.blog.byCategory(category, ctx);
	const tags = new Set<string>();
	for (const p of posts) for (const t of p.tags) tags.add(t);
	return [...tags].sort();
},

languagesForCategory: async (category, ctx) => {
	const posts = await directusPort.blog.byCategory(category, ctx);
	const langs = new Set<Locale>();
	for (const p of posts) langs.add(p.lang);
	return [...langs].sort();
},

latest: async (count, category, ctx) => {
	const fetch = queuedFetch(ctx);
	const filter = category
		? { _and: [{ category: { _eq: category } }, { status: { _eq: 'published' } }] }
		: { _and: [{ category: { _eq: 'professional' } }, { status: { _eq: 'published' } }] };
	const rows = (await fetch(
		readItems('blog_posts', {
			fields: [
				'id', 'status', 'date_published', 'sort', 'lang', 'category', 'tags',
				'external', 'url', 'animation',
				{ svg_illustration: ['id'] } as unknown as keyof DirectusBlogPostRow,
				{ translations: ['languages_code', 'title', 'excerpt'] } as unknown as keyof DirectusBlogPostRow,
			],
			filter,
			sort: ['-date_published'],
			limit: count,
		}),
	)) as unknown as DirectusBlogPostRow[];
	return parsePort('blog.latest', z.array(BlogPostSchema), rows.map(toBlogPost));
},
```

- [ ] **Step 2: Type check**

```bash
bun run check
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 9 Task 57): byCategory + byTag + tagsForCategory + languagesForCategory + latest"
```

---

### Task 58: Implement `svgContent`, `svgContentsForPosts`, `resolveSvgFallbackName`, `resolveAnimation`

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

- [ ] **Step 1: Replace stubs**

```ts
svgContent: async (post, ctx) => {
	// Resolve the post to its svg_illustration row, then fetch the file content
	// from the assets endpoint. Public Files.read scope-includes 'illustrations'.
	const fetch = queuedFetch(ctx);
	const rows = (await fetch(
		readItems('blog_posts', {
			fields: [{ svg_illustration: ['id', { file: ['id'] }] } as unknown as keyof DirectusBlogPostRow],
			filter: { id: { _eq: post.slug } },
			limit: 1,
		}),
	)) as unknown as Array<{ svg_illustration: { id: string; file: { id: string } } | string | null }>;
	let illustrationId: string | null = null;
	if (rows[0]) {
		const ill = rows[0].svg_illustration;
		illustrationId = typeof ill === 'object' && ill !== null ? ill.id : ill;
	}
	if (!illustrationId) {
		// Fall back to deterministic resolver
		illustrationId = resolveSvgFallbackName(post.slug, post.category);
	}
	// Look up the file UUID for that illustration
	const illRow = (await fetch(
		readItems('illustrations', {
			fields: [{ file: ['id'] } as unknown as 'file'],
			filter: { id: { _eq: illustrationId } },
			limit: 1,
		}),
	)) as unknown as Array<{ file: { id: string } | string }>;
	const fileUuid = illRow[0]
		? typeof illRow[0].file === 'object' ? illRow[0].file.id : illRow[0].file
		: null;
	if (!fileUuid) return '';
	// Fetch raw bytes
	const url = `${PUBLIC_DIRECTUS_URL}/assets/${fileUuid}`;
	const res = await window.fetch(url);
	return res.ok ? await res.text() : '';
},

svgContentsForPosts: async (posts, ctx) => {
	const out: Record<string, string> = {};
	const tasks = posts.map(async (p) => {
		out[p.slug] = await directusPort.blog.svgContent(p, ctx);
	});
	await Promise.all(tasks);
	return out;
},

resolveSvgFallbackName: async (slug, category, ctx) => {
	// Return illustration ID for the chosen fallback
	return resolveSvgFallbackName(slug, category);
},

resolveAnimation: async (slug, explicit, ctx) => {
	return resolveAnimationDeterministic(slug, explicit);
},
```

(Note: `PUBLIC_DIRECTUS_URL` should come from the file's existing env handling. Match existing pattern in directus.ts.)

- [ ] **Step 2: Type check**

```bash
bun run check
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 9 Task 58): svgContent + svgContentsForPosts + resolveSvgFallbackName + resolveAnimation"
```

---

### Task 59: Implement `directus.content.morphShapes`

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.ts`

- [ ] **Step 1: Replace stub**

```ts
morphShapes: async (ctx) => {
	const fetch = queuedFetch(ctx);
	const rows = (await fetch(
		readItems('morph_shapes', {
			fields: ['id', 'label', 'path', 'viewbox', 'sort'],
			sort: ['sort'],
			limit: -1,
		}),
	)) as unknown as MorphShape[];
	return parsePort('content.morphShapes', z.array(MorphShapeSchema), rows);
},
```

- [ ] **Step 2: Add `MorphShapeSchema` somewhere appropriate (apps/web/src/lib/schemas/morph-shape.ts or inline)**

```ts
import { z } from 'zod';
import type { MorphShape } from '$lib/types';

export const MorphShapeSchema: z.ZodType<MorphShape> = z.object({
	id: z.string(),
	label: z.string(),
	path: z.string(),
	viewbox: z.string(),
	sort: z.number().int(),
});
```

- [ ] **Step 3: Type check**

```bash
bun run check
```

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 9 Task 59): directus.content.morphShapes"
```

---

### Task 60: Update `directus.contract.test.ts` with blog mappings

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.contract.test.ts`

- [ ] **Step 1: Add blog mapping tests**

Append to the existing test file:

```ts
import {
	toBlogPost,
	resolveSvgFallbackName,
	resolveAnimationDeterministic,
	// Note: these helpers may be exported via a named test-export at the
	// bottom of directus.ts. If not exported, refactor to export them or
	// keep tests inline.
} from '$lib/adapters/directus';

describe('directus.toBlogPost (pure mapping)', () => {
	const sampleRow: any = {
		id: 'sample-post',
		status: 'published',
		date_published: '2026-04-01T00:00:00Z',
		sort: 0,
		lang: 'en',
		category: 'professional',
		tags: ['sql'],
		external: false,
		url: null,
		animation: 'draw',
		cover_image: null,
		svg_illustration: { id: 'pro-database' },
		body: null,
		translations: [
			{ languages_code: 'en', title: 'Sample Post', excerpt: 'Sample excerpt.' },
		],
	};

	it('flattens id → slug', () => {
		expect(toBlogPost(sampleRow).slug).toBe('sample-post');
	});

	it('extracts date as YYYY-MM-DD only', () => {
		expect(toBlogPost(sampleRow).date).toBe('2026-04-01');
	});

	it('produces /blog/<slug> url for non-external post', () => {
		expect(toBlogPost(sampleRow).url).toBe('/blog/sample-post');
	});

	it('falls through to fallback when svg_illustration is null', () => {
		const noSvg = { ...sampleRow, svg_illustration: null };
		const post = toBlogPost(noSvg);
		expect(post.svg).toMatch(/^pro-/);  // pro-* fallback for professional
	});

	it('uses external url when external=true', () => {
		const external = { ...sampleRow, external: true, url: 'https://linkedin.com/...' };
		expect(toBlogPost(external).url).toBe('https://linkedin.com/...');
	});

	it('flattens translations into LocalizedString', () => {
		const post = toBlogPost(sampleRow);
		expect(post.title).toEqual({ en: 'Sample Post' });
	});
});

describe('resolveSvgFallbackName', () => {
	it('returns deterministic value (same slug + category → same fallback)', () => {
		expect(resolveSvgFallbackName('foo', 'professional')).toBe(
			resolveSvgFallbackName('foo', 'professional'),
		);
	});

	it('professional gets pro-* fallback', () => {
		expect(resolveSvgFallbackName('foo', 'professional')).toMatch(/^pro-/);
	});

	it('personal gets personal-* fallback', () => {
		expect(resolveSvgFallbackName('foo', 'personal')).toMatch(/^personal-/);
	});
});
```

- [ ] **Step 2: Run tests**

```bash
bun test src/lib/adapters/directus.contract.test.ts
```

If any imports are missing, refactor `directus.ts` to export `toBlogPost`, `resolveSvgFallbackName`, `resolveAnimationDeterministic` for tests.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 9 Task 60): directus.contract.test extends with blog mappings"
```

---

### Task 61: Update `directus.mocked.test.ts` with blog port URL/query shape assertions

**Files:**
- Modify: `apps/web/src/lib/adapters/directus.mocked.test.ts`

- [ ] **Step 1: Add mocked-fetch tests for the 13 blog port methods + content.morphShapes**

Open the existing file and study its mock pattern (uses `vi.spyOn(global, 'fetch')` or similar). Add tests asserting:

- `blog.all()` calls `/items/blog_posts` with `filter[status][_eq]=published`
- `blog.bySlug('x')` calls `/items/blog_posts` with `filter[id][_eq]=x` and `filter[status][_eq]=published`
- `blog.bodyBySlug('x')` calls with `fields=body` only
- `blog.byCategory('professional')` filters category + status
- `blog.byTag('professional', 'sql')` filters category + status + `tags _contains sql`
- `blog.tagsForCategory('professional')` does ONE call (chains via byCategory) with the right filter
- `blog.languagesForCategory('professional')` similar
- `blog.latest(3, 'personal')` uses `limit=3` and category filter
- `content.morphShapes()` calls `/items/morph_shapes` with `sort=sort`

```ts
describe('directus.blog mocked-fetch (URL + query shape)', () => {
	let fetchMock: any;
	beforeEach(() => {
		fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ data: [] }), { status: 200 }),
		);
	});
	afterEach(() => fetchMock.mockRestore());

	it('blog.all → status published filter', async () => {
		await adapter.blog.all();
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain('/items/blog_posts');
		expect(decodeURIComponent(url)).toContain('filter[status][_eq]=published');
		expect(decodeURIComponent(url)).toContain('sort=-date_published');
	});

	it('blog.bySlug → id eq + status published', async () => {
		await adapter.blog.bySlug('x');
		const url = fetchMock.mock.calls[0][0] as string;
		const decoded = decodeURIComponent(url);
		expect(decoded).toContain('filter[_and][0][id][_eq]=x');
		expect(decoded).toContain('filter[_and][1][status][_eq]=published');
	});

	it('blog.bodyBySlug → fields=body', async () => {
		await adapter.blog.bodyBySlug('x');
		const url = fetchMock.mock.calls[0][0] as string;
		expect(decodeURIComponent(url)).toContain('fields=body');
	});

	// ... 9 more similar tests; one per remaining port method

	it('content.morphShapes → /items/morph_shapes sorted', async () => {
		await adapter.content.morphShapes();
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain('/items/morph_shapes');
		expect(decodeURIComponent(url)).toContain('sort=sort');
	});
});
```

- [ ] **Step 2: Run tests**

```bash
bun test src/lib/adapters/directus.mocked.test.ts 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 9 Task 61): directus.mocked.test extends with blog + morphShapes URL shape assertions"
```

---

### Task 62: Phase 9 acceptance check

- [ ] **Step 1: All apps/web tests pass**

```bash
cd apps/web
bun run check
bun run test 2>&1 | tail -10
```

Expected: 0 errors; total test count grows by ~30+ (blog port contract + mocked tests).

- [ ] **Step 2: Live integration spot-check (optional)**

```bash
curl -s 'https://cms.yesid.dev/items/blog_posts?fields=id,status&filter[status][_eq]=published' | jq '.data | length'
```

Expected: 7. (Confirms the same query the adapter issues works against live data.)

No commit — verification only.

---

## Phase 10 — `BlockRenderer.svelte` + 11 sub-components (12 tasks)

**Exit gate:** All 12 components in `apps/web/src/lib/components/cms/` (BlockRenderer + 11 blocks); component test file passes for every block type; XSS attempt in text is escaped (Svelte default behavior); heading ids are deterministic.

### Task 63: `InlineContent.svelte` (foundation; used by Heading + Paragraph)

**Files:**
- Create: `apps/web/src/lib/components/cms/blocks/InlineContent.svelte`

- [ ] **Step 1: Write the component**

```svelte
<!--
  apps/web/src/lib/components/cms/blocks/InlineContent.svelte

  Renders an array of inline nodes (text + hardBreak) with marks composed
  via Svelte's natural template recursion. NO {@html} — Svelte's default
  escaping is the load-bearing safety net (Q4).
-->
<script lang="ts">
	import type { InlineNode, Mark } from '@repo/shared';

	let { content }: { content: InlineNode[] } = $props();

	function hasMarkType(marks: Mark[] | undefined, type: Mark['type']): boolean {
		return marks?.some((m) => m.type === type) ?? false;
	}

	function findLink(marks: Mark[] | undefined): Extract<Mark, { type: 'link' }> | undefined {
		return marks?.find((m): m is Extract<Mark, { type: 'link' }> => m.type === 'link');
	}
</script>

{#each content as node, i (i)}
	{#if node.type === 'hardBreak'}
		<br />
	{:else}
		{@const isBold = hasMarkType(node.marks, 'bold')}
		{@const isItalic = hasMarkType(node.marks, 'italic')}
		{@const isCode = hasMarkType(node.marks, 'code')}
		{@const isStrike = hasMarkType(node.marks, 'strike')}
		{@const link = findLink(node.marks)}

		{#if link}
			<a href={link.attrs.href} title={link.attrs.title ?? undefined}>
				{#if isCode}<code>{#if isBold}<strong>{#if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>{:else}{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}{/if}</strong>{:else}{#if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>{:else}{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}{/if}{/if}</code>
				{:else if isBold}<strong>{#if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>{:else}{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}{/if}</strong>
				{:else if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>
				{:else if isStrike}<s>{node.text}</s>
				{:else}{node.text}
				{/if}
			</a>
		{:else if isCode}<code>{#if isBold}<strong>{#if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>{:else}{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}{/if}</strong>{:else}{#if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>{:else}{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}{/if}{/if}</code>
		{:else if isBold}<strong>{#if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>{:else}{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}{/if}</strong>
		{:else if isItalic}<em>{#if isStrike}<s>{node.text}</s>{:else}{node.text}{/if}</em>
		{:else if isStrike}<s>{node.text}</s>
		{:else}{node.text}
		{/if}
	{/if}
{/each}
```

> Note: the nested conditionals make the template visually ugly, but they correctly handle every mark combination. A future refactor could replace this with a `<svelte:element>` and dynamic tag name; for now, prioritize correctness + safety.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/components/cms/blocks/InlineContent.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 63): InlineContent.svelte (mark composition)"
```

---

### Task 64: `Heading.svelte`

**Files:**
- Create: `apps/web/src/lib/components/cms/blocks/Heading.svelte`

- [ ] **Step 1: Write component**

```svelte
<script lang="ts">
	import type { InlineNode } from '@repo/shared';
	import { kebabSlug } from '@repo/shared';
	import InlineContent from './InlineContent.svelte';

	let {
		level,
		id,
		content,
	}: {
		level: 1 | 2 | 3 | 4;
		id?: string;
		content: InlineNode[];
	} = $props();

	const text = $derived(content.filter((n) => n.type === 'text').map((n) => (n as { text: string }).text).join(''));
	const headingId = $derived(id ?? kebabSlug(text));
</script>

{#if level === 1}
	<h1 id={headingId}><InlineContent {content} /></h1>
{:else if level === 2}
	<h2 id={headingId}><InlineContent {content} /></h2>
{:else if level === 3}
	<h3 id={headingId}><InlineContent {content} /></h3>
{:else}
	<h4 id={headingId}><InlineContent {content} /></h4>
{/if}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/components/cms/blocks/Heading.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 64): Heading.svelte"
```

---

### Task 65: `Paragraph.svelte`

```svelte
<script lang="ts">
	import type { InlineNode } from '@repo/shared';
	import InlineContent from './InlineContent.svelte';

	let { content }: { content: InlineNode[] } = $props();
</script>

<p><InlineContent {content} /></p>
```

Commit:

```bash
git add apps/web/src/lib/components/cms/blocks/Paragraph.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 65): Paragraph.svelte"
```

---

### Task 66: `BulletList.svelte` + `OrderedList.svelte` + `ListItem.svelte`

`BulletList.svelte`:

```svelte
<script lang="ts">
	import type { ListItemNode } from '@repo/shared';
	import ListItem from './ListItem.svelte';

	let { content }: { content: ListItemNode[] } = $props();
</script>

<ul>
	{#each content as item, i (i)}
		<ListItem content={item.content} />
	{/each}
</ul>
```

`OrderedList.svelte`:

```svelte
<script lang="ts">
	import type { ListItemNode } from '@repo/shared';
	import ListItem from './ListItem.svelte';

	let { content }: { content: ListItemNode[] } = $props();
</script>

<ol>
	{#each content as item, i (i)}
		<ListItem content={item.content} />
	{/each}
</ol>
```

`ListItem.svelte` (renders nested children — paragraph or nested list):

```svelte
<script lang="ts">
	import type { BlockEditorNode } from '@repo/shared';
	import Paragraph from './Paragraph.svelte';
	import BulletList from './BulletList.svelte';
	import OrderedList from './OrderedList.svelte';

	let { content }: { content: BlockEditorNode[] } = $props();
</script>

<li>
	{#each content as child, i (i)}
		{#if child.type === 'paragraph'}
			<Paragraph content={child.content} />
		{:else if child.type === 'bulletList'}
			<BulletList content={child.content} />
		{:else if child.type === 'orderedList'}
			<OrderedList content={child.content} />
		{/if}
	{/each}
</li>
```

Commit:

```bash
git add apps/web/src/lib/components/cms/blocks/BulletList.svelte \
        apps/web/src/lib/components/cms/blocks/OrderedList.svelte \
        apps/web/src/lib/components/cms/blocks/ListItem.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 66): list components (Bullet + Ordered + Item)"
```

---

### Task 67: `CodeBlock.svelte` (with copy button baked in)

```svelte
<script lang="ts">
	import type { TextNode } from '@repo/shared';
	import { resolveLocale } from '$lib/utils/locale';
	import { blogDetailContent } from '$lib/content/blog';

	let {
		language,
		content,
	}: {
		language: string | null;
		content: TextNode[];
	} = $props();

	const code = $derived(content.map((c) => c.text).join(''));
	const cls = $derived(language ? `language-${language}` : '');

	const copyLabel = resolveLocale(blogDetailContent.code.copyLabel, 'en');
	const copyAria = resolveLocale(blogDetailContent.code.copyAria, 'en');
	const errorLabel = resolveLocale(blogDetailContent.code.errorLabel, 'en');

	let buttonLabel = $state(copyLabel);
	let resetTimeout: ReturnType<typeof setTimeout> | null = null;

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(code);
			buttonLabel = '✓';
		} catch {
			buttonLabel = errorLabel;
		}
		if (resetTimeout) clearTimeout(resetTimeout);
		resetTimeout = setTimeout(() => { buttonLabel = copyLabel; }, 2000);
	}
</script>

<pre><code class={cls}>{code}</code><button class="copy-btn" onclick={copyToClipboard} aria-label={copyAria}>{buttonLabel}</button></pre>

<style>
	pre { position: relative; }
	.copy-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-family: var(--font-body);
		color: var(--muted-foreground);
		background: var(--card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		cursor: pointer;
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease-default);
	}
	pre:hover .copy-btn { opacity: 1; }
	.copy-btn:hover { color: var(--foreground); background: var(--popover); }
</style>
```

Commit:

```bash
git add apps/web/src/lib/components/cms/blocks/CodeBlock.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 67): CodeBlock.svelte with copy button"
```

---

### Task 68: `Blockquote.svelte` + `HorizontalRule.svelte`

`Blockquote.svelte`:

```svelte
<script lang="ts">
	import type { BlockEditorNode } from '@repo/shared';
	import Heading from './Heading.svelte';
	import Paragraph from './Paragraph.svelte';
	import BulletList from './BulletList.svelte';
	import OrderedList from './OrderedList.svelte';

	let { content }: { content: BlockEditorNode[] } = $props();
</script>

<blockquote>
	{#each content as child, i (i)}
		{#if child.type === 'paragraph'}
			<Paragraph content={child.content} />
		{:else if child.type === 'heading'}
			<Heading level={child.attrs.level} id={child.attrs.id} content={child.content} />
		{:else if child.type === 'bulletList'}
			<BulletList content={child.content} />
		{:else if child.type === 'orderedList'}
			<OrderedList content={child.content} />
		{/if}
	{/each}
</blockquote>
```

`HorizontalRule.svelte`:

```svelte
<hr />

<style>
	hr {
		border: none;
		border-top: 1px solid var(--border-subtle);
		margin: 2rem 0;
	}
</style>
```

Commit:

```bash
git add apps/web/src/lib/components/cms/blocks/Blockquote.svelte \
        apps/web/src/lib/components/cms/blocks/HorizontalRule.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 68): Blockquote + HorizontalRule"
```

---

### Task 69: `ImageBlock.svelte`

```svelte
<script lang="ts">
	import { asset } from '$lib/directus/assets';

	let {
		src,
		alt,
		title,
	}: {
		src: string;       // Directus file UUID
		alt: string;
		title?: string | null;
	} = $props();
</script>

<img src={asset(src, 'card-600')} {alt} title={title ?? undefined} loading="lazy" />

<style>
	img {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
		margin: 1.5rem 0;
	}
</style>
```

Commit:

```bash
git add apps/web/src/lib/components/cms/blocks/ImageBlock.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 69): ImageBlock.svelte"
```

---

### Task 70: `Embed.svelte` (placeholder — full impl in 18i)

```svelte
<script lang="ts">
	let {
		url,
		service,
	}: {
		url: string;
		service?: string | null;
	} = $props();
</script>

<a href={url} rel="noopener" target="_blank" class="embed-link">{url}</a>

<style>
	.embed-link {
		display: inline-block;
		padding: 0.5rem 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		text-decoration: none;
	}
</style>
```

Commit:

```bash
git add apps/web/src/lib/components/cms/blocks/Embed.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 70): Embed.svelte placeholder (full impl deferred to 18i)"
```

---

### Task 71: `BlockRenderer.svelte` (top dispatch)

**Files:**
- Create: `apps/web/src/lib/components/cms/BlockRenderer.svelte`

```svelte
<!--
  apps/web/src/lib/components/cms/BlockRenderer.svelte

  Top-level dispatch on Block Editor doc nodes. Slice 18 18f.
  Reused by 18g (tech-stack body), 18i (M2A blocks), and #41
  (projects.description + sections.content).
-->
<script lang="ts">
	import type { BlockEditorDoc } from '@repo/shared';
	import Heading from './blocks/Heading.svelte';
	import Paragraph from './blocks/Paragraph.svelte';
	import BulletList from './blocks/BulletList.svelte';
	import OrderedList from './blocks/OrderedList.svelte';
	import CodeBlock from './blocks/CodeBlock.svelte';
	import Blockquote from './blocks/Blockquote.svelte';
	import HorizontalRule from './blocks/HorizontalRule.svelte';
	import ImageBlock from './blocks/ImageBlock.svelte';
	import Embed from './blocks/Embed.svelte';

	let { doc }: { doc: BlockEditorDoc } = $props();
</script>

{#each doc.content as node, i (i)}
	{#if node.type === 'heading'}
		<Heading level={node.attrs.level} id={node.attrs.id} content={node.content} />
	{:else if node.type === 'paragraph'}
		<Paragraph content={node.content} />
	{:else if node.type === 'bulletList'}
		<BulletList content={node.content} />
	{:else if node.type === 'orderedList'}
		<OrderedList content={node.content} />
	{:else if node.type === 'codeBlock'}
		<CodeBlock language={node.attrs.language} content={node.content} />
	{:else if node.type === 'blockquote'}
		<Blockquote content={node.content} />
	{:else if node.type === 'horizontalRule'}
		<HorizontalRule />
	{:else if node.type === 'image'}
		<ImageBlock src={node.attrs.src} alt={node.attrs.alt} title={node.attrs.title} />
	{:else if node.type === 'embed'}
		<Embed url={node.attrs.url} service={node.attrs.service} />
	{/if}
{/each}
```

Commit:

```bash
git add apps/web/src/lib/components/cms/BlockRenderer.svelte
git commit -m "feat(slice-18 18f Phase 10 Task 71): BlockRenderer.svelte top dispatch"
```

---

### Task 72: BlockRenderer.test.ts — full block-type coverage

**Files:**
- Create: `apps/web/src/lib/components/cms/BlockRenderer.test.ts`

- [ ] **Step 1: Write tests covering every block type + XSS escaping**

```ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlockRenderer from './BlockRenderer.svelte';
import type { BlockEditorDoc } from '@repo/shared';

describe('BlockRenderer.svelte', () => {
	it('renders heading with deterministic id', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hello World' }] },
			],
		};
		const { container } = render(BlockRenderer, { doc });
		const h2 = container.querySelector('h2');
		expect(h2).toBeTruthy();
		expect(h2?.id).toBe('hello-world');
		expect(h2?.textContent).toBe('Hello World');
	});

	it('renders paragraph with bold + italic + link marks', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'a ' },
						{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
						{ type: 'text', text: ' ' },
						{ type: 'text', text: 'em', marks: [{ type: 'italic' }] },
						{ type: 'text', text: ' ' },
						{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://yesid.dev' } }] },
					],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('strong')?.textContent).toBe('bold');
		expect(container.querySelector('em')?.textContent).toBe('em');
		expect(container.querySelector('a')?.getAttribute('href')).toBe('https://yesid.dev');
		expect(container.querySelector('a')?.textContent).toBe('link');
	});

	it('escapes HTML entities in text (XSS attempt)', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '<script>alert(1)</script>' }],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		const p = container.querySelector('p');
		expect(p?.textContent).toBe('<script>alert(1)</script>');
		// No actual <script> child in the DOM (Svelte's default escaping)
		expect(container.querySelectorAll('script')).toHaveLength(0);
	});

	it('renders bullet list with paragraph children', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'bulletList',
					content: [
						{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
						{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
					],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		const items = container.querySelectorAll('ul > li');
		expect(items.length).toBe(2);
		expect(items[0].textContent?.trim()).toBe('one');
	});

	it('renders ordered list', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'orderedList',
					content: [
						{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'step' }] }] },
					],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('ol > li')).toBeTruthy();
	});

	it('renders nested list (ordered inside bullet)', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'bulletList',
					content: [
						{
							type: 'listItem',
							content: [
								{ type: 'paragraph', content: [{ type: 'text', text: 'outer' }] },
								{
									type: 'orderedList',
									content: [
										{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'inner' }] }] },
									],
								},
							],
						},
					],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('ul > li > ol > li')).toBeTruthy();
	});

	it('renders code block with language class', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: 'sql' },
					content: [{ type: 'text', text: 'SELECT 1;' }],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		const code = container.querySelector('pre code');
		expect(code?.classList.contains('language-sql')).toBe(true);
		expect(code?.textContent).toBe('SELECT 1;');
	});

	it('renders code block without language (no class)', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: null },
					content: [{ type: 'text', text: 'plain' }],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		const code = container.querySelector('pre code');
		expect(code?.className).toBe('');
	});

	it('renders blockquote with nested paragraph', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'blockquote',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quoted.' }] }],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('blockquote > p')?.textContent).toBe('Quoted.');
	});

	it('renders horizontal rule', () => {
		const doc: BlockEditorDoc = { type: 'doc', content: [{ type: 'horizontalRule' }] };
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('hr')).toBeTruthy();
	});

	it('renders image with alt + asset URL', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [{ type: 'image', attrs: { src: 'uuid-123', alt: 'A picture' } }],
		};
		const { container } = render(BlockRenderer, { doc });
		const img = container.querySelector('img');
		expect(img?.getAttribute('alt')).toBe('A picture');
		expect(img?.getAttribute('src')).toContain('uuid-123');
	});

	it('renders embed as external link', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [{ type: 'embed', attrs: { url: 'https://youtu.be/x' } }],
		};
		const { container } = render(BlockRenderer, { doc });
		const a = container.querySelector('a');
		expect(a?.getAttribute('href')).toBe('https://youtu.be/x');
		expect(a?.getAttribute('target')).toBe('_blank');
	});

	it('renders hardBreak as <br>', () => {
		const doc: BlockEditorDoc = {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'a' },
						{ type: 'hardBreak' },
						{ type: 'text', text: 'b' },
					],
				},
			],
		};
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('p > br')).toBeTruthy();
	});

	it('handles empty doc gracefully', () => {
		const doc: BlockEditorDoc = { type: 'doc', content: [] };
		const { container } = render(BlockRenderer, { doc });
		expect(container.children.length).toBe(0);
	});
});
```

- [ ] **Step 2: Run tests**

```bash
cd apps/web
bun run test src/lib/components/cms/BlockRenderer.test.ts 2>&1 | tail -10
```

Expected: ~14 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/components/cms/BlockRenderer.test.ts
git commit -m "feat(slice-18 18f Phase 10 Task 72): BlockRenderer.test.ts full block-type coverage + XSS escape"
```

---

### Task 73: Phase 10 acceptance check

- [ ] **Step 1: Run all apps/web tests**

```bash
cd apps/web
bun run check
bun run test 2>&1 | tail -10
```

Expected: 0 errors; total test count up by ~14 (BlockRenderer test) + the existing adapter additions from Phase 9.

- [ ] **Step 2: Visual sanity (optional, since no consumer is wired yet)**

Skip — full visual smoke happens after Phase 11 + 12.

No commit — verification only.

---

## Phase 11 — Consumer wiring (8 tasks)

**Exit gate:** `/blog/[slug]` renders body via `<BlockRenderer>`; `ProjectDetailPage` similarly; TOC reads pre-extracted heading array (no DOMParser); `apps/web/src/lib/utils/shapes.ts` is async + caches; `SvgIcon.svelte` + `morphHover` action consume shapes from adapter; `bun run check` 0 errors.

### Task 74: Update `/blog/[slug]/+page.ts` to use `bodyBySlug`

**Files:**
- Modify: `apps/web/src/routes/blog/[slug]/+page.ts`

- [ ] **Step 1: Replace existing `+page.ts`**

```ts
import { error } from '@sveltejs/kit';
import {
	getAllPosts,
	getPostBySlug,
	getPostBody,        // NEW (replaces getPostHtml)
	getSvgContent,
} from '$lib/repositories';
import { extractHeadings, extractText, wordCount, readingTime } from '@repo/shared';

export async function load({ params }: { params: { slug: string } }) {
	const post = await getPostBySlug(params.slug);
	if (!post) error(404, 'Post not found');

	const [body, svgContent, allPosts] = await Promise.all([
		getPostBody(params.slug),
		getSvgContent(post),
		getAllPosts(),
	]);

	if (!body) error(404, 'Post body missing');

	const text = extractText(body);
	const words = wordCount(text);
	const minutesToRead = readingTime(words);
	const headings = extractHeadings(body);

	const postIndex = allPosts.findIndex((p) => p.slug === post.slug) + 1;

	return { post, body, svgContent, readingTime: minutesToRead, wordCount: words, headings, postIndex };
}
```

- [ ] **Step 2: Add `getPostBody` to repositories**

Open `apps/web/src/lib/repositories/blog.ts` (or wherever `getPostHtml` lives). Add:

```ts
export async function getPostBody(slug: string) {
	return adapter.blog.bodyBySlug(slug);
}
```

Also re-export from `apps/web/src/lib/repositories/index.ts`.

- [ ] **Step 3: Type check**

```bash
cd apps/web
bun run check 2>&1 | tail -10
```

Expected: errors complaining that `BlogDetailPage` no longer accepts `html` prop (we'll fix in Task 75).

- [ ] **Step 4: Commit (intermediate state — error remains until Task 75)**

```bash
git add apps/web/src/routes/blog/[slug]/+page.ts apps/web/src/lib/repositories/blog.ts apps/web/src/lib/repositories/index.ts
git commit -m "feat(slice-18 18f Phase 11 Task 74): /blog/[slug]/+page.ts uses bodyBySlug + extractHeadings"
```

---

### Task 75: Update `BlogDetailPage.svelte` to accept `body` instead of `html`

**Files:**
- Modify: `apps/web/src/lib/components/blog/BlogDetailPage.svelte`
- Modify: `apps/web/src/routes/blog/[slug]/+page@.svelte`

- [ ] **Step 1: Update `BlogDetailPage.svelte` props**

Change props block:

```ts
let {
	post,
	body,                  // was: html: string;
	svgContent = '',
	readingTime = 0,
	wordCount = 0,         // NEW (passed from +page.ts; was derived inline)
	headings = [],         // NEW (passed from +page.ts; was derived from DOMParser)
	postIndex = 1,
}: {
	post: BlogPost;
	body: BlockEditorDoc;
	svgContent?: string;
	readingTime?: number;
	wordCount?: number;
	headings?: readonly TocHeading[];
	postIndex?: number;
} = $props();
```

(Add imports: `BlockEditorDoc, TocHeading` from `@repo/shared` (or `$lib/types`).)

- [ ] **Step 2: Replace runtime DOMParser-derived headings**

Find the `$derived.by` block that uses `DOMParser` to extract headings. DELETE it. Use the prop directly.

Find the `wordCount` derivation. DELETE; use prop.

- [ ] **Step 3: Replace `<TableOfContents>` injection**

Find:

```svelte
<TableOfContents bind:this={tocRef} {html} />
```

Replace the rendering pattern. The new BlockRenderer emits headings with ids. TableOfContents.svelte will be refactored in Task 77 to accept `headings` array directly.

For now, just remove the `bind:this` + `getProcessedHtml()` round-trip. Use `body` directly:

```svelte
<BlogContent {accentColor}>
  <BlockRenderer doc={body} />
</BlogContent>
```

(Add: `import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';`)

- [ ] **Step 4: Update `+page@.svelte` prop pass**

Change:

```svelte
<BlogDetailPage
  post={data.post}
  html={data.html}        ← was
  body={data.body}        ← becomes
  ...
/>
```

- [ ] **Step 5: Type check**

```bash
bun run check 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 11 Task 75): BlogDetailPage uses body + headings + BlockRenderer"
```

---

### Task 76: Update `BlogContent.svelte` — remove runtime DOM mutation for code-copy buttons

**Files:**
- Modify: `apps/web/src/lib/components/blog/BlogContent.svelte`

- [ ] **Step 1: Strip the `onMount` block that injects copy buttons**

The block to remove:

```ts
onMount(() => {
	if (!contentEl) return;
	const preElements = contentEl.querySelectorAll('pre');
	preElements.forEach((pre) => {
		// ... DOM mutation
	});
});
```

Reasoning: `CodeBlock.svelte` now bakes the copy button into each code block at render time. No runtime DOM mutation needed.

- [ ] **Step 2: Strip the `<style>` rules for `.copy-btn` (now in CodeBlock.svelte's scoped styles)**

- [ ] **Step 3: Type check**

```bash
bun run check
```

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 11 Task 76): BlogContent.svelte drops runtime DOM mutation (CodeBlock owns copy button)"
```

---

### Task 77: Refactor `TableOfContents.svelte` to accept `headings` array directly

**Files:**
- Modify: `apps/web/src/lib/components/shared/TableOfContents.svelte`

- [ ] **Step 1: Find existing component + understand current shape**

```bash
cat apps/web/src/lib/components/shared/TableOfContents.svelte | head -30
```

It currently accepts `html` and runs DOMParser on it to extract heading list + injects ids.

- [ ] **Step 2: Rewrite to accept headings prop directly**

```svelte
<script lang="ts">
	import type { TocHeading } from '@repo/shared';

	let {
		headings,
	}: {
		headings: readonly TocHeading[];
	} = $props();

	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// (Backward compat: if a caller still passes `html`, parse it on-the-fly.
	// Drop this branch when all callers migrated.)
</script>

<nav>
	{#each headings as h (h.id)}
		<button
			class="toc-item"
			class:toc-sub-item={h.level > 2}
			onclick={() => scrollTo(h.id)}
		>
			{h.text}
		</button>
	{/each}
</nav>
```

(Style block stays the same; copy from existing.)

- [ ] **Step 3: Update consumer `BlogDetailPage.svelte` to pass `headings` prop**

Find:

```svelte
<TableOfContents bind:this={tocRef} {html} />
```

(Already removed in Task 75.)

The headings used elsewhere in the page now come from the `headings` prop. Update all `headings`-using `$derived` blocks to consume the prop directly.

- [ ] **Step 4: Check + commit**

```bash
bun run check
git commit -am "feat(slice-18 18f Phase 11 Task 77): TableOfContents accepts headings array directly (no DOMParser)"
```

---

### Task 78: Update `ProjectDetailPage.svelte` — render description + sections via BlockRenderer (#41 consumer)

**Files:**
- Modify: `apps/web/src/lib/components/projects/ProjectDetailPage.svelte` (and any sub-components rendering `description` / `sections[].content`)

- [ ] **Step 1: Locate where description + sections.content are rendered**

```bash
grep -rn "project\.description\|sections\[.\]\.content\|section\.content" apps/web/src/lib/components/projects/
grep -rn "{description\|{section.content\|@html.*description" apps/web/src/lib/components/projects/
```

- [ ] **Step 2: Update consumers**

For each location:

- The `description` and `sections[].content` shape changes from `LocalizedString` (where the value is the full string) to `LocalizedString` where the resolved value is now a Block Editor JSON string.

Wait — the LocalizedString shape was `{ en: string }`. With Block Editor, the resolved value is now a `BlockEditorDoc`, NOT a string. So either:

  - Option A: `LocalizedString<BlockEditorDoc>` — change LocalizedString to be generic.
  - Option B: Store stringified JSON inside LocalizedString and parse at render time.
  - Option C: Use a separate `LocalizedBlockEditorDoc` shape.

Cleanest: refactor `LocalizedString` to be generic OR introduce `LocalizedBody`:

```ts
// In packages/shared/src/types/content.ts
export interface LocalizedBlockEditorDoc {
	en: BlockEditorDoc;
	fr?: BlockEditorDoc;
	es?: BlockEditorDoc;
}
```

Update `Project.description: LocalizedBlockEditorDoc` and `ProjectSection.content: LocalizedBlockEditorDoc`.

- [ ] **Step 3: Update adapter mapping for projects**

In `apps/web/src/lib/adapters/directus.ts`, find `toProject` (or equivalent) function. The existing pattern:

```ts
description: toLocalizedString(row.translations, 'description'),
```

Becomes:

```ts
description: toLocalizedBlockEditorDoc(row.translations, 'description'),
```

Add helper:

```ts
function toLocalizedBlockEditorDoc<T>(translations: ReadonlyArray<{ languages_code: Locale } & Record<string, unknown>>, field: string): LocalizedBlockEditorDoc {
	const out: LocalizedBlockEditorDoc = {} as LocalizedBlockEditorDoc;
	for (const t of translations) {
		const value = t[field];
		if (value && typeof value === 'object') {
			out[t.languages_code] = value as BlockEditorDoc;
		}
	}
	if (!out.en) {
		out.en = wrapPlainText('');
	}
	return out;
}
```

- [ ] **Step 4: Update consumer Svelte**

In `ProjectDetailPage.svelte` (or wherever):

```svelte
<script lang="ts">
	import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';
	import { resolveLocale } from '$lib/utils/locale';
</script>

<!-- Was: <p>{resolveLocale(project.description, 'en')}</p> -->
<BlockRenderer doc={resolveLocale(project.description, 'en')} />
```

Same for `section.content`.

- [ ] **Step 5: Update static adapter**

Static adapter's `description` + `content` are currently strings. Wrap them:

```ts
import { wrapPlainText } from '@repo/shared';

// In the project mapping:
description: {
	en: wrapPlainText(rawProjectData.description),
	// ... fr, es if present
},
```

- [ ] **Step 6: Check + commit**

```bash
bun run check
git commit -am "feat(slice-18 18f Phase 11 Task 78): ProjectDetailPage renders description + sections via BlockRenderer (#41)"
```

---

### Task 79: Refactor `apps/web/src/lib/utils/shapes.ts` — async getter with cache

**Files:**
- Modify: `apps/web/src/lib/utils/shapes.ts`

- [ ] **Step 1: Replace the file**

```ts
// Geometric morph-target shapes.
// Slice 18 18f Phase 11: migrated from hardcoded const to CMS-managed
// collection (morph_shapes). This file is a thin async wrapper with a
// module-level cache.

import { adapter } from '$lib/adapters';
import type { MorphShape } from '@repo/shared';

let cache: readonly MorphShape[] | null = null;

export async function getMorphShapes(): Promise<readonly MorphShape[]> {
	if (cache) return cache;
	cache = await adapter.content.morphShapes();
	return cache;
}

export function pickRandomShape(
	shapes: readonly MorphShape[],
	lastIndex = -1,
): { shape: MorphShape; index: number } {
	if (shapes.length === 0) {
		throw new Error('No morph shapes available — fetch from adapter first.');
	}
	let idx: number;
	do {
		idx = Math.floor(Math.random() * shapes.length);
	} while (idx === lastIndex && shapes.length > 1);
	return { shape: shapes[idx], index: idx };
}

// LEGACY EXPORTS — kept for transitional compat with consumers not yet
// updated. Will be removed once all consumers use getMorphShapes.

export const SHAPES_LEGACY = {
	triangle: 'M24 8 L40 38 L8 38 Z',
	circle: 'M24 8 A16 16 0 1 1 23.99 8 Z',
	square: 'M10 10 L38 10 L38 38 L10 38 Z',
	hexagon: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z',
} as const;

/** @deprecated Use getMorphShapes() + pickRandomShape(shapes, lastIndex). */
export const SHAPES = SHAPES_LEGACY;

export type ShapeKey = keyof typeof SHAPES_LEGACY;
export const SHAPE_KEYS = Object.keys(SHAPES_LEGACY) as ShapeKey[];
```

- [ ] **Step 2: Type check**

```bash
bun run check 2>&1 | tail -10
```

Expected: existing consumers (`SvgIcon.svelte`, `morphHover`) use `SHAPES + pickRandomShape(lastIndex)` — they may now type-error because `pickRandomShape` signature changed. Fix in Tasks 80–81.

- [ ] **Step 3: Commit (intermediate)**

```bash
git commit -am "feat(slice-18 18f Phase 11 Task 79): shapes.ts async getter + cache (legacy SHAPES kept for compat)"
```

---

### Task 80: Update `SvgIcon.svelte` to consume async shapes

**Files:**
- Modify: `apps/web/src/lib/components/brand/SvgIcon.svelte`

- [ ] **Step 1: Replace `import { SHAPES, pickRandomShape } from '$lib/utils/shapes'`**

With:

```ts
import { getMorphShapes, pickRandomShape } from '$lib/utils/shapes';
import type { MorphShape } from '@repo/shared';
```

- [ ] **Step 2: Use async pattern**

In the entrance animation logic, fetch shapes on mount (after gsap plugin load):

```ts
let morphShapes = $state<readonly MorphShape[] | null>(null);

onMount(async () => {
	await loadDrawSVG();
	await loadMorphSVG();
	morphShapes = await getMorphShapes();
	// ... existing animation logic, but reading from morphShapes instead of SHAPES
});
```

In the morph callback:

```ts
const { shape, index } = pickRandomShape(morphShapes!, lastShapeIdx);
lastShapeIdx = index;
gsap.to(paths, { morphSVG: shape.path, /* ... */ });
```

- [ ] **Step 3: Check + commit**

```bash
bun run check
git commit -am "feat(slice-18 18f Phase 11 Task 80): SvgIcon.svelte consumes async morph shapes from adapter"
```

---

### Task 81: Update `morphHover` action + other consumers (HomeServices.svelte, ProjectCard.svelte, ServiceBadge.svelte)

**Files:**
- Modify: `apps/web/src/lib/motion/actions/morphHover.ts` (or .js)
- Modify: `apps/web/src/lib/components/home/HomeServices.svelte`
- Modify: `apps/web/src/lib/components/projects/ProjectCard.svelte`
- Modify: `apps/web/src/lib/components/projects/ServiceBadge.svelte`

- [ ] **Step 1: Refactor `morphHover` to accept shapes prop OR fetch internally**

Two options:
- A. Fetch shapes inside the action (simpler; each instance shares the module-level cache)
- B. Caller passes `shapes` array (cleaner; decouples action from adapter)

Choose A for less consumer churn:

```ts
import { getMorphShapes, pickRandomShape } from '$lib/utils/shapes';

export interface MorphHoverParams {
	enabled?: boolean;
	// shapes prop removed; action fetches from adapter internally
}

export function morphHover(node: HTMLElement, params: MorphHoverParams): { destroy(): void; update(p: MorphHoverParams): void } {
	let shapes: readonly MorphShape[] = [];
	let lastIdx = -1;

	getMorphShapes().then((s) => { shapes = s; });

	function onEnter() {
		if (!params.enabled || shapes.length === 0) return;
		const { shape, index } = pickRandomShape(shapes, lastIdx);
		lastIdx = index;
		// ... gsap morph animation using shape.path
	}

	node.addEventListener('mouseenter', onEnter);
	// ... etc

	return {
		destroy() { node.removeEventListener('mouseenter', onEnter); },
		update(p) { params = p; },
	};
}
```

- [ ] **Step 2: Update consumer Svelte files**

In `HomeServices.svelte`, find `use:morphHover={{ shapes: SHAPES, enabled: ... }}`. Drop `shapes` arg:

```svelte
use:morphHover={{ enabled: svgReady[i] }}
```

Similarly for `ProjectCard.svelte` and `ServiceBadge.svelte`.

- [ ] **Step 3: Check + commit**

```bash
bun run check
git commit -am "feat(slice-18 18f Phase 11 Task 81): morphHover + consumers fetch shapes from adapter"
```

---

## Phase 12 — Hybrid flip + verification (5 tasks)

**Exit gate:** `apps/web/src/lib/adapters/index.ts` flipped from static → directus for blog port + content port morphShapes; full `bun run test` + `bun run check` green; live smoke on `/blog` + `/projects/[slug]` + morph hover effects.

### Task 82: Flip blog port at `apps/web/src/lib/adapters/index.ts`

**Files:**
- Modify: `apps/web/src/lib/adapters/index.ts`

- [ ] **Step 1: Inspect current adapter selection**

```bash
cat apps/web/src/lib/adapters/index.ts
```

Find the export pattern. Likely a hybrid pattern with named ports per adapter.

- [ ] **Step 2: Flip blog port to directus**

If the file uses per-port flipping (one line per port), find:

```ts
blog: staticAdapter.blog,
```

Replace with:

```ts
blog: directusAdapter.blog,
```

If the file uses a single `as adapter = staticAdapter` (whole-adapter swap), refactor to per-port composition (mirror 18e pattern). The expected pattern after refactor:

```ts
import * as staticAdapter from './static';
import * as directusAdapter from './directus';

export const adapter: ContentAdapter = {
	projects: directusAdapter.projects,    // already flipped in 18e
	services: directusAdapter.services,    // already flipped in 18a
	blog: directusAdapter.blog,            // NEW (this task)
	meta: staticAdapter.meta,              // pending 18h
	techStack: staticAdapter.techStack,    // pending 18g
	content: {
		...staticAdapter.content,
		morphShapes: directusAdapter.content.morphShapes,  // NEW (this task)
	},
};
```

- [ ] **Step 3: Type check**

```bash
bun run check 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(slice-18 18f Phase 12 Task 82): hybrid flip — blog port + content.morphShapes use Directus"
```

---

### Task 83: Run full apps/web test suite

- [ ] **Step 1**

```bash
cd apps/web
bun run test 2>&1 | tail -20
```

Expected: all tests pass. Existing 1029 + ~30 (new 18f) = ~1060 total. Failures are bugs to fix before continuing.

If there are mocked-fetch test failures because the adapter now goes through directus port: review and adjust the mock fixtures.

No commit — verification only.

---

### Task 84: Run full apps/cms test suite

```bash
cd ../cms
bun test 2>&1 | tail -10
```

Expected: ~180+ tests pass.

No commit.

---

### Task 85: Run apps/web `bun run check`

```bash
cd ../web
bun run check 2>&1 | tail -5
```

Expected: 0 errors.

If errors: read the message + fix incrementally. Common issues: `LocalizedString<T>` mismatch on Project.description (Task 78 should have addressed; verify all consumers updated).

No commit.

---

### Task 86: Live smoke — `/blog` listing + `/blog/[slug]` for 3 posts

- [ ] **Step 1: Start dev server**

```bash
cd apps/web
bun run dev
```

- [ ] **Step 2: Visit `/blog` in browser**

http://localhost:5173/blog

Verify:
- 7 posts listed (matches Directus seed)
- Filter by category (professional / personal) works
- Filter by tag works
- Language filter shows en + fr
- Listing card shows title + excerpt + date + tag chips
- Click into a post navigates to `/blog/<slug>`

- [ ] **Step 3: Visit 3 specific post URLs**

http://localhost:5173/blog/why-i-left-orm-for-raw-sql
http://localhost:5173/blog/lorem-etl-patterns (FR post)
http://localhost:5173/blog/lorem-space-exploration (personal)

For each post, verify:
- Hero image / SVG illustration renders
- Title + excerpt + reading time + word count display correctly
- Body renders with proper headings (with id attrs for TOC), paragraphs, lists, code blocks, blockquotes
- Inline marks (bold, italic, links, inline code) are styled correctly
- Code copy button works (hover → copy → ✓ feedback)
- TOC desktop sidebar shows the right headings
- Mobile TOC pill works
- Reading mode toggle works

- [ ] **Step 4: Document any visual diffs vs pre-flip**

Compare against pre-18f screenshots if available. If visual differences are unintentional, file as bugs to fix before close OR file as deferred GH issues at close.

- [ ] **Step 5: Commit any inline fixes; otherwise no commit**

---

## Phase 13 — Live smoke + close (6 tasks)

**Exit gate:** All acceptance gates from spec § 14 green; deferred work filed as GH issues; PR opened, owner-approved, and merged; memory + slice plan refreshed.

### Task 87: Live smoke — `/projects/[slug]` (validates BlockRenderer reuse + #41)

- [ ] **Step 1: Visit 3 project detail URLs**

http://localhost:5173/projects/yesid-dev
http://localhost:5173/projects/transit-data-pipeline
http://localhost:5173/projects/lorem-database-migration

For each:
- Description renders via BlockRenderer (single paragraph from wrapPlainText)
- Sections render via BlockRenderer
- Layout, typography, spacing match prior visual baseline
- Hero image + impact metrics + related services badges still work

- [ ] **Step 2: Visual diff check**

Same as Task 86 step 4.

No commit.

---

### Task 88: Programmatic-add verification — add a 5th morph shape via Data Studio

- [ ] **Step 1: Add a `decagon` row in `morph_shapes`**

Navigate: `https://cms.yesid.dev/admin/content/morph_shapes/+`. Set:
- id: `decagon`
- label: `10-sided polygon`
- path: `M24 4 L33.4 7.7 L40.1 14.6 L43 23.5 L41.7 32.7 L36.5 40.1 L28.4 44 L19.6 44 L11.5 40.1 L6.3 32.7 L5 23.5 L7.9 14.6 L14.6 7.7 Z`
- viewbox: `0 0 48 48`
- sort: 5

Click Save.

- [ ] **Step 2: Hard reload `/services/<id>` in browser**

Trigger a service-icon morph hover. The animation should now pick from 5 shapes including the decagon. (Module-level cache may need a page reload OR a tab close/reopen since cache lives until JS context resets.)

- [ ] **Step 3: Document in research.md**

Add to `docs/slices/slice-18/18f-blog-block-editor/research.md`:

```markdown
## Live state — Phase 9 (final, before close)

**Programmatic-add verified (Task 88):** added `decagon` morph shape via Data Studio at <timestamp>; frontend morph hover picks from 5 shapes including decagon after page reload. No code change needed. Confirms Q6 design goal — editors can extend the morph library without a deploy.
```

- [ ] **Step 4: Commit research update**

```bash
git add docs/slices/slice-18/18f-blog-block-editor/research.md
git commit -m "docs(slice-18 18f Phase 13 Task 88): programmatic morph-shape add verified live"
```

---

### Task 89: directus-sync diff — confirm clean intent

- [ ] **Step 1: Run diff**

```bash
cd apps/cms
bun run sync:diff 2>&1 | tail -30
```

Expected: 0 collection / 0 field / 0 relation changes. Permissions diff also clean. Cosmetic FK constraint name diff from #45 acceptable.

If real divergences: audit. May indicate a Phase 5 push didn't fully apply OR a manual edit in Data Studio that wasn't pulled back.

If snapshot has rolled forward (e.g. live FK constraint name changed), pull + commit:

```bash
bun run sync:pull
git add apps/cms/directus/snapshot/
git commit -m "chore(slice-18 18f): sync:pull — refresh snapshot post-push"
```

No commit if diff is empty.

---

### Task 90: Sweep deferred work — file as GH issues per AGENTS.md `## Never`

> AGENTS.md rule (landed 2026-04-24 in `e17c4b3`): "Close a slice with deferred work that isn't filed as a GitHub issue first."

- [ ] **Step 1: Compile candidate list**

Likely candidates from 18f execution (audit each subagent dispatch's `## Open follow-ups` notes + scan plan/research/decisions for any `TBD-future-slice` markers):

- **Code-block syntax highlighting** (Phase 10 Task 67 stub — visual highlighting deferred). File as `Add highlight.js or Shiki to CodeBlock.svelte` (priority: 18j or 19a).
- **`Embed.svelte` real impl** (Phase 10 Task 70 placeholder). File as `Implement YouTube/Vimeo/etc. embed cards in cms/Embed.svelte` (priority: 18i scope — already covered by 18i M2A blocks plan).
- **Block Editor cache invalidation Flow** (Phase 1.5 R4). File if 18j hasn't already covered.
- **First-h1 strip false-positive cases** (any actual misses from real-content round-trip). File only if encountered live.
- **Adapter cache invalidation for morph_shapes** (Phase 1.5 R4). File if not already covered by 18j revalidation Flow.
- **`apps/web/src/lib/utils/shapes.ts` SHAPES legacy export** can be deleted in 18k after all consumers verified. File a one-liner `Delete shapes.ts SHAPES legacy export post-18f` issue.

- [ ] **Step 2: File each as a GH issue**

```bash
gh issue create --title "Add syntax highlighting to BlockRenderer CodeBlock.svelte" \
  --body "Visual code-block highlighting (highlight.js / Shiki / Prism) deferred from slice-18 18f. CodeBlock.svelte renders \`<pre><code class=\"language-X\">\` but no highlighter is loaded. Investigate Shiki SSR-friendly setup as the leading candidate. Priority: 18j polish or 19a." \
  --label "deferred-from-18f"

# repeat for other items
```

Capture issue numbers in a list for the next task.

No commit (issues live on GH).

---

### Task 91: Update sub-slice + slice docs + memory

**Files:**
- Modify: `docs/slices/slice-18/18f-blog-block-editor/decisions.md`
- Modify: `docs/slices/slice-18/plan.md`
- Modify: `~/.claude/projects/.../memory/project_slice_18.md`
- Modify: `~/.claude/projects/.../memory/project_completed_slices.md`

- [ ] **Step 1: Update sub-slice `decisions.md`**

Replace empty "Open follow-ups" with the issue numbers from Task 90:

```markdown
## Open follow-ups (filed as GitHub issues at close)

- #XX — Add syntax highlighting to BlockRenderer CodeBlock.svelte (deferred to 18j)
- #YY — Implement Embed.svelte for YouTube/Vimeo (deferred to 18i — already in 18i scope)
- #ZZ — Delete shapes.ts SHAPES legacy export post-18f (deferred to 18k)
- (etc.)
```

Update Close section:

```markdown
## Close

| Item | Value |
|---|---|
| PR | #<TBD> |
| Branch | feature/slice-18-18f |
| Closed date | 2026-04-XX |
| Merge SHA | (pending owner review + merge) |
```

- [ ] **Step 2: Update slice plan.md status table**

Find:

```markdown
| **18f** | Blog + Block Editor + BlockRenderer.svelte | 🟡 in flight | 2–2.5 sessions | [18f-blog-block-editor/](18f-blog-block-editor/) |
```

Replace with:

```markdown
| **18f** | Blog + Block Editor + BlockRenderer.svelte | ✅ closed 2026-04-XX | shipped | [18f-blog-block-editor/](18f-blog-block-editor/) |
```

Add an Amendments-log row for 18f closure (mirror the 18e closure entry shape).

- [ ] **Step 3: Update memory `project_slice_18.md`**

Note that 18f closed; describe key shipped artifacts (blog migration · BlockRenderer · #41 done · morph_shapes lib · projects body upgrade).

- [ ] **Step 4: Update memory `project_completed_slices.md`**

Append a row for 18f.

- [ ] **Step 5: Commit**

```bash
git add docs/slices/slice-18/18f-blog-block-editor/decisions.md \
        docs/slices/slice-18/plan.md \
        ~/.claude/projects/.../memory/project_slice_18.md \
        ~/.claude/projects/.../memory/project_completed_slices.md
git commit -m "docs(slice-18 18f): close ceremony — issues filed, slice + memory updated"
```

(Memory paths are global; `git add` inside the project repo only captures the project-local files.)

---

### Task 92: Open PR + owner review + merge

- [ ] **Step 1: Push branch**

```bash
git push -u origin feature/slice-18-18f
```

- [ ] **Step 2: Open PR with summary + test plan**

```bash
gh pr create --title "feat(slice-18 18f): blog migration + Block Editor + BlockRenderer + morph_shapes + #41" \
  --body "$(cat <<'EOF'
## Summary

- Migrates `apps/web/src/lib/content/blog.ts` (Vite glob + marked.parse) to Directus 11. 4 new collections (`blog_posts` + `blog_posts_translations` + `illustrations` + `morph_shapes`).
- Introduces `BlockRenderer.svelte` + 11 sub-components in `apps/web/src/lib/components/cms/`. Svelte component recursion for inline marks (no `{@html}` in inline path).
- New CMS-side helper `apps/cms/scripts/migrate-markdown-to-blocks.ts` — pure transform with full unit-test coverage. Reused by #41 via `wrapPlainText`.
- Folds in #41: projects body migration (textarea → Block Editor on `description` + `sections.content`). Validates BlockRenderer on 2 content types.
- Generalizes morph-target shapes — adding a 10-sided shape via Data Studio works without a code deploy (verified live).
- 13th `BlogPort` method `bodyBySlug`; new `ContentPort.morphShapes`.

## Closed issues
- Closes #41 (projects body Block Editor migration).

## Filed during execution
- See `decisions.md` § Open follow-ups for deferred work issues (syntax highlighting, embed impl, etc.).

## Test plan

- [ ] `apps/web` `bun run check` — 0 errors
- [ ] `apps/web` `bun run test` — full suite green (existing + new BlockRenderer + adapter contract + mocked tests)
- [ ] `apps/cms` `bun test` — full suite green (existing + new fixture + seed-dry-run + migrate-markdown-to-blocks tests)
- [ ] `directus-sync diff` — clean intent (acceptable cosmetic FK noise from #45)
- [ ] `/blog` listing renders 7 posts from Directus
- [ ] `/blog/[slug]` for 3 posts: visual parity vs pre-flip + headings + TOC + code copy buttons + reading mode
- [ ] `/projects/[slug]` for 3 projects: description + sections render via BlockRenderer
- [ ] Live test: add `decagon` morph shape via Data Studio → frontend renders (no code change)

## Refs

- Spec: docs/slices/slice-18/18f-blog-block-editor/spec.md
- Plan: docs/slices/slice-18/18f-blog-block-editor/plan.md
- Research: docs/slices/slice-18/18f-blog-block-editor/research.md (P3 + P-illustration-folder probes)
- Decisions: docs/slices/slice-18/18f-blog-block-editor/decisions.md (Q1–Q6 locked + side decisions)
EOF
)"
```

- [ ] **Step 3: Wait for owner review + merge**

Owner approves, squash-merges. Capture merge SHA.

- [ ] **Step 4: Update sub-slice `decisions.md` Close section with merge SHA**

```bash
git checkout main
git pull
# Edit decisions.md Close table — set Merge SHA
git add docs/slices/slice-18/18f-blog-block-editor/decisions.md
git commit -m "docs(slice-18 18f): record merge SHA in decisions.md Close section"
git push
```

---

## Self-review (writer's pass)

After writing this plan, verify:

- [ ] **Spec coverage:** every section/requirement in `spec.md` § 1–14 has a corresponding task. (Spec § 1–6: schema; Phase 4–5 covers. Spec § 7: ports; Phase 9. Spec § 8: BlockRenderer; Phase 10. Spec § 9: shared helpers; Phase 3. Spec § 10: consumer wiring; Phase 11. Spec § 11: tests; embedded throughout. Spec § 12: hybrid flip; Phase 12 Task 82. Spec § 13: live smoke; Phase 13. Spec § 14: acceptance gates; embedded.)
- [ ] **Type consistency:** `BlockEditorDoc`, `MorphShape`, `TocHeading`, `BlogPort.bodyBySlug`, `ContentPort.morphShapes` are named consistently across phases.
- [ ] **Placeholder scan:** no `TBD`, `TODO`, `implement later`. Probe-pending markers in research.md are intentional and limited to the research file.
- [ ] **No undefined functions:** `kebabSlug`, `extractText`, `wordCount`, `readingTime`, `extractHeadings`, `wrapPlainText`, `serializeBlocksToHtml`, `BlockEditorDocSchema` all defined in Phase 3 (Tasks 9–16) and consumed in later phases.
- [ ] **Each step is bite-sized (2–5 minutes)** OR is a logical commit boundary.
- [ ] **Frequent commits:** every task ends with a commit (or notes "no commit — verification only").
- [ ] **DRY/YAGNI/TDD respected:** seed scripts mirror seed-projects shape; Block Editor types defined once in `@repo/shared`; tests written first then implementation; no speculative features.

---

## References

- Spec: [`spec.md`](spec.md)
- Research: [`research.md`](research.md)
- Decisions: [`decisions.md`](decisions.md)
- Slice plan: [`../plan.md`](../plan.md)
- Conventions: [`../CONVENTIONS.md`](../CONVENTIONS.md)
- 18e plan (reference for shape): [`../18e-projects/plan.md`](../18e-projects/plan.md)
- 18e decisions amendments AM1–AM6: [`../18e-projects/decisions.md`](../18e-projects/decisions.md)

