# Slice 12 — Footer Redesign + Favicon

**Date:** 2026-04-09
**Status:** Approved
**Approach:** Streamlined + Infra Status Bar (Approach C)

---

## Overview

Replace the minimal footer (copyright + 2 social links) with a professional, SEO-optimized footer that carries the site's metro/infrastructure identity. Change the favicon from an orange "Y" to an orange dot, establishing the dot as a core brand mark.

## Scope

| Deliverable | Description |
|-------------|-------------|
| Footer redesign | 3-row layout: main content, status bar, bottom stripe |
| Animated wordmark | Reuse nav's GSAP SplitText hover effects in footer |
| Favicon | Static orange dot SVG replacing "Y" |
| SEO schema | JSON-LD Person markup in layout head |
| Semantic HTML | footer, nav, address, small elements |
| Data layer | Extend siteMeta with schema fields |

## Footer Layout

### Structure

Three rows inside a single `<footer>` element:

```
[--- gradient fade separator ---]

ROW 1: Main Content (flex: space-between)
  LEFT:   yesid. wordmark (animated hover)
  CENTER: Services · Work · Blog · Stack · About · Contact
  RIGHT:  GitHub · LinkedIn · Upwork

ROW 2: Status Bar (flex: space-between, monospace)
  LEFT:   (c) 2026 yesid.
  CENTER: Montreal, QC · Remote
  RIGHT:  [dot] system online — 2026.04.09

ROW 3: Bottom Accent Stripe (2px)

[=== gradient stripe #E07800 → #FFB627 ===]
```

### Row 1 — Main Content

- **Wordmark:** `yesid.` with same GSAP SplitText hover animation pool as the nav (bounce, wiggle, wave, spin). Orange dot pulses on every hover. Linked to `/`. Font: Inter 700, ~20px, `var(--text-primary)`.
- **Nav links:** All 6 site pages — Services, Work, Blog, Stack, About, Contact. Wrapped in `<nav aria-label="Footer navigation">`. Font: Inter 400, 13px, `var(--text-secondary)`. Hover: `text-brand-primary`. Flex row with `gap: 24px`, wraps on mobile.
- **Social links:** GitHub, LinkedIn, Upwork. Same styling as nav links. External links get `target="_blank" rel="noopener noreferrer"`. Each has an `aria-label`.

### Row 2 — Status Bar

Separated from Row 1 by `border-top: 1px solid rgba(255,255,255,0.06)`.

- **Font:** JetBrains Mono, 11px, `var(--text-muted)`
- **Left:** `(c) {year} yesid.` — year from `new Date().getFullYear()`, dot colored `text-brand-primary`
- **Center:** `Montreal, QC · Remote` — wrapped in `<address>` element (no italic override via CSS)
- **Right:** Orange status dot (6px circle, static glow via box-shadow) + `system online — {date}` — date from `new Date()` formatted as `YYYY.MM.DD`

### Row 3 — Bottom Accent Stripe

- 2px tall, full width, absolute bottom
- `background: linear-gradient(90deg, #E07800, #FFB627)`
- Brands the page floor

### Separators

- **Top of footer:** Gradient fade line replacing current solid border. `linear-gradient(90deg, transparent, #E07800 20%, #E07800 80%, transparent)` at 0.15 opacity. 1px height.
- **Status bar border:** `1px solid rgba(255,255,255,0.06)`

### Background

`var(--bg-primary)` — same as page. The gradient separator provides visual differentiation.

## Animated Wordmark

Reuse the exact same animation system from `Nav.svelte`:

- GSAP SplitText splits `yesid` into individual chars
- Four effects rotate on each hover: bounce, wiggle, wave, spin
- Orange dot always pulses (scale 1 → 1.4 → 1) alongside any effect
- `effectIndex` cycles through effects
- `isAnimating` guard prevents overlapping animations
- Respects `prefers-reduced-motion`
- SplitText reverted on destroy

**Implementation:** Extract the animation logic (effect pool, hover handler, SplitText setup/teardown) into a reusable Svelte action at `src/lib/motion/actions/wordmarkHover.ts`. The action receives refs to the text element and dot element, handles SplitText creation, effect cycling, the isAnimating guard, and cleanup on destroy. Both Nav and Footer call `use:wordmarkHover` with the same interface. This avoids duplicating ~60 lines of GSAP logic.

## Favicon

### Change

