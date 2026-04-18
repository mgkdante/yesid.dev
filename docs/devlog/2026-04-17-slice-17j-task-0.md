# Slice 17j — Task 0 Baseline

**Date:** 2026-04-17
**Task:** 0 (baseline measurement)
**Branch:** feature/slice-17j-token-efficacy
**Commit:** 6768df1a6390e042dfd1071c9e300664e78ae298

## /context-budget output (cold session, pre-change)

```
Context Budget Report
═══════════════════════════════════════
Session: Opus 4.7 (1M context window) — yesid.dev / slice-17j Task 0 baseline
Scan date: 2026-04-17

Component Breakdown (estimated tokens loaded at session start)
┌──────────────────────────────┬─────────┬───────────┬─────────────────────────────┐
│ Component                    │ Count   │ Tokens    │ Notes                       │
├──────────────────────────────┼─────────┼───────────┼─────────────────────────────┤
│ Agent list (Task tool descs) │  207    │ ~30,000   │ 30 home + 177 plugin        │
│ Skill list (descriptions)    │ ~500    │ ~13,000   │ 115 home + 1,232 plugin     │
│ MCP tool names (deferred)    │ ~400    │ ~2,500    │ Schemas lazy-loaded         │
│ Global CLAUDE.md chain       │   22    │ ~30,000   │ rules/common + rules/zh     │
│ Project CLAUDE.md            │    1    │ ~6,000    │ 445 lines                   │
│ Memory index (MEMORY.md)     │    1    │ ~1,500    │ 52 pointers                 │
│ System prompt + core tools   │    —    │ ~5,000    │ Built-in framework          │
│ Hook/session reminders       │    —    │ ~1,500    │ vercel, remember, ecc       │
├──────────────────────────────┼─────────┼───────────┼─────────────────────────────┤
│ TOTAL                        │         │ ~89,500   │ ~9% of 1M window            │
└──────────────────────────────┴─────────┴───────────┴─────────────────────────────┘

Raw disk inventory (on-disk, not all loaded)
- Home agents:    30 files   /   154 KB
- Home skills:   115 files   /  1.22 MB
- Plugin skills: 1,232 files  /  ~6 MB  (lazy-loaded via Skill tool)
- Plugin agents: 177 files
- Rules:          77 files   /   127 KB
- Enabled plugins: 32 across 8 marketplaces

WARNING: Issues Found (5)

1. DUPLICATE RULES TREE — rules/zh/ is a Chinese translation of rules/common/
   Both loaded into CLAUDE.md chain. Pure duplication.
   Savings: ~15,000 tokens (~17% of overhead)

2. OVERSIZED AGENT LIST — 207 agents loaded, most unused in this project
   Many redundant pairs (superpowers × 2, everything-claude-code × 2,
   plugin:everything-claude-code overlap, etc.)
   Savings: potentially ~15,000 tokens if pruned to project-relevant set

3. 32 ENABLED PLUGINS — several near-redundant marketplaces
   superpowers (official) + superpowers (marketplace) — same plugin twice
   everything-claude-code alongside plugin_everything-claude-code variants
   Savings: ~5,000+ tokens plus cleaner tool namespace

4. UNHEALTHY MCP SERVER — chrome-devtools failing with `spawn npx ENOENT`
   9 failures cached. Still counted in available tool list.
   Risk: wasted slots + confused tool selection

5. HEAVY HOME SKILLS DIRECTORY — 115 SKILL.md files at 1.22 MB
   Top offenders by file size need verbose audit. Many may be experimental.
   Savings: pending Task 0a research agents' inventory

Top 3 Optimizations (Task 0a will verify)
1. Delete rules/zh/ tree (duplicate Chinese rules)          → -15,000 tokens
2. Disable redundant plugin marketplaces (2–3 plugins)       → -7,000 tokens
3. Prune unused home agents (keep project-relevant set)     → -8,000 tokens

Potential savings: ~30,000 tokens (~34% of current overhead)
```

