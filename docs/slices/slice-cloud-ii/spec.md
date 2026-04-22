# Slice CLOUD-II — Workflow Extraction + yesid.dev Richness Partition

**Parent slice:** none (follow-up to Slice CLOUD, cross-cutting meta-slice)
**Status:** planning (2026-04-22)
**Depends on:** Slice CLOUD (plugin v0.1.8 installed + scaffolded into yesid.dev via `/workflow-pull`)
**Unblocks:** slice 18c and subsequent slices running under canonical plugin-sourced workflow
**Size:** L
**Sessions:** 3–5 estimated
**Shape:** single-level slice (no sub-slices — one cohesive audit+extract+trim)
**Branch:** `slice-cloud-ii` (worktree at `.claude/worktrees/slice-cloud-ii/`)
**PR target:** main
**Lives in two repos:** yesid.dev (trim + adopt pulled content) + workflow plugin at `github.com/mgkdante/workflow` (receive upstreamed content via ~5–10 `/workflow-update` PRs)

## Goal

Enforce the partition rule: yesid.dev's `docs/` contains **only project-specific richness** (stack, service domain, brand, concrete business decisions). Everything workflow-universal currently inlined in yesid.dev's AGENTS.md / WORKFLOW.md / ARCHITECTURE.md / VOCAB.md / PLAN.md is extracted UPSTREAM into the `workflow` plugin scaffold and re-absorbed via `/workflow-pull`.

After this slice:
- The `workflow` plugin is the canonical home of workflow discipline.
- yesid.dev is a concrete instance consuming it — stack-specific content remains; workflow-universal content lives in plugin scaffold files (pulled in, never hand-maintained in yesid.dev).
- The plugin has evolved from a v0.1.8 starter to a v0.2.x scaffold rich enough that a new project scaffolded via `/workflow-add` gets the full mature workflow, not a skeleton.
- yesid.dev's documentation shrinks in volume but gains clarity — every section is either project-specific or a pointer to plugin-sourced content.

## Why now

1. **Plugin is live** — v0.1.8 on `mgkdante/workflow`, installed in Claude Code, `/workflow-pull` proven working on yesid.dev (commit 26dad35).
2. **yesid.dev has mature workflow content** accumulated across slices 17a–17j + Slice CLOUD that was never extracted — sitting in AGENTS.md (600+ lines), WORKFLOW.md (770+ lines), VOCAB.md (~300 lines). This is the ONE-TIME extraction opportunity.
3. **Next slices benefit immediately** — 18c, future work get a richer plugin + a leaner yesid.dev. Compounding benefit across every future project that scaffolds from the plugin.
4. **Partition rule solidifies** — codifying "project-specific only in yesid.dev" now prevents accumulated drift later when the plugin would have to fight to claw content back.
5. **First real plugin dogfood** — slice CLOUD built the plugin but didn't use it (plugin wasn't installed yet). Slice CLOUD-II is the first slice that actually exercises `/workflow-slice-open`, `/workflow-update`, `/workflow-pull` in a real cycle. Any friction surfaces as `/workflow-update` PRs during the slice.

## Non-goals (scope guards)

- **No business-logic changes.** Zero diffs in `src/`, `tests/`, `static/`, design tokens, CMS content. Verify: `git diff main -- src/ tests/ static/` empty at PR time.
- **No slice bundle rewrites.** Closed slices (17a–17j, 18a, 18b, etc.) keep their spec/plan/log/handoff bundles as historical records. Touching them would be revisionist.
- **No business-content migration** (blog posts, brand narrative, hexagonal content architecture). All project-specific, stays put.
- **No plugin v1.0.** v0.2.x is fine — still iterative, still bounded to what this slice extracts.
- **No architectural refactor of yesid.dev code.** Slice 17b's hexagonal data layer, Slice 17c's typed interfaces, Slice 18's Payload CMS — all stay exactly as they are.
- **No renames of existing yesid.dev slice branches or historical references.** Past is past.
- **No Codex cloud session required during the slice.** Cloud validation deferred to post-factory-reset (already deferred from slice CLOUD).
- **No workflow plugin re-tag of v0.1.8** — this slice opens v0.2.x.

## Design decisions

### D1 — Partition rule: project-specific vs workflow-universal

Every line currently in yesid.dev's `docs/` classifies as ONE of two categories:

