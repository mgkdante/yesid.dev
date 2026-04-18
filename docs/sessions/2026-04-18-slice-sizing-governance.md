# Session — 2026-04-18 — slice-sizing-governance

**Level:** non-slice. Standalone session record for governance doc changes.

**Type:** config (governance amendment)
**Branch:** `main` (direct commit, explicitly approved by Yesid — see D002)

---

## What + why

During the 17b planning session (which ran as a separate Planning session per the then-current "Planning produces zero code" hard rule), Yesid paused to ask an existential question: is the planning/implementation session separation token-intensive, does it affect code quality, is it necessary at all?

Honest assessment: the rule is right for L-size slices (multi-session, architectural decisions, cross-cutting changes) but doctrinaire for smaller work. Writing a 753-line spec.md and 2,656-line plan.md for 17b was worth it; writing similar artifacts for a single-session bugfix is ceremony for its own sake.

Yesid also noted he uses different models for different tasks (Opus 4.7 [1m], Opus 4.7 non-1m, Sonnet 4.6) and wants the governance to help him manage token cost responsibly — not just treat all sessions identically.

This session amends `CLAUDE.md` to codify:
1. **L / M / S slice sizing** — planning ceremony scales with complexity
2. **Session token budget** — percentage-based thresholds with model-specific absolute numbers
3. **Mid-session model switching** — when `/model` makes sense, when fresh session is better
4. **Parent-model routing by slice size** — which model for which session type

## Scope

- `CLAUDE.md`: five targeted amendments (Session types table + Hard rule softening, Models hard rule expansion, two new sections, Iteration Protocol step 4, Active slice checkpoint path)
- Stale memory update: `feedback_use_opus.md` retired the "always Opus for subagents" rule; aligned with the new Sonnet-default routing
- This session file

## Actions taken

```bash
# From feature/slice-17b-repositories after 17b plan.md committed
git checkout main

# Five Edit operations on CLAUDE.md:
# 1. Session types table + hard rule + new Slice sizing section
# 2. Models hard rule replacement
# 3. Session token budget + Mid-session model switching sections (inserted before Iteration Protocol)
# 4. Iteration Protocol step 4 (add budget row)
# 5. Active slice checkpoint path refresh

# Memory file rewrite:
# ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/feedback_use_opus.md

# Session log creation:
# docs/sessions/2026-04-18-slice-sizing-governance.md

# Commit on main (direct, with approval — see D002)
git add CLAUDE.md docs/sessions/2026-04-18-slice-sizing-governance.md
git commit -m "docs: codify L/M/S slice sizing + token budget + model routing"

# Return to feature branch
git checkout feature/slice-17b-repositories
```

Files touched:
- Modified: `CLAUDE.md` (5 sections amended, 2 new sections inserted)
- Modified: `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/feedback_use_opus.md` (content replaced to reflect current rule)
- Created: `docs/sessions/2026-04-18-slice-sizing-governance.md` (this file)

## Decisions

- **D001:** Slice sizing rule (L/M/S) with planning ceremony that scales.
  - L = multi-session / ≥10 design decisions / cross-cutting → separate Planning session + full spec+plan
  - M = single session / 2–6 tasks / isolated → inline TodoWrite + 1-paragraph log.md plan, no separate planning
  - S = one-shot → no planning artifact, session file records what happened
  - Rationale: a 2,656-line plan.md for a bug fix is ceremony; a 2,656-line plan for a 15-decision architectural refactor (17b) is load-bearing. Same governance shouldn't apply to both.

- **D002:** Direct commit to `main` for this session, with Yesid's explicit approval.
  - Normally the rule is "Never commit to `main` directly. Branch from main, PR back."
  - Precedent: session commit `4715b6a` (post-17j bundle cleanup) was also direct-to-main with Yesid's approval.
  - Reason: solo repo, governance-doc-only change, no CI/review value in a PR dance for a documented precedent.
  - Yesid explicitly approved after seeing the proposed diffs.
  - This is an exception, not a rule change. Code changes still go through branches.

