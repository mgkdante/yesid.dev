# <slice-name> — Devlog

> **Self-appending session record for this slice.** Every session spent on the slice — across all its sub-slices and tasks — appends one block here. This is the slice's running history: who worked on it, when, what happened, what carried over. Cross-tool continuity record (Claude Code AND Codex append to the same file).

> **Scope rules (D19):**
> - Devlog lives at **slice level 1** only. Sub-slices do NOT get their own devlog — their session history rolls up here.
> - Tasks (level 3) use the tool's built-in progress tracker (TodoWrite for Claude Code, equivalent for Codex). NO task-level files.
> - This file is **append-only**. Never edit past `## Session` blocks. Mistakes get amended in a fresh session block, not by rewriting history.
> - Each session block carries **tool attribution** (`Tool:` / `Session type:` / `Focus:` / `Picking up from:`) so cross-tool handoffs are auditable per AGENTS.md § Session header format + D12.

---

## Session <YYYY-MM-DD HH:MM> — <session-type>

**Tool:** <!-- FILL IN: Claude Code (Opus 4.7 [1m], reasoning=high) | Codex (gpt-5.4, reasoning=medium) | Codex cloud | etc. -->
**Session type:** <!-- FILL IN: Planning | Implementation | Closing | Non-slice -->
**Focus:** <!-- FILL IN: sub-slice or ad-hoc topic worked on this session (e.g., "Sub-slice <a>, Tasks 3–5") -->
**Picking up from:** <!-- FILL IN: prior session's last commit SHA + one-line subject, or "fresh" for the first session -->

### What happened

<!-- FILL IN: prose record of the session. Decisions made, what got built, what broke, what got deferred, surprises. Short but substantive — future-you (or another tool) should be able to resume from this alone without reopening every file.

Cover at least:
- What tasks landed (refer to TodoWrite snapshot below for status)
- Key decisions (D-numbered if added to spec/plan)
- What broke + how it was fixed
- What was deferred + to where (sub-slice / next slice / handoff Follow-ups)
- Any scope amendment + reason
-->

### Commits

<!-- FILL IN: list of commit SHAs + one-line subjects produced this session. One per line. Include cross-repo commits when relevant.

Example:
- `abc1234` — feat(<slice>): implement <thing>
- `def5678` — fix(<slice>): address review comment on <thing>
- `cms-1234` — feat(<slice>): cross-repo schema update
-->

### Tasks status (TodoWrite snapshot at session close)

<!-- FILL IN: copy the live tracker state at session end. This is the resume point for the next session.

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | <task title> | ✅ done | abc1234 |
| 2 | <task title> | 🔄 in progress | — |
| 3 | <task title> | ⏳ pending | — |
-->

### Outstanding

<!-- FILL IN: what's unfinished, carried to the next session. Reference sub-slice / task tag where applicable. Be specific — "finish Task 4 step 3 (write the integrity test)" beats "continue work".

- <!-- task <slice-tag>-N step M — <what to do> -->
- <!-- decision deferred: Q<N> from spec — needs <input> -->
- <!-- review feedback to address: <link or summary> -->
-->

### Budget

<!-- FILL IN: closing context-usage row using the AGENTS.md § Session header format shape. Required so the next session knows whether to start fresh or continue.

Format:
Model: <name> | Context: <used> / <window> (<%>) — <state>

Example:
Model: Opus 4.7 [1m] | Context: 142k / 1M (14%) — comfortable, continuing

Optional additions:
- Wall-clock duration: ~Nh
- Mid-session model switches: none / Sonnet 4.6 → Opus 4.7 at task <N> for <reason>
- Notes: <e.g., "next session: drop to Sonnet 4.6 for Implementation — Planning Q&A doesn't need re-hydration">
-->

---

<!-- Every new session appends a fresh `## Session ...` block ABOVE this line. Past blocks NEVER get modified. If you discover a past block was wrong, note the correction in the current session's "What happened" section — do not edit history. -->

## Appendix — session index

> Rolling index for quick scroll. Update each session. Helps cross-tool handoffs find the right block fast.

| Date | Type | Tool | Focus | Outstanding at end |
|------|------|------|-------|---------------------|
| <!-- YYYY-MM-DD --> | <!-- Planning \| Implementation \| Closing --> | <!-- Claude / Codex --> | <!-- focus --> | <!-- one-line carryover --> |

## Appendix — exemplar session block (delete before first real session)

> Concrete example of what a filled-in session block looks like. Delete this section once your first real session block lands above.

```markdown
## Session 2026-04-22 14:30 — Implementation

**Tool:** Claude Code (Opus 4.7 [1m], reasoning=high)
**Session type:** Implementation
**Focus:** Sub-slice <a>, Tasks 3–5
**Picking up from:** commit b89242a — "docs(slice-<name>): draft plan + spec"

### What happened

Implemented Tasks 3 and 4 of sub-slice <a>. Task 3 (data model migration) landed first-pass — single-commit `feat(slice-<a>): add <table> migration`, all 12 new unit tests green. Task 4 (adapter wiring) needed two iterations: first pass missed the locale-fallback edge case from spec D2; reviewer flagged, fixed in commit `def5678`, second STOP green.

Decisions:
- D-7 (added mid-execution): the migration uses BIGINT for `id` not UUID — chose BIGINT for query speed; tradeoff is no client-generated IDs, but acceptable since this collection is admin-write-only. Logged in spec § Amendments.

Deferred:
- Task 5 (UI binding) — pulled forward to next session due to budget at 68% (pre-break zone). Owner approved.
- Q-3 from spec (cache invalidation strategy) — still open, parked for sub-slice <b>.

### Commits

- `abc1234` — feat(slice-<a>): add `<table>` migration + 12 unit tests
- `def5678` — fix(slice-<a>): handle missing-locale fallback in adapter (review feedback)

### Tasks status (TodoWrite snapshot at session close)

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Spec amendment for D-7 | ✅ done | abc1234 |
| 2 | Migration for `<table>` | ✅ done | abc1234 |
| 3 | Adapter wiring | ✅ done | def5678 |
| 4 | UI binding | ⏳ pending | — |
| 5 | Integration test | ⏳ pending | — |

### Outstanding

- Task 4 (UI binding): start next session with `src/components/<X>.tsx`, follow plan.md § Task 4 steps 1–4.
- Task 5 (integration test): runs after Task 4 lands.
- Q-3 (cache invalidation): parked for sub-slice <b>; logged in handoff.md § Open items for downstream tasks.

### Budget

Model: Opus 4.7 [1m] | Context: 680k / 1M (68%) — pre-break zone, stopping cleanly

- Wall-clock: ~3h
- Mid-session model switches: none
- Notes: next session can drop to Sonnet 4.6 — Tasks 4–5 are pattern-following per spec; no novel design needed. Re-read spec § Architecture + plan § Task 4–5 only; skip Planning Q&A history.
```
