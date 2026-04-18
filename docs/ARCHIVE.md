# docs/ Archive

**Status:** active — historical docs live outside this repo as of slice 17j (2026-04-17).

## The three-tier context model (adopted in Slice 17j)

**Tier 1 — Always-on (lives in this repo):**
- `CLAUDE.md` (governance)
- `docs/reference/**` (CONSTITUTION, CSS, WORKFLOW, MOTION, TESTS, ARCHITECTURE, PATTERNS)
- `docs/roadmap/**` (PLAN, FUTURE_PHASES, standardization)
- `docs/slices/_TEMPLATE-SLICE/`, `_TEMPLATE-SUBSLICE/`, active slice folders with per-sub-slice bundles + CHECKPOINT.md
- `docs/plans/` current plan only
- `docs/devlog/_TEMPLATE.md` + active devlog
- `docs/handoffs/_TEMPLATE.md`

**Tier 2 — Fetch-on-command (cloud mirror + git history):**
- Every shipped slice's spec, plan, devlog, handoff
- Historical design specs, research, archives
- `docs/learn/**` (Yesid's Obsidian knowledge base)

**Tier 3 — The bridge (cloud indexes):**
- `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\COMPLETED-SLICES.md` — one-line per shipped slice
- `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\INDEX.md` — overall mirror map

## What moved on 2026-04-17

Mirrored to `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` and removed from this repo:

- `docs/devlog/*` — all per-slice devlogs (except active + template)
- `docs/handoffs/*` — all closing handoffs (except template)
- `docs/specs/*` — all design specs
- `docs/plans/*` — all historical implementation plans (except active)
- `docs/research/*` — all one-off competitive / research docs
- `docs/archive/*` — pre-existing archive folder
- `docs/learn/**` — Yesid's Obsidian knowledge base
- `docs/slices/slice-0*.md`, `slice-17a-*.md`, `slice-17d-*.md`, `slice-17e-*.md`, `slice-17h-*.md`, `slice-09*`, `slice-10*`, `slice-11*`, `slice-12*`, `slice-13*`, `slice-A*`, `slice-B*`, `slice-C*`, and pre-17 archived variants

## Retrieval protocol

When AI needs context from a shipped slice, walk this ladder cheapest first:

1. **Check in-context governance** — learn from `docs/reference/**` (PATTERNS, CONSTITUTION, MOTION, CSS), the checkpoint, the trimmed PLAN.md. Most questions answer here.
2. **Fetch the cloud index** — `Read C:\Users\otalo\Yesito\cloud\yesid.dev\docs\COMPLETED-SLICES.md` to find the one-liner.
3. **Fetch the specific artifact** — `Read C:\Users\otalo\Yesito\cloud\yesid.dev\docs\slices\slice-NN.md` (or plans/, devlog/, handoffs/, specs/, learn/).
4. **Git history** — `git log -- docs/...` then `git show <commit>:docs/...` for anything deeper.

## Write protocol (new closing-checklist steps, codified in WORKFLOW.md)

At each slice close, after the standard devlog + handoff + learn doc write:

1. Mirror the slice's artifacts (spec, plan, devlog, handoff) to `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\...` via robocopy.
2. Delete the mirrored artifacts from the repo.
3. Update `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\COMPLETED-SLICES.md` with a one-liner for the slice.
4. Regenerate `tree.txt` and commit.

The workflow is self-pruning — each closed slice automatically compacts itself into Tier 2/3 so the next slice starts from a clean baseline.

## Core principle

**The workflow self-enhances.** Every mistake solved in this slice becomes a systematic rule in the closing checklist so it cannot recur. Future slices inherit the fix automatically — nothing to remember, nothing to repeat.
