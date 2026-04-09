# Slice 13 — Home Page Redesign

**Date:** 2026-04-09
**Status:** Design approved
**Approach:** Hybrid A+C (Narrative manifesto + consultative proof)

## Goal

Rebuild the home page as a full-bleed, kinetic, Awwwards-quality experience that serves two audiences:
1. **Freelance clients** — convert visitors into leads
2. **Hiring managers** (Alto, CDPQ Infra) — demonstrate technical credibility and craft

The site is the first thing both audiences see. It must create an immediate "wow" impression through immersive scroll-driven animation, bold typography, and seamless content flow into existing subpages.

## Design Principles

- **Full-bleed, edge-to-edge** — zero side margins on all sections. Content fills the browser width.
- **Kinetic & immersive** — every section has scroll-driven GSAP animation. The page is an experience, not a brochure.
- **SVG + GSAP only** — no Three.js. 2D animations with DrawSVG, SplitText, MorphSVG, ScrollTrigger.
- **Content connected** — every section deep-links into existing subpages (/work, /services, /about, /contact). The home page is a teaser layer.
- **Data-driven** — all content from existing data layer (services.ts, projects.ts, content.ts, meta.ts). No hardcoded strings.
- **Smooth scroll** — Lenis for Awwwards-grade scroll feel across the entire page.
- **Mobile-first responsive** — full-bleed on all viewports. Sections adapt but never lose their immersive quality.

## Reference Sites

Awwwards-quality kinetic portfolio sites that informed this design:
- digitalflagship.com, byfrontyard.com, shader.se, raviklaassens.com
- digital.tattooprojects.com, daveholloway.uk, jasminegunarto.com

Key patterns extracted: full-viewport sections, scroll-driven reveals, SplitText effects, magnetic interactions, bold oversized type, seamless section transitions.

## Page Architecture (7 Sections)

### Section 1: Hero (existing — 4 fixes)

The metro SVG scroll animation stays. Four targeted fixes:

**Fix 1 — Scroll offset for pill nav:**
The ScrollTrigger `start: 'top top'` doesn't account for the floating pill nav. The animation starts too late because the user scrolls through dead space (nav height + padding) before the trigger fires. Adjust the trigger start to compensate for the nav offset so the animation begins immediately on first scroll.

**Fix 2 — Berri-UQAM dot blink synced with typewriter cursor:**
On mount (before any scrolling), the Berri-UQAM dot should blink in sync with the typewriter cursor that types "NEXT STOP: SCROLL DOWN". Both use the same 500ms interval. The dot pulses opacity (1 → 0.2 → 1) on the same beat as the cursor underscore blink. This creates a unified "heartbeat" that signals the page is alive and ready for interaction.

**Fix 3 — Headline update to "Digital Infrastructure" brand:**
Update `heroContent` in `content.ts`:
- `headline.line1`: "DATA" → "DIGITAL"
- `headline.line2`: "INFRA" → "INFRA" (stays, shortened form works for both)
- Keep "BUILT RIGHT." as line3

Also update `subtitle` to reflect digital infrastructure positioning (not just SQL/data).

**Fix 4 — SQL decoration formatting:**
Update the SQL decoration (right side of hero on desktop) to use proper professional formatting with table aliases and aligned keywords:
```sql
SELECT  y.expertise
FROM    yesid AS y
WHERE   y.work = 'Quality'
```
Update `heroContent.sqlDecoration` in `content.ts` accordingly.

### Section 2: Manifesto (new)

A full-viewport statement that bridges the hero animation into the page content. One bold sentence, revealed character-by-character via GSAP SplitText as the user scrolls.

**Content (draft — will be refined during implementation):**
> "I build the infrastructure your operations run on."

Below the statement: a row of subtle pills/tags showing capability domains (Pipelines, Databases, Dashboards, Internal Tools, Web Apps). These link to `/services/[id]`.

**Animation:** SplitText char-by-char reveal driven by ScrollTrigger. Characters appear in sequence as the user scrolls through the section. The orange brand color highlights key words ("infrastructure", "operations"). Full-viewport height, vertically centered.

**Data source:** New `manifestoContent` in `content.ts` (LocalizedString).

### Section 3: Proof Reel (new)

