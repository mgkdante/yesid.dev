# Slice 17h-2 — Code Generator (`bun run brand:generate`)

**Status:** draft
**Priority:** 2
**Estimated effort:** 2 sessions
**Depends on:** 17h-1
**Parent:** `docs/slices/slice-17h-brand-bundle.md`

## Objective

Build a deterministic Bun/TypeScript script that reads `brand/tokens.json` and emits four files with byte-identical content to today's hand-written versions: `brand/tokens.css`, `src/lib/styles/tokens.css`, `src/app.css @theme` partial, `brand/tailwind.brand.js`, `src/lib/brand.ts`. Generated files replace their hand-written predecessors. Site behavior unchanged.

## Context

Without a generator, `tokens.json` is decorative. This sub-slice makes it load-bearing. The decision to write a homegrown script instead of adopting Style Dictionary is documented in the design spec ADR (§4.4) — summary: Style Dictionary's async class init is overkill for 4 string outputs, Tailwind v4 has no SD format anyway, and homegrown Bun cold-starts in ~50ms.

## Architecture

Module layout (~300 LOC total):

```
brand/scripts/
├── generate.ts         entry: orchestrates + writes files atomically
├── parse.ts            read + validate tokens.json DTCG shape
├── resolve.ts          resolve {alias} refs; detect cycles
├── format-value.ts     per-$type value formatting
├── emit-tokens-css.ts  → brand/tokens.css + src/lib/styles/tokens.css
├── emit-theme-css.ts   → src/app.css @theme partial (marker-bracketed)
├── emit-legacy-tw.ts   → brand/tailwind.brand.js
├── emit-brand-ts.ts    → src/lib/brand.ts
├── write.ts            deterministic writer (sorted keys, LF, stable)
└── __tests__/
    ├── determinism.test.ts
    ├── alias-resolution.test.ts
    └── dtcg-shape.test.ts
```

Each emitter is a pure function `(resolvedTokens) => string`. Only `write.ts` touches disk. `generate.ts` orchestrates.

### Byte-stability strategy

- Sort keys alphabetically within each CSS block, TS object, JS object.
- LF line endings only.
- Trailing newline.
- No post-processing (no prettier, no stylelint on generated files).
- Pre-generation: read existing file, compare, skip write if identical (reduces CI noise).

### `@theme` strategy

The `@theme` block in `src/app.css` has two parts today:
1. Static brand values (font stacks, text-* tokens, radius, shadow refs, z-index refs, width refs, spacing refs).
2. `@theme inline { --color-*: var(--...) }` — semantic aliases Tailwind v4 can't derive from JSON alone.

The generator owns part 1 (marker-bracketed `/* BRAND:THEME:START */ … /* BRAND:THEME:END */`). Part 2 stays hand-written. Tests lock both boundaries.

## Tech Stack

Bun, TypeScript, Vitest. No new runtime deps. Generator is dev-time only.

## File Structure

### New
```
brand/scripts/generate.ts              — CREATE
brand/scripts/parse.ts                 — CREATE
brand/scripts/resolve.ts               — CREATE
brand/scripts/format-value.ts          — CREATE
brand/scripts/emit-tokens-css.ts       — CREATE
brand/scripts/emit-theme-css.ts        — CREATE
brand/scripts/emit-legacy-tw.ts        — CREATE
brand/scripts/emit-brand-ts.ts         — CREATE
brand/scripts/write.ts                 — CREATE
brand/scripts/__tests__/determinism.test.ts       — CREATE
brand/scripts/__tests__/alias-resolution.test.ts  — CREATE
brand/scripts/__tests__/dtcg-shape.test.ts        — CREATE
src/lib/brand.ts                       — CREATE (generated)
```

### Modified
```
brand/tokens.css                       — REGENERATED (from now on)
brand/tailwind.brand.js                — REGENERATED
src/lib/styles/tokens.css              — REGENERATED
src/app.css                            — @theme partial now generator-owned (marker-bracketed)
package.json                           — ADD "brand:generate" script
vitest.config.ts                       — INCLUDE brand/scripts/**/*.test.ts
```

---

## Session 1 — 17h-2.1

### Task 1: Scaffold modules + failing tests (TDD RED)

**Files:** all new `brand/scripts/*.ts` + test files, `package.json`, `vitest.config.ts`.

