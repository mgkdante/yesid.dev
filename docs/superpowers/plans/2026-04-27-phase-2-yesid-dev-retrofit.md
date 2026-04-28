# Phase 2 — yesid.dev Notion Retrofit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrofit yesid.dev to consume the now-shipped Notion-aware workflow plugin (`mgkdante/workflow` v0.4.0). Migrate every eligible repo file to Notion, retire the cloud-mirror scripts, install Notion-canonical hooks for memory + transcripts, and slim the repo to its irreducible local set.

**Architecture:** Plugin operates on Notion DB UUIDs read from `AGENTS.md` frontmatter — structural shape is irrelevant. yesid.dev keeps its existing Phase-0-era `Public-safe/Private` Notion subtree (per Section 16 A4). All migrated narrative content moves to Notion via MCP; assets, code, code-coupled docs, and tool meta-files stay in repo. SessionStart/Stop hooks (Bun TypeScript scripts) bridge `~/.claude/projects/<hash>/` and Notion.

**Tech Stack:** Bun, TypeScript, Notion MCP (`mcp__notion__*`), GitHub `gh` CLI, git. Workflow plugin v0.4.0 (already shipped).

**Spec:** [docs/superpowers/specs/2026-04-27-notion-arc-design.md](../specs/2026-04-27-notion-arc-design.md) — covers § 1–15 (original design) **plus § 16 amendments A1–A6** (post-Phase-1 deviations). This plan consumes the **amended** design.

**Branch:** `feat/notion-migration` (already exists with commits b61b78c, 0766a48, ac57553, plus merged main).

**Repos touched:** `yesid.dev` only.

**Phase 1 dependency:** Workflow plugin `v0.4.0` (PR `mgkdante/workflow#17`) **plus the post-tag output-destinations commit** (a.k.a. `v0.4.0 +1`, may ship as `v0.4.1`). Plan B targets that pinned version because Task 28 transcribes the new "Output destinations (Notion-canonical)" rule from the plugin's scaffold `AGENTS.md` into yesid.dev's `AGENTS.md`.

---

## Output destinations convention (v0.4.0 +1, post-2026-04-27)

Plugin commit after `v0.4.0` (referred to here as `v0.4.0+1`) adds an **output-destinations contract** for third-party planning plugins. When `/superpowers:brainstorming`, `writing-spec`, `writing-plans`, or any command that would default to writing `docs/superpowers/<kind>/<date>-<name>.md` runs, the output now routes to Notion instead:

| Source command | Slice context active | Free-form (no slice) |
|---|---|---|
| `writing-spec` | Specs DB row body (Kind=spec), linked from current Slices row | Specs DB row body (Kind=spec) |
| `writing-plans` | Slice's child `Plan` page | Specs DB row body (Kind=plan) |
| `superpowers:brainstorming` | Slice's child `Plan` or scratch page | Sessions DB row body |
| `writing-handoff` | Slice's child `Handoff` page | n/a |

The rule **auto-loads with AGENTS.md at session start**, so once an adopting project's AGENTS.md contains the section, the convention takes effect.

**Phase 2 implication:** yesid.dev's existing AGENTS.md doesn't yet have this rule. Plan B itself was authored at `docs/superpowers/plans/2026-04-27-phase-2-yesid-dev-retrofit.md` because the convention wasn't active when authoring started — that's the last plan to ship via the old path. Task 28 transcribes the new rule into the slimmed AGENTS.md so future plans land directly in Notion.

Future plans authored against yesid.dev (post-merge) land in Notion. Plan B migrates to Notion as part of Task 15 (Specs DB row, Kind=plan).

---

## Section 16 amendment quick-reference

This plan is the canonical retrofit path that consumes Section 16. Each amendment is referenced inline at the task that exercises it:

- **A1 — Specs as DATABASE.** Frontmatter has 4 DB UUIDs. Specs DB UUID: `e23c55c2-42b1-45c1-b48d-be845bb4166c`. → Tasks 4, 19, 20.
- **A2 — Title column is `Name`.** All DB row creations use `Name` not `Title` in MCP property payloads. → Tasks 19–22.
- **A3 — Toggle markdown via `<details>/<summary>`.** Conversation transcript converter emits `<details><summary>tool result</summary>…</details>` blocks. → Task 30.
- **A4 — Flat shape vs. legacy keep.** Plugin DEFAULT is flat; yesid.dev's existing Public-safe/Private is preserved. Plugin operates on UUIDs, not paths. → Task 2 (decision).
- **A5 — Plugin owns canonical content.** Out of Phase 2 scope; mentioned for context in Tasks 5, 13.
- **A6 — Per-project DEFAULT skeletons are plugin DEFAULT.** `docs/project/*` Notion target pages are already provisioned by the plugin. Migration becomes "merge local content into provisioned pages." → Task 13.

---

## Pre-flight context

### Production Notion IDs (yesid.dev's REAL data — handle with care)

| Surface | UUID / ID |
|---|---|
| Top-level page (`yesid.dev`) | `34f3e863-0690-81e8-a41a-d00abc1b341a` |
| Specs database | `e23c55c2-42b1-45c1-b48d-be845bb4166c` |
| Slices database | `a4128775-19be-4cbf-b20f-f0a9ff49ba71` |
| Conversations database | `fc5ef611-dbcf-425f-8136-99b4b6016e19` |
| Sessions database | `abe34ce1-4b2b-4f57-ad81-4e05ae9ec6f9` |

