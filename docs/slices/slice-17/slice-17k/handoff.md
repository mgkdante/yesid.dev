# Sub-Slice 17k — Handoff

Self-appending. Gains a per-task section as tasks land. Finalized at PR. PR body is derived from this.

**Sub-slice:** 17k — Cross-Tool Workflow Portability
**Spec:** [`spec.md`](./spec.md) (approved 2026-04-18)
**Plan:** [`plan.md`](./plan.md)
**Branch (post-prep):** `feature/slice-17k-cross-tool-portability`

---

## Task sections (fill as tasks land)

### Task 17k-1 — Shrink CLAUDE.md → thin pointer

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

_(Summary goes here when task ships.)_

### Task 17k-2 — Generic-term pass

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** _(pending)_
**Status:** _(pending)_

### Task 17k-3 — Tool-attribution convention

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Modified: `AGENTS.md` — added the canonical session-header format and made STOP-time tool attribution mandatory
- Modified: `docs/reference/tools/codex.md` — replaced the Codex overlay stub with verified role bindings, capability notes, and explicit gaps
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/log.md` — added `Tool`, `Session type`, and `Picking up from` placeholders and a timestamped session heading
- Modified: `docs/slices/_TEMPLATE-SUBSLICE/handoff.md` — added `Planned by` / `Implemented by` placeholders to the reusable task template
- Modified: `docs/slices/slice-17/slice-17k/spec.md` — logged the Codex self-research amendment that supersedes the earlier "no plugin concept" assumption
- Modified: `docs/slices/slice-17/slice-17k/plan.md` — logged the expanded Session 2 overlay-population scope
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 2 implementation details and verification results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-3 now covers both halves of the portability contract: repo-level attribution discipline and Codex-side self-description. `AGENTS.md` now requires explicit tool provenance in `log.md` / `handoff.md`, the reusable slice templates include the needed placeholders, and the Codex overlay no longer hides unknowns behind `TBD`. It now documents verified native counterparts for the tracker, subagents, context checks, skills, memories, hooks, rules, web search, Fast mode, plugins, agents, and Codex's external-config import bridge from Claude.

**Decisions:**
- D001: Codex plugins are the installable bundle layer; skills remain the authoring unit and MCPs remain the tool/server layer.
- D002: The overlay should state real gaps explicitly instead of implying parity that is not yet verified.
- D003: `~/.agents/skills` belongs in the portability story on this machine because the Codex app imports external skills there.

**Tests:** PASS — `bun run test` (83 files / 822 tests) and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-4 — Registry schema

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Created: `<cloud>/workflow-knowledge/stack/registry.jsonc` — first machine-readable schema for cross-tool stack items
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3 implementation details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-4 creates the actual machine-readable foundation that later tasks will populate and apply. The registry is intentionally scoped to installable, cross-tool artifacts only: MCPs, skills, plugins, and agents. Each category now has a canonical commented example, a shared `install_in` contract, a tool-neutral `source` block, and a per-tool `tools` map for the native differences that matter at install time.

**Decisions:**
- D004: The registry should stay narrow and executable, not turn into a dumping ground for every agent capability.
- D005: Hooks, rules, and memories are explicitly deferred because they do not yet have a clean portable install story across Claude Code and Codex.
- D006: Agents are modeled as per-tool native files because Codex and Claude do not share one file format.
- D007: Skill sources should point at cloud-managed paths so the registry remains the source of truth.

**Tests:** PASS — TypeScript JSONC parse validation, `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-5 — Populate registry

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Modified: `<cloud>/workflow-knowledge/stack/registry.jsonc` — populated with concrete MCP, skill, and plugin entries from the live Claude/Codex inventories
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3 implementation details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-5 turns the registry schema into a usable source of truth. The file now contains the current 8-entry Codex MCP set, the workflow-owned cross-tool `workflow-efficiency` skill, and the full currently enabled Claude plugin bundle set. The registry is explicit that Codex does have plugin support, but it does not pretend we already know the correct Codex marketplace/package IDs for those plugins when this machine has not actually installed and verified them yet.

**Decisions:**
- D008: The registry should capture reproducible install targets, not become a raw machine dump.
- D009: Concrete standalone MCP entries currently come from Codex config; Claude-side comparable capabilities are represented through plugin bundles when that is how they are actually installed today.
- D010: Codex plugin support is documented, but no unverified Codex plugin package IDs are pinned yet.
- D011: `workflow-efficiency` is the only skill entry in scope for this slice's managed registry.

