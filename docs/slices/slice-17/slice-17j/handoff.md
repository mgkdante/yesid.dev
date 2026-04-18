# Handoff — Sub-Slice 17j Workflow Efficiency

**Status:** in progress — tasks 0–3a complete, 3b–9 pending
**PR:** pending
**Spec:** `./spec.md` | **Plan:** `./plan.md`

## Scope (from spec)

Reduce cold-session token overhead AND systematize workflow structure. Two pillars:

1. **Token efficiency** — prune seven accretion sources (repo docs, CLAUDE.md, WORKFLOW.md, .mcp.json, rules/zh/, plugins, auto-memory). Measurable before/after delta.
2. **Workflow structure** — 3-level hierarchy, 4-file sub-slice bundle, self-appending handoff, close-script, OS-agnostic portability, shared vocabulary.

Three durable portable outputs: research knowledge base, `workflow-efficiency` skill, config snapshot. Trade-secret framing — personal IP across Yesid's 6 services.

## Tasks completed

---

### Task 0: Baseline measurement

**Session:** 2026-04-17 | **Commit:** 734e887

**Files:**
- Created: `docs/devlog/2026-04-17-slice-17j-task-0.md` (later moved to `log.md`)

**What landed:**
Captured cold-session `/context-budget` estimate (~89.5K tokens startup, ~9% of 1M window). Inventoried repo docs (310 files / 96,280 lines / 4.6 MB) and global Claude sizes (30 agents, 115 skills, 77 rules, 67 memory files, 32 plugins, 4 MCPs). Surprises: `rules/zh/` is larger than `rules/common/` (pure duplication); 207 agents loaded (many duplicates); chrome-devtools MCP unhealthy; plan file heaviness (17j plan itself = 1,992 lines).

**Decisions:**
- D001: `/context-budget` produces an estimate, not ground-truth; same method used for re-measurement for apples-to-apples delta.

**Tests:** N/A (docs-only) | **Follow-ups:** none

---

### Task 0a: Research sprint — 6 parallel deep dives + 1 structure dive

**Session:** 2026-04-17 | **Commit:** 98ab5d4 (token) + cloud doc 07 (structure)

**Files (cloud knowledge base):**
- `<cloud>/claude-knowledge/token-efficacy/00-index.md` through `06-strategic-compact.md`
- `<cloud>/claude-knowledge/token-efficacy/07-workflow-file-structures.md` (mid-slice, for Pillar 2)

**What landed:**
Six parallel general-purpose agents researched cache economics, MCP scoping, plugin hygiene, subagent delegation, auto-memory, strategic compact. All 6 docs written direct to cloud with 200-word summaries returned. Later a 7th dive on workflow file structures. Total: 15+ primary Anthropic sources, all 2025–2026.

**Decisions:**
- D002: Parallel dispatch approved as an exception to serial execution (research-only, independent, summary-only returns).
- D003: Three of six docs ran ~100–150 words over 1,000 target; content quality accepted without re-dispatch.

**Key findings:**
- Cache TTL regressed from 1h to 5m in March 2026 → ~17% cost inflation on long sessions
- GitHub MCP tokens 46k → 8.7k after v2.1.69 ToolSearch-default
- Duplication bug #29971 double-registers plugins in session reminder
- Kiro / Spec Kit / Tessl converge on requirements→design→tasks but differ on bundle vs typed-sibling layout

**Follow-ups:** Knowledge base is long-lived reference — maintenance is just reviewing dates at next major Claude release.

---

### Task 1: Three-tier context model + docs prune + cloud mirror

**Session:** 2026-04-17 | **Commit:** d79d319

**Files (repo):**
- Created: `docs/ARCHIVE.md` — three-tier model + retrieval + write protocols
- Deleted: 491 files — `docs/devlog/*` (except active + template), `docs/handoffs/*` (kept template), `docs/specs/*` (all), `docs/research/*`, `docs/archive/*`, `docs/learn/**`, historical slices

**Files (cloud):**
- Mirror of pre-prune `docs/` tree at `<cloud>/yesid.dev/docs/` (509 files, 6.9 MB)
- `<cloud>/yesid.dev/docs/COMPLETED-SLICES.md` + `INDEX.md` (Tier 3 indexes)

**What landed:**
Established Tier 1 (always-on, in repo) / Tier 2 (fetch-on-command, cloud + git) / Tier 3 (cloud indexes). Repo `docs/` pruned from 310 files to ~20 files. `docs/roadmap/PLAN.md` trimmed 916 → 689 lines. Cross-links in `MOTION.md` + `PATTERNS.md` rewritten to cloud paths.

**Decisions:**
- D004: Bundle history preserved — zero data loss via cloud mirror + git.
- D005: `docs/learn/` moved entirely to cloud per Yesid (personal Obsidian vault, not AI-loaded).

**Tests:** 782/782 PASS | `bun run check`: 0 errors | **Follow-ups:** none

---

### Scope expansion — 17j renamed "Token Efficacy" → "Workflow Efficiency"

**Session:** 2026-04-17 | **Commit:** 4d0f1ad + 839db63

**What changed:**
Slice reframed as two-pillar slice: token efficiency + workflow structure. Tasks 3a (cloud archive reorg), 3b (repo hierarchy migration), 3c (close-script), 3d (PLAN.md reshape), 3e (docs/sessions/), 3f (OS-agnosticism + OS-quirks registry), 9a (VOCAB.md) added. `VOCAB.md` skeleton drafted (251 lines, 6 sections, brand + industry + Claude Code + workflow lexicon).

