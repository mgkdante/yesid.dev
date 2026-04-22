# yesid.dev-cms

Empty repository — awaiting fresh install.

The rebuild plan lives in the consumer repo: **[yesid.dev/docs/slices/slice-18](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18)**. Start there for context, tasks, and research notes.

## Current state

| Field | Value |
|-------|-------|
| Backend | **none** (was Payload 3.83; scorched in [PR #1](https://github.com/mgkdante/yesid.dev-cms/pull/1), clean-slated after merge) |
| Admin URL | `cms.yesid.dev` — offline pending install |
| Consumer site | [yesid.dev](https://yesid.dev) — unaffected, reads content from a static TypeScript adapter |
| Domain / DNS | `cms.yesid.dev` preserved (TLS + DKIM + SPF intact for when the new backend lands) |
| Postgres | Neon — preserved, ready for reuse |
| Email | Resend — preserved |

## Why the clean slate

- Payload and its Next.js shell were removed because the pivot research (see [slice-headless-cms-best-practices](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-headless-cms-best-practices)) chose a different CMS.
- Keeping transition scaffolding around was more misleading than useful — it encouraged "Next.js-shaped" decisions for a non-Next.js target.
- The consumer site never depended on this repo, so there was no public risk in scorching hard.

## Next

The install is gated on slice-18 Task 2 (research) → Task 3 (provision). Nothing should be added to this repo outside that flow.