- [ ] **Step 1:** Create empty module skeletons. Each exports typed placeholders returning `""` or `throw new Error("not implemented")`.
- [ ] **Step 2:** Add `"brand:generate": "bun brand/scripts/generate.ts"` to `package.json`.
- [ ] **Step 3:** Write 3 failing tests (RED):
  - `determinism.test.ts` — run generator on a small stub JSON twice; assert byte-identical output.
  - `alias-resolution.test.ts` — stub tokens with `{color.brand.primary}` reference; assert leaf resolution. Second case: 2-hop cycle; assert error with full path chain.
  - `dtcg-shape.test.ts` — stub token missing `$type`; assert parse error with exact path.
- [ ] **Step 4:** Include `brand/scripts/**/*.test.ts` in `vitest.config.ts` if not already covered by globs.
- [ ] **Step 5:** Run `bun run test -- brand/scripts`. Expected: 3 failing tests in the table:
  ```
  | Test File | Test Name | Status | Failure Reason |
  |-----------|-----------|--------|----------------|
  | ... | determinism: byte-identical | FAIL | not implemented |
  | ... | alias: resolves leaf | FAIL | not implemented |
  | ... | dtcg: rejects missing $type | FAIL | not implemented |
  ```

**STOP. Yesid approves the module layout + test shape before implementation begins.**

### Task 2: Implement `parse.ts` + `resolve.ts` (GREEN for 2 of 3 tests)

**Files:** `brand/scripts/parse.ts`, `resolve.ts`; tests may gain cases.

- [ ] **Step 1:** `parse.ts` — read `brand/tokens.json`, walk tree, flatten to `{ path: string[], $value, $type, $description? }[]`. Reject unknown `$type` with exact path. Accept: `color, dimension, duration, cubicBezier, fontFamily, number, shadow`.
- [ ] **Step 2:** `resolve.ts` — resolve `{a.b.c}` refs. Detect cycles with DFS + path-chain reporting.
- [ ] **Step 3:** Run tests. Expected: dtcg-shape + alias-resolution PASS. determinism still FAIL.

**STOP. Yesid reviews.**

### Task 3: Implement `format-value.ts` + `write.ts` (GREEN for determinism)

**Files:** `brand/scripts/format-value.ts`, `write.ts`.

- [ ] **Step 1:** `format-value.ts` handlers per `$type`:
  - `color` → preserve source hex casing (uppercase per existing convention).
  - `dimension` → pass strings verbatim (`clamp(...)` etc.); numeric → `${n}rem` or `${n}px` per convention.
  - `duration` → `${n}ms`.
  - `cubicBezier` → `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`.
  - `fontFamily` → quoted + fallback stack from `$extensions.fallback` if present.
  - `number` → raw string.
  - `shadow` composite → CSS `box-shadow` string.
- [ ] **Step 2:** `write.ts` — sort, LF, trailing newline, byte-stable.
- [ ] **Step 3:** Run tests. All 3 PASS. Print test table.

**STOP. Yesid reviews.**

---

## Session 2 — 17h-2.2

### Task 4: Emit `brand/tokens.css` + `src/lib/styles/tokens.css`

**Files:** `brand/scripts/emit-tokens-css.ts`, `generate.ts`.

- [ ] **Step 1:** Implement emitter producing the exact structure of current `src/lib/styles/tokens.css`: `:root` for static brand, `[data-theme="dark/light"]` for theme-switching, `prefers-color-scheme` media queries for fallback.
- [ ] **Step 2:** Wire into `generate.ts`. Run `bun run brand:generate`.
- [ ] **Step 3:** Diff outputs.
  ```bash
  git diff brand/tokens.css src/lib/styles/tokens.css
  ```
  Expected: zero semantic diff. Whitespace-only diffs acceptable; document in devlog.
- [ ] **Step 4:** Run `bun run test` + `bun run check`. Both pass.
- [ ] **Step 5:** Visual check via Claude Preview: hero at 1440px, services at 375px. Identical to pre-17h-2.

**STOP. Yesid diffs on disk and confirms no visual change.**

### Task 5: Emit `@theme` partial into `src/app.css`

**Files:** `brand/scripts/emit-theme-css.ts`, `generate.ts`; modifies `src/app.css`.

- [ ] **Step 1:** Add marker comments around the static-values block in `src/app.css`: `/* BRAND:THEME:START */` and `/* BRAND:THEME:END */`. Leave `@theme inline {}` (semantic aliases) OUTSIDE the markers — hand-written, not regenerated.
- [ ] **Step 2:** Emitter reads `src/app.css`, finds markers, replaces content between them with generated tokens. Idempotent.
- [ ] **Step 3:** Run generator. Diff `src/app.css`. Zero semantic drift.
- [ ] **Step 4:** Visual check across 4 pages (home, services, blog listing, blog detail) at 1440px + 375px.

