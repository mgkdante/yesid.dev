# Handoff — Sub-Slice NN<letter> <Name>

**Self-appending.** Starts as a stub at sub-slice kickoff. Grows a `### Task NN<letter>-N` section each time a Level 3 task lands. Finalized with `## Summary` and `## PR Body` at PR time.

**Status:** in progress | closing | shipped
**PR:** pending | #nn
**Spec:** `./spec.md` | **Plan:** `./plan.md`

## Scope (from spec)

[Copied or summarized from spec.md.]

## Tasks completed

(Each Level 3 task appends a section here as it lands.)

---

### Task NN<letter>-1: <Name>

**Planned by:** <Tool name> (<model>)
**Implemented by:** <Tool name> (<model>, commit <sha>)
**Session:** YYYY-MM-DD | **Commit:** abc1234

**Files:**
- Created: `path/to/file` — [purpose]
- Modified: `path/to/file` — [what changed]

**What landed:**
[One paragraph.]

**Decisions:**
- D001: [decision + why]

**Follow-ups flagged:**
- [any; these also go into the Follow-ups section below]

**Tests:** PASS (N tests) | `bun run check`: 0 errors

---

### Task NN<letter>-2: <Name>

[Same structure. Appended as each task lands.]

---

## Follow-ups flagged (accumulates)

Decisions needed from Yesid, or items deferred to future slices:

1. [item]
2. [item]

## Iterations (if any)

| # | Yesid reported | Fix | Files |
|---|----------------|-----|-------|
| 1 | [feedback] | [fix] | [files] |
| Final | Approved | — | — |

## Summary

*(Added at PR time — one paragraph on what the sub-slice achieved end-to-end.)*

## PR Body

*(Added at PR time — extracted from above. Paste into `gh pr create --body-file handoff.md` or into the web form.)*

```
## Summary
[paragraph]

## Changes
- [bullet]

## Tests
[status]

## Follow-ups
[list]
```

## Final Status

One of:
- **COMPLETE** — all acceptance criteria met, all tests pass, Yesid approved
- **COMPLETE WITH GAPS** — functional, some items deferred (listed in Follow-ups)
- **PARTIAL** — some tasks incomplete (explain)
- **BLOCKED** — cannot proceed (explain)

---

*Rules: be precise, honest, don't hide failed commands, don't summarize vaguely, don't omit files changed.*