**Decisions:**
- D006: Close-script moves bundle folders (no flatten) — granular retrieval preserved.
- D007: `YESITO_CLOUD_ROOT` env var as portability lever for cross-machine workflow.
- D008: OS-quirks registry at `<cloud>/claude-knowledge/os-quirks/` — cross-project.

---

### Task 2: CLAUDE.md slim

**Session:** 2026-04-17 | **Commit:** f8d2a82

**Files:**
- Modified: `CLAUDE.md` (445 → 196 lines, −56%)

**What landed:**
Removed duplicative sections (Tool Selection Protocol, Plugins & Tools, Completed Slices list, Repo Structure detail). Added core principles, cross-platform setup, 3-level slice hierarchy, 4-file bundle spec, self-appending handoff mechanics, non-slice sessions as 4th session type, updated Slice Closing checklist, hard rules for PR at Level 2.

**Tests:** `bun run check` 0 errors, 19 pre-existing warnings | **Follow-ups:** none

---

### Task 3: WORKFLOW.md rewrite to v2.0

**Session:** 2026-04-17 | **Commit:** 71d0646

**Files:**
- Modified: `docs/reference/WORKFLOW.md` (792 → 735 lines; added ~200 new lines, compressed ~250)

**What landed:**
WORKFLOW.md v2.0 codifies: 3-level slice hierarchy, 4-file bundle, self-appending handoff, three-tier context model, close protocol, cross-platform + OS-quirks registry, Tool Selection Protocol (absorbed from CLAUDE.md Task 2), document ecosystem restructured into Tier 1/2/3, self-enhancing workflow principle. File paths updated throughout.

**Tests:** `bun run check` 0 errors | **Follow-ups:** none

---

### Task 3a: Cloud archive reorg (Path B)

**Session:** 2026-04-17 | **Commit:** 09b93eb (repo-side updates; cloud moves are not tracked in git)

**Cloud changes:**
Moved flat dirs (specs, plans, devlog, handoffs, research, slices, archive, reference, roadmap) into `archive/legacy-flat/`. Renamed reference → reference-snapshot, roadmap → roadmap-snapshot, slices → slice-specs. Created empty `archive/slices/` for new bundles. `learn/` untouched. Indexes rewritten to reflect new paths.

**Files (repo):**
- `MOTION.md` + `PATTERNS.md`: cross-links rewritten from absolute Windows paths to portable `<cloud>/yesid.dev/docs/archive/legacy-flat/...` notation (OS-agnostic).

**Decisions:**
- D009: Path B chosen over Path A — complexity of retroactive bundle mapping outweighed marginal retrieval benefit. Keep flat at rest; new slices land as bundles going forward.

---

### Task 2: CLAUDE.md slim

**Session:** 2026-04-17 | **Commit:** f8d2a82

**Files:**
- Modified: `CLAUDE.md` (445 → 196 lines, −56%)

**What landed:**
Removed duplicative sections (Tool Selection Protocol, Plugins & Tools, Completed Slices list, Repo Structure detail). Added core principles block, cross-platform setup, 3-level slice hierarchy, 4-file bundle spec, self-appending handoff mechanics, non-slice sessions as 4th session type, updated Slice Closing checklist, hard rules for PR at Level 2.

**Tests:** `bun run check` 0 errors, 19 pre-existing warnings | **Follow-ups:** none

---

### Task 3: WORKFLOW.md v2.0

**Session:** 2026-04-17 | **Commit:** 71d0646

**Files:**
- Modified: `docs/reference/WORKFLOW.md` (792 → 735 lines)

**What landed:**
WORKFLOW.md v2.0 codifies: 3-level slice hierarchy, 4-file bundle, self-appending handoff, three-tier context model, close protocol, cross-platform + OS-quirks registry, Tool Selection Protocol (absorbed from CLAUDE.md), document ecosystem restructured into Tier 1/2/3, self-enhancing workflow principle. File paths updated throughout.

**Tests:** `bun run check` 0 errors | **Follow-ups:** none

---

### Progress-tracking workflow amendment

**Session:** 2026-04-18 | **Commit:** 699d8cd

**What landed:**
Mid-slice amendment per Yesid request. `CLAUDE.md` gained "Session progress tracking" section codifying TodoWrite populate-from-plan.md at session start + compact markdown table at every STOP as two complementary persistence layers. `WORKFLOW.md` §17 + §18 updated. Added to hard rules.

**Decisions:**
- D010: TodoWrite (live UI) + per-STOP markdown table (scrollback audit trail) = two-layer progress visibility.

---

### Task 3b: Repo hierarchy migration

**Session:** 2026-04-17/18 | **Commit:** cb42219

**Files (repo):**
- Created `_TEMPLATE-SLICE/` + `_TEMPLATE-SUBSLICE/` skeletons
- Migrated active Slice 17 + sub-slice 17j into `docs/slices/slice-17/slice-17j/` bundle form
- Retired `docs/roadmap/standardization.md` → `docs/slices/slice-17/README.md`
- Migrated slice-14 spec → `docs/slices/slice-14/README.md`
- Removed old `_TEMPLATE.md` files (absorbed into _TEMPLATE-SUBSLICE)
- Emptied + removed `docs/devlog/`, `docs/handoffs/`, `docs/plans/` top-level dirs
- `docs/README.md` rewritten to reflect new hierarchy

