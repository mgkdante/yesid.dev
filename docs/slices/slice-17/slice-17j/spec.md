# Slice 17j — Workflow Efficiency

**Status:** active — scope expanded mid-slice (2026-04-17). Was "Token Efficacy"; now covers token + workflow structure as two pillars of one slice.
**Priority:** 2
**Estimated effort:** 7–9 sessions (revised up from 4–5 after scope expansion)

**Depends on:** Slice 17h merged to `main` ✅
**Parent slice:** 17 (Standardization). 17j is the operational-efficiency close to Slice 17 — once the visual/design/brand work settled in 17h, 17j resets the per-session context baseline AND systematizes the workflow itself so future slices (and future projects across Yesid's 6 services) start light, structured, and self-pruning.

## Objective — two pillars

This slice delivers one unified outcome across two pillars:

### Pillar 1 — Token efficiency
Reduce the token weight Claude auto-loads at the start of every session across seven accretion sources (repo docs, `CLAUDE.md`, `WORKFLOW.md`, `.mcp.json` scoping, `~/.claude/rules/zh/`, installed plugins, auto-memory). Record a measurable before/after delta.

### Pillar 2 — Workflow structure
Systematize the slice-based workflow into a 3-level hierarchy with standardized per-sub-slice file structure, self-appending handoffs, and a close-script that flattens + mirrors at PR. Applies to 17j itself and every future slice.

## Core principle — the self-enhancing workflow

**The workflow is part of the product.** Every mistake solved in one slice becomes a closing-checklist rule so it cannot recur in the next. Quality compounds slice-over-slice. This slice is the one that turns that principle into executable tooling.

## Trade-secret framing

Both pillars produce **portable personal IP**, not public publishing. Usable across any repo Yesid works on (yesid.dev now, and any project that touches his 6 services — SQL, infrastructure, pipelines, consulting, etc.). Not a client deliverable. Private competitive moat.

## Durable outputs beyond yesid.dev

**From Pillar 1 (Token):**
1. **Portable research knowledge base** — seven deep dives at `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` (500–1000 words each).
2. **Portable workflow skill** — `~/.claude/skills/workflow-efficiency/` (renamed from `token-frugal-workflow` to reflect the two-pillar scope).
3. **Portable config snapshot** — `C:\Users\otalo\Yesito\cloud\claude-config\`.

**From Pillar 2 (Structure):**
4. **Three-tier context model** codified in `docs/ARCHIVE.md` (shipped in Task 1).
5. **Hierarchical slice structure** — `docs/slices/slice-NN/slice-NN<letter>/{spec,plan,log,handoff}.md` bundle template.
6. **Close-script** — `scripts/slice-close.ts` (Bun) that moves the active sub-slice bundle to the cloud archive (preserves folder structure — no flatten), deletes the repo folder, updates `COMPLETED-SLICES.md`. Uses `YESITO_CLOUD_ROOT` env var for OS portability.
7. **Self-appending handoff pattern** — per-task append, PR-body-derivable, resets per sub-slice.
8. **Shared vocabulary codex** — `docs/reference/VOCAB.md` (drafted Task 9a, co-edited at close) — brand + industry + Claude Code + workflow terms in one always-loaded lexicon.
9. **OS-agnostic workflow + OS-quirks registry** — `YESITO_CLOUD_ROOT` env var (Windows / macOS / Linux) + `cloud/claude-knowledge/os-quirks/{windows,macos,linux,cross-platform}.md` where discovered OS quirks persist across projects. Closing-checklist enforces logging.

## Context

### Pillar 1 — Token accretion problem

Token consumption per session in this project has grown heavy. Accretion across 20+ slices has inflated seven distinct sources, each loaded every cold session regardless of the task at hand:

1. **`docs/`** — devlogs, handoffs, specs, plans, research, archive from every completed slice. Rarely referenced mid-session but inflate any broad read and show up in searches.
2. **`CLAUDE.md`** — ~500 lines with sections that duplicate content now living in `WORKFLOW.md`, `tree.txt`, and (post-17h) `brand/`.
3. **`docs/reference/WORKFLOW.md`** — expanded during slice 17 thrash; some sections are now stable enough to compress.
4. **`~/.claude/rules/zh/`** — full Chinese translation of every `common/` rule file. Yesid is English-only; pure duplication, loaded every session for every project.
5. **`~/.claude/` installed plugins** — hundreds of skills enumerated in the session-start system reminder. Many plugin bundles are unused or duplicated (e.g., `everything-claude-code` overlaps other installs).
6. **Connected MCP servers** — firefox-devtools, webflow, cloudflare, railway, neon, postman, notion, videodb, jobs, tax, calendar, etc. — each ships tool schemas into every session, for every project, regardless of relevance.
7. **Auto-memory** — ~20 `project_slice_NN_status.md` entries for shipped slices, plus stale feedback memories tied to closed work.

### Pillar 2 — Workflow structure problem

The current workflow produces 4 artifacts per slice (`spec`, `plan`, `devlog`, `handoff`) scattered across 4 separate directories. Over 22 slices this produced ~100 files across 4 dir trees. Cross-referencing one slice's 4 artifacts requires jumping between 4 dirs. PRs happen at Level-3 (sub-slice tasks) inconsistently. Handoffs are written in one final push rather than appended-as-you-go.

Industry research (2026) converges on **per-feature bundles** (Kiro, GitHub Spec Kit) and **single-file living specs** (Addy Osmani, Tessl). Neither quite fits a solo dev at 22+ slices. This slice introduces a **hybrid model**:
- **Active work:** folder bundle at `docs/slices/slice-NN/slice-NN<letter>/` with spec + plan + log + handoff
- **At PR close:** flatten to single file, mirror to cloud archive, delete repo folder
- **3-level hierarchy:** Slice (L1, e.g. 17) → Sub-slice (L2, e.g. 17j, PR boundary) → Task (L3, sections in plan/log/handoff)
- **Sessions are implicit** — `### Session YYYY-MM-DD — Task 17j-3` subsections in log.md
- **Non-slice work** gets its own home at `docs/sessions/` (bugfixes, configs, one-off exploration)

17j is the one-time consolidation that resets both baselines. After this slice, the **`workflow-efficiency` skill** (Task 7) surfaces when relevant to keep accretion from returning — on every new project, long multi-session effort, or cold-session audit.

## Architecture

- **No application code changes.** Site behavior is identical before/after. This is a docs + config + environment slice.
- **Repo-side changes** (pruning prongs 1–3 + .mcp.json + the full hierarchy migration): commit on the 17j branch, ship in one PR.
- **Global Claude config changes** (pruning prongs 5–7): happen on Yesid's machine in `~/.claude/` and the project-scoped auto-memory directory. Not versioned, but recorded in the handoff and captured in Task 8's config snapshot.
- **Three-tier context model** (shipped in Task 1): Tier 1 always-on (governance + active slice), Tier 2 fetch-on-command (cloud mirror + git), Tier 3 cloud indexes (`COMPLETED-SLICES.md`, `INDEX.md`). All documented in `docs/ARCHIVE.md`.
- **Hierarchical slice model** (Tasks 3a–3e): historical cloud artifacts reorganized retroactively into bundle format; active slices use `docs/slices/slice-NN/slice-NN<letter>/` folders; close-script flattens + mirrors at PR.
- **Research output lives in the cloud** at `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` — reference material, not loaded into any session by default. Zero session-start cost; human-browseable; reusable across projects.
- **Workflow patterns live as a skill** at `~/.claude/skills/workflow-efficiency/` — activates only when relevant (planning new projects, auditing tokens, diagnosing bloat, structuring a new slice). Tight description prevents unwanted activation.
- **Config exported to cloud** at `C:\Users\otalo\Yesito\cloud\claude-config\` with append-only timestamped snapshots. Enables portability to new projects/machines without mutating the live `~/.claude/`.
- **Measurement is the spine.** Baseline before any prong, re-measure after. Delta is the acceptance metric for both pillars (tokens + file count + directory count).
- **Parallel subagents for research only.** Six token-economics deep dives + one workflow-structure deep dive dispatched in Task 0a; main session context stays clean. Approved exception to the serial-execution rule — research, not implementation.
- **Self-enhancing closing checklist.** Every mistake caught in a sub-slice becomes a permanent closing-checklist rule. Quality compounds.
- **17j is the first sub-slice to close under the new layout.** Dogfoods its own output — the close-script runs against 17j's own bundle at PR time.

## Tech Stack

Markdown + PowerShell (snapshot script). No runtime dependencies. Tools used:

- `/context-budget` slash command (or `context-budget` skill) for baseline + re-measurement of cold-session token count.
- `robocopy` / `cp -r` for docs mirror.
- `grep` (ripgrep) for cross-link scrub.
- Editing tools for `CLAUDE.md`, `WORKFLOW.md`, `.mcp.json`.
- `superpowers:dispatching-parallel-agents` skill for Task 0a orchestration.
- PowerShell for `snapshot.ps1` (Windows-native, no new deps).

## File Structure

### New files (in repo)

```
.mcp.json                                            — project-scoped MCP allowlist for yesid.dev
docs/ARCHIVE.md                                      — stub pointing at cloud mirror + git history
```

### New files (outside repo — cloud)

```
C:\Users\otalo\Yesito\cloud\yesid.dev\docs\**                                 — mirror of pruned docs (Task 1)
C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\00-index.md
C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\01-cache-economics.md
C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\02-mcp-scoping.md
C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\03-plugin-hygiene.md
C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\04-subagent-delegation.md
C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\05-auto-memory.md
C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\06-strategic-compact.md
C:\Users\otalo\Yesito\cloud\claude-config\user\<timestamp>\*                   — snapshot of ~/.claude/ config
C:\Users\otalo\Yesito\cloud\claude-config\projects\yesid.dev\<timestamp>\*     — snapshot of project config
C:\Users\otalo\Yesito\cloud\claude-config\README.md
C:\Users\otalo\Yesito\cloud\claude-config\snapshot.ps1
```

### New files (outside repo — global Claude)

```
~/.claude/skills/token-frugal-workflow/SKILL.md      — portable skill codifying research findings
~/.claude/skills/token-frugal-workflow/references/*  — optional deeper reference material (links to cloud knowledge base)
```

### Modified files (repo)

```
CLAUDE.md                                            — slim: cut Completed Slices, Tool Selection Protocol, Plugins & Tools, repo structure detail
docs/reference/WORKFLOW.md                           — slim: compress sections that stabilized after 17-era thrash
tree.txt                                             — regenerate at end of slice
docs/slices/slice-17-checkpoint.md                   — update with 17j status
docs/roadmap/standardization.md                      — mark 17j complete
```

### Removed from repo (mirrored to cloud first)

```
docs/devlog/*                                        — all except the 17j devlog itself
docs/handoffs/*                                      — all closed handoffs; keep template
docs/slices/slice-0*.md                              — completed pre-17 slices
docs/slices/slice-17a-*.md                           — completed 17a sub-slices (keep 17-checkpoint.md)
docs/slices/slice-17d-*.md, slice-17e-*.md           — completed 17d/17e sub-slices
docs/slices/slice-17h-*.md                           — completed 17h sub-slices (after 17h merges)
docs/specs/*                                         — all historical design specs
docs/plans/*                                         — all historical implementation plans
docs/research/*                                      — all one-off competitive/research docs
docs/archive/*                                       — entire archive folder
```

### Kept in repo (unchanged by this slice)

```
docs/reference/{ARCHITECTURE,PATTERNS,TESTS}.md      — live reference, Claude loads regularly
docs/reference/CSS.md, CONSTITUTION.md, MOTION.md    — per 17h, these stay in docs/reference/ (narratives in brand/)
docs/learn/**                                        — durable learning knowledge base
docs/roadmap/{PLAN,FUTURE_PHASES,standardization}.md — active roadmap
docs/slices/_TEMPLATE.md                             — template
docs/slices/slice-17j-token-efficacy.md              — this file
docs/slices/slice-17-checkpoint.md                   — active checkpoint
docs/devlog/_TEMPLATE.md, docs/handoffs/_TEMPLATE.md — templates
```

### Outside repo (global config changes — not versioned, documented in handoff)

```
~/.claude/rules/zh/                                  — DELETE entirely
~/.claude/plugins/**                                  — AUDIT and uninstall unused bundles
~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/  — consolidate slice-status files
```

## Tech Stack Rationale

No new dependencies. Baseline + re-measurement use the built-in `context-budget` slash command (already in Yesid's skill inventory). Mirror operation uses OS-native tools (PowerShell `robocopy` on Windows). Grep is ripgrep (already installed for Claude Code). Research dispatch uses `superpowers:dispatching-parallel-agents` (already installed). Config snapshot uses PowerShell (Windows-native, no install needed).

---

## Task 0: Baseline measurement

**Files:** none (measurement only)

- [ ] **Step 1: Cold-session token measurement — repo only**
  Start a fresh Claude Code session on `main` with 17h merged. Run `/context-budget` immediately, before any other tool call. Record: system prompt tokens, project CLAUDE.md tokens, auto-memory tokens, skill-list tokens, MCP tool-schema tokens, total.

- [ ] **Step 2: Inventory sources**
  Capture raw line counts and byte counts for:
  - `docs/` subtrees (devlog, handoffs, specs, plans, slices, research, archive, reference, learn, roadmap)
  - `CLAUDE.md`
  - `docs/reference/WORKFLOW.md`
  - `~/.claude/rules/` (en common + zh)
  - `~/.claude/plugins/` list
  - `~/.claude/projects/.../memory/` file count and total size

- [ ] **Step 3: Record baseline in devlog**
  Create `docs/devlog/2026-XX-XX-slice-17j-task-0.md` with all numbers and the exact `/context-budget` output. This is the before-snapshot.

**STOP. Ask Yesid to confirm the baseline looks right before executing any changes.**

---

## Task 0a: Research sprint — parallel deep dives

**Files:**
- Create dir: `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\`
- Create 7 files: `00-index.md` + `01-cache-economics.md` through `06-strategic-compact.md`

- [ ] **Step 1: Dispatch 6 parallel subagents**
  Single message, 6 Agent tool uses in parallel (subagent_type: `general-purpose`). Each receives identical structural prompt + unique area:
  - **01 Cache economics** — Claude 4.7 prompt-cache TTL (5-min), session-start cache interaction, cache-hit cost savings, 1M-context + cache patterns.
  - **02 MCP scoping** — `.mcp.json` syntax, `enabledMcpjsonServers` / `disabledMcpjsonServers`, project vs user vs local scopes, deferred-tool pattern (ToolSearch on-demand schema loading), how MCP schemas consume context.
  - **03 Plugin hygiene** — how power-users manage Claude Code plugin/skill bloat; per-project plugin scoping (if supported); skill-description patterns that minimize always-active surface area; audit tools for skill usage.
  - **04 Subagent delegation for context isolation** — when to dispatch, how agent contexts differ from main, cost tradeoffs, parallelization patterns, foreground vs background.
  - **05 Auto-memory best practices** — lifecycle, pruning cadence, what Anthropic / power-users recommend saving vs not saving, MEMORY.md index hygiene.
  - **06 Strategic compact + plan-mode economics** — when to compact, when to enter plan mode, measuring working-context vs startup-context, cache-breakage implications.

  **Required output structure for each doc:**
  ```markdown
  # <Area>
  ## Current state (2026)
  ## Best practices
  ## Actionable for yesid.dev
  ## Cross-project reusable patterns
  ## Sources (prioritize 2025–2026; flag and exclude older unless Anthropic primary docs)
  ```
  Each doc: 500–1000 words. Agent writes directly to the cloud file path, returns a 200-word executive summary to the main session.

- [ ] **Step 2: Review summaries**
  Main session receives 6 summaries. Reject any doc missing a required section; re-dispatch the offending agent with tightened prompt.

- [ ] **Step 3: Write `00-index.md`**
  One line per doc with a hook + `last-reviewed: 2026-XX-XX` date. This index is the entry point for future reference.

- [ ] **Step 4: Flag decision-changing findings**
  Record in devlog which research findings will inform Task 4 (MCP scoping), Task 5 (auto-memory consolidation), and Task 7 (skill content).

**STOP. Ask Yesid to review the 6 docs + index before proceeding to Task 1.**

---

## Task 1: `docs/` prune → mirror to cloud

**Files:**
- Mirror target: `C:\Users\otalo\Yesito\cloud\yesid.dev\` (folder tree preserved)
- Repo removals: listed in File Structure
- Create: `docs/ARCHIVE.md`

- [ ] **Step 1: Create the cloud mirror**
  `robocopy C:\Users\otalo\Yesito\Projects\yesid.dev\docs C:\Users\otalo\Yesito\cloud\yesid.dev\docs /E /XD .git` — copy the full `docs/` tree, preserving structure. Verify with a spot-check that a few devlogs and handoffs opened correctly on the cloud side.

- [ ] **Step 2: Cross-link scrub (dry run)**
  Grep `docs/reference/**` and `docs/learn/**` for links into the folders about to be removed: `../devlog/`, `../handoffs/`, `../specs/`, `../plans/`, `../research/`, `../archive/`, and `slice-*.md` references. List all hits. For each, decide: rewrite to cloud mirror (`C:\Users\otalo\Yesito\cloud\yesid.dev\...`) or excise entirely. Save the decision list in the devlog.

- [ ] **Step 3: Apply the cross-link fixes**
  Edit `docs/reference/**` and `docs/learn/**` according to the decision list.

- [ ] **Step 4: Remove historical docs from repo**
  Delete exactly the paths listed in File Structure / "Removed from repo". Do NOT delete templates, active checkpoint, active slice spec, or `_TEMPLATE.md` files.

- [ ] **Step 5: Create `docs/ARCHIVE.md`**
  Short stub (~30 lines): what was moved, to where (`C:\Users\otalo\Yesito\cloud\yesid.dev\docs\`), how to recover from git history, last-date-moved.

- [ ] **Step 6: Verify**
  Run `bun run test` + `bun run check`. No test or build depends on removed docs, but verify.
  Regenerate `tree.txt`.

**STOP. Ask Yesid to verify cloud mirror contents + spot-check a recovered file from git before continuing.**

---

## Task 2: `CLAUDE.md` slim

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Identify sections for removal/compaction**
  Remove outright: `## Completed Slices` list (git log is truth), `## Tool Selection Protocol` (duplicates `WORKFLOW.md §21`), `## Plugins & Tools` (belongs in `WORKFLOW.md`), `## Repo Structure` detail paragraph (`tree.txt` is truth — keep a 2-line pointer).
  Keep and possibly tighten: session types, hard rules, iteration protocol, CSS architecture summary, brand non-negotiables, Never-list, testing rules, git/PR workflow summary.

- [ ] **Step 2: Rewrite**
  Apply the edits. Add short pointers ("see WORKFLOW.md §21", "see tree.txt", "see git log") where removed sections previously lived.

- [ ] **Step 3: Cold-session self-sufficiency test**
  Start a fresh Claude Code session. Without using any other context, ask Claude to summarize the project in one paragraph + state the three hard rules. If Claude can't, the slim went too far; restore specific sections.

- [ ] **Step 4: Measure delta**
  Re-run `/context-budget` and record the project-CLAUDE.md token delta in the devlog.

**STOP. Ask Yesid to do a cold-session self-sufficiency test from his side before continuing.**

---

## Task 3: `WORKFLOW.md` slim

**Files:**
- Modify: `docs/reference/WORKFLOW.md`

- [ ] **Step 1: Identify compressible sections**
  Sections that expanded during slice 17 thrash. Preserve: phase → tool map, quality gates, closing checklist — these are load-bearing.

- [ ] **Step 2: Rewrite**
  Compress without losing the operational content. If in doubt, keep.

- [ ] **Step 3: Measure delta**
  Record WORKFLOW.md byte delta in the devlog.

**STOP. Ask Yesid to skim the new WORKFLOW.md end-to-end before continuing.**

---

## Task 4: `.mcp.json` per-project MCP scoping

**Files:**
- Create: `.mcp.json`

> Apply findings from `02-mcp-scoping.md` — specifically the recommended scope mechanism and any 2026 best-practice patterns discovered in research.

- [ ] **Step 1: Inventory current MCP servers**
  List every MCP server currently connected globally. For each, decide: needed for yesid.dev or not?
  **Keep for yesid.dev:** Svelte MCP, GSAP Master, Context7, Chrome DevTools, Claude Preview, GitHub, Vercel, Figma (occasional), Playwright (occasional).
  **Disable for yesid.dev:** firefox-devtools, webflow, cloudflare, railway, neon, postman, notion, videodb, jobs, tax, calendar, shadcn (Svelte project, not React), mcp-registry, and any others not in the Keep list.

- [ ] **Step 2: Author `.mcp.json`**
  Write a project-scoped `.mcp.json` that enables only the Keep list. Use the mechanism confirmed by research 02 (likely `enabledMcpjsonServers` / `disabledMcpjsonServers` or the equivalent allowlist pattern).

- [ ] **Step 3: Verify in a fresh session**
  New session — confirm the skill-list system reminder shows only the Keep list's tools. No `firefox-devtools__*`, no `webflow__*`, etc.

- [ ] **Step 4: Measure delta**
  Record MCP tool-schema token delta.

**STOP. Ask Yesid to confirm no needed MCP is accidentally disabled before continuing.**

---

## Task 5: Global Claude config cleanup (non-repo)

**Files:** (outside the repo; document in devlog + handoff only)

> Apply findings from `05-auto-memory.md` for memory consolidation patterns and `03-plugin-hygiene.md` for plugin-audit approach.

- [ ] **Step 1: Delete `~/.claude/rules/zh/`**
  `rm -rf ~/.claude/rules/zh/`. Highest-leverage global change — affects every project. Verify `~/.claude/rules/common/` is untouched.

- [ ] **Step 2: Plugin audit**
  List installed plugins in `~/.claude/plugins/` (or the equivalent settings file). For each bundle, decide: actively used across any current project?
  **Likely remove:** `everything-claude-code` (duplicates individual skills), unused design-ops / brand-voice / vercel / agent-sdk-dev / codex / web-designer / frontend-design-pro / enterprise-search / marketing / operations / finance / data / product-management / engineering bundles, duplicated chrome-devtools-mcp installs.
  **Likely keep:** superpowers, commit-commands, code-review, plus a conservative core for Svelte/GSAP/Context7 workflow.
  Record the remove/keep list in the devlog *before* uninstalling.

- [ ] **Step 3: Uninstall**
  Remove the plugins per the Remove list. Verify a fresh session still functions (all core skills still available).

- [ ] **Step 4: Auto-memory hygiene**
  In `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/`:
  - Identify every `project_slice_NN_status.md` for slices that are closed and merged.
  - Create one consolidated `project_completed_slices.md` — one line per slice (number, name, merge date, any durable takeaway). Detail already lives in `docs/handoffs/` (or the cloud mirror post-Task-1) and in git.
  - Delete the individual slice-status memory files.
  - Also prune any `feedback_*.md` whose trigger is a closed-slice decision that's now baked into CONSTITUTION / brand / CLAUDE.md.
  - Update `MEMORY.md` index to reflect the consolidation.

- [ ] **Step 5: Measure delta**
  Record rule-file, plugin-skill-list, and auto-memory token deltas.

**STOP. Ask Yesid to start a fresh session and confirm nothing he relies on is missing before continuing.**

---

## Task 6: Re-measure deltas

**Files:**
- Update: `docs/devlog/2026-XX-XX-slice-17j-task-6.md`

- [ ] **Step 1: Final cold-session measurement**
  Fresh session on the 17j branch with Tasks 0–5 complete. Run `/context-budget`. Record full post-snapshot.

- [ ] **Step 2: Compute deltas**
  For every source: before, after, delta (absolute tokens + percent). Total reduction at the bottom.

- [ ] **Step 3: Record in devlog**
  Full before/after/delta table. This feeds Task 7 (skill cites real numbers) and Task 9 (handoff).

**STOP. Ask Yesid to confirm deltas look right before codifying the skill.**

---

## Task 7: Codify `token-frugal-workflow` skill

**Files:**
- Create dir: `~/.claude/skills/token-frugal-workflow/`
- Create: `SKILL.md`, optional `references/` subdir

- [ ] **Step 1: Distill research into executable patterns**
  From the 6 deep dives + Task 6 deltas, extract cross-project patterns into actionable checklists. Include:
  - Cache-window awareness (why 300s is worst-case sleep; pick under 270s or over 1200s).
  - Sub-agent delegation rules (when to dispatch, what to put in prompt, how to protect main context).
  - Plan-mode vs execution-mode discipline.
  - MCP scoping checklist for new projects (`.mcp.json` template, Keep/Disable decision matrix).
  - Auto-memory lifecycle rules (what to save, what to consolidate, when to prune).
  - Strategic-compact triggers (working-context vs startup-context ratio).
  - Post-slice hygiene ritual (mirror to cloud, prune status memory, audit plugins, re-snapshot config).

- [ ] **Step 2: Write `SKILL.md` with tight description**
  ```markdown
  ---
  name: token-frugal-workflow
  description: Use when starting a new project, auditing token usage, diagnosing cold-session bloat, or planning a long multi-session effort. NOT for routine feature work.
  ---
  ```
  Body is the distilled patterns from Step 1. References link to `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` for deep dives.

- [ ] **Step 3: Verify portability**
  Start a fresh Claude Code session in a different project (not yesid.dev). Trigger the skill by asking "how should I audit token usage in this repo?". Confirm it surfaces and gives actionable, project-agnostic guidance.

- [ ] **Step 4: Verify dormancy**
  Start a fresh session in yesid.dev, ask a routine question ("implement this button"). Confirm the skill does NOT surface. If it does, tighten description and re-test.

**STOP. Ask Yesid to verify skill behavior in a second project before continuing.**

---

## Task 8: Claude config export snapshot

**Files:**
- Create dir: `C:\Users\otalo\Yesito\cloud\claude-config\`
- Create: `user/`, `projects/yesid.dev/`, `README.md`, `snapshot.ps1`

- [ ] **Step 1: Inventory configs**
  `ls ~/.claude/` and `ls .claude/` (plus root `CLAUDE.md` + `.mcp.json`). Record what exists in each location. Identify sensitive files to exclude (`settings.local.json`, anything matching `*.local.*`).

- [ ] **Step 2: Author `snapshot.ps1`**
  PowerShell script that:
  - Takes optional `-ProjectName` (defaults to `pwd` basename).
  - Copies `~/.claude/settings.json`, `~/.claude/rules/common/`, `~/.claude/CLAUDE.md` (if present), `~/.claude/agents/*`, `~/.claude/commands/*`, `~/.claude/skills/*` → `cloud/claude-config/user/<timestamp>/`.
  - If run from a project root with a `CLAUDE.md`: copies `CLAUDE.md`, `.claude/commands/*`, `.claude/settings.json`, `.mcp.json` → `cloud/claude-config/projects/<ProjectName>/<timestamp>/`.
  - Updates `README.md` with last-snapshot timestamp + file counts per category.
  - Skips `settings.local.json` and anything matching `*.local.*`.
  - Append-only: never deletes prior snapshots.

- [ ] **Step 3: Author `README.md`**
  What's in `user/` and `projects/`, how snapshots are organized (timestamped subdirs), restore instructions (what to copy back where), sensitive-data caveat (what's excluded and why).

- [ ] **Step 4: First run**
  Execute `snapshot.ps1` from the yesid.dev repo root. Produces the post-17j snapshot — `user/<YYYYMMDD-HHmmss>/` + `projects/yesid.dev/<YYYYMMDD-HHmmss>/`.

- [ ] **Step 5: Verify**
  `ls cloud/claude-config/user/<timestamp>/` and `ls cloud/claude-config/projects/yesid.dev/<timestamp>/` — contents match inventory from Step 1 minus excluded sensitive files.

**STOP. Ask Yesid to spot-check the snapshot before final handoff.**

---

## Task 9: Handoff + commit + PR

**Files:**
- Create: `docs/handoffs/slice-17j-token-efficacy.md`
- Update: `docs/slices/slice-17-checkpoint.md`, `docs/roadmap/standardization.md`

- [ ] **Step 1: Write handoff**
  Per `docs/handoffs/_TEMPLATE.md`. Include the before/after/delta table from Task 6, the three durable outputs (knowledge base, skill, config snapshot), the Ongoing Discipline section (copy from this spec), and the cloud-mirror + knowledge-base paths.

- [ ] **Step 2: Update checkpoint + roadmap**
  Mark 17j complete in `slice-17-checkpoint.md` and `docs/roadmap/standardization.md`.

- [ ] **Step 3: Regenerate `tree.txt`**

- [ ] **Step 4: Commit + PR + merge**
  Per standard PR workflow. Branch: `feature/slice-17j-token-efficacy`.

**STOP. Slice closes when Yesid approves the final token-delta number + verifies the three durable outputs.**

---

## Execution Order

```
Task 0 (Baseline)
   └──► Task 0a (Research — 6 parallel subagents)
          └──► Task 1 (docs prune)
                 └──► Task 2 (CLAUDE.md)
                        └──► Task 3 (WORKFLOW.md)
                               └──► Task 4 (.mcp.json — informed by research 02)
                                      └──► Task 5 (global cleanup — informed by research 03 + 05)
                                             └──► Task 6 (re-measure)
                                                    └──► Task 7 (codify skill — informed by all 6 + Task 6 deltas)
                                                           └──► Task 8 (config export snapshot)
                                                                  └──► Task 9 (handoff + PR)
```

Strictly sequential **except Task 0a's 6 research agents** (explicitly approved; independent research, no shared state, main context protected via summary-only returns).

## Out of Scope

- Application code changes. Site behavior is identical before/after.
- Brand narrative edits (covered in 17h).
- CONSTITUTION.md / CSS.md / MOTION.md edits beyond cross-link fixes.
- New learning docs (docs/learn/ untouched).
- Git history rewriting. Removed content stays recoverable from git.
- Public launch prep.
- Any skill or plugin *creation* beyond `token-frugal-workflow` (this slice prunes, doesn't author new skills beyond the one codified output).
- Rewriting feedback memories (only pruning the stale ones).
- Changes to the `brand/` bundle from 17h.
- Automating `snapshot.ps1` on a schedule (cron / Task Scheduler). Manual trigger only.
- Multi-machine config sync. Export is one-way; re-importing to a new machine is a later slice if needed.
- Converting `token-frugal-workflow` into a shareable plugin / repo. Lives as a personal skill only.
- Cross-project deployment of `.mcp.json` templates. Each project configures its own allowlist.

## Acceptance Criteria

### Pruning (the yesid.dev cleanup)

- [ ] Cold-session total-token count dropped by a measurable, non-trivial amount (target: ≥25%; record actual).
- [ ] `docs/` in repo contains only: `reference/`, `learn/`, `roadmap/`, active slice checkpoint + spec + templates, `ARCHIVE.md` stub, `devlog/` and `handoffs/` containing only this slice's artifacts + their templates.
- [ ] `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` mirrors the pre-prune `docs/` tree; spot-check recovery confirmed.
- [ ] `docs/ARCHIVE.md` exists and points at cloud mirror + git history.
- [ ] `CLAUDE.md` trimmed: Completed Slices, Tool Selection Protocol, Plugins & Tools, repo-structure detail sections removed or replaced with short pointers. Cold-session self-sufficiency test passes.
- [ ] `docs/reference/WORKFLOW.md` compressed without losing phase → tool map or quality gates.
- [ ] `.mcp.json` exists at repo root; fresh session loads only the Keep list's MCP tool schemas.
- [ ] `~/.claude/rules/zh/` deleted.
- [ ] Plugin audit complete; remove/keep lists recorded in devlog; unused bundles uninstalled.
- [ ] Auto-memory consolidated: `project_completed_slices.md` exists; individual `project_slice_NN_status.md` files for closed slices deleted; `MEMORY.md` index updated.
- [ ] `bun run test` + `bun run check` green.
- [ ] Site builds and deploys identically to pre-slice.
- [ ] All cross-links from `docs/reference/**` and `docs/learn/**` into removed content are rewritten or excised (zero broken refs).
- [ ] `tree.txt` regenerated.

### Durable outputs (the portable value)

- [ ] `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` contains `00-index.md` + 6 deep-dive docs (500–1000 words each, consistent structure, sources cited, prioritizing 2025–2026 material). Index has `last-reviewed` date per doc.
- [ ] `~/.claude/skills/token-frugal-workflow/SKILL.md` exists with tight description; surfaces only on relevant triggers in a second project; remains dormant on routine work in yesid.dev.
- [ ] `C:\Users\otalo\Yesito\cloud\claude-config\` contains `user/<timestamp>/`, `projects/yesid.dev/<timestamp>/`, `README.md`, `snapshot.ps1`. First snapshot captured post-17j. `settings.local.json` excluded from export.
- [ ] Research findings visibly inform Task 4 and Task 5; devlog notes which decisions changed based on research.
- [ ] Handoff contains full before/after/delta table across all seven pruning prongs + summary of the three durable outputs.

## Risks + Mitigations

| Risk | Mitigation |
|------|------------|
| Parallel subagents return inconsistent structures → hard to consolidate | Identical output-structure prompt enforced; main session rejects any doc missing a required section and re-dispatches. |
| Research agents cite stale pre-Claude-4.7 sources | Prompt: "prioritize 2025–2026; flag and exclude anything older than 2025 unless Anthropic primary docs." |
| Skill too eager — activates on unrelated work | Tight "Use when..." description; verification step in Task 7 Step 4 tests dormancy. If it activates on routine work, tighten and re-test. |
| Config snapshot misses a file category | Task 8 Step 1 inventory pass committed to devlog *before* writing script, so audit trail exists. |
| Cloud knowledge drifts over time as Claude evolves | `00-index.md` has `last-reviewed: YYYY-MM-DD` per doc; ongoing discipline flags review cadence (every 2 slices or major Claude release). |
| Research sprint runs over context in main session | Each agent writes direct to cloud file; main session only receives 200-word summaries; even long agents don't bloat main context. |
| Skill burns tokens in projects that never need it | Description scoped to explicit triggers ("planning a new project", "auditing token usage"), not implicit. |
| First prune breaks something subtle | Cloud mirror (Task 1) + git history = full recovery; `git revert` restores removed repo content at any stage. |
| `.mcp.json` disables an MCP Yesid relies on | Task 4 Step 3 verification in fresh session; Yesid review STOP before continuing. |
| Global plugin uninstall breaks a skill dependency | Task 5 Step 3 verification after uninstall; keep list leans conservative. |

## Rollback

- **Pure-additive tasks (0a, 7, 8):** delete created files/dirs. Zero blast radius.
- **Prune tasks (1–5):** cloud mirror + git history = full recovery. `git revert` on the slice commit restores removed repo content. Global config changes (Task 5) documented in handoff for manual reversal (reinstall plugins, restore `rules/zh` from cloud snapshot).
- **No DB, no user-facing site change, no third-party side effects** — this slice is ~100% reversible.
- **Config snapshot itself (Task 8)** is append-only, so snapshotting is non-destructive; if the script misbehaves, just delete the bad snapshot subdir.

## Learn

### Context-window economics
**What it is:** Every token Claude loads at session start is a token it can't use for actual work. Cold-session overhead (system prompt + project CLAUDE.md + memory index + skill enumeration + MCP tool schemas) comes straight out of the context budget before any tool call or file read.
**Why it matters:** A 30% reduction in cold-session overhead is a ~30% increase in working context for longer sessions — it translates directly into deeper reads, longer chains, and fewer compactions mid-task.
**Try this:** Run `/context-budget` at session start, then after three large tool calls. Compare the "working context" delta to the "startup context" number — that ratio tells you where your ceiling is.

### Pruning is a one-time event, discipline is continuous
**What it is:** A big consolidation slice like 17j is a baseline reset. Without an ongoing discipline, the inventory accretes again within a few slices — same problem, new layer.
**Why it matters:** The seven prongs all re-inflate by default (every shipped slice leaves devlog + handoff; every new initiative tempts new plugins and MCP servers). The `token-frugal-workflow` skill + ongoing discipline section prevent re-accumulation.
**Try this:** At every slice close, review: does this slice's devlog/plan/spec stay in repo or mirror to cloud? Did I install any new plugin or MCP for this slice — is it still earning its keep? Does auto-memory have a new `status` file that should just be a line in `completed_slices.md`?

### Git history vs. in-repo docs
**What it is:** Git preserves everything already committed. Removing a file from the working tree does not delete it — `git show <hash>:path` and `git log -- path` both still work. A cloud mirror is insurance + human-browseability, not recovery.
**Why it matters:** It means the cost of pruning is near-zero for content we don't actively browse. The only real cost is grep-ability (historical docs no longer appear in `ripgrep` results) — which is actually the point, because that grep was part of what inflated context.
**Go deeper:** Handoffs → git log. Devlogs → git log + cloud mirror. Slice specs → git log + cloud mirror. Reference → stays in repo because it's queried daily.

### Parallel subagents protect main context
**What it is:** Dispatching six subagents in parallel, each writing directly to a cloud file and returning only a 200-word summary, is fundamentally different from doing six sequential searches in the main session.
**Why it matters:** In the main session, every tool call's output lives in the main context. In a subagent, the tool output lives in the *agent's* context and the main session only ever sees the final summary. For research-heavy work, this is a 10–50× reduction in main-context consumption.
**Try this:** Any time you have 2+ independent research questions, ask whether they can be dispatched as parallel subagents with summary-only returns instead of run sequentially in the main session.

### Portable outputs outlive the slice
**What it is:** The knowledge base + skill + config snapshot produced by 17j are not yesid.dev artifacts — they live in the cloud / global Claude config and seed every future project.
**Why it matters:** One slice's work pays dividends across N future projects. The marginal cost of making a pattern portable (tight skill description, cloud path, README with restore instructions) is tiny compared to the marginal value of not relearning it every time.
**Try this:** At the end of any infrastructure / meta slice, ask: "what here is durable beyond this project?" Name it, move it somewhere portable, document the restore path.

## Verify

1. Fresh Claude Code session on `main` after 17j merges. Run `/context-budget`. Record totals; compare to the baseline recorded in Task 0's devlog. Delta matches the handoff.
2. `ls docs/` — only `reference/`, `learn/`, `roadmap/`, `slices/`, `devlog/`, `handoffs/`, `ARCHIVE.md`. Each of `devlog/` and `handoffs/` contains only this slice's artifacts + templates.
3. `cat docs/ARCHIVE.md` — reads as a coherent pointer: what's moved, where to find it, how to recover from git.
4. `ls C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` — mirrors the pre-prune tree.
5. `git show HEAD~20:docs/devlog/<some-old-devlog>.md` — still recoverable.
6. `grep -rn "docs/devlog\|docs/handoffs\|docs/specs\|docs/plans\|docs/research\|docs/archive" docs/reference docs/learn` — zero hits (or only intentional pointers into `ARCHIVE.md`).
7. `cat CLAUDE.md | wc -l` — meaningfully shorter than pre-slice.
8. `cat .mcp.json` — scoped server list; fresh session's system reminder confirms only those tools appear.
9. `ls ~/.claude/rules/` — `common/` present, `zh/` absent.
10. `ls ~/.claude/projects/.../memory/ | grep -c "project_slice_"` — single digit. `project_completed_slices.md` exists.
11. `ls C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` — `00-index.md` + 6 deep-dive files; spot-check one doc has all required sections.
12. `ls ~/.claude/skills/token-frugal-workflow/` — `SKILL.md` present. In a second project, ask about token auditing — skill surfaces. In yesid.dev, ask a routine UI question — skill stays dormant.
13. `ls C:\Users\otalo\Yesito\cloud\claude-config\` — `user/<timestamp>/`, `projects/yesid.dev/<timestamp>/`, `README.md`, `snapshot.ps1`. `settings.local.json` absent from snapshots.
14. `bun run test` + `bun run check` — green.
15. Site renders identically on dev server — no visual or behavioral change.

## Ongoing discipline (post-17j)

Once 17j closes, these practices keep inventory from accreting again. The `token-frugal-workflow` skill surfaces them at relevant moments (new project, token audit, long planning effort):

- **Plugins:** install for the slice that needs them; uninstall when the slice closes. Don't let the skill inventory grow monotonically.
- **MCP servers:** add to `.mcp.json` per-project when needed; remove when done. New projects start from a minimal template.
- **Auto-memory:** save only *durable* facts (decisions, constraints, preferences). Per-slice status goes in the handoff, not memory. When a slice closes, its status memory rolls into `project_completed_slices.md`.
- **`docs/`:** at slice close, mirror the slice's devlog + plan + spec + handoff to `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` and remove from repo. Reference + learn stay in repo.
- **`CLAUDE.md` / `WORKFLOW.md`:** resist adding new sections unless they capture a rule or process that applies to every future slice. If it's slice-specific, it belongs in the slice spec, not the governance docs.
- **Knowledge base:** review `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\` every 2 slices or on major Claude release. Update `last-reviewed` dates; refresh sections where Claude's behavior has changed.
- **Config snapshot:** re-run `snapshot.ps1` whenever you materially change `~/.claude/` or project `.claude/` — creates a new timestamped snapshot alongside the old one.
