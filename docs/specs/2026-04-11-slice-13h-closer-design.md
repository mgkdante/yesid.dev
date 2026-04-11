# Slice 13h — "The Closer" Design Spec

**Date:** 2026-04-11
**Status:** Approved
**Parent:** Slice 13 — Home Page Redesign
**Depends on:** 13a (foundation), 13b (manifesto), 13f (proof reel), 13g (services grid)

## Goal

Build the final content section of the home page — a compact, high-conversion "terminus" section that merges what was originally three sections (Blog Teaser, About Strip, Dual CTA) into one departure board mounted on a graffiti wall.

## Why Merge

By the time users reach this section, they've scrolled through ~12 viewports on desktop (~20 on mobile) across Hero, Manifesto, Proof Reel, and Services. NN/g research shows 74% of viewing time happens in the first 2 screenfuls. Adding 3 more full sections would punish committed users with diminishing returns. The serial position effect gives the final section memory-privileged recall — one strong closer beats three tired sections.

## Concept

**Transit terminus + graffiti wall.** A departure board showing every action the user can take next, mounted on a concrete wall with a Vecteezy graffiti SVG as urban art on the right side. Paint drip lines at the top-right corner add a fresh-paint feel. The metaphor: the user has reached the end of the line. Every destination is one row on the board.

## Visual Structure

### Desktop Layout (~70vh)

```
┌──────────────────────────────────────────────┐
│  yellow/black dashed hard-cut (consistent)   │
├──────────────────────────────────────────────┤
│                                    ░░ drips  │
│  TERMINUS.                         ░░        │
│  FIN DE LIGNE · END OF LINE        ░░        │
│                                   [GRAFFITI  │
│  ┌─────────────────────────┐       SVG at    │
│  │ CONTACT  Start a proj…  → GO│   ~8-10%   │
│  │ CONNECT  LinkedIn · …   → GO│   opacity   │
│  │ READ     Blog title 1   →   │   right     │
│  │ READ     Blog title 2   →   │   side]     │
│  │ ABOUT    Yesid O · MTL  →   │             │
│  └─────────────────────────┘   ← gradient    │
│                                    fade      │
│     LinkedIn  GitHub  Upwork  Email          │
│     Graffiti Vectors by Vecteezy             │
└──────────────────────────────────────────────┘
```

### Mobile Layout (~80vh)

Graffiti SVG moves behind content (full-width, ~5% opacity). No side zone — board goes full-width. Drips reduced to 1-2. Rows are full tap targets.

## Background Layers

