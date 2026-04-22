# <slice-name> — Devlog

**Self-appending session record for this slice.** Every session spent on the slice — across all its sub-slices and tasks — appends one block here. This is the slice's running history: who worked on it, when, what happened, what carried over.

**Scope rules (D19):**
- Devlog lives at **slice level 1** only. Sub-slices do not get their own devlog — their progress rolls up here.
- Tasks (level 3) use the tool's built-in progress tracker (TodoWrite for Claude Code, equivalent for Codex). No task-level files.
- This file is append-only. Never edit past session blocks.

---

## Session <YYYY-MM-DD HH:MM> — <session-type>

**Tool:** <!-- FILL IN: Claude Code / Codex desktop / Codex cloud -->
**Session type:** <!-- FILL IN: Planning | Implementation | Closing -->
**Focus:** <!-- FILL IN: sub-slice or ad-hoc topic worked on this session -->
**Picking up from:** <!-- FILL IN: prior session's last commit SHA, or "fresh" for the first session -->

### What happened

<!-- FILL IN: prose record of the session. Decisions made, what got built, what broke, what got deferred. Short but substantive. Future-you should be able to resume from this alone. -->

### Commits

<!-- FILL IN: list of commit SHAs + one-line subjects produced this session. -->

### Outstanding

<!-- FILL IN: what's unfinished, carried to the next session. Reference sub-slice / task if applicable. -->

### Budget

<!-- FILL IN (optional): context-usage %, wall-clock duration, model switches. Useful for session-efficiency retrospection. -->

---

<!-- Every new session appends a fresh `## Session ...` block ABOVE this line. Past blocks never get modified. -->

## Appendix — session index

Rolling index for quick scroll. Update each session.

| Date | Type | Focus | Outstanding at end |
|------|------|-------|---------------------|
| <!-- FILL IN per session --> | | | |
