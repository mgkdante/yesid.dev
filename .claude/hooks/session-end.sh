#!/usr/bin/env bash
# workflow-overlord v2 — SessionEnd / Stop hook (Guarantee #2)
# Reads JSONL transcript, uploads to Sessions row Transcript file property, sets Ended.
set -euo pipefail

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(git -C "$HOOK_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$REPO_ROOT" ] || REPO_ROOT="$(cd "$HOOK_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Resolve NOTION_TOKEN (same logic as session-start)
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
[ -n "${NOTION_TOKEN:-}" ] || { echo "[workflow-overlord:session-end] NOTION_TOKEN unresolved" >&2; exit 2; }

# Read session_id + transcript_path from Claude/Codex hook payload (stdin JSON) or env
PAYLOAD="$(cat 2>/dev/null || true)"
if [ -n "$PAYLOAD" ] && command -v jq >/dev/null 2>&1; then
  PAYLOAD_SESSION_ID="$(echo "$PAYLOAD" | jq -r '.session_id // empty' 2>/dev/null || true)"
  PAYLOAD_TRANSCRIPT="$(echo "$PAYLOAD" | jq -r '.transcript_path // empty' 2>/dev/null || true)"
fi
SESSION_ID="${PAYLOAD_SESSION_ID:-${WORKFLOW_OVERLORD_SESSION_ID:-}}"
TRANSCRIPT_PATH="${PAYLOAD_TRANSCRIPT:-${WORKFLOW_OVERLORD_TRANSCRIPT_PATH:-}}"

[ -n "$SESSION_ID" ] || { echo "[workflow-overlord:session-end] session_id missing" >&2; exit 2; }
[ -n "$TRANSCRIPT_PATH" ] || { echo "[workflow-overlord:session-end] transcript_path missing" >&2; exit 2; }

export WORKFLOW_OVERLORD_SESSION_ID="$SESSION_ID"
export WORKFLOW_OVERLORD_TRANSCRIPT_PATH="$TRANSCRIPT_PATH"
exec bun scripts/session-end.ts
