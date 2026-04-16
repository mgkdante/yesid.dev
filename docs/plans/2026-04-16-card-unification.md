# Card Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse 4 divergent card surface patterns (`.bento-card`, hand-rolled CSS, `CollapsibleSection`, orphaned `ui/card`) into a single `<Card>` component. One surface, one hover. Motion actions remain opt-in per consumer.

**Architecture:** Every card consumer switches to `<Card>` from `$lib/components/ui/card`. For About bento cards that have `use:` actions, the actions stay on the parent `<div>` wrapper (Svelte actions can't go on components). Hand-rolled card surface CSS is deleted from each consumer's scoped `<style>`. `.bento-card` utility is deleted from `app.css`. `CollapsibleSection` wraps its content in `<Card>` internally.

**Tech Stack:** SvelteKit 2 + Svelte 5, Tailwind v4, Vitest, ui/card (shadcn-svelte)

**Design Spec:** `docs/specs/2026-04-16-card-unification-design.md`

---

## File Map

### Modified files

| File | Responsibility |
|------|---------------|
| `src/app.css` | Delete `.bento-card` utility (lines 441-454) |
| `src/lib/components/about/AboutPage.svelte` | Delete `:global(.bento-card)` overrides, add Card import for inline stack card |
| `src/lib/components/about/AboutIdentity.svelte` | `bento-card` div → wrapper div + `<Card>` |
| `src/lib/components/about/AboutMetrics.svelte` | Same pattern |
| `src/lib/components/about/AboutMethod.svelte` | Same pattern |
| `src/lib/components/about/AboutTestimonials.svelte` | Same pattern |
| `src/lib/components/about/AboutWeather.svelte` | Same pattern |
| `src/lib/components/about/AboutLogos.svelte` | Same pattern |
| `src/lib/components/about/AboutInterests.svelte` | Same pattern |
| `src/lib/components/about/AboutPolaroids.svelte` | Same pattern |
| `src/lib/components/about/AboutCta.svelte` | Same pattern |
| `src/lib/components/about/AboutTrain.svelte` | Same pattern |
| `src/lib/components/projects/ProjectCard.svelte` | Wrap article in `<Card>`, delete scoped surface CSS |
| `src/lib/components/projects/ProjectMiniCard.svelte` | Wrap in `<Card>`, delete scoped surface CSS |
| `src/lib/components/blog/BlogRow.svelte` | Wrap article in `<Card>`, remove `backdrop-blur-sm`, delete scoped surface CSS |
| `src/lib/components/home/FeaturedProjects.svelte` | Wrap proof cards in `<Card>`, delete scoped surface CSS |
| `src/lib/components/home/HomeServices.svelte` | Wrap service cards in `<Card>`, delete scoped card surface CSS |
| `src/lib/components/home/HeroMetrics.svelte` | Wrap metric divs in `<Card>`, delete inline card surface classes |
| `src/lib/components/stack/StackScenarioCard.svelte` | Wrap in `<Card>`, delete scoped `.scenario-card` surface CSS |
| `src/lib/components/shared/CollapsibleSection.svelte` | Use `<Card>` internally for visual surface |

### Created files

| File | Responsibility |
|------|---------------|
| `src/lib/components/about/AboutPage.test.ts` | Sweep test: zero `.bento-card` in rendered output |

---

## Task 1: About Bento Cards — Card Swap (11 files)

All 11 About components follow the same pattern. The `<div class="bento-card ...">` currently carries both the card surface AND the `use:` actions. Since Svelte `use:` actions can't go on components, split into: outer `<div>` keeps the actions, inner `<Card>` provides the surface.

**Files:**
- Modify: `src/lib/components/about/AboutIdentity.svelte:22-27`
- Modify: `src/lib/components/about/AboutMetrics.svelte:20-23`
- Modify: `src/lib/components/about/AboutMethod.svelte:18-21`
- Modify: `src/lib/components/about/AboutTestimonials.svelte:56-60`
- Modify: `src/lib/components/about/AboutWeather.svelte:60-63`
- Modify: `src/lib/components/about/AboutLogos.svelte:26-29`
- Modify: `src/lib/components/about/AboutInterests.svelte:25-28`
- Modify: `src/lib/components/about/AboutPolaroids.svelte:31-34`
- Modify: `src/lib/components/about/AboutCta.svelte:23-26`
- Modify: `src/lib/components/about/AboutTrain.svelte:126`

**Pattern for each file:**

Before (example — AboutIdentity):
```svelte
<div
  class="group bento-card p-3"
  data-testid="about-identity"
  use:reveal
  use:tilt={{ maxDeg: 1, perspective: 800 }}
  use:cursorGlow
>
  <!-- content -->
</div>
```

After:
```svelte
<div
  class="group h-full"
  use:reveal
  use:tilt={{ maxDeg: 1, perspective: 800 }}
  use:cursorGlow
>
  <Card class="h-full p-3" data-testid="about-identity">
    <!-- content -->
  </Card>
</div>
```

Key rules:
- Wrapper `<div>` keeps: `group`, `use:` actions, `h-full` (for grid stretch)
- `<Card>` gets: `class="h-full p-3"` (overrides Card's default `py-4`), the `data-testid`
- Remove `bento-card` class entirely
- `relative overflow-hidden` no longer needed (Card has both via Tailwind)

- [ ] **Step 1: Add Card import to each file**

Add this import to the `<script>` block of all 11 files:
```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Transform AboutIdentity.svelte**

Replace the `<div class="group bento-card p-3" ...>` wrapper:
```svelte
<div
  class="group h-full"
  use:reveal
  use:tilt={{ maxDeg: 1, perspective: 800 }}
  use:cursorGlow
>
  <Card class="h-full p-3" data-testid="about-identity">
```
Close `</Card></div>` instead of `</div>`.

- [ ] **Step 3: Transform AboutMetrics.svelte**

Same pattern. The inner `use:reveal` on metric items stays — only the outer card wrapper changes. Before:
```svelte
<div
  class="group bento-card p-3"
  data-testid="about-metrics"
  use:cursorGlow
  use:reveal
>
```
After:
```svelte
<div class="group h-full" use:cursorGlow use:reveal>
  <Card class="h-full p-3" data-testid="about-metrics">
```

- [ ] **Step 4: Transform AboutMethod.svelte**

Before: `class="bento-card group h-full p-3"`. After: wrapper `class="group h-full"`, Card `class="h-full p-3"`.

- [ ] **Step 5: Transform AboutTestimonials.svelte**

This one has `use:tilt` in addition to `use:reveal` and `use:cursorGlow`. All three stay on wrapper.

- [ ] **Step 6: Transform AboutWeather.svelte**

Before: `class="group bento-card h-full p-3"`. After: wrapper `class="group h-full"`, Card `class="h-full p-3"`.

- [ ] **Step 7: Transform AboutLogos, AboutInterests, AboutPolaroids, AboutCta**

All follow the same pattern. AboutInterests has `class="group bento-card h-full"` (no explicit padding) — Card gets `class="h-full"` (uses Card's default `py-4`).

- [ ] **Step 8: Transform AboutTrain.svelte**

This card has NO `use:` actions (no tilt, no cursorGlow, no reveal). No wrapper div needed — replace the `<div class="bento-card ...">` directly with `<Card>`:
```svelte
<Card class="flex h-full items-center justify-center" data-testid="about-train">
```

- [ ] **Step 9: Run tests**

Run: `bun run test`
Expected: All tests pass. About component tests use `data-testid` attributes which now live on Card's inner div instead of the outer div. Card renders `<div data-slot="card">` which wraps the content — tests querying by `data-testid` should still find elements.

- [ ] **Step 10: Commit**

```bash
git add src/lib/components/about/
git commit -m "refactor(slice-17d): migrate 11 About bento cards to ui/card"
```

---

## Task 2: AboutPage Inline Card + Delete Overrides

The inline stack card in `AboutPage.svelte` (line 68-71) also uses `bento-card`. Plus the `:global(.bento-card)` overrides at lines 210-217 must be deleted.

**Files:**
- Modify: `src/lib/components/about/AboutPage.svelte:68-71` (inline stack card)
- Modify: `src/lib/components/about/AboutPage.svelte:209-217` (delete :global overrides)

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Transform inline stack card**

Before (line 68-71):
```svelte
<div
  class="bento-card group h-full p-3"
  data-testid="about-tech-stack"
  use:reveal use:tilt={{ maxDeg: 1.5, perspective: 800 }} use:cursorGlow
>
```

After:
```svelte
<div class="group h-full" use:reveal use:tilt={{ maxDeg: 1.5, perspective: 800 }} use:cursorGlow>
  <Card class="h-full p-3" data-testid="about-tech-stack">
```
Close with `</Card></div>`.

- [ ] **Step 3: Delete `:global(.bento-card)` overrides**

Delete lines 209-217 entirely:
```css
/* ═══ BENTO CARD — UNIFORM BORDER + HOVER ═══ */
:global(.bento-card) {
  border-color: color-mix(in srgb, var(--primary) 12%, transparent) !important;
  transition: border-color var(--duration-slow) var(--ease-default), box-shadow var(--duration-slow) var(--ease-default);
}
:global(.bento-card:hover) {
  border-color: color-mix(in srgb, var(--primary) 25%, transparent) !important;
  box-shadow: 0 4px 24px color-mix(in srgb, var(--primary) 8%, transparent), 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

**Note:** The About page previously overrode `.bento-card` with softer hover (12% → 25% border, custom shadow). With Card unification, all cards get the standard Card hover (25% → 60%). This is intentional — the spec says "one surface, one hover." If Yesid wants the softer About hover back, we can add a Card `variant` prop later.

- [ ] **Step 4: Run tests and check**

Run: `bun run test && bun run check`
Expected: Both pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/about/AboutPage.svelte
git commit -m "refactor(slice-17d): migrate AboutPage inline card to ui/card, delete bento overrides"
```

---

## Task 3: Delete `.bento-card` from app.css

**Files:**
- Modify: `src/app.css:441-454`

- [ ] **Step 1: Delete the `.bento-card` utility**

Delete lines 441-454 (the comment + both rule blocks):
```css
/* 12. Bento card bundle — aligned with unified Card surface (Constitution Section 13) */
.bento-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  background: var(--background);
  transition: border-color var(--duration-normal) var(--ease-default),
              box-shadow var(--duration-normal) var(--ease-default);
}
.bento-card:hover {
  border-color: color-mix(in srgb, var(--primary) 60%, transparent);
  box-shadow: var(--shadow-section);
}
```

- [ ] **Step 2: Verify zero `.bento-card` references in source**

Run: `grep -r "bento-card" src/` — should return 0 results.

- [ ] **Step 3: Run tests and check**

Run: `bun run test && bun run check`
Expected: Both pass. No component references `.bento-card` anymore.

- [ ] **Step 4: Commit**

```bash
git add src/app.css
git commit -m "refactor(slice-17d): delete .bento-card utility from app.css"
```

---

## Task 4: ProjectCard — Card Swap

**Files:**
- Modify: `src/lib/components/projects/ProjectCard.svelte:78-92, 188-201`

The `<article>` element has both the card surface CSS AND `use:tilt`/`use:cursorGlow`. Split: wrapper keeps actions, Card provides surface.

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Transform the article element**

Before (lines 88-92):
```svelte
<article
  class="project-card-article relative h-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] transition-all duration-300"
  use:tilt={{ maxDeg: 1.5 }}
  use:cursorGlow
>
```

After:
```svelte
<div
  class="h-full"
  use:tilt={{ maxDeg: 1.5 }}
  use:cursorGlow
>
  <Card class="h-full" data-testid="project-card-surface">
    <article class="h-full">
```

Close: `</article></Card></div>` (replacing `</article>`).

The inline Tailwind card surface classes (`rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] transition-all duration-300`) are removed — Card handles all of this.

- [ ] **Step 3: Delete scoped card surface CSS**

Delete from `<style>`:
```css
/* WHY: same hover pattern as BlogRow — subtle border glow + shadow,
   no rotating gradient (that was visually distracting on cards) */
.project-card:hover .project-card-article {
  border-color: color-mix(in srgb, var(--primary) 50%, transparent);
  box-shadow: var(--shadow-card);
}
```

Card's `.card-surface:hover` handles the hover glow now.

Keep the `.service-badge-icon` rule — it's not card surface CSS.

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: ProjectCard tests pass (they query `data-testid="project-card"` on the `<a>`, not the article).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/projects/ProjectCard.svelte
git commit -m "refactor(slice-17d): migrate ProjectCard to ui/card"
```

---

## Task 5: ProjectMiniCard — Card Swap

**Files:**
- Modify: `src/lib/components/projects/ProjectMiniCard.svelte:24-72`

This component has `use:reveal` on the root `<a>` element. The `<a>` IS the card surface (scoped CSS on `.project-mini-card`). Since `use:reveal` is on the `<a>`, the `<a>` stays as the outer element, and Card wraps the content inside.

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Wrap content in Card**

Before:
```svelte
<a
  href="/projects/{project.slug}"
  class="project-mini-card group relative overflow-hidden"
  data-testid="project-mini-card"
  use:reveal={{ direction: 'up', delay: 50 + index * 80 }}
>
  <!-- radial glow div -->
  <div class="card-body">...
```

After:
```svelte
<a
  href="/projects/{project.slug}"
  class="group block"
  data-testid="project-mini-card"
  use:reveal={{ direction: 'up', delay: 50 + index * 80 }}
>
  <Card class="project-mini-card-inner flex items-center gap-4 px-6 py-5">
    <!-- radial glow div -->
    <div class="card-body">...
```

Close: `</Card></a>`.

- [ ] **Step 3: Delete scoped card surface CSS**

Delete all surface-related CSS rules from `<style>`:
```css
.project-mini-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--background);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: border-color var(--duration-slow) var(--ease-default), box-shadow var(--duration-slow) var(--ease-default), transform var(--duration-slow) var(--ease-default);
}

.project-mini-card:hover {
  border-color: color-mix(in srgb, var(--primary) 50%, transparent);
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}
```

Keep all the `.card-body`, `.card-title`, `.card-liner`, `.card-stack`, `.card-pill`, `.card-arrow` rules — those are content layout, not surface CSS. Update their hover selectors to use `.project-mini-card-inner` parent via `:global`:
```css
:global([data-slot="card"]:hover) .card-title {
  color: var(--primary);
}
:global([data-slot="card"]:hover) .card-pill {
  border-color: color-mix(in srgb, var(--primary) 30%, transparent);
}
:global([data-slot="card"]:hover) .card-arrow {
  color: var(--primary);
  transform: translateX(3px);
}
```

Note: The `translateY(-2px)` lift effect on hover is lost — Card doesn't include a lift. If Yesid wants it, add `hover:-translate-y-0.5` to the Card class.

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: Pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/projects/ProjectMiniCard.svelte
git commit -m "refactor(slice-17d): migrate ProjectMiniCard to ui/card"
```

---

## Task 6: BlogRow — Card Swap + Remove backdrop-blur

**Files:**
- Modify: `src/lib/components/blog/BlogRow.svelte:68-70, 108-119`

BlogRow has `use:boop` on the outer `<a>` and `use:cursorGlow` on the inner `<article>`. The `<article>` carries the card surface classes inline. Replace article with Card, keep cursorGlow on a wrapper.

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Transform the article element**

Before (line 68-70):
```svelte
<article
  class="blog-row relative flex min-w-0 flex-1 items-start gap-5 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--card)]/80 p-5 backdrop-blur-sm transition-all duration-300 md:gap-6 md:p-6"
  use:cursorGlow
>
```

After:
```svelte
<div class="min-w-0 flex-1" use:cursorGlow>
  <Card class="blog-row flex items-start gap-5 p-5 md:gap-6 md:p-6">
```

Close: `</Card></div>` (replacing `</article>`).

Key changes:
- `backdrop-blur-sm` removed (D238 — inconsistent with all other cards)
- `bg-[var(--card)]/80` removed — Card uses `var(--background)` which is opaque
- `rounded-xl` removed — Card uses `var(--radius-lg)`
- `border border-[var(--border-subtle)]` removed — Card handles border
- `overflow-hidden` removed — Card has it
- `relative` removed — Card has it implicitly

- [ ] **Step 3: Delete scoped card surface CSS**

Delete from `<style>`:
```css
.blog-row:hover {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 8%, transparent);
}
```

Card's standard hover replaces this. Note: BlogRow used `--accent` (per-blog color) for hover, Card uses `--primary`. This is intentional per spec — one unified hover.

Keep `.metro-line-svg` rule — not card surface CSS.

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: BlogRow tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/blog/BlogRow.svelte
git commit -m "refactor(slice-17d): migrate BlogRow to ui/card, remove backdrop-blur"
```