- **D003:** Token budget is percentage-based, not model-specific.
  - Same thresholds (40/65/80) for Opus [1m], Opus standard, Sonnet — just different absolute numbers.
  - Simpler mental model than per-model rules.
  - Absolute-number table accompanies the percentages for quick reference.

- **D004:** Mid-session model switching is allowed but discouraged.
  - `/model` swap incurs cache invalidation (full context re-processed next turn).
  - Preferred pattern for different-model-for-bounded-task is **subagent dispatch**, not parent swap.
  - Rule of thumb: one `/model` swap is fine; two in a row signals you should have started a fresh session.

- **D005:** Parent-model routing is slice-size-based.
  - L-Planning = Opus 4.7 [1m]
  - L-Implementation = Opus 4.7 (200k)
  - M = Sonnet 4.6 default (upgrade to Opus only on real design choices)
  - S = Sonnet 4.6
  - Closing = Sonnet 4.6 (low reasoning load)
  - Matches "Sonnet default, Opus when complexity justifies it" principle.

- **D006:** Retire the `feedback_use_opus.md` rule ("always Opus for subagents on yesid.dev").
  - Original reason: "plenty of tokens, top-priority project."
  - New reason: even top-priority projects benefit from cost-responsible routing. Sonnet delivers 90% quality on routine work at ~3× lower cost. Save Opus for work that genuinely needs it.
  - Memory updated (not deleted) to preserve the audit trail of the shift.

## Errors encountered

None — governance doc changes, no code changes.

## Validation

| Command | Result |
|---------|--------|
| `bun run test` | N/A — no code changes |
| `bun run check` | N/A — no code changes |
| Manual check | CLAUDE.md reads top-to-bottom coherently; cross-references hold (Iteration Protocol step 4 refers to budget row; Session token budget references `/cost` and `/context-budget` commands that exist); no dangling references |

## Outcome

CLAUDE.md is now aware of slice complexity. The 17b planning+implementation separation is still the right call (L-slice); most future sub-slices that are genuinely M-sized will plan inline and ship faster. Token tracking becomes routine — every STOP includes a budget row, so Yesid can see the tank level without asking.

The 17b Planning session itself is the last one written under the old uniform rule. From this commit forward, `CLAUDE.md` says what size each slice is before writing artifacts.

## Commit(s)

See `git log --oneline main` around 2026-04-18 for the exact SHA — intentionally not hardcoded here to avoid amend churn.

## Follow-ups

- When 17b Implementation begins, first task (17b-1) should carry the new budget-row convention as the reference for how STOP messages look going forward. Call it out as an adoption-first moment in `log.md`.
- Future non-slice sessions that amend CLAUDE.md should follow this session's precedent: direct-to-main with explicit approval + session log recording the exception rationale.
- Mirror this session to `<cloud>/yesid.dev/docs/archive/sessions/2026-04-18-slice-sizing-governance.md` at session close.

---

## Addendum — later the same day (second governance commit)

After the initial governance commit, Yesid questioned the "A session cannot be two types" rule as potentially doctrinaire. Honest analysis: the rule protects habits, but the actual quality/token protection comes from **commit discipline**. Plus Yesid flagged a second issue — `plan.md` was over-prescribed (2,656 lines with boilerplate pre-written), contradicting "let Claude think code at execution time." Both issues merit codification.

### Additional decisions

- **D007:** Soften session-type separation from hard to soft. Commit discipline is the real strict constraint.
  - **Strict:** commit discipline (never mix types in one commit); L/M/S planning artifact rules; closing-doesn't-add-features.
  - **Soft:** session separation — two session types may share one wall-clock conversation UNLESS a break trigger fires (reasoning-heavy transition, context ≥65%, material model downshift, human fatigue).
  - **Why:** the separation was enforcing habits more than protecting code. Quality protection is commit discipline. Token efficiency suffers when forcing a fresh session for mechanical continuation work (startup tax > saved cache). Separating strict (commit) from soft (session) lets mechanical continuations save overhead without sacrificing quality.

