# Slice 17a-4 — Dead Code + Dedup (Fresh Audit)

**Status:** draft
**Priority:** 3
**Estimated effort:** 0.5–1 session
**Depends on:** 17e merged to `main`

## Objective

Close out the long-planned "dead code + trivial dedup" scope from `docs/roadmap/standardization.md` by running a fresh audit and handling only what's genuinely left. Most of the original scope was already done during 17a-2b / 17d / 17e. This slice confirms that, fixes the small residue, tightens a few `any` types, and updates the planning docs that still describe the old scope.

## Context

Planning docs (standardization.md, memory, parts of ARCHITECTURE.md) describe 17a-4 as if none of its scope has landed. The audit done 2026-04-17 found otherwise:

**Already done** (verified — skip in this slice):
- `AboutBento.svelte`, `BlogCard.svelte`, `SectionHeader.svelte`, old top-level `ProjectCard.svelte` — deleted.
- `src/lib/motion/three/**` + `src/routes/preview/**` — deleted.
- Threlte / three / postprocessing package.json deps — removed.
- `isTouchDevice()` triplication — extracted to `src/lib/motion/utils/device.ts`; `magnetic` + `cursorGlow` import cleanly.
- `@keyframes station-ping` + `.station-badge-wrapper` — global keyframe in `app.css`, class lives once in `MetroStation.svelte`.
- Section-heading CSS dedup — `brand/SectionHeading` primitive handles it.
- `Tag`, `NumberBadge`, `HazardStripe`, `GradientSeparator`, `BrandButton`, `CardBase` — migrated into shadcn `ui/` equivalents (`ui/badge`, `ui/separator`, `ui/button`, `ui/card`).

**Genuinely remaining** (the scope of this slice):
- 2 primitive wirings (AboutIdentity availability dot, ContactPage reset button).
- 1 broken content reference (Three.js / Threlte stack markdown still points to deleted code).
- Small `any`-type tightening (3 files, 5 occurrences).
- Planning-docs refresh to stop describing already-done work as planned.

## Architecture

No runtime architecture change. Pure hygiene:

- Two component edits (AboutIdentity, ContactPage) — swap raw HTML for existing primitives.
- One content-file decision (keep as historical note vs. remove from stack).
- Light TS cleanup (3 files, minimal blast radius).
- Doc refresh across 3 planning docs.

Other than component-level tests, no site behavior changes.

## Tech Stack

Svelte 5, TypeScript, existing brand primitives + shadcn ui/. No new dependencies.

## File Structure

### Modified
```
src/lib/components/about/AboutIdentity.svelte       — swap availability dot → <StatusDot>
src/lib/components/contact/ContactPage.svelte       — swap reset button → <Button variant="ghost">
src/content/stack/threejs-threlte.md                — rewrite or remove (see Task 3 options)
src/lib/utils.ts                                    — tighten 2 `any` types
src/lib/motion/utils/flip.ts                        — tighten 2 `any` types
src/lib/motion/utils/morphHelpers.ts                — tighten 1 `any` type
docs/roadmap/standardization.md                     — mark already-done items + restate 17a-4 scope
docs/reference/ARCHITECTURE.md                      — verify brand primitive list matches reality
(memory notes)                                      — update primitive count (13 brand + 6 ui/ migrated)
```

### No changes needed
```
brand/ primitives inventory (13 .svelte, all used)
Motion actions (6, all used)
Static assets (all referenced — spot-checked)
Global keyframes in app.css (no scoped duplicates found)
```

### Deleted
_Nothing new — all dead files already deleted in prior sub-slices._

---

## Task 1: Swap `AboutIdentity.svelte` availability dot → `<StatusDot>`

**Files:**
- Modify: `src/lib/components/about/AboutIdentity.svelte`

Current state (lines 48–49):
```svelte
<!-- Green availability dot -->
<div class="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[var(--muted)] bg-emerald-500"></div>
```

