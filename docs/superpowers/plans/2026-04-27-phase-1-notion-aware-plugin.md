# Phase 1 — Notion-Aware Workflow Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `mgkdante/workflow` plugin Notion-aware so all command flows read/write Notion via MCP instead of local files. Phase 0 (Notion workspace + MCP wiring) is bundled as the first set of tasks because it gates Phase 1.

**Architecture:** The plugin is markdown-driven — each command is a `SKILL.md` that instructs the LLM. Phase 1 rewrites those SKILL.md files to use Notion MCP tools (`mcp__notion__*`) instead of file operations. The plugin acquires a new MCP dependency (a deliberate departure from the current "zero MCP dependencies" principle); DESIGN.md and README.md are updated to acknowledge this. The plugin reads each consuming project's Notion root via a new config field set in the scaffolded `AGENTS.md`.

**Tech Stack:** Markdown SKILL.md files, Notion MCP server (`makenotion/notion-mcp-server`), git, gh CLI. No new runtime dependencies.

**Spec:** [docs/superpowers/specs/2026-04-27-notion-arc-design.md](../specs/2026-04-27-notion-arc-design.md)

**Repos touched:**
- Phase 0: both `yesid.dev` (this repo) and `mgkdante/workflow` (`C:\Users\otalo\Yesito\Projects\workflow`)
- Phase 1: `mgkdante/workflow` only

**Branch:** `feat/notion-aware` on `mgkdante/workflow`

---

## Pre-flight context

### Plugin file layout (canonical paths in `C:\Users\otalo\Yesito\Projects\workflow`)

- `plugins/workflow/skills/<command>/SKILL.md` — instructional markdown for each command
- `plugins/workflow/skills/workflow-add/scaffold/` — files copied into adopting projects (AGENTS.md, CLAUDE.md, docs tree, _TEMPLATES, etc.)
- `plugins/workflow/README.md` — public-facing plugin docs
- `plugins/workflow/CHANGELOG.md` — version history
- `docs/DESIGN.md` — architectural decisions (D1, D12, D18, D19, …)

### Notion MCP tool names (exact, from `makenotion/notion-mcp-server`)

After OAuth, the MCP exposes tools prefixed `mcp__notion__*`. Common operations:
- `mcp__notion__search` — full-text search across workspace
- `mcp__notion__fetch` — retrieve page or database content by URL/ID
- `mcp__notion__create-pages` — create pages (with optional database parent)
- `mcp__notion__update-page` — update page content/properties
- `mcp__notion__move-pages` — move pages
- `mcp__notion__duplicate-page` — duplicate
- `mcp__notion__create-database` — create a database with schema
- `mcp__notion__update-database` — modify schema
- `mcp__notion__create-comment` / `mcp__notion__get-comments` — comments
- `mcp__notion__get-users` / `mcp__notion__get-self` — workspace user metadata

Verify exact names during Task 0.6 smoke test; update SKILL.md references if Notion ships renamed tools.

### Sandbox vs production Notion

To avoid polluting yesid.dev's production Notion data during Phase 1 development, create a sandbox sub-page `Projects/_sandbox/` (sibling to `yesid.dev` and `mgkdante/workflow`). All Phase 1 testing targets the sandbox. Production migrate happens in Phase 2.

---

## Phase 0 — Notion workspace bootstrap (gates Phase 1)

### Task 0.1: Create the Notion workspace (manual user action)

**Files:** none (web UI action in Notion)

- [ ] **Step 1: Open Notion and create a new workspace**

In `notion.so` web UI:
- Settings → New workspace
- Name: `Projects`
- Plan: Free
- Confirm "Personal" use

- [ ] **Step 2: Verify workspace exists**

Visit `notion.so` after creation. Confirm the workspace name "Projects" appears in the workspace switcher (top-left).

- [ ] **Step 3: Note workspace URL**

Copy the workspace base URL (e.g., `https://www.notion.so/<workspace-name>/`). This is referenced in MCP setup.

---

### Task 0.2: Build skeleton page tree (manual)

**Files:** none (web UI actions in Notion)

- [ ] **Step 1: Create top-level project pages**

In the `Projects` workspace, create as siblings at the workspace root:
- Page: `yesid.dev`
- Page: `mgkdante/workflow`
- Page: `_sandbox`

- [ ] **Step 2: Build yesid.dev/Public-safe skeleton**

Inside `yesid.dev`, create sub-page `Public-safe`. Inside `Public-safe`, create empty sub-pages:
- `Brand` (with empty children: `Foundations`, `Decisions`, `Examples`)
- `Project`
- `Roadmap`
- `Ops`

- [ ] **Step 3: Build yesid.dev/Private skeleton**

Inside `yesid.dev`, create sub-page `Private`. Inside `Private`, create empty sub-pages:
- `Specs` (will hold one page per spec)
- `Memory` (will hold one page per memory file)
- `Archive`

`Slices`, `Sessions`, and `Conversations` are databases — created in Tasks 0.4–0.6.

- [ ] **Step 4: Build mgkdante/workflow skeleton**

Inside `mgkdante/workflow`, create empty sub-pages:
- `WORKFLOW`
- `Tools` (with empty children: `claude-code`, `codex`)

- [ ] **Step 5: Build sandbox skeleton**

Inside `_sandbox`, create:
- `Public-safe` and `Private` (mirror of yesid.dev shape — Phase 1 tests run against this)

- [ ] **Step 6: Verify**

In the Notion sidebar, expand each top-level page. Confirm the tree matches the structure in spec § 4.

---

### Task 0.3: Create Slices database

**Files:** none (web UI in Notion)

- [ ] **Step 1: Inside `yesid.dev/Private/`, click "+" → "Database — Inline" → name it `Slices`**

- [ ] **Step 2: Configure properties to match spec § 5**

| Property | Type | Values / target |
|---|---|---|
| Name | Title (auto) | — |
| Slice-N | Number | — |
| Status | Status | Options: `planned`, `in-progress`, `closed` |
| Open date | Date | — |
| Close date | Date | — |
| PR link | URL | — |
| Repo | Select | Options: `yesid.dev`, `mgkdante/workflow` |
| Spec | Relation | Target: `yesid.dev/Private/Specs/` (set after Specs page exists) |

