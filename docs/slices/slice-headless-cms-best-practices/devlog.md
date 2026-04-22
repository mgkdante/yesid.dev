# slice-headless-cms-best-practices — Devlog

**Self-appending session record for this slice.** Every session spent on the slice — across all its sub-slices and tasks — appends one block here. This is the slice's running history: who worked on it, when, what happened, what carried over.

**Scope rules (D19):**
- Devlog lives at **slice level 1** only. Sub-slices do not get their own devlog — their progress rolls up here.
- Tasks (level 3) use the tool's built-in progress tracker (TodoWrite for Claude Code, equivalent for Codex). No task-level files.
- This file is append-only. Never edit past session blocks.

---

## Session 2026-04-22 14:00 — Planning + Session 1 start

**Tool:** Claude Code (Opus 4.7 [1m])
**Session type:** Planning → Implementation (research)
**Focus:** Slice open (spec + plan drafts) → Task 1 R1 content modeling research
**Picking up from:** fresh — slice opened this session

### What happened

- **Reframing brainstorm (extensive).** Multi-turn brainstorm reset the slice scope from an earlier draft ("CMS pipeline formula" / "Quality × Scale firm-operating model") to the right frame: research into best practices for pairing a headless CMS with a modern frontend framework (SvelteKit primary), targeting a FORMULA that reshapes 18b's flat-field schema and produces reusable patterns for future Payload + SvelteKit custom/low-cost client projects. Sales / commercial / multi-stack strategy deferred to later projects per user.
- **Ran `/workflow-pull`** before opening: synced scaffold from workflow plugin `@48e2c52`. Added 11 scaffold files (new `docs/_TEMPLATES/` structure, `.env.example`, `docs/ai-memory/`, `docs/sessions/` + `docs/slices/.gitkeep`). Skipped 11 user-customized files (AGENTS.md, CLAUDE.md, reference docs). Commit `26dad35`.
- **Cleaned up legacy `_TEMPLATE-SLICE/` + `_TEMPLATE-SUBSLICE/` dirs** (commit `cd77a4b`) — superseded by the new `docs/_TEMPLATES/`.
- **Opened slice** via EnterWorktree. Bundle scaffolded from `docs/_TEMPLATES/subslice/` (spec + plan + handoff) + `docs/_TEMPLATES/slice/devlog.md`.
- **Drafted `spec.md`** — 6 design decisions, 5 open questions (Q1–Q5), 5 risks, acceptance criteria. User reviewed + approved.
- **Drafted `plan.md`** — 6 tasks across 3 sessions, FORMULA stub at end. User reviewed + approved.
- **Sibling CMS-UX worktree created** at `~/Yesito/Projects/yesid-dev-cms-ux/` on branch `slice-cms-ux-redesign` (from `b6ea5b9`). Sandbox for Payload pattern verification per spec D5.
- **Task 1 started:** R1 content modeling research. Research.md skeleton created. Parallel research agents dispatched on Payload 3 (deep), Sanity, Storyblok, and lighter-batch (Strapi + Prismic + TinaCMS + Gutenberg).

### Commits

- `26dad35` — chore(workflow): sync scaffold to workflow@48e2c52
- `cd77a4b` — chore: remove legacy _TEMPLATE-SLICE/SUBSLICE dirs — superseded by docs/_TEMPLATES/
- `3bd6efa` — docs(slice-headless-cms-best-practices): open slice + draft spec
- `7e60470` — docs(slice-headless-cms-best-practices): draft plan.md
- (Task 1 commits to follow as research.md + sandbox verification land)

### Outstanding