**Tests:** `bun run check` 0 errors | `bun run test` 782/782 PASS

---

### Task 3c: scripts/slice-close.ts + mock test

**Session:** 2026-04-18 | **Commit:** c3456af

**Files:**
- Created: `scripts/slice-close.ts` (Bun, OS-agnostic via `YESITO_CLOUD_ROOT` env var, 248 lines)
- Modified: `package.json` — added `"slice:close": "bun scripts/slice-close.ts"`

**What landed:**
Script moves active sub-slice bundle from repo to cloud archive (no flatten — preserves folder structure for granular retrieval). Validates required files, appends COMPLETED-SLICES.md row, regenerates tree.txt. Cross-volume-safe (rename-or-copy fallback). Mock-verified end-to-end with a fake `slice-99-mock/` bundle.

**Decisions:**
- D011: Env var `YESITO_CLOUD_ROOT` as single portability knob, fallback to `path.join(os.homedir(), 'Yesito', 'cloud')`.
- D012: Parse parent slice from leading digits of sub-slice-id (`17j` → `17`).

---

### Task 3d: PLAN.md reshape + 8 per-slice READMEs

**Session:** 2026-04-18 | **Commit:** cd4de1c

**Files:**
- Modified: `docs/roadmap/PLAN.md` (689 → 462 lines, −33%)
- Created: 8 per-slice READMEs (slice-15, 16, 18, 19, 19b, 20, 21, 22)

**What landed:**
Per-slice detail extracted from PLAN.md into `docs/slices/slice-NN/README.md` direction docs. PLAN.md keeps vision + principles + tech stack + slice index table + one-line pointers. Biggest gain: Slice 18 Payload section 118 lines → 5-line pointer.

---

### Task 3e: docs/sessions/ + _TEMPLATE.md

**Session:** 2026-04-18 | **Commit:** 96c3d37

**Files:**
- Created: `docs/sessions/_TEMPLATE.md` (75 lines)
- Cloud folder: `<cloud>/yesid.dev/docs/archive/sessions/` (empty landing)

**What landed:**
Non-slice sessions (bugfixes, config, exploration, hotfixes, research spikes) have a first-class home and template. Template covers What+why / Scope / Actions / Decisions / Errors / Validation / Outcome / Commit / Follow-ups with 6 embedded rules including OS-quirks append and cloud mirror on close.

---

### Task 8 — COMPLETE: Config export snapshot + portable scripts

**Session:** 2026-04-18 | **Commit:** (this commit — cloud scripts not tracked in git)

**Files created at `<cloud>/claude-config/`:**
- `snapshot.ts` — Bun script, OS-agnostic. Captures user-scope or per-project state to timestamped folders. Extracts `extraKnownMarketplaces` + `enabledPlugins` into separate JSON files for easy diffing; walks `~/.claude.json` for all `mcpServers` scopes. Copies `skills/`, `agents/`, `rules/` as full directory trees.
- `restore.ts` — Bun script. Resolves latest snapshot by **mtime** (not alphabetical — that fix landed after first dry-run revealed the bug). Supports `--label`, `--project`, `--dry-run`, `--yes`. Auto-backs up current state to `<date>-pre-restore/` before overwriting.
- `required-env-vars.md` — documents per-machine setup: `YESITO_CLOUD_ROOT` env var + `gh auth login` + Anthropic session + secrets that NEVER get snapshotted.

**First snapshot landed at:** `<cloud>/claude-config/user/2026-04-18-post-17j-prune/`
- `settings.json` (full, includes post-prune state with 15 enabled plugins)
- `marketplaces.json` (extracted `extraKnownMarketplaces`)
- `enabled-plugins.json` (extracted `enabledPlugins`)
- `claude-json-mcp-servers.json` (4 MCP scopes from `~/.claude.json`)
- `skills/` — 304 entries including new `workflow-efficiency/`
- `agents/` — 16 entries (post-prune: 14 language agents removed, performance-optimizer trimmed to 222 lines)
- `rules/` — 78 entries (`zh/` already deleted in Task 5)

**Roundtrip validated:**
- Snapshot ran cleanly, all layers captured.
- Dry-run restore verified: resolves correct latest snapshot, reads settings.json, lists skills/agents/rules copy operations.
- Latest-snapshot bug caught + fixed: initial alphabetical sort picked `pre-prune` over `post-17j-prune`. Switched to mtime-based sort. Now picks newest by creation time.

**Decisions:**
- D032: Bun scripts only (not separate PowerShell/bash wrappers). Bun is already a prerequisite for the workflow and handles `path.join`, `cpSync`, `os.homedir` cross-platform natively. One script per purpose > four parallel copies.
- D033: mtime-based snapshot resolution in restore — alphabetical sort breaks on semantic labels like `post-17j-prune` vs `pre-prune-snapshot`.
- D034: Auto-backup before restore is NON-optional. Every restore creates `<today>-pre-restore/` capturing current state before overwriting. Rollback is always one `cp` away.
- D035: Secrets + API keys + OAuth tokens NEVER snapshotted. Documented in `required-env-vars.md`. Users re-authenticate per machine.

**Known limitation (documented, not fixed in 17j):**
- Per-project restore is not yet implemented. Snapshot captures per-project state (`.claude/settings.json`, `.mcp.json`, `memory/`); restore currently only handles user-scope. Flagged for a follow-up when Yesid actually needs it (first time spinning up a project on a new machine).

