# Dev Log — 2026-04-05

## Slice: 08 — Work Pages (Iteration 3)

### Session Start
- **Time:** 21:30
- **Slice spec:** docs/slices/slice-08-work.md
- **Goal:** Fix ToC positioning, card styling, collapsible sections, branded scrollbar

### Work Done
- [x] ToC repositioned to left page margin (absolute positioning, `right-full`)
  - Files changed: `WorkDetailPage.svelte`, `blog/[slug]/+page.svelte`
  - Decision: Used `position: absolute; right: 100%` inside a `relative` wrapper around the README section. This keeps the content at full width (max-w-6xl) while the ToC floats in the margin.
  - Breakpoint: `2xl` (1536px+) for ToC visibility, mobile fallback inside README card.

- [x] ToC collapsible with smooth animation
  - Files changed: `TableOfContents.svelte`
  - Decision: Added `embedded`, `startOpen`, `syncOpen` props. Used `{#snippet}` for shared entry rendering. Collapsible header ("On this page") + collapsible section groups (h1/h2 parents toggle h3/h4 children). Smooth grid-template-rows animation.

- [x] ToC syncs with README collapse state
  - Files changed: `TableOfContents.svelte`, `WorkDetailPage.svelte`
  - Decision: `syncOpen` prop uses `$effect` to sync `tocOpen` with parent's `readmeOpen`. When README collapses, ToC smoothly collapses to just the header.

- [x] Section cards restructured: title div + body div
  - Files changed: `WorkDetailPage.svelte`
  - Decision: Full-width `<button>` for title row (whole row clickable). Body collapses via grid animation. SVG chevrons (h-5 w-5) replaced tiny text characters.

- [x] WorkCard improvements
  - Files changed: `WorkCard.svelte`
  - Taller image area (280px), bigger service SVG (72px), "SERVICES" label added, bigger labels (9px/10px).

- [x] Branded scrollbar site-wide
  - Files changed: `src/app.css`
  - Orange thumb (#E07800 at 35%), brighter on hover (60%), transparent track. Both `scrollbar-color` (Firefox) and `::-webkit-scrollbar` (Chrome/Safari).

- [x] Hide horizontal scroll
  - Files changed: `src/app.css`
  - `overflow-x: hidden` on `html`.

- [x] README auto-convert GitHub blob URLs to raw URLs
  - Files changed: `src/routes/work/[slug]/+page.ts`
  - Decision: Auto-converts `github.com/.../blob/...` URLs to `raw.githubusercontent.com` so users can paste either format.

- [x] Fixed duplicate "On this page" heading
- [x] Mobile ToC starts collapsed (`startOpen={false}`)
- [x] Blog page ToC uses same margin positioning pattern

### Blockers / Questions
- None

### Session End
- **Files modified:** `src/app.css`, `TableOfContents.svelte`, `TableOfContents.test.ts`, `WorkCard.svelte`, `WorkDetailPage.svelte`, `projects.ts`, `blog/[slug]/+page.svelte`, `work/[slug]/+page.ts`
- **Tests passing:** yes (290/290)
- **Ready for handoff:** yes