---

## Task 7: FeaturedProjects (Proof Reel) — Card Swap

**Files:**
- Modify: `src/lib/components/home/FeaturedProjects.svelte:86-88, 165-197`

The proof cards have an inline `style=` for border + background and scoped hover CSS. No `use:` actions on the card div.

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Replace proof card div with Card**

Before (line 86-88):
```svelte
<div
  data-proof-card
  class="proof-card group flex flex-col overflow-hidden rounded-xl transition-all duration-300"
  style="background: color-mix(in srgb, var(--background) 80%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);"
>
```

After:
```svelte
<Card
  data-proof-card
  class="proof-card group flex flex-col"
>
```

Close: `</Card>` (replacing `</div>`).

Remove the inline `style=` — Card provides background, border, and hover via `.card-surface`.

- [ ] **Step 3: Delete scoped card surface hover CSS**

Delete:
```css
/* Desktop hover: card border + image turns color */
.proof-card:hover {
  border-color: color-mix(in srgb, var(--primary) 60%, transparent) !important;
  box-shadow: var(--shadow-section);
}
```

Card's `.card-surface:hover` handles this identically.

Keep the B&W→color image hover rules, tag hover rules, and mobile image tap CSS — those are content behavior, not surface.

- [ ] **Step 4: Update hover selectors**

