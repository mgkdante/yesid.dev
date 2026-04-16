# Contact Page Redesign — Design Spec

> **Sub-slice:** 17d-6
> **Branch:** `feature/slice-17d-component-api`
> **Date:** 2026-04-16
> **Status:** Approved

---

## 1. Goal

Redesign the contact page from a contained `max-width` layout to a full-bleed edge-to-edge design using Recipe 4 (Edge Title Grid). Add a resizable split between the info and form terminals using Paneforge. Keep all existing terminal functionality intact.

## 2. Current State

- **Layout:** Contained `max-width: var(--container-content)` with `SectionHeading` + two `TerminalChrome` panels in a `2fr 5fr` CSS grid.
- **Info terminal:** Location, response time, social links (email, GitHub, LinkedIn), blinking cursor.
- **Form terminal:** 3 fields (name, email, message), Web3Forms submit, typed success sequence animation.
- **Data layer:** `contactContent` in `src/lib/data/contact-page.ts` with unused `status` and `availability` fields.
- **File:** `src/lib/components/contact/ContactPage.svelte` (~320 lines).

## 3. Design Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D218 | Recipe 4 Edge Title Grid layout | Matches Blog/Projects listing pages — contact feels like part of the same family |
| D219 | Big rotated "Contact." edge title (same `clamp(8rem, 15vw, 15rem)` sizing) | Yesid wants it taking a good chunk — oversized, bold, same energy as other pages |
| D220 | Accent line between edge title and content | Same pattern as Blog/Projects — 1px orange line at 25% opacity |
| D221 | Resizable split via Paneforge `ResizablePaneGroup` | Playful interaction — user can drag to resize info vs form terminal |
| D222 | Default pane ratio 33%/67% (info/form) | Form is the #1 priority, gets more space by default |
| D223 | Min pane sizes: info 20%, form 40% | Prevents either terminal from being collapsed to unusable |
| D224 | Resize handle: 5-dot grip, turns orange on hover | Visual affordance for draggability, brand color on interaction |
| D225 | Mobile: stacked vertically, info first, form second | Info first so users see alternative contact channels before the form |
| D226 | Mobile: no resize handle, no edge title | Edge title hides below `xl:` per Constitution. Resize not useful on mobile. |
| D227 | Remove `status` and `availability` from contact data layer | Yesid doesn't want these displayed |
| D228 | Full-bleed — no max-width container on the terminal area | Terminals stretch with the viewport, only page gutters (`--space-page-x`) constrain |
| D229 | Live weather for Montreal in info terminal location section | Real infra touch — shows current temp + condition |
| D230 | Reuse existing weather fetch pattern from About page | Server-side via `+page.server.ts`, OpenWeatherMap, 30-min cache, API key stays on server |
| D231 | Show Montreal local time in info terminal | Client-side `Intl.DateTimeFormat` with `America/Montreal` timezone, updates every minute via `setInterval` |

## 4. Layout — Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────┐
│ Nav                                                  │
├─────────┬───┬────────────────────────────────────────┤
│         │   │ SectionHeading: "Contact."             │
│         │   │ Station label: CONTACT — NEXT STOP: YOU│
│  C      │   │                                        │
│  o      │ ┃ │ ┌─────────────┬──┬────────────────────┐│
│  n      │ ┃ │ │ Info        │▪▪│ Form               ││
│  t      │ ┃ │ │ Terminal    │▪▪│ Terminal            ││
│  a      │   │ │             │▪▪│                     ││
│  c      │   │ │ LOCATION    │▪▪│ name: [          ] ││
│  t      │   │ │ Montreal    │▪▪│ email: [         ] ││
│  .      │   │ │             │▪▪│ message:           ││
│         │   │ │ CONNECT     │▪▪│ [                ] ││
│ (rotated│   │ │ → email     │▪▪│                    ││
│  title) │   │ │ → github    │▪▪│ [send --message →] ││
│         │   │ │ → linkedin  │  │                    ││
│         │   │ │             │  │                    ││
│         │   │ │ ~ █         │  │                    ││
│         │   │ └─────────────┴──┴────────────────────┘│
├─────────┴───┴────────────────────────────────────────┤
│ Footer                                               │
└──────────────────────────────────────────────────────┘
```

### Grid structure

```css
.contact-grid {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .contact-grid {
    grid-template-columns: auto 1px 1fr;
    margin-top: -5rem; /* extend behind nav like other pages */
  }
  .edge-title {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: clamp(8rem, 15vw, 15rem);
    font-weight: 900;
    color: var(--text-muted);
    opacity: 0.06;
    position: sticky;
    top: 0;
    height: 100dvh;
  }
  .accent-divider {
    background: var(--primary);
    opacity: 0.25;
  }
}
```

### Resizable area (desktop only)

```svelte
<ResizablePaneGroup direction="horizontal">
  <ResizablePane defaultSize={33} minSize={20}>
    <TerminalChrome title="yesid@mtl ~/info">
      <!-- info content -->
    </TerminalChrome>
  </ResizablePane>
  <ResizableHandle />
  <ResizablePane defaultSize={67} minSize={40}>
    <TerminalChrome title="yesid@mtl ~/contact">
      <!-- form content -->
    </TerminalChrome>
  </ResizablePane>
