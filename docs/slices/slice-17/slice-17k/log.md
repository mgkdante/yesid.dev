# Sub-Slice 17k — Work Log

Running record. Session-by-session. Appended as work happens.

---

### Session 2026-04-18 — Planning

**Tool:** Claude Code (Opus 4.7 `[1m]`)
**Session type:** Planning
**Size:** L

**What happened:**

- Started as a conversational design discussion about cross-tool workflow portability (Claude ↔ Codex). Evolved into a non-slice refactor (AGENTS.md + overlays + cloud rename) committed to this branch's working tree before being formally scoped.
- User surfaced additional requirements mid-discussion: generic-language pass, mirror Claude setup inventory, MCP audit permission, cross-tool log continuity.
- Size re-declared as **L** (multi-session, ≥10 design decisions, cross-cutting across repo + cloud + user-level configs).
- Dispatched 2 read-only research subagents (approved by Yesid) in parallel:
  1. **Claude inventory** (general-purpose / Sonnet): scanned `~/.claude.json`, `~/.claude/settings.json`, `~/.claude/{plugins,skills,agents,rules}/`. Output: structured inventory of 14 enabled plugins, 117 skills, 16 agents, 71 rule files, MCP declarations. Key finding: user-scope MCP list is effectively empty (healthy discipline); all MCP surface comes via plugins.
  2. **Repo language scan** (Explore / Sonnet): found 16 substantive hits — 8 "make-generic" + 6 "move-to-overlay" + 0 dead links. Smaller surface than feared.
- Consolidated findings + user's A–F decisions into `spec.md`.
- Decisions locked (A-thin-pointer / B-"LLM tool" / C-inventory+recommend / D-hybrid-skill-copy / E-now / F-attribution-mandatory).
- User confirmed CLAUDE.md revert was accidental — decision A stands.
- User approved spec.
- Wrote `plan.md` with 8 Level 3 tasks + Branch prep prerequisite + Session sequencing + per-task STOP criteria.
- Wrote this log + `handoff.md` stub.

**Decisions made this session:**

1. Three-layer workflow file structure (AGENTS.md core + CLAUDE.md thin pointer + per-tool overlays) formalized.
2. "LLM tool" / "LLM tools" adopted as the generic term replacing narrative "Claude" references.
3. Tool-attribution header (`**Tool:** <name> (<model>)`) becomes mandatory on every session header + handoff per-task section.
4. Inventory format: full markdown lists for everything; literal-copy only for user-authored content (the `workflow-efficiency` skill).
5. MCP/plugin pruning: inventory + recommend only this slice; no auto-prune.
6. Cloud structure: `<cloud>/workflow-knowledge/stack/` hosts inventories + user-authored skill copies + prune recommendations.
7. Git state needs resolving before Session 2 — prerequisite noted in plan.md, not a 17k task.

**Artifacts produced:**

- `docs/slices/slice-17/slice-17k/spec.md`
- `docs/slices/slice-17/slice-17k/plan.md`
- `docs/slices/slice-17/slice-17k/log.md` (this file)
- `docs/slices/slice-17/slice-17k/handoff.md` (stub)

**Working-tree state at session end (pre-branch-prep):** uncommitted — currently on `feature/slice-17b-repositories`, mixed with paused 17b work and workflow-refactor precursor changes. Must be resolved before Session 2 per plan.md "Branch prep" section.

**Budget row:**

```
Model: Opus 4.7 [1m] | Context: ~400k / 1M (~40%) — comfortable, continuing
```

**Next session:** Implementation (Session 2) — Tasks 17k-1, 17k-2, 17k-3. Faster/cheaper model role. Start with `git status` to verify branch prep landed cleanly.

---

### Session 2026-04-18 19:55 — Task 17k-3

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Planning 2026-04-18 (Claude Code / Opus 4.7 [1m], commit 281dfe4) + bootstrap (Claude Code / Opus 4.7 [1m], commit bc10f13)

**Goal:** Land the tool-attribution convention and replace the Codex overlay stub with verified native counterparts and explicit gaps.

**Commands run:**
```bash
git status --short --branch
git show bc10f13 --format=%B --no-patch
bun run test
bun run check
```

