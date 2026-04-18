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

## Rules for non-slice sessions (reference copy from template)

1. **Single session, single topic.** ✓ This session did only governance.
2. **Still commits.** ✓ Direct commit to `main` per D002.
3. **Optional PR.** Skipped per D002 — governance-doc-only, solo repo, explicit approval.
4. **No self-appending handoff required** — this file replaces it.
5. **Commit message convention:** `<type>: <description>` — used `docs:` (no slice prefix).
6. **Mirror at close:** TODO before session fully closes.