**Note on measurement method:** The `/context-budget` skill produces an *estimate*, not a ground-truth token count — the CLI does not expose a precise counter. Estimates use `words × 1.3` for prose and `chars / 4` for code-heavy content. The ~89,500 figure is the upper-bound of loaded-at-startup overhead based on visible system-prompt contents plus on-disk scans of linked rule files. Re-measurement in Task 6 will use the same method for apples-to-apples delta.

## Repo docs inventory

| Subtree | Line count | Byte size |
|---------|-----------:|----------:|
| docs/devlog | 2,683 | 216 KB |
| docs/handoffs | 4,301 | 384 KB |
| docs/specs | 13,653 | 756 KB |
| docs/plans | 36,987 | 1.4 MB |
| docs/slices | 11,935 | 776 KB |
| docs/research | 1,799 | 128 KB |
| docs/archive | 741 | 2.7 MB |
| docs/reference | 4,267 | 440 KB |
| docs/learn | 17,931 | 1.2 MB |
| docs/roadmap | 1,956 | 148 KB |
| **CLAUDE.md** | 445 | 20 KB |
| **WORKFLOW.md** | 794 | 32 KB |
| **TOTAL (docs/)** | **96,280** | **4.6 MB** |

Top 5 heaviest individual files:

| File | Lines |
|------|------:|
| docs/plans/2026-04-17-slice-17j-token-efficacy.md | 1,992 |
| docs/plans/2026-04-14-project-detail-page.md | 1,782 |
| docs/plans/2026-04-16-slice-17e-3-scrub-factories.md | 1,573 |
| docs/plans/2026-04-10-hero-redesign.md | 1,478 |
| docs/plans/2026-04-17-slice-17e-5-interaction-consolidation.md | 1,296 |

## Global Claude inventory

| Source | Count | Size |
|--------|------:|-----:|
| ~/.claude/rules/common | 11 files | 44 KB |
| ~/.claude/rules/zh | 11 files | 48 KB |
| ~/.claude/rules (all incl. lang dirs) | 77 files | ~127 KB |
| ~/.claude/agents (home) | 30 files | 154 KB |
| ~/.claude/skills (home) | 115 SKILL.md | 1.22 MB |
| ~/.claude/plugins/cache (plugin bundles) | 50 subdirs across 9 marketplaces | — |
| ~/.claude/plugins skills | 1,232 SKILL.md | ~6 MB |
| ~/.claude/plugins agents | 177 files | — |
| Enabled plugins (settings.json) | 32 across 8 marketplaces | — |
| auto-memory total | 67 files (1,431 lines) | 308 KB |
| auto-memory slice-status (`project_slice_*`) | 21 files | — |
| MCP servers (`.claude.json`) | 4 unique (chrome-devtools, firefox-devtools, Railway, context7) | — |

## Observations

