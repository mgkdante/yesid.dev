# Slice CLOUD-II — Plan

> Slice-level plan (Level 1). Spec: [spec.md](spec.md) · Devlog: [devlog.md](devlog.md) · Handoff: [handoff.md](handoff.md)

## Scope

Execute the workflow extraction + yesid.dev richness partition described in the spec. Single-level slice (no sub-slices). 9 tasks across 5 sessions. Every extraction flows through `/workflow-update` → PR → merge → `/workflow-pull` cycle so the plugin's self-evolution loop is exercised continuously.

## Canonical commands

Ground truth for verification, build, and run during this slice.

| Purpose                       | Command                                                             |
|-------------------------------|---------------------------------------------------------------------|
| Build                         | `bun run build`                                                     |
| Typecheck                     | `bun run check`                                                     |
| Test (unit)                   | `bun run test`                                                      |
| Test (e2e)                    | `bun run test:e2e`                                                  |
| Run dev                       | `bun run dev`                                                       |
| Dev with secrets              | `op run --env-file=.env -- bun dev`                                 |
| Regenerate tree.txt           | per `AGENTS.md § Slice Closing`                                     |
| Close slice (yesid script)    | `bun run slice:close slice-cloud-ii`                                |
| Close slice (plugin)          | `/workflow-close-slice`                                             |
| Contribute upstream           | `/workflow-update "<description>"`                                  |
| Pull latest plugin scaffold   | `/workflow-pull`                                                    |
| Read current state            | `/workflow-status`                                                  |

Plugin PRs in `mgkdante/workflow` repo (opened via `/workflow-update`):
- Clone path: `~/Yesito/Projects/workflow`
- Branch naming: `feedback/<slug>`
- PR target: `main`
- Merge: user-gated (D12 — never self-merge)

## Session layout

Target 3–5 sessions:

- **Session 1 — Audit**: Task 1 only. Produce `partition-audit.md`. Zero code or extraction yet.
- **Session 2 — First extraction batch**: Tasks 2–3 (biggest topics).
- **Session 3 — Second extraction batch**: Task 4 (smaller topics).
- **Session 4 — Plugin v0.2.0 + trim + pull verification**: Tasks 5–7.
- **Session 5 — Close**: Tasks 8–9.

**Devlog discipline**: every session appends one block to [devlog.md](devlog.md). Never overwrite past blocks.

**Worktree discipline** (D18): `.claude/worktrees/slice-cloud-ii/` persists across all sessions. Session exit → always pick "keep". Resume via `EnterWorktree(path: ".claude/worktrees/slice-cloud-ii")`.

---

## Task 1 — Partition audit

**Session:** 1
**Goal:** produce `docs/slices/slice-cloud-ii/partition-audit.md` — line-by-line classification of every section in yesid.dev's workflow-governance docs. Input for every extraction PR downstream.

**Files:**
- Create: `docs/slices/slice-cloud-ii/partition-audit.md`
- Read: `AGENTS.md`, `docs/reference/WORKFLOW.md`, `docs/reference/ARCHITECTURE.md`, `docs/reference/VOCAB.md`, `docs/roadmap/PLAN.md`

**Audit row format:**

```markdown
### <file-path> § <section-heading>

- **Classification:** KEEP / EXTRACT / HYBRID / DELETE
- **Rationale:** one-line why
- **If EXTRACT**:
  - **Target:** `plugins/workflow/skills/workflow-add/scaffold/<path>`
  - **PR topic:** `<short slug>`
- **If HYBRID**:
  - **Universal portion:** <lines/subsections to extract>
  - **Project portion:** <lines to keep>
```

**Steps:**

- [ ] **Step 1:** Read each source file in full.
- [ ] **Step 2:** For each section (`##` or `###` headed), produce one audit block.
- [ ] **Step 3:** Summary table at top of `partition-audit.md`: `| File | KEEP | EXTRACT | HYBRID | DELETE | Total |`.
- [ ] **Step 4:** Group EXTRACT sections by target plugin file + workflow topic. Each group = one `/workflow-update` PR. Aim for 5–10 total PRs.
- [ ] **Step 5:** Commit + push.

