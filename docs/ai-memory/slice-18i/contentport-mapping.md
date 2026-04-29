# ContentPort → schema source decision table (slice-18i Task 1.0)

The plan references "19 existing `content.*` methods to flip to Directus." The `ContentPort` interface
actually declares **21** methods. The reconciliation: `metroSvg` (flipped in 18d) and `morphShapes`
(flipped in 18f) are already Directus-backed and carry no changes in 18i. That leaves exactly 19 to flip.
`errorPage` is among the 19 — it is declared on the interface but currently a static stub; 18i gives it a
brand-new Directus implementation backed by the `error_pages` flat collection (spec §3.5).

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
| 9 | `skillsJourneyPanels` | `readonly JourneyPanel[]` | `block_journey_panel` O2M sub-rows | `block_journey_panel` | Each panel = one row (id, label, text, highlightWords, highlightEffect, skills[]). 4 panels currently. O2M off the home `pages` row |
| 10 | `skillsJourneyCta` | `SkillsJourneyCtaContent` | LAST `block_journey_panel` row — `journey_cta` JSON field | `block_journey_panel` | Two-field shape `{ prompt, button }`. Stored as a JSON field on the last journey panel row for cohesion (avoids a singleton or a separate block). See resolved ambiguities below |
| 11 | `navLinks` | `readonly NavLink[]` | flat collection `nav_links` | `nav_links` | Rows with `label`, `href`, `priority`, `placement` (header/footer/mobile enum). Already modelled in spec |
| 12 | `menuItems` | `readonly MenuItem[]` | flat collection `nav_links` | `nav_links` | `placement = 'menu'`; adds `subtitle` field. Same collection as navLinks, different placement value |
| 13 | `metroBookends` | `MetroBookends` | flat collection — new `metro_bookend_labels` singleton | `metro_bookend_labels` | Five LocalizedString labels (departure/featured/about/blog/terminal). Navigation chrome — **not** hero or proof-reel data. See resolved ambiguities below |
| 14 | `errorPage` | `ErrorPageContent` | flat collection `error_pages` | `error_pages` | Keyed by `status_code` UNIQUE. Fields: label, heading, description, terminalLine, suggestions (JSON array). Spec §3.5 |
| 15 | `aboutPage` | `AboutContent` | `block_about_content` field | `block_about_content` | Full /about page bento content (identity, metrics, methodology, testimonials, techStack, interests, weather, etc.) |
| 16 | `contactPage` | `ContactContent` | `block_contact_content` field | `block_contact_content` | Full /contact page (pageTitle, formTerminal, infoTerminal, validation, success, socials) |
| 17 | `techStackPage` | `TechStackPageContent` | `block_tech_stack_page_content` field | `block_tech_stack_page_content` | /tech-stack chrome (meta, hero, actions, cta copy) |
| 18 | `heroMock` | `HeroData` | derived from `content.hero()` — runtime computed | `block_hero` | `generateHeroData()` produces randomised STM metric data. No schema change; Directus adapter generates the same randomised payload at call time |
| 19 | `initialHeroData` | `HeroData` | derived projection — code constant | `block_hero` | `INITIAL_HERO_DATA` is a hardcoded stable snapshot for SSR/tests. Stays as a code constant; Directus adapter re-exports the same constant. No schema change |
| 20 | `metroSvg` | `string` | **already directus-backed since 18d** — no change in 18i | — | Source flipped in 18d Phase 8 to Directus `/assets/<uuid>`. Directus adapter: `fetchAssetSvg(assetId)` |
| 21 | `morphShapes` | `readonly MorphShape[]` | **already directus-backed since 18f** — no change in 18i | — | `morph_shapes` collection. Directus adapter already implemented in 18f |

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

### `skillsJourneyCta` → `block_journey_panel.journey_cta` JSON field on LAST row