**Tests:** PASS — TypeScript JSONC parse validation, `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-6 — Copy user-authored skill

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Created: `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/SKILL.md` — mirrored canonical skill entrypoint into the portable cloud stack
- Created: `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/references/audit-existing-project.md` — mirrored supporting reference document
- Created: `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/references/new-project-checklist.md` — mirrored supporting reference document
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3 implementation details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-6 gives the registry's lone skill entry a real portable source tree. The `workflow-efficiency` bundle now exists under `<cloud>/workflow-knowledge/stack/skills/workflow-efficiency/` with its main `SKILL.md` plus both reference documents, so future install/apply tooling can source it from cloud-managed state instead of a user-home path.

**Decisions:**
- D012: Use `~/.claude/skills/workflow-efficiency` as the canonical source for this slice's mirror.
- D013: Require whole-tree SHA-256 verification so the mirror claim is byte-for-byte, not approximate.

**Tests:** PASS — relative-path SHA-256 tree comparison (`TREE HASH MATCH`), `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-7 — Prune-recommendations document

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Created: `<cloud>/workflow-knowledge/stack/prune-recommendations.md` — Claude-side cleanup memo with quick wins, disabled-plugin review list, and do-not-prune guardrails
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3 implementation details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-7 turns the earlier research into an actionable cleanup memo without executing any cleanup. The new document is grounded in current disk state and captures four concrete quick wins, a 17-entry disabled-plugin review table, the current 117-skill sprawl note, and explicit "do not prune yet" guardrails for the assets that are still referenced indirectly by Claude hooks.

**Decisions:**
- D014: The earlier duplicate-Chrome-DevTools-MCP hypothesis was downgraded to a marketplace-metadata cleanup because the root `~/.claude.json` `mcpServers` entry is no longer present.
- D015: `everything-claude-code` cache assets stay off the prune list until the hook fallback logic is migrated away from them.
- D016: The recommendations stay Bun-first and recommend-only; this task introduced no `npm` / `npx` commands.

**Tests:** PASS — file existence spot-check, `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

### Task 17k-8 — Cross-tool verification (Codex)

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Verified by:** _(pending — will be Codex)_
**Status:** _(pending)_

### Task 17k-9 — Install script

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Created: `<cloud>/workflow-knowledge/stack/install.ts` — Bun-based registry applier for MCPs, skills, plugins, and agents
- Modified: `<cloud>/workflow-knowledge/stack/registry.jsonc` — normalized the Playwright MCP command to `bunx`
- Modified: `<cloud>/workflow-knowledge/stack/prune-recommendations.md` — corrected the verified Claude marketplace command example
- Modified: `docs/slices/slice-17/slice-17k/spec.md` — logged the Bun-first / shared-import handling amendment
- Modified: `docs/slices/slice-17/slice-17k/plan.md` — logged the same amendment and corrected the verified Claude plugin CLI wording
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3b implementation details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-9 turns the registry from documentation into an executable workflow artifact. The new `install.ts` can read the JSONC registry, filter by tool/category, show a diff-style dry-run without touching shell or disk, apply real Codex MCP/skill changes, and reconcile Claude skill/plugin state without reinstalling entries that are already enabled. It also proves the Bun-only rule in practice: the installer normalizes package-executor commands to `bun` / `bunx` instead of carrying forward `npm` / `npx`.

**Decisions:**
- D017: Normalize package executors to Bun-first during apply (`npx` → `bunx`, `npm` → `bun`).
- D018: Manage `~/.codex/skills/` as the Codex install target, but do not auto-manage `~/.agents/skills/` because the shared import bridge can contain a deliberately divergent copy.
- D019: Use the verified `claude plugin marketplace add` + `claude plugin install` command surface and skip already-enabled plugin entries cleanly.

**Tests:** PASS — dual-tool dry-run, real Codex apply (`~/.codex/config.toml` + `~/.codex/skills/workflow-efficiency`), clean follow-up dry-run, safe Claude no-op apply, malformed-registry exit-1 check, `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

**Post-ship verification — Claude plugin apply codepath (2026-04-18, Claude Code / Opus 4.7 `[1m]`):**

The original 17k-9 tests only exercised the "already enabled → skip" path for Claude plugins (no-op apply). Review finding F5 flagged that the actual run path — `claude plugin list --json` → compute disjunction → run `claude plugin install <name>@<marketplace> --scope user` — had never fired end-to-end. Stress test executed against `playground@claude-plugins-official`:

