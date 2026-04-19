# Sub-Slice 17k — Cross-Tool Workflow Portability

**Level 2 design spec.** Purpose: describe outcomes + architectural decisions + acceptance criteria. Implementation plan lives in `plan.md`.

**Status:** draft
**Parent slice:** Slice 17 — Standardization (`../README.md`)
**Depends on:** Completion of Slice 17b's content-extraction work (currently in progress on `feature/slice-17b-repositories`)
**Est. Sessions:** 4 (this Planning + 2 Implementation + 1 Closing)
**Size:** **L** (multi-session, ≥10 design decisions, cross-cutting across repo + cloud + user-level configs)

## Objective

Make the yesid.dev workflow fully portable across **Claude Code** and **Codex** (and future LLM tools). Clone the repo, install any supported LLM tool, resume work with no friction. Any work done in any tool is captured in the shared slice logs with tool attribution, so the other tool can pick up mid-flight at any time.

## Context

**Why now:**

- Yesid opened the project in Codex; Codex auto-created a find-replaced `AGENTS.md` that was broken. Prompted the question of how to make the workflow truly tool-agnostic.
- A prior non-slice refactor (uncommitted, this branch) introduced `AGENTS.md` (tool-agnostic core), a thin `CLAUDE.md` pointer, and per-tool overlays at `docs/reference/tools/{claude-code,codex}.md`. That refactor also renamed the cross-tool cloud knowledge dir to `<cloud>/workflow-knowledge/` (was previously Claude-branded) and added `<cloud>/codex-config/` symmetric to `<cloud>/claude-config/`.
- User reverted `CLAUDE.md` to its full original content (unclear intent at revert time; resolved below via decision A).
- User explicitly requested: (1) generic language across docs, (2) mirror Claude setup into inventory, (3) MCP audit permission, (4) each tool leaves attributed notes so cross-tool handoff works.

**What this sub-slice resolves:**

- Formalizes the tool-agnostic structure (undoes revert per decision A).
- Replaces Claude-specific narrative with LLM-tool-neutral language in governance docs.
- Moves tool-specific mechanics (model names, slash commands, tool-specific UI names) out of `AGENTS.md` and into overlays.
- Captures full Claude + Codex inventories into cloud so any machine can reproduce the stack.
- Adds tool-attribution convention to session logs so a Codex session can pick up where a Claude session left off.
- Produces a prune-recommendations document (no execution this slice).

## Design principles

1. **Tool-agnostic core, tool-specific overlays.** `AGENTS.md` names **roles**; `docs/reference/tools/<tool>.md` binds roles to concrete mechanisms. Swapping a role = edit one overlay row.
2. **Single source of truth per layer.** Workflow contract: `AGENTS.md`. Per-tool bindings: overlay files. User configs: `<cloud>/{claude,codex}-config/`. Cross-tool knowledge: `<cloud>/workflow-knowledge/`.
3. **Symmetry.** Whatever exists for Claude Code must have a Codex counterpart at the same level (or an explicit "n/a for this tool" note). No one-sided gaps.
4. **Zero-friction tool-switch.** Any task can be started in one tool and continued in another mid-stream. Attributed logs make the lineage explicit.
5. **Discipline, not tooling.** Cross-tool continuity uses the EXISTING `log.md` / `handoff.md` / `CHECKPOINT.md` files. New convention is a header line, not new infrastructure.

## Architecture

### Three-layer workflow file structure (reaffirmed)

```
repo-root/
├── AGENTS.md                  # Tool-agnostic source of truth. Both tools auto-load.
├── CLAUDE.md                  # Thin pointer + Claude-Code role bindings table. ~30 lines.
├── docs/reference/tools/
│   ├── README.md              # How overlays work
│   ├── claude-code.md         # Claude role bindings + tool-specific detail
│   └── codex.md               # Codex role bindings + tool-specific detail
```

`AGENTS.md` describes the workflow in abstract terms (roles, stages, discipline). Overlays resolve roles to concrete mechanisms.

### Tool attribution convention (NEW)

Every session header in `log.md` and every per-task section in `handoff.md` includes explicit tool provenance:

```markdown
### Session 2026-04-19 10:00 — Task 17k-2
**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-1 (Claude Code / Opus 4.7, commit abc1234)

…session body…
```

And in `handoff.md`:

```markdown
## Task 17k-2 — Generic-term pass
**Planned by:** Codex (gpt-5.4)
**Implemented by:** Claude Code (Sonnet 4.6, commit def5678)
…
```

No new files. No new scripts. Just a header convention added to `AGENTS.md § Iteration Protocol` and to the slice templates.

### Inventory structure in cloud

