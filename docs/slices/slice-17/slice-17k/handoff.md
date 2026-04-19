# Sub-Slice 17k — Handoff

Self-appending. Gains a per-task section as tasks land. Finalized at PR. PR body is derived from this.

**Sub-slice:** 17k — Cross-Tool Workflow Portability
**Spec:** [`spec.md`](./spec.md) (approved 2026-04-18)
**Plan:** [`plan.md`](./plan.md)
**Branch (post-prep):** `feature/slice-17k-cross-tool-portability`

---

## Task sections (fill as tasks land)

### Task 17k-1 — Shrink CLAUDE.md → thin pointer

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

_(Summary goes here when task ships.)_

### Task 17k-2 — Generic-term pass

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

### Task 17k-3 — Tool-attribution convention

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Modified: `AGENTS.md` — added the canonical session-header format and made STOP-time tool attribution mandatory
- Modified: `docs/reference/tools/codex.md` — replaced the Codex overlay stub with verified role bindings, capability notes, and explicit gaps
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/log.md` — added `Tool`, `Session type`, and `Picking up from` placeholders and a timestamped session heading
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/handoff.md` — added `Planned by` / `Implemented by` placeholders to the reusable task template
- Modified: `docs/slices/slice-17/slice-17k/spec.md` — logged the Codex self-research amendment that supersedes the earlier "no plugin concept" assumption
- Modified: `docs/slices/slice-17/slice-17k/plan.md` — logged the expanded Session 2 overlay-population scope
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 2 implementation details and verification results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-3 now covers both halves of the portability contract: repo-level attribution discipline and Codex-side self-description. `AGENTS.md` now requires explicit tool provenance in `log.md` / `handoff.md`, the reusable slice templates include the needed placeholders, and the Codex overlay no longer hides unknowns behind `TBD`. It now documents verified native counterparts for the tracker, subagents, context checks, skills, memories, hooks, rules, web search, Fast mode, plugins, agents, and Codex's external-config import bridge from Claude.

**Decisions:**
- D001: Codex plugins are the installable bundle layer; skills remain the authoring unit and MCPs remain the tool/server layer.
- D002: The overlay should state real gaps explicitly instead of implying parity that is not yet verified.
- D003: `~/.agents/skills` belongs in the portability story on this machine because the Codex app imports external skills there.

**Tests:** PASS — `bun run test` (83 files / 822 tests) and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-4 — Registry schema

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Created: `<cloud>/workflow-knowledge/stack/registry.jsonc` — first machine-readable schema for cross-tool stack items
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3 implementation details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-4 creates the actual machine-readable foundation that later tasks will populate and apply. The registry is intentionally scoped to installable, cross-tool artifacts only: MCPs, skills, plugins, and agents. Each category now has a canonical commented example, a shared `install_in` contract, a tool-neutral `source` block, and a per-tool `tools` map for the native differences that matter at install time.

**Decisions:**
- D004: The registry should stay narrow and executable, not turn into a dumping ground for every agent capability.
- D005: Hooks, rules, and memories are explicitly deferred because they do not yet have a clean portable install story across Claude Code and Codex.
- D006: Agents are modeled as per-tool native files because Codex and Claude do not share one file format.
- D007: Skill sources should point at cloud-managed paths so the registry remains the source of truth.

**Tests:** PASS — TypeScript JSONC parse validation, `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-5 — Populate registry

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Modified: `<cloud>/workflow-knowledge/stack/registry.jsonc` — populated with concrete MCP, skill, and plugin entries from the live Claude/Codex inventories
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3 implementation details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-5 turns the registry schema into a usable source of truth. The file now contains the current 8-entry Codex MCP set, the workflow-owned cross-tool `workflow-efficiency` skill, and the full currently enabled Claude plugin bundle set. The registry is explicit that Codex does have plugin support, but it does not pretend we already know the correct Codex marketplace/package IDs for those plugins when this machine has not actually installed and verified them yet.

**Decisions:**
- D008: The registry should capture reproducible install targets, not become a raw machine dump.
- D009: Concrete standalone MCP entries currently come from Codex config; Claude-side comparable capabilities are represented through plugin bundles when that is how they are actually installed today.
- D010: Codex plugin support is documented, but no unverified Codex plugin package IDs are pinned yet.
- D011: `workflow-efficiency` is the only skill entry in scope for this slice's managed registry.

**Tests:** PASS — TypeScript JSONC parse validation, `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-6 — Copy user-authored skill

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

### Task 17k-7 — Prune-recommendations document

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

### Task 17k-8 — Cross-tool verification (Codex)

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Verified by:** _(pending — will be Codex)_
**Status:** _(pending)_

---

## Summary (fill at PR)

_(One-paragraph what-changed overview. Reviewer-facing.)_

## PR body (fill at PR)

_(Derived from the task sections above. Markdown structure ready for `gh pr create --body`.)_
