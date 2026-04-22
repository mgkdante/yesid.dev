# yesid.dev CMS

> **Scorched — pending Directus install.**
>
> Payload 3.x removed in [slice-18 Task 1](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18).
> Directus 11+ install lands in slice-18 Task 3. Until then, this repo is an empty shell.

## Status

| Field | Value |
|-------|-------|
| Backend | **none** (was Payload 3.83; scorched) |
| Admin URL | `cms.yesid.dev` — **offline until Task 3** |
| Consumer | [yesid.dev](https://yesid.dev) reads from `staticAdapter`; not affected by this scorch |
| Database | Neon Postgres (preserved for Directus reuse) |
| Email | Resend (preserved) |
| Domain | `cms.yesid.dev` (preserved; TLS + DKIM + SPF intact) |

## Rebuild tracker

The Directus install proceeds via slice-18 in the consumer repo:

- Plan: [yesid.dev/docs/slices/slice-18/plan.md](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/plan.md)
- Spec: [yesid.dev/docs/slices/slice-18/spec.md](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/spec.md)
- Research: [yesid.dev/docs/slices/slice-18/research.md](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/research.md)
- Handoff (PR body as slice closes): [yesid.dev/docs/slices/slice-18/handoff.md](https://github.com/mgkdante/yesid.dev/blob/main/docs/slices/slice-18/handoff.md)
- Pivot research (append-only reference): [yesid.dev/docs/slices/slice-headless-cms-best-practices/](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-headless-cms-best-practices)

## Why Directus instead of Payload

Short version: platform built-ins + admin UX + Postgres-native fit the solo-operator / SvelteKit-consumer profile better than Payload's Node-first coupling. Long version in the pivot research slice (link above).

## Why the hard scorch (no archive branch)

- yesid.dev runs on `staticAdapter` and was never wired to Payload via the adapter seam — the public site has zero dependency on what happened here.
- Audit trail = this commit history + the pivot research slice. That's sufficient record.
- Side-by-side coexistence would double infrastructure cost for a non-consumer.

See `slice-18` plan D2 for full rationale.
