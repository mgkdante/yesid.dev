#!/usr/bin/env bash
# Refresh dev environment to mirror prod. Coordinates:
#   1. Neon dev branch reset (re-fork from main = prod state)
#   2. R2 dev bucket sync (mirror prod files)
#   3. Git develop branch reset (mirror main)
#   4. Vercel auto-rebuilds develop branch on the push
#
# After this completes, dev mirrors prod exactly:
#   - dev DB schema + content = prod (including admin user = prod's cms-admin@example.invalid)
#   - dev R2 files = prod files
#   - dev code (origin/develop) = main
#   - dev.yesid.dev rebuilds with this state via Vercel
#
# If you want admin@yesid.dev separation back, re-rotate after refresh
# (see the manual step at the end).
#
# Usage (recommended — wraps all op:// resolutions in one call):
#   op run --env-file=apps/cms/.env -- ./apps/cms/scripts/refresh-dev-from-prod.sh
#
# Required env (resolved by op):
#   NEON_API_KEY        — Neon API key (1P: 'Neon API key')
#   STORAGE_S3_KEY      — R2 access key (R2 bucket-management scope)
#   STORAGE_S3_SECRET   — R2 secret access key
#   STORAGE_S3_ENDPOINT — R2 S3 endpoint URL
#
# Optional env (defaults):
#   NEON_PROJECT_ID     — defaults to 'sparkling-sky-51665073'
#   NEON_DEV_BRANCH_ID  — defaults to 'br-divine-union-amd1lou6'
#   R2_PROD_BUCKET      — defaults to 'yesid-dev-cms'
#   R2_DEV_BUCKET       — defaults to 'yesid-dev-cms-dev'

set -euo pipefail

NEON_PROJECT_ID="${NEON_PROJECT_ID:-sparkling-sky-51665073}"
NEON_DEV_BRANCH_ID="${NEON_DEV_BRANCH_ID:-br-divine-union-amd1lou6}"
R2_PROD_BUCKET="${R2_PROD_BUCKET:-yesid-dev-cms}"
R2_DEV_BUCKET="${R2_DEV_BUCKET:-yesid-dev-cms-dev}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "============================================================"
echo "Refresh dev from prod"
echo "============================================================"
echo "  Neon project: $NEON_PROJECT_ID"
echo "  Neon dev branch: $NEON_DEV_BRANCH_ID"
echo "  R2: $R2_PROD_BUCKET → $R2_DEV_BUCKET"
echo "  Git: origin/main → origin/develop (force-push)"
echo "============================================================"
echo ""
read -rp "Proceed? This wipes ALL dev state and replaces with prod's. (y/N): " ans
if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi
echo ""

echo "[1/3] Neon: reset dev branch from main..."
if [[ -z "${NEON_API_KEY:-}" ]]; then
  echo "  ERROR: NEON_API_KEY not set."
  echo "  Add to apps/cms/.env: NEON_API_KEY=op://yesid-dev/<neon-api-key-item>/credential"
  exit 1
fi
curl -sS -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches/$NEON_DEV_BRANCH_ID/restore" \
  --data "{\"source_branch_id\":\"$(curl -sS -H \"Authorization: Bearer $NEON_API_KEY\" \"https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches\" | python -c 'import sys,json; b=json.load(sys.stdin); main=next(x for x in b[\"branches\"] if x[\"name\"]==\"main\"); print(main[\"id\"])')\",\"preserve_under_name\":\"\"}" \
  | python -c "import sys,json; d=json.load(sys.stdin); print('  OK' if d.get('branch') else f'  ERR: {json.dumps(d)[:200]}')"

echo ""
echo "[2/3] R2: sync prod bucket → dev bucket..."
R2_ACCESS_KEY="$STORAGE_S3_KEY" \
R2_SECRET_KEY="$STORAGE_S3_SECRET" \
R2_ENDPOINT="$STORAGE_S3_ENDPOINT" \
R2_PROD_BUCKET="$R2_PROD_BUCKET" \
R2_DEV_BUCKET="$R2_DEV_BUCKET" \
bun "$SCRIPT_DIR/refresh-r2-from-prod.ts"

echo ""
echo "[3/3] Git: reset origin/develop to origin/main..."
cd "$REPO_ROOT"
git fetch origin
git push --force-with-lease=develop origin "refs/remotes/origin/main:refs/heads/develop"
echo "  OK origin/develop now matches origin/main"

echo ""
echo "============================================================"
echo "Done. Dev now mirrors prod state."
echo ""
echo "Vercel will auto-rebuild dev.yesid.dev on the develop push."
echo ""
echo "If you want admin@yesid.dev separation back (instead of"
echo "prod's cms-admin@example.invalid):"
echo "  - Log in as cms-admin@example.invalid with prod password"
echo "  - In Data Studio, Settings → Users → Edit your user → change email"
echo "  - Or run a SQL UPDATE on the dev DB"
echo "============================================================"
