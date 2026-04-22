# slice-headless-cms-best-practices — Research Notes

> Working notes accumulated across sessions. Each §R axis populated as the corresponding plan task runs. Sources cited inline. Promoted to `plan.md`'s FORMULA section only after Task 5 distillation.

**Spec:** [spec.md](spec.md)
**Plan:** [plan.md](plan.md)
**Status:** §R1 synthesis complete (Task 1, Session 1) — sandbox verification in progress

---

## §R1 — Content modeling patterns

**Goal:** When does each pattern (blocks / portable text / dynamic zones / singletons / globals-vs-collections / embedded-vs-referenced) earn its complexity? When does it add tax?

**Sources studied:** Payload 3 (primary — official docs + `templates/website/` reference implementation), Sanity, Storyblok, Strapi, Prismic, TinaCMS, WordPress Gutenberg (authoring-UX reference only).

### Payload 3

Primary primitives extracted from [payloadcms/payload `main` docs + `templates/website/`](https://github.com/payloadcms/payload).

#### Blocks field

`type: 'blocks'` stores an ordered array of heterogeneous objects. Each row chooses from a set of named `Block` configs; each Block has its own `fields` array + `slug`. Row shape: `{ blockType: <slug>, blockName?: <editor-label>, ...fieldData }`. [docs/fields/blocks](https://payloadcms.com/docs/fields/blocks)

- **Canonical use:** page-builder layouts (`Quote`, `CallToAction`, `Slider`, `Gallery`), form builders, event agendas with `Break | Presentation | BreakoutSession`.
- **Admin UX:** collapsible card per row, drag-handle reorder (`admin.isSortable: false` disables), `admin.initCollapsed` for large lists, thumbnails (3:2) in Add-block drawer, copy-paste via `localStorage._payloadClipboard`.
- **Nesting:** legal but not hard-limited in docs — blocks can nest inside arrays / groups / tabs / other blocks / Lexical rich text (via `BlocksFeature`).
- **Performance optimization:** `blockReferences` + root-level `buildConfig({ blocks: [...] })` — define once, reference by slug from parents, reduces client bundle bloat when the same block appears in 3+ parents.
- **Earns complexity when:** the document is a *layout* of mixed, reorderable sections, each with its own schema.
- **Adds tax when:** fixed shape (one hero + subtitle + CTA) — a group or tab panel is cheaper.

#### Array field

`type: 'array'` — homogeneous list, every row shares the same `fields` schema. [docs/fields/array](https://payloadcms.com/docs/fields/array)

- **When arrays beat blocks:** ONE repeating shape, no variation — image sliders, nav items, timeslots. Smaller config, no `blockType` discriminator, leaner SQL shape.
- **When blocks beat arrays:** the moment you need 2+ shapes in one list.

#### Group field

`type: 'group'` nests fields under a common `name`. Named group → `hero.media` in data. Unnamed group → visual grouping only, no data nesting. [docs/fields/group](https://payloadcms.com/docs/fields/group)

- **Canonical reuse pattern:** export a `Field` config, import into multiple collections. The website template does exactly this with `hero` (imported into multiple page types).
- **Earns complexity when:** multiple fields form a named atomic concept addressed together in code.
- **Adds tax when:** used as a "folder for fields" — an unnamed group gives the same visual benefit without API-path depth.

#### Tabs field

`type: 'tabs'` is presentational **unless** a tab has a `name` (then it behaves like a named group). [docs/fields/tabs](https://payloadcms.com/docs/fields/tabs)

- **Canonical use (per website template):** `Pages` collection with one Tabs field = three tabs: "Hero" (unnamed, flat) + "Content" (unnamed, holds the `layout: blocks[]`) + "SEO" (named `meta`, nests `meta.title/description/image`).
- **Beats groups when:** 20+ fields on one document → admin scroll pain.
- **Beats separate collections when:** document is conceptually one thing (a page) with multiple facets — one save, one version, one URL.

#### Globals vs Collections (decision-framework, DIRECT from docs)

- **Collections doc:** *"If your Collection is only ever meant to contain a single Document, consider using a Global instead."*
- **Globals doc:** *"If you have more than one Global that share the same structure, consider using a Collection instead."*

This is the definitive Q3 answer — see §Q3 resolution below.

#### Relationships — `relationship` vs `join`

`relationship` (forward ref by ID):
- `relationTo: 'posts'` or polymorphic `relationTo: ['users', 'organizations']`
- `hasMany: true` stores array
- **Critical gotcha:** polymorphic + hasMany stores `[{ relationTo, value }, ...]` — **you cannot query fields inside a polymorphic relationship**, only `.value` (ID) or `.relationTo` (slug). Non-polymorphic refs don't have this limit.

`join` (reverse/virtual):
- `on: 'category'` + `collection: 'posts'` — surfaces all posts whose `category` points here. No new data stored. Uses Mongo aggregations / SQL joins.
- **Unsupported** on DocumentDB / Azure Cosmos DB.
- **Schema principle (from docs):** store relationship info in ONE place. Post has `category`; category uses `join` to surface posts. Don't store post IDs on category.

#### Nested Docs plugin

`@payloadcms/plugin-nested-docs` adds `parent` + `breadcrumbs` (auto-populated recursively) for hierarchical pages like `/about/company/team`. Used by the official website template. [docs/plugins/nested-docs](https://payloadcms.com/docs/plugins/nested-docs)

- **Earns complexity:** true tree (docs site, product categories with subcategories).
- **Adds tax:** flat catalog of ~10 pages where a `slug` string is enough.
- **Gotcha:** `parent` / `breadcrumbs` must remain **top-level** — cannot live inside `group`, `array`, or `blocks`.

#### Versions & Drafts

- `versions: true` → every save writes to `_<slug>_versions` table. `maxPerDoc` default 100.
- `versions.drafts: true` → injects `_status: 'draft' | 'published'` + adds `draft` parameter to CRUD. **Subtlety:** `draft` controls validation (required fields bypassed) and write location (draft=true writes versions table only, main doc unchanged); `_status` controls publish state. They DON'T imply each other.
- `versions.drafts.autosave: { interval: 100 }` powers live preview in the website template — 100ms dirty flush writes new draft version.
- `schedulePublish: true` requires Payload Jobs queue.
- **Gotcha:** adding drafts to existing collection leaves old docs without `_status` — access control must tolerate `_status: { exists: false }` until all docs resaved.

#### Localization

`localization: { locales, defaultLocale, fallback }` at root config; field-level opt-in via `localized: true`. [docs/configuration/localization](https://payloadcms.com/docs/configuration/localization)

- Request: `?locale=es&fallback-locale=none` (REST), `locale: 'es', fallbackLocale: false` (Local API).
- `locale: 'all'` → returns field values as `{ en, es, de }` objects — used for migration scripts.
- **Blocks + localization:** `localized: true` at the blocks field level localizes the ENTIRE layout array — one full array per locale. DO NOT also mark nested block fields localized. See §Q5 resolution below.
- **Critical gotcha:** flipping `localized: true/false` on a field WITH existing data changes DB shape and CAN LOSE DATA. Plan migration.

#### Reusable content chunks — the Payload way

No first-class "custom field type" registry. The idiomatic patterns:

1. **Export a `Field` config** → import into multiple collections (website template does this with `hero`, `slugField()`, `linkGroup()`).
2. **Export a `Block` config with `interfaceName`** → generates one shared TS interface / GraphQL type.
3. **`blockReferences`** → define block at root config, reference by slug from parents — one source of truth, reduced bundle size.

#### Payload-specific gotchas

1. `unique: true` inside a block/array = **collection-wide** index, not per-doc. Use custom `validate` for per-doc uniqueness.
2. Polymorphic rel cannot be queried on nested field values — only `.value` / `.relationTo`.
3. Flipping `localized` on existing data → DB shape change, data loss possible.
4. Blocks-heavy configs bloat client bundle → use `blockReferences` when same block appears 3+ times.
5. `draft: true` on read returns LATEST version row, not specifically draft — gate unpublished via access control.
6. Join field unsupported on DocumentDB / Cosmos DB.
7. Nested-docs `parent`/`breadcrumbs` must stay top-level.
8. Block `slug` is the runtime discriminator (`blockType`) — renaming slug breaks every existing document. Use `labels.singular` / `labels.plural` for human-facing renames.
9. `versions.maxPerDoc` default 100 silently prunes — set `0` for infinite if compliance matters.
10. Admin block UX: **docs silent on hard upper bound** for block count per field. `initCollapsed: true` + `blockReferences` are the only documented mitigations. Treat "50 blocks" as empirical.

### Sanity (portable text + schema)

Key patterns from [sanity.io/docs](https://www.sanity.io/docs):

#### Portable Text

JSON-based rich-text AST. Array of typed blocks, each with `_type`, `_key`, `children` (spans), `marks`, `markDefs`, `style`. Different from HTML strings: *content is separate from markup*. Custom block types embed as inline objects alongside text blocks. Open spec at [portabletext.org](https://github.com/portabletext).

- **Earns complexity:** editorially rich long-form (articles, case studies, docs) with inline embeds mid-paragraph.
- **Adds tax:** short structured strings (headlines, CTA labels) — use plain `string` / `text`.

#### Object type

Reusable field bundles — define once in `schemas/objects/`, reference by `name` across documents. Canonical uses: `address`, `seo`, `cta`, `socialLinks`.

- Not storable as standalone documents; reused inline in other schemas.
- **Transferability:** universal — maps to Payload `group` + reusable Field exports, Strapi components.

#### Array type — polymorphic

`of: [...]` can contain multiple member types simultaneously — the primitive underneath Portable Text AND page builders:

```js
of: [
  { type: 'reference', to: [{ type: 'castMember' }] },
  { type: 'crewMember' } // inline object alongside refs
]
```

#### Singleton pattern (globals emulation)

Sanity has **no first-class globals**. Recipe ([Singleton Document](https://www.sanity.io/guides/singleton-document)):
1. Define normal `document` type (e.g., `settings`)
2. Structure tool: point list item at hardcoded id — `S.document().schemaType('settings').documentId('settings')`
3. Filter type from global "+ New" templates
4. Strip `duplicate`/`delete` from `document.actions`

Per-page uniques = one singleton each, repeating steps 2–4. **Four coupled config edits per global.**

#### Page builder pattern (canonical)

From the [official Sanity course](https://www.sanity.io/learn/course/page-building/create-page-builder-schema-types):

```ts
defineType({
  name: 'pageBuilder',
  type: 'array',
  of: [
    defineArrayMember({ type: 'hero' }),
    defineArrayMember({ type: 'splitImage' }),
    defineArrayMember({ type: 'features' }),
    defineArrayMember({ type: 'faqs' }),
  ],
})

// page doc: defineField({ name: 'content', type: 'pageBuilder' })
```

Per the course: **objects** = "simpler to query but trapped within the document"; **references** = "content can be reused, queries must resolve." Hero = inline object (unique per page); FAQs = reference (one doc reused across pages).

#### Localization

- **Field-level** (`@sanity/internationalized-array`) — one document, fields carry per-language values.
- **Document-level** (`@sanity/document-internationalization`) — unique doc per language joined by references.
- **Can coexist** — docs explicitly say "you may use both in a single project." They DON'T compose automatically; separate query codepaths.

#### Sanity-specific gotchas

- **Singleton enforcement is Studio-only, not API.** The Content Lake accepts a second `settings` document via mutation API — "singleton" is UI hiding, not integrity constraint.
- **Cross-dataset refs are Enterprise-only** with 5 sharp limits (no drafts, no GraphQL, no reverse lookup, no Create-New, plan gate).
- **Weak refs don't cascade** — returns `null` on dereference if target deleted.
- **Portable Text custom blocks embed object types by name** — renaming = content migration.
- **Schema leaks if reusable fields are registered as top-level types** — per NRK's principles doc, reusable helpers must COMPOSE into documents, not register as types themselves.

### Storyblok (nestable blocks + components)

From [storyblok.com/docs](https://www.storyblok.com/docs).

#### Three-way component split

`is_root` + `is_nestable` boolean flags on components determine role:

| Type | `is_root` | `is_nestable` | Role |
|------|-----------|---------------|------|
| Content type | ✓ | — | Becomes a Story (has URL, shows in content tree) |
| Nestable | — | ✓ | Only inserted inside a `bloks` field of a parent |
| Universal | ✓ | ✓ | Both — standalone AND embeddable |

- **Universal** canonical example: CTA — lives as standalone Story (marketing references it) AND drops inline on pages.
- **Transferability:** Payload forces a choice (Collection or Block). Storyblok's universal has no direct Payload analog.

#### Blocks field (`bloks`)

JSON key is spelled `bloks` (not `blocks`). Array of nestable/universal components. Configurable min/max counts + component whitelist.

- **Canonical use:** `Page.body: bloks[]` — editor composes sections via Visual Editor's `+` inserter.
- **Transferability:** high — same primitive as Payload blocks / Sanity page-builder array / Strapi dynamic zones.

#### Singletons — docs WARN against their own pattern

Canonical: `global/` folder with `global` content type + Stories for menu/footer/site-settings + References field with `Path to folder of stories` set to `global/`.

**But the same doc says:** *"Using this approach for components or sections that exist on every page (such as a header or footer) is something we would not recommend."* Guidance: fetch header/footer once at app-level, cache, don't reference from every page.

#### Nesting depth ceiling

Docs don't state a hard limit. [Structured Content](https://www.storyblok.com/mp/structured-content) marketing page: *"too much nesting can make management harder."* **Practical UX wall: 3 levels** because Visual Editor lacks block thumbnails/previews — at depth 3+ editors can't distinguish nearly-identical nested cards on reorder. Lucky Media review (2026): "deeply nested or dynamically composed layouts push against the visual editor's constraints."

#### Storyblok-specific gotchas

- Field key `bloks` (typo-prone vs `blocks`).
- 50-reference resolution ceiling → API flips shape from `rels` to `rel_uuids` at >50 resolved.
- `resolve_relations` syntax: `componentName.fieldName` (not a field path).
- Visual Editor has no block thumbnails → practical nesting wall at ~3 levels.
- Globals pattern officially warned against for header/footer.
- Folder moves change slugs → change URLs → no auto-redirect handling.

### Strapi — Dynamic Zones (comparative reference)

From [docs.strapi.io](https://docs.strapi.io):

- **Dynamic Zones:** `"type": "dynamiczone"` field accepting array of mixed component types with per-zone component whitelist.
- **Components:** single (one nested object) or `repeatable: true` (array of that component). DZ = repeatable that accepts multiple different types.
- **Content Types vs Single Types:** `kind: "collectionType"` (many entries) vs `"singleType"` (one entry — first-class singleton, unlike Sanity/Payload-globals).
- **Relations:** `oneToOne` / `oneToMany` / `manyToOne` / `manyToMany` + polymorphic `morphToOne` / `morphToMany`.
- **Distinguishing feature:** per-zone whitelist (same component, different zones, different allowed neighbors); GraphQL resolves DZ as union type (`__typename` fragments required); Strapi 5 dropped shared-populate strategy.
- **Transferability:** Dynamic Zone = Payload blocks = Storyblok nestable components = Sanity page-builder array. The concept is universal; the terminology is Strapi-specific.

### Prismic — Slices + Slice Machine (comparative reference)

From [prismic.io/docs](https://prismic.io/docs):

- **Slice:** named, reusable section component with `primary` fields + optional `variations` (alternate field sets). Content API serialization: `{ id, slice_type, variation, primary, items }`.
- **Slice Machine:** local-first workflow. Developers model Slices in a local UI (running via `npx start-slicemachine --open` from inside the frontend repo), schemas write to `slicemachine.config.json` + generate TS types, then push to Prismic cloud.
- **Custom Types:** `kind: Single` (first-class singleton like Strapi) or `Repeatable`.
- **Page Builder / SliceZone:** page Custom Type has `slices: SliceZone`; frontend: `<SliceZone slices={page.data.slices} components={components} />`. Component map pairs `slice_type` strings to render components.
- **Distinguishing feature:** schema-as-code git-reviewable workflow + bidirectional Environment sync (paid). The Slice primitive itself = blocks elsewhere; the local-first authoring is Prismic's contribution.

### TinaCMS — Templates + inline editing (comparative reference)

From [tina.io/docs](https://tina.io/docs):

- **Templates:** TinaCMS's block equivalent. Named, typed field groups as array with `list: true` + `templates: [{ name, label, fields }, ...]`.
- **Inline editing:** THE differentiator. Editor loads live site wrapped in `<TinaCMS>`, clicks on text directly in rendered frontend, edits in sidebar with real-time preview.
- **Schema as code + git-backed content:** `/tina/config.ts` defines schema; content persists as Markdown/MDX/JSON in repo.
- **vs Decap (Netlify CMS):** Decap = older/established, zero SaaS dependency, broad SSG support. TinaCMS = React/Next focused, visual/click-to-edit, Tina Cloud SaaS dependency.
- **Pattern transferability:** Templates-in-a-list = blocks elsewhere. Inline editing ORTHOGONAL in theory but CONSTRAINS modeling in practice — deeply nested relations / non-visual metadata awkward in WYSIWYG-first flow.

### WordPress Gutenberg — authoring-UX reference ONLY

From [developer.wordpress.org/block-editor](https://developer.wordpress.org/block-editor). **Not for adoption** — WordPress is explicitly out of our offering. Here as authoring-UX vocabulary.

- **Blocks:** core primitive (`core/paragraph`, `core/heading`, `core/columns`, etc.) + custom blocks via `block.json` + `edit`/`save` React components.
- **Block patterns:** predefined compositions (3-col "Feature grid", pricing section) — once inserted, blocks are independent, no source link.
- **Synced Patterns** (renamed from "Reusable Blocks" in WP 6.3): edit-once-propagates-everywhere. "Detach Pattern" forks locally.
- **Block variations:** one block → themed variants via attribute overrides. `core/embed` uses this for YouTube/Twitter/etc.
- **Block supports:** declarative capability flags in `block.json` → editor renders toolbars automatically (`align`, `color`, `spacing`, `typography`).

**UX patterns that transferred to headless CMSes:** block picker, block toolbar, inspector sidebar, inner-blocks nesting, slash `/` insert — all present in Strapi's Content Manager, Payload's admin, Sanity Studio, Storyblok Visual Editor.

**What DIDN'T transfer:** block variations + block supports as declarative flags; HTML-comment serialization (`<!-- wp:paragraph -->` inside `post_content`) — headless CMSes store structured JSON natively.

---

### Cross-CMS pattern map

| Pattern | Payload | Sanity | Storyblok | Strapi | Prismic | TinaCMS | Gutenberg |
|---------|---------|--------|-----------|--------|---------|---------|-----------|
| **Polymorphic section array** (the "blocks" primitive) | `blocks` field | `array` with polymorphic `of: [...]` (page-builder pattern) | `bloks` field | `dynamiczone` field | `SliceZone` | `object` `list: true` with `templates` | Blocks tree in `post_content` |
| **Fine-grained inline rich-text embeds** | `lexical` with `BlocksFeature` | Portable Text with inline objects | rich-text field (Prosemirror-based) with embeddable components | `richtext` with component embeds (limited) | `rich-text` with slice embeds | MDX with React components | Inline blocks |
| **Homogeneous array (one shape repeated)** | `array` field | `array` with single `of: [...]` member | `bloks` with single whitelisted component | repeatable component | `group` field | `list: true` without templates | (no direct equivalent) |
| **Reusable field bundle** | exported `Field` config + named `group` | `object` type | nestable component | component | Slice (but Slice = section-level) | `object` field shared in schema | Block pattern |
| **First-class singleton** | `globals` (first-class) | singleton pattern (doc + fixed id + Studio config surgery) | folder-based `global/` stories | `singleType` (first-class) | `Single` Custom Type (first-class) | single-file collection | Page template |
| **Reference by ID** | `relationship` + `hasMany` | `reference` + `weak` | References field (UUID) | `relation` (multi-variant) | Content Relationship | `reference` | (none — blocks are copy-by-value) |
| **Reverse/virtual join** | `join` field (server-computed) | query-side via GROQ | query-side via content-delivery API | `populate` at query | manual | manual | N/A |
| **Hierarchical tree (parent/child)** | `@payloadcms/plugin-nested-docs` | structure tool + custom parent ref | folder nesting | `hierarchical-content` plugin | custom parent field | `filename`-based paths | page hierarchy |
| **Drafts + published versions** | `versions.drafts` + `_status` | draft/published system (GROQ `drafts.<id>`) | story versions | `draftAndPublish: true` | built-in releases + drafts | git history | post status |
| **Autosave** | `versions.drafts.autosave.interval` | real-time by default | auto-save | preview drafts | built-in | on blur/save | auto-save every N seconds |
| **Scheduled publish** | `schedulePublish: true` (needs Jobs queue) | Releases (paid) | scheduled entries | Releases | Releases (enterprise) | via CI/git tags | post scheduled |
| **Schema location** | TS in repo, loaded at startup | TS in repo, loaded at Studio startup | UI-builder in admin (schema in cloud) | UI-builder admin OR schema.json in repo | Slice Machine — local TS, pushed to cloud | TS in repo, `/tina/config.ts` | `block.json` + PHP registration |

### Heuristics

Decision rules extracted from the patterns above. Apply when designing any Payload + SvelteKit project (yesid.dev + future custom/low-cost clients).

| Decision | Heuristic |
|----------|-----------|
| **Blocks vs flat fields** | Use `blocks` when the document is a **layout of mixed, reorderable sections**, each with its own schema. Use flat fields (group/tabs) when the structure is **fixed and non-reorderable**. Signal that blocks are wrong: you find yourself adding `if (blockType === 'X')` branches in the frontend render for every block type on every page. |
| **Blocks vs array** | `array` when ONE shape repeats; `blocks` the moment you need 2+ shapes in the same list. The cost of blocks over arrays is the `blockType` discriminator + richer admin UX surface — worth it for variation, wasted for uniformity. |
| **Globals vs pages-collection-with-blocks** | **Direct from Payload docs:** >1 global sharing the same structure → use a collection. 1 unique document that has no sibling structure → use a global. For yesid.dev's 9 page-globals with shared (hero + sections) structure, the collection pattern wins (see §Q3 resolution). True singletons like `site-meta`, `nav-links`, `error-pages` stay globals. |
| **Embedded vs referenced** | Embedded when the chunk is **unique to this page** (unique hero copy, one-off bento grid). Referenced when the chunk is **authoritatively owned elsewhere and quoted here** (a testimonial on the testimonials collection shown on the home page). Signal that you should flip embedded→referenced: you've copy-pasted the same content across 3+ documents. |
| **Group vs tabs vs separate collection** | Group when 2–5 related fields form one atomic concept (`seo: { title, description }`). Tabs when the single document has 3+ distinct concern-zones editors toggle between (Hero / Content / SEO). Separate collection when the thing has its own authoring lifecycle (blog posts get written separately from pages even though they share SEO needs). |
| **Nested docs plugin or not** | Only when you have a genuine tree (docs site, product categories with subcategories). A flat catalog of ~10 pages is better served by a `slug` string. The plugin's recursive breadcrumb update is valuable only if editors actually reorganize hierarchy. |
| **Polymorphic relationship — yes or no?** | Yes when one field legitimately points to multiple collection types (a `Reaction` that can attach to either a `Post` or a `Comment`). No when the alternative is to split into N typed fields — polymorphic relationships CANNOT be queried on nested field values (hard Payload limit). |
| **Lexical rich text vs Portable Text-style inline blocks** | Payload's Lexical with `BlocksFeature` is the right tool for "long-form article with inline embeds" — fine-grained. Payload's `blocks` is the right tool for "page-layout with mixed sections" — coarse-grained. Conflating them: using `blocks` for inline embeds (frustrating editor UX) or using Lexical for section composition (no reorder UX at the section level). |
| **Portable Text vs Payload Lexical** | Largely equivalent conceptually. Payload's Lexical integrates natively with Payload's admin and type generation; Portable Text is framework-agnostic (JSON AST, consumable by anything). If you're on Payload, use Lexical. Understand Portable Text only as intellectual vocabulary. |
| **Versioning + drafts** | Enable `versions.drafts: true` from Day 1 on any collection an editor uses — the migration cost of adding it later is real (old docs lack `_status`). Autosave interval: 100ms is the website-template default; lower values (30–50ms) push DB writes aggressively. |
| **Localization: field-level vs doc-level** | Field-level (`localized: true` per field) when content structure is identical across locales (most sites) — single document tree, field values are language-indexed. Doc-level (per-locale document) when whole documents diverge (different layouts per locale, culturally unique structures). Don't mix the two approaches in one project — query codepaths diverge. |
| **Schema as code vs schema in admin** | **Code-first wins for longevity.** Code-first (Payload, Sanity, TinaCMS) = PR-reviewable, diff-able, git-versioned, migrations tractable. UI-first (Strapi default, Storyblok) = short-term speed, long-term cross-environment drift. For freelance/portfolio work that will live 5+ years, code-first is load-bearing. Prismic's Slice Machine is a good middle — local-first code, explicit push to cloud, schema is still in git. |

---

### §Q3 resolution — globals vs pages-collection for yesid.dev

**Direct answer: flip 7 of yesid.dev's 9 page-globals into a `pages` collection. Keep 3 true singletons as globals.**

This is the explicit Payload-docs sanction:
- Globals doc: *"If you have more than one Global that share the same structure, consider using a Collection instead."*
- Collections doc: *"If your Collection is only ever meant to contain a single Document, consider using a Global instead."*

The official Payload [website template](https://github.com/payloadcms/payload/blob/main/templates/website/src/collections/Pages/index.ts) models every page as a doc in a `pages` collection with `slug` + Tabs (Hero / Content:blocks[] / SEO) + drafts + autosave + schedulePublish + livePreview + ISR revalidation hooks.

**Proposed mapping (preview of the refactor table in plan.md):**

| 18b Global | Shape assessment | FORMULA mapping |
|------------|------------------|------------------|
| `home-content` | page with hero + bento + marquee sections | → `pages` collection doc, `slug: "home"` |
| `services-page` | page-intro + section meta | → `pages` collection doc, `slug: "services"` |
| `projects-page` | page-intro + section meta | → `pages` collection doc, `slug: "projects"` |
| `blog-page` | page-intro + section meta | → `pages` collection doc, `slug: "blog"` |
| `tech-stack-page` | page-intro + section meta | → `pages` collection doc, `slug: "tech-stack"` |
| `about-content` | page with bio sections | → `pages` collection doc, `slug: "about"` |
| `contact-content` | page with contact form + copy | → `pages` collection doc, `slug: "contact"` |
| `nav-links` | site-wide nav structure | **stays global** (true singleton) |
| `error-pages` | 404 / 500 copy | **stays global** (true singleton, cross-page) |
| `site-meta` | site-wide SEO defaults | **stays global** (true singleton) |

Rationale per row detailed in Task 5's FORMULA refactor table.

**Q3 is RESOLVED.** Promote to spec's Amendments log.

---

### §Q5 resolution — localization treatment

**Direct answer: field-level localization (`localized: true`) on individual fields INSIDE blocks, NOT on the blocks field itself.**

Setting `localized: true` on a `blocks` field localizes the ENTIRE layout array — editors get one full array per locale. This means:
- Pro: locales can have genuinely different layouts (FR version reorders sections)
- Con: editors must maintain 3 separate block arrays; reordering/adding blocks requires triplicate work
- Con: any shared structural element (order of blocks) must be manually mirrored

Setting `localized: true` on individual fields INSIDE blocks:
- Shared layout across locales (edit once)
- Per-field translations (edit 3x for hero title, but hero position is shared)
- Matches yesid.dev's current approach with 17c's `LocalizedString` shape where en required + fr/es optional

**Recommendation for the FORMULA:** field-level `localized: true` on text fields inside blocks. Blocks field itself is NOT localized (layout order is universal). This preserves 18b's current model and minimizes editor burden.

**Exception:** if a specific client genuinely wants per-locale layout divergence, that client's project localizes the blocks field. This is an archetype-specific decision, not a universal FORMULA rule.

**Q5 is RESOLVED.** Promote to spec's Amendments log.

---

### Sandbox findings (Test_Blocks verification)

**Experiment:** added a throwaway `test-blocks` collection to `~/Yesito/Projects/yesid-dev-cms-ux/` (branch `slice-cms-ux-redesign`) with two Block configs (`Hero`, `TextSection`), each with `localized: true` fields, to verify Payload 3.83.0's schema-level behavior matches R1 research claims.

**Files added:**
- `src/collections/TestBlocks.ts` — new file defining `HeroBlock`, `TextSectionBlock`, `TestBlocks` collection
- `src/payload.config.ts` — collection import + registration (2-line diff)

**Verification run:** `bunx tsc --noEmit` (project typecheck)

**Result: ✅ clean compile.** Only output was a pre-existing `tsconfig.json(3,5)` warning about `baseUrl` deprecation in TS 7.0 — unrelated to the sandbox change. Payload 3.83.0's type system accepts:
- `Block` config exported as standalone (reusable across parents)
- `interfaceName` generating a shared TS interface per block
- `labels: { singular, plural }` per block (distinct from collection labels)
- `localized: true` on individual fields INSIDE blocks (per Q5 resolution)
- `admin.initCollapsed: true` on the blocks field
- `admin.group: 'Experimental'` on the collection (keeps sandbox separate from production nav)
- `admin.description` on the collection (renders under the collection title in admin)

**What the sandbox CAN'T verify from a typecheck alone:**
- Drag-reorder UX (requires running admin with DB migrations applied)
- Add-block drawer with thumbnails (requires `admin.images.thumbnail` + running admin)
- Copy/paste-row `localStorage._payloadClipboard` behavior
- Perf at 15-block / 50-block scale
- Live Preview wiring (§R2 concern)

**Honest calibration:** the typecheck confirms the schema SHAPE is Payload-3-valid. The admin UX claims in R1 come from Payload's primary docs (high confidence — they're the docs' own examples). Full runtime verification would require setting up the CMS-UX worktree's database + env vars + running a migration to add `test_blocks` table — out of scope for Task 1's sandbox budget. R2 (authoring ergonomics) will involve running the actual admin + exercising Live Preview against a scratch SvelteKit preview route, which is where drag-reorder and thumbnail UX get tested empirically.

**Cleanup policy:** the sandbox collection stays on the `slice-cms-ux-redesign` branch indefinitely. It is never merged. If a future slice legitimately adopts a Payload blocks pattern, that slice defines its OWN production collections from scratch based on the FORMULA — the TestBlocks experiment is discarded.

**Commits in CMS-UX worktree:**
- `67c14e1` — `sandbox(slice-cms-ux-redesign): add TestBlocks collection for R1 verification` — landed on `slice-cms-ux-redesign` branch only, never merged.

---

## §R2 — Authoring ergonomics

*[Task 2, Session 2]*

---

## §R3 — Design tokens + theming in-CMS

*[Task 3, Session 2]*

---

## §R4 — CMS ↔ framework wiring

*[Task 4, Session 3]*

---

## §R5 — Recommendations for yesid.dev + custom/low-cost clients

*[Task 5, Session 3 — distilled into `plan.md`'s FORMULA section]*

---

## Sources

### Payload 3
- [docs/fields/blocks](https://payloadcms.com/docs/fields/blocks) — Blocks field primitive, admin UX, `blockReferences`, gotchas
- [docs/fields/array](https://payloadcms.com/docs/fields/array) — Array field
- [docs/fields/group](https://payloadcms.com/docs/fields/group) — Group field (named vs presentational)
- [docs/fields/tabs](https://payloadcms.com/docs/fields/tabs) — Tabs field
- [docs/fields/relationship](https://payloadcms.com/docs/fields/relationship) — Relationships + polymorphic + gotchas
- [docs/fields/join](https://payloadcms.com/docs/fields/join) — Reverse/virtual joins
- [docs/configuration/collections](https://payloadcms.com/docs/configuration/collections) — Globals-vs-collections tip
- [docs/configuration/globals](https://payloadcms.com/docs/configuration/globals) — Globals-vs-collections reverse tip
- [docs/versions/overview](https://payloadcms.com/docs/versions/overview) — Versions
- [docs/versions/drafts](https://payloadcms.com/docs/versions/drafts) — Drafts + autosave + schedulePublish
- [docs/configuration/localization](https://payloadcms.com/docs/configuration/localization) — Localization
- [docs/plugins/nested-docs](https://payloadcms.com/docs/plugins/nested-docs) — Nested Docs plugin
- [templates/website/src/collections/Pages/index.ts](https://github.com/payloadcms/payload/blob/main/templates/website/src/collections/Pages/index.ts) — **CANONICAL** pages-collection-with-blocks reference implementation

### Sanity
- [Beginner's guide to Portable Text](https://www.sanity.io/docs/developer-guides/beginners-guide-to-portable-text)
- [Portable Text editor configuration](https://www.sanity.io/docs/studio/portable-text-editor-configuration)
- [Object type](https://www.sanity.io/docs/studio/object-type)
- [Array type](https://www.sanity.io/docs/studio/array-type)
- [Document type](https://www.sanity.io/docs/document-type)
- [Reference type](https://www.sanity.io/docs/studio/reference-type)
- [Singleton Document guide](https://www.sanity.io/guides/singleton-document)
- [Create page builder schema types](https://www.sanity.io/learn/course/page-building/create-page-builder-schema-types)
- [sanity-io/page-building](https://github.com/sanity-io/page-building) — template repo
- [Localization](https://www.sanity.io/docs/studio/localization)
- [Cross-Dataset References](https://www.sanity.io/docs/studio/cross-dataset-references)
- [How to structure your code repository in a Sanity project](https://www.sanity.io/blog/how-to-structure-your-code-repository-in-a-sanity-io-project)
- [nrkno/nrkno-sanity-libs — principles](https://github.com/nrkno/nrkno-sanity-libs/blob/master/docs/nrkno-sanity-principles.md)

### Storyblok
- [Blocks concept](https://www.storyblok.com/docs/concepts/blocks)
- [Content Modeling](https://www.storyblok.com/docs/concepts/content-modeling)
- [Content hierarchy — Space / Folder / Story / Block](https://www.storyblok.com/docs/editor-guides/content-hierarchy-space-folder-story-block)
- [References](https://www.storyblok.com/docs/concepts/references)
- [Datasources](https://www.storyblok.com/docs/datasources)
- [Internationalization](https://www.storyblok.com/docs/concepts/internationalization)
- [Fields](https://www.storyblok.com/docs/concepts/fields)
- [Creating global components and referencing them](https://www.storyblok.com/tp/global-components-references)
- [How to build relationships between 2 content-types](https://www.storyblok.com/tp/how-to-build-relationships-between-2-content-types)
- [Migrating AEM content structures to Storyblok](https://www.storyblok.com/tp/migrating-aem-content-structures-to-a-flexible-content-model-in-storyblok)
- [The Component Object — Management API](https://www.storyblok.com/docs/api/management/components/the-component-object)
- [Structured Content for the AI Era](https://www.storyblok.com/mp/structured-content)

### Strapi
- [Content-type Builder](https://docs.strapi.io/cms/features/content-type-builder)
- [Models](https://docs.strapi.io/cms/backend-customization/models)
- [GraphQL](https://docs.strapi.io/cms/api/graphql)
- [v4→v5 breaking change — populate strategy](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/no-shared-population-strategy-components-dynamic-zones)

### Prismic
- [Slices](https://prismic.io/docs/slices)
- [Slice Machine](https://prismic.io/docs/slice-machine)
- [Custom Types](https://prismic.io/docs/custom-types)

### TinaCMS
- [tina.io/docs](https://tina.io/docs)
- [Schema](https://tina.io/docs/schema)
- [Tina vs Netlify/Decap](https://tina.io/tinacms-netlifycms-comparison)
- [Decap vs Tina review (Lucky Media)](https://www.luckymedia.dev/compare/decap-cms-vs-tina-cms)

### WordPress Gutenberg (authoring-UX reference only)
- [Block editor fundamentals](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-in-the-editor/)
- [Block patterns](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/)
- [Block variations](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/)
- [Synced Patterns (formerly Reusable Blocks)](https://wordpress.org/documentation/article/reusable-blocks/)
- [Serialization parser](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-serialization-default-parser)

---

## Open questions — resolution log

| ID | Question | Resolution | Resolved in |
|----|----------|------------|-------------|
| Q1 | `research.md` separate from `plan.md`? | **Separate** (this file). Readability. | Session 1 |
| Q2 | FORMULA concrete vs heuristic? | *[Session 3, Task 5]* | — |
| Q3 | Globals vs pages-collection for pages? | **Resolved:** 7 page-globals → `pages` collection; 3 true singletons (`site-meta`, `nav-links`, `error-pages`) stay as globals. Official Payload website template sanctions the pattern. | §R1 synthesis (this task) |
| Q4 | Live Preview testability? | *[Session 2, Task 2]* | — |
| Q5 | Localization first-class in FORMULA? | **Resolved:** field-level `localized: true` inside blocks (not on blocks field itself) = shared layout, per-field translations. Matches 17c `LocalizedString` pattern, minimizes editor burden. Archetype exception: client-specific needs may localize the blocks field. | §R1 synthesis (this task) |