The remaining hover rules reference `.proof-card:hover` which still works as a class on Card's inner div. Verify the image/tag hover rules work:
```css
.proof-card:hover .proof-img,
.proof-image.image-active .proof-img { ... }
```
These should still work since `.proof-card` is a class on the Card div.

- [ ] **Step 5: Run tests**

Run: `bun run test`
Expected: FeaturedProjects tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/home/FeaturedProjects.svelte
git commit -m "refactor(slice-17d): migrate FeaturedProjects proof cards to ui/card"
```

---

## Task 8: HomeServices — Card Swap

**Files:**
- Modify: `src/lib/components/home/HomeServices.svelte:186-188, 277-291`

Service cards are `<a>` elements with scoped `.services-card` surface CSS.

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Wrap in Card**

Before (line 186-188):
```svelte
<a
  href="/services/{service.id}"
  data-testid="services-card"
  data-services-card
  class="services-card group flex rounded-xl transition-all duration-300"
  onmouseenter={() => handleCardEnter(i)}
  onmouseleave={() => handleCardLeave(i)}
>
```

After:
```svelte
<a
  href="/services/{service.id}"
  data-testid="services-card"
  data-services-card
  class="group block"
  onmouseenter={() => handleCardEnter(i)}
  onmouseleave={() => handleCardLeave(i)}