```
<cloud>/workflow-knowledge/stack/
├── README.md                        # registry orientation
├── inventory/
│   ├── claude-code.md               # MCPs / plugins / skills / agents / rules (from research)
│   └── codex.md                     # MCPs / skills / rules / config (from research)
└── skills/
    └── workflow-efficiency/         # User-authored skill, mirrored from ~/.claude/skills/
        └── SKILL.md
```

The `stack/` dir is the cross-tool portable registry referenced in earlier discussions (the full stack-registry proposal was deferred; this slice lands the minimum-viable version — inventories + the one user-authored skill).

### Generic language convention

Replace narrative Claude references with LLM-tool-neutral language. Examples:

| Before | After |
|--------|-------|
| "Claude at execution time has full context…" | "The LLM tool at execution time has full context…" |
| "Claude could produce the code in 30 seconds…" | "An LLM tool could produce the code in 30 seconds…" |
| "scan for commits made outside Claude Code" | "scan for commits made outside the LLM tool" |
| "A fresh Opus instance pointed at…" | "A fresh LLM tool session pointed at…" |
| "Claude Preview → screenshot proof" | "The tool's preview feature → screenshot proof" (or just "Preview tool → screenshot proof") |

Tool-specific details (model names, slash commands, `TodoWrite` references in prose) move OUT of governance docs and INTO overlays.

## Decisions (answered 2026-04-18)

| Ref | Question | Decision |
|-----|----------|----------|
| A | CLAUDE.md fate | **Thin pointer.** CLAUDE.md = "read AGENTS.md" + Claude role bindings table (~30 lines). Reverts the earlier revert. |
| B | Generic term | **"LLM tool" / "LLM tools"** — plural when appropriate, singular for specific referents. |
| C | MCP/plugin prune scope | **Inventory + recommend only.** No auto-prune this slice; user reviews, executes manually. |
| D | Inventory format | **Hybrid.** Full list in markdown inventories; literal-copy only for user-authored content (the `workflow-efficiency` skill). |
| E | Timing | **Now.** Spec + plan in this Planning session. Implementation in separate session(s). |
| F | Tool attribution | **Mandatory** on every session header in `log.md` and every per-task section in `handoff.md`. |

## Reference sites / prior art

