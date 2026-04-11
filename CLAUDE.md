# CLAUDE.md — yesid.dev

## Project

Freelance Digital Infrastructure. SvelteKit + Tailwind + GSAP + Threlte.
Owner: Yesid O. Domain: yesid.dev. Brand: dark theme, `#E07800` orange, `#FFB627` yellow, Inter + JetBrains Mono.

## Runtime

**Bun only. Never npm/npx/node.** OS: Windows.

- `bun install`, `bun run dev`, `bun run test`, `bun run check`, `bunx`
- Lockfile: `bun.lockb`

## Workflow

**Full pipeline:** `docs/WORKFLOW.md` — end-to-end process (Research → Brainstorm → Design Spec → Plan → Slice Spec → Implementation → Closing), tool/plugin mappings per phase, quality gates, and proven rhythms from 22+ slices.

### Session types

Every session is one of three types. Declare which at the start.


| Type               | What happens                                       | Artifacts                                                                                                                                                      |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planning**       | Research, brainstorm, design spec, slice spec      | `.superpowers/brainstorm/`, `docs/superpowers/specs/`, `docs/slices/, C:\Users\otalo\.claude\plugins\cache\claude-plugins-official\superpowers\5.0.7\scripts\` |
| **Implementation** | One sub-slice, task by task per Iteration Protocol | Code, tests, devlog                                                                                                                                            |
| **Closing**        | Docs, handoff, learning docs, tree.txt, commit     | `docs/handoffs/`, `docs/devlog/`, `docs/learn/`                                                                                                                |


**Hard rule:** A session cannot be two types. Planning sessions produce zero code. Implementation sessions don't write specs but can modify on iteration. Closing sessions don't add features.

At session start, always scan for uncommitted changes or commits made outside Claude Code. Document anything found in the devlog.

### Hard rules

- **Never advance without approval.** Dependent tasks run sequentially, one approval between each. No exceptions. Task → sub-slice → slice.
- **Sub-slices may need multiple sessions.** Always estimate and tell Yesid upfront. Never assume one session.
- **Parallel agents require approval.** Independent research/exploration only. Never self-decide to parallelize implementation. If parallelizing would degrade quality, recommend sequential and explain why.
- **Sub-slice convention:** Split into sub-slices (10a, 10b, 10c...) when 6+ tasks or multiple concerns. Each gets its own handoff. Naming: `slice-09c-1`, `slice-09c-2a`.
- **Models** Always use Opus or Sonnet. Do not use Haiku.

## Slice System

All work lives in slices. A slice = spec + acceptance criteria + defined output.
Slice template: `docs/slices/_TEMPLATE.md`

1. Read the active slice spec in `docs/slices/` before touching anything.
2. Build exactly what the spec says. No more, no less.
3. Ambiguity: write your assumption in the devlog and proceed.
4. Impossible spec: document why in devlog and stop.
5. No spec: stop and say so.
6. **Specs describe outcomes, not implementation.** Extract the desired OUTCOME, then decide the implementation yourself. Log decisions in the devlog.

**Active slice:** 13 — Home Page Redesign

- Plan: `docs/superpowers/plans/2026-04-09-home-page-redesign.md`
- Design spec: `docs/superpowers/specs/2026-04-09-home-page-redesign.md`
- 13a (foundation) complete. 13b (manifesto) code done, design pivot pending. 13c (viewport fix) specced.
- Slice specs: `docs/slices/slice-13b-manifesto.md`, `docs/slices/slice-13c-viewport-fix.md`

## Iteration Protocol (MANDATORY)

**You are done when Yesid says you are done.** Tests passing is necessary but not sufficient.

### Per-task flow (never skip, never batch):

1. Implement ONE task from the slice spec.
2. Run `bun run test` and `bun run check`. Both must pass.
  2b. **Pre-flight visual check (UI tasks only).** Before the STOP:
  - State expected layout at desktop (1440px) and mobile (375px)
  - Flag anything that might cause layout issues, overflow, or missing content
  - Fix obvious visual problems before asking Yesid to check
3. **STOP. Do not continue to the next task.** Tell Yesid:
  - What you built (one sentence)
  - What to check on `http://localhost:5173/` (specific behaviors, not vague)
  - Any decisions you made
4. **Wait for Yesid's response.** Do not write more code until he replies.
5. If Yesid reports issues: fix, retest, STOP again, ask him to re-check.
6. If Yesid approves: move to the next task. Repeat from step 1.

### Iteration rules:

- **Never batch multiple tasks.** One task, one approval, then next.
- **Never write the handoff before approval.**
- **Never say "I think this should work."** Yesid confirms on his screen.
- **Never continue coding after completing a task.** The STOP is mandatory.
- Ambiguous feedback: ask a clarifying question before changing code.
- **Never close a slice without updating docs/learn/.**

## Slice Closing (only after ALL tasks approved)

See `docs/WORKFLOW.md` Section 9 for the full 10-step closing checklist. Critical items:

1. Handoff report → `docs/handoffs/_TEMPLATE.md`
2. Devlog → `docs/devlog/_TEMPLATE.md`
3. Update `docs/ARCHITECTURE.md`, `README.md`, `docs/TESTS.md` as needed
4. **Learning docs** → `docs/learn/[domain]/[concept].md` — mandatory, Obsidian format (YAML frontmatter, `[[wikilinks]]`, tags: `learn` + domain + difficulty)
5. **CSS.md** → update when adding tokens, @theme values, scoped styles, z-index, or animation CSS
6. **PATTERNS.md** → add any new reusable solutions discovered
7. Regenerate `tree.txt`:
  ```powershell
   cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"
  ```
