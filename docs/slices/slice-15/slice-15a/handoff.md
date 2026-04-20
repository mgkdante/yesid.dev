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
