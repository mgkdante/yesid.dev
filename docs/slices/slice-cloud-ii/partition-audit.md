# Slice CLOUD-II — Partition Audit

**Authored:** 2026-04-22 (Task 1, Session 1)
**Inputs audited:** `AGENTS.md` (393 lines, 30 sections) · `docs/reference/WORKFLOW.md` (779 lines, 55 sections) · `docs/reference/ARCHITECTURE.md` (429 lines, 13 sections) · `docs/reference/VOCAB.md` (296 lines, 20 sections) · `docs/roadmap/PLAN.md` (462 lines, 22 sections)

**Total sections classified:** 140

**Methodology:** every `##` and `###` heading in the 5 source files reviewed against spec D1 partition rule. Classifications are KEEP (project-specific richness — stays in yesid.dev), EXTRACT (workflow-universal — moves to plugin scaffold), HYBRID (split — universal portion extracts, project portion keeps), DELETE (obsolete after extraction). The per-section breakdown below treats a set of 9 consecutive yesid-specific Slice-NN scope sections in `PLAN.md` as a single audit block for brevity — section counts in the per-file tables reflect audit-block counts, not raw `##`/`###` counts.

This document is the authoritative input for every extraction PR in Tasks 2–4.

---

## Summary table

| File | KEEP | EXTRACT | HYBRID | DELETE | Total sections |
|------|------|---------|--------|--------|----------------|
| `AGENTS.md` | 5 | 17 | 8 | 0 | 30 |
| `docs/reference/WORKFLOW.md` | 4 | 30 | 21 | 0 | 55 |
| `docs/reference/ARCHITECTURE.md` | 13 | 0 | 0 | 0 | 13 |
| `docs/reference/VOCAB.md` | 15 | 3 | 2 | 0 | 20 |
| `docs/roadmap/PLAN.md` | 19 | 0 | 3 | 0 | 22 |
| **TOTAL** | **56** | **50** | **34** | **0** | **140** |