8. Commit: `git add -A && git commit -m "feat: complete slice NN — [short desc]" && git push`

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

### Test rules:

- Maintain `docs/TESTS.md` — index by category: Data Layer, Components, Motion, Routes
- Co-locate test files next to the code they test. Never a top-level `tests/` folder.
- Component tests: `@testing-library/svelte`. Visual/animation: Playwright E2E.
- Vitest verifies invocation and structure, not rendered output.
- Update `docs/TESTS.md` on every test add/change/delete — place under correct section, never append to bottom.

## Code Standards

- TypeScript for all new files
- Comments explain WHY, not what
- Descriptive names, no abbreviations (except db, api, url)
- Always handle errors, never swallow silently
- Every slice ships code AND tests

## CSS Architecture (Non-Negotiable)

Three layers, strict separation. Never mix purposes across layers.


| Layer           | File                         | Purpose                                          | Example                                  |
| --------------- | ---------------------------- | ------------------------------------------------ | ---------------------------------------- |
| Semantic tokens | `src/lib/styles/tokens.css`  | Theme-switching CSS custom properties            | `var(--bg-primary)`, `var(--text-muted)` |
| Brand utilities | `src/app.css` `@theme` block | Static brand values that never change with theme | `text-brand-primary`, `bg-brand-accent`  |
| Component scope | `<style>` in `.svelte`       | Layout/structure specific to one component       | grid templates, position, overflow       |


### Rules:

1. **Zero hardcoded colors.** Use `var(--token)` or Tailwind brand class. Add to `tokens.css` first if missing.
2. **Tailwind for composition, scoped styles for structure.** Scoped `<style>` for complex layouts, animations, pseudo-elements.
3. **No `!important`.** Fix the cascade instead.
4. **No inline `style=`** except dynamic JS values (scroll position, transforms).
5. **DRY through tokens, not classes.** Extract tokens or shared components, not `.my-card-style` utilities.
6. **One source of truth per value.** Defined in one place, referenced everywhere.
7. **Document before adding.** New tokens require a CSS.md entry.
8. **Mobile-first responsive.** Base = mobile. `md:` and `lg:` add complexity.
9. **Prefer logical properties.** `padding-inline`, `margin-block` over `padding-left`, `margin-top`.
10. **Group utilities.** Order: layout → spacing → sizing → typography → color → effects → state.

### Full reference: `docs/CSS.md`

## Plugins & Tools

See `docs/WORKFLOW.md` Section 19 for the complete plugin-to-phase map.

### Core MCP Servers (every session)

- **Svelte MCP** — docs, autofixer (Svelte 5 runes)
- **GSAP Master MCP** — animation patterns, performance, debugging
- **Context7 MCP** — live docs for any library (Tailwind, Vitest, Lenis, etc.)
- **Chrome DevTools MCP** — Lighthouse, DOM snapshots, performance traces, competitive scans
- **Claude Preview** — visual verification after UI tasks

### Additional MCPs

- GitHub MCP — PRs and repo management
- Playwright MCP — E2E browser testing
- Figma MCP — design context and screenshots
- Three.js MCP — Threlte scene building
- Vercel MCP — deployment, logs, status

### Key Agents

- `build-error-resolver` — when `bun run check` fails
- `code-reviewer` — after every task
- `tdd-guide` — new features (RED → GREEN → REFACTOR)
- `planner` / `architect` — complex features and design decisions

### Key Skills

- `superpowers:brainstorming` — **mandatory** before any plan
- `superpowers:writing-plans` / `superpowers:executing-plans` — plan lifecycle
- `superpowers:verification-before-completion` — before claiming done
- `frontend-design:frontend-design` / `web-designer:web-designer` — design sessions
- Reference: `/brand/yesid_brand_guide.pdf`, `docs/superpowers/specs/`

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
- Close a slice without updating docs/learn/

## Completed Slices

01, 02, 03, 04, 05, 06, 06b, 06d, A, B, B+, C, 07, 08, 09, 09b, 09c-1, 09c-2a, 09c-2b, 10, 10d+, 11, 12, 13a — handoffs in `docs/handoffs/`

## Repo Structure

See `tree.txt` for full tree. Key paths:

- `src/lib/components/` — UI components
- `src/lib/motion/` — actions, stores, GSAP utils, Threlte scenes, SVG animations
- `src/lib/data/` — types, services, projects, blog data
- `src/routes/` — home, blog/, services/, tech-stack/, contact/
- `src/content/blog/` — markdown posts (professional/, personal/)
- `src/content/stack/` — tech stack markdown files (34 items)
- `docs/slices/` — specs (template: `_TEMPLATE.md`)
- `docs/handoffs/` — reports (template: `_TEMPLATE.md`)
- `docs/devlog/` — logs (template: `_TEMPLATE.md`)
- `docs/superpowers/specs/` — design specs
- `docs/superpowers/plans/` — implementation plans
- `docs/learn/` — learning knowledge base (domain-organized concept docs)
- `docs/WORKFLOW.md` — full pipeline process
- `docs/PATTERNS.md` — catalog of reusable solutions from past slices
- `docs/MOTION.md` — animation language and toolkit
- `static/` — models, images, lottie