>
  <Card class="services-card flex h-full p-6">
```

Close: `</Card></a>`.

- [ ] **Step 3: Delete scoped card surface CSS**

Delete:
```css
/* Card — matches ProofReel card styling */
.services-card {
  background: color-mix(in srgb, var(--background) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
  padding: 24px;
  text-decoration: none;
  backdrop-filter: blur(6px);
}

.services-card:hover {
  border-color: color-mix(in srgb, var(--primary) 60%, transparent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-section);
}
```

Card handles background, border, radius, and hover. The `backdrop-filter: blur(6px)` and `translateY(-2px)` lift are intentionally dropped per spec (consistent surface).

Keep all SVG panel, title, view-all, and grid rules — those are content layout.

Update the `.services-card:hover .svg-panel` selector — it still works since `.services-card` is a class on Card.

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: Pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/home/HomeServices.svelte
git commit -m "refactor(slice-17d): migrate HomeServices cards to ui/card"
```

---

## Task 9: HeroMetrics — Card Swap

**Files:**
- Modify: `src/lib/components/home/HeroMetrics.svelte:24-26`

Small inline card. No scoped CSS, all inline Tailwind classes.

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Replace metric card div with Card**

Before (line 24-26):
```svelte
<div
  class="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3.5 transition-colors duration-300 hover:border-[var(--primary)] md:px-5 md:py-4"
  data-testid="metric-card"
>
```

After:
```svelte
<Card
  class="px-4 py-3.5 md:px-5 md:py-4"
  data-testid="metric-card"
>
```

Close: `</Card>` (replacing `</div>`).

The inline card surface classes (`rounded-lg border border-[var(--border)] bg-[var(--muted)] transition-colors duration-300 hover:border-[var(--primary)]`) are removed — Card handles surface. Note: HeroMetrics used `bg-[var(--muted)]` instead of `bg-[var(--background)]` — Card uses `var(--background)` which is the standard.

- [ ] **Step 3: Run tests**

Run: `bun run test`
Expected: Pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/home/HeroMetrics.svelte
git commit -m "refactor(slice-17d): migrate HeroMetrics cards to ui/card"
```

---

## Task 10: StackScenarioCard — Card Swap

**Files:**
- Modify: `src/lib/components/stack/StackScenarioCard.svelte:49, 90-99`

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Replace root div with Card**

Before (line 49):
```svelte
<div class="scenario-card" bind:this={cardEl} data-testid="scenario-card">
```

After:
```svelte
<Card class="scenario-card flex flex-col gap-4 p-5" bind:ref={cardEl} data-testid="scenario-card">
```

Close: `</Card>` (replacing `</div>`).

Note: Card uses `bind:ref` not `bind:this` — the Card component exposes `ref` as a `$bindable` prop.

- [ ] **Step 3: Delete scoped card surface CSS**

Delete:
```css
.scenario-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--muted);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