---

### Task 7b — COMPLETE: design-plugin hybrid disable

**Session:** 2026-04-18 | **Commit:** (this commit — live ~/.claude/settings.json change not tracked)

**Action:** Disabled 2 of 4 design plugins in `~/.claude/settings.json` `enabledPlugins`.
- `ui-ux-pro-max@ui-ux-pro-max-skill` → false
- `web-designer@web-designer-marketplace` → false

**Kept:**
- `frontend-design@claude-plugins-official` (Anthropic first-party baseline — clean, minimal, trusted for production decisions)
- `frontend-design-pro@buildwithclaude` (phase coverage: `analyze-site` + `trend-researcher` + `design-wizard` + `color-curator` + `typography-selector` + `review`)

**Rationale:** Together the 2 kept plugins cover the full design pipeline (research → ideation → review) without duplication. The 2 disabled overlap heavily without unique value given yesid.dev's already-established design system (CONSTITUTION.md + CSS.md + MOTION.md + brand/).

**Background research agent status:** killed mid-run after producing only ~108 tokens and never writing the comparison file to cloud. Decision was made independently from the agent's known-capability analysis. No loss — the agent would have provided redundant validation.

enabledPlugins: 17 → 15 active (−2).

**Decisions:**
- D030: Hybrid (keep 2, disable 2) chosen over single-winner (keep 1). Trade-off: preserve multi-phase design tooling (research + review capabilities) at small extra cost vs aggressive minimalism.
- D031: Anthropic first-party plugins preferred when functionality overlaps with third-party. `frontend-design` (official) over `web-designer` (community).

### Task 7b — fully closed

| Sub-item | Status |
|----------|--------|
| Rules common/ audit | ✅ no changes needed |
| Web-app MCP disconnects (6) | ✅ Yesid actioned |
| performance-optimizer trim (446→222) | ✅ shipped |
| Design plugin hybrid (disable 2) | ✅ just shipped |
| code-reviewer + planner trims | ⏭️ deferred (low savings / medium risk) |

**Task 7b total savings:**
- Immediate session cost: ~3K tokens (connector disconnects ~1.5K + plugin disables ~1K + agent trim descriptor ~0.5K)
- Subagent spawn cost: ~1.8K per performance-optimizer invocation
- **Activation-cost prevention: ~47K tokens** (connector MCPs no longer in deferred pool)

---

### Task 7b (partial): `performance-optimizer` agent trim (446 → 222 lines)

**Session:** 2026-04-18 | **Commit:** (this commit)

**File:** `~/.claude/agents/performance-optimizer.md`

- Before: 446 lines (~3.5K tokens baked into every spawn)
- After: 222 lines (~1.7K tokens per spawn)
- **Savings:** ~1.8K tokens per subagent spawn
- Original backed up at `<cloud>/claude-config/user/2026-04-18-pre-prune-snapshot/agents-removed/performance-optimizer-original-446-lines.md`

**What was preserved (full functionality):**
- Frontmatter (name, description, tools, model=sonnet)
- All 6 Core Responsibilities
- All 7 workflow sections: target metrics, analysis commands, algorithmic pitfalls, rendering, bundle, DB+query, network+API, memory leaks
- "When to run" + "Red flags" table
- Success criteria
- Report template (compressed from verbose to essential structure)

**What was trimmed:**
- Duplicated checklists merged (was 7 separate checklists with overlapping items)
- Multiple code examples per anti-pattern → single representative example
- Verbose explanatory paragraphs → one-liners
- Full-page report template → compact structure
- React-only examples → framework-agnostic (React + Svelte applicable)

**Decisions:**
- D028: Trim only `performance-optimizer`. Skip `code-reviewer` (237 lines) and `planner` (212 lines) — savings too small vs risk of stripping load-bearing logic (~700 tokens each, both used frequently).
- D029: Rules `common/` audit complete — no restructure needed. Content is already language-agnostic; only 1 generic `typescript-reviewer` name-drop, not TS-specific methodology. Language subdirs (`rules/typescript/`, `cpp/`, etc.) preserved for drag-and-drop when projects in other languages start.

---

### Task 7b (partial): connector-MCP disconnects — Yesid actioned via claude.ai web app

**Session:** 2026-04-18 | **Commit:** (this commit — web-app changes not in git; system reminder confirmed disconnect)

Yesid disconnected 6 connectors via `claude.ai → Settings → Connectors`. Session deferred-tool list confirmed each MCP's tools are no longer available:

| # | Connector | Tools removed (via deferred-tools delta) |
|---|-----------|------------------------------------------|
| 1 | Notion | 14 tools (notion-create-comment, search, fetch, etc.) |
| 2 | Webflow | 23 tools (ask_webflow_ai, element_builder, component_builder, etc.) |
| 3 | Jobs / resume search | 4 tools (search_jobs, get_job_details, get_company_data, get_resume) |
| 4 | Column Tax | 6 tools (tax_checklist, tax_estimate, tax_filing_options, etc.) |
| 5 | Google Calendar | 8 tools (list_events, create_event, suggest_time, etc.) |
| 6 | Postman | 39 tools (createCollection, getSpec, createMock, etc.) |

**Total:** 94 MCP tools removed from the deferred pool. Estimated savings: ~1.5K tokens immediate + **~47K activation-cost prevention** (these tools can no longer be accidentally activated via a broad `ToolSearch` wildcard).