</ResizablePaneGroup>
```

## 5. Layout — Mobile (<1024px)

```
┌──────────────────────┐
│ Nav                  │
├──────────────────────┤
│ Contact.             │
│ NEXT STOP: YOU       │
│                      │
│ ┌──────────────────┐ │
│ │ Info Terminal     │ │
│ │ LOCATION          │ │
│ │ Montreal, QC      │ │
│ │ CONNECT           │ │
│ │ → email → github  │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │ Form Terminal     │ │
│ │ name: [        ]  │ │
│ │ email: [       ]  │ │
│ │ message:          │ │
│ │ [              ]  │ │
│ │ [send --message]  │ │
│ └──────────────────┘ │
├──────────────────────┤
│ Footer               │
└──────────────────────┘
```

- Edge title: `display: none` below `xl:` (1024px)
- Accent divider: hidden
- Terminals: stacked with `var(--space-card-gap)` between them
- No `ResizablePaneGroup` — direct stack of two `TerminalChrome` components
- Page heading visible (inline `SectionHeading`)

## 6. Components Used

| Component | Source | Role |
|-----------|--------|------|
| `TerminalChrome` | brand/ | Terminal window chrome (traffic lights, title) |
| `SectionHeading` | brand/ | Page heading with station label |
| `ResizablePaneGroup` | ui/resizable | Horizontal resizable container |
| `ResizablePane` | ui/resizable | Individual pane |
| `ResizableHandle` | ui/resizable | Draggable divider between panes |
| `Button` | ui/button | Submit button |
| `TerminalCursor` | shared/ | Blinking cursor in info terminal |

## 7. Resize Handle Styling

The default shadcn handle needs brand treatment:

- **Visual:** 5-dot vertical grip pattern (3px dots, 3px gap)
- **Default state:** `var(--muted-foreground)` dots on `var(--card)` background
- **Hover:** Background turns `var(--primary)`, dots turn `var(--background)` (dark on orange)
- **Width:** 8px
- **Border-radius:** `var(--radius-sm)` (4px)
- **Transition:** `background var(--duration-fast) var(--ease-default)`

## 8. Data Layer Changes

### Add: Weather in info terminal

The LOCATION section gains a live weather line:

```
LOCATION
Montreal, QC, Canada
12°C — Partly Cloudy
14:32 EST — ~24h response time
```

- **Reuse existing pattern** from `src/routes/about/+page.server.ts` — same OpenWeatherMap server-side fetch
- Extract shared weather utility to `src/lib/data/weather.ts` (DRY — both About and Contact use it)
- Add `src/routes/contact/+page.server.ts` that calls the shared utility
- Server-side fetch — API key stays on server via `$env/dynamic/private`
- 30-min in-memory cache (same as About page)
- Pass `weather` prop to `ContactPage` component
- Show: temp (°C) + short condition text, inline in terminal mono style
- Graceful fallback: if fetch fails or key missing, just don't show the weather line
- No weather animations (unlike About bento card) — just a text line in the terminal

### Remove from `src/lib/data/contact-page.ts`

```diff
  infoTerminal: {
    title: 'yesid@mtl ~ /info',
    command: '$ yesid --info',
-   status: { en: 'Available for projects' },
-   availability: { en: 'Booking Q3 2026' },
    location: { en: 'Montreal, QC, Canada' },
    responseTime: { en: '~24h response time' },
    sectionLabels: {
-     status: { en: 'STATUS' },
      location: { en: 'LOCATION' },
      connect: { en: 'CONNECT' },
    },
  },
```

### Remove from `src/lib/data/types.ts`

Remove `status`, `availability`, and `sectionLabels.status` from `ContactContent` type.

## 9. What Stays Unchanged

- **Form logic:** Validation, error display, Web3Forms submit, `handleSubmit`, `handleReset`
- **Success animation:** `playSuccessSequence()` typed line reveal (150ms per line)
- **Form fields:** name, email, message (same IDs, same labels, same placeholders)
- **Social links:** email, GitHub, LinkedIn with same `data-testid` attributes
- **Info terminal content:** Location, live weather, response time, social links, blinking cursor
- **Route:** `src/routes/contact/+page.svelte` — updated to pass `weather` prop from server load

## 10. Test Impact

- Existing tests in `ContactPage.test.ts` should continue passing — same `data-testid` attributes, same form fields, same validation behavior.
- May need to mock or skip Paneforge in test environment (similar to how GSAP is mocked).
- Add test: verify resize handle renders on desktop viewport simulation (if feasible).

## 11. Acceptance Criteria

1. Page uses Recipe 4 Edge Title Grid with rotated "Contact." title at `clamp(8rem, 15vw, 15rem)`
2. Accent line (1px, orange, 25% opacity) between edge title and content
3. Resizable split between info and form terminals (Paneforge)
4. Default split: 33% info / 67% form
5. Resize handle shows dot grip, turns orange on hover
6. Mobile: stacked (info first, form second), no edge title, no resize
7. `status` and `availability` removed from data layer
8. All existing tests pass
9. Form submit + typed success sequence works identically
10. Live weather shows in info terminal (temp + condition), graceful fallback if unavailable
11. `bun run check` passes with 0 errors

## 12. Mockups

- Desktop + mobile mockups: `.superpowers/brainstorm/769-1776313859/content/contact-design-final.html`
- Layout options explored: `.superpowers/brainstorm/769-1776313859/content/contact-layout-options.html`
