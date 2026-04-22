# Workflow Vocabulary

**Tier 1, 100% plugin-pulled.** This file carries ONLY workflow-universal vocabulary — terms that apply to any project using this workflow plugin, regardless of domain / stack / brand.

> **Project vocabulary lives in [`docs/project/VOCAB.md`](../project/VOCAB.md)** — brand terms, industry terms as-this-project-uses-them, domain-specific vocab, project-LLM-tool conventions. This file + `docs/project/VOCAB.md` together form the project's complete lexicon.

## How to use this doc

- **Operator:** skim once at project start to absorb workflow vocab. Re-consult when a workflow-abstract term appears in a skill / prompt / session.
- **AI tool:** loads every session (Tier 1). Cross-reference when operator uses a term — check here for workflow terms, `docs/project/VOCAB.md` for project terms.
- **Adding workflow terms:** submit a `/workflow-update` PR — workflow vocab belongs in the plugin, not in any single project's docs.
- **Adding project terms:** edit `docs/project/VOCAB.md` directly — that file is project-owned per D3 + D11.

---

## 1. Hierarchy + bundle structure

| Term | Definition |
|------|------------|
| **Slice** | Level-1 unit of scoped work. May be single-level (one PR) or multi-sub-slice (multiple PRs). |
| **Sub-slice** | Level-2 unit within a multi-sub-slice slice. Each sub-slice = one PR (the PR boundary). |
| **Task** | Level-3 unit within a sub-slice (or single-level slice). Lives in TodoWrite / Codex tracker — NOT a file (D19). |
| **Session** | Level-4 (implicit). A wall-clock working period under a task. Identified by `## Session <YYYY-MM-DD HH:MM>` heading in `devlog.md`. |
| **Single-level slice** | A slice that IS the PR boundary — no sub-slices. Slice dir contains `plan.md + devlog.md + spec.md + handoff.md` directly. |
| **Multi-sub-slice slice** | A slice that decomposes into sub-slices. Slice dir contains `plan.md + devlog.md`; each sub-slice dir contains `plan.md + spec.md + handoff.md`. |
| **Bundle** | The file set for a slice or sub-slice (plan + spec + handoff + devlog — subset varies by level). Moves together at archive time. |

## 2. Bundle files

| Term | Definition |
|------|------------|
| **`plan.md`** | Implementation plan. Decisions + task sequencing. Lives at slice level AND sub-slice level (each level has its own). |
| **`spec.md`** | Design spec. Goal + context + design decisions (D-numbered) + acceptance criteria + risks. Lives at sub-slice level (or slice level for single-level slices). |
| **`handoff.md`** | PR body + peer review notes + deferred risks. Written per-task as tasks land; finalized at slice close. IS the PR description. |
| **`devlog.md`** | Self-appending slice-level session record. Shared across all sub-slices of the slice. Cross-tool continuity doc (both Claude Code and Codex append). Slice-level ONLY per D19 — sub-slices do NOT have their own devlog. |
| **Self-appending handoff** | Discipline where `handoff.md` gains a per-task `### Task <slice-tag>-N` section each time a task lands, rather than being written in one push at slice close. Captures decisions while fresh. |
| **Amendments log** | Append-only record inside `spec.md` / `plan.md` of post-approval changes. Date + change + rationale per row. |

## 3. Session types + sizing

| Term | Definition |
|------|------------|
| **Planning session** | Research / brainstorm / spec / plan authoring. L-slices only — produces zero code. |
| **Implementation session** | Task-by-task work per Iteration Protocol. L / M slices. |
| **Closing session** | Finalize handoff, run `/workflow-close-slice`. L / M slices. |
| **Non-slice session** | Work outside any slice (bugfix / config / exploration). Lives at `docs/sessions/<YYYY-MM-DD>-<topic>.md`. S slices only. |
| **L-slice** | Large. Multi-session, ≥10 design decisions, cross-cutting. Full ceremony (separate Planning session → spec.md + plan.md). |
| **M-slice** | Medium. Single session, 2–6 tasks, isolated scope. Lightweight — inline plan paragraph in `devlog.md`'s opening session block. |
| **S-slice** | Small. One-shot bugfix / config / exploration. No planning. Session file records the work. |
| **Upgrade rule** | Mid-session, if scope grows (≥5 unexpected design decisions OR ≥2 architectural layers), STOP + commit safe partial work + re-declare as L + start fresh Planning session. |

## 4. Discipline protocols