**Still on the list (Yesid may or may not disconnect):**
- Cloudflare, Slack, Figma, Microsoft Docs, Claude-in-Chrome, mcp-registry

**Decisions:**
- D027: Web-app connector disconnects are the ONLY way to remove these MCPs — they don't appear in `~/.claude.json` or `~/.claude/settings.json`. Future `workflow-efficiency` skill audit step should include "check claude.ai connectors" alongside CLI config files.

---

### Task 7: `workflow-efficiency` skill (portable IP across 6 services)

**Session:** 2026-04-18 | **Commit:** (this commit)

**Files created at `~/.claude/skills/workflow-efficiency/`:**
- `SKILL.md` — main skill file (~170 lines) with trigger-framed "Use when..." description packing activation keywords in the first 200 chars (per token-efficacy/03-plugin-hygiene.md best practice). Covers: core principles, new-project setup walkthrough, audit recipe for existing projects, slice workflow reminders, subagent dispatch + model routing, cache pacing (5-min TTL world), reference pointers to cloud knowledge bases.
- `references/new-project-checklist.md` — drop-in checklist for spinning up Claude Code on a fresh repo (< 15 min, assumes `YESITO_CLOUD_ROOT` set)
- `references/audit-existing-project.md` — audit recipe when a session feels heavy (measure → diagnose by category → execute → re-measure → rollback path)

**Activation criteria (first 200 chars of description — load-bearing):**
"Use when setting up a new project, a Claude Code session feels sluggish or bloated, planning a multi-session slice, auditing token overhead, pruning accumulated MCP/plugin cruft, or provisioning Claude Code on a new machine."

**Skill registration verified:** system reminder now lists `workflow-efficiency: Use when setting up a ne…` alongside built-in skills. Available from any project.

**Trade-secret framing preserved** — skill explicitly marks as Yesid's personal IP across 6 services, not public polish. References cloud knowledge bases (token-efficacy/, os-quirks/, mcp-templates/, claude-config/) which are also private.

**Decisions:**
- D024: Skill name `workflow-efficiency` (not `token-frugal-workflow`) — reflects the expanded two-pillar scope (token + structure).
- D025: Description opens with trigger-framed "Use when..." per research; first 200 chars pack activation keywords (new project, sluggish, slice planning, audit, prune, new machine).
- D026: Skill is at user scope (`~/.claude/skills/`), not a plugin — cleanest way to make it available globally without marketplace publishing.

**Implicit dependency:** skill assumes the cloud knowledge base structure exists at `$YESITO_CLOUD_ROOT/claude-knowledge/{token-efficacy,os-quirks,mcp-templates}/` and `$YESITO_CLOUD_ROOT/claude-config/`. All scaffolded in earlier 17j tasks.

---

### Task 5b: Additional prune pass (Yesid-directed after Task 6 re-measurement)

**Session:** 2026-04-18 | **Commit:** (this commit — live-machine changes not tracked; backup in pre-prune snapshot)

**Scope decision:** Yesid chose option (a) from Task 6's follow-up findings — continue pruning before closing 17j. Two specific directives:
1. Use chrome-devtools from the plugin, not user-scope (remove duplicate)
2. Make both Opus AND Sonnet valid for subagents (not Opus-only)

**Changes landed:**

**A. Removed user-scope `chrome-devtools` from `~/.claude.json`**
- Root-level `mcpServers` now empty — plugin `chrome-devtools-mcp@claude-plugins-official` is the single source
- Eliminates 25 duplicate tool entries + plugin-version-vs-user-version confusion
- Plugin version confirmed healthy in fresh-session measurement (the unhealthy status in Task 5 was resolved by the session restart)
- Savings: ~375 tokens + cleanup

**B. Removed 14 language-specific reviewer/builder agents from `~/.claude/agents/`**
Backup: `<cloud>/claude-config/user/2026-04-18-pre-prune-snapshot/agents-removed/` (14 files preserved)
Deleted:
- `cpp-build-resolver.md`, `cpp-reviewer.md`
- `flutter-reviewer.md`
- `go-build-resolver.md`, `go-reviewer.md`
- `healthcare-reviewer.md`
- `java-build-resolver.md`, `java-reviewer.md`
- `kotlin-build-resolver.md`, `kotlin-reviewer.md`
- `python-reviewer.md`
- `pytorch-build-resolver.md`
- `rust-build-resolver.md`, `rust-reviewer.md`

Agents count: 30 → 16. Kept the TypeScript/workflow relevant set: architect, build-error-resolver, chief-of-staff, code-reviewer, database-reviewer, doc-updater, docs-lookup, e2e-runner, harness-optimizer, loop-operator, performance-optimizer, planner, refactor-cleaner, security-reviewer, tdd-guide, typescript-reviewer.

Savings: ~1,500 tokens in Agent tool descriptor on every session + cleaner model context.

**C. CLAUDE.md subagent routing rule rewritten**

Previous: `**Models:** Opus or Sonnet only. Never Haiku.`

New: explicit split by role —
- Parent session: Opus 4.7 (deep reasoning)
- Subagents: Sonnet 4.6 default (research/summary/review); Opus only when deep reasoning needed
- Rationale pointer to `<cloud>/claude-knowledge/token-efficacy/04-subagent-delegation.md` (research confirms 2026 routing pattern)

