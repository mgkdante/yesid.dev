#!/usr/bin/env bash
# Refresh dev environment to mirror prod. Coordinates:
#   1. Checked draft PR with an exact snapshot of main's tree
#   2. Neon dev branch reset + distinct dev Build Bot token rebind
#   3. R2 dev bucket sync (mirror prod files)
#   4. Promote and merge the protected develop PR; Vercel rebuilds develop
#
# After this completes, dev mirrors prod exactly:
#   - dev DB schema + content = prod (including admin user = prod's admin@yesid.dev)
#   - dev R2 files = prod files
#   - dev code tree (origin/develop) = main
#   - dev.yesid.dev rebuilds with this state via Vercel (live-pull, see below)
#
# The checked Git snapshot PR is prepared first without changing develop. The
# Neon reset then copies the production Build Bot token into dev. Before R2 or
# the develop merge, refresh-dev-database.ts waits for Neon to finish, finds
# exactly one Build Bot on cms.dev.yesid.dev, rebinds the distinct dev token,
# and authenticates as that user. Any failure leaves the PR unmerged.
#
# Usage (recommended — wraps all op:// resolutions in one call):
#   op run --env-file=apps/cms/.env -- ./apps/cms/scripts/refresh-dev-from-prod.sh
#
# Required env (resolved by op):
#   NEON_API_KEY                  — Neon API key (1P: 'Neon API key')
#   DIRECTUS_ADMIN_TOKEN          — admin token for the dev token rebind
#   DIRECTUS_BUILD_TOKEN          — prod Build Bot token (comparison only)
#   DIRECTUS_DEV_BUILD_TOKEN      — distinct read-only dev Build Bot token
#   STORAGE_S3_KEY                — R2 access key (R2 bucket-management scope)
#   STORAGE_S3_SECRET             — R2 secret access key
#   STORAGE_S3_ENDPOINT           — R2 S3 endpoint URL
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
GITHUB_REPOSITORY="mgkdante/yesid.dev"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

: "${HOME:?HOME is required for Git and GitHub authentication}"

run_database_refresh() {
  env -i \
    PATH="$PATH" \
    LANG="${LANG:-C.UTF-8}" \
    NEON_API_KEY="$NEON_API_KEY" \
    NEON_PROJECT_ID="$NEON_PROJECT_ID" \
    NEON_DEV_BRANCH_ID="$NEON_DEV_BRANCH_ID" \
    DIRECTUS_ADMIN_TOKEN="$DIRECTUS_ADMIN_TOKEN" \
    DIRECTUS_DEV_BUILD_TOKEN="$DIRECTUS_DEV_BUILD_TOKEN" \
    bun "$SCRIPT_DIR/refresh-dev-database.ts"
}

run_r2_refresh() {
  env -i \
    PATH="$PATH" \
    LANG="${LANG:-C.UTF-8}" \
    STORAGE_S3_KEY="$STORAGE_S3_KEY" \
    STORAGE_S3_SECRET="$STORAGE_S3_SECRET" \
    STORAGE_S3_ENDPOINT="$STORAGE_S3_ENDPOINT" \
    R2_PROD_BUCKET="$R2_PROD_BUCKET" \
    R2_DEV_BUCKET="$R2_DEV_BUCKET" \
    bun "$SCRIPT_DIR/refresh-r2-from-prod.ts"
}

run_git() {
  env -i \
    HOME="$HOME" \
    PATH="$PATH" \
    LANG="${LANG:-C.UTF-8}" \
    GIT_TERMINAL_PROMPT=0 \
    git -C "$REPO_ROOT" "$@"
}

run_gh() {
  env -i \
    HOME="$HOME" \
    PATH="$PATH" \
    LANG="${LANG:-C.UTF-8}" \
    GH_PROMPT_DISABLED=1 \
    gh "$@"
}

run_public() {
  env -i PATH="$PATH" LANG="${LANG:-C.UTF-8}" "$@"
}