| Term | Definition |
|------|------------|
| **Iteration Protocol** | The 8-step per-Level-3-task loop (implement / verify / pre-flight / STOP / update tracker + devlog + handoff / wait for approval / fix-retest on issues / next on approval). Canonical home: `AGENTS.md § Iteration Protocol`. |
| **STOP** | Mandatory halt after a task. No more code until owner approves. Per Iteration Protocol step 4 + step 6. |
| **Pre-flight check** | Self-review before STOP — state expected output, scan for overflow / missing / shape mismatch, fix obvious issues. Catches ~80% of visible bugs before the owner has to. |
| **Closing checklist** | The 10-step hard checklist at slice close (Phase 8 of the pipeline). Canonical home: `docs/reference/WORKFLOW.md § Phase 8 — Closing checklist`. |
| **Self-enhancing workflow** | Core principle — every mistake solved in one slice becomes a closing-checklist rule so it cannot recur. Codify what you re-derive; the workflow compounds quality slice-over-slice. |
| **Token budget** | Percentage-based session-context thresholds (0-40 comfortable / 40-65 healthy / 65-80 pre-break / 80+ danger). Absolute number tables per model live in tool overlays. |

## 5. Partition + storage

| Term | Definition |
|------|------------|
| **Three-tier context** | Tier 1 (always-on, in repo) / Tier 2 (fetch-on-command, cloud) / Tier 3 (cloud indexes — the bridge). AI reads deliberately, not automatically. |
| **Retrieval protocol** | Cheapest-first ladder: in-context → Tier 3 index → Tier 2 artifact → `git show <sha>:<path>`. |
| **Write protocol** | Phase 8 closing-checklist mirrors shipped slices from Tier 1 to Tier 2 + deletes from repo + appends one-liner to Tier 3 index. Self-pruning. |
| **Partition rule (D3)** | `docs/reference/` is 100% plugin-pulled (never edited locally). `docs/project/` is 100% project-owned (never pulled). `AGENTS.md` + `docs/roadmap/PLAN.md` are hybrid (slot pattern). |
| **Slot pattern** | `AGENTS.md` (hybrid) pulls workflow rules from plugin via pointers, then fills project-specific slots inline with pointers to `docs/project/<X>.md` (e.g., "canonical commands: see `docs/project/BINDINGS.md` § Verification commands"). |
| **Project documentation discipline (D11)** | DEFAULT skeletons (STACK / BINDINGS / ARCHITECTURE / TESTS / VOCAB / CONSTITUTION) + OPTIONAL templates (BRAND / CSS / MOTION / PATTERNS / SERVICES) + EMERGENT pattern (operator creates `docs/project/<DOMAIN>.md` as domains develop). See `docs/project/README.md`. |

## 6. Scaffold + templates

| Term | Definition |
|------|------------|
| **Scaffold** | The file set under `plugins/workflow/skills/workflow-add/scaffold/` in the plugin repo. Copied into consuming projects by `/workflow-add`. |
| **Template** | A file under `docs/_TEMPLATES/` (slice / subslice / session). Copied per slice / sub-slice / session by `/workflow-slice-open` or manually. |
| **Overlay** | Per-tool file at `docs/reference/tools/<tool>.md` that binds the workflow's abstract roles (deeper-reasoning, orchestrator, etc.) to that tool's concrete mechanisms (model names, slash commands, tracker). |
| **Slot** | A named placeholder in scaffold files (e.g., `<!-- FILL IN: ... -->`) that operator fills with project-specific content. Slot pattern = the convention of scaffold files being mostly plugin-pulled with a few explicit project slots. |

## 7. Abstract roles

> Workflow names roles, not specific tools or models. Per-tool overlays resolve each role to a concrete mechanism.

| Role | What it does |
|------|--------------|
| **Deeper-reasoning model** | Deep design thinking, novel debugging, real tradeoff decisions. |
| **Deeper-reasoning model (XL)** | Same, with enlarged context window for whole-codebase Q&A. |
| **Faster/cheaper model** | Clear-plan execution, research, file-reading, bounded summarization. |
| **Orchestrator** | Reads repo state; recommends next workflow command (the `/workflow` skill). Never auto-invokes. |
| **Live progress tracker** | Session-visible task list with pending / in-progress / completed states (TodoWrite for Claude Code; equivalent for Codex). |
| **Parallel-dispatch mechanism** | Spin off bounded independent tasks to concurrent workers, isolated from parent context. |
| **Context-budget check** | Show current % of active window used; compare against 40 / 65 / 80% thresholds. |

## 8. Cross-tool + handoff

