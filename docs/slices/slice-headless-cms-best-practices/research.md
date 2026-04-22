# slice-headless-cms-best-practices — Research Notes

> Working notes accumulated across sessions. Each §R axis populated as the corresponding plan task runs. Sources cited inline. Promoted to `plan.md`'s FORMULA section only after Task 5 distillation.

**Spec:** [spec.md](spec.md)
**Plan:** [plan.md](plan.md)
**Status:** **Slice decided — PIVOT TO DIRECTUS (2026-04-22 evening, post-sleep).** §R1 + §R2 synthesis shipped (Tasks 1 + 2). §R3–R5 **superseded by pivot decision** — equivalent research for Directus lands in new slice `slice-directus-research`. See §Decision Outcome + §DNS & Infrastructure Migration Inventory below.

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

**Goal:** what makes an editor feel at home vs lost. Calibrated against REAL user reviews (Reddit, GitHub issues, G2, Capterra, Discord, HN, Dev.to, Medium), not vendor marketing.

**Sources studied:**
- Payload 3: docs + `templates/website/` + GitHub issues/discussions (30+ cited issues/discussions)
- Sanity: docs + G2 reviews (4.6 stars aggregate) + Sanity Answers forum + community posts
- Storyblok: docs + G2 (562 reviews, 4.4 stars) + Trustpilot + Lucky Media + Hygraph comparatives
- Strapi: docs + GitHub issues (admin perf, v4→v5 regressions) + ops-team blog critiques
- Prismic: docs + community forum + migration stories
- TinaCMS: docs + own engineering blog + GitHub issues (performance, inline-editing reality)
- WordPress Gutenberg: authoring-UX reference only

### §R2.1 — Payload authoring UX primitives (docs-grounded)

#### Live Preview (IT IS CORE, NOT A PLUGIN)

Previously mis-referenced as `@payloadcms/plugin-live-preview`. The correct picture:
- **Configuration:** `admin.livePreview` on root config or per-collection/global (`admin/livePreview.url` accepts string or resolver function)
- **Runtime:** admin renders an iframe; emits debounced `window.postMessage` events on form-state change; the frontend subscribes and re-renders.
- **Frontend packages:** `@payloadcms/live-preview` (framework-agnostic core: `subscribe`, `unsubscribe`, `ready`, `isDocumentEvent`, `mergeData`), `@payloadcms/live-preview-react`, `@payloadcms/live-preview-vue`. **No Svelte adapter.** Docs: *"In the future, all other major frameworks like Svelte will be officially supported."*
- **Svelte port recipe:** Vue composable (`packages/live-preview-vue/src/index.ts`) is ~80 lines; maps 1:1 to Svelte 5 runes (`ref` → `$state`, `onMounted` → `$effect`, `onUnmounted` → `$effect` return cleanup). For SvelteKit server-loaded pages, implement `RefreshRouteOnSave` as a `{#if browser}` component calling `invalidate()` or `invalidateAll()` instead of React's `router.refresh()`.
- **Popout mode:** toolbar button closes iframe, opens new window for free resize; closing re-opens iframe.
- **Breakpoints:** configurable device sizes (Mobile/Tablet/Desktop) as toolbar dropdown, plus "Responsive" and "Custom" (manual width/height).

#### Block field admin UX (empirical from website template)

- **Add-block flow:** drawer (not popover) with thumbnails (3:2 via `admin.images.thumbnail`); icon (20×20 via `admin.images.icon`) for Lexical slash menus.
- **Grouping:** `admin.group: 'Layout'` groups blocks in the drawer.
- **Block name:** each row has editable `blockName` (free-form editor label); hide with `admin.disableBlockName: true`; fully replace with `admin.components.Label`.
- **Reorder:** mouse drag on row handle. `admin.isSortable: false` disables. **Keyboard reorder UX undocumented — needs empirical test.**
- **Collapse/expand:** per-row toggle + field-level "Collapse All" action. `admin.initCollapsed: true` (website template uses this for `layout` blocks).
- **Copy-paste:** via `localStorage._payloadClipboard` — persists across browser tabs same-origin. **Cross-document works same-origin**; cross-field-type works **only if target field's blocks config registers the pasted block's type**. IDs regenerated on paste.
- **Paste Fields vs Paste Row:** documented warning — *"If you have copied a single block row and then use Paste Fields, ALL existing blocks in the target field will be replaced."*
- **Performance at 15+ / 50+ blocks:** **docs silent.** `initCollapsed: true` is the only performance hint.
- **Drawer search/filter at 40+ blocks:** **undocumented. Needs empirical verification.**

#### Conditional fields

`admin.condition: (data, siblingData, { blockData, operation, path, user }) => boolean` — full doc data, siblings, parent-block data, user context available. **Conditional tabs auto-switch when active tab hidden** (soft UX guarantee against stranding). Dynamic `admin.description` via `({ t }) => string` supports locale-aware copy. **BACKFIRE:** no "hidden fields indicator" — a hidden field is simply invisible, not grayed out. Mitigation: pair with `admin.description` on controlling field.

#### Array row labels (`useRowLabel`)

