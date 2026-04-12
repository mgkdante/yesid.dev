# Slice 11 — Navbar Redesign + 404 Page: Design Spec

**Date:** 2026-04-09
**Status:** approved
**Design principle:** "Engineered, not designed" — infrastructure credibility with motion craft

## Target Audience

- **CDPQ / La Caisse:** Institutional-grade seriousness, systems thinking, clean lines, bold typography. Confidence without noise.
- **Upwork clients:** Fast clarity (under 30 seconds to find any key info), tech stack visibility, professional trust signals.
- **General:** The nav is a hiring funnel. Services + Work are the priority pair.

---

## Part 1: Navbar — "The Floating Pill"

### Design Direction

Centered floating pill capsule. Semi-transparent with backdrop blur and a subtle orange border glow. The pill hovers above page content, feels engineered — like a system status bar, not a marketing header.

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────┐
│                                                   │
│      ╭──────────────────────────────────────╮     │
│      │ yesid. │ Services  Work  Stack │ ☰  │     │
│      ╰──────────────────────────────────────╯     │
│           [ ████░░░░░░░░░░░░░░░░░░░░░░ ]         │
│                                                   │
│              Page content below                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Pill structure:** `wordmark | divider | Services Work Stack | divider | menu-icon`

- **Background:** `rgba(20, 20, 20, 0.92)` with `backdrop-filter: blur(16px)`
- **Border:** `1px solid rgba(224, 120, 0, 0.1)` — subtle orange tint
- **Border radius:** `999px` (full capsule)
- **Shadow:** `0 4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)`
- **Position:** Fixed, centered horizontally, `top: 16px`
- **Dividers:** `1px` vertical lines, `rgba(255,255,255,0.08)`, 18px tall

### Progress Rail

Three segments directly below the pill (centered, same width as pill content area). The segment corresponding to the active route fills with `#E07800`. Others are `rgba(255,255,255,0.05)`. Each segment is `2px` tall with `border-radius: 1px`, separated by `3px` gaps.

- On `/services` → segment 1 fills
- On `/work` or `/work/[slug]` → segment 2 fills
- On `/tech-stack` → segment 3 fills
- On other routes (Blog, About, Contact, Home) → no segment fills (all dim)

When only 2 links are visible (mobile), the rail has 2 segments.

### Mobile — Adaptive Pill

The pill adapts based on available width, not a hard breakpoint:

| Condition | Pill contents | Rail segments |
|-----------|--------------|---------------|
| **3 links fit comfortably** (≥480px typical) | yesid. \| Services Work Stack \| menu | 3 |
| **3 links too tight** (<480px typical) | yesid. \| Services Work \| menu | 2 |

**Fit determination:** The 3-link pill requires approximately 380px minimum width (wordmark ~70px + 3 links ~170px + menu ~30px + dividers + padding ~60px). Use a CSS media query at `min-width: 480px` to show 3 links; below 480px show 2 links. This covers all common foldables (Galaxy Fold: 280px folded/512px open, Pixel Fold: 360px/616px) and small phones (iPhone SE: 375px). The 480px threshold ensures comfortable spacing — no cramping.

Stack is the first link to drop because Services + Work are the priority hiring pair.

### Wordmark

- **Font:** Inter Bold (700), letter-spacing `-0.3px`
- **Minimum size:** 17px — never smaller on any device
- **Breakpoints:** 18px at ≥1024px, 17px below
- **Orange dot:** `#E07800`, always present
- **Hover animation:** SplitText per-character effects carry over from current implementation (bounce → wiggle → wave → spin cycle). Orange dot pulses on every hover.
- **Legibility:** Font-weight 700 + Inter's wide x-height ensures readability at 17px minimum

### Links

- **Font:** Inter, 13.5px, regular weight (400). Active link: weight 500.
- **Active state:** `#E07800` text color + text-shadow glow (`0 0 8px rgba(224,120,0,0.5)`)
- **Hover:** Transition to `#E07800` with subtle text-shadow glow
- **Inactive:** `#aaa`
- **Active detection:** Route-based via `$page.url.pathname.startsWith(href)`

