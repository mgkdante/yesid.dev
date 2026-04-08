# CLAUDE.md — yesid.dev

## Project

Freelance Digital Infrastructure. SvelteKit + Tailwind + GSAP + Threlte.
Owner: Yesid O. Domain: yesid.dev. Brand: dark theme, `#E07800` orange, `#FFB627` yellow, Inter + JetBrains Mono.

## Runtime

**Bun only. Never npm/npx/node.** OS: Windows.
- `bun install`, `bun run dev`, `bun run test`, `bun run check`, `bunx`
- Lockfile: `bun.lockb`

## Slice System

All work lives in slices. A slice = spec + acceptance criteria + defined output.
Slice template: `docs/slices/_TEMPLATE.md`

1. Read the active slice spec in `docs/slices/` before touching anything.
2. Build exactly what the spec says. No more, no less.
3. Ambiguity: write your assumption in the devlog and proceed.
4. Impossible spec: document why in devlog and stop.
5. No spec: stop and say so.

**Active slice:** 10 — Tech Stack Page (spec: TBD)

## Iteration Protocol (MANDATORY — READ THIS TWICE)

**You are done when Yesid says you are done.** Tests passing is necessary but not sufficient.

### Per-task flow (never skip, never batch):

1. Implement ONE task from the slice spec.
2. Run `bun run test` and `bun run check`. Both must pass.
3. **STOP. Do not continue to the next task.** Tell Yesid:
   - What you built (one sentence)
   - What to check on `http://localhost:5173/` (specific behaviors, not vague)
   - Any decisions you made
4. **Wait for Yesid's response.** Do not write more code until he replies.
5. If Yesid reports issues: fix, retest, STOP again, ask him to re-check.
6. If Yesid approves: move to the next task. Repeat from step 1.

### Slice closing (only after ALL tasks approved):

1. Write handoff report: `docs/handoffs/_TEMPLATE.md`
2. Update devlog: `docs/devlog/_TEMPLATE.md`
3. Update `docs/ARCHITECTURE.md` if structure changed
4. Update `README.md` if setup/usage changed
5. Regenerate `tree.txt`:
   ```powershell
   cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"
   ```
6. Commit and push:
   ```bash
   git add -A && git commit -m "feat: complete slice NN — [short desc]" && git push
   ```

### Iteration rules:

- **Never batch multiple tasks.** One task, one approval, then next.
- **Never write the handoff before approval.**
- **Never say "I think this should work."** Yesid confirms on his screen.
- **Never continue coding after completing a task.** The STOP is mandatory.
- Ambiguous feedback: ask a clarifying question before changing code.

## File Change Protocol

Every file change requires:
1. **Devlog entry** — use `docs/devlog/_TEMPLATE.md`
2. **Doc updates** — `ARCHITECTURE.md` for structure, `README.md` for setup
3. **tree.txt** — regenerated on slice close (PowerShell command above)
4. **Handoff** — use `docs/handoffs/_TEMPLATE.md` (only after approval)
5. **CSS.md** — update `docs/CSS.md` when any of these happen:
   - New CSS custom property added to `tokens.css`
   - New `@theme` value added to `app.css`
   - New component with scoped `<style>` block created
   - Existing token renamed, removed, or repurposed
   - New z-index value introduced anywhere
   - New animation-related CSS added
   Document what changed, why, and where it's consumed. Never add a token without a CSS.md entry.
6. **Tests.md88** update `docs/css.md`

## Testing (Vitest + Bun)

Setup: `vitest.setup.ts` stubs jsdom gaps (GSAP, Threlte, lottie-web, postprocessing, canvas, matchMedia, IntersectionObserver). Don't re-mock per-file unless overriding.

### After every test run, print this table:

```
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
| src/...   | it(...)   | PASS   |                |
| src/...   | it(...)   | FAIL   | Expected X, got Y (line NN) |
```

- For failures: show expected vs actual, error message, assertion line
- **Never say "some tests failed" without listing every failure by name**
- If all pass, still list what ran

### When creating or modifying tests:

- Maintain `docs/TESTS.md`
- For each test: name (describe > it), what it validates (plain English), key assertions, setup notes
- Update `docs/TESTS.md` on every test add/change/delete
- **Place entries under the correct category by file path:**
  - `## Data Layer` — tests in `src/lib/data/`
  - `## Components` — tests in `src/lib/components/`
  - `## Motion` — tests in `src/lib/motion/`
  - `## Routes` — tests in `src/routes/`
- Never append to the bottom. Find the right section, add the entry there.
- Co-locate test files next to the code they test. Never use a top-level `tests/` folder.

### Test boundaries:

- Component tests: `@testing-library/svelte`
- Visual/animation correctness: Playwright E2E, not Vitest
- Vitest verifies invocation and structure, not rendered output

## Code Standards

- TypeScript for all new files
- Comments explain WHY, not what
- Descriptive names, no abbreviations (except db, api, url)
- Always handle errors, never swallow silently
- Every slice ships code AND tests

