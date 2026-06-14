#!/usr/bin/env bash
# PreToolUse matcher — block Write/Edit/MultiEdit targeting a CMS-generated
# content module under apps/web/src/lib/content/.
#
# Those files carry a `GENERATED FILE — do not edit by hand.` header and are an
# edge cache regenerated FROM the Directus CMS by export:fallbacks. The CMS is
# the source of truth, so a hand-edit is overwritten on the next prod rebuild.
# Edit the CMS instead. The companion git pre-commit hook (.githooks/pre-commit)
# is the hard backstop; this just fails fast at edit time with a clear pointer.
#
# A file is treated as generated if EITHER the on-disk file carries the marker
# OR its basename is a key in generated.manifest.json (catches create-new too).
#
# Contract:
#   - Reads the JSON hook payload from $WORKFLOW_HOOK_STDIN_JSON (preferred) or stdin.
#   - Exit 2 + stderr refusal => Claude/Codex blocks the tool call.
#   - Exit 0 silently for every other case (non-generated path, missing jq, etc.).
set -euo pipefail

payload="${WORKFLOW_HOOK_STDIN_JSON:-}"
if [ -z "$payload" ] && [ ! -t 0 ]; then
  payload="$(cat 2>/dev/null || echo '')"
fi
[ -n "$payload" ] || exit 0

# Without jq we cannot reliably parse the payload — fail open here; the
# pre-commit hook (jq-free fallback) is the hard guard at commit time.
command -v jq >/dev/null 2>&1 || exit 0

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // .toolName // ""' 2>/dev/null || echo '')"
case "$tool_name" in
  Write|Edit|MultiEdit|NotebookEdit) ;;
  *) exit 0 ;;
esac

file_path="$(printf '%s' "$payload" | jq -r '
  .tool_input.file_path // .tool_input.path // .tool_input.notebook_path //
  .toolInput.file_path // ""' 2>/dev/null || echo '')"
[ -n "$file_path" ] || exit 0

# The manifest is itself produced by export:fallbacks — it is the anchor the
# pre-commit guard trusts, so hand-editing it would let a coordinated edit slip
# past. Block edits to it too.
case "$file_path" in
  */apps/web/src/lib/content/generated.manifest.json|apps/web/src/lib/content/generated.manifest.json)
    {
      echo "generated.manifest.json is produced by export:fallbacks — do not hand-edit it."
      echo ""
      echo "  It records the SHA-256 of each generated module and is the anchor the"
      echo "  pre-commit guard trusts. Re-run export:fallbacks to regenerate it"
      echo "  alongside the .ts modules."
    } >&2
    exit 2
    ;;
esac

# Only content modules are in scope (absolute or repo-relative paths).
case "$file_path" in
  */apps/web/src/lib/content/*.ts|apps/web/src/lib/content/*.ts) ;;
  *) exit 0 ;;
esac

base="${file_path##*/}"

# Never block the legitimately code-owned files in that directory.
case "$base" in
  *.companion.ts|*.test.ts|index.ts|hero-data.ts) exit 0 ;;
esac

root="${CLAUDE_PROJECT_DIR:-}"
[ -n "$root" ] || root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
content_dir="$root/apps/web/src/lib/content"
target="$content_dir/$base"
manifest="$content_dir/generated.manifest.json"

is_generated=0
if [ -f "$target" ] && head -c 400 "$target" | grep -q "GENERATED FILE — do not edit by hand."; then
  is_generated=1
fi
if [ "$is_generated" -eq 0 ] && [ -f "$manifest" ]; then
  if jq -e --arg f "$base" '.files | has($f)' "$manifest" >/dev/null 2>&1; then
    is_generated=1
  fi
fi

if [ "$is_generated" -eq 1 ]; then
  {
    echo "This is a generated cache file — edit the Directus CMS, not the .ts."
    echo ""
    echo "  apps/web/src/lib/content/$base is regenerated FROM the Directus CMS by"
    echo "  export:fallbacks; a hand-edit is silently overwritten on the next prod"
    echo "  rebuild. Change it in the dev CMS (the yesid-cms-dev MCP, or REST + the"
    echo "  op:// admin token in apps/cms/.env), then run export:fallbacks and commit"
    echo "  the regenerated .ts + generated.manifest.json together."
  } >&2
  exit 2
fi

exit 0
