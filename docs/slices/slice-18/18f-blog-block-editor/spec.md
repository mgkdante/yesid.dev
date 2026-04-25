# Slice 18f — Blog + Block Editor + BlockRenderer · Design Spec

> **Brainstorming output, 2026-04-25.** First production Block Editor migration. Introduces both the consumer-side `BlockRenderer.svelte` and the markdown→blocks migration script. The renderer + migration helpers are reused by 18g (tech-stack), 18i (M2A blocks), and #41 (projects body upgrade — folded into 18f scope per Q3).
>
> **Inherits:** all 18c foundations (lib/* helpers · directus-sync · parsePort · queuedFetch · PreviewContext · WeakMap memo · `asset()` helper) + 18d asset pipeline (`assetIdFor()` from `@repo/shared`, folder-scoped Public read on `directus_files`) + 18e patterns (slug-as-PK, translations junction, cascade FK Public-policy filter syntax, `_sync_human_editor_policy`).
>
> **Format:** the slice plan + task breakdown will be written in a follow-on planning pass via `superpowers:writing-plans`; this doc is the design-locked input.

## 1 · Locked decisions (brainstorming)

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | `animation_reverse M2O` field semantics | **Drop — typo/artifact** | No matching field in current code or history. The only "reverse" field was `lottieReverse` on services (purged in 18d). `animation` stays a string enum (`draw \| morph \| draw-fill`), not M2O. |
| Q2 | Translation model | **Translations junction for title + excerpt; `lang` + `body` on parent** | Conforms to CONVENTIONS § 8 ("every localized field on `<collection>_translations` junction"). Each post seeds with one translation row matching its `lang`. Future-proof if cross-locale title display is ever needed. Body stays mono-language (matches reality — posts are written in one language; you write a new post to "translate", not duplicate body in the junction). |
| Q3 | Issue [#41](https://github.com/mgkdante/yesid.dev/issues/41) (projects Block Editor migration) scope | **Roll into 18f** | Once `BlockRenderer.svelte` and `migrate-markdown-to-blocks.ts` exist, the projects upgrade is mechanical (plain text → single-paragraph Block Editor doc via `wrapPlainText` helper). Validates renderer reusability on 2 content types from day one. Cost: ~0.5 session (schema migration + re-seed + ProjectDetailPage consumer update). |
| Q4 | `BlockRenderer` rendering strategy for inline marks | **Svelte component recursion** (no `{@html}` in inline path) | Block Editor content is admin-controlled but Svelte's escape-by-default safety is load-bearing. ~5 mark types × small branches = trivial extra code. Reusable from day one (18g, #41, 18i M2A blocks). Code-block highlighting + copy buttons bake into a `CodeBlock.svelte` sub-component (no runtime DOM mutation as today). |
| Q5 | SVG illustrations for blog | **New `illustrations` collection (curated library) — generic, not blog-specific** | Two illustration models in the system: **library model** (curated, reusable, dropdown) for blog + project decorative illustrations; **direct M2O model** (one-per-content, identity-tied) for service station icons. Services keep `services.svg` M2O `directus_files` unchanged; blog + project share the new `illustrations` library. |
| Q6 | Morph-target shapes (currently hardcoded in `apps/web/src/lib/utils/shapes.ts`) | **New `morph_shapes` collection** — programmatically extensible | Adding a 10-sided shape today requires a code change. Move to a Directus collection with `id`, `label`, `path`, `viewbox`, `sort`. Frontend caches once via async getter; adding shapes via Data Studio works without a deploy. ~0.3 session of work; high editor-ergonomics payoff. |

**Side decisions folded into design** (no separate Q):

- **`status` enum on consumer:** hidden. Adapter filters `status _eq "published"` silently. `BlogPost` type unchanged (no status field).
- **Reading time + word count derivation:** pure helpers in `packages/shared/src/utils/blocks.ts` (`extractText`, `wordCount`, `readingTime`). Replace HTML-regex extraction in `+page.ts`.
- **TOC heading-id generation:** deterministic kebab-case slug emitted by `Heading.svelte` at render time. Existing `TableOfContents.svelte` reads ids from DOM (already there); `getProcessedHtml()` becomes a no-op.
- **`BlockRenderer` location:** `apps/web/src/lib/components/cms/BlockRenderer.svelte` (cms/ subfolder, not blog/ — the renderer is shared across content types).
- **Mapping completeness:** exhaustive. Cover every block type the schema permits (heading 1–4, paragraph with inline marks, ordered/bullet list, codeBlock with language, blockquote, horizontalRule, image, embed) so 18g + #41 + 18i don't need extension.
- **Inline images during migration:** zero in current data; schema/component support `image` block; migration script handles via `assetIdFor(legacyPath)` if/when added.
- **External posts during migration:** zero `external: true` posts in current data; schema permits; body nullable when `external=true`.
- **`svg_illustration` required vs optional:** optional with deterministic fallback (current behavior preserved). Migration script auto-assigns a fallback for posts without one specified.

---

## 2 · Schema

Adds **5 new collections + 2 modifications**:

| Collection | New / modified | Purpose |
|---|---|---|
| `blog_posts` | NEW | Blog post parent |
| `blog_posts_translations` | NEW | Localized title + excerpt |
| `illustrations` | NEW | Curated SVG library (consumed by blog + projects) |
| `morph_shapes` | NEW | Geometric morph-target paths (consumed by motion utils) |
| `projects` | MODIFIED | `+ svg_illustration M2O illustrations` (#41 schema-only piece) |
| `projects_translations` | MODIFIED | `description` textarea → Block Editor (#41 body migration) |
| `projects_sections_translations` | MODIFIED | `content` textarea → Block Editor (#41 body migration) |

### 2.1 `blog_posts` (parent collection)

| Field | Type | Notes |
|---|---|---|
| `id` | string PK | Slug as PK (kebab-case), per 18e Q5. e.g. `why-i-left-orm-for-raw-sql`. |
| `status` | dropdown | `draft \| published \| archived`. Default `draft`. archive_field=status. |
| `date_published` | datetime | ISO date; sort field |
| `sort` | integer (hidden) | drag-and-drop ordering |
| `lang` | dropdown | `en \| fr \| es` — language of the body |
| `category` | dropdown | `professional \| personal` |
| `tags` | JSON array | string array; lowercase keywords |
| `external` | boolean | default `false` |
| `url` | string nullable | only populated when `external=true`; `meta.conditions` requires it then |
| `cover_image` | M2O `directus_files` | optional; nullable; folder `blog/` |
| `svg_illustration` | M2O `illustrations` | optional; dropdown filtered by `category = blog_posts.category OR category = 'general'` |
| `animation` | dropdown | `draw \| morph \| draw-fill` (string enum, not M2O — Q1) |
| `body` | **Block Editor** | required when `external=false`; nullable + hidden when `external=true` |
| `translations` | alias → `blog_posts_translations` | Standard Translations interface |

**Collection meta** (CONVENTIONS § 2 — 18-item checklist):
- `display_template`: `{{translations.title}}` (with EN fallback)
- `icon`: `article`
- `note`: human + AI-editor onboarding line
- `sort_field`: `sort`
- `archive_field`: `status` · `archive_value`: `archived` · `unarchive_value`: `draft`
- `item_duplication_fields`: explicit list excluding `status`, `date_published`, `date_created`, `date_updated`, `user_created`, `user_updated`
- `preview_url`: `https://yesid.dev/blog/{{id}}?share={{$CURRENT_SHARE.token}}` (post-18 share routes)
- `versioning`: `true` · `accountability`: `"all"`
- Field grouping: native Tabs interface for >6 fields

### 2.2 `blog_posts_translations`

| Field | Type | Notes |
|---|---|---|
| `id` | integer PK auto | |
| `blog_posts_id` | M2O → `blog_posts` | parent FK |
| `languages_code` | M2O → `languages` | locale code |
| `title` | string | required |
| `excerpt` | textarea | required, ≤500 chars |

### 2.3 `illustrations` (curated SVG library)

| Field | Type | Notes |
|---|---|---|
| `id` | string PK | slug, e.g. `pro-database`, `personal-rocket` |
| `file` | M2O `directus_files` | folder `illustrations/` (new sibling to existing 6 folders) |
| `label` | string | dropdown display name |
| `category` | dropdown | `professional \| personal \| general` |
| `tags` | JSON array | filter/search aid across content types |
| `description` | textarea required | alt-text |
| `sort` | integer | display order |

`meta.display_template`: `{{label}} ({{category}})`

**Consumed by:**
- `blog_posts.svg_illustration` → M2O `illustrations` (filter: category match)
- `projects.svg_illustration` → M2O `illustrations` (added in 18f schema-only; values populated by editors later)

### 2.4 `morph_shapes` (geometric morph-target library)

| Field | Type | Notes |
|---|---|---|
| `id` | string PK | slug, e.g. `triangle`, `circle`, `square`, `hexagon`, `decagon` |
| `label` | string | human-readable |
| `path` | textarea | SVG path `d=` attribute, e.g. `M24 8 L40 38 L8 38 Z` |
| `viewbox` | string | default `0 0 48 48` |
| `sort` | integer | display + random-pick order |
| `description` | textarea | optional editor notes |

`meta.display_template`: `{{label}} ({{viewbox}})`

### 2.5 `projects` (modifications for #41)

- **NEW field** `svg_illustration` → M2O `illustrations` (optional; nullable; schema-only — values populated by editors later via Data Studio)
- **MODIFIED field** `projects_translations.description`: textarea → **Block Editor**
- **MODIFIED field** `projects_sections_translations.content`: textarea → **Block Editor**
- Re-seed required: `seed-projects.ts` updated to pass plain-text strings through `wrapPlainText(str)` helper before write.

### 2.6 Folders (`directus_files`)

Existing 6 folders stay (`services` · `projects` · `blog` · `brand` · `about` · `og`). New: **`illustrations`**.

### 2.7 Permissions (`apps/cms/directus/permissions.json`)

Adds permission rows mirroring 18e patterns:

- **ai-editor:** `read: all`, `create/update: filter status _neq "published"`, `delete: false` — for `blog_posts`, `blog_posts_translations`, `illustrations`, `morph_shapes`.
- **human-editor:** full CRUD on the same set; reuses `_sync_human_editor_policy` (created in 18e Phase 3).
- **Public:** `read: all` for `morph_shapes` (infrastructure, not status-gated); `read: filter status _eq "published"` for `blog_posts` with cascade FK filter `blog_posts_id.status _eq "published"` on `blog_posts_translations`; `read: all` for `illustrations` (already-published library asset).
- Public policy `_syncId` is `_sync_default_public_policy` (per 18e AM1 finding).

---

## 3 · Block Editor JSON shape (P3 probe)

The 18c P3 probe was deferred to 18f Phase 0. **Run live before any code that depends on the shape.**

**Probe method:**

1. Push `blog_posts` collection schema via directus-sync.
2. In Data Studio, manually create one test row containing every block type (heading levels 1–4, paragraph with bold/italic/link/inline-code marks, ordered list, bullet list, nested list, code block with language, blockquote, horizontal rule, image, embed).
3. Read the row via MCP `items` tool (or `curl /items/blog_posts/<id>?fields=body`).
4. Document the JSON shape in `research.md` § "P3 — Block Editor JSON shape".
5. Land the Zod schema in `packages/shared/src/types/blocks.ts` (`BlockEditorDocSchema`, `BlockEditorNodeSchema`).

**Working assumption** (from 18c Directus-11-docs reading; verify in probe):

```ts
type BlockEditorDoc = {
  type: 'doc';
  content: BlockEditorNode[];
};

type BlockEditorNode =
  | { type: 'heading'; attrs: { level: 1 | 2 | 3 | 4; id?: string }; content: InlineNode[] }
  | { type: 'paragraph'; content: InlineNode[] }
  | { type: 'bulletList'; content: ListItemNode[] }
  | { type: 'orderedList'; content: ListItemNode[] }
  | { type: 'listItem'; content: BlockEditorNode[] }  // contains paragraphs + nested lists
  | { type: 'codeBlock'; attrs: { language: string | null }; content: TextNode[] }
  | { type: 'blockquote'; content: BlockEditorNode[] }
  | { type: 'horizontalRule' }
  | { type: 'image'; attrs: { src: string; alt: string; title?: string } }
  | { type: 'embed'; attrs: { url: string; service?: string } };

type InlineNode = TextNode | { type: 'hardBreak' };
type TextNode = { type: 'text'; text: string; marks?: Mark[] };
type Mark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'code' }
  | { type: 'strike' }
  | { type: 'link'; attrs: { href: string; title?: string } };
```

**If probe diverges from this shape:** update Zod schema, transform helpers, and BlockRenderer dispatch in lockstep. The probe is the gate.

---

## 4 · Markdown → Block Editor migration

### 4.1 `migrate-markdown-to-blocks.ts` (CMS-side, reusable)

**Location:** `apps/cms/scripts/migrate-markdown-to-blocks.ts`.

**Pipeline:**

```
markdown string
  → marked.lexer(content) → tokens (AST)
  → mapTokensToBlocks(tokens) → BlockEditorDoc
  → BlockEditorDocSchema.parse(doc) → typed doc
```

**Token-to-block mapping** (one pure function per token type, all exported for tests):

| Marked token | Block Editor node |
|---|---|
| `heading` (depth 1–4) | `{ type: 'heading', attrs: { level: depth, id: kebabSlug(text) }, content: inlineMarks(tokens) }` |
| `paragraph` | `{ type: 'paragraph', content: inlineMarks(tokens) }` |
| `list` (ordered=false) | `{ type: 'bulletList', content: items.map(toListItem) }` |
| `list` (ordered=true) | `{ type: 'orderedList', content: items.map(toListItem) }` |
| `list_item` | `{ type: 'listItem', content: tokens.map(mapToken) }` |
| `code` (fenced) | `{ type: 'codeBlock', attrs: { language: lang ?? null }, content: [{ type: 'text', text: rawCode }] }` |
| `blockquote` | `{ type: 'blockquote', content: tokens.map(mapToken) }` |
| `hr` | `{ type: 'horizontalRule' }` |
| `image` | `{ type: 'image', attrs: { src: assetIdFor(legacyPath), alt, title? } }` (none in current data) |

**Inline-mark composition** — `inlineMarks(tokens): InlineNode[]`:

| Marked token | Output |
|---|---|
| `text` | `{ type: 'text', text }` |
| `strong` | text node + `marks: [{ type: 'bold' }]` |
| `em` | text node + `marks: [{ type: 'italic' }]` |
| `link` | text node + `marks: [{ type: 'link', attrs: { href, title? } }]` |
| `codespan` | text node + `marks: [{ type: 'code' }]` |
| `del` | text node + `marks: [{ type: 'strike' }]` |
| `br` | `{ type: 'hardBreak' }` |

**First-`<h1>` strip:** if `tokens[0]` is a depth-1 heading whose plaintext matches the frontmatter `title`, drop it. (Mirrors current `+page.ts` regex strip; moves the responsibility upstream to migration time.)

**Sibling helper for plain text** (#41 use case): `wrapPlainText(str): BlockEditorDoc` returns a single-paragraph doc:

```ts
{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: str }] }] }
```

Consumed by `seed-projects.ts` to wrap `description` + `sections.content` strings during the #41 re-seed.

### 4.2 CLI

```bash
bun run apps/cms/scripts/migrate-markdown-to-blocks.ts            # writes apps/cms/fixtures/collections/blog-posts.json
bun run apps/cms/scripts/migrate-markdown-to-blocks.ts --dry-run  # prints diff vs current fixture
bun run apps/cms/scripts/migrate-markdown-to-blocks.ts --single why-i-left-orm-for-raw-sql
```

Idempotent. Reads `apps/web/src/content/blog/**/index.md` (excluding `_template.md`). Writes the full fixture array.

---

## 5 · Fixtures (4 new fixture files)

### 5.1 `apps/cms/fixtures/collections/blog-posts.json`

Each row, one per markdown file (7 posts; 6 EN + 1 FR):

```jsonc
{
  "id": "why-i-left-orm-for-raw-sql",
  "status": "published",
  "date_published": "2026-04-01",
  "sort": 0,
  "lang": "en",
  "category": "professional",
  "tags": ["sql", "postgresql", "opinion"],
  "external": false,
  "url": null,
  "cover_image_legacy_path": null,
  "svg_illustration_id": "pro-database",
  "animation": "draw",
  "body": { "type": "doc", "content": [/* ... */] },
  "translations": [
    { "languages_code": "en", "title": "Why I Left ORM for Raw SQL", "excerpt": "After years of fighting with ORMs..." }
  ]
}
```

### 5.2 `apps/cms/fixtures/collections/illustrations.json`

8 fallbacks (4 professional + 4 personal):

```jsonc
{
  "id": "pro-database",
  "file_legacy_path": "src/lib/assets/blog-fallbacks/pro-database.svg",
  "label": "Database engineering",
  "category": "professional",
  "tags": ["database", "sql"],
  "description": "Stylized database illustration with cylindrical layers",
  "sort": 1
}
```

Plus any custom-SVG present in `apps/web/src/content/blog/**/illustration.svg` (none in current data — placeholder for future).

### 5.3 `apps/cms/fixtures/collections/morph-shapes.json`

4 existing geometric shapes from `apps/web/src/lib/utils/shapes.ts`:

```jsonc
[
  { "id": "triangle", "label": "Triangle", "path": "M24 8 L40 38 L8 38 Z", "viewbox": "0 0 48 48", "sort": 1, "description": "" },
  { "id": "circle", "label": "Circle", "path": "M24 8 A16 16 0 1 1 23.99 8 Z", "viewbox": "0 0 48 48", "sort": 2, "description": "" },
  { "id": "square", "label": "Square", "path": "M10 10 L38 10 L38 38 L10 38 Z", "viewbox": "0 0 48 48", "sort": 3, "description": "" },
  { "id": "hexagon", "label": "Hexagon", "path": "M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z", "viewbox": "0 0 48 48", "sort": 4, "description": "" }
]
```

### 5.4 `apps/cms/fixtures/collections/projects.json` (modified for #41)

`description` and `sections[].content` (currently plain strings) wrap-migrated to Block Editor JSON via `wrapPlainText` helper at seed time. Fixture file shape stays the same (plain string fields); the seed transformer wraps before write.

---

## 6 · Seed scripts (3 new + 1 modified)

All three new scripts mirror `apps/cms/scripts/seed-projects.ts` shape exactly (lib/* helpers + Zod fixture validation + dry-run + reset + pure transform helpers exported for tests).

| Script | Purpose |
|---|---|
| `apps/cms/scripts/seed-blog-posts.ts` | Seeds `blog_posts` + `blog_posts_translations`. Calls `migrate-markdown-to-blocks.ts` for `body` field. Resolves `cover_image` + `svg_illustration` via `assetIdForOrUndefined` / illustration id lookup. |
| `apps/cms/scripts/seed-illustrations.ts` | Seeds `illustrations` library. Uploads SVG file via assetIdFor or via Directus files API if not yet uploaded. Pre-binds custom illustrations from `apps/web/src/content/blog/**/illustration.svg` (currently 0). |
| `apps/cms/scripts/seed-morph-shapes.ts` | Seeds `morph_shapes` from the existing 4 geometric shapes. |
| `apps/cms/scripts/seed-projects.ts` | **MODIFIED.** Wraps `description` + `sections.content` strings via `wrapPlainText` before write (#41 body migration). |

---

## 7 · Adapter ports

### 7.1 `BlogPort` extension

The `BlogPort` interface in `apps/web/src/lib/adapters/types.ts` already has 12 methods. **18f extends with `bodyBySlug`:**

```ts
export interface BlogPort {
  // ... existing 12 methods ...
  bodyBySlug(slug: string, ctx?: PreviewContext): Promise<BlockEditorDoc | null>;
}
```

`bodyBySlug` returns the full Block Editor JSON for one post — the data path used by `/blog/[slug]/+page.ts` for `BlockRenderer`. Legacy `html(slug)` stays during 18f for backward compat (serializes block JSON to HTML at the boundary); deprecated and removed in 18i with the static-adapter delete.

### 7.2 `directus.blog.*` implementation

Mirrors 18e projects port shape (parsePort + queuedFetch + PreviewContext support):

| Method | Implementation |
|---|---|
| `all(ctx?)` | `readItems('blog_posts', { fields: [...], filter: { status: { _eq: 'published' } }, sort: ['-date_published'], limit: -1 })` → `parsePort('blog.all', z.array(BlogPostSchema), rows.map(toBlogPost))` |
| `bySlug(slug, ctx?)` | filter `id _eq slug` + status published; `parsePort` with `BlogPostSchema.optional()` |
| `bodyBySlug(slug, ctx?)` | NEW — fetches `body` field only; `parsePort('blog.bodyBySlug', BlockEditorDocSchema.nullable(), row.body)` |
| `html(slug, ctx?)` | LEGACY — calls `bodyBySlug` + serializes to HTML via `serializeBlocksToHtml(doc)`. Deprecated in 18i. |
| `byCategory(cat, ctx?)` | filter `category _eq` + status; sort by date desc |
| `byTag(cat, tag, ctx?)` | filter `category _eq` + `tags _contains tag` + status |
| `tagsForCategory(cat, ctx?)` | distinct tags from posts in category (Set + sort) |
| `languagesForCategory(cat, ctx?)` | distinct lang values from posts in category |
| `latest(count, cat?, ctx?)` | filter status + optional category, sort date desc, limit count |
| `svgContent(post, ctx?)` | fetch SVG file content via `/assets/<file_uuid>` (raw bytes) |
| `svgContentsForPosts(posts, ctx?)` | parallel-batched `svgContent` calls keyed by slug |
| `resolveSvgFallbackName(slug, cat, ctx?)` | adapter-side: query `illustrations` filtered by category, deterministic-pick by `slugHash(slug) % illustrations.length` |
| `resolveAnimation(slug, explicit, ctx?)` | unchanged from static adapter — pure helper using slug hash; no Directus call needed |

### 7.3 Pure mapping function

```ts
function toBlogPost(row: DirectusBlogPostRow): BlogPost {
  return {
    slug: row.id,
    title: toLocalizedString(row.translations, 'title'),
    excerpt: toLocalizedString(row.translations, 'excerpt'),
    date: row.date_published.split('T')[0],
    lang: row.lang,
    category: row.category,
    tags: row.tags ?? [],
    animation: row.animation,
    svg: row.svg_illustration?.id ?? resolveSvgFallbackName(row.id, row.category),
    external: row.external,
    url: row.external ? row.url : `/blog/${row.id}`,
  };
}
```

`BlogPost` doesn't expose `body` directly — body fetched via `bodyBySlug` only when needed (avoids loading every body in listings).

### 7.4 `ContentPort.morphShapes`

Single new method on `ContentPort` (not a top-level port — overkill for one method):

```ts
content: {
  // ... existing methods ...
  morphShapes(ctx?: PreviewContext): Promise<readonly MorphShape[]>;
}
```

Static adapter returns the hardcoded 4-shape constant. Directus adapter reads `morph_shapes` collection (Public policy `read: all`).

### 7.5 Consumer refactor — `apps/web/src/lib/utils/shapes.ts`

Becomes a thin async helper:

```ts
import { adapter } from '$lib/adapters';

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
  if (shapes.length === 0) throw new Error('No morph shapes available');
  let idx: number;
  do {
    idx = Math.floor(Math.random() * shapes.length);
  } while (idx === lastIndex && shapes.length > 1);
  return { shape: shapes[idx], index: idx };
}
```

`SvgIcon.svelte`, `morphHover` action, and other consumers call `getMorphShapes()` on mount/first-hover; cache makes subsequent reads instant.

---

## 8 · `BlockRenderer.svelte` + sub-components

**Location:** `apps/web/src/lib/components/cms/BlockRenderer.svelte` (cms/ subfolder; reusable across content types).

**Top-level dispatch:**

```svelte
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

