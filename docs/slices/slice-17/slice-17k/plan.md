# Sub-Slice 17k — Implementation Plan

**Level 2 task plan.** Each `##` heading below is a Level 3 task. Sessions = see "Session sequencing" table.

**Spec:** [`spec.md`](./spec.md) (approved 2026-04-18)
**Branch (post–branch prep):** `feature/slice-17k-cross-tool-portability`
**Est. total commits:** 7 (repo) + 4 cloud-side artifacts (no repo commits)

## Session sequencing

| Session | Type | Tasks | Tool role needed |
|---------|------|-------|------------------|
| 1 | Planning (THIS session) | Spec + Plan + log/handoff stubs | deeper-reasoning model |
| 2 | Implementation | 17k-1 · 17k-2 · 17k-3 | faster/cheaper model (execute clear plan) |
| 3 | Implementation | 17k-4 · 17k-5 · 17k-6 · 17k-7 | faster/cheaper model |
| 4 | Closing | 17k-8 + handoff finalize + PR + `slice:close` | faster/cheaper model |

Fresh session between every row (context hygiene per `AGENTS.md § Session token budget`).

---

## Branch prep (PREREQUISITE — must happen before Session 2)

Not a Level 3 task; required hygiene step because three commit layers currently sit on `feature/slice-17b-repositories`. Resolve cleanly before 17k implementation.