required_vars=(
  NEON_API_KEY
  DIRECTUS_ADMIN_TOKEN
  DIRECTUS_BUILD_TOKEN
  DIRECTUS_DEV_BUILD_TOKEN
  STORAGE_S3_KEY
  STORAGE_S3_SECRET
  STORAGE_S3_ENDPOINT
)
missing_vars=()
for required_var in "${required_vars[@]}"; do
  if [[ -z "${!required_var:-}" ]]; then
    missing_vars+=("$required_var")
  fi
done
if (( ${#missing_vars[@]} > 0 )); then
  echo "ERROR: missing required environment variables: ${missing_vars[*]}" >&2
  echo "Resolve the documented 1Password references before running this refresh." >&2
  exit 1
fi
if [[ "$DIRECTUS_DEV_BUILD_TOKEN" == "$DIRECTUS_BUILD_TOKEN" ]]; then
  echo "ERROR: dev and production Build Bot tokens must be distinct." >&2
  exit 1
fi
if [[ "$DIRECTUS_DEV_BUILD_TOKEN" == "$DIRECTUS_ADMIN_TOKEN" ]]; then
  echo "ERROR: dev Build Bot and admin tokens must be distinct." >&2
  exit 1
fi

for required_command in bun git gh; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $required_command" >&2
    exit 1
  fi
done

origin_url="$(run_git remote get-url origin)"
if [[ "$origin_url" != "https://github.com/$GITHUB_REPOSITORY.git" ]]; then
  echo "ERROR: origin must be https://github.com/$GITHUB_REPOSITORY.git" >&2
  exit 1
fi
run_gh auth status --hostname github.com >/dev/null
run_git fetch --quiet origin main develop

main_sha="$(run_git rev-parse refs/remotes/origin/main)"
develop_sha="$(run_git rev-parse refs/remotes/origin/develop)"
main_tree="$(run_git rev-parse 'refs/remotes/origin/main^{tree}')"
develop_tree="$(run_git rev-parse 'refs/remotes/origin/develop^{tree}')"
if [[ "$main_tree" == "$develop_tree" ]]; then
  echo "  origin/develop already has the origin/main tree;"
  echo "  an empty checked snapshot commit will trigger the refresh deployment."
fi

required_contexts="$(
  run_gh api "repos/$GITHUB_REPOSITORY/rules/branches/develop" \
    --jq '[.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | unique | sort | .[]'
)"
if [[ -z "$required_contexts" ]]; then
  echo "ERROR: protected develop exposes no required status-check contexts." >&2
  exit 1
fi

echo "============================================================"
echo "Refresh dev from prod"
echo "============================================================"
echo "  Neon project: $NEON_PROJECT_ID"
echo "  Neon dev branch: $NEON_DEV_BRANCH_ID"
echo "  R2: $R2_PROD_BUCKET → $R2_DEV_BUCKET"
echo "  Git: origin/main tree → checked PR → origin/develop"
echo "============================================================"
echo ""
read -rp "Proceed? This wipes ALL dev state and replaces with prod's. (y/N): " ans
if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi
echo ""

echo "[1/4] GitHub: prepare an immutable main → develop PR and pass required checks..."
printf -v refresh_stamp '%(%Y%m%dT%H%M%SZ)T' -1
refresh_branch="ops/refresh-dev-from-prod-${refresh_stamp}-${main_sha:0:8}"
snapshot_sha="$(
  run_git \
    -c user.name="yesid.dev Refresh Bot" \
    -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
    commit-tree "$main_tree" -p "$develop_sha" \
    -m "chore: snapshot production tree for dev refresh"
)"

refresh_complete=false
pr_url=""
cleanup_failed_refresh() {
  exit_status=$?
  if [[ "$refresh_complete" == "true" ]]; then
    return "$exit_status"
  fi

  set +e
  echo "Refresh failed; removing its non-mergeable GitHub preflight." >&2
  if [[ -n "$pr_url" ]]; then
    run_gh pr close "$pr_url" \
      --repo "$GITHUB_REPOSITORY" \
      --delete-branch \
      --comment "Automated refresh failed before completion; closing the draft so it cannot be merged." \
      >/dev/null 2>&1
  fi
  run_git push --delete origin "$refresh_branch" >/dev/null 2>&1
  exit "$exit_status"
}
trap cleanup_failed_refresh EXIT

run_git push origin "$snapshot_sha:refs/heads/$refresh_branch"

pr_url="$(
  run_gh pr create \
    --repo "$GITHUB_REPOSITORY" \
    --base develop \
    --head "$refresh_branch" \
    --draft \
    --title "chore: refresh develop from production" \
    --body "Automated environment refresh. This draft's immutable head has the preflight origin/main tree and origin/develop as its parent. It stays non-mergeable until required checks, the Neon reset/token rebind, and R2 sync all succeed."
)"
echo "  PR: $pr_url"

