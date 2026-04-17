# Slice 17h-6 — `bun run brand:sync` Orchestrator — OBSOLETE (2026-04-18)

**Status:** OBSOLETE — scope killed during the 2026-04-18 planning shrink.
**Superseded by:** parent slice [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md) (new scope — "Scope shrink — 2026-04-18" section).

## Why dead

17h-6 was scoped to wire `bun run brand:sync` as the one-command orchestrator composing `brand:generate` → `brand:export-logos` → `brand:export-examples`, plus a CI `brand:verify` step that runs the generator and `git diff --exit-code` to catch drift.

With 17h-2 (generator) and 17h-5 (source-of-truth refactor) both killed on 2026-04-18, there's nothing to orchestrate and nothing to verify. 17h-6 becomes empty. It also kills:

- **`brand/scripts/sync.ts`** — not needed. `brand:export-logos` and `brand:export-examples` (17h-4) remain as standalone commands.
- **`brand/scripts/verify.ts`** — not needed. No generated files to diff.
- **The CI verify step** — no-op.

**What actually survives from 17h-6's original intent:**

- Nothing. The export scripts from 17h-4 run standalone via their own `package.json` entries (`bun run brand:export-logos` / `bun run brand:export-examples`).

## If you're reading this because the roadmap pointed here

Go to the parent slice spec: [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md). The surviving sub-slices are 17h-3 (narrative docs) and 17h-4 (logo + assets).

## Historical body

The original 17h-6 task breakdown (`scripts/sync.ts` orchestrator, `scripts/verify.ts` CI verifier, `brand/README.md` final pass) is preserved in git history at commit `11d1bd8`. Retrieve with `git show 11d1bd8:docs/slices/slice-17h-6-sync-orchestrator.md` if you need the full original plan.
