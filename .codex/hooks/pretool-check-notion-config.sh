#!/usr/bin/env bash
# workflow-overlord — Codex PreToolUse dispatcher: Rule 6 (Notion config /
# placeholder-UUID refusal). Adopter-side wrapper — resolves the installed
# plugin from the Codex plugin cache (newest version) so it survives
# `codex plugin marketplace upgrade`. Registered globally via the
# [[hooks.PreToolUse]] block in ~/.codex/config.toml.
#
# Fail-open: if the plugin cache is missing, exit 0 (allow the call). A
# PreToolUse hook exiting non-zero BLOCKS the call — a missing guard must
# never block the operator's Notion work.
set -euo pipefail

CACHE_ROOT="${HOME}/.codex/plugins/cache/workflow-overlord/workflow-overlord"
PLUGIN_ROOT="$(find "$CACHE_ROOT" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -n 1 || true)"
if [ -z "${PLUGIN_ROOT:-}" ]; then
  echo "[workflow-overlord:codex-wrapper] plugin cache not found at $CACHE_ROOT — skipping Rule 6 guard" >&2
  exit 0
fi

export WORKFLOW_OVERLORD_TOOL=codex
exec bash "$PLUGIN_ROOT/hooks/pretool-check-notion-config.sh"