```tsx
'use client'
import { useRowLabel } from '@payloadcms/ui'
export const TestimonialRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ author?: string; quote?: string }>()
  return <div>{data.author ?? 'Testimonial'} — {data.quote?.slice(0, 40)}…</div>
}
```

Wired via `admin.components.RowLabel: '/path#TestimonialRowLabel'`. Shows meaningful labels ("Jane D. — Great service…") instead of "Row 3". **Significant editor clarity win for collapsed arrays.** Blocks fields do NOT expose `useRowLabel` directly — equivalents are `admin.components.Label` (custom component) or `admin.components.Block` (full row replacement); `blockName` is a free-form fallback.

#### Tabs + Groups + Drafts + Autosave

- **Tabs:** tab strip at top of doc. Named = data nested (`meta.title`), unnamed = flat. Website template: unnamed Hero / unnamed Content / named SEO (stored under `meta.*`).
- **Active-tab persistence across saves/reloads: undocumented. Needs empirical verification.**
- **Drafts UI:** `Save Draft` + `Publish` split buttons; three status badges (`Draft`, `Published`, `Changed`); top-right "Saved N seconds ago" indicator; per-doc (not per-tab) autosave.
- **Autosave interval:** 800ms default; website template uses 100ms for live-preview fluidity — ~10 saves/sec while typing. Untested at team scale.
- **`Schedule Publish`** requires an active Payload Jobs queue — **silent no-op without one**.
- **Restore:** revert-to-published on changed docs; Versions view for arbitrary historical restore.

#### Lexical rich text + `BlocksFeature`

- **Toolbars:** `FixedToolbarFeature` (persistent above editor) + `InlineToolbarFeature` (floating on selection).
- **Slash commands:** every Feature contributing a block/heading/format adds an entry.
- **`BlocksFeature`:** two modes — **block-level** (full-line blocks in rich-text flow) + **inline blocks** (flow within paragraphs). Data stored *inside* Lexical JSON as `{type: "block", version: 2, fields: {...}}`.
- **Custom block presentation via `admin.components.Block`:** replaces default collapsible UI with visual preview. Composable primitives from `@payloadcms/richtext-lexical/client` — `BlockCollapsible`, `BlockEditButton`, `BlockRemoveButton`, `InlineBlockContainer`, `InlineBlockLabel`.

#### Relationship field ergonomics

- Default: autocomplete dropdown. `admin.appearance: 'drawer'` → drawer picker.
- `admin.allowCreate: true` + `admin.allowEdit: true` enable inline create/edit of target docs from the relationship field (major ergonomics win vs context-switching).
- **NO documented inline preview of referenced doc content** — field shows `admin.useAsTitle` value only. For a full inline preview (e.g., show the testimonial text), build a custom `Field` component that fetches via Local API.

### §R2.2 — Cross-CMS UX patterns (steal vs avoid)

From the comparative agent's findings on Sanity Studio V3 Presentation, Storyblok Visual Editor, WordPress Gutenberg (as authoring-UX reference only).

#### STEAL for Payload (buildable via `admin.components.*`)

1. **Sanity's stega overlay + click-to-edit.** Zero-width Unicode source-map characters encoded in rendered strings; `enableVisualEditing()` on frontend draws click-to-edit overlays on every text element; clicking navigates Studio to the corresponding field "even deep within a Portable Text block." **Portable to Payload** via custom Field components emitting `data-payload-*` attributes and a preview iframe that reads them. Highest-value UX primitive from the comparative research.

2. **Sanity's `preview.prepare` with `{title, subtitle, media}`.** Richer than Payload's `RowLabel` (Payload gives one label; Sanity gives three slots + media). Buildable in Payload as a custom `RowLabel` component that renders computed title + subtitle + thumbnail from sibling fields.

3. **Gutenberg's Block Breadcrumb.** Persistent "Group > Columns > Column > Paragraph" path at the bottom of the canvas — kills the Storyblok 3-level nesting wall. Cheap to build as a custom array/blocks header that walks the document path.

4. **Gutenberg's synced-pattern purple icon badge.** Visual sync/local indicator on referenced relationships — "Editing this pattern will also update anywhere it is used." Simple Field wrapper around the relationship that shows the badge.

5. **Storyblok's block screenshot on block selection.** Low effort; shows an editor the block's rendered appearance while editing it. Buildable via custom `admin.components.Block`.

6. **Liberal use of `admin.condition`** — Payload already has it. Progressive disclosure reduces cognitive load without sacrificing schema rigor.

#### DO NOT adopt

1. **Gutenberg's inline-text-editing of rendered DOM.** Tightly couples editor state to frontend markup (the `wp-block-*` DOM-pollution problem). Our headless boundary is structurally cleaner.

2. **Storyblok's floating-pane nested editing past level 2.** Breaks wayfinding; no persistent nesting breadcrumb. Better approach: full-pane navigation + block breadcrumb.

3. **Slash-insert for large block libraries.** Works only when editors know block names. Discoverability is poor. Optional for power users, never primary.

4. **Storyblok's "screenshot on selection only."** Hurts inserter discovery at scale. If we ship thumbnails, surface them **in the inserter grid**, not on selection.

5. **Gutenberg's strict toolbar/inspector split for simple fields.** Adds chrome without payoff when fields are few. Adopt only when a block has both contextual (alignment, formatting) and structural (data) controls.