Card handles border, radius, background. Layout (`flex flex-col gap-4 p-5`) moves to Card's class prop.

Keep all `.mini-flow`, `.flow-node`, `.scenario-summary`, `.scenario-projects`, `.project-badge` rules — those are content styling.

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: Pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/stack/StackScenarioCard.svelte
git commit -m "refactor(slice-17d): migrate StackScenarioCard to ui/card"
```

---

## Task 11: CollapsibleSection — Card Internal

**Files:**
- Modify: `src/lib/components/shared/CollapsibleSection.svelte:49-52, 84-90`

CollapsibleSection uses `Collapsible` (bits-ui) as its root and applies card surface classes directly on it. Replace with Card wrapping the Collapsible.

- [ ] **Step 1: Add Card import**

```typescript
import { Card } from '$lib/components/ui/card';
```

- [ ] **Step 2: Wrap Collapsible in Card**

Before (line 49-52):
```svelte
<Collapsible
  bind:open
  class="section-card rounded-lg border border-[var(--border-subtle)] bg-[var(--card)]"
  style="--accent: {accentColor};"
>
```

After:
```svelte
<Card class="section-card" style="--accent: {accentColor};">
  <Collapsible bind:open>
```

Close: `</Collapsible></Card>` (replacing `</Collapsible>`).

Card provides `rounded-lg border bg background` — the inline Tailwind classes are removed.

- [ ] **Step 3: Update scoped hover CSS selectors**

The hover rules targeted `[data-slot="collapsible"].section-card`. Now `.section-card` is on the Card div, and Collapsible is inside it. Update:

Before:
```css
:global([data-slot="collapsible"].section-card) {
  transition: box-shadow var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default);
}
:global([data-slot="collapsible"].section-card:hover) {
  border-color: var(--accent);
}

