# Blog editorial dates

The six article families use operator-selected editorial dates. These are not deployment receipts. Every EN/FR/ES counterpart shares its family date, public output remains date-only, and `date_modified` stays 2026-07-11.

## Approved schedule

1. 2026-06-01 — The two-hour internet slot
2. 2026-06-09 — How I learn: orbiting a system until it clicks
3. 2026-06-17 — Thinking in matrices
4. 2026-06-25 — AI-accelerated, human-owned: my actual workflow
5. 2026-07-03 — $50 to $0: an Oracle Always Free VM
6. 2026-07-11 — Does your website need instant publishing?

## Credential-safe command wrapper

Define this wrapper once in the operator shell. It resolves credentials inside a subshell, disables shell tracing before the secret assignment, and removes `OP_SERVICE_ACCOUNT_TOKEN` through an `EXIT` trap after every command, including failures.

```bash
with_yesid_op() (
  set +x
  export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
  trap 'unset OP_SERVICE_ACCOUNT_TOKEN' EXIT
  test -n "${OP_SERVICE_ACCOUNT_TOKEN}"
  op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- "$@"
)
```

Never print either the service-account token or the resolved Directus token. Do not enable shell tracing inside the wrapper.

## Read-only dry-runs

```bash
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=prod
```

Before apply, each current environment is expected to report exactly 18 `date_published` patches and no other field.

## Comparison and write boundary

The apply command compares the displayed plan with a fresh pre-write read of the owned date plan. That comparison validates the exact 18 row IDs, translation-family and locale ownership, requires every owned row to remain published, and compares the resulting `{ id, date_published }` patches. It is not a full-row lock: unrelated title, body, excerpt, SEO, content, tag, or relation changes are not compared or locked and do not make the owned date plan differ.

The batch PATCH body contains only `id` and `date_published`, so this command cannot overwrite those unrelated fields. A concurrent `date_published` edit remains a residual race; use a controlled apply window with no other date writer, start from a fresh dry-run, and never infer success from a timeout or thrown command.

## Write gate and required sequence

Do not apply, push, open a PR, create a preview, merge, or deploy until the Vercel account reports a commercial plan.

After that receipt, the order is mandatory: DEV apply and convergence, DEV fixture and fallback regeneration, local verification, reviewed PR and merge, confirmed Ready deployment, then a fresh PROD dry-run and confirmed PROD apply. Do not move directly from DEV convergence to PROD.

### 1. Apply DEV and prove convergence

Run a fresh DEV dry-run immediately before apply. It must show the expected plan before continuing.

```bash
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev --apply
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev
```

Continue only when the final command reports `NO CHANGES`. Otherwise use the failure-recovery table below and stop the release sequence.

### 2. Regenerate fixtures and fallbacks from live DEV

```bash
with_yesid_op \
  env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
  bun run --cwd apps/cms fixtures:refresh
with_yesid_op \
  env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
  bun run --cwd apps/cms export:fallbacks
```

Inspect every changed file. The blog fixture and generated fallback must contain the six approved date-only values three times each. Treat any unrelated generated diff as a blocker.

### 3. Verify locally

```bash
bun test apps/cms/tests/reconcile-blog-editorial-dates.test.ts
bun test apps/cms/tests/fixture-blog-posts.test.ts
bun test apps/cms/tests/refresh-blog-posts-fixture.test.ts
bun run --cwd apps/cms test
bun run --cwd apps/web test
bun run --cwd apps/web check
```

Verify 18 rows, one date per translation family, newest-first chapter order, and date-only `BlogPosting.datePublished` output.

### 4. Complete the reviewed release and confirm deployment

Commit only the verified derived outputs, push the branch, open the reviewed PR to `main`, wait for required checks, merge through branch protection, reconcile `develop`, and wait for the production deployment to report Ready. Record the reviewed PR, merge SHA, and confirmed deployment receipt. PROD remains blocked until all of these steps are complete.

### 5. Apply PROD only after confirmed deployment

Run a fresh PROD dry-run immediately before the confirmed apply. Do not continue unless its plan is understood and contains only the remaining approved `date_published` patches.

```bash
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=prod
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts \
    --target=prod \
    --apply \
    --confirm=APPLY_PROD_BLOG_EDITORIAL_DATES
with_yesid_op \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=prod
```

The final PROD command must report `NO CHANGES`. Otherwise use the failure-recovery table and stop.

## Failure recovery after any apply error, timeout, or nonconverged check

Never infer success from the apply process exit alone. Run a new read-only dry-run for the same target and classify the remaining owned plan exactly:

| Remaining patches | Required action |
| --- | --- |
| **18** | None of the intended date updates converged. Record the failed command and output, stop, and do not regenerate, release, switch environments, or retry until the cause is resolved and a fresh 18-patch plan is reviewed in a controlled apply window. |
| **1–17** | The apply partially converged. Record every remaining ID and date, stop, and do not regenerate, release, switch environments, or rerun apply blindly. Resolve the cause, exclude concurrent date writers, review the fresh remaining plan, then retry only that planner-produced remainder and prove `NO CHANGES`. |
| **0 (`NO CHANGES`)** | Convergence is proven for the owned date plan. Record the receipt and continue to the next required sequence step. |

Any invalid row count, ownership error, unexpected field/operation, or result outside these cases is a blocker. Stop and investigate; do not broaden the command or repair rows manually.

After the command window is complete, remove the non-secret wrapper definition if desired:

```bash
unset -f with_yesid_op
```
