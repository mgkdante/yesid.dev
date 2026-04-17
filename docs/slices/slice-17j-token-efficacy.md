# Slice 17j — Token Efficacy (Consolidated Token Utilization)

**Status:** draft
**Priority:** 2
**Estimated effort:** 2–3 sessions (1 planning/measurement, 1–2 execution)
**Depends on:** Slice 17h merged to `main`
**Parent slice:** 17 (Standardization). 17j is the operational-efficiency close to slice 17 — once the visual/design/brand work settles in 17h, 17j resets the per-session context baseline so future slices start light.

## Objective

Reduce the token weight Claude auto-loads at the start of every session — across the repo, the project config, the global Claude config, installed plugins, connected MCP servers, and auto-memory — in a single consolidated pass, and record a measurable before/after delta.

## Context

Token consumption per session in this project has grown heavy. Accretion across 20+ slices has inflated six distinct sources, each loaded every cold session regardless of the task at hand:

1. **`docs/`** — devlogs, handoffs, specs, plans, research, archive from every completed slice. Rarely referenced mid-session but inflate any broad read and show up in searches.
2. **`CLAUDE.md`** — ~500 lines with sections that duplicate content now living in `WORKFLOW.md`, `tree.txt`, and (post-17h) `brand/`.
3. **`docs/reference/WORKFLOW.md`** — expanded during slice 17 thrash; some sections are now stable enough to compress.
4. **`~/.claude/rules/zh/`** — full Chinese translation of every `common/` rule file. Yesid is English-only; pure duplication, loaded every session for every project.
5. **`~/.claude/` installed plugins** — hundreds of skills enumerated in the session-start system reminder. Many plugin bundles are unused or duplicated (e.g., `everything-claude-code` overlaps other installs).
6. **Connected MCP servers** — firefox-devtools, webflow, cloudflare, railway, neon, postman, notion, videodb, jobs, tax, calendar, etc. — each ships tool schemas into every session, for every project, regardless of relevance.
7. **Auto-memory** — ~20 `project_slice_NN_status.md` entries for shipped slices, plus stale feedback memories tied to closed work.

17j is the one-time consolidation that resets the baseline. After this slice, discipline (captured in the Ongoing section) keeps inventory from accreting again.

## Architecture

- **No application code changes.** Site behavior is identical before/after. This is a docs + config + environment slice.
- **Repo-side changes** (prongs 1–4): commit on the 17j branch, ship in one PR.
- **Global Claude config changes** (prongs 5–7): happen on Yesid's machine in `~/.claude/` and the project-scoped auto-memory directory. Not versioned, but recorded in the handoff.
- **Historical docs preserved out-of-repo.** `C:\Users\otalo\Yesito\cloud\yesid.dev\` mirrors the folder tree; git history retains the originals; a short in-repo `docs/ARCHIVE.md` stub points at both.
- **Measurement is the spine.** Baseline before any prong, re-measure after. Delta is the acceptance metric.

## Tech Stack

Markdown + TypeScript config. No runtime dependencies. Tools used:

- `/context-budget` slash command (or `context-budget` skill) for baseline + re-measurement of cold-session token count.
- `cp -r` / `robocopy` for the docs mirror.
- `grep` for cross-link scrub.
- Editing tools for CLAUDE.md, WORKFLOW.md, `.mcp.json`.

## File Structure

### New files

```
.mcp.json                                            — CREATE: project-scoped MCP allowlist for yesid.dev
docs/ARCHIVE.md                                      — CREATE: stub pointing at the cloud mirror + git history
```

### Modified files (repo)

```
CLAUDE.md                                            — slim: cut Completed Slices, Tool Selection Protocol, Plugins & Tools, repo structure detail
docs/reference/WORKFLOW.md                           — slim: compress sections that stabilized after 17-era thrash
tree.txt                                             — regenerate at end of slice
docs/slices/slice-17-checkpoint.md                   — update with 17j status
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

### Outside repo (global config — not versioned, documented in handoff)

```
~/.claude/rules/zh/                                  — DELETE entirely
~/.claude/plugins/**                                  — AUDIT and uninstall unused bundles
~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/  — consolidate slice-status files
```

## Tech Stack Rationale

