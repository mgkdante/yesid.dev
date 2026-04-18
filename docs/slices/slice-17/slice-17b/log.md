# Slice 17b — Implementation Log

Running session-by-session record of the work. Chronological. Append-only.

---

## Session 2026-04-18 — Task 17b-1 Folder restructure

**Model:** Opus 4.7 [1m] (L-slice Implementation — working set spans multiple architectural layers and a large import rewrite).
**Branch:** `feature/slice-17b-repositories`
**Goal:** Dissolve `src/lib/data/` into `content/` + `utils/` + top-level `types.ts`. Preserve all tests green, zero functional change.

### Pre-flight

- P.1 Baseline: `bun run test` → 82 test files / 782 tests pass. `bun run check` → 0 errors, 19 warnings (pre-existing).
- P.2 Branch: `feature/slice-17b-repositories` ✓.
- P.3 TodoWrite seeded with 10 tasks. 17b-1 in_progress.
- P.4 Preview server deferred until after the restructure; visual check at step 1.13.

### Amendment flagged + approved

**Plan gap:** `src/lib/utils.ts` (shadcn-svelte helper with `cn`, `WithoutChild`, `WithElementRef`) was not mentioned in the plan yet collides with the new `src/lib/utils/` folder. 295 files imported it via `'$lib/utils.js'`.

**Resolution (Yesid approved):** Option A — move `utils.ts` content into `utils/cn.ts`, rewrite all 295 imports to the new `$lib/utils` barrel. Added a step 1.1b for the move.

**Follow-up direction (Yesid):** Add barrel exports for `content/` and `utils/` so the UI consumers (and downstream layers) can integrate cleanly. Implemented as `src/lib/content/index.ts` + `src/lib/utils/index.ts`.

### What shipped in this commit

- **Folder restructure:**
  - `src/lib/data/*` dissolved into `src/lib/content/*` (data types + content sources), `src/lib/utils/*` (pure engines), and `src/lib/types.ts` (promoted to top-level).
  - Renames inside the move: `content.ts → site-content.ts`, `highlight.ts → markdown.ts`, `stackRoles.ts → stack-roles.ts`, `serviceSvg.ts → service-svg.ts`, `schema.ts → json-ld.ts`, `data-integrity.test.ts → integrity.test.ts`.
  - `src/lib/utils.ts` (shadcn helpers) moved into `src/lib/utils/cn.ts`.
  - `src/lib/data/index.ts` deleted; `src/lib/data/` folder removed.
- **New barrels:**
  - `src/lib/content/index.ts` — re-exports every content module. Transitional during 17b; route loaders migrate to `$lib/repositories` in 17b-3+.
  - `src/lib/utils/index.ts` — re-exports every utility module. Safe target for the 295 `cn` consumers.
- **Import rewrite (426 replacements across 375 files):**
  - 301 `$lib/utils.js` → `$lib/utils` (the shadcn `cn` consumers).
  - 125 `$lib/data/<specific>` → new homes (`$lib/types`, `$lib/utils/*`, `$lib/content/*`).
  - Plus 22 bare-barrel imports (`from '$lib/data'` / `'$lib/data/index.js'`) expanded into grouped `$lib/types` + `$lib/utils` + `$lib/content` imports.
- **Cross-folder relative imports fixed:**
  - `utils/service-svg.ts`: `./services.js` → `$lib/content/services`.
  - `utils/json-ld.test.ts`: `./meta.js` → `$lib/content/meta`.
- **Vitest config updated:** `vite.config.ts` `data` project `include` was hard-coded to `src/lib/data/**/*.test.ts`; updated to `['src/lib/content/**/*.test.ts', 'src/lib/utils/**/*.test.ts', 'src/lib/styles/**/*.test.ts']`. Without this fix 14 test files / 237 tests silently disappeared from the run — caught by the baseline comparison at step 1.12.

### Verification

- `bun run check` → 0 errors, 19 warnings (same count + same locations as baseline).
- `bun run test` → 82 test files / 782 tests pass. Matches baseline exactly. No silent skips.

### Tooling notes

- Two one-shot Bun scripts were used (`_migrate-imports-17b-1.ts`, `_expand-barrel-17b-1.ts`) and deleted before commit — rewriting 295+ imports by hand would blow the token budget and risk inconsistency. Script outputs logged in the session for audit.

### Task 17b-1 approved 2026-04-18

---

## Session 2026-04-18 — Task 17b-2 Adapter scaffold

**Continuation of same session.** Pre-break check: Opus 4.7 [1m], context ~28% at start — comfortable to continue one more task.

### What shipped

- `src/lib/adapters/types.ts` — `ContentAdapter` interface with six ports: `projects`, `services`, `blog`, `meta`, `techStack`, `content`. Signatures enforce async + readonly + undefined-on-not-found.
- `src/lib/adapters/static.ts` — `staticAdapter: ContentAdapter`. The only module in the repo that currently imports from `$lib/content/*`. Annotated with the interface so missing methods fail compilation.
- `src/lib/adapters/index.ts` — one-line swap point (`export { staticAdapter as adapter } from './static'`), plus `ContentAdapter` type re-export for downstream consumers.
- `src/lib/adapters/adapter.test.ts` — 37 contract-level tests. Every port method verified for basic shape / cardinality / not-found behavior. Intentionally shallow — deep data checks remain in content-layer integrity tests.

### Plan deviations

- Used actual function names (`getProjectBySlug`, not `findBySlug as getProjectBySlug`). The plan's rename is a style choice; the codebase already matches.
- Test assertions against `SiteMeta` corrected mid-task: plan expected `owner/address/links`; actual shape is `name/tagline/description/links`. Same fix for `HeroData` (`queries` → `queryRows + queryTime`). Plan's reference tests were written from an earlier draft of the content files; corrected against reality.

### Config

- `vite.config.ts` `data` test project `include` gained `src/lib/adapters/**/*.test.ts` so contract tests run on `bun run test`.

### Verification

| Check | Result |
|---|---|
| `bun run test src/lib/adapters/adapter.test.ts` | 37/37 pass (<1s) |
| `bun run test` full | 83 files / 819 tests (baseline 82/782 + 1 new file / 37 new tests) |
| `bun run check` | 0 errors, 19 warnings (baseline) |

Adapters aren't wired to loaders yet — repositories (Task 17b-3) and route loaders (Task 17b-4) consume it. Preview rendering is unaffected.

### STOP — awaiting Yesid approval for Task 17b-3