{#each doc.content as node, i (node.id ?? `${node.type}-${i}`)}
  {#if node.type === 'heading'}
    <Heading {...node.attrs} content={node.content} />
  {:else if node.type === 'paragraph'}
    <Paragraph content={node.content} />
  ... (8 more branches)
  {/if}
{/each}
```

**Sub-components** (under `apps/web/src/lib/components/cms/blocks/`):

| Component | Output |
|---|---|
| `Heading.svelte` | `<h{level} id={slug}>` wrapping `<InlineContent>` |
| `Paragraph.svelte` | `<p>` wrapping `<InlineContent>` |
| `InlineContent.svelte` | walks `content[]` of text nodes; emits `<strong>`/`<em>`/`<a>`/`<code>` per marks; handles `hardBreak` as `<br>`; Svelte's default escaping applies |
| `BulletList.svelte` | `<ul>` containing `<ListItem>`s |
| `OrderedList.svelte` | `<ol>` containing `<ListItem>`s |
| `ListItem.svelte` | `<li>` with nested children (paragraph or nested list — recurses via BlockRenderer-style dispatch) |
| `CodeBlock.svelte` | `<pre><code class="language-{lang}">`; copy button baked in (no runtime DOM mutation) |
| `Blockquote.svelte` | `<blockquote>` with nested children |
| `HorizontalRule.svelte` | `<hr>` |
| `ImageBlock.svelte` | `<img src={asset(uuid, 'card-600')} alt={alt} title={title}>` using existing `asset()` helper |
| `Embed.svelte` | placeholder for 18i (renders YouTube/Vimeo/etc.); 18f stub returns plain `<a>` link |

**TOC integration:** `Heading.svelte` always emits an `id` attribute from `extractText(node.content) → kebabSlug(text)`. SSR delivers HTML with ids built-in. Existing `TableOfContents.svelte` reads ids from DOM (already there); `getProcessedHtml()` becomes a no-op.

**Code highlighting:** `CodeBlock.svelte` renders `<code class="language-{lang}">`; visual highlighting (highlight.js / Prism / Shiki) is a follow-up enhancement (file as GH issue at close).

---

## 9 · Helpers — `packages/shared/src/`

### 9.1 `types/blocks.ts` (new)

`BlockEditorDoc`, `BlockEditorNode`, `InlineNode`, `TextNode`, `Mark` types + `BlockEditorDocSchema` Zod schema. Locked to live JSON shape after P3 probe.

### 9.2 `utils/blocks.ts` (new — pure helpers)

```ts
export function extractText(doc: BlockEditorDoc): string;
export function wordCount(text: string): number;
export function readingTime(words: number, wpm?: number): number;
export function extractHeadings(doc: BlockEditorDoc): readonly TocHeading[];
export function kebabSlug(text: string): string;
export function serializeBlocksToHtml(doc: BlockEditorDoc): string;  // legacy bridge for blog.html()
export function wrapPlainText(str: string): BlockEditorDoc;          // #41 helper
```

All pure, all unit-tested, all consumed by both apps (`@repo/shared` is type+Zod+pure-utils only; passes D14 review).

### 9.3 `types/content.ts` (modified)

Add new types:

```ts
export interface MorphShape {
  id: string;
  label: string;
  path: string;
  viewbox: string;
  sort: number;
}
```

(`BlogPost` interface unchanged — body not surfaced; status not surfaced; svg + animation stay as today.)

---

## 10 · Consumer wiring

### 10.1 `/blog/[slug]/+page.ts`

Replace `getPostHtml(slug)` with `getPostBody(slug)`:

```ts
const [body, svgContent, allPosts] = await Promise.all([
  adapter.blog.bodyBySlug(params.slug),
  adapter.blog.svgContent(post),
  adapter.blog.all(),
]);

const text = extractText(body);
const wordCount = wordCount(text);
const readingTime = readingTime(wordCount);
const headings = extractHeadings(body);

return { post, body, svgContent, readingTime, wordCount, headings, postIndex };
```

### 10.2 `BlogDetailPage.svelte`

Receives `body` (BlockEditorDoc) instead of `html` (string). Renders via `<BlockRenderer doc={body} />` inside `BlogContent.svelte` wrapper. TOC reads pre-extracted `headings` array (no DOMParser).

### 10.3 Project detail pages

`ProjectDetailPage.svelte` (and similar) consume `description` + `sections[].content` as Block Editor docs; render via `<BlockRenderer>`. This is the #41 consumer flip.

### 10.4 `BlogContent.svelte`

Wrapper component stays (provides typography styles + reading-mode chrome + accent color). Drops the runtime DOM mutation for code-copy buttons (now baked into `CodeBlock.svelte`).

### 10.5 `TableOfContents.svelte`

Becomes thinner: receives `headings: readonly TocHeading[]` directly from page data; no more HTML parsing or runtime ID injection.

---

## 11 · Tests

| File | Layer | Purpose |
|---|---|---|
| `apps/cms/tests/fixture-blog-posts.test.ts` | CMS | Zod-validates fixture; one row per markdown file; references resolve (svg_illustration_id → illustrations row) |
| `apps/cms/tests/fixture-illustrations.test.ts` | CMS | Zod-valid + categories cover both pro + personal |
| `apps/cms/tests/fixture-morph-shapes.test.ts` | CMS | Zod-valid + ≥4 rows + paths are valid SVG path strings |
| `apps/cms/tests/migrate-markdown-to-blocks.test.ts` | CMS | **Most important.** One test per token-type mapping; nested cases; real-content round-trip on all 7 current posts; first-h1 strip; `wrapPlainText` |
| `apps/cms/tests/seed-blog-posts-dry-run.test.ts` | CMS | Pure helpers (`toBlogPostRow`, `toTranslationRows`, `toIllustrationRow`); no network |
| `apps/cms/tests/seed-illustrations-dry-run.test.ts` | CMS | Same shape |
| `apps/cms/tests/seed-morph-shapes-dry-run.test.ts` | CMS | Same shape |
| `apps/web/src/lib/adapters/directus.contract.test.ts` | Web | Extend with blog mappings (`toBlogPost`, `toLocalizedString`, fallback resolution chain) |
| `apps/web/src/lib/adapters/directus.mocked.test.ts` | Web | Extend with 13 blog port URL/query shape assertions + 1 morphShapes assertion |
| `apps/web/src/lib/components/cms/BlockRenderer.test.ts` | Web | Renders every block type from sample JSON; inline marks compose; nested lists; heading ids match slugs; XSS attempt in text is escaped |
| `packages/shared/src/utils/blocks.test.ts` | Shared | `extractText`, `wordCount`, `readingTime`, `extractHeadings`, `kebabSlug`, `wrapPlainText`, `serializeBlocksToHtml` |

`apps/web/src/lib/adapters/adapter.test.ts` (parity test between static + Directus blog ports) extends to cover the new port surface.

---

## 12 · Hybrid flip

Single-line change at `apps/web/src/lib/adapters/index.ts`: swap blog port + content port from static → directus. Same atomic-flip pattern as services (18a/18c) and projects (18e).

---

## 13 · Live smoke (Phase 9 acceptance)

- [ ] `/blog` listing renders posts from Directus; filter by tag/lang/category works
- [ ] `/blog/[slug]` for at least 3 posts: visual parity vs pre-flip (typography, code highlighting, blockquote accent, list spacing)
- [ ] TOC desktop sidebar + mobile pill work (heading ids deterministic + clickable)
- [ ] Reading time + word count match prior values within ±5%
- [ ] Project detail pages (`/projects/[slug]`) render description + sections via BlockRenderer
- [ ] Adding a new morph shape (e.g., `decagon` with 10-sided path) via Data Studio → `/services/[slug]` SVG morph picks from 5 shapes including decagon, no code change
- [ ] Adding a new illustration via Data Studio → editor sees it in blog post `svg_illustration` dropdown immediately

---

## 14 · Acceptance gates (all must green before closing 18f)

- [ ] `morph_shapes` collection live; 4 seeded shapes; programmatic addition verified live
- [ ] `illustrations` collection live; ≥8 fallback illustrations seeded (4 pro + 4 personal); custom-SVG posts have library rows pre-bound
- [ ] `blog_posts` + `blog_posts_translations` live with full 18-item checklist passing
- [ ] `projects.svg_illustration` M2O field added (#41 schema-only piece)
- [ ] `projects_translations.description` + `projects_sections_translations.content` migrated from textarea → Block Editor (#41 body migration)
- [ ] P3 probe complete; Block Editor JSON shape documented in `research.md`; `BlockEditorDocSchema` in `packages/shared/src/types/blocks.ts`
- [ ] `migrate-markdown-to-blocks.ts` deterministic + idempotent; all 7 blog markdown files migrate cleanly
- [ ] `seed-blog-posts.ts` + `seed-illustrations.ts` + `seed-morph-shapes.ts` follow seed-projects shape
- [ ] `directus.blog.*` 13 methods + `directus.content.morphShapes` implemented with parsePort + queuedFetch
- [ ] `BlockRenderer.svelte` + 11 sub-components render every block type (component tests green)
- [ ] All test boundaries green per CONVENTIONS § 5
- [ ] `apps/web` `bun run check` 0 errors; `bun run test` full suite green both apps
- [ ] Hybrid flip lands at `apps/web/src/lib/adapters/index.ts`
- [ ] Live smoke per § 13 above
- [ ] `directus-sync diff` clean intent after push (FK constraint noise from #45 acceptable)
- [ ] All deferred work filed as GitHub issues per AGENTS.md `## Never`

---

## 15 · Constraints + risks

### Constraints (carried from earlier sub-slices)

- `_syncId` for folders/policies must be UUIDs (18d Task 7); permission rows + collection/field/relation `_syncId`s are regular strings.
- Sharp transforms still passthrough on Railway (#37). Acceptable for 18f; not the slice that fixes this.
- D15 hard rule: no Markdown interface anywhere in Directus; `marked.parse` lives only in the migration script (CMS-side) — not in consumer bundle.
- `@repo/shared` types + Zod + pure utils only (D14). `marked` lives in `apps/cms/` only.
- No new custom Directus extensions (D11).
- Reuse 18e infrastructure: `_sync_human_editor_policy`, `_sync_default_public_policy`, `assetIdFor`, `parsePort`, `createQueuedFetch`.

### Risks

- **R1: P3 probe diverges from working assumption.** Mitigation: probe is Phase 0 — if shape differs, Zod schema + transform helpers + BlockRenderer dispatch update in lockstep before downstream code. Cost: ~1–2 hours rework if shape shifts.
- **R2: First-h1 strip false-positives** (heading text matches title but is intentional, e.g. an H1 inside a long-form essay). Mitigation: only strip if it's the FIRST token AND text matches `frontmatter.title` exactly (case-insensitive trim). Surface unmatched cases in dry-run output for review.
- **R3: Code-block highlighting deferred** — visual parity may show plain code instead of syntax-highlighted on flip day. Mitigation: file as a GH issue at close + note in PR body. Existing posts had highlighting; users may notice.
- **R4: Adapter cache invalidation for `morph_shapes` after Data Studio edit.** Mitigation: full-site revalidation Flow (D8) covers it once 18j wires it; until then, in-memory module cache means a deploy is needed to refresh — note in PR body.
- **R5: Scope blow** — 18f originally 1.5–2 sessions; with #41 + morph_shapes folded in, now 2–2.5 sessions. Mitigation: phased approach; if Phase 6+7 (BlockRenderer + #41 consumer flip) runs long, consider deferring #41 consumer to a sub-PR.

---

## 16 · References

- Slice plan: [`../plan.md`](../plan.md)
- 18-item checklist: [`../CONVENTIONS.md § 2`](../CONVENTIONS.md#2-per-collection-18-item-checklist)
- Seed-script shape: [`../CONVENTIONS.md § 4`](../CONVENTIONS.md#4-seed-script-shape)
- Test boundaries: [`../CONVENTIONS.md § 5`](../CONVENTIONS.md#5-test-boundary-taxonomy)
- Adapter port template: [`../CONVENTIONS.md § 6`](../CONVENTIONS.md#6-adapter-port-template)
- Block Editor rule: [`../CONVENTIONS.md § 7`](../CONVENTIONS.md#7-rich-content-field-rule)
- Translation conventions: [`../CONVENTIONS.md § 8`](../CONVENTIONS.md#8-translation-conventions)
- 18e load-bearing findings: [`../18e-projects/decisions.md § Amendments`](../18e-projects/decisions.md#amendments-2026-04-24) (AM1–AM6)
- 18e P-cascade probe: [`../18e-projects/research.md`](../18e-projects/research.md)
- Slice-18 design spec § 7.3 (18f scope sketch): [`../../../superpowers/specs/2026-04-24-slice-18-replan.md § 7.3`](../../../superpowers/specs/2026-04-24-slice-18-replan.md)
