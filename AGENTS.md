# AGENTS.md — [yesid.dev](http://yesid.dev)

> **Tool-agnostic workflow contract.** Both Claude Code and OpenAI Codex read this file. Workflow discipline lives in `docs/reference/` (plugin-pulled via `/workflow-pull`). Project specifics live in `docs/project/`. Tool-specific overlays: [docs/reference/tools/claude-code.md](docs/reference/tools/claude-code.md) + [docs/reference/tools/codex.md](docs/reference/tools/codex.md). Claude Code also reads [CLAUDE.md](CLAUDE.md) (thin pointer + model bindings).

## Project

Freelance Digital Infrastructure. Owner: Yesid O. Domain: yesid.dev. Dual audience: freelance clients + dream employers. Full positioning + 6-services framing: [docs/project/SERVICES.md](docs/project/SERVICES.md).

## Core principles (governance)

1. **The workflow is the product.** Personal IP, portable across every project touching Yesid's services. Trade-secret — not for public polish.
2. **The workflow self-enhances.** Every mistake solved in one slice becomes a closing-checklist rule so it cannot recur. Quality compounds slice-over-slice.
3. **Three-tier context.** Tier 1 (repo, always-on) / Tier 2 (cloud mirror + git, fetch-on-command) / Tier 3 (cloud indexes — `COMPLETED-SLICES.md`). Full model: [docs/reference/ARCHIVE.md](docs/reference/ARCHIVE.md).
4. **Shared lexicon.** Workflow vocab → [docs/reference/VOCAB.md](docs/reference/VOCAB.md). Project + brand + industry + tool vocab → [docs/project/VOCAB.md](docs/project/VOCAB.md). Consult before inventing terms.
5. **Tool-agnostic by design.** Per-tool role bindings in [docs/reference/tools/](docs/reference/tools/).

## Workflow discipline (plugin-sourced)

All topics below are pulled into `docs/reference/` via `/workflow-pull`. Never hand-edit — contribute upstream via `/workflow-update`.

| Topic                                       | Reference                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Abstract roles + Stage → role routing       | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Abstract roles                |
| Slice hierarchy (Level 1/2/3, PR at L2)     | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Slice hierarchy               |
| Slice sizing (L / M / S)                    | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Slice sizing                  |
| Session types (Planning / Impl / Closing)   | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Session types                 |
| Plan authoring discipline                   | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Phase 4                       |
| Session progress tracking (6 rules)         | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Session progress tracking     |
| Session token budget (%-based thresholds)   | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Token budget                  |
| Session header format                       | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Session header format         |
| Iteration Protocol (per Level 3 task)       | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Phase 5                       |
| Git & PR workflow                           | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Phase 7                       |
| Hard rules (governance)                     | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Hard rules                    |
| Slice Closing checklist                     | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Phase 8                       |
| Cross-tool adversarial review               | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Cross-tool adversarial review |
| Proven rhythms + self-enhancing workflow    | [docs/reference/WORKFLOW.md](docs/reference/WORKFLOW.md) § Proven rhythms                |

### yesid.dev project bindings

Concrete values that resolve the abstract workflow to this repo:

- **Iteration Protocol verification:** `bun run test` + `bun run check`. Browser check: `http://localhost:5173/`. Full command binding: [docs/project/BINDINGS.md](docs/project/BINDINGS.md).
- **Absolute token-budget thresholds** per model (Opus 4.7 / Opus 4.7 [1m] / Sonnet 4.6): [docs/reference/tools/claude-code.md](docs/reference/tools/claude-code.md).
- **Branch shape:** `feature/slice-{NN}{letter}` (e.g., `feature/slice-17j-token-efficacy`).
- **Close-script:** `bun run slice:close <N> <letter>` — mirrors bundle to cloud, appends `COMPLETED-SLICES.md`, regenerates `tree.txt`.
- **Devlog naming:** new slices use `devlog.md` (D19); closed slices keep historical `log.md` as-is.

## Runtime

**Bun only. Never npm/npx/node.** Lockfile: `bun.lockb`.

- Current OS: Windows 11. Cross-platform via env var `YESITO_CLOUD_ROOT` (Windows: `C:\Users\<user>\Yesito\cloud`; macOS / Linux: `~/Yesito/cloud`). OS-quirks registry: `<cloud>/workflow-knowledge/os-quirks/<os>.md` — check there first when troubleshooting a platform-specific command; append new discoveries before closing any slice.
- Full stack + dependency catalog: [docs/project/STACK.md](docs/project/STACK.md).
- Canonical commands + cloud env binding + 1Password vault + worktree paths: [docs/project/BINDINGS.md](docs/project/BINDINGS.md).

## Active slice

Read the active slice's `spec.md` + `plan.md` at session start (or `CHECKPOINT.md` if present). Current: [docs/slices/slice-cloud-ii/](docs/slices/slice-cloud-ii/).

## Testing

