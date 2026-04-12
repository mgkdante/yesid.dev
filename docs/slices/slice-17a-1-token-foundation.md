# Slice 17a-1 — Token Foundation

**Status:** in-progress
**Priority:** 1
**Estimated effort:** 3 sessions
**Depends on:** 00 (repo hygiene — merged)

## Objective

Define the complete design system token architecture and migrate all arbitrary type values to the semantic scale.

## Context

The audit (AUDIT-SLICE-17.md) found 116 arbitrary `text-[Npx]` values, split-brain radius naming, and missing token categories. This sub-slice establishes the foundation that all subsequent 17x sub-slices build on. Decision D9: home page's bold typography + full-bleed layout becomes the standard for ALL pages.

## Architecture

Tokens are defined in `src/lib/styles/tokens.css` as CSS custom properties. Tailwind v4's `@theme` block in `src/app.css` maps tokens to utility classes. Components consume tokens via Tailwind utilities or `var()` references. No arbitrary values.

## Tech Stack

Tailwind CSS v4 (@theme), CSS custom properties, `color-mix()` for shadow alpha, `clamp()` for fluid type.

## File Structure

### New Files

```
src/lib/styles/__tests__/tokens.test.ts  — CREATE: token validation tests
docs/reference/CSS.md                     — CREATE: design system reference
```

### Modified Files

```
src/lib/styles/tokens.css                 — MODIFY: new type scale, shadows, z-index, transitions, opacity, containers, colors
src/app.css                               — MODIFY: complete @theme mapping, unified radius naming
31 .svelte files                          — MODIFY: replace text-[Npx] with semantic type classes
```

---

## Tasks

12 tasks total — see implementation plan at `docs/plans/2026-04-11-slice-17a-1-token-foundation.md` for full step-by-step instructions.

1. Branch setup + slice spec
2. Semantic type scale tokens (9 tokens)
3. Shadow, z-index, transition, opacity, container tokens
4. Unify radius naming + map all tokens to @theme
5. Breakpoint system
6. Type scale migration — home page (8 files)
7. Type scale migration — blog (5 files)
8. Type scale migration — work + services (7 files)
9. Type scale migration — about, contact, shared (17 files)
10. Token validation tests
11. CSS.md design system reference
12. Final verification

## Execution Order

Tasks 1-5 are sequential (each builds on the previous). Tasks 6-9 are independent migrations (could parallelize with approval). Tasks 10-11 can run after 9. Task 12 is final gate.

## Out of Scope

- Component API refactoring (17d)
- Motion/GSAP consolidation (17e)
- Service layer extraction (17b)
- Zod schemas (17c)
- Hardcoded hex color replacement (17a-3)
- Brand primitive components (17a-2)

## Acceptance Criteria

- [ ] 9 type scale tokens in `tokens.css`, all mapped in `@theme`
- [ ] Zero `text-[Npx]` arbitrary values in any `.svelte` file
- [ ] Body text never < 16px, mono never < 13px, labels never < 12px
- [ ] Shadow tokens defined and generating Tailwind utilities
- [ ] Z-index scale defined — no magic numbers in global stacking
- [ ] Transition tokens defined — no unnamed cubic-bezier curves
- [ ] Missing semantic colors added (`--bg-card`, `--border-strong`, `--status-*`, `--text-code`)
- [ ] Radius naming unified between tokens.css and @theme
- [ ] Container width tokens defined
- [ ] 5 canonical breakpoints documented
- [ ] `CSS.md` exists with full token reference
- [ ] `bun run build` + `bun run test` + `bun run check` pass

## Learn

### Design Tokens
**What it is:** Named, reusable values (colors, sizes, spacing) that form the single source of truth for a design system.
**Why it matters:** Tokens prevent inconsistency — instead of 116 arbitrary pixel values, you have 9 semantic names that enforce visual rhythm.
**Try this:** Search for `text-display` in the codebase after migration — every hero headline uses the same fluid scale.
**Go deeper:** https://designtokens.org

### Fluid Typography with clamp()
**What it is:** CSS `clamp(min, preferred, max)` creates responsive text that scales smoothly between breakpoints without media queries.
**Why it matters:** Hero headlines that look great at 375px AND 1440px without a single breakpoint class.
**Try this:** Resize the browser slowly on the home page — watch heading sizes interpolate smoothly.
**Go deeper:** https://utopia.fyi/type/calculator

## Verify

1. `bun run build` succeeds
2. `bun run test` — all pass including token validation
3. `bun run check` — zero TypeScript errors
4. `rg 'text-\[\d+px\]' src/ --glob '*.svelte'` — zero matches
5. Home page at 375px and 1440px — headings are uniform, no tiny text