### §R2.3 — Payload real user sentiment (production ground truth)

This is the calibration layer. Vendor docs say Payload has "the best admin experience of any CMS." User evidence says otherwise — with specifics.

#### Editor UX reality

- **"Cold and confusing" out of box.** JNext Services retrospective: *"Payload's admin UI is clean and fast for developers, but for editors, marketers, or content creators it can feel cold and confusing, with no native block builder, no live preview, and very little hand-holding"* ([JNext Services](https://medium.com/@jnextservices/why-most-teams-fail-their-first-payload-cms-project-f24730cba13f)). Lists "forgetting about the content team" as the #2 reason first Payload projects fail.
- **Capterra / G2:** *"dashboard UI can be a little underwhelming for users first trying the product"* (Jay H., CEO). Sandro W.: basic features missing — *"bulk upload, display where media elements are used across the system."*
- **Internal admin design discussion** ([#5181](https://github.com/payloadcms/payload/discussions/5181)): users themselves call the interface *"a bit too cluttered and strenuous on the eyes"*; ReactSelect dropdowns have *"adaptability and performance issues, and its styling and UX differs from the Popup component which is also essentially a dropdown."*
- **ACCESSIBILITY FAILURE** — critical. Issue [#8653](https://github.com/payloadcms/payload/issues/8653): Lexical rich-text editor traps keyboard focus. Tab is used for indents; escape removes all focus. With two Lexical editors on a page, fields between them are UNREACHABLE by keyboard.
- **Vs competitors:** Makers' Den: *"Storyblok wins for visual editing, while Payload is better for speed and tailored workflows… Payload uses a clean, fast form-based interface and has no visual preview by default (can be custom-built)."* Sanity has real-time collaboration; Payload doesn't.

#### Developer experience reality

Payload's strongest zone. Strapi→Payload migrations are overwhelmingly positive. Discussion [#7468](https://github.com/payloadcms/payload/discussions/7468): Strapi docs *"a true maze,"* Strapi TypeScript *"poor,"* Strapi plugins *"pain + poorly documented."* Payload: *"type completion"*, *"repeatable block management."*

But the 40-hour Payload 3 beta review ([MouCZnik](https://medium.com/@moucznik6/i-tried-payload-3-0-beta-for-40-hours-so-you-dont-have-to-34fa83a304fd)) names Lexical *"the weakest link"*; *"adding a YouTube embed component requires over 45 minutes"*; docs *"scarce… examples from three months prior are already outdated"*; *"cryptic errors: p.t.s is undefined in jgk.js:3463335."*

**TypeScript regeneration pain:** Discussion [#225](https://github.com/payloadcms/payload/discussions/225) — relationship fields typed as `entity | string`; users *"remove the 'string |' part from the generated file and fix it every time they regenerate."*

#### Blocks field at scale (CRITICAL)

- Discussion [#12099](https://github.com/payloadcms/payload/discussions/12099): *"I'm experiencing memory leaks when running a project with a lot of blocks and blocks fields"* — attributed to table-per-block Postgres architecture. Developer implemented workaround *"using virtual blocks fields paired with hidden JSON fields and hooks"* — acknowledged introducing database inconsistency with relationship fields inside blocks.
- **Block References (3.60.0) was the FIX** — first-class reference-by-slug to avoid config inflation. This is Payload's own admission that the prior architecture didn't scale cleanly.
- Issue [#10070](https://github.com/payloadcms/payload/issues/10070): blocks enter infinite loading state when added. Fragile UX at scale.

**Implication for FORMULA:** cap the block library. Use `blockReferences` from the start when a block is used in 3+ parents. Design against the tax; don't let "we'll just keep adding blocks" become the pattern.

#### Live Preview with SvelteKit — REAL PROBLEMS

- Issue [#7164](https://github.com/payloadcms/payload/issues/7164): Chrome throws *"Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('http://localhost:3000') does not match the recipient window's origin ('http://localhost:3030')"* — even with `serverURL`, `cors` configured correctly. **Closed as not planned.**
- Issue [#10781](https://github.com/payloadcms/payload/issues/10781): *"Despite the changes being saved, the live preview does not reflect them in real-time"* — works on official template, fails in user implementations.
- Discussion [#687](https://github.com/payloadcms/payload/discussions/687): `@etmartinkazoo` confirms *"We have two production apps using PayloadCMS with Svelte for the frontend right now"* — BUT working setups use *"splitting it up on another node server running on 3001"* in dev, merging in production. Hot reload *"won't rebuild the Node server output"* under integrated approach. The `payload-kit` template exists but carries the hot-reload caveat.

**Implication for Q4 resolution (below):** Live Preview is TECHNICALLY testable with SvelteKit, but the integration is fragile — not the clean "iframe + postMessage" story docs suggest. Production-grade wiring requires split dev servers and manual Svelte composable.

#### Lexical issues (DON'T OVER-REACH)

- Issue [#6547](https://github.com/payloadcms/payload/issues/6547): Internal Link deep-populates the ENTIRE linked document. Request payloads balloon from ~300KB to 10-20MB, triggering build 504s. **Closed as not planned.**
- Combined with [#8653](https://github.com/payloadcms/payload/issues/8653) keyboard accessibility failure, Lexical is unsuitable for editor-heavy workflows (long-form multi-author content) until these land.
- **Implication:** for yesid.dev and small-client sites, Lexical-with-BlocksFeature is fine for short-form bodies. Avoid deep internal-link graphs in Lexical. Never ship Lexical-heavy authoring to clients with accessibility requirements until [#8653](https://github.com/payloadcms/payload/issues/8653) is fixed.

#### Version upgrade pain

- Issue [#10512](https://github.com/payloadcms/payload/issues/10512): upgrading **3.1 → 3.16** hit *"mongoose errors at runtime"* + *"payload command errors on cli."* Filed request for per-release breaking-change docs — no resolution. Payload's official position: 3.x has no breaking changes. Lived reality differs.
- Issue [#13146](https://github.com/payloadcms/payload/issues/13146): 3.46.0+ broke media-doc updates in production Docker+MinIO setups. *"fetch failed"* on any post-create update.
- **Synced-version requirement:** *"all versions of Payload core packages and plugins must be synced"* in v3 (unlike v2). Forces atomic upgrade of the whole package graph.
- **Implication:** pin minor versions in production, test upgrades against a staging schema clone BEFORE deploying. Never upgrade on Friday.

#### Deployment + cost reality

- **Vercel + Neon + Blob floor:** Matija pricing study — *"typical cost for Payload on Vercel is $20-60/month… Heavy editor usage can push costs above $100/month."* Vercel serverless *"cold starts, connection pool churn, and tighter runtime limits for admin-heavy work, with risks of Postgres connection exhaustion and bulk operations hitting timeout ceilings."*
- **VPS floor:** Hetzner self-hosted Postgres *"under EUR 10/month"*.
- **Payload Cloud:** paused for new signups since Figma acquisition (June 2025). Forces every new project to decide among Vercel/Railway/Fly/Hetzner.
- **Admin slow in production:** Issue [#7493](https://github.com/payloadcms/payload/issues/7493) — *"admin panel is much faster in my localhost and really slow in production"* (Vercel+Vercel Postgres+Blob on v3-beta.71). Closed without documented fix.
- **Production config gaps:** Discussion [#2288](https://github.com/payloadcms/payload/discussions/2288) lists PORT env, `PAYLOAD_PUBLIC_*` env-var passing in CI/CD, `serverURL` config — all not production-ready out of box. Forces *"separate Dockerfiles per environment, exposing sensitive configuration to version control."*

#### Enterprise-only gates (important for freelance positioning)

- **SSO is enterprise-paywalled.** Small non-profit called this *"really a blocker"* — core security behind paywall.
- **Visual Editor is enterprise-only** (per Discussion [#12843](https://github.com/payloadcms/payload/discussions/12843)).
- **Figma acquisition 2-3-year sustainability concerns** (also [#12843](https://github.com/payloadcms/payload/discussions/12843)): top-voted concern *"will the OSS community continue to retain users after 2-3 years, or will they move to SaaS?"*

### §R2.4 — Cross-CMS real user sentiment (comparative ground truth)

#### Sanity

- **Editor UX lived reality:** "Client opened Sanity Studio and immediately noped out" is the recurring Reddit quote ([ContentZen deep dive](https://medium.com/@contentzen/what-headless-cms-users-really-care-about-in-2025-a-reddit-deep-dive-with-notes-from-contentzen-2e61b18b8b68)). G2 4.6/5 developer-weighted; non-technical reviewers complain directly. Roboto Studio thesis: *"editors describe the experience as 'harder than Contentful' … because no one invested in making it great for them."*
- **Portable Text crashes in production** with concurrent editing. Newspaper team: *"editor crashes preventing document loading, input delays where initial characters don't appear, syncing toasts stacking, and content being lost to CORS/page reloads during peak collaborative editing"* ([Sanity Answers](https://www.sanity.io/answers/problems-with-rich-text-editor-in-production-for-digital-newspaper)).
- **Bill shock on bandwidth:** image-heavy sites *"only take about 1500 visitors to exceed the bandwidth cap"* at $0.20/GB overage. Studio makes *"lots of API calls when editing"* — burn through API usage inadvertently.
- **Marketing-vs-reality gap:** "Editors love it" ≠ lived reality. "Developers love it" is the honest claim.

#### Storyblok

- **Editor happiness IS structural** (562 G2 reviews, 4.4 stars, 57 citations of "intuitive visual editor"). Only CMS in the 5 where non-technical adoption is structural, not implementation-dependent.
- **Nested blocks UX wall at depth 3** — confirmed by Lucky Media 2026 review + Hygraph marketing against it.
- **Pricing outrage loudest here** — *"raising pricing 2.2x without a justified reason"* (Trustpilot); *"3x what they were paying a few months ago"* (G2). Teams→Business plan replacement (Nov 2025) triggered fresh migration wave.
- **Blok/Story taxonomy confuses new editors** — first-session onboarding cliff. Dev still needed to explain the schema.

#### Strapi

- **Admin panel DDoS's its own API** after 2 days uptime ([#24994](https://github.com/strapi/strapi/issues/24994)).
- **90-second Content Manager requests post-v5 upgrade** ([#25200](https://github.com/strapi/strapi/issues/25200)).
- **v4→v5 migration can corrupt draft media morphs** ([#25542](https://github.com/strapi/strapi/issues/25542)) — real data-loss vector.
- **UI-builder schema bypasses git review** — ops pain. Payload's schema-as-code is structural win.

#### Prismic

- **Slice Machine DX called "terrible"** vs competitors on Reddit. Community forum: *"many, many questions about Slice Machine"* with *"really confusing"* communication.
- **Preview reliability:** *"autosave is constantly kicking in and making everything really laggy"* + *"previews take 25-60 seconds to load"* on Gatsby.
- **Pricing:** Jan 2024 hike caused *"100–2000% increases when migrating between plan tiers"*.
- **Editor simpler than Sanity/Payload** — but layouts constrained to slices devs have published (can't invent new layouts).

#### TinaCMS

- **Inline editing admitted not production-ready by Tina themselves** — *"plans to introduce changes to minimize and even eliminate additional markup inserted by inline editing components."* 800-900KB bundle; Firefox FPS drops to 0.23 while typing.
- **Git-only breaks at scale** — Tina engineering acknowledges they now run Level.js data layer alongside git. Fit: JAMstack blogs, docs sites, portfolios. Not brand sites with 10+ editors.

#### Cross-CMS insights for OUR FORMULA

1. **Editor happiness correlates with developer INVESTMENT, not CMS choice** — except Storyblok, where it's structural. Every other CMS (including Payload) needs a dev-week of admin customization before editors stop escalating tickets.
2. **Localization is nobody's bright spot.** Every team re-invents patterns. Pick one approach per project, commit, write the ADR.
3. **Usage-based pricing creates bill shock; per-seat pricing creates grumbling.** Neon + Blob + Vercel egress must be metered from day 1.
4. **Migrations are THE data-loss vector.** Non-destructive upgrade patterns (dry-run + shadow writes + version columns) belong in the FORMULA.
5. **Concurrent-edit durability must be tested.** Sanity's PT crashes in high-concurrency newspaper prod = cautionary tale. For yesid.dev (single editor, low-concurrency) this is less urgent; for client sites with multi-editor teams, it's critical.

### §R2.5 — Ergonomics checklist for the FORMULA

Calibrated against docs + real-user sentiment. These rules codify "shipped defaults" — Payload doesn't give them to you out-of-box, but a FORMULA-compliant CMS setup DOES.

- [ ] **Every field has `admin.description`.** No bare fields. Editor needs to know what to write.
- [ ] **Every array/blocks field has a computed RowLabel / Label / Block component.** No "Row 3" — always meaningful ("Jane D. — Great service…").
- [ ] **`admin.condition` used liberally** for progressive disclosure — ALWAYS pair with `admin.description` on the controlling field ("Toggle this to reveal X") to counter the no-hidden-fields-indicator gotcha.
- [ ] **Block library capped at ~12–15 named blocks.** Past that, drawer discovery degrades (the R1 "inserter ceiling"). Use `blockReferences` from day 1 for DRY.
- [ ] **Block thumbnails populated** for every block (`admin.images.thumbnail` 3:2; `admin.images.icon` 20×20 for Lexical). Editors see visuals, not just names.
- [ ] **Block grouping** via `admin.group` (e.g., "Layout", "Media", "Text") so the drawer doesn't flatten into a long list.
- [ ] **Drafts + autosave enabled from day 1** on every editor-facing collection. Migration cost of retrofitting is real.
- [ ] **Autosave interval set to 800ms default** (not 100ms) for non-live-preview collections. Reduces write pressure.
- [ ] **`versions.maxPerDoc: 0`** for infinite audit trail OR explicit cap if compliance demands pruning.
- [ ] **Pages-as-collection pattern for 2+ unique pages** (per Q3). True singletons (`site-meta`, `nav-links`, `error-pages`) stay as globals.
- [ ] **Tabs structure on pages:** Hero / Content (blocks[]) / SEO — matches website template.
- [ ] **Preview route exists** before Live Preview is enabled — iframe URL points to a real SvelteKit route.
- [ ] **CSP `frame-ancestors`** whitelists admin origin. Documented as live-preview gotcha.
- [ ] **CORS + CSRF** arrays configured for cross-domain admin↔frontend setup.
- [ ] **Localization:** field-level `localized: true` inside blocks (per Q5). Do NOT flip localization on existing data without migration plan.
- [ ] **Lexical constrained** to short-form content initially. Long-form concurrent editing = test via load script before shipping to editors. Avoid deep internal-link graphs (request-size blowup).
- [ ] **No bare relationship fields for content chunks** — either show `admin.useAsTitle` enhanced with `admin.allowCreate`/`allowEdit`, OR custom `Field` component fetching inline preview, OR dedicated Lexical block with custom `admin.components.Block`.
- [ ] **Stega-style overlay** (future enhancement, not day-1) — port the Sanity pattern onto Payload Live Preview for click-to-edit from frontend.
- [ ] **Block breadcrumb** (future enhancement) — custom array/blocks header walking the document path. Kills the nesting wall before it arrives.
- [ ] **Version-upgrade discipline:** pin minor versions in production; test upgrades against staging schema clone; never upgrade on Friday.
- [ ] **Meter bandwidth + API calls** from day 1 via internal dashboard. Usage-based egress is the silent killer (Sanity cautionary tale).

### §R2.6 — Q4 resolution (Live Preview testability)

**Q4: Does Payload Live Preview require a published SvelteKit route before it's testable, or can we wire it against a dev-only route?**

**Resolved: dev-only routes work, but SvelteKit integration is FRAGILE in reality.**

Technical answer from docs: `admin.livePreview.url` accepts any URL. A dev-only SvelteKit route (e.g., `/preview/[collection]/[slug]?token=...`) absolutely works for the iframe. The admin emits debounced `postMessage` events; the frontend subscribes via `@payloadcms/live-preview` primitives; `mergeData()` populates relationships; re-renders happen.

**BUT the real-world picture is messier:**

1. **No Svelte adapter.** Must port the Vue composable (~80 lines) or the payload-kit template.
2. **Cross-origin `postMessage` fails silently** in production-style setups (Issue [#7164](https://github.com/payloadcms/payload/issues/7164) — even with `serverURL` and `cors` configured correctly) — closed as "not planned."
3. **Split dev servers required** per [#687](https://github.com/payloadcms/payload/discussions/687) — one port for CMS API, another for the SvelteKit preview, merged in production.
4. **Hot reload caveat** — the `payload-kit` template doesn't cleanly rebuild Node server output on changes.
5. **[#10781](https://github.com/payloadcms/payload/issues/10781)** — even with correct wiring, Live Preview sometimes doesn't reflect changes.

**Recommendation for FORMULA:** Live Preview is **optional for v1** of each client project, not core. Ship structured-first editing with good `admin.description` + RowLabel + block thumbnails. Add Live Preview per-collection only for clients where editors explicitly request it AND we have budget for the Svelte composable port + split-server debugging.

For yesid.dev specifically: Live Preview is **nice-to-have**, not day-1. Matches the finding from §R2.4 that "inline/visual editing is optional polish" per TinaCMS + Sanity production lessons.

### §R2.7 — Sandbox findings (Live Preview wiring)

**Experiment scope (intentionally minimal):** Add `admin.livePreview` config to the CMS-UX worktree's Payload config. Verify the config shape typechecks. **DO NOT** attempt the full Svelte 5 composable port or run both servers to debug cross-origin postMessage. Those are follow-up-slice scope per §R2.6 recommendation — given Issue [#7164](https://github.com/payloadcms/payload/issues/7164) is closed as "not planned," chasing the wiring fix in-session would be a rabbit hole with uncertain ROI.

**Files changed (CMS-UX worktree, branch `slice-cms-ux-redesign`):**
- `src/payload.config.ts` — added `admin.livePreview` with:
  - **URL resolver function** (not static string) so different globals/collections route to different preview slugs. Handles: `globalConfig` → `/preview/global/{slug}`, `collectionConfig` → `/preview/{collection}/{data.slug}`, falls back to origin. Locale threaded through query param.
  - **Three breakpoints** — Mobile (375×667), Tablet (768×1024), Desktop (1440×900). Matches website-template shape.
  - **Env-driven origin** — `PAYLOAD_PUBLIC_FRONTEND_URL` env (falls back to `http://localhost:5173` for local dev). Ensures prod deploys don't hard-code localhost.

**Verification run:** `bunx tsc --noEmit` (project typecheck).

**Result: ✅ clean compile.** Only output was the same pre-existing `tsconfig.json(3,5)` baseUrl deprecation warning from Task 1 sandbox — unrelated. Payload 3.83.0's type system accepts the URL resolver function signature `(args: { data, collectionConfig, globalConfig, locale, req }) => string` without issue.

**What this verifies:**
- ✅ Config SHAPE is Payload-3-valid — the URL resolver function pattern compiles with Payload's type exports.
- ✅ Breakpoints shape compiles.
- ✅ Env-driven origin pattern works without TS errors.

**What this does NOT verify (and why):**
- ❌ End-to-end iframe loading — requires running `bun dev` in CMS-UX worktree with DB migrations applied. DB state isn't ready in sandbox.
- ❌ Cross-origin postMessage between Payload admin and SvelteKit preview — requires running both servers on different ports and wiring a custom Svelte composable. Issue [#7164](https://github.com/payloadcms/payload/issues/7164) evidence suggests this fails even with correct CORS — deferred to follow-up implementation slice.
- ❌ SvelteKit preview route itself — not built in this task. Scratch route would live at `src/routes/preview/[collection]/[slug]/+page.svelte` in the yesid.dev site worktree.
- ❌ `mergeData()` behavior under depth mismatch (Payload UX Gotcha #1).

**Conclusion for Q4:** Config-shape is testable today (✅). End-to-end Live Preview wiring to SvelteKit is KNOWN-FRAGILE (Issue [#7164](https://github.com/payloadcms/payload/issues/7164), Discussion [#687](https://github.com/payloadcms/payload/discussions/687)) and requires dedicated slice scope to resolve. FORMULA treats Live Preview as optional polish, not day-1 core.

**Commits in CMS-UX worktree:**
- `613579a` — `sandbox(slice-cms-ux-redesign): add admin.livePreview config for R2 Q4 verification` — landed on `slice-cms-ux-redesign` branch only, never merged.

**Cleanup policy:** Same as TestBlocks — stays on the sandbox branch indefinitely; never merged to main without a dedicated follow-up slice that adopts the Live Preview pattern properly.

---

## §R3 — Design tokens + theming in-CMS

*[Task 3, Session 2]*

---

## §R4 — CMS ↔ framework wiring

*[Task 4, Session 3]*

---

## §R5 — Recommendations for yesid.dev + custom/low-cost clients

**Superseded by pivot decision (2026-04-22).** The Payload-specific FORMULA originally planned here is moot. Equivalent distillation for Directus produced in new slice `slice-directus-research`.

---

## §Decision Outcome — PIVOT TO DIRECTUS (2026-04-22)

**Decision:** Migrate yesid.dev-cms from Payload 3.83.0 to Directus 11+.

**Reuse plan:** Same `yesid.dev-cms` repository — scorch Payload code from it, rebuild as Directus in the same repo.

**Preserve:** This slice's bundle stays forever as permanent research reference.

**Decision made after:** 6 parallel research agents across R1 + R2 + Task 2.5 (3-stack sanity-check) + Task 2.5b (Payload-vs-Directus head-to-head deep dive) + 2 WebFetches (directus.io/mcp, directus.io/docs/tutorials SvelteKit) + overnight reflection. See `decision-brief.md` for the full integrated synthesis Yesid slept on.

### Decisive factors

1. **Mobile/on-the-go admin:** Directus works on iPad + touch-aware; Payload admin breaks <768px — confirmed user-review evidence.
2. **SvelteKit live preview:** Directus has 7 official SvelteKit tutorials + `@directus/visual-editing` v2+; Payload has no Svelte adapter + archived community starter (`fcastrovilli/sveltekit-payload-3-starterkit` archived Nov 2025).
3. **Design is locked for near-term:** Blocks work deferred until post-launch. Payload's 10:1 block-feature-parity advantage (Agent I's core finding) weights to zero for the current scope window.
4. **"Procurement over scratch" values alignment:** Directus defaults ship 70% editor-ready; Payload's 22-item FORMULA checklist = building-from-scratch defensive customization (12-16 hrs/project). Directus equivalent = 3-4 hrs/project.
5. **MCP parity:** Directus MCP is native GA v11.13 (Nov 2025), all tiers, permissions-respecting. Removed the strongest "stay" anchor from my earlier analysis.
6. **Commercial trajectory:** Directus risk score 7.5/10 (independent, VC-funded, founder-led, 28→55 employees Jul 2024→Feb 2026) vs Payload 5/10 (Figma-acquired June 2025, Cloud paused, repositioning as "Figma CMS" backend with Next.js coupling tightening).
7. **Agent J admin UX verdict:** Directus 23/25 vs Payload 14/25 on 5-task editor test; 8/8 deep UX differentiators (revisions default-on, collaborative presence, global search, activity feed, keyboard shortcuts, mobile, file reverse-lookup, in-app onboarding).

### Residual Payload wins (acknowledged, accepted as costs of pivot)

- TypeScript DX — Payload's auto-regenerated `payload-types.ts` is best-in-class. Directus's community-tooled type-gen is looser.
- Blocks feature parity — Payload wins 10:1 on blocks specifically; reaccepted when blocks return to scope post-launch. Directus M2A + Editor.js block editor cover functional needs for simpler content models.
- Localization simplicity — Payload inline `localized: true` vs Directus's `_translations` junction tables (3× row count). Working en/fr/es will be re-expressed during migration.
- Email already wired — `@payloadcms/email-resend` live; Directus re-wire via Directus email adapter + Resend SMTP/API (same Resend account, same sender domain).

---

## §DNS & Infrastructure Migration Inventory

**For slice `slice-directus-research` (verify + confirm compat) and execution slices (execute flips).**

### Current DNS state (Payload production)

| Record | Type | Value | Owner |
|--------|------|-------|-------|
| `cms.yesid.dev` | A / CNAME | Vercel (Payload Next.js deploy) | Vercel |
| `cms.yesid.dev` | TXT | Resend DKIM DomainKey (`resend._domainkey` subdomain) | Resend |
| `cms.yesid.dev` | TXT | Resend SPF (`v=spf1 include:resend.com ~all`) | Resend |
| `_resend.cms.yesid.dev` | CNAME | Resend verification pattern (if applicable) | Resend |

### Target DNS state (Directus production, post-cutover)

| Record | Type | Value | Change |
|--------|------|-------|--------|
| `cms.yesid.dev` | A / CNAME | **NEW** — Directus host (Railway custom domain / Hetzner VPS IP / Directus Cloud CNAME — TBD in `slice-directus-research`) | **UPDATE** |
| `cms.yesid.dev` | TXT | Resend DKIM DomainKey | **KEEP UNCHANGED** |
| `cms.yesid.dev` | TXT | Resend SPF | **KEEP UNCHANGED** |
| `_resend.cms.yesid.dev` | CNAME | Resend verification | **KEEP UNCHANGED** |

**Why DKIM/SPF stay:** Directus uses same Resend account + same sender domain (`no-reply@cms.yesid.dev`). Email infrastructure is orthogonal to CMS backend. No DNS verification re-do required.

### Transition DNS state (parallel-run window, ~2 weeks)

Add BEFORE cutover:
| Record | Type | Value | Purpose |
|--------|------|-------|---------|
| `cms-legacy.yesid.dev` | A / CNAME | Vercel (Payload) — temporary escrow | Rollback target if Directus cutover fails |

Remove AFTER successful cutover + 2-week escrow:
- `cms-legacy.yesid.dev` A/CNAME — delete once Payload is archived

### Non-DNS infrastructure migration

| Component | Action | Notes |
|-----------|--------|-------|
| **Neon Postgres DB** | **KEEP** | Same DB; Directus can introspect Payload's schema OR we drop-and-rebuild fresh in same DB. Decision deferred to `slice-directus-research` (depends on: is 18b's schema shape salvageable under Directus, or cleaner to rebuild?). |
| **Vercel Blob (media)** | **KEEP or migrate** | Directus has a Vercel Blob storage adapter. Alt: migrate to Cloudflare R2 (cheaper at scale) or Directus Files (own storage). Decision in `slice-directus-research`. |
| **Resend API** | **KEEP** | Same API key, same sender domain, Directus wires via email adapter. |
| **Vercel deployment of Payload** | **Archive** | Keep running during parallel-run window (accessed via `cms-legacy.yesid.dev`); delete after escrow closes. |
| **Vercel env vars** | **Migrate** | New Directus host needs DATABASE_URL, RESEND_API_KEY, S3/Blob credentials, SECRET, PUBLIC_URL, etc. Directus uses env vars for config. |
| **GitHub Actions (type-sync)** | **Retool or skip** | Currently: (none yet — was planned for Slice 18c type-sync). Under Directus: SDK types are generated via `directus-sdk-typegen` or equivalent; may or may not need a GH Action. Decision in `slice-directus-research`. |
| **MCP (AI integration)** | **Replace plugin** | `@payloadcms/plugin-mcp` removed with Payload; Directus native MCP configured (v11.13 GA, included all tiers). Existing Claude Code `mcp__yesid-cms-prod__*` tool connection updated to point at Directus MCP endpoint. |
| **Payload monitoring** | **Delete** | Any Vercel-level monitoring on Payload deployment closed at cutover; replaced with equivalent on Directus host. |

### Pre-flight checklist for slice-directus-research

- [ ] Verify Resend DKIM+SPF records DO propagate to a new host's outbound email (they should — DKIM is domain-scoped, not host-scoped).
- [ ] Verify Neon Postgres allows connection pooling from new host (Railway / Hetzner / Directus Cloud).
- [ ] Confirm Directus MCP configuration with Claude Code (endpoint URL format, auth method).
- [ ] Decide: reuse Neon DB shape (introspect) vs fresh Neon DB (migrate content separately). Write ADR.
- [ ] Decide: keep Vercel Blob vs migrate storage. Write ADR.
- [ ] Decide: deployment host (Railway / Hetzner / Directus Cloud). Write ADR + pricing math.
- [ ] Confirm Directus's email adapter supports Resend. (If not, options: SMTP relay via Resend, custom hook.)

### Execution checklist for the execution slice (scorch + rebuild + cutover)

- [ ] Phase 4 (ops): provision new host; set env vars; deploy Directus.
- [ ] Phase 4 (DNS): add `cms-legacy.yesid.dev` CNAME pointing to current Vercel Payload.
- [ ] Phase 5 (MCP): swap `@payloadcms/plugin-mcp` → Directus MCP; update Claude Code `.mcp.json` if needed.
- [ ] Phase 6 (pre-cutover): run integrity tests on staging host.
- [ ] Phase 6 (cutover): flip `cms.yesid.dev` A/CNAME → Directus host. Monitor 24 hours.
- [ ] Phase 6 (rollback window): keep Payload on `cms-legacy.yesid.dev` for 2 weeks. Daily health checks.
- [ ] Phase 6 (close): after 2-week escrow, archive Payload code on a `payload-archive` branch; delete `cms-legacy.yesid.dev` DNS record; delete Vercel deployment.

---

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
| Q4 | Live Preview testability? | **Resolved:** dev-only SvelteKit routes work for the iframe URL (no published route required). BUT full end-to-end wiring is KNOWN-FRAGILE on non-Next frontends — Issue #7164 closed as "not planned"; Discussion #687 requires split dev servers. No `@payloadcms/live-preview-svelte` package exists; Vue composable (~80 lines) ports 1:1 to Svelte 5 runes. **FORMULA treats Live Preview as optional polish, not day-1 core.** Config-shape verified in sandbox commit `613579a`. | §R2.6 + §R2.7 (this task) |
| Q5 | Localization first-class in FORMULA? | **Resolved:** field-level `localized: true` inside blocks (not on blocks field itself) = shared layout, per-field translations. Matches 17c `LocalizedString` pattern, minimizes editor burden. Archetype exception: client-specific needs may localize the blocks field. | §R1 synthesis (this task) |
