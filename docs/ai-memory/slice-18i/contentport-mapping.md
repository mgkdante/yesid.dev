# ContentPort → schema source decision table (slice-18i Task 1.0)

The plan references "16 existing `content.*` methods to flip to Directus." The `ContentPort` interface
declares **18** methods post-cleanup. The reconciliation: `metroSvg` (flipped in 18d) and `morphShapes`
(flipped in 18f) are already Directus-backed and carry no changes in 18i. That leaves exactly 16 to flip.
`errorPage` is among the 16 — it is declared on the interface but currently a static stub; 18i gives it a
brand-new Directus implementation backed by the `error_pages` flat collection (spec §3.5).

Three methods — `skillsJourneyPanels`, `skillsJourneyCta`, and `metroBookends` — were dropped from
`ContentPort` in commit `55840c1` because zero Svelte components consumed them at the time of cleanup.

Detail-page ports (`/services/[id]`, `/projects/[slug]`, `/blog/[slug]`) are **not in this table** —
spec §1 L4 keeps them on the existing `ServicePort`, `ProjectPort`, and `BlogPort` detail ports.

---

## Decision table

| # | method | return type | source | slug | notes |
|---|--------|-------------|--------|------|-------|
| 1 | `hero` | `HeroContent` | `block_hero` field | `block_hero` | Main hero copy: headline lines, subheadline, subtitle, CTAs, SQL panel copy, refresh button copy |
| 2 | `heroAnim` | `HeroAnimContent` | `block_hero.hero_anim` JSON field | `block_hero` | Single field `{ scrollDown: LocalizedString }` — too small for its own block; lives as a JSON column on `block_hero` |
| 3 | `manifesto` | `ManifestoContent` | `block_manifesto` field | `block_manifesto` | Large nested shape (statement, terminal, pills, edgeLeft/Right/Bottom, transit, ticks, hiddenTransitLines) — own block row |
| 4 | `proofReel` | `ProofReelContent` | `block_proof_reel` field | `block_proof_reel` | heading/subheading/viewAllLabel/slugs/images — own block row |
| 5 | `servicesGrid` | `ServicesGridContent` | `block_services_grid` field | `block_services_grid` | heading/subheading/aria templates/viewAllLink — own block row |
| 6 | `about` | `AboutIntroContent` | `block_about_intro` field | `block_about_intro` | Home-page teaser only (name/title/bio/moreLink/stack/location/interests). Distinct from `aboutPage()` |
| 7 | `cta` | `CtaContent` | `block_cta` field | `block_cta` | heading/subtitle/ctaContact/ctaGithub — own block row |
| 8 | `closer` | `CloserContent` | `block_closer` field | `block_closer` | Large shape (heading, rows, terminal copy, attribution) — own block row |
| 9 | `navLinks` | `readonly NavLink[]` | flat collection `nav_links` | `nav_links` | Rows with `label`, `href`, `priority`, `placement` (header/footer/mobile enum). Already modelled in spec |
| 10 | `menuItems` | `readonly MenuItem[]` | flat collection `nav_links` | `nav_links` | `placement = 'menu'`; adds `subtitle` field. Same collection as navLinks, different placement value |
| 11 | `errorPage` | `ErrorPageContent` | flat collection `error_pages` | `error_pages` | Keyed by `status_code` UNIQUE. Fields: label, heading, description, terminalLine, suggestions (JSON array). Spec §3.5 |
| 12 | `aboutPage` | `AboutContent` | `block_about_content` field | `block_about_content` | Full /about page bento content (identity, metrics, methodology, testimonials, techStack, interests, weather, etc.) |
| 13 | `contactPage` | `ContactContent` | `block_contact_content` field | `block_contact_content` | Full /contact page (pageTitle, formTerminal, infoTerminal, validation, success, socials) |
| 14 | `techStackPage` | `TechStackPageContent` | `block_tech_stack_page_content` field | `block_tech_stack_page_content` | /tech-stack chrome (meta, hero, actions, cta copy) |
| 15 | `heroMock` | `HeroData` | derived from `content.hero()` — runtime computed | `block_hero` | `generateHeroData()` produces randomised STM metric data. No schema change; Directus adapter generates the same randomised payload at call time |
| 16 | `initialHeroData` | `HeroData` | derived projection — code constant | `block_hero` | `INITIAL_HERO_DATA` is a hardcoded stable snapshot for SSR/tests. Stays as a code constant; Directus adapter re-exports the same constant. No schema change |
| 17 | `metroSvg` | `string` | **already directus-backed since 18d** — no change in 18i | — | Source flipped in 18d Phase 8 to Directus `/assets/<uuid>`. Directus adapter: `fetchAssetSvg(assetId)` |
| 18 | `morphShapes` | `readonly MorphShape[]` | **already directus-backed since 18f** — no change in 18i | — | `morph_shapes` collection. Directus adapter already implemented in 18f |