**Files touched:**
- Modified: `AGENTS.md`
- Modified: `docs/reference/tools/codex.md`
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/log.md`
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/handoff.md`
- Modified: `docs/slices/slice-17/slice-17k/spec.md`
- Modified: `docs/slices/slice-17/slice-17k/plan.md`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D001: Treat Codex plugins as the installable bundle/distribution layer, not as a synonym for MCPs or skills.
- D002: Document verified Codex gaps explicitly instead of leaving `TBD` rows in the overlay (for example: no separately verified Codex-local XL binding yet; app-local `/model` is not currently documented).
- D003: Include the Codex app's external-config import bridge in the portability story because it can reuse Claude skills and enabled-plugin state.

**Errors encountered:**
- Problem: Bundled `rg.exe` could not start from the Windows Codex app package (`Access is denied`)
  Cause: the packaged binary was not executable from this environment
  Fix: switched to native PowerShell search (`Select-String`, `Get-Content`)
  Resolved: yes
- Problem: `bun run test` emitted happy-dom `AbortError` teardown noise and unrelated local-server connection refusals after reporting a green run
  Cause: pre-existing test teardown behavior outside this docs-only task
  Fix: kept the run, because Vitest exited `0` with 83/83 files and 822/822 tests passing; recorded the noise here instead of hiding it
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing Svelte warnings + happy-dom teardown noise did not fail the run |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** Added the mandatory `Session header format` section and STOP-time attribution rule to `AGENTS.md`, updated the reusable sub-slice templates with `Tool` / `Session type` / `Picking up from` and `Planned by` / `Implemented by` placeholders, and replaced the Codex overlay stub with verified role bindings, capability notes, and explicit gaps. The session also logged plan/spec amendments because Codex parity is stronger than the planning session assumed: native plugins, file-based custom agents, hooks, memories, web search, Fast mode, and an external-config import bridge are now documented.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```

---

### Session 2026-04-18 20:14 — Task 17k-4

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-3 (Codex / gpt-5.4, commit 777d70f)

**Goal:** Design the machine-readable stack registry schema at `<cloud>/workflow-knowledge/stack/registry.jsonc`.

**Commands run:**
```bash
bun -e "<TypeScript JSONC parse validation>"
bun run test
bun run check
```

**Files touched:**
- Created: `<cloud>/workflow-knowledge/stack/registry.jsonc`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D004: The registry covers only installable cross-tool artifacts: MCPs, skills, plugins, and agents.
- D005: Hooks, rules, and memories stay out of `registry.jsonc` for now and are explicitly marked as deferred categories instead of being forced into a fake portable schema.
- D006: Agent entries are modeled as per-tool native artifacts because Claude and Codex use different on-disk formats.
- D007: Skill entries use path-relative sources so the cloud registry can act as the portable source of truth instead of pointing back to a home-directory snapshot.

**Errors encountered:**
- Problem: the first JSONC-parse wrapper used invalid PowerShell inline `if (...)` syntax
  Cause: I wrote Bash-style inline conditional syntax inside a PowerShell expression
  Fix: reran the validation with a proper PowerShell variable assignment and TypeScript's JSONC parser
  Resolved: yes
- Problem: `bun run test` again emitted pre-existing local-server `ECONNREFUSED :3000` noise after the green summary
  Cause: existing test teardown behavior unrelated to this registry-schema task
  Fix: kept the run because Vitest still exited `0`; recorded the noise here
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `bun -e "<TypeScript JSONC parse validation>"` | PASS — `registry.jsonc` parsed successfully as JSONC |
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing teardown noise persisted |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** Created the first version of `<cloud>/workflow-knowledge/stack/registry.jsonc` with a deliberately narrow schema: top-level metadata plus `mcps`, `skills`, `plugins`, and `agents` arrays, each documented with a canonical commented example. The schema now distinguishes bundle-layer plugins from skills and MCPs, supports per-tool overrides through a `tools` map, allows version/ref pinning where useful, and records deferred categories (`hooks`, `rules`, `memories`) instead of pretending they already have a portable install story.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```
