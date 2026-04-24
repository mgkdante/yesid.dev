# 18a — Decisions (retrospective)

> Decisions that landed during Tasks 0–7. Full D-entry narratives at `docs/slices/slice-18/plan.md § D-entries` (slice-level).

## Decisions

| ID | Decision | Status |
|---|---|---|
| D1 | Directus hosting: Railway Hobby + BYO Neon | shipped |
| D2 | Storage adapter: Cloudflare R2 via s3 driver | shipped |
| D3 | Schema provisioning: snapshot.yaml + apply (amended in 18c → directus-sync per-resource files) | shipped · amended 18c |
| D4 | Visual Editor SDK v2 pattern | shape locked; implementation post-Slice-18 |
| D5 | Content Versioning on all user collections | shape locked; implementation deferred to 18c onwards |
| D6 | Preview routes — EDITOR_PREVIEW_TOKEN (amended in 18c → /shares endpoint per Q3) | shape locked; amended 18c |
| D7 | M2A pages with block collections | shape locked; implementation 18i |
| Q4 | staticAdapter kept as dev-only fallback through Slice 18 close | shipped |
| Q5 | Preview/draft implementation deferred to post-Slice-18 | shape locked |
| Q6 | Native Translations field + adapter-boundary `toLocalizedString` | shipped |
| Q7 | Markdown for blog body (superseded by D15/Q1 in 18c — Block Editor) | superseded |

## Amendments during 18a execution

| Date | Change | Rationale |
|---|---|---|
| 2026-04-22 | Task 1 shipped as TWO PRs (scorch + clean-slate) | Owner wanted true start-from-scratch post-PR-#1 |
| 2026-04-22 | Added `vercel.json` with `ignoreCommand: exit 0` | Vercel cached Next.js detection failing |
| 2026-04-23 | Clean-slated Neon (`DROP SCHEMA public CASCADE`) | Railway template seeded demo collections + Payload orphans |
| 2026-04-23 | Stripped `EMAIL_SMTP_*` env vars | Port 587 blocked by Railway egress |
| 2026-04-23 | PR #3 combined Task 3a + 3c | Single-PR review cleaner |
| 2026-04-23 | Scorched-earth Neon cleanup (84 Payload-era tables dropped) | Task 4 session; clean slate for real schema |
| 2026-04-23 | Task 7 flip services port to Directus (hybrid adapter) | Port-by-port pattern established |