| Term | Definition |
|------|------------|
| **Tool attribution** | Mandatory `Tool:` / `Planned by:` / `Implemented by:` metadata on every devlog session block AND every handoff per-task entry. Makes cross-tool handoff auditable per D12. |
| **Cross-tool handoff** | Starting a task in one tool (e.g., Claude Code for planning) and resuming in another (e.g., Codex for execution) with no information loss. Enabled by tool-attribution + `AGENTS.md` auto-loaded by both tools. |
| **Handoff branch** | Ephemeral branch `handoff/<slice>-<topic>` for tool-to-tool dialog. Deletes at slice close. Main sees only clean slice commits. |
| **`--light` handoff** | Inline Q&A, no branch, no devlog / handoff.md / memory write. Use for factual questions. Default for quick queries. |
| **`--action` handoff** | Full state transfer — updates handoff.md, appends to devlog, mirrors memory, pushes to handoff branch, signals receiving tool. Required for real work. |
| **Cross-tool adversarial review** | At slice close, the OTHER tool reviews the just-closed slice. D12 enforcement — no tool reviews its own work. Invoked by `/workflow-close-slice`. |
| **Tool-ownership invariant (D12)** | When a specific tool is assigned to a task, the assigned tool owns it exclusively. Other tools MUST NOT override, substitute, inline-simulate, or silently perform the assigned work. |

## 9. Worktree + isolation (D18)

| Term | Definition |
|------|------------|
| **Worktree-per-slice** | Default workflow — every slice runs as a git worktree with its own branch checkout. Main repo stays on base branch. Parallel AI sessions possible, one per worktree. |
| **Worktree persistence** | Worktrees persist for the full slice lifetime (open to PR-merge), which may span many sessions across many days. Never removed until `/workflow-close-slice` runs post-merge. |
| **`EnterWorktree`** | Claude Code tool — creates `.claude/worktrees/<slice>/` AND switches the session atomically. |
| **`--no-worktree`** | Escape hatch for single-track projects — creates a branch in the main checkout instead of a worktree. |

## 10. Skill + plugin ecosystem

| Term | Definition |
|------|------------|
| **Plugin** | A bundle of skills + agents + MCPs shipped together. `workflow` (this plugin), `superpowers`, etc. Loaded on session start. |
| **Skill** | A reusable capability definition (`SKILL.md`). Invoked by the AI tool via slash command (`/workflow-<name>`) or skill-tool. |
| **MCP (Model Context Protocol)** | Anthropic's standard for exposing tools to AI via servers. Project MCP definitions in `.mcp.json`. |
| **Subagent / Agent** | A separate AI conversation dispatched with an Agent tool — runs in its own context. Only the final message returns to parent. Use for bounded research / parallel independent work. |
| **Prompt cache** | The AI provider's prefix cache. First message is expensive (cache write); subsequent messages on the same prefix are cheap (cache read). Cache TTL varies by provider. |
| **Context window** | Total token budget for a conversation. Model-specific. |

## 11. OS + cross-platform

| Term | Definition |
|------|------------|
| **OS-quirks registry** | Cross-project log of platform-specific command fixes at `<cloud>/workflow-knowledge/os-quirks/<os>.md`. Grep before debugging; append when solved. Enforced as Phase 8 step 4. |
| **Cloud env var** | Project picks a vendor-named env var (e.g., `<VENDOR>_CLOUD_ROOT`) pointing to its local cloud directory. Scripts fall back to `path.join(os.homedir(), '<vendor>', 'cloud')`. Bound in `docs/project/BINDINGS.md § Cloud env binding`. |

## 12. Workflow plugin commands

| Command | What it does |
|---------|--------------|
| `/workflow` | Orchestrator — reads repo state, recommends next command. Never auto-invokes. |
| `/workflow-add` | Scaffold installer — copies `scaffold/` into consuming project. Idempotent. |
| `/workflow-slice-open <name>` | Start a new slice — copy slice templates, create branch / worktree (D18). |
| `/workflow-status` | Read-only state report. |
| `/workflow-update "<description>"` | Contribute upstream — open PR on `mgkdante/workflow` from a consuming project. |
| `/workflow-pull` | Sync from plugin — three-way diff-merge; preserves user customizations (D14). Line-ending-aware comparison (git hash-object). |
| `/workflow-close-slice` | Close slice — finalize handoff + cross-tool adversarial review + archive bundle. |
| `/workflow-handoff --to <tool>` | Cross-tool handoff — push handoff content to `handoff/<slice>-<topic>` branch. |
| `/workflow-mirror` | Push artifacts to cloud archive. |
| `/workflow-trim` | Remove local mirror copies (manual-only — D16). |
| `/workflow-clean` | Manual cleanup (never auto — D15). |

---

## Adding new terms

- **Workflow-universal term?** → Submit a `/workflow-update` PR against `mgkdante/workflow`. Term gets added here.
- **Project-specific term?** → Add directly to [`docs/project/VOCAB.md`](../project/VOCAB.md).
- **When in doubt:** put it in `docs/project/VOCAB.md` first, promote to the plugin later if it turns out to be universal.
