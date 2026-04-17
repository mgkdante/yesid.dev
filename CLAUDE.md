# CLAUDE.md — yesid.dev

## Project

Freelance Digital Infrastructure.
Owner: Yesid O. Domain: yesid.dev. Brand: dark theme, `#E07800` orange, `#FFB627` yellow, Inter + JetBrains Mono.

## Runtime

**Bun only. Never npm/npx/node.** OS: Windows.

- `bun install`, `bun run dev`, `bun run test`, `bun run check`, `bunx`
- Lockfile: `bun.lockb`

## Workflow

**Full pipeline:** `docs/reference/WORKFLOW.md` — end-to-end process (Research → Brainstorm → Design Spec → Plan → Slice Spec → Implementation → Closing), tool/plugin mappings per phase, quality gates, and proven rhythms from 22+ slices.

### Session types

Every session is one of three types. Declare which at the start.


| Type               | What happens                                       | Artifacts                                       |
| ------------------ | -------------------------------------------------- | ----------------------------------------------- |
| **Planning**       | Research, brainstorm, design spec, slice spec      | `docs/specs/`, `docs/plans/`, `docs/slices/`    |
| **Implementation** | One sub-slice, task by task per Iteration Protocol | Code, tests, devlog                             |
| **Closing**        | Docs, handoff, learning docs, tree.txt, commit     | `docs/handoffs/`, `docs/devlog/`, `docs/learn/` |


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

**Active slice:** 17 — Standardization (Design System + Ports & Adapters)

- Roadmap: `docs/roadmap/standardization.md`
- Checkpoint: `docs/slices/slice-17-checkpoint.md`
- **Constitution:** `docs/reference/CONSTITUTION.md` — governs all future development
- Current sub-slice: 17h planning-shrink (2026-04-18) — PR pending. 17a-4 complete and merged.
- Next sub-slice: 17h-3 (Narrative Docs) OR 17h-4 (Logo + Assets) — either order; choose at session start. 17h-1, 17h-2, 17h-5, 17h-6 killed by scope shrink.
- Branch: `feature/slice-17h-planning-shrink`

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

## Git & PR Workflow

### Branch Strategy

- One branch per sub-slice: `feature/slice-{NN}{letter}`
- Branch from `main`, PR back to `main`
- Never commit directly to `main`

### Branch Naming

- `feature/slice-00-repo-hygiene`
- `feature/slice-17a-design-system`
- `feature/slice-17b-service-layer`
- `feature/slice-17c-zod-schemas`
- `feature/slice-17d-component-api`
- `feature/slice-17e-motion-consolidation`
- `feature/slice-17f-test-architecture`
- `feature/slice-17g-learning-docs`

### PR Protocol

1. All tasks complete and approved by Yesid
2. `bun run test` + `bun run check` pass
3. Create PR with summary of all changes
4. Yesid reviews PR on GitHub
5. Squash-merge to main
6. Delete feature branch
7. Next sub-slice branches from updated main

### Commit Convention (unchanged)

`<type>(slice-NN): <description>`

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Session Checkpoint

Every session reads and updates the checkpoint file:

- Located at `docs/slices/slice-{NN}-checkpoint.md`
- One per major slice (e.g., Slice 17 has one checkpoint, not seven)

Start of session: read checkpoint → resume where we left off.
End of session: update checkpoint → clean handoff to next session.

Contents: current sub-slice, task number, branch name, what's merged, what's pending, blockers.

## Slice Closing (only after ALL tasks approved)

See `docs/reference/WORKFLOW.md` Section 11 for the full 10-step closing checklist. Critical items:

1. Handoff report → `docs/handoffs/_TEMPLATE.md`
2. Devlog → `docs/devlog/_TEMPLATE.md`
3. Update `docs/reference/ARCHITECTURE.md`, `README.md`, `docs/reference/TESTS.md` as needed
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

