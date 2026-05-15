#!/usr/bin/env bash
# PreToolUse matcher (workflow-overlord Rule 6 / fork-safety).
#
# Refuses any Notion MCP tool call (binding SET: `mcp__*__notion-*` for the
# Claude bundled connector + `mcp__*__API-*` for @notionhq/notion-mcp-server)
# when the resolved workflow config still carries `<FILL IN>` placeholder
# values. Adopters who forked the repo without running
# `/workflow-overlord-add --root-page-id <uuid>` would otherwise silently
# write into the maintainer's Notion subtree. The `mcp__*__API-*` arm of
# the matcher is intentionally broad (slice-17c D-17c.5); see the comment
# block by the `case` statement below for the trade-off rationale.
#
# Contract:
#   - Resolves config in the same order as agents-resolver (AGENTS.override.md
#     > AGENTS.local.md > AGENTS.md). First existing-with-non-empty-frontmatter
#     file wins, exactly as the resolver does.
#   - If that file's frontmatter contains `<FILL IN`, exit 2 with refusal.
#   - Otherwise exit 0.
#   - Non-Notion tools, non-adopter cwds, and missing-frontmatter cases all
#     pass silently (D-15.10).
set -euo pipefail

payload="${WORKFLOW_HOOK_STDIN_JSON:-}"
if [ -z "$payload" ] && [ ! -t 0 ]; then
  payload="$(cat 2>/dev/null || echo '')"
fi
if [ -z "$payload" ]; then exit 0; fi

if ! command -v jq >/dev/null 2>&1; then exit 0; fi

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // .toolName // ""' 2>/dev/null || echo '')"
# Known Notion MCP binding SET (capability-layer doctrine, slice-17c).
#
# Two alternative shapes match — pattern is intentionally broad to guarantee
# completeness against the actual @notionhq/notion-mcp-server@2.2.1 OpenAPI
# surface (~30 operations, list grows on version bumps):
#
#   mcp__*__notion-*    Claude Code bundled connector. `notion-` tool prefix is unique
#                       enough that the server-slug is unconstrained — covers UUID-
#                       registered servers (e.g. `mcp__43a69aaf-...__notion-update-page`)
#                       and any future variant that keeps the `notion-` prefix.
#
#   mcp__*__API-*       @notionhq/notion-mcp-server low-level surface. `API-*` prefix is
#                       generic across REST-API-wrapping MCP servers, so this alternative
#                       OVER-MATCHES non-Notion MCP servers that happen to use `API-*`
#                       names. Accepted trade-off (slice-17c D-17c.5): on a fork with
#                       `<FILL IN>` placeholder config, an unrelated `API-*` call gets a
#                       false-positive Rule 6 REFUSE. The refusal is INFORMATIONAL — it
#                       tells the operator to set up Notion config (or remove the
#                       workflow-overlord pretool hooks if Notion isn't in scope). It is
#                       not destructive. The trade-off favors completeness for Notion
#                       fork-safety over precision for non-Notion API-* tools.
#
# workflow-overlord-using SKILL § MCP capability layer documents the full alias table.
case "$tool_name" in
  mcp__*__notion-* | mcp__*__API-*) ;;
  *) exit 0 ;;
esac

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$repo_root" ] || exit 0

frontmatter=""
source_file=""
for name in AGENTS.override.md AGENTS.local.md AGENTS.md; do
  file="${repo_root}/${name}"
  [ -f "$file" ] || continue
  frontmatter="$(awk '/^---$/{f=!f; next} f' "$file" 2>/dev/null || echo '')"
  if [ -n "$frontmatter" ]; then
    source_file="$name"
    break
  fi
done

if [ -z "$frontmatter" ]; then
  cat >&2 <<'NO_CONFIG'
REFUSED by workflow-overlord PreToolUse hook (Rule 6 / fork-safety).

No usable workflow config found. Looked for frontmatter in:
  AGENTS.override.md > AGENTS.local.md > AGENTS.md

Run `/workflow-overlord-add --root-page-id <uuid>` to populate a gitignored
override file (defaults to AGENTS.local.md; pass `--override-name AGENTS.override.md`
for Codex-native naming). Do NOT paste real Notion UUIDs into committed AGENTS.md.

Reference: AGENTS.md Rule 6; workflow-overlord-reference § 3.
NO_CONFIG
  exit 2
fi

# Anchor on YAML key:value lines only — skip comment lines that may legitimately
# mention `<FILL IN>` as documentation text. Matches `key: "<FILL IN..."` and
# bare `key: <FILL IN...` (with/without quotes).
if printf '%s' "$frontmatter" | grep -Eq '^[[:space:]]*[A-Za-z0-9_]+:[[:space:]]*"?<FILL IN'; then
  cat >&2 <<REFUSAL
REFUSED by workflow-overlord PreToolUse hook (Rule 6 / fork-safety).

\`${source_file}\` is the highest-priority workflow config in this repo, but
its frontmatter still carries \`<FILL IN>\` placeholder values. Calling Notion
MCP tools without populated UUIDs would either fail at the API layer or, worse,
silently target the wrong workspace.

Run \`/workflow-overlord-add --root-page-id <uuid>\` to populate a gitignored
override file (defaults to AGENTS.local.md; pass \`--override-name AGENTS.override.md\`
for Codex-native naming). Do NOT paste real Notion UUIDs into committed AGENTS.md.

Reference: AGENTS.md Rule 6; workflow-overlord-reference § 3.
REFUSAL
  exit 2
fi

exit 0
