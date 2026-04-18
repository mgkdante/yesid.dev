# Slice 17b — Handoff

Reviewer-facing record. Grows one section per Level-3 task as tasks complete. Final sections (Summary + PR body) appended at Task 17b-10.

---

## 17b-1 — Folder restructure (data/ → content/ + utils/ + types.ts)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- `src/lib/data/` dissolved. Content moved to `src/lib/content/`; pure engines moved to `src/lib/utils/`; shared TypeScript types promoted to `src/lib/types.ts`.
- `src/lib/utils.ts` (shadcn-svelte `cn` helper) folded into the new `src/lib/utils/cn.ts`. Resolves a collision that the plan had not anticipated.
- Barrels added: `src/lib/content/index.ts`, `src/lib/utils/index.ts`. `src/lib/types.ts` is already flat and self-barrels.
- 375 files updated across `src/`; 426 import rewrites covering three flavours:
  - `$lib/data/<specific>` → `$lib/types` / `$lib/utils/*` / `$lib/content/*`
  - `from '$lib/data'` bare barrel → grouped `$lib/types` + `$lib/utils` + `$lib/content` imports
  - `$lib/utils.js` (shadcn file) → `$lib/utils` (new barrel)
- `vite.config.ts` `data` test-project include patterns updated so the moved `.test.ts` files still run.

### What did **not** change

No visual, behavioural, or content changes. Every component renders the same data from the same source values; only the path to those values moved.

### Verification

| Check | Baseline | Post-17b-1 |
|---|---|---|
| `bun run test` | 82 files / 782 tests pass | 82 files / 782 tests pass |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |

### Files of interest for review

- `src/lib/content/index.ts` — content barrel (transitional; tightening starts in 17b-4).
- `src/lib/utils/index.ts` — utility barrel.
- `src/lib/utils/cn.ts` — moved shadcn helper.
- `vite.config.ts` — vitest `data` project include patterns.
- Any `$lib/data/...` import across `src/` (there should be zero).

### Design notes recorded in `log.md`

- Plan gap: `src/lib/utils.ts` collision → Option A (move to `utils/cn.ts`) approved.
- Barrel scope: re-export every module under its layer; transitional for components, permanent for adapters + future consumers.

---

## 17b-2 — Adapter scaffold (`ContentAdapter` + static + contract test)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- New folder `src/lib/adapters/` with four files:
  - `types.ts` — `ContentAdapter` interface + six port interfaces.
  - `static.ts` — `staticAdapter: ContentAdapter`, async wrappers over every `$lib/content/*` export.
  - `index.ts` — one-line swap point re-exporting the active adapter.
  - `adapter.test.ts` — 37 contract tests verifying shape + cardinality + not-found behavior.
- `vite.config.ts` test include gained `src/lib/adapters/**/*.test.ts`.

### What did **not** change

No consumer uses the adapter yet — route loaders and components still import from `$lib/content/*`. Preview rendering is identical to post-17b-1. Wiring lands in Task 17b-3 (repositories) + 17b-4 (loaders).

### Verification

| Check | Post-17b-1 | Post-17b-2 |
|---|---|---|
| `bun run test` | 82/782 pass | 83/819 pass (+1 file, +37 tests) |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |

### Review focus

- `src/lib/adapters/types.ts` — the contract every future CMS must satisfy. `typeof import('...')` pattern binds the content port to current site-content shapes (intentional; future adapters must match).
- `src/lib/adapters/static.ts` — verify every method maps to an existing content export; no transformation or business logic.
- `src/lib/adapters/adapter.test.ts` — 37 assertions; shallow on purpose (deep data in content/integrity.test.ts).

---

## 17b-3 — Repository layer (ports on top of the adapter)

**Commit:** _(SHA appended after Yesid approval)_
**Status:** proposed — awaiting approval

### What changed

- New folder `src/lib/repositories/` with 6 modules + barrel:
  - `project.ts`, `service.ts`, `blog.ts`, `meta.ts`, `tech-stack.ts`, `content.ts`, `index.ts`
  - Every function is async, delegates to `adapter.<collection>.<verb>`, returns `readonly` collections / `undefined` for not-found.
- Metro-line derivation folded into `repositories/service.ts`:
  - `getMetroStops`, `getTotalStops`, `getStopByType`, `formatStopLabel`, `formatServicesLabel` (all async except `formatStopLabel` which is a pure sync formatter).
  - Labels preserved verbatim: "Departure" / "Featured Work" / "Who's Driving" / "Dispatches" / "Final Destination".
- `meta` repository exposes `getPersonSchema()` — the only repository method that *composes* (calls `buildPersonSchema` on adapter data).
- Three query-function test files moved and rewritten async:
  - `content/metro.test.ts` → `repositories/service.test.ts`
  - `content/projects.test.ts` → `repositories/project.test.ts`
  - `content/tech-stack.test.ts` → `repositories/tech-stack.test.ts`
- `content/metro.ts` deleted (functionality lives in the repository).
- `content/index.ts` loses the `./metro` re-export; comment left as a pointer.
- `vite.config.ts` `data` project `include` gains `src/lib/repositories/**/*.test.ts`.

### What did **not** change

Nothing user-visible. No consumer imports from `$lib/repositories` yet — route loaders still go through `$lib/content` directly. That migration lands in Task 17b-4.

### Verification

| Check | Post-17b-2 | Post-17b-3 |
|---|---|---|
| `bun run test` | 83/819 pass | **83/819 pass** (3 files moved in ↔ 3 moved out, net zero) |
| `bun run check` | 0 errors, 19 warnings | 0 errors, 19 warnings |
| Preview 10 primary URLs | 200 OK | 200 OK |

### Review focus

- `src/lib/repositories/service.ts` — metro labels kept verbatim from the old content file; spec reference had stock labels that would have caused visible copy changes.
- `src/lib/repositories/tech-stack.test.ts` — `validateTechItems` / `validateScenarios` imported directly from `$lib/content/tech-stack` rather than surfaced through the repository (test-only plumbing).
- `src/lib/content/metro.ts` removed; nothing outside the old test consumed its exports.
