# Handoff — Sub-Slice 15a SEO Foundation (Payload-ready, localized)

**Self-appending.** Starts as a stub at sub-slice kickoff. Grows a `### Task 15a-N` section each time a Level 3 task lands. Finalized with `## Summary` and `## PR Body` at PR time.

**Status:** in progress
**PR:** pending
**Spec:** [`./spec.md`](./spec.md) | **Plan:** [`./plan.md`](./plan.md)

## Scope (from spec)

Ship every public route with localized, Payload-ready `<title>` + meta + OG + Twitter + canonical + sitemap + robots.txt — driven by a layout-authoritative `PageSeo` port so the Slice 18 Payload CMS swap is a one-file change.

Key properties:
- All SEO fields flow through the Slice 17b hexagonal data layer (`MetaPort.forRoute`).
- Every text field is `LocalizedString`; `og:locale:alternate` + `hreflang` wired for EN-only today, FR/ES drop-in-ready.
- Three-layer enforcement: type-level (`App.PageData.seo`), build-time (`check-sitemap-coverage.ts`), dev-runtime (SeoHead console warnings).
- Zod brought forward from Slice 17c, narrowly scoped to `PageSeo`.

## Tasks completed

(Each Level 3 task appends a section here as it lands.)

---

### Task 15a-1: Zod + PageSeoSchema

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Session:** 2026-04-19

**Files:**
- Modified: `package.json`, `bun.lock` — added zod runtime dep
- Modified: `vite.config.ts` — added schemas/ to vitest test include allowlist
- Created: `src/lib/schemas/seo.ts` — `PageSeoSchema` + `LocalizedStringSchema` + `PageSeo` type
- Created: `src/lib/schemas/seo.test.ts` — 9 tests covering valid/invalid/edge inputs

**What landed:**
Zod contract for route-level SEO metadata. `PageSeoSchema` validates title (≤ 70 chars), description (50–200 chars), canonical (valid URL), optional ogImage, ogType enum, and noIndex. `LocalizedStringSchema` requires `en` and makes `fr`/`es` optional — mirrors the existing TypeScript interface in `src/lib/types.ts`. Schema IS the contract Payload must honor when it lands in Slice 18.

**Decisions:**
- D006: `.refine()` for length bounds covers all locales in one rule.
- D007: `vite.config.ts` test-include allowlist needed schemas/ entry.

**Follow-ups flagged:** none

**Tests:** PASS (9 tests) | `bun run check`: 0 errors

*(Code-quality review revision 2d3aa61 expanded to 16 tests; whitespace guard on LocalizedStringSchema.en; rationale comment on ogImage.url permitting relative paths.)*

---

### Task 15a-2: seo-defaults + canonicalFor

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, subagent-driven-development)
**Session:** 2026-04-19

**Files:**
- Created: `src/lib/utils/seo-defaults.ts` — `SITE_HOST`, `DEFAULT_OG_IMAGE`, `SITE_NAME`, `PUBLISHED_LOCALES`, `DEFAULT_LOCALE`, `canonicalFor(pathname, locale)`
- Created: `src/lib/utils/seo-defaults.test.ts` — 8 tests covering constants + canonical URL resolution

**What landed:**
Single-module source of truth for SEO defaults. `canonicalFor()` strips trailing slashes, returns `SITE_HOST` bare for the root route, and accepts locale as a parameter so the slice that introduces FR/ES changes the helper body without touching call sites.

**Decisions:**
- D008: Stable locale-aware API from day one; EN-only behavior today.

**Follow-ups flagged:** none

**Tests:** PASS (8 tests) | `bun run check`: 0 errors

---

### Task 15a-3: Extend MetaPort with forRoute + require seo in PageData

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, inline execution)
**Session:** 2026-04-19

**Files:**
- Modified: `src/lib/adapters/types.ts` — added `forRoute(routeId, locale, params?)` to `MetaPort`; imported `PageSeo` type
- Modified: `src/lib/types.ts` — re-exported `PageSeo` from `$lib/schemas/seo` (types.ts remains authoritative)
- Modified: `src/app.d.ts` — extended `App.PageData` with required `seo: PageSeo`

**What landed:**
Type-level contract for layout-authoritative SEO. Every adapter (static today, Payload in Slice 18) must provide `forRoute`. `App.PageData.seo` is required — no page can silently skip SEO; the layout load (Task 8) is the single provider.

**Decisions:**
- D009: `App.PageData.seo` required (not optional). Forces layout load to always return it.