- **Task 1 COMPLETE** — awaiting user review before Task 2 per iterate-per-task.
- §R1 fully synthesized: 4 agent research outputs + cross-CMS pattern table + 12-row heuristics table + Q3 + Q5 both resolved.
- Sandbox verification: TestBlocks collection committed on `slice-cms-ux-redesign` branch of yesid.dev-cms (`67c14e1`). Typecheck clean; full runtime admin-UX verification deferred to R2.
- Q3 resolution summary: 7 of 9 page-globals → `pages` collection; `site-meta`, `nav-links`, `error-pages` stay globals. Matches Payload website template canonical pattern.
- Q5 resolution summary: `localized: true` on fields INSIDE blocks (not on blocks field itself). Shared layout + per-field translations. Matches 17c LocalizedString pattern.
- Tasks 2–6 pending per plan.md.

### Budget

- Context: ~55% used through Task 1 close
- Duration: multi-turn session (brainstorm-heavy + 4 parallel research agents)
- Model: Opus 4.7 [1m] throughout
- Agent tokens: Payload 126k / Sanity 72k / Storyblok 67k / Comparative batch 68k

---

<!-- Every new session appends a fresh `## Session ...` block ABOVE this line. Past blocks never get modified. -->

## Session 2026-04-22 ~18:00 — Task 2 R2 start

**Tool:** Claude Code (Opus 4.7 [1m])
**Session type:** Implementation (research — R2 authoring ergonomics)
**Focus:** Task 2 of 6 — authoring ergonomics + real user reviews (per 2026-04-22 scope expansion)
**Picking up from:** commit `f5afdd2` (scope expansion + Q3/Q5 resolved in Task 1)

### What happened

- Kicked off Task 2 per user `go` after Task 1 approval.
- Dispatched 4 parallel research agents (one Payload UX deep dive, one comparative Sanity+Storyblok+Gutenberg UX, two real-user-review agents — one Payload-centric, one Sanity+Storyblok+general-headless-sentiment).
- While agents run, planning the Live Preview sandbox wiring: install `@payloadcms/plugin-live-preview` in `~/Yesito/Projects/yesid-dev-cms-ux/` + scratch SvelteKit preview route in this worktree at `src/routes/(experimental)/preview-test/+page.svelte`.

### Commits

- *(pending — Task 2 synthesis + sandbox commits to follow)*

### Outstanding

- **Task 2 COMPLETE** — awaiting user review before Task 3.
- §R2 fully synthesized: 4 agent outputs + 22-item ergonomics checklist + Q4 resolved + brutal Payload real-user calibration.
- Sandbox commit `613579a` on `slice-cms-ux-redesign` branch — `admin.livePreview` config shape verified by typecheck.
- **Key FORMULA-shaping findings** (survived to memory `project_cms_research_bundle.md`):
  - Live Preview fragile on non-Next frontends (Issue #7164 "not planned") — FORMULA treats it as optional polish.
  - Payload admin is editor-HOSTILE out of box — FORMULA codifies "shipped defaults" (22-item checklist) to fix this.
  - Lexical has accessibility failure (Issue #8653) + internal-link bloat (Issue #6547) — FORMULA constrains Lexical to short-form bodies initially.
  - Blocks at scale: memory leaks (Discussion #12099) — FORMULA caps block library ~12-15 + mandates `blockReferences` from day 1.
  - Version upgrade discipline: pin minor versions; stage-test; never Friday (Payload minors break prod).
  - UX patterns to STEAL from competitors: Sanity stega overlay, preview.prepare richness; Gutenberg block breadcrumb, synced-pattern badge; Storyblok screenshot-on-selection.
- Tasks 3–6 pending per plan.md.

### Budget

- 4 agents returned in ~3-7 min each
- Agent tokens: Payload UX 124k / Comparative UX 77k / Payload user reviews 111k / Cross-CMS user reviews 110k
- Context: ~80% used at Task 2 close
- Model: Opus 4.7 [1m] throughout

---

## Appendix — session index

| Date       | Type                  | Focus                                           | Outstanding at end |
|------------|-----------------------|-------------------------------------------------|---------------------|
| 2026-04-22 | Planning → Research   | Slice open + Task 1 R1 start                    | Task 1 in progress  |
