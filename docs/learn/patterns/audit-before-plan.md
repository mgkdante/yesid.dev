---
title: "Audit Before Plan"
domain: patterns
difficulty: 1
difficulty_label: beginner
reading_time: 4
tags:
  - learn
  - patterns
  - beginner
  - workflow
date: 2026-04-17
---

# Audit Before Plan

## The Analogy

Before running a database migration script that was written last quarter, you `SELECT` a few rows first and check the schema. The columns you're about to add may already exist; the constraint you're about to drop may already be gone. Running the migration blindly costs time and risks a confusing failure. A 30-second audit tells you whether the migration still needs to run at all.

Planning docs are the same. Before executing a slice that was scoped weeks or months ago, grep the repo for the things the slice claims to fix. Some of them may already be gone.

## What It Is

**Audit-before-plan** is the habit of running a short reality check before starting work on a previously-planned slice. The check has three parts:

1. **Grep for named targets.** If the slice plan says "delete `src/lib/motion/three/`", check if the folder still exists. If the plan says "extract `isTouchDevice()` duplicated 3×", grep for duplicates — maybe there's only 1 left.
2. **Check cross-linked claims.** If a memory note says "15 primitives built", count the files. If `ARCHITECTURE.md` lists 10, there's drift.
3. **Flag the delta.** Rewrite the slice scope to reflect the current reality. Shrink, split, or delete the slice as needed before coding.

The audit should take 10-15 minutes. The cost of skipping it is anywhere from "30 minutes of rediscovery" to "a full session of redundant work" depending on how much the planning doc has drifted.

## Why It Matters

In long-running multi-slice projects, planning docs drift silently. Slice A deletes a dead component "for later cleanup"; Slice B absorbs a dedup task into its wider scope; nobody updates the roadmap. Six weeks later, a fresh session reads the roadmap, executes the stale plan, and spends an hour discovering that most of the work is already done.

This exact drift happened in Slice 17a-4: the original scope (delete 4 dead components + strip the Three.js/Threlte stack + 3 dedup tasks) was **~90% already done** before the slice started. Only 2 primitive wirings, 1 broken content file, and 5 `any` tightens remained. A 10-minute audit at kickoff prevented ~1 session of busywork.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `docs/slices/slice-17a-4-dead-code-dedup.md` | The "Already done" and "Genuinely remaining" sections at the top | This slice's spec IS the audit output — it documents what was stale vs. what was still true |
| `docs/handoffs/slice-17a-4-dead-code-dedup.md` | Sections 1-2 (Objective + Summary) | The handoff shows the audit-triggered scope shrink: big cleanup → short hygiene pass |
| `docs/roadmap/standardization.md` | The updated "Remaining — 17a-4" block | Shows the strikethrough-annotated "already done elsewhere" list — the audit's output, preserved as history |
| `src/lib/components/brand/index.ts` | The barrel header comment | Ground-truth pointer for primitive migrations. When the audit disagrees with a memory note, this file wins |

## The Mental Model

```
Planned slice scope
    │
    ├─ (weeks pass; other slices land; docs don't update)
    │
    ▼
At slice kickoff, before writing code:
    │
    ├─ Grep for each claimed target
    ├─ Count what the docs say exists
    ├─ Compare to what's actually on disk
    │
    ▼
Three outcomes:
    ├─ 100% still stale — execute the slice as planned
    ├─ Partially absorbed — rewrite scope, shrink, document
    └─ Fully absorbed — cancel the slice, update roadmap, move on
```

The audit's cost is fixed (~10-15 min). The savings scale with how much drift has accumulated — and drift is silent, so you can't predict it without looking.

## Worked Example

Slice 17a-4 was planned in Slice 17's roadmap doc (`docs/roadmap/standardization.md`) with this scope:

```
- Delete 4 dead components (AboutBento, BlogCard, ProjectCard, SectionHeader)
- Delete Three.js/Threlte stack + /preview routes + clean deps
- Extract isTouchDevice() triplication
- Consolidate station-ping keyframe
- Extract section-heading CSS pattern
- Wire AboutIdentity availability dot
- Wire ContactPage reset button
```

At 17a-4 kickoff, a 10-minute audit checked each claim:

