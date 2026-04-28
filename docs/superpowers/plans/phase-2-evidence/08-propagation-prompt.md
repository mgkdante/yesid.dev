# Workflow plugin propagation prompt — v0.4.0 / v0.5.0

> Bootstrap a NEW project (not yesid.dev, not the workflow plugin itself) onto the Notion-aware fractal-architecture workflow plugin. Tested via yesid.dev's Phase 2 retrofit (2026-04-27 → 2026-04-28).

## Pre-flight

You will need:
- A Notion workspace named `Projects` (or any name; create if missing).
- The Notion MCP authenticated via `/mcp` in Claude Code or Codex.
- A Notion integration generated at `https://www.notion.so/my-integrations` with permission to read + insert content. Share the project's workspace pages with this integration.
- A repo where the new project will live, with `.mcp.json` enabling the Notion MCP entry (HTTP transport: `https://mcp.notion.com/mcp`).

## Bootstrap flow

1. **Run `/workflow-add` in the new project's repo.**

   Per plugin v0.4.0+: the command provisions a flat Notion subtree at `Projects/<your-project>/` with these direct children:
   - `Brand` (with `Foundations`, `Decisions`, `Examples`, `Components` if your project has brand work)
   - `Project` (with seven seeded skeletons: `README`, `STACK`, `BINDINGS`, `ARCHITECTURE`, `TESTS`, `CONSTITUTION`, `VOCAB`)
   - `Roadmap`, `Ops`
   - `Memory` (auto-pulled at session start by the SessionStart hook)
   - `Archive`
   - Four databases: `Specs` (per Section 16 A1), `Slices`, `Conversations`, `Sessions`

   Per v0.5.0+ (the fractal architecture, D-fractal-1):
   - The Slices DB schema includes `Parent slice` ↔ `Sub-slices` (DUAL self-relation) for L2 sub-slice nesting.
   - Each slice gets a child trio of pages named `slice-NN-spec`, `slice-NN-plan`, `slice-NN-handoff` (hyphen-lowercase, per D-name-4).
   - The Project-level trio (`project-spec`, `project-plan`, `project-handoff`) lives at the project root.
   - The Specs DB referenced in the original spec is **deprecated** — Spec content lives in slice trio child pages, not separate DB rows.

   The command writes minimal `AGENTS.md` (with Notion frontmatter pre-filled), `CLAUDE.md` (thin pointer), `.mcp.json` (Notion + any other MCPs), `.claude/settings.json` (workflow plugin reference) into the repo. The scaffold AGENTS.md auto-loads the **Output destinations** rule (per the v0.4.0+1 commit) so planning commands route output to Notion automatically.

2. **Verify wiring.**

   Run `/workflow-status`. Expected output: plugin v0.5.0+ detected, all 4 DB UUIDs resolved, no active slice yet.

3. **Install hooks (memory + transcripts).**

   Copy from yesid.dev:
   - `apps/web/scripts/notion-hooks/lib/notion-client.ts`
   - `apps/web/scripts/notion-hooks/session-start.ts`
   - `apps/web/scripts/notion-hooks/migrate-conversations.ts`
   - `apps/web/scripts/notion-hooks/session-stop.ts`

   Adjust constants for the new project:
   - `PROJECT_HASH` → your project's hash from `~/.claude/projects/<hash>/`
   - `MEMORY_PARENT_ID` → your Memory page UUID (from `/workflow-status` output)
   - `CONVERSATIONS_DB_ID` → your Conversations DB UUID

   Generate a Notion integration at `https://www.notion.so/my-integrations`. Set the env var:
   ```bash
   export NOTION_INTEGRATION_TOKEN=<your-token>
   ```

   Register the hooks in `~/.claude/settings.json`:
   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "match": "<your-repo-path>",
           "command": "bun <path>/apps/web/scripts/notion-hooks/session-start.ts"
         }
       ],
       "Stop": [
         {
           "match": "<your-repo-path>",
           "command": "bun <path>/apps/web/scripts/notion-hooks/session-stop.ts"
         }
       ]
     }
   }
   ```

   (Note: Claude Code's canonical event name is `Stop`, not `SessionStop`.)

   Restart Claude Code. SessionStart will pull memory; SessionStop will push completed transcripts.

4. **Start working.**

   `/workflow-slice-open <name>` creates a Slices DB row + linked `slice-NN-spec/-plan/-handoff` child pages in Notion. `/workflow-handoff` and `/workflow-close-slice` flow through Notion automatically.

   Planning commands (`writing-spec`, `writing-plans`, `superpowers:brainstorming`, `writing-handoff`) **route output to Notion** automatically per the v0.4.0+1 output-destinations contract — the rule auto-loads from AGENTS.md at session start.

## R-9 discipline (CRITICAL — applies to all Notion edits)

Notion silently normalizes content on store. **Markdown does not round-trip byte-identical.** Apply these every time:

1. **Always `fetch` current content before `update_content`** — construct `old_str` from FETCHED text, never in-memory markdown.
2. **Prefer structured properties over body markdown** for queryable state (Slice Status, Dates, PR link, Slice-N, Parent slice).
3. **Prefer `replace_content` over `update_content`** when the diff is non-trivial.
4. **Avoid bare triple-backtick fences.** Always specify a language (`text`, `bash`, `python`, `markdown`).
5. **Atomic `create-pages` only.** Build full body before the call. No create-then-append.

Reference: yesid.dev's spec at `docs/superpowers/specs/2026-04-27-notion-arc-design.md` § 17 R-9 (and `mgkdante/workflow > slice-2a Spec` for the canonical version).

## Notes

- The Public-safe/Private split is no longer the plugin DEFAULT (per Section 16 A4 of the Notion arc spec). Existing legacy projects (yesid.dev) keep their flat shape; new projects get the flat shape from `/workflow-add`.
- Memory is ALWAYS auto-pulled local at session start. Hook script is the integration point — don't try to embed Notion fetches into Claude's auto-load directly.
- The output-destinations rule (v0.4.0+1) lives in the scaffold AGENTS.md the plugin writes during `/workflow-add`. Don't strip it — it's load-bearing.
- Cascade rule (D-casc-1): when an artifact at level N changes, workflow checks the parent (N-1) Plan/Spec body for the slice ID via text-match. Recursive. Default ON; `--no-cascade` skips per call.
