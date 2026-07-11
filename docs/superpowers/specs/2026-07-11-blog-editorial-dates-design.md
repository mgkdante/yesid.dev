# Blog editorial publication dates

**Status:** Operator-approved design, clarified to date-only public output on 2026-07-11.

## Goal

Give the six EN/FR/ES blog families an intentional editorial chronology between 2026-06-01 and 2026-07-11 while preserving their chapter order, translation relationships, content truth-lock, and actual deployment evidence.

## Public contract

The public blog continues to show dates only. It will not display a clock time.

| Chapter | Translation key | Editorial publication date |
| --- | --- | --- |
| 1 | `the-two-hour-internet-slot` | 2026-06-01 |
| 2 | `how-i-learn-orbiting-a-system-until-it-clicks` | 2026-06-09 |
| 3 | `thinking-in-matrices` | 2026-06-17 |
| 4 | `ai-accelerated-human-owned-my-actual-workflow` | 2026-06-25 |
| 5 | `50-to-0-an-oracle-always-free-vm` | 2026-07-03 |
| 6 | `does-your-website-need-instant-publishing` | 2026-07-11 |

Every English, French, and Spanish row in a translation family receives the same date. `date_modified` remains unchanged at its current 2026-07-11 value. The production Handoff continues to distinguish these operator-selected editorial dates from the actual July 2026 route-publication and deployment receipts.

Directus stores `date_published` as a timestamp. The reconciler will normalize each approved date to noon UTC (`T12:00:00.000Z`) solely to prevent timezone rollover in CMS interfaces. Existing export and rendering code continues to emit and display `YYYY-MM-DD`, so no public time is introduced.

## Architecture

Directus remains the content source of truth. Generated fixtures and SvelteKit content modules remain derived outputs and are never hand-edited as the primary mutation.

A narrow CMS reconciler will own this change. It will:

1. target only the fixed DEV and PROD Directus URLs;
2. read the 18 expected blog rows;
3. prove there are exactly six translation families with one `en`, one `fr`, and one `es` row each;
4. plan at most 18 `date_published` patches containing only `id` and `date_published`;
5. default to dry-run and require an exact confirmation phrase for PROD apply;
6. re-read after apply and fail unless all 18 rows exactly match the approved schedule;
7. converge to `NO CHANGES` on a second dry-run.

The reconciler will not change status, body, title, excerpt, SEO copy, tags, translation keys, `date_modified`, or any other collection. It will have no create or delete path.

## Delivery sequence and deployment gate

Local code, tests, and read-only CMS dry-runs may proceed now. No DEV/PROD CMS write, push, pull request, preview, merge, or deployment occurs until the operator supplies the Vercel commercial-plan upgrade receipt.

After that gate:

1. run DEV dry-run, apply, re-read, and convergence dry-run;
2. regenerate the committed fixture and web fallbacks from live DEV CMS;
3. verify the 18 generated rows, date-only UI, JSON-LD, sitemap, route ordering, and locale switching;
4. use the protected reviewed PR path to `main` and then reconcile `develop`;
5. run PROD dry-run, apply, re-read, and convergence dry-run;
6. verify the resulting production deployment and all 18 live routes.

## Failure handling

The command must stop before writes if any expected row is missing, duplicated, assigned to the wrong translation family, has an unsupported locale, or if the plan exceeds 18 patches. A failed post-apply read is a hard failure and cannot be reported as convergence. Existing user or CMS changes outside `date_published` are left untouched.

## Test and verification design

TDD will cover:

- the exact six-date mapping;
- three matching locale rows per family;
- date-only public output with noon-UTC internal normalization;
- write payloads limited to `id` and `date_published`;
- missing, duplicate, unexpected-family, and wrong-locale refusal;
- dry-run default and PROD confirmation enforcement;
- exactly 18 initial patches and zero patches after convergence;
- unchanged `date_modified` and content fields;
- generated fallback ordering and EN/FR/ES date parity;
- BlogPosting `datePublished`, visible blog dates, routes, canonicals, hreflang, sitemap, and mobile rendering after deployment.

## Non-goals

- No visible publication time.
- No new CMS field or schema migration.
- No article wording, slug, body, SEO copy, or translation change.
- No social publication or promotion-copy approval.
- No Transit implementation or Transit content change.
