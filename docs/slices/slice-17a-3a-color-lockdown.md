# Slice 17a-3a — Color Lockdown

**Status:** ready
**Priority:** 1
**Estimated effort:** 2 sessions (~20 tasks)
**Depends on:** 17a-2b (PR #4 merged)
**Branch:** `feature/slice-17a-3-color-lockdown`
**Design spec:** `docs/specs/slice-17a-3-color-token-lockdown-design.md`

## Objective

Replace all 371 hardcoded hex/rgba color values across ~55 .svelte files with semantic tokens, establish `@theme inline` as the single source of truth bridge, and complete the light theme token block.

## Context

Slice 17a-2b wired 15 brand primitives but left ~371 hardcoded colors untouched. These block brand portability (can't change orange to blue without editing 55 files), prevent light theme (hardcoded dark backgrounds override `[data-theme]`), and create inconsistency (same logical color has 3+ hex values). This is the last foundation step before light theme becomes one toggle away.

## Architecture

- **tokens.css** remains the single source of truth for all color values
- **app.css** splits `@theme` into `@theme` (static values) + `@theme inline` (var refs from tokens.css) — eliminates dual source of truth
- **Components** replace all hardcoded hex/rgba with `var(--)` or Tailwind brand utilities
- **SVG components** use `var(--)` in fill/stroke attributes (works for inline Svelte SVGs)
- **No component API changes** — only color value replacements
- **No new components** — only token additions and value migrations

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4 (`@theme inline`), CSS custom properties

## File Structure

### Modified Files

```
src/lib/styles/tokens.css              — MODIFY: add --text-light, --status-warning, --brand-primary-border; complete [data-theme="light"] block
src/app.css                            — MODIFY: split @theme into @theme (static) + @theme inline (var refs)
~55 .svelte files                      — MODIFY: replace hardcoded hex/rgba with var()/Tailwind tokens
```

### No New Files

All work is migration of existing values to existing token system.

---

## Task C1: Foundation — New tokens + @theme inline

**Files:**
- Modify: `src/lib/styles/tokens.css`
- Modify: `src/app.css`

- [ ] **Step 1: Add new tokens to tokens.css `:root`**
  ```css
  --text-light: #ccc;
  --status-warning: #ffbd2e;
  --brand-primary-border: color-mix(in srgb, var(--brand-primary) 12%, transparent);
  ```

- [ ] **Step 2: Add light theme values for new tokens in `[data-theme="light"]` and `@media (prefers-color-scheme: dark)` blocks**
  ```css
  --text-light: #555;
  --status-warning: #f0ad4e;
  --brand-primary-border: color-mix(in srgb, var(--brand-primary) 15%, transparent);
  ```

- [ ] **Step 3: Split app.css @theme into @theme (static) + @theme inline (var refs)**
  Keep type scale, radii, and other static values in `@theme`.
  Move all `--color-*` values to `@theme inline` referencing tokens.css:
  ```css
  @theme inline {
    --color-brand-primary: var(--brand-primary);
    --color-brand-accent: var(--brand-accent);
    --color-brand-primary-hover: var(--brand-primary-hover);
    --color-brand-accent-hover: var(--brand-accent-hover);
    --color-dark-bg: var(--bg-primary);
    --color-dark-surface: var(--bg-surface);
    --color-dark-elevated: var(--bg-elevated);
    --color-dark-border: var(--border);
    --color-light-bg: var(--bg-primary);
    --color-light-surface: var(--bg-surface);
    --color-light-elevated: var(--bg-elevated);
    --color-light-border: var(--border);
    --color-terminal-bg: var(--bg-terminal);
    --color-terminal-border: var(--border-subtle);
    --color-dim: var(--text-dim);
    --color-live: var(--status-live);
  }
  ```

- [ ] **Step 4: Run `bun run test` and `bun run check`**
  Expected: PASS — token additions and @theme inline are additive changes.

- [ ] **Step 5: Visual verification**
  Check homepage, about, blog, services, tech-stack at desktop (1440px). All colors should render identically — we only changed the source, not the values.

**STOP. Ask Yesid to verify on localhost. This is the foundation — everything else depends on it.**

---

## Task C2: Manifesto.svelte (53 values)

**Files:**
- Modify: `src/lib/components/Manifesto.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba values**
  - `#E07800` → `var(--brand-primary)`
  - `rgba(224,120,0,X)` → `color-mix(in srgb, var(--brand-primary) X%, transparent)`
  - Dark backgrounds → `var(--bg-primary/surface/card)`
  - Grays → `var(--text-secondary/muted/dim)`

- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify Manifesto section on homepage.**

---

## Task C3: ServiceCard + ServiceDetailPage (23 values)

**Files:**
- Modify: `src/lib/components/ServiceCard.svelte`
- Modify: `src/lib/components/ServiceDetailPage.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table from design spec**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify /services and /services/[id] pages.**

---

## Task C4: HomeServices.svelte (16 values)

**Files:**
- Modify: `src/lib/components/HomeServices.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify Services section on homepage.**

---

## Task C5: MenuOverlay.svelte (15 values)

**Files:**
- Modify: `src/lib/components/MenuOverlay.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify mobile menu overlay.**

---

## Task C6: Train SVGs — Train + TrainTop + TrainJourney (22 values)

**Files:**
- Modify: `src/lib/motion/svg/Train.svelte`
- Modify: `src/lib/motion/svg/TrainTop.svelte`
- Modify: `src/lib/motion/svg/TrainJourney.svelte`

- [ ] **Step 1: Replace SVG fill/stroke hex with var() tokens**
  - `fill="#E07800"` → `fill="var(--brand-primary)"`
  - `fill="#FFB627"` → `fill="var(--brand-accent)"`
  - Dark fills → `var(--bg-primary/surface/card)`
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify train animation on homepage.**

---

## Task C7: Motion SVGs — MetroNetwork + StationNodes + DataPaths (8 values)

**Files:**
- Modify: `src/lib/motion/svg/MetroNetwork.svelte`
- Modify: `src/lib/motion/three/StationNodes.svelte`
- Modify: `src/lib/motion/three/DataPaths.svelte`

- [ ] **Step 1: Replace SVG/Three.js color hex with var() tokens**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify 3D scene and metro network visuals.**

---

## Task C8: Work domain (22 values)

**Files:**
- Modify: `src/lib/components/WorkCard.svelte`
- Modify: `src/lib/components/WorkDetailSidebar.svelte`
- Modify: `src/lib/components/WorkDetailPage.svelte`
- Modify: `src/lib/components/WorkListingPage.svelte`
- Modify: `src/lib/components/WorkFilterMobile.svelte`
- Modify: `src/lib/components/WorkServiceBadge.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify /work and /work/[slug] pages.**

---

## Task C9: ProofReel + ProofStrip + ProjectMiniCard (20 values)

**Files:**
- Modify: `src/lib/components/ProofReel.svelte`
- Modify: `src/lib/components/ProofStrip.svelte`
- Modify: `src/lib/components/ProjectMiniCard.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify Proof Reel section and project mini cards.**

---

## Task C10: Decorative — ConstructionScene + DataFlowDiagram + ManifestoCanvas (13 values)

**Files:**
- Modify: `src/lib/components/ConstructionScene.svelte`
- Modify: `src/lib/components/DataFlowDiagram.svelte`
- Modify: `src/lib/components/ManifestoCanvas.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify construction scene, data flow diagram, manifesto canvas.**

---

## Task C11: Blog content — BlogRow + BlogContent + BlogDetailHeader + BlogListingPage (5 values)

**Files:**
- Modify: `src/lib/components/BlogRow.svelte`
- Modify: `src/lib/components/BlogContent.svelte`
- Modify: `src/lib/components/BlogDetailHeader.svelte`
- Modify: `src/lib/components/BlogListingPage.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify /blog and /blog/[slug] pages.**

---

## Task C12: Blog filters — BlogFilterMobile + BlogFilterSidebar + FilterGroup + CollapsibleSection (12 values)

**Files:**
- Modify: `src/lib/components/BlogFilterMobile.svelte`
- Modify: `src/lib/components/BlogFilterSidebar.svelte`
- Modify: `src/lib/components/FilterGroup.svelte`
- Modify: `src/lib/components/CollapsibleSection.svelte`

- [ ] **Step 1: Replace hardcoded hex + accentColor prop defaults**
  - `accentColor = '#E07800'` → `accentColor = 'var(--brand-primary)'`
  - All hex/rgba → semantic tokens
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify blog filter sidebar and mobile filter sheet.**

---

## Task C13: Navigation — Nav + ServiceNav (11 values)

**Files:**
- Modify: `src/lib/components/Nav.svelte`
- Modify: `src/lib/components/ServiceNav.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify main nav and service sub-nav.**

---

## Task C14: Footer area — HomeCloser + Footer (10 values)

**Files:**
- Modify: `src/lib/components/HomeCloser.svelte`
- Modify: `src/lib/components/Footer.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify HomeCloser section and footer.**

---

## Task C15: Station/listing — StationTabs + ServiceListingPage + TableOfContents (14 values)

**Files:**
- Modify: `src/lib/components/StationTabs.svelte`
- Modify: `src/lib/components/ServiceListingPage.svelte`
- Modify: `src/lib/components/TableOfContents.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify station tabs, service listing, and table of contents.**

---

## Task C16: Hero area — HeroBanner + InfraFrame + HeroSqlPanel (8 values)

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte`
- Modify: `src/lib/components/InfraFrame.svelte`
- Modify: `src/lib/components/HeroSqlPanel.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify hero section and tech-stack InfraFrame.**

---

## Task C17: accentColor prop defaults (11 files)

**Files:**
- Modify: `src/lib/components/BlogContent.svelte`
- Modify: `src/routes/blog/+page.svelte`
- Modify: `src/lib/components/BlogFilterSidebar.svelte`
- Modify: `src/lib/components/BlogDetailHeader.svelte`
- Modify: `src/lib/components/BlogRow.svelte`
- Modify: `src/lib/components/BlogFilterMobile.svelte`
- Modify: `src/lib/components/BlogListingPage.svelte`
- Modify: `src/lib/components/CollapsibleSection.svelte`
- Modify: `src/lib/components/FilterGroup.svelte`
- Modify: `src/lib/components/ProofReel.svelte`
- Modify: `src/lib/components/ReadingProgressBar.svelte`

- [ ] **Step 1: Change all `accentColor = '#E07800'` to `accentColor = 'var(--brand-primary)'`**
  Note: some files may already be done from C11/C12. Only fix remaining ones.
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify accent colors render correctly on blog pages.**

---

## Task C18: Route files — +error.svelte + route pages (10 values)

**Files:**
- Modify: `src/routes/+error.svelte`
- Modify: `src/routes/blog/[slug]/+page.svelte`
- Modify: `src/routes/blog/+page.svelte`
- Modify: `src/routes/blog/personal/+page.svelte`
- Modify: `src/routes/tech-stack/+page.svelte`
- Modify: `src/routes/preview/+page.svelte`
- Modify: `src/routes/preview/train/+page.svelte`

- [ ] **Step 1: Replace all hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**

**STOP. Ask Yesid to verify error page, blog routes, tech-stack page.**

---

## Task C19: Stragglers — ContactPage + ReadingProgressBar + About* + remaining (misc values)

**Files:**
- Modify: `src/lib/components/ContactPage.svelte`
- Modify: `src/lib/components/ReadingProgressBar.svelte`
- Modify: `src/lib/components/AboutCta.svelte`
- Modify: `src/lib/components/AboutPage.svelte`
- Modify: `src/lib/components/AboutMethod.svelte`
- Modify: `src/lib/components/AboutTrain.svelte`
- Modify: `src/lib/components/AboutIdentity.svelte`
- Modify: `src/lib/components/AboutBento.svelte`
- Modify: `src/lib/components/AboutInterests.svelte`
- Modify: `src/lib/components/AboutWeather.svelte`
- Modify: `src/lib/components/StackBottomSheet.svelte`
- Modify: `src/lib/components/StackConnections.svelte`
- Modify: `src/lib/components/StackDiagram.svelte`
- Modify: `src/lib/components/StackFilters.svelte`
- Modify: `src/lib/components/StackPanel.svelte`
- Modify: `src/lib/components/StackScenarioCard.svelte`
- Modify: `src/lib/components/StackConfigurator.svelte`
- Modify: `src/lib/components/StackNode.svelte`
- Modify: `src/lib/components/GradientSeparator.svelte`
- Modify: any other files with remaining hardcoded values
- Modify: `src/lib/motion/three/WagonInner.svelte`
- Modify: `src/lib/motion/three/PostProcessing.svelte`

- [ ] **Step 1: Replace all remaining hardcoded hex/rgba using mapping table**
- [ ] **Step 2: Run `bun run test` and `bun run check`**
- [ ] **Step 3: Run final grep sweep to confirm zero stragglers**
  ```bash
  bunx grep-cli "#[0-9a-fA-F]{3,6}" src/**/*.svelte --exclude="**/brand/**" --exclude="**/tokens.css"
  ```
  Or equivalent grep. Only tokens.css and brand/ should have raw hex.

**STOP. Ask Yesid to verify contact, about, tech-stack pages.**

---

## Task C20: Light theme completion

**Files:**
- Modify: `src/lib/styles/tokens.css`

- [ ] **Step 1: Complete `[data-theme="light"]` block with ALL semantic tokens**
  Ensure every token used in components has a light counterpart. See design spec light theme table.
  Brand colors stay the same. Backgrounds, text, borders invert.

- [ ] **Step 2: Complete `@media (prefers-color-scheme: dark)` block to match**

- [ ] **Step 3: Run `bun run test` and `bun run check`**

- [ ] **Step 4: Optional smoke test** — temporarily add `data-theme="light"` to `<html>` in `app.html` and verify the site renders in light mode without broken dark backgrounds. Remove after verification.

**STOP. Ask Yesid to verify light theme block is complete. Light theme is not shipped — just ready.**

---

## Execution Order

All tasks are sequential. C1 MUST be first (foundation). C2-C19 can be reordered based on priority but are designed heaviest-first. C20 MUST be last (depends on all tokens being wired).

## Out of Scope

- Component API changes (17d)
- Dead code removal (17a-4)
- New brand primitives or utility classes beyond the 3 new tokens
- Light theme toggle UI (future slice)
- Z-index, shadows, transitions, opacity, font stack, pill radius normalization (17a-3b)
- Type scale changes (done in 17a-1)

## Acceptance Criteria

- [ ] Zero hardcoded hex/rgba in .svelte files (grep returns only tokens.css and brand/)
- [ ] app.css `@theme inline` references tokens.css — zero duplicated hex values
- [ ] All 3 new tokens added (--text-light, --status-warning, --brand-primary-border)
- [ ] All accentColor props default to `var(--brand-primary)`
- [ ] `[data-theme="light"]` block covers ALL semantic tokens
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] Site renders identically before/after at all breakpoints

## Learn

### @theme inline (Tailwind v4)
**What it is:** A Tailwind v4 directive that lets `@theme` values reference external CSS variables via `var()`. Without `inline`, Tailwind generates a CSS variable that may resolve incorrectly due to scoping.
**Why it matters:** Eliminates the dual source-of-truth between tokens.css and app.css. One file change cascades everywhere — including Tailwind utility classes.
**Try this:** Change `--brand-primary` in tokens.css to `#0066CC` and watch the entire site turn blue.
**Go deeper:** https://tailwindcss.com/docs/theme#referencing-other-variables

### color-mix()
**What it is:** CSS function that blends two colors at a given percentage. Replaces `rgba(r,g,b,a)` with a token-aware alternative.
**Why it matters:** `rgba(224,120,0,0.3)` hardcodes the brand orange. `color-mix(in srgb, var(--brand-primary) 30%, transparent)` stays connected to the token.
**Try this:** Inspect a `.bento-card` border in DevTools — see how `color-mix()` resolves.
**Go deeper:** https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix

## Verify

1. `bun run test` — all tests pass
2. `bun run check` — zero errors
3. Grep sweep: no hardcoded hex in .svelte files outside tokens.css/brand/
4. Visual comparison: site looks identical before and after
5. Smoke test: temporarily set `data-theme="light"` — site renders in light mode without dark artifacts