---

## Resolved ambiguities (Step 3)

### `heroAnim` → `block_hero.hero_anim` JSON field

`HeroAnimContent` is a single-field object (`{ scrollDown: LocalizedString }`). It is hero-section chrome
that logically belongs with the hero block. Creating a standalone `block_hero_anim` collection for one
field would add schema overhead with no benefit. Decision: JSON column `hero_anim` on `block_hero`.
The static source (`heroAnimContent` in `site-content.ts`) is imported alongside `heroContent` — same
file, same section, same block.

### `heroMock` → runtime-computed, derived from `content.hero()`

`heroMock` calls `generateHeroData()` which produces randomised STM pipeline KPIs (vehicles, delay,
routes, query rows). This is a live-computed mock — it is NOT stored content. The Directus adapter
implementation will simply call `generateHeroData()` at request time, exactly as the static adapter does.
No Directus collection change needed. Annotated as "derived from `content.hero()`" because the consumer
(hero section) uses both `hero()` and `heroMock()` together; the hero block is the logical anchor.

### `initialHeroData` → code constant, derived projection

`INITIAL_HERO_DATA` in `hero-data.ts` is a hardcoded deterministic snapshot (`vehicles: 1247`,
`avgDelay: 47.3`, etc.) used for SSR to avoid hydration mismatch. It never needs CMS authoring. The
Directus adapter re-exports the same constant. No schema change, no new collection.

---

## Per-page block roster

The following shows which block collection rows each page's M2A junction will reference. Used by
Task 2.1's seed script. There are **12 block collections** in total.

### `home` (route `/`)

- `block_hero` (0–1)
- `block_manifesto` (0–1)
- `block_proof_reel` (0–1)
- `block_services_grid` (0–1)
- `block_about_intro` (0–1)
- `block_cta` (0–1)
- `block_closer` (0–1)

### `about` (route `/about`)

- `block_about_content` (0–1)

### `contact` (route `/contact`)

- `block_contact_content` (0–1)

### `tech-stack` (route `/tech-stack`)

- `block_tech_stack_page_content` (0–1)

### `blog` (route `/blog`)

- `block_blog_page_content` (0–1) — shape TBD, deferred to Task 1.4 per spec R2

### `projects` (route `/projects`)

- `block_projects_page_content` (0–1) — shape TBD, deferred to Task 1.4 per spec R2

### `services` (route `/services`)

No page-level block content currently — the services listing page is driven entirely by `ServicePort`.
If a page-chrome block is needed, it is out of scope for 18i.

---

## Page-chrome collections (not in M2A)

These are flat collections that apply site-wide, not per-page:

| Collection | Purpose |
|---|---|
| `nav_links` | Header/footer/mobile/menu link rows (`placement` enum) |
| `error_pages` | Error content keyed by `status_code` UNIQUE (spec §3.5) |

---

## Conventions for slice-18i implementers

- **`parsePort()` Zod gate**: Every `directusAdapter.content.X` method MUST wrap its return value in
  `parsePort('content.X', SchemaName, raw)` per `apps/web/src/lib/schemas/parse.ts`. No raw payload may
  leave the adapter without going through this gate. This is the 18c CONVENTIONS contract preserved.

- **Mocked + contract tests**: Every flipped method needs a mocked test in
  `apps/web/src/lib/adapters/directus.mocked.test.ts` and a contract test in
  `apps/web/src/lib/adapters/directus.contract.test.ts`, following the 18g/18h pattern.

- **Image fields use `asset()` helper**: Any field that returns an image URL must map raw Directus UUIDs
  through `asset(uuid, presetKey)` from `$lib/directus/assets`. Block fields holding images include (per
  current spec roster): `block_hero.image`, `block_proof_reel.items[].image`,
  `block_about_content.hero_image`. Adapters return CDN-shaped URLs, not bare UUIDs.

---

## Open follow-ups

1. **`block_blog_page_content` shape** — not yet defined. Deferred to Task 1.4 per spec R2. Task 1.4
   must specify fields before Task 2.1's seed script can create the row.

2. **`block_projects_page_content` shape** — same as above. Deferred to Task 1.4.

3. **`menuItems` vs `navLinks` in `nav_links` collection** — `MenuItem` has a `subtitle` field that
   `NavLink` does not. The `nav_links` schema needs a nullable `subtitle` column to accommodate both.
   Task 2.1 must include this in the snapshot diff.

4. **`heroMock` and `initialHeroData` deprecation path** — both currently live as code-computed values
   with no CMS backing. If a future slice wants to make the STM pipeline KPIs real (live Neon Postgres
   integration, phase noted in `hero-data.ts`), these methods will need a rethink. 18i carries them as
   pass-through constants; no action required now.