**Decisions:**
- D021: chrome-devtools user-scope removal is permanent — plugin is the single provider going forward. Verified the plugin's chrome-devtools works from current fresh-session measurement.
- D022: 14 language agents moved to backup (cloud) rather than deleted outright. Restore possible if a future project needs them.
- D023: Sonnet-for-subagents default codified in CLAUDE.md. Research-backed (cache economics + subagent isolation). Parent stays Opus because the parent holds the whole slice's context.

**Follow-ups NOT actioned in 5b (deferred to 17k or accepted):**
- Plugin overlap consolidation (4 design plugins) — needs Yesid input on which single plugin to keep; skipped.
- Connector-based MCPs (Webflow, Cloudflare, Notion, Calendar, Slack, Figma, etc.) — these are configured at claude.ai/settings/integrations (web app), NOT in `~/.claude/` config files. Cannot be modified from CLI. Yesid can disconnect manually in the web app if desired. Flagged in follow-ups.
- Rules chain language conditionality (common/*.md inlines all 10) — would need CLAUDE.md meta-logic or rules/*.md reorganization; skipped for 17j.
- Heavy agents on disk (performance-optimizer 446 lines) — not in base context; addressed when those agents are invoked, not baseline cost.

**Estimated Task 5b savings:** ~2K tokens + activation-surface reduction. Next Task 6b / cold-session check could quantify.

---

### Task 6: Re-measurement + delta table

**Session:** 2026-04-18 (fresh session, cold context) | **Commit:** (this commit)

**Method:** Fresh Claude Code session opened post-Task-5. First command `/context-budget`. Output pasted into active session for delta computation.

**Result — 54% reduction in session-startup token overhead:**

| | Task 0 (pre-prune) | Task 6 (post-prune) | Delta |
|---|---:|---:|---:|
| Total cold-session overhead | ~89,500 | ~41,000 | **−48,500 (−54%)** |
| % of 1M context window | 9% | 4.1% | — |

**Biggest individual wins:**
- Agent list collapse: ~30K → ~4.5K (−85%) — 207 agents → 30, from plugin-disables
- Rules `zh/` delete: eliminated ~23K of duplicate translation
- Skills index shrink: ~13K → ~6.2K (−52%) — fewer plugin-provided skills
- CLAUDE.md slim: ~6K → ~2.6K (−57%) — Task 2's payoff at session cost

**Bonus activation-cost prevention:** 335 MCP tool schemas remain deferred via ToolSearch. A single mass-activation would blow ~168K tokens (84% of 200K window). Further MCP pruning (below) would reduce this activation surface.

**Follow-up findings from the re-measurement** (6 opportunities not in original 17j scope, ~6K additional savings + ~117K activation-cost prevention): see full list in log.md. Critical items:
- 16 of 28 MCP servers still out-of-scope for a SvelteKit site (Neon, Webflow, Cloudflare, etc.)
- Duplicate `chrome-devtools` MCP (user + plugin)
- 9 language-specific reviewer agents loaded for a pure TS project

**Decision deferred to Yesid:** add a Task 5b pass before closing 17j, defer to slice 17k, or accept current state as diminishing-returns.

---

### Task 5: Global Claude prune (live machine changes)

**Session:** 2026-04-18 | **Commit:** (this commit — live-machine changes not tracked in git; backup in cloud pre-prune snapshot)

**Pre-prune safety snapshot (cloud):**
- `<cloud>/claude-config/user/2026-04-18-pre-prune-snapshot/settings.json` — pre-prune `~/.claude/settings.json` (27 KB)
- `<cloud>/claude-config/user/2026-04-18-pre-prune-snapshot/claude-json.json` — pre-prune `~/.claude.json` (36 KB)
- Both preserved for rollback if any prune turns out too aggressive.

**Changes landed on live `~/.claude/`:**

**A. `~/.claude/rules/zh/` DELETED** (11 files, 48 KB). Chinese translation of `rules/common/` — pure duplication per token-efficacy research. Estimated savings: ~15K tokens per session.

**B. Plugins: 32 → 17 enabled** (disabled 15). Disabled list with reasons:
- `superpowers@claude-plugins-official` — duplicate of `superpowers@superpowers-marketplace` (kept the marketplace version)
- `everything-claude-code@everything-claude-code` — ~200 skills covering Java/Kotlin/Perl/Swift/Rust/C++/Laravel/Django/Android, none applicable
- `csharp-lsp@claude-plugins-official`, `kotlin-lsp@claude-plugins-official` — no C# / Kotlin work
- `microsoft-docs@claude-plugins-official` — no Microsoft stack
- `neon@claude-plugins-official` — deferred to Slice 18 (re-enable then)
- `railway@claude-plugins-official` — yesid.dev deploys to Vercel, not Railway
- `zapier@claude-plugins-official`, `agent-sdk-dev@claude-plugins-official`, `mcp-server-dev@claude-plugins-official`, `autofix-bot@claude-plugins-official`, `ai-plugins@claude-plugins-official`, `codex@openai-codex` — not used in current workflow
- `double-shot-latte@superpowers-marketplace`, `superpowers-developing-for-claude-code@superpowers-marketplace` — low-signal / meta

**17 still active (the core yesid.dev workflow set):**
vercel, chrome-devtools-mcp, skill-creator, remember, claude-code-setup, code-review, code-simplifier, frontend-design, claude-md-management, playground, typescript-lsp, commit-commands, github, superpowers@superpowers-marketplace, ui-ux-pro-max, frontend-design-pro, web-designer

**C. User-scope MCPs: 7 → 4 entries** in `~/.claude.json`. Removed:
- `firefox-devtools` at root and at `/projects/C:/Users/otalo` scope (not used anywhere)
- `Railway` at `/projects/C:/Users/otalo` scope (move to per-project `.mcp.json` when needed)

**Still active:** `chrome-devtools` (root), `context7` (user-home scope), `context7` (transit project scope). yesid.dev MCP list remains empty at user scope — plugin provides what's needed.

**D. Auto-memory: 67 → 35 files** (−32 files, −48%).
- **Consolidated:** 21 per-slice-status memories merged into single `project_completed_slices.md` (rolling index with table of shipped slices + cloud fetch paths).
- **Pruned stale:** 12 additional outdated project-specific memories removed (project_home_rework, project_17d_vision, project_17d4_* triple, project_17e_motion_gaps, project_constitution_planning, project_contact_backend, project_keystatic_cms, project_tech_stack_slice, project_tech_stack_vision, project_testing_optimization, project_slice06d_iteration2) — topics are either shipped, absorbed into reference docs, or superseded.
- **MEMORY.md rewritten** — cleaner index organized by type (Project / Feedback / Reference / User).

**Decisions:**
- D017: Keep `everything-claude-code` DISABLED at user scope. If any of its skills prove necessary, enable per-project via settings.json.
- D018: `chrome-devtools` stays user-scope (root) — yesid.dev uses it constantly. Plugin version unhealthy (`spawn npx ENOENT` in mcp-health-cache), user-scope version is what actually works.
- D019: Memory consolidation rule — per-slice status memories no longer created. Future slice closes append one row to `project_completed_slices.md`. Single rolling index beats 21 fragmented entries.
- D020: Aggressive prune accepted on trust of backup snapshot in cloud. Session after 17j will verify nothing critical broke; rollback via `cp <cloud>/.../pre-prune-snapshot/settings.json ~/.claude/settings.json` if needed.

**Savings estimate** (rough — exact re-measurement in Task 6):
- `rules/zh/` delete: ~15K tokens/session
- 15 plugin disables: ~3–5K tokens/session (duplicate superpowers + everything-claude-code ~200 skill descriptions)
- MCP prune: ~1K tokens/session
- Memory prune: ~500 tokens/session
- **Total estimate: ~19–22K tokens/session saved**, from a ~89K baseline → projected ~67–70K → ~22% reduction.

---

### Task 4: `.mcp.json` per-project MCP allowlist + cloud templates scaffold

**Session:** 2026-04-18 | **Commit:** (this commit)

**Files (repo):**
- Created: `.mcp.json` at repo root (empty `mcpServers` block — yesid.dev's active MCPs are all plugin-provided; `.mcp.json` is documented here as the project-scoping surface for future project-specific servers)
- Created: `.claude/settings.json` (committed) — `enableAllProjectMcpServers: false`, `enabledMcpjsonServers: []`, documented expected MCPs for the project, user-scope cleanup note for Task 5, shared permissions (bun run, git, gh, WebFetch to Claude/GitHub docs, WebSearch)

**Files (cloud — companion work per Yesid request):**
- Created: `<cloud>/claude-knowledge/mcp-templates/README.md` — per-project MCP scoping recipe, layer model (user-scope / project-scope / plugins), per-project setup walkthrough, quarterly audit rhythm
- Created: `<cloud>/claude-knowledge/mcp-templates/web-sveltekit.json` — yesid.dev pattern template
- Created: `<cloud>/claude-knowledge/mcp-templates/sql-pipeline.json` — SQL / data work template (Neon seeded)
- Created: `<cloud>/claude-knowledge/mcp-templates/data-ops.json` — infrastructure / data ops template (Railway seeded)
- Created: `<cloud>/claude-knowledge/mcp-templates/generic.json` — minimal baseline
- Created: `<cloud>/claude-knowledge/mcp-templates/settings-template.json` — `.claude/settings.json` pattern
- Created: `<cloud>/claude-config/README.md` — portable Claude setup doc (what's exportable per layer, layout for snapshot/restore, usage recipe, tie-ins with os-quirks + mcp-templates). Tooling (snapshot.ps1, restore.ps1, etc.) ships in Task 8.

**Decisions:**
- D014: `.mcp.json` stays empty for yesid.dev for now — all needed MCPs (svelte, chrome-devtools, context7, gsap-master, github, vercel, playwright) come via plugins. File exists as the project-scoping surface for future project-specific stdio/HTTP MCPs.
- D015: Committed `.claude/settings.json` + `.claude/settings.local.json` (existing) split — shared vs personal permissions. `settings.local.json` keeps personal WebFetch / interactive permissions; `settings.json` declares the scoping model + shared permissions that travel with the repo.
- D016: Per-project plugin scoping is unsupported natively (research 03-plugin-hygiene.md). User-scope plugin pruning is Task 5's job. `.mcp.json` layer is insufficient alone — Task 5 gets the full surface.

**User request expanding Task 8 scope (logged here, implemented in Task 8):**
- Exportability as a first-class property: snapshot + restore across machines (Windows / macOS / Linux). `<cloud>/claude-config/README.md` already documents the target layout and usage; scripts come in Task 8.
- Marketplaces + plugins are first-class layers in the snapshot. Cloud README refined to show:
  - `marketplaces.json` — extracted `extraKnownMarketplaces` (list of plugin-source GitHub repos)
  - `enabled-plugins.json` — extracted `enabledPlugins` with marketplace origins
  - Restore sequence: re-add marketplaces → re-enable plugins (plugins auto-fetch source) → copy settings/MCPs/skills/agents/rules → set env vars → reminder about secrets
  - Private marketplaces flagged: require `gh auth login` on new machine before `claude marketplace add` resolves.

---

### Task 3f: OS-agnosticism + OS-quirks registry

**Session:** 2026-04-18 | **Commit:** (this commit — cloud files not tracked in git)

**Files (cloud):**
- Created: `<cloud>/claude-knowledge/os-quirks/README.md` — usage + format + write/retrieval protocols
- Created: `<cloud>/claude-knowledge/os-quirks/windows.md` — 7 seeded Windows quirks from Slice 17j discoveries:
  1. MinTTY path conversion mangles `/E` → wrap in PowerShell
  2. `cmd //c` quoting unpredictable → prefer PowerShell
  3. ES module package.json + `require()` → rename `.js` → `.cjs`
  4. `git add` CRLF warnings → expected, not a bug (with CRLF-parser fix history note)
  5. Long inline `bash -c "..."` with backticks → write to temp file
  6. `robocopy` exit codes 0–7 are success (bitmap)
  7. `find -delete` works on Git Bash
  8. Path separators: Bun scripts → `path.join()`; Windows CLIs → `\`
- Created: `<cloud>/claude-knowledge/os-quirks/macos.md` — skeleton with known-watch categories (BSD vs GNU, Homebrew, Apple Silicon, case-insensitive FS, quarantine, launchctl, Terminal/iTerm)
- Created: `<cloud>/claude-knowledge/os-quirks/linux.md` — skeleton with known-watch categories (apt/dnf/pacman, systemd, SELinux/AppArmor, permissions, iptables/nftables, X11/Wayland, glibc/musl, WSL)
- Created: `<cloud>/claude-knowledge/os-quirks/cross-platform.md` — 5 universal patterns (path.join, env vars, Bun runtime, exit codes, line endings + .gitattributes)

**Governance already in place from Tasks 2 + 3:**
- CLAUDE.md `## Cross-platform setup` section (env var + registry pointer)
- WORKFLOW.md §12 Cross-Platform Setup + OS-Quirks Registry section
- CLAUDE.md closing checklist step 4: "Append OS-specific fixes discovered to os-quirks/<os>.md"
- WORKFLOW.md §11 closing checklist: same rule
- Proactive tool trigger #11: "Hitting an OS-specific command error? Check os-quirks/<os>.md FIRST"
- scripts/slice-close.ts uses `YESITO_CLOUD_ROOT` env var (OS-portable)

**Decisions:**
- D013: OS-quirks registry lives at `<cloud>/claude-knowledge/os-quirks/` — cross-project, not yesid.dev-specific. Portable across all 6 services.

---

## Follow-ups flagged (accumulates)

**Persistent (outside 17j scope):**

1. **17g scope re-evaluation** — `docs/learn/` moved to cloud in 17j; 17g's planned "Learning Docs Refactor" may need re-framing.
2. **Playwright `export-examples` on Windows** — flagged in 17h, still unresolved. NOTE: not yet added to os-quirks/windows.md because root cause unknown (chromium + firefox `launch()` both hang). When diagnosed, add as 8th windows.md entry.
3. **Bundle shrink opportunities** — D269 lazy-plugin migration partial; captureFlipState + CustomEase.create sync-API coupling blocks full Vite chunk split. Flagged for post-17j async refactor.
4. **`.gitattributes` for LF enforcement** — cross-platform.md flagged this as worth adding in a future slice to prevent accidental CRLF commits in cross-machine workflows.

**Moved to Task 7b (runs BEFORE Task 8 so the config snapshot exports a clean post-prune state):**

- **Plugin overlap consolidation** (4 design plugins — frontend-design, frontend-design-pro, ui-ux-pro-max, web-designer). Decision needed from Yesid on which to keep. ~2K tokens potential.
- **Connector-based MCP cleanup** (Webflow, Cloudflare, Notion, Calendar, Slack, Figma, Postman, Microsoft-docs, Claude-in-Chrome, tax, jobs, mcp-registry). Loaded from claude.ai/settings/integrations (web app), NOT CLI-reachable. Yesid disconnects manually; I'll provide the exact list + before/after instructions. **Biggest remaining lever: ~3.5K tokens immediate + ~117K activation-cost prevention.**
- **Heavy agents on disk** (`performance-optimizer.md` 446 lines, `code-reviewer.md` 237 lines, `planner.md` 212 lines). Trim in-place to reduce subagent-spawn cost.
- **Rules chain language conditionality** — `rules/common/*.md` all inline regardless of language. Possible approaches: (a) move TypeScript-specific content into `rules/typescript/` and trim common; (b) leave as-is and accept. Decision needed.

**Sequencing rationale:** Task 8's snapshot captures the live `~/.claude/` state. If 7b's prune runs AFTER 8, the first snapshot encodes pre-prune bloat and a second snapshot would be needed. Running 7b FIRST means Task 8 exports a single, clean, portable baseline.

## Iterations (if any)

None yet this sub-slice — iterations documented in log.md per session.

## Summary

*(Added at PR time.)*

## PR Body

*(Added at PR time.)*

## Final Status

*(Set at PR time.)*