`SkillsJourneyCtaContent` is `{ prompt: LocalizedString; button: LocalizedString }` — the "Your next
stop?" / "Let's build together →" CTA that sits visually below the horizontal journey strip. Two options
were considered: (a) a singleton field on the home `pages` row, (b) a JSON field on the last
`block_journey_panel` row. Option (b) wins for cohesion: the CTA is rendered as the terminal beat of the
journey sequence. Storing it on the last panel row keeps all journey-strip content in one collection and
avoids polluting the home page row with a one-off field. Task implementers: when seeding, set
`journey_cta` as a JSON field on the `block_journey_panel` row with `id = 'motion'` (the current last
panel).

### `metroBookends` → flat collection `metro_bookend_labels` singleton (new, not `block_hero` or `block_proof_reel`)

The plan's Step 3 defaults suggested `block_hero` or `block_proof_reel`. Inspection of `nav.ts` and
`repositories/service.ts` rules both out:

- `MetroBookends` is `{ departure, featured, about, blog, terminal }` — five `LocalizedString` label
  fields for the non-service stops in the metro navigation widget (rendered in `service.ts`'s
  `getMetroStops()`).
- There is zero structural overlap with `HeroContent` (headline/CTA/SQL panel) or `ProofReelContent`
  (heading/slugs/images). The static adapter imports `metroBookends` from `nav.ts`, not from
  `site-content.ts`.
- `navLinks` (header/footer/mobile link rows) is not a fit either — it models href-based links; bookends
  are label-only stops with no href.

Decision: a new **flat singleton collection `metro_bookend_labels`** with five
`LocalizedString`-typed fields. This is the only schema addition Task 1.0 flags as outside spec §2.2 —
it needs explicit approval in the next task session before the seed script runs. Alternative: embed the
five fields directly on the home `pages` row (avoids a new collection, trades against discoverability).
If the team prefers minimum new collections, use the `pages` row approach and document it in Task 2.1.

---

## Per-page block roster

The following shows which block collection rows each page's M2A junction will reference. Used by
Task 2.1's seed script.

### `home` (route `/`)

- `block_hero` (0–1)
- `block_manifesto` (0–1)
- `block_proof_reel` (0–1)
- `block_services_grid` (0–1)
- `block_about_intro` (0–1)
- `block_cta` (0–1)
- `block_closer` (0–1)
- `block_journey_panel` (0..N, ordered) — currently 4 rows

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
| `metro_bookend_labels` | Metro stop label copy — **new, needs approval** (see resolved ambiguities) |

---

## Open follow-ups

1. **`block_blog_page_content` shape** — not yet defined. Deferred to Task 1.4 per spec R2. Task 1.4
   must specify fields before Task 2.1's seed script can create the row.

2. **`block_projects_page_content` shape** — same as above. Deferred to Task 1.4.

3. **`metro_bookend_labels` collection approval** — spec §2.2 lists 13 block collections + `nav_links`
   + `error_pages`. `metro_bookend_labels` is a net-new addition. Task 2.1 should either: (a) add this
   collection to the approved roster, or (b) fold the five fields onto the home `pages` row and update
   this table's row 13 accordingly.

4. **`skillsJourneyCta` field name on `block_journey_panel`** — the field `journey_cta` is proposed
   here; the actual Directus field name must be agreed before Task 2.1 creates the snapshot.

5. **`menuItems` vs `navLinks` in `nav_links` collection** — `MenuItem` has a `subtitle` field that
   `NavLink` does not. The `nav_links` schema needs a nullable `subtitle` column to accommodate both.
   Task 2.1 must include this in the snapshot diff.

6. **`heroMock` and `initialHeroData` deprecation path** — both currently live as code-computed values
   with no CMS backing. If a future slice wants to make the STM pipeline KPIs real (live Neon Postgres
   integration, phase noted in `hero-data.ts`), these methods will need a rethink. 18i carries them as
   pass-through constants; no action required now.
