# Handoff: Slice 17d-4 — Blog Detail Page (Sessions 8-10)

## 1. Objective Completed

**Implemented:**
- Full-bleed blog detail page matching the infrastructure magazine editorial design spec
- Magazine cover header with circuit grid, ManifestoCanvas, watermark, CornerMarks, edge labels, SplitText title, tag pills, and GSAP entrance timeline
- 4-zone body grid: BEGIN edge label | TOC + prose content | TRANSMISSION edge label
- Sticky TOC with IntersectionObserver heading tracking, reading mode toggle, metadata panel
- BlogTocPill for mobile (floating pill with heading hierarchy)
- Shiki syntax highlighting with brand theme (orange keywords, yellow strings)
- Reading mode that dims header/edges/footer to focus on content
- Edge labels dynamically sized via DOM getBoundingClientRect to span exactly 100dvh
- Self-hosted fonts replacing Google Fonts CDN (zero layout shift)

**Intentionally not implemented:**
- Route map animation (Task 6) — BlogRouteMap component was built but later replaced with edge labels per feedback (D170)
- Reading progress bar — removed per feedback during planning session

## 2. High-Level Summary

Built an infrastructure magazine editorial blog detail page across 3 sessions: planning (S8), implementation (S9), and bug fixes + polish (S10). The page uses `+page@.svelte` to bypass ListingLayout, rendering a full-bleed header followed by a 4-zone body grid with rotated edge labels ("Begin." / "Transmission.") that auto-size to viewport height. Desktop shows sticky TOC in the left column with reading mode toggle and post metadata. Mobile shows a floating BlogTocPill. Shiki provides brand-colored syntax highlighting for code blocks. Self-hosted fonts via @fontsource-variable eliminated the Google Fonts CDN dependency and layout shift. The `overflow-x: clip` pattern replaced `overflow-x: hidden` on the body grid to prevent breaking `position: sticky`.

## 3. Files Created

| File | Purpose |
|------|---------|
| `src/lib/components/blog/BlogDetailPage.svelte` | Blog detail page orchestrator — 4-zone body grid, TOC, edge labels, reading mode |
| `src/lib/components/blog/BlogDetailPage.test.ts` | 5 structure tests (testid, header, content, accent colors) |
| `src/lib/components/blog/BlogDetailHeader.svelte` | Full-bleed magazine cover header (rebuilt from scratch) |
| `src/lib/components/blog/BlogRouteMap.svelte` | Transit route SVG component (kept but unused — replaced by edge labels) |
| `src/lib/components/blog/BlogRouteMap.test.ts` | 6 tests for BlogRouteMap |
| `src/lib/components/blog/BlogTocPill.svelte` | Floating mobile TOC pill (same UX as ProjectTocPill) |
| `src/lib/data/highlight.ts` | Shared Shiki + marked config for syntax highlighting |
| `src/routes/blog/[slug]/+page@.svelte` | Clean route that bypasses ListingLayout |

## 4. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `src/routes/blog/[slug]/+page.ts` | Added postIndex to load data | Edge label + header station numbering |
| `src/routes/+layout.svelte` | isFullBleed check for blog detail paths + @fontsource-variable imports | Route bypass + self-hosted fonts |
| `src/lib/data/blog.ts` | Imports marked from highlight.ts | Shared highlighting config |
| `src/lib/components/blog/BlogContent.svelte` | overflow-x-hidden on card + min-w-0 on section-content | Mobile code block overflow fix |
| `src/app.html` | Removed Google Fonts CDN link, comment-only now | Self-hosted fonts replace CDN |
| `src/app.css` | :root font-family overrides for variable fonts, prose sizing, Shiki styles, scroll-margin-top | Variable font integration + global patterns |
| `src/tests/setup.dom.ts` | Added gsap.utils.selector mock | BlogDetailPage GSAP usage in tests |
| `src/routes/projects/[slug]/+page.ts` | Imports marked from highlight.ts | Shared highlighting for project README |
| `src/lib/components/projects/ProjectDetailPage.svelte` | Mobile side margins on body | Consistent spacing with blog detail |
| `package.json` + `bun.lock` | Added @fontsource-variable/inter, @fontsource-variable/jetbrains-mono | Self-hosted fonts |

## Concepts Documented

| Action | File | Domain |
|--------|------|--------|
| Created | `docs/learn/styling/overflow-clip-vs-hidden.md` | styling |
| Created | `docs/learn/devops/self-hosted-fonts.md` | devops |
| Created | `docs/learn/patterns/dom-based-text-measurement.md` | patterns |

