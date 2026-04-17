# Handoff: Slice 17a-4 — Dead Code + Dedup (Fresh Audit)

## 1. Objective Completed

**Implemented:**
- Fresh audit of the long-planned 17a-4 scope (2026-04-17). Verified ~90% was already absorbed into 17a-2b / 17d / 17e without a planning-doc update.
- 2 residue primitive wirings (AboutIdentity availability dot; ContactPage reset button).
- 1 broken content rewrite (`src/content/stack/threejs-threlte.md` — past-tense per "killed, not parked").
- 5 `any` type tightens in 3 files.
- Planning-doc refresh — `docs/roadmap/standardization.md`, `docs/reference/ARCHITECTURE.md`, `docs/roadmap/PLAN.md`, `src/lib/components/brand/index.ts` comment, memory note.
- Pre-Task-1 pre-existing-bug fix: 2 blog content files CRLF → LF + `parseFrontmatter` hardened to tolerate either line ending.

**Intentionally not implemented:**
- Deep `$lib/data` export audit — spot-checks found all major exports used.
- Full static-asset sweep — spot-checks clean.
- Shadcn `ui/*` cleanup — scaffolded components kept on purpose (future 17h inventory work).
- Restructuring `$lib/data` or `$lib/motion` — architectural work belongs to 17b / 17c / 17f.
- `any` tightening that would require type-system refactors — none needed in these 3 files; all 5 resolved with `unknown` / named types / narrow union casts.
- Rewriting the `Why I use it` section's library-level reasoning — kept (the section is about the library, not the project; only the yesid.dev application paragraph was past-tensed).
- Wider `motion/three` cleanup across `docs/learn/`, `docs/plans/`, `docs/slices/`, `docs/specs/` — out of 17a-4 scope per spec (historical artifacts, accurate at write-time). Belongs to 17g (Learning Docs refactor) and 17h (brand bundle doc migration).

## 2. High-Level Summary

17a-4 shipped as a short hygiene pass, not the original big cleanup slice. The audit done at kickoff showed that the dead Three.js/Threlte tree, dead top-level components, the `isTouchDevice()` triplication, the station-ping keyframe duplication, and the section-heading CSS dedup had all already been absorbed into 17a-2b / 17d / 17e without anyone updating `docs/roadmap/standardization.md` or `ARCHITECTURE.md`. The residue was:

- `AboutIdentity` availability dot — still a raw `<div>` with a hand-rolled border-ring.
- `ContactPage` success-state reset button — still a raw `<button>`.
- `src/content/stack/threejs-threlte.md` — still described Three.js / Threlte as actively powering the hero, with a live pointer to the now-deleted `src/lib/motion/three/` folder.
- 5 `any` types in shared utility files (`src/lib/utils.ts`, `src/lib/motion/utils/flip.ts`, `src/lib/motion/utils/morphHelpers.ts`) that could be tightened without architectural changes.
- Planning docs and memory notes drifted — primitive counts stale, 17a-4 described as planned-not-started.

Two discoveries during the session:

1. **Tests weren't green at `main`** — 3 data-integrity tests silently failed because the previous session had written 2 blog files with CRLF line endings, which the frontmatter regex `/^---\n/` didn't match. Fixed the files (LF) and hardened the regex to `/^---\r?\n/` as a durable guard.
2. **StatusDot's existing `pulse` prop collided with a would-be Tailwind `ring` utility** — both use `box-shadow`. The fix was a new `ring` prop that uses CSS `outline` (separate property), composing cleanly with the `led-pulse` animation.

Everything else matched the spec-locked Option A for Task 3 (rewrite to past-tense + forward-reference to `brand/decisions/what-i-killed.md` in 17h-3). After Yesid's clarification that "threlte is dead on the project" — not "retired/parked" — the prose was hardened to drop the "stays on the stack as a validated option" hedge and the frontmatter was updated (`relatedProjects: [yesid-dev]` → `[]`; `Why I use it` → `Why I chose it`).

## 3. Files Created

| File | Purpose |
|------|---------|
| `docs/handoffs/slice-17a-4-dead-code-dedup.md` | This handoff |
| `docs/devlog/2026-04-17-slice-17a-4.md` | Session devlog |
| `docs/learn/workflow/audit-before-plan.md` | Learning doc — why a 10-minute audit beat a 1-session blind execution |
| `docs/learn/styling/outline-vs-ring-pulsing-dots.md` | Learning doc — CSS outline vs Tailwind ring when a box-shadow animation already owns the shadow |