- [ ] **Step 3: Repeat the database creation in `_sandbox/Private/`**

Phase 1 testing uses this sandbox copy.

- [ ] **Step 4: Verify**

Add a test row to the sandbox `Slices` DB with all properties filled. Open it. Confirm all properties save and persist on reload.

---

### Task 0.4: Create Conversations database

**Files:** none (web UI in Notion)

- [ ] **Step 1: Inside `yesid.dev/Private/`, create database `Conversations`**

| Property | Type | Notes |
|---|---|---|
| Title | Title | Auto-format: `<date> — <slice-tag-or-summary>` |
| Date | Date | |
| Project | Select | Options: `yesid.dev` (add others as projects join) |
| Slice tag | Relation | Target: `Slices` (nullable) |
| Session ID | Text | Source `.jsonl` UUID |
| Summary | Text | Brief 1-3 sentence summary |

- [ ] **Step 2: Create the same database in `_sandbox/Private/`**

- [ ] **Step 3: Verify with a test row including a 200-word body — body persists, properties query correctly**

---

### Task 0.5: Create Sessions database

**Files:** none (web UI in Notion)

- [ ] **Step 1: Inside `yesid.dev/Private/`, create database `Sessions`**

| Property | Type | Notes |
|---|---|---|
| Title | Title | |
| Date | Date | |
| Project | Select | |
| Slices touched | Relation (multi) | Target: `Slices` |
| Brief summary | Text | 1-2 sentences |

- [ ] **Step 2: Create the same database in `_sandbox/Private/`**

- [ ] **Step 3: Verify with a test row**

---

### Task 0.6: Install Notion MCP in both repos

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\yesid.dev\.mcp.json`
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\.mcp.json` (create if missing)

- [ ] **Step 1: Read current yesid.dev/.mcp.json**

Run: Read tool on `C:\Users\otalo\Yesito\Projects\yesid.dev\.mcp.json`
Expected current content includes only `yesid-cms-prod` server.

- [ ] **Step 2: Add Notion MCP entry to yesid.dev/.mcp.json**

Per the official Notion MCP setup guide, the recommended entry is HTTP-transport using Notion's hosted server:

