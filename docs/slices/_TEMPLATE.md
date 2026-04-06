# Slice [NN] — [Name]

**Status:** draft | ready | in-progress | complete | blocked
**Priority:** [1-5, 1 = highest]
**Estimated effort:** [hours or sessions]
**Depends on:** [slice numbers or "none"]

## Objective

[One sentence. What does this slice deliver?]

## Context

[Why this matters. How it fits the larger plan.]

## Architecture

[High-level summary: what's being added/changed, how it connects to existing code, backward compatibility notes.]

## Tech Stack

[Relevant stack for this slice. Example: SvelteKit 2 + Svelte 5, TypeScript, GSAP (ScrollTrigger, DrawSVGPlugin), Tailwind CSS, Vitest + @testing-library/svelte]

## File Structure

### New Files

```
src/lib/components/Thing.svelte        — CREATE: [purpose]
src/lib/components/Thing.test.ts       — CREATE: tests
```

### Modified Files

```
src/lib/data/types.ts                  — MODIFY: [what changes]
```

### Reused (no changes needed)

```
src/lib/motion/actions/reveal.ts       — use:reveal
```

---

## Task 1: [Name]

**Files:**
- Create/Modify: `path/to/file`
- Test: `path/to/test`

- [ ] **Step 1: [Action]**
  [Exact instructions. Code snippets if needed. Claude Code reads this literally.]

- [ ] **Step 2: Run tests**
  Run: `bun run test -- --run path/to/test`
  Expected: [PASS/FAIL and why]

- [ ] **Step 3: Commit**
  ```bash
  git add [files]
  git commit -m "feat(slice-NN): [description]"
  ```

**STOP. Ask Yesid to verify on localhost before moving to Task 2.**

---

## Task 2: [Name]

[Same structure as Task 1. Every task ends with STOP.]

---

## Execution Order

[Which tasks depend on which. Which can be parallelized.]

## Out of Scope

[What this slice does NOT include. Prevents drift.]

## Acceptance Criteria

- [ ] [Specific, testable]
- [ ] [Specific, testable]
- [ ] [Specific, testable]

## Learn

[Concepts Yesid should understand after this slice.]

### [Concept Name]
**What it is:** [1-2 sentences]
**Why it matters:** [Connect to something Yesid already knows]
**Try this:** [Specific hands-on exercise in the code]
**Go deeper:** [One link]

## Verify

1. [Step to confirm it works]
2. [Step to confirm it works]
3. [Expected result]