1. `claude plugin list --json` returns the expected `[{id, version, scope, enabled, installPath, ...}]` shape — matches `install.ts`'s `ClaudePluginListItem`.
2. `claude plugin disable playground@claude-plugins-official` → flips both `settings.json > enabledPlugins` and the runtime state reported by `claude plugin list --json` to `false`.
3. `bun install.ts --tool claude-code --dry-run --only plugins` → correctly planned `action: run command(s)` with `claude plugin install playground@claude-plugins-official --scope user`.
4. `bun install.ts --tool claude-code --apply --only plugins --verbose` → executed the install command, got exit `0`, apply summary reported `- ran claude plugin install playground@claude-plugins-official --scope user`.
5. Post-apply `claude plugin list --json` → playground back to `enabled: true`.
6. Final baseline dry-run → all 15 registry plugins back to `action: skip, reason: Already enabled.` — no permanent state changes.

Confirms: `claude plugin install X@Y --scope user` on an already-installed-but-disabled plugin **re-enables it** (doesn't error, doesn't reinstall, doesn't no-op). This is the behavior `install.ts` silently depends on. F5 resolved.

Still untested (deferred to 17l / post-migration):
- Marketplace-add path (`claude plugin marketplace add <repo> --scope user`) — all registry plugins live in marketplaces already present in `settings.json > extraKnownMarketplaces`.
- Codex plugin install path — Codex has zero plugins locally, so there's nothing to disable-and-restore.

### Task 17k-10 — Round-trip registry test

**Planned by:** Claude Code (Opus 4.7 `[1m]`)
**Implemented by:** Codex (gpt-5.4, reasoning=xhigh)
**Status:** shipped

**Files:**
- Modified: `<cloud>/workflow-knowledge/stack/install.ts` — materializes registry-owned skill version metadata into installed `SKILL.md` frontmatter during apply
- Modified: `<cloud>/workflow-knowledge/stack/registry.jsonc` — added the `workflow-efficiency` `version` field and executed the `1.0.0 -> 1.0.1` verification bump
- Modified: `docs/slices/slice-17/slice-17k/spec.md` — logged the scope amendment that made the round-trip test meaningful
- Modified: `docs/slices/slice-17/slice-17k/plan.md` — recorded the same amendment before proceeding with the verification task
- Modified: `docs/slices/slice-17/slice-17k/log.md` — recorded Session 3b verification details and validation results
- Modified: `docs/slices/slice-17/slice-17k/handoff.md` — recorded this shipped task summary

**What landed:**
Task 17k-10 proves that registry-owned skill-version metadata propagates to both tool install targets. The installer injects or updates `version:` in installed `SKILL.md` frontmatter from the registry; the test seeded both tool installs at `1.0.0`, bumped the registry to `1.0.1`, and verified that both `~/.claude/skills/workflow-efficiency/SKILL.md` and `~/.codex/skills/workflow-efficiency/SKILL.md` converged to `version: 1.0.1` without mutating the cloud source skill bundle.

**Scope of the verification (what this test does NOT prove):**
- Covers **skills only**. MCP, plugin, and agent round-trip behavior has **not** been bumped-and-observed end-to-end across tools. `install.ts --tool both --apply` was exercised for those categories in Task 17k-9 (a safe no-op because all plugins were already enabled and both tools' MCP/skill state matched the registry), but no registry-driven value has been changed and propagated to both tools for MCPs or plugins.
- The `version` field used as the propagation probe was added to the schema in this same task (per D020) specifically to give the test a propagating value — the field did not exist before. The test validates that the newly added injection code path works, not a pre-existing invariant.
- The general "change registry once, apply to both tools" contract is **unproven outside the skill category**.

**Decisions:**
- D020: Skill round-trip verification should operate on registry-owned metadata that can be projected into both tool installs without changing the cloud-authored skill content.
- D021: The cloud skill source stays version-agnostic; version materialization happens only at install targets.

**Tests:** PASS — seeded `1.0.0` dry-run/apply, bumped `1.0.1` dry-run/apply, clean follow-up dry-run with both targets in sync, `bun run test` (83 files / 822 tests), and `bun run check` (0 errors / 19 pre-existing warnings)

---

## Summary (fill at PR)

_(One-paragraph what-changed overview. Reviewer-facing.)_

## PR body (fill at PR)

_(Derived from the task sections above. Markdown structure ready for `gh pr create --body`.)_