**STOP. Yesid confirms visual parity.**

### Task 6: Emit `brand/tailwind.brand.js` + `src/lib/brand.ts`

**Files:** `brand/scripts/emit-legacy-tw.ts`, `emit-brand-ts.ts`, `generate.ts`.

- [ ] **Step 1:** `emit-legacy-tw.ts` — CJS output matching current `brand/tailwind.brand.js` shape. `module.exports = { darkMode: "class", theme: { extend: { colors, fontFamily, borderRadius } } }`.
- [ ] **Step 2:** `emit-brand-ts.ts` — emit:
  ```ts
  // GENERATED — do not edit by hand. Regenerate with `bun run brand:generate`.
  export const brand = { color: {...}, font: {...}, ... } as const;
  export type Brand = typeof brand;
  export const tokenMap: Readonly<Record<string, string>> = {
    'color.brand.primary': '#E07800',
    // …
  };
  ```
- [ ] **Step 3:** Run generator + `bun run check`. TS compiles.
- [ ] **Step 4:** Diff `brand/tailwind.brand.js`. Zero semantic drift.
- [ ] **Step 5:** Spot-test: import `{ brand, tokenMap }` in a test file, assert a known value.

**STOP. Yesid reviews `src/lib/brand.ts` shape before anything imports it.**

### Task 7: Add `brand:generate` to `package.json` + document

**Files:** `package.json`, `brand/README.md`.

- [ ] **Step 1:** Confirm `"brand:generate"` script exists.
- [ ] **Step 2:** Update `brand/README.md` Quick Start: one line "Regenerate outputs: `bun run brand:generate`".
- [ ] **Step 3:** From a clean checkout, Yesid runs `bun run brand:generate`. No errors, no file changes (already synced).

**STOP. 17h-2 complete. Yesid approves before 17h-3 starts.**

---

## Execution Order

Strictly sequential 1 → 7. Tasks 1–3 in Session 1; Tasks 4–7 in Session 2.

## Out of Scope

- Logo PNG exports (that's 17h-4).
- Narrative docs (that's 17h-3).
- CI drift check (that's 17h-6).
- Claude Design integration (Path A — no integration planned this slice).

## Acceptance Criteria

- [ ] `bun run brand:generate` writes 4 output files with byte-identical content to the pre-refactor hand-written versions (whitespace diffs documented).
- [ ] Second run is a no-op — `git status` clean.
- [ ] Changing `yesid.color.brand.primary` and re-running produces diffs in all 4 outputs only.
- [ ] Determinism, alias-resolution, DTCG-shape tests all pass.
- [ ] `bun run test` + `bun run check` green.
- [ ] Site renders identically to pre-17h-2 state.

## Learn

### Deterministic code generation
**What it is:** Same input → byte-identical output, across machines, across time.
**Why it matters:** Deterministic diffs are reviewable. Non-deterministic generators poison PRs with noise.
**Try this:** Run `bun run brand:generate` twice in a row. `git status` must be clean the second time.
**Go deeper:** https://reproducible-builds.org/

### "Parse, don't validate"
**What it is:** Parsers transform untyped input into typed output, catching shape errors at the boundary. Validators return booleans and leak untyped data downstream.
**Why it matters:** `parse.ts` returns typed `Token[]`; every emitter downstream is type-safe by construction.
**Try this:** Add a bad `$type` to a token in `tokens.json`. Run the generator. The error message should name the exact path, not a generic "invalid JSON."
**Go deeper:** https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/

### Marker-bracketed code generation
**What it is:** Generator owns content between `/* BRAND:START */` and `/* BRAND:END */`; everything else is hand-written.
**Why it matters:** Lets generators modify files they don't fully own (like `src/app.css`) without clobbering hand-written parts.
**Try this:** Hand-edit inside the markers, run the generator. Your edit is overwritten — as designed.

## Verify

1. `bun run brand:generate` runs in under 1 second.
2. Running twice produces no git changes.
3. Editing `yesid.color.brand.primary` in `tokens.json` and running produces diffs in exactly: `brand/tokens.css`, `src/lib/styles/tokens.css`, `src/app.css` (inside markers), `brand/tailwind.brand.js`, `src/lib/brand.ts`.
4. `bun run test` shows all 3 generator tests green + the full existing suite green.
5. `bun run check` green.
6. Site visual parity at 1440px and 375px on hero, services, blog.