Vitest + Bun. `vitest.setup.ts` stubs jsdom gaps (GSAP, Threlte, lottie-web, postprocessing, canvas, matchMedia, IntersectionObserver). Don't re-mock per-file unless overriding.

**Test-table format** after every run:

```
| Test File | Test Name | Status | Failure Reason |
```

**Never say "some tests failed" without listing every failure by name.** If all pass, still list what ran.

Full test inventory, co-location rules, `@testing-library/svelte` + Playwright E2E conventions: [docs/project/TESTS.md](docs/project/TESTS.md).

## Code Standards

TypeScript for all new files. Comments explain WHY, not what. Descriptive names (no abbreviations except `db`, `api`, `url`). Errors handled explicitly — never swallow silently. Every slice ships code AND tests. Full codebase law: [docs/project/CONSTITUTION.md](docs/project/CONSTITUTION.md).

## CSS Architecture

Three layers, strict separation. Full rules: [docs/project/CSS.md](docs/project/CSS.md). Governance: [docs/project/CONSTITUTION.md](docs/project/CONSTITUTION.md).

| Layer           | File                         | Purpose                                          |
| --------------- | ---------------------------- | ------------------------------------------------ |
| Semantic tokens | `src/lib/styles/tokens.css`  | Theme-switching CSS custom properties            |
| Brand utilities | `src/app.css` `@theme` block | Static brand values that never change with theme |
| Component scope | `<style>` in `.svelte`       | Layout/structure specific to one component       |

**Top rules:** zero hardcoded colors (use tokens); no `!important`; no inline `style=` except dynamic JS values; mobile-first responsive; prefer logical properties; no `vh` (use `dvh`/`svh`/`lvh`); no arbitrary Tailwind spacing.

## Motion + Patterns

- **Motion language** (GSAP actions in Svelte 5, not `$effect`): [docs/project/MOTION.md](docs/project/MOTION.md).
- **Reusable solution patterns** (FLIP, Metro System, Transit HUD, hexagonal content architecture): [docs/project/PATTERNS.md](docs/project/PATTERNS.md).
- **Code structure, modules, data flow:** [docs/project/ARCHITECTURE.md](docs/project/ARCHITECTURE.md).

## Brand

Primary `#E07800` / Accent `#FFB627`. Fonts: Inter (headings/body), JetBrains Mono (code). Dark theme default. "yesid." always lowercase, dot always orange. Favicon is a solid orange circle.

Full brand identity: [docs/project/BRAND.md](docs/project/BRAND.md) + [brand/BRAND.md](brand/BRAND.md) + [brand/foundations/](brand/foundations/).

## Repo structure

```
repo-root/
├── docs/
│   ├── reference/      # Tier 1 plugin-pulled discipline (WORKFLOW, VOCAB, ARCHIVE, tools/)
│   ├── project/        # Tier 1 project-owned (STACK, BINDINGS, ARCHITECTURE, CSS, MOTION, PATTERNS, CONSTITUTION, TESTS, VOCAB, BRAND, SERVICES)
│   ├── roadmap/        # PLAN.md + FUTURE_PHASES.md (hybrid: slice table + plugin-sourced strategic-themes pattern)
│   ├── slices/         # Active slice bundles + _TEMPLATES/
│   └── sessions/       # Non-slice session records
├── brand/              # Visual identity (brand-owning project)
├── src/                # App code
├── scripts/            # slice-close, mirror-docs, mirror-brand
├── static/             # Public assets
├── AGENTS.md           # This file — tool-agnostic contract
├── CLAUDE.md           # Claude Code entry (thin pointer + model bindings)
├── .mcp.json           # MCP definitions (tool-agnostic)
├── .claude/            # Claude Code config (settings.json + subagents + hooks)
├── .codex/             # Codex config (if present)
└── package.json
```

`docs/reference/` is **100% plugin-sourced** — hand-edits contribute upstream via `/workflow-update`. `docs/project/` is **100% project-owned** — never pulled. See [docs/project/README.md](docs/project/README.md) for the DEFAULT / OPTIONAL / EMERGENT discipline.

Full tree: `tree.txt`.

## Never

- Delete files without a slice spec instruction.
- Refactor outside current slice scope.
- Install packages without a devlog entry.
- Skip the close-script (manual mirror loses the index update).
- Use `npm`, `npx`, or `node` directly — Bun only.
- Hand-edit `docs/reference/*` — contribute upstream via `/workflow-update`.
- Add CSS tokens, `@theme` values, or scoped styles without updating [docs/project/CSS.md](docs/project/CSS.md).
- Continue to the next task without Yesid's approval.
- Close a slice without appending OS-quirks discoveries + durable learnings to cloud.
- Invent a brand or workflow term that already exists in [docs/reference/VOCAB.md](docs/reference/VOCAB.md) or [docs/project/VOCAB.md](docs/project/VOCAB.md).
- Hardcode tool-specific mechanics (model names, slash commands, tracker names) into this file — they go in overlays under [docs/reference/tools/](docs/reference/tools/).