Replace with `<StatusDot color="green" pulse />` (or equivalent — confirm the StatusDot prop surface supports the `border-muted` ring first). If StatusDot doesn't offer a "ringed" variant, either:
- Add a `ring` prop to StatusDot (small primitive extension), OR
- Wrap StatusDot in a positioned absolute div that provides the ring.

- [ ] **Step 1:** Read `src/lib/components/brand/StatusDot.svelte` — confirm prop surface (color, pulse, ring?).
- [ ] **Step 2:** If StatusDot doesn't support a ring: add `ring?: boolean` prop (default false). Document in CSS.md.
- [ ] **Step 3:** Import `StatusDot` (the file already imports `StopLabel` from the same barrel — extend the import).
- [ ] **Step 4:** Replace the `<div>` at line 49 with the StatusDot invocation.
- [ ] **Step 5:** Run `bun run test src/lib/components/about/AboutIdentity` + `bun run check`.
- [ ] **Step 6:** Visual check via Claude Preview — `/about` shows green dot with ring; pulse on.

**STOP.** Yesid confirms the dot still looks right.

---

## Task 2: Swap `ContactPage.svelte` reset button → `<Button variant="ghost">`

**Files:**
- Modify: `src/lib/components/contact/ContactPage.svelte`

Current state (lines 373–378):
```svelte
<button
  onclick={handleReset}
  class="mt-4 self-start rounded border border-[var(--border)] px-4 py-2 font-mono text-caption text-[var(--secondary-foreground)] transition-all duration-200 hover:border-[var(--primary)] hover:text-[var(--foreground)]"
>
  {resolveLocale(c.success.resetLabel, 'en')}
</button>
```

Replace with shadcn `Button` (the codebase already has `ui/button` and memory confirms `BrandButton → ui/button` migration).

- [ ] **Step 1:** Read `src/lib/components/ui/button/button.svelte` (or its variants file) — confirm `ghost` variant exists and matches the visual expectation.
- [ ] **Step 2:** Import `Button` from `$lib/components/ui/button`.
- [ ] **Step 3:** Replace the raw `<button>` with `<Button variant="ghost" onclick={handleReset} class="...">`. Carry over only styling that isn't the default ghost variant (probably `mt-4 self-start font-mono text-caption`).
- [ ] **Step 4:** Run `bun run test src/lib/components/contact/ContactPage` + `bun run check`.
- [ ] **Step 5:** Visual check — `/contact` success state → reset button visible, clickable, correctly styled.

**STOP.** Yesid confirms the reset flow still works.

---

## Task 3: Rewrite `src/content/stack/threejs-threlte.md` as historical (Option A, locked 2026-04-17)

**Files:**
- Modify: `src/content/stack/threejs-threlte.md`

**Decision (locked):** keep the tech-stack entry, rewrite the "On yesid.dev" paragraph to past-tense. Keeps tech-breadth signal on the tech-stack page AND — by explaining *why* Three.js was retired — reinforces the engineering-judgment case study. Cross-link to `brand/decisions/what-i-killed.md` once 17h-3 lands.

Current state (line 23) still reads:
> "On yesid.dev, Three.js / Threlte powers the hero scene — … scene components live in `src/lib/motion/three/`…"

The `src/lib/motion/three/` folder no longer exists. Content is a lie.

- [ ] **Step 1:** Read the full file. Identify: (a) the factual "what is Three.js / Threlte" introduction — this stays untouched, (b) the "On yesid.dev" application paragraph — this gets rewritten.
- [ ] **Step 2:** Rewrite the application paragraph to past-tense. Suggested shape (Yesid to edit for voice):
  > "On yesid.dev, Three.js / Threlte powered an experimental 3D hero scene during the early build — meshes, lights, and post-processing (bloom, vignette) composed as Svelte components. The scene was retired in favor of SVG-based hero art after a performance + accessibility review: WebGL init cost, a11y gaps on the 3D canvas, and the reduced-motion fallback effectively duplicating an SVG path anyway. Three.js / Threlte stays on the stack as a validated option for future clients whose brief genuinely needs it. See `brand/decisions/what-i-killed.md` for the full rationale (once 17h-3 ships)."
