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

## Session 2026-04-22 ~22:00 — Slice close (pivot decision)

**Tool:** Claude Code (Opus 4.7 [1m])
**Session type:** Closing — slice ships with pivot decision as deliverable
**Focus:** Close this research slice with PIVOT TO DIRECTUS decision; cascade pivot through forward-looking docs + memory
**Picking up from:** Task 2.5b deep-dive synthesis + decision-brief.md + overnight reflection + Yesid's explicit "Let's do Directus! I've decided!"

### What happened

- Yesid confirmed decision post-sleep: pivot to Directus, reuse `yesid.dev-cms` repo (scorched-earth rebuild), keep research bundle as permanent reference, scorch-then-rebuild pattern across sub-slices 18c-18g.
- **Spec + plan + research + decision-brief + handoff** all updated to reflect pivot:
  - spec.md amendments log: new 2026-04-22 entry codifying the decision + rationale
  - research.md: Decision Outcome section + comprehensive DNS & Infrastructure Migration Inventory
  - plan.md: Tasks 3-5 marked SUPERSEDED; Task 6 reshape + FORMULA section rewritten as pivot-as-deliverable
  - decision-brief.md: no changes needed — already captured the full picture
  - handoff.md: PR body + deferred risks + peer-review slot
- **Slice 18 direction doc** (`docs/slices/slice-18/README.md`) rewritten: 18a/18b HISTORICAL; 18c = `slice-directus-research`; 18d = scorched-earth rebuild; 18e = content migration; 18f = frontend rewire; 18g = DNS cutover + sunset
- **Forward-looking docs cascade-updated:**
  - roadmap/PLAN.md — Slice 18 row, Execution Sequence, decision log
  - roadmap/FUTURE_PHASES.md — stack-builder + Hex Grid CMS tier
  - reference/ARCHITECTURE.md — two-repo topology pivot notice, migration pipeline rewrite, content-model historical framing
  - AGENTS.md + CLAUDE.md + README.md — verified no Payload references (nothing to update)
- **Memory updates:**
  - project_slice_18_status.md — fully rewritten for 18c-18g Directus sequence
  - project_cms_payload.md — SUPERSEDED notice at top; historical body preserved
  - project_cms_directus.md — NEW (forward direction)
  - project_cms_research_bundle.md — status SHIPPED with PIVOT
  - MEMORY.md — index updated with new Directus entry
- **Sandbox artifacts preserved** on slice-cms-ux-redesign branch (67c14e1 TestBlocks + 613579a livePreview config); never merged, stay as research artifacts.

### Commits (this session)

- *(pending — single commit for the whole close; hashes populated after push)*
- Prior session commits in this slice: `3bd6efa`, `7e60470`, `4147b06`, `f5afdd2`, `a9a365a`, `8725c3c`

### Outstanding

- **PR opening pending** — `slice-headless-cms-best-practices → main` after this commit.
- **Codex peer review pending** — per `feedback_codex_review_at_slice_close.md`; Yesid runs Codex against PR before merge; findings captured in handoff.md § Peer review notes.
- **Next slice** — `slice-directus-research` (Slice 18c) opens after this PR merges. Fresh research slice mirroring this one's structure but for Directus architecture + repo audit + migration strategy.

### Budget

- Full slice: ~10 sessions (planning + Task 1 + Task 2 + Task 2.5 + Task 2.5b + close)
- Agent count: 14+ parallel research agents total across all tasks
- Agent tokens: ~900k across all agents (~150k avg per deep-dive agent)
- Context used at close: ~95%
- Model: Opus 4.7 [1m] throughout
- Documentation output: ~15k words (research.md ~10k + decision-brief.md ~4.5k + spec/plan/handoff/devlog)

---

## Session 2026-04-22 ~21:00 — Task 2.5b: Payload vs Directus deep dive

**Tool:** Claude Code (Opus 4.7 [1m])
**Session type:** Strategic research continuation (Task 2.5b)
**Focus:** Task 2.5's 3-agent sanity-check produced split verdicts — 2 stay (Storyblok agent, Sanity agent) + 1 pivot (Directus agent's bullish verdict). User is "biased toward Payload but wants to think it through properly." This session dives deeper ONLY on Payload vs Directus head-to-head. Dropping Storyblok (SaaS lock-in disqualified it for Yesid's commercial model) and Sanity (editor-UX weakness hits Yesid's target audience). Remaining contenders: stay with Payload (current) vs pivot to Directus (structural editor-happiness alternative).
**Picking up from:** Task 2.5 agent synthesis (Storyblok + Directus + Sanity verdicts).

### What happened

- Dispatched 3 deep-dive agents narrowed to Payload vs Directus:
  - **Blocks + data modeling + extensibility depth** — quantify "Payload's blocks are more mature" claim against Directus M2A + new Block Editor (April 2026). Side-by-side schema rebuild.
  - **Admin UX + editor experience side-by-side** — concrete 5-task comparison (blog post, page layout, media, references, navigation). Editor-happiness differential quantified.
  - **Commercial trajectory + SvelteKit reality + migration honest estimate** — GitHub velocity, Discord size, production case studies, Payload-post-Figma evidence, Directus funding runway, Yesid-specific migration breakdown (17c Zod boundary, MCP plugin, Windows WSL build, Neon Postgres).

### Commits

- *(no code changes this session — strategic research only)*

### Outstanding

- 3 agents running; integrated scorecard + final recommendation pending returns.
- Decision outcomes:
  - STAY confirmed → proceed to Task 3 (R3 design tokens) with FORMULA confidence.
  - PIVOT confirmed → close current slice as "research complete, pivot to Directus recommended"; spec new `slice-cms-stack-pivot` with 6-9-day migration plan.
  - INCONCLUSIVE → prototype via sandbox before deciding.

---

## Session 2026-04-22 ~20:00 — Task 2.5 interstitial: CMS stack sanity-check

**Tool:** Claude Code (Opus 4.7 [1m])
**Session type:** Strategic research (interstitial — between Task 2 and Task 3)
**Focus:** User prompted re-evaluation of Payload choice after seeing Task 2's brutal calibration. Fast 3-agent sanity-check on Storyblok / Directus / Sanity as SvelteKit-integration alternatives + migration cost analysis. Decides: stay-with-Payload-plus-FORMULA-guardrails OR pivot-with-new-slice.
**Picking up from:** commit `a9a365a` (Task 2 close).

### What happened

- User asked *"I am not sure anymore on payload what do you think?"* after reading Task 2 findings (Live Preview fragility, Lexical a11y, blocks-at-scale memory leaks, editor-hostile admin, Figma sustainability).
- Presented 3 paths: (A) fast sanity-check with agents, (B) stay + FORMULA guardrails, (C) hybrid tiers.
- User chose A.
- Dispatched 3 parallel agents:
  - Storyblok + SvelteKit integration reality + pricing risk + migration-from-Payload
  - Directus + SvelteKit integration reality (open-source Payload-analog)
  - Sanity + SvelteKit + migration cost analysis from Payload 18a/18b state
- Result will be a stay-vs-pivot decision, not a formal §R axis in research.md.

### Commits

- *(interstitial research — no code changes, no slice-bundle commits unless findings warrant pivot)*

### Outstanding

- 3 agents running; decision pending their returns.
- If STAY: proceed to Task 3 (R3 design tokens).
- If PIVOT: propose new slice `slice-cms-stack-pivot` with migration spec; close this slice early as "research complete, pivot recommended."

---

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