2-3 featured projects displayed as full-bleed cards with impact metrics prominently shown. This is the "proof" that backs up the manifesto — real work with real results.

**Content:**
- Transit Data Pipeline — real-time GTFS-RT processing
- Analytics Dashboard — "2 days → 15 min" reporting time
- (Optional 3rd: Database Migration — "500GB, zero downtime")

Each card shows: project label, one-liner, impact metric (large, orange), tech stack tags.

**Animation:** Staggered scroll-linked entrance. Cards reveal from below with slight parallax. Hover reveals additional detail or subtle motion.

**Links:** Each card clicks through to `/work/[slug]`. "View all work →" link to `/work`.

**Data source:** `projects.ts` — `getFeaturedProjects()` + curated selection of high-impact projects.

### Section 4: Services (new)

A grid of all 6 services. Not the old train-station cards — clean, minimal cards that show the service name and a one-line description.

**Layout:** 3×2 grid on desktop, 2×3 on tablet, 1×6 stacked on mobile.

**Animation:** Staggered reveal on scroll. Hover expands card slightly or reveals the full description. Each card could use the existing service SVGs for visual identity.

**Links:** Each card links to `/services/[id]` detail page.

**Data source:** `services.ts` — `getVisibleServices()`.

### Section 5: Blog Teaser (new)

A minimal strip showing 2-3 latest professional blog post titles. Placed after Services because it reinforces credibility *after* showing what you do — "not only do I build this, I think deeply about it."

**Layout:** Horizontal row on desktop (titles side by side with dates), stacked on mobile. Clean typographic treatment — no cards, no thumbnails. Just titles, dates, and a "Read more →" link.

**Content:** Latest 2-3 posts from `getLatestPosts()`, filtered to professional category.

**Animation:** Subtle scroll entrance. Titles could have a gentle stagger reveal.

**Links:** Each title links to `/blog/[category]/[slug]`. "All posts →" link to `/blog`.

**Data source:** `blog.ts` — `getLatestPosts(3)`.

### Section 6: About Strip (new)

A compact, personal section that adds a human face to the technical portfolio. Not the full bento dashboard (that lives at `/about`) — a teaser that hooks interest.

**Content:**
- Photo/avatar (circular, orange border)
- Name: "Yesid O."
- Title: "Digital Infrastructure Consultant · Montreal"
- Personal narrative (draft — will be brainstormed and refined during 13e):
  > "I grew up behind screens — exploring the internet, teaching myself tools, turning curiosity into craft. Today I build the infrastructure that turns ideas into systems."
- Link: "→ More about me" to `/about`

**Animation:** Subtle scroll entrance. Photo could have a gentle parallax or breathing scale effect.

**Data source:** `content.ts` (aboutContent) + new narrative text in `content.ts`.

### Section 7: Dual CTA (new)

The closing pitch. Addresses both audiences explicitly.

**Content:**
- Heading: "Let's build something that moves." (existing from `ctaContent`)
- Subtitle: "Available for freelance projects and full-time opportunities."
- Two buttons:
  - Primary (filled): "Work with me" → `/contact`
  - Secondary (outlined): "Let's connect" → LinkedIn profile (direct link for employers)
- Social links row: LinkedIn, GitHub, Upwork, Email

**Animation:** Magnetic buttons (existing action). Text reveal on scroll. Subtle background glow (warm orange radial gradient, like existing home page).

**Data source:** `content.ts` (ctaContent, extended) + `meta.ts` (siteMeta.links).

## What Gets Removed

Everything between the Hero and the new sections is deleted:
- `ServiceStation` component usage on home page
- `FeaturedWork` component usage on home page
- `AboutBento` component usage on home page
- `BlogFeed` component usage on home page
- `GradientSeparator` usage on home page
- Three.js background (fixed gradient `from-[#141414] via-[#1a1410] to-[#141414]`)
- Warm glow overlay (scroll-reactive orange radial)
- Right-rail overlay (train track, station nodes, train SVG)
- `localProgress` scroll tracking and `serviceActiveIndex` logic

**Note:** The components themselves are NOT deleted — they still exist for their respective subpages or future use. Only their usage on `+page.svelte` is removed.

### SkillsJourney