- [ ] **Step 3:** Add a footnote or inline note: "Three.js / Threlte scene components were previously at `src/lib/motion/three/` — removed in Slice 17 cleanup."
- [ ] **Step 4:** Verify no OTHER file references `src/lib/motion/three/`:
  ```bash
  grep -rn "src/lib/motion/three\|motion/three" src/ docs/reference | grep -v "^docs/devlog\|^docs/handoffs"
  ```
  Expected: zero hits outside this rewritten file (and even there only as the "previously at" pointer).
- [ ] **Step 5:** `bun run test` + `bun run check` — both green. The tech-stack page still renders the entry; only the prose changed.
- [ ] **Step 6:** Visual check on `/tech-stack` — Three.js node still appears, selected panel shows the rewritten content.

**STOP.** Yesid reads the rewritten paragraph and tightens the voice if needed.

---

## Task 4: Tighten `any` types

**Files:**
- Modify: `src/lib/utils.ts`, `src/lib/motion/utils/flip.ts`, `src/lib/motion/utils/morphHelpers.ts`

5 `any` occurrences confirmed. Shadcn `ui/data-table/*` and test files excluded from this scope — those `any`s are acceptable (shadcn-scaffolded / test-internal).

- [ ] **Step 1:** Read each file. For each `any`, determine the real type from context.
- [ ] **Step 2:** Replace with `unknown` + narrowing, specific types, or generics. Prefer `unknown` + type guard for values from outside sources.
- [ ] **Step 3:** `bun run check` after each file — must stay green.
- [ ] **Step 4:** If a real type would require substantial refactor (unlikely given file sizes), leave a short `// TODO(17a-4): narrow this — requires X` comment and open a follow-up line in devlog. Don't force architectural changes in a cleanup slice.

**STOP.** Yesid reviews the diffs. Confirms no regressions.

---

## Task 5: Refresh planning docs to reflect 17a-4 reality

**Files:**
- Modify: `docs/roadmap/standardization.md`
- Modify: `docs/reference/ARCHITECTURE.md` (brand primitive list cross-check)
- Memory: update `project_slice_17a2_status.md` if primitive count is stale

- [ ] **Step 1: `standardization.md`** —
  - Mark the bulk of 17a-4 scope as "done in 17a-2b / 17d / 17e" (inline strike-through or annotation).
  - Rewrite the 17a-4 row: "17a-4 — Dead code + dedup fresh audit (planning doc cleanup + 3 residue fixes)". Update session estimate to 0.5–1.
- [ ] **Step 2: `ARCHITECTURE.md`** —
  - Confirm brand primitive list matches today's `src/lib/components/brand/` (13 files: BlueprintShell, ChevronToggle, CornerMarks, GlowOverlay, MetricDisplay, MetroStation, SectionHeading, SectionLabel, StatusDot, StickyPanel, StopLabel, SvgIcon, TerminalChrome).
  - Add a note: "6 primitives previously listed (Tag, NumberBadge, HazardStripe, GradientSeparator, BrandButton, CardBase) migrated into shadcn `ui/` equivalents. See `src/lib/components/brand/index.ts` comment for the mapping."
  - Remove any lingering reference to `src/lib/motion/three/`.
- [ ] **Step 3: Memory note refresh.**
  - Update `project_slice_17a2_status.md` (or equivalent) so the primitive count and list are current. One-line correction: "13 brand primitives + 6 migrated to ui/; see brand/index.ts for mapping."
- [ ] **Step 4:** Grep final pass: `grep -rn "motion/three" docs/ src/ | grep -v "^docs/devlog/\|^docs/handoffs/"` should be empty (historical logs exempt).