:global([data-slot="collapsible"].section-card:hover .section-title) {
  color: var(--accent);
}
```

After:
```css
:global([data-slot="card"].section-card:hover) {
  border-color: var(--accent);
}

:global([data-slot="card"].section-card:hover .section-title) {
  color: var(--accent);
}
```

Card already has transitions on border-color and box-shadow, so the first transition rule can be deleted.

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: Pass. CollapsibleSection tests check for aria attributes which are on the Collapsible inside Card.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/shared/CollapsibleSection.svelte
git commit -m "refactor(slice-17d): wire CollapsibleSection to use Card internally"
```

---

## Task 12: Sweep Test + Final Verification

**Files:**
- Create: `src/lib/components/about/AboutPage.test.ts`
- Run: full test suite + type check

- [ ] **Step 1: Write sweep test**

Create `src/lib/components/about/AboutPage.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Card Unification Sweep', () => {
  const srcDir = join(process.cwd(), 'src');

  function findSvelteFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...findSvelteFiles(fullPath));
      } else if (entry.name.endsWith('.svelte')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('has zero .bento-card class usage in any .svelte file', () => {
    const svelteFiles = findSvelteFiles(srcDir);
    const violations: string[] = [];

    for (const file of svelteFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('bento-card')) {
        violations.push(file.replace(process.cwd() + '/', ''));
      }
    }

    expect(violations, `Files still using .bento-card:\n${violations.join('\n')}`).toEqual([]);
  });

  it('has zero .bento-card in app.css', () => {
    const appCss = readFileSync(join(srcDir, 'app.css'), 'utf-8');
    expect(appCss).not.toContain('bento-card');
  });
});
```