1. **Base**: Concrete texture via CSS `repeating-conic-gradient` (subtle noise pattern, no image dependency)
2. **Graffiti SVG**: `static/svg/graffiti/graffiti.svg` (Vecteezy, 409KB) positioned absolute, anchored right, vertically centered. Recolored to brand (#E07800 / #FFB627) via CSS `filter: hue-rotate() saturate() brightness()` or direct SVG fill edits (replace `rgb(238,64,54)` and `rgb(240,90,40)` with brand values). Opacity ~8-10%.
3. **Gradient fade**: `linear-gradient(90deg, var(--bg-primary) 30%, transparent 65%)` protects left content from SVG.
4. **Drip lines**: 2-3 thin vertical divs at top-right corner, `linear-gradient` from `rgba(224,120,0,0.15)` to `transparent`. Heights vary (40-70px). Animate downward on scroll entrance.

### Folder rename

Rename `static/svg/graffit/` → `static/svg/graffiti/` (typo fix).

### Attribution

Required per Vecteezy free license. Render as: `<a href="https://www.vecteezy.com/free-vector/graffiti">Graffiti Vectors by Vecteezy</a>` — small monospace text at bottom of section.

## Departure Board

### Panel styling

- Background: `rgba(10,10,10,0.92)`
- Border: `1px solid #252525`
- Border-radius: `3px`
- Box-shadow: `0 2px 16px rgba(0,0,0,0.5)`

### Row grid

3-column CSS grid: `grid-template-columns: 70px 1fr 50px`

Each row: `padding: 10px 14px`, separated by `border-bottom: 1px solid #1a1a1a`.

### Row content (in order)

| # | Label | Description | Link | Priority |
|---|-------|-------------|------|----------|
| 1 | CONTACT | "Start a project together" | `/contact` | Primary |
| 2 | CONNECT | "LinkedIn · full-time roles" | `siteMeta.links.linkedin` | Primary |
| 3 | READ | *(dynamic: latest professional blog post title)* | `/blog/[category]/[slug]` | Secondary |
| 4 | READ | *(dynamic: 2nd latest professional blog post title)* | `/blog/[category]/[slug]` | Secondary |
| 5 | ABOUT | "Yesid O. · Montreal" | `/about` | Secondary |

### Row styling

- **Label column**: Monospace, `font-size: 9px`, `font-weight: 700`, color `#E07800`
- **Description column**: Primary rows: `font-size: 11px`, color `#ddd`. Secondary rows: `font-size: 10px`, color `#999`
- **Action column**: Primary rows: `→ GO` in `#FFB627`, `font-weight: 600`. Secondary rows: `→` in `#555`

### Row interaction

- Hover: subtle background highlight (`rgba(224,120,0,0.04)`) + row slides right ~4px (GSAP tween, 0.2s)
- Each row is a semantic `<a>` link wrapping the entire grid row
- Cursor: pointer on all rows
- Mobile: full tap target, no hover effect

## Heading

- **TERMINUS.** — Inter, `font-weight: 900`, ~`clamp(1.5rem, 4vw, 2rem)` on desktop. The dot is `#E07800`.
- **FIN DE LIGNE · END OF LINE** — Monospace, `font-size: 9px`, color `#555`, `letter-spacing: 1px`. Bilingual nod (French/English, Montreal identity).

## Social Links Row

Below the board: LinkedIn, GitHub, Upwork, Email — monospace, `font-size: 9px`, color `#444`. Data from `siteMeta.links`. Horizontal row with ~14px gap. Centered on desktop, left-aligned on mobile.

Each is a simple text link (no icons for now — matches the monospace transit aesthetic).

## Content Data Layer

### New in `content.ts`

```typescript
export const closerContent = {
  heading: { en: 'TERMINUS' } satisfies LocalizedString,
  headingDot: { en: '.' } satisfies LocalizedString,
  subheading: { en: 'FIN DE LIGNE · END OF LINE' } satisfies LocalizedString,
  rows: {
    contact: {
      label: { en: 'CONTACT' } satisfies LocalizedString,
      description: { en: 'Start a project together' } satisfies LocalizedString,
      action: { en: '→ GO' } satisfies LocalizedString,
    },
    connect: {
      label: { en: 'CONNECT' } satisfies LocalizedString,
      description: { en: 'LinkedIn · full-time roles' } satisfies LocalizedString,
      action: { en: '→ GO' } satisfies LocalizedString,
    },
    read: {
      label: { en: 'READ' } satisfies LocalizedString,
      action: { en: '→' } satisfies LocalizedString,
    },
    about: {
      label: { en: 'ABOUT' } satisfies LocalizedString,
      description: { en: 'Yesid O. · Montreal' } satisfies LocalizedString,
      action: { en: '→' } satisfies LocalizedString,
    },
  },
  attribution: {
    text: { en: 'Graffiti Vectors by Vecteezy' } satisfies LocalizedString,
    url: 'https://www.vecteezy.com/free-vector/graffiti',
  },
} as const;
```

### Dynamic data

- Blog titles: `getLatestPosts(2)` filtered to `professional` category from `blog.ts`
- Social links: `siteMeta.links` from `meta.ts`

## Animation (GSAP ScrollTrigger)

All animations triggered when section enters viewport (`start: 'top 80%'`).

1. **Heading**: Fade in + slide up 20px (0.4s)
2. **Subheading**: Fade in (0.3s, 0.1s delay)
3. **Board panel**: Fade in with slight scale `0.98 → 1` (0.5s, 0.2s delay)
4. **Board rows**: Stagger in from left, 50ms apart (opacity 0→1, x: -10→0)
5. **Drip lines**: Animate downward — `scaleY: 0→1` with `transform-origin: top` (0.8s, 0.3s delay)
6. **Graffiti SVG**: Fade from `opacity: 0 → 0.08-0.1` (0.6s, 0.2s delay)
7. **Social row**: Fade in last (0.3s, 0.6s delay)
8. **Attribution**: Fade in with social row

## Mobile Adaptation

- **Breakpoint**: `md:` (768px)
- **Below md**: Graffiti SVG repositions behind content (centered, full-width, opacity ~5%). Gradient fade removed. Board full-width. Drips reduced to 1.
- **Above md**: Side mural layout as described.
- **Touch**: Rows are full tap targets. No hover slide effect.

## Accessibility

- `prefers-reduced-motion`: Skip all GSAP entrance animations. Static layout, full opacity.
- Board rows are semantic `<a>` elements with `aria-label` describing the destination (e.g., "Contact — Start a project together")
- All text meets WCAG AA contrast against dark backgrounds
- Attribution is a real `<a>` tag with `rel="noopener"` and `target="_blank"`
- SVG has `aria-hidden="true"` and empty `alt=""` (decorative)

## Component

**File**: `src/lib/components/HomeCloser.svelte`
**Test**: `src/lib/components/HomeCloser.test.ts`

## Performance Notes

- SVG is 409KB. Lazy-load with `loading="lazy"` on the `<img>`. Consider SVGO optimization to reduce file size during implementation.
- CSS filters for recoloring are GPU-accelerated and cheaper than editing 2665 lines of SVG paths.
- All GSAP animations use `will-change` sparingly and clean up ScrollTriggers on destroy.

## Acceptance Criteria

1. Section renders below Services grid with yellow/black hard-cut divider above
2. "TERMINUS." heading with orange dot visible on scroll
3. Departure board displays 5 rows in correct order with correct links
4. READ rows dynamically pull latest 2 professional blog post titles
5. Graffiti SVG visible on right side (desktop) / behind content (mobile)
6. Drip lines animate on scroll entrance
7. Row hover slides right with highlight (desktop only)
8. Social links row renders all 4 links from data layer
9. Vecteezy attribution visible and linked
10. `prefers-reduced-motion` disables all animations
11. All tests pass, `bun run check` clean