- Maintain `docs/reference/TESTS.md` — index by category: Data Layer, Components, Motion, Routes
- Co-locate test files next to the code they test. Never a top-level `tests/` folder.
- Component tests: `@testing-library/svelte`. Visual/animation: Playwright E2E.
- Vitest verifies invocation and structure, not rendered output.
- Update `docs/reference/TESTS.md` on every test add/change/delete — place under correct section, never append to bottom.

## Code Standards

- TypeScript for all new files
- Comments explain WHY, not what
- Descriptive names, no abbreviations (except db, api, url)
- Always handle errors, never swallow silently
- Every slice ships code AND tests

## CSS Architecture (Non-Negotiable)

**Governance:** `docs/reference/CONSTITUTION.md` — the law of the codebase. Every component, page, and future slice follows it.

Three layers, strict separation. Never mix purposes across layers.


| Layer           | File                         | Purpose                                          | Example                                  |
| --------------- | ---------------------------- | ------------------------------------------------ | ---------------------------------------- |
| Semantic tokens | `src/lib/styles/tokens.css`  | Theme-switching CSS custom properties            | `var(--bg-primary)`, `var(--text-muted)` |
| Brand utilities | `src/app.css` `@theme` block | Static brand values that never change with theme | `text-brand-primary`, `bg-brand-accent`  |
| Component scope | `<style>` in `.svelte`       | Layout/structure specific to one component       | grid templates, position, overflow       |

### Layout Model

Edge-to-edge: `<main>` has no horizontal constraints. Sections manage their own containers. Containers are for text readability only — visual elements use full viewport width. See CONSTITUTION.md Section 2.

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
11. **No `vh` unit.** Use `dvh`/`svh`/`lvh`. See CONSTITUTION.md Section 9.
12. **No arbitrary Tailwind spacing.** Use standard scale or semantic tokens. See CONSTITUTION.md Section 3.

### Full reference: `docs/reference/CSS.md`

## Plugins & Tools

See `docs/reference/WORKFLOW.md` Section 21 for the complete plugin-to-phase map.

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
- Reference: `/brand/yesid_brand_guide.pdf`, `docs/specs/`, `docs/plans/`

### Superpowers Output Paths (Override Defaults)

- Design specs → `docs/specs/` (not docs/superpowers/specs/)
- Implementation plans → `docs/plans/` (not docs/superpowers/plans/)
- Visual companion HTMLs → ephemeral, `.gitignore`d

### Custom slash commands: `.claude/commands/`

## Tool Selection Protocol

At each phase transition, check this map and invoke relevant tools.
Do not wait for Yesid to ask. Proactive tool use = higher quality output.

### Research Phase

ALWAYS:

- Chrome DevTools MCP → multi-breakpoint competitive scan
- Context7 MCP → verify API signatures before assuming
- `frontend-design-pro:analyze-site` → structured site analysis
- `frontend-design-pro:trend-researcher` → current UI/UX trends

CONSIDER:

- `frontend-design-pro:inspiration-analyzer` → studying specific reference sites
- `deep-research` → broader web research needed
- Figma MCP → Figma designs exist for the feature

### Brainstorm Phase

ALWAYS:

- `superpowers:brainstorming` → mandatory, never skip
- Visual companion → offer for any question with visual content

CONSIDER:

- `frontend-design-pro:design-wizard` → interactive design decisions
- `frontend-design-pro:color-curator` → color palette exploration
- `frontend-design-pro:typography-selector` → font pairing decisions
- `ui-design:color-system` → designing color tokens
- `ui-design:typography-scale` → designing type scales
- `ui-design:spacing-system` → designing spacing tokens
- `design-systems:design-token` → organizing token architecture
- `design-systems:naming-convention` → naming tokens/components
- `design-systems:theming-system` → designing theme switching
- `interaction-design:animation-principles` → designing motion

### Planning Phase

ALWAYS:

- `superpowers:writing-plans` → structured plan creation
- Planner agent → complex feature decomposition

CONSIDER:

- Architect agent → architectural decisions
- `engineering:architecture` → system design evaluation
- `engineering:testing-strategy` → planning test approach
- `engineering:tech-debt` → planning refactors
- `api-design` → designing service layer interfaces

### Implementation Phase

ALWAYS:

- Svelte MCP (`svelte-autofixer`) → every Svelte file edit
- Context7 MCP → before using any library API
- `superpowers:executing-plans` → follow the plan
- Claude Preview → visual verification after UI tasks

CONSIDER:

- GSAP Master MCP → any animation work
- `tdd-workflow` → new features (RED → GREEN → REFACTOR)
- `design-systems:component-spec` → building shared components
- `design-systems:accessibility-audit` → adding ARIA/a11y
- `design-systems:pattern-library` → organizing shared patterns
- `ui-design:responsive-design` → responsive layout decisions
- `ui-design:dark-mode-design` → theme-aware component work
- `ui-design:visual-hierarchy` → layout and emphasis decisions
- `interaction-design:micro-interaction-spec` → hover/click interactions
- `interaction-design:state-machine` → complex component states
- `interaction-design:loading-states` → loading/skeleton patterns

### Code Review Phase (after every task)

ALWAYS:

- Code Reviewer agent → general quality
- TypeScript Reviewer agent → TS-specific issues

CONSIDER:

- Security Reviewer agent → auth, input handling, API calls
- `engineering:code-review` → structured review checklist
- `prototyping-testing:heuristic-evaluation` → UI quality check

### Verification Phase (before every STOP)

ALWAYS:

- `superpowers:verification-before-completion` → pre-completion check
- Claude Preview → screenshot proof for UI tasks

CONSIDER:

- Chrome DevTools MCP (`lighthouse_audit`) → performance check
- `prototyping-testing:accessibility-test-plan` → a11y verification

### PR & Merge Phase

ALWAYS:

- `superpowers:finishing-a-development-branch` → PR readiness checklist
- `commit-commands:commit-push-pr` → create the PR
- GitHub MCP → PR management

### Closing Phase

ALWAYS:

- Doc Updater agent → update ARCHITECTURE.md, README, TESTS.md
- `engineering:documentation` → technical docs quality

CONSIDER:

- `continuous-learning` → extract patterns from this slice's work
- `design-systems:documentation-template` → structured docs

### Proactive Tool Triggers (Hard Rules)

1. Editing a .svelte file? → Check Svelte MCP autofixer
2. Using any library API? → Verify with Context7 first
3. Touching animation code? → Consult GSAP Master MCP
4. Adding/changing CSS tokens? → Use design-systems:design-token
5. Building a shared component? → Use design-systems:component-spec
6. Writing tests? → Use engineering:testing-strategy
7. About to claim "done"? → Run verification-before-completion
8. Creating a PR? → Run finishing-a-development-branch first
9. Starting any plan? → Run superpowers:brainstorming first
10. Refactoring code? → Use engineering:tech-debt to assess scope

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
- Add CSS tokens, @theme values, or scoped styles without updating docs/reference/CSS.md
- Continue to next task without Yesid's approval
- Close a slice without updating docs/learn/

## Completed Slices

01, 02, 03, 04, 05, 06, 06b, 06d, A, B, B+, C, 07, 08, 09, 09b, 09c-1, 09c-2a, 09c-2b, 10, 10d+, 11, 12, 13, 17a-1, 17a-2a, 17a-2b, 17a-4 — handoffs in `docs/handoffs/`

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
- `docs/specs/` — design specs
- `docs/plans/` — implementation plans
- `docs/learn/` — learning knowledge base (domain-organized concept docs)
- `docs/reference/` — WORKFLOW, ARCHITECTURE, PATTERNS, MOTION, TESTS, CSS
- `docs/roadmap/` — PLAN, FUTURE_PHASES, standardization
- `docs/research/` — competitive scans, analysis, findings
- `docs/archive/` — brainstorm HTMLs, old mockups, misc
- `static/` — models, images, lottie