- **Workflow refactor precursor** — the uncommitted non-slice work on this branch that created `AGENTS.md`, overlays, and renamed the cloud cross-tool knowledge dir to `workflow-knowledge`. This slice formalizes + completes that start.
- **`<cloud>/claude-config/`** — existing snapshot/restore pattern (README + `snapshot.ts` + `restore.ts` + `required-env-vars.md` + dated snapshot dirs) that `<cloud>/codex-config/` now mirrors symmetrically.
- **Research reports (captured in this session)** — Claude inventory (full listing of 14 enabled plugins, 117 skills, 16 agents, 71 rule files) + repo language scan (16 substantive hits across 8 "make-generic" + 6 "move-to-overlay" + 0 dead links).
- **[obra/superpowers](https://github.com/obra/superpowers)** — canonical multi-tool agentic framework. Ships the exact layout we're adopting: `AGENTS.md` + `CLAUDE.md` + `GEMINI.md` + `.codex/` + `.cursor-plugin/` + `.opencode/` at repo root. Available on Claude Code, Codex CLI, Gemini CLI, Cursor, OpenCode. Validates the three-layer structure as an industry-proven pattern. Yesid already uses the superpowers plugin via Claude Code — this slice's custom slice methodology **coexists** with superpowers' spec/plan/TDD/subagent-driven-development discipline (no conflict; the two operate at different granularities).

## Scope

### In scope

- Shrink `CLAUDE.md` back to thin pointer (undoes the user's revert per decision A).
- Rewrite 8 "make-generic" occurrences across `CLAUDE.md`, `docs/reference/WORKFLOW.md`, `brand/examples/README.md` using "LLM tool" language.
- Move 6 "move-to-overlay" items out of `CLAUDE.md` and `VOCAB.md` into `docs/reference/tools/claude-code.md`.
- Add tool-attribution convention to: `AGENTS.md § Iteration Protocol` step 4, `docs/slices/_TEMPLATE-SUBSLICE/log.md`, `docs/slices/_TEMPLATE-SUBSLICE/handoff.md`.
- Create `<cloud>/workflow-knowledge/stack/inventory/claude-code.md` with the Claude research findings.
- Create `<cloud>/workflow-knowledge/stack/inventory/codex.md` with the Codex research findings.
- Mirror `~/.claude/skills/workflow-efficiency/` → `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/`.
- Write `<cloud>/workflow-knowledge/stack/prune-recommendations.md` (no execution).
- Verification: paste updated `AGENTS.md` + overlays + inventory into Codex; ask Codex to confirm it can run the workflow; capture response.

### Out of scope (explicitly deferred)

- **Actual MCP/plugin pruning** — user reviews recommendations, executes manually in a separate non-slice session.
- **Codex MCP population** — filling the 4 missing MCPs (context7, chrome-devtools, gsap-master, github) in `~/.codex/config.toml` is the user's call, separate task.
- ~~**Full stack registry with install scripts**~~ — **PROMOTED INTO SCOPE** via 2026-04-18 amendment (decisions G/H/I). Replaces inventory-doc tasks with a machine-readable registry (JSONC format) + install.ts script that writes to both tools' config formats, copies skills, and runs plugin-install commands.
- **`skill.fish` integration** — parked per user's security concerns.
- **Auto-sync between `cloud/claude-config/` and `cloud/codex-config/`** — not this slice.
- **Converting `brand/CLAUDE-DESIGN.md`** — intentionally Claude-specific design guide; leave alone.
- **Translating rule files** under `~/.claude/rules/<language>/` — those are reference material for 12 languages, not in the yesid.dev repo.
- **Populating the empty `~/.codex/AGENTS.md`** — discussed as an opportunity; deferred to avoid creeping scope.

## Tasks (Level 3) — high-level list; detail in `plan.md`

| # | Task | Est. commits | Depends on |
|---|------|--------------|-----------|
| 17k-1 | Shrink CLAUDE.md → thin pointer (undoes revert) | 1 | — |
| 17k-2 | Generic-term pass (8 Cat-B + 6 Cat-C rewrites across CLAUDE.md, WORKFLOW.md, VOCAB.md, brand/examples) | 1–2 | 17k-1 |
| 17k-3 | Tool attribution convention (AGENTS.md + log.md/handoff.md templates) | 1 | 17k-1 |
| 17k-4 | Claude inventory document at `<cloud>/workflow-knowledge/stack/inventory/claude-code.md` | 1 | — (research already done) |
| 17k-5 | Codex inventory document at `<cloud>/workflow-knowledge/stack/inventory/codex.md` | 1 | — |
| 17k-6 | Copy user-authored `workflow-efficiency` skill to `<cloud>/workflow-knowledge/stack/skills/` | 1 | — |
| 17k-7 | Write `<cloud>/workflow-knowledge/stack/prune-recommendations.md` | 1 | 17k-4 |
| 17k-8 | Cross-tool verification — validate in Codex, capture response | 1 | 17k-1 … 17k-7 |

**Ordering note.** 17k-4–17 are cloud-side and can be batched; 17k-1–3 are repo-side and need sequencing. Detailed sequencing + STOP criteria per task go in `plan.md`.

## Acceptance criteria

- [ ] `CLAUDE.md` is ≤40 lines, contains the Claude role bindings table, and delegates to `AGENTS.md`.
- [ ] `AGENTS.md` contains zero references to Opus/Sonnet/Haiku/TodoWrite/`/model`/`/cost` in prose (these live in the overlay).
- [ ] Grep for "Claude at execution time" / "fresh Opus" / "Claude Preview" in governance docs returns 0 hits.
- [ ] `AGENTS.md § Iteration Protocol` step 4 specifies the mandatory tool-attribution header format.
- [ ] `docs/slices/_TEMPLATE-SUBSLICE/log.md` and `handoff.md` templates include the `**Tool:**` line in their session/task sections.
- [ ] `<cloud>/workflow-knowledge/stack/registry.jsonc` exists as machine-readable source of truth covering MCPs, skills, plugins (and at minimum placeholders for agents) with per-tool `install_in` lists.
- [ ] `<cloud>/workflow-knowledge/stack/install.ts` is a runnable Bun script with `--tool claude-code|codex|both`, `--dry-run`, `--apply`, and `--only mcps|skills|plugins` flags. Dry-run prints a diff; `--apply` writes.
- [ ] Round-trip test: bump a registry entry, run `install.ts --tool both --dry-run`, review diff; run `--apply`; confirm both tools reflect the change.
- [ ] `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/SKILL.md` is a verbatim copy of `~/.claude/skills/workflow-efficiency/SKILL.md` (size + content match).
- [ ] `<cloud>/workflow-knowledge/stack/prune-recommendations.md` lists specific prune candidates with disk/context impact.
- [ ] A Codex session opened in the repo confirms it can read `AGENTS.md` + overlay and explain the workflow (verification captured in handoff).
- [ ] All of the above land in a single sub-slice 17k PR, squash-merged to main.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| CLAUDE.md revert reveals a Claude-Code-specific need we haven't surfaced | medium | Ask user why they reverted before shrinking; if there's a reason, capture it in the thin pointer or the Claude overlay |
| Generic "LLM tool" term becomes unwieldy in certain prose | low | Style flex allowed: "LLM tool", "the tool", "your LLM tool" — pick what reads best per sentence |
| Codex verification reveals a structural gap (e.g., Codex can't find overlay) | medium | Fix-forward: treat Codex's feedback as a 17k amendment, not a blocker |
| Uncommitted 17b work interferes with spec+plan commits | high | Resolve git state BEFORE starting implementation (see Git state section) |
| Inventory goes stale within weeks | high | Inventory files include capture date + "regenerate by running X" note; not treated as authoritative forever |

## Non-goals (reiterated for discipline)

- Zero code changes to app source (`src/`). This is docs + governance only.
- Zero build-pipeline changes.
- Zero test-suite changes.
- Zero new MCP installs or enablements.

## Git state (must resolve BEFORE implementation)

**Current state (as of 2026-04-18, before this spec is committed):**

- Branch: `feature/slice-17b-repositories`
- Uncommitted work in two layers:
  1. 17b content-extraction work in progress (`src/lib/content/*.ts`, `src/routes/**/*.svelte`, etc.) — paused; user's active slice
  2. Workflow refactor (`AGENTS.md`, `docs/reference/tools/`, CLAUDE.md, repo-wide rename, cloud-side changes) — non-slice precursor to 17k
- The CLAUDE.md revert happened on top of the workflow refactor; it partly invalidates the refactor's thin-pointer intent.

**Required resolution (before 17k implementation session):**

1. Decide fate of the 17b in-progress work: either commit what's stable or stash / revert if paused indefinitely.
2. Extract the workflow refactor as its own commit(s) — either on this branch (clearly labeled) or on a new branch `chore/workflow-tool-agnostic`.
3. Branch 17k from main: `feature/slice-17k-cross-tool-portability`.
4. Cherry-pick or rebase the workflow refactor onto the new branch.
5. Commit this spec + plan on the new branch.

This is a prerequisite step, not a 17k task. Flagged here so nobody starts 17k implementation on a muddled branch state.

## Amendments log

(Spec is mostly immutable. Log any post-approval changes here with date + rationale.)

| Date | Change | Why |
|------|--------|-----|
| 2026-04-18 | Initial draft | Planning session output |
| 2026-04-18 | Added obra/superpowers to Reference sites / prior art | User shared the repo post-approval; validates the three-layer cross-tool structure we're adopting and confirms Yesid's existing superpowers usage coexists with the custom slice workflow |
| 2026-04-18 | Decision G: Registry format = JSONC (JSON with comments) | Bun-native parsing; comments allow per-entry rationale in the registry file itself |
| 2026-04-18 | Decision H: Install script covers MCPs + skills + plugins | User confirmed plugin install is automatable via `/plugin marketplace add <repo>` + `/plugin install <name>@<marketplace>`; Claude-side plugins install via CLI, Codex has no plugin concept (skills map directly). Full MCPs + skills + plugins in scope. |
| 2026-04-18 | Decision I: install.ts runs in dry-run + manual-apply mode | Dry-run prints the diff; user reviews; re-run with `--apply` to commit changes. Safer than auto-apply + undo. |
| 2026-04-18 | Promoted "Full stack registry with install scripts" from Out of scope → In scope | User ask: single source of truth where updates (e.g., superpowers version bump) propagate to both tools via one `install.ts` run. Inventory-doc tasks (17k-4, 17k-5) become registry-schema + populate tasks; new tasks 17k-9 (install.ts) and 17k-10 (round-trip test) added. Session 3 splits into 3a + 3b. |
| 2026-04-18 | Codex self-research supersedes the earlier "no plugin concept" assumption | Current Codex docs + local install now confirm native plugins, file-based custom agents, memories, hooks, and first-party web search. 17k can target stronger Codex parity than the planning session assumed. |
| 2026-04-18 | install.ts implementation adopts Bun-first package executor normalization and does not auto-manage `~/.agents/skills/` | User explicitly requested `npx` → `bunx` / `npm` → `bun`, and live dry-run showed the shared import layer can diverge from the canonical cloud skill copy in ways that should remain user-mediated |
| 2026-04-18 | Skill entries can now carry a registry-owned `version` that install.ts materializes into target `SKILL.md` frontmatter | The round-trip test needed a real, installer-propagated field to bump; otherwise changing registry metadata alone would not be visible in either tool's installed skill copy |
