# Slice 17h-2 — Code Generator — OBSOLETE (2026-04-18)

**Status:** OBSOLETE — scope killed during the 2026-04-18 planning shrink.
**Superseded by:** parent slice [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md) (new scope — "Scope shrink — 2026-04-18" section).

## Why dead

17h-2 was scoped to build `bun run brand:generate` — a Bun/TS generator that reads `brand/tokens.json` and emits `brand/tokens.css`, `src/app.css @theme` partial, `brand/tailwind.brand.js`, and `src/lib/brand.ts`. Deterministic, idempotent, byte-stable. The CI verifier (`bun run brand:verify`) would fail on drift.

Yesid pivoted on 2026-04-18: `brand/` contains non-tech info and assets only — no generated files, no tooling. That kills:

- **The generator itself.** No `brand/scripts/generate.ts`, no `parse.ts` / `resolve.ts` / `format-value.ts` / `write.ts`.
- **`brand/tokens.json` as a source.** Tokens stay authored directly in `src/lib/styles/tokens.css`. Nothing to parse, nothing to emit.
- **The `@theme` partial + `src/lib/brand.ts` TS types.** Not regenerated; not needed — Tailwind reads `@theme` inline in `src/app.css`, and the site doesn't import typed brand tokens from anywhere today.
- **The 3 generator tests.** Nothing to test.

**Why this specifically was dropped:** a generator closes the gap between "brand intent" (narrative) and "site implementation" (CSS + TS) fast — but it also makes a bad edit propagate instantly. Yesid prefers physical separation and manual translation as the governance model: a dev reads `brand/foundations/color.md` or `brand/decisions/*.md`, then edits `src/lib/styles/tokens.css` by hand, with PR review as the safety net. Appropriate for a solo brand at this scale; could flip to a generator at the first fork of `brand/` into a second project.

## If you're reading this because the roadmap pointed here

Go to the parent slice spec: [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md). The surviving sub-slices are 17h-3 (narrative docs) and 17h-4 (logo + assets).

## Historical body

The original 17h-2 task breakdown (scaffold + TDD tests, implement parse/resolve/format/write modules, emit outputs in lockstep, delete `src/lib/styles/tokens.css`, wire `brand:generate` into `package.json`) is preserved in git history at commit `11d1bd8`. Retrieve with `git show 11d1bd8:docs/slices/slice-17h-2-code-generator.md` if you need the full original plan.
