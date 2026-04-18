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

1. **17g scope re-evaluation** — `docs/learn/` moved to cloud in 17j; 17g's planned "Learning Docs Refactor" may need re-framing.
2. **Playwright `export-examples` on Windows** — flagged in 17h, still unresolved. NOTE: not yet added to os-quirks/windows.md because root cause unknown (chromium + firefox `launch()` both hang). When diagnosed, add as 8th windows.md entry.
3. **Bundle shrink opportunities** — D269 lazy-plugin migration partial; captureFlipState + CustomEase.create sync-API coupling blocks full Vite chunk split. Flagged for post-17j async refactor.
4. **`.gitattributes` for LF enforcement** — cross-platform.md flagged this as worth adding in a future slice to prevent accidental CRLF commits in cross-machine workflows.

## Iterations (if any)

None yet this sub-slice — iterations documented in log.md per session.

## Summary

*(Added at PR time.)*

## PR Body

*(Added at PR time.)*

## Final Status

*(Set at PR time.)*