## 4. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `src/lib/components/brand/StatusDot.svelte` | Added `ring?: boolean` prop → applies `outline outline-[3px] outline-[var(--muted)]` when true | CSS outline composes with `led-pulse` box-shadow; Tailwind `ring` would collide |
| `src/lib/components/brand/__tests__/StatusDot.test.ts` | +2 tests (`applies halo outline when ring=true`, `omits outline classes by default`) | Cover new prop |
| `src/lib/components/brand/index.ts` | Header comment updated: "9 reusable" → "13 reusable", migration note reformatted | Stale count, clearer mapping |
| `src/lib/components/about/AboutIdentity.svelte` | Raw `<div>` availability dot → `<StatusDot color="green" pulse size="md" ring class="absolute bottom-1 right-1" />`; added `StatusDot` to the barrel import | Residue primitive wiring |
| `src/lib/components/contact/ContactPage.svelte` | Raw `<button>` reset → `<Button variant="ghost" ... class="mt-4 self-start font-mono text-caption">`; `Button` was already imported | Residue primitive wiring |
| `src/content/stack/threejs-threlte.md` | Frontmatter `relatedProjects: [yesid-dev]` → `[]`; "Why I use it" → "Why I chose it" (past-tense body); "In Practice" fully rewritten to past-tense ("killed, not parked") + forward pointer to `brand/decisions/what-i-killed.md` + inline note about the removed `src/lib/motion/three/` folder | Threlte dead on the project; frontmatter and prose must match reality |
| `src/lib/data/blog.ts` | `parseFrontmatter` regex `/^---\n/` → `/^---\r?\n/`; split on `/\r?\n/` too | CRLF-tolerant — durable guard against future Windows writes |
| `src/content/blog/professional/building-a-transit-pipeline/index.md` | CRLF → LF | Match every other post; was breaking 3 data-integrity tests silently |
| `src/content/blog/professional/lorem-etl-patterns/index.md` | CRLF → LF | Same |
| `src/lib/utils.ts` | `{ child?: any }` → `{ child?: unknown }`, `{ children?: any }` → `{ children?: unknown }`; eslint disables removed | Shadcn key-existence probe — `unknown` is equivalent for the `extends` check |
| `src/lib/motion/utils/flip.ts` | Introduced `export type FlipState = ReturnType<typeof Flip.getState> \| null`; `captureFlipState(): any` → `captureFlipState(): FlipState`; `flipState: any` param → `flipState: FlipState`; eslint disables removed | Type FLIP state properly; consumers unaffected (none annotated the type) |
| `src/lib/motion/utils/morphHelpers.ts` | `(MorphSVGPlugin.convertToPath as any)(el)[0]` → `instanceof SVGPathElement ? el : MorphSVGPlugin.convertToPath(el as SVGCircleElement \| ...)[0]` | Narrow cast + path-pass-through; equivalent runtime behavior, no more `any` |
| `docs/roadmap/standardization.md` | Table row, tree view, and the full "Remaining — 17a-4" block rewritten; callouts about 17a-4 updated | Describe reality after fresh audit |
| `docs/reference/ARCHITECTURE.md` | Brand primitive tree updated to 13 files (added `SectionHeading`, `MetroStation`, `SvgIcon`); StatusDot flagged with new `ring` prop; migration note to `ui/` equivalents added | Accurate primitive inventory |
| `docs/reference/CSS.md` | `StatusDot` props row updated `color, pulse, size, ring` | Document the new prop |
| `docs/roadmap/PLAN.md` | Removed the `src/lib/motion/three/` line from the motion tree; added historical snapshot disclaimer | Grep compliance for spec-scoped dirs |
| `docs/reference/TESTS.md` | Added StatusDot +2 entry under Components → Brand | Keep test index accurate |
| `docs/reference/PATTERNS.md` | Added two entries (CRLF-tolerant frontmatter parser; CSS outline for halo rings on pulsing box-shadow elements) | Capture reusable patterns |
| `docs/slices/slice-17-checkpoint.md` | Updated current position — 17a-4 complete | Session handoff |
| `tree.txt` | Regenerated | Reflect current file tree |
| `~/.claude/projects/.../memory/project_slice_17a2_status.md` | Primitive inventory refreshed (13 on disk + 6 migrated to `ui/`); authoritative mapping pointer | Prevent future drift |

## Concepts Documented

| Action | File | Domain |
|--------|------|--------|
| Created | `docs/learn/workflow/audit-before-plan.md` | workflow |
| Created | `docs/learn/styling/outline-vs-ring-pulsing-dots.md` | styling |

_See `docs/learn/README.md` for the full knowledge base._

## 5. Data Model Changes

None. Zero changes to `src/lib/data/types.ts`. The `FlipState` type added to `src/lib/motion/utils/flip.ts` is a motion-layer internal type, not a public data model.