**STOP criteria:**
- [ ] Every section classified.
- [ ] PR batching identified, 5–10 groups.
- [ ] If total EXTRACT+HYBRID suggests >15 PRs → escalate to spec amendment (split into sub-slices).
- [ ] Session devlog entry appended.

---

## Task 2 — Extraction batch 1: Iteration Protocol + Session Progress Tracking

**Session:** 2
**Goal:** upstream two biggest AGENTS.md workflow-universal sections.

**Steps:**

- [ ] **Step 1:** Run `/workflow-update "add Iteration Protocol (8-step task discipline) to scaffold AGENTS.md"`.
  - Skill identifies target, creates `feedback/iteration-protocol` branch in `~/Yesito/Projects/workflow`, applies extraction, shows diff, opens PR on confirm.
- [ ] **Step 2:** Review PR on GitHub. Merge.
- [ ] **Step 3:** Run `/workflow-update "add Session Progress Tracking rules (6 rules + STOP table format) to scaffold AGENTS.md"`. Same flow.
- [ ] **Step 4:** Review + merge.
- [ ] **Step 5:** `/workflow-pull` in yesid.dev slice-cloud-ii worktree.
- [ ] **Step 6:** Update `partition-audit.md` — mark rows EXTRACTED with PR URLs.

**STOP criteria:**
- [ ] 2 PRs merged to `mgkdante/workflow/main`.
- [ ] Plugin's scaffold AGENTS.md has both sections.
- [ ] Audit updated with PR URLs.
- [ ] Devlog entry appended.

---

## Task 3 — Extraction batch 2: 8-phase pipeline + per-phase protocols

**Session:** 2 or 3
**Goal:** upstream the rich content from yesid.dev's WORKFLOW.md — 8-phase pipeline diagram + per-phase protocols (research, brainstorm, spec, plan, implementation, verification, PR, closing).

**Steps:**

- [ ] **Step 1:** `/workflow-update "add 8-phase pipeline diagram + per-phase protocols to scaffold WORKFLOW.md"`. If diff is excessively large (>400 lines), split into two PRs (pipeline diagram / protocols).
- [ ] **Step 2:** Review + merge.
- [ ] **Step 3:** `/workflow-pull`.
- [ ] **Step 4:** Update audit.

**STOP criteria:**
- [ ] PR(s) merged; scaffold WORKFLOW.md now carries pipeline + protocols.
- [ ] Audit row(s) EXTRACTED with PR URL(s).
- [ ] Devlog entry appended.

---

## Task 4 — Extraction batch 3: smaller topics

**Session:** 3
**Goal:** upstream remaining workflow-universal content — vocab terms, strategic themes, plan-authoring discipline, quality gates, parallel work rules, session start/end protocols, proven rhythms, self-enhancing principle, three-tier context, document ecosystem.

**Steps:** one PR per topic (D2 batching).

- [ ] **Step 1:** `/workflow-update "add workflow vocab terms to scaffold VOCAB.md"`.
- [ ] **Step 2:** `/workflow-update "add strategic themes + priority tag convention to scaffold PLAN.md"`.
- [ ] **Step 3:** `/workflow-update "add plan-authoring discipline to scaffold AGENTS.md"`.
- [ ] **Step 4:** `/workflow-update "add quality gates + parallel work rules to scaffold WORKFLOW.md"`.
- [ ] **Step 5:** `/workflow-update "add session start/end protocols to scaffold WORKFLOW.md"`.
- [ ] **Step 6:** `/workflow-update "add proven rhythms + self-enhancing workflow principle to scaffold WORKFLOW.md"`.
- [ ] **Step 7:** `/workflow-update "add three-tier context + document ecosystem table to scaffold WORKFLOW.md"`.
- [ ] **Step 8:** After all merge: `/workflow-pull` once in yesid.dev.
- [ ] **Step 9:** Update audit with PR URLs.