## CSS Architecture (Non-Negotiable)

Three layers, strict separation. Never mix purposes across layers.

| Layer | File | Purpose | Example |
|-------|------|---------|---------|
| Semantic tokens | `src/lib/styles/tokens.css` | Theme-switching CSS custom properties | `var(--bg-primary)`, `var(--text-muted)` |
| Brand utilities | `src/app.css` `@theme` block | Static brand values that never change with theme | `text-brand-primary`, `bg-brand-accent` |
| Component scope | `<style>` in `.svelte` | Layout/structure specific to one component | grid templates, position, overflow |

### Rules:

1. **Zero hardcoded colors.** No hex, rgb, or hsl values in `.svelte` files. Use `var(--token)` or Tailwind brand class. If a color doesn't exist as a token, add it to `tokens.css` first.
2. **Tailwind for composition, scoped styles for structure.** Tailwind handles spacing, typography, flex/grid shortcuts, responsive. Scoped `<style>` handles complex layouts, animations, pseudo-elements, or anything needing more than 3 utilities on one element.
3. **No `!important`.** If you need it, specificity is wrong. Fix the cascade.
4. **No inline `style=` attributes** except for dynamic values computed in JS (scroll position, transforms). Static styles never go inline.
5. **DRY through tokens, not through classes.** If two components share a visual pattern, extract a token or a shared component. Don't create `.my-card-style` utility classes.
6. **One source of truth per value.** A color, spacing, or font size is defined in exactly one place. Everything else references it.
7. **Document before adding.** New tokens require a CSS.md entry explaining: name, purpose, where consumed, why existing tokens don't cover the case.
8. **Mobile-first responsive.** Base styles are mobile. `md:` and `lg:` add complexity. Never write desktop-first then override down.
9. **Prefer logical properties.** `padding-inline`, `margin-block` over `padding-left`, `margin-top` when direction-agnostic.
10. **Group related utilities.** In Tailwind class strings, order: layout (flex/grid) → spacing (p/m) → sizing (w/h) → typography (text/font) → color (bg/text/border) → effects (shadow/opacity) → state (hover/focus).

### Reference: `docs/CSS.md` (created in Slice 13a) is the full style guide with every token, every rule, every component's styling rationale.

## Plugins (`/plugin` to manage)

### Design Phase (planning layouts, user flows, copy)
- Design Research, UX Strategy, UI UX Promax
- Brand Voice (copy and tone)
- Reference: `/brand/yesid_brand_guide.pdf`, `docs/superpowers/specs/`

### Build Phase (generating components, iterating)
- Frontend Design Pro, Web Designer, UI Design (component generation)
- Frontend Design, Prototyping Testing (iteration)
- Chrome Devtools (browser debugging)
- TypeScript LSP (real-time type errors)
- Context7 (live docs: SvelteKit, GSAP, Threlte, etc.)
- Check `src/lib/components/` before creating new ones
- Reference: `docs/ARCHITECTURE.md`, `tree.txt`, `vitest.setup.ts`

### Quality Phase (before any commit)
- Code Review
- Designer Toolkit (design system consistency)
- `bun run test` and `bun run check` must both pass
- Brand compliance: colors, fonts, dark theme, "yesid." formatting

### Meta (always active)
- Remember (persist decisions across sessions)
- Claude Code Setup, Everything Claude Code (tooling reference)
- Superpowers (general enhancement)

### MCP Servers (`.claude/settings.json`)
- GitHub MCP for PRs and repo management
- Playwright MCP for E2E browser testing (slice 10+)

### Custom slash commands: `.claude/commands/`

## Brand (Non-Negotiable)

- Primary: `#E07800` / Accent: `#FFB627`
- Fonts: Inter (headings/body), JetBrains Mono (code)
- Dark theme default. "yesid." always lowercase, dot always orange.
- Full guide: `/brand/yesid_brand_guide.pdf`

## Never

- Delete files without slice spec instruction
- Refactor outside current slice scope
- Install packages without devlog entry
- Skip devlog, slice, handoff, or tree.txt update
- Use npm or npx
- Add CSS tokens, @theme values, or scoped styles without updating docs/CSS.md
- Continue to next task without Yesid's approval

## Completed Slices

A, B, B+, C, 07, 08, 09, 09b, 09c-1, 09c-2a, 09c-2b — handoffs in `docs/handoffs/`

## Repo Structure

See `tree.txt` for full tree. Key paths:
- `src/lib/components/` — UI components
- `src/lib/motion/` — actions, stores, GSAP utils, Threlte scenes, SVG animations
- `src/lib/data/` — types, services, projects, blog data
- `src/routes/` — home, blog/, services/, preview/
- `src/content/blog/` — markdown posts (professional/, personal/)
- `docs/slices/` — specs (template: `_TEMPLATE.md`)
- `docs/handoffs/` — reports (template: `_TEMPLATE.md`)
- `docs/devlog/` — logs (template: `_TEMPLATE.md`)
- `static/` — models, images, lottie