Replace the current orange "Y" SVG favicon with an orange dot:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="12" fill="#E07800"/>
</svg>
```

### Files to Update

- `static/favicon.svg` — used by `app.html` (`%sveltekit.assets%/favicon.svg`)
- `src/lib/assets/favicon.svg` — used by `+layout.svelte` (imported as module)

Both files get the same content. No changes to `app.html` or `+layout.svelte` references.

## SEO — JSON-LD Schema

### Person Schema

Added to `<svelte:head>` in `+layout.svelte` (or a dedicated SEO component). Not rendered visually.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Yesid O.",
  "jobTitle": "Data Infrastructure Consultant",
  "url": "https://yesid.dev",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Montreal",
    "addressRegion": "QC",
    "addressCountry": "CA"
  },
  "sameAs": [
    "https://github.com/mgkdante",
    "https://www.linkedin.com/in/otaloray/"
  ],
  "knowsAbout": [
    "PostgreSQL", "dbt", "Power BI", "Python",
    "Data Infrastructure", "ETL", "Data Warehousing",
    "SvelteKit", "TypeScript"
  ],
  "email": "contact@yesid.dev"
}
```

### Data Layer Extension

Extend `SiteMeta` type and `siteMeta` in `src/lib/data/meta.ts` with:

- `owner.name` — `"Yesid O."`
- `owner.jobTitle` — localized string: `"Data Infrastructure Consultant"`
- `owner.address` — `{ locality: "Montreal", region: "QC", country: "CA" }`
- `owner.knowsAbout` — string array of expertise areas

All schema and footer content pulls from this single source of truth.

### Semantic HTML

```html
<footer>
  <nav aria-label="Footer navigation">
    <!-- site links -->
  </nav>

  <div class="status-bar">
    <small>(c) 2026 yesid.</small>
    <address>Montreal, QC · Remote</address>
    <span>[dot] system online — 2026.04.09</span>
  </div>
</footer>
```

- `<footer>` — implicit `contentinfo` landmark, no redundant `role`
- `<nav aria-label="Footer navigation">` — distinguishes from main nav for screen readers
- `<address>` — semantically correct for contact/location info
- `<small>` — correct for copyright/legal text

## CSS & Visual Details

### Colors & Typography

| Element | Font | Size | Color |
|---------|------|------|-------|
| Wordmark | Inter 700 | 20px | `var(--text-primary)` |
| Wordmark dot | Inter 700 | 20px | `text-brand-primary` |
| Nav links | Inter 400 | 13px | `var(--text-secondary)`, hover: `text-brand-primary` |
| Social links | Inter 400 | 13px | `var(--text-secondary)`, hover: `text-brand-primary` |
| Status bar | JetBrains Mono 400 | 11px | `var(--text-muted)` |
| Status dot | — | 6px | `#E07800` + glow |

### Status Dot Glow

```css
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #E07800;
  box-shadow: 0 0 6px #E07800, 0 0 12px rgba(224, 120, 0, 0.3);
}
```

Static glow only — no animation.

### New CSS Tokens

None required. All values covered by existing tokens.

### No CSS.md Update

No new tokens, @theme values, or z-index values introduced.

## Responsive Behavior

### Desktop (>= 640px)

Three-column flex layout as described above.

### Mobile (< 640px)

Main content stacks vertically, centered:
1. `yesid.` wordmark (centered)
2. Nav links (flex-wrap, centered, smaller gap)
3. Social links (centered row)

Status bar:
- Copyright left, system online right
- Location either combines with copyright or drops to its own centered line

Padding reduces from `40px` to `24px`.

## Pages Where Footer Appears

Footer shows on all pages **except** `/services` (services listing page hides footer — existing behavior preserved via `hideFooter` derived in `+layout.svelte`).

## Out of Scope

- No CTA or conversion elements
- No newsletter signup
- No client logos or testimonials
- No ghost grid / dot pattern texture (keeping it clean)
- No animated favicon (browser support too limited)
- No new CSS tokens

## Acceptance Criteria

1. Footer renders with 3-row layout on all pages (except /services listing)
2. Wordmark hover triggers rotating GSAP effects (same 4 as nav)
3. All 6 nav links present and functional
4. All 3 social links open in new tab with proper rel attributes
5. Status bar shows programmatic year and date (YYYY.MM.DD format)
6. Orange status dot with static glow visible
7. Gradient separator at top, thin border between rows, brand stripe at bottom
8. JSON-LD Person schema present in page head (validate with Google Rich Results Test)
9. Semantic HTML: footer, nav with aria-label, address, small
10. Favicon is orange dot in both SVG locations
11. Mobile layout stacks gracefully at < 640px
12. `prefers-reduced-motion` disables wordmark animations
13. All data sourced from siteMeta / nav data layer — no hardcoded strings
14. `bun run test` and `bun run check` pass