**EXTRACT + HYBRID = 84 sections.** Distinct PR groups: **10** (within plan's 5–10 target). Below the spec risk #1 escalation threshold (>15 PRs would force sub-slice split). No escalation needed — the 84-section load consolidates into 10 topical PRs because many sections co-extract (e.g., the 9 tool-selection sub-phases batch into one "tool-selection protocol" PR, the 5 slice-hierarchy sub-items batch into one "slice-hierarchy-sizing" PR, etc.).

**No DELETE sections.** Every section either stays (project-specific) or has at least a universal portion. After extraction, the universal portions become pointers per D3 — nothing is lost; cross-references point to the plugin-pulled equivalent.

---

## PR batching plan

10 logical PR groups for Tasks 2–4. Each PR maps to one `/workflow-update` invocation with one `feedback/<slug>` branch in `mgkdante/workflow`.

| # | Task | PR slug | Topic | Source sections | Target plugin file |
|---|------|---------|-------|------------------|--------------------|
| 1 | Task 2 | `iteration-protocol` | Iteration Protocol — 8-step task discipline | AGENTS § Iteration Protocol; WORKFLOW §8 Phase 5 (universal portions) | scaffold `AGENTS.md` (WORKFLOW.md scaffold deferred to Task 3) — **EXTRACTED** [workflow#5](https://github.com/mgkdante/workflow/pull/5) merged 2026-04-22 |
| 2 | Task 2 | `session-progress-tracking` | Session progress tracking — 6 rules, STOP table, budget row | AGENTS § Session progress tracking; AGENTS § Session token budget; AGENTS § Session header format; WORKFLOW §18 per-STOP progress table | scaffold `AGENTS.md` (WORKFLOW.md scaffold deferred to Task 3) — **EXTRACTED** [workflow#6](https://github.com/mgkdante/workflow/pull/6) merged 2026-04-22 |
| 3 | Task 3 | `8-phase-pipeline` | 8-phase pipeline diagram + per-phase protocols (Research → Brainstorm → Spec → Plan → Implementation → Verification → PR → Closing) + bonus partial-PR-7 (cross-tool review) + partial-PR-10 (rhythms + self-enhancing) | WORKFLOW §3 (pipeline); WORKFLOW §§4–11 (phase protocols); WORKFLOW §21 (rhythms); WORKFLOW §22 (self-enhancing); cross-tool adversarial review pattern | scaffold `docs/reference/WORKFLOW.md` — **EXTRACTED** [workflow#9](https://github.com/mgkdante/workflow/pull/9) merged 2026-04-22 |
| 4 | Task 4 | `slice-hierarchy-sizing` | Slice hierarchy (3 levels + L/M/S sizing + session types) | AGENTS § Slice hierarchy + sub-bundles; AGENTS § Session types; AGENTS § Slice sizing; WORKFLOW §1 Slice Hierarchy + §2 Session Types | scaffold `AGENTS.md` + `docs/reference/WORKFLOW.md` |
| 5 | Task 4 | `abstract-roles-portability` | Abstract roles (tool-agnostic) + Stage→role routing + Infrastructure + Portability guarantee | AGENTS § Abstract roles (full subtree) | scaffold `AGENTS.md` |
| 6 | Task 4 | `workflow-vocab` | Workflow vocab + universal LLM-tool vocab (Slice/Sub-slice/Task/Session/Bundle/Spec/Plan/Log/Handoff/Checkpoint/STOP/Tool overlay/Cross-tool handoff/Iteration Protocol/Self-enhancing workflow/etc.) | VOCAB §5 (workflow vocabulary, ~25 rows); VOCAB §4 (universal portions of LLM-tool vocab); VOCAB §1 + §How-to-use (term-structure pattern) | scaffold `docs/reference/VOCAB.md` |
| 7 | Task 4 | `quality-gates-parallel-work` | Quality gates + Parallel work rules + Agent selection matrix | WORKFLOW §13 Quality Gates (universal portions); WORKFLOW §14 Parallel Work Rules + Agent selection | scaffold `docs/reference/WORKFLOW.md` |
| 8 | Task 4 | `session-start-end-protocols` | Session start protocol + session end protocol | WORKFLOW §17 Session Start Protocol; WORKFLOW §18 Session End Protocol (universal portions) | scaffold `docs/reference/WORKFLOW.md` |
| 9 | Task 4 | `plan-authoring-discipline-hardrules` | Plan authoring discipline + Hard rules + Core principles + Tool selection patterns + Closing checklist | AGENTS § Plan authoring discipline; AGENTS § Hard rules; AGENTS § Core principles (universal portions); AGENTS § Slice Closing (universal pattern); AGENTS § Git & PR Workflow; AGENTS § Active slice; AGENTS § Never (universal portions); AGENTS § Repo structure (sibling pattern); WORKFLOW §7 Plan authoring discipline; WORKFLOW §10 Phase 7 PR & Merge; WORKFLOW §11 Phase 8 Closing Checklist (universal portions); WORKFLOW §19 Tool Selection Protocol (universal portions) | scaffold `AGENTS.md` + `docs/reference/WORKFLOW.md` |
| 10 | Task 4 | `context-rhythms-self-enhancing` | Three-tier context model + Document ecosystem + Cross-platform setup pattern + Proven rhythms + Self-enhancing workflow + Code standards | WORKFLOW §1 Three-tier context model; WORKFLOW §12 Cross-Platform Setup + OS-Quirks Registry (universal portions); WORKFLOW §20 Document Ecosystem (universal portions); WORKFLOW §21 Proven Rhythms; WORKFLOW §22 Self-Enhancing Workflow; AGENTS § Cross-platform setup (universal portions); AGENTS § Code Standards | scaffold `docs/reference/WORKFLOW.md` + `AGENTS.md` |

**Notes on batching:**

- **PR-extra (templates-hardening) — added mid-Task-2**: user direction during Task 2 surfaced that the scaffold's slice + sub-slice templates were minimum-viable shells lacking the depth of mature shipped projects. Added [workflow#7](https://github.com/mgkdante/workflow/pull/7) (`feedback/templates-hardening`, merged 2026-04-22) which rewrote all 5 templates (`slice/plan.md`, `slice/devlog.md`, `subslice/plan.md`, `subslice/spec.md`, `subslice/handoff.md`) with self-contained transit-rich + yesid-archive depth. 968 insertions across 5 files. Self-containment hard constraint enforced (no project-specific references). This isn't an EXTRACT row from the audit — it's a structural depth improvement to existing scaffold templates. Acceptance metric: ≥1 friction-driven `/workflow-update` PR satisfied.
- Plan Task 4 step 2 mentions adding "strategic themes + priority tag convention to scaffold PLAN.md" — this content is **not currently present** in `docs/roadmap/PLAN.md` and is **additive** (Yesid's mental model, codified for the first time during extraction). Out of scope for this audit; carry-forward to Task 4 as PR-11 (additive content, not extraction). Logged here so it isn't lost.
- Plan Task 4 step 3 ("plan-authoring discipline") is folded into PR-9 above since it co-extracts cleanly with hard rules + closing checklist.
- AGENTS.md and WORKFLOW.md duplicate content (slice hierarchy, session types, plan-authoring) — extraction PRs deliberately group co-located concepts so the plugin scaffold gets one canonical home per concept (AGENTS.md = contract, WORKFLOW.md = mechanics).

---

## File 1 — `AGENTS.md`

### `AGENTS.md` § Project (line 10)

- **Classification:** KEEP
- **Rationale:** Brand triad (#E07800, #FFB627, Inter, JetBrains Mono), domain (yesid.dev), service positioning (Freelance Digital Infrastructure). Per spec D1: brand triad = project-specific.

### `AGENTS.md` § Core principles (governance) (line 14)

- **Classification:** HYBRID
- **Rationale:** 5 numbered principles. Principles 1, 2, 3, 4, 5 are workflow-universal (workflow-as-product, self-enhancement, three-tier context, shared lexicon, tool-agnostic). Reference to "Yesid's 6 services" (principle 1) and absolute paths (`/brand/BRAND.md`, `docs/reference/VOCAB.md`) are project-specific.
- **Universal portion:** the 5 principles themselves (rephrased to drop "Yesid's 6 services" and absolute path refs).
- **Project portion:** the references to specific paths and "Yesid's 6 services" framing.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9 (`plan-authoring-discipline-hardrules`)

### `AGENTS.md` § Abstract roles (resolved per-tool in overlays) (line 22)

- **Classification:** EXTRACT
- **Rationale:** Entire concept of "abstract roles + per-tool overlay resolution" is the centerpiece of the tool-agnostic workflow. Includes the 7-row role table.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 5 (`abstract-roles-portability`)

### `AGENTS.md` § Stage → role routing (line 38)

- **Classification:** EXTRACT
- **Rationale:** Stage→role routing table is workflow-universal. Stage names (L-slice Planning, Implementation, M-slice session, etc.) are universal vocabulary.
- **Target:** scaffold `AGENTS.md` (sibling of Abstract roles)
- **PR group:** 5

### `AGENTS.md` § Infrastructure (tool-agnostic) (line 52)

- **Classification:** EXTRACT
- **Rationale:** MCP + Skill description is workflow-universal infrastructure abstraction. Reference to `.mcp.json` location is universal pattern.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 5

### `AGENTS.md` § Portability guarantee (line 59)

- **Classification:** EXTRACT
- **Rationale:** "Clone on any machine with either Claude Code or Codex" portability claim is foundational tool-agnostic property.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 5

### `AGENTS.md` § Runtime (line 70)

- **Classification:** KEEP
- **Rationale:** "Bun only. Never npm/npx/node." + bun.lockb + Windows 11 OS — all yesid-specific runtime stack. Per spec D1: tech stack = project-specific.

### `AGENTS.md` § Cross-platform setup (line 78)

- **Classification:** HYBRID
- **Rationale:** Per spec D1 boundary case. Pattern (env var + OS-quirks registry) is universal. Specific env var name `YESITO_CLOUD_ROOT` and absolute paths are project-specific.
- **Universal portion:** pattern: "env var pointing to cloud directory; scripts fall back to `path.join(os.homedir(), '<vendor>', 'cloud')`; OS-specific quirks live at `<cloud>/workflow-knowledge/os-quirks/<os>.md`; check first, append before close (hard rule)."
- **Project portion:** literal `YESITO_CLOUD_ROOT`, Windows path `C:\Users\<user>\Yesito\cloud`, macOS/Linux `~/Yesito/cloud`.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 10 (`context-rhythms-self-enhancing`)

### `AGENTS.md` § Slice hierarchy (MANDATORY) (line 86)

- **Classification:** EXTRACT
- **Rationale:** 3-level hierarchy (Slice / Sub-slice / Task) + Level-2 PR boundary + folder-form table. Pure workflow-universal. Per spec D1 EXTRACT list.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 4 (`slice-hierarchy-sizing`)

### `AGENTS.md` § Per-sub-slice file bundle (4 files) (line 99)

- **Classification:** EXTRACT
- **Rationale:** spec.md + plan.md + log.md + handoff.md + CHECKPOINT.md bundle is workflow-universal pattern. (Note: this slice itself uses `devlog.md` per slice-cloud's D19 amendment — extraction should use the newer naming; legacy `log.md` is retained in CLOSED slices per spec Q4.)
- **Target:** scaffold `AGENTS.md` (and confirm against current scaffold which already has `devlog.md`)
- **PR group:** 4

### `AGENTS.md` § Self-appending handoff (line 110)

- **Classification:** EXTRACT
- **Rationale:** Self-appending handoff mechanic = universal pattern (per-task append, finalize at PR, derive PR body, reset for next sub-slice).
- **Target:** scaffold `AGENTS.md`
- **PR group:** 4

### `AGENTS.md` § Close protocol (Level 2 PR) (line 114)

- **Classification:** HYBRID
- **Rationale:** Pattern (close-script moves bundle to cloud archive, no flatten, appends one-liner to COMPLETED-SLICES.md, regenerates `tree.txt`) is universal. Concrete `bun run slice:close` + Windows-specific tree command + cloud path are project-specific.
- **Universal portion:** the pattern of close-script-mirrors-to-cloud + one-liner index + tree-regen.
- **Project portion:** `bun run slice:close <slice-N> <slice-N-letter>`, the Windows `cmd /c "tree /F /A | findstr ..."` command, `<cloud>/yesid.dev/docs/archive/...` path.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 4 (and yesid.dev keeps `bun run slice:close` binding only)

### `AGENTS.md` § Non-slice sessions (line 118)

- **Classification:** EXTRACT
- **Rationale:** Non-slice work pattern (`docs/sessions/<YYYY-MM-DD>-<name>.md`, optional PR) is universal.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 4

### `AGENTS.md` § Session types (line 122)

- **Classification:** EXTRACT
- **Rationale:** 4-row session-types table (Planning / Implementation / Closing / Non-slice) is universal. Hard rules below it (commit discipline, separation triggers) all universal.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 4

### `AGENTS.md` § Slice sizing (L / M / S) (line 153)

- **Classification:** EXTRACT
- **Rationale:** L/M/S triggers + planning artifacts table + upgrade/downgrade rules = universal. Examples reference yesid slice numbers (17b, 17a-5, 17d) but are footnotes — universal in shape.
- **Universal portion:** the entire sizing rubric + triggers + planning artifacts table + upgrade/downgrade rules.
- **Project portion:** none (examples are illustrative, can be replaced with generic placeholders in scaffold).
- **Target:** scaffold `AGENTS.md`
- **PR group:** 4

### `AGENTS.md` § Plan authoring discipline (L-slice `plan.md`) (line 175)

- **Classification:** EXTRACT
- **Rationale:** "Pattern-establishing vs pattern-following" with SHOULD / SHOULD-NOT lists = universal plan-quality discipline. Per spec D1 EXTRACT list.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9 (`plan-authoring-discipline-hardrules`)

### `AGENTS.md` § Session progress tracking (mandatory for multi-task sessions) (line 197)

- **Classification:** EXTRACT
- **Rationale:** 6 rules + STOP table format + budget row = canonical workflow tracking pattern. Per spec D1 EXTRACT list. Tool-mechanism reference (TodoWrite for Claude / equivalent for Codex) already abstracts via overlay.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 2 (`session-progress-tracking`)

### `AGENTS.md` § Hard rules (governance) (line 216)

- **Classification:** EXTRACT
- **Rationale:** 7 rules — never advance without approval, multi-session estimates, parallel-dispatch approval, PR at Level 2, model routing, handoff ships with PR, never bypass close-script. Universal governance.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9

### `AGENTS.md` § Session token budget (line 226)

- **Classification:** EXTRACT
- **Rationale:** Percentage-based threshold table (0–40 / 40–65 / 65–80 / 80+) is model-agnostic and tool-agnostic. Per spec D1 EXTRACT list. Absolute thresholds per model live in tool overlay (already separated).
- **Target:** scaffold `AGENTS.md`
- **PR group:** 2

### `AGENTS.md` § Session header format (line 251)

- **Classification:** EXTRACT
- **Rationale:** Session-header markdown shape (Tool / Session type / Picking up from) = universal handoff-and-resume convention. Per spec D1 EXTRACT list.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 2

### `AGENTS.md` § Iteration Protocol (per Level 3 task) (line 264)

- **Classification:** HYBRID
- **Rationale:** 8-step protocol is the workflow's load-bearing core — universal. Specific verification commands (`bun run test` + `bun run check`), specific URL (`http://localhost:5173/`), specific file names (log.md / handoff.md) are partly project-specific (commands) and partly universal (file names).
- **Universal portion:** the 8 steps, the "STOP" discipline, "you are done when Yesid says you are done", the "never batch / never write final summary before approval / never continue coding after STOP" rules, the requirement to include tool attribution + budget row, append-to-log-and-handoff convention.
- **Project portion:** literal commands `bun run test` + `bun run check`, literal URL `http://localhost:5173/`, the "Yesid" personification (scaffold should use generic "the user" or "the human partner").
- **Target:** scaffold `AGENTS.md`
- **PR group:** 1 (`iteration-protocol`)

### `AGENTS.md` § Git & PR Workflow (line 279)

- **Classification:** EXTRACT
- **Rationale:** Branch-per-sub-slice naming (`feature/slice-{NN}{letter}`), PR-back-to-main, Yesid-reviews-on-GitHub, squash-merge pattern, commit convention `<type>(slice-NN<letter>): <description>` with type list = workflow-universal.
- **Universal portion:** all of it (branch naming + PR flow + commit convention).
- **Project portion:** `bun run slice:close` reference (already covered in Close protocol HYBRID).
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9

### `AGENTS.md` § Active slice (line 286)

- **Classification:** EXTRACT
- **Rationale:** "Read CHECKPOINT.md at start of every session; full bundle for L-slice, log only for M-slice, nothing for S-slice" = universal session-start retrieval pattern.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9

### `AGENTS.md` § Slice Closing (only after all tasks approved at Level 2) (line 292)

- **Classification:** HYBRID
- **Rationale:** 8-step closing checklist is universal pattern. Specific governance file names (CONSTITUTION, CSS, MOTION, TESTS, ARCHITECTURE, PATTERNS), specific Windows tree command, specific cloud paths, `bun run slice:close` are project-specific.
- **Universal portion:** the 8 closing steps in their abstract form (finalize handoff → update governance docs → update vocab → log OS quirks → write learn doc → regen tree → commit/push/PR → run close-script).
- **Project portion:** specific governance doc names, exact tree-regen command, exact `bun run slice:close` invocation.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9

### `AGENTS.md` § Testing (Vitest + Bun) (line 308)

- **Classification:** KEEP
- **Rationale:** Vitest + Bun + jsdom + GSAP/Threlte/lottie/postprocessing/canvas/matchMedia/IO stubs + `@testing-library/svelte` + Playwright = entire stack project-specific. The "test table format" embedded here is universal but already covered by WORKFLOW §8 Iteration Protocol's test table — no separate extraction needed.

### `AGENTS.md` § Code Standards (line 325)

- **Classification:** HYBRID
- **Rationale:** 5 standards — TS for new files (semi-universal: applies to TS-using projects), comments-explain-WHY (universal), descriptive-names (universal), always-handle-errors (universal), code-and-tests-ship-together (universal). The TS-specific one is the only project-specific element.
- **Universal portion:** comments WHY not what; descriptive names; always handle errors; code+tests ship together.
- **Project portion:** "TypeScript for all new files" (yesid uses TS; scaffold could parameterize as "the project's primary language").
- **Target:** scaffold `AGENTS.md`
- **PR group:** 10 (`context-rhythms-self-enhancing`)

### `AGENTS.md` § CSS Architecture (summary — law in CONSTITUTION.md) (line 333)

- **Classification:** KEEP
- **Rationale:** Three-layer CSS architecture (`tokens.css` / `app.css @theme` / scoped `<style>`) + concrete file paths + top rules (zero hardcoded colors, no !important, dvh/svh/lvh, no arbitrary Tailwind) = entirely project-specific Tailwind v4 + Svelte design.

### `AGENTS.md` § Brand (non-negotiable) (line 347)

- **Classification:** KEEP
- **Rationale:** `#E07800` / `#FFB627` / Inter / JetBrains Mono / dark theme / lowercase wordmark = brand identity. Project-specific.

### `AGENTS.md` § Repo structure (line 353)

- **Classification:** HYBRID
- **Rationale:** "Standard layout (sibling directories at root — applies to every project Yesid owns)" tree is a portable pattern. The breakdown of where each doc-type lives is universal. The specific file paths (e.g., `docs/reference/CONSTITUTION.md`) are project-specific.
- **Universal portion:** the sibling-directory pattern itself (docs/, brand/ optional, src/, scripts/, static/, AGENTS.md, CLAUDE.md, .mcp.json, .claude/, .codex/, package.json), the docs/ subfolder taxonomy (reference/, reference/tools/, roadmap/, slices/, sessions/).
- **Project portion:** specific governance file names and absolute paths inside `docs/reference/`.
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9

### `AGENTS.md` § Never (line 382)

- **Classification:** HYBRID
- **Rationale:** 11 prohibitions. Most are universal workflow rules; some reference project-specific files.
- **Universal portion:** never delete files without slice spec instruction; never refactor outside current slice scope; never install packages without log entry; never skip close-script; never use npm or npx (semi-universal — Bun-using projects); never continue without approval; never close without OS-quirks + learn append; never invent term that already exists in vocab; never hardcode tool-specific mechanics in this file.
- **Project portion:** "Add CSS tokens, @theme values, or scoped styles without updating CSS.md" (yesid-specific governance file).
- **Target:** scaffold `AGENTS.md`
- **PR group:** 9

---

## File 2 — `docs/reference/WORKFLOW.md`

### `WORKFLOW.md` § 1. Slice Hierarchy (Foundation) (line 10)

- **Classification:** EXTRACT
- **Rationale:** Same 3-level hierarchy table as AGENTS.md. Single canonical home in plugin scaffold's WORKFLOW.md. (See PR-4 dedup with AGENTS extraction.)
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 4

### `WORKFLOW.md` § Per-sub-slice file bundle (4 files) (line 21)

- **Classification:** EXTRACT
- **Rationale:** Same bundle-shape definition. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 4

### `WORKFLOW.md` § Self-appending handoff mechanics (line 34)

- **Classification:** EXTRACT
- **Rationale:** More detailed than AGENTS.md version (includes the 4-step lifecycle). Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 4

### `WORKFLOW.md` § Three-tier context model (line 43)

- **Classification:** HYBRID
- **Rationale:** The three-tier model itself is universal. Specific paths (`<cloud>/yesid.dev/docs/archive/...`, learn KB path) are project-specific.
- **Universal portion:** the tier definitions (Tier 1 = always-on in repo / Tier 2 = fetch-on-command cloud + git / Tier 3 = cloud indexes), the retrieval protocol (cheapest first: in-context governance → cloud index → specific cloud artifact → git show), reference to `docs/ARCHIVE.md` as full-model home.
- **Project portion:** specific paths under `<cloud>/yesid.dev/docs/...`, learn KB location.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10 (`context-rhythms-self-enhancing`)

### `WORKFLOW.md` § 2. Session Types (line 55)

- **Classification:** EXTRACT
- **Rationale:** Same session-types table as AGENTS.md. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 4

### `WORKFLOW.md` § When to use non-slice vs slice — the L/M/S decision (line 77)

- **Classification:** EXTRACT
- **Rationale:** L/M/S decision table + upgrade rule. Universal sizing rubric.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 4

### `WORKFLOW.md` § 3. The Pipeline (End-to-End) (line 91)

- **Classification:** EXTRACT
- **Rationale:** 8-phase pipeline diagram = canonical workflow shape. Per spec D1 EXTRACT list.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3 (`8-phase-pipeline`)

### `WORKFLOW.md` § 4. Phase 1 — Research (line 130)

- **Classification:** HYBRID
- **Rationale:** Process is universal (competitive scan, extract patterns, check PATTERNS.md, library docs verification). Specific MCP tools (Chrome DevTools MCP, Context7 MCP, Svelte MCP) are tool-specific examples.
- **Universal portion:** the process + exit criteria; "verify library API before assuming" pattern.
- **Project portion:** specific MCP names; reference to `PATTERNS.md` as project's solved-pattern catalog.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3

### `WORKFLOW.md` § 5. Phase 2 — Brainstorm (line 151)

- **Classification:** EXTRACT
- **Rationale:** Mandatory brainstorming skill, 2–3 options, never self-select, scratch artifacts location pattern. Per spec D1 EXTRACT list.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3

### `WORKFLOW.md` § 6. Phase 3 — Design Spec (line 172)

- **Classification:** EXTRACT
- **Rationale:** Spec authoring discipline + spec structure template = universal. Per spec D1 EXTRACT list ("Spec structure template").
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3

### `WORKFLOW.md` § 7. Phase 4 — Implementation Plan (line 210)

- **Classification:** EXTRACT
- **Rationale:** Plan-authoring discipline (full content) + plan structure + session estimation table = universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3

### `WORKFLOW.md` § Plan authoring discipline (L-slice `plan.md`) (line 222)

- **Classification:** EXTRACT
- **Rationale:** Same content as AGENTS.md version. Universal pattern-establishing-vs-pattern-following discipline.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3 (co-extracts with §7 parent)

### `WORKFLOW.md` § Plan structure (line 232)

- **Classification:** EXTRACT
- **Rationale:** Plan markdown skeleton (Goal / Architecture / Tech Stack / multi-session / spec ref / File Structure / Tasks with STOP gates / Execution Order / Out of Scope) = universal template.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3

### `WORKFLOW.md` § Session estimation (line 256)

- **Classification:** EXTRACT
- **Rationale:** Complexity → tasks → sessions table is universal. Per spec D1 EXTRACT list.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3

### `WORKFLOW.md` § 8. Phase 5 — Implementation (The Iteration Protocol) (line 277)

- **Classification:** HYBRID
- **Rationale:** Same Iteration Protocol as AGENTS.md but with full per-task flow + iteration rules + test table + feedback-handling matrix.
- **Universal portion:** the per-task flow (8 steps), iteration rules (6 rules), test table format, feedback-handling matrix, "average iterations per task: 2-4" guidance.
- **Project portion:** literal `bun run test` + `bun run check`, literal `http://localhost:5173`, "Yesid" personification.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 1 (`iteration-protocol`)

### `WORKFLOW.md` § Per-task flow (never skip, never batch) (line 281)

- **Classification:** EXTRACT
- **Rationale:** 8-step per-task box-diagram is the canonical Iteration Protocol shape.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 1

### `WORKFLOW.md` § Iteration rules (non-negotiable) (line 301)

- **Classification:** EXTRACT
- **Rationale:** 6 rules — never batch, never write final handoff before approval, never "I think this should work", never continue after STOP, ambiguous feedback → ask, never close without handoff + OS-quirks/VOCAB updates. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 1

### `WORKFLOW.md` § The test table (after every test run) (line 310)

- **Classification:** EXTRACT
- **Rationale:** Test-result table format + "never say some tests failed without listing every failure by name" = universal QA discipline.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 1

### `WORKFLOW.md` § Handling iteration feedback (line 321)

- **Classification:** EXTRACT
- **Rationale:** Feedback-type → action matrix (5 rows) + "average iterations per task: 2-4 — plan for this" = universal feedback discipline.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 1

### `WORKFLOW.md` § 9. Phase 6 — Verification (line 335)

- **Classification:** HYBRID
- **Rationale:** Verification step pattern (run tests, pre-flight visual check, screenshot proof, fix obvious problems before STOP) is universal. Specific commands and "the preview tool" reference are project/tool-specific.
- **Universal portion:** the 4-step verification ladder + "fix obvious problems before STOP" discipline.
- **Project portion:** literal `bun run test` + `bun run check`, "the preview tool" naming.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 3

### `WORKFLOW.md` § 10. Phase 7 — PR & Merge (line 349)

- **Classification:** HYBRID
- **Rationale:** 7-step PR-and-merge flow (verify tests pass → gh pr create with handoff body → human reviews → squash-merge → delete branch → close-script → next sub-slice from updated main) is universal. Commit convention + branch naming pattern universal. Concrete `bun run` and `bun run slice:close` are project-specific.
- **Universal portion:** all 7 steps + commit convention shape + branch naming pattern.
- **Project portion:** literal Bun commands.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § 11. Phase 8 — Closing Checklist (line 367)

- **Classification:** HYBRID
- **Rationale:** 9-step closing checklist + "the workflow self-enhances" coda = universal. Specific governance doc names (CONSTITUTION, CSS, MOTION, TESTS, ARCHITECTURE, PATTERNS, VOCAB), specific cloud paths, specific Windows tree command, specific Bun scripts (`bun run docs:mirror`) are project-specific.
- **Universal portion:** the 9 closing steps in abstract form (finalize handoff → governance updates → vocab updates → OS-quirks log → learn doc → tree.txt regen → commit/push/PR → post-merge close-script → live-docs cloud mirror), the self-enhancing coda.
- **Project portion:** specific governance file names, exact tree-regen command, exact `bun run` invocations, specific cloud paths.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § 12. Cross-Platform Setup + OS-Quirks Registry (line 396)

- **Classification:** HYBRID
- **Rationale:** Pattern (env var + per-OS quirks registry with retrieval+write rules) = universal. Specific env var name + paths = project-specific.
- **Universal portion:** the env-var-with-fallback pattern; the OS-quirks registry layout (README.md + windows.md + macos.md + linux.md + cross-platform.md); retrieval rule (grep first, ask second); write rule (Problem / Root cause / Fix / Date / Slice — enforced as closing checklist step).
- **Project portion:** literal `YESITO_CLOUD_ROOT`, specific OS paths.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

### `WORKFLOW.md` § Env var (line 400)

- **Classification:** HYBRID
- **Rationale:** Variant of parent — the table of OS-defaults is the project-specific portion; the pattern of "set via shell profile / Env Vars; scripts fall back to homedir" is universal.
- **Universal portion:** the fallback-to-homedir pattern.
- **Project portion:** the literal env var name + per-OS default paths.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

### `WORKFLOW.md` § OS-quirks registry (line 412)

- **Classification:** EXTRACT
- **Rationale:** Registry layout, retrieval rule, write rule, append discipline = universal cross-project pattern.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

### `WORKFLOW.md` § 13. Quality Gates (line 428)

- **Classification:** HYBRID
- **Rationale:** Three-tier gate concept (per-task / per-sub-slice / pre-deploy) = universal. Specific yesid checks (LocalizedString, tokens.css, prefers-reduced-motion, Lighthouse perf>90 a11y>90) are project-specific.
- **Universal portion:** the three-tier gate structure + universal items (tests pass; type-check passes; pre-flight visual check; error handling present; all tasks approved; handoff finalized; governance docs updated; vocab entries added; OS-quirks appended; learn docs written; tree regen; full test suite green).
- **Project portion:** "no hardcoded strings (data layer + LocalizedString)"; "no hardcoded colors (tokens.css or Tailwind brand)"; "prefers-reduced-motion respected"; Lighthouse thresholds; "JSON-LD schema valid"; "brand compliance verified".
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 7 (`quality-gates-parallel-work`)

### `WORKFLOW.md` § Before every task completion (line 430)

- **Classification:** HYBRID
- **Rationale:** Subset of parent. Same split.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 7

### `WORKFLOW.md` § Before every sub-slice close (line 440)

- **Classification:** EXTRACT
- **Rationale:** All 8 items universal (tasks approved, handoff finalized, governance docs updated, vocab added, OS-quirks appended, learn docs written, tree regen, full test suite green).
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 7

### `WORKFLOW.md` § Before deploy (eventual) (line 451)

- **Classification:** HYBRID
- **Rationale:** Pre-deploy gates concept universal. Specific thresholds (Lighthouse >90), specific 375px breakpoint, JSON-LD specifics are project-specific.
- **Universal portion:** the gate categories (perf threshold, accessibility threshold, mobile tested at small breakpoint, no console errors, structured data valid, brand compliance verified).
- **Project portion:** specific Lighthouse numbers, exact 375px breakpoint, JSON-LD reference.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 7

### `WORKFLOW.md` § 14. Parallel Work Rules (line 461)

- **Classification:** EXTRACT
- **Rationale:** Allowed/Not-allowed lists + Agent selection matrix = universal parallel-work discipline. The agent names (planner, code-reviewer, tdd-guide, etc.) are Claude-specific but the role-mapping pattern is universal — Codex overlay maps to its equivalents.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 7

### `WORKFLOW.md` § Allowed (line 463)

- **Classification:** EXTRACT
- **Rationale:** Sub-list of parent. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 7

### `WORKFLOW.md` § Not allowed (line 469)

- **Classification:** EXTRACT
- **Rationale:** Sub-list of parent. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 7

### `WORKFLOW.md` § Agent selection (line 475)

- **Classification:** HYBRID
- **Rationale:** 9-row situation→agent table. Situations are universal; agent names are Claude-specific (planner, code-reviewer, tdd-guide, architect, build-error-resolver, security-reviewer, performance-optimizer, e2e-runner, Explore).
- **Universal portion:** the 9 situations; the role-naming pattern (specialist agent per concern); the principle that each tool overlay binds situations to its agents.
- **Project portion:** the literal Claude agent names. (Yesid retains the table populated for Claude in his AGENTS overlay or the file itself.)
- **Target:** scaffold `docs/reference/WORKFLOW.md` (with placeholder agent names parameterized; Claude overlay carries the bindings).
- **PR group:** 7

### `WORKFLOW.md` § 15. Data-Driven Architecture (Non-Negotiable) (line 491)

- **Classification:** KEEP
- **Rationale:** `src/lib/data/types.ts` etc. + `LocalizedString` + `resolveLocale()` + COALESCE pattern = entirely yesid data layer. Per spec D1: data layer = project-specific.

### `WORKFLOW.md` § Adding content (line 502)

- **Classification:** KEEP
- **Rationale:** 6-step content-addition workflow tied to yesid data layer.

### `WORKFLOW.md` § COALESCE pattern (line 511)

- **Classification:** KEEP
- **Rationale:** Yesid-specific resolveLocale fallback semantics.

### `WORKFLOW.md` § 16. CSS + Motion (pointers) (line 520)

- **Classification:** KEEP
- **Rationale:** Pointers to CSS.md / CONSTITUTION.md / MOTION.md + 9-signature vocabulary + Snappy Doctrine + GSAP ticker + lazy plugins = entirely yesid project.

### `WORKFLOW.md` § 17. Session Start Protocol (line 528)

- **Classification:** HYBRID
- **Rationale:** 9-step session-start checklist is universal. Specific paths (`docs/slices/slice-NN/CHECKPOINT.md`, `PATTERNS.md`, `VOCAB.md`) and specific tool name (TodoWrite) are project/tool-specific.
- **Universal portion:** all 9 steps in abstract form (declare type+size, read checkpoint, checkout branch, scan for drift, read active bundle scaled to size, populate live-progress-tracker from plan, check pattern catalog + vocab, announce budget row, state goal).
- **Project portion:** specific file paths, "TodoWrite" naming, "Yesid" personification.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 8 (`session-start-end-protocols`)

### `WORKFLOW.md` § 18. Session End Protocol (line 547)

- **Classification:** HYBRID
- **Rationale:** 7-step session-end checklist + per-STOP progress table sub-section. Pattern universal; specifics project-specific.
- **Universal portion:** all 7 steps in abstract form (final tracker state, update checkpoint, append log, append handoff if tasks landed, ensure tests pass, commit, state next steps with model recommendation).
- **Project portion:** specific paths, specific bun commands, "TodoWrite" naming.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 8

### `WORKFLOW.md` § Per-STOP progress table (within-session) (line 559)

- **Classification:** EXTRACT
- **Rationale:** Markdown progress-table example + budget-row requirement + "TodoWrite is live UI / markdown is scrollback audit trail" = universal STOP-discipline. (Budget-row content covered in PR-2 already.)
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 2 (`session-progress-tracking`)

### `WORKFLOW.md` § 19. Tool Selection Protocol (line 579)

- **Classification:** HYBRID
- **Rationale:** Per-phase ALWAYS / CONSIDER tool-trigger lists. Concept (per-phase tool selection) is universal. Specific tool names (Chrome DevTools MCP, Context7, Svelte MCP, GSAP Master MCP, agents like code-reviewer, the preview tool) are tool-specific.
- **Universal portion:** the structure (per-phase selection, ALWAYS-tier rules, CONSIDER-tier suggestions, "proactive tool use = higher quality output" principle) + the 11 Proactive Tool Triggers as universal hard rules (any framework file edit → autofixer; any library API → docs verification; any animation → motion-tool consult; any token change → token-tool; etc. — abstract shape).
- **Project portion:** the literal tool names (Chrome DevTools MCP, Context7, Svelte MCP, GSAP Master MCP, the preview tool, individual `frontend-design-pro:*` skills, individual `engineering:*` skills, etc.).
- **Target:** scaffold `docs/reference/WORKFLOW.md` — abstract framework with "your tool overlay binds these to concrete MCP / skill names".
- **PR group:** 9

### `WORKFLOW.md` § Research Phase (line 583)

- **Classification:** HYBRID
- **Rationale:** Research-phase tool list — pattern universal, specific tools project-specific.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § Brainstorm Phase (line 596)

- **Classification:** HYBRID
- **Rationale:** Brainstorm-phase tool list — `superpowers:brainstorming` mandatory is universal pattern; the design-system-specific skills (`frontend-design-pro:*`, `ui-design:*`, `design-systems:*`) are domain-specific (web/visual projects).
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § Planning Phase (line 614)

- **Classification:** HYBRID
- **Rationale:** `superpowers:writing-plans` mandatory + planner agent universal pattern. Domain-specific skills project-specific.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § Implementation Phase (line 627)

- **Classification:** HYBRID
- **Rationale:** Svelte MCP autofixer / Context7 / `superpowers:executing-plans` / preview-tool tool list. Pattern universal; specific tools project-specific.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § Code Review Phase (after every task) (line 648)

- **Classification:** EXTRACT
- **Rationale:** "Code reviewer agent + TS/lang-specific reviewer agent always; security reviewer for sensitive code; engineering:code-review skill; UI quality check" = universal review discipline. Agent names map per-tool overlay.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § Verification Phase (before every STOP) (line 659)

- **Classification:** EXTRACT
- **Rationale:** `superpowers:verification-before-completion` always; preview-tool screenshot proof; lighthouse audit consider. Universal pattern.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § PR & Merge Phase (line 669)

- **Classification:** EXTRACT
- **Rationale:** `superpowers:finishing-a-development-branch` + `commit-commands:commit-push-pr` + GitHub MCP. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § Closing Phase (line 676)

- **Classification:** EXTRACT
- **Rationale:** Doc-updater agent + `engineering:documentation` + `continuous-learning` consider + structured-docs skill consider. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § Proactive Tool Triggers (Hard Rules) (line 686)

- **Classification:** HYBRID
- **Rationale:** 11 hard rules. Some universal (about-to-claim-done → verify-before-completion; creating-PR → finish-dev-branch; starting-any-plan → brainstorming; refactoring → tech-debt skill; OS-specific command error → check OS-quirks). Some project-specific (editing .svelte → Svelte MCP autofixer; using library API → Context7; touching animation → GSAP Master MCP; CSS tokens → design-token skill; component-spec; testing-strategy).
- **Universal portion:** the framework-file-edit → autofixer pattern (parameterized); library-API → docs-verification (parameterized); animation → motion-tool (parameterized); the tool-trigger discipline itself; the "about-to-claim-done", "creating-PR", "starting-any-plan", "refactoring", "OS-quirks-first" rules.
- **Project portion:** the literal tool names (Svelte MCP, Context7, GSAP Master MCP, design-systems:design-token, design-systems:component-spec, engineering:testing-strategy).
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 9

### `WORKFLOW.md` § 20. Document Ecosystem (line 702)

- **Classification:** HYBRID
- **Rationale:** Three-tier (Tier 1 always-loaded / Tier 2 cloud / Tier 3 cloud indexes) document table. Three-tier framing universal; specific yesid file inventory project-specific.
- **Universal portion:** the three-tier framing; the columns (Document / Purpose / Update Frequency); rows for AGENTS.md / CLAUDE.md / docs/reference/tools/<tool>.md / WORKFLOW.md / VOCAB.md / sub-slice bundle / sessions — all universal artifacts.
- **Project portion:** rows for CONSTITUTION.md, CSS.md, MOTION.md, PATTERNS.md, ARCHITECTURE.md, TESTS.md, ARCHIVE.md, FUTURE_PHASES.md, slice-NN/README.md, slice-NN/CHECKPOINT.md — project-specific governance docs.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

### `WORKFLOW.md` § 21. Proven Rhythms (Extracted from 22+ Slices) (line 746)

- **Classification:** EXTRACT
- **Rationale:** What-works/What-doesn't lists are universal lessons (one task one approval; design before code; data layer first; pre-flight catches 80%; PATTERNS.md saves hours; self-appending handoff > end-of-slice handoff; jumping to code without spec; parallel implementation without approval; guessing APIs; hardcoding to iterate faster; skipping pre-flight; manual mirror at close). Per spec D1 EXTRACT list.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

### `WORKFLOW.md` § What works (line 748)

- **Classification:** EXTRACT
- **Rationale:** Sub-list of parent. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

### `WORKFLOW.md` § What doesn't work (line 757)

- **Classification:** EXTRACT
- **Rationale:** Sub-list of parent. Universal.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

### `WORKFLOW.md` § 22. The Self-Enhancing Workflow (Core Principle) (line 768)

- **Classification:** EXTRACT
- **Rationale:** Self-enhancement principle + the 5 "if you re-X, codify it where" rules = canonical workflow self-improvement discipline. Per spec D1 EXTRACT list.
- **Target:** scaffold `docs/reference/WORKFLOW.md`
- **PR group:** 10

---

## File 3 — `docs/reference/ARCHITECTURE.md`

Every section in this file describes yesid's concrete tech stack, file tree, data layer, CMS topology, CSS architecture, dependencies, and blog system. Per spec D1 (KEEP list explicitly names: Tech stack, two-repo topology, concrete data layer, CSS architecture, blog system implementation details). All KEEP — no extraction.

### `ARCHITECTURE.md` § Stack (line 5)

- **Classification:** KEEP
- **Rationale:** SvelteKit 2 + Svelte 5 + TypeScript 5.9 + Tailwind v4 + Bun + Vercel + shadcn-svelte + Bits UI + Vitest + Playwright + GitHub Actions = entire yesid stack.

### `ARCHITECTURE.md` § Structure (line 19)

- **Classification:** KEEP
- **Rationale:** Detailed `src/` file tree with annotations referencing every yesid slice (17b, 17c, 17d, 17e, etc.) and concrete component/utility/adapter file paths. Project-specific.

### `ARCHITECTURE.md` § Data Layer (line 240)

- **Classification:** KEEP
- **Rationale:** `LocalizedString` shape + `resolveLocale()` semantics + import path `$lib/data` + SEO JSON-LD factories + adapter-boundary Zod schemas + shared motion actions. All Slice-17b/17c/15b artifacts. Project-specific.

### `ARCHITECTURE.md` § Two-repo topology (Slice 18 onwards) (line 265)

- **Classification:** KEEP
- **Rationale:** yesid.dev + yesid.dev-cms split, deployment topology, Neon Postgres choice, MCP surface, migration pipeline 18a–18f. Per spec D1: two-repo topology = project-specific.

### `ARCHITECTURE.md` § Content model (Slice 18b — shipped 2026-04-21) (line 290)

- **Classification:** KEEP
- **Rationale:** Payload collections + globals + relationship topology + custom primary keys + localization config + MCP surface + media storage + email setup + seed script + migration count + 18c carry-forward. Entirely Slice 18b artifact.

### `ARCHITECTURE.md` § CSS Architecture (line 318)

- **Classification:** KEEP
- **Rationale:** Two-system coexistence (CSS custom properties + Tailwind @theme) with concrete examples. Project-specific Tailwind v4 + Svelte design.

### `ARCHITECTURE.md` § Dependencies (line 327)

- **Classification:** KEEP
- **Rationale:** Concrete package versions (svelte ^5.54.0, @sveltejs/kit ^2.50.2, tailwindcss ^4.1.18, gsap ^3.14.2, etc.). Project-specific.

### `ARCHITECTURE.md` § Blog System (Slice 07) (line 352)

- **Classification:** KEEP
- **Rationale:** Per spec D1: blog system implementation details = project-specific.

### `ARCHITECTURE.md` § Data flow (line 377)

- **Classification:** KEEP
- **Rationale:** Sub-section of Blog System.

### `ARCHITECTURE.md` § Key types (line 387)

- **Classification:** KEEP
- **Rationale:** Sub-section of Blog System (BlogCategory, BlogAnimation, BlogPost interface).

### `ARCHITECTURE.md` § SVG illustrations (line 406)

- **Classification:** KEEP
- **Rationale:** Sub-section of Blog System (per-post SVG, MorphSVGPlugin hover, BlogSvgIcon).

### `ARCHITECTURE.md` § Filtering (client-side) (line 414)

- **Classification:** KEEP
- **Rationale:** Sub-section of Blog System (search/tags/date/lang client-side filtering).

### `ARCHITECTURE.md` § Static Assets (line 421)

- **Classification:** KEEP
- **Rationale:** `static/` tree (images, models, lottie, svg). Project-specific.

---

## File 4 — `docs/reference/VOCAB.md`

### `VOCAB.md` § How to use this doc (line 6)

- **Classification:** HYBRID
- **Rationale:** "Yesid skims industry + Claude Code sections; Claude grep-checks before asking; add during slice close; absolute dates only; first-person opinionated trade-secret" — vocab-doc usage discipline is partly universal (the maintenance pattern + grep-first-rule + absolute-dates) and partly project-specific (the "Yesid"/"Claude" personification, the trade-secret framing).
- **Universal portion:** vocab grow-during-slice-close discipline; absolute dates only; one-row-per-entry guideline; <300 line target; first-person opinionated nature.
- **Project portion:** Yesid/Claude personification; "trade secret" framing.
- **Target:** scaffold `docs/reference/VOCAB.md`
- **PR group:** 6 (`workflow-vocab`)

### `VOCAB.md` § 1. How terms are structured (line 15)

- **Classification:** EXTRACT
- **Rationale:** Per-entry shape (Term / Category / Meaning / Where) + cross-link convention = universal vocab schema.
- **Target:** scaffold `docs/reference/VOCAB.md`
- **PR group:** 6

### `VOCAB.md` § 2. Brand vocabulary — yesid.dev-specific (line 27)

- **Classification:** KEEP
- **Rationale:** Yesid brand vocab (Edge-to-edge, Edge rail, Metro System, Transit HUD, Manifesto, Proof reel, Bento dashboard, etc.). Per spec D1 explicitly: brand vocab stays.

### `VOCAB.md` § Layout & structure (line 31)

- **Classification:** KEEP
- **Rationale:** Brand layout vocab subset.

### `VOCAB.md` § Home page vocabulary (line 44)

- **Classification:** KEEP
- **Rationale:** Brand home-page vocab subset.

### `VOCAB.md` § Services & contact (line 56)

- **Classification:** KEEP
- **Rationale:** Brand services/contact vocab subset.

### `VOCAB.md` § Brand primitives (line 67)

- **Classification:** KEEP
- **Rationale:** Brand primitive vocab subset (StatusDot, SvgIcon, Pulse-glow, etc.).

### `VOCAB.md` § Motion vocabulary (see `MOTION.md` v2 for the full 9-signature taxonomy) (line 79)

- **Classification:** KEEP
- **Rationale:** Yesid motion vocab subset (Snappy Doctrine, 9-signature, Scrub factory, Morph hover, etc.).

### `VOCAB.md` § Design system (line 92)

- **Classification:** KEEP
- **Rationale:** Yesid design-system vocab (Constitution, Token lockdown, Brand primitive, Headless primitive).

### `VOCAB.md` § 3. Industry vocabulary — standard terms worth knowing (line 103)

- **Classification:** KEEP
- **Rationale:** Per spec D1 explicitly: industry vocab (FLIP, IntersectionObserver, dvh/svh/lvh, ScrollTrigger, Rune, Hexagonal content architecture, LocalizedString) stays. Sub-domain entries are web-dev-specific (Svelte/Tailwind/GSAP) which yesid uses; not portable to non-web projects so keeps.

### `VOCAB.md` § Web fundamentals (line 107)

- **Classification:** KEEP
- **Rationale:** Industry vocab subset.

### `VOCAB.md` § Svelte 5 / SvelteKit 2 (line 122)

- **Classification:** KEEP
- **Rationale:** Industry vocab subset (framework-specific).

### `VOCAB.md` § Tailwind v4 (line 135)

- **Classification:** KEEP
- **Rationale:** Industry vocab subset (framework-specific).

### `VOCAB.md` § GSAP / Lenis / motion libs (line 144)

- **Classification:** KEEP
- **Rationale:** Industry vocab subset (motion-lib-specific).

### `VOCAB.md` § Data layer (added in Slice 17b, 2026-04-18) (line 157)

- **Classification:** KEEP
- **Rationale:** Hexagonal-content-architecture vocab — per spec D1 KEEP list explicitly names "Hexagonal content architecture" + "LocalizedString".

### `VOCAB.md` § Testing (line 171)

- **Classification:** KEEP
- **Rationale:** Industry vocab subset (Vitest, happy-dom, Playwright, TDD).

### `VOCAB.md` § 4. LLM tool vocabulary — the tool's terms (line 185)

- **Classification:** HYBRID
- **Rationale:** Mixes universal AI-tool vocab (Skill, Slash command, Subagent, Context window, Cache TTL, Cache hit/miss, ToolSearch, Deferred tool, MCP, MCP server, `.mcp.json`, Plugin, Marketplace, Connector, Activation-cost, Prompt cache, Plan mode, Working context vs startup context, Skill description triggers — universal) with yesid-specific tool vocab (`YESITO_CLOUD_ROOT`, `YESITO_WORKFLOW_ROOT`, Snapshot tied to specific path, Restore tied to snapshot script, Auto-memory specific path, MEMORY.md specific path, Compaction yesid doc reference, AutoDream yesid doc reference, `enabledMcpjsonServers` semi-universal — project-specific).
- **Universal portion:** ~20 of the ~30 rows are universal AI-tool vocab.
- **Project portion:** ~10 rows tied to yesid paths/scripts/cloud structure.
- **Target:** scaffold `docs/reference/VOCAB.md`
- **PR group:** 6

### `VOCAB.md` § 5. Workflow vocabulary — how we work (line 227)

- **Classification:** EXTRACT
- **Rationale:** Per spec D1 explicit EXTRACT list: workflow vocab — Slice / Sub-slice / Task / Devlog / Handoff / Scaffold / Overlay / Session type / Iteration Protocol / Close-script / STOP / Tool overlay / Cross-tool handoff. Plus all the related rows here (Bundle / Spec / Plan / Log / Checkpoint / Non-slice session / Closing checklist / Self-appending handoff / Three-tier context / Write protocol / Fetch-on-command / Retrieval protocol / OS-quirks registry / Self-enhancing workflow / Token-buffer strategy / Tool overlay / Tool attribution / `AGENTS.md` / Stack registry / `install.ts` / Mode / Workflow repo). All workflow-universal vocab.
- **Universal portion:** ~25 of ~30 rows. Workflow-canonical terminology.
- **Project portion:** rows for `workflow-efficiency skill` (specific yesid skill path), `Pre-prune / Post-prune snapshot` (yesid snapshot convention), `LLM tool` definition (semi-universal), `claude_equivalent` MCP annotation (registry-specific), `Stack registry` / `install.ts` / `Workflow repo` (yesid pre-workflow-repo references that are now superseded by the actual workflow plugin).
- **Target:** scaffold `docs/reference/VOCAB.md`
- **PR group:** 6

### `VOCAB.md` § 6. Cross-reference: brand ↔ industry (line 275)

- **Classification:** KEEP
- **Rationale:** Yesid brand-term → industry-term cross-reference table (Station tab → Tab interface pattern, Bento dashboard → Card grid, etc.). Project-specific.

### `VOCAB.md` § Maintenance (line 291)

- **Classification:** EXTRACT
- **Rationale:** "Review at slice close, deprecate with marker, update with absolute date when meaning shifts, <300 lines target" = universal vocab-maintenance discipline.
- **Target:** scaffold `docs/reference/VOCAB.md`
- **PR group:** 6

---

## File 5 — `docs/roadmap/PLAN.md`

This file is yesid's master project plan. Per spec D1: per-project master plan = project-specific. Sections that contain workflow-universal patterns (Testing Standards, Self-Documentation, Rules) are HYBRID — universal portions extract.

### `PLAN.md` § Goal (line 8)

- **Classification:** KEEP
- **Rationale:** "Ship yesid.dev as a memorable, motion-driven portfolio site with a scroll-based train journey…" = yesid project mission statement.

### `PLAN.md` § Design Principles (line 12)

- **Classification:** KEEP
- **Rationale:** 9 yesid design principles (data-driven, motion-first, componentized, tested, brand-consistent, growable, dark-first, progressive, i18n-ready). Project-specific positioning + tech approach.

### `PLAN.md` § Tech Stack (line 24)

- **Classification:** KEEP
- **Rationale:** Bun + SvelteKit 2 + TS + Tailwind + Inter/JBM + Threlte + Three.js + GSAP + Lottie + Vitest + Playwright + GitHub Actions + Vercel + TS data files. Per spec D1: tech stack = project-specific.

### `PLAN.md` § Site Architecture (line 44)

- **Classification:** KEEP
- **Rationale:** Yesid routes (/work, /work/[slug], /services, /services/[id], /about, /contact) + data files structure + motion system file tree + components list. Project-specific.

### `PLAN.md` § Data Interfaces (line 80)

- **Classification:** KEEP
- **Rationale:** `LocalizedString` + `Project` + `Service` + `SiteMeta` interfaces. Per spec D1: typed interfaces = project-specific (Slice 17c).

### `PLAN.md` § Testing Standards (line 132)

- **Classification:** HYBRID
- **Rationale:** Unit + E2E + CI standards. Pattern (every slice ships code AND tests; unit tests + E2E tests + CI on push/PR; PR cannot merge if any step fails; Yesid manual review after every slice) is universal. Specific tools (Vitest, Playwright, GitHub Actions, `bun install`, `bun run test`) and specific test-file conventions (`.test.ts` next to file, `tests/` E2E dir, `home.spec.ts`) are project-specific.
- **Universal portion:** "every slice ships code AND tests; no exceptions"; CI triggers on push + PRs; PR-cannot-merge rule; manual-review-by-human after every slice; the categorization (data layer / components / motion actions / utilities / E2E for pages, navigation, responsive, performance).
- **Project portion:** Vitest, Playwright, GitHub Actions, bun commands, specific file conventions.
- **Target:** scaffold `docs/roadmap/PLAN.md` (testing-standards template section)
- **PR group:** 10

### `PLAN.md` § Self-Documentation (line 166)

- **Classification:** HYBRID
- **Rationale:** "tree.txt at project root updated at end of every slice = repo's self-portrait" pattern is universal cross-project discipline. Specific Windows + PowerShell commands are OS-specific.
- **Universal portion:** the tree.txt-as-self-portrait convention; regen at slice close; exclude common ignored dirs (node_modules, .git, build artifacts).
- **Project portion:** the literal Windows `cmd /c "tree /F /A | findstr ..."` command; the PowerShell alternative.
- **Target:** scaffold `docs/roadmap/PLAN.md` (and OS-specific commands move to OS-quirks registry).
- **PR group:** 10

### `PLAN.md` § Slices (line 182)

- **Classification:** KEEP
- **Rationale:** Slice table 01–22 with status / depends / sessions = yesid project history + roadmap.

### `PLAN.md` § Execution Sequence (Post-Home Page) (line 218)

- **Classification:** KEEP
- **Rationale:** Yesid-specific execution-order rationale for slices 13 → 17a → 17d → … → 22.

### `PLAN.md` § Slice Summaries (line 249)

- **Classification:** KEEP
- **Rationale:** Yesid per-slice narrative summaries.

### `PLAN.md` § Completed (shipped before 2026-04-17 — see git log + cloud mirror for full specs/plans/handoffs) (line 251)

- **Classification:** KEEP
- **Rationale:** Yesid completed-slice summaries.

### `PLAN.md` § Active (line 261)

- **Classification:** KEEP
- **Rationale:** Yesid active-slice summary (currently Slice 17j).

### `PLAN.md` § Remaining in Slice 17 (planned) (line 265)

- **Classification:** KEEP
- **Rationale:** Yesid Slice-17 remaining work breakdown.

### `PLAN.md` § Upcoming (planned, detailed below) (line 272)

- **Classification:** KEEP
- **Rationale:** Yesid upcoming-slices index.

### `PLAN.md` § Slice 15 / 16 / 17 / 18 / 19 / 19b / 20 / 21 / 22 — individual slice scope sections (lines 276, 281, 286, 291, 296, 301, 306, 311, 316)

- **Classification:** KEEP
- **Rationale:** Each slice's full direction / status / dependencies / estimate. Project-specific. (Treated as one classification block — 9 individual slice sections, all KEEP.)

### `PLAN.md` § Pre-Slice Work (line 321)

- **Classification:** KEEP
- **Rationale:** Yesid-specific pre-slice prep notes (Lottie sourcing, hero copy, About bio, backup path).

### `PLAN.md` § Lottie Asset Pipeline (line 332)

- **Classification:** KEEP
- **Rationale:** Yesid Lottie sourcing/recoloring/place pipeline (v1 marketplace, v2+ custom).

### `PLAN.md` § v1: Marketplace sourcing (COMPLETE) (line 334)

- **Classification:** KEEP
- **Rationale:** Yesid v1 Lottie status.

### `PLAN.md` § Adding new station Lotties (future) (line 351)

- **Classification:** KEEP
- **Rationale:** Yesid Lottie-add procedure.

### `PLAN.md` § v2+: Custom Lotties (line 361)

- **Classification:** KEEP
- **Rationale:** Yesid Figma → AE → Bodymovin → JSON design flow.

### `PLAN.md` § Decisions Log (line 372)

- **Classification:** KEEP
- **Rationale:** Yesid per-decision log spanning 2026-04-01 to 2026-04-16. Per spec D1: per-slice design decisions = project-specific.

### `PLAN.md` § Rules (line 448)

- **Classification:** HYBRID
- **Rationale:** 12 project rules. Some are universal workflow rules; some are yesid-specific.
- **Universal portion:** rule 1 (one slice at a time); rule 2 (spec before code); rule 3 (review handoff before next slice); rule 4 (code and tests ship together); rule 5 (CI must be green before merging); rule 6 (tree.txt updated at end of every slice).
- **Project portion:** rule 7 (motion follows MOTION.md); rule 8 (content + code in Claude Code — also outdated since tool-agnostic); rule 9 (Lottie sourcing before slice 06); rule 10 (animations respect prefers-reduced-motion); rule 11 (data-driven station system); rule 12 (motion-layer independence).
- **Target:** scaffold `docs/roadmap/PLAN.md`
- **PR group:** 10

---

## Boundary cases called out (per spec D1 sub-section)

Spec D1 explicitly flags three boundary cases. All addressed in the per-section blocks above; cross-referenced here for traceability:

1. **Cloud env setup** with `op run --env-file=.env` (universal pattern) AND `yesid-dev` vault name (specific) — addressed in plan.md Canonical commands table (Task 1 inputs — the plan itself, not the audit source files); the pattern is universal; the vault name is project-specific. Bound for plugin's tool-overlay area as a pattern entry, not a section in this audit.
2. **Token budget absolute thresholds for Opus 4.7 / Sonnet 4.6** — Claude-specific. Already separated in spec D1: percentage thresholds are universal (PR-2), absolute number tables belong in plugin's `tools/claude-code.md` overlay (out-of-scope for THIS audit; addressed by Yesid in his Claude overlay).
3. **"Never Haiku" decree** — yesid's stance, project-specific. Lives in yesid's `CLAUDE.md` (already there per the bindings table).

## Carry-forwards to extraction tasks

- **PR-11 candidate (additive, not extracted):** "Strategic themes + priority tag convention (P0/P1/P2)" — referenced in spec D1 EXTRACT list and plan Task 4 step 2 but NOT currently in `docs/roadmap/PLAN.md`. Addressed during Task 4 as additive content (not extraction).
- **`bun run docs:mirror` step (WORKFLOW §11 step 9)** — yesid-specific live-docs cloud mirror. Stays project-specific. The "mirror live docs to cloud after slice close + optionally end-of-session for off-device reading" pattern is universal; could be added to scaffold WORKFLOW.md as an optional step in PR-9. Flag for Task 4 reviewer.
- **Plugin scaffold may already contain some of these sections** (plugin v0.1.8 was created from yesid.dev's earlier state). The `/workflow-update` skill should detect overlap and produce additive diffs only — Tasks 2–4 will surface this empirically.
- **Devlog naming (D19 from slice-cloud)** — current AGENTS.md still references `log.md`; new bundles use `devlog.md`. Extraction PRs should use `devlog.md` naming throughout (matches plugin's current scaffold per slice-cloud's amendment). Per spec Q4: closed slices keep `log.md` — extraction does NOT retro-rename historical bundles.

## Risk #1 reassessment (spec acceptance criterion)

- EXTRACT + HYBRID = 84 sections.
- Distinct PR groups = 10 (topical consolidation, not 1:1 with sections).
- Predicted PR count = 10 + 1 additive = 11.
- Spec risk #1 escalation threshold: ">15 PRs → split into sub-slices."
- **Conclusion: NO ESCALATION NEEDED.** Within plan target (5–10 PRs ± 1 additive). Proceed to Task 2.