## 6. Commands Executed

```bash
# Baseline + branch setup
git checkout -b feature/slice-17a-4-dead-code-dedup
git status
bun install
bun run check
bun run test   # 3 failed on data-integrity — pre-existing CRLF bug

# Pre-Task-1 unblocker
perl -pi -e 's/\r\n/\n/g' src/content/blog/professional/building-a-transit-pipeline/index.md src/content/blog/professional/lorem-etl-patterns/index.md
# + Edit to src/lib/data/blog.ts (CRLF-tolerant regex)
bun run test   # 780/780 green
bun run check  # 0 errors

# Task 1 — AboutIdentity dot
bun run test src/lib/components/brand/__tests__/StatusDot.test.ts src/lib/components/about/
bun run check
# preview_start + preview_resize (1440/375) + preview_inspect for visual verify

# Task 2 — ContactPage reset
bun run test src/lib/components/contact/
bun run check
# preview_eval for form fill/submit + preview_screenshot at both breakpoints

# Task 3 — threejs-threlte.md
grep -rn "src/lib/motion/three\|motion/three" src/ docs/reference docs/roadmap
bun run test
bun run check

# Task 4 — any tightens
bun run check   # after each file edit

# Task 5 — planning doc refresh
grep -rn "motion/three" src/ docs/reference docs/roadmap   # spec-scoped grep
bun run test
bun run check
```

## 7. Validation Results

```
bun run test: PASS (82 test files, 782 tests)
bun run check: PASS (0 errors, 19 pre-existing warnings)
Spec-scoped grep: 2 hits, both intentional (threejs-threlte.md back-pointer + standardization.md strikethrough annotation)
Wider grep across docs/: hits only in learn/plans/slices/specs — out of 17a-4 scope
```

Visual verification via Claude Preview:
- `/about` at 1440 + 375: availability dot renders as 10px green core + ~3px muted outline + pulsing orange halo. Position identical to pre-change.
- `/contact` at 1440 + 375: fill form → intercept `fetch` to Web3Forms → success terminal animates → "reset --form" Button renders ghost variant at bottom-left. Subtle at rest (no border), `hover:bg-muted` on pointer.

Tests added: +2 StatusDot ring tests. Total test count: 780 baseline → 782 with new tests. No regressions in any other file.

## 8. Errors Encountered

- **Error:** `data-integrity.test.ts`: "expected '' not to be ''" — 3 failures on blog post title/date/tags.
  - **Cause:** 2 blog files landed on `main` via PR #19 with CRLF line endings; `parseFrontmatter` regex `/^---\n/` didn't match `---\r\n`, so both posts loaded with empty frontmatter.
  - **Fix:** Normalized both files to LF; hardened `parseFrontmatter` regex to `/^---\r?\n/` and frontmatter split to `/\r?\n/`.
  - **Resolved:** Yes — 780/780 tests green after fix. Bug was silent on `main` (checkpoint claimed 780/780 but reality was 777/780).

- **Error:** Task 1 first-attempt: Tailwind `ring-[3px] ring-[var(--muted)]` didn't render a visible halo in DevTools inspect.
  - **Cause:** Tailwind's `ring-*` utility uses `box-shadow`, which collides with the `led-pulse` keyframe animation that also animates `box-shadow`. The keyframe overrides the ring.
  - **Fix:** Switched StatusDot's `ring` prop implementation to `outline outline-[3px] outline-[var(--muted)]` — CSS `outline` is a separate property and composes with the animated box-shadow.
  - **Resolved:** Yes — captured as a learning doc at `docs/learn/styling/outline-vs-ring-pulsing-dots.md` and a PATTERNS.md entry.

- **Error:** Task 2 visual verification at 375px: form fields vanished after `preview_resize`.
  - **Cause:** Viewport resize caused a re-mount; the injected `fetch` stub was lost.
  - **Fix:** Reloaded the page, re-installed the stub, re-filled + re-submitted. Visual confirmed.
  - **Resolved:** Yes.

## 9. Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| Task 3 — 1 | "threlte is dead on the project" | Dropped "stays on the stack as a validated option" hedge; rewrote to "Killed, not parked"; dropped `relatedProjects: [yesid-dev]`; renamed "Why I use it" → "Why I chose it" (past-tense body) | `src/content/stack/threejs-threlte.md` |
| Others | Approved first try | — | — |

## 10. Assumptions Made

