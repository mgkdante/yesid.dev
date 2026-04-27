#!/usr/bin/env bash
# Pre-commit hook: block staged edits to generated token files unless tokens.json
# is also staged in the same commit.
# Bypass: git commit --no-verify (last resort; document in PR description).

set -euo pipefail

GENERATED=(
  "apps/web/src/lib/styles/tokens.css"
  "apps/web/src/app.css"
  "apps/web/src/lib/motion/tokens.ts"
  "DESIGN.md"
)
SOURCE="packages/tokens/tokens.json"

staged() { git diff --cached --name-only --diff-filter=ACM; }

generated_staged=0
for f in "${GENERATED[@]}"; do
  if staged | grep -qx "$f"; then
    generated_staged=1
    break
  fi
done

if [ "$generated_staged" -eq 1 ]; then
  if ! staged | grep -qx "$SOURCE"; then
    echo "ERROR: A generated token file is staged, but $SOURCE is not."
    echo "       Edit $SOURCE and run 'bun run tokens:build' instead."
    echo ""
    echo "Generated files:"
    for f in "${GENERATED[@]}"; do
      if staged | grep -qx "$f"; then echo "  • $f"; fi
    done
    echo ""
    echo "Bypass (last resort): git commit --no-verify"
    exit 1
  fi
fi

exit 0
