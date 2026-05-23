#!/usr/bin/env bash
# PreToolUse matcher (workflow-overlord Rule 2 / D-fix-1 — Notion edit primitives).
#
# Refuses update-page-properties calls (binding SET: `*notion-update-page*` for
# the Claude bundled connector + `*API-patch-page*` for @notionhq/notion-mcp-server)
# that use:
#   command: "update_content"
# AND have any content_updates entry with a non-empty `old_str`.
#
# Note (slice-17c): the @notionhq/notion-mcp-server `API-patch-page` shape does
# not currently expose `command: update_content / old_str` — its native payload
# is page_id + properties. The matcher includes `*API-patch-page*` as a
# future-proof regression guard: if a future MCP server version exposes the
# update_content shape on API-patch-page, the hook catches it immediately.
#
# Surgical old_str matches against Notion content fail silently or hit the wrong
# block because Notion normalizes whitespace, code fences, tables, and links.
# Use the workflow primitives or `replace_content` instead.
#
# Contract:
#   - Reads JSON hook payload from $WORKFLOW_HOOK_STDIN_JSON (preferred) or stdin.
#   - Exit 2 + stderr refusal => Claude/Codex blocks the tool call.
#   - Exit 0 silently otherwise.
#   - Non-adopter cwd / missing jq => exit 0 (D-15.10: hooks MUST exit 0 silently
#     in non-adopter cwds).
set -euo pipefail

payload="${WORKFLOW_HOOK_STDIN_JSON:-}"
if [ -z "$payload" ] && [ ! -t 0 ]; then
  payload="$(cat 2>/dev/null || echo '')"
fi
if [ -z "$payload" ]; then exit 0; fi

if ! command -v jq >/dev/null 2>&1; then exit 0; fi

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // .toolName // ""' 2>/dev/null || echo '')"
# Known update-page-properties bindings for the R-9 (update_content discipline) hook.
# Capability-layer doctrine (slice-17c D-17c.1): the `update-page-properties` capability
# has two known bindings:
#   *notion-update-page*  Claude Code bundled connector (substring match covers any slug).
#   *API-patch-page*      @notionhq/notion-mcp-server low-level surface (future-proof:
#                         native API-patch-page shape doesn't expose update_content/old_str,
#                         but matcher widening catches any future MCP version that does).
# The inner gate (`command != "update_content"` → exit 0) means non-matching shapes pass
# through anyway, so widening here is a no-cost regression guard.
case "$tool_name" in
  *notion-update-page* | *API-patch-page*) ;;
  *) exit 0 ;;
esac

command_value="$(printf '%s' "$payload" | jq -r '.tool_input.command // .toolInput.command // ""' 2>/dev/null || echo '')"
if [ "$command_value" != "update_content" ]; then exit 0; fi

has_old_str="$(printf '%s' "$payload" | jq -r '
  (.tool_input // .toolInput // {})
  | (.content_updates // .contentUpdates // [])
  | map(.old_str // .oldStr // "")
  | any(. != "")
' 2>/dev/null || echo 'false')"
if [ "$has_old_str" != "true" ]; then exit 0; fi

cat >&2 <<'REFUSAL'
REFUSED by workflow-overlord PreToolUse hook (Rule 2 / D-fix-1).

Calling `notion-update-page` with `command: update_content` and a non-empty
`old_str` is forbidden. Notion normalizes whitespace, code fences, tables,
and inline links; surgical old_str matches fail silently or edit the wrong
block shape.

Use one of the workflow primitives instead:
  - notion_set_properties
  - notion_append_section
  - notion_replace_section
  - notion_create_with_full_body
  - notion_ensure_child_page          (children only)

For whole-body atomic rewrites built from a fetched state, use
`command: replace_content` (no old_str needed).

Reference: AGENTS.md Rule 2; workflow-overlord-reference § 12.
REFUSAL
exit 2