**STOP criteria:**
- [ ] 5–7 PRs merged (total extraction PRs now ≥8 per spec acceptance).
- [ ] `/workflow-pull` clean (no unexpected conflicts).
- [ ] Audit rows updated.
- [ ] Devlog entry appended.

---

## Task 5 — Plugin v0.2.0 tag

**Session:** 4
**Goal:** bump plugin to v0.2.0 — milestone marking "substantial scaffold extraction complete."

**Steps:**

- [ ] **Step 1:** `cd ~/Yesito/Projects/workflow`. Checkout main + pull.
- [ ] **Step 2:** Edit `plugins/workflow/CHANGELOG.md` — add v0.2.0 entry summarizing all Task 2–4 PRs.
- [ ] **Step 3:** Commit: `chore(workflow): release v0.2.0 — workflow extraction from yesid.dev complete`.
- [ ] **Step 4:** Tag: `git tag -a v0.2.0 -m "v0.2.0 — substantial scaffold extraction"`.
- [ ] **Step 5:** Push: `git push origin main --tags`.

**STOP criteria:**
- [ ] v0.2.0 tagged on plugin remote.
- [ ] CHANGELOG lists every extraction PR.
- [ ] Devlog entry appended.

---

## Task 6 — yesid.dev trim (pointer replacement)

**Session:** 4
**Goal:** trim yesid.dev's governance docs per D3. Every extracted section → pointer. Project-specific content → stays.

**Files:**
- Modify: `AGENTS.md`, `docs/reference/WORKFLOW.md`, `docs/reference/ARCHITECTURE.md`, `docs/reference/VOCAB.md`, `docs/roadmap/PLAN.md`.

**Steps:**

- [ ] **Step 1:** Record pre-trim line counts. Save to devlog.
- [ ] **Step 2:** For each file, iterate through `partition-audit.md` rows marked EXTRACTED:
  - Delete the section body.
  - Replace with pointer per D3 shape:
    ```
    ## <Section heading>

    See `docs/reference/WORKFLOW.md` § <Section> (plugin-sourced via /workflow-pull).

    Project-specific binding: <any yesid-specific command / value / note>
    ```
- [ ] **Step 3:** For HYBRID rows: split per audit. Universal portion deleted; project portion kept.
- [ ] **Step 4:** For DELETE rows: remove outright.
- [ ] **Step 5:** Record post-trim line counts. Verify ≥40% reduction in AGENTS.md + WORKFLOW.md (acceptance).
- [ ] **Step 6:** Verify every pointer resolves — `See X § Y` must reference an existing section.
- [ ] **Step 7:** Commit per file:
  ```
  git add AGENTS.md && git commit -m "docs(slice-cloud-ii): trim AGENTS.md — extracted sections now pointers"
  git add docs/reference/WORKFLOW.md && git commit -m "docs(slice-cloud-ii): trim WORKFLOW.md — pipeline + protocols extracted"
  # ... one per file
  git push
  ```

**STOP criteria:**
- [ ] Pre/post line counts in devlog.
- [ ] AGENTS.md + WORKFLOW.md each reduced ≥40%.
- [ ] Every pointer resolves.
- [ ] Per-file commits pushed.
- [ ] Devlog entry appended.

---

## Task 7 — `/workflow-pull` verification from v0.2.0

**Session:** 4
**Goal:** verify the round-trip is clean post-trim.

**Steps:**

- [ ] **Step 1:** `/workflow-pull` in yesid.dev slice-cloud-ii worktree.
- [ ] **Step 2:** Review output. Expected:
  - Several "updated" files (trimmed ones now align with plugin).
  - Zero "skipped" for trimmed files (if skipped → trim was incomplete).
  - Possibly "added" files if v0.2.0 introduced new scaffold files.
