# Sub-Slice 17k — Work Log

Running record. Session-by-session. Appended as work happens.

---

### Session 2026-04-18 — Planning

**Tool:** Claude Code (Opus 4.7 `[1m]`)
**Session type:** Planning
**Size:** L

**What happened:**

- Started as a conversational design discussion about cross-tool workflow portability (Claude ↔ Codex). Evolved into a non-slice refactor (AGENTS.md + overlays + cloud rename) committed to this branch's working tree before being formally scoped.
- User surfaced additional requirements mid-discussion: generic-language pass, mirror Claude setup inventory, MCP audit permission, cross-tool log continuity.
- Size re-declared as **L** (multi-session, ≥10 design decisions, cross-cutting across repo + cloud + user-level configs).
- Dispatched 2 read-only research subagents (approved by Yesid) in parallel:
  1. **Claude inventory** (general-purpose / Sonnet): scanned `~/.claude.json`, `~/.claude/settings.json`, `~/.claude/{plugins,skills,agents,rules}/`. Output: structured inventory of 14 enabled plugins, 117 skills, 16 agents, 71 rule files, MCP declarations. Key finding: user-scope MCP list is effectively empty (healthy discipline); all MCP surface comes via plugins.
  2. **Repo language scan** (Explore / Sonnet): found 16 substantive hits — 8 "make-generic" + 6 "move-to-overlay" + 0 dead links. Smaller surface than feared.
- Consolidated findings + user's A–F decisions into `spec.md`.
- Decisions locked (A-thin-pointer / B-"LLM tool" / C-inventory+recommend / D-hybrid-skill-copy / E-now / F-attribution-mandatory).
- User confirmed CLAUDE.md revert was accidental — decision A stands.
- User approved spec.
- Wrote `plan.md` with 8 Level 3 tasks + Branch prep prerequisite + Session sequencing + per-task STOP criteria.
- Wrote this log + `handoff.md` stub.

**Decisions made this session:**

1. Three-layer workflow file structure (AGENTS.md core + CLAUDE.md thin pointer + per-tool overlays) formalized.
2. "LLM tool" / "LLM tools" adopted as the generic term replacing narrative "Claude" references.
3. Tool-attribution header (`**Tool:** <name> (<model>)`) becomes mandatory on every session header + handoff per-task section.
4. Inventory format: full markdown lists for everything; literal-copy only for user-authored content (the `workflow-efficiency` skill).
5. MCP/plugin pruning: inventory + recommend only this slice; no auto-prune.
6. Cloud structure: `<cloud>/workflow-knowledge/stack/` hosts inventories + user-authored skill copies + prune recommendations.
7. Git state needs resolving before Session 2 — prerequisite noted in plan.md, not a 17k task.

**Artifacts produced:**

- `docs/slices/slice-17/slice-17k/spec.md`
- `docs/slices/slice-17/slice-17k/plan.md`
- `docs/slices/slice-17/slice-17k/log.md` (this file)
- `docs/slices/slice-17/slice-17k/handoff.md` (stub)

**Working-tree state at session end (pre-branch-prep):** uncommitted — currently on `feature/slice-17b-repositories`, mixed with paused 17b work and workflow-refactor precursor changes. Must be resolved before Session 2 per plan.md "Branch prep" section.

**Budget row:**

```
Model: Opus 4.7 [1m] | Context: ~400k / 1M (~40%) — comfortable, continuing
```

**Next session:** Implementation (Session 2) — Tasks 17k-1, 17k-2, 17k-3. Faster/cheaper model role. Start with `git status` to verify branch prep landed cleanly.

---

### Session 2026-04-18 19:55 — Task 17k-3

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Planning 2026-04-18 (Claude Code / Opus 4.7 [1m], commit 281dfe4) + bootstrap (Claude Code / Opus 4.7 [1m], commit bc10f13)

