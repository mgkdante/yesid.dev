# Slice 13b — Manifesto Section Design

**Date:** 2026-04-09
**Status:** Approved
**Parent:** Slice 13 — Home Page Redesign

## Goal

Add the Manifesto section as Section 2 of the home page, directly after the Hero. A full-viewport bold statement that bridges the hero animation into the content sections. Reveals character-by-character on scroll via GSAP SplitText, followed by capability pills linking to service pages.

## Text

**Statement:** "I BUILD THE INFRASTRUCTURE YOUR OPERATIONS RUN ON."

- All uppercase, Inter, font-weight 900
- "INFRASTRUCTURE" scaled larger than surrounding lines (~120-130% of base size)
- Orange highlights (#E07800): **INFRASTRUCTURE**, **OPERATIONS**, and the trailing **.**
- All other text: white (#F5F5F0)
- Responsive sizing: `clamp(2rem, 6vw, 5rem)` base, INFRASTRUCTURE line gets `clamp(2.5rem, 7.5vw, 6.5rem)`
- Letter-spacing: tight (-0.03em) for bold oversized feel
- Line stacking:
  ```
  I BUILD THE
  INFRASTRUCTURE
  YOUR OPERATIONS
  RUN ON.
  ```

## Layout

- Full viewport height (`100vh`), flex column, vertically + horizontally centered
- Background: `var(--bg-primary)` (#141414)
- Full-bleed — zero side margins, matches rest of home page
- Text block centered, max-width unconstrained (text wraps naturally)
- Pills row ~2.5rem below the last text line

## Capability Pills

5 pills linking to service detail pages. Positioned below the manifesto statement.

| Label | Service ID | Route |
|-------|-----------|-------|
| pipelines | data-pipeline | /services/data-pipeline |
| databases | database-engineering | /services/database-engineering |
| dashboards | analytics-reporting | /services/analytics-reporting |
| internal_tools | internal-tooling | /services/internal-tooling |
| web_apps | web-development | /services/web-development |

### Pill Styling

- **Font:** JetBrains Mono (`var(--font-mono)`), lowercase, underscores
- **Size:** ~0.75rem, letter-spacing 0.04em
- **Resting state:** ghost border (`var(--border)` / #3A3A3A), muted text (`var(--text-secondary)` / #999), border-radius 9999px (pill shape), padding 0.45rem 1.1rem
- **Hover state:** full orange fill (#E07800), dark text (#141414), font-weight 600. Transition ~200ms ease.
- **Layout:** flex-wrap, centered, gap 0.6rem
- **Semantics:** `<a>` tags with href to service routes

## Animation

### SplitText Character Reveal

- GSAP SplitText splits the manifesto into individual characters
- ScrollTrigger scrubs the reveal: each char transitions from `{ opacity: 0, y: 20 }` to `{ opacity: 1, y: 0 }`
- Characters reveal sequentially left-to-right, line-by-line as the user scrolls
- Orange-highlighted words start white during reveal, then shift to `#E07800` after fully visible (color transition at end of each word's reveal)
- Scroll back reverses the animation (scrub: true)
- Section scroll distance: ~300vh pinned (enough for satisfying reveal pace)

### Pill Entrance

- Pills stagger in after the text is fully revealed
- Each pill: `{ opacity: 0, y: 15 }` → `{ opacity: 1, y: 0 }`
- Stagger: 0.1s between each pill
- Part of the same ScrollTrigger timeline, sequenced after the text reveal

### Reduced Motion

- `prefers-reduced-motion`: skip SplitText animation, show all text immediately at full opacity
- Pills visible immediately, no stagger
- Section height collapses from pinned 300vh to natural content height (100vh)

## Mobile (375px)

- Same vertical-center layout
- Text scales down via clamp() — no layout changes needed
- Pills shrink: ~0.65rem font, ~0.35rem 0.8rem padding, ~0.4rem gap
- Pills naturally wrap to 2 rows at small widths
- Touch: hover state not applicable, active/tap state shows orange fill briefly

## Data Layer

New `manifestoContent` export in `src/lib/data/content.ts`:

```typescript
export const manifestoContent = {
  statement: {
    en: 'I build the infrastructure your operations run on.'
  } satisfies LocalizedString,
  pills: [
    { label: { en: 'pipelines' } satisfies LocalizedString, serviceId: 'data-pipeline' },
    { label: { en: 'databases' } satisfies LocalizedString, serviceId: 'database-engineering' },
    { label: { en: 'dashboards' } satisfies LocalizedString, serviceId: 'analytics-reporting' },
    { label: { en: 'internal_tools' } satisfies LocalizedString, serviceId: 'internal-tooling' },
    { label: { en: 'web_apps' } satisfies LocalizedString, serviceId: 'web-development' },
  ],
} as const;
```

The component uppercases the statement for display. The data layer stores it in natural case for i18n flexibility.

## Files

| Action | File |
|--------|------|
| Create | `src/lib/components/Manifesto.svelte` |
| Create | `src/lib/components/Manifesto.test.ts` |
| Modify | `src/lib/data/content.ts` (add manifestoContent) |
| Modify | `src/lib/data/content.test.ts` (test manifestoContent) |
| Modify | `src/routes/+page.svelte` (import + render Manifesto) |
| Modify | `src/routes/home.test.ts` (test Manifesto renders) |

## What This Does NOT Include

- No changes to the Hero section (done in 13a)
- No other home page sections (13c–13f)
- No changes to service pages or data
- No new CSS tokens (uses existing brand/surface tokens)