**Stays in yesid.dev** (project-specific richness):
- Tech stack: SvelteKit 2, Svelte 5, TypeScript 5.9, Tailwind v4, Bun, Vercel, Payload, Neon, Resend
- Brand triad: `#E07800`, `#FFB627`, Inter, JetBrains Mono; favicon is a solid orange dot
- Service domain: freelance digital infrastructure positioning; dual-audience (freelance clients + dream employers)
- Two-repo topology: `yesid.dev` + `yesid.dev-cms`; migration pipeline 18a–18f; MCP surface
- Concrete data layer: LocalizedString, adapters, repositories, schemas (Slice 17c)
- CSS architecture: three-layer model with concrete file paths (`src/lib/styles/tokens.css`, `src/app.css @theme`, component scoped)
- Blog system (Slice 07) implementation details
- Brand vocab: Metro System, Transit HUD, Manifesto, Proof reel, Station tab, Bento, Edge Rail, etc.
- Industry vocab: FLIP, IntersectionObserver, dvh/svh/lvh, ScrollTrigger, Rune, Hexagonal content architecture, LocalizedString
- Slice narratives: per-slice summaries in PLAN.md (02–32), decisions log rows
- Concrete env vars: `YESITO_CLOUD_ROOT`, archive paths at `C:\Users\otalo\Yesito\cloud\yesid.dev\`
- Per-slice design decisions from shipped slices

**Extracted to plugin** (workflow-universal):
- Slice hierarchy + task-level-no-files invariant (D19)
- Worktree-per-slice discipline (D18) + per-surface isolation (Claude/Codex/cloud/bare)
- Tool-ownership inviolability (D12) + codex-plugin-cc integration protocol
- Plan-authoring discipline ("pattern-establishing vs pattern-following" with SHOULD/SHOULD-NOT lists)
- Session progress tracking rules (6 rules, STOP table format, budget row)
- Iteration Protocol (8 steps, feedback-handling matrix, test table format)
- Slice sizing (L/M/S triggers + planning artifacts per size)
- Session types table (Planning / Implementation / Closing / Non-slice)
- Token budget thresholds (percentage-based 0–40/40–65/65–80/80+)
- Session header format (Tool / Session type / Picking up from)
- 8-phase pipeline diagram (Research → Brainstorm → Spec → Plan → Implementation → Verification → PR → Closing)
- Research protocol (MCP tool patterns, reference-doc check)
- Brainstorm protocol (mandatory brainstorming skill, 2-3 options, never self-select)
- Spec structure template
- Three-tier context model + retrieval protocol + write protocol
- Quality Gates checklist (per-task / per-sub-slice-close / pre-deploy)
- Parallel Work Rules + Agent Selection matrix
- Session Start/End Protocols (tool-agnostic shape)
- Proven Rhythms section (what works / doesn't)
- Self-Enhancing Workflow principle
- Workflow vocab: Slice, Sub-slice, Task, Devlog, Handoff, Scaffold, Overlay, Session type, Iteration Protocol, Close-script, STOP, Tool overlay, Cross-tool handoff
- "Architectural decisions live in slice specs, not architecture.md" discipline
- Strategic themes concept + priority tag convention (P0/P1/P2)
- "Nothing escapes `docs/`" rule for AI-generated content
- Cross-platform setup pattern (env var abstraction + OS-quirks registry path)

**Boundary cases** (call explicitly during audit):
- Cloud env setup section mentions `op run --env-file=.env` (pattern — universal) AND `yesid-dev` vault name (specific). Extract pattern, leave vault name.
- Token budget mentions absolute thresholds for Opus 4.7 / Sonnet 4.6 (Claude-specific — belongs in plugin's `tools/claude-code.md` overlay).
- "Never Haiku" decree is yesid's stance (project-specific). Stays.

### D2 — Bi-directional sync via plugin commands (first real dogfood)

Extraction happens via `/workflow-update "<description>"` — one PR per workflow-universal chunk. Each PR opens against `mgkdante/workflow`, user reviews + merges, then `/workflow-pull` in yesid.dev absorbs the upstreamed content.

Expected PR count: 5–10 across the slice. Batching rule: one PR per logical workflow topic (e.g., "add plan-authoring discipline section to scaffold AGENTS.md"), not one PR per line change.

This is the slice's primary dogfood validation — if `/workflow-update` is clunky at scale, friction emerges as its own `/workflow-update` PRs to improve the skill.

### D3 — yesid.dev trim strategy: pointers, not deletions

Per the partition rule, yesid.dev's AGENTS.md / WORKFLOW.md / etc. lose workflow-universal content. But we DO NOT delete and leave holes — we replace extracted sections with **pointers** to the plugin-sourced equivalent.

Example transformation in yesid.dev's AGENTS.md:

**Before (workflow-universal content inlined):**
```
## Iteration Protocol (per Level 3 task)
**You are done when Yesid says you are done.** ...
1. Implement ONE task from the plan.
2. Run `bun run test` + `bun run check`. ...
[8 steps]
```

**After (pointer):**
```
## Iteration Protocol
See `docs/reference/WORKFLOW.md` § Iteration Protocol.
Project-specific binding: `bun run test` + `bun run check` are the canonical verification commands.
```

The plugin's `WORKFLOW.md` (pulled into yesid.dev) carries the universal 8-step protocol. yesid.dev's AGENTS.md only binds the tool-agnostic "canonical verification commands" slot to its concrete Bun commands.

### D4 — Tracking the partition in a single audit doc

During Session 1 (audit), produce `docs/slices/slice-cloud-ii/partition-audit.md` — a line-by-line table of every section in AGENTS.md / WORKFLOW.md / ARCHITECTURE.md / VOCAB.md / PLAN.md classified as: **KEEP**, **EXTRACT**, **HYBRID (split)**, or **DELETE (obsolete)**. This becomes the source of truth for the extraction PRs.

### D5 — Codex review at close leverages the new protocol

Slice close triggers the cross-tool adversarial review via `/codex:adversarial-review` (sibling plugin codex-plugin-cc). Since this slice's whole point is codifying that protocol, using it at close is doubly validating. If Codex's review surfaces a gap in the extracted content, that becomes one more `/workflow-update` PR before merge.

### D6 — Worktree stays until merge (D18 reaffirmed)

`slice-cloud-ii` worktree at `.claude/worktrees/slice-cloud-ii/` persists across all sessions of this slice. Session-exit prompts get "keep" until `/workflow-close-slice` executes. This slice is multi-session (3–5) — perfect test case for D18's persistence invariant.

### D7 — Plugin evolves v0.1.8 → v0.2.0 during this slice

Extracted content triggers plugin minor-version bump. Each `/workflow-update` PR bumps patch (v0.1.9, v0.1.10, ...); the final merge that completes the extraction triggers v0.2.0 as a milestone (substantial feature surface now lives in the scaffold).

### D8 — Codex-plugin-cc referenced + install documented

yesid.dev's reference docs should mention `openai/codex-plugin-cc` as the sibling plugin needed for in-Claude adversarial review. Install instructions land in `docs/reference/tools/codex.md` (already plugin-scaffolded from `/workflow-pull` but yesid.dev may have a custom version — reconcile during audit).

### D9 — PR-body discipline for plugin PRs

Each `/workflow-update` PR body uses this template:
- **Originating project**: `yesid.dev`
- **Slice context**: `slice-cloud-ii`
- **Extracted content source**: `<yesid.dev path + section name>`
- **Rationale**: why this is workflow-universal, not yesid-specific
- **Target plugin file**: `<plugin scaffold path>`

This makes the extraction auditable post-merge.

### D10 — Acceptance gates at slice close

Slice closes when:
1. `partition-audit.md` has every workflow-universal chunk marked as EXTRACTED (with PR URL) or EXPLICITLY DEFERRED (with reason).
2. Plugin is at v0.2.0, tagged.
3. yesid.dev's AGENTS.md / WORKFLOW.md / ARCHITECTURE.md / VOCAB.md are slimmer — measured by line count delta (target: ≥40% reduction in each).
4. `/workflow-pull` in yesid.dev from plugin v0.2.0 completes cleanly (no conflicts after the trim).
5. Cross-tool adversarial review passes.
6. All slice branches clean; handoff.md drafted.

## File-touch summary

### MODIFIED in `yesid.dev`

**Slice bundle (new, this slice):**
- `docs/slices/slice-cloud-ii/spec.md` — this file
- `docs/slices/slice-cloud-ii/plan.md` — phased execution
- `docs/slices/slice-cloud-ii/devlog.md` — self-appending session record across all sessions
- `docs/slices/slice-cloud-ii/handoff.md` — PR body + Codex review notes
- `docs/slices/slice-cloud-ii/partition-audit.md` — line-by-line classification (D4)

**Trimmed (content extracted to plugin, replaced with pointers):**
- `AGENTS.md` — workflow-universal sections become pointers; stack/brand/project content stays
- `docs/reference/WORKFLOW.md` — full trim; most of the 770 lines extract out
- `docs/reference/ARCHITECTURE.md` — remove inlined data-layer/two-repo detail (move to slice 17c/18 specs as historical) + keep stack-specific architecture
- `docs/reference/VOCAB.md` — split: workflow terms extract, brand/industry/project terms stay
- `docs/roadmap/PLAN.md` — adopt strategic themes + priority tags pattern; keep concrete slice table

**Touched for D3 pointer convention:**
- `CLAUDE.md` — update bindings table rows that reference extracted concepts
- `docs/README.md` — update navigation to reflect plugin-sourced docs

### CREATED in workflow plugin (via `/workflow-update` PRs, landing in `plugins/workflow/skills/workflow-add/scaffold/`)

Approximate — final count depends on audit:
- `AGENTS.md` gains: plan-authoring discipline, session progress tracking rules (6), iteration protocol detail, token budget section, session header format
- `docs/reference/WORKFLOW.md` gains: 8-phase pipeline, research/brainstorm/spec/plan protocols, session estimation table, document ecosystem table, quality gates, parallel work rules, session start/end protocols, proven rhythms, self-enhancing workflow
- `docs/reference/VOCAB.md` gains: workflow terms table expansion
- `docs/roadmap/PLAN.md` gains: strategic themes + priority tag convention
- `docs/reference/tools/claude-code.md` + `codex.md`: absolute-threshold table shape (placeholder), mid-session model switching patterns

### UNTOUCHED in `yesid.dev` (by design, per non-goals)

- `src/` — all source code
- `tests/` — all tests
- `static/` — all assets
- `bun.lock`, `package.json` (no deps changes)
- Any slice bundle outside `slice-cloud-ii/`
- Brand narrative (`brand/`)
- `yesid.dev-cms` repo entirely
- `.env.example` (already correct post-slice-cloud)

## Acceptance criteria

### Partition audit

- [ ] `partition-audit.md` exists with every section of AGENTS.md / WORKFLOW.md / ARCHITECTURE.md / VOCAB.md / PLAN.md classified (KEEP / EXTRACT / HYBRID / DELETE).
- [ ] HYBRID rows explicitly split into "universal portion" + "project portion" with destination for each.

### Plugin upstreaming

- [ ] ≥5 `/workflow-update` PRs opened against `mgkdante/workflow` (one per workflow topic — not one per line).
- [ ] Each PR body follows D9 template (originating project / slice context / source / rationale / target).
- [ ] All PRs reviewed + merged by user (D12 — skill never self-merges).
- [ ] Plugin reaches v0.2.0 at end of extraction, tagged.

### yesid.dev trim

- [ ] `AGENTS.md` line count reduced by ≥40% vs pre-slice baseline.
- [ ] `docs/reference/WORKFLOW.md` line count reduced by ≥40%.
- [ ] `docs/reference/VOCAB.md` workflow-terms section replaced with pointer; brand/industry/project terms intact.
- [ ] `docs/roadmap/PLAN.md` gains strategic themes + priority tags without losing slice table.
- [ ] Every trimmed section has a pointer to its plugin-sourced equivalent.

### Pull verification

- [ ] `/workflow-pull` in yesid.dev from v0.2.0 completes without unexpected user-customized skips for files we explicitly trimmed.
- [ ] `docs/.workflow-plugin-sha` updated to v0.2.0 commit.

### Cross-tool review

- [ ] `/workflow-close-slice` triggered from Claude → `/codex:adversarial-review` invoked via codex-plugin-cc → Codex findings captured in handoff.md.
- [ ] Any BLOCKER/HIGH findings addressed before merge.

### Dogfood validation

- [ ] Slice fully operated inside `.claude/worktrees/slice-cloud-ii/` worktree from open to close (D18).
- [ ] Devlog has one entry per session (3–5 total), self-appended.
- [ ] ≥1 friction-driven `/workflow-update` PR (improving a skill body based on real use during this slice).

### Negative checks

- [ ] `git diff main -- src/ tests/ static/` returns empty at PR time.
- [ ] No closed-slice bundles modified (verified by `git diff main -- docs/slices/` excluding `slice-cloud-ii/`).
- [ ] No secrets or tokens in any committed file.
- [ ] No package.json dependency changes.
- [ ] yesid.dev's trim doesn't accidentally delete project-specific content — D1 partition rule holds per-file.

### Budget

- [ ] Slice completes in 3–5 sessions.
- [ ] No single session exceeds 80% context budget.
- [ ] Plugin PRs average <50 lines each (tight, reviewable).

## Open questions (resolve during planning or first audit session)

- **Q1.** PR batching granularity — one PR per source section vs one PR per target plugin file? **Default: one per source section.**
- **Q2.** What about `feedback_*` memory entries that are workflow-universal (e.g., `feedback_bash_permissions.md`, `feedback_iterate_per_task.md`)? **Default: audit separately**, extract universal ones to plugin's `ai-memory/MEMORY.md.example` as commented reference entries; keep yesid-specific ones local.
- **Q3.** How to handle yesid.dev's `docs/slices/_TEMPLATE-SLICE/` and `_TEMPLATE-SUBSLICE/` directories? **Default: replace with pointers to `docs/_TEMPLATES/slice/` + `docs/_TEMPLATES/subslice/`** (plugin-pulled) and delete the yesid.dev originals.
- **Q4.** Should we rename yesid.dev's slice `log.md` files to `devlog.md` to match D19? **Default: NO.** Closed slices are historical records. Only NEW slices (slice-cloud-ii onwards) use devlog naming.
- **Q5.** Plugin version bump — pre-extraction v0.1.8 → post-extraction v0.2.0 (minor) or v0.1.x (patch)? **Default: v0.2.0** at extraction close.
- **Q6.** Does `docs/ai-memory/` need any changes? **Default: no** — the memory migration landed in Slice CLOUD; SCHEMA.md stays as-is.
- **Q7.** Claude-specific mid-session-switch + token-budget tables — extract shape to plugin's `tools/claude-code.md` with filled-in yesid versions in yesid.dev's overlay? **Default: yes**, plugin ships empty placeholder tables; yesid.dev has filled versions.
- **Q8.** Slice close archival — use `bun run slice:close slice-cloud-ii` (yesid's existing script) or `/workflow-close-slice` (plugin)? **Default: both.** `/workflow-close-slice` triggers cross-tool review; `bun run slice:close` handles yesid's cloud mirror convention.

## Risks carried into the plan

1. **Audit scope underestimate** — AGENTS.md + WORKFLOW.md alone are 1400+ lines combined. Mitigation: after Session 1, reassess size; if PR count >15, split into sub-slices.
2. **Over-extraction** — moving yesid-specific content into plugin by mistake. Mitigation: D1 partition rule + grep test on plugin scaffold after each PR (reuse slice-cloud D11 domain-agnostic rule).
3. **Under-extraction** — leaving universal content in yesid.dev. Mitigation: Codex adversarial review at close specifically checks for this.
4. **Pointer rot** — yesid.dev's pointers may reference plugin sections that move in v0.3+. Mitigation: pointers reference by heading anchor, use canonical names; close ritual verifies resolution.
5. **Merge churn** — interleaved plugin PRs may conflict. Mitigation: linear merge order; `/workflow-pull` between PRs if needed.
6. **User approval bottleneck** — 5–10 PRs each needing manual merge. Mitigation: D9 PR body template makes reviews fast.
7. **Skill body bugs surface mid-slice** — `/workflow-update` might have bugs under real use. Mitigation: D12 says user owns authority; broken behavior becomes its own fix PR. Bugs surfacing is a WIN.
8. **Scope creep into slice 18c preparation** — tempting to also set up 18c during this slice. Mitigation: non-goal — 18c is separate.
9. **Plugin v0.2.0 breaking change risk** — restructure could churn v0.1.x consumers. Mitigation: additive extraction only; v0.2.0 adds content, never removes.

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-22 | Initial spec | Planning session at slice-cloud-ii open. Driven by plugin install + workflow-pull success surfacing the partition gap. Follow-up to slice CLOUD. |