### Menu Icon

- 2-line asymmetric hamburger (top line 16px, bottom line 11px)
- Color: `#aaa`, transitions to `#fff` on hover
- Transforms to `✕` when menu is open (CSS transition)
- Housed inside the pill (no separate container)

### Scroll Behavior

- **Always visible.** No hide-on-scroll. The pill is compact enough to never feel intrusive.
- **No opacity changes on scroll.** Pill stays consistent.
- **Active link updates** reactively based on current SvelteKit route.

---

## Part 2: Menu Overlay — "Metro Dashboard"

### Trigger

Tap/click the menu icon in the pill. Same behavior on desktop and mobile — shared component, shared animation.

### Animation — Metro Map Unfold

1. **Open:** Overlay scales up from the pill's position (`transform-origin: center of pill`). Dark background expands outward like a ripple. Duration: **~250ms** `ease-out`. Must feel fast and mechanical, not floaty.
2. **Content stagger:** Links appear along the vertical metro line, staggered **40ms** apart. Each link fades in + translates up 12px.
3. **Close:** Reverse — links stagger out (faster, ~30ms apart), overlay collapses back into the pill position. **~200ms**.
4. **Body scroll locked** while overlay is open.

### Layout

```
╭──────────────────────────────────╮
│         yesid.  │  ✕             │  ← pill persists, icon = close
╰──────────────────────────────────╯

              ● Services               ← filled orange dot + glow
              │  what I build
              │
              ○ Work
              │  proof it ships
              │
              ○ Stack
              │  the toolbox
              │
              ○ Blog
              │  thoughts in transit
              │
              ○ About
              │  the operator
              │
              ○ Contact
                 open channel

       ──── NAVIGATION — ALL ROUTES ────
```

### Visual Details

- **Background:** Solid `#0a0a0a` with subtle radial gradient `rgba(224,120,0,0.04)` from top center
- **Metro line:** Vertical, connecting stop dots. 2px wide, color fades from orange (near active) to `rgba(255,255,255,0.06)`
- **Active stop:** Filled circle, `#E07800`, `box-shadow: 0 0 12px rgba(224,120,0,0.4)`
- **Inactive stops:** Hollow circles, `border: 2px solid rgba(255,255,255,0.2)`
- **Link text:** 24px Inter SemiBold (600). Active = `#E07800`, others = `#ccc`
- **Subtitles:** Monospace, 11px, `#666`. One-line descriptions adding personality.
- **Hover:** Link text transitions to `#E07800` with text-shadow glow. Stop dot fills.
- **Bottom label:** `NAVIGATION — ALL ROUTES` in monospace, 10px, letter-spacing 3px, `rgba(224,120,0,0.5)`
- **Pill persists** at top — wordmark + close icon. Menu icon morphs to ✕.

### Subtitle Copy

| Link | Subtitle |
|------|----------|
| Services | what I build |
| Work | proof it ships |
| Stack | the toolbox |
| Blog | thoughts in transit |
| About | the operator |
| Contact | open channel |

All subtitles go through `LocalizedString` for i18n readiness.

---

## Part 3: 404 Page — "Station Under Construction"

### Route

SvelteKit `+error.svelte` at root level (`src/routes/+error.svelte`). Catches all unmatched routes. The pill navbar renders normally — users always have navigation.

### Layout (top to bottom)

1. **Hazard tape** — full-width horizontal stripe, 4px tall, repeating `-45deg` gradient (`#FFB627` / `#0a0a0a`)
2. **Construction scene** — centered SVG illustration
3. **Error text** — monospace label + heading + description
4. **Route suggestions** — 3 link buttons (Services, Work, Home)
5. **Terminal status line** — `$ route --status 404 // requested path not in service`
6. **Hazard tape** — matching bottom stripe

