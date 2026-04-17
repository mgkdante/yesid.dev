# Slice 17h-6 — `bun run brand:sync` Orchestrator + CI Verify

**Status:** draft
**Priority:** 2
**Estimated effort:** 1 session
**Depends on:** 17h-2 (generator), 17h-4 (logo + example exporters)
**Parent:** `docs/slices/slice-17h-brand-bundle.md`

## Objective

One command — `bun run brand:sync` — regenerates every output in the bundle. CI — `bun run brand:verify` — fails the build on drift. Close the loop on the single-source-of-truth workflow: edit `tokens.json`, run `brand:sync`, commit; CI enforces that no hand edits sneak into generated files.

## Context

At this point in the slice, three scripts exist independently:

- `bun run brand:generate` (17h-2) — JSON → 4 code outputs.
- `bun run brand:export-logos` (17h-4) — SVG → PNG 1x/2x/3x.
- `bun run brand:export-examples` (17h-4) — dev server → paired screenshots + source.

Running them one by one works but is tedious and error-prone. `brand:sync` orchestrates. `brand:verify` is the CI counterpart: it regenerates, diffs, and fails if anything drifted.

## Architecture

- **`sync.ts`** is an imperative orchestrator: run scripts in order, stream logs, report a diff summary at the end.
- **`verify.ts`** is a CI guard: run `brand:generate` (not exports — they're not part of the idempotency contract for CI), `git diff --exit-code` on the tracked outputs, exit non-zero on any diff.
- **CI wiring** — add a step to the existing CI workflow that runs `brand:verify` after `bun install`, before tests.
- **No pre-commit hook** — per open question #9 in the design spec, CI is the backstop; pre-commit runs of the generator add latency without catching more bugs.

## Tech Stack

Bun, TypeScript, existing CI workflow. No new deps.

## File Structure

### New
```
brand/scripts/sync.ts                    — CREATE
brand/scripts/verify.ts                  — CREATE
```

### Modified
```
package.json                             — ADD "brand:sync", "brand:verify"
.github/workflows/*.yml                  — ADD "bun run brand:verify" step
brand/README.md                          — FINAL pass: workflow + CI paragraph
```

---

## Task 1: `brand/scripts/sync.ts` orchestrator

**Files:**
- Create: `brand/scripts/sync.ts`
- Modify: `package.json` (add `"brand:sync": "bun brand/scripts/sync.ts"`)

- [ ] **Step 1: Orchestration order** —
  1. `brand:generate` (JSON → 4 code outputs).
  2. `brand:export-logos` (SVG → PNG).
  3. `brand:export-examples` (screenshots + source).
  Run each as a subprocess via `Bun.spawn`. Stream stdout/stderr.
- [ ] **Step 2: Exit code** — if any step exits non-zero, `sync.ts` exits non-zero with a summary of which step failed.
- [ ] **Step 3: Summary report at the end** —
  - Time elapsed per step.
  - Files changed (computed via `git diff --name-only` scoped to `brand/` + generated site files).
  - Zero-change case → "No changes — already in sync."
- [ ] **Step 4:** Format summary as a readable table (use mono spacing; no ANSI colors required).

**STOP.** Yesid runs `bun run brand:sync` from a clean checkout. Expected: no changes (already synced after 17h-2/17h-4). Then edits `yesid.color.brand.primary` in `tokens.json`, re-runs `sync`, confirms the summary reports diffs in the 4 generated files.

---

## Task 2: `brand/scripts/verify.ts` + CI wiring

**Files:**
- Create: `brand/scripts/verify.ts`
- Modify: `package.json` (add `"brand:verify": "bun brand/scripts/verify.ts"`)
- Modify: `.github/workflows/*.yml` (confirm the CI file first — could be `ci.yml` or similar)

- [ ] **Step 1: `verify.ts` logic** —
  1. Run `brand:generate` (subprocess).
  2. Run `git diff --exit-code -- brand/tokens.css brand/tailwind.brand.js src/lib/styles/tokens.css src/app.css src/lib/brand.ts`.
  3. If diff is non-empty, print a summary of changed files + the first ~50 lines of each diff, exit 1.
  4. If clean, print "Brand outputs up to date." exit 0.
- [ ] **Step 2:** DO NOT include logo / example exports in the verify scope — they depend on browser chrome + timing, not useful for CI idempotency checks.
- [ ] **Step 3: CI step** — add to the existing workflow (check first what exists; if no CI workflow yet, this task blocks on Yesid's decision to either create one or defer CI wiring to a future slice).
  ```yaml
  - name: Brand verify
    run: bun run brand:verify
  ```
  Placement: after `bun install`, before tests. Runs on every push.
- [ ] **Step 4: Test failure path locally.**
  - Hand-edit `brand/tokens.css` (just insert a trailing space).
  - Run `bun run brand:verify`.
  - Expected: exit 1 with diff summary.
- [ ] **Step 5: Test success path.** Revert the hand-edit. Run `brand:verify`. Exit 0.

**STOP.** Yesid confirms CI integration works (merge a test PR that introduces drift, confirm CI fails; revert, confirm CI passes).

---

## Task 3: Final `brand/README.md` pass

**Files:** `brand/README.md`.

- [ ] **Step 1: Editing the brand section** — 4-step workflow now fully wired:
  1. Edit `brand/tokens.json` or a narrative file.
  2. `bun run brand:sync` — regenerates CSS, TS, Tailwind, logos, examples.
  3. `git diff` — review what changed.
  4. Commit + push. CI runs `brand:verify` and blocks the merge if drift snuck in.
- [ ] **Step 2: CI verification section** — one paragraph:
  - "Every push runs `bun run brand:verify` in CI. If `brand/tokens.json` was edited without running `bun run brand:sync`, the build fails. This guarantees the generated files never drift from the source."
- [ ] **Step 3: Scripts table** — final version with all 5 commands:

| Command | Purpose |
|---------|---------|
| `bun run brand:generate` | `tokens.json` → 4 code outputs. |
| `bun run brand:export-logos` | SVG logos → PNG 1x/2x/3x. |
| `bun run brand:export-examples` | Dev server → paired screenshots + source. |
| `bun run brand:sync` | All of the above, in order. The normal workflow. |
| `bun run brand:verify` | CI — fails on drift between `tokens.json` and generated files. |

- [ ] **Step 4: Voice check** — the README now documents a real, working workflow. Claude-reader test one more time: a non-technical reader can open this file and understand what's happening in 90 seconds.

**STOP.** 17h-6 complete. Yesid gives final approval. Slice 17h ready for PR + merge.

---

## Execution Order

Tasks 1 → 2 → 3. Strictly sequential.

## Out of Scope

- Pre-commit hook (design spec open question #9: defer to CI-only).
- Watch mode (`brand:sync --watch`) — editing is infrequent; cost/benefit doesn't justify.
- Parallelizing the three export steps inside `sync.ts` — generate.ts must finish first; logos and examples are independent but total runtime is short enough that parallelism isn't worth the complexity.
- External npm publish of `brand/` (future slice, if/when).

## Acceptance Criteria

- [ ] `bun run brand:sync` runs all three exporters in order, streams logs, reports a diff summary.
- [ ] `bun run brand:verify` passes on a clean checkout (exit 0, "up to date").
- [ ] `bun run brand:verify` fails when a generated file is hand-edited (exit 1, clear diff).
- [ ] CI workflow runs `brand:verify` on every push.
- [ ] A test PR that edits `tokens.json` without running `sync` fails CI; running `sync` + re-pushing makes it pass.
- [ ] `brand/README.md` documents the complete 5-command workflow.
- [ ] `bun run test` + `bun run check` green.

## Learn

### Orchestrators vs. primitives
**What it is:** `sync.ts` is an orchestrator that composes three primitives (`generate.ts`, `export-logos.ts`, `export-examples.ts`). Each primitive is independently useful; the orchestrator is convenience.
**Why it matters:** Primitives stay testable and composable. Orchestrators can evolve without breaking the primitives.
**Try this:** Run `bun run brand:generate` + `bun run brand:export-logos` manually. You can do anything the orchestrator does, just with more typing.

### CI as the backstop
**What it is:** Pre-commit hooks catch mistakes locally; CI catches them before merge. For generator drift, CI alone is sufficient.
**Why it matters:** Pre-commit hooks that run generators add 500ms+ to every commit — annoying for work that doesn't touch `brand/`. CI adds zero local latency and catches 100% of merged drift.
**Try this:** Edit a generated file. Try to commit. (No hook blocks you — as designed.) Try to push a PR. CI fails the PR. That's where the enforcement lives.

### Scope the idempotency contract
**What it is:** `verify.ts` intentionally doesn't include logo PNG exports or example screenshots in its diff check — those depend on browser chrome + timing and would false-positive constantly.
**Why it matters:** The idempotency contract applies to deterministic outputs. Non-deterministic outputs (browser screenshots) get their own cadence.
**Try this:** Run `brand:export-examples` twice. The PNGs may differ by one byte due to timing. That's why they're not in `verify`.

## Verify

1. `bun run brand:sync` with no changes: exit 0, summary "no changes".
2. Edit `yesid.color.brand.primary` in `tokens.json`. Run `brand:sync`. Summary shows 4 files changed.
3. Revert. Run `brand:verify`. Exit 0, "up to date".
4. Hand-edit a generated file. Run `brand:verify`. Exit 1 with diff output.
5. Revert. Push to a feature branch. CI passes `brand:verify`.
6. Introduce drift on a feature branch, push. CI fails `brand:verify`. Merge blocked.
7. Fix drift, push. CI passes. Merge allowed.