**Goal:** Land the tool-attribution convention and replace the Codex overlay stub with verified native counterparts and explicit gaps.

**Commands run:**
```bash
git status --short --branch
git show bc10f13 --format=%B --no-patch
bun run test
bun run check
```

**Files touched:**
- Modified: `AGENTS.md`
- Modified: `docs/reference/tools/codex.md`
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/log.md`
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/handoff.md`
- Modified: `docs/slices/slice-17/slice-17k/spec.md`
- Modified: `docs/slices/slice-17/slice-17k/plan.md`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D001: Treat Codex plugins as the installable bundle/distribution layer, not as a synonym for MCPs or skills.
- D002: Document verified Codex gaps explicitly instead of leaving `TBD` rows in the overlay (for example: no separately verified Codex-local XL binding yet; app-local `/model` is not currently documented).
- D003: Include the Codex app's external-config import bridge in the portability story because it can reuse Claude skills and enabled-plugin state.

**Errors encountered:**
- Problem: Bundled `rg.exe` could not start from the Windows Codex app package (`Access is denied`)
  Cause: the packaged binary was not executable from this environment
  Fix: switched to native PowerShell search (`Select-String`, `Get-Content`)
  Resolved: yes
- Problem: `bun run test` emitted happy-dom `AbortError` teardown noise and unrelated local-server connection refusals after reporting a green run
  Cause: pre-existing test teardown behavior outside this docs-only task
  Fix: kept the run, because Vitest exited `0` with 83/83 files and 822/822 tests passing; recorded the noise here instead of hiding it
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing Svelte warnings + happy-dom teardown noise did not fail the run |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** Added the mandatory `Session header format` section and STOP-time attribution rule to `AGENTS.md`, updated the reusable sub-slice templates with `Tool` / `Session type` / `Picking up from` and `Planned by` / `Implemented by` placeholders, and replaced the Codex overlay stub with verified role bindings, capability notes, and explicit gaps. The session also logged plan/spec amendments because Codex parity is stronger than the planning session assumed: native plugins, file-based custom agents, hooks, memories, web search, Fast mode, and an external-config import bridge are now documented.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```

---

### Session 2026-04-18 20:22 — Task 17k-5

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-4 (Codex / gpt-5.4, commit cf477fd)

**Goal:** Populate `registry.jsonc` with real entries from the current Claude and Codex inventories.

**Commands run:**
```bash
bun -e "<TypeScript JSONC parse validation>"
bun run test
bun run check
```

**Files touched:**
- Modified: `<cloud>/workflow-knowledge/stack/registry.jsonc`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D008: Populate only installable source-of-truth items, not every raw local inventory artifact.
- D009: Keep standalone MCP entries focused on concrete Codex `config.toml` servers; represent Claude's comparable capability through plugin entries when that is how the current stack is actually installed.
- D010: Pin the enabled Claude plugin set in the registry, but do not invent Codex plugin package IDs that are not yet installed or verified locally.
- D011: Keep `workflow-efficiency` as the only skill entry for now because it is the workflow-owned portable skill this slice explicitly mirrors.

**Errors encountered:**
- Problem: none in the registry content itself
  Cause: n/a
  Fix: n/a
  Resolved: yes
- Problem: `bun run test` again emitted pre-existing `ECONNREFUSED :3000` and happy-dom teardown noise after the passing summary
  Cause: existing test harness behavior unrelated to this registry-population task
  Fix: kept the run because Vitest exited `0`; recorded the noise here
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `bun -e "<TypeScript JSONC parse validation>"` | PASS — populated `registry.jsonc` parsed successfully as JSONC |
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing teardown noise persisted |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** Populated the registry with the current portable stack snapshot: 8 concrete Codex MCP entries from `~/.codex/config.toml`, the cross-tool `workflow-efficiency` skill with both Claude and Codex install targets, and the 15 currently enabled Claude plugin bundles from `~/.claude/settings.json`. The file now explicitly says Codex has plugin support while also being honest that no Codex plugin packages are pinned in this registry yet because none are currently installed and verified on this machine.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```

