# slice-18 — Handoff

> Single-level slice. This handoff IS the PR body when the slice closes. Self-appending: per-task sections accumulate below as work lands. Don't rewrite prior entries.

## 1) Status

| Field | Value |
|-------|-------|
| Status | 🟢 in progress (Task 0 + Task 1 + clean-slate follow-up shipped this session) |
| Slice PR (site) | pending — [`feature/slice-18`](https://github.com/mgkdante/yesid.dev/tree/feature/slice-18) (keep accumulating sessions before opening; likely opens at slice close) |
| Scorch PR (cms)      | [mgkdante/yesid.dev-cms#1](https://github.com/mgkdante/yesid.dev-cms/pull/1) — **MERGED** as `a7a1db6` |
| Clean-slate PR (cms) | [mgkdante/yesid.dev-cms#2](https://github.com/mgkdante/yesid.dev-cms/pull/2) — **MERGED** as `0295dd6` |
| Spec | [./spec.md](spec.md) |
| Plan | [./plan.md](plan.md) |
| Research | [./research.md](research.md) |
| Branch (site) | `feature/slice-18` (yesid.dev) — commit `e918736` |
| Branch (cms)  | PR #1 branch `chore/remove-payload`: `0effef9` (scorch) + `803d60c` (vercel guard) → merged `a7a1db6`. PR #2 branch `chore/clean-slate`: `f3a94df` (clean slate) — 15 files changed, 23 insertions, 545 deletions. |
| Tasks completed | 3 / 8 (Task 0 + Task 1 + Task 2) — Task 1 landed as two PRs (scorch + clean-slate) per owner steering; Task 2 is research-only (no site code changes beyond pre-Task-2 comment hygiene) |

## 2) Scope (from spec)

**Goal:** Ship a Directus-backed content layer for yesid.dev. See [./spec.md § Goal](spec.md).

**Acceptance criteria:** see [./spec.md § Acceptance criteria](spec.md).

## 3) Tasks completed

---

### Task 0 — Scaffold slice-18 bundle ✅

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Session:** 2026-04-22
- **Commit(s):** `e918736` — docs(slice-18): open slice — flat 4-file bundle (plan/spec/research/handoff)

**Files:**

- Created: `docs/slices/slice-18/plan.md` — slice-level plan (scope, constraints, task roadmap, D1–D3)
- Created: `docs/slices/slice-18/spec.md` — slice spec (goal, D-stubs for Task 2, acceptance criteria)
- Created: `docs/slices/slice-18/research.md` — Task 2 findings landing pad
- Created: `docs/slices/slice-18/handoff.md` — this file

**What landed:**

Fresh flat single-level bundle for slice-18 after PR #35 scorch. Four files, zero subdirectories. Plan + spec lock the non-negotiables (no Payload, Directus target, adapter-seam swap, no sub-slice nesting); research.md and spec D-entries reserve space for Task 2 findings without front-running them.

**Decisions:**

- D1 (plan) — Directus over Payload (pivot lock from PR #31).
- D2 (plan) — Scorch-not-archive for Payload removal (hard cutover).
- D3 (plan) — Single-level flat bundle.

**Tests / verification:**

- `ls docs/slices/slice-18/` → 4 files (plan.md + spec.md + research.md + handoff.md), 0 subdirectories ✅
- Plan/spec/research stubs deliberately leave D-entries + research sections as TBD for Task 2.

---

### Task 1 — Remove Payload from yesid.dev-cms + clean slate ✅

Landed as **two sequential PRs** (per owner steering mid-session: after PR #1 merged, owner asked for a true start-from-scratch state, so PR #2 deleted the remaining transition scaffolding).

- **Planned by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Implemented by:** Claude Code (Opus 4.7 [1m], reasoning=high)
- **Session:** 2026-04-22
- **PRs** (separate repo — `yesid.dev-cms`, NOT `yesid.dev`):
  - **[#1](https://github.com/mgkdante/yesid.dev-cms/pull/1)** — scorch Payload. Commits `0effef9` (scorch; 56 files · 152 insertions · 20,282 deletions) + `803d60c` (`vercel.json` with `ignoreCommand: exit 0` to calm Vercel after it kept trying to build the removed Next shell). Merged as `a7a1db6`.
  - **[#2](https://github.com/mgkdante/yesid.dev-cms/pull/2)** — clean slate. Commit `f3a94df` (15 files · 23 insertions · 545 deletions). Merged as `0295dd6`. Deletes `.env.example`, `.prettierrc.json`, `.vscode/`, `AGENTS.md`, `CLAUDE.md`, `CODEX-CONTEXT.md`, `bun.lock`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `tsconfig.json`. Rewrites `.gitignore` + `README.md`. Final tracked file list: `.gitignore`, `.nvmrc`, `README.md`, `vercel.json`. That's it.

**Files deleted (yesid.dev-cms):**

- `src/collections/` (7 files), `src/globals/` (10 files), `src/access/isAdmin.ts`
- `src/app/(payload)/` — entire Next.js route group (admin UI + GraphQL + REST + layout + custom.scss)
- `src/payload.config.ts`, `src/payload-types.ts`
- `migrations/` (4 migration files + index)
- `scripts/seed/` (entire seed scaffold), `scripts/auto-migrate-create.mjs`

**Files modified (yesid.dev-cms):**

- `package.json`: removed all `@payloadcms/*`, `payload`, `next`, `react`, `react-dom`, `sharp`, `graphql`, `gray-matter`, `tsx`, `eslint-config-next`, `@types/react(-dom)`. Dropped Payload-era scripts (`build`, `dev`, `devsafe`, `generate:*`, `migrate*`, `payload`, `start`, `seed:*`). Minimal shell retained: `cross-env`, `dotenv`, `eslint`, `prettier`, `typescript`, `@types/node`.
- `bun.lock`: regenerated (18 removed, 3 installed; no orphans).
- `next.config.ts`: stripped `withPayload` wrapper + `/api/media` local patterns. Placeholder `export default {}` until Task 3.
- `eslint.config.mjs`: removed `src/payload-types.ts` / `src/payload-generated-schema.ts` from ignores; minimal flat config.
- `tsconfig.json`: removed `@payload-config` path alias + `next` plugin.
- `README.md`, `AGENTS.md`, `CODEX-CONTEXT.md`, `CLAUDE.md`: rewritten as scorched placeholders pointing at `yesid.dev/docs/slices/slice-18`.
- `vercel.json`: new, minimal (`ignoreCommand: exit 0`) — prevents Vercel from re-trying the Next.js build of the empty shell.

**What landed:**

- **PR #1 (merged).** Scorched the Payload 3.x surface: `src/collections/`, `src/globals/`, `src/access/`, `src/app/(payload)/` route group, `payload.config.ts`, `payload-types.ts`, `migrations/`, `scripts/seed/`, `scripts/auto-migrate-create.mjs`. Removed every `@payloadcms/*` package plus `payload`, `next`, `react`, `react-dom`, `sharp`, `graphql`, `gray-matter`, `tsx`, `eslint-config-next`, `@types/react(-dom)`. Dropped Payload-era scripts. Kept a minimal shell (`cross-env`, `dotenv`, `eslint`, `prettier`, `typescript`). Added `vercel.json` to stop Vercel's retries.
- **PR #2 (open).** Clean-slate pass: deleted the minimal shell entirely. No more `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.env.example`, `.prettierrc.json`, `.vscode/`, `AGENTS.md`, `CLAUDE.md`, `CODEX-CONTEXT.md`, `bun.lock`. Repo is now **four tracked files**: `.gitignore` (minimal generic), `.nvmrc` (Node 22), `README.md` (one-paragraph pointer at slice-18), `vercel.json` (ignore guard). `.git/` history preserved as the audit trail.

yesid.dev is untouched (Payload was never wired to the site via the adapter seam). The `yesid.dev-cms` repo starts Task 3 from a genuine blank state — no Next-shaped leftovers to anchor decisions.

**Decisions:**

- Follows plan D2 (scorch-not-archive). No `payload-archive` branch. No `cms-legacy.yesid.dev` DNS record.
- **Vercel deploys disabled via `vercel.json`** — PR #1's initial commit broke Vercel's auto-build (Vercel had a cached Next.js detection and tried `bun run build`, which we removed). Surface was a red X on PR #1 that owner read as "conflicts". Adding `ignoreCommand: exit 0` kept the PR cleanly green and aligned with plan D2's accepted admin-downtime window. Task 3 will replace this config (or retire the Vercel project entirely if D1 picks a non-Vercel host).
- **Two-PR split instead of one** — owner asked for a true start-from-scratch state post-PR-#1 merge. Rather than amending #1, the clean-slate work landed as a separate PR #2. Benefit: commit history has a clear sequence (scorch Payload → clean slate), and the diffs are readable individually.

**Accepted downtime:**

- `cms.yesid.dev` admin returns no service between this PR merge and Directus install (Task 3). **Admin downtime only** — the public yesid.dev site reads from `staticAdapter` and is unaffected.

**Reviews:**

- Spec adherence: ✅ — matches plan D2 and spec § Architecture (yesid.dev-cms rebuild).
- Git state: ✅ `MERGEABLE`, no file conflicts, branch ahead of `origin/main` by 2 commits.
- Vercel CI: green after the `803d60c` follow-up (build intentionally skipped during scorch window).

**Tests / verification (yesid.dev — must stay green):**

- `grep -rn "@payloadcms" src/ package.json` → **0 matches** ✅
- `grep -rn "@payloadcms\|payloadcms"` in yesid.dev-cms tree (PR #1 state; PR #2 strips it further) → **0 matches** ✅
- `bun run check` on yesid.dev → **0 errors**, 20 warnings (all pre-existing — unused CSS selectors, `$state` hints; unrelated to slice-18). 4,043 files checked.
- `bun run test` on yesid.dev → **95 test files · 968 tests passed** ✅ (transient happy-dom teardown noise re: port 3000 is unrelated; tests completed before teardown).
- `bun run lint` → n/a (no `lint` script on yesid.dev; svelte-check coverage is under `bun run check`).
- `bun install` in yesid.dev-cms (post-PR-#1) → **`Saved lockfile` · 3 packages installed · Removed: 18** ✅ (PR #2 removes `bun.lock` entirely — no package.json means no lockfile).
- Post-PR-#2 tracked file count in yesid.dev-cms → **4** (`.gitignore`, `.nvmrc`, `README.md`, `vercel.json`).

**Follow-ups flagged:**

- Stale Payload comment at `src/lib/adapters/index.ts:2` ("Slice 18 (Payload CMS) is expected…") — replace with a Directus-targeted comment in Task 4 when `DirectusAdapter` wires in.
- Task 2 research gate: do not proceed to Directus install (Task 3) until D1/D2/D3 resolved.
- Vercel integration posture: after Task 2 resolves D1 (hosting), decide whether to keep the Vercel project on yesid.dev-cms or retire it. If Directus lives on Railway/Fly/etc., the Vercel project becomes useless and should be deleted.

---

## 4) Open items for downstream tasks

- ~~Task 2: resolve D1/D2/D3.~~ **Done this session.**
- Task 3: Directus install on Railway Hobby. Provision Neon `DB_*` env + R2 bucket + keys. Apply `snapshot.yaml`. TLS handoff on `cms.yesid.dev` — no DNS flip until Directus serves HTTPS successfully on the new host. Pin `directus/directus:11.17.3`. Retire the Vercel project on yesid.dev-cms.
- Task 4: Create `src/lib/adapters/directus.ts`; flip `src/lib/adapters/index.ts` re-export. Implement `toLocalizedString(translations, field)` transform. First content type to swap: `services` (smallest surface, easiest parity check). Update the `src/lib/adapters/index.ts` comment to cite `directus.ts` directly when the file lands.
- Task 5: swap remaining content types (projects → blog → meta → tech_stack → content pages). Each swap = owner-approved STOP point.
- Task 6: write `scripts/seed.ts` in yesid.dev-cms that reads from sibling `yesid.dev/src/lib/content/*.ts` + `yesid.dev/src/content/blog/**/*.md` and upserts via SDK.

## 5) Follow-ups flagged (accumulating)

1. ~~Replace stale Payload comment in `src/lib/adapters/index.ts`.~~ Done in pre-Task-2 cleanup (`1535fa5`).
2. Retire Vercel project on yesid.dev-cms at Task 3 cutover.
3. Monitor Directus 12 license revision (directus.io/bsl); decide upgrade path before any v12 bump.
4. After Task 7 production-green for 2+ weeks: delete `staticAdapter` in Slice 19+ (Q4 resolution).

## 6) Iterations (per Iteration Protocol step 7)

*(Populated if/when tasks need a fix-retest cycle.)*

## 7) Amendments during execution

| # | Date | Change | Rationale |
|---|------|--------|-----------|
| 1 | 2026-04-22 | Task 1 shipped as TWO PRs instead of one. | Owner asked for a true start-from-scratch state after PR #1 merged. PR #2 (`chore/clean-slate`) was added to strip the remaining Payload-era transition scaffolding (package.json, tsconfig, eslint, next.config, .vscode, all doc markers). Better than amending PR #1 because the merged history preserves a clean "scorch → clean slate" sequence readable in isolation. |
| 2 | 2026-04-22 | Added `vercel.json` mid-PR-#1. | Vercel had a cached Next.js detection and kept failing to build the scorched shell, surfacing as a red check owner read as "conflicts". `ignoreCommand: exit 0` is a 4-line safeguard for the transition window; Task 3 will replace or retire it. |

## 8) Files created (cumulative)

- `docs/slices/slice-18/plan.md` — Task 0
- `docs/slices/slice-18/spec.md` — Task 0
- `docs/slices/slice-18/research.md` — Task 0 (populated with Task 2 findings)
- `docs/slices/slice-18/handoff.md` — Task 0 (this file)

## 9) Files modified (cumulative)

- `src/lib/adapters/index.ts` — Task 2 pre-cleanup (`1535fa5`): neutralized "Slice 18 (Payload CMS)" comment → Directus-cited.
- `src/lib/adapters/types.ts` — Task 2 pre-cleanup (`1535fa5`): "Payload or Keystatic" → "Directus, Keystatic, mock"; "Payload-ready" → "CMS-ready".
- `src/lib/adapters/static.ts` — Task 2 pre-cleanup (`1535fa5`): "no Payload benefit" → "no CMS benefit".
- `src/lib/adapters/adapter.test.ts` — Task 2 pre-cleanup (`1535fa5`): "Payload or Keystatic adapter" → "Directus or other CMS adapter".
- `scripts/generate-og-default.ts` — Task 2 pre-cleanup (`1535fa5`): "post-Payload" → "post-CMS-migration".
- `docs/slices/slice-18/plan.md` — Task 2: Tasks table + Risks + Amendments updated.
- `docs/slices/slice-18/spec.md` — Task 2: D1/D2/D3 + Q4–Q7 resolved; Status draft → approved; Amendments log.
- `docs/slices/slice-18/research.md` — Task 2: full findings populated under all 7 pre-reserved subsections + 2 new sections.
- `docs/slices/slice-18/handoff.md` — Task 2: this update.

## 10) Files deleted (cumulative)

*(None in yesid.dev this session; Task 1 scorches yesid.dev-cms.)*

## 11) Repository / file-tree changes

yesid.dev `docs/slices/slice-18/`:

```
docs/slices/slice-18/
├── plan.md
├── spec.md
├── research.md
└── handoff.md
```

Flat. No subdirectories. Matches plan D3.

## 12) Schema / data changes

None in Task 0–1. Task 3 introduces Directus schema.

## 13) Entrypoints / commands status

No entrypoint changes this session.

## 14) Architectural seam status

- Seam touched: none in Task 0–1.
- Task 1 scorches yesid-dev-cms but leaves yesid.dev's `src/lib/adapters/index.ts` unchanged — `staticAdapter` remains active until Task 4.

## 15) Environment / config

No env changes in Task 0–1. Task 3+ introduces Directus env vars.

## 16) Commands executed (in order)

```bash
# yesid.dev — Task 0
git fetch origin
git checkout main
git pull origin main                       # fast-forward to 8960b51 (PR #35 scorch merge)
git checkout -b feature/slice-18
mkdir -p docs/slices/slice-18
# (wrote plan.md + spec.md + research.md + handoff.md)
git add docs/slices/slice-18/
git commit -m "docs(slice-18): open slice — flat 4-file bundle …"   # e918736
git push -u origin feature/slice-18

# yesid.dev-cms — Task 1 PR #1 (scorch)
cd ../yesid-dev-cms
git checkout -b chore/remove-payload
git rm -r src/app/\(payload\)/ src/collections/ src/globals/ src/access/ \
         src/payload.config.ts src/payload-types.ts \
         migrations/ scripts/seed/ scripts/auto-migrate-create.mjs
# (rewrote package.json / next.config.ts / eslint.config.mjs / tsconfig.json / README + AGENTS + CLAUDE + CODEX-CONTEXT)
bun install                                # regen bun.lock (18 removed, 3 installed)
git add -u
git commit -m "chore: remove Payload (slice-18 restart …)"           # 0effef9
git push -u origin chore/remove-payload
gh pr create --title "chore: remove Payload — slice-18 restart (scorch)" --body "…"   # PR #1

# Follow-up after Vercel 'red X' surfaced as 'conflicts'
# (added vercel.json with ignoreCommand=exit 0)
git add vercel.json
git commit -m "chore: skip Vercel deploys for the scorch window"     # 803d60c
git push                                                             # pushed onto PR #1
# (PR #1 merged by owner as a7a1db6)

# yesid.dev-cms — Task 1 PR #2 (clean slate, per owner steering)
git fetch origin
git checkout main
git pull                                   # fast-forward to a7a1db6
git checkout -b chore/clean-slate
git rm .env.example .prettierrc.json AGENTS.md CLAUDE.md CODEX-CONTEXT.md \
       bun.lock eslint.config.mjs next.config.ts package.json tsconfig.json
git rm -r .vscode
rm -f next-env.d.ts tsconfig.tsbuildinfo   # gitignored artifacts on disk
# (rewrote .gitignore + README.md)
git add .gitignore README.md
git commit -m "chore: clean slate — remove all Payload-era + Next.js scaffolding"   # f3a94df
git push -u origin chore/clean-slate
gh pr create --title "chore: clean slate — start from scratch" --body "…"            # PR #2

# yesid.dev — handoff finalization
cd ../yesid.dev
# (edited docs/slices/slice-18/handoff.md)
git add docs/slices/slice-18/handoff.md
git commit -m "docs(slice-18): Task 0 + Task 1 handoff — SHAs, verification, PR links"
git push
```

## 17) Validation results

**Task 0:**
- `ls docs/slices/slice-18/` → 4 files (plan/spec/research/handoff.md), 0 subdirectories ✅

**Task 1 (both PRs merged):**
- `grep -rn "@payloadcms\|payloadcms" yesid.dev-cms/` (excluding node_modules/.next/.vercel/.git) → 0 matches ✅
- yesid.dev-cms tracked file count after PR #2 merge → 4 (`.gitignore`, `.nvmrc`, `README.md`, `vercel.json`) ✅
- yesid.dev `grep "@payloadcms" src/ package.json` → 0 matches ✅
- yesid.dev `bun run check` → 0 errors, 4,043 files, 20 pre-existing warnings (unrelated) ✅
- yesid.dev `bun run test` → 95 files, 968 tests, all passed ✅

**Task 2 (pre-cleanup commit `1535fa5`):**
- `bun run check` post-cleanup → 0 errors, 4,043 files, same 20 pre-existing warnings ✅

**Task 2 (research):**
- `grep "TBD" docs/slices/slice-18/spec.md` on D1/D2/D3 sections → 0 matches ✅
- research.md has populated findings under all pre-reserved subsections + 2 new sections (MCP server, Recent Directus releases) ✅
- spec.md Amendments log records: Task 2 resolution + Vercel Blob driver revision ✅
- plan.md Tasks table updates: 0 + 1 + 2 marked shipped; Task 3 marked next ✅

## 18) Errors encountered

*(Append-only; empty unless errors hit.)*

## 19) Assumptions made

- **Schema / data shape:** current `staticAdapter` + `ContentAdapter` interface defines target shape for Directus collections (Task 2 validates).
- **Naming / conventions:** `yesid-dev-cms` keeps that name (hyphen, not dot) even after Payload removal — becomes the Directus-install shell.
- **Provider IDs:** Resend, Neon, domain ownership all unchanged across migration.
- **URLs / endpoints:** `cms.yesid.dev` persists; only the backend behind it changes.
- **Storage:** TBD — Task 2.
- **Local / dev environment:** Windows 11 + Bun + SvelteKit 2 for yesid.dev; yesid-dev-cms is Next.js 15 → becomes Directus host.
- **Package / dependency versions:** Directus 11+ (per research-slice pivot).
- **Folder structure:** flat `docs/slices/slice-18/` enforced.
- **Operational behavior:** hard cutover at Task 3/4, not gradual dual-run.

## 20) Peer review notes

*(Populated at slice close via Codex cross-tool adversarial review — per `feedback_codex_review_at_slice_close.md`.)*

## 21) Known gaps / deferred work

- Auth for non-admin surfaces: N/A (none exist).
- Content redesign: deferred to future slices.
- CI-gated preview deploys for content changes: deferred (likely slice-19+).

## 22) Deferred risks

- `cms.yesid.dev` admin downtime between Task 1 merge and Task 3 install — accepted (no public user-facing impact). Revisit: Task 3 launch.

## 23) Summary

*(Added at `/workflow-close-slice`.)*

## 24) PR Body

*(Added at `/workflow-close-slice`.)*

## 25) Next recommended prompt

```text
Session type: Implementation (first cloud-side work — provisioning + config).
Tool: Claude Code (Opus 4.7 [1m], reasoning=high). Sonnet 4.6 acceptable for routine provisioning steps; Opus for any schema decision.
Focus: Task 3 — Stand up Directus 11.17.3 on Railway Hobby + Cloudflare R2 storage + BYO Neon Postgres + `cms.yesid.dev` domain. Apply a first `snapshot.yaml`. Smoke-test admin login + one read via the public API.

Read these files first:
1. docs/slices/slice-18/{plan,spec,research,handoff}.md  (Task 2 decisions are binding)
2. https://directus.io/docs/self-hosted/quickstart  (fresh fetch — pin to Directus docs for 11.17.x)
3. https://railway.com/deploy/directus-cms  (official template)
4. https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/  (R2 S3-compat config reference)

Important context:
- yesid.dev-cms is a clean-slate repo: `.gitignore` + `.nvmrc` + `README.md` + `vercel.json` (ignoreCommand guard). Nothing else. Directus install will add the Directus files + snapshot.yaml + seed script scaffolding.
- yesid.dev adapter still on `staticAdapter`. Don't touch. Public site is unaffected during Task 3.
- Version pin: `directus/directus:11.17.3` (do NOT float `latest` — Directus 12 license revision pending).
- Neon Postgres: reuse the existing yesid.dev-cms project (from the Payload era). Connection string is in Yesid's 1Password.
- Domain: `cms.yesid.dev` DNS is currently pointed at the retired Vercel project. Do NOT flip the DNS until Directus serves HTTPS successfully on a temporary Railway domain; only then cut over.
- Resend + DKIM + SPF: preserve. Email adapter for Directus likely needs SMTP or API config — verify during Task 3 pre-flight.

Implement only this scope:
1. Provision Railway project from the official Directus template.
2. Swap `DB_*` env to the Neon connection string (unpooled for admin, pooled for read paths).
3. Create R2 bucket + access keys; set Directus storage env per research.md § Storage options.
4. Boot Directus against Neon. Create the first admin user. Verify Data Studio loads.
5. Define an initial schema (minimal — just `site_meta` singleton as smoke test; full schema lands across Tasks 4–6). Commit a first `infra/directus/snapshot.yaml` to yesid.dev-cms via a new branch + PR.
6. Add a GitHub Actions workflow in yesid.dev-cms that applies the snapshot to an ephemeral Directus in PRs.
7. Configure Railway custom domain → `cms.yesid.dev` with auto-TLS. Once HTTPS serves cleanly, flip the A/CNAME from the old Vercel project to Railway. Retire the Vercel project on yesid.dev-cms.
8. Enable native MCP server. Create `ai-editor` role. Generate token. Confirm Claude Code can connect to `https://cms.yesid.dev/mcp`.
9. Write Task 3 block in handoff.md with tool attribution + commit SHAs + verification output (curl tests).

Hard constraints:
- NO changes to yesid.dev site code in Task 3. Adapter swap is Task 4.
- NO modifications to the research slice bundle.
- NO custom Directus extensions. Built-ins only (R5 from plan's Risks).
- NO Directus 12. Pin 11.17.3.
- NO DNS flip until Directus serves TLS on the new host.
- Data-destructive actions (schema apply with field removals) need owner approval before prod.

Validation to run:
- Directus admin serves on Railway temporary domain → login works.
- Once domain flips: `curl https://cms.yesid.dev/server/health` → 200.
- `curl https://cms.yesid.dev/items/site_meta` with bearer token → JSON payload.
- MCP: `claude mcp list` shows `yesid-cms-prod`; `claude mcp call yesid-cms-prod read-me` returns the ai-editor user.
- yesid.dev still green: `bun run check` + `bun run test`.

STOP at Task 3 close. Ask owner to verify before Task 4 (DirectusAdapter swap).
```

## 26) Cross-tool handoff context

```text
Current project state:
- yesid.dev main at 8960b51 (PR #35 merged — scorch of prior slice-18 docs).
- yesid.dev still reads content via staticAdapter; zero @payloadcms refs in the site.
- yesid-dev-cms (sibling repo) runs Payload 3.x at cms.yesid.dev. Task 1 deletes that code.
- slice-18 bundle opened fresh on feature/slice-18: flat docs/slices/slice-18/ with plan/spec/research/handoff.

What this slice-opening session changed:
- Created the 4-file flat bundle. No site code changes.
- (After Task 1 merges in yesid-dev-cms): zero Payload code in yesid-dev-cms; cms.yesid.dev admin offline until Task 3.

Key file paths:
- Slice bundle: docs/slices/slice-18/{plan,spec,research,handoff}.md
- Adapter seam (unchanged): src/lib/adapters/index.ts
- Static adapter (unchanged, active): src/lib/adapters/static.ts
- Content modules (unchanged): src/lib/content/*.ts
- Research reference: docs/slices/slice-headless-cms-best-practices/

Required env / runtime config: none new this session.

Required next step: Task 2 — Directus research (spec D1/D2/D3 resolution).
```

## 27) Final Status

🟢 **IN PROGRESS** — Task 0 + Task 1 + Task 2 shipped this session. yesid.dev-cms is at clean-slate (PR #1 `a7a1db6` + PR #2 `0295dd6` both merged). yesid.dev `feature/slice-18` holds scaffold + comment cleanup (`1535fa5`) + Task 2 research. Spec D1/D2/D3 + Q4–Q7 resolved. Remaining tasks (3–8): Directus install (Task 3 unblocked, Railway + R2 + snapshot-apply YAML), DirectusAdapter swap (Task 4), remaining collection swaps (Task 5), seed (Task 6), integration E2E (Task 7), slice close (Task 8).