**STOP.** Yesid reads the refreshed standardization.md and confirms it describes reality.

---

## Execution Order

Tasks 1 → 2 → 3 → 4 → 5. Strictly sequential. Total: 0.5–1 session.

Tasks 1 and 2 are component-level swaps; either could run first. Task 3 awaits a Yesid call. Task 4 is independent. Task 5 closes the slice — do last so the docs reflect the final state including this slice's work.

## Out of Scope

- **Anything already done in prior sub-slices** — the audit confirmed it's gone; don't chase ghosts.
- **Deep dead-export audits in `$lib/data/*.ts`** — spot-checks showed all major exports used. A full export-level audit could happen in a future slice if a need arises.
- **Full static-asset audit** — spot-checks showed all assets referenced; no orphans found worth a formal sweep.
- **Shadcn `ui/*` cleanup** — scaffolded components are kept on purpose even if unused today (fits 17h's component-library inventory).
- **Restructuring `src/lib/data/` or `src/lib/motion/`** — architectural work belongs in 17b / 17c / 17f, not a cleanup slice.
- **Rewriting `any` types that require type-system refactors** — leave a TODO if substantial.
- **17h scope** — brand bundle work is its own slice. This slice does not touch `brand/`.

## Acceptance Criteria

- [ ] `AboutIdentity` availability dot uses `<StatusDot>` (with ring if primitive supports, or documented extension).
- [ ] `ContactPage` reset button uses `<Button variant="ghost">` from `ui/button`.
- [ ] `src/content/stack/threejs-threlte.md` rewritten to past-tense (Option A locked 2026-04-17), with pointer to `brand/decisions/what-i-killed.md` for full rationale.
- [ ] Non-test, non-shadcn `any` types in `src/lib/utils.ts`, `src/lib/motion/utils/flip.ts`, `src/lib/motion/utils/morphHelpers.ts` replaced with proper types or documented TODOs.
- [ ] `docs/roadmap/standardization.md` reflects actual 17a-4 reality (scope shrunk, estimate updated).
- [ ] `docs/reference/ARCHITECTURE.md` brand primitive list is accurate.
- [ ] Memory notes updated where primitive counts are stale.
- [ ] `bun run test` green.
- [ ] `bun run check` green.
- [ ] Site renders identically before/after. No visual regressions.
- [ ] No `grep -rn "motion/three" src/` hits outside historical devlogs/handoffs.

## Learn

### "Check reality before planning"
**What it is:** Planning docs and memory drift. Before starting a planned slice, verify what's actually still true.
**Why it matters:** The original 17a-4 scope was ~90% already done; running it blindly would have been 1 session of busywork. A 10-minute audit prevented the waste.
**Try this:** Before any planned slice with a > 2-week-old description, grep for the claimed "targets." What's already gone?

### Primitive migration tracking
**What it is:** When a brand primitive moves to a shadcn `ui/` equivalent (e.g., `BrandButton → ui/button`), the brand inventory shrinks but the capability stays. The barrel index.ts comment is the authoritative mapping.
**Why it matters:** Outdated primitive lists in docs and memory confuse future sessions. `brand/index.ts` header is the one place where "what moved where" is recorded — treat it as ground truth.
**Try this:** Read `src/lib/components/brand/index.ts`. The comment lines describe the post-17d migration pattern.

## Verify

1. `/about` renders — availability dot visible, pulsing, ringed correctly.
2. `/contact` renders — submit form → success state → reset button visible and functional.
3. `bun run test` green with the two component test files passing.
4. `bun run check` green (no type regressions from Task 4).
5. `grep -rn "motion/three" src/ docs/reference docs/roadmap` — zero hits (historical logs exempt).
6. Read `docs/roadmap/standardization.md` 17a-4 row — describes the fresh audit, not stale scope.
7. Read `docs/reference/ARCHITECTURE.md` brand primitives list — 13 current + note about the 6 migrated.