---

### Session 2026-04-18 20:25 — Task 17k-6

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-5 (Codex / gpt-5.4, commit 0a19d46)

**Goal:** Mirror the canonical `workflow-efficiency` skill into the cloud stack and verify the copy byte-for-byte.

**Commands run:**
```bash
Copy-Item -Path "$env:USERPROFILE\\.claude\\skills\\workflow-efficiency" -Destination "$env:YESITO_CLOUD_ROOT\\workflow-knowledge\\stack\\skills" -Recurse
Get-FileHash <source files> -Algorithm SHA256
Get-FileHash <copied files> -Algorithm SHA256
bun run test
bun run check
```

**Files touched:**
- Created: `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/SKILL.md`
- Created: `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/references/audit-existing-project.md`
- Created: `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/references/new-project-checklist.md`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D012: Treat the Claude-authored `~/.claude/skills/workflow-efficiency` directory as the canonical source for this slice's mirrored cloud skill bundle.
- D013: Verify the mirror with relative-path SHA-256 comparison across the whole tree instead of spot-checking individual files.

**Errors encountered:**
- Problem: none in the copy/verification workflow itself
  Cause: n/a
  Fix: n/a
  Resolved: yes
- Problem: `bun run test` again emitted pre-existing happy-dom teardown noise and `ECONNREFUSED :3000` output after the passing summary
  Cause: existing test harness behavior unrelated to this cloud-skill mirror task
  Fix: kept the run because Vitest exited `0`; recorded the noise here
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `Get-FileHash <source files>` + `Get-FileHash <copied files>` | PASS — relative-path SHA-256 comparison reported `TREE HASH MATCH` for all 3 mirrored files |
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing teardown noise persisted |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** The cloud stack now contains a real `workflow-efficiency` skill bundle under `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/`, and that mirror was verified byte-for-byte against the current Claude source directory. This gives `registry.jsonc` a concrete portable backing directory instead of a placeholder path.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```

---

### Session 2026-04-18 20:40 — Task 17k-7

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-6 (Codex / gpt-5.4, commit debe17b)

**Goal:** Write the Claude-side prune recommendations document from live config, plugin, rules, and skill inventories.

**Commands run:**
```bash
Get-Content ~/.claude/settings.json
Get-Content ~/.claude.json
Get-ChildItem ~/.claude/rules/
Get-ChildItem ~/.claude/plugins/cache/
Get-ChildItem ~/.claude/skills/
bun run test
bun run check
```

**Files touched:**
- Created: `<cloud>/workflow-knowledge/stack/prune-recommendations.md`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D014: Update the prune document to reflect current live state, not the stale planning hypothesis; the old "duplicate Chrome DevTools MCP" quick win is now a marketplace-metadata cleanup, not a root `mcpServers` dedupe.
- D015: Keep `everything-claude-code` out of the prune list for now because current Claude hooks still contain fallback root-resolution logic into that plugin cache.
- D016: Keep the recommendations Bun-first and recommend-only; no `npm` / `npx` commands were introduced in this task's cleanup guidance.

**Errors encountered:**
- Problem: `$env:YESITO_CLOUD_ROOT` was not set in this shell session
  Cause: this Codex app shell did not inherit the expected cloud-root environment variable
  Fix: switched to the known absolute cloud path for the artifact write
  Resolved: yes
- Problem: `bun run test` again emitted pre-existing happy-dom teardown noise and repeated `ECONNREFUSED :3000` output after the passing summary
  Cause: existing test harness behavior unrelated to this recommendation-only task
  Fix: kept the run because Vitest exited `0`; recorded the noise here
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `Test-Path <cloud>/workflow-knowledge/stack/prune-recommendations.md` | PASS — file exists and was spot-checked after creation |
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing teardown noise persisted |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** Wrote a concrete Claude-side cleanup memo at `<cloud>/workflow-knowledge/stack/prune-recommendations.md` using current on-disk state instead of only planning notes. The document now separates safe-ish quick wins from items that still need caution, including an explicit warning not to prune `everything-claude-code` cache assets yet because current hook fallback logic still points there.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```

