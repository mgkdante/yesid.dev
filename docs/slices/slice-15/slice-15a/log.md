# Sub-Slice 15a — Work Log

**Running record across all sessions.** Session-by-session. Session headings: `### Session YYYY-MM-DD HH:MM — Task 15a-N`.

## Prerequisites / environment

- Bun version: any recent (project pinned via `bun.lockb`)
- Env vars required: `YESITO_CLOUD_ROOT` for mirror scripts (not required during normal development)
- Dependencies affecting this sub-slice: Zod (added in Task 1)

## Session index

- 2026-04-19 — planning (brainstorm + spec + plan; no implementation)

---

### Session 2026-04-19 — Planning

**Tool:** Claude Code (claude-opus-4-7[1m])
**Session type:** Planning
**Picking up from:** Slice 17k shipped (commit `e157e30`, PR #25 merged). Starting 15a fresh.

**Goal:** Produce spec + plan for slice-15a; confirm scope with Yesid.

**Commands run:** n/a (planning only)

**Files touched:**
- Created: `docs/slices/slice-15/slice-15a/spec.md`
- Created: `docs/slices/slice-15/slice-15a/plan.md`
- Created: `docs/slices/slice-15/slice-15a/log.md` (this file)
- Created: `docs/slices/slice-15/slice-15a/handoff.md`
- Created: `docs/slices/slice-15/slice-15b/spec.md` (stub for follow-up sub-slice)
- Created: `docs/slices/slice-15/slice-15c/README.md` (deferred ticket for post-Payload Satori)

**Decisions:**
- D001: Bring Zod forward from planned Slice 17c into 15a, narrowly scoped to `PageSeoSchema`. Reason: the schema IS the contract Payload must honor in Slice 18; defining it now avoids retrofit.
- D002: Sub-slice split — 15a (foundation: meta/OG/sitemap/robots) + 15b (JSON-LD). Reason: 15a ships a visible client win (LinkedIn/Twitter cards work) without waiting for schema design; 15b ships the structured-data win with 15a's adapter already exercised.
- D003: OG image strategy — default branded 1200×630 only in 15a; per-post/per-project Satori generation deferred to 15c (post-Payload). Reason: Payload will supply `coverImage` fields; building Satori against TS adapter that's about to be retired would be rework.
- D004: Layout-authoritative SEO (not per-page). Reason: home `+page.ts` has `ssr = false` (GSAP/Lottie). Per-page SEO wouldn't ship server-side to social crawlers. Centralizing in `+layout.ts` via `adapter.meta.forRoute(route.id, locale, params)` fixes this AND matches Payload's single-source-of-truth model.
- D005: Locale URL scheme decision deferred to the slice that introduces the second locale. 15a hardcodes EN-only URLs behind a `canonicalFor(route, locale)` helper so the future FR/ES slice changes one function.

**Errors encountered:** n/a

**Validation:** n/a (planning)

**Outcome:** Spec approved by Yesid; plan drafted with 14 tasks across 2 sessions; branch `feature/slice-15a-seo-foundation` cut from `main` with spec committed.

**Blockers / questions:** none — ready for implementation.

---

---

### Session 2026-04-19 23:12 — Task 15a-1

**Tool:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Session type:** Implementation
**Picking up from:** Planning session (commit 1494b98)

**Goal:** Land Zod dependency + PageSeoSchema + test coverage for schema validation.

**Commands run:**
```bash
bun add zod
bun run test src/lib/schemas/seo.test.ts
bun run check
```

**Files touched:**
- Modified: `package.json`, `bun.lock` — added zod runtime dep
- Modified: `vite.config.ts` — added `src/lib/schemas/**/*.test.ts` to vitest include patterns (required so new test directory is picked up by the existing explicit allowlist)
- Created: `src/lib/schemas/seo.ts`
- Created: `src/lib/schemas/seo.test.ts`

**Decisions:**
- D006: Used `.refine()` on LocalizedStringSchema for title/description length so one rule covers en/fr/es. Cleaner than branching per-locale.
- D007: vite.config.ts uses an explicit include allowlist for test directories; added schemas/ pattern alongside existing adapters/content/repositories/utils/styles entries. Not in the original Task 1 file list but required for tests to run.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/schemas/seo.test.ts` | PASS (9/9) |
| `bun run check` | PASS (0 errors, 19 pre-existing warnings) |

**Outcome:** Zod-validated PageSeoSchema in place with exhaustive test coverage. Ready for Task 2.

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:22 — Task 15a-2

**Tool:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Session type:** Implementation
**Picking up from:** Task 15a-1 commit 2d3aa61

**Goal:** Land site-level SEO defaults + `canonicalFor` helper for locale-aware URL resolution.

**Commands run:**
```bash
bun run test src/lib/utils/seo-defaults.test.ts
bun run check
```

**Files touched:**
- Created: `src/lib/utils/seo-defaults.ts`
- Created: `src/lib/utils/seo-defaults.test.ts`

**Decisions:**
- D008: `canonicalFor` accepts locale as a parameter but currently ignores it (EN-only). Stable API — the slice that introduces FR/ES changes the helper body without changing any call site.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/utils/seo-defaults.test.ts` | PASS (8/8) |
| `bun run check` | PASS (0 errors) |

**Outcome:** Defaults module ready. Task 7 (`SeoHead`) will consume these; Task 11 (sitemap script) will consume `PUBLISHED_LOCALES`.

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:28 — Task 15a-3

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-2 commit f00079e

**Goal:** Extend `MetaPort` contract with `forRoute(routeId, locale, params?)`, re-export `PageSeo` from `$lib/types`, require `seo` on `App.PageData`.

**Commands run:**
```bash
bun run check   # 1 error EXPECTED (static adapter missing forRoute — resolved in Task 5)
bun run test    # 846 passed — no regressions
```

**Files touched:**
- Modified: `src/lib/adapters/types.ts` — added `forRoute` to `MetaPort`, added `PageSeo` import
- Modified: `src/lib/types.ts` — re-exported `PageSeo` from `$lib/schemas/seo`
- Modified: `src/app.d.ts` — extended `App.PageData` with required `seo: PageSeo`

**Decisions:**
- D009: `App.PageData.seo` required (not optional). Layout load always provides it; no page is allowed to skip.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run check` | 1 ERROR (expected — `static.ts:105 Property 'forRoute' is missing`, resolved in Task 5) |
| `bun run test` | PASS (846/846 — no regressions from pre-existing suite) |

**Outcome:** MetaPort contract extended. The one expected error is the design gate — static adapter must implement `forRoute` (Task 5). Ready for Task 4 (populate content/meta.ts).

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:32 — Task 15a-4

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-3 commit 745d637

**Goal:** Populate `content/meta.ts` with per-route SEO entries for all 13 public routes (static + dynamic factories).

**Commands run:**
```bash
bun run check  # still 1 expected error from Task 3 (static.ts missing forRoute, resolves Task 5)
bun -e '...'   # char-count verification: all descriptions 148–162 chars (within 50–200 Zod band)
```

**Files touched:**
- Modified: `src/lib/content/meta.ts` — added `routeSeoEntries` map + `fitDescriptionForSeo` helper + `FALLBACK_DESCRIPTION`

**Decisions:**
- D010: Dynamic-route factories use `await import('$lib/adapters')` instead of top-level import to avoid circular dependency (`content/meta.ts` → `adapters/static.ts` → `content/meta.ts` if adapter imports meta entries directly).
- D011: Project detail prefers `description` field over `oneLiner` for SEO (fuller content). Falls back to `oneLiner`, then site fallback if outside 50–200 band.
- D012: Blog detail uses `post.excerpt` (the existing excerpt field) since BlogPost has no `summary`.
- D013: Added `FALLBACK_DESCRIPTION` + `fitDescriptionForSeo()` helper so content-layer data that doesn't fit SEO band degrades gracefully to a site-wide fallback rather than throwing at Zod.
- D014: Project routes use `[slug]` (filesystem is `projects/[slug]`), blog uses `[slug]`, services use `[id]`. Route ids in entry keys match these exactly.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run check` | 1 ERROR (unchanged — Task 5 target) |
| Char counts | 148–162 per description; all within 50–200 Zod band |

**Outcome:** 13 route entries in place: home, about, contact, services (index + factory), projects (index + factory), blog (index + personal + factory), tech-stack, __error. Ready for Task 5 to implement forRoute on the adapter.

**Blockers / questions:** none

---

---

### Session 2026-04-19 23:34 — Task 15a-5

**Tool:** Claude Code (claude-opus-4-7, inline execution)
**Session type:** Implementation
**Picking up from:** Task 15a-4 commit 881ef8a

**Goal:** Implement `forRoute` on the static adapter — closes the design gate from Task 3.

**Commands run:**
```bash
bun run test src/lib/adapters/meta.test.ts
bun run check
```

**Files touched:**
- Modified: `src/lib/adapters/static.ts` — added `forRoute` implementation + imports (`routeSeoEntries`, `PageSeoSchema`, `PageSeo`, `Locale`)
- Created: `src/lib/adapters/meta.test.ts` — 8 tests covering static routes, dynamic blog/project/service routes, unknown routes, 404 entry

**Decisions:**
- D015: Adapter boundary is the Zod parse point — `PageSeoSchema.parse(raw)` runs on every call. Bad data fails loudly at the seam rather than surfacing downstream.

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test src/lib/adapters/meta.test.ts` | PASS (8/8) |
| `bun run check` | PASS (0 ERRORS — design gate from Task 3 closed) |

**Outcome:** Contract green end-to-end: port → adapter → Zod-parsed PageSeo. Ready for Task 6 (repository wrapper).

**Blockers / questions:** none

---

## OS-quirks encountered this sub-slice

(Populate as you hit platform-specific issues. At slice close, migrate these to `<cloud>/workflow-knowledge/os-quirks/<os>.md` per the closing checklist.)

| Problem | OS | Fix | Logged to registry? |
|---------|----|----|--------------------|
| _(none yet)_ | — | — | — |
