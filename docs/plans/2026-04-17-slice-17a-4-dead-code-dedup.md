# Slice 17a-4 — Dead Code + Dedup (Fresh Audit) — Implementation Plan

**Goal:** Close out the long-planned 17a-4 scope by confirming what's already done (most of it), fixing the small residue (2 primitive wirings + 1 broken content file + light TS tightening), and refreshing planning docs that still describe stale scope.
**Architecture:** Pure hygiene. No runtime changes. Component-level swaps to existing primitives. No new dependencies.
**Tech stack:** Svelte 5, TypeScript, existing shadcn `ui/` + brand primitives.
**Multi-session:** 0.5–1 session. Single sub-slice.
**Slice spec:** `docs/slices/slice-17a-4-dead-code-dedup.md`
**Depends on:** Slice 17e merged to `main`.

---

## What the audit found (2026-04-17)

Original 17a-4 scope per `docs/roadmap/standardization.md` listed:

1. Delete 4 dead components → **already deleted**.
2. Delete Three.js/Threlte stack + `/preview` routes + clean deps → **already deleted**.
3. Extract `isTouchDevice()` → **already extracted** to `motion/utils/device.ts`.
4. Consolidate `station-ping` keyframe → **already global** in `app.css`.
5. Extract section-heading CSS pattern → **already a brand primitive** (`SectionHeading`).
6. Wire `AboutIdentity` availability dot → **still a raw `<div>`.** Residue.
7. Wire `ContactPage` reset button → **still a raw `<button>`.** Residue.

Plus new findings worth handling:

- `src/content/stack/threejs-threlte.md` still points to deleted `src/lib/motion/three/`. Broken content.
- 5 non-test, non-shadcn `any` types in `utils.ts` / `flip.ts` / `morphHelpers.ts`. Minor tightening.
- Planning docs (`standardization.md`, `ARCHITECTURE.md`) and memory describe stale primitive counts. Needs refresh.

**Summary:** ~90% of original scope was absorbed into other sub-slices without updating standardization.md. This slice does the remaining 10% + the doc cleanup.

---

## File surface

### Modified
- `src/lib/components/about/AboutIdentity.svelte` — availability dot → `<StatusDot>` (+ ring prop if StatusDot doesn't support it).
- `src/lib/components/contact/ContactPage.svelte` — reset button → `<Button variant="ghost">`.
- `src/content/stack/threejs-threlte.md` — rewrite "On yesid.dev" paragraph to past-tense; keep the factual intro; point to `brand/decisions/what-i-killed.md` (Option A locked).
- `src/lib/utils.ts`, `src/lib/motion/utils/flip.ts`, `src/lib/motion/utils/morphHelpers.ts` — tighten `any`.
- `docs/roadmap/standardization.md` — mark done items, restate scope, update estimate.
- `docs/reference/ARCHITECTURE.md` — brand primitive inventory refresh (13 + 6 migrated).
- Memory note (`project_slice_17a2_status.md`) — update primitive count.

### Not touched
- `brand/` directory (that's 17h).
- Any shadcn `ui/*` component (kept on purpose).
- `src/lib/data/*.ts` (spot-checks showed all major exports used — no full audit in this slice).
- Static assets (spot-checks clean).

---

## Tasks (see slice spec for details)

1. **AboutIdentity availability dot** → `<StatusDot>`. May require adding a `ring?` prop to StatusDot. ~10 min.
2. **ContactPage reset button** → `<Button variant="ghost">` from `ui/button`. ~10 min.
3. **Three.js content file** — Option A locked 2026-04-17: rewrite the "On yesid.dev" paragraph to past-tense + pointer to `brand/decisions/what-i-killed.md`. Factual intro stays untouched. ~15 min.
4. **`any` type tightening** — 3 files, 5 occurrences. ~20 min.
5. **Planning-docs refresh** — standardization.md + ARCHITECTURE.md + memory note. ~20 min.

Each task ends with STOP per Iteration Protocol. Visual checks for Tasks 1 and 2 via Claude Preview.

---

## Execution order

Strictly sequential: 1 → 2 → 3 → 4 → 5.

No decision branches — Task 3's Option A is locked. Slice runs without mid-session pauses for design calls (only for visual approvals after each task).

---

## Out of scope

- Deep `$lib/data` export audit.
- Full static-asset sweep.
- Shadcn `ui/*` cleanup.
- Restructuring `$lib/data` or `$lib/motion`.
- `any` tightening that requires type-system refactors.
- 17h brand-bundle scope.

---

## Global acceptance

- `bun run test` green.
- `bun run check` green.
- Site renders identically at 1440px + 375px on `/about` and `/contact`.
- `grep -rn "motion/three" src/ docs/reference docs/roadmap` → zero hits.
- `standardization.md` 17a-4 row reflects fresh audit + 0.5–1 session estimate.
- `ARCHITECTURE.md` brand primitive list accurate (13 + 6 migrated note).
- Memory primitive count up to date.

---

## Why this slice is worth doing anyway

If the only remaining work were the 2 primitive wirings, it could fold into 17h-5 (source-of-truth refactor) as a small task. The reason 17a-4 stays as its own slice:

1. **Doc-cleanup value** — refreshing standardization.md + ARCHITECTURE.md + memory reduces friction for every downstream slice. Stale planning docs actively slow down planning sessions (as this audit just proved).
2. **Sequencing signal** — closing 17a-4 on paper unblocks 17h with a clean slate. Every "what's left in 17a?" question is answered.
3. **Pattern for future work** — the "audit before you plan" habit was the key value here. Capturing it in a learn doc (deferred to 17g's learning-docs refactor, or captured in the `Learn` section of the slice spec).

Skipping 17a-4 leaves `docs/roadmap/standardization.md` pointing to work that's already done, and memory continuing to misreport the primitive count. Both drift-sources worth eliminating before 17h's doc refactor touches the same files.

## What Yesid will learn

- **Audit-before-plan.** A 10-minute grep pass saved ~1 session of redundant work.
- **Primitive migration tracking.** `brand/index.ts` comment is ground truth for what moved where.
- **Doc drift is real and costly.** Planning docs + memory drift silently as other slices complete their work without updating cross-references.
