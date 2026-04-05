# Handoff: Slice 05 — Layout Shell + Scroll Progress Rail

## Summary
Built the root layout shell that wraps every page: a fixed Nav bar with responsive mobile menu, a minimal Footer with social links, and a ScrollRail that shows data-driven station markers on the home page and a simple progress bar on all other pages. The site now has a consistent frame ready for page content in slices 06-08.

## What Was Built
- `src/lib/components/Nav.svelte`: Navigation bar with "yesid." wordmark, Work/About/Contact links, responsive hamburger menu, active route highlighting
- `src/lib/components/Nav.test.ts`: 9 unit tests covering structure, links, active state, and mobile hamburger
- `src/lib/components/Footer.svelte`: Minimal footer with brand name, year, GitHub/LinkedIn links
- `src/lib/components/Footer.test.ts`: 5 unit tests covering rendering, year, and social links
- `src/lib/motion/components/ScrollRail.svelte`: Dual-mode scroll progress indicator (station dots on home, progress bar elsewhere)
- `src/lib/motion/components/ScrollRail.test.ts`: 6 unit tests covering both modes and data-driven station count

## Files Modified
- `src/routes/+layout.svelte`: Composes Nav + ScrollRail + page content + Footer; adds CSS page transition (250ms fade-in, respects reduced motion)
- `src/routes/+page.svelte`: Simplified — outer wrapper removed (layout provides it now); kept `data-testid="app-root"` for existing tests
- `docs/ARCHITECTURE.md`: Added Nav, Footer, ScrollRail to structure diagram
- `docs/devlog/2026-04-02.md`: Appended slice 05 session log
- `tree.txt`: Regenerated

## How It Works
The root layout (`+layout.svelte`) is the shell that wraps every page:

```
Nav (fixed top, z-50)
ScrollRail (fixed right, z-40)
  {#key pathname}
    <main> → {@render children()} → page content
  {/key}
Footer
```

**Nav** and **ScrollRail** accept a `pathname` prop instead of reading `$page` directly. The layout reads `$page.url.pathname` and passes it down. This makes both components testable in isolation without mocking SvelteKit stores.

**ScrollRail** has two modes:
- **Home (`/`):** Station dots derived from `services.length`. Each dot fills orange as `scrollProgress` passes its evenly-distributed threshold. Adding a service adds a dot — zero code changes.
- **Other pages:** Simple progress bar where height = `scrollProgress * 100%`.

**Page transitions** use `{#key $page.url.pathname}` + CSS `@keyframes page-fade-in` (250ms). When `$prefersReducedMotion` is true, the animation class is not applied.

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Prop injection for `pathname` | Keeps Nav/ScrollRail testable without mocking `$app/stores` | Reading `$page` directly in each component — harder to test |
| CSS page transitions | Svelte 5 `{#key}` doesn't support `transition:` directives the same way; CSS animations are simpler | GSAP transitions — overkill for a fade |
| `aria-current="page"` for active links | Semantic accessibility; screen readers announce "current page" | Visual-only highlight with a class |
| `aria-hidden="true"` on ScrollRail | Decorative element; no information not already in page content | Exposing to accessibility tree |
| Station threshold = `i / (length - 1)` | Evenly distributes dots across scroll range; first active at 0%, last at 100% | Fixed percentages — breaks when service count changes |

## What Yesid Should Know
**SvelteKit Layouts** wrap every page automatically. `+layout.svelte` renders once; the page content swaps inside `{@render children()}`. Add a new page file and it gets Nav + Footer for free — no copy-paste.

**Prop injection** is a testing pattern: instead of a component reaching out to a global store, the parent passes the value as a prop. It's like parameterizing a SQL function instead of having it query a config table internally — same result, but the function is easier to test in isolation.

**`{#key}`** remounts the DOM when the key changes. We use `$page.url.pathname` as the key, so navigating to a new route triggers a fresh mount with the fade-in animation. The old content unmounts instantly (no exit animation).

## What Comes Next
**Slice 06** builds the home page journey: station content sections, the 3D Threlte hero scene, SVG train on the scroll rail. The layout shell from this slice provides the frame; slice 06 fills it with content.

## How to Verify
1. `bun run test` — all 169 tests pass (22 files)
2. `bun run check` — 0 errors, 0 warnings
3. `bun run dev` → visit `http://localhost:5173/`
4. Nav shows on every page with "yesid." wordmark and links (Work, About, Contact visible at desktop width)
5. Resize to mobile: hamburger appears, clicking it toggles the link menu
6. Footer at bottom: "© 2026 yesid." with GitHub and LinkedIn links
7. Home page (`/`): ScrollRail shows 4 station dots on the right edge
8. Navigate to any other route: ScrollRail shows a progress bar, no station dots
9. Scroll on home page: station dots fill orange progressively
