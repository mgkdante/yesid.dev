#!/usr/bin/env bash
# workflow-overlord v2 — SessionStart hook (Guarantee #1)
# Resolves NOTION_TOKEN via 1Password CLI (or env), then runs scripts/session-start.ts.
set -euo pipefail

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(git -C "$HOOK_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$REPO_ROOT" ] || REPO_ROOT="$(cd "$HOOK_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Resolve NOTION_TOKEN — prefer existing env, fall back to .env.notion-hooks.local literal, fall back to op://
if [ -z "${NOTION_TOKEN:-}" ]; then
  if [ -f .env.notion-hooks.local ]; then
    LITERAL="$(grep -E '^NOTION_INTEGRATION_TOKEN=' .env.notion-hooks.local 2>/dev/null | head -1 | cut -d= -f2-)"
    [ -n "$LITERAL" ] && export NOTION_TOKEN="$LITERAL"
  fi
fi
if [ -z "${NOTION_TOKEN:-}" ] && command -v op >/dev/null 2>&1; then
  OP_REF="$(grep -E '^NOTION_INTEGRATION_TOKEN_OP_REF=' .env.notion-hooks.local 2>/dev/null | head -1 | cut -d= -f2-)"
  [ -n "${OP_REF:-}" ] && export NOTION_TOKEN="$(op read "$OP_REF" 2>/dev/null || true)"
fi
[ -n "${NOTION_TOKEN:-}" ] || { echo "[workflow-overlord:session-start] NOTION_TOKEN unresolved (set NOTION_INTEGRATION_TOKEN in .env.notion-hooks.local or op:// ref)" >&2; exit 2; }

export WORKFLOW_OVERLORD_TOOL="${WORKFLOW_OVERLORD_TOOL:-claude}"

# Read stdin payload from Claude/Codex hook spec to capture session_id
PAYLOAD="$(cat 2>/dev/null || true)"
if [ -n "$PAYLOAD" ] && command -v jq >/dev/null 2>&1; then
  CLAUDE_SESSION_ID="$(echo "$PAYLOAD" | jq -r '.session_id // empty' 2>/dev/null || true)"
  [ -n "$CLAUDE_SESSION_ID" ] && export CLAUDE_CODE_SESSION_ID="$CLAUDE_SESSION_ID"
fi

exec bun scripts/session-start.ts
