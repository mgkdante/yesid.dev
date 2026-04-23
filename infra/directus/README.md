# `infra/directus/`

Directus-specific provisioning artifacts.

## Contents (grows across slice-18 Tasks 3–6)

| File | Task | Purpose |
|------|------|---------|
| `snapshot.yaml` | Task 3c | Schema snapshot — full Directus collections, fields, relations, roles, permissions, flows. Committed source of truth; applied in CI + on prod via `directus schema apply`. |
| `seed.ts` (under `scripts/`, not here) | Task 6 | Idempotent seed from yesid.dev source modules. |

## Workflow

1. Make schema changes in the Directus Data Studio (local or staging).
2. Run `npx directus schema snapshot ./infra/directus/snapshot.yaml` — overwrite the committed file.
3. Open a PR — CI (`.github/workflows/schema-apply.yml`, lands Task 3c) applies the snapshot to an ephemeral Directus instance + runs smoke tests.
4. Merge → a manual-approval step applies to production `cms.yesid.dev`.

## Why snapshot + apply

Reference: [yesid.dev slice-18 spec § D3](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/spec.md).

- PR diffs are readable (YAML).
- Full reproducibility — any instance rebuilds from the file.
- Drift detection via `schemaDiff` — surfaces out-of-band schema edits.
- Flows + roles + permissions included (since Directus 11).

## Gotcha

`schema apply` is destructive on field removals. Prod apply goes through a manual-approval CI step — review the diff before approving.
