# Notion Migration Arc — Replace Cloud-Mirror with Notion-Canonical Wiki

- **Status:** Design approved 2026-04-27 · implementation pending
- **Type:** Multi-phase arc design (covers two slices across two repos)
- **Session budget:** ~1 short session (Phase 0) + ~2-3 sessions (Phase 1) + ~3-4 sessions (Phase 2)
- **Phase 1 branch:** `feat/notion-aware` on `mgkdante/workflow`
- **Phase 2 branch:** `feat/notion-migration` on `yesid.dev` (this repo)
- **Owner:** Yesid
- **Brainstorm output:** this document (brainstorming session 2026-04-27)

---

## 1. Context

The cloud-mirror approach (Google Drive sync target for `brand/`, `docs/`, transcripts) is being retired. Reasons:

- Requires installing Google Drive desktop client on every device Yesid uses → friction, install dependency, Windows/macOS quirks.
- Mirrors are silent — no real-time edits, only snapshots; the `mirror-docs.ts` script has been silently broken since the `resolveRepoRoot` regression (PR #83 fixed brand-mirror; docs-mirror at [apps/web/scripts/mirror-docs.ts:59](../../../apps/web/scripts/mirror-docs.ts#L59) still resolves to `apps/web/` instead of repo root).
- Two-version proliferation: edits in repo + manual sync to cloud + sometimes drift.
- Conversation transcripts archived as `.jsonl` files are not human-skimmable and not AI-queryable without a custom reader.

**Replacement target: Notion as a private wiki.**

- Free tier covers solo use indefinitely (unlimited pages, unlimited blocks, 5MB/file uploads — irrelevant for markdown body content, 30-day in-Notion version history — irrelevant since git versions code-coupled docs and Notion-canonical docs don't need permanent line-level history).
- Web access from any device (no install dependency). Mobile, tablet, web all work.
- Official MCP exposed by Notion + supported natively by every major LLM (Claude, Codex, others) → first-class AI access from any tool.
- Markdown import/export, structural blocks, databases for queryable content.

**The arc has two phases that ship sequentially:**

1. **Phase 1 — Workflow plugin Notion-aware** (in `mgkdante/workflow`): the workflow plugin's commands stop reading/writing files at known paths and start reading/writing via the Notion MCP.
2. **Phase 2 — yesid.dev retrofit** (here): adopt the Notion-aware plugin, migrate all eligible repo content to Notion, retire cloud-mirror scripts, delete the cloud archive.

Phase 0 (workspace setup + MCP wiring + smoke test) is a short prerequisite for both.

---

## 2. Scope

### In scope (across the arc)

1. Notion **Projects** workspace created with the structure in § 4
2. Three Notion databases (Slices, Conversations, Sessions) with the schemas in § 5
3. Notion MCP wired into `.mcp.json` for both `mgkdante/workflow` and `yesid.dev` repos
4. **Phase 1**: workflow plugin commands migrate from file I/O to Notion MCP (§ 9)
5. **Phase 1**: workflow plugin's own docs (`WORKFLOW.md`, `tools/*`) migrated to Notion `mgkdante/workflow` page
6. **Phase 2**: yesid.dev's eligible content migrated to Notion (§ 6 disposition)
7. **Phase 2**: SessionStart hook installed for Notion → local memory pull (§ 7)
8. **Phase 2**: SessionStop hook installed for `.jsonl` → Notion conversation push (§ 7)
9. **Phase 2**: `~/Yesito/cloud/yesid.dev/` cloud archive deleted
10. **Phase 2**: cloud-mirror scripts retired (`mirror-brand.ts`, `mirror-docs.ts`, `archive-conversations.ts`) and their `package.json` entries removed
11. **Phase 2**: `docs/learn/` cloud-only orphan deleted (stale, future learn modules go at end of `Public-safe/Roadmap/PLAN`)
12. **Phase 2**: gitignore rules updated so migrated paths cannot accidentally re-enter the public repo
13. **Phase 2**: workflow-plugin propagation prompt generated as a text artifact (so future projects bootstrap with Notion-aware workflow)

### Out of scope (deferred)

- Migrating other Yesid projects (`cafe-arona/`, `freelance/transit/`) to the Notion-aware plugin — they are not active workflow-plugin consumers; if they later adopt, they use the propagation prompt.
- Migrating `.remember/` (the session-continuation buffer, separate system) to Notion — stays local-only; revisit in a future slice if useful.
- Going-public repo cutover (squashing git history, exporting Notion `Public-safe/*` to public repo) — covered by the launch strategy memory, not this arc.
- A custom Notion-side webhook or polling daemon — only needed if real-time push from Notion to local is required; SessionStart pull is sufficient.
- Notion paid tier features (file uploads >5MB, longer page history, team workspaces).

---

## 3. Decisions (from brainstorm 2026-04-27)

### A. Architecture — Option α (full Notion-canonical)

- **A1 · Single source of truth.** Everything that *can* live in Notion *only* lives in Notion. No mirrors, no consolidation step, no end-of-slice push. Edits in Notion are immediately authoritative across all consumers (web, mobile, MCP from any LLM).
- **A2 · Irreducible local set** — the only files in repo or `~/.claude/` that mirror Notion content:
  - Repo root: `CLAUDE.md` (Claude Code auto-load), `AGENTS.md` (will become a thin pointer post-Phase 1), `README.md` and `LICENSE` (GitHub conventions), tool configs (`package.json`, `tsconfig.json`, `.mcp.json`, `.githooks/`, `.claude/`)
  - Generated build artifacts: `DESIGN.md` (from `packages/tokens/tokens.json`)
  - Source code, build pipelines, brand assets pipelines consume (`brand/logos/*.svg`, `brand/figma-exports/`, `brand/examples/*.png`, `brand/scripts/*.ts`)
  - Claude auto-memory: `~/.claude/projects/<project-hash>/memory/*.md` — Notion-canonical, local copy auto-pulled at SessionStart so Claude's auto-load mechanism keeps working
- **A3 · Reach is solved.** Every major LLM (Claude, Codex, others) ships with native Notion MCP support. No vendor lock-in to one tool.
- **A4 · Grep loss accepted.** `Grep` across living docs stops working in-repo. Notion's full-text search replaces it. `Grep` is preserved where it matters most — code and code comments.
- **A5 · Atomic-PR loss accepted for migrated docs.** PR descriptions reference Notion pages instead of bundling doc diffs.
- **A6 · Going-public structural boundary.** The Public-safe / Private split (§ 4) is a structural Notion subtree, not a tag. Going-public day is a clean export of `Public-safe/*` to the public repo — no per-page audit.

### B. Phase order — Plugin first, then retrofit

- **B1 · Phase 1 ships before Phase 2.** Yesid.dev cannot retrofit until the plugin can read/write Notion. Plugin work is in scope and lives in `mgkdante/workflow`.
- **B2 · No dual-mode plugin.** `yesid.dev` is the only current consumer; plugin can go all-in on Notion-mode immediately. No file-mode/Notion-mode toggle, no transitional code, no compat shims. Smaller plugin diff.
- **B3 · Per-project Notion root config.** Each adopting project tells the plugin where its Notion subtree lives via a config field (location TBD during Phase 1 implementation — likely `.claude/settings.json` `notionRootPageId` or similar).

### C. Spec scope — One unified spec, two implementation plans

- **C1 · This document covers both phases.** Architecture decisions are shared; phase-1 plugin choices constrain phase-2 retrofit choices. One spec.
- **C2 · `writing-plans` will produce two implementation plans** — one targeting `mgkdante/workflow`, one targeting `yesid.dev`. Each ships its own PR.
- **C3 · Spec lives in `yesid.dev/docs/superpowers/specs/`** because that is where this brainstorm is happening. The plugin team (also Yesid) cross-references it from the workflow repo.

### D. Workspace structure — Public-safe / Private at every project root

- **D1 · Workspace name: "Projects".** Holds yesid.dev + future client/personal projects + `mgkdante/workflow` (the plugin itself, as a sibling project).
- **D2 · Per-project shape (fixed).** `Public-safe/` (exports to public repo at cutover) + `Private/` (Claude-method, never published).
- **D3 · Workflow plugin is a sibling project page.** Its docs live at `Projects/mgkdante/workflow/`, not nested under any consumer project. yesid.dev (and future projects) link to it.

### E. Database choices

- **E1 · Three databases**: Slices, Conversations, Sessions (§ 5). Queryable by status, date, project, etc.
- **E2 · Specs as plain pages**, not a database — one page per spec, linked **from** the corresponding Slice DB row via a Notion relation.
- **E3 · Memory as plain pages + index**, not a database — folder of `*.md`-equivalent pages with a `MEMORY` index page (mirrors the current `MEMORY.md` pattern).
- **E4 · Brand / Project / Roadmap content as plain pages.** Not queryable entities; just reading material.

### F. Sync mechanisms

- **F1 · Memory mirror sync.** SessionStart hook pulls `Projects/yesid.dev/Private/Memory/*` from Notion via MCP and writes to `~/.claude/projects/<project-hash>/memory/*.md`. Claude's auto-load picks up local on prompt build.
- **F2 · Memory writes go directly to Notion.** When Claude saves or updates a memory mid-session, it writes to Notion via MCP. Local file updates at next SessionStart pull. Stale-by-one-session is acceptable; Claude has the just-written content in conversation history within the session.
- **F3 · Conversation push.** SessionStop hook converts the just-finished `.jsonl` to markdown (§ 7) and creates a Conversations DB row in Notion. Replaces `archive-conversations.ts`.
- **F4 · Graceful degradation.** Hook failures (network down, MCP unavailable) leave local files untouched and log the failure. Memory uses last-known-good local copy; conversation upload retries next session.

### G. Transcript format

- **G1 · Markdown body, not file attachment.** One Notion `Conversations` row per session; properties for metadata; body is the full `.jsonl` converted to markdown.
- **G2 · Structure preservation.** Each turn → `### User` / `### Assistant`. Tool calls → fenced code blocks. Tool results → collapsed toggle blocks (Notion native).
- **G3 · Notion limits engineered around.** Per-block ≤2000 chars (split long blocks). Per-API-append-call ≤100 blocks. If a session would exceed ~80 blocks, split into linked sub-pages ("…part 1/2"). Rare.
- **G4 · Tool-result truncation (default on).** Tool results >5000 chars truncated to "first 5000 chars + `[truncated, N chars more]`". Configurable knob; off if byte-fidelity preferred.
- **G5 · Block-chunk threshold (default 80 blocks).** Configurable knob.
- **G6 · No raw `.jsonl` retained after migration.** Markdown body is the new "raw" — preserves all human/AI-meaningful content; loses internal IDs/timestamps which have no AI-feed or human value.

### H. Migration ordering

- **H1 · Phase 0 prerequisite first** (§ 8). MCP smoke test gates everything.
- **H2 · Phase 1 ships entirely before Phase 2 starts.** Plugin must be Notion-aware before yesid.dev can adopt.
- **H3 · Phase 2 migrates Public-safe before Private** (smaller, easier-to-verify content first), Memory and Conversations last (operationally riskier — affects Claude auto-load and is bulkier).
- **H4 · Cloud delete + script retirement is the last step.** Only after all content is verified in Notion.

---

## 4. Notion workspace structure

```
Projects (workspace root)
│
├── yesid.dev
│   ├── Public-safe/       ← exports cleanly to public repo at going-public cutover
│   │   ├── Brand/
│   │   │   ├── BRAND
│   │   │   ├── Foundations/  (voice, visual-language, figma, …)
│   │   │   ├── Decisions/
│   │   │   ├── Examples/
│   │   │   └── Components
│   │   ├── Project/
│   │   │   └── STACK · SERVICES · BINDINGS · CONSTITUTION · PATTERNS · CSS · MOTION
│   │   ├── Roadmap/
│   │   │   ├── PLAN (with learn modules at end)
│   │   │   └── FUTURE_PHASES
│   │   └── Ops/
│   │       └── rollback (and future runbooks)
│   │
│   └── Private/           ← Claude-method, never published
│       ├── Slices/         (database — see § 5)
│       ├── Specs/          (plain pages, linked from Slices DB rows)
│       ├── Sessions/       (database — see § 5)
│       ├── Memory/         (plain pages + MEMORY index page)
│       ├── Conversations/  (database — see § 5)
│       └── Archive/        (frozen historical content; plain pages)
│
├── mgkdante/workflow      ← the plugin's own docs (sibling, not nested)
│   ├── WORKFLOW
│   └── Tools/  (claude-code, codex, …)
│
└── (future projects reuse the Public-safe / Private shape)
```

**Future-project shape is fixed.** Same `Public-safe` / `Private` two-folder pattern at every project root. The propagation prompt (§ 13) codifies this.

---

## 5. Database schemas

### Slices (`Projects/yesid.dev/Private/Slices/`)

| Property | Type | Notes |
|---|---|---|
| Title | Title | "Slice 18 — Directus CMS migration", etc. |
| Slice-N | Number | Sortable identifier |
| Status | Status | `planned` · `in-progress` · `closed` |
| Open date | Date | When work started |
| Close date | Date | When PR merged |
| PR link | URL | GitHub PR URL |
| Repo | Select | `yesid.dev`, `mgkdante/workflow`, future repos |
| Spec | Relation → `Specs/` | The design spec for this slice |

### Conversations (`Projects/yesid.dev/Private/Conversations/`)

| Property | Type | Notes |
|---|---|---|
| Title | Title | Auto-generated: `<date> — <slice-tag-or-summary>` |
| Date | Date | Session start time |
| Project | Select | `yesid.dev`, future projects |
| Slice tag | Relation → `Slices/` | Which slice this conversation contributed to (nullable) |
| Session ID | Text | Original `.jsonl` UUID, for traceability |
| Summary | Text | Brief auto-generated summary (1-3 sentences) |
| (body) | Page body | Full markdown-converted transcript |

### Sessions (`Projects/yesid.dev/Private/Sessions/`)

| Property | Type | Notes |
|---|---|---|
| Title | Title | `Session YYYY-MM-DD — <brief>` |
| Date | Date | |
| Project | Select | |
| Slices touched | Relation → `Slices/` | Multi-relation |
| Brief summary | Text | 1-2 sentences |
| (body) | Page body | Session log content |

---

## 6. Per-class content disposition

The table below captures the design intent at a class level. The full per-file inventory (every path under `brand/`, `docs/`, `~/.claude/`) is produced by an audit step at the start of Phase 2 implementation, surfacing edge cases that are class-ambiguous (e.g., `brand/examples/*.svelte.txt` are code-reference, stay in repo; `docs/_TEMPLATES/` may be plugin-managed, disposition resolved against the Phase 1 outcome).

| Class | Content | Pre-arc location | Post-arc canonical | Repo state post-arc |
|---|---|---|---|---|
| **Code-coupled (irreducible local)** | Source code, configs, generated artifacts (`DESIGN.md`), brand assets pipelines consume | Repo | Repo | Tracked in git, no Notion mirror |
| **Tool-required local** | `CLAUDE.md`, `AGENTS.md`, `README.md`, `LICENSE`, `.mcp.json`, `.claude/`, `.githooks/` | Repo | Repo (some become thin pointers post-Phase 1) | Tracked in git, content is meta/pointer |
| **Class 2 — Living docs (Public-safe)** | `brand/*.md` narrative · `docs/project/*` · `docs/roadmap/PLAN.md` + `FUTURE_PHASES.md` · `docs/ops/*` · `docs/README.md` · `docs/_TEMPLATES/*` (if plugin-orphaned) · `docs/ai-memory/*` (if not code-coupled) | Repo + cloud mirror | Notion `Public-safe/*` | Removed from repo; gitignored |
| **Class 3 — Plugin docs** | Plugin's own `WORKFLOW.md`, `tools/*` | Pulled from `mgkdante/workflow` into `docs/reference/` | Notion `mgkdante/workflow/*` | Removed from yesid.dev repo; consumer fetches via MCP |
| **Class 1b — Slice docs (Private)** | `docs/slices/slice-N/*`, `docs/superpowers/specs/*`, `docs/superpowers/research/*` | Repo + cloud mirror | Notion `Slices` DB + `Specs/` pages | Removed from repo; gitignored |
| **Class 1b — Sessions** | `docs/sessions/*` | Repo + cloud mirror | Notion `Sessions` DB | Removed from repo; gitignored |
| **Class 4 — Strategic memory** | `~/.claude/projects/<hash>/memory/*.md` | Disk only (already outside repo) | Notion `Memory/` | N/A (was never in repo); local copy auto-pulled by SessionStart hook |
| **Class 1a — Conversations** | `~/.claude/projects/<hash>/<uuid>.jsonl` + cloud archive | Disk + cloud archive | Notion `Conversations` DB (markdown body) | N/A (was never in repo); local `.jsonl` deleted after Notion confirmation |
| **Frozen historical** | `docs/ARCHIVE.md`, cloud `~/Yesito/cloud/yesid.dev/docs/archive/*` | Repo + cloud | Notion `Archive/` | Removed from repo; gitignored |
| **Stale (delete, do not migrate)** | `~/Yesito/cloud/yesid.dev/docs/learn/` | Cloud only (not in repo) | None | N/A (deleted) |
| **`.remember/` session buffer** | `.remember/` in repos | Local | Local (unchanged this arc) | Tracked or gitignored as currently configured |

---

## 7. Sync mechanisms

### Memory mirror (Notion → local)

- **Trigger:** Claude Code SessionStart hook
- **Source:** `Projects/yesid.dev/Private/Memory/*` pages via Notion MCP
- **Destination:** `~/.claude/projects/<project-hash>/memory/*.md`
- **Behavior:**
  - Pull all pages → write to local files (overwrite)
  - Files in Notion not present locally → create
  - Files local but not in Notion → delete (Notion is canonical)
  - Network failure / MCP unavailable → log error, leave local files as-is
- **Implementation:** small TypeScript script registered as a SessionStart hook in `~/.claude/settings.json`

### Memory writes (local action → Notion)

- **Trigger:** Claude saving or updating a memory mid-session
- **Mechanism:** Claude calls Notion MCP write tools directly
- **Local file:** does not update mid-session; refreshes at next SessionStart pull
- **Within-session consistency:** Claude has the just-written content in conversation history; auto-memory section in system prompt is one-pull stale, accepted

### Conversation push (local → Notion)

- **Trigger:** Claude Code SessionStop hook (or scheduled periodic if SessionStop unavailable)
- **Source:** the `.jsonl` files in `~/.claude/projects/<project-hash>/` since the last successful push
- **Destination:** `Conversations` database in Notion
- **Behavior:**
  - For each new `.jsonl`: parse → convert to markdown (per § 3.G) → create database row with metadata + body
  - On success: delete the local `.jsonl` (Notion is canonical)
  - On failure: leave local file in place; retry on next SessionStop
- **Implementation:** TypeScript script replacing `archive-conversations.ts`

### Failures and retries

- All hooks log to a known location (e.g., `~/.claude/logs/notion-hooks.log`) so silent failures are diagnosable.
- No retry queue persistence — simple "next-trigger retries any pending work" is enough at solo scale.

---

## 8. Phase 0 — Prerequisite (one short session)

1. Create Notion **Projects** workspace (or designate the Workspace if already created)
2. Build the page tree per § 4: `yesid.dev/{Public-safe, Private}` skeleton + `mgkdante/workflow/` skeleton
3. Create the three databases (Slices, Conversations, Sessions) with the schemas in § 5
4. Install the Notion MCP server in **both** repos:
   - `yesid.dev/.mcp.json` — add `notion` server entry
   - `mgkdante/workflow/.mcp.json` — same
5. OAuth flow via `/mcp` in each repo session — confirm authentication
6. **Smoke test (gates the rest):**
   - Read a test page via MCP
   - Write a test page via MCP
   - Create a test row in the Slices DB and read it back
   - Verify the toggle-block-with-collapse pattern (used for tool results in § 7) renders correctly
7. **If smoke test fails:** revisit Q8/Q9 before declaring spec ready for `writing-plans`. Failure modes to watch for: rate limits, fidelity loss in markdown round-trip, block-API surprises.

---

## 9. Phase 1 — Workflow plugin Notion-aware (PR in `mgkdante/workflow`)

### 9.1 Plugin self-docs migration

- Move `WORKFLOW.md` and all of `tools/*` to Notion `Projects/mgkdante/workflow/` page tree
- Update plugin source to fetch self-docs from Notion via MCP (no longer ship as files in the plugin package)

### 9.2 Per-project Notion-root config

- New config field telling the plugin where each consumer project's Notion subtree lives
- Likely shape: `notionRootPageId` in `.claude/settings.json` of each adopting project (TBD during implementation)
- Plugin reads this on every command invocation to know which project's data to operate on

### 9.3 Command migration — file I/O → Notion MCP

| Command | Old behavior | New behavior |
|---|---|---|
| `/workflow-slice-open` | `mkdir docs/slices/slice-N/` + scaffold files | Create row in Slices DB with `status=planned`, scaffold linked Specs/Plan/Handoff pages |
| `/workflow-close-slice` | Update slice files, draft `handoff.md` + PR body | Update Slices row `status=closed`, write Handoff page, update PR link property |
| `/workflow-handoff` | Write `handoff.md` to slice dir | Create/update Handoff page linked from Slices row |
| `/workflow-status` | Read slice dirs, report current state | Query Slices DB for active rows, report |
| `/workflow-add` | Install plugin scaffold in a new project | Provision Public-safe/Private subtree in Notion + write minimal `CLAUDE.md`/`AGENTS.md`/`.mcp.json` to repo |
| `/workflow-mirror` | Mirror to cloud | **Retired** (no cloud target) — or repurposed as `/workflow-memory-pull` for the memory mirror sync |
| `/workflow-pull` | Sync project to latest plugin scaffold | Fetch updated `mgkdante/workflow/` Notion content into local pointer files (or no-op if all docs are MCP-fetched) |
| `/workflow-clean` | Remove scaffold artifacts | Update for the new Notion-canonical layout (which has fewer repo artifacts to clean) |
| `/workflow` | Orchestrator | Updated to dispatch to the new commands |
| `/workflow-update` | Contribute upstream | Stays mostly file-based (it modifies the plugin source itself) |
| `/workflow-trim` | Remove local copies the mirror manifest covers | **Retired** if there are no longer mirror manifests |

### 9.4 End-to-end test

- Test against a sandbox Notion workspace (separate from yesid.dev's, so we don't pollute production data during development)
- Run a full slice lifecycle: open → handoff → close
- Verify all DB rows, page links, and properties are correct

### 9.5 Ship

- PR in `mgkdante/workflow` with all the above
- Tag a release (or version bump) so yesid.dev can pin to the Notion-aware version

---

## 10. Phase 2 — yesid.dev retrofit (PR in `yesid.dev`, depends on Phase 1)

### 10.1 Adopt Notion-aware plugin

- Update plugin reference to the new version
- Configure project's Notion root (per § 9.2)
- Run a quick `/workflow-status` to confirm wiring

### 10.2 Migrate Public-safe content (smallest first)

Order (each step ends with diff-verification before moving on):

1. **Content audit.** Walk `docs/`, `brand/`, surface every file. Classify against § 6. Resolve edge cases (e.g., `brand/examples/*.svelte.txt` are code-reference → stay in repo; `docs/_TEMPLATES/*` are plugin-managed → resolve against Phase 1 outcome; `docs/ai-memory/*.md` is auto-memory-system docs → likely stays in repo as code-coupled).
2. `docs/project/*` (`STACK`, `SERVICES`, `BINDINGS`, `CONSTITUTION`, `PATTERNS`, `CSS`, `MOTION`) → Notion `Public-safe/Project/`
3. `docs/roadmap/PLAN.md` and `docs/roadmap/FUTURE_PHASES.md` → Notion `Public-safe/Roadmap/`
4. `docs/ops/rollback.md` (and any other `docs/ops/*`) → Notion `Public-safe/Ops/`
5. `docs/README.md` → Notion `Public-safe/Project/` index page (or top-level README in the project page)
6. `brand/BRAND.md`, `brand/components.md`, `brand/foundations/*.md` (narrative), `brand/decisions/*.md`, `brand/examples/README.md` → Notion `Public-safe/Brand/`. **Stays in repo** (build pipelines + brand-voice content generators read them): `brand/logos/`, `brand/figma-exports/`, `brand/examples/*.svelte.txt` (code-reference), `brand/examples/*.png`, `brand/scripts/*.ts`.

### 10.3 Migrate Private content

4. `docs/superpowers/specs/*` → Notion `Private/Specs/` pages
5. `docs/superpowers/research/*` → Notion `Private/Specs/` (or sibling section, TBD during implementation)
6. `docs/slices/slice-N/*` → Notion `Slices` DB rows + linked detail pages (Spec / Plan / Handoff per slice)
7. `docs/sessions/*` → Notion `Sessions` DB rows
8. `docs/ARCHIVE.md` + `~/Yesito/cloud/yesid.dev/docs/archive/*` → Notion `Private/Archive/`

### 10.4 Delete cloud-only stale content

9. Delete `~/Yesito/cloud/yesid.dev/docs/learn/` (stale, future learn modules go at end of `Public-safe/Roadmap/plan` per § 10.2)

### 10.5 Migrate memory

10. `~/.claude/projects/<project-hash>/memory/*.md` → Notion `Private/Memory/`
11. Install SessionStart hook (§ 7) and verify it pulls Notion → local correctly
12. Run end-to-end: edit a memory in Notion, start a new session, confirm Claude's auto-load reflects the edit

### 10.6 Migrate transcripts

13. Run one-time `migrate-conversations.ts` over:
    - `~/.claude/projects/<project-hash>/<uuid>.jsonl` (active sessions, except current)
    - `~/Yesito/cloud/claude-config/user/<date>-yesid.dev-conversation-archive/<uuid>.jsonl` (historical)
14. Convert each to markdown per § 3.G; create Conversations DB rows
15. Verify a sample of migrated rows render correctly in Notion
16. Install SessionStop hook (§ 7) for forward sync
17. After verification: delete migrated `.jsonl` files locally (current session's `.jsonl` stays until session ends)

### 10.7 Slim repo root

18. Update `AGENTS.md` to a thin pointer (or remove if Phase 1 plugin no longer reads it as a file)
19. Update `CLAUDE.md` to a thin pointer (mostly the same; just notes that everything is in Notion)

### 10.8 Verify zero data loss

20. Diff cloud archive content against Notion — every file in cloud must exist as a Notion page (or be on the explicit-delete list, e.g., `learn/`)
21. Spot-check 3-5 files: open in Notion, compare to cloud copy, confirm content + structure preserved

### 10.9 Gitignore migrated paths

22. Add to `.gitignore` (illustrative — final patterns finalized after the § 10.2 step 1 audit; the goal is "narrative markdown ignored, code/assets preserved"):
    ```
    # Migrated to Notion (single source of truth)
    /docs/project/
    /docs/roadmap/PLAN.md
    /docs/roadmap/FUTURE_PHASES.md
    /docs/ops/
    /docs/superpowers/
    /docs/slices/
    /docs/sessions/
    /docs/ARCHIVE.md
    /brand/BRAND.md
    /brand/components.md
    /brand/foundations/*.md
    /brand/decisions/*.md
    /brand/examples/README.md
    # Brand assets + code stay in repo (NOT ignored):
    #   /brand/logos/, /brand/figma-exports/, /brand/examples/*.svelte.txt,
    #   /brand/examples/*.png, /brand/scripts/, /docs/ai-memory/, /docs/_TEMPLATES/
    ```
23. Remove the now-gitignored content from the working tree (it lives in Notion now). Local working copies that get re-pulled via MCP fetches don't re-enter git.

### 10.10 Delete cloud archive

24. Delete `~/Yesito/cloud/yesid.dev/` (entire subtree)
25. Delete the conversation archive subtree under `~/Yesito/cloud/claude-config/user/<date>-yesid.dev-conversation-archive/`
26. Optional: unset `YESITO_CLOUD_ROOT` env var if no other project uses it

### 10.11 Retire scripts

27. Delete:
    - [apps/web/scripts/mirror-brand.ts](../../../apps/web/scripts/mirror-brand.ts)
    - [apps/web/scripts/mirror-docs.ts](../../../apps/web/scripts/mirror-docs.ts)
    - [apps/web/scripts/archive-conversations.ts](../../../apps/web/scripts/archive-conversations.ts)
28. Remove their entries from [apps/web/package.json](../../../apps/web/package.json) (`brand:mirror`, `docs:mirror`, `conversations:archive`)
29. Remove the `brand/scripts/*` entries from [brand/scripts/](../../../brand/scripts/) if they were cloud-mirror specific (verify per file)

### 10.12 Document the new flow

30. Create `Projects/yesid.dev/Public-safe/Project/NOTION-WORKFLOW` page in Notion with:
    - The architecture (single Notion canonical, irreducible local set)
    - Links to all the Public-safe and Private subtrees
    - Memory mirror / conversation push mechanics
    - How to bootstrap a new device (clone repo + OAuth into Notion MCP + first SessionStart hook fires)

### 10.13 Generate propagation prompt

31. Generate the workflow-plugin propagation prompt as a text artifact (separate doc) so future projects bootstrap with Notion-aware workflow. Detail in § 13.

---

## 11. Trade-offs accepted

- **`Grep` across living docs stops working in-repo.** Notion's full-text search replaces it. Acceptable: code grep is preserved; living-doc grep is rare.
- **No atomic PRs for migrated docs.** PR descriptions reference Notion pages instead. Acceptable: the migrated docs are human-reference, not subject to code review.
- **Notion's 30-day page history vs git's permanent history.** Migrated content loses long-term line-level diff. Acceptable: code keeps git; human-reference docs don't need that fidelity.
- **MCP latency on first read.** Loading Notion pages into context at session start adds 1-3s + tokens vs instant local Read. Acceptable: one-time per session.
- **Stale-by-one-session memory mirror.** Local `MEMORY.md` auto-loaded into system prompt may be one session behind a recent Notion edit. Acceptable: memory is reflective, not real-time.
- **Lost `.jsonl` byte-fidelity.** Markdown body preserves all human/AI-meaningful content; loses internal IDs/timestamps. Acceptable per Q9.
- **Verbose tool results truncated by default (5000 char threshold).** Configurable; off if byte-fidelity preferred.
- **Multi-repo coordination.** Phase 1 ships in workflow repo, Phase 2 ships here, sequenced. Adds calendar time but not complexity.
- **MCP write failure during session loses one memory update.** Rare; user re-saves. No retry queue.

---

## 12. Verification gates

Before declaring this spec ready for `writing-plans`:

1. **Notion MCP smoke test (§ 8 step 6) passes.** If Phase 0 surfaces unexpected MCP behavior — rate limits, content fidelity issues, block-API quirks — revisit Q8/Q9 and revise this spec.
2. **A sample memory file round-trips losslessly** (write to Notion, pull to local, diff — must match).
3. **A sample `.jsonl` converts to markdown and re-renders in Notion correctly.** Toggle-block collapse works; long blocks split correctly; total page renders without timeout.

These verifications happen during Phase 0 implementation. If any fails, the spec changes before Phase 1 work begins.

---

## 13. Workflow-plugin propagation prompt (deliverable text artifact)

Generated at the end of Phase 2 (or on demand) and saved to a known location (Notion page or file in `mgkdante/workflow/`). Used when bootstrapping a NEW project (not yesid.dev, not the workflow plugin itself).

Sketch (final wording produced when writing-plans runs):

```
You are bootstrapping <project-name> with the Notion-aware workflow plugin.

Steps:
1. Run `/workflow-add` in this repo. The command will:
   - Provision a Notion subtree at `Projects/<project-name>/{Public-safe, Private}/`
   - Create the three databases (Slices, Conversations, Sessions) under Private/
   - Write minimal `CLAUDE.md`, `AGENTS.md`, `.mcp.json`, `.claude/settings.json` to the repo
   - Configure the per-project `notionRootPageId` (from § 9.2) in `.claude/settings.json`
2. OAuth into the Notion MCP via `/mcp` and confirm authentication.
3. Run `/workflow-status` to verify wiring.
4. Edit `CLAUDE.md` if the project has tool-specific guidance (most projects don't need this).
5. Start working — slice-open, handoff, close all flow through Notion automatically.

Out of the box, you get:
- Notion-canonical living docs (everything you author in `Public-safe/`)
- Auto-pulled memory mirror at session start
- Auto-pushed conversation transcripts at session end
- Going-public clean export from `Public-safe/*` when you decide to publish
```

The literal final wording is generated by `writing-plans` based on the Phase 1 plugin design once it lands.

---

## 14. Success criteria

- All eligible content migrated to Notion (per § 6 disposition table)
- All cloud-mirror scripts retired and `package.json` cleaned
- `~/Yesito/cloud/yesid.dev/` deleted; `~/Yesito/cloud/claude-config/user/<date>-yesid.dev-conversation-archive/` deleted
- Claude Code session-start auto-loads memory from local mirror (verified)
- Claude Code session-end pushes conversation to Notion (verified)
- Workflow plugin commands work end-to-end against yesid.dev's Notion
- Repo has only the irreducible local set (§ 3.A2); `git ls-files` produces no migrated paths
- Going-public dry-run: `Public-safe/*` content can be exported and renders in markdown
- Propagation prompt is published, reviewed, ready for use on the next project

---

## 15. Cross-references

- **Pre-arc state (cloud-mirror scripts):**
  - [apps/web/scripts/mirror-brand.ts](../../../apps/web/scripts/mirror-brand.ts)
  - [apps/web/scripts/mirror-docs.ts](../../../apps/web/scripts/mirror-docs.ts)
  - [apps/web/scripts/archive-conversations.ts](../../../apps/web/scripts/archive-conversations.ts)
- **AGENTS.md** (workflow contract): [AGENTS.md](../../../AGENTS.md)
- **CLAUDE.md** (Claude Code role bindings): [CLAUDE.md](../../../CLAUDE.md)
- **Workflow plugin (external):** `mgkdante/workflow` (separate repo)
- **Auto-memory location:** `~/.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/`
- **Notion MCP (official):**
  - [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server)
  - [makenotion/claude-code-notion-plugin](https://github.com/makenotion/claude-code-notion-plugin)
  - [Notion MCP Get Started](https://developers.notion.com/guides/mcp/get-started-with-mcp)
- **Memory pointers (live):** [MEMORY.md](../../../../../.claude/projects/C--Users-otalo-Yesito-Projects-yesid-dev/memory/MEMORY.md) — relevant rows: completed-slices index, slice-design follow-ups, launch strategy

---

## 16. Post-implementation amendments (2026-04-27, during Phase 1 execution)

> The original spec was approved 2026-04-27 morning. Phase 1 implementation in `mgkdante/workflow` (commits `fb20b96` … `30957ce`, tagged `v0.4.0`) surfaced six deviations from the as-approved design. They are captured here rather than rewriting § 1–15 to preserve the original-design audit trail. Phase 2 (yesid.dev retrofit) consumes the amended design.

### A1. Specs as a DATABASE, not plain pages — supersedes § 3.E2 + § 4 + § 5

**Original (§ 3.E2):** *"Specs as plain pages, not a database — one page per spec, linked from the corresponding Slice DB row via a Notion relation."*

**Amendment:** Specs is a **fourth database** under each project's Notion subtree, alongside Slices, Conversations, Sessions. Notion's relation properties require database targets; a plain-page collection cannot be the destination of a relation. The Slices DB's `Spec` relation points at the Specs DB.

**Schema (post-amendment):** `Specs` DB has at minimum `Name (title)` — a loose container. Spec body content lives in the row body. Operator can add columns (Status, Owner, etc.) per project as the spec corpus develops.

**Frontmatter impact:** AGENTS.md scaffold's `notion.databases` field gains `specs` alongside `slices` / `conversations` / `sessions`. Adopting projects fill in four database UUIDs, not three.

### A2. Title column convention is "Name" — clarifies § 5

**Amendment:** Notion's title column is technically named `Name` regardless of its displayed label. Schema descriptions throughout § 5 should use `Name (title)` rather than `Title`. The user-visible label can still be customized to `Title` via Notion's column-display-name feature, but the underlying field name in the API and `notion-create-pages` calls is `Name`. Plugin SKILL.md instructions reflect this convention consistently.

### A3. Toggle markdown via `<details>/<summary>` — clarifies § 3.G2 + § 7

**Amendment:** Notion's toggle-block-with-collapse pattern (used for tool-result truncation in Conversations transcripts) is implemented in markdown via the standard HTML `<details>/<summary>` syntax. Notion's MCP-side markdown round-trip preserves this structure; the rendered Notion page shows native toggle blocks. Phase 0 smoke test (Task 0.10) verified this. Toggle content is searchable from Notion's full-text search (verified).

### A4. Flat per-project shape — supersedes § 3.D2 + § 4 (Public-safe / Private retired)

**Original (§ 3.D2):** *"Per-project shape (fixed). `Public-safe/` (exports to public repo at going-public cutover) + `Private/` (Claude-method, never published)."*

**Amendment (2026-04-27 user clarification):** Adopting projects use a **flat shape** under their Notion root. The earlier going-public-cutover rationale (export Public-safe to public repo) proved unnecessary in practice — projects expose public surface via their website + GitHub repo directly, NOT via a Notion-subtree export. The split was overhead with no payoff.

**New per-project shape:** Children of `Projects/<project>/` are flat:
- `Brand/` (with `Foundations`, `Decisions`, `Examples`)
- `Project/` (with seven seeded children: README, STACK, BINDINGS, ARCHITECTURE, TESTS, CONSTITUTION, VOCAB)
- `Roadmap`
- `Ops`
- `Memory` (plain page; Phase 2 SessionStart hook target)
- `Archive` (plain page)
- `Slices`, `Specs`, `Conversations`, `Sessions` databases

**yesid.dev existing structure:** the Phase 0 Notion bootstrap created Public-safe/Private under yesid.dev. That structure persists (not destructive to flatten retroactively). The plugin DEFAULT is flat going forward; existing Public-safe/Private projects continue to work via their stored DB UUIDs in AGENTS.md frontmatter (the SKILL.md doesn't need to know the structural shape — it operates on UUIDs).

**Phase 2 decision (2026-04-27):** keep — plan does not flatten Public-safe/Private. Plugin operates on the four DB UUIDs in `AGENTS.md` frontmatter; structural shape is moot.

**Phase 2 amendment (2026-04-28):** flatten — operator dropped Public-safe/Private split. yesid.dev is now eyes-only personal workspace; the going-public structural boundary proved unnecessary. All children of Public-safe and Private have been moved to direct children of `yesid.dev`. The fractal architecture (D-fractal-1) drove this — flat shape simplifies cascade walks and aligns yesid.dev with the plugin DEFAULT.

### A5. Plugin owns canonical content in its own Notion subtree — extends § 4

**Original (§ 4):** mgkdante/workflow as a sibling project page with `WORKFLOW` + `Tools/` children.

**Amendment:** the plugin's Notion subtree (`Projects/mgkdante/workflow/`) gained four additional canonical content pages:
- `ARCHITECTURE` — workflow plugin's own architecture (sibling to WORKFLOW)
- `VOCAB` — workflow vocabulary (replaces the pre-Phase-1 scaffold's `docs/reference/VOCAB.md`)
- `Templates/` — `Plan`, `Handoff`, `Spec`, `Session` templates (used by `/workflow-slice-open`, `/workflow-handoff`, etc.) PLUS a `Templates/Project/` subtree with seven seeds (README, STACK, BINDINGS, ARCHITECTURE, TESTS, CONSTITUTION, VOCAB) used by `/workflow-add` to provision adopting projects' `Project/` subtree
- `Roadmap` — database for tracking plugin work across versions

**Implication:** plugin author edits these in Notion; adopting projects pick up changes on the next slice-open / workflow-add. No plugin release cycle for template wording or vocab tweaks. Plugin source files (SKILL.md, DESIGN.md, CHANGELOG.md, README.md) still flow via `/workflow-update` PRs — those are code, not living docs.

### A6. Per-project DEFAULT skeletons are plugin DEFAULT, not Phase-2-only — extends § 9 + § 10.2

**Original framing:** § 10.2 listed `docs/project/{STACK, BINDINGS, ARCHITECTURE, TESTS, CONSTITUTION, VOCAB}` migration as Phase 2 work for yesid.dev specifically.

**Amendment (2026-04-27 user clarification "no yesid.dev-only features"):** the per-project DEFAULT skeletons are now plugin DEFAULT. `/workflow-add` provisions them at bootstrap for any adopting project — yesid.dev, future client projects, anyone. They live as child pages under `Projects/<project>/Project/`, seeded from the plugin-owned `Projects/mgkdante/workflow/Templates/Project/` subtree.

**Phase 2 implication:** for yesid.dev specifically, Phase 2's job for these skeletons becomes "merge any pre-existing local content into the now-provisioned Notion pages" rather than "design and provision them from scratch." Saves Phase 2 implementation effort and ensures parity with future adopters.

---

### Spec doc patches landed alongside

Plugin source documentation that consumed these amendments at v0.4.0 ship time:
- `mgkdante/workflow/docs/DESIGN.md` § D21 — formalizes the Notion MCP dependency reversal of zero-MCP principle.
- `mgkdante/workflow/plugins/workflow/CHANGELOG.md` — v0.4.0 entry.
- `mgkdante/workflow/plugins/workflow/skills/workflow-add/SKILL.md` — flat-shape provisioning + four-DB schema.
- `mgkdante/workflow/plugins/workflow/skills/workflow-slice-open/SKILL.md` — Templates/Plan + Templates/Handoff seeding.

For Phase 2 implementation: read this section AND § 1–15. The flat-shape clarification (A4) is the most behaviorally consequential — it changes the workspace-structure assumption Phase 2 retrofitting starts from.

---

## 17. Migration risk register (discovered during execution)

### R-9 (2026-04-28). Notion content-transform gotcha — markdown does not round-trip byte-identical

**Symptom:** `notion-update-page` with `command=update_content` fails with HTTP 400 "No matches found" because `old_str` matches the markdown that was originally sent, not the markdown that Notion actually stored after silent normalization.

**Root cause:** Notion silently normalizes content on store:
- Whitespace between headings and following blocks gets stripped (blank lines collapse).
- Bare code fences (triple backtick alone) get auto-tagged with a language guess (`javascript`, `markdown`, etc.).
- Tables may reflow column widths.
- Some link formats get rewritten (bare URLs become inline-anchored).

**Failure mode (high frequency during this retrofit):** every `update_content` call after a `create-pages` is vulnerable, because the in-memory body sent ≠ the stored body Notion holds.

**Mitigations (apply to every Notion edit in this migration):**

1. **Always `fetch` current content before `update_content`** with `old_str`. Construct `old_str` from the fetched stored body, never from in-memory markdown.
2. **Prefer structured properties over body markdown** for state that may be queried or updated later. Slice `Status`, dates, `PR link`, `Slice-N`, `Parent slice` → properties (byte-stable; safe with `update_properties`). Body markdown is only for one-shot narrative content.
3. **Prefer `replace_content` over `update_content`** when the diff is non-trivial. Pass `allow_deleting_content=false` to refuse orphaning children; include child pages in `new_str` via `<page url="...">` tags to preserve them.
4. **Avoid bare triple-backtick code fences.** Always specify a language explicitly (`text`, `bash`, `python`, `markdown`). Otherwise Notion injects its own language tag and future find-replace patterns break.
5. **Never assume "it worked once, the next edit will work the same way."** Notion's transforms can chain.

**Specific to this retrofit:**

- For each slice retrofit (`docs/slices/slice-NN/` → Slices DB row + Spec/Plan/Handoff trio), create the entire trio in ONE `notion-create-pages` call (atomic). Never edit afterward unless absolutely necessary.
- For appended content (e.g., `devlog.md` → Handoff body's `## Implementation devlog` section), construct the FULL final body in one `create-pages` call rather than create-then-append.
- For Sessions DB ingest, use `create-pages` per row; never bulk-update.

**Cross-references:** Documented same in `mgkdante/workflow > slice-2a Spec` (its instance of R-9). Future workflow-using projects should adopt this as canonical Notion-edit discipline.