---

### Session 2026-04-18 20:54 — Task 17k-9

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-7 (Codex / gpt-5.4, commit 6c9b34e)

**Goal:** Implement the portable stack installer at `<cloud>/workflow-knowledge/stack/install.ts` and validate dry-run/apply behavior against the live Claude + Codex configs.

**Commands run:**
```bash
bun <cloud>/workflow-knowledge/stack/install.ts --tool both --dry-run --verbose
bun <cloud>/workflow-knowledge/stack/install.ts --tool codex --apply --only mcps,skills --verbose
bun <cloud>/workflow-knowledge/stack/install.ts --tool codex --dry-run --only mcps,skills --verbose
bun <cloud>/workflow-knowledge/stack/install.ts --tool claude-code --apply --only skills,plugins --verbose
bun <cloud>/workflow-knowledge/stack/install.ts --registry <temp-invalid-file> --tool both --dry-run
bun run test
bun run check
```

**Files touched:**
- Created: `<cloud>/workflow-knowledge/stack/install.ts`
- Modified: `<cloud>/workflow-knowledge/stack/registry.jsonc`
- Modified: `<cloud>/workflow-knowledge/stack/prune-recommendations.md`
- Modified: `docs/slices/slice-17/slice-17k/spec.md`
- Modified: `docs/slices/slice-17/slice-17k/plan.md`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D017: Normalize package executors to Bun-first when applying registry entries: `npx` becomes `bunx`, and `npm` becomes `bun`.
- D018: Treat `~/.codex/skills/` as the installer-managed Codex target; keep `~/.agents/skills/` observational-only because the shared import layer can legitimately diverge from the canonical cloud copy.
- D019: Use the verified local Claude CLI surface (`claude plugin marketplace add` + `claude plugin install`) and skip already-enabled plugin entries cleanly.

**Errors encountered:**
- Problem: the planning notes still assumed a flatter Claude marketplace command shape and older Codex-plugin assumptions
  Cause: those details were captured before local CLI verification and before the Bun-only clarification
  Fix: verified the live `claude plugin ...` help output, corrected the prune command example, and logged spec/plan amendments for Bun-first normalization and Codex shared-import handling
  Resolved: yes
- Problem: the first dry-run surfaced that auto-managing `~/.agents/skills/workflow-efficiency` would overwrite a divergent imported Codex-side variant
  Cause: the shared import layer currently contains a Codex-adapted copy rather than the canonical cloud mirror
  Fix: narrowed install.ts to manage `~/.codex/skills/` only and treat `~/.agents/skills/` as informational context
  Resolved: yes