**Follow-ups flagged:** none — 1 expected `bun run check` error (static adapter missing `forRoute`) resolves in Task 5.

**Tests:** PASS (846/846 pre-existing suite, no regressions) | `bun run check`: 1 ERROR (expected — design gate for Task 5)

---

### Task 15a-4: Per-route SEO entries in content/meta.ts

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, inline execution)
**Session:** 2026-04-19

**Files:**
- Modified: `src/lib/content/meta.ts` — added `routeSeoEntries` (Record<string, StaticSeo | DynamicSeoFactory>), `FALLBACK_DESCRIPTION`, `fitDescriptionForSeo` helper

**What landed:**
13 route entries (home, about, contact, services index + detail factory, projects index + detail factory, blog index + personal + detail factory, tech-stack, __error). Each static entry has a hand-written 148–162 char description within the Zod 50–200 band. Dynamic factories pull from the existing Project/Service/BlogPost adapters and use `description`/`oneLiner`/`excerpt` fields with graceful fallback when content doesn't fit the SEO band.

**Decisions:**
- D010: Factories use dynamic import to avoid a meta ↔ adapter circular.
- D011: Project detail prefers `description`, falls back to `oneLiner`.
- D012: Blog detail uses existing `excerpt` field (no `summary` on type).
- D013: `fitDescriptionForSeo` graceful-fallback helper.
- D014: Route param names: projects `[slug]`, blog `[slug]`, services `[id]`.

**Follow-ups flagged:** none

**Tests:** PASS (no new tests in this task — Task 5 tests exercise forRoute end-to-end) | `bun run check`: 1 ERROR (unchanged from Task 3 — resolves Task 5)

---

### Task 15a-5: Implement forRoute on static adapter

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, inline execution)
**Session:** 2026-04-19

**Files:**
- Modified: `src/lib/adapters/static.ts` — added `forRoute` method with Zod parse at boundary
- Created: `src/lib/adapters/meta.test.ts` — 8 tests (static + dynamic routes + error paths + 404)

**What landed:**
Static adapter now fulfills the full `MetaPort` contract. `forRoute` looks up the route id in `routeSeoEntries`, invokes the factory (if dynamic) or returns the literal (if static), and parses through `PageSeoSchema` before returning. Unknown route ids throw with a clear "add an entry in content/meta.ts" message.

**Decisions:**
- D015: Zod parse at adapter boundary — single validation seam for all adapters (static today, Payload in Slice 18).

**Follow-ups flagged:** none

**Tests:** PASS (8 new tests) | `bun run check`: 0 ERRORS (Task 3 design gate resolved)

---

### Task 15a-6: getPageSeo repository wrapper

**Planned by:** Claude Code (claude-opus-4-7[1m])
**Implemented by:** Claude Code (claude-opus-4-7, inline execution)
**Session:** 2026-04-19

**Files:**
- Modified: `src/lib/repositories/meta.ts` — added `getPageSeo(routeId, locale, params?)` alongside existing `getSiteMeta`/`getPersonSchema`
- Created: `src/lib/repositories/meta.test.ts` — 3 tests

**What landed:**
Thin async wrapper delegating to `adapter.meta.forRoute`. Layout code (Task 8) imports this; never touches the adapter directly.

**Follow-ups flagged:** none

**Tests:** PASS (3 new tests) | `bun run check`: 0 errors

---

## Follow-ups flagged (accumulates)

Decisions needed from Yesid, or items deferred to future slices:

1. _(none yet)_

## Iterations (if any)

| # | Yesid reported | Fix | Files |
|---|----------------|-----|-------|
| _(none yet)_ | — | — | — |
| Final | — | — | — |

## Summary

*(Added at PR time — one paragraph on what the sub-slice achieved end-to-end.)*

## PR Body

*(Added at PR time — extracted from above. Paste into `gh pr create --body-file handoff.md` or into the web form.)*

```
## Summary
[paragraph]

## Changes
- [bullet]

## Tests
[status]

## Follow-ups
[list]
```

## Final Status

One of:
- **COMPLETE** — all acceptance criteria met, all tests pass, Yesid approved
- **COMPLETE WITH GAPS** — functional, some items deferred (listed in Follow-ups)
- **PARTIAL** — some tasks incomplete (explain)
- **BLOCKED** — cannot proceed (explain)

---

*Rules: be precise, honest, don't hide failed commands, don't summarize vaguely, don't omit files changed.*