### What looks heaviest
- **docs/plans/** — 1.4 MB, 36,987 lines across 40 files. Biggest single subtree by byte count and by far the biggest by line count. Most plans are finished work; only the active slice's plan needs to be reachable from session context.
- **docs/learn/** — 1.2 MB, 17,931 lines across 89 concept files. Valuable long-term but not session-hot; a pointer index would serve.
- **docs/archive/** — 2.7 MB on disk but only 741 lines of markdown. The bulk is non-markdown assets (HTML, screenshots) that shouldn't affect loaded context, but they bloat repo size and git operations.
- **Plugin skills at ~6 MB (1,232 files)** — lazy-loaded via Skill tool, so not directly context-loaded. Still the biggest accretion surface by raw bytes. Name/description list alone contributes ~13K tokens to session start.

### What's surprising
- **rules/zh/ is 48 KB vs common/'s 44 KB** — the Chinese translation is actually *larger* than the English source. Both are loaded on every session because they sit in the global rules chain. Deleting `zh/` alone should recover ~15K tokens (biggest single lever).
- **Agent list is ~30K tokens** — 207 agents across user-home + plugins. Most have descriptions 30–200 words long. Many are duplicates (superpowers installed twice; everything-claude-code shadows plugin:everything-claude-code variants).
- **Project CLAUDE.md at 445 lines / 20 KB** — leaner than expected but still loads the "Tool Selection Protocol" (60+ lines), "Completed Slices" list (1 line but growing), and plugin/tool inventory that duplicates what's already discoverable via Skill tool.
- **21 slice-status memory files** — memory index is working but slice-status entries aren't pruned after completion; they accumulate.
- **chrome-devtools MCP is unhealthy** — 9 cached failures (`spawn npx ENOENT`). Still occupies a tool slot in the loaded namespace.
- **Enabled plugins = 32 across 8 marketplaces** — superpowers exists in both `claude-plugins-official` and `superpowers-marketplace` (installed twice). everything-claude-code sits alongside plugin_everything-claude-code duplicates. Pruning ~5 redundant plugins is low-risk.

### Leverage ranking (pending Task 0a verification)
1. **~/.claude/rules/zh/ deletion** — pure duplicate translation. Highest leverage, lowest risk.
2. **Repo docs/plans + docs/learn migration** — mirror to cloud with pointer stubs, reduces repo-side indexer load + keeps session-adjacent context smaller.
3. **Plugin deduplication** — disable duplicate superpowers + everything-claude-code installs.
4. **Agent list pruning** — aggressive but high-value; keep project-relevant set (~30 agents).
5. **CLAUDE.md slim** — remove "Completed Slices", "Tool Selection Protocol", "Plugins & Tools", verbose repo-structure.
6. **Auto-memory consolidation** — collapse 21 slice-status entries into one rolling pointer.

Baseline captured. Ready to dispatch Task 0a's 6 parallel research agents for deep-dive verification of each lever.

---

## Task 0a — Research sprint summary

**Date:** 2026-04-17
**Dispatch:** 6 parallel general-purpose subagents. All 6 returned successfully. All docs written to `C:\Users\otalo\Yesito\cloud\claude-knowledge\token-efficacy\`.

| Doc | Word count | Sections | Sources 2025–26 |
|-----|-----------:|:--------:|:---------------:|
| 01-cache-economics.md | 1,046 | 5/5 | all |
| 02-mcp-scoping.md | 921 | 5/5 | all (10, 7 primary Anthropic) |
| 03-plugin-hygiene.md | 895 | 5/5 | all |
| 04-subagent-delegation.md | 1,150 | 5/5 | all |
| 05-auto-memory.md | 993 | 5/5 | all (10, incl. primary Anthropic) |
| 06-strategic-compact.md | 1,103 | 5/5 | all (13, 7 primary Anthropic) |

Three agents (01, 04, 06) came in ~100–150 words over the 1,000-word soft ceiling; content quality and section completeness verified, so accepted without re-dispatch. Spot-check of 02-mcp-scoping.md: all 5 sections populated, 10 sources, concrete yesid.dev recommendations, cross-project patterns extractable.

### Findings that change downstream tasks

- **Task 4 (.mcp.json):** Research 02 confirms the 2026 pattern: use a committed repo-root `.mcp.json` defining the ~7 servers yesid.dev actually needs (svelte, context7, chrome-devtools, gsap-master, vercel, github, playwright), plus an explicit `enabledMcpjsonServers` allowlist in `.claude/settings.json` (NOT `.local.json` — issue #24657 ignores it there). Cap at ~7–10 servers; treat user-scope as personal tools, not baseline. Under Claude Code v2.1.69 ToolSearch is default for *all* tools, so schema cost collapsed (GitHub MCP 46k → 8.7k), but tool-name list length still degrades routing with 40+ servers — the session loading this doc shows ~60 user-scope MCPs, which is the accretion problem.

- **Task 5 (global cleanup):** Research 03 + 05 point to specific pruning targets. Plugins: confirmed duplication bug #29971 is double-registering superpowers + context7 + chrome-devtools (visible in this session's reminder under both root and `plugin_everything-claude-code` namespaces) — disable one namespace, save ~3–5k tokens. The `everything-claude-code` bundle contributes ~200 skills (Java/Kotlin/Perl/Swift/Rust/C++/Laravel/Django/Android) — none apply to yesid.dev; scope it out of this project. Memory: 67 files with 21 per-slice status entries is accretion bloat — consolidate merged slices into `project_completed_slices.md` with absolute dates, add `status:` frontmatter, and archive superseded entries into a `archive/` subdir. Anthropic's 2026 AutoDream sub-agent does this reflectively when triggered; yesid.dev can replicate manually as a closing-checklist step.

- **Task 7 (skill — `token-frugal-workflow`):** Patterns from all 6 docs that MUST codify into the portable skill:
  1. **MCP scoping default:** project-scoped `.mcp.json` + explicit `enabledMcpjsonServers`, cap 7–10 per project, audit quarterly.
  2. **Cache-aware session pacing:** 5-min TTL is the sweet spot; schedule waits at 270s (stay cached) or 1200s+ (amortize miss) — never 300s. Parent cache ≠ subagent cache.
  3. **Compaction rules:** compact at 50–60% utilization at task boundaries only, never mid-task; "Clear context, keep plan" exit from plan mode discards exploration tokens; fresh session beats compact across session-type transitions.
  4. **Subagent dispatch break-even:** >5 file reads OR >1k tokens of tool output → dispatch; parallel only when 3+ independent non-overlapping tasks; always prompt for explicit word-count summaries; route Sonnet/Haiku for research.
  5. **Memory hygiene:** 4-type taxonomy (user/feedback/project/reference), save confirmations not just corrections (asymmetric learning trap), absolute dates only, MEMORY.md ≤200 lines with one-line entries, verify-before-recommend for any named file/function/flag from memory.
  6. **Skill description linter:** lead with "Use when …" (trigger-framed) not "Use for …" (topic-framed); first 200 chars load-bearing; keep under 1,536 chars; avoid mega-bundle skills at project scope.

### Executive summaries (200 words each, from agent returns)

#### 01 — Cache economics
Prompt-cache economics on Claude 4.7 hinge on three numbers: 5m cache writes cost 1.25x input, 1h writes cost 2x, reads cost 0.1x (12.5x cheaper than writes). In March 2026 Anthropic silently regressed the default TTL from 1h to 5m, causing documented ~17% cost inflation on long sessions — any pause >5 min re-pays the write rate on the entire prefix. Cache prefix order is `tools → system → CLAUDE.md → messages`; any change at a layer invalidates everything after it. Mature Claude Code sessions hit 90–96% cache-hit rates when timestamps, git status, and volatile content are kept out of the system/memory layers. Tool changes mid-session and mid-prefix timestamps are the top cache-busters. Subagents run in fresh contexts with their own KV cache — they do not inherit parent cache. For yesid.dev: CLAUDE.md has accreted across 20+ slices and now includes volatile "current sub-slice" lines — that belongs in the checkpoint file, not root memory. Also: lock MCPs in `.mcp.json`, batch tree.txt/CSS.md rewrites, and codify the "270s or 1200s+, never 300s" scheduling rule into CLAUDE.md. The 1M window is rarely worth the cache penalty for a 200K-fit repo.

#### 02 — MCP scoping
Claude Code v2.1.69 made ToolSearch the default for *all* tools, not just MCP. MCP-server token cost at startup has collapsed dramatically (GitHub MCP: 46k → ~8.7k per public benchmark), but tool-name list length still degrades routing when 40+ servers are connected. Scope hierarchy: Local (`~/.claude.json` per-project) > Project (`.mcp.json`) > User (`~/.claude.json` global) > Plugin > connectors. MCP *definitions* live in `.mcp.json`; *approval allowlists* live in `settings.json` under `enableAllProjectMcpServers` / `enabledMcpjsonServers` / `disabledMcpjsonServers`. Known gotcha: `enabledMcpjsonServers` is ignored in `.claude/settings.local.json` (issue #24657) — must go in committed `settings.json` or user-global. For yesid.dev: current session loads ~60 MCPs from user scope, most irrelevant. Recommend creating a committed `.mcp.json` with 7 servers (svelte, context7, chrome-devtools, gsap-master, vercel, github, playwright) and an explicit `enabledMcpjsonServers` allowlist in `.claude/settings.json`. Portable patterns: cap per-project MCPs at ~7–10, treat user-scope as personal tools (never baseline), audit quarterly via `claude mcp list`.

#### 03 — Plugin hygiene
Skill descriptions always load at session start — up to 1,536 chars of `description` + `when_to_use` per installed skill hit the system prompt, capped at ~1% of context (default 8,000 chars, `SLASH_COMMAND_TOOL_CHAR_BUDGET`). Only the body is lazy-loaded. Confirmed duplication bug (anthropics/claude-code #29971) wastes 3–5k tokens/session by double-registering plugin skills. yesid.dev's system reminder shows exactly this: `superpowers`, `context7`, and chrome-devtools appear under both root and `plugin_everything-claude-code` namespaces. Per-project plugin auto-scoping does not exist yet (open feature request #11461, #44470). Current workaround: user-scope the heavy bundles, project-scope `.claude/settings.json` denies. "Use when…" phrasing outperforms "Use for…" — trigger-framed descriptions match Claude's matching behavior better. First ~200 chars are load-bearing because truncation strips keywords. For yesid.dev: `everything-claude-code` adds ~200 skills covering Java/Kotlin/Perl/Swift/Rust/C++/Laravel/Django/Android none of which apply. Recommended allowlist: superpowers, frontend-design-pro, chrome-devtools-mcp, web-designer, design-systems, ui-design, interaction-design, vercel, claude-md-management, remember, skill-creator. Portable skill candidate: `plugin-hygiene` with audit checklist, description linter, mega-bundle-at-project-scope failing rule, duplication detector, safe-uninstall recipe backed by a git-tracked manifest.

#### 04 — Subagent delegation
Subagents are Claude Code's primary context-isolation primitive. The parent calls the Agent tool (renamed from `Task` in v2.1.63) with a prompt string; the subagent runs in a fresh conversation with its own system prompt and tools; intermediate tool calls and results stay inside the subagent; only the final message returns verbatim as the tool result. The only parent→child channel is that prompt string, so prompt invocation quality is the top failure mode. The 2026 toolkit adds `isolation: "worktree"` frontmatter (built-in git worktree support, late 2025) and `background: true` / `Ctrl+B` for off-loop research. Both have active GitHub issues (#37549, #39886) when combined with team_name. Key rules: dispatch for >5 file reads or >1k tokens of tool output; inline below that; parallel only for 3+ independent no-overlap tasks; always prompt for explicit word-count summaries; route Sonnet/Haiku for research, reserve Opus for the parent. For yesid.dev: add a "Subagent dispatch rules" section to CLAUDE.md codifying the break-even, lock down `.claude/agents/` specialists to read-only tool sets with Sonnet model, run verification subagents (Lighthouse/Playwright/Vitest) parallel+background during devlog writing, and ban Agent wrappers on single-file reads.

#### 05 — Auto-memory
Auto-memory requires Claude Code v2.1.59+, lives at `~/.claude/projects/<project>/memory/`, and the MEMORY.md index is truncated to the first 200 lines or 25KB at session start. Topic files load on demand. CLAUDE.md loads in full. 2026 shift: Anthropic's AutoDream sub-agent now performs reflective consolidation — merges duplicates, prunes contradictions, converts relative dates to absolute. Self-triggers after >24h AND ≥5 sessions. Community `dream-skill` replicates this. Core principles: (1) Save user facts, rules-with-reasoning, and confirmations of good decisions (not just corrections — asymmetric learning trap). (2) Don't save anything derivable from code. (3) MEMORY.md index = one line per entry, ≤150 chars. (4) Treat stale entries as staleness, not errors — memory states a claim true at write time, not now. Verify before recommending. yesid.dev specifics: 66 memory files with 30+ per-slice status files is accretion bloat. Recommended: consolidate merged slices into `project_completed_slices.md`, add `status:` frontmatter field, run "consolidate my memory files" as closing-checklist step 9.5, archive superseded entries to `archive/` subdir, and add a memory-protocol block to CLAUDE.md enforcing verify-before-quote. Portable skill outputs: 4-type taxonomy (user/feedback/project/reference), status frontmatter convention, absolute-date rule, closing-phase consolidation hook, verify-before-recommend rule, save-confirmations rule.

#### 06 — Strategic compact + plan-mode
Compaction in Claude Code (2026) is a three-layer pipeline — microcompaction (disk offload), auto-compaction (fires at ~75–83% utilization, down from 90%+), and manual `/compact`. The reserve buffer shrank from ~45K to ~33K tokens, giving ~12K more usable context. Anthropic bills compaction against the full current context, and it invalidates the cached prefix — so one compaction call is expensive but pays itself back in ~5x cheaper post-compaction turns. Core best practice: compact at 50–60% utilization at task boundaries only — never mid-task (loses tool-result fidelity and in-flight variable state). Diagnose with working/startup ratio: if working >70%, compact or clear_tool_uses; if startup is bloated, shrink CLAUDE.md/memory instead. Plan mode is a cost lever, not a checkpoint — exit with "Clear context, keep plan" to discard exploration tokens entirely. For yesid.dev's 20+ slice accretion problem: add compact checkpoint to Iteration Protocol, codify "fresh session beats compact" across session-type transitions, shrink CLAUDE.md below 300 lines, archive stale MEMORY.md entries older than 3 slices, make `/context-budget` a mandatory pre-task check. Portable patterns codified: 60% rule, task-boundary invariant, working/startup ratio diagnostic, fresh-session heuristic, plan-mode-as-cost-lever, cache-write amortization floor, session-type invariants.

---

## Task 1 — docs/ prune + cloud mirror

**Date:** 2026-04-17
**Mirror:** robocopy completed — 509 files / 6.90 MB copied to `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\`. Spot-check of `devlog/2026-04-01-slice-01.md` opens cleanly with real content.

### Cross-link scrub decisions

All matches against pattern `docs/(devlog|handoffs|specs|plans|research|archive)/|slice-[0-9]` in `docs/reference/**` and `docs/learn/**`.

| File:Line | Current link | Decision | New link (if rewrite) |
|-----------|--------------|----------|-----------------------|
| docs/reference/MOTION.md:5 | `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\specs\2026-04-16-slice-17e-motion-reengineering-design.md` |
| docs/reference/MOTION.md:450 | `docs/devlog/2026-04-17-slice-17e-closing.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\devlog\2026-04-17-slice-17e-closing.md` |
| docs/reference/MOTION.md:467 | `docs/devlog/2026-04-17-slice-17e-closing.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\devlog\2026-04-17-slice-17e-closing.md` |
| docs/reference/WORKFLOW.md:728 | `docs/archive/test_helper.md` (table row) | EXCISE | row removed (archive dir deleted) |
| docs/reference/WORKFLOW.md:730 | `docs/research/findings.md` (table row) | EXCISE | row removed (research dir deleted) |
| docs/learn/data-layer/data-driven-architecture.md:42 | `docs/specs/2026-04-16-cms-payload-design.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\specs\2026-04-16-cms-payload-design.md` |
| docs/learn/meta.json:793 | `docs/slices/slice-17a-4-dead-code-dedup.md` (codeFiles array) | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\slices\slice-17a-4-dead-code-dedup.md` |
| docs/learn/patterns/audit-before-plan.md:43 | `docs/slices/slice-17a-4-dead-code-dedup.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\slices\slice-17a-4-dead-code-dedup.md` |
| docs/learn/patterns/audit-before-plan.md:44 | `docs/handoffs/slice-17a-4-dead-code-dedup.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\handoffs\slice-17a-4-dead-code-dedup.md` |
| docs/learn/patterns/audit-before-plan.md:168 | `docs/slices/slice-17a-4-dead-code-dedup.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\slices\slice-17a-4-dead-code-dedup.md` |
| docs/learn/motion/lazy-gsap-plugins.md:190 | `docs/slices/slice-17e-5-interaction-consolidation.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\slices\slice-17e-5-interaction-consolidation.md` |
| docs/learn/motion/snappy-doctrine.md:145 | `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\specs\2026-04-16-slice-17e-motion-reengineering-design.md` |

### Kept as-is (generic directory references, not broken links)

- All other `docs/reference/WORKFLOW.md` hits (lines 16, 18, 36, 39, 72, 89, 154, 209, 226, 269, 293, 481, 488, 732–735) describe directory *conventions* (e.g., "Design spec written in `docs/specs/`") — still accurate because new slices re-populate these dirs.
- `docs/learn/devops/git-workflow.md:65–66` describe the `handoffs/` and `devlog/` directory purpose in a conceptual table — conventions, not file links.
- All YAML frontmatter tags like `- slice-17e` in `docs/learn/motion/*.md` — metadata identifiers tagging concepts to slice numbers, not file paths.

### Scope amendment (Yesid guidance, 2026-04-17)

Original Task 1 plan was amended mid-task per Yesid, crystallizing into a three-tier context model:

**Tier 1 — Always-on (every session loads):** `CLAUDE.md`, `docs/reference/**`, `docs/roadmap/**` (PLAN.md trimmed), live slice state (checkpoint + current slice + active plan + active devlog), templates.

**Tier 2 — Fetch-on-command (cloud + git, never auto-loaded):** shipped slice artifacts, historical specs, research, archives. Lives at `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\`. Git also preserves.

**Tier 3 — Cloud indexes (the bridge):** `COMPLETED-SLICES.md` + `INDEX.md` in cloud. AI reads them on command to find what exists and fetch specific artifacts.

Retrieval protocol (cheapest first): in-context governance → cloud index → specific cloud artifact → git history.

Write protocol (new closing-checklist steps): mirror slice artifacts to cloud → delete from repo → update cloud `COMPLETED-SLICES.md` one-liner. To be codified in `WORKFLOW.md` + `CLAUDE.md` via Tasks 3 + 2.

Key constraint: `docs/learn/**` is Yesid's personal Obsidian knowledge base, not a shared AI reference surface. Moved to cloud. AI uses `docs/reference/PATTERNS.md` + `CONSTITUTION.md` for in-context patterns; fetches from cloud learn/ on command when needed.

### Final prune scope

**Kept in repo (Tier 1):**
- `CLAUDE.md`, `docs/reference/**`, `docs/roadmap/**` (PLAN.md trimmed)
- `docs/slices/_TEMPLATE.md`, `slice-17-checkpoint.md`, `slice-17j-token-efficacy.md`, `slice-14-stack-builder-logic.md`
- `docs/plans/2026-04-17-slice-17j-token-efficacy.md`
- `docs/devlog/_TEMPLATE.md`, `docs/devlog/2026-04-17-slice-17j-task-0.md`
- `docs/handoffs/_TEMPLATE.md`
- `docs/ARCHIVE.md` (new pointer)

**Mirrored to cloud, deleted from repo (Tier 2):**
- All other `docs/slices/*` (all completed + archived variants)
- All other `docs/plans/*` (~39 files)
- All other `docs/devlog/*` (~23 files)
- All `docs/handoffs/*` except template (~34 files)
- `docs/specs/*` (all 41 files)
- `docs/research/*` (6 files)
- `docs/archive/*` (4 MD + assets)
- **`docs/learn/**`** (89 files) — Yesid's Obsidian knowledge base moves to cloud for personal consumption

**Cloud-only indexes (fetch on command, Tier 3):**
- `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\COMPLETED-SLICES.md` — one-line-per-slice summary
- `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\INDEX.md` — overall mirror map

### Additional cross-link fix (learn → cloud)

| File:Line | Current link | Decision | New link |
|-----------|--------------|----------|----------|
| docs/reference/PATTERNS.md:275 | `docs/learn/styling/outline-vs-ring-pulsing-dots.md` | REWRITE | `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\learn\styling\outline-vs-ring-pulsing-dots.md` |

Generic `docs/learn/` references in `WORKFLOW.md` (lines 18, 320, 411, 506, 508, 510, 736) and `roadmap/standardization.md` (lines 898, 902, 917, 919) describe conventions and the 17g learn-docs update task. These will be rewritten holistically in Task 3 (WORKFLOW.md slim) and flagged for Slice 17g scope re-evaluation given the new cloud model.
