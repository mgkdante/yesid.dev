# Card Unification — Design Spec

> **Sub-slice:** 17d (Task 31)
> **Branch:** `feature/slice-17d-component-api`
> **Date:** 2026-04-16
> **Status:** Approved

---

## 1. Goal

Collapse 4 divergent card surface patterns (`.bento-card`, hand-rolled CSS, `CollapsibleSection`, orphaned `ui/card`) into a single `ui/card` component. One surface, one hover. Motion actions remain opt-in per consumer.

## 2. Current State

21 card instances across 4 patterns:

| Pattern | Count | Where |
|---------|-------|-------|
| `.bento-card` utility | 12 | About page (11 files + 1 inline) |
| Hand-rolled scoped CSS | 7 | ProjectCard, ProjectMiniCard, BlogRow, FeaturedProjects, HomeServices, HeroMetrics, StackScenarioCard |
| `CollapsibleSection` | 1 def / 7 consumers | Detail pages, filters, panels |
| `ui/card` (shadcn) | 1 | **Zero consumers** — orphaned |

**Problems:**
- `ui/card` was built in 17a-6 but never wired — orphaned
- `.bento-card` and `ui/card` are nearly identical — duplicate code
- 7 hand-rolled cards each invent their own border/hover/radius
- `BlogRow` is the only card with `backdrop-blur-sm` — inconsistent
- `CollapsibleSection` has its own surface distinct from all others

## 3. Design Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D232 | One unified card surface via `ui/card` component | Constitution Section 13 already defines the spec — `ui/card` implements it |
| D233 | Delete `.bento-card` utility from `app.css` | Replaced by `<Card>` component — no more utility class |
| D234 | Delete `.bento-card` overrides from `AboutPage.svelte` | Same surface now comes from `<Card>` |
| D235 | Motion actions stay per-consumer, not on Card | `use:tilt`, `use:cursorGlow`, `use:boop` are page-level decisions, not surface-level |
| D236 | Content layout inside each card stays unique | Card is just the surface wrapper — internal layout is the consumer's responsibility |
| D237 | `CollapsibleSection` uses Card internally for its surface | Keeps expand/collapse behavior, delegates visual surface to Card |
| D238 | Remove `backdrop-blur-sm` from BlogRow | Inconsistent with all other cards — standard opaque surface instead |
| D239 | `TerminalChrome` stays separate | Brand craft component, not a card |
| D240 | `StackNode` stays separate | Interactive button, not a card |

## 4. Unified Card Surface

The `ui/card/card.svelte` component already implements:

```css
.card-surface {
  background: var(--background);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  border-radius: var(--radius-lg);
  transition: border-color var(--duration-normal) var(--ease-default),
              box-shadow var(--duration-normal) var(--ease-default);
}
.card-surface:hover {
  border-color: color-mix(in srgb, var(--primary) 60%, transparent);
  box-shadow: var(--shadow-section);
}
```

This is the Constitution Section 13 Card spec. No changes needed to the component itself.

## 5. Migration Map

### About Bento Cards (12 instances)

All About components using `class="bento-card"` switch to `<Card>`:

| File | Current | After |
|------|---------|-------|
| `AboutIdentity.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutMetrics.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutMethod.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutPage.svelte` (inline) | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutTestimonials.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutWeather.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutLogos.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutInterests.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutPolaroids.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutCta.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |
| `AboutTrain.svelte` | `<div class="bento-card">` | `<Card class="h-full p-3">` |

**Motion actions:** Svelte `use:` actions cannot go directly on components — they require a DOM element. Two options per consumer:
1. **Wrapper div:** `<div use:tilt use:cursorGlow><Card class="h-full p-3">...</Card></div>` — action on parent, Card inside
2. **Bind ref:** `<Card bind:ref={el}> ...` then apply action manually in `onMount` — more complex, avoid unless wrapper div causes layout issues

Prefer option 1 (wrapper div) for simplicity. The wrapper inherits the grid cell sizing.

**Important:** Card uses `py-4` by default (from shadcn). Bento cards use `p-3`. Pass `class="h-full p-3"` and Card's default padding will be overridden by `cn()` merge.

### Hand-Rolled Cards (7 instances)

| File | Change |
|------|--------|
| `ProjectCard.svelte` | Wrap article content in `<Card>`, remove scoped card surface CSS |
| `ProjectMiniCard.svelte` | Wrap in `<Card>`, remove scoped surface CSS |
| `BlogRow.svelte` | Wrap article in `<Card>`, remove `backdrop-blur-sm` + scoped surface CSS |
| `FeaturedProjects.svelte` | Wrap proof reel cards in `<Card>`, keep B&W→color hover as additional effect |
| `HomeServices.svelte` | Wrap service cards in `<Card>`, keep SVG panel layout |
| `HeroMetrics.svelte` | Wrap metric cards in `<Card>` |
| `StackScenarioCard.svelte` | Wrap in `<Card>` |

For each: identify the scoped CSS that defines the card surface (border, radius, background, hover), delete it, and let `<Card>` handle the surface.

### CollapsibleSection (1 definition)

`CollapsibleSection.svelte` wraps its content in a card-like surface. Replace the hand-rolled `bg-[var(--card)] border border-[var(--border-subtle)]` with `<Card>` internally. The Collapsible expand/collapse behavior stays — only the visual surface changes.

## 6. Cleanup

| What | Where | Action |
|------|-------|--------|
| `.bento-card` utility | `src/app.css` lines 442-454 | Delete |
| `.bento-card` overrides | `src/lib/components/about/AboutPage.svelte` | Delete `:global(.bento-card)` rules |
| Scoped card surface CSS | Each hand-rolled consumer | Delete border/radius/bg/hover rules that Card now handles |

## 7. What Does NOT Change

- `TerminalChrome` — brand craft, separate component
- `StackNode` — interactive button, not a card
- Card content layouts — each consumer's internal structure stays unique
- Motion actions — consumers choose which actions to apply
- `ui/card` sub-components (`CardHeader`, `CardContent`, `CardFooter`) — available but not required. Most consumers just use `<Card>` as a surface wrapper.

## 8. Test Impact

- Existing tests should mostly pass — `data-testid` attributes don't change
- Card wrapping may add a parent `<div data-slot="card">` — update any tests that assert on direct DOM structure
- Add a sweep test: verify zero `.bento-card` class usage in any component

## 9. Acceptance Criteria

1. Zero `.bento-card` class usage across the codebase
2. Zero hand-rolled card surface CSS (border + radius + background + hover) in consumer components
3. All 21 card instances use `<Card>` from `ui/card`
4. `CollapsibleSection` uses `<Card>` internally
5. Motion actions still work per-consumer (tilt, glow, boop)
6. Visual appearance unchanged — same surface, same hover, same radius
7. `bun run check` passes with 0 errors
8. `bun run test` passes
