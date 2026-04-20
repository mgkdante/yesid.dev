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

## OS-quirks encountered this sub-slice

(Populate as you hit platform-specific issues. At slice close, migrate these to `<cloud>/workflow-knowledge/os-quirks/<os>.md` per the closing checklist.)

| Problem | OS | Fix | Logged to registry? |
|---------|----|----|--------------------|
| _(none yet)_ | — | — | — |