assert_preflight_lock() {
  expected_pr_lock="$(printf 'true\t%s\t%s' "$snapshot_sha" "$develop_sha")"
  current_pr_lock="$(
    run_gh pr view "$pr_url" \
      --repo "$GITHUB_REPOSITORY" \
      --json isDraft,headRefOid,baseRefOid \
      --jq '[.isDraft, .headRefOid, .baseRefOid] | @tsv'
  )"
  if [[ "$current_pr_lock" != "$expected_pr_lock" ]]; then
    echo "ERROR: refresh PR is no longer the expected locked draft." >&2
    exit 1
  fi

  run_git fetch --quiet origin main develop
  current_main_sha="$(run_git rev-parse refs/remotes/origin/main)"
  current_develop_sha="$(run_git rev-parse refs/remotes/origin/develop)"
  if [[ "$current_main_sha" != "$main_sha" || "$current_develop_sha" != "$develop_sha" ]]; then
    echo "ERROR: main or develop moved during the refresh; retry from fresh branch state." >&2
    exit 1
  fi
}

observed_required_contexts=""
for _ in {1..30}; do
  observed_required_contexts="$(
    run_gh pr checks "$pr_url" \
      --repo "$GITHUB_REPOSITORY" \
      --required \
      --json name \
      --jq '[.[].name] | unique | sort | .[]' \
      2>/dev/null || true
  )"
  if [[ "$observed_required_contexts" == "$required_contexts" ]]; then
    break
  fi
  run_public sleep 2
done
if [[ "$observed_required_contexts" != "$required_contexts" ]]; then
  echo "ERROR: required checks did not register for $pr_url" >&2
  exit 1
fi
run_gh pr checks "$pr_url" \
  --repo "$GITHUB_REPOSITORY" \
  --required \
  --watch \
  --fail-fast \
  --interval 10
assert_preflight_lock

echo ""
echo "[2/4] Neon + Directus: reset dev and rebind its Build Bot token..."
run_database_refresh
assert_preflight_lock

echo ""
echo "[3/4] R2: sync prod bucket → dev bucket..."
run_r2_refresh
assert_preflight_lock

echo ""
echo "[4/4] GitHub: merge the checked snapshot into protected develop..."
run_gh pr ready "$pr_url" --repo "$GITHUB_REPOSITORY"
run_gh pr merge "$pr_url" \
  --repo "$GITHUB_REPOSITORY" \
  --merge \
  --delete-branch \
  --match-head-commit "$snapshot_sha"

run_git fetch --quiet origin develop
merged_develop_tree="$(run_git rev-parse 'refs/remotes/origin/develop^{tree}')"
if [[ "$merged_develop_tree" != "$main_tree" ]]; then
  echo "ERROR: merged origin/develop tree does not equal the preflight origin/main tree." >&2
  exit 1
fi
echo "  OK origin/develop now has the verified origin/main tree"
refresh_complete=true
trap - EXIT

echo ""
echo "============================================================"
echo "Done. Dev now mirrors prod state."
echo ""
echo "Vercel will auto-rebuild dev.yesid.dev from the checked develop merge."
echo "The rebuild live-pulls dev CMS content with the distinct, verified dev"
echo "Build Bot token rebound after the Neon reset."
echo ""
echo "Admin login on dev now = prod admin (admin@yesid.dev + prod password)."
echo "If you want separate dev creds, rotate after refresh:"
echo "  - Log in as admin@yesid.dev with prod password"
echo "  - In Data Studio, Settings → Users → Edit your user → change email/password"
echo "  - Or run a SQL UPDATE on the dev DB"
echo "============================================================"