- [ ] **Step 2: Run the sweep test**

Run: `bun run test src/lib/components/about/AboutPage.test.ts`
Expected: PASS — zero violations.

- [ ] **Step 3: Run full test suite + check**

Run: `bun run test && bun run check`
Expected: All tests pass, 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/about/AboutPage.test.ts
git commit -m "test(slice-17d): add card unification sweep test"
```

---

## Task 13: Documentation Updates

**Files:**
- Modify: `docs/reference/CSS.md` — remove `.bento-card` from utility index
- Modify: `docs/reference/PATTERNS.md` — update card pattern reference
- Modify: `docs/reference/TESTS.md` — add sweep test entry

- [ ] **Step 1: Update CSS.md**

Remove the `.bento-card` entry from the utility classes table. Add note that `ui/card` is now the single card surface.

- [ ] **Step 2: Update PATTERNS.md**

Replace the note about `.bento-card` and `use:` action limitation:
```
Before: "Svelte actions don't work on component tags — use utility classes (.bento-card)"
After: "Svelte actions don't work on component tags — use wrapper div pattern: <div use:action><Card>...</Card></div>"
```

- [ ] **Step 3: Update TESTS.md**

Add sweep test entry under Components section:
```
| AboutPage.test.ts | Card unification sweep — zero .bento-card in source | Data Layer |
```

- [ ] **Step 4: Commit**

```bash
git add docs/reference/CSS.md docs/reference/PATTERNS.md docs/reference/TESTS.md
git commit -m "docs(slice-17d): update CSS.md, PATTERNS.md, TESTS.md for card unification"
```

---

## Acceptance Criteria Checklist

| Criterion | Validated by |
|-----------|-------------|
| Zero `.bento-card` class usage | Task 12 sweep test |
| Zero hand-rolled card surface CSS | Tasks 4-10 (scoped CSS deleted) |
| All 21 card instances use `<Card>` | Tasks 1-11 |
| `CollapsibleSection` uses `<Card>` internally | Task 11 |
| Motion actions still work (tilt, glow, boop) | Tasks 1-2 (wrapper div pattern) |
| Visual appearance unchanged | Yesid visual verification |
| `bun run check` passes | Task 12 step 3 |
| `bun run test` passes | Task 12 step 3 |

## Session Estimate

**1 session** — 13 tasks, mostly mechanical find-and-replace. About bento cards (Tasks 1-2) are the largest batch but follow a uniform pattern. Hand-rolled cards (Tasks 4-10) each require reading the scoped CSS to identify which rules to delete vs keep.