- **StatusDot `ring` prop color.** The original raw div used `border-[var(--muted)]`, matching the card background. The new `ring` prop hardcodes that color choice (no ring-color prop). Assumption: this is the only use case for a while. If a future case needs a different ring color, extend to `ring: boolean | string`.
- **Ghost variant for reset button.** Spec said ghost; the old reset had a visible outlined border at rest (closer to `variant="outline"`). Chose ghost per spec; flagged the visual trade-off in the STOP. Yesid approved ghost.
- **`Why I use it` section left partially present-tense.** The section is about the library, not the project. Past-tensed the verbs that described project-specific use ("gave me the ability", "I paired Threlte with GSAP"); kept the library's general appeal ("3D on the web is a differentiator"). Flagged; Yesid approved.
- **`proficiency: proficient` kept.** Skill level, not active-use status. You shipped a working 3D hero with post-processing and reduced-motion fallback; still proficient even after killing the scene.
- **`connectsTo: [svelte-5, gsap]` kept.** Library-architecture fact, not per-project wiring. When a future interactive diagram ships, the edges still reflect how Three.js logically connects when used.

## 11. Known Gaps / Deferred Work

- **Wider `motion/three` cleanup across `docs/learn/3d-graphics/*.md` (5 files), `docs/learn/meta.json`, `docs/plans/2026-04-13-slice-17a-6-*.md`, `docs/slices/slice-06b-*.md`, `slice-06d-*.md`, `slice-17a-3a-*.md`, and 3 `docs/specs/*.md` files.** Historical artifacts, accurate at write-time. Belongs to 17g (Learning Docs refactor) for `docs/learn/`, and 17h (doc migration) for the others.
- **`src/content/stack/threejs-threlte.md` cross-link target** — the prose points at `brand/decisions/what-i-killed.md`, which doesn't exist yet. 17h-3 creates it.
- **Barrel `index.ts` `SvgIcon` type export** — the `brand/index.ts` file exports `SvgIcon` as a default but not its props type. Not a blocker; SvgIcon likely doesn't define a `Props` export.
- **`docs/roadmap/PLAN.md` other stale lines** — `actions: boop, reveal, magnetic, ripple` (reveal + ripple were cut in 17e); components list mentions `ProjectCard` and `SectionHeader` (deleted). Left alone per 17a-4 "don't chase ghosts" rule. Full refresh is 17g scope.
- **Shadcn `ui/data-table/*` and test files have `any` types.** Explicitly excluded from Task 4 per spec.

## 12. What Yesid Should Know

**1. The audit-before-plan lesson is the real win.** Running 17a-4 blindly per the 2+-week-old `standardization.md` would have been ~1 session of rediscovering that the work was already done. A 10-minute grep pass at kickoff reframed the slice from "big cleanup" to "small residue + doc refresh". Captured in `docs/learn/workflow/audit-before-plan.md` — reuse before every planned slice with a > 2-week-old spec.

**2. The CRLF bug was silent on `main`.** The pattern: Windows-saved `.md` → landed via PR → `parseFrontmatter` regex silently failed → affected posts loaded with empty fields → 3 tests failed → checkpoint still claimed "780/780 pass" because no one ran tests locally after the PR merged. Fix was durable: the regex now tolerates CRLF, so future Windows writes won't silently break. Worth considering a pre-commit hook that normalizes LF in `src/content/**/*.md`.

**3. Tailwind `ring` ≠ CSS `outline` when a box-shadow animation is in play.** `ring-*` compiles to `box-shadow`. Any element with an animated `box-shadow` (like `led-pulse`) will have its ring silently clobbered. Use `outline-*` when you need a halo on a pulsing dot. Documented in `docs/learn/styling/outline-vs-ring-pulsing-dots.md` + PATTERNS.md.

**4. The 17a-4 scope-shrink should be the model for every cleanup slice.** Planning docs drift silently as other slices complete their work without updating cross-references. Before running a planned cleanup: audit what's actually still broken, shrink the scope, document the shrink.

## 13. Next Recommended Slice

**17h — Brand Bundle + Source-of-Truth Refactor.** Spec + plan + sub-slice stubs written 2026-04-17. 17a-4's closeout on paper clears the last "what's left in 17a?" question — 17h can start with a clean slate.

First sub-slice: **17h-1 (Tokens Consolidation)**. Spec at `docs/slices/slice-17h-1-tokens-consolidation.md`. Opening line: _"Move the canonical design-token source from `src/lib/styles/tokens.css` + `src/app.css` `@theme` into a new `brand/tokens/` hierarchy, with a code-generator that emits the current CSS + TS forms at build time."_

## 14. Final Status

**COMPLETE** — all 5 task acceptance criteria met, 782/782 tests pass, `bun run check` green, all 5 tasks Yesid-approved. Spec-scoped grep clean. Pre-existing CRLF bug fixed as a bonus.