No new dependencies. Baseline + re-measurement use the built-in `context-budget` slash command (already in Yesid's skill inventory). Mirror operation uses OS-native tools (PowerShell `robocopy` on Windows). Grep is ripgrep (already installed for Claude Code).

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

- [ ] **Step 1: Inventory current MCP servers**
  List every MCP server currently connected globally. For each, decide: needed for yesid.dev or not?
  **Keep for yesid.dev:** Svelte MCP, GSAP Master, Context7, Chrome DevTools, Claude Preview, GitHub, Vercel, Figma (occasional), Playwright (occasional).
  **Disable for yesid.dev:** firefox-devtools, webflow, cloudflare, railway, neon, postman, notion, videodb, jobs, tax, calendar, shadcn (Svelte project, not React), mcp-registry, webflow, and any others not in the Keep list.

- [ ] **Step 2: Author `.mcp.json`**
  Write a project-scoped `.mcp.json` that enables only the Keep list. Reference the Claude Code MCP scoping docs — use `enabledMcpjsonServers` / `disabledMcpjsonServers` as appropriate, or the equivalent project-allowlist mechanism.

- [ ] **Step 3: Verify in a fresh session**
  New session — confirm the skill-list system reminder shows only the Keep list's tools. No `firefox-devtools__*`, no `webflow__*`, etc.

- [ ] **Step 4: Measure delta**
  Record MCP tool-schema token delta.

**STOP. Ask Yesid to confirm no needed MCP is accidentally disabled before continuing.**

---

## Task 5: Global Claude config cleanup (non-repo)

**Files:** (outside the repo; document in devlog + handoff only)

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

## Task 6: Re-measure + handoff + commit

**Files:**
- Create: `docs/handoffs/slice-17j-token-efficacy.md`
- Update: `docs/slices/slice-17-checkpoint.md`
- Update: `docs/roadmap/standardization.md`

- [ ] **Step 1: Final cold-session measurement**
  Fresh session on `main` after PR merged (or on the 17j branch with all tasks complete). Run `/context-budget`. Record the full post-snapshot.

- [ ] **Step 2: Compute deltas**
  For every source: before, after, delta (absolute tokens + percent). Total reduction at the bottom.

- [ ] **Step 3: Write handoff**
  Per `docs/handoffs/_TEMPLATE.md`. Include the deltas table, the Ongoing Discipline section (copy from this spec), and the cloud-mirror path for historical recovery.

- [ ] **Step 4: Update checkpoint + roadmap**
  Mark 17j complete in `slice-17-checkpoint.md` and `docs/roadmap/standardization.md`.

- [ ] **Step 5: Commit + PR + merge**
  Per standard PR workflow. Branch: `feature/slice-17j-token-efficacy`.

**STOP. Slice closes when Yesid approves the final token-delta number.**

---

## Execution Order

```
Task 0 (Baseline) ──► Task 1 (docs prune) ──► Task 2 (CLAUDE.md) ──► Task 3 (WORKFLOW.md) ──► Task 4 (.mcp.json) ──► Task 5 (global) ──► Task 6 (re-measure + handoff)
```

Strictly sequential. No parallelization — each task's measurement depends on the previous state being stable. Task 5 (global config) is sequenced last among prongs so the repo-side PR is reviewable without global-config coupling.

## Out of Scope

- Application code changes. Site behavior is identical before/after.
- Brand narrative edits (covered in 17h).
- CONSTITUTION.md / CSS.md / MOTION.md edits beyond cross-link fixes.
- New learning docs (docs/learn/ untouched).
- Git history rewriting. Removed content stays recoverable from git.
- Public launch prep.
- Any skill or plugin *creation* — this slice only prunes, doesn't author.
- Rewriting feedback memories (only pruning the stale ones).
- Changes to the `brand/` bundle from 17h.

## Acceptance Criteria

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
- [ ] Handoff contains full before/after/delta table across all seven prongs.
- [ ] `tree.txt` regenerated.

## Learn

### Context-window economics
**What it is:** Every token Claude loads at session start is a token it can't use for actual work. Cold-session overhead (system prompt + project CLAUDE.md + memory index + skill enumeration + MCP tool schemas) comes straight out of the context budget before any tool call or file read.
**Why it matters:** A 30% reduction in cold-session overhead is a ~30% increase in working context for longer sessions — it translates directly into deeper reads, longer chains, and fewer compactions mid-task.
**Try this:** Run `/context-budget` at session start, then after three large tool calls. Compare the "working context" delta to the "startup context" number — that ratio tells you where your ceiling is.

### Pruning is a one-time event, discipline is continuous
**What it is:** A big consolidation slice like 17j is a baseline reset. Without an ongoing discipline, the inventory accretes again within a few slices — same problem, new layer.
**Why it matters:** The seven prongs all re-inflate by default (every shipped slice leaves devlog + handoff; every new initiative tempts new plugins and MCP servers). Only the ongoing discipline section prevents re-accumulation.
**Try this:** At every slice close, review: does this slice's devlog/plan/spec stay in repo or mirror to cloud? Did I install any new plugin or MCP for this slice — is it still earning its keep? Does auto-memory have a new `status` file that should just be a line in `completed_slices.md`?

### Git history vs. in-repo docs
**What it is:** Git preserves everything already committed. Removing a file from the working tree does not delete it — `git show <hash>:path` and `git log -- path` both still work. A cloud mirror is insurance + human-browseability, not recovery.
**Why it matters:** It means the cost of pruning is near-zero for content we don't actively browse. The only real cost is grep-ability (historical docs no longer appear in `ripgrep` results) — which is actually the point, because that grep was part of what inflated context.
**Go deeper:** Handoffs → git log. Devlogs → git log + cloud mirror. Slice specs → git log + cloud mirror. Reference → stays in repo because it's queried daily.

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
11. `bun run test` + `bun run check` — green.
12. Site renders identically on dev server — no visual or behavioral change.

## Ongoing discipline (post-17j)

Once 17j closes, these practices keep inventory from accreting again:

- **Plugins:** install for the slice that needs them; uninstall when the slice closes. Don't let the skill inventory grow monotonically.
- **MCP servers:** add to `.mcp.json` per-project when needed; remove when done.
- **Auto-memory:** save only *durable* facts (decisions, constraints, preferences). Per-slice status goes in the handoff, not memory. When a slice closes, its status memory rolls into `project_completed_slices.md`.
- **`docs/`:** at slice close, mirror the slice's devlog + plan + spec + handoff to `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` and remove from repo. Reference + learn stay in repo.
- **`CLAUDE.md` / `WORKFLOW.md`:** resist adding new sections unless they capture a rule or process that applies to every future slice. If it's slice-specific, it belongs in the slice spec, not the governance docs.