- [ ] **Step 3:** Verify `docs/.workflow-plugin-sha` = v0.2.0 commit.
- [ ] **Step 4:** `/workflow-status` — confirm state reads right.

**STOP criteria:**
- [ ] Zero unexpected skips.
- [ ] Tracker SHA updated to v0.2.0.
- [ ] `/workflow-status` matches expected state.
- [ ] Devlog entry appended.

---

## Task 8 — Cross-tool adversarial review via `/workflow-close-slice`

**Session:** 5
**Goal:** exercise the mutual cross-tool review protocol. Claude → Codex via codex-plugin-cc.

**Steps:**

- [ ] **Step 1:** Verify codex-plugin-cc installed in Claude Code. If missing: `/plugin marketplace add openai/codex-plugin-cc` + `/plugin install codex@openai-codex`.
- [ ] **Step 2:** Draft handoff.md PR body — summarize extraction (what moved where, line reductions, PR URLs).
- [ ] **Step 3:** Invoke `/workflow-close-slice`. Skill:
  - Verifies slice branch, tasks complete, PR body drafted.
  - Invokes `/codex:adversarial-review` via codex-plugin-cc.
  - **STOP, wait for real Codex response** — D12: no inline simulation.
- [ ] **Step 4:** Capture Codex findings verbatim in `handoff.md` § Peer review notes.
- [ ] **Step 5:** Triage:
  - **BLOCKER / HIGH**: address before merge. May trigger one more `/workflow-update` PR + `/workflow-pull`.
  - **MEDIUM**: fix or defer explicitly.
  - **LOW / INFO**: note in Deferred risks, proceed.

**STOP criteria:**
- [ ] Real Codex response captured (not inline-simulated).
- [ ] BLOCKER/HIGH resolved.
- [ ] Devlog entry appended.

---

## Task 9 — Close: archive, PR, merge

**Session:** 5
**Goal:** close slice-cloud-ii.

**Steps:**

- [ ] **Step 1:** Final handoff.md pass: Summary, PR body, peer review notes (from Task 8), deferred risks.
- [ ] **Step 2:** Regenerate `tree.txt` per AGENTS.md § Slice Closing § Step 6.
- [ ] **Step 3:** Commit: `docs(slice-cloud-ii): finalize handoff + regenerate tree.txt`. Push.
- [ ] **Step 4:** Open PR: `slice-cloud-ii` → `main`.
  ```
  gh pr create --title "slice-cloud-ii: workflow extraction + yesid.dev richness partition" --body "$(cat docs/slices/slice-cloud-ii/handoff.md)"
  ```
- [ ] **Step 5:** Verify PR diff — no `src/` `tests/` `static/` touches. Any CI checks pass.
- [ ] **Step 6:** Merge PR.
- [ ] **Step 7:** On main locally:
  ```
  git checkout main && git pull
  bun run slice:close slice-cloud-ii
  ```
  Archives bundle to cloud + updates COMPLETED-SLICES.md.
- [ ] **Step 8:** Update `docs/ai-memory/MEMORY.md` — add slice-cloud-ii to Completed slices index.
- [ ] **Step 9:** Cleanup:
  - `git branch -d slice-cloud-ii`
  - `git push origin --delete slice-cloud-ii`
  - `ExitWorktree(action: "remove")` in slice-cloud-ii worktree session.

**STOP criteria:**
- [ ] PR merged to main.
- [ ] Bundle archived.
- [ ] Branch + worktree deleted.
- [ ] MEMORY.md updated.
- [ ] Final devlog entry appended.

---

## Risks carried from spec

Full list in [spec.md § Risks](spec.md). Per-task mitigation summary:

| Risk | Mitigation in plan |
|------|---------------------|
| R1 — audit scope underestimate | Task 1 STOP check: if >15 PRs predicted, amend spec. |
| R2 — over-extraction | D11 grep test (no stack-specific terms) after every Task 2/3/4 PR merge. |
| R3 — under-extraction | Task 8 Codex adversarial review specifically checks. |
| R4 — pointer rot | Task 6 Step 6 verifies all pointers resolve. |
| R5 — merge churn | One PR at a time; `/workflow-pull` between PRs if needed. |
| R7 — skill body bugs mid-slice | Spec acceptance requires ≥1 friction-driven `/workflow-update` PR; bugs surfacing = WIN. |
| R9 — plugin v0.2.0 breaking change | Task 2/3/4 extraction is additive; v0.2.0 adds content, never removes. |

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-22 | Initial plan | Authored immediately after spec approval. 9 tasks mapped to 5 sessions per spec §Session layout. |
| 2026-04-22 | **Spec D3 amended + new D11 (project-doc-discipline) → plan tasks expand** | User picked Option B (full file-level partition via `docs/project/`) over original Option A (pointer-replacement in same files). Triggers: (a) Task 4 adds **Task 4.5 — plugin scaffold gains `docs/project/` DEFAULT + OPTIONAL skeletons + README teaching DEFAULT/OPTIONAL/EMERGENT discipline**; (b) Task 6 adds **Task 6.5 — yesid project-content migration** (move `docs/reference/{ARCHITECTURE,CSS,MOTION,PATTERNS,CONSTITUTION,TESTS}.md` → `docs/project/`; split VOCAB.md; create new `docs/project/{STACK,BRAND,BINDINGS,SERVICES}.md` from extracted AGENTS.md inline content; update live references); (c) Task 7 verification gates change from "≥40% line reduction" to "pure-pull files = zero diff hash-equal to plugin blobs"; (d) Task 6 yesid AGENTS.md trim adopts slot pattern (workflow-rule sections become pointers; project slots inline-pointer to `docs/project/<X>.md`); (e) WORKFLOW.md § Phase 8 + § Self-enhancing get amended in Task 4.5 to promote per-domain doc creation. See spec § D3 (amended) + § D11 for the partition + discipline rules. |

---

## Task 4.5 — Plugin scaffold: `docs/project/` skeleton + project-doc-discipline (NEW per amended D3 + D11)

**Session:** runs alongside or after Task 4's remaining extraction PRs.
**Goal:** plugin scaffold gains a `docs/project/` directory carrying DEFAULT skeletons + OPTIONAL templates + a README teaching the DEFAULT/OPTIONAL/EMERGENT discipline. Promotes the per-domain documentation discipline yesid.dev developed organically (CSS.md, MOTION.md, CONSTITUTION.md, ARCHITECTURE.md, TESTS.md, VOCAB.md emerging as the project evolved).

**Files (in plugin scaffold):**

DEFAULT skeletons (every project gets these at scaffold time):
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/STACK.md` — tech stack table template
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/BINDINGS.md` — canonical commands binding (workflow abstract → project concrete) + cloud env binding
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/ARCHITECTURE.md` — file structure, modules, data flow
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/TESTS.md` — test inventory, conventions, factories
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/VOCAB.md` — project + brand + industry vocab (workflow vocab stays in `docs/reference/VOCAB.md`)
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/CONSTITUTION.md` — codebase law, project-wide rules