- Problem: `bun run test` again emitted pre-existing happy-dom teardown noise and repeated `ECONNREFUSED :3000` output after the passing summary
  Cause: existing test harness behavior unrelated to this installer task
  Fix: kept the run because Vitest exited `0`; recorded the noise here
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `bun <cloud>/workflow-knowledge/stack/install.ts --tool both --dry-run --verbose` | PASS — readable diff preview for Codex MCP normalization + Codex skill install target; Claude plugin entries cleanly reported as already enabled |
| `bun <cloud>/workflow-knowledge/stack/install.ts --tool codex --apply --only mcps,skills --verbose` | PASS — wrote `~/.codex/config.toml` and created `~/.codex/skills/workflow-efficiency/` |
| `bun <cloud>/workflow-knowledge/stack/install.ts --tool codex --dry-run --only mcps,skills --verbose` | PASS — second dry-run came back clean/no-op after apply |
| `bun <cloud>/workflow-knowledge/stack/install.ts --tool claude-code --apply --only skills,plugins --verbose` | PASS — safe no-op; Claude skill already synced and all registry plugins were already enabled |
| `bun <cloud>/workflow-knowledge/stack/install.ts --registry <temp-invalid-file> --tool both --dry-run` | PASS — exited `1` with a clear JSONC parse error for malformed registry input |
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing teardown noise persisted |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** Built the first working registry applier at `<cloud>/workflow-knowledge/stack/install.ts` with Bun-only command normalization, custom JSONC parsing, a minimal TOML writer, per-tool/per-category filtering, diff-style dry-run output, and real apply mode for Codex MCPs/skills plus Claude skills/plugins. The task also normalized the Playwright MCP source command in `registry.jsonc` from `npx` to `bunx`, corrected the prune document's Claude marketplace command example, and recorded the important portability boundary that the shared import layer under `~/.agents/skills/` is not auto-managed by the installer.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```

---

### Session 2026-04-18 20:14 — Task 17k-4

**Tool:** Codex (gpt-5.4, reasoning=xhigh)
**Session type:** Implementation
**Picking up from:** Task 17k-3 (Codex / gpt-5.4, commit 777d70f)

**Goal:** Design the machine-readable stack registry schema at `<cloud>/workflow-knowledge/stack/registry.jsonc`.

**Commands run:**
```bash
bun -e "<TypeScript JSONC parse validation>"
bun run test
bun run check
```

**Files touched:**
- Created: `<cloud>/workflow-knowledge/stack/registry.jsonc`
- Modified: `docs/slices/slice-17/slice-17k/log.md`
- Modified: `docs/slices/slice-17/slice-17k/handoff.md`

**Decisions:**
- D004: The registry covers only installable cross-tool artifacts: MCPs, skills, plugins, and agents.
- D005: Hooks, rules, and memories stay out of `registry.jsonc` for now and are explicitly marked as deferred categories instead of being forced into a fake portable schema.
- D006: Agent entries are modeled as per-tool native artifacts because Claude and Codex use different on-disk formats.
- D007: Skill entries use path-relative sources so the cloud registry can act as the portable source of truth instead of pointing back to a home-directory snapshot.

**Errors encountered:**
- Problem: the first JSONC-parse wrapper used invalid PowerShell inline `if (...)` syntax
  Cause: I wrote Bash-style inline conditional syntax inside a PowerShell expression
  Fix: reran the validation with a proper PowerShell variable assignment and TypeScript's JSONC parser
  Resolved: yes
- Problem: `bun run test` again emitted pre-existing local-server `ECONNREFUSED :3000` noise after the green summary
  Cause: existing test teardown behavior unrelated to this registry-schema task
  Fix: kept the run because Vitest still exited `0`; recorded the noise here
  Resolved: yes

**Validation:**
| Command | Result |
|---------|--------|
| `bun -e "<TypeScript JSONC parse validation>"` | PASS — `registry.jsonc` parsed successfully as JSONC |
| `bun run test` | PASS — 83 files / 822 tests passed; pre-existing teardown noise persisted |
| `bun run check` | PASS — 0 errors / 19 warnings in 12 pre-existing files |

**Outcome:** Created the first version of `<cloud>/workflow-knowledge/stack/registry.jsonc` with a deliberately narrow schema: top-level metadata plus `mcps`, `skills`, `plugins`, and `agents` arrays, each documented with a canonical commented example. The schema now distinguishes bundle-layer plugins from skills and MCPs, supports per-tool overrides through a `tools` map, allows version/ref pinning where useful, and records deferred categories (`hooks`, `rules`, `memories`) instead of pretending they already have a portable install story.

**Blockers / questions:** none

**Budget row:**

```
Model: gpt-5.4 (effort=xhigh) | Context: unavailable / 258k (n/a) — current agent tool surface did not expose `/status`
```
