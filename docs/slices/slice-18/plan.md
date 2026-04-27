# Slice 18 — Plan

> **Whole-slice plan doc.** Sub-slices keep only research.md + decisions.md. No handoff.md or spec.md at slice level.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans for task execution. Checkbox (`- [ ]`) syntax tracks progress.

**Goal:** Migrate yesid.dev from static TS content modules to a self-hosted Directus 11.17.3 CMS at `cms.yesid.dev`, with humans authoring via Data Studio and AI via native MCP. Land the full pattern library (conventions + shared lib + scaffolder) so the post-Slice-18 template extraction is near-mechanical.

**Architecture:** Turborepo monorepo in the existing **`yesid.dev` repo** (umbrella — no new repo created) with `apps/web` (SvelteKit + Vercel) + `apps/cms` (Directus config + Railway) + `packages/shared` (TS types + Zod only). Apps are NOT workspace packages (app independence convention). Block Editor for all rich content. Full-site revalidation via Flows. directus-sync for per-collection-file schema authoring.

**Tech stack:** Turborepo · **Bun workspaces** (packages/* only) · Bun runtime · SvelteKit 2 · Svelte 5 · Directus 11.17.3 · directus-sync extension · Neon Postgres (PITR) · Cloudflare R2 · `@directus/sdk@^20` · Zod · p-queue · Bottleneck · vitest · bun test.

**Branch:** `feature/slice-18` on **yesid.dev** (stays — yesid.dev IS the monorepo; no new repo).

---

## Status + sub-slice map

| ID | Scope | Status | Effort | Bundle |
|---|---|---|---|---|
| **18a** | Infra + services proof (Tasks 0–7) | ✅ closed 2026-04-23 | shipped | [18a-infra-services-proof/](18a-infra-services-proof/) |
| **18b** | Two-repo decoupling + test split (Task 8 + Task 2b research) | ✅ closed 2026-04-24 | shipped | [18b-decoupling-test-split/](18b-decoupling-test-split/) |
| **18c** | **Foundations + services retrofit + monorepo pivot** — 57 tasks below | ✅ closed 2026-04-24 | shipped | [18c-foundations/](18c-foundations/) |
| **18d** | Asset pipeline + Lottie retirement | ✅ closed 2026-04-24 | shipped | [18d-asset-pipeline/](18d-asset-pipeline/) |
| **18e** | Projects (+ M2M to services replacing CSV) | ✅ closed 2026-04-24 | shipped | [18e-projects/](18e-projects/) |
| **18f** | Blog + Block Editor + BlockRenderer.svelte + projects #41 | ✅ closed 2026-04-26 | shipped (PR #50, 38 commits) | [18f-blog-block-editor/](18f-blog-block-editor/) |
| **18g** | Tech-stack (data-only — Block Editor body fields, M2M services + projects junctions; visualization area blanked pending honeycomb redesign) | ✅ closed 2026-04-27 | shipped (PR #65, 13 commits) | [18g-tech-stack/](18g-tech-stack/) |
| **18h** | Meta + route_seo (singleton + og_image) | ⏸ planned | 0.5 session | — |
| **18h-ii** | Icons collection (centralized icon library, Iconify-backed via community extension) | 🟡 in flight | 0.5–1 session | [18h-ii-icons/](18h-ii-icons/) |
| **18i** | Pages + M2A blocks (12 block collections + nav/menu/error) | ⏸ planned | 2–3 sessions | — |
| **18j** | Polish (Insights · comments · AI Assistant · Flows · role-policy tighten) | ⏸ planned | 1 session | — |
| **18l** | **CMS brand styling** — Data Studio theme to match yesid.dev (logo · favicon · colors · typography via directus-sync themes/settings) | ⏸ planned | 0.5 session | — |
| **18k** | Close (Codex review · delete static · template extraction plan · memories + PR) | ⏸ planned | 1 session | — |

**Sub-slice dependency:**

```
18c ─► 18d ─► { 18e · 18f · 18g · 18h } (parallelizable) ─► 18i ─► 18j ─► 18l ─► 18k
```

18l depends on 18d (asset pipeline for logo upload) + 18j (polish pass done before brand finish).

**Workflow per sub-slice:**

1. Plan appended to this doc before start (or exists from upfront planning).
2. Optional: dispatch deep research agents if unclear — operator decides per sub-slice (research at L1 is mandatory; L2 is operator-directed per `feedback_always_write_slice` + re-plan Q5).
3. Execute.
4. Research + decisions land in sub-slice folder's `research.md` + `decisions.md`.
5. **Before close: file all deferred work (research.md § "Open follow-ups" + decisions.md flagged-for-later) as GitHub issues.** Per AGENTS.md `## Never` (landed 2026-04-24 in `e17c4b3`). PR body links the issues; close commit references them by number.
6. Sub-slice close = owner verification gate → merge PR → move to next.

---

## D-entries (consolidated)

Full D-entry narratives and amendment rationale live in design spec [`docs/superpowers/specs/2026-04-24-slice-18-replan.md § 9`](../../superpowers/specs/2026-04-24-slice-18-replan.md). Summary table:

| # | Decision | Status | Landed / Amended |
|---|---|---|---|
| D1 | Directus hosting: Railway Hobby + BYO Neon | shipped | 18a |
| D2 | Storage: Cloudflare R2 via s3 driver | shipped | 18a |
| D3 | Schema provisioning: **directus-sync per-resource files** (amended from snapshot.yaml) | shape locked | 18c amendment |
| D4 | Visual Editor SDK v2 + conditional `data-directus` + sessionStorage gate pattern | shape locked; impl post-Slice-18 | 18b + 18c refinement |
| D5 | Content Versioning + **Global Draft (v11.16)** on all user collections; no separate status field | shape locked | 18b + 18c amendment |
| D6 | Preview routes: **`/shares` endpoint** (not EDITOR_PREVIEW_TOKEN) + `PreviewContext` at adapter boundary; routes post-Slice-18 | shape locked | 18b + 18c amendment |
| D7 | M2A pages + block collections; per-page block copies | shape locked | 18b |
| D8 | **Full-site revalidation** via Flow Event Hook → Webhook → SvelteKit ISR bypass | shape locked | 18b + 18c amendment |
| D9 | `/assets/:id?key=<preset>` + `STORAGE_ASSET_TRANSFORM=presets` locked + `legacy_path` custom field + folder-per-content-type | shape locked | 18b + 18c amendment |
| D10 | 9 capability policies; ai-editor delete:false; **2FA enforced**; SSO/OIDC NICE → SHOULD; conservative instance-wide `RATE_LIMITER_*` | shape locked | 18b + 18c amendment |
| D11 | **Zero custom Directus extensions EXCEPT directus-sync** authoring tool — *amended by D-AMEND-1 (18h-ii)* | shape locked + amended | 18b + 18c amendment + 2026-04-27 |
| **D-AMEND-1** | **Amends D11.** Zero CUSTOM-BUILT extensions; community-marketplace extensions allowed when listed on Directus marketplace + actively maintained (last commit < 6 months) + clear license + Directus 11.x compat. First adoption: `simple-iconify-picker` for `icons.iconify_id` typeahead UX (see 18h-ii). User principle: "we can use extensions, we just don't reinvent the wheel" | shape locked | 2026-04-27 (18h-ii) |
| D12 | **Turborepo monorepo in existing yesid.dev repo with two-app independence convention** (replaces two-repo; amended 2026-04-24: "strict boundary + CI check" → "convention + code review"; yesido-platform umbrella repo idea dropped — yesid.dev IS the umbrella) | shape locked | 18b + 18c pivot + 2026-04-24 amendment |
| **D13** | Turborepo + **Bun workspaces** monorepo (amended from pnpm 2026-04-24) | shape locked | 18c new (amended in 18c) |
| **D14** | `packages/shared` types + Zod only; runtime helpers app-local | shape locked | 18c new |
| **D15** | Block Editor for all rich content; no Markdown interface; no `marked.parse` consumer-side post-18i | shape locked | 18c new |

---

## Slice-level acceptance gates (at 18k close)

See design spec [`§ 13`](../../superpowers/specs/2026-04-24-slice-18-replan.md) for full list. Headlines:

- [ ] All 6 content ports flipped to Directus (services retrofitted + projects + blog + tech-stack + meta + content/M2A).
- [ ] Static modules deleted; no `.md` in authoring path; no `marked.parse` in consumer bundle.
- [ ] `packages/shared/types/directus-schema.ts` committed + matches live CMS (CI drift check green).
- [ ] directus-sync `apps/cms/directus/**.json` covers every user collection; each passes 18-item checklist (CONVENTIONS.md).
- [ ] Tests green: `bun run test` both apps; `bun run check` 0 errors on apps/web; cross-repo contract-test workflow green; gitleaks green.
- [ ] Editor UX: Insights dashboard live; comments + notifications workflow; AI Assistant configured; Collaborative editing enabled; 2FA on admin.
- [ ] Ops: CSP `FRAME_SRC` set; `STORAGE_ASSET_TRANSFORM=presets` locked; `REVISIONS_RETENTION=90d`; `RATE_LIMITER_*` set; Neon PITR documented.
- [ ] Docs: CONVENTIONS.md + docs/ops/rollback.md + scripts/scaffold-port.ts + template extraction plan committed.
- [ ] Codex adversarial peer review clean.
- [ ] Memories updated; slice PR opened + merged.
- [ ] Live smoke: `/`, `/services/*`, `/projects/*`, `/blog/*`, `/tech-stack/*`, `/about`, `/contact` render from Directus; Lighthouse perf ≥ 90 on `/`.

---

## Risks + mitigations

Full table at design spec [`§ 11`](../../superpowers/specs/2026-04-24-slice-18-replan.md). Top 5:

- **R1 — Monorepo consolidation breaks live services** · feature-branch isolation; ephemeral CI green before cutover.
- **R4 — directus-sync on Railway fails** · P4 probe resolves before 18c commits; fallback to snapshot.yaml.
- **R5 — Markdown → Block Editor migration loses formatting** · AST-based migration + visual diff spot-check.
- **R8 — Services retrofit regresses live prod** · 3-boundary test split + feature branch + smoke verify.
- **R10 — Codex review at 18k surfaces design flaws too late** · mid-slice Codex checkpoint at end of 18c.

---

## Timeline

| Sub-slice | Sessions |
|---|---:|
| 18c | 3–4 |
| 18d | 1 |
| 18e | 1–1.5 |
| 18f | 1.5–2 |
| 18g | 1 |
| 18h | 0.5 |
| 18i | 2–3 |
| 18j | 1 |
| 18l | 0.5 |
| 18k | 1 |
| **Total remaining** | **12.5–15.5 sessions** |

---

## 18a — Infra + services proof (✅ closed 2026-04-23)

**Scope:** Scorch Payload · install Directus 11.17.3 on Railway + Neon + R2 · wire native MCP · build `DirectusAdapter` scaffold · migrate services content type (schema + seed + adapter port) · flip services port via hybrid adapter.

**Shipped:** Tasks 0–7. Live state at close: `cms.yesid.dev` serves 6 services from Directus; other 5 ports still on static adapter; 3-boundary test split established; ai-editor role with MCP scoped.

**Key PRs:** yesid.dev-cms #1 (`a7a1db6`) · #2 (`0295dd6`) · #3 (`d22669c`) · #5 (`13aaeb9`) · #6 (`4963c94`); yesid.dev commits `427ad19` + `a373bf5` on `feature/slice-18`.

**Details:** see [18a-infra-services-proof/research.md](18a-infra-services-proof/research.md) + [decisions.md](18a-infra-services-proof/decisions.md) + git log.

---

## 18b — Decoupling + test split (✅ closed 2026-04-24)

**Scope:** Formalize two-repo boundary (later pivoted to monorepo in 18c) · migrate seed script to CMS repo · minimal bun-toolchain on CMS side · three-boundary test split · cross-repo contract test workflow · Task 2b research pass (feeds into 18c re-plan).

**Shipped:** Task 8 + Task 2b research. yesid.dev-cms PR [#7](https://github.com/mgkdante/yesid.dev-cms/pull/7) merged `8293eec`; yesid.dev commits `57264f3` + `3eb9358` + `540de0e` + `9f43891` on `feature/slice-18`.

**Details:** see [18b-decoupling-test-split/research.md](18b-decoupling-test-split/research.md) + [decisions.md](18b-decoupling-test-split/decisions.md).

---

## 18c — Foundations + services retrofit + monorepo pivot (🟡 in flight)

**Scope:** Everything that sets the pattern for 18d–18k. ~3–4 sessions. 57 tasks across 5 phases: probes → monorepo consolidation → CMS foundations → web foundations → services retrofit → docs + ceremony.

**Branch:** `feature/slice-18` on yesid.dev (current branch; yesid.dev IS the monorepo — no new umbrella repo).

**Research/decisions:** see [18c-foundations/research.md](18c-foundations/research.md) + [decisions.md](18c-foundations/decisions.md).

### Phase 0 — Probes (before any code change)

9 probes; findings populate [18c-foundations/research.md](18c-foundations/research.md). Blocking probes (P4, P6, P7, P9) must complete before Phase 1. Non-blocking probes (P1, P2, P3, P5, P8) can run in parallel.

| # | Probe | Blocks |
|---|---|---|
| **Task 1** | P4 — directus-sync on Railway via custom Dockerfile | ✅ blocking (D3 + D11) |
| **Task 2** | P6 — Turborepo + Vercel monorepo deploy | ✅ blocking (D13) |
| **Task 3** | P7 — Railway monorepo + directus-sync extension | ✅ blocking (D13 + D11) |
| **Task 4** | P9 — **Bun workspace** + @repo/shared in SvelteKit + Bun (amended from pnpm 2026-04-24) | ✅ blocking (D14) |
| **Task 5** | P1 — Global Draft v11.16 × Group interfaces (bug #26890) | no |
| **Task 6** | P2 — `/shares` endpoint behavior (TTL, password, role inheritance) | no |
| **Task 7** | P3 — Block Editor JSON output shape + block type catalog | no |
| **Task 8** | P5 — MCP system-prompt scope (per-role or instance-global) | no |
| **Task 9** | P8 — AVIF support (deferrable to 18d) | no |

Each probe task: run the probe · document findings in research.md · commit. Full probe specs in design spec [`§ 10`](../../superpowers/specs/2026-04-24-slice-18-replan.md).

### Phase 1 — Monorepo consolidation (Tasks 10–19)

Convert existing yesid.dev repo to monorepo umbrella: `git mv` current root contents into `apps/web/`; subtree-import yesid.dev-cms into `apps/cms/`; add root-level `packages/shared/`; set up Turborepo + **Bun workspaces** at root; rewrite CI workflows for monorepo; reconfigure existing Vercel project Root Directory; reconfigure existing Railway service source; smoke both deploys; cutover (archive **yesid.dev-cms** repo only — yesid.dev stays as the monorepo).

- **Task 10:** Pre-flight: clean working tree · confirm `bun 1.3.11` + `node 22.x` or newer · commit any pending work on `feature/slice-18` · verify `.gitignore` won't block monorepo-level files
- **Task 11:** `git mv` current yesid.dev root contents → `apps/web/` (`src/`, `static/`, `brand/`, `scripts/`, `tests/`, `package.json`, `tsconfig.json`, `svelte.config.js`, `vite.config.ts` if present, `playwright.config.ts`, `vitest.config.ts`, `components.json`, `eslint.config.js`, `bun.lock` → rename to `apps/web/bun.lock`, any root-level configs). Keep at repo root: `docs/`, `.github/`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `.gitignore`
- **Task 12:** `git subtree add --prefix apps/cms https://github.com/mgkdante/yesid.dev-cms.git main` (preserves yesid.dev-cms history inside apps/cms)
- **Task 13:** Root `package.json` with `"workspaces": ["apps/*", "packages/*"]` (apps in workspaces for Turborepo discovery; independence via `"private": true` + no cross-app deps + code review) + `turbo.json` + `.bun-version` (pin Bun 1.3.x); `bun install`; commit root `bun.lock`
- **Task 14:** Create `packages/shared/` (types + Zod); move `apps/web/src/lib/types.ts` content → `packages/shared/src/types/content.ts`; update apps/web + apps/cms imports to consume `@repo/shared`
- **Task 15:** Rewrite `.github/workflows/`: `web.yml` + `cms.yml` + `contract-test.yml` (intra-repo now — both apps in same repo) + `secret-scan.yml` + `.gitleaksignore`. No cross-repo mirror workflows.
- **Task 16:** **Existing** Vercel project (yesid.dev) → Settings → change Root Directory from root → `apps/web`; build via `turbo run build --filter=./apps/web`; env vars unchanged (already on project)
- **Task 17:** **Existing** Railway service → Settings → Source → repo switch from `yesid.dev-cms` → `yesid.dev`; set Root Directory=`apps/cms`; switch from image-pull to Dockerfile-build (`apps/cms/Dockerfile` with directus-sync); Watch Paths=`/apps/cms/**`; deploy; verify `/server/health` + extension loaded
- **Task 18:** Smoke test both deploys on `feature/slice-18` branch; run intra-repo contract-test via workflow_dispatch; verify web SSR + CMS health green
- **Task 19:** Cutover — archive `mgkdante/yesid.dev-cms` on GitHub (history preserved in `apps/cms/`); update memory `project_slice_18.md` paths; yesid.dev stays live + active

### Phase 2 — CMS app foundations (Tasks 20–39)

- **Task 20:** Fix `apps/cms/infra/directus/snapshot.yaml:40` Unicode corruption (F1; `sed` replace `�` → `·`)
- **Task 21:** Migrate snapshot.yaml → directus-sync per-resource files via `directus-sync pull` (D3 amendment)
- **Task 22:** Update `cms.yml` workflow to use `directus-sync push` (replaces curl/multipart)
- **Task 23:** Restructure fixtures → `fixtures/collections/services.json` + `fixtures/singletons/` + `fixtures/folders.json` + `fixtures/permissions.json` (F10)
- **Task 24:** Fixture drift detector `tests/fixture-drift.test.ts` (F11 — retires in 18k)
- **Task 25:** `scripts/lib/sdk.ts` — `createClient` + `requireEnv` + `defaultDirectusUrl` + unit test (F7)
- **Task 26:** `scripts/lib/auth.ts` — `getAdminToken` with token/email+password fallback + unit test (F7)
- **Task 27:** `scripts/lib/chunk-array.ts` — `chunkArray<T>` + unit test (F7)
- **Task 28:** `scripts/lib/catch-error.ts` — `DirectusError` class + `parseErrors` + unit test (F7 + F8)
- **Task 29:** `scripts/lib/logger.ts` — `createLogger(scope)` + unit test (F7)
- **Task 30:** `scripts/lib/read-fixture.ts` — `readFixture<T>(path, schema)` + unit test (F7)
- **Task 31:** `scripts/lib/bottleneck.ts` — `withRateLimit` wrapper + unit test (F7 + F13 script-side; adds `bottleneck` dep)
- **Task 32:** `scripts/lib/loaders.ts` — `loadSkeletonRecords` + `loadFullData` + `findOrphans` + `deleteOrphans` + `fetchExistingIds` + unit tests (F9)
- **Task 33:** Refactor `seed-services.ts` onto `scripts/lib/` + upsert pattern + `--dry-run` + `--reset` flags (F9)
- **Task 34:** `scripts/generate-types.ts` — handrolled codegen reading `/fields` + `/collections` → `packages/shared/src/types/directus-schema.ts`; add CI drift check (F12)
- **Task 35:** MCP system prompt upgrade — 250-400 word prompt in `directus/settings.json` via directus-sync push (F14)
- **Task 36:** MCP global delete protection ON + ai-editor `delete: false` permission rows in `directus/permissions.json` (F15)
- **Task 37:** Env var lock: `STORAGE_ASSET_TRANSFORM=presets` + `WEBSOCKETS_ENABLED=true` + `WEBSOCKETS_COLLAB_ENABLED=true` + `REVISIONS_RETENTION=90d` + `RATE_LIMITER_*` + CSP `FRAME_SRC`; update `.env.example` (F16 + F17 + F18 + F22 cms + Q12)
- **Task 38:** `contract-test.yml` workflow_dispatch `ref` input for feature-branch targeting (F19)
- **Task 39:** CI polish — Docker image caching + `.gitleaks.toml` with allowlist for known CI creds

### Phase 3 — Web app foundations (Tasks 40–48)

- **Task 40:** p-queue + fetchRetry wrapper in `apps/web/src/lib/adapters/directus-queue.ts` + integrate into `directus.ts` client construction (F13 consumer)
- **Task 41:** Route Directus adapter responses through `parsePort` Zod gate (F3)
- **Task 42:** Extract named ContentPort interfaces → `packages/shared/src/types/content.ts` (HeroContent, ManifestoContent, etc.); replace `typeof import(...)` bindings in `apps/web/src/lib/adapters/types.ts` (F4)
- **Task 43:** Add `PreviewContext` param (optional) to every port method; directus branches on `ctx?.shareToken` for `/shares`-based auth (F5 + D6)
- **Task 44:** Refactor `apps/web/src/tests/setup.data.ts` mock scope → `$lib/adapters/index` (not `./directus`); remove `vi.importActual` from contract test (F6)
- **Task 45:** Mocked-fetch contract test template → `apps/web/src/lib/adapters/directus.mocked.test.ts` — asserts `readItems` call shape per port (F23)
- **Task 46:** Adjacency retrofit — per-request WeakMap memo + minimal-fields fetch in `directus.ts` for `services.adjacent` (F2)
- **Task 47:** Asset helper → `apps/web/src/lib/directus/assets.ts` — `asset(id, preset?)` + `buildSrcSet(id, widths)` + typed preset union (+ unit test)
- **Task 48:** Update `apps/web/.env.example` with CSP + shares + `VERCEL_BYPASS_TOKEN` docs (F22 web)

### Phase 4 — Services retrofit (Tasks 49–51 · F24)

Apply F1–F23 patterns to the live services port so it becomes the reference impl.

- **Task 49:** Services collection — Global Draft enable (if P1 green) + display_template polish + archive_field + `status` field; push via directus-sync
- **Task 50:** Refresh ai-editor policy for services via `directus/permissions.json` (publish-blocked + delete false); verify via curl
- **Task 51:** Verify services adapter port already uses all new patterns (p-queue + parsePort + PreviewContext + memo); run full test suite + live smoke on `/services/*`

### Phase 5 — Docs + ceremony (Tasks 52–57)

- **Task 52:** Write `apps/web/docs/slices/slice-18/CONVENTIONS.md` — full contents per design spec [§ 8](../../superpowers/specs/2026-04-24-slice-18-replan.md) (repo separation, field naming, 18-item checklist, permissions, seed shape, test taxonomy, adapter template, Block Editor rule, translations, files, flows, rollback)
- **Task 53:** Write `apps/web/docs/ops/rollback.md` — schema revert · seed revert · data loss (Neon PITR) · port flip revert recipes
- **Task 54:** Write `apps/cms/scripts/scaffold-port.ts` — generates port boilerplate (fixture + test + adapter + contract test) from collection name argument
- **Task 55:** Apply D-entry amendments to slice-level this doc (D3 · D4 · D5 · D6 · D8 · D9 · D10 · D11 · D12 · D13 · D14 · D15) + Amendments log row; verify matches design spec
- **Task 56:** Update memory `project_slice_18.md` — monorepo pivot executed, directus-sync adopted, paths updated (content moved yesid.dev/* → yesid.dev/apps/web/*; repo stays yesid.dev)
- **Task 57:** Open 18c PR on yesid.dev; CI green; owner review; merge; update handoff in 18c-foundations/decisions.md with merge SHA

### 18c Acceptance

- [ ] Probes P1–P9 documented in 18c research.md.
- [ ] Monorepo consolidated inside existing yesid.dev repo (root contents moved to apps/web; yesid.dev-cms subtree imported to apps/cms; yesid.dev-cms repo archived).
- [ ] Vercel + Railway deploys green from new build roots.
- [ ] directus-sync operational; `apps/cms/directus/**.json` committed; prod apply via workflow_dispatch green.
- [ ] F1 Unicode fixed; F10–F12, F2, F3, F4, F5, F6, F7 (7 lib files), F8, F9, F13, F14, F15, F16/17/18, F19, F22, F23, F24 all delivered.
- [ ] CI polish: Docker cache + gitleaks green.
- [ ] `packages/shared` type-only + Zod; resolves cleanly in both apps.
- [ ] Codegen drift check green on CI.
- [ ] Services retrofit: live `/services/*` unchanged; tests green both apps.
- [ ] CONVENTIONS.md + rollback.md + scaffold-port.ts committed.
- [ ] D-entry amendments in this doc.
- [ ] `bun test` green both apps; `bun run check` 0 errors on apps/web.
- [ ] Neon PITR verified + documented.
- [ ] 18c PR merged.

---

## 18d — Asset pipeline (⏸ planned)

**Scope:** CMS-app-only migration of `apps/web/static/images/*` → Directus + R2. Install 4 saved presets via `seed-presets.ts`. Create `legacy_path` custom field on `directus_files` via directus-sync. AVIF live-probe (Q10). Emit `fixtures/assets-id-map.json` for 18e–18i consumption.

**Folders:** services · projects · blog · brand · about · og.

**Presets:** hero-1200 (WebP 1200w q=85) · card-600 (WebP 600w q=80) · thumb-240 (WebP 240w q=75) · og-1200 (JPG 1200×630 q=85) · +AVIF variants if probe green.

**Acceptance:** all assets uploaded · `curl cms.yesid.dev/assets/<id>?key=hero-1200` returns WebP 1200-wide · AVIF result documented · `assets-id-map.json` committed · Public policy grants files.read folder-scoped per D10.

**When 18c closes:** plan the full 18d task breakdown inline here; follow workflow (optional deep research; brainstorm; plan; execute).

---

## 18e — Projects (✅ closed 2026-04-24)

**Scope:** First canonical content-type migration after foundations + asset pipeline. Reference pattern for 18f/18g/18h.

**Shipped:** 7 collections (projects + projects_translations + projects_sections + projects_sections_translations + projects_impact_metrics + projects_impact_metrics_translations + projects_services M2M junction) live at cms.yesid.dev with 58 permission rows + 1 new `_sync_human_editor_policy`. 6 projects + 10 junction rows seeded via `seed-projects.ts` (mirrors seed-services pattern: lib/* helpers + dry-run + reset + pure helpers). Adapter port (8 methods) implemented in `apps/web/src/lib/adapters/directus.ts` with parsePort + queuedFetch gates. Services adapter switched to M2M junction reads (per-ctx WeakMap memoized). `services.related_projects` CSV field DROPPED via second push. Hybrid flip lands at `apps/web/src/lib/adapters/index.ts` (single line). Static adapter mirrors UUID semantics for `Project.image` via `assetIdForOrUndefined`. ProjectCard.svelte updated to use `asset(image, 'card-600')` helper. 4 test boundaries green: fixture-projects + seed-projects-dry-run + directus.contract + directus.mocked. apps/web 1029 tests pass · apps/cms 131 tests pass · `bun run check` 0 errors. Cascade FK filter syntax confirmed working (Phase 1 probe → Phase 6 live verification).

**Deferred:** Block Editor migration for projects description + sections.content (post-18f) · scaffold-port.ts M2M extension (18k) · projects integration tests (18j) · N+1 batch optimization for services junction · cosmetic FK constraint name diff noise — all filed as GitHub issues at close.

**Details:** see [18e-projects/spec.md](18e-projects/spec.md) + [18e-projects/plan.md](18e-projects/plan.md) + [18e-projects/research.md](18e-projects/research.md) + [18e-projects/decisions.md](18e-projects/decisions.md).

---

## 18f — Blog + Block Editor + BlockRenderer.svelte (🟡 in flight)

**Scope:** Most Svelte-side work in slice-18; introduces Block Editor consumer component. **Folds in [#41](https://github.com/mgkdante/yesid.dev/issues/41) (projects body migration) per Q3 + new `morph_shapes` collection per Q6 + new `illustrations` library per Q5.** See [18f-blog-block-editor/spec.md](18f-blog-block-editor/spec.md) + [plan.md](18f-blog-block-editor/plan.md) (13 phases, 92 tasks).

**Schema:** `blog_posts` (id · slug · status · date_published · lang · body **[Block Editor]** · cover_image M2O · svg_illustration M2O · animation_reverse M2O) + `blog_posts_translations` (language_code · title · excerpt).

**New component:** `apps/web/src/lib/components/blog/BlockRenderer.svelte` (block-type dispatch: heading · paragraph · image · code · list · embed · quote · divider).

**Migration script:** `apps/cms/scripts/migrate-markdown-to-blocks.ts` — parses `apps/web/src/content/blog/*.md` via `marked` AST; maps tokens to Block Editor JSON; writes via SDK. Reused by 18g.

**Acceptance:** `/blog` + `/blog/[slug]` from Directus with Block Editor body · markdown-to-blocks migration verified spot-check 3 posts · SSR + visual parity vs pre-flip.

---

## 18g — Tech-stack + tech_relations + stack_scenarios (⏸ planned)

**Schema:** `tech_stack` (id · slug · category · status · sort · body **[Block Editor]**) + `tech_stack_translations` (language_code · title) + `tech_relations` (self-M2M with connection_notes) + `stack_scenarios` + `stack_scenarios_translations`.

**Reuses:** `BlockRenderer.svelte` (from 18f) · `migrate-markdown-to-blocks.ts` (from 18f).

**Migration:** `apps/web/src/content/stack/{id}.md` → Block Editor JSON via reused script.

**Acceptance:** `/tech-stack` + `/tech-stack/[id]` render with items + relations + scenarios; graph utilities return correct adjacency.

---

## 18h — Meta + route_seo (⏸ planned)

**Smallest sub-slice** (0.5 session).

**Schema:** `site_meta` singleton (+ translations) + `route_seo` collection (route_id UNIQUE · visibility · og_image M2O) + `route_seo_translations`.

**Contract:** `meta.forRoute` throws on unknown route_id (closed registry preserved).

**New:** layout-level `fetchSiteData` in `apps/web/src/routes/+layout.server.ts` — nav + site_meta loaded once; downstream routes consume from `$page.data`.

**Acceptance:** every route's `<head>` SEO from Directus; layout-level fetch shown in Network tab (one call).

---

## 18i — Pages + M2A blocks (⏸ planned)

**Largest content-type sub-slice** (2–3 sessions).

**Schema:** `pages` (id · slug [home · about · contact · services · projects · tech-stack · blog] · title · sort) + M2A `blocks` junction + **12 block collections:** `block_hero` · `block_manifesto` · `block_proof_reel` · `block_services_grid` · `block_cta` · `block_closer` · `block_about_content` · `block_contact_content` · `block_tech_stack_page_content` · `block_blog_page_content` · `block_projects_page_content` · `block_journey_panel`. Each with translations. Rich-content blocks use Block Editor. Singletons outside M2A: nav_links · menu_items · error_pages · languages.

**Versioning caveat:** P1 probe informs Group-interface handling.

**Adapter strategy:** per-request memoized `loadPage(slug)` fetches full M2A tree in one query; each `content` port method picks from memoized Map.

**Acceptance:** all routes render from Directus-M2A; all 12 block types hydrate; nav + menu + error_pages work.

---

## 18l — CMS brand styling (⏸ planned)

**Scope:** Apply yesid.dev brand to the Directus Data Studio admin UI. 0.5 session. Uses directus-sync authoring (D11) + asset pipeline (18d logo upload).

**Artifacts:**
- Logo + favicon uploaded to Directus via `apps/cms/fixtures/brand/` (consumed by 18d's migrate-assets).
- `apps/cms/directus/settings.json` — `project_name`, `project_logo`, `public_background`, `public_note`, `default_theme_light`, `default_theme_dark`.
- `apps/cms/directus/themes/yesid-light.json` + `apps/cms/directus/themes/yesid-dark.json` — custom themes matching yesid.dev accent + typography (Inter + JetBrains Mono where Directus Theme API allows custom-font-family).
- Optional: `apps/cms/directus/flows/brand-welcome.json` for login-page note.

**Acceptance:**
- [ ] `cms.yesid.dev` login page shows yesid.dev logo + brand accent
- [ ] Data Studio sidebar + primary buttons use yesid.dev accent colors
- [ ] Typography matches where Theme API permits (font-family override)
- [ ] Both light + dark themes shipped; default follows user's system preference
- [ ] All styling authored via directus-sync (no custom extension) — re-deployable from JSON

**Dependencies:** 18d (logo upload path) · 18j (polish base done).

**Runs:** between 18j polish and 18k close.

---

## 18j — Polish (⏸ planned)

1 session. Editor UX + automation.

- Insights "Content Ops" dashboard (5 panels)
- Item comments + @mentions workflow (ai-editor drafts → @yesid → human promotes)
- Notifications + SMTP (via Resend HTTPS API webhook Flow — unblocks port 587 issue from 18a)
- AI Assistant — Anthropic with tool-search from v11.17.1
- 3 quick-action Flows (Publish + deploy · Regenerate SEO · Publish translation)
- Bookmarks presets per-role
- Full-site revalidation Flow (D8)
- ai-editor policy final tightening (J8)
- CI Docker caching polish
- `fetchSiteData` consumption verify
- MCP permissions audit test (`tests/mcp-policy-shape.test.ts`)
- Visual-editing sessionStorage gate wording update
- SSO/OIDC flag for post-Slice-18 if second editor joins

---

## 18k — Close (⏸ planned)

Ceremony + cleanup. 1 session.

- Codex adversarial peer review
- Delete static modules: `apps/web/src/lib/content/*.ts` + `apps/web/src/content/*.md`; retire `fixture-drift.test.ts`
- Permissions migration (shell-loop → fixture) if not already done in 18c
- Write `docs/superpowers/specs/2026-04-24-template-extraction.md` (K4)
- Memory + slice PR + Vercel retire
- Gitleaks final verification

---

## References

- Design spec (brainstorming output): [`docs/superpowers/specs/2026-04-24-slice-18-replan.md`](../../superpowers/specs/2026-04-24-slice-18-replan.md)
- Research audit (4 agents): [`docs/superpowers/research/2026-04-24-slice-18-replan-audit.md`](../../superpowers/research/2026-04-24-slice-18-replan-audit.md)
- CONVENTIONS.md: [`docs/slices/slice-18/CONVENTIONS.md`](CONVENTIONS.md) (committed 18c Task 52)
- 18d design spec: [`docs/superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md`](../../superpowers/specs/2026-04-24-slice-18d-asset-pipeline-design.md)
- Open follow-up issues: **#37** (Sharp transforms passthrough on Railway · infra) · **#38** (R2 bucket versioning · 18j) · **#40** (assets-id-map sync between apps/cms ↔ packages/shared · post-18 polish)

---

## Amendments log

| Date | Change | Rationale | Affected sections |
|---|---|---|---|
| 2026-04-22 | Tasks 0–2 shipped; D1/D2/D3 + Q4–Q7 resolved | Task 2 research landed | D-entries |
| 2026-04-23 | Task 3 via MCPs; Resend SMTP deferred; Neon clean-slated mid-task | Railway egress + template interference | 18a |
| 2026-04-23 | Tasks 4–7 shipped as services proof-of-pattern | Port-by-port pattern proven | 18a |
| 2026-04-23 | Mid-slice scope correction: full-migration re-plan via Task 2b | Tasks 5–7 shipped as TS-mirror, not CMS-native | D4–D12 + Open Qs |
| 2026-04-24 | Task 8 shipped + PR #7 merged | Two-repo decoupling + test split | 18b |
| 2026-04-24 | 18c re-plan + monorepo pivot (Turborepo) + D13/D14/D15 new | Brainstorming + 4-agent audit | Major amendment — see design spec changelog |
| 2026-04-24 | Docs reorg: removed slice-level spec.md + handoff.md + research.md; whole plan now in this doc; sub-slices keep research + decisions only | Per-workflow owner directive | Structural |
| 2026-04-24 | **D13 workspace tool amended: pnpm → Bun workspaces** (post P4/P6/P7/P9 probe completion). Owner directive: project is Bun-first throughout; single-tool dev ergonomics; Bun 1.3 already installed + GA on Vercel; Turborepo is package-manager-agnostic. Root `workspaces` field replaces `pnpm-workspace.yaml`; `bun install` + `bun.lock` replace pnpm equivalents. Fallback to pnpm documented as ~1hr reversible. Full rationale: [`18c-foundations/decisions.md § Amendments`](18c-foundations/decisions.md). | Bun-first consistency + no pnpm install pre-req + Vercel/Bun GA | D13 + Task 13 + Tech stack line |
| 2026-04-24 | **Monorepo umbrella: yesido-platform new repo → existing yesid.dev repo**. yesid.dev IS the monorepo. Current root contents `git mv` → `apps/web/`; yesid.dev-cms subtree-imported to `apps/cms/`; yesid.dev-cms archived post-cutover (yesid.dev stays live). No new GitHub repo created. Tasks 10-19 rewritten: umbrella creation dropped (Task 10 now pre-flight checks); subtree import of yesid.dev web-side dropped (Task 11 now `git mv`); existing Vercel + Railway projects reconfigured in-place (Tasks 16 + 17) — no new project creation. | Simpler: no new repo; preserves yesid.dev domain↔name parity; preserves Vercel project ID; fewer migration artifacts | D12 + Phase 1 Tasks 10-19 + 18c branch + 18c acceptance |
| 2026-04-24 | **D12 strict boundary → app independence convention.** Soft rule enforced by code review + natural separation (apps NOT workspace packages; cross-app imports need relative paths which catch in review). Dedicated CI check removed from Task 15 scope. `packages/shared` remains the only legitimate cross-app surface. | YAGNI on CI check; natural enforcement sufficient; Turborepo + separate package.json per app makes cross-imports ugly enough to catch in review | D12 + Task 15 + CONVENTIONS.md § 8.0 |
| 2026-04-24 | **Added 18l sub-slice: CMS brand styling** (Data Studio theme matching yesid.dev brand). 0.5 session. Runs between 18j (polish) and 18k (close). Uses directus-sync authoring + 18d asset pipeline (logo upload). No new D-entries. | Owner directive: final polish to match brand across consumer site + CMS | Status table + dependency graph + sub-slice section + timeline |
| 2026-04-24 | **18c closed.** Phase 2 (CMS foundations) + Phase 3 (web foundations) + Phase 4 (services retrofit) + Phase 5 (docs + ceremony) all landed. `apps/web` has p-queue + parsePort + PreviewContext + WeakMap memo + asset helper. `apps/cms` has 72-file directus-sync schema + 9 env vars locked on Railway + 338-word MCP system prompt applied + ai-editor policy separated from admin (19 scoped permission rows on services family). 1011 tests pass; 0 type errors; live smoke on yesid-dev.vercel.app/services/\* renders from Directus including adjacency. Docs: `CONVENTIONS.md` + `docs/ops/rollback.md` + `scripts/scaffold-port.ts` committed. No D-entry deltas from plan. | All 57 tasks executed per plan; no plan-level surprises required amendment | Final 18c acceptance row |
| 2026-04-24 | **18d closed.** Asset pipeline shipped — 14 files migrated to Directus + R2 with `legacy_path` idempotency · 4 base presets live via directus-sync · `assets-id-map.json` emitted + re-exported via `@repo/shared.assetIdFor` · `montreal-metro.svg` consumer flipped to Directus fetch + `{@html svg}` (Public policy folder-scoped files.read enables unauth SSR). Lottie purged: 11 files deleted (~1.1 MB) · `lottie-web` dep removed · `lottieReverse` plumbing dropped from 6 files + Directus column dropped. 5 dead static images deleted (~4.4 MB). P8 AVIF probe: **RED** — Sharp on Railway silently downgrades; AVIF deferred. Phase 7 finding: Sharp transforms silently passthrough on Railway (preset routing works, image processing doesn't); per-user-decision Option 1: ship + defer Sharp fix. directus-sync diff empty after all pushes. PR #39 squash-merged at `b51bb9e`; net **−1,681 lines** across 66 files. | Slice acceptance partial: preset routing + manifest + idempotency green; Sharp transforms deferred. | Status table + Amendments log |
| 2026-04-24 | **Workflow rule landed (`e17c4b3`):** AGENTS.md `## Never` adds "Close a slice with deferred work that isn't filed as a GitHub issue first." Issues #37 (Sharp · infra), #38 (R2 versioning · 18j), #40 (assets-id-map sync · post-18 polish) filed retroactively from 18d's research.md § Open follow-ups. Workflow item 5 in this doc updated to reference. | Untracked deferrals lose context fast and become tribal knowledge. Codify the rule before more sub-slices accrue follow-ups. | Workflow per sub-slice + AGENTS.md + References |
| 2026-04-24 | **18e closed.** Projects migration shipped — 7 collections + M2M junction live · 58 permission rows + 1 new policy · 6 projects + 10 junction rows seeded · adapter port (8 methods) + services-junction switch · services.related_projects CSV dropped · hybrid flip at adapters/index.ts · ProjectCard uses asset() helper · all 4 test boundaries green; 1029 apps/web + 131 apps/cms tests pass; 0 type errors. Five deferred items filed as GH issues at close (Block Editor migration, scaffold-port M2M extension, integration tests, N+1 batch, FK constraint noise). Notable findings amended into 18e decisions.md: Public policy `_syncId` is `_sync_default_public_policy`; `_sync_human_editor_policy` newly created; cosmetic FK constraint name diff persists; only ProjectCard.svelte uses `project.image` (smaller surface area than plan estimated). | First canonical content-type migration shipped per spec; reference pattern locked for 18f/18g/18h. | Status table + Amendments log + § 18e |
