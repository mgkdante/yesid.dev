# Dev Log — 2026-04-16

## Slice: 17d — Component API

### Session Start
- **Time:** Session spanned ~17 implementation sessions from 2026-04-12 to 2026-04-16
- **Slice specs:** `docs/slices/slice-17d-1-constitution-card-atoms.md`, `slice-17d-3-file-splits-svg-tokenization.md`, `slice-17d-4-wiring-edge-to-edge.md`
- **Goal:** Standardize component APIs, delete shell layer, wire all pages to CSS Grid Recipes, unify all cards. This is a summary devlog covering the full 17d effort with focus on the final card unification session.

### Work Done

- [x] 17d-1: Constitution + Card + Brand Atoms foundation
  - **Files created:** `ui/card/`, CONSTITUTION.md draft
  - **Decision:** Card surface 100% opaque, 25% primary border (D75)

- [x] 17d-3: File Splits + SVG Tokenization (2 sessions)
  - **Files created:** 12 Blueprint Svelte SVGs, sub-components for Manifesto, HomeCloser, HeroBanner, HomeServices, StackPanel
  - **Files modified:** Parent components refactored to import sub-components
  - **Decision:** Blueprint SVGs use `currentColor` + container `text-[var(--primary)]` (D99)
  - **Learning note:** `display: contents` wrapper preserves absolute positioning for split child components (D94)

- [x] 17d-4: Pre-pass P1-P9 + 7 Page Sessions (8.5 sessions)
  - **Files modified:** Every page component rewritten to CSS Grid Recipes
  - **Files created:** BlogDetailPage (from scratch), ProjectDetailPage (from scratch), highlight.ts, stackRoles.ts, BlogTocPill, ProjectTocPill, ProjectGlancePanel, scrollChain action
  - **Files deleted:** SectionWrapper, EdgeRail, ListingLayout, DetailHero, CardGrid, BentoGrid, AsidePanel + tests
  - **Decision:** 4 CSS Grid Recipes replace 3 shell components (D211-D217)
  - **Decision:** Shiki brand theme for syntax highlighting (D176)
  - **Decision:** Reading mode dims via direct opacity, not overlay scrim (D175)
  - **Learning note:** `overflow-x: clip` does not create a scroll container, unlike `hidden` — critical for sticky positioning (D179)

- [x] 17d-5: Services Pages (3 sessions)
  - **Files modified:** ServiceListingPage, ServiceCard, ServiceDetailPage, StationTabs, 13+ components for `data-lenis-prevent`
  - **Decision:** Nested scroll containers banned by Constitution (D190-D193)
  - **Decision:** `position: sticky` on `.viewport-inner` centers content in usable area (D199)
  - **Learning note:** Mobile touch swipe guard via `pointer-events: none` class toggle (D204)

- [x] 17d-6: Contact Page (2 sessions)
  - **Files created:** weather.ts (shared utility), contact route server file
  - **Files modified:** ContactPage, about route (shared weather)
  - **Decision:** Recipe 4 Edge Title Grid with `writing-mode: vertical-rl` (D218-D219)
  - **Decision:** Paneforge resizable split 33%/67% default (D221-D222)

- [x] Card Unification — Task 31 (1 session, 2026-04-16)
  - **Files modified:** 21 card consumer files migrated to `ui/card`
  - **Files modified:** `app.css` — deleted `.bento-card` utility class
  - **Files modified:** `CollapsibleSection.svelte` — uses Card internally
  - **Files modified:** `BlogDetailPage.svelte`, `BlogListingPage.svelte`, `ProjectDetailPage.svelte`, `ProjectListingPage.svelte`, `TerminalChrome.svelte`
  - **Decision:** CollapsibleSection renders Card internally, styled via `:global([data-slot="card"])` (D237)
  - **Decision:** TerminalChrome stays separate — not a card surface (D239)
  - **Decision:** StackNode stays separate — interactive node, not a card (D240)
  - **Learning note:** Svelte `use:` actions can't go on components — use wrapper `<div use:action><Card>...</Card></div>`

- [x] Code Review Fixes (same session as card unification)
  - **Files modified:** Multiple card consumers
  - **Fix:** `flex-col` leak — Card defaults `flex flex-col`, consumers needing horizontal layout must add explicit `flex-row`
  - **Fix:** Dead CSS — removed unused scoped styles from card consumers
  - **Fix:** `rounded-[inherit]` — overlays inside Card now inherit parent border-radius
  - **Fix:** `group-hover/card:` — preferred over `:global([data-slot])` for child hover effects

### Commands Executed

```bash
bun run test
bun run check
bun run dev
bun install @fontsource-variable/inter @fontsource-variable/jetbrains-mono
bun install shiki
bun install paneforge
bun remove @chenglou/pretext
```

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `bun run test` | PASS | 769 tests, 0 failures |
| `bun run check` | PASS | 0 type errors, 21 pre-existing warnings |

### Packages Added

| Package | Why |
|---------|-----|
| `@fontsource-variable/inter` | Self-hosted Inter font, eliminates layout shift from Google Fonts CDN |
| `@fontsource-variable/jetbrains-mono` | Self-hosted JetBrains Mono font |
| `shiki` | Syntax highlighting with brand theme for blog + project README |
| `paneforge` | Resizable split panels for contact page |

### Packages Removed

| Package | Why |
|---------|-----|
| `@chenglou/pretext` | Replaced with DOM-based getBoundingClientRect for edge label sizing |

### Errors Encountered

| Error | Cause | Fix | Resolved |
|-------|-------|-----|----------|
| Sticky TOC broken | `overflow-x: hidden` creates scroll container | Changed to `overflow-x: clip` | yes |
| Services scroll trap | Nested scroll container blocked page scroll | Eliminated nesting, Constitution amendment | yes |
| Font layout shift | Google Fonts CDN font-swap delay | Self-hosted via @fontsource-variable | yes |
| Card flex-col leak | Card defaults flex-col, horizontal layouts stretched | Explicit `flex-row` on consumers | yes |

### Blockers / Questions
- None remaining. All design decisions documented (D101-D240).

### Session End
- **Time:** 2026-04-16
- **Files created:** ~80 new files across all sessions
- **Files modified:** ~205 files across all sessions
- **Files deleted:** SectionWrapper, EdgeRail, ListingLayout, DetailHero, CardGrid, BentoGrid, AsidePanel + tests, 9 orphan SVGs, `.bento-card` utility
- **Tests passing:** yes (769/769)
- **Ready for handoff:** yes
