# Output destinations section — verbatim from workflow plugin scaffold

**Source:** `C:/Users/otalo/Yesito/Projects/workflow/plugins/workflow/skills/workflow-add/scaffold/AGENTS.md`
**Section:** `## Output destinations (Notion-canonical)` (v0.4.0+1 / post-2026-04-27)
**Captured:** 2026-04-28

---

## Output destinations (Notion-canonical)

**The plugin is Notion-canonical (post-2026-04-27, plugin v0.4.0+ / D21).** When AI tools (Claude Code, Codex) generate workflow artifacts during a session — specs, plans, handoffs, brainstorm output, session logs — those artifacts MUST land in Notion, not in the repo. The repo's `docs/` directory holds only `ai-memory/`. Every other documentation surface lives in Notion.

This rule overrides any third-party plugin's default file-output behavior (e.g., `superpowers:brainstorming`, `superpowers:writing-spec`, `superpowers:writing-plans` historically save to `docs/superpowers/specs/<date>-<name>.md` and `docs/superpowers/plans/<date>-<name>.md`). Under this workflow contract those defaults are SUPERSEDED — see the table below for canonical destinations.

### Where each artifact goes

| Artifact | Slice-context destination | Free-form (non-slice) destination |
|---|---|---|
| **Brainstorm output** (chat-driven option exploration) | Ephemeral; resolves into a Spec row body when planning completes. | Ephemeral; resolves into the Sessions DB row body. |
| **Spec** (design decisions, scope, acceptance criteria) | Specs DB row body (linked from the Slice row's `Spec` relation). One row per spec. | Sessions DB row body OR a `Spec` child page under the Sessions row, if the work justifies a real spec. |
| **Plan** (task breakdown, sequencing) | Slice row's child `Plan` page body (created by `/workflow-slice-open` from the plugin Plan template). | Sessions DB row body, or a `Plan` child page under the Sessions row. |
| **Handoff** (PR body draft, peer-review notes, deferred risks) | Slice row's child `Handoff` page body. | N/A — non-slice work doesn't usually have a PR boundary. If it does, write to the Sessions row's body. |
| **Mid-slice handoff** (`/workflow-handoff --action --for <topic>`) | A `Handoff: <topic>` child page under the Slice row (sibling of the slice-close `Handoff` page). | N/A — handoffs require a slice. |
| **Session log** (cross-tool continuity narrative) | Sessions DB row (one per wall-clock session). The row's `Slices touched` relation links it to the active slice(s). | Sessions DB row with no `Slices touched` relation. |

### Override rule for third-party plugins

When a third-party plugin (`superpowers`, others) wants to write to a `docs/<plugin-name>/` path during this workflow's session, the AI tool MUST:

1. **Fetch** the artifact's intended content (per the plugin's normal flow).
2. **Write** the content to the Notion destination from the table above (using `mcp__notion__notion-create-pages` / `notion-update-page`), NOT to the suggested file path.
3. **Surface** the resolved Notion URL to the operator instead of the file path.

The repo's `docs/` should only ever contain `ai-memory/` post-Phase-1. If the AI tool detects a non-`ai-memory/` path under `docs/` after a session, that's drift — flag it to the operator and propose moving the content to Notion.

**Hook enforcement (optional, recommended):** projects can install a pre-commit hook that refuses commits introducing files under `docs/superpowers/`, `docs/specs/`, `docs/plans/`, or `docs/sessions/`. Sample hook lives at `<plugin>/contrib/git-hooks/notion-canonical-check.sh` (TBD — v0.5).

### Sessions DB row authoring (free-form)

For free-form sessions where there's no active slice, the AI tool creates the Sessions DB row at session start:
- `Name`: `<YYYY-MM-DD HH:MM> — <one-line topic>`
- `Date`: today
- `Project`: this project's name (from AGENTS.md frontmatter or operator)
- `Slices touched`: empty (or relation to a `chore` rollup slice if the project maintains one)
- `Brief summary`: filled at session end

Row body holds the session's narrative. If the session generates a real spec / plan / brainstorm artifact, those go in the body or as child pages under the Sessions row (per the table above).