Workspace URL: `https://www.notion.so/projects/` (or whatever the operator's workspace slug is — verified during Task 4).

### Source-content audit (full per-class inventory)

**Public-safe / Class 2 (~30 files):**

- `docs/project/` — 11 files: `ARCHITECTURE`, `BINDINGS`, `CONSTITUTION`, `CSS`, `MOTION`, `PATTERNS`, `README`, `SERVICES`, `STACK`, `TESTS`, `VOCAB`
- `docs/roadmap/` — 2 files: `PLAN.md`, `FUTURE_PHASES.md`
- `docs/ops/` — 1 file: `rollback.md`
- `docs/README.md`
- `brand/BRAND.md`, `brand/README.md`, `brand/components.md`
- `brand/foundations/` — 7 files: `accessibility`, `color`, `figma`, `motion`, `space`, `typography`, `voice`
- `brand/decisions/` — 4 files: `2026-04-what-i-killed`, `…why-a-constitution`, `…why-edge-to-edge`, `…why-orange`
- `brand/examples/README.md`

**Private / Class 1b + 4:**

- `docs/superpowers/specs/` — 3 files: `2026-04-24-slice-18d-asset-pipeline-design`, `2026-04-24-slice-18-replan`, `2026-04-27-notion-arc-design`
- `docs/superpowers/research/` — 1 file: `2026-04-24-slice-18-replan-audit`
- `docs/superpowers/plans/` — 2 files (this plan + Phase 1 plan): migrate to Notion alongside specs
- `docs/slices/` — 12 dirs: `slice-14`, `slice-15`, …, `slice-22`, `slice-19b`, `slice-headless-cms-best-practices`
- `docs/sessions/` — 1 file: `2026-04-18-slice-sizing-governance.md`
- `docs/ARCHIVE.md`
- `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/` — 14 markdown files (`MEMORY.md` index + 13 typed entries)
- `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl` — 43 transcript files

**Cloud-only content (migrate to Notion before deleting cloud):**

- `~/Yesito/cloud/yesid.dev/docs/ARCHIVE.md` (likely identical to repo copy — diff-verify)
- `~/Yesito/cloud/yesid.dev/docs/COMPLETED-SLICES.md`
- `~/Yesito/cloud/yesid.dev/docs/INDEX.md`
- `~/Yesito/cloud/yesid.dev/docs/archive/` — frozen historical content
- `~/Yesito/cloud/yesid.dev/brand/CLAUDE-DESIGN.md` (cloud-only legacy)
- `~/Yesito/cloud/claude-config/user/<date>-yesid.dev-conversation-archive/<uuid>.jsonl` (historical transcripts) — path may not exist; resolved during Task 28

**Stays in repo (NOT migrated):**

- `brand/logos/`, `brand/figma-exports/` — assets
- `brand/examples/*.svelte.txt`, `brand/examples/*.png` — code-reference
- `brand/scripts/*.ts` — build pipelines
- `docs/ai-memory/*` — auto-memory-system docs (code-coupled)
- `docs/reference/` — plugin-pulled (unchanged by this phase)
- `docs/_TEMPLATES/` — legacy plugin templates; **superseded by plugin's Notion `Templates/` per A5** → retired in Task 41
- All source code, configs, generated `DESIGN.md`, etc. (per spec § 3.A2)

**Stale (delete, do NOT migrate):**

- `~/Yesito/cloud/yesid.dev/docs/learn/`

### Decisions baked into this plan

1. **Keep yesid.dev's Public-safe/Private Notion structure** (Section 16 A4). Flattening is purely cosmetic — the plugin reads UUIDs from `AGENTS.md` frontmatter, not paths. Risk-free non-destructive.
2. **AGENTS.md frontmatter takes 4 DB UUIDs** (Section 16 A1) — Specs, Slices, Conversations, Sessions.
3. **`docs/_TEMPLATES/` is retired** (Section 16 A5) — plugin owns canonical templates in its own Notion subtree. Local templates are stale.
4. **Cloud archive deleted only after Notion verification** (spec § 10.8 + § 10.10). Diff-verification gate before any cloud delete.
5. **`.jsonl` deletes are post-verification** — current session's `.jsonl` stays until session ends.
6. **`bun run check` + `bun run test` must pass after each migration block** that touches code (scripts, hooks). UI-only narrative migrations skip the build verification.
7. **Cross-tool D12 review** (Codex path) runs before PR open (Task 47), per spec § 11 + § 13 governance.

---

## Section 2.0 — Pre-flight cleanup

### Task 1: Resolve uncommitted working-tree state

**Files:**
- Working tree: `apps/web/src/lib/adapters/directus.ts`, `apps/web/src/lib/adapters/static.ts`, `apps/web/src/routes/+layout.ts` (modified)
- Working tree: `apps/web/src/lib/content/site-seo-defaults.ts` (untracked)

The three "modified" files have **no actual diff** (verified empty against HEAD) — they are stat-dirty only, likely from line-ending normalization. The new `site-seo-defaults.ts` is real new content (a `SiteSeoDefaults` static fallback complementing slice 18h-ii PR #88).

- [ ] **Step 1: Refresh git index to clear stat-dirty entries**

```bash
cd C:/Users/otalo/Yesito/Projects/yesid.dev
git update-index --refresh || true
git status
```

Expected: only `apps/web/src/lib/content/site-seo-defaults.ts` remains as untracked. If the three .ts files still show as modified, abort and ask the operator (real diff present, not stat dirt).

- [ ] **Step 2: Commit the new file as a slice-18 follow-up**

```bash
git add apps/web/src/lib/content/site-seo-defaults.ts
git commit -m "chore: add static fallback for SiteSeoDefaults (slice 18h-ii follow-up)"
git status
```

Expected: clean working tree on `feat/notion-migration`.

- [ ] **Step 3: Verify branch state**

```bash
git log --oneline -5
git diff main...HEAD --stat | head
```

Confirm `feat/notion-migration` is rebased on the latest main and ready for Phase 2 commits.

---

### Task 2: Confirm Notion-structure decision (A4) and capture in spec annotation

**Files:**
- Modify: `docs/superpowers/specs/2026-04-27-notion-arc-design.md` (append a one-line decision marker to § 16.A4)

The keep-legacy-structure decision is already documented in Section 16 A4 ("yesid.dev existing structure: … That structure persists … the plugin DEFAULT is flat going forward; existing Public-safe/Private projects continue to work via their stored DB UUIDs in AGENTS.md frontmatter"). This task adds a Phase-2 annotation pinning it.

- [ ] **Step 1: Edit the spec to annotate the A4 decision**

In `docs/superpowers/specs/2026-04-27-notion-arc-design.md`, find the line in § 16.A4 starting with `**yesid.dev existing structure:**`. After the closing sentence, append:

```markdown

**Phase 2 decision (2026-04-27):** keep — plan does not flatten Public-safe/Private. Plugin operates on the four DB UUIDs in `AGENTS.md` frontmatter; structural shape is moot.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-27-notion-arc-design.md
git commit -m "docs(notion-arc): annotate Phase 2 keep-legacy-structure decision under § 16.A4"
```

---

### Task 3: Pin workflow plugin to v0.4.0+1 (or v0.4.1 if tagged)

**Files:**
- Modify: `.claude/settings.json` (or wherever the plugin marketplace is configured)
- Verify: `mgkdante/workflow` PR #17 is merged AND the post-tag output-destinations commit has landed on `main`

This task gates everything downstream. The pinned version must include the v0.4.0 base **plus the output-destinations commit** so that Task 28's transcribed rule is canonically sourced.

- [ ] **Step 1: Determine the right version pin**

```bash
# 1. Confirm v0.4.0 release exists
gh release view v0.4.0 -R mgkdante/workflow

# 2. Check whether v0.4.1 (or v0.4.0+1) is tagged
gh release list -R mgkdante/workflow --limit 5

# 3. Inspect the latest commit on main for the output-destinations addition
gh api repos/mgkdante/workflow/commits/main --jq '.sha,.commit.message' | head -10
```

If `v0.4.1` (or higher) is tagged AND its commit message references "output destinations": pin to that tag.
If only `v0.4.0` is tagged but main has the output-destinations commit on top: pin to the commit SHA, OR ask the operator to cut a `v0.4.1` tag first (preferred — matches Plan A's tagged-release pattern). Document the choice in the migration log.

If main does NOT yet have the output-destinations commit: STOP. The operator must land that commit upstream before Phase 2 proceeds — otherwise Task 28 has nothing canonical to transcribe.

- [ ] **Step 2: Read current marketplace config**

```bash
cat .claude/settings.json | head -40
```

Identify the `plugins` or `marketplaces` field that references the workflow plugin. Note the current pinned version.

- [ ] **Step 3: Pin to v0.4.0**

Edit the config so the workflow plugin entry resolves to `v0.4.0`. The exact key path depends on how the marketplace is configured (`plugins.workflow.version`, `marketplaces.<id>.tag`, or similar). Reference the plugin's `README.md` install instructions if unclear.

If `.claude/settings.json` doesn't manage it, check `~/.claude/settings.json` or the plugin install command output.

- [ ] **Step 4: Commit if config is repo-tracked**

If the change lands in `.claude/settings.json` (repo-tracked):

```bash
git add .claude/settings.json
git commit -m "chore: pin workflow plugin to v0.4.0 for Phase 2 retrofit"
```

If it lands in `~/.claude/settings.json` (user-global): no commit; just save and note in PR description.

- [ ] **Step 5: Verify the new version is loaded**

In a fresh Claude Code session (or `/plugin reload`), check:

```
/plugin list
```

Expected: `workflow` shows version `0.4.0`.

---

### Task 4: Add 4-DB Notion frontmatter to AGENTS.md (A1)

**Files:**
- Modify: `AGENTS.md`

Per Section 16 A1, the plugin v0.4.0 reads four DB UUIDs from AGENTS.md YAML frontmatter. yesid.dev's `AGENTS.md` currently has no frontmatter — Phase 0 created the Notion structure but didn't write the IDs to the repo.

- [ ] **Step 1: Read current AGENTS.md head**

```bash
head -5 AGENTS.md
```

Confirm no existing frontmatter block (no leading `---`).

- [ ] **Step 2: Prepend the frontmatter block**

Insert at line 1 (using `Edit` with `old_string` = the current first line `# AGENTS.md — yesid.dev` and `new_string` = the frontmatter followed by that same heading):

```yaml
---
notion:
  root_page_id: "34f3e863-0690-81e8-a41a-d00abc1b341a"
  workspace_url: "https://www.notion.so/"
  databases:
    specs: "e23c55c2-42b1-45c1-b48d-be845bb4166c"
    slices: "a4128775-19be-4cbf-b20f-f0a9ff49ba71"
    conversations: "fc5ef611-dbcf-425f-8136-99b4b6016e19"
    sessions: "abe34ce1-4b2b-4f57-ad81-4e05ae9ec6f9"
---

# AGENTS.md — yesid.dev
```

Note: `workspace_url` is best-effort; the plugin uses `root_page_id` for all operations. If the operator knows the actual workspace slug, substitute it.

- [ ] **Step 3: Verify frontmatter parses**

```bash
head -12 AGENTS.md
```

Confirm the `---` fences and the YAML structure are well-formed.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "feat(notion): add 4-DB Notion frontmatter to AGENTS.md (per spec § 16.A1)"
```

---

## Section 2.1 — Adopt v0.4.0 (spec § 10.1)

### Task 5: Verify plugin sees frontmatter via /workflow-status

**Files:** none (smoke test)

- [ ] **Step 1: Run /workflow-status**

In a Claude Code session on this branch:

```
/workflow-status
```

Expected output (rough shape — exact wording per plugin v0.4.0):
- Plugin version: 0.4.0
- Notion root: `yesid.dev` (UUID 34f3e863-…)
- Active slice: <none> or last open slice
- 4 DB UUIDs resolved successfully

If the command reports "Notion frontmatter missing" or fails to resolve any DB: revisit Task 4. If it fails to authenticate: re-OAuth via `/mcp` and retry.

- [ ] **Step 2: Capture output for the PR description**

Save the `/workflow-status` output text to `docs/superpowers/plans/phase-2-evidence/01-workflow-status.txt` (gitignored after Task 39; for now, write it via `Bash` with `mkdir -p` then `tee`):

```bash
mkdir -p docs/superpowers/plans/phase-2-evidence
# (paste /workflow-status output into that file via Write tool)
```

This is part of the Phase 2 PR's evidence pack (similar to Plan A's `phase-1-evidence/` shape if any).

---

### Task 6: Run /workflow-pull and inspect what it touches

**Files:** various under `docs/reference/` (refreshed by /workflow-pull)

The new pull behavior fetches plugin canonical content from Notion (per A5) instead of from the plugin's bundled `docs/reference/` shipped in the npm package. Existing `docs/reference/` files may be re-written or augmented.

- [ ] **Step 1: Run /workflow-pull**

```
/workflow-pull
```

Expected: command completes, modifying or creating files under `docs/reference/`. Capture stdout.

- [ ] **Step 2: Inspect the diff**

```bash
git status docs/reference/
git diff docs/reference/ | head -100
```

Confirm changes are reasonable (refreshed pointer files; nothing deleted that shouldn't be).

- [ ] **Step 3: Commit the pull**

```bash
git add docs/reference/
git commit -m "chore: refresh docs/reference/ via /workflow-pull (v0.4.0)"
```

If no changes: no commit; note in evidence file `02-workflow-pull-noop.txt`.

---

## Section 2.2 — Content audit (spec § 10.2 step 1)

### Task 7: Run a per-file disposition audit

**Files:**
- Create: `docs/superpowers/plans/phase-2-evidence/03-content-audit.md`

Walk every file under `docs/`, `brand/`, plus `~/.claude/projects/<hash>/`. Classify each against spec § 6 + Section 16 A6 (which says docs/project/* are Notion-provisioned by plugin DEFAULT). Resolve the edge cases listed in spec § 10.2.

- [ ] **Step 1: Generate file inventory**

```bash
{
  echo "## docs/"
  cd docs && find . -type f -not -path '*/.*' | sort
  echo
  echo "## brand/"
  cd ../brand && find . -type f -not -path '*/.*' | sort
} > /tmp/yesid-inventory.txt
wc -l /tmp/yesid-inventory.txt
```

Expected: ~80–120 paths.

- [ ] **Step 2: Author the audit document**

Create `docs/superpowers/plans/phase-2-evidence/03-content-audit.md` with this shape (one row per source path):

```markdown
# Phase 2 Content Audit

| Source path | Class (§ 6) | Disposition | Notion target | Notes |
|---|---|---|---|---|
| docs/project/STACK.md | 2 (Public-safe) | Migrate (merge per A6) | Public-safe/Project/STACK | A6 — page already provisioned |
| docs/project/BINDINGS.md | 2 | Migrate (merge per A6) | Public-safe/Project/BINDINGS | A6 |
| … (every path classified) | | | | |
| brand/logos/yesid-logo.svg | Code-coupled | Stay in repo | n/a | build pipeline reads |
| brand/examples/home-hero.svelte.txt | Code-reference | Stay in repo | n/a | |
| docs/ai-memory/SCHEMA.md | Code-coupled | Stay in repo | n/a | auto-memory system docs |
| docs/_TEMPLATES/slice/plan.md | Plugin-managed legacy | Delete (Task 41) | n/a | superseded by Notion Templates per A5 |
| ~/Yesito/cloud/yesid.dev/docs/learn/ | Stale | Delete (Task 23) | n/a | spec § 10.4 |
```

Use `Read` + `Glob` to enumerate files; classify each using the disposition table in spec § 6 + Section 16 amendments.

- [ ] **Step 3: Resolve edge cases explicitly**

Add a "Resolved edge cases" section at the bottom of the audit document. Cover:

- `docs/_TEMPLATES/*` — DELETE (per A5, plugin owns templates in its Notion subtree)
- `docs/ai-memory/*` — STAY (auto-memory-system docs; code-coupled)
- `docs/reference/*` — STAY (plugin-pulled, refreshed by /workflow-pull)
- `brand/examples/*.svelte.txt` — STAY (code-reference)
- `brand/scripts/*.ts` — STAY (build pipelines)
- `brand/logos/`, `brand/figma-exports/` — STAY (assets)
- `apps/web/scripts/{mirror-brand,mirror-docs,archive-conversations}.ts` — DELETE (Task 42)

- [ ] **Step 4: Commit the audit**

```bash
git add docs/superpowers/plans/phase-2-evidence/03-content-audit.md
git commit -m "docs(notion-arc): per-file disposition audit for Phase 2 retrofit"
```

The audit is the single source of truth for migration tasks. If a later task discovers a misclassified file, update the audit + commit, then re-run the affected migration task.

---

### Task 8: Discover Notion target page UUIDs

**Files:**
- Create: `docs/superpowers/plans/phase-2-evidence/04-notion-page-manifest.json`

The Phase-0 bootstrap created `Public-safe/Brand/`, `Public-safe/Project/`, `Public-safe/Roadmap/`, `Public-safe/Ops/`, `Private/Specs/`, `Private/Memory/`, `Private/Archive/` under yesid.dev. Their UUIDs are needed as parents for migrated pages. The 7 plugin-DEFAULT skeleton pages under `Public-safe/Project/` (per A6) are particularly important — their UUIDs let migration tasks update existing pages instead of creating duplicates.

- [ ] **Step 1: Fetch the yesid.dev page tree**

Use `mcp__notion__fetch` with `id="34f3e863-0690-81e8-a41a-d00abc1b341a"` to retrieve top-level children. Then recurse one or two levels for `Public-safe/*` and `Private/*`.

- [ ] **Step 2: Build the manifest JSON**

Create `docs/superpowers/plans/phase-2-evidence/04-notion-page-manifest.json` with this shape:

```json
{
  "root": "34f3e863-0690-81e8-a41a-d00abc1b341a",
  "public_safe": {
    "page_id": "<UUID>",
    "children": {
      "Brand": { "page_id": "<UUID>", "children": { "Foundations": "<UUID>", "Decisions": "<UUID>", "Examples": "<UUID>" } },
      "Project": { "page_id": "<UUID>", "children": { "STACK": "<UUID>", "BINDINGS": "<UUID>", "ARCHITECTURE": "<UUID>", "TESTS": "<UUID>", "CONSTITUTION": "<UUID>", "VOCAB": "<UUID>", "README": "<UUID>" } },
      "Roadmap": { "page_id": "<UUID>" },
      "Ops": { "page_id": "<UUID>" }
    }
  },
  "private": {
    "page_id": "<UUID>",
    "children": {
      "Specs": { "page_id": "<UUID>" },
      "Memory": { "page_id": "<UUID>" },
      "Archive": { "page_id": "<UUID>" }
    }
  },
  "databases": {
    "specs": "e23c55c2-42b1-45c1-b48d-be845bb4166c",
    "slices": "a4128775-19be-4cbf-b20f-f0a9ff49ba71",
    "conversations": "fc5ef611-dbcf-425f-8136-99b4b6016e19",
    "sessions": "abe34ce1-4b2b-4f57-ad81-4e05ae9ec6f9"
  }
}
```

If A6's seven `Public-safe/Project/*` skeletons are missing from the existing structure (Phase 0 predates A6), record `null` for the missing ones. Task 13 then runs `/workflow-add` rebuild OR creates them inline before merging.

- [ ] **Step 3: Commit the manifest**

```bash
git add docs/superpowers/plans/phase-2-evidence/04-notion-page-manifest.json
git commit -m "chore(notion-arc): capture yesid.dev Notion page UUID manifest"
```

The manifest is the lookup source for every migration task in Sections 2.3–2.4.

---

## Section 2.3 — Migrate Public-safe content (spec § 10.2)

### Task 9: Migrate docs/roadmap/PLAN.md and FUTURE_PHASES.md

**Files:**
- Read: `docs/roadmap/PLAN.md`, `docs/roadmap/FUTURE_PHASES.md`
- Notion target: `Public-safe/Roadmap/` (UUID from manifest Task 8)

- [ ] **Step 1: Read each file**

```
Read docs/roadmap/PLAN.md
Read docs/roadmap/FUTURE_PHASES.md
```

Capture full markdown body for each.

- [ ] **Step 2: Create Notion sub-pages**

For each file, call `mcp__notion__create-pages` with:
- `parent`: `{ page_id: "<Public-safe/Roadmap UUID from manifest>" }`
- `pages`: `[{ properties: { title: "PLAN" }, content: "<markdown body>" }]` (and similarly for FUTURE_PHASES)

If `Public-safe/Roadmap/` already contains pages titled `PLAN` or `FUTURE_PHASES` (rare — Phase 0 didn't pre-create them), skip create and use `mcp__notion__update-page` to overwrite content instead. Verify via `mcp__notion__fetch` on the parent before deciding.

- [ ] **Step 3: Verify the migration**

Use `mcp__notion__fetch` on each new page UUID. Spot-check that:
- Title matches (`PLAN`, `FUTURE_PHASES`)
- First paragraph of body matches the source `.md` first paragraph
- A heading mid-document renders as a Notion heading block

- [ ] **Step 4: Commit migration evidence**

Append to `docs/superpowers/plans/phase-2-evidence/05-migration-log.md` (create if needed):

```markdown
## Section 2.3 — Public-safe migrations

- [2026-04-27] Migrated docs/roadmap/PLAN.md → Notion <UUID>
- [2026-04-27] Migrated docs/roadmap/FUTURE_PHASES.md → Notion <UUID>
```

```bash
git add docs/superpowers/plans/phase-2-evidence/05-migration-log.md
git commit -m "docs(notion-arc): migrate docs/roadmap/* to Notion Public-safe/Roadmap"
```

Note: source `.md` files stay in the repo until Task 39 (gitignore + working-tree removal). They are not deleted yet.

---

### Task 10: Migrate docs/ops/rollback.md

**Files:**
- Read: `docs/ops/rollback.md`
- Notion target: `Public-safe/Ops/` (UUID from manifest)

- [ ] **Step 1: Read source**

```
Read docs/ops/rollback.md
```

- [ ] **Step 2: Create Notion page**

`mcp__notion__create-pages` with parent = `Public-safe/Ops` UUID, page title = `rollback`, content = full markdown body.

- [ ] **Step 3: Verify and log**

Same pattern as Task 9. Append to migration log:

```markdown
- [date] Migrated docs/ops/rollback.md → Notion <UUID>
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/phase-2-evidence/05-migration-log.md
git commit -m "docs(notion-arc): migrate docs/ops/rollback.md to Notion Public-safe/Ops"
```

---

### Task 11: Migrate docs/README.md

**Files:**
- Read: `docs/README.md`
- Notion target: `Public-safe/Project/` (as the index page) OR top-level README under Public-safe — decided per Step 2.

- [ ] **Step 1: Read source**

```
Read docs/README.md
```

Inspect content. If it's a docs-tree map (table of contents): the canonical Notion equivalent is the parent page's body, not a separate README.

- [ ] **Step 2: Decide target**

Two options:
- (a) Replace `Public-safe/Project/` page body with this README content (so opening the page in Notion shows the index)
- (b) Create a child page `Public-safe/Project/README` (preserves source filename)

Default: option (a). It collapses the redundant level. Document the choice in the migration log.

- [ ] **Step 3: Apply**

If (a): `mcp__notion__update-page` with `id` = `Public-safe/Project` UUID and `content` = README markdown.
If (b): `mcp__notion__create-pages` under `Public-safe/Project` with title `README`.

- [ ] **Step 4: Verify and commit**

Same pattern. Migration log entry, commit.

---

### Task 12: Migrate brand narrative content (BRAND, components, README, foundations/, decisions/, examples/README)

**Files:**
- Read: `brand/BRAND.md`, `brand/README.md`, `brand/components.md`, `brand/foundations/{accessibility,color,figma,motion,space,typography,voice}.md`, `brand/decisions/{2026-04-what-i-killed,why-a-constitution,why-edge-to-edge,why-orange}.md`, `brand/examples/README.md`
- Notion target: `Public-safe/Brand/` and its `Foundations/`, `Decisions/`, `Examples/` children (UUIDs from manifest)

This is 14 files across 4 Notion targets. Treat as one task with iteration.

- [ ] **Step 1: Migrate top-level brand files**

For each of `brand/BRAND.md`, `brand/README.md`, `brand/components.md`:

```
Read <file>
mcp__notion__create-pages parent=<Public-safe/Brand UUID> title=<filename without .md> content=<body>
```

Special case for `brand/README.md`: same option (a)/(b) decision as Task 11 — default to (a) (overwrite `Public-safe/Brand` page body).

- [ ] **Step 2: Migrate brand/foundations/**

For each of the 7 foundations files:

```
Read brand/foundations/<file>.md
mcp__notion__create-pages parent=<Public-safe/Brand/Foundations UUID> title=<file> content=<body>
```

- [ ] **Step 3: Migrate brand/decisions/**

For each of the 4 decisions files:

```
Read brand/decisions/<file>.md
mcp__notion__create-pages parent=<Public-safe/Brand/Decisions UUID> title=<file without .md> content=<body>
```

- [ ] **Step 4: Migrate brand/examples/README.md**

```
Read brand/examples/README.md
mcp__notion__create-pages parent=<Public-safe/Brand/Examples UUID> title=README content=<body>
```

(Or option (a): overwrite `Public-safe/Brand/Examples` page body.)

- [ ] **Step 5: Spot-check 3 random pages in Notion web UI**

Open three of the just-created pages in Notion. Verify:
- Body content is present
- Markdown headings rendered as Notion heading blocks
- Code fences (if any) rendered as code blocks
- Links survived round-trip (relative `[…](path/to)` may break — note in migration log if so)

- [ ] **Step 6: Append to migration log + commit**

```markdown
- [date] Migrated brand/* (14 files) → Notion Public-safe/Brand/* — <list of UUIDs>
```

```bash
git add docs/superpowers/plans/phase-2-evidence/05-migration-log.md
git commit -m "docs(notion-arc): migrate brand/* narrative to Notion Public-safe/Brand"
```

---

### Task 13: Merge docs/project/* into provisioned Notion pages (per A6)

**Files:**
- Read: `docs/project/{STACK,BINDINGS,ARCHITECTURE,TESTS,CONSTITUTION,VOCAB,README,SERVICES,PATTERNS,CSS,MOTION}.md` (11 files)
- Notion target: `Public-safe/Project/<each>` — page existence depends on whether Phase 0 pre-created the A6 seven, plus extras for the four non-A6 pages (`SERVICES`, `PATTERNS`, `CSS`, `MOTION`)

Per Section 16 A6: the 7 DEFAULT skeletons (`README`, `STACK`, `BINDINGS`, `ARCHITECTURE`, `TESTS`, `CONSTITUTION`, `VOCAB`) are plugin-provisioned. yesid.dev's Phase 0 bootstrap may predate A6 — in that case some skeletons don't exist yet and need creation.

- [ ] **Step 1: Inspect manifest for which Project skeletons exist**

Open `docs/superpowers/plans/phase-2-evidence/04-notion-page-manifest.json`. Note which `Public-safe/Project/*` UUIDs are populated vs `null`.

- [ ] **Step 2: Create missing skeletons**

For each `null` skeleton in the A6 set (`README`, `STACK`, `BINDINGS`, `ARCHITECTURE`, `TESTS`, `CONSTITUTION`, `VOCAB`):

```
mcp__notion__create-pages parent=<Public-safe/Project UUID> title=<NAME> content=""
```

Also create child pages for the four non-A6 files yesid.dev has (`SERVICES`, `PATTERNS`, `CSS`, `MOTION`):

```
mcp__notion__create-pages parent=<Public-safe/Project UUID> title=<NAME> content=""
```

Update the manifest with the new UUIDs (re-write `04-notion-page-manifest.json`).

- [ ] **Step 3: Merge each docs/project/<NAME>.md into its corresponding page**

For each file, decide between:
- **Replace**: page body = file body (use when page is empty / placeholder)
- **Append**: page body = existing page body + `\n\n---\n\n` + file body (use when page already has plugin DEFAULT content from A6)

Default rule: if A6 default exists (the seven), **append** with a `## yesid.dev specifics` heading marker. If a brand-new skeleton was just created in Step 2, **replace**.

```
Read docs/project/<NAME>.md
mcp__notion__fetch id=<page UUID>
# decide replace-vs-append
mcp__notion__update-page id=<page UUID> content=<merged body>
```

- [ ] **Step 4: Verify the eleven pages**

Use `mcp__notion__fetch` on each. Spot-check that yesid.dev-specific content is present alongside any A6 default.

- [ ] **Step 5: Update manifest + commit**

```bash
git add docs/superpowers/plans/phase-2-evidence/04-notion-page-manifest.json docs/superpowers/plans/phase-2-evidence/05-migration-log.md
git commit -m "docs(notion-arc): merge docs/project/* into Notion Public-safe/Project (per § 16.A6)"
```

---

## Section 2.4 — Migrate Private content (spec § 10.3)

### Task 14: Migrate docs/superpowers/specs/* → Specs DB rows (A1)

**Files:**
- Read: `docs/superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md`, `…2026-04-24-slice-18-replan.md`, `…2026-04-27-notion-arc-design.md`
- Notion target: Specs DB (`e23c55c2-42b1-45c1-b48d-be845bb4166c`)

Per A1: Specs is a database. Each spec becomes a row.

- [ ] **Step 1: Confirm Specs DB schema**

Use `mcp__notion__fetch` with `id="e23c55c2-42b1-45c1-b48d-be845bb4166c"` to inspect column shape. Per A1, minimum columns are `Name (title)`. Operator may have added more (e.g., `Status`, `Owner`, `Date`).

- [ ] **Step 2: Create one row per spec**

For each of the 3 spec files:

```
Read docs/superpowers/specs/<file>.md
mcp__notion__create-pages parent={ database_id: "e23c55c2-42b1-45c1-b48d-be845bb4166c" } pages=[{
  properties: { Name: "<file name without date prefix and .md>" },
  content: "<full markdown body>"
}]
```

Note A2: use `Name` (not `Title`) as the title-property key in the MCP payload.

- [ ] **Step 3: Verify**

Open the Specs DB in Notion web UI. Confirm 3 new rows. Open one row; verify body matches source.

- [ ] **Step 4: Commit log**

```markdown
- [date] Migrated docs/superpowers/specs/* (3 files) → Specs DB rows <UUIDs>
```

```bash
git add docs/superpowers/plans/phase-2-evidence/05-migration-log.md
git commit -m "docs(notion-arc): migrate specs/* to Notion Specs DB (per § 16.A1)"
```

---

### Task 15: Migrate docs/superpowers/research/* and docs/superpowers/plans/*

**Files:**
- Read: `docs/superpowers/research/2026-04-24-slice-18-replan-audit.md` (1 file)
- Read: `docs/superpowers/plans/2026-04-27-phase-1-notion-aware-plugin.md`, `…phase-2-yesid-dev-retrofit.md` (this plan; 2 files)

**Decision:** research and plans co-locate with specs in the Specs DB. Add a property `Kind` (text or select) with values `spec` / `research` / `plan` to disambiguate. If the operator hasn't added that column, this task adds it.

- [ ] **Step 1: Add `Kind` column to Specs DB if missing**

Use `mcp__notion__update-data-source` to add a `Kind` select column with options `spec`, `research`, `plan`. If the column already exists with these options: skip.

- [ ] **Step 2: Backfill existing Specs DB rows with `Kind = spec`**

For each row created in Task 14: `mcp__notion__update-page` setting `properties.Kind = "spec"`.

- [ ] **Step 3: Migrate research file**

Same pattern as Task 14, creating one Specs DB row with `Kind = research`.

- [ ] **Step 4: Migrate plans (this Phase 2 plan + Phase 1 plan)**

Same pattern, `Kind = plan`. For this very file (`2026-04-27-phase-2-yesid-dev-retrofit.md`), the migration may need to happen at a different point (so the plan is in Notion to reference during execution). Operator can run this step first if they prefer Notion-canonical execution; otherwise migrate at the natural ordering.

- [ ] **Step 5: Commit log**

```bash
git commit -m "docs(notion-arc): migrate superpowers research + plans to Notion Specs DB"
```

---

### Task 16: Migrate docs/slices/* → Slices DB rows + linked detail pages

**Files:**
- Read: 12 directories under `docs/slices/`
- Notion target: Slices DB (`a4128775-19be-4cbf-b20f-f0a9ff49ba71`)

Each slice directory contains some subset of `plan.md`, `devlog.md` (or `log.md`), `handoff.md`, plus possibly `figma.md`, `subslice-*` dirs, etc. Each slice → one row in Slices DB. Slice's body content (`devlog`/`log`) goes in the row body. Sibling files (`plan`, `handoff`, `figma`) become child pages under the row.

- [ ] **Step 1: Confirm Slices DB schema**

`mcp__notion__fetch id="a4128775-19be-4cbf-b20f-f0a9ff49ba71"`. Expected columns per spec § 5: `Name (title)`, `Slice-N` (number), `Status`, `Open date`, `Close date`, `PR link` (URL), `Repo` (select), `Spec` (relation→Specs).

- [ ] **Step 2: For each slice directory, create the row + body**

Iterate over `docs/slices/slice-14`, `slice-15`, ..., `slice-22`, `slice-19b`, `slice-headless-cms-best-practices`:

```
ls docs/slices/<slice-dir>/
Read docs/slices/<slice-dir>/devlog.md  # or log.md if devlog absent
# Read plan.md, handoff.md, figma.md if present (capture for child pages)

mcp__notion__create-pages parent={ database_id: "a4128775-19be-4cbf-b20f-f0a9ff49ba71" } pages=[{
  properties: {
    Name: "Slice <N> — <description from devlog title>",
    "Slice-N": <N as number>,  # 14, 15, 18, etc. (slice-19b → 19.5 or skip; slice-headless-cms-best-practices → no number, leave null)
    Status: "closed",          # all historical slices are closed
    "Open date": <YYYY-MM-DD from earliest commit on slice branch — best-effort>,
    "Close date": <YYYY-MM-DD from PR merge — see gh pr list>,
    "PR link": "<GitHub URL — get via gh pr list --search 'slice-N'>",
    Repo: "yesid.dev"
  },
  content: "<devlog markdown>"
}]
```

Capture the returned row UUID.

- [ ] **Step 3: Create child pages for non-devlog files**

Under each row, create child pages for each of `plan.md`, `handoff.md`, `figma.md`, etc., if present:

```
mcp__notion__create-pages parent={ page_id: "<row UUID>" } pages=[{
  properties: { title: "Plan" },
  content: "<plan.md body>"
}]
```

For sub-slice subdirectories (`subslice-*`), nest one more level: child pages of the subslice page.

- [ ] **Step 4: Resolve Spec relation if applicable**

If a slice's `plan.md` or `devlog.md` references a spec from `docs/superpowers/specs/`, set the row's `Spec` relation property to the corresponding Specs DB row UUID (looked up from Task 14 evidence).

- [ ] **Step 5: Spot-check 3 slices in Notion web UI**

Open `Slice 18`, `Slice 14`, and `slice-headless-cms-best-practices` rows. Verify each has body content + expected child pages.

- [ ] **Step 6: Commit log**

```markdown
- [date] Migrated docs/slices/* (12 dirs) → Slices DB rows <UUIDs>
```

```bash
git commit -m "docs(notion-arc): migrate docs/slices/* to Notion Slices DB"
```

---

### Task 17: Migrate docs/sessions/* → Sessions DB rows

**Files:**
- Read: `docs/sessions/2026-04-18-slice-sizing-governance.md` (1 file)
- Notion target: Sessions DB (`abe34ce1-4b2b-4f57-ad81-4e05ae9ec6f9`)

- [ ] **Step 1: Confirm Sessions DB schema**

Per spec § 5: `Name (title)`, `Date`, `Project` (select), `Slices touched` (multi-relation→Slices), `Brief summary` (text).

- [ ] **Step 2: Create the row**

```
mcp__notion__create-pages parent={ database_id: "abe34ce1-…" } pages=[{
  properties: {
    Name: "Session 2026-04-18 — slice sizing governance",
    Date: "2026-04-18",
    Project: "yesid.dev",
    "Brief summary": "<derived from file's intro paragraph>"
  },
  content: "<full markdown body>"
}]
```

- [ ] **Step 3: Backfill `Slices touched` if applicable**

Inspect the session file. If it references slices (e.g., "discussed slice 18 sizing"), set `Slices touched` relation to those Slice DB rows from Task 16.

- [ ] **Step 4: Commit log**

```bash
git commit -m "docs(notion-arc): migrate docs/sessions/* to Notion Sessions DB"
```

---

### Task 18: Migrate docs/ARCHIVE.md + cloud archive content → Notion Archive

**Files:**
- Read: `docs/ARCHIVE.md`
- Read: `~/Yesito/cloud/yesid.dev/docs/archive/*` (frozen historical content; multiple files)
- Read: `~/Yesito/cloud/yesid.dev/docs/COMPLETED-SLICES.md`, `INDEX.md`
- Read: `~/Yesito/cloud/yesid.dev/brand/CLAUDE-DESIGN.md`
- Notion target: `Private/Archive/` (UUID from manifest)

- [ ] **Step 1: Inventory cloud-only files**

```bash
find ~/Yesito/cloud/yesid.dev/docs/archive -type f | sort
ls ~/Yesito/cloud/yesid.dev/docs/COMPLETED-SLICES.md ~/Yesito/cloud/yesid.dev/docs/INDEX.md ~/Yesito/cloud/yesid.dev/brand/CLAUDE-DESIGN.md
```

Update the audit document (Task 7) if any new file surfaces.

- [ ] **Step 2: Migrate docs/ARCHIVE.md (repo)**

```
Read docs/ARCHIVE.md
mcp__notion__create-pages parent=<Private/Archive UUID> title="ARCHIVE (repo)" content=<body>
```

- [ ] **Step 3: Migrate cloud archive files**

For each file under `~/Yesito/cloud/yesid.dev/docs/archive/`:

```
Read <full path>
mcp__notion__create-pages parent=<Private/Archive UUID> title="<relative path under archive/>" content=<body>
```

Preserve the original relative-path-as-title naming so the operator can track provenance.

- [ ] **Step 4: Migrate top-level cloud-only files**

```
mcp__notion__create-pages parent=<Private/Archive UUID> title="COMPLETED-SLICES (cloud)" content=<body>
mcp__notion__create-pages parent=<Private/Archive UUID> title="INDEX (cloud)" content=<body>
mcp__notion__create-pages parent=<Private/Archive UUID> title="CLAUDE-DESIGN (cloud brand)" content=<body>
```

- [ ] **Step 5: Diff-verify cloud `docs/ARCHIVE.md` vs repo `docs/ARCHIVE.md`**

```bash
diff -u docs/ARCHIVE.md ~/Yesito/cloud/yesid.dev/docs/ARCHIVE.md | head -40
```

If identical: cloud copy is redundant; only one Notion page needed (already created in Step 2). If different: migrate the cloud copy too with title `ARCHIVE (cloud divergent)`.

- [ ] **Step 6: Commit log**

```bash
git commit -m "docs(notion-arc): migrate ARCHIVE + cloud-only content to Notion Private/Archive"
```

---

## Section 2.5 — Delete cloud-only stale (spec § 10.4)

### Task 19: Delete ~/Yesito/cloud/yesid.dev/docs/learn/

**Files:**
- Delete: `~/Yesito/cloud/yesid.dev/docs/learn/`

Stale content per spec disposition table; not migrated.

- [ ] **Step 1: Inventory before deleting**

```bash
find ~/Yesito/cloud/yesid.dev/docs/learn -type f | sort > /tmp/learn-inventory.txt
wc -l /tmp/learn-inventory.txt
cat /tmp/learn-inventory.txt
```

- [ ] **Step 2: User confirmation gate**

**STOP. Do not proceed without explicit operator confirmation.** Show the inventory; ask: "Delete `~/Yesito/cloud/yesid.dev/docs/learn/` (N files listed above)? [y/N]". Only proceed on explicit `y`.

- [ ] **Step 3: Delete**

```bash
rm -rf ~/Yesito/cloud/yesid.dev/docs/learn
ls ~/Yesito/cloud/yesid.dev/docs/ | grep -v learn  # verify removed
```

- [ ] **Step 4: Log deletion**

Append to `05-migration-log.md`:

```markdown
- [date] Deleted ~/Yesito/cloud/yesid.dev/docs/learn/ (N files) — stale, never migrated
```

```bash
git commit -m "docs(notion-arc): log deletion of stale cloud learn/ subtree"
```

---

## Section 2.6 — Memory migration + SessionStart hook (spec § 10.5)

### Task 20: Migrate ~/.claude/projects/<hash>/memory/*.md to Notion Memory page

**Files:**
- Read: `C:/Users/otalo/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/*.md` (14 files)
- Notion target: `Private/Memory/` (UUID from manifest)

The `MEMORY.md` index becomes the Memory page body; each typed entry becomes a child sub-page.

- [ ] **Step 1: List memory files**

```bash
ls C:/Users/otalo/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/
```

Expected: 14 entries — `MEMORY.md` (index) + 13 typed entries.

- [ ] **Step 2: Migrate the index**

```
Read C:/Users/otalo/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/MEMORY.md
mcp__notion__update-page id=<Private/Memory UUID> content=<MEMORY.md body>
```

(Replace the existing `Memory` page body — Phase 0 left it empty.)

- [ ] **Step 3: Migrate each typed entry**

For each non-index file (`feedback_*.md`, `project_*.md`, `reference_*.md`, `user_*.md`):

```
Read <file>
mcp__notion__create-pages parent={ page_id: "<Private/Memory UUID>" } pages=[{
  properties: { title: "<filename without .md>" },
  content: "<body>"
}]
```

- [ ] **Step 4: Verify in Notion**

Open `Private/Memory` in web UI. Confirm:
- Index body shows the MEMORY.md catalog
- 13 child pages named `feedback_*`, `project_*`, etc.

- [ ] **Step 5: Commit log**

```markdown
- [date] Migrated memory/ (14 files) → Notion Private/Memory + 13 child pages
```

```bash
git commit -m "docs(notion-arc): migrate ~/.claude memory/* to Notion Private/Memory"
```

Note: local memory files are NOT deleted yet. The SessionStart hook (Task 21) will overwrite them on next session start; until verified, they stay as a fallback.

---

### Task 21: Build the SessionStart memory-pull hook script

**Files:**
- Create: `apps/web/scripts/notion-hooks/session-start.ts`
- Create: `apps/web/scripts/notion-hooks/lib/notion-client.ts` (shared MCP wrapper)

The hook fetches all pages under the Memory parent page in Notion, writes them as `<title>.md` files in `~/.claude/projects/<hash>/memory/`, deletes any local file that no longer has a Notion counterpart.

- [ ] **Step 1: Scaffold the hook script**

Create `apps/web/scripts/notion-hooks/session-start.ts`:

```typescript
#!/usr/bin/env bun
// SessionStart hook: pull Notion Private/Memory/* → ~/.claude/projects/<hash>/memory/*.md
// Per spec § 7 + Section 16 A4 (yesid.dev keeps Public-safe/Private structure).

import { mkdir, readdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PROJECT_HASH = 'C--Users-otalo-Yesito-Projects-yesid-dev';
const MEMORY_PARENT_ID = '<Private/Memory UUID from manifest — fill at install>';
const LOCAL_MEMORY_DIR = join(homedir(), '.claude', 'projects', PROJECT_HASH, 'memory');
const LOG_PATH = join(homedir(), '.claude', 'logs', 'notion-hooks.log');

async function log(msg: string): Promise<void> {
  await mkdir(join(homedir(), '.claude', 'logs'), { recursive: true });
  const line = `[${new Date().toISOString()}] session-start: ${msg}\n`;
  await Bun.write(Bun.file(LOG_PATH), line, { append: true } as never);
}

interface NotionPage {
  id: string;
  title: string;
  body_markdown: string;
}

async function pullMemoryPages(): Promise<NotionPage[]> {
  // Calls Notion MCP via the local proxy (the hook runs outside the Claude Code session,
  // so `mcp__notion__*` is not in scope; use the HTTP /mcp endpoint with stored OAuth token).
  // Implementation: see apps/web/scripts/notion-hooks/lib/notion-client.ts
  throw new Error('TODO: implement via lib/notion-client.ts');
}

async function syncToLocal(pages: NotionPage[]): Promise<void> {
  await mkdir(LOCAL_MEMORY_DIR, { recursive: true });
  const wantedFilenames = new Set(pages.map((p) => `${p.title}.md`));

  for (const page of pages) {
    const filepath = join(LOCAL_MEMORY_DIR, `${page.title}.md`);
    await writeFile(filepath, page.body_markdown, 'utf-8');
  }

  const existing = await readdir(LOCAL_MEMORY_DIR);
  for (const name of existing) {
    if (name.endsWith('.md') && !wantedFilenames.has(name)) {
      await unlink(join(LOCAL_MEMORY_DIR, name));
      await log(`deleted orphan local file ${name}`);
    }
  }
}

async function main(): Promise<void> {
  try {
    const pages = await pullMemoryPages();
    await syncToLocal(pages);
    await log(`pulled ${pages.length} pages successfully`);
  } catch (err) {
    await log(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    // Spec § F4: graceful degradation — leave local files untouched on failure
    process.exit(0);
  }
}

await main();
```

- [ ] **Step 2: Implement the Notion MCP client wrapper**

Create `apps/web/scripts/notion-hooks/lib/notion-client.ts`:

```typescript
// Notion MCP client for hook scripts. Uses the same /mcp HTTP endpoint Claude Code uses,
// authenticated via the stored OAuth token (Notion writes it to a known location after /mcp consent).
//
// Token resolution order:
//   1. process.env.NOTION_MCP_TOKEN (if explicitly set)
//   2. ~/.config/notion-mcp/token.json (Notion plugin's default storage)
//
// On token-missing: throw with a clear message instructing the user to run /mcp.

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const NOTION_MCP_URL = 'https://mcp.notion.com/mcp';

async function resolveToken(): Promise<string> {
  if (process.env.NOTION_MCP_TOKEN) return process.env.NOTION_MCP_TOKEN;
  const path = join(homedir(), '.config', 'notion-mcp', 'token.json');
  try {
    const raw = await readFile(path, 'utf-8');
    const parsed = JSON.parse(raw) as { access_token?: string };
    if (!parsed.access_token) throw new Error('token.json missing access_token field');
    return parsed.access_token;
  } catch (err) {
    throw new Error(
      `Notion MCP token unavailable. Run /mcp in Claude Code to OAuth, or set NOTION_MCP_TOKEN. (cause: ${err instanceof Error ? err.message : String(err)})`,
    );
  }
}

interface NotionPage {
  id: string;
  title: string;
  body_markdown: string;
}

export async function fetchChildren(parentId: string): Promise<NotionPage[]> {
  const token = await resolveToken();
  // POST to the MCP HTTP endpoint with method=notion-fetch + parent
  // Exact request shape per the Notion MCP HTTP spec — verify against
  // https://github.com/makenotion/notion-mcp-server during implementation.
  const response = await fetch(NOTION_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      method: 'notion-fetch',
      params: { id: parentId, include_children: true },
    }),
  });
  if (!response.ok) {
    throw new Error(`Notion MCP fetch failed: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { children?: Array<{ id: string; title: string; markdown: string }> };
  return (data.children ?? []).map((c) => ({ id: c.id, title: c.title, body_markdown: c.markdown }));
}
```

Note: the exact HTTP request shape for Notion MCP fetch must be verified against `makenotion/notion-mcp-server`. If the MCP HTTP spec doesn't expose direct `notion-fetch`, fall back to using the Notion REST API (`https://api.notion.com/v1/...`) directly with a Notion integration token instead of the OAuth-via-MCP token. The choice is finalized during implementation.

- [ ] **Step 3: Wire the actual `pullMemoryPages` call**

Replace the `throw new Error('TODO: …')` in `session-start.ts` with:

```typescript
import { fetchChildren } from './lib/notion-client';

async function pullMemoryPages(): Promise<NotionPage[]> {
  return fetchChildren(MEMORY_PARENT_ID);
}
```

- [ ] **Step 4: Smoke-test the script manually**

```bash
cd apps/web
bun run scripts/notion-hooks/session-start.ts
ls ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/
cat ~/.claude/logs/notion-hooks.log | tail -5
```

Expected: 14 .md files in the memory dir matching Notion content; log shows success.

- [ ] **Step 5: Commit**

```bash
git add apps/web/scripts/notion-hooks/
git commit -m "feat(notion-hooks): SessionStart memory-pull hook + MCP client wrapper"
```

---

### Task 22: Register SessionStart hook in ~/.claude/settings.json

**Files:**
- Modify: `~/.claude/settings.json` (user-global, NOT repo-tracked)

- [ ] **Step 1: Read current settings**

```bash
cat ~/.claude/settings.json | head -60
```

Look for a `hooks` field. If absent: add it.

- [ ] **Step 2: Add the SessionStart entry**

Edit `~/.claude/settings.json` to include:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "match": "C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev",
        "command": "bun C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev\\apps\\web\\scripts\\notion-hooks\\session-start.ts"
      }
    ]
  }
}
```

If a `SessionStart` array already exists, append the new entry.

- [ ] **Step 3: Verify hook registration**

```bash
# Open a fresh Claude Code session in yesid.dev
# Watch for the hook to fire — check log:
cat ~/.claude/logs/notion-hooks.log | tail -3
```

Expected: a fresh `[<timestamp>] session-start: pulled N pages successfully` line.

- [ ] **Step 4: End-to-end verification**

1. In Notion web UI, edit `Private/Memory/feedback_wsl_bash_default.md` — append a marker line `### TEST <timestamp>`.
2. Start a fresh Claude Code session in `yesid.dev`.
3. Check the local file: `cat ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/feedback_wsl_bash_default.md | grep "### TEST"`.
4. If the marker is present: hook works. Remove the marker from Notion (cleanup).

- [ ] **Step 5: Document in evidence**

Append to `05-migration-log.md`:

```markdown
- [date] Registered SessionStart hook in ~/.claude/settings.json
- [date] E2E verified: Notion edit → next session local file = updated
```

```bash
git commit --allow-empty -m "chore(notion-arc): SessionStart hook registered + E2E verified"
```

(Empty commit because the change lives in user-global config, not repo. The commit log this as a milestone.)

---

## Section 2.7 — Transcript migration + SessionStop hook (spec § 10.6)

### Task 23: Build migrate-conversations.ts (one-time bulk + ongoing-pushable)

**Files:**
- Create: `apps/web/scripts/notion-hooks/migrate-conversations.ts`
- Reuses: `apps/web/scripts/notion-hooks/lib/notion-client.ts` from Task 21

Converts a `.jsonl` transcript to a Notion-ready markdown body (Section 16 A3 — `<details>/<summary>` for tool results), then creates a row in the Conversations DB (`fc5ef611-…`).

- [ ] **Step 1: Scaffold the converter**

Create `apps/web/scripts/notion-hooks/migrate-conversations.ts`:

```typescript
#!/usr/bin/env bun
// Convert a Claude Code .jsonl transcript to Notion Conversations DB row.
// Per spec § 3.G + Section 16 A3 (toggle markdown via <details>/<summary>).

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createConversationRow } from './lib/notion-client';

const CONVERSATIONS_DB_ID = 'fc5ef611-dbcf-425f-8136-99b4b6016e19';
const TOOL_RESULT_TRUNCATE = 5000;
const MAX_BLOCKS_BEFORE_SPLIT = 80;

interface JsonlEvent {
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | string;
  content?: string | Array<{ type: string; text?: string; input?: unknown; tool_use_id?: string; content?: unknown }>;
  uuid?: string;
  timestamp?: string;
}

function eventToMarkdown(evt: JsonlEvent): string {
  if (evt.type === 'user') {
    const text = typeof evt.content === 'string' ? evt.content : '';
    return `### User\n\n${text}\n`;
  }
  if (evt.type === 'assistant') {
    const text = typeof evt.content === 'string' ? evt.content : '';
    return `### Assistant\n\n${text}\n`;
  }
  if (evt.type === 'tool_use') {
    const name = Array.isArray(evt.content) ? (evt.content[0] as { name?: string }).name ?? 'tool' : 'tool';
    const input = Array.isArray(evt.content) ? JSON.stringify((evt.content[0] as { input?: unknown }).input ?? {}, null, 2) : '';
    return `\n\`\`\`tool-call ${name}\n${input}\n\`\`\`\n`;
  }
  if (evt.type === 'tool_result') {
    let text = '';
    if (Array.isArray(evt.content)) {
      const first = evt.content[0] as { content?: unknown };
      text = typeof first.content === 'string' ? first.content : JSON.stringify(first.content);
    }
    let truncated = false;
    if (text.length > TOOL_RESULT_TRUNCATE) {
      const original = text.length;
      text = text.slice(0, TOOL_RESULT_TRUNCATE) + `\n[truncated, ${original - TOOL_RESULT_TRUNCATE} chars more]`;
      truncated = true;
    }
    // Section 16 A3 — toggle via <details>/<summary>
    return `\n<details>\n<summary>tool result${truncated ? ' (truncated)' : ''}</summary>\n\n\`\`\`\n${text}\n\`\`\`\n\n</details>\n`;
  }
  return '';
}

async function main(): Promise<void> {
  const jsonlPath = process.argv[2];
  if (!jsonlPath) {
    console.error('Usage: migrate-conversations.ts <path-to-jsonl>');
    process.exit(2);
  }

  const raw = await readFile(jsonlPath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const events: JsonlEvent[] = lines.map((l) => JSON.parse(l) as JsonlEvent);

  const body = events.map(eventToMarkdown).join('\n');
  const sessionId = basename(jsonlPath, '.jsonl');
  const date = events[0]?.timestamp?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const summary = events.find((e) => e.type === 'user' && typeof e.content === 'string')?.content;
  const briefSummary = typeof summary === 'string' ? summary.slice(0, 200) : '';

  await createConversationRow({
    databaseId: CONVERSATIONS_DB_ID,
    properties: {
      Name: `${date} — ${sessionId.slice(0, 8)}`,
      Date: date,
      Project: 'yesid.dev',
      'Session ID': sessionId,
      Summary: briefSummary,
    },
    contentMarkdown: body,
  });

  console.log(`Migrated ${jsonlPath} → Notion Conversations DB`);
}

await main();
```

- [ ] **Step 2: Add `createConversationRow` to lib/notion-client.ts**

Append to `apps/web/scripts/notion-hooks/lib/notion-client.ts`:

```typescript
export interface CreateConversationArgs {
  databaseId: string;
  properties: Record<string, string>;
  contentMarkdown: string;
}

export async function createConversationRow(args: CreateConversationArgs): Promise<{ id: string }> {
  const token = await resolveToken();
  const response = await fetch(NOTION_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      method: 'notion-create-pages',
      params: {
        parent: { database_id: args.databaseId },
        pages: [{ properties: args.properties, content: args.contentMarkdown }],
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Notion MCP create-pages failed: ${response.status}`);
  }
  const data = (await response.json()) as { ids?: string[] };
  return { id: data.ids?.[0] ?? '' };
}
```

- [ ] **Step 3: Smoke-test on one .jsonl**

Pick a small recent transcript:

```bash
ls -lS ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl | tail -5
# Pick one ~50KB or smaller for the smoke test
bun apps/web/scripts/notion-hooks/migrate-conversations.ts ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/<small-uuid>.jsonl
```

- [ ] **Step 4: Verify in Notion web UI**

Open the Conversations DB. Find the new row. Verify:
- Title format `<date> — <session-id-prefix>`
- Date column populated
- Body shows turns (`### User`, `### Assistant`)
- Tool results render as collapsed toggles (`<details>` blocks → Notion native toggles)

- [ ] **Step 5: Commit**

```bash
git add apps/web/scripts/notion-hooks/migrate-conversations.ts apps/web/scripts/notion-hooks/lib/notion-client.ts
git commit -m "feat(notion-hooks): migrate-conversations script (jsonl → Conversations DB)"
```

---

### Task 24: Run one-time bulk migration over all 43 local .jsonl files

**Files:**
- Read: `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl` (43 files)

- [ ] **Step 1: Inventory + size check**

```bash
ls -1 ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl | wc -l
du -sh ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl | sort -h | tail
```

Expected: 43 files. Largest may be 10s of MB — those need block-split handling (per § 3.G3, 80-block threshold).

- [ ] **Step 2: Identify the current session's .jsonl**

```bash
# The current session's UUID is visible in ~/.claude/projects/<hash>/<uuid>.jsonl
# It's the most recently modified .jsonl. Check via:
ls -t ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl | head -1
```

EXCLUDE this UUID from bulk migration — it's still being written.

- [ ] **Step 3: Bulk migrate in batches**

```bash
CURRENT_JSONL=$(ls -t ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl | head -1)
for f in ~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/*.jsonl; do
  if [ "$f" = "$CURRENT_JSONL" ]; then continue; fi
  echo "Migrating $f"
  bun apps/web/scripts/notion-hooks/migrate-conversations.ts "$f" || echo "FAILED: $f"
done 2>&1 | tee /tmp/transcript-migration.log
```

Expected: 42 successful migrations (current excluded). Failures: investigate per-file (likely large-file block-split issues).

- [ ] **Step 4: Verify count in Notion**

Open Conversations DB. Confirm 42 rows. If short: cross-reference `/tmp/transcript-migration.log` to find failures.

- [ ] **Step 5: Spot-check 3 rows for fidelity**

Pick 3 rows (smallest, median, largest). For each:
- Open in Notion
- Confirm body has multiple turns
- Confirm at least one tool result shows as a collapsed toggle (per A3)
- Confirm summary column is non-empty

- [ ] **Step 6: Commit log**

```markdown
- [date] Bulk-migrated 42/43 .jsonl transcripts → Conversations DB (current session excluded)
```

```bash
git add docs/superpowers/plans/phase-2-evidence/05-migration-log.md /tmp/transcript-migration.log
# Move log into evidence dir before commit:
mv /tmp/transcript-migration.log docs/superpowers/plans/phase-2-evidence/06-transcript-migration.log
git add docs/superpowers/plans/phase-2-evidence/06-transcript-migration.log
git commit -m "docs(notion-arc): bulk-migrate 42 transcripts to Notion Conversations DB"
```

---

### Task 25: Build the SessionStop hook script

**Files:**
- Create: `apps/web/scripts/notion-hooks/session-stop.ts`

The hook fires when a Claude Code session ends. It finds any `.jsonl` files in `~/.claude/projects/<hash>/` that haven't been migrated yet, runs `migrate-conversations.ts` against each, then deletes the local file on success.

- [ ] **Step 1: Scaffold the hook**

Create `apps/web/scripts/notion-hooks/session-stop.ts`:

```typescript
#!/usr/bin/env bun
// SessionStop hook: push any unmigrated .jsonl files in ~/.claude/projects/<hash>/ → Notion.

import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';

const PROJECT_HASH = 'C--Users-otalo-Yesito-Projects-yesid-dev';
const PROJECT_DIR = join(homedir(), '.claude', 'projects', PROJECT_HASH);
const LOG_PATH = join(homedir(), '.claude', 'logs', 'notion-hooks.log');
const MIGRATE_SCRIPT = join('C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev', 'apps', 'web', 'scripts', 'notion-hooks', 'migrate-conversations.ts');

// Files modified within the last 60 seconds are skipped — they may still be in-flight.
const IN_FLIGHT_THRESHOLD_MS = 60_000;

async function log(msg: string): Promise<void> {
  const line = `[${new Date().toISOString()}] session-stop: ${msg}\n`;
  await Bun.write(Bun.file(LOG_PATH), line, { append: true } as never);
}

async function migrateOne(jsonlPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('bun', [MIGRATE_SCRIPT, jsonlPath], { stdio: 'inherit' });
    child.on('exit', (code) => resolve(code === 0));
  });
}

async function main(): Promise<void> {
  try {
    const entries = await readdir(PROJECT_DIR);
    const jsonlFiles = entries.filter((e) => e.endsWith('.jsonl'));

    for (const name of jsonlFiles) {
      const path = join(PROJECT_DIR, name);
      const info = await stat(path);
      const ageMs = Date.now() - info.mtimeMs;
      if (ageMs < IN_FLIGHT_THRESHOLD_MS) {
        await log(`skip ${name} (in-flight, age ${Math.round(ageMs / 1000)}s)`);
        continue;
      }
      const ok = await migrateOne(path);
      if (ok) {
        await unlink(path);
        await log(`migrated + deleted ${name}`);
      } else {
        await log(`migration FAILED for ${name} (will retry next session)`);
      }
    }
  } catch (err) {
    await log(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(0); // graceful degradation per spec § F4
  }
}

await main();
```

- [ ] **Step 2: Smoke-test (dry-run on a synthetic .jsonl)**

Create a tiny test transcript:

```bash
cat > /tmp/test.jsonl <<'EOF'
{"type":"user","content":"hello"}
{"type":"assistant","content":"hi there"}
EOF
bun apps/web/scripts/notion-hooks/migrate-conversations.ts /tmp/test.jsonl
```

Verify the row appeared in Conversations DB. Then delete the test row from Notion (cleanup).

- [ ] **Step 3: Commit**

```bash
git add apps/web/scripts/notion-hooks/session-stop.ts
git commit -m "feat(notion-hooks): SessionStop hook (push pending .jsonl → Notion)"
```

---

### Task 26: Register SessionStop hook in ~/.claude/settings.json

**Files:**
- Modify: `~/.claude/settings.json` (user-global)

- [ ] **Step 1: Add the SessionStop entry**

Append to the same `hooks` field added in Task 22:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "match": "C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev",
        "command": "bun C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev\\apps\\web\\scripts\\notion-hooks\\session-start.ts"
      }
    ],
    "SessionStop": [
      {
        "match": "C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev",
        "command": "bun C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev\\apps\\web\\scripts\\notion-hooks\\session-stop.ts"
      }
    ]
  }
}
```

- [ ] **Step 2: E2E verification**

1. Start a fresh Claude Code session in yesid.dev.
2. Issue 2-3 quick prompts (build a `.jsonl` with content).
3. End the session.
4. Wait 90 seconds (in-flight threshold).
5. In a new session: `cat ~/.claude/logs/notion-hooks.log | tail -5`.
6. Confirm a `migrated + deleted <uuid>.jsonl` line.
7. Open Notion Conversations DB; confirm a new row.

- [ ] **Step 3: Commit milestone**

```bash
git commit --allow-empty -m "chore(notion-arc): SessionStop hook registered + E2E verified"
```

---

### Task 27: Migrate historical .jsonl from cloud (if archive exists)

**Files:**
- Read: `~/Yesito/cloud/claude-config/user/<date>-yesid.dev-conversation-archive/*.jsonl` (path may not exist)

- [ ] **Step 1: Check whether the cloud archive exists**

```bash
ls -d ~/Yesito/cloud/claude-config/user/*-yesid.dev-conversation-archive 2>/dev/null
```

If no matches: skip this task entirely. Document in migration log: "No cloud transcript archive present — task no-op."

If matches exist: continue.

- [ ] **Step 2: Bulk-migrate**

For each archive directory found:

```bash
for f in ~/Yesito/cloud/claude-config/user/<archive-dir>/*.jsonl; do
  bun apps/web/scripts/notion-hooks/migrate-conversations.ts "$f" || echo "FAILED: $f"
done 2>&1 | tee -a docs/superpowers/plans/phase-2-evidence/06-transcript-migration.log
```

- [ ] **Step 3: Verify + log**

```bash
git commit -m "docs(notion-arc): migrate historical .jsonl archive (if present) to Notion"
```

---

## Section 2.8 — Slim repo root (spec § 10.7)

### Task 28: Update AGENTS.md to thin pointer

**Files:**
- Modify: `AGENTS.md` (currently ~80 lines of workflow-discipline content + role bindings)

After Phase 2, AGENTS.md keeps:
- The 4-DB Notion frontmatter (added in Task 4 — required by plugin)
- A short pointer paragraph: "All workflow content is canonical in Notion; the plugin reads frontmatter above and operates on those UUIDs. See `Projects/mgkdante/workflow/` in Notion for plugin docs; see `Projects/yesid.dev/Public-safe/Project/` for project guidance."
- The Claude Code role bindings table (still useful for tool-routing)

Everything else (workflow-discipline tables, project-specific rules) was migrated in Section 2.3.

- [ ] **Step 1: Read current AGENTS.md**

```
Read AGENTS.md
```

- [ ] **Step 2: Pull the canonical "Output destinations (Notion-canonical)" section from the plugin scaffold**

The plugin's scaffold `AGENTS.md` (post-`v0.4.0+1` commit) has a section titled `Output destinations (Notion-canonical)`. yesid.dev's slim AGENTS.md MUST include this section verbatim so the convention auto-loads at session start.

```bash
# Read the canonical section from the plugin source
cd C:/Users/otalo/Yesito/Projects/workflow
git fetch origin main
git show origin/main:plugins/workflow/skills/workflow-add/scaffold/AGENTS.md | grep -A 80 "## Output destinations" | head -100
```

If `Projects/mgkdante/workflow/` Notion subtree has this content too (it should, per Section 16 A5): cross-check via `mcp__notion__fetch` of the workflow plugin's WORKFLOW or scaffold-equivalent page.

Capture the section text verbatim (including any fenced tables). Save to a scratch file `docs/superpowers/plans/phase-2-evidence/11-output-destinations-section.md` for traceability.

- [ ] **Step 3: Author the slim version**

Rewrite `AGENTS.md` to keep only:

```markdown
---
notion:
  root_page_id: "34f3e863-0690-81e8-a41a-d00abc1b341a"
  workspace_url: "https://www.notion.so/"
  databases:
    specs: "e23c55c2-42b1-45c1-b48d-be845bb4166c"
    slices: "a4128775-19be-4cbf-b20f-f0a9ff49ba71"
    conversations: "fc5ef611-dbcf-425f-8136-99b4b6016e19"
    sessions: "abe34ce1-4b2b-4f57-ad81-4e05ae9ec6f9"
---

# AGENTS.md — yesid.dev

> Notion-canonical project. Workflow content lives in Notion at `Projects/yesid.dev/`. Plugin canonical docs at `Projects/mgkdante/workflow/`. Role bindings below are tool-routing only.

## Tool role bindings

[copy the role-bindings table from CLAUDE.md or the prior AGENTS.md]

## Where things live

- Workflow discipline → Notion `Projects/mgkdante/workflow/WORKFLOW`
- Project bindings (this project's specifics) → Notion `Projects/yesid.dev/Public-safe/Project/BINDINGS`
- Brand → Notion `Projects/yesid.dev/Public-safe/Brand`
- Slices, Specs, Sessions, Conversations → databases (UUIDs in frontmatter)
- Memory → Notion `Projects/yesid.dev/Private/Memory`; auto-pulled to local at session start

## Output destinations (Notion-canonical)

[Paste the section captured in Step 2 verbatim. The canonical text comes
from the plugin's scaffold AGENTS.md — do not paraphrase. The section
typically tells the AI tool to route writing-spec/writing-plans/
brainstorming output to Notion (Specs DB row body, Slices child Plan
page, Sessions DB row body) instead of docs/superpowers/<kind>/.]
```

- [ ] **Step 4: Verify Claude Code still loads AGENTS.md correctly**

Open a fresh session in yesid.dev. Issue a casual prompt; check the system context contains the slim AGENTS.md content (not the prior verbose version). Confirm the new "Output destinations (Notion-canonical)" section is auto-loaded — sanity-check by asking Claude where a freshly-invoked `writing-plans` would land its output (expected answer: Notion, not `docs/superpowers/plans/`).

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md docs/superpowers/plans/phase-2-evidence/11-output-destinations-section.md
git commit -m "refactor(notion-arc): slim AGENTS.md to thin pointer + adopt v0.4.0+1 output-destinations rule"
```

---

### Task 29: Update CLAUDE.md to thin pointer

**Files:**
- Modify: `CLAUDE.md` (already a relatively thin pointer — read first to decide depth of trim)

- [ ] **Step 1: Read current**

```
Read CLAUDE.md
```

- [ ] **Step 2: Decide trim depth**

If CLAUDE.md is already mostly a pointer (it is, per current state ~30 lines): keep mostly as-is, just verify the AGENTS.md reference still works.

If it duplicates AGENTS.md content: collapse the duplication.

- [ ] **Step 3: Apply minimal edits**

Add a one-line note near the top: "This project is Notion-canonical — see AGENTS.md frontmatter for Notion IDs; see Notion `Projects/yesid.dev/` for living docs."

- [ ] **Step 4: Commit if changed**

```bash
git add CLAUDE.md
git commit -m "refactor(notion-arc): note Notion-canonical state in CLAUDE.md"
```

---

## Section 2.9 — Verify zero data loss (spec § 10.8)

### Task 30: Diff cloud archive against Notion (file-level)

**Files:**
- Create: `docs/superpowers/plans/phase-2-evidence/07-data-loss-audit.md`

Walk every file in `~/Yesito/cloud/yesid.dev/`, confirm each has a Notion counterpart (or is on the explicit-delete list).

- [ ] **Step 1: Build the cloud-side inventory**

```bash
find ~/Yesito/cloud/yesid.dev -type f | sort > /tmp/cloud-inventory.txt
wc -l /tmp/cloud-inventory.txt
```

- [ ] **Step 2: For each cloud file, classify as Migrated / Deleted-stale / Stays-cloud-only**

Cross-reference each cloud path against:
- The migration log (`05-migration-log.md`)
- The audit (`03-content-audit.md`) — `learn/` is on the delete list

Author `07-data-loss-audit.md`:

```markdown
# Data Loss Audit (cloud → Notion / repo)

| Cloud path | Status | Notion target / repo path / "deleted" |
|---|---|---|
| docs/ARCHIVE.md | Migrated | Notion Private/Archive/ARCHIVE (cloud divergent) — Task 18 |
| docs/COMPLETED-SLICES.md | Migrated | Notion Private/Archive/COMPLETED-SLICES (cloud) — Task 18 |
| docs/INDEX.md | Migrated | Notion Private/Archive/INDEX (cloud) — Task 18 |
| docs/archive/<…> | Migrated | Notion Private/Archive/<…> — Task 18 |
| docs/learn/<…> | Deleted-stale | Task 19 |
| docs/project/STACK.md | Migrated | Notion Public-safe/Project/STACK (merged via A6) — Task 13 |
| brand/BRAND.md | Migrated | Notion Public-safe/Brand/BRAND — Task 12 |
| brand/CLAUDE-DESIGN.md | Migrated | Notion Private/Archive/CLAUDE-DESIGN (cloud brand) — Task 18 |
| ... | | |
```

Every cloud file must have a row. Missing rows = unmigrated content; do not proceed past Task 31 until resolved.

- [ ] **Step 3: Commit the audit**

```bash
git add docs/superpowers/plans/phase-2-evidence/07-data-loss-audit.md
git commit -m "docs(notion-arc): data-loss audit before cloud delete (Task 30)"
```

---

### Task 31: Spot-check 5 random files (cloud copy vs Notion render)

**Files:** none (manual verification)

- [ ] **Step 1: Pick 5 random cloud files**

Cover variety: 1 from `docs/project/`, 1 from `brand/foundations/`, 1 from `docs/slices/<random>/devlog.md`, 1 from `docs/archive/`, 1 from `brand/decisions/`.

- [ ] **Step 2: For each, compare**

```bash
cat ~/Yesito/cloud/yesid.dev/<path> | head -50
# Open the Notion equivalent; eyeball the body content for a 50-line spot-check
```

Confirm:
- Headings match
- Code blocks intact
- No obvious truncation
- Tables (if any) survived round-trip

- [ ] **Step 3: Document**

Append to `07-data-loss-audit.md`:

```markdown

## Spot-check (5 files)

- ✅ docs/project/STACK.md — Notion Public-safe/Project/STACK — content matches
- ✅ brand/foundations/color.md — Notion Public-safe/Brand/Foundations/color — content matches
- ✅ docs/slices/slice-18/devlog.md — Notion Slices DB row "Slice 18" — content matches
- ✅ docs/archive/<file> — Notion Private/Archive/<…> — content matches
- ✅ brand/decisions/2026-04-why-orange.md — Notion Public-safe/Brand/Decisions/2026-04-why-orange — content matches
```

If any spot-check fails: re-run the corresponding migration task before proceeding.

- [ ] **Step 4: Commit**

```bash
git commit -am "docs(notion-arc): spot-check 5 files for cloud→Notion content fidelity"
```

---

## Section 2.10 — Gitignore + working-tree removal (spec § 10.9)

### Task 32: Update .gitignore with migrated paths

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read current .gitignore**

```
Read .gitignore
```

- [ ] **Step 2: Append migration-specific ignores**

Add at the end:

```
# Migrated to Notion (Phase 2 — Notion is the single source of truth)
/docs/project/
/docs/roadmap/
/docs/ops/
/docs/README.md
/docs/superpowers/specs/
/docs/superpowers/research/
/docs/superpowers/plans/
/docs/slices/
/docs/sessions/
/docs/ARCHIVE.md
/docs/_TEMPLATES/
/brand/BRAND.md
/brand/components.md
/brand/README.md
/brand/foundations/*.md
/brand/decisions/*.md
/brand/examples/README.md

# Brand assets + code stay tracked (NOT ignored):
#   /brand/logos/, /brand/figma-exports/, /brand/examples/*.svelte.txt,
#   /brand/examples/*.png, /brand/scripts/

# Phase 2 evidence pack — keep tracked for PR reviewers, but ignore the
# evidence subfolder going forward once the PR is merged
# (no entry — keep tracked through merge)
```

- [ ] **Step 3: Verify gitignore patterns**

```bash
git check-ignore -v docs/project/STACK.md docs/slices/slice-18/devlog.md brand/BRAND.md
```

Expected: each path resolves to a `.gitignore` line. If any unmigrated path also matches: refine the patterns.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore(notion-arc): gitignore Notion-migrated paths"
```

---

### Task 33: Remove migrated content from working tree

**Files:**
- Delete (working tree only — content lives in Notion now): every path matched by Task 32's new ignores

- [ ] **Step 1: Identify tracked migrated files**

```bash
git ls-files docs/project docs/roadmap docs/ops docs/superpowers docs/slices docs/sessions docs/_TEMPLATES brand/foundations brand/decisions | head -50
git ls-files | grep -E '^(docs/(README|ARCHIVE)|brand/(BRAND|components|README|examples/README))\.md$'
```

- [ ] **Step 2: Remove from index + working tree**

```bash
git rm -r docs/project docs/roadmap docs/ops docs/superpowers/specs docs/superpowers/research docs/slices docs/sessions docs/_TEMPLATES
git rm docs/README.md docs/ARCHIVE.md
git rm -r brand/foundations brand/decisions
git rm brand/BRAND.md brand/components.md brand/README.md brand/examples/README.md
```

(Keep `docs/superpowers/plans/` for now so the PR reviewer can see this plan + the Phase 1 plan in the diff. Remove in a follow-up commit after merge if desired.)

- [ ] **Step 3: Verify**

```bash
git status
ls docs/  # expect: ai-memory _TEMPLATES (gone) reference superpowers (with plans/ + evidence/)
ls brand/  # expect: examples (svelte.txt + png only) figma-exports logos scripts
```

- [ ] **Step 4: Run typecheck + tests**

```bash
bun run check
bun run test
```

Expected: both pass. Any failure means a code path imports something from a removed file — patch up.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(notion-arc): remove Notion-migrated content from working tree"
```

---

## Section 2.11 — Cloud delete (spec § 10.10)

### Task 34: Delete ~/Yesito/cloud/yesid.dev/ subtree

**Files:**
- Delete: `~/Yesito/cloud/yesid.dev/`

- [ ] **Step 1: Final inventory snapshot before delete**

```bash
find ~/Yesito/cloud/yesid.dev -type f | wc -l
du -sh ~/Yesito/cloud/yesid.dev/
```

Document the count + size in `07-data-loss-audit.md`.

- [ ] **Step 2: Operator confirmation gate**

**STOP.** Show the operator: "About to delete `~/Yesito/cloud/yesid.dev/` (N files, M MB). All content is verified migrated per Task 30 + 31. Proceed? [y/N]". Only on explicit `y`.

- [ ] **Step 3: Delete**

```bash
rm -rf ~/Yesito/cloud/yesid.dev
ls ~/Yesito/cloud/  # confirm yesid.dev is gone
```

- [ ] **Step 4: Log**

```markdown
- [date] Deleted ~/Yesito/cloud/yesid.dev/ (N files, M MB) — all content verified in Notion
```

```bash
git commit -am "docs(notion-arc): log deletion of ~/Yesito/cloud/yesid.dev/"
```

---

### Task 35: Delete cloud transcript archive subtree (if exists)

**Files:**
- Delete: `~/Yesito/cloud/claude-config/user/<date>-yesid.dev-conversation-archive/`

- [ ] **Step 1: Check existence**

```bash
ls -d ~/Yesito/cloud/claude-config/user/*-yesid.dev-conversation-archive 2>/dev/null
```

If nothing: skip task. Log "no-op" in migration log.

- [ ] **Step 2: Operator confirmation gate**

If found: confirm with operator before delete.

- [ ] **Step 3: Delete + log + commit**

```bash
rm -rf ~/Yesito/cloud/claude-config/user/*-yesid.dev-conversation-archive
git commit -am "docs(notion-arc): log deletion of cloud transcript archive"
```

---

### Task 36: Optional — unset YESITO_CLOUD_ROOT env var

**Files:**
- Possibly: shell profile (`.bashrc`, `.zshrc`, Windows env vars)

- [ ] **Step 1: Check if any other project still uses it**

```bash
grep -r "YESITO_CLOUD_ROOT" ~/Yesito/Projects/ --include="*.ts" --include="*.json" 2>/dev/null | head
```

If other projects (cafe-arona, freelance, workflow) still reference it: leave the env var set.

If only yesid.dev referenced it (now fully retired): unset.

- [ ] **Step 2: Unset (if safe)**

Edit shell profile to remove the export. Re-source.

- [ ] **Step 3: Log**

This is a config change, not a code change. Add a one-liner to migration log; no commit.

---

## Section 2.12 — Retire mirror scripts (spec § 10.11)

### Task 37: Delete mirror scripts + migrate-conversations was the replacement

**Files:**
- Delete: `apps/web/scripts/mirror-brand.ts`
- Delete: `apps/web/scripts/mirror-docs.ts`
- Delete: `apps/web/scripts/archive-conversations.ts`

The conversion path is now `apps/web/scripts/notion-hooks/*.ts` (Tasks 21, 23, 25). Old scripts have no consumers post-Phase-2.

- [ ] **Step 1: Confirm no callers**

```bash
grep -rn "mirror-brand\|mirror-docs\|archive-conversations" apps/ packages/ docs/ --include="*.ts" --include="*.json" --include="*.md" 2>/dev/null | head
```

Expected: only references are in `apps/web/package.json` scripts entries (deleted in Task 38) and migration-log/audit notes (informational).

- [ ] **Step 2: Delete the scripts**

```bash
git rm apps/web/scripts/mirror-brand.ts apps/web/scripts/mirror-docs.ts apps/web/scripts/archive-conversations.ts
```

- [ ] **Step 3: Verify build still passes**

```bash
bun run check
bun run test
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(notion-arc): retire mirror-brand, mirror-docs, archive-conversations scripts"
```

---

### Task 38: Remove scripts entries from apps/web/package.json

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Identify entries to remove**

Per `git grep` from Task 37: `docs:mirror`, `brand:mirror`, `conversations:archive`. Verify:

```bash
grep -E '"(brand:mirror|docs:mirror|conversations:archive)"' apps/web/package.json
```

- [ ] **Step 2: Edit package.json**

Remove the three entries. Use `Edit` with `old_string` matching each line individually.

- [ ] **Step 3: Verify**

```bash
grep -E '"(brand:mirror|docs:mirror|conversations:archive)"' apps/web/package.json
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json
git commit -m "chore(notion-arc): remove mirror script entries from apps/web/package.json"
```

---

### Task 39: Audit brand/scripts/* for cloud-mirror residue

**Files:**
- Read: `brand/scripts/*.ts`

The spec (§ 10.11 step 29) says: "Remove the `brand/scripts/*` entries from `brand/scripts/` if they were cloud-mirror specific (verify per file)."

- [ ] **Step 1: Inventory + read**

```bash
ls brand/scripts/
```

For each `.ts` file, `Read` it and check for: cloud-mirror logic, `YESITO_CLOUD_ROOT` references, mirror-style sync calls.

- [ ] **Step 2: Classify each**

In `03-content-audit.md`, add a sub-section "brand/scripts/* disposition" with one row per file: `keep` / `delete (cloud-mirror)`. Most likely outcome: all `keep` (brand/scripts are token/asset generators, not mirror logic). If so: task is a no-op verification.

- [ ] **Step 3: Delete any cloud-mirror residue (if found)**

```bash
git rm brand/scripts/<cloud-only-script>.ts  # only if classified as delete
git commit -m "refactor(notion-arc): retire cloud-mirror script <name> from brand/scripts/"
```

If no deletions: append a "No cloud-mirror residue found" note to the audit and commit:

```bash
git commit -am "docs(notion-arc): audit brand/scripts/ — no cloud-mirror residue"
```

---

## Section 2.13 — Document the new flow (spec § 10.12)

### Task 40: Create Public-safe/Project/NOTION-WORKFLOW page in Notion

**Files:**
- Notion target: child of `Public-safe/Project/` (parent UUID from manifest)

- [ ] **Step 1: Author the page content (markdown)**

Body content covers:

```markdown
# NOTION-WORKFLOW

> Project bootstrapping + day-to-day mechanics for the Notion-canonical workflow on yesid.dev. Plugin: mgkdante/workflow v0.4.0+.

## Architecture (one paragraph)

Single source of truth = Notion. The repo holds source code, configs, and an irreducible set of meta-files (`AGENTS.md` with Notion frontmatter, `CLAUDE.md`, `.mcp.json`, `.claude/settings.json`, `.githooks/`). All living docs (Brand, Project guidance, Roadmap, Ops, Slices, Specs, Memory, Conversations, Sessions, Archive) live under `Projects/yesid.dev/` in Notion. Plugin commands operate on UUIDs from frontmatter; structural shape is irrelevant.

## How memory works

`Projects/yesid.dev/Private/Memory/*` → SessionStart hook → `~/.claude/projects/<hash>/memory/*.md` on each session start. Claude's auto-load picks up local files. Mid-session writes go directly to Notion via MCP; local files refresh at next start.

## How conversations work

Each Claude Code session ends → SessionStop hook → `migrate-conversations.ts` converts `.jsonl` → markdown (with `<details>/<summary>` toggles per A3) → creates Conversations DB row → deletes local `.jsonl` on success.

## Bootstrap a new device

1. `git clone https://github.com/mgkdante/yesid.dev`
2. `bun install`
3. In Claude Code: `/mcp` to OAuth into Notion MCP
4. First session start fires `SessionStart` hook → memory pulls automatically
5. Done — open a slice with `/workflow-slice-open`

## Subtree map

- [Public-safe/Brand](https://www.notion.so/<…>) — brand voice, foundations, decisions
- [Public-safe/Project](https://www.notion.so/<…>) — STACK, BINDINGS, CONSTITUTION, etc.
- [Public-safe/Roadmap](https://www.notion.so/<…>) — PLAN, FUTURE_PHASES
- [Public-safe/Ops](https://www.notion.so/<…>) — runbooks, rollback
- [Private/Specs DB](https://www.notion.so/<…>) — design specs (spec/research/plan rows)
- [Private/Slices DB](https://www.notion.so/<…>) — every slice that has shipped
- [Private/Sessions DB](https://www.notion.so/<…>) — work sessions
- [Private/Conversations DB](https://www.notion.so/<…>) — full transcript log
- [Private/Memory](https://www.notion.so/<…>) — auto-pulled into local memory
- [Private/Archive](https://www.notion.so/<…>) — frozen historical content

## Hooks

- SessionStart → `apps/web/scripts/notion-hooks/session-start.ts`
- SessionStop → `apps/web/scripts/notion-hooks/session-stop.ts`
- Logs → `~/.claude/logs/notion-hooks.log`

## Output destinations (auto-loaded from AGENTS.md)

The plugin v0.4.0+1 contract auto-routes planning output to Notion. When you (or any AI tool reading AGENTS.md) run `superpowers:writing-spec`, `writing-plans`, `superpowers:brainstorming`, or `writing-handoff`, the output lands in Notion — never in `docs/superpowers/<kind>/`. Lookup table is in AGENTS.md § "Output destinations (Notion-canonical)".

## Trade-offs accepted (per spec § 11)

- No grep across living docs in-repo (Notion search replaces it)
- No atomic-PR for migrated docs (PR descriptions reference Notion pages)
- Stale-by-one-session memory mirror (acceptable at solo scale)
- ~5s startup latency for memory pull
```

- [ ] **Step 2: Create the page in Notion**

```
mcp__notion__create-pages parent={ page_id: "<Public-safe/Project UUID>" } pages=[{
  properties: { title: "NOTION-WORKFLOW" },
  content: "<full markdown body above with real UUIDs substituted>"
}]
```

- [ ] **Step 3: Verify in web UI**

Open the page; confirm rendering, links work.

- [ ] **Step 4: Commit log**

```bash
git commit -am "docs(notion-arc): create Public-safe/Project/NOTION-WORKFLOW page"
```

---

## Section 2.14 — Generate propagation prompt (spec § 10.13 + § 13)

### Task 41: Generate the workflow-plugin propagation prompt

**Files:**
- Create: `docs/superpowers/plans/phase-2-evidence/08-propagation-prompt.md`
- Notion target: also push to `Projects/mgkdante/workflow/` page tree (subpage `Propagation-prompt` or similar) — operator decides exact location

The propagation prompt is the deliverable text artifact for bootstrapping the next project (cafe-arona, freelance/transit, future client work) onto the Notion-aware plugin. Per spec § 13, it captures the v0.4.0 bootstrapping flow.

- [ ] **Step 1: Author the prompt**

Create `docs/superpowers/plans/phase-2-evidence/08-propagation-prompt.md`:

```markdown
# Workflow plugin propagation prompt — v0.4.0

> Use this to bootstrap a NEW project onto the Notion-aware workflow plugin (`mgkdante/workflow` v0.4.0+). Tested on yesid.dev's Phase 2 retrofit (2026-04-27).

## Pre-flight

You will need:
- A Notion workspace named `Projects` (or whatever you've named it). Create one if not.
- The Notion MCP installed (https://github.com/makenotion/notion-mcp-server) and authenticated via `/mcp` in Claude Code or Codex.
- A repo where the new project will live, with `.mcp.json` enabling the Notion MCP entry.

## Bootstrap flow

1. **Run `/workflow-add` in the new project's repo.**

   The command will (per plugin v0.4.0):
   - Provision a flat Notion subtree at `Projects/<your-project>/` with children: `Brand` (with Foundations, Decisions, Examples), `Project` (with seven seeded skeletons: README, STACK, BINDINGS, ARCHITECTURE, TESTS, CONSTITUTION, VOCAB), `Roadmap`, `Ops`, `Memory`, `Archive`
   - Create four databases under the project root: `Specs`, `Slices`, `Conversations`, `Sessions`
   - Write minimal `AGENTS.md` (with Notion frontmatter pre-filled), `CLAUDE.md` (thin pointer), `.mcp.json` (Notion + any other MCPs), `.claude/settings.json` (workflow plugin reference) into the repo

   The seven `Project/*` skeletons are seeded from the plugin's canonical `Projects/mgkdante/workflow/Templates/Project/` — edit any of them to taste post-bootstrap.

2. **Verify wiring.**

   Run `/workflow-status`. Expected output: plugin v0.4.0 detected, all 4 DB UUIDs resolved, no active slice yet.

3. **Install hooks (if you want auto-pulled memory + auto-pushed conversation transcripts).**

   Copy `apps/web/scripts/notion-hooks/` from yesid.dev (or use a future plugin command if shipped). Adjust `PROJECT_HASH` constants for the new project. Register `SessionStart` + `SessionStop` entries in `~/.claude/settings.json` matching the new project's path.

4. **Start working.**

   `/workflow-slice-open <name>` creates a Slices DB row + linked Plan/Spec/Handoff pages in Notion. `/workflow-handoff` and `/workflow-close-slice` flow through Notion automatically.

   Planning commands (`writing-spec`, `writing-plans`, `superpowers:brainstorming`, `writing-handoff`) **route output to Notion** automatically per the v0.4.0+1 output-destinations contract — the rule auto-loads from AGENTS.md at session start, so no manual configuration needed.

## Notes

- The Public-safe/Private split is no longer the plugin DEFAULT (per Section 16 A4 of the Notion arc spec). Existing legacy projects (yesid.dev) keep their Public-safe/Private structure; new projects get the flat shape.
- The Specs DB has a minimum schema (`Name (title)`). Add `Status`, `Owner`, `Date`, etc. as your project develops.
- Memory is ALWAYS auto-pulled local at session start. Hook script is the integration point — don't try to embed Notion fetches into Claude's auto-load directly.
- The output-destinations rule (v0.4.0+1) lives in the scaffold AGENTS.md the plugin writes during `/workflow-add`. Don't strip it from your AGENTS.md — it's load-bearing.
```

- [ ] **Step 2: Mirror to plugin's Notion subtree**

```
mcp__notion__create-pages parent={ page_id: "<Projects/mgkdante/workflow page UUID — look up>" } pages=[{
  properties: { title: "Propagation prompt v0.4.0" },
  content: "<the markdown body above>"
}]
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/phase-2-evidence/08-propagation-prompt.md
git commit -m "docs(notion-arc): workflow-plugin propagation prompt for v0.4.0+"
```

---

## Section 2.15 — Ship

### Task 42: Cross-tool D12 review (Codex review path)

**Files:** none (review artifact)

Per spec § 11 + governance D12: Phase 2's PR runs adversarial review by the other tool (Codex) before opening for merge. (Phase 1's PR skipped this per operator; Phase 2 does NOT skip.)

- [ ] **Step 1: Save the branch state**

Ensure all commits are pushed:

```bash
git push -u origin feat/notion-migration
```

- [ ] **Step 2: Generate a Codex-readable review brief**

Create `docs/superpowers/plans/phase-2-evidence/09-codex-review-brief.md`:

```markdown
# Phase 2 — Codex review brief

## What changed

Phase 2 of the Notion migration arc. Migrated all eligible repo content (docs/*, brand/*) to Notion. Installed SessionStart + SessionStop hooks for memory + transcript sync. Retired cloud-mirror scripts. Slimmed AGENTS.md to thin pointer with 4-DB Notion frontmatter.

## What to review

1. **`apps/web/scripts/notion-hooks/lib/notion-client.ts`** — HTTP wrapper for Notion MCP. Verify token resolution + error handling are sound. Concern: token storage path may be platform-specific.
2. **`apps/web/scripts/notion-hooks/session-start.ts`** — local-mirror writer. Confirm orphan-deletion logic matches spec § F1.
3. **`apps/web/scripts/notion-hooks/migrate-conversations.ts`** — jsonl → markdown converter. Verify `<details>/<summary>` toggle output (Section 16 A3). Verify 5000-char truncation + 80-block split.
4. **`apps/web/scripts/notion-hooks/session-stop.ts`** — push hook. Verify in-flight threshold (60s).
5. **`AGENTS.md`** — slim version. Verify it preserves enough tool-routing for Claude Code to function.
6. **`.gitignore`** — verify only Notion-migrated paths are ignored, not code/assets.
7. **Verification gate**: do `bun run check` + `bun run test` pass on `feat/notion-migration`?

## Non-review items (already verified)

- Notion-side migration completeness (Task 30 audit + Task 31 spot-check)
- Cloud archive deletion (Task 34 confirmation gate)
- Hook E2E (Task 22 + Task 26 manual smoke tests)

## Spec references

- Original design: `docs/superpowers/specs/2026-04-27-notion-arc-design.md` § 1–15
- Section 16 amendments A1–A6
- Plan: `docs/superpowers/plans/2026-04-27-phase-2-yesid-dev-retrofit.md` (this plan)
```

- [ ] **Step 2: Run Codex against the brief**

In a Codex session (operator-facilitated, since Codex runs separately from Claude Code):

```
Read docs/superpowers/plans/phase-2-evidence/09-codex-review-brief.md
# then ask Codex to perform the review
```

Capture Codex's output. Save to `docs/superpowers/plans/phase-2-evidence/10-codex-review-output.md`.

- [ ] **Step 3: Address review findings**

For each `CRITICAL` / `HIGH` finding from Codex: open issue or fix inline before PR opens. `MEDIUM` / `LOW` may go in PR description as known follow-ups.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/phase-2-evidence/09-codex-review-brief.md docs/superpowers/plans/phase-2-evidence/10-codex-review-output.md
git commit -m "docs(notion-arc): cross-tool D12 review (Codex) for Phase 2 PR"
```

---

### Task 43: Open the Phase 2 PR

**Files:** none (`gh pr create`)

- [ ] **Step 1: Final pre-PR check**

```bash
git status              # clean
git log main..HEAD --oneline  # 30+ commits expected
bun run check
bun run test
```

- [ ] **Step 2: Author PR body**

```bash
gh pr create --title "Phase 2 — yesid.dev Notion retrofit" --body "$(cat <<'EOF'
## Summary

Phase 2 of the Notion migration arc — yesid.dev fully retrofitted onto the Notion-aware workflow plugin (`mgkdante/workflow` v0.4.0). All eligible repo content moved to Notion; cloud-mirror retired; hooks installed for memory + transcripts.

## Spec + plan

- Spec: docs/superpowers/specs/2026-04-27-notion-arc-design.md (§ 1–15 + § 16.A1–A6 amendments)
- Plan: docs/superpowers/plans/2026-04-27-phase-2-yesid-dev-retrofit.md
- Phase 1 (plugin) shipped as mgkdante/workflow#17 (v0.4.0)

## What changed

- AGENTS.md → thin pointer with 4-DB Notion frontmatter
- ~30 Public-safe + ~75 Private files migrated to Notion (audit: docs/superpowers/plans/phase-2-evidence/03-content-audit.md, log: …/05-migration-log.md)
- 14 memory files → Notion Private/Memory + SessionStart hook
- 42 .jsonl transcripts → Notion Conversations DB + SessionStop hook
- mirror-brand.ts, mirror-docs.ts, archive-conversations.ts deleted
- ~/Yesito/cloud/yesid.dev/ deleted (verified zero data loss in evidence/07-data-loss-audit.md)
- New scripts: apps/web/scripts/notion-hooks/{session-start,session-stop,migrate-conversations}.ts + lib/notion-client.ts

## Test plan

- [ ] `bun run check` passes
- [ ] `bun run test` passes
- [ ] Manual: open fresh Claude Code session in yesid.dev, confirm SessionStart hook pulls memory (log entry in ~/.claude/logs/notion-hooks.log)
- [ ] Manual: end a session, confirm SessionStop hook migrates the .jsonl + deletes local
- [ ] Manual: `/workflow-status` reports v0.4.0 + 4 DB UUIDs resolved
- [ ] Manual: open a test slice with `/workflow-slice-open`, verify Slices DB row creates correctly
- [ ] Codex review (D12) addressed — see evidence/10-codex-review-output.md

## Out-of-band (manual operator follow-ups)

- Two minor Notion cleanups in mgkdante/workflow tree (see Phase 1 closing notes)
- Optional: unset `YESITO_CLOUD_ROOT` from shell profile (Task 36)
EOF
)"
```

- [ ] **Step 3: Confirm CI is green**

```bash
gh pr checks --watch
```

If failing: address each failure with a follow-up commit; do not merge.

- [ ] **Step 4: Hand back to operator for review + merge**

The plan's job ends at "PR open with green CI + Codex review attached." Operator merges manually.

---

## Self-review checklist (run before submitting plan to operator)

### Spec coverage

- ✅ § 10.1 Adopt v0.4.0 — Tasks 3, 5, 6
- ✅ § 10.2 Migrate Public-safe — Tasks 7, 8, 9, 10, 11, 12, 13
- ✅ § 10.3 Migrate Private — Tasks 14, 15, 16, 17, 18
- ✅ § 10.4 Delete cloud stale — Task 19
- ✅ § 10.5 Memory + SessionStart hook — Tasks 20, 21, 22
- ✅ § 10.6 Transcripts + SessionStop hook — Tasks 23, 24, 25, 26, 27
- ✅ § 10.7 Slim repo root — Tasks 28, 29
- ✅ § 10.8 Verify zero data loss — Tasks 30, 31
- ✅ § 10.9 Gitignore migrated paths — Tasks 32, 33
- ✅ § 10.10 Delete cloud archive — Tasks 34, 35, 36
- ✅ § 10.11 Retire mirror scripts — Tasks 37, 38, 39
- ✅ § 10.12 Document new flow — Task 40
- ✅ § 10.13 Propagation prompt — Task 41
- ✅ Cross-tool D12 review (governance) — Task 42
- ✅ PR open — Task 43

### Section 16 amendments referenced

- ✅ A1 (Specs DB) — Task 4 frontmatter, Task 14 specs migration
- ✅ A2 (Name title key) — Tasks 14, 16, 17
- ✅ A3 (`<details>/<summary>` toggles) — Task 23 converter
- ✅ A4 (flat vs. legacy keep) — Task 2 decision
- ✅ A5 (plugin owns canonical content) — Task 41 propagation prompt
- ✅ A6 (DEFAULT skeletons are plugin DEFAULT) — Task 13 merge approach

### v0.4.0+1 output-destinations convention

- ✅ Version pin includes the post-tag commit — Task 3
- ✅ Section transcribed verbatim into yesid.dev AGENTS.md — Task 28 Steps 2–3
- ✅ NOTION-WORKFLOW page documents the rule for operators — Task 40
- ✅ Propagation prompt warns future projects not to strip it — Task 41

### Placeholder scan

No `TBD` / `implement later` / `fill in details` outside Task 21 Step 2's HTTP request shape note (which is genuinely uncertain — Notion MCP HTTP API may shift; resolved at implementation time).

### Type / property consistency

- DB UUIDs are spelled identically in Tasks 4, 8, 14, 16, 17, 23
- `Public-safe/Project` UUID referenced consistently from manifest in Tasks 11, 13, 40
- Hook script paths consistent: `apps/web/scripts/notion-hooks/{session-start,session-stop,migrate-conversations}.ts` + `lib/notion-client.ts`

### Granularity

- 43 tasks total, ~3-4 sessions of work per spec § 5 budget
- Each task has 3–6 steps; bite-sized
- Each step has actual content (commands, code blocks, MCP calls)

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-27-phase-2-yesid-dev-retrofit.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. Same shape as Plan A's execution.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch with checkpoints for review.

**Which approach?**

If Subagent-Driven: REQUIRED SUB-SKILL is `superpowers:subagent-driven-development`. Fresh subagent per task + two-stage review.

If Inline: REQUIRED SUB-SKILL is `superpowers:executing-plans`. Batch with checkpoints.

---

## Notes for the executor

- **Branch:** all commits land on `feat/notion-migration`. Don't merge to main until Task 43 hands back.
- **PRODUCTION Notion data:** sandbox mode is over. No destructive Notion ops without operator confirmation. Migration tasks are non-destructive (create + update only); cloud-delete tasks have explicit gates.
- **Order matters:** Section 2.0 (Tasks 1–4) gates everything. Section 2.7 (transcripts) requires Section 2.6 (memory + hook infra) to land first. Section 2.11 (cloud delete) requires Sections 2.9 (verify) + 2.10 (gitignore + remove tracked). Don't reorder.
- **Token budget:** the migration tasks read large content blocks. Watch session token usage; subagent-driven execution helps amortize.
- **Hook scripts (Tasks 21, 23, 25):** these are real production code. Run `code-reviewer` agent against them after first draft. Run `security-reviewer` against `lib/notion-client.ts` (handles OAuth tokens).