### SVG Construction Scene (`ConstructionScene.svelte`)

Single inline SVG component containing:

- **Platform:** Horizontal line at bottom, subtle gradient
- **Scaffolding:** Two vertical structures (left taller, right shorter) with horizontal cross-beams. Color: `rgba(255,182,39,0.3)`
- **Station sign:** Centered, bordered box. "STATION" label in monospace above large "404" in Inter ExtraBold, `#E07800`
- **Barriers:** Two chevron-striped barriers (`#FFB627` / `#0a0a0a` repeating gradient) on legs
- **Cones:** Two orange traffic cones (simple triangles on rectangles)
- **Construction lights:** Two amber circles on top of barriers. Alternate blinking via CSS animation (1.2s interval, one fully lit with glow, one dim)

Scene scales responsively. ~320px wide on desktop, scales down with `viewBox` on mobile.

### Animated Elements

| Element | Animation | Duration | Reduced Motion |
|---------|-----------|----------|----------------|
| Construction lights | Alternate blink (CSS `@keyframes`) | 1.2s loop | Static (one on, one dim) |
| Station sign | Fade in + scale 0.9→1.0 | 300ms ease-out | Opacity fade only |
| "ROUTE NOT FOUND" | Typewriter letter-by-letter | ~600ms | Instant appear |
| Heading + description | Fade in after label | 300ms, 200ms delay | Instant appear |
| Route suggestion buttons | Stagger in | 80ms apart | Instant appear |
| Terminal status line | Typewriter character-by-character | ~800ms, after buttons | Instant appear |
| Terminal cursor | Blink after typing completes | 1s loop | No cursor |

### Error Text

- **Label:** `ROUTE NOT FOUND` — monospace, 11px, letter-spacing 3px, `rgba(224,120,0,0.5)`
- **Heading:** "This station is under construction" — Inter Bold, 28px (desktop) / 22px (mobile), `#f5f5f5`
- **Description:** "The route you requested doesn't exist or has been rerouted. Here are some active lines:" — 14px, `#888`, max-width 400px
- **All copy via `LocalizedString`** for EN/FR/ES

### Route Suggestion Buttons

Three pill-shaped link buttons, centered, wrapping on mobile:

| Button | Style | Link |
|--------|-------|------|
| Services | Orange bg tint (`rgba(224,120,0,0.08)`), orange border, filled dot | `/services` |
| Work | Dark bg, subtle border, hollow dot | `/work` |
| Home | Dark bg, subtle border, hollow dot | `/` |

Hover: border brightens, slight scale-up.

### Terminal Status Line

```
$ route --status 404 // requested path not in service
```

- Monospace, 11px, `#444`
- `$` and `404` in `#E07800`
- `--status` in `#666`
- Comment in `#444`

---

## Shared Technical Details

### Dependencies

No new packages. Uses existing:
- GSAP + SplitText (wordmark animation, menu stagger, 404 typewriter)
- SvelteKit routing (`$page`, `+error.svelte`)
- Tailwind CSS + tokens.css
- `LocalizedString` from data layer

### Accessibility

- Menu overlay: `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
- Escape key closes menu
- Focus trap inside menu when open
- Active link: `aria-current="page"`
- Construction lights: `aria-hidden="true"` (decorative)
- Reduced motion: All animations degrade gracefully (see table above)
- Keyboard navigation: Tab through menu links, Enter to select

### Testing Strategy

- **Nav component tests:** Pill renders with correct links per breakpoint, active state, menu open/close, wordmark structure, keyboard navigation
- **404 tests:** Error page renders, construction scene present, route suggestion links work, copy renders
- **Visual/animation:** Deferred to E2E (Playwright) — not Vitest

---

## Out of Scope

- Footer redesign (Slice 12)
- Home page changes (Slice 13)
- Light theme / theme toggle
- Page transition animations (keep existing fade-in)
- Nav scroll progress tied to page scroll position (progress rail tracks route, not scroll depth)