```json
{
  "$schema": "https://json.schemastore.org/mcp.json",
  "mcpServers": {
    "yesid-cms-prod": {
      "type": "http",
      "url": "https://cms.yesid.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${YESID_CMS_MCP_TOKEN}"
      }
    },
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

Save the file.

- [ ] **Step 3: Check if workflow/.mcp.json exists**

Run: `ls "C:\Users\otalo\Yesito\Projects\workflow\.mcp.json" 2>&1`

If exists, Read it. If not, plan to create.

- [ ] **Step 4: Create or update workflow/.mcp.json with Notion entry**

If creating new:

```json
{
  "$schema": "https://json.schemastore.org/mcp.json",
  "mcpServers": {
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

If updating, add the `notion` entry alongside any existing servers.

- [ ] **Step 5: Restart Claude Code in both repos**

The MCP server is picked up on session start. In each repo, exit and relaunch Claude Code.

- [ ] **Step 6: Run `/mcp` in yesid.dev to OAuth into Notion**

Type `/mcp` at the Claude Code prompt. Select `notion`. Follow OAuth flow in browser. Grant access to the `Projects` workspace.

- [ ] **Step 7: Repeat OAuth in workflow repo**

Same flow in the workflow repo's session.

- [ ] **Step 8: Commit yesid.dev/.mcp.json**

```bash
git add .mcp.json
git commit -m "chore: wire Notion MCP into yesid.dev for Phase 0 verification

Per docs/superpowers/specs/2026-04-27-notion-arc-design.md, this is the
first step of the Notion migration arc. Phase 0 verifies MCP works
end-to-end before any content migration."
```

- [ ] **Step 9: Commit workflow/.mcp.json on a new branch**

```bash
# In C:\Users\otalo\Yesito\Projects\workflow
git checkout -b feat/notion-aware
git add .mcp.json
git commit -m "chore: wire Notion MCP for Phase 1 development"
```

---

### Task 0.7: Smoke test — read

**Files:** none (Notion MCP calls)

- [ ] **Step 1: From the yesid.dev session, call `mcp__notion__search`**

Search for "_sandbox" in the connected Notion workspace.

Expected: result includes the `_sandbox` page created in Task 0.2.

- [ ] **Step 2: Fetch the _sandbox page via `mcp__notion__fetch`**

Use the page ID from Step 1.

Expected: returns the page with empty body and the `Public-safe`/`Private` children.

- [ ] **Step 3: If results are empty or unexpected, abort and revise spec**

If Notion can't see the workspace, OAuth scope is wrong. If page IDs don't resolve, the workspace structure differs from the spec. Either case warrants spec revision.

---

### Task 0.8: Smoke test — write

**Files:** none (Notion MCP calls)

- [ ] **Step 1: Create a test page via `mcp__notion__create-pages`**

Target parent: `_sandbox/Public-safe/`. Title: `Smoke test — write`. Body: a paragraph with the current ISO timestamp.

Expected: page created. Tool returns the new page ID.

- [ ] **Step 2: Fetch the just-created page**

Verify content matches what was sent.

- [ ] **Step 3: Update the page via `mcp__notion__update-page`**

Append a second paragraph with text "updated".

- [ ] **Step 4: Re-fetch and verify the update**

Both paragraphs should be present.

---

### Task 0.9: Smoke test — Slices DB row

**Files:** none (Notion MCP calls)

- [ ] **Step 1: Create a row in `_sandbox/Private/Slices`**

Properties to set:
- Slice-N: 999
- Title: "Smoke test slice"
- Status: planned
- Open date: today
- Repo: `mgkdante/workflow`

Use `mcp__notion__create-pages` with the database ID as parent.

- [ ] **Step 2: Query the database for the row**

Use `mcp__notion__fetch` on the database to list rows; filter by `Slice-N = 999`.

Expected: the row created in Step 1 is returned.

- [ ] **Step 3: Update the row's status to `in-progress`**

Via `mcp__notion__update-page`.

- [ ] **Step 4: Re-query and verify the status update**

---

### Task 0.10: Smoke test — toggle blocks

**Files:** none (Notion MCP calls)

- [ ] **Step 1: Create a page with a toggle block containing nested content**

Target: `_sandbox/Public-safe/`. Title: `Toggle test`. Body: an open toggle block with a paragraph inside, and a closed toggle block with a 1500-char paragraph inside.

Per § 7 of the spec, toggle blocks are how tool results are stored in Conversations.

- [ ] **Step 2: Open the page in Notion web UI**

Verify the toggle blocks render correctly:
- Open toggle: content visible
- Closed toggle: collapsed, click expands
- Nested paragraph not truncated

- [ ] **Step 3: Verify text-search across toggle content**

In Notion's search bar, search for a unique phrase from inside the closed toggle. The page should appear in results — confirms toggle content is indexed.

- [ ] **Step 4: If toggle blocks behave unexpectedly, abort and revise spec § 3.G**

If toggle content isn't searchable or visually broken, the transcript format design needs revision.

---

### Task 0.11: Phase 0 sign-off

**Files:** none

- [ ] **Step 1: Confirm all smoke tests passed**

Tasks 0.7 / 0.8 / 0.9 / 0.10 — every "Expected" matched.

- [ ] **Step 2: If any failure, stop work and revise the spec**

Specifically:
- Read failure → revisit § 3.A (architecture viability)
- Write failure → revisit § 7 (sync mechanism)
- DB row failure → revisit § 5 (database schemas)
- Toggle failure → revisit § 3.G (transcript format)

- [ ] **Step 3: If all pass, proceed to Phase 1**

Phase 0 is signed off. The `_sandbox` subtree is now the test target for all Phase 1 work.

---

## Phase 1 — Workflow plugin Notion-aware

> All Phase 1 work happens in `C:\Users\otalo\Yesito\Projects\workflow` on branch `feat/notion-aware`.

### Task 1.1: Migrate plugin self-docs to Notion

**Files:**
- Source: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\README.md`, `CHANGELOG.md`, `docs/DESIGN.md`, scaffold's `docs/reference/WORKFLOW.md`, `docs/reference/tools/*`
- Destination: Notion `Projects/mgkdante/workflow/`

- [ ] **Step 1: Read scaffold/docs/reference/WORKFLOW.md**

This is the canonical workflow doc copied into adopting projects. Capture its full content.

- [ ] **Step 2: Create Notion page `mgkdante/workflow/WORKFLOW`**

Use `mcp__notion__update-page` (the page exists from Task 0.2 — empty). Append the markdown content from the scaffold's WORKFLOW.md.

- [ ] **Step 3: Repeat for each tools/* file**

For each of `claude-code.md`, `codex.md`, `README.md` under scaffold's `docs/reference/tools/`:
- Read the file
- Update the corresponding Notion page in `mgkdante/workflow/Tools/<name>` with the content

- [ ] **Step 4: Verify via Notion search**

Search the workspace for a phrase from each migrated doc. Confirm the migrated pages appear in results.

- [ ] **Step 5: Commit (in workflow repo)**

```bash
git add -A
git commit -m "feat(notion): migrate plugin self-docs to Notion

Self-docs (WORKFLOW.md, tools/*) now canonical in Notion at
Projects/mgkdante/workflow/. The scaffold's reference/WORKFLOW.md
becomes the seed; future updates happen in Notion via /workflow-update."
```

Note: scaffold copies are NOT yet deleted — Task 1.4 deletes them after the scaffolded behavior is updated.

---

### Task 1.2: Define per-project Notion-root config schema

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-add\scaffold\AGENTS.md`

The plugin needs to know each consuming project's Notion root page. We add a YAML frontmatter block to the scaffolded AGENTS.md for this.

- [ ] **Step 1: Read current scaffolded AGENTS.md**

Capture the existing content; identify a stable insertion point (top of file, before any narrative content).

- [ ] **Step 2: Define the config schema**

The schema:

```yaml
---
notion:
  root_page_id: "<UUID>"           # Notion page ID for this project's root (e.g., yesid.dev page)
  workspace_url: "https://www.notion.so/<workspace>/"
  databases:
    slices: "<database-UUID>"
    conversations: "<database-UUID>"
    sessions: "<database-UUID>"
---
```

The block sits at the top of AGENTS.md. The plugin reads it on every command invocation.

- [ ] **Step 3: Update scaffold/AGENTS.md to include the schema with placeholder values**

Add at the very top:

```markdown
---
notion:
  root_page_id: "<FILL IN: your project's Notion root page UUID — get from Notion URL>"
  workspace_url: "<FILL IN: e.g. https://www.notion.so/projects/>"
  databases:
    slices: "<FILL IN: Slices database UUID>"
    conversations: "<FILL IN: Conversations database UUID>"
    sessions: "<FILL IN: Sessions database UUID>"
---

# Project Workflow Contract

[existing content...]
```

- [ ] **Step 4: Commit**

```bash
git add plugins/workflow/skills/workflow-add/scaffold/AGENTS.md
git commit -m "feat(notion): scaffold AGENTS.md frontmatter for Notion config

Adopting projects fill in their Notion root + database UUIDs. Plugin
commands parse this on each invocation."
```

---

### Task 1.3: Update workflow-add to provision Notion subtree on bootstrap

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-add\SKILL.md`

The current workflow-add copies a scaffold of files into the project. It should also (a) provision the Notion subtree for the new project (Public-safe / Private + databases), and (b) write the resolved Notion IDs into the scaffolded AGENTS.md frontmatter.

- [ ] **Step 1: Read the full current SKILL.md**

Identify the Actions section and where new actions should be inserted.

- [ ] **Step 2: Plan the inserted Notion-provision actions**

After file scaffolding, before the final commit, the new actions are:

1. Use `mcp__notion__create-pages` to create `<project-name>` page at workspace root if missing
2. Create sub-pages `Public-safe/` (with `Brand`, `Project`, `Roadmap`, `Ops`) and `Private/` (with `Specs`, `Memory`, `Archive`)
3. Use `mcp__notion__create-database` to create `Slices`, `Conversations`, `Sessions` under `Private/` with the schemas from spec § 5
4. Capture all created page/DB IDs
5. Update the just-scaffolded AGENTS.md frontmatter to fill in real UUIDs

- [ ] **Step 3: Edit SKILL.md to add a "Notion provisioning" section**

Add a new section after the "Actions" section (or rename Actions → "Local actions" and add "Notion actions" after):

````markdown
## Notion provisioning (after local scaffold completes)

Provision the project's Notion subtree. **All commands below use the connected Notion MCP.** If the MCP isn't connected, refuse with: "Notion MCP not connected. Run `/mcp` first."

1. **Find or create the project root page**

Use `mcp__notion__search` to find a page named exactly `<project-name>` at the workspace root. If found, use it. If not:

   - Use `mcp__notion__create-pages` with parent=workspace, title=`<project-name>`. Capture the returned page ID as `$ROOT_ID`.

2. **Create the Public-safe subtree**

Under `$ROOT_ID`:
   - Create page `Public-safe`
   - Under it, create empty pages: `Brand`, `Project`, `Roadmap`, `Ops`
   - Under `Brand`, create empty pages: `Foundations`, `Decisions`, `Examples`

3. **Create the Private subtree**

Under `$ROOT_ID`:
   - Create page `Private`
   - Under it, create empty pages: `Specs`, `Memory`, `Archive`

4. **Create the three databases**

Under `Private`:
   - Database `Slices` with schema (Title, Slice-N number, Status with options `planned`/`in-progress`/`closed`, Open date, Close date, PR link URL, Repo select, Spec relation→Specs)
   - Database `Conversations` with schema (Title, Date, Project select, Slice tag relation→Slices, Session ID text, Summary text)
   - Database `Sessions` with schema (Title, Date, Project select, Slices touched relation→Slices multi, Brief summary text)
   - Capture each database's ID as `$SLICES_ID`, `$CONVERSATIONS_ID`, `$SESSIONS_ID`

5. **Write IDs back to the local AGENTS.md**

Edit the just-scaffolded `<repo>/AGENTS.md` — replace the `<FILL IN: ...>` placeholders in the YAML frontmatter with the real UUIDs.

6. **Verify**

Use `mcp__notion__fetch` to retrieve `$ROOT_ID`. Confirm the children match the structure above.
````

- [ ] **Step 4: Test against sandbox**

In a test repo (or use `/_sandbox/test-bootstrap` page in Notion), run `/workflow-add` and verify:
- Local files created (existing behavior)
- Notion subtree created
- AGENTS.md frontmatter populated

- [ ] **Step 5: Commit**

```bash
git add plugins/workflow/skills/workflow-add/SKILL.md
git commit -m "feat(notion): workflow-add provisions Notion subtree on bootstrap"
```

---

### Task 1.4: Update workflow-slice-open to write Slices DB row

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-slice-open\SKILL.md`

Currently this command creates `docs/slices/slice-<name>/plan.md` etc. Now it writes a row in the Slices DB and creates linked Spec/Plan/Handoff pages under the row.

- [ ] **Step 1: Read current SKILL.md**

Identify the existing actions: argument canonicalization, branch creation, file scaffolding, commit, push.

- [ ] **Step 2: Identify what stays vs changes**

Stays: argument canonicalization, branch creation (worktree mode), commit-and-push (with content-free placeholder commit).

Changes: file scaffolding → Notion row creation + linked detail pages.

- [ ] **Step 3: Edit SKILL.md**

Replace the "Actions / scaffold files" section with:

````markdown
## Notion actions (after branch is created)

1. **Read AGENTS.md frontmatter** to get `notion.databases.slices` (UUID).

2. **Create a Slices DB row** via `mcp__notion__create-pages` with parent=Slices DB:

   Properties:
   - Title: `<slice-name canonicalized>` (e.g., "slice-auth-refactor")
   - Slice-N: next available integer (query DB for max Slice-N, increment)
   - Status: `planned`
   - Open date: today
   - Repo: parsed from current repo (e.g., `yesid.dev`, `mgkdante/workflow`)

   Capture the returned row's page ID as `$SLICE_ROW_ID`.

3. **Create linked Spec page** under `Private/Specs/`:

   - Title: `<slice-name> — design`
   - Body: empty (user fills during planning)
   - Use `mcp__notion__update-page` to set the Slice row's "Spec" relation → this page

4. **Create child Plan page** under `$SLICE_ROW_ID`:

   - Title: `Plan`
   - Body: bullet list "<!-- FILL IN: per-task implementation plan -->"

5. **Create child Handoff page** under `$SLICE_ROW_ID`:

   - Title: `Handoff`
   - Body: empty (filled at slice close)

6. **Verify** via `mcp__notion__fetch` on `$SLICE_ROW_ID` — confirm linked children exist.

## Local actions (unchanged)

[Original branch creation, commit, push instructions stay as-is.]
````

- [ ] **Step 4: Test against sandbox**

In a sandbox repo with sandbox AGENTS.md frontmatter pointing at `_sandbox/Private/Slices`, run `/workflow-slice-open test-slice` and verify:
- Sandbox Slices DB has new row with correct properties
- Spec / Plan / Handoff linked pages created
- Local branch created

- [ ] **Step 5: Commit**

```bash
git add plugins/workflow/skills/workflow-slice-open/SKILL.md
git commit -m "feat(notion): slice-open writes to Slices DB + linked pages"
```

---

### Task 1.5: Update workflow-close-slice

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-close-slice\SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

Identify what it does: drafts handoff.md, drafts PR body, runs cross-tool review, archives slice docs.

- [ ] **Step 2: Map old actions to Notion equivalents**

| Old | New |
|---|---|
| Update `docs/slices/slice-<n>/handoff.md` | Update Handoff child page under Slice row |
| Draft PR body in slice dir | Draft PR body in Slice row's "PR description" property OR keep as gh-pr-create input |
| Find slice's PR after merge | Update Slice row "PR link" + "Close date", set Status=closed |
| Move slice docs to archive | Update Slice row Status=closed; the linked content stays as-is (Notion's relation preserves it) |
| Cross-tool adversarial review | Unchanged in mechanism — Codex still runs the review on the handoff branch; the handoff content is now the Notion Handoff page (which the reviewer fetches via MCP) |

- [ ] **Step 3: Edit SKILL.md**

Replace file-write actions with Notion equivalents. Specifically:

````markdown
## Notion actions (replacing file writes)

1. **Read AGENTS.md frontmatter** to locate the Slices DB.

2. **Find this slice's row** by current branch name:
   - Query Slices DB: filter `Title = <current-branch-name>`
   - Capture `$SLICE_ROW_ID` and `$HANDOFF_PAGE_ID` (child of the row)

3. **Write the handoff content** via `mcp__notion__update-page` on `$HANDOFF_PAGE_ID`:
   - Body sections: Summary, What changed, Loose ends, Cross-tool review request

4. **Update Slice row properties**:
   - Status: `closed`
   - Close date: today
   - PR link: pulled from `gh pr view` after creating the PR

5. **Cross-tool adversarial review** (unchanged mechanism, new content source):
   - Reviewer (Codex/Claude depending on D12 binding) is told to fetch `$HANDOFF_PAGE_ID` via Notion MCP and post review comments back as a Notion comment on that page.
````

- [ ] **Step 4: Test against sandbox**

End-to-end: open a sandbox slice (Task 1.4 test), make a trivial change, run `/workflow-close-slice`. Verify:
- Slice row Status=closed, Close date=today, PR link populated
- Handoff page has the populated content

- [ ] **Step 5: Commit**

```bash
git add plugins/workflow/skills/workflow-close-slice/SKILL.md
git commit -m "feat(notion): close-slice updates Slice row + Handoff page"
```

---

### Task 1.6: Update workflow-handoff

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-handoff\SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

Modes (`--light`, `--action`) and what each writes today.

- [ ] **Step 2: Replace file writes with Handoff page updates**

In the SKILL.md, replace any `Write` to `docs/slices/<slice>/handoff.md` with `mcp__notion__update-page` on the slice's Handoff child page. Preserve the modes; just change the destination.

- [ ] **Step 3: Test in sandbox**

Run `/workflow-handoff --light` mid-slice. Verify handoff page updates.

- [ ] **Step 4: Commit**

```bash
git add plugins/workflow/skills/workflow-handoff/SKILL.md
git commit -m "feat(notion): handoff writes to Notion Handoff page"
```

---

### Task 1.7: Update workflow-status

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-status\SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

Identify reads from `docs/slices/`, `docs/roadmap/PLAN.md`, etc.

- [ ] **Step 2: Replace reads with Notion queries**

- Active slices → `mcp__notion__fetch` on Slices DB filtered `Status != closed`
- Roadmap → fetch `Public-safe/Roadmap/PLAN` page
- Recent sessions → query Sessions DB filtered `Date >= today - 7d`

- [ ] **Step 3: Test in sandbox**

Run `/workflow-status` against the sandbox. Verify the report includes the test slice from Task 1.4.

- [ ] **Step 4: Commit**

```bash
git add plugins/workflow/skills/workflow-status/SKILL.md
git commit -m "feat(notion): status queries Notion DBs instead of files"
```

---

### Task 1.8: Update workflow-pull

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-pull\SKILL.md`

- [ ] **Step 1: Decide pull semantics under Notion**

Under Notion-canonical, the plugin scaffold no longer has heavy doc tree to update. workflow-pull's job is mostly:
- Pull updated SKILL.md files from upstream (unchanged — file-based, since this is the plugin source)
- Pull updated scaffold templates that adopting projects use (unchanged)
- Refresh the local thin-pointer AGENTS.md/CLAUDE.md if upstream updated their templates

So workflow-pull stays mostly file-based. Notion-side changes are pulled by the project's SessionStart hook (Phase 2 territory), not by workflow-pull.

- [ ] **Step 2: Edit SKILL.md to clarify the new responsibility boundary**

Add a note section:

```markdown
## What workflow-pull is NOT responsible for (post-Notion)

- Pulling Notion content into local files. That is the project's SessionStart hook.
- Re-creating Notion subtrees. workflow-add does that on bootstrap.
- Modifying Slice / Conversations / Sessions DB rows. That is the responsibility of slice-lifecycle commands.

workflow-pull is purely about syncing the *plugin* (this repo's contents) into the consuming project's repo files.
```

- [ ] **Step 3: Commit**

```bash
git add plugins/workflow/skills/workflow-pull/SKILL.md
git commit -m "docs(notion): clarify workflow-pull responsibility boundary"
```

---

### Task 1.9: Retire workflow-mirror and workflow-trim

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-mirror\SKILL.md`
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-trim\SKILL.md`

These commands existed to push artifacts to a cloud target and remove local copies after mirroring. With Notion-canonical, there is no cloud target.

- [ ] **Step 1: Decide retirement vs repurposing**

Retire both. Memory mirror sync (the only forward-looking sync) is a project-side SessionStart hook, not a plugin command — it doesn't need a slash command interface.

- [ ] **Step 2: Replace workflow-mirror/SKILL.md with a deprecation stub**

```markdown
---
name: workflow-mirror
description: DEPRECATED — Notion-canonical workflow has no cloud mirror target. Use `mcp__notion__*` directly via the SessionStart hook (set up by /workflow-add).
---

# workflow-mirror — DEPRECATED

This command is no longer functional. The workflow plugin migrated from cloud-mirror to Notion-canonical (see `Projects/mgkdante/workflow/DESIGN` § Notion adoption).

If invoked, output:

> workflow-mirror is deprecated. Notion is now the single source of truth — there is no cloud target to mirror to. Memory sync happens automatically via the SessionStart hook installed by /workflow-add.

Then exit.
```

- [ ] **Step 3: Replace workflow-trim/SKILL.md with a similar deprecation stub**

(Same structure, different deprecation message.)

- [ ] **Step 4: Commit**

```bash
git add plugins/workflow/skills/workflow-mirror/SKILL.md plugins/workflow/skills/workflow-trim/SKILL.md
git commit -m "feat(notion): deprecate workflow-mirror and workflow-trim

Notion is single source of truth; no cloud mirror target exists.
Stubs remain so existing /workflow-mirror and /workflow-trim invocations
get a clear deprecation message."
```

---

### Task 1.10: Update workflow-clean

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-clean\SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

Understand current scope. workflow-clean is "manual-only pre-publish IP removal" — it strips Claude-method content from the repo before going public.

- [ ] **Step 2: Update scope under Notion**

Most Claude-method content is already in Notion (not the repo) post-Phase 2. workflow-clean's job is now:
- Remove any leftover gitignored paths that somehow re-entered (e.g., a checkout that pulled gitignored files into git)
- Remove the Notion frontmatter from AGENTS.md (replace with a public-safe stub)
- Verify the public-export Notion subtree (`Public-safe/`) and produce a manifest

- [ ] **Step 3: Edit SKILL.md to reflect the new scope**

Update the Actions section to:

```markdown
## Actions (post-Notion)

1. Verify `git status` is clean.
2. List paths in `.gitignore` that match the "migrated to Notion" comment block.
3. For each, run `git ls-files <path>` to check if any escaped the gitignore. If so, `git rm` them and commit.
4. Read AGENTS.md. Replace the `notion:` frontmatter block with a comment: `<!-- Notion config redacted for public release. See operator's private notes. -->`.
5. Use `mcp__notion__fetch` on the project's `Public-safe/` subtree. Produce a manifest of all pages (title, ID, last-modified) at `<repo>/PUBLISH_MANIFEST.md`.
6. Output: "Repo ready for public release. Run final review before pushing."
```

- [ ] **Step 4: Commit**

```bash
git add plugins/workflow/skills/workflow-clean/SKILL.md
git commit -m "feat(notion): workflow-clean adapts to Notion-canonical layout"
```

---

### Task 1.11: Update workflow orchestrator

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow\SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

It dispatches to other commands.

- [ ] **Step 2: Update its state-reading section**

The orchestrator likely reads files (`AGENTS.md`, `docs/slices/`, etc.) to recommend the next command. Update those reads:
- AGENTS.md frontmatter → still file-read (frontmatter is local config)
- Slice state → query Slices DB instead of `ls docs/slices/`
- Recent activity → query Sessions DB

- [ ] **Step 3: Add a precondition check**

Top of the SKILL.md actions:

```markdown
## Preconditions

1. Notion MCP connected (`mcp__notion__*` tools available). If not, advise: "Notion MCP not connected. Run `/mcp` first."
2. AGENTS.md exists at repo root with `notion.databases.slices` frontmatter. If not, advise: "Project not scaffolded. Run `/workflow-add`."
```

- [ ] **Step 4: Commit**

```bash
git add plugins/workflow/skills/workflow/SKILL.md
git commit -m "feat(notion): orchestrator queries Notion for state"
```

---

### Task 1.12: workflow-update stays mostly file-based

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-update\SKILL.md` (minor)

workflow-update modifies the plugin source itself (this repo). It opens a PR against `mgkdante/workflow`. This stays file-based — the plugin source is git-versioned code, not Notion content.

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Confirm no Notion changes needed**

It writes/edits files in this repo (`plugins/workflow/skills/<command>/SKILL.md`, etc.) and opens a PR. None of those operations touch Notion.

- [ ] **Step 3: Add a clarifying note in the SKILL.md**

```markdown
## Note on Notion (post-2026-04-27)

workflow-update modifies the plugin source itself, which lives in git
(this repo, `mgkdante/workflow`). It does NOT modify Notion content.
For Notion-side workflow improvements (e.g., updating the
mgkdante/workflow Notion page), edit Notion directly.
```

- [ ] **Step 4: Commit**

```bash
git add plugins/workflow/skills/workflow-update/SKILL.md
git commit -m "docs(notion): clarify workflow-update boundary"
```

---

### Task 1.13: Update DESIGN.md to acknowledge MCP dependency

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\docs\DESIGN.md`

The plugin's current "Zero MCP dependencies" principle is being deliberately violated. DESIGN.md must explicitly walk back this principle for the new Notion-aware version.

- [ ] **Step 1: Read DESIGN.md to find current D-numbers and the zero-MCP principle**

Locate the section asserting zero-MCP. Capture the exact text.

- [ ] **Step 2: Add a new D-number documenting the change**

Add at the end of the D-numbered section (find max D-N, use D-N+1):

```markdown
### D-NN — Notion as a first-class MCP dependency (2026-04-27 reversal of zero-MCP principle)

**Decision:** the plugin acquires a hard dependency on the Notion MCP server (`mcp__notion__*`). This explicitly reverses the earlier "Zero MCP dependencies" principle.

**Why:**
- Cloud-mirror approach (Google Drive sync) had install-dependency friction (Drive client per device), silent breakage (resolveRepoRoot bugs), and two-version drift.
- Notion is first-class on every major LLM (Claude, Codex, others) — vendor-neutral reach via standard MCP.
- Notion's web access removes per-device install friction.
- Trade: cloud-sandbox compatibility weakens. Sandboxes that can't OAuth to Notion lose plugin functionality. Acceptable: the typical workflow user runs locally with browser access; sandbox use is rare.

**Consumer impact:**
- Adopting projects must wire the Notion MCP into `.mcp.json` and OAuth.
- AGENTS.md scaffold gains `notion:` frontmatter (project Notion root + database UUIDs).
- workflow-mirror and workflow-trim retired (no cloud target).

**Related:** spec [docs/superpowers/specs/2026-04-27-notion-arc-design.md] (in `mgkdante/yesid.dev` repo).
```

- [ ] **Step 3: Update the original "Zero MCP dependencies" assertion**

Locate the sentence. Add a strikethrough + pointer:

```markdown
~~Zero MCP dependencies — Skills use only `git`, `gh` CLI, and standard shell.~~

**Updated 2026-04-27:** see D-NN. The plugin now depends on the Notion MCP. Skills use `git`, `gh`, standard shell, AND `mcp__notion__*` tools.
```

- [ ] **Step 4: Commit**

```bash
git add docs/DESIGN.md
git commit -m "docs(design): D-NN — Notion MCP as first-class dependency

Reverses the prior 'Zero MCP dependencies' principle. Documents
rationale and consumer impact."
```

---

### Task 1.14: Update README.md

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\README.md`

- [ ] **Step 1: Read current README.md**

Find the "Zero MCP dependencies" claim (currently around line 70) and the install/quickstart sections.

- [ ] **Step 2: Replace the zero-MCP claim**

Remove the bullet point or strikethrough it; add a note:

```markdown
- ~~**Zero MCP dependencies** — Skills use only `git`, `gh` CLI, and standard shell. Works in cloud sandboxes without MCP auth gymnastics.~~ **(Reversed 2026-04-27 — see [DESIGN.md § D-NN](../../docs/DESIGN.md#d-nn).)** The plugin now depends on the official Notion MCP. Adopting projects OAuth into Notion once during `/workflow-add`.
```

- [ ] **Step 3: Update the install section**

After the existing install steps, add:

```markdown
### Notion MCP setup (required)

After installing the plugin:

1. Add the Notion MCP to your `.mcp.json`:

```json
{
  "mcpServers": {
    "notion": { "type": "http", "url": "https://mcp.notion.com/mcp" }
  }
}
```

2. Run `/mcp` and authenticate via OAuth.
3. Run `/workflow-add` — the command provisions the project's Notion subtree and writes the resulting page/database UUIDs into your scaffolded AGENTS.md.
```

- [ ] **Step 4: Update Prerequisites**

Add to the prerequisites list:

```markdown
- A Notion account (free tier sufficient for solo use).
```

- [ ] **Step 5: Commit**

```bash
git add plugins/workflow/README.md
git commit -m "docs: README acknowledges Notion MCP dependency"
```

---

### Task 1.15: Update CHANGELOG.md

**Files:**
- Modify: `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\CHANGELOG.md`

- [ ] **Step 1: Read current CHANGELOG**

Identify the last released version. Plan the next version bump (likely 0.2.0 from 0.1.x — major behavioral change).

- [ ] **Step 2: Add a new entry**

```markdown
## [0.2.0] — 2026-04-XX

### BREAKING
- Plugin now depends on the Notion MCP (`mcp__notion__*`). See [DESIGN.md § D-NN](../../docs/DESIGN.md#d-nn). Reverses the prior "zero MCP dependencies" principle.
- `/workflow-mirror` and `/workflow-trim` retired (no cloud target).
- Adopting projects must wire Notion MCP into `.mcp.json` and OAuth before running `/workflow-add`.
- AGENTS.md scaffold gains `notion:` YAML frontmatter (project root + database UUIDs).

### Added
- `/workflow-add` provisions the project's Notion subtree (Public-safe + Private + 3 databases) on bootstrap.
- Slice lifecycle commands write to Notion: rows in Slices DB, linked Spec/Plan/Handoff pages.
- `/workflow-status` queries Notion DBs.

### Changed
- `/workflow-clean` updated for the post-Notion repo layout.
- README, DESIGN.md updated.

### Removed
- File-based slice scaffolding (`docs/slices/<name>/*.md`).
- File-based handoff drafts.
```

- [ ] **Step 3: Commit**

```bash
git add plugins/workflow/CHANGELOG.md
git commit -m "docs(changelog): 0.2.0 — Notion-aware plugin"
```

---

### Task 1.16: Strip migrated scaffold content

**Files:**
- Delete: select files under `C:\Users\otalo\Yesito\Projects\workflow\plugins\workflow\skills\workflow-add\scaffold\docs\`

The scaffold currently copies a heavy docs tree (project/, roadmap/, reference/, _TEMPLATES/) into adopting projects. Under Notion-canonical, most of this lives in Notion only. Adopting projects only need the irreducible local set.

- [ ] **Step 1: Re-read the scaffold inventory**

```bash
find C:/Users/otalo/Yesito/Projects/workflow/plugins/workflow/skills/workflow-add/scaffold -type f
```

- [ ] **Step 2: Categorize each file**

| File | Disposition |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `.env.example` | KEEP (irreducible local) |
| `docs/README.md`, `docs/ARCHIVE.md` | DELETE (migrate to Notion via workflow-add Notion provisioning) |
| `docs/roadmap/PLAN.md` | DELETE (Notion-canonical now) |
| `docs/reference/WORKFLOW.md`, `tools/*` | DELETE (already migrated to Notion in Task 1.1; adopting projects fetch via MCP) |
| `docs/reference/ARCHITECTURE.md`, `VOCAB.md` | DELETE (Notion-canonical) |
| `docs/ai-memory/SCHEMA.md`, `MEMORY.md.example` | KEEP (auto-memory schema is code-coupled — Claude Code loads from disk) |
| `docs/project/*.md` (CONSTITUTION, STACK, BINDINGS, etc.) | DELETE (Notion-canonical for adopting projects) |
| `docs/_TEMPLATES/session/session.md` | DELETE (Notion-canonical) |
| `docs/sessions/.gitkeep`, `docs/slices/.gitkeep` | DELETE (these dirs are gitignored post-migration) |

- [ ] **Step 3: Delete the to-delete files in one commit**

```bash
git rm -r plugins/workflow/skills/workflow-add/scaffold/docs/{README.md,ARCHIVE.md,roadmap,reference,project,_TEMPLATES,sessions,slices}
git commit -m "feat(notion): strip scaffold of Notion-migrated content

Adopting projects no longer get a heavy docs/ tree from the scaffold.
Workflow-add provisions Notion subtrees instead. Only the irreducible
local set (AGENTS.md, CLAUDE.md, .env.example, docs/ai-memory/) ships."
```

- [ ] **Step 4: Update workflow-add SKILL.md to remove deleted-file references**

In `plugins/workflow/skills/workflow-add/SKILL.md`, remove lines that copy the now-deleted scaffold paths. Confirm the SKILL.md only references files that still exist.

- [ ] **Step 5: Commit**

```bash
git add plugins/workflow/skills/workflow-add/SKILL.md
git commit -m "fix(workflow-add): remove references to deleted scaffold paths"
```

---

### Task 1.17: End-to-end test — full slice lifecycle

**Files:** none (sandbox test)

- [ ] **Step 1: Set up a test repo against the sandbox Notion subtree**

```bash
cd /tmp || cd "$HOME/Yesito/Projects"
mkdir notion-aware-e2e-test && cd notion-aware-e2e-test
git init
```

- [ ] **Step 2: Wire the local plugin source into Claude Code**

(Per Claude Code plugin development convention — likely `claude config` or symlinking. Verify per current setup.)

- [ ] **Step 3: Run `/workflow-add` in the test repo**

Verify:
- AGENTS.md, CLAUDE.md, .env.example created
- docs/ai-memory/SCHEMA.md created
- AGENTS.md frontmatter populated with sandbox Notion UUIDs
- Notion sandbox `_sandbox/test-bootstrap-<timestamp>/` page tree created
- 3 databases created under sandbox `Private/`

- [ ] **Step 4: Run `/workflow-slice-open test-slice-e2e`**

Verify:
- Branch `slice-test-slice-e2e` created
- Slices DB has new row with Slice-N=1, Status=planned
- Linked Spec/Plan/Handoff pages exist

- [ ] **Step 5: Make a trivial change in the test repo**

`echo "test" > FOO.md && git add FOO.md && git commit -m "test"`

- [ ] **Step 6: Run `/workflow-handoff --light`**

Verify Handoff page in Notion has the auto-drafted content.

- [ ] **Step 7: Run `/workflow-close-slice`**

Verify:
- Slices row Status=closed, Close date=today, PR link populated (after `gh pr create`)
- Handoff page has full close content
- Cross-tool review request was generated

- [ ] **Step 8: Run `/workflow-status`**

Verify the report shows the just-closed slice.

- [ ] **Step 9: If any step fails, fix in the corresponding SKILL.md and re-run from that step**

- [ ] **Step 10: After full pass, document the test in a sandbox Notion page**

Create `_sandbox/Private/Specs/E2E-test-2026-04-XX` with the test's input commands and observed outputs.

- [ ] **Step 11: Commit any fixes (no commit needed for the test itself)**

---

### Task 1.18: Bump version + tag release

**Files:**
- Modify: any version-tracking file (verify per `package.json` if present, or git tag only)

- [ ] **Step 1: Locate version tracker**

```bash
find C:/Users/otalo/Yesito/Projects/workflow -name "package.json" -o -name "version" -o -name "VERSION" 2>&1
```

If a `package.json` is present, bump version. If git-tag-only, skip to Step 3.

- [ ] **Step 2: If package.json exists, bump version**

Edit version field to `0.2.0`. Commit:

```bash
git add package.json
git commit -m "chore: bump version 0.1.x → 0.2.0"
```

- [ ] **Step 3: Tag the release**

```bash
git tag -a v0.2.0 -m "v0.2.0 — Notion-aware plugin

See plugins/workflow/CHANGELOG.md for full notes.
Reverses zero-MCP-dependency principle (D-NN).
Phase 1 of the Notion migration arc."
```

---

### Task 1.19: Push branch + open PR

**Files:** none (git + gh)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/notion-aware
```

- [ ] **Step 2: Create the PR**

```bash
gh pr create --title "feat(0.2.0): Notion-aware plugin" --body "$(cat <<'EOF'
## Summary

- Plugin acquires a hard Notion MCP dependency (reverses prior zero-MCP principle, see DESIGN.md § D-NN).
- All slice-lifecycle commands now read/write Notion via MCP instead of files.
- `/workflow-add` provisions Notion subtree on bootstrap.
- `/workflow-mirror` and `/workflow-trim` retired (no cloud target).
- Scaffold stripped of Notion-migrated content; only irreducible local set ships.

## Test plan

- [x] Phase 0 smoke tests passed (read/write/DB/toggle)
- [x] End-to-end slice lifecycle in sandbox passes (Task 1.17)
- [ ] Reviewer: manually run `/workflow-add` in a fresh test repo, confirm Notion subtree appears
- [ ] Reviewer: confirm DESIGN.md D-NN explanation is intelligible and complete
- [ ] Reviewer: confirm CHANGELOG breaking-change list is exhaustive

## Spec

See [yesid.dev's spec](https://github.com/mgkdante/yesid.dev/blob/main/docs/superpowers/specs/2026-04-27-notion-arc-design.md). Phase 1 of a two-phase arc.
EOF
)"
```

- [ ] **Step 3: After review and merge, sign off Phase 1**

Plan B (Phase 2) can now be written and executed.

---

## Self-review

Before declaring this plan ready for execution:

1. **Spec coverage check** — every section of the spec § 8 (Phase 0) and § 9 (Phase 1) maps to a task. § 13 (propagation prompt) is deferred to Plan B since it depends on Phase 2 outcomes.
2. **Placeholder check** — no "TBD" / "TODO" / "implement later" remains. Three places use `<FILL IN: ...>` markers — those are deliberate template placeholders that adopting projects fill, not plan-incompleteness.
3. **Type/ID consistency** — `mcp__notion__*` tool names are consistent across tasks; `$SLICE_ROW_ID` / `$ROOT_ID` / `$SLICES_ID` placeholder variables used consistently for Notion IDs.
4. **Scope check** — Plan A is one repo (`mgkdante/workflow`) + setup work in `yesid.dev` (just `.mcp.json`). Plan B is `yesid.dev` retrofit, deferred until Plan A ships.
5. **Order check** — Phase 0 gates Phase 1 (Task 0.11 sign-off). Within Phase 1, dependent commands (close-slice depends on slice-open's structure) are ordered correctly.

---

## What Plan B (Phase 2) will cover, after Plan A ships

- Adopt the now-tagged `mgkdante/workflow@0.2.0` in `yesid.dev`.
- Run `/workflow-add` in `yesid.dev` (fresh) — provisions the production `Projects/yesid.dev/` subtree and writes UUIDs to AGENTS.md frontmatter.
- Migrate `yesid.dev`'s existing content (Public-safe and Private classes per spec § 6).
- Install SessionStart hook for memory mirror + SessionStop hook for conversation push.
- Retire cloud-mirror scripts (`mirror-brand.ts`, `mirror-docs.ts`, `archive-conversations.ts`).
- Delete `~/Yesito/cloud/yesid.dev/` cloud archive.
- Generate workflow-plugin propagation prompt artifact (spec § 13).

Plan B's task detail benefits from knowing how Phase 1's actual config field shape settled, exact hook trigger names available in current Claude Code, and the migrated Notion structure as it exists post-Phase-1. Writing it now would force re-writing later.
