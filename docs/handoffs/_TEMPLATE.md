# Handoff: Slice NN — [Name]

## 1. Objective Completed

**Implemented:**
- [Exactly what was built, referencing the slice spec]

**Intentionally not implemented:**
- [What was deferred or out of scope, and why]

## 2. High-Level Summary

[Short, concrete summary of what changed. Focus on components added, routes created, data model changes, motion/animation work, and how it connects to the existing system.]

## 3. Files Created

| File | Purpose |
|------|---------|
| `src/lib/components/Thing.svelte` | [purpose] |
| `src/lib/components/Thing.test.ts` | [purpose] |

## 4. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `src/lib/data/types.ts` | Added X interface | [why] |

## 5. Data Model Changes

Describe exactly:
- Types/interfaces added or modified
- New data fields and their purpose
- Backward compatibility impact
- Any schema decisions (why this shape vs alternatives)

If no data model changes, say so.

## 6. Commands Executed

List every command run during implementation, in order, in code blocks.
Do not omit failed commands.

```bash
bun run test -- --run src/lib/components/Thing.test.ts
bun run check
bun run dev
```

## 7. Validation Results

For each command run, state:
- Pass/fail
- Important output
- What it means

```
bun run test: PASS (12 tests, 0 failures)
bun run check: PASS (no type errors)
```

If something was not run, explicitly say so.

## 8. Errors Encountered

List every error or failed command. For each:
- **Error:** [exact error message]
- **Cause:** [what caused it]
- **Fix:** [what was done]
- **Resolved:** yes / no

If there were no errors, explicitly say: "No errors encountered."

## 9. Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | [feedback] | [fix] | [files] |
| Final | Approved | — | — |

If approved first try: "Approved on first test. No iterations needed."

## 10. Assumptions Made

List assumptions about:
- Component behavior not explicitly specified in the slice
- Motion/animation timing or easing decisions
- Responsive breakpoints or layout choices
- Data shape or content decisions
- Browser/device support

## 11. Known Gaps / Deferred Work

List everything intentionally left for the next slice. Be specific.

## 12. What Yesid Should Know

[Concepts that were new or non-obvious. Explain WHY things work this way. Link to docs/tutorials for deeper reading.]

## 13. Next Recommended Slice

[What slice should follow, why, and the exact objective it should target. If you can, write the opening line of the next slice spec.]

## 14. Final Status

One of:
- **COMPLETE** — all acceptance criteria met, all tests pass, Yesid approved
- **COMPLETE WITH GAPS** — functional but some items deferred (listed in section 11)
- **PARTIAL** — some tasks incomplete (explain which and why)
- **BLOCKED** — cannot proceed (explain blocker)

---

**Rules:**
- Be precise and honest.
- Do not claim something works unless you actually ran it.
- Do not hide failed commands.
- Do not summarize changes vaguely.
- Do not omit files you changed.