_See `docs/learn/README.md` for the full knowledge base._

## 5. Data Model Changes

No type/interface changes. `postIndex` added to blog detail route load data (computed from existing `blogPosts` array).

## 6. Commands Executed

```bash
bun install @fontsource-variable/inter @fontsource-variable/jetbrains-mono
bun run test
bun run check
bun run dev
```

## 7. Validation Results

```
bun run test: PASS (785 tests, 0 failures)
bun run check: PASS (0 errors, 18 warnings)
```

Visual verification at 1440px and 375px — zero horizontal overflow, zero console errors.

## 8. Errors Encountered

| Error | Cause | Fix | Resolved |
|-------|-------|-----|----------|
| Left panel not sticking on desktop | `overflow-x: hidden` on `.body-grid` created a scroll container that broke `position: sticky` | Changed to `overflow-x: clip` — clips visually without creating scroll container | Yes |
| Mobile code blocks overflowing card | `<pre>` blocks had no width constraint on mobile | Added `overflow-x-hidden` on BlogContent card + moved `min-width: 0` to all breakpoints | Yes |
| Font layout shift on load | Google Fonts CDN caused font-swap delay | Replaced with self-hosted @fontsource-variable packages | Yes |
| Edge label sizing incorrect | @chenglou/pretext didn't account for letter-spacing | Replaced with DOM-based getBoundingClientRect measurement | Yes |
| gsap.utils.selector undefined in tests | Missing mock in setup.dom.ts | Added `gsap.utils.selector` stub returning querySelectorAll | Yes |

## 9. Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 (S9) | Route map removed, replaced with edge labels | Built "Begin." / "Transmission." rotated labels | BlogDetailPage.svelte |
| 2 (S10) | Left panel not sticking | overflow-x: clip fix | BlogDetailPage.svelte |
| 3 (S10) | Mobile code blocks overflow | overflow-x-hidden + min-w-0 | BlogContent.svelte, BlogDetailPage.svelte |
| 4 (S10) | Font layout shift | Self-hosted @fontsource-variable | app.html, app.css, +layout.svelte, package.json |
| 5 (S10) | Edge labels still off (Pretext issue) | DOM getBoundingClientRect measurement | BlogDetailPage.svelte |
| Final | Approved | — | — |

## 10. Assumptions Made

- Edge labels use infrastructure radio protocol naming ("Begin." / "Transmission.") — matches project brand language
- Reading mode dims via direct opacity on elements (not overlay scrim) — preserves interactivity
- Shiki brand theme uses orange for keywords, yellow for strings, warm comments — mirrors site's orange/yellow palette
- BlogTocPill reuses same floating-pill UX pattern as ProjectTocPill
- Edge labels sized to exactly 100dvh using DOM measurement — accounts for letter-spacing and actual font metrics

## 11. Known Gaps / Deferred Work

- BlogRouteMap.svelte kept in repo but unused — can be deleted in a cleanup pass
- Edge label GSAP entrance animation not implemented (functional without it)
- Blog content max-width not constrained beyond SectionWrapper's prose column
- Blog + project detail share identical body grid pattern — potential extraction to shared shell in future

## 12. What Yesid Should Know

**overflow-x: clip vs hidden** — `overflow-x: hidden` creates a scroll container on its axis, which breaks `position: sticky` for children. `overflow-x: clip` clips visually without creating a scroll container. This is a CSS gotcha that affects any layout combining overflow control with sticky positioning.

**Self-hosted fonts** — Google Fonts CDN causes a layout shift because the browser renders with fallback fonts then swaps. `@fontsource-variable` bundles the font files with the app, so they're available immediately on load. The `:root` override in `app.css` sets the font-family globally.

**DOM-based text measurement** — Edge labels need to span exactly 100dvh when rotated. We measure at a reference font-size (100px) using `getBoundingClientRect`, then scale proportionally. This accounts for letter-spacing and actual font metrics that pure math can't predict.

## 13. Next Recommended Slice

**Services pages** — Yesid confirmed this is the next work area. The services listing and detail pages need the same constitutional wiring treatment that blog and projects received in 17d-4.

## 14. Final Status

**COMPLETE** — all 8 plan tasks done (Task 6 N/A), 785/785 tests pass, Yesid approved all iterations.

---

**Rules:**
- Be precise and honest.
- Do not claim something works unless you actually ran it.
- Do not hide failed commands.
- Do not summarize changes vaguely.
- Do not omit files you changed.