**Steps (user-driven; I'll assist if asked):**

1. Decide fate of the 17b content-extraction work:
   - If stable: commit on `feature/slice-17b-repositories` as `feat(slice-17b): ...` then set 17b aside.
   - If paused indefinitely: `git stash -u -m "17b WIP pause"` so the branch is clean.
2. Extract the workflow refactor as its own commit on `feature/slice-17b-repositories`:
   - Files: `AGENTS.md` (new), `CLAUDE.md` (rewritten + reverted → currently reverted state), repo-wide `claude-knowledge` → `workflow-knowledge` rename (10 files), new `docs/reference/tools/` tree, `docs/slices/slice-17/slice-17k/` (this planning output).
   - Commit shape: `chore: extract tool-agnostic workflow core + per-tool overlays (pre-17k)`.
3. Create new branch: `git checkout main && git pull && git checkout -b feature/slice-17k-cross-tool-portability`.
4. Cherry-pick the workflow-refactor commit onto the new branch.
5. Push: `git push -u origin feature/slice-17k-cross-tool-portability`.
6. Verify clean state: `git status` returns no untracked/modified files.

**STOP criterion for branch prep:** `feature/slice-17k-cross-tool-portability` branches from current main + has exactly one workflow-refactor commit + this spec/plan/log/handoff bundle committed as a second `docs(slice-17k): spec + plan` commit.

---

## Task 17k-1 — Shrink CLAUDE.md → thin pointer

**Session:** 2
**Depends on:** Branch prep complete
**Size:** ~1 min edit + verify

**Files:**
- `CLAUDE.md` — full rewrite (currently reverted to 357-line original; target ~40 lines)

**Approach:** overwrite with the thin-pointer format. Role bindings table matches the research findings.

**Canonical example (paste target):**

```markdown
# CLAUDE.md — Claude Code entry point for [yesid.dev](http://yesid.dev)

> **Read [AGENTS.md](AGENTS.md) first.** The workflow contract is there — tool-agnostic, shared with Codex.

## Claude Code role bindings (resolves AGENTS.md abstract roles)

See `docs/reference/tools/claude-code.md` for full detail.

| AGENTS.md role              | Claude Code binding                                    |
| --------------------------- | ------------------------------------------------------ |
| deeper-reasoning model      | Opus 4.7 (200k)                                        |
| deeper-reasoning model (XL) | Opus 4.7 `[1m]` (1M context)                           |
| faster/cheaper model        | Sonnet 4.6                                             |
| live progress tracker       | `TodoWrite` tool                                       |
| parallel-dispatch mechanism | `Agent` tool with `model: 'sonnet'` or `'opus'`        |
| mid-session model switch    | `/model <name>`                                        |
| context-budget check        | `/cost` or `/context-budget`                           |
| tool config                 | `.claude/settings.json` + `.mcp.json` at repo root     |
| skill invocation            | `Skill` tool                                           |

**Never Haiku.** Opus AND Sonnet are both valid per `AGENTS.md § Stage → role routing`.

## Portability note

Safe to delete — Codex runs off `AGENTS.md` + `docs/reference/tools/codex.md`. Exists only for Claude Code's native auto-load.
```

**Commit:** `docs(slice-17k): shrink CLAUDE.md to thin pointer per spec decision A`

**STOP criteria:**
- [ ] `wc -l CLAUDE.md` returns ≤ 45
- [ ] First non-empty line contains `Read [AGENTS.md]`
- [ ] Grep CLAUDE.md for `TodoWrite|Opus|Sonnet` — **only** hits should be inside the role bindings table (not in narrative prose)

---

## Task 17k-2 — Generic-term pass

**Session:** 2
**Depends on:** 17k-1

**Files (from research report):**
- `AGENTS.md` (root) — sweep for any residual Claude-specific prose I missed
- `docs/reference/WORKFLOW.md` — 5 hits
- `docs/reference/VOCAB.md` — section header + a duplicated narrative
- `brand/examples/README.md` — 1 hit

**Concrete replacements (from research):**

| File | Line | Current excerpt | Replacement |
|------|------|-----------------|-------------|
| WORKFLOW.md | 75 | "scan for uncommitted changes or commits made **outside Claude Code**" | "scan for uncommitted changes or commits made **outside the LLM tool**" |
| WORKFLOW.md | 224 | "Plans specify decisions, not boilerplate. **Claude at execution time** has full context…" | "Plans specify decisions, not boilerplate. **The LLM tool at execution time** has full context…" |
| WORKFLOW.md | 230 | "**if Claude could produce** the code in 30 seconds…" | "**if an LLM tool could produce** the code in 30 seconds…" |
| WORKFLOW.md | 342 | "Screenshot proof via **Claude Preview** for UI tasks" | "Screenshot proof via **the tool's preview feature** for UI tasks" |
| WORKFLOW.md | 535 | "**Check for uncommitted changes or commits made outside Claude Code**" | "**Check for uncommitted changes or commits made outside the LLM tool**" |
| WORKFLOW.md | 633 | "**Claude Preview** → visual verification after UI tasks" | "**Preview tool** → visual verification after UI tasks" |
| WORKFLOW.md | 663 | "**Claude Preview** → screenshot proof for UI tasks" | "**Preview tool** → screenshot proof for UI tasks" |
| VOCAB.md | 185 | section header "**Claude Code vocabulary**" | section header "**LLM tool vocabulary**" |
| brand/examples/README.md | 52 | "A fresh **Opus** instance pointed at `brand/`…" | "A fresh **LLM tool session** pointed at `brand/`…" |

**Judgment calls at execution time:** if any of the 6 Cat-C VOCAB.md specifics (cache TTL, ToolSearch, etc.) don't generalize cleanly, leave them in VOCAB.md under the renamed header — VOCAB is reference material, not prose governance. The priority is removing tool-specific language from narrative in `AGENTS.md`, `CLAUDE.md`, `WORKFLOW.md`.

**Post-edit verification commands:**

```bash
# Should return 0 hits (outside of docs/reference/tools/claude-code.md and brand/CLAUDE-DESIGN.md)
grep -rn "Claude at execution" --include="*.md" .
grep -rn "fresh Opus" --include="*.md" .
grep -rn "outside Claude Code" --include="*.md" .
grep -rn "Claude Preview" --include="*.md" .
```

**Commit:** `docs(slice-17k): generic-term pass — Claude-specific prose → LLM-tool-neutral`

**STOP criteria:**
- [ ] All 4 grep patterns above return 0 hits in governance docs
- [ ] `brand/CLAUDE-DESIGN.md` is unchanged (intentionally Claude-specific)
- [ ] `docs/reference/tools/claude-code.md` is unchanged (it's the overlay; Claude-specific is expected)
- [ ] AGENTS.md sweep — no residual "Claude" / "Opus" / "Sonnet" / "TodoWrite" / `/model` / `/cost` / `/context-budget` / `/fast` in narrative prose

---

## Task 17k-3 — Tool-attribution convention

**Session:** 2
**Depends on:** 17k-1 (so CLAUDE.md is in final thin-pointer state)

**Files:**
- `AGENTS.md` — update `## Iteration Protocol` step 4 + add a new "Session header format" subsection
- `docs/slices/_TEMPLATE-SUBSLICE/log.md` — add attribution line to session header template
- `docs/slices/_TEMPLATE-SUBSLICE/handoff.md` — add attribution lines to per-task section template

**Canonical example for session header (the pattern the convention establishes):**

```markdown
### Session 2026-04-19 10:00 — Task 17k-N
**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-N-1 (Claude Code / Opus 4.7, commit abc1234)

[session body]
```

And for `handoff.md` per-task section:

```markdown
## Task 17k-N — <short task name>
**Planned by:** <Tool name> (<model>)
**Implemented by:** <Tool name> (<model>, commit <sha>)
**Status:** shipped

[reviewer-facing summary]
```

**Execution judgment:** other fields in the existing template (e.g., Session type, summary, commits) stay as they are. Only ADD the new lines. If the current template's session heading format differs slightly from the example above, keep the existing style — just insert the two new bold lines at the top of each session block.

**AGENTS.md Iteration Protocol step 4 update:** step 4 currently says "STOP. Tell Yesid: what you built… include the budget row". Amend to include: "Session header in `log.md` and per-task section in `handoff.md` MUST include the **Tool:** attribution line per the Session header format below."

Add a short subsection in AGENTS.md titled "Session header format" right before or after the Iteration Protocol, with the canonical example above.

**Commit:** `docs(slice-17k): mandatory tool-attribution header in session + handoff templates`

**STOP criteria:**
- [ ] `AGENTS.md § Iteration Protocol` step 4 references the attribution requirement
- [ ] `AGENTS.md` has a "Session header format" subsection with the canonical example
- [ ] `docs/slices/_TEMPLATE-SUBSLICE/log.md` contains `**Tool:**` placeholder in its session template
- [ ] `docs/slices/_TEMPLATE-SUBSLICE/handoff.md` contains `**Planned by:**` and `**Implemented by:**` placeholders in its task-section template

---

## Task 17k-4 — Claude inventory document

**Session:** 3
**Depends on:** none (research complete)
**No repo commit** — this is a cloud-side artifact. Cloud sync picks it up automatically.

**File to create:** `<cloud>/workflow-knowledge/stack/inventory/claude-code.md`

**Content skeleton** (fill with research-report data already captured in this Planning session's conversation):

```markdown
# Claude Code Inventory (snapshot)

**Captured:** 2026-04-18
**Machine:** Windows 11 (Yesid's primary)
**Regenerate:** re-run the research subagent (or manually: read `~/.claude.json` + `~/.claude/settings.json` + `ls ~/.claude/plugins/`, `~/.claude/skills/`, `~/.claude/agents/`, `~/.claude/rules/`)

## MCPs
### User-scope
### Project-scope (key projects only)

## Plugins
### Enabled (N)
### Disabled-but-installed (N)

## Skills
### User-authored
### ECC-provided (count + sampling)
### Community-provided (count + names)

## Agents (16)
[table]

## Rules (71 files, 12 language dirs)
[tree summary]

## Observations
[bullets from research — duplicate registrations, unused dirs, etc.]
```

**STOP criteria:**
- [ ] File exists at the path
- [ ] All sections populated from the research data in this conversation's context
- [ ] Includes capture date + regenerate-by instructions at the top
- [ ] Under 800 lines (it's an inventory, not a manual)

---

## Task 17k-5 — Codex inventory document

**Session:** 3
**Depends on:** none

**File to create:** `<cloud>/workflow-knowledge/stack/inventory/codex.md`

**Content skeleton** (fill with Codex data captured earlier in this conversation — `~/.codex/config.toml` contents, 7 enabled + 1 disabled MCPs, 27 skills, `default.rules` prefix rules):

```markdown
# Codex Inventory (snapshot)

**Captured:** 2026-04-18
**Machine:** Windows 11 (Yesid's primary)
**Regenerate:** re-read `~/.codex/config.toml` + `ls ~/.codex/skills/` + `~/.codex/rules/default.rules` + `~/.codex/models_cache.json` (for context window)

## Config (~/.codex/config.toml)
- model: gpt-5.4
- reasoning: xhigh
- context window: 272k (effective 258k)

## MCPs
### Enabled (7)
### Disabled (1)

## Skills (27)
[list grouped by theme]

## Prefix rules (~/.codex/rules/default.rules)
[summary of the prefix_rule allowlist]

## Global AGENTS.md (~/.codex/AGENTS.md)
- empty (opportunity to populate with cross-project preferences)

## Observations
- Codex uses single model with reasoning-effort dial (no multi-model routing)
- 272k context < Opus 1M — L-slice Planning still prefers Claude Opus [1m]
- MCP set overlaps Claude on: svelte, vercel, playwright
- MCP gaps for yesid.dev: context7, chrome-devtools, gsap-master, github
```

**STOP criteria:**
- [ ] File exists with all sections populated
- [ ] Cross-tool overlap + gaps table present
- [ ] Same structure as Claude inventory for easy side-by-side comparison

---

## Task 17k-6 — Copy user-authored skill to cloud

**Session:** 3
**Depends on:** 17k-4 (same cloud-side batch)

**Source:** `~/.claude/skills/workflow-efficiency/` (user's IP; the methodology skill)
**Destination:** `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/`

**Commands:**

```bash
mkdir -p "$YESITO_CLOUD_ROOT/workflow-knowledge/stack/skills"
cp -r ~/.claude/skills/workflow-efficiency "$YESITO_CLOUD_ROOT/workflow-knowledge/stack/skills/"

# Verify byte-match
diff -r ~/.claude/skills/workflow-efficiency "$YESITO_CLOUD_ROOT/workflow-knowledge/stack/skills/workflow-efficiency"
```

**STOP criteria:**
- [ ] Destination dir exists
- [ ] `diff -r` between source and destination produces no output (identical trees)
- [ ] `SKILL.md` frontmatter has not been modified

---

## Task 17k-7 — Prune-recommendations document

**Session:** 3
**Depends on:** 17k-4 (uses Claude inventory as input)

**File to create:** `<cloud>/workflow-knowledge/stack/prune-recommendations.md`

**Content skeleton** (all items from research findings):

```markdown
# Prune Recommendations (Claude Code side)

**Generated:** 2026-04-18
**Action required:** review + execute manually; this slice does NOT auto-prune.

## Quick wins (low risk, measurable gain)

| # | Item | Location | Disk | Context impact | Command | Priority |
|---|------|----------|------|----------------|---------|----------|
| 1 | Duplicate chrome-devtools MCP | `~/.claude.json` + plugin | — | Reduce tool duplication | keep plugin version; disable standalone | HIGH |
| 2 | Orphan marketplace `chrome-devtools-plugins` | `settings.json` | — | — | `claude marketplace remove chrome-devtools-plugins` | MEDIUM |
| 3 | 9 unused language rule dirs (C++, C#, Java, Kotlin, Perl, PHP, Rust, Swift, Go) | `~/.claude/rules/` | ~45 files | Context load when scanned | `rm -rf ~/.claude/rules/{cpp,csharp,java,kotlin,perl,php,rust,swift,golang}` | MEDIUM |
| 4 | Stale plugin temp clones | `~/.claude/plugins/cache/temp_git_*` | varies | — | `rm -rf ~/.claude/plugins/cache/temp_git_*` | LOW |

## Disabled plugins still on disk (~20 MB total)

List from research (17 plugins). User decides per-plugin: keep-for-future vs remove.

| Plugin | Marketplace | Reason kept? |
|--------|-------------|--------------|
| [populate from inventory] | | |

Command pattern: `claude plugins remove <name>`

## ECC skill sprawl

94 skills from ECC plugin installed as user skills. Many cover unused stacks (Perl, Laravel, Compose-Multiplatform, etc.). Candidates for batch prune if those stacks are truly off the table for Yesid's next 6 months of work. **Recommended: defer; prune-on-demand when skill load becomes a measured problem.**

## Do NOT prune

- `workflow-efficiency` — user-authored, this is Yesid's IP
- `common/` rules dir — universal
- `typescript/`, `python/` rule dirs — active stacks
- Any of the 16 agents in `~/.claude/agents/` — all in use
- Enabled plugins (14) — in active use

## Priority order

1. Quick wins #1 (dedup chrome-devtools) + #3 (unused language dirs) → 10-min pass, meaningful context reduction
2. #2 orphan marketplace + #4 stale caches → 2-min cleanup
3. Review the 17 disabled plugins → 30-min decision; most are removable
4. ECC skill audit → deferred (only if measured problem)
```

**STOP criteria:**
- [ ] File exists
- [ ] All 4 quick-win rows populated
- [ ] Disabled-plugin table populated from inventory
- [ ] Priority order section present
- [ ] No action executed — this is a recommendation document

---

## Task 17k-8 — Cross-tool verification (Codex confirms workflow)

**Session:** 4 (Closing)
**Depends on:** 17k-1 through 17k-7 complete
**This task produces a repo commit** (the handoff update).

**Procedure:**

1. On a machine with Codex installed (Yesid's current machine), open a fresh Codex session in the yesid.dev repo.
2. Prompt Codex: "Read AGENTS.md and docs/reference/tools/codex.md in this repo. Summarize the workflow in your own words, call out any abstract role you don't have a binding for, and list anything that seems ambiguous or missing from the Codex side."
3. Capture Codex's response.
4. Append a "## Cross-tool verification (Task 17k-8)" section to `docs/slices/slice-17/slice-17k/handoff.md` with:
   - Date + Codex model/reasoning used
   - Codex's summary of the workflow (verbatim or trimmed)
   - Gaps / confusions Codex identified (if any)
   - Yesid's decision on each gap: fix-forward this slice, defer to follow-up, or dismiss
5. If Codex flags a gap the team agrees to fix this slice, add an amendment to `spec.md` and a new task 17k-8a with a fix commit.

**Judgment at execution time:** if Codex's summary matches the intent of `AGENTS.md` and it explains the slice hierarchy + Iteration Protocol + role bindings cleanly, verification passes with no amendments. If Codex misreads or flags confusion, treat it as valuable signal — don't ignore.

**Commit:** `docs(slice-17k): handoff — cross-tool verification with Codex (gpt-5.4)`

**STOP criteria:**
- [ ] `handoff.md` has a "Cross-tool verification" section with Codex's response captured
- [ ] Any Codex-flagged gap has a Yesid decision recorded
- [ ] If amendments were needed, spec.md Amendments log updated

---

## Closing (Session 4, after 17k-8)

Per `AGENTS.md § Slice Closing`:

1. **Finalize `handoff.md`** — Summary + PR body sections.
2. **Update `docs/reference/` governance docs** as needed. Likely updates:
   - `WORKFLOW.md` — the changes from 17k-2 already land it.
   - `VOCAB.md` — if any new terms ("LLM tool", tool attribution) are introduced in prose, add them.
   - No CSS/MOTION/TESTS changes expected.
3. **OS-quirks?** — unlikely for a docs-only slice. If any platform-specific issue surfaced during implementation (unlikely), append to `<cloud>/workflow-knowledge/os-quirks/<os>.md`.
4. **Durable patterns to `<cloud>/yesid.dev/docs/learn/`?** — the tool-agnostic workflow split itself is worth a write-up here: `<cloud>/yesid.dev/docs/learn/workflow/tool-agnostic-agents-md-pattern.md` capturing the pattern for future projects.
5. **Regenerate `tree.txt`.**
6. **Commit + push + `gh pr create`** — PR body from handoff.md.
7. **After PR squash-merges:** `bun run slice:close 17 k`.

## Risks (updated from spec)

| Risk | Mitigation status |
|------|-------------------|
| Branch prep not done cleanly | Prerequisite section explicit; user approval required before Session 2 |
| Codex verification reveals a structural gap | Fix-forward in 17k-8a; spec amendment |
| Pruning recommendations executed prematurely | Document is recommend-only; no commands fired this slice |
| Generic "LLM tool" term reads awkwardly | Execution-time judgment: fallback to "the tool" or "your AI coding tool" where prose demands |

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-18 | Initial draft | Planning session output |
