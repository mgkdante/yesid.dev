# Blog editorial dates

The six article families use operator-selected editorial dates. These are not deployment receipts. Every EN/FR/ES counterpart shares its family date, public output remains date-only, and `date_modified` stays 2026-07-11.

## Approved schedule

1. 2026-06-01 — The two-hour internet slot
2. 2026-06-09 — How I learn: orbiting a system until it clicks
3. 2026-06-17 — Thinking in matrices
4. 2026-06-25 — AI-accelerated, human-owned: my actual workflow
5. 2026-07-03 — $50 to $0: an Oracle Always Free VM
6. 2026-07-11 — Does your website need instant publishing?

## Credential setup

```bash
export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
```

Never print either the service-account token or the resolved Directus token. Unset the service-account token after the command window.

## Read-only dry-runs

```bash
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=prod
```

Before apply, each current environment is expected to report exactly 18 `date_published` patches and no other field.

## Write gate

Do not apply, push, open a PR, create a preview, merge, or deploy until the Vercel account reports a commercial plan.

After the gate, reconcile DEV first:

```bash
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev --apply
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev
```

The second command must report `NO CHANGES`.

PROD apply requires the exact confirmation:

```bash
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts \
    --target=prod \
    --apply \
    --confirm=APPLY_PROD_BLOG_EDITORIAL_DATES
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=prod
```

The final PROD command must report `NO CHANGES`.

```bash
unset OP_SERVICE_ACCOUNT_TOKEN
```