OPTIONAL templates (commented templates with "create when..." trigger):
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/_OPTIONAL_BRAND.md` — for brand-owning projects
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/_OPTIONAL_CSS.md` — for projects with significant styling
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/_OPTIONAL_MOTION.md` — for projects with animation
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/_OPTIONAL_PATTERNS.md` — for codifying reusable solutions
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/_OPTIONAL_SERVICES.md` — for service-domain framing

README:
- `plugins/workflow/skills/workflow-add/scaffold/docs/project/README.md` — teaches the convention: DEFAULT (always created) / OPTIONAL (un-comment when relevant) / EMERGENT (operator creates as needed). "When to create a new project doc" rubric: when a domain's rules / patterns / vocabulary become re-derivable across slices, codify them.

WORKFLOW.md scaffold updates:
- § Phase 8 closing checklist gains step: "If a new domain rule / pattern emerged, codify it in `docs/project/<DOMAIN>.md`."
- § Self-enhancing workflow gains row: "Re-encountered a domain rule → `docs/project/<DOMAIN>.md`."
- § Document ecosystem Tier 1 table gains row for `docs/project/` (DEFAULT + OPTIONAL + EMERGENT).

AGENTS.md scaffold updates:
- § Repo structure gains `docs/project/` alongside `docs/reference/`, with one-line description.

**Steps:**

- [ ] **Step 1:** Create new branch `feedback/docs-project-defaults` off `main` in `mgkdante/workflow`.
- [ ] **Step 2:** Author the 6 DEFAULT skeleton files. Each ~50–100 lines, table-shaped, fully placeholder-driven (no project-specific content).
- [ ] **Step 3:** Author the 5 OPTIONAL templates with "create when..." headers + skeleton content.
- [ ] **Step 4:** Author `docs/project/README.md` (~150 lines) — teaches the discipline + rubric + lists DEFAULT / OPTIONAL / EMERGENT examples.
- [ ] **Step 5:** Update scaffold `WORKFLOW.md` (§ Phase 8 + § Self-enhancing + § Document ecosystem) to reference `docs/project/`.
- [ ] **Step 6:** Update scaffold `AGENTS.md` § Repo structure to include `docs/project/`.
- [ ] **Step 7:** Show diff (likely 800–1200 line additions across ~14 files), STOP for owner approval.
- [ ] **Step 8:** Commit + push + open PR.
- [ ] **Step 9:** After merge: `/workflow-pull` in yesid.dev — should ADD all `docs/project/*` files (since they don't exist locally yet) + UPDATE WORKFLOW.md + AGENTS.md scaffold areas.

**STOP criteria:**
- [ ] PR merged to `mgkdante/workflow/main`.
- [ ] yesid.dev gets `docs/project/` skeleton via `/workflow-pull` (pure ADD case — all new files).
- [ ] Audit row added.
- [ ] Devlog entry appended.

---

## Task 6.5 — yesid project-content migration (NEW per amended D3)

**Session:** runs after Task 6 (yesid AGENTS.md trim to slot pattern) and Task 4.5 (plugin scaffold has `docs/project/` skeletons available via `/workflow-pull`).
**Goal:** migrate yesid.dev's project-specific content from `docs/reference/` (and inline AGENTS.md sections) into the new `docs/project/` directory per amended D3. After this task, `docs/reference/` contains ONLY plugin-pulled files; `docs/project/` contains ONLY project content. Hybrid files eliminated.

**Files (in yesid.dev):**

MOVE (file-level migration with `git mv`):
- `docs/reference/ARCHITECTURE.md` → `docs/project/ARCHITECTURE.md`
- `docs/reference/CSS.md` → `docs/project/CSS.md`
- `docs/reference/MOTION.md` → `docs/project/MOTION.md`
- `docs/reference/PATTERNS.md` → `docs/project/PATTERNS.md`
- `docs/reference/CONSTITUTION.md` → `docs/project/CONSTITUTION.md`
- `docs/reference/TESTS.md` → `docs/project/TESTS.md`

SPLIT:
- `docs/reference/VOCAB.md` — split into:
  - `docs/reference/VOCAB.md` (workflow vocab only — replaced by plugin-pulled version)
  - `docs/project/VOCAB.md` (brand vocab + industry vocab + project-LLM-tool vocab + cross-reference)

CREATE (new project docs from extracted AGENTS.md inline content):
- `docs/project/STACK.md` — populate from current AGENTS.md § Runtime + ARCHITECTURE.md § Stack/Dependencies (paths now reference `docs/project/ARCHITECTURE.md`)
- `docs/project/BRAND.md` — populate from current AGENTS.md § Brand (or pointer to `brand/BRAND.md`)
- `docs/project/BINDINGS.md` — populate with: canonical commands binding (`bun run test` = test, `bun run check` = typecheck+lint, `bun run dev` = dev server, `bun run slice:close` = close-script, `op run --env-file=.env -- bun dev` = dev with secrets) + cloud env binding (`YESITO_CLOUD_ROOT` + Windows / macOS / Linux paths) + 1Password vault name + worktree paths
- `docs/project/SERVICES.md` — populate from current AGENTS.md § Project + PLAN.md § Goal/Design Principles (Freelance Digital Infrastructure positioning, dual audience, 6 services framing)

UPDATE LIVE REFERENCES (~30–40 line edits across ~10 files):
- `AGENTS.md` prose — every `docs/reference/<X>.md` reference for the moved files becomes `docs/project/<X>.md`
- `CLAUDE.md` — same if any path refs
- Active slice bundles (`docs/slices/slice-18/`, `docs/slices/slice-cloud-ii/`, etc.) — update inline path references
- Source-code comments — `grep -rn 'docs/reference/CSS\|docs/reference/MOTION\|...' src/` and update
- `docs/README.md` navigation — full rewrite to reflect new structure

UNTOUCHED (per spec non-goals):
- Cloud-archived shipped slice bundles (slice-15, 17b, 17c, 17j, 17k, 18a, 18b) — frozen historical records
- `brand/` — visual identity, separate concern
- `docs/ai-memory/` — memory system
- `docs/sessions/` — non-slice records

**Steps:**

- [ ] **Step 1:** Verify Task 4.5 has merged + yesid has `docs/project/` skeleton via prior `/workflow-pull`.
- [ ] **Step 2:** Pre-migration line-count snapshot for verification.
- [ ] **Step 3:** `git mv` the 6 moved files (`docs/reference/{ARCHITECTURE,CSS,MOTION,PATTERNS,CONSTITUTION,TESTS}.md` → `docs/project/`).
- [ ] **Step 4:** Split `docs/reference/VOCAB.md` — extract project portions to `docs/project/VOCAB.md`; leave workflow vocab section (which gets replaced by plugin-pulled version on next `/workflow-pull`).
- [ ] **Step 5:** Populate `docs/project/{STACK,BRAND,BINDINGS,SERVICES}.md` from extracted AGENTS.md inline content. Refer to scaffold templates pulled in Task 4.5 for shape.
- [ ] **Step 6:** Update live references: AGENTS.md prose, CLAUDE.md if applicable, active slice bundles, `docs/README.md`. Use `grep -rn 'docs/reference/' src/ docs/slices/slice-18/ docs/slices/slice-cloud-ii/` to find all references.
- [ ] **Step 7:** Update source-code comments referencing moved doc paths.
- [ ] **Step 8:** Verify every reference resolves (grep for any remaining `docs/reference/{ARCHITECTURE,CSS,MOTION,PATTERNS,CONSTITUTION,TESTS}` should return zero hits in live files; cloud archive untouched).
- [ ] **Step 9:** Commit per logical group:
  ```
  git mv ... && git commit -m "refactor(slice-cloud-ii): move project-specific reference docs to docs/project/ per amended D3"
  git add docs/project/{STACK,BRAND,BINDINGS,SERVICES}.md && git commit -m "docs(slice-cloud-ii): create project-specific docs from extracted AGENTS.md content"
  git add AGENTS.md CLAUDE.md docs/slices/ docs/README.md && git commit -m "docs(slice-cloud-ii): update live references to new docs/project/ paths"
  ```
- [ ] **Step 10:** Push.

**STOP criteria:**
- [ ] All file moves committed.
- [ ] New project docs populated.
- [ ] Live references updated (zero stale `docs/reference/<moved-file>.md` references in live files).
- [ ] Cloud archive untouched (verify `docs/slices/_TEMPLATES/` and any other shared dirs untouched too).
- [ ] Devlog entry appended.
