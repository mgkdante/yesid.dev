# Dev Log — 2026-04-14 to 2026-04-15

## Slice: 17d-4 — Blog Detail Page (Sessions 8-10)

### Session Start
- **Time:** Session 8: 2026-04-14 (planning), Session 9: 2026-04-14 (implementation), Session 10: 2026-04-15 (polish)
- **Slice spec:** `docs/plans/2026-04-14-blog-detail-page.md`
- **Goal:** Build the blog detail page as an infrastructure magazine editorial — full-bleed header, 4-zone body grid with rotated edge labels, sticky TOC, mobile pill, Shiki syntax highlighting. Fix font layout shift and overflow bugs found during testing.

### Work Done

- [x] Task 1: Route bypass via +page@.svelte
  - **Files created:** `src/routes/blog/[slug]/+page@.svelte`
  - **Files modified:** `src/routes/blog/[slug]/+page.ts`, `src/routes/+layout.svelte`
  - **Decision:** D170 — Same pattern as project detail (bypasses ListingLayout)

- [x] Task 2: BlogDetailHeader rebuilt from scratch
  - **Files created:** `src/lib/components/blog/BlogDetailHeader.svelte`
  - **Decision:** Magazine cover design — circuit grid, ManifestoCanvas watermark, CornerMarks, edge labels, SplitText title with tag highlight, GSAP entrance

- [x] Task 3: BlogRouteMap component (later removed)
  - **Files created:** `src/lib/components/blog/BlogRouteMap.svelte`, `BlogRouteMap.test.ts`
  - **Decision:** D170 — Replaced with "Begin." / "Transmission." rotated edge labels per feedback

- [x] Task 4: BlogDetailPage orchestrator — 4-zone body grid
  - **Files created:** `src/lib/components/blog/BlogDetailPage.svelte`, `BlogTocPill.svelte`
  - **Decision:** D171-D178 — Edge labels section-level, equal column widths, ghost dimmed text, reading mode via opacity

- [x] Task 5: TOC wiring + left column metadata
  - **Files modified:** `src/lib/components/blog/BlogDetailPage.svelte`
  - **Decision:** Shared IntersectionObserver drives both desktop TOC and mobile pill

- [x] Task 6: N/A (route map animation — component removed)

- [x] Task 7: BlogDetailPage structure tests
  - **Files created:** `src/lib/components/blog/BlogDetailPage.test.ts`
  - **Files modified:** `src/tests/setup.dom.ts`
  - **Decision:** 5 tests covering testid, header render, content render, accent colors

- [x] Task 8: Visual verification + polish
  - **Files modified:** `BlogDetailPage.svelte`, `BlogContent.svelte`, `app.html`, `app.css`, `+layout.svelte`, `package.json`
  - **Decision:** D179-D182 — overflow-x: clip, self-hosted fonts, DOM measurement, opacity fade-in
  - **Learning note:** overflow-x: hidden creates a scroll container that breaks sticky — use clip instead

### Additional work (shared infrastructure):
- Shiki syntax highlighting with brand theme (highlight.ts) — shared by blog + project README
- Reading mode toggle with direct opacity dimming
- Mobile side margins on blog + project detail body
- Scroll-margin-top on all headings with IDs
- Prose text bumped to 17px mobile / 18px desktop

### Commands Executed

```bash
bun install @fontsource-variable/inter @fontsource-variable/jetbrains-mono
bun run test
bun run check
bun run dev
```

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `bun run test` | PASS | 785 tests (was 780 before Session 10) |
| `bun run check` | PASS | 0 errors, 18 warnings |

### Packages Added

| Package | Why |
|---------|-----|
| `@fontsource-variable/inter` | Self-hosted Inter variable font — eliminates Google Fonts CDN layout shift |
| `@fontsource-variable/jetbrains-mono` | Self-hosted JetBrains Mono variable font |

### Errors Encountered

| Error | Cause | Fix | Resolved |
|-------|-------|-----|----------|
| Sticky TOC not sticking | overflow-x: hidden on body-grid created scroll container | Changed to overflow-x: clip | Yes |
| Mobile code blocks overflowing | pre blocks had no width constraint | overflow-x-hidden on card + min-w-0 at all breakpoints | Yes |
| Font layout shift | Google Fonts CDN font-swap delay | Self-hosted @fontsource-variable | Yes |
| Edge labels wrong size | Pretext didn't account for letter-spacing | DOM getBoundingClientRect measurement | Yes |
| gsap.utils.selector undefined | Missing mock in test setup | Added stub to setup.dom.ts | Yes |

### Blockers / Questions
- None — all issues resolved during Session 10

### Session End
- **Time:** 2026-04-15 15:07
- **Files created:** 8 (BlogDetailPage, BlogDetailHeader, BlogRouteMap, BlogTocPill, BlogDetailPage.test, BlogRouteMap.test, highlight.ts, +page@.svelte)
- **Files modified:** 10 (see handoff section 4)
- **Tests passing:** yes (785/785)
- **Ready for handoff:** yes