```bash
# 1. Dead components
ls src/lib/components/**/AboutBento.svelte 2>/dev/null  # not found — deleted
ls src/lib/components/**/BlogCard.svelte 2>/dev/null    # not found — deleted
# (repeat for all 4)

# 2. Three.js tree
ls src/lib/motion/three/ 2>/dev/null                    # not found — whole folder gone
ls src/routes/preview/ 2>/dev/null                      # not found — gone

# 3. isTouchDevice triplication
grep -rn "isTouchDevice" src/lib/motion/                # 1 canonical export, 3 importers

# 4. station-ping keyframe
grep -rn "@keyframes station-ping" src/                 # 1 hit, in app.css (global)

# 5. section-heading CSS
ls src/lib/components/brand/SectionHeading.svelte        # exists — primitive built

# 6. AboutIdentity dot
grep -n "availability dot" src/lib/components/about/AboutIdentity.svelte  # still a raw <div>

# 7. ContactPage reset
grep -n "handleReset" src/lib/components/contact/ContactPage.svelte       # still a raw <button>
```

Result: **5 of 7 targets already done**, only 2 remain. The slice shrunk from "1-session cleanup" to "0.5-session residue fix". A new scope was written in the slice spec's "Genuinely remaining" section, and the original scope was preserved in strikethrough-annotated form in the roadmap.

## Common Mistakes

1. **Skipping the audit because "the plan is recent".** "Recent" is relative. Even a 2-week-old plan can be 80% stale if 3 other slices landed in between. Time your audits by slice completions, not calendar days.
   - **What happens:** You execute work that's already done, then feel bad for "wasting a session".
   - **Fix:** Audit every planned slice with ≥ 1 merged slice after its plan date.
   - **Why:** Silent drift is the default, not the exception.

2. **Auditing, finding drift, and just "adjusting as you go".** Without rewriting the spec, the next time someone looks at the roadmap they get the same stale info.
   - **What happens:** Next kickoff re-does the same audit.
   - **Fix:** Rewrite the slice spec's scope to match reality, and strikethrough-annotate the roadmap's "remaining" list. The audit's output must land in docs, or it doesn't count.

3. **Auditing only what the plan explicitly names.** The plan may reference files that no longer exist — grep `docs/` and `src/` for the same symbols to catch adjacent drift (stale cross-references, outdated learning docs).
   - **What happens:** You fix the named targets but leave stale references elsewhere that mislead the next session.
   - **Fix:** After handling the named scope, run `grep -rn "<key symbol>" docs/ src/` for each removed thing. Fix references in `docs/reference/` and `docs/roadmap/`; leave slice specs and devlogs alone (historical).

## Break It to Learn It

### Exercise 1: Manual drift detection
1. Pick any slice row in `docs/roadmap/standardization.md`'s Progress table marked "planned".
2. Read the slice's scope bullets in the narrative section below the table.
3. For each bullet, grep the repo for the named file/function/symbol.
4. **Predict:** How many bullets are already done? (Guess before you grep.)
5. **Verify:** Run the greps. Count.
6. **What you learned:** Drift is usually higher than you'd guess, especially for slices > 1 month old.

### Exercise 2: Write a scope-shrink
1. Take the grep results from Exercise 1.
2. Rewrite the slice scope with two sections: "Already done in [which slice]" (with evidence) and "Genuinely remaining".
3. Propose a new session estimate based on the shrunk scope.
4. **What you learned:** The artifact of an audit is a better spec, not just a mental model.

### Exercise 3: Cross-reference sweep
1. Pick a deleted file symbol (e.g., `src/lib/motion/three/HeroScene.svelte`).
2. `grep -rn "motion/three" docs/ src/`
3. Categorize each hit: in-scope (docs/reference, docs/roadmap) vs. historical (docs/devlog, docs/handoffs, docs/learn, docs/slices, docs/specs).
4. **Predict:** How many hits are in-scope to fix?
5. **What you learned:** Most cross-references are historical (accurate at write-time) — the fix is narrow, not broad.

## Connections

- **Depends on:** None — this is a first-order workflow pattern.
- **Enables:** [[data-driven-components]] because reality-checking the data layer is the same habit applied to runtime data instead of plans.
- **Related:** The Svelte + Slice system as a whole — every slice that closes without updating the roadmap contributes to future drift.

## Knowledge Check

1. What's the target audit duration for a planned slice? → See [What It Is](#what-it-is)
2. When is a planning doc most likely to be stale? → See [Why It Matters](#why-it-matters)
3. Where does the audit's output need to land for the effort to "count"? → See [Common Mistakes](#common-mistakes) #2
4. What was the drift percentage on Slice 17a-4's original scope? → See [Worked Example](#worked-example)

## Go Deeper

- The 17a-4 slice spec itself (`docs/slices/slice-17a-4-dead-code-dedup.md`) — its structure is the canonical template for audit-driven scope rewrites.
- Joel Spolsky, "The Joel Test" — the broader idea that small, repeatable process checks catch large, invisible problems.
