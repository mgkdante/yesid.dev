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

### Task 17k-4 — Claude inventory document

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

### Task 17k-5 — Codex inventory document

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

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