`SkillsJourney` component stays in the codebase but is NOT rendered on the home page. It may be reactivated in a future slice. The component import can remain commented out or conditionally hidden.

## What Gets Added

### Lenis Smooth Scroll

Install `lenis` package. Initialize in `+layout.svelte` at the layout level so smooth scroll applies site-wide (consistent feel across all pages). Lenis integrates with GSAP ScrollTrigger via the official `lenis/gsap` bridge — ScrollTrigger.update() is called on each Lenis tick.

### Full-Bleed Layout

The home page layout removes all side margins and max-width constraints. Each section fills the full viewport width. The `+layout.svelte` already has `isFullWidth` logic for the home page — this extends it to truly edge-to-edge with zero padding.

### New Content in Data Layer

- `manifestoContent` — manifesto statement and capability pills
- Extended `ctaContent` — dual CTA copy, subtitle update
- Extended `heroContent` — updated headline and subtitle
- `aboutStripContent` — personal narrative text (brainstormed during implementation)
- Possibly `proofReelContent` — curated project selection config

All as `LocalizedString` for future i18n.

## Section-to-Page Relationship Map

| Home Section | Links To | Data Source |
|---|---|---|
| Hero CTAs | `/work`, `/contact` | `content.ts` |
| Manifesto pills | `/services/[id]` | `services.ts` |
| Proof Reel cards | `/work/[slug]` | `projects.ts` |
| Services grid | `/services/[id]` | `services.ts` |
| Blog Teaser titles | `/blog/[category]/[slug]`, `/blog` | `blog.ts` |
| About Strip | `/about` | `content.ts` |
| CTA buttons | `/contact`, LinkedIn | `meta.ts`, `content.ts` |

## Technical Decisions

- **Lenis** for smooth scroll (integrates with GSAP ScrollTrigger via `lenis/gsap`)
- **GSAP SplitText** for manifesto text reveal
- **GSAP ScrollTrigger** for all section entrance animations
- **Existing magnetic action** for CTA buttons
- **Existing reveal action** extended or replaced with more immersive scroll entrances
- **No Three.js** — background is solid `var(--bg-primary)` (#141414), matching other pages
- **No GradientSeparators** — sections flow seamlessly into each other through animation
- **Each section brainstormed in detail** during implementation (animation timing, exact layout, mobile behavior, text styling all decided per-task with Yesid's approval)

## Estimated Scope

This is a multi-session slice. Estimated sub-slices:

| Sub-slice | Scope | Sessions |
|---|---|---|
| 13a | Hero fixes (scroll offset, blink sync, headline) + remove old sections + Lenis setup + full-bleed layout | 1 |
| 13b | Hero viewport height fix — dvh/svh/lvh, env(safe-area-inset-*), mobile browser chrome shift | 1 |
| 13c | Manifesto section (SplitText, full-viewport, capability pills) | 1 |
| 13d | Proof Reel (featured project cards, impact metrics, scroll animation) | 1 |
| 13e | Services grid (6 cards, hover, links to /services/[id]) | 1 |
| 13f | Blog Teaser (2-3 latest posts, minimal strip) + About Strip (narrative brainstorm, layout, animation) | 1-2 |
| 13g | Dual CTA (buttons, social links, glow effect) | 1 |
| 13h | Polish pass (section transitions, mobile QA, performance, smooth scroll tuning) | 1 |
| 13i | Closing (docs, handoff, learn docs, tests, commit) | 1 |

**Total: ~9-10 sessions.** Each sub-slice starts with a design brainstorm for that section's specific details (animation timing, exact layout, mobile behavior, hover effects, text styling). Nothing is implemented without Yesid's approval on the design for that section first.

### Multi-Session Quality Protocol

This slice is explicitly designed to span multiple sessions to avoid AI slop:
- **Each session = one sub-slice.** No cramming multiple sections into one session.
- **Each section gets its own brainstorm** — visual companion mockup, design discussion, then implementation.
- **Iteration protocol applies** — one task at a time, approval between each, no batching.
- **Session handoffs** — if a session ends mid-sub-slice, document exactly where things stand so the next session picks up cleanly.
- **No filler code** — every animation, every interaction, every line of CSS is intentional and approved.
