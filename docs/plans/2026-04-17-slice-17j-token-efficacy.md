# Slice 17j — Token Efficacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce cold-session token overhead for yesid.dev by pruning 7 accretion sources (repo docs, `CLAUDE.md`, `WORKFLOW.md`, `.mcp.json` scoping, `~/.claude/rules/zh/`, plugins, auto-memory), AND codify the findings into three portable outputs — a research knowledge base at `cloud/claude-knowledge/token-efficacy/`, a `token-frugal-workflow` skill at `~/.claude/skills/`, and a config snapshot at `cloud/claude-config/`.

**Architecture:** Measurement-spine (baseline → research → prune → re-measure → codify → snapshot). Parallel subagents for Task 0a research only (six independent deep dives, summary-only returns). Repo-side changes ship in one PR; global config + cloud artifacts documented in handoff. Everything reversible via git + cloud mirror.

**Tech Stack:** Markdown + PowerShell. Tools: `/context-budget` slash command, `robocopy`, `ripgrep` (via Grep tool), `superpowers:dispatching-parallel-agents` skill, `git`, `gh`.

**Branch:** `feature/slice-17j-token-efficacy` (already created, off main with 17h merged as PR #22)

**Prerequisite:** Slice 17h merged to main ✅ (verified — commit `a2278a8` on main; squash-merged from PR #22 on 2026-04-17)

**Referenced spec:** [docs/slices/slice-17j-token-efficacy.md](../slices/slice-17j-token-efficacy.md)

---

## File Structure

### New files (in repo)

| Path | Created in task | Purpose |
|------|-----------------|---------|
| `.mcp.json` | Task 4 | Project-scoped MCP allowlist |
| `docs/ARCHIVE.md` | Task 1 | Pointer stub to cloud mirror + git history |
| `docs/devlog/2026-04-17-slice-17j-task-0.md` | Task 0 | Baseline measurement |
| `docs/devlog/2026-04-17-slice-17j-task-6.md` | Task 6 | Re-measurement deltas |
| `docs/devlog/2026-04-17-slice-17j.md` | Task 9 | Consolidated slice devlog |
| `docs/handoffs/slice-17j-token-efficacy.md` | Task 9 | Closing handoff |

### New files (outside repo — cloud knowledge base)

| Path | Created in task |
|------|-----------------|
| `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\00-index.md` | Task 0a |
| `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\01-cache-economics.md` | Task 0a (agent 1) |
| `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\02-mcp-scoping.md` | Task 0a (agent 2) |
| `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\03-plugin-hygiene.md` | Task 0a (agent 3) |
| `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\04-subagent-delegation.md` | Task 0a (agent 4) |
| `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\05-auto-memory.md` | Task 0a (agent 5) |
| `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\06-strategic-compact.md` | Task 0a (agent 6) |

### New files (outside repo — cloud config snapshot)

| Path | Created in task |
|------|-----------------|
| `C:\Users\otalo\Yesito\cloud\claude-config\README.md` | Task 8 |
| `C:\Users\otalo\Yesito\cloud\claude-config\snapshot.ps1` | Task 8 |
| `C:\Users\otalo\Yesito\cloud\claude-config\user\<timestamp>\*` | Task 8 |
| `C:\Users\otalo\Yesito\cloud\claude-config\projects\yesid.dev\<timestamp>\*` | Task 8 |

### New files (outside repo — global Claude skill)

| Path | Created in task |
|------|-----------------|
| `~/.claude/skills/token-frugal-workflow/SKILL.md` | Task 7 |

### Modified files (repo)

| Path | Modified in task | Change |
|------|------------------|--------|
| `CLAUDE.md` | Task 2 | Slim: remove Completed Slices, Tool Selection Protocol, Plugins & Tools, repo-structure detail |
| `docs/reference/WORKFLOW.md` | Task 3 | Compress stabilized sections |
| `docs/slices/slice-17-checkpoint.md` | Task 9 | Mark 17j complete |
| `docs/roadmap/standardization.md` | Task 9 | Mark 17j complete |
| `tree.txt` | Task 9 | Regenerate |

### Removed from repo (mirrored to cloud in Task 1 first)

- `docs/devlog/*` (all except this slice's devlogs)
- `docs/handoffs/*` (all; keep `_TEMPLATE.md`)
- `docs/slices/slice-0*.md`, `slice-17a-*.md`, `slice-17d-*.md`, `slice-17e-*.md`, `slice-17h-*.md` (completed sub-slices; keep checkpoint + this spec + template)
- `docs/specs/*` (all historical design specs)
- `docs/plans/*` (all historical implementation plans)
- `docs/research/*` (all one-off research)
- `docs/archive/*` (entire archive folder)

### Modified outside repo (global Claude — documented in handoff)

- `~/.claude/rules/zh/` → deleted entirely (Task 5)
- `~/.claude/plugins/` → audited + pruned (Task 5)
- `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/` → consolidated (Task 5)

---

## Task 0: Baseline measurement

**Goal:** Capture cold-session token count + inventory raw sizes before any changes. This is the before-snapshot.

### Files
- Create: `docs/devlog/2026-04-17-slice-17j-task-0.md`

### Steps

- [ ] **Step 1: Start a fresh Claude Code session**

Close the current session. Open a new Claude Code session in `C:\Users\otalo\Yesito\Projects\yesid.dev` on branch `feature/slice-17j-token-efficacy`. Verify the branch is correct:

```bash
git branch --show-current
```

Expected output: `feature/slice-17j-token-efficacy`

- [ ] **Step 2: Run /context-budget as the first command**

Before any other tool call, run:

```
/context-budget
```

Expected: a structured report with at least these sections: system prompt tokens, CLAUDE.md tokens, memory tokens, skills-list tokens, MCP tool-schemas tokens, total tokens, working context remaining.

Copy the entire output verbatim — you'll paste it into the devlog in Step 5.

- [ ] **Step 3: Inventory repo docs sizes**

Run in parallel (one Bash call each):

```bash
# Doc subtree sizes
wc -l docs/devlog/*.md 2>/dev/null | tail -1
wc -l docs/handoffs/*.md 2>/dev/null | tail -1
wc -l docs/specs/*.md 2>/dev/null | tail -1
wc -l docs/plans/*.md 2>/dev/null | tail -1
wc -l docs/slices/*.md 2>/dev/null | tail -1
wc -l docs/research/**/*.md 2>/dev/null | tail -1
wc -l docs/archive/**/*.md 2>/dev/null | tail -1
wc -l docs/reference/*.md 2>/dev/null | tail -1
wc -l docs/learn/**/*.md 2>/dev/null | tail -1
wc -l docs/roadmap/*.md 2>/dev/null | tail -1
```

```bash
# Single-file sizes
wc -l CLAUDE.md
wc -l docs/reference/WORKFLOW.md
```

```bash
# Directory byte sizes
du -sh docs/devlog docs/handoffs docs/specs docs/plans docs/slices docs/research docs/archive docs/reference docs/learn docs/roadmap
```

Record numbers in a scratch list.

- [ ] **Step 4: Inventory global Claude sizes**

```bash
# Rules
wc -l ~/.claude/rules/common/*.md 2>/dev/null | tail -1
wc -l ~/.claude/rules/zh/*.md 2>/dev/null | tail -1
du -sh ~/.claude/rules/common ~/.claude/rules/zh
```

```bash
# Plugin count
ls ~/.claude/plugins/ 2>/dev/null | wc -l
```

```bash
# Memory
ls ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/ | wc -l
du -sh ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/
ls ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/ | grep -c "project_slice_"
```

Record numbers in the scratch list.

- [ ] **Step 5: Write the baseline devlog**

Create `docs/devlog/2026-04-17-slice-17j-task-0.md` with this structure:

```markdown
# Slice 17j — Task 0 Baseline

**Date:** 2026-04-17
**Task:** 0 (baseline measurement)
**Branch:** feature/slice-17j-token-efficacy
**Commit:** <current HEAD SHA>

## /context-budget output (cold session, pre-change)

<paste full output from Step 2 here, unedited, inside a code block>

## Repo docs inventory

| Subtree | Line count | Byte size |
|---------|-----------:|----------:|
| docs/devlog | N | N KB |
| docs/handoffs | N | N KB |
| docs/specs | N | N KB |
| docs/plans | N | N KB |
| docs/slices | N | N KB |
| docs/research | N | N KB |
| docs/archive | N | N KB |
| docs/reference | N | N KB |
| docs/learn | N | N KB |
| docs/roadmap | N | N KB |
| **CLAUDE.md** | N | N KB |
| **WORKFLOW.md** | N | N KB |

## Global Claude inventory

| Source | Count | Size |
|--------|------:|-----:|
| ~/.claude/rules/common | N files | N KB |
| ~/.claude/rules/zh | N files | N KB |
| ~/.claude/plugins | N bundles | — |
| auto-memory total | N files | N KB |
| auto-memory slice-status | N files | — |

## Observations

<any pattern worth noting — which source looks heaviest, any surprises>
```

Fill in every `N` with the actual numbers from Steps 2–4.

- [ ] **Step 6: Commit the baseline devlog**

```bash
git add docs/devlog/2026-04-17-slice-17j-task-0.md
git commit -m "docs(slice-17j): Task 0 baseline measurement"
```

**STOP. Ask Yesid to confirm the baseline looks right before executing any changes.**

---

## Task 0a: Research sprint — parallel deep dives

**Goal:** Dispatch 6 subagents in parallel; each writes one 500–1000 word deep-dive doc directly to the cloud knowledge base and returns a 200-word summary. Main context stays clean.

### Files
- Create dir: `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\`
- Create: `00-index.md` + 6 area docs

### Steps

- [ ] **Step 1: Create the cloud knowledge base directory**

```bash
mkdir -p "/c/Users/otalo/Yesito/cloud/claude-knowledge/token-efficacy"
```

Verify:

```bash
ls -la "/c/Users/otalo/Yesito/cloud/claude-knowledge/"
```

Expected: `token-efficacy/` directory exists.

- [ ] **Step 2: Dispatch 6 parallel subagents in a single message**

Send a single message with 6 `Agent` tool calls, all `subagent_type: "general-purpose"`, `run_in_background: false`. Use the identical structural prompt below, substituting the area-specific content for each agent.

**Shared prompt scaffold for every agent:**

```
You are a research subagent producing a 500–1000 word deep-dive doc for a reusable Claude Code knowledge base. Write your full doc DIRECTLY to the file path given below using the Write tool. Return only a 200-word executive summary to the main session.

OUTPUT FILE (exact path — write with the Write tool, not Edit):
<file path per agent>

REQUIRED SECTIONS (every section non-empty, in this order):

# <Area title>

## Current state (2026)
What is the state of this area as of 2026? What changed recently?

## Best practices
The established patterns and recommendations.

## Actionable for yesid.dev
Concrete recommendations for a SvelteKit 2 / Svelte 5 / Bun / Vercel project with an accretion problem across 20+ slices. Be specific: "do X in CLAUDE.md", "add Y to .mcp.json", etc.

## Cross-project reusable patterns
Patterns that should codify into a portable skill, independent of yesid.dev.

## Sources
Full URLs + titles + publication dates. Prioritize 2025–2026 material. Flag and EXCLUDE anything older than 2025 unless it's an Anthropic primary doc (anthropic.com, docs.claude.com, github.com/anthropics).

HARD RULES:
- 500–1000 words total.
- Every section must have content. If a section would be empty, flag it in the return summary.
- Use web search / fetch / docs-lookup liberally — this is research.
- Write the file with the Write tool in ONE call (not multiple appends).
- Return only a 200-word executive summary to the main session — do NOT paste the full doc back.

AREA FOR THIS AGENT:
<area-specific content>
```

**Six area-specific inserts:**

**Agent 1 — Cache economics**
- **File path:** `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\01-cache-economics.md`
- **Area content:**

```
Research Claude 4.7 prompt-cache economics:
- 5-minute cache TTL — why it matters for session pacing.
- Session-start context loading and how it interacts with the cache.
- Cache-hit cost savings (ratio vs. cache miss).
- 1M-context window + cache patterns — when the larger window helps vs when it pays cache penalty.
- Cache-prefix patterns (stable system prompt + stable CLAUDE.md = high cache hit rate).
- How background agents / subagent dispatches affect cache.
- Anti-patterns: splitting sleeps at 300s, frequent file rewrites that bust cache.
```

**Agent 2 — MCP scoping**
- **File path:** `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\02-mcp-scoping.md`
- **Area content:**

```
Research Claude Code MCP scoping mechanics:
- `.mcp.json` syntax and allowed fields.
- `enabledMcpjsonServers` / `disabledMcpjsonServers` in settings files.
- Scope hierarchy: project (`.mcp.json`, `.claude/settings.json`) vs user (`~/.claude/settings.json`) vs local (`.claude/settings.local.json`).
- Deferred-tool pattern — the session-start `<system-reminder>` that lists tool names without schemas, with schemas fetched on demand via ToolSearch. How this interacts with MCP tool schemas.
- How each connected MCP server contributes to startup token count.
- Patterns for project-scoped MCP allowlists.
- What breaks if an MCP is disabled mid-session.
```

**Agent 3 — Plugin hygiene**
- **File path:** `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\03-plugin-hygiene.md`
- **Area content:**

```
Research Claude Code plugin/skill bloat management:
- How plugins and skills contribute to the session-start system reminder.
- Skill `description` field patterns — how to write descriptions that minimize unwanted activation ("Use when..." vs "Use for...").
- Per-project plugin scoping (if supported — confirm current state in 2026).
- Audit tooling: how power-users detect unused plugins/skills.
- Marketplace plugins (`everything-claude-code`, etc.) vs individually-installed — duplication patterns.
- Cost of an always-active skill that never triggers.
- Safe uninstall process (what breaks if you remove a bundle mid-project).
```

**Agent 4 — Subagent delegation for context isolation**
- **File path:** `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\04-subagent-delegation.md`
- **Area content:**

```
Research Claude Code Agent tool patterns for context isolation:
- When to dispatch a subagent vs do work in the main session.
- How a subagent's context differs from main (fresh system prompt, tool results stay in agent's context, only final message returns).
- Summary-only return patterns — how to prompt for concise returns.
- Parallel vs sequential dispatch — when each is appropriate.
- Foreground vs background (`run_in_background`) — when to use each.
- Worktree isolation (`isolation: "worktree"`) — when it pays off.
- Specialized vs general-purpose agents — tradeoffs.
- Cost tradeoff: subagent invocation overhead vs main-context savings.
- Anti-pattern: over-delegating trivial work that would be cheaper inline.
```

**Agent 5 — Auto-memory best practices**
- **File path:** `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\05-auto-memory.md`
- **Area content:**

```
Research Claude Code auto-memory patterns:
- File-based memory in `~/.claude/projects/<project-hash>/memory/`.
- What Anthropic recommends saving vs not saving (per the memory-type taxonomy: user, feedback, project, reference).
- MEMORY.md index hygiene (the 200-line truncation; entry limits).
- Lifecycle: when to save, when to consolidate, when to prune.
- Pattern: per-slice status files accreting over time; consolidation into `project_completed_slices.md`.
- Staleness detection: facts that were true 6 months ago but no longer are.
- Verification-before-recommendation rule (memory states a claim at write time, not now).
```

**Agent 6 — Strategic compact + plan-mode economics**
- **File path:** `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\06-strategic-compact.md`
- **Area content:**

```
Research Claude Code compaction + plan-mode economics:
- Auto-compaction (system-driven) vs strategic-compact (user-triggered).
- When to compact (working-context ratio, approaching 20% of budget remaining).
- Cache-breakage: compaction rewrites the context, busting the cache — cost implications.
- Plan mode vs execution mode — what each preserves across tool calls.
- Measuring working-context vs startup-context ratio — the `/context-budget` output interpretation.
- Anti-pattern: compacting mid-task (loses tool-result context that task needed).
- Anti-pattern: staying in one session past context sweet spot when a fresh session would be cheaper.
```

Dispatch all 6 in a single message. Wait for all 6 to complete.

- [ ] **Step 3: Review the 6 summaries**

Each agent returns a 200-word summary. Read each:

- Does the file exist at the expected path? (Spot-check with `ls` if unsure.)
- Does the summary mention every required section (Current state / Best practices / Actionable / Cross-project / Sources)?
- Does the summary flag any issues (empty sections, source-age violations)?

If any summary flags a section-gap or source-age issue: re-dispatch ONLY that agent with a tightened prompt (e.g., "your previous attempt had no Cross-project section — redo"). Repeat until all 6 pass.

- [ ] **Step 4: Spot-check one full doc**

Pick the `02-mcp-scoping.md` (it's the most decision-impactful for Task 4). Read it end-to-end via Read tool. Verify it has all 5 required sections, word count is 500–1000, sources are 2025–2026.

If wrong: re-dispatch agent 2 only.

- [ ] **Step 5: Write the index**

Create `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\00-index.md`:

```markdown
# Token Efficacy — Research Index

**Created:** 2026-04-17
**Source slice:** yesid.dev / slice 17j
**Review cadence:** every 2 slices, or after major Claude release

## Deep dives

- **[01-cache-economics.md](./01-cache-economics.md)** — 5-min cache TTL, session-start overhead, 1M-context patterns. `last-reviewed: 2026-04-17`
- **[02-mcp-scoping.md](./02-mcp-scoping.md)** — `.mcp.json`, scope hierarchy, deferred-tool pattern, allowlist patterns. `last-reviewed: 2026-04-17`
- **[03-plugin-hygiene.md](./03-plugin-hygiene.md)** — skill description patterns, per-project scoping, audit tooling. `last-reviewed: 2026-04-17`
- **[04-subagent-delegation.md](./04-subagent-delegation.md)** — context isolation, parallel vs sequential, summary-only returns. `last-reviewed: 2026-04-17`
- **[05-auto-memory.md](./05-auto-memory.md)** — memory-type taxonomy, lifecycle, staleness, verification-before-recommendation. `last-reviewed: 2026-04-17`
- **[06-strategic-compact.md](./06-strategic-compact.md)** — compaction timing, cache-breakage, plan-mode economics. `last-reviewed: 2026-04-17`

## How to use this knowledge base

- Reference material, not loaded into any session by default.
- Consulted by the `token-frugal-workflow` skill when it activates.
- Update `last-reviewed` dates on any revisit. If Claude behavior has changed materially since the last review, flag a rewrite at the top of the affected doc.
```

Write with the Write tool.

- [ ] **Step 6: Flag decision-changing findings in devlog**

Append to `docs/devlog/2026-04-17-slice-17j-task-0.md` (yes, same file — continuation):

```markdown

---

## Task 0a — Research sprint summary

**Date:** 2026-04-17
**Dispatch:** 6 parallel general-purpose subagents.

### Findings that change downstream tasks

- **Task 4 (.mcp.json):** <brief note on what research 02 tells us about the correct scoping mechanism — the key 2026 pattern to apply>
- **Task 5 (global cleanup):** <brief note on what research 03 + 05 say about plugin audit approach + memory consolidation>
- **Task 7 (skill):** <brief note on which patterns from all 6 should codify into the skill — 3–5 bullets>

### Summaries (200 words each)

<paste the 6 returned summaries here, one per subsection, headed by area name>
```

- [ ] **Step 7: Commit the research devlog addition**

```bash
git add docs/devlog/2026-04-17-slice-17j-task-0.md
git commit -m "docs(slice-17j): Task 0a research sprint summaries + findings"
```

> The knowledge-base files themselves live in cloud, not git — no need to add them.

**STOP. Ask Yesid to review the 6 docs + index at `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` before proceeding to Task 1.**

---

## Task 1: `docs/` prune → mirror to cloud

**Goal:** Mirror historical docs to the cloud, remove from repo, fix cross-links, create `docs/ARCHIVE.md` stub.

### Files
- Mirror target: `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\`
- Create: `docs/ARCHIVE.md`
- Delete: see "Removed from repo" in spec
- Edit: any file in `docs/reference/**` or `docs/learn/**` that cross-links into deleted paths

### Steps

- [ ] **Step 1: Mirror docs/ to cloud**

```bash
robocopy "C:\Users\otalo\Yesito\Projects\yesid.dev\docs" "C:\Users\otalo\Yesito\cloud\yesid.dev\docs" /E /XD .git /R:1 /W:1
```

Note: `robocopy` returns non-zero exit codes even on success (0 = no files copied, 1 = files copied successfully, 2 = extra files). Exit codes < 8 are success.

- [ ] **Step 2: Verify mirror**

```bash
ls "/c/Users/otalo/Yesito/cloud/yesid.dev/docs/"
```

Expected: subdirectories `devlog/`, `handoffs/`, `specs/`, `plans/`, `slices/`, `research/`, `archive/`, `reference/`, `learn/`, `roadmap/` all present.

Spot-check a devlog recovered from the mirror:

```bash
head -20 "/c/Users/otalo/Yesito/cloud/yesid.dev/docs/devlog/$(ls /c/Users/otalo/Yesito/cloud/yesid.dev/docs/devlog/ | head -1)"
```

Expected: opens cleanly, has real content.

- [ ] **Step 3: Cross-link scrub (dry run)**

Run the Grep tool to find cross-links into about-to-be-removed paths:

```
Grep pattern: "docs/(devlog|handoffs|specs|plans|research|archive)/|slice-[0-9]"
path: docs/reference
output_mode: content
-n: true
```

```
Grep pattern: "docs/(devlog|handoffs|specs|plans|research|archive)/|slice-[0-9]"
path: docs/learn
output_mode: content
-n: true
```

Copy all hits to a scratch list. For each hit, decide: REWRITE (to cloud path) or EXCISE (remove link entirely).

- [ ] **Step 4: Record cross-link decisions in devlog**

Append to `docs/devlog/2026-04-17-slice-17j-task-0.md`:

```markdown

---

## Task 1 — Cross-link scrub decisions

| File:Line | Current link | Decision | New link (if rewrite) |
|-----------|--------------|----------|-----------------------|
| docs/reference/X.md:LN | ../devlog/Y.md | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\devlog\Y.md` |
| docs/learn/Z.md:LN | slice-09.md | EXCISE | — |
| ... | ... | ... | ... |
```

- [ ] **Step 5: Apply cross-link fixes**

For each REWRITE: use Edit tool on the target file, replace the old link with the cloud path.

For each EXCISE: use Edit tool to remove the link (convert `[text](link)` → `text` or delete the surrounding sentence if the link was essential).

- [ ] **Step 6: Remove historical docs from repo**

Run deletions via Bash (one command to keep atomic):

```bash
rm docs/devlog/2026-*-slice-*.md 2>/dev/null || true
# Keep only Task 0 devlog from THIS slice
find docs/devlog -maxdepth 1 -name "*.md" ! -name "_TEMPLATE.md" ! -name "2026-04-17-slice-17j-task-0.md" -delete

# Handoffs — keep template only
find docs/handoffs -maxdepth 1 -name "*.md" ! -name "_TEMPLATE.md" -delete

# Specs — delete all (template is under slices/)
rm -rf docs/specs/*.md 2>/dev/null || true

# Plans — keep only this slice's plan
find docs/plans -maxdepth 1 -name "*.md" ! -name "2026-04-17-slice-17j-token-efficacy.md" -delete

# Research — delete all
rm -rf docs/research 2>/dev/null || true

# Archive — delete all
rm -rf docs/archive 2>/dev/null || true

# Slices — keep template, checkpoint, this slice, and NOT completed sub-slices
cd docs/slices
find . -maxdepth 1 -name "slice-0*.md" -delete
find . -maxdepth 1 -name "slice-17a-*.md" -delete
find . -maxdepth 1 -name "slice-17d-*.md" -delete
find . -maxdepth 1 -name "slice-17e-*.md" -delete
find . -maxdepth 1 -name "slice-17h-*.md" -delete
find . -maxdepth 1 -name "slice-09*.md" -delete
find . -maxdepth 1 -name "slice-10*.md" -delete
find . -maxdepth 1 -name "slice-11*.md" -delete
find . -maxdepth 1 -name "slice-12*.md" -delete
find . -maxdepth 1 -name "slice-13*.md" -delete
find . -maxdepth 1 -name "slice-A*.md" -delete
find . -maxdepth 1 -name "slice-B*.md" -delete
find . -maxdepth 1 -name "slice-C*.md" -delete
cd ../..
```

After this: `ls docs/slices/` should show only `_TEMPLATE.md`, `slice-17-checkpoint.md`, `slice-17j-token-efficacy.md`.

Verify:

```bash
ls docs/slices/
ls docs/devlog/
ls docs/handoffs/
ls docs/specs/ 2>/dev/null
ls docs/plans/
ls docs/research/ 2>/dev/null || echo "removed OK"
ls docs/archive/ 2>/dev/null || echo "removed OK"
```

Expected:
- `docs/slices/`: `_TEMPLATE.md`, `slice-17-checkpoint.md`, `slice-17j-token-efficacy.md`
- `docs/devlog/`: `_TEMPLATE.md`, `2026-04-17-slice-17j-task-0.md`
- `docs/handoffs/`: `_TEMPLATE.md`
- `docs/specs/`: empty or absent
- `docs/plans/`: `2026-04-17-slice-17j-token-efficacy.md`
- `docs/research/`: removed
- `docs/archive/`: removed

- [ ] **Step 7: Write `docs/ARCHIVE.md`**

Create `docs/ARCHIVE.md`:

```markdown
# docs/ Archive

**Status:** active — historical docs live outside this repo as of slice 17j (2026-04-17).

## What moved

The following were mirrored to `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` and removed from this repo:

- `docs/devlog/*` — all per-slice devlogs
- `docs/handoffs/*` — all closing handoffs
- `docs/specs/*` — all design specs
- `docs/plans/*` — all historical implementation plans
- `docs/research/*` — all one-off competitive / research docs
- `docs/archive/*` — pre-existing archive folder
- `docs/slices/slice-0*.md`, `slice-17a-*.md`, `slice-17d-*.md`, `slice-17e-*.md`, `slice-17h-*.md`, and completed pre-17 slice specs

## What stayed

- `docs/reference/**` — live reference docs (ARCHITECTURE, CSS, MOTION, TESTS, PATTERNS, CONSTITUTION, WORKFLOW)
- `docs/learn/**` — durable learning knowledge base
- `docs/roadmap/**` — active roadmap
- `docs/slices/_TEMPLATE.md`, `docs/slices/slice-17-checkpoint.md`, and the active slice spec
- `docs/devlog/_TEMPLATE.md`, `docs/handoffs/_TEMPLATE.md`
- The active slice's devlog, plan, and handoff (if/when they exist in-repo during the slice)

## How to recover

**From cloud mirror:**
```
cp "C:\Users\otalo\Yesito\cloud\yesid.dev\docs\devlog\<filename>.md" docs/devlog/
```

**From git history (always available):**
```bash
git log --all -- docs/devlog/<filename>.md
git show <commit>:docs/devlog/<filename>.md > /tmp/recovered.md
```

**Ongoing discipline:** at each slice close, mirror the slice's devlog + plan + spec + handoff to the cloud and remove from repo. Reference + learn stay in repo.
```

Write with Write tool.

- [ ] **Step 8: Run tests + typecheck**

```bash
bun run test
```

Expected: all tests pass. No test should depend on removed docs. If any test fails, it's likely a test that imported a path that no longer exists — investigate before proceeding.

```bash
bun run check
```

Expected: no type errors. Docs removal doesn't affect TypeScript.

- [ ] **Step 9: Regenerate tree.txt**

```bash
cmd /c "tree /F /A | findstr /V /C:\"node_modules\" /C:\".git\" /C:\".remember\" /C:\"bun.lockb\" /C:\".svelte-kit\" /C:\".vercel\" /C:\".DS_Store\" > tree.txt"
```

- [ ] **Step 10: Commit Task 1**

```bash
git add docs/ tree.txt
git commit -m "feat(slice-17j): Task 1 — prune docs/, mirror to cloud, create ARCHIVE.md stub"
```

**STOP. Ask Yesid to verify cloud mirror contents + spot-check a recovered file from git before continuing.**

---

## Task 2: `CLAUDE.md` slim

**Goal:** Remove sections that duplicate content now living elsewhere. Keep load-bearing governance.

### Files
- Modify: `CLAUDE.md`

### Steps

- [ ] **Step 1: Read current CLAUDE.md**

```
Read: CLAUDE.md (full file)
```

- [ ] **Step 2: Identify removable sections**

Remove outright:
- `## Completed Slices` (→ git log is truth)
- `## Tool Selection Protocol` (→ duplicates `WORKFLOW.md §21`)
- `## Plugins & Tools` (→ belongs in `WORKFLOW.md`)
- `## Repo Structure` detail paragraph (→ `tree.txt` is truth; keep a 2-line pointer)

Keep and possibly tighten:
- Project header (name, owner, brand essentials)
- Runtime section (Bun only)
- Workflow / Session types / Hard rules
- Slice System
- Iteration Protocol
- Git & PR Workflow
- Session Checkpoint
- Slice Closing (short form)
- Testing (short form)
- Code Standards
- CSS Architecture (summary; CSS.md is truth)
- Brand (Non-Negotiable)
- Never-list

- [ ] **Step 3: Apply removals via Edit**

Use Edit tool for each section removal. For each, use a unique anchor like the section header + first line of the section to ensure uniqueness.

For the Repo Structure section, replace the detail paragraph with:

```markdown
## Repo Structure

See `tree.txt` for the full tree. Deep paths documented in `docs/reference/ARCHITECTURE.md`.
```

For where removed sections lived, add a short pointer so cold-session Claude knows where to look:

- After removing `Tool Selection Protocol`, add to the Plugins & Tools area (if kept) or WORKFLOW reference: "Tool phase-map in `docs/reference/WORKFLOW.md` §21."
- Remove `Plugins & Tools` entirely (it's now in WORKFLOW.md).
- Remove `Completed Slices` entirely and replace with: "Slice history: `git log --oneline`."

- [ ] **Step 4: Cold-session self-sufficiency test**

Save the file. Start a fresh Claude Code session (close current, open new). In the new session, ask the first thing:

```
Give me a one-paragraph summary of this project, plus the three hard rules.
```

Expected: Claude can answer both. The project summary mentions freelance digital infrastructure / yesid.dev / SvelteKit+Bun+dark theme. The three hard rules include: never advance without approval, sub-slices may need multiple sessions, parallel agents require approval.

If Claude can't produce this from the slimmed CLAUDE.md alone, the slim went too far — restore specific sections (e.g., if hard rules got cut, restore them) and re-test.

- [ ] **Step 5: Measure delta (optional mid-slice check)**

```
/context-budget
```

Record project-CLAUDE.md token count. Compare to baseline from Task 0. Note delta in scratch.

- [ ] **Step 6: Commit Task 2**

Back in the working session (or continue in the fresh session):

```bash
git add CLAUDE.md
git commit -m "refactor(slice-17j): Task 2 — slim CLAUDE.md (remove duplicative sections)"
```

**STOP. Ask Yesid to do his own cold-session self-sufficiency test before continuing.**

---

## Task 3: `WORKFLOW.md` slim

**Goal:** Compress sections that stabilized after slice 17 thrash. Preserve load-bearing operational content.

### Files
- Modify: `docs/reference/WORKFLOW.md`

### Steps

- [ ] **Step 1: Read current WORKFLOW.md**

```
Read: docs/reference/WORKFLOW.md (full file)
```

- [ ] **Step 2: Identify compressible sections**

Look for:
- Sections that repeat content covered in CLAUDE.md (iteration protocol, hard rules).
- Verbose examples that expanded during 17-era thrash but are now stable (collapse to summary + one example).
- Multi-paragraph prose that could be tables.

**Do NOT compress:**
- Phase → tool map (Section 21) — load-bearing reference.
- Quality gates — operational checklist.
- Closing checklist — operational checklist.
- Plugin-to-phase map — referenced by CLAUDE.md.

- [ ] **Step 3: Apply compressions via Edit**

Compress in place — don't remove sections wholesale. Rule of thumb: if a paragraph has 5 sentences and 3 say the same thing, cut to 2 sentences. If a section has 4 examples and 1 is representative, keep 1 + note "similar pattern for X, Y, Z."

- [ ] **Step 4: Spot-check at both ends**

```
Read: docs/reference/WORKFLOW.md (first 100 lines)
Read: docs/reference/WORKFLOW.md (last 100 lines)
```

Verify structure intact — no accidental section deletion, no dangling cross-reference to a section you removed.

- [ ] **Step 5: Measure delta**

```bash
wc -l docs/reference/WORKFLOW.md
```

Compare to baseline from Task 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add docs/reference/WORKFLOW.md
git commit -m "refactor(slice-17j): Task 3 — compress WORKFLOW.md stabilized sections"
```

**STOP. Ask Yesid to skim the new WORKFLOW.md end-to-end before continuing.**

---

## Task 4: `.mcp.json` per-project MCP scoping

**Goal:** Create a project-scoped MCP allowlist so only the Keep list's tool schemas load on yesid.dev sessions.

> **Apply findings from `02-mcp-scoping.md`** (Task 0a) — specifically the recommended scope mechanism and any 2026 best-practice patterns discovered. If research shows the correct file is `.claude/settings.json` `enabledMcpjsonServers` rather than `.mcp.json`, use whichever is confirmed correct by research.

### Files
- Create: `.mcp.json` (or `.claude/settings.json` per research)

### Steps

- [ ] **Step 1: Confirm the correct mechanism from research**

```
Read: C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\02-mcp-scoping.md
```

Pull the "Actionable for yesid.dev" section. That tells you exactly which file(s) to create/modify and what syntax.

- [ ] **Step 2: Inventory currently-connected MCP servers**

Look at the most recent session-start `<system-reminder>` that enumerates deferred tools, OR ask via:

```bash
cat ~/.claude/settings.json 2>/dev/null | head -100
cat ~/.claude/.claude.json 2>/dev/null | head -100
ls ~/.claude/plugins/ 2>/dev/null
```

Also look at the session-start reminder content from THIS session for the full enumerated MCP list.

- [ ] **Step 3: Define Keep list**

**Keep for yesid.dev:**
- Svelte MCP (`@svelte`, `svelte-autofixer`, etc.)
- GSAP Master MCP
- Context7 MCP
- Chrome DevTools MCP (or firefox-devtools — whichever is the current install)
- Claude Preview MCP
- GitHub MCP
- Vercel MCP
- Figma MCP (occasional)
- Playwright MCP (occasional)

**Disable for yesid.dev:**
- webflow, cloudflare, railway, neon, postman, notion, videodb, jobs, tax, calendar (`b5e30407-...`)
- shadcn (React-focused, yesid.dev is Svelte)
- mcp-registry
- Any duplicated bundles (chrome-devtools-mcp AND firefox-devtools — keep one)

- [ ] **Step 4: Author the scope config**

Per the mechanism confirmed in Step 1, write the config. If `.mcp.json` is the mechanism:

```json
{
  "$schema": "https://claude.com/schemas/mcp-v1.json",
  "mcpServers": {
    "svelte": { "enabled": true },
    "gsap-master": { "enabled": true },
    "context7": { "enabled": true },
    "chrome-devtools": { "enabled": true },
    "claude-preview": { "enabled": true },
    "github": { "enabled": true },
    "vercel": { "enabled": true },
    "figma": { "enabled": true },
    "playwright": { "enabled": true }
  }
}
```

> **Caveat:** The exact schema depends on what research 02 confirms. Use whatever `02-mcp-scoping.md` says is the 2026 best-practice format. The above is a placeholder shape — substitute real field names from research.

If `.claude/settings.json` with `enabledMcpjsonServers`:

```json
{
  "enabledMcpjsonServers": ["svelte", "gsap-master", "context7", "chrome-devtools", "claude-preview", "github", "vercel", "figma", "playwright"]
}
```

Write with Write tool.

- [ ] **Step 5: Verify in a fresh session**

Close current session, open new session on the branch. Check the session-start `<system-reminder>` — confirm only Keep-list MCPs appear. No `firefox-devtools__*`, `webflow__*`, `cloudflare__*`, `railway__*`, `neon__*`, `postman__*`, `notion__*`, `videodb__*`, `jobs__*`, `tax__*`, `calendar__*`, `shadcn__*`.

Run `/context-budget`. Record MCP tool-schema token count — should be meaningfully lower than baseline.

- [ ] **Step 6: Commit Task 4**

```bash
git add .mcp.json .claude/settings.json 2>/dev/null
git commit -m "feat(slice-17j): Task 4 — project-scoped MCP allowlist (.mcp.json)"
```

**STOP. Ask Yesid to confirm no needed MCP is accidentally disabled before continuing.** If Svelte MCP or GSAP Master suddenly doesn't respond to a test prompt, re-enable it.

---

## Task 5: Global Claude config cleanup (non-repo)

**Goal:** Delete `~/.claude/rules/zh/`, audit + prune plugins, consolidate auto-memory.

> **Apply findings from `03-plugin-hygiene.md` and `05-auto-memory.md`** (Task 0a) for audit approach and consolidation patterns.

### Files
- No repo changes. All documented in devlog.

### Steps

- [ ] **Step 1: Delete `~/.claude/rules/zh/`**

First verify it exists and confirm size one more time:

```bash
ls ~/.claude/rules/zh/ | wc -l
du -sh ~/.claude/rules/zh/
```

Delete:

```bash
rm -rf ~/.claude/rules/zh/
```

Verify:

```bash
ls ~/.claude/rules/
```

Expected: `common/` present, `zh/` absent.

Verify common/ is untouched:

```bash
ls ~/.claude/rules/common/ | wc -l
```

Expected: same count as recorded in Task 0 baseline.

- [ ] **Step 2: Plugin audit — list**

```bash
ls ~/.claude/plugins/
```

Produce a single list. From research 03's "Actionable for yesid.dev," cross-reference with known-unused bundles.

**Likely remove list (validate each before uninstalling):**
- `everything-claude-code` (duplicates individual skills from superpowers + others)
- Unused bundles: `design-ops`, `brand-voice`, `agent-sdk-dev`, `codex`, `web-designer`, `frontend-design-pro`, `enterprise-search`, `marketing`, `operations`, `finance`, `data`, `product-management`, `engineering`, `mcp-server-dev`, `ai-plugins`, `vercel` (if not actively used), `microsoft-docs`, `claude-code-setup`, `claude-md-management`, `cowork-plugin-management`, `design-research`, `design-systems`, `designer-toolkit`, `interaction-design`, `playground`, `productivity`, `prototyping-testing`, `remember`, `skill-creator`, `ui-design`, `ux-strategy`, `chrome-devtools-mcp` (if already supplied by main Claude Code install)

**Likely keep list:**
- `superpowers` (brainstorming, executing-plans, writing-plans, verification-before-completion — core)
- `commit-commands` (commit/push/PR helpers)
- `code-review` (useful for PR reviews)

Record the full keep/remove list in a scratch area before uninstalling.

- [ ] **Step 3: Record audit in devlog**

Append to `docs/devlog/2026-04-17-slice-17j-task-0.md`:

```markdown

---

## Task 5 — Plugin audit

### Keep
- superpowers
- commit-commands
- code-review
- <any others confirmed in Step 2>

### Remove
- everything-claude-code
- <full list from Step 2>

### Reasoning
<1–2 sentences per removed bundle: why unused>
```

- [ ] **Step 4: Uninstall plugins**

Use the Claude Code plugin uninstall mechanism per research 03. If it's `/plugin remove <name>`:

```
/plugin remove everything-claude-code
/plugin remove design-ops
/plugin remove brand-voice
<... repeat for each>
```

If it's a settings file edit, edit `~/.claude/settings.json` (or the plugins config file) to remove them.

> **Safety caveat:** Remove ONE plugin, start a fresh session, confirm nothing broke, then continue. Don't remove 20 at once — you'll lose track of which one broke something.

Batch process: remove 3–5 at a time, fresh session between batches.

- [ ] **Step 5: Auto-memory hygiene — identify**

```bash
ls ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/ | grep "project_slice_"
```

List of slice-status memory files. Typically:
- `project_slice_06d_iteration2.md`
- `project_slice_07_status.md`
- `project_slice_08_status.md`
- `project_slice_09_status.md`
- `project_slice_09c1_status.md`
- `project_slice_09b_status.md`
- `project_slice_11b_status.md`
- `project_slice_12_status.md`
- `project_slice_13*_status.md`
- `project_slice_17a*_status.md`
- `project_slice_17d*_status.md` or similar
- `project_slice_17h_*` (from 17h work)

- [ ] **Step 6: Auto-memory hygiene — consolidate**

Read each slice-status memory file. Extract one line per slice:

```
- **NN** — Slice name — merged YYYY-MM-DD — durable takeaway (1 sentence, if any)
```

Write consolidated `project_completed_slices.md` at `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/project_completed_slices.md`:

```markdown
---
name: Completed Slices (yesid.dev)
description: One-line summary of every shipped slice. Detail in git log + docs/handoffs/ (or cloud mirror). Consolidated 2026-04-17.
type: project
---

# Completed Slices

## Pre-standardization (slices 00–16)
- **01** — [name] — merged YYYY-MM-DD
- **02** — [name] — merged YYYY-MM-DD
- ... (one line each)

## Standardization (slice 17)
- **17a-1** — Token Foundation — merged YYYY-MM-DD — PR #2
- **17a-2a** — Primitives build — merged YYYY-MM-DD
- **17a-2b** — Primitives wire-up — merged YYYY-MM-DD
- **17a-4** — Dead code + dedup fresh audit — merged YYYY-MM-DD — PR #20
- **17d** — Component API standardization — merged YYYY-MM-DD — PR #10
- **17e** — Motion re-engineering (full) — merged YYYY-MM-DD — PR #19
- **17h** — Brand bundle (narrative + assets + governance) — merged 2026-04-17 — PR #22
- **17j** — Token efficacy — merged YYYY-MM-DD — PR #<TBD>

(Complete from existing per-slice memory files.)
```

- [ ] **Step 7: Auto-memory hygiene — delete individual files**

```bash
rm ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/project_slice_*_status.md
rm ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/project_slice_*_implementation.md
```

Also prune stale feedback memories (where the trigger is a decision now baked into CONSTITUTION / brand / CLAUDE.md):

```bash
# Manual review before deleting each — check if guidance is still relevant
ls ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/feedback_*.md
```

For each `feedback_*.md`: read it. If the feedback is now covered by CONSTITUTION.md, brand bundle, or current CLAUDE.md, delete. If it's still a live preference, keep.

- [ ] **Step 8: Update MEMORY.md index**

```
Read: ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/MEMORY.md
```

Remove lines for deleted files. Add a single line for the consolidated:

```markdown
- [project_completed_slices.md](project_completed_slices.md) — One-line summary of every shipped slice (consolidated 2026-04-17)
```

Apply the change via Edit.

- [ ] **Step 9: Verify in a fresh session**

Close current session, open new. Ask a simple operational question:

```
What's the status of slice 17h?
```

Expected: Claude can answer from `project_completed_slices.md` entry. If it can't, the consolidation lost info — re-add the relevant 17h line to the consolidated file.

Ask something that used to rely on a pruned feedback memory (e.g., "How should I handle card layouts?"). Expected: still works from CONSTITUTION.md + brand bundle.

- [ ] **Step 10: Record deltas in devlog**

Append to Task 0 devlog:

```markdown

---

## Task 5 — Deltas

| Source | Before | After | Delta |
|--------|-------:|------:|------:|
| ~/.claude/rules/ total lines | N | N | -N |
| Installed plugins | N | N | -N |
| Auto-memory files | N | N | -N |
| Auto-memory bytes | N KB | N KB | -N KB |
```

- [ ] **Step 11: Commit devlog**

```bash
git add docs/devlog/2026-04-17-slice-17j-task-0.md
git commit -m "docs(slice-17j): Task 5 — global Claude config audit + deltas"
```

**STOP. Ask Yesid to start a fresh session and confirm nothing he relies on is missing before continuing.**

---

## Task 6: Re-measure deltas

**Goal:** Fresh cold-session measurement with all pruning applied. Compute full before/after delta table.

### Files
- Create: `docs/devlog/2026-04-17-slice-17j-task-6.md`

### Steps

- [ ] **Step 1: Fresh cold session**

Close current session. Open new on branch `feature/slice-17j-token-efficacy`.

- [ ] **Step 2: /context-budget as first command**

```
/context-budget
```

Copy entire output.

- [ ] **Step 3: Re-inventory sources**

Same commands as Task 0 Step 3–4:

```bash
wc -l CLAUDE.md docs/reference/WORKFLOW.md
du -sh docs/devlog docs/handoffs docs/slices docs/reference docs/learn docs/roadmap 2>/dev/null
wc -l ~/.claude/rules/common/*.md | tail -1
ls ~/.claude/rules/zh/ 2>/dev/null && echo "ERROR: zh not deleted" || echo "zh deleted ✓"
ls ~/.claude/plugins/ | wc -l
ls ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/ | wc -l
ls ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/ | grep -c "project_slice_"
```

- [ ] **Step 4: Write Task 6 devlog with full delta table**

Create `docs/devlog/2026-04-17-slice-17j-task-6.md`:

```markdown
# Slice 17j — Task 6 Re-Measurement

**Date:** 2026-04-17
**Branch:** feature/slice-17j-token-efficacy
**Commit:** <current HEAD>

## /context-budget output (cold session, post-change)

<paste full output>

## Delta table

| Source | Before (Task 0) | After (Task 6) | Delta | % Change |
|--------|----------------:|---------------:|------:|---------:|
| Total cold-session tokens | N | N | -N | -N% |
| System prompt tokens | N | N | -N | -N% |
| CLAUDE.md tokens | N | N | -N | -N% |
| Memory tokens | N | N | -N | -N% |
| Skills-list tokens | N | N | -N | -N% |
| MCP tool-schemas tokens | N | N | -N | -N% |
| --- | --- | --- | --- | --- |
| CLAUDE.md lines | N | N | -N | -N% |
| WORKFLOW.md lines | N | N | -N | -N% |
| docs/devlog bytes | N KB | N KB | -N KB | -N% |
| docs/handoffs bytes | N KB | N KB | -N KB | -N% |
| docs/slices bytes | N KB | N KB | -N KB | -N% |
| docs/specs bytes | N KB | removed | -N KB | -100% |
| docs/plans bytes | N KB | N KB | -N KB | -N% |
| docs/research bytes | N KB | removed | -N KB | -100% |
| docs/archive bytes | N KB | removed | -N KB | -100% |
| ~/.claude/rules lines | N | N | -N | -N% |
| Installed plugins | N | N | -N | -N% |
| Auto-memory files | N | N | -N | -N% |

## Total reduction

**Cold-session token count dropped by XX% (absolute: YY tokens).**

Target (≥25%) — <met | not met>.

## Notes

<any surprises — sources that dropped more/less than expected>
```

Fill every `N` with actual numbers.

- [ ] **Step 5: Commit Task 6**

```bash
git add docs/devlog/2026-04-17-slice-17j-task-6.md
git commit -m "docs(slice-17j): Task 6 — re-measurement + delta table"
```

**STOP. Ask Yesid to confirm deltas look right before codifying the skill.**

---

## Task 7: Codify `token-frugal-workflow` skill

**Goal:** Write a portable Claude Code skill at `~/.claude/skills/token-frugal-workflow/` that surfaces only when relevant.

### Files
- Create dir: `~/.claude/skills/token-frugal-workflow/`
- Create: `~/.claude/skills/token-frugal-workflow/SKILL.md`

### Steps

- [ ] **Step 1: Read all 6 research docs**

Read each from the cloud knowledge base:

```
Read: C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\01-cache-economics.md
Read: C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\02-mcp-scoping.md
Read: C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\03-plugin-hygiene.md
Read: C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\04-subagent-delegation.md
Read: C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\05-auto-memory.md
Read: C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\06-strategic-compact.md
```

Pull the "Cross-project reusable patterns" section from each. That's the skill's core content source.

- [ ] **Step 2: Create the skill directory**

```bash
mkdir -p ~/.claude/skills/token-frugal-workflow
```

- [ ] **Step 3: Write SKILL.md**

Create `~/.claude/skills/token-frugal-workflow/SKILL.md`:

```markdown
---
name: token-frugal-workflow
description: Use when starting a new project, auditing token usage, diagnosing cold-session bloat, planning a long multi-session effort, or hitting context pressure. NOT for routine feature work.
---

# Token-Frugal Workflow

Patterns for keeping Claude Code sessions light. Distilled from the yesid.dev slice-17j consolidation pass and its research knowledge base at `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` (if you have access).

## When this skill applies

- New project bootstrap.
- Audit: "why is this session already at N% context?"
- Planning: long multi-session effort where context economy matters.
- Debug: cache-miss issues, unexpected compaction triggers.
- Retrospective: post-slice hygiene ritual.

**Does NOT apply to:** routine feature work. Just code. Don't cite this skill during an implementation task.

## The seven accretion sources

Every Claude Code project tends to accrete these over time. Each loads every cold session:

1. Repo `docs/` (devlogs, handoffs, specs, plans, research, archive) — prune at slice close, mirror to cloud.
2. `CLAUDE.md` — keep load-bearing governance only; push detail to reference docs.
3. Reference docs (`WORKFLOW.md`, etc.) — compress stabilized sections, preserve operational checklists.
4. MCP tool schemas — scope per-project via `.mcp.json` or `.claude/settings.json` (see `02-mcp-scoping.md`).
5. Global `~/.claude/rules/` — prune duplicates (e.g., translations for languages not spoken).
6. Installed plugins/skills — install for the slice that needs them; uninstall when the slice closes.
7. Auto-memory — save only durable facts; consolidate per-slice status into a single "completed_*.md" file.

## Cache-window awareness

Claude 4.7 prompt cache: 5-minute TTL.

- **Under 5 minutes (60–270s):** cache stays warm. Use for polling near-term state.
- **Over 5 minutes (1200s–3600s):** pay the cache miss once, amortize the wait.
- **NEVER pick 300s.** Worst of both.

Refactor that busts the cache (CLAUDE.md rewrite, MEMORY.md rewrite, system prompt change) forces the next cold session to pay cache-miss cost. Batch config changes at slice close, not slice-start.

## Sub-agent delegation for context isolation

Facing 2+ independent research questions? Dispatch subagents.

- Each subagent's tool results stay in the agent's context, not main.
- Main only receives the final summary.
- 10–50× reduction in main-context burn vs running the same searches in main.

Summary-only return pattern: tell the agent to write its full output to a file and return only a short summary (e.g., 200 words). Main session reads the file later if needed, or never.

Use `superpowers:dispatching-parallel-agents` when available.

**Anti-pattern:** over-delegating trivial work. Agent invocation itself has overhead. One focused search in main = cheaper than an agent dispatch.

## Plan-mode vs execution-mode

- **Plan mode:** research, design, decision. No writes. Context accumulates deliberately.
- **Execution mode:** tool-heavy. Context accumulates fast.

Splitting: brainstorm + plan in one session (plan-mode economy); execute in a fresh session (clean context, plan already written down).

## MCP scoping checklist for new projects

1. Identify which MCPs are needed for this project specifically.
2. Author `.mcp.json` (or the 2026-current mechanism — see `02-mcp-scoping.md`) with the allowlist.
3. Verify in a fresh session that the skill-list / tool-schema reminder only contains allowed entries.
4. Record rationale in the project's CLAUDE.md or a devlog entry.

## Auto-memory lifecycle

Save:
- **user:** role, preferences, workflows
- **feedback:** explicit corrections OR confirmations
- **project:** in-flight goals, constraints, decisions
- **reference:** external-system pointers

Don't save:
- Code patterns derivable from the repo.
- Per-slice status (that belongs in the handoff).
- Ephemeral task state.

Consolidate: when a slice closes, roll its status memory into `project_completed_*.md` (one line per slice).

Verify before recommending: a memory that names a file/function is a claim at write time. Grep/Read before citing.

## Strategic-compact triggers

Compact when:
- Working context < 20% of budget AND session still has significant remaining work.
- A long plan-mode session is about to transition to execution (rarely — usually cheaper to start fresh).

Don't compact when:
- Mid-task (loses tool-result context that task needs).
- Approaching a natural session boundary (just start fresh).

Cache implication: compaction rewrites the context → busts the cache. Pay that cost deliberately.

## Post-slice hygiene ritual

At every slice close:

1. Mirror devlog + plan + spec + handoff to cloud; remove from repo.
2. Roll any per-slice status memory into `project_completed_*.md`.
3. Uninstall any plugins/MCPs installed just for this slice.
4. Re-snapshot `~/.claude/` config (see `cloud/claude-config/snapshot.ps1` if available).
5. Re-run `/context-budget` to confirm the slice didn't leave permanent overhead.

## References

If you have the yesid.dev cloud knowledge base, deep dives live at:
`C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\{01..06}-*.md`

Otherwise, build your own by running the Task 0a research pattern: 6 parallel subagents, one per area, summary-only returns, cloud-backed knowledge base.
```

Write with Write tool.

- [ ] **Step 4: Verify portability in a second project**

Open a fresh Claude Code session in a different project directory (not yesid.dev). Any other project you have on disk — pick one.

Ask:

```
How should I audit token usage for this repo?
```

Expected: the `token-frugal-workflow` skill surfaces. Claude mentions the 7 accretion sources, `/context-budget`, etc.

If it doesn't surface — tighten the description (make the "Use when..." triggers more explicit) and re-test.

- [ ] **Step 5: Verify dormancy in yesid.dev**

Back in yesid.dev, fresh session. Ask:

```
Implement a button component with hover state.
```

Expected: the `token-frugal-workflow` skill does NOT surface. Claude just implements the button.

If it does surface — tighten the description (explicitly mention "NOT for routine feature work" and emphasize the triggers).

- [ ] **Step 6: Note skill path in devlog**

Append to Task 0 devlog:

```markdown

---

## Task 7 — Skill created

- Path: `~/.claude/skills/token-frugal-workflow/SKILL.md`
- Description: "Use when starting a new project, auditing token usage, diagnosing cold-session bloat, planning a long multi-session effort, or hitting context pressure. NOT for routine feature work."
- Portability verified in: <second project name>
- Dormancy verified in: yesid.dev (routine UI prompt → skill did not activate)
```

- [ ] **Step 7: Commit devlog entry**

```bash
git add docs/devlog/2026-04-17-slice-17j-task-0.md
git commit -m "docs(slice-17j): Task 7 — token-frugal-workflow skill created + verified"
```

**STOP. Ask Yesid to verify skill behavior in a second project before continuing.**

---

## Task 8: Claude config export snapshot

**Goal:** Build `snapshot.ps1` + run first snapshot to `cloud/claude-config/`.

### Files
- Create dir: `C:\Users\otalo\Yesito\cloud\claude-config\`
- Create: `README.md`, `snapshot.ps1`, `user/<timestamp>/*`, `projects/yesid.dev/<timestamp>/*`

### Steps

- [ ] **Step 1: Inventory source configs**

```bash
ls ~/.claude/
ls ~/.claude/settings.json ~/.claude/settings.local.json 2>/dev/null
ls ~/.claude/rules/common/
ls ~/.claude/agents/ 2>/dev/null
ls ~/.claude/commands/ 2>/dev/null
ls ~/.claude/skills/ 2>/dev/null
```

```bash
ls .claude/
ls .claude/commands/ 2>/dev/null
ls .claude/settings.json .claude/settings.local.json 2>/dev/null
ls .mcp.json 2>/dev/null
ls CLAUDE.md
```

Record what exists. Identify sensitive: `settings.local.json` files + anything `*.local.*`.

- [ ] **Step 2: Create the cloud config root + subdirs**

```bash
mkdir -p "/c/Users/otalo/Yesito/cloud/claude-config/user"
mkdir -p "/c/Users/otalo/Yesito/cloud/claude-config/projects"
```

- [ ] **Step 3: Write snapshot.ps1**

Create `C:\Users\otalo\Yesito\cloud\claude-config\snapshot.ps1`:

```powershell
<#
.SYNOPSIS
    Snapshot Claude Code config (global + project) to cloud/claude-config/.

.PARAMETER ProjectName
    Optional. Project identifier for the project snapshot subdir.
    Defaults to the basename of the current working directory.

.EXAMPLE
    ./snapshot.ps1
    ./snapshot.ps1 -ProjectName yesid.dev

.NOTES
    - Append-only: never deletes prior snapshots.
    - Skips settings.local.json and anything matching *.local.*.
    - Run from the project root to capture project-scoped configs.
#>
[CmdletBinding()]
param(
    [string]$ProjectName = (Split-Path -Leaf (Get-Location))
)

$ErrorActionPreference = "Stop"
$cloudRoot = "C:\Users\otalo\Yesito\cloud\claude-config"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$userTarget = Join-Path $cloudRoot "user\$timestamp"
$projectTarget = Join-Path $cloudRoot "projects\$ProjectName\$timestamp"

Write-Host "→ Snapshotting to:" -ForegroundColor Cyan
Write-Host "  User:    $userTarget"
Write-Host "  Project: $projectTarget"

# --- User config snapshot ---
New-Item -ItemType Directory -Force -Path $userTarget | Out-Null

$userRoot = Join-Path $HOME ".claude"
$userCounts = @{ files = 0; dirs = 0 }

function Copy-IfExists {
    param([string]$Source, [string]$DestRoot, [string]$Name)
    if (Test-Path $Source) {
        $dest = Join-Path $DestRoot $Name
        if (Test-Path $Source -PathType Container) {
            # Robocopy for directory
            $null = robocopy $Source $dest /E /XF "settings.local.json" "*.local.*" /R:1 /W:1 /NFL /NDL /NJH /NJS
            $script:userCounts.dirs++
        } else {
            # Single file — skip if matches sensitive pattern
            if ($Source -notlike "*settings.local.json" -and $Source -notlike "*.local.*") {
                New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
                Copy-Item $Source $dest
                $script:userCounts.files++
            }
        }
    }
}

Copy-IfExists (Join-Path $userRoot "settings.json") $userTarget "settings.json"
Copy-IfExists (Join-Path $userRoot "CLAUDE.md") $userTarget "CLAUDE.md"
Copy-IfExists (Join-Path $userRoot "rules") $userTarget "rules"
Copy-IfExists (Join-Path $userRoot "agents") $userTarget "agents"
Copy-IfExists (Join-Path $userRoot "commands") $userTarget "commands"
Copy-IfExists (Join-Path $userRoot "skills") $userTarget "skills"

# --- Project config snapshot ---
New-Item -ItemType Directory -Force -Path $projectTarget | Out-Null
$projectCounts = @{ files = 0; dirs = 0 }

$cwd = Get-Location
$hasProjectConfig = (Test-Path (Join-Path $cwd "CLAUDE.md"))

if ($hasProjectConfig) {
    Copy-IfExists (Join-Path $cwd "CLAUDE.md") $projectTarget "CLAUDE.md"
    Copy-IfExists (Join-Path $cwd ".mcp.json") $projectTarget ".mcp.json"
    Copy-IfExists (Join-Path $cwd ".claude\commands") $projectTarget ".claude\commands"
    Copy-IfExists (Join-Path $cwd ".claude\settings.json") $projectTarget ".claude\settings.json"
    # Note: script above doesn't route project file counts into $projectCounts.
    # We re-count from disk below.
    $projectFileCount = (Get-ChildItem -Path $projectTarget -Recurse -File).Count
} else {
    Write-Warning "No CLAUDE.md in current directory — skipping project snapshot"
    Remove-Item -Recurse -Force $projectTarget
    $projectFileCount = 0
}

# Re-count user target from disk (more reliable than hooking the inline counter)
$userFileCount = (Get-ChildItem -Path $userTarget -Recurse -File).Count

# --- Update README.md ---
$readmePath = Join-Path $cloudRoot "README.md"
$readmeAppend = @"

## Snapshot: $timestamp

- User target: ``user\$timestamp\`` ($userFileCount files)
- Project target: ``projects\$ProjectName\$timestamp\`` ($projectFileCount files)
- Excluded: ``settings.local.json``, ``*.local.*``
"@

if (-not (Test-Path $readmePath)) {
    # Seed README with header on first run
    @"
# Claude Config Snapshots

**Root:** ``C:\Users\otalo\Yesito\cloud\claude-config\``
**Created:** $(Get-Date -Format "yyyy-MM-dd")

## What's here

- ``user\<timestamp>\`` — snapshots of ``~/.claude/`` (settings, rules, agents, commands, skills, CLAUDE.md)
- ``projects\<name>\<timestamp>\`` — snapshots of per-project config (CLAUDE.md, .mcp.json, .claude/)

## Sensitive data

``settings.local.json`` and ``*.local.*`` are excluded — may contain per-machine paths or tokens.

## How to restore

Copy desired subdirs back to their original locations. Merge on top of existing config (do NOT wholesale replace — local changes since snapshot will be overwritten).

## Snapshots log

(Appended by snapshot.ps1 on each run; newest at bottom.)
"@ | Set-Content $readmePath
}

Add-Content -Path $readmePath -Value $readmeAppend

Write-Host "`n✓ Snapshot complete." -ForegroundColor Green
Write-Host "  User:    $userFileCount files → $userTarget"
Write-Host "  Project: $projectFileCount files → $projectTarget"
Write-Host "  README:  $readmePath"
```

Write with Write tool.

- [ ] **Step 4: First run from yesid.dev root**

```bash
cd /c/Users/otalo/Yesito/Projects/yesid.dev
pwsh "C:\Users\otalo\Yesito\cloud\claude-config\snapshot.ps1" -ProjectName yesid.dev
```

If `pwsh` isn't available, use `powershell`:

```bash
powershell -ExecutionPolicy Bypass -File "C:\Users\otalo\Yesito\cloud\claude-config\snapshot.ps1" -ProjectName yesid.dev
```

Expected output:
```
→ Snapshotting to:
  User:    C:\Users\otalo\Yesito\cloud\claude-config\user\20260417-HHMMSS
  Project: C:\Users\otalo\Yesito\cloud\claude-config\projects\yesid.dev\20260417-HHMMSS

✓ Snapshot complete.
  User:    N files → ...
  Project: N files → ...
  README:  C:\Users\otalo\Yesito\cloud\claude-config\README.md
```

- [ ] **Step 5: Verify the snapshot**

```bash
ls "/c/Users/otalo/Yesito/cloud/claude-config/"
ls "/c/Users/otalo/Yesito/cloud/claude-config/user/"
ls "/c/Users/otalo/Yesito/cloud/claude-config/projects/yesid.dev/"
cat "/c/Users/otalo/Yesito/cloud/claude-config/README.md"
```

Verify:
- `user/<timestamp>/` exists with subdirs `rules/`, `agents/`, `commands/`, `skills/`, plus `settings.json` + `CLAUDE.md` if they existed.
- `projects/yesid.dev/<timestamp>/` exists with `CLAUDE.md` + `.mcp.json` + any `.claude/*`.
- `README.md` has the initial header + the first snapshot log entry.
- Spot-check one subdir: `ls cloud/claude-config/user/<timestamp>/rules/common/` should show the common rules.

- [ ] **Step 6: Verify sensitive files excluded**

```bash
find "/c/Users/otalo/Yesito/cloud/claude-config/" -name "settings.local.json" -o -name "*.local.*"
```

Expected: no output. If anything appears, edit `snapshot.ps1` to fix the exclusion and re-run.

- [ ] **Step 7: Note snapshot in devlog**

Append to Task 0 devlog:

```markdown

---

## Task 8 — Config snapshot

- Cloud root: `C:\Users\otalo\Yesito\cloud\claude-config\`
- First snapshot: `user\<timestamp>\` + `projects\yesid.dev\<timestamp>\`
- User files snapshotted: N
- Project files snapshotted: N
- Excluded: settings.local.json + *.local.*
- Re-run cadence: when ~/.claude/ or project .claude/ changes materially
```

- [ ] **Step 8: Commit devlog entry**

```bash
git add docs/devlog/2026-04-17-slice-17j-task-0.md
git commit -m "docs(slice-17j): Task 8 — config export snapshot created"
```

> Cloud files themselves stay out of git — they're the export destination.

**STOP. Ask Yesid to spot-check the snapshot before final handoff.**

---

## Task 9: Handoff + commit + PR

**Goal:** Write handoff, update checkpoint + roadmap, regenerate tree.txt, push + create PR.

### Files
- Create: `docs/handoffs/slice-17j-token-efficacy.md`
- Create: `docs/devlog/2026-04-17-slice-17j.md` (consolidated slice devlog — optional if Task 0 devlog is comprehensive)
- Update: `docs/slices/slice-17-checkpoint.md`
- Update: `docs/roadmap/standardization.md`
- Regenerate: `tree.txt`

### Steps

- [ ] **Step 1: Read handoff template**

```
Read: docs/handoffs/_TEMPLATE.md
```

- [ ] **Step 2: Write slice-17j handoff**

Create `docs/handoffs/slice-17j-token-efficacy.md` following the template. Key sections to fill:

```markdown
# Handoff — Slice 17j (Token Efficacy)

**Date:** 2026-04-17
**Branch:** feature/slice-17j-token-efficacy
**PR:** #<TBD after Step 8>
**Merge commit:** <TBD>

## What shipped

Seven-prong consolidation + three durable portable outputs:

### Pruned (yesid.dev)
- `docs/` — historical devlogs, handoffs, specs, plans, research, archive mirrored to `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` and removed from repo. Cross-links fixed. `docs/ARCHIVE.md` stub added.
- `CLAUDE.md` — N lines → N lines. Removed: Completed Slices, Tool Selection Protocol, Plugins & Tools, Repo Structure detail. Pointers added where sections lived.
- `docs/reference/WORKFLOW.md` — N lines → N lines. Compressed stabilized sections; phase → tool map, quality gates, closing checklist preserved.
- `.mcp.json` — project-scoped MCP allowlist. Keep: Svelte, GSAP, Context7, Chrome DevTools, Claude Preview, GitHub, Vercel, Figma, Playwright. Disabled: webflow, cloudflare, railway, neon, postman, notion, videodb, jobs, tax, calendar, shadcn, mcp-registry, duplicates.
- `~/.claude/rules/zh/` — deleted entirely (pure duplication of `common/`).
- `~/.claude/plugins/` — audited; N bundles removed (see Task 5 section of devlog for full list).
- Auto-memory — consolidated N `project_slice_*_status.md` files into `project_completed_slices.md`; pruned stale feedback memories.

### Durable outputs
- **Knowledge base:** `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` — 6 deep dives (cache-economics, mcp-scoping, plugin-hygiene, subagent-delegation, auto-memory, strategic-compact) + index with review cadence.
- **Skill:** `~/.claude/skills/token-frugal-workflow/SKILL.md` — portable skill, tight description, surfaces only on audit/planning triggers. Verified dormant on routine yesid.dev work.
- **Config snapshot:** `C:\Users\otalo\Yesito\cloud\claude-config\` — `snapshot.ps1` + first export (`user/<timestamp>/` + `projects/yesid.dev/<timestamp>/`). Append-only. Excludes `settings.local.json` + `*.local.*`.

## Delta table

<copy full delta table from docs/devlog/2026-04-17-slice-17j-task-6.md>

## Ongoing discipline (post-17j)

- **Plugins:** install for the slice that needs them; uninstall when the slice closes.
- **MCP servers:** add to `.mcp.json` per-project when needed; remove when done.
- **Auto-memory:** save only durable facts; per-slice status goes in handoff, not memory; rolls into `project_completed_slices.md` at slice close.
- **`docs/`:** at slice close, mirror slice-specific devlog + plan + spec + handoff to cloud; remove from repo. Reference + learn stay.
- **`CLAUDE.md` / `WORKFLOW.md`:** resist new sections; slice-specific content belongs in slice specs.
- **Knowledge base:** review `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` every 2 slices or on major Claude release.
- **Config snapshot:** re-run `snapshot.ps1` when `~/.claude/` or project `.claude/` changes materially.

The `token-frugal-workflow` skill surfaces these disciplines at relevant moments.

## Verification

All 15 Verify items in the spec passed:
1. Fresh-session `/context-budget` matches Task 6 delta. ✓
2. `docs/` contents match spec's Kept-in-repo list. ✓
3. `docs/ARCHIVE.md` reads as coherent pointer. ✓
4. Cloud mirror at `yesid.dev/docs/` mirrors pre-prune. ✓
5. `git show HEAD~20:docs/devlog/...` still works. ✓
6. Zero cross-link leaks. ✓
7. `CLAUDE.md` meaningfully shorter. ✓
8. `.mcp.json` present; only Keep-list tools appear in fresh session. ✓
9. `~/.claude/rules/zh/` absent. ✓
10. Auto-memory consolidated. ✓
11. Knowledge base at `cloud/claude-knowledge/token-efficacy/` complete. ✓
12. `token-frugal-workflow` skill surfaces in second project, dormant in yesid.dev. ✓
13. Config snapshot at `cloud/claude-config/` complete. ✓
14. `bun run test` + `bun run check` green. ✓
15. Site renders identically. ✓

## Context for next slice

- Branch `feature/slice-17j-token-efficacy` to delete post-merge.
- Next: pick up next priority from `docs/roadmap/standardization.md` or open a new slice.
- `token-frugal-workflow` skill will surface automatically on new-project bootstrap.
```

- [ ] **Step 3: Update slice-17-checkpoint**

```
Read: docs/slices/slice-17-checkpoint.md
```

Edit: add 17j row as complete with merge date + PR number.

- [ ] **Step 4: Update roadmap**

```
Read: docs/roadmap/standardization.md
```

Edit: mark 17j complete.

- [ ] **Step 5: Regenerate tree.txt**

```bash
cmd /c "tree /F /A | findstr /V /C:\"node_modules\" /C:\".git\" /C:\".remember\" /C:\"bun.lockb\" /C:\".svelte-kit\" /C:\".vercel\" /C:\".DS_Store\" > tree.txt"
```

- [ ] **Step 6: Run tests + check one more time**

```bash
bun run test
bun run check
```

Both green expected.

- [ ] **Step 7: Commit Task 9**

```bash
git add docs/handoffs/slice-17j-token-efficacy.md docs/slices/slice-17-checkpoint.md docs/roadmap/standardization.md tree.txt
git commit -m "docs(slice-17j): Task 9 — handoff + checkpoint + roadmap + tree"
```

- [ ] **Step 8: Push + create PR**

```bash
git push -u origin feature/slice-17j-token-efficacy
```

```bash
gh pr create --title "feat(slice-17j): Token Efficacy — prune + portable knowledge base + skill + config snapshot" --body "$(cat <<'EOF'
## Summary
- Pruned 7 accretion sources across repo + global Claude config (docs/, CLAUDE.md, WORKFLOW.md, .mcp.json scoping, rules/zh, plugins, auto-memory).
- Created portable research knowledge base at `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` (6 deep dives).
- Created portable `token-frugal-workflow` skill at `~/.claude/skills/` — activates only on relevant triggers.
- Created config snapshot script + first export at `C:\Users\otalo\Yesito\cloud\claude-config\`.
- Cold-session token count reduced by <N>% (see handoff for full delta table).

## Test plan
- [ ] /context-budget in fresh session matches Task 6 delta
- [ ] CLAUDE.md cold-session self-sufficiency test passes
- [ ] .mcp.json loads only Keep-list tools
- [ ] token-frugal-workflow skill surfaces in second project, dormant in yesid.dev
- [ ] Config snapshot at cloud/claude-config/ spot-check
- [ ] bun run test green
- [ ] bun run check green

## Artifacts
- Handoff: `docs/handoffs/slice-17j-token-efficacy.md`
- Devlogs: `docs/devlog/2026-04-17-slice-17j-task-0.md`, `-task-6.md`
- Plan: `docs/plans/2026-04-17-slice-17j-token-efficacy.md`
- Spec: `docs/slices/slice-17j-token-efficacy.md`
EOF
)"
```

- [ ] **Step 9: Report PR URL to user**

The `gh pr create` command returns a PR URL. Report it back so Yesid can review on GitHub:

```
PR created: <URL>
```

**STOP. Slice closes when Yesid approves + merges the PR and confirms final token-delta number.**

---

## Post-merge cleanup (after PR merges)

- [ ] **Step 1: Switch to main, pull**

```bash
git checkout main
git pull origin main
```

- [ ] **Step 2: Delete feature branches locally**

```bash
git branch -d feature/slice-17j-token-efficacy
git branch -d feature/slice-17h-3-task0-freshen
```

If either refuses to delete (because squash-merged commits don't match): `git branch -D <name>` (user-approved for this specific cleanup).

- [ ] **Step 3: Fresh-session final verification**

Open new Claude Code session on `main`. Run `/context-budget`. Confirm numbers match Task 6 re-measurement. This is the definitive post-merge baseline for all future slices.

- [ ] **Step 4: Run snapshot.ps1 one more time from main**

```bash
powershell -ExecutionPolicy Bypass -File "C:\Users\otalo\Yesito\cloud\claude-config\snapshot.ps1" -ProjectName yesid.dev
```

Captures the post-merge state so the first "canonical" snapshot isn't a mid-PR snapshot.

---

## Execution Order Recap

```
Task 0 (Baseline)
   └──► Task 0a (Research — 6 parallel subagents)
          └──► Task 1 (docs prune + cloud mirror)
                 └──► Task 2 (CLAUDE.md slim)
                        └──► Task 3 (WORKFLOW.md slim)
                               └──► Task 4 (.mcp.json scoping — informed by research 02)
                                      └──► Task 5 (global cleanup — informed by research 03 + 05)
                                             └──► Task 6 (re-measure + delta table)
                                                    └──► Task 7 (codify skill — informed by all 6)
                                                           └──► Task 8 (config export snapshot)
                                                                  └──► Task 9 (handoff + PR)
                                                                         └──► Post-merge cleanup
```

Sequential throughout. Only parallelization: Task 0a's 6 research agents.

## Commits on this branch (expected)

1. `docs(slice-17j): Task 0 baseline measurement`
2. `docs(slice-17j): Task 0a research sprint summaries + findings`
3. `feat(slice-17j): Task 1 — prune docs/, mirror to cloud, create ARCHIVE.md stub`
4. `refactor(slice-17j): Task 2 — slim CLAUDE.md (remove duplicative sections)`
5. `refactor(slice-17j): Task 3 — compress WORKFLOW.md stabilized sections`
6. `feat(slice-17j): Task 4 — project-scoped MCP allowlist (.mcp.json)`
7. `docs(slice-17j): Task 5 — global Claude config audit + deltas`
8. `docs(slice-17j): Task 6 — re-measurement + delta table`
9. `docs(slice-17j): Task 7 — token-frugal-workflow skill created + verified`
10. `docs(slice-17j): Task 8 — config export snapshot created`
11. `docs(slice-17j): Task 9 — handoff + checkpoint + roadmap + tree`

Squash-merged to main as a single commit per standard workflow.

## Common pitfalls

- **Committing cloud files.** `C:\Users\otalo\Yesito\cloud\` is NOT a git repo. Files created there are never staged — only their effects (devlog notes, in-repo scripts referencing them) are committed.
- **Deleting zh before confirming common/ intact.** Always `ls ~/.claude/rules/common/ | wc -l` BEFORE `rm -rf ~/.claude/rules/zh/`.
- **Removing too many plugins at once.** Batch in 3–5, fresh session between batches.
- **Compacting mid-slice.** Don't. Start a fresh session between tasks if context gets heavy.
- **Committing the 17j plan to 17h branch.** Already avoided — plan and spec live on `feature/slice-17j-token-efficacy`.
- **Losing research docs to a cache-miss compact.** Agents write direct to cloud file, not via return summary — so even if summary is lost the doc survives.
- **Running snapshot.ps1 from the wrong directory.** Always `cd /c/Users/otalo/Yesito/Projects/yesid.dev` before running. Otherwise `-ProjectName` defaults to wrong basename.