- **D008:** New subsection "Plan authoring discipline" added under Slice sizing.
  - Plans specify **decisions and sequencing**, not boilerplate code.
  - One canonical example per pattern; trust execution-time judgment for pattern-following code.
  - Pre-write only pattern-establishing code (interface types, contracts, novel algorithms) and non-obvious logic.
  - **Why:** Claude at execution time has full context of the current codebase and writes code matching actual local patterns. Plans that pre-specify boilerplate lock in assumptions and waste tokens twice (authoring + re-processing). The 2,656-line 17b plan was a concrete over-specification example — roughly 30% was boilerplate that execution time could produce faster and more accurately.
  - **Note:** 17b's plan stays as-is (already committed). The new rule applies to FUTURE L-slice plans.

### Additional commit

Second CLAUDE.md amendment lands as a separate commit on main (same session, same direct-commit approval). `git log --oneline main` around 2026-04-18 shows both governance commits.

---

## Addendum v3 — same day, WORKFLOW.md consistency pass

After the two CLAUDE.md amendments, Yesid noted that `docs/reference/WORKFLOW.md` also describes session types and the plan-authoring pipeline and would be out of sync with the new rules. Review confirmed: five sections needed alignment. Done as a targeted edit pass — WORKFLOW.md stays a **companion** to CLAUDE.md (points at CLAUDE.md for authoritative rules) rather than duplicating long policy text.

### Additional decisions

- **D009:** WORKFLOW.md is the companion-to-CLAUDE.md operational doc, not a duplicate rulebook.
  - When CLAUDE.md rules change, WORKFLOW.md gets targeted pointers + table/checklist updates, not full policy duplication.
  - This keeps a single source of truth (CLAUDE.md) and avoids rule drift between the two files.

- **D010:** WORKFLOW.md's Pipeline (§3) is L-slice-specific and should say so.
  - M-slices collapse phases 2–4 into inline planning (1-paragraph plan in `log.md`).
  - S-slices skip phases 1–4 entirely.
  - Noted at the top of §3 so readers don't mistake the 8-phase diagram as universal.

### Changes made to WORKFLOW.md

1. **§2 Session Types table** — added "Slice sizes" column (Planning=L only, Implementation/Closing=L/M, Non-slice=S).
2. **§2 Hard rule** — replaced with strict/soft split: commit discipline (strict) vs session separation (soft, with four break triggers listed and pointer to CLAUDE.md).
3. **§2 "When to use non-slice vs slice"** — reframed as an L/M/S decision table with triggers + planning artifact per size.
4. **§3 Pipeline** — clarifying sentence that the 8-phase diagram is L-slice-specific.
5. **§7 Phase 4 Plan** — added "Plan authoring discipline" subsection with the decisions-and-sequencing-not-boilerplate rule + 30-second heuristic.
6. **§17 Session Start Protocol** — step 1 declares type + slice size; step 5 scales reading to slice size (L=full bundle, M=log.md only, S=nothing extra); step 8 is new (announce budget row); steps renumbered to 9.
7. **§18 Session End Protocol** — step 7 adds "include recommended model + expected slice size"; per-STOP progress table format updated to include the budget row above the task table.

### Where this commit lives

- **Committed on `feature/slice-17b-repositories`** rather than `main`. Reason: main checkout was blocked by an uncommitted `src/lib/content/blog.ts` edit from a parallel 17b implementation session. Committing on the feature branch doesn't disturb that WIP, and WORKFLOW.md updates will flow to main via the 17b PR merge (closer to Yesid's original governance-via-PR preference than the earlier direct-to-main commits).
- Inconsistent landing pattern vs v1/v2 main commits, but the end state (main has all governance amendments after 17b PR merges) is identical.

---

## Rules for non-slice sessions (reference copy from template)

1. **Single session, single topic.** ✓ This session did only governance.
2. **Still commits.** ✓ Direct commit to `main` per D002.
3. **Optional PR.** Skipped per D002 — governance-doc-only, solo repo, explicit approval.
4. **No self-appending handoff required** — this file replaces it.
5. **Commit message convention:** `<type>: <description>` — used `docs:` (no slice prefix).
6. **Mirror at close:** TODO before session fully closes.
