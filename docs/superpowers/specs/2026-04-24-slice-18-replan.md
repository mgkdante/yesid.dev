# Slice 18 Re-plan — Design Spec

| Field | Value |
|---|---|
| Status | ✅ Design approved (brainstorming complete 2026-04-24) |
| Authors | Yesid (owner) + Claude Code (Opus 4.7 [1m], reasoning=high) |
| Supersedes | Prior flat slice-18 plan (Tasks 0–15) · Tasks 0–7 + 2b + 8 shipped preserved as retrospective |
| Research | [../research/2026-04-24-slice-18-replan-audit.md](../research/2026-04-24-slice-18-replan-audit.md) (4 parallel agents, ~30k words) |
| Target | `feature/slice-18` branch → to be merged post-close |
| Implementation plan | **To be generated next via `superpowers:writing-plans` skill** |

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Context + prior state](#2-context--prior-state)
3. [Decisions locked](#3-decisions-locked)
4. [Architecture end state](#4-architecture-end-state)
5. [Sub-slice decomposition](#5-sub-slice-decomposition)
6. [18c detailed scope (foundations + services retrofit + monorepo pivot)](#6-18c-detailed-scope-foundations--services-retrofit--monorepo-pivot)
7. [18d–18k sub-slice sketches](#7-18d-18k-sub-slice-sketches)
8. [Cross-cutting conventions (CONVENTIONS.md)](#8-cross-cutting-conventions-conventionsmd)
9. [D-entry amendments (consolidated)](#9-d-entry-amendments-consolidated)
10. [Probes (land in 18c research)](#10-probes-land-in-18c-research)
11. [Risks + mitigations](#11-risks--mitigations)
12. [Timeline estimate](#12-timeline-estimate)
13. [Final acceptance gates](#13-final-acceptance-gates)
14. [References](#14-references)
15. [Spec changelog](#15-spec-changelog)

---

## 1. Executive summary

Slice 18 migrates yesid.dev from a static TS content layer to a self-hosted Directus 11.17.3 CMS. Tasks 0–7 + 2b + 8 shipped (infra + services proof + two-repo decoupling + test-suite split). This re-plan rebuilds the remaining work from scratch using research-derived Directus feature prioritization + pivots the two-repo setup into a **Turborepo monorepo** with strict app-boundary separation.

**Headline decisions:**
- Consolidate `yesid.dev` + `yesid.dev-cms` into a Turborepo monorepo: `apps/web` + `apps/cms` + `packages/shared`. Independent deploy targets preserved (Vercel + Railway). Industry-standard shape for template extraction post-Slice-18.
- Adopt directus-sync (451-star authoring tool, requires custom Dockerfile) for per-collection-file schema authoring. D11 amendment.
- Block Editor (not Markdown) for all rich content. Eliminates `marked.parse` from consumer + all `.md` files in the authoring path. D15 (new).
- Shares endpoint (not EDITOR_PREVIEW_TOKEN) for preview auth. D6 amendment.
- Global Draft (v11.16) on every versioned collection. Full-site revalidation via Flows. MCP system-prompt upgrade + AI Assistant + Insights dashboards + collaborative editing + 9 capability policies composed onto admin/human-editor/ai-editor/Public.

**Remaining work:** 9 sub-slices (18c–18k), 12–15 sessions estimated. Each follows the canonical pattern (snapshot + seed + adapter port + single PR with scoped commits) established in 18c.

**Template deliverable post-Slice-18:** `<your-org>/directus-sveltekit-pro` monorepo template extracted from yesid.dev after 18k closes (generic @repo/* package names; cloners rebrand via README).

---

## 2. Context + prior state

### 2.1 Shipped state (18a + 18b)

- **18a (Tasks 0–7)** — Directus 11.17.3 live at `cms.yesid.dev` on Railway · Neon Postgres (BYO) · Cloudflare R2 via `s3` driver · native MCP server registered as `yesid-cms-prod` · services content type fully migrated with translations + deliverables + sections junctions · hybrid adapter at `src/lib/adapters/index.ts` serving services from Directus, 5 other ports from static.
- **18b (Task 8 + research 2b)** — two-repo decoupling: seed migrated from consumer to CMS repo · minimal bun-based CMS toolchain (`@directus/sdk` + `zod` + `yaml` + `bun-types`) · three-boundary test split (CMS snapshot-shape + consumer contract + cross-repo integration) · mirrored contract-test.yml in both repos · README Operations section with 90d rotation policy.

### 2.2 Research base for this re-plan

Four parallel agents dispatched 2026-04-24. Full audit at [`docs/superpowers/research/2026-04-24-slice-18-replan-audit.md`](../research/2026-04-24-slice-18-replan-audit.md):

- **Agent A** — Directus 11.17.3 feature catalog × yesid.dev use-case × MUST/SHOULD/NICE/DEFER ranking.
- **Agent B** — Adversarial code review of 18a/18b (C1 snapshot Unicode corruption · C1 services.adjacent double-fetch · C3 vi.importActual setup coupling · P1–P9 pattern-affecting findings).
- **Agent C** — Editor UX + Data Studio + MCP workflow deep-dive (Display Templates · Insights · comments · notifications · AI Assistant · collaborative editing · MCP system prompt).
- **Agent D** — Mature Directus + SvelteKit patterns from 10+ GitHub repos (p-queue client · schema-driven type codegen · skeleton-records-then-full-data seed · scripts/lib/ · one-file-per-resource fixtures · directus-sync · DirectusError class).

### 2.3 Scope change vs original slice-18 plan

Original plan: flat 16-task bundle (0–15 + 2b), services as proof-of-pattern, then replicate per content type.

This re-plan: rebuilds as 9 hierarchical sub-slices (18a + 18b retroactive; 18c–18k forward), absorbs Directus-feature-matrix-driven scope expansion (editor UX + automation + template-worthy patterns), and pivots the two-repo setup into a Turborepo monorepo.

---

## 3. Decisions locked

### 3.1 Re-plan scope questions (Q1–Q5)

| # | Question | Answer |
|---|---|---|
| Q1 | Scope of re-plan | **C** — rebuild from scratch; 18a/18b accepted as retrospective |
| Q2 | What's reworkable | **C** — everything on the table incl. live production (services retrofit in 18c) |
| Q3 | Reuse deliverable shape | **A** — extract yesid.dev-cms → reusable template post-Slice-18 |
| Q4 | Sub-slice decomposition | **C** — 9 sub-slices: foundations + retrofit → content types → polish → close |
| Q5 | Feature prioritization | **D** — research-pass decides; pick MUSTs from audit output (done; all MUSTs locked below) |

### 3.2 Directus-specific open questions (from audit)

| # | Question | Answer | Implication |
|---|---|---|---|
| Q1-a | blog_posts.body: Markdown or Block Editor? | **Block Editor** | Supersedes prior spec Q7 (Markdown). Drives D15. Requires `BlockRenderer.svelte` in 18f. |
| Q2-a | Versioning: Global Draft (v11.16) or per-item custom? | **Global Draft** | D5 amendment. Probe P1 for #26890 before rollout to Group-interface collections. |
| Q3-a | Preview: `/shares` endpoint or EDITOR_PREVIEW_TOKEN? | **/shares endpoint** | D6 amendment. Adapter boundary takes `PreviewContext = { shareToken, version? }`. Actual routes defer post-Slice-18. |
| Q4-a | Editor count: solo or growing? | **May grow** | 2FA MUST (already F20); SSO/OIDC NICE → SHOULD (18j flag). |
| Q5-a | Revalidation scope | **Full site** | D8 amendment. Simpler; bigger cache bust; acceptable for yesid.dev traffic profile. |
| Q6 | directus-sync now or defer? | **Now** (D11 amend) | Custom Dockerfile + EXTENSIONS_PATH on Railway. Probe P4. |
| Q7 | Type generator: directus-sdk-typegen or handrolled? | **Handrolled** | Small `scripts/generate-types.ts`; reads /fields + /collections; outputs to `packages/shared/types/directus-schema.ts`. |
| Q8 | Focal point mandatory or defaulted? | **Default-center + MCP nudge** | Not required field; MCP system prompt (F14) instructs AI to set on hero images. |
| Q9 | Shared types: workspace or codegen? | **Codegen** (now via `packages/shared` per monorepo) | Under monorepo, codegen output lives in `packages/shared/types/`; both apps import workspace-style. TS compile-time enforcement replaces runtime drift check. |
| Q10 | AVIF verification | **Slice 18** | Probe P8 in 18d. Add AVIF preset variant if green. |
| Q11 | Backup strategy | **Neon PITR + documented runbook** | No scheduled pg_dump; rely on Neon paid-tier PITR; document in `docs/ops/rollback.md`. |
| Q12 | Rate limiting | **Instance-wide conservative** | No per-role (Directus doesn't support); set `RATE_LIMITER_*` env vars conservatively. |

### 3.3 Repo architecture

**Monorepo pivot (D13 new + D12 major amend):** Turborepo + **Bun workspaces** in the existing **`yesid.dev` repo** (umbrella — no new repo created; amended from "yesido-platform umbrella" on 2026-04-24 per owner directive). `apps/web` (SvelteKit → Vercel, current yesid.dev root contents `git mv` here) + `apps/cms` (Directus config → Railway, subtree-imported from yesid.dev-cms) + `packages/shared` (types + Zod schemas). Single clone; independent deploys; workspace-level dependency management via root `package.json` `"workspaces": ["packages/*"]` field (apps NOT workspace packages — app independence convention, amended from "strict boundary + CI check" on 2026-04-24); `bun install` + `bun.lock` at repo root. Turborepo remains package-manager-agnostic. yesid.dev-cms repo archived post-cutover (history preserved inside `apps/cms/`).

### 3.4 MUSTs locked

All F1–F24 (foundations) + all J1–J12 (polish) + all K1–K6 (close) + per-collection 18-item checklist (Section 8). No deferrals.

---

## 4. Architecture end state

### 4.1 Repo structure (at 18k close)

```
yesid.dev/                                # repo root (existing repo; umbrella)
├── docs/                                 # slice bundles + specs + research STAY at repo root (cross-app planning)
│   ├── slices/slice-18/
│   │   ├── plan.md
│   │   └── 18{a..l}-<name>/              # per-sub-slice bundles (research.md + decisions.md each)
│   ├── superpowers/
│   │   ├── specs/                        # design specs (this file)
│   │   └── research/                     # research audits
│   └── project/                          # CONSTITUTION, BRAND, CSS, MOTION, PATTERNS, STACK, BINDINGS
├── CLAUDE.md · AGENTS.md                 # tool bindings at repo root
├── apps/
│   ├── web/                              # SvelteKit consumer → Vercel (current yesid.dev root moved here)
│   │   ├── src/
│   │   │   ├── lib/adapters/             # DirectusAdapter + hybrid index + types
│   │   │   ├── lib/components/blog/
│   │   │   │   └── BlockRenderer.svelte  # Block Editor JSON renderer
│   │   │   ├── lib/directus/
│   │   │   │   ├── assets.ts             # asset(id, preset?) + buildSrcSet
│   │   │   │   └── visualEditing.ts      # sessionStorage-gated setAttr (post-18 routes)
│   │   │   ├── routes/
│   │   │   │   ├── +layout.server.ts     # fetchSiteData (nav + meta once)
│   │   │   │   └── api/revalidate/+server.ts  # validates VERCEL_BYPASS_TOKEN; triggers ISR invalidation
│   │   │   └── ...                       # all current routes + components
│   │   ├── docs/ops/
│   │   │   └── rollback.md               # web-specific ops runbook
│   │   ├── brand/                        # brand assets + export scripts (folded in from current yesid.dev/brand/)
│   │   ├── static/ · tests/ · scripts/
│   │   ├── package.json · tsconfig.json · svelte.config.js · vite.config.ts
│   │   └── vercel.json
│   └── cms/                              # Directus config → Railway (subtree-imported from yesid.dev-cms)
│       ├── directus/                     # directus-sync per-resource files
│       │   ├── collections/*.json        # one file per user collection
│       │   ├── roles.json
│       │   ├── policies.json
│       │   ├── permissions.json
│       │   ├── flows.json
│       │   ├── operations.json
│       │   ├── presets.json
│       │   ├── dashboards.json
│       │   ├── panels.json
│       │   └── settings.json             # mcp_prompt + storage presets + ai provider
│       ├── fixtures/
│       │   ├── collections/*.json        # one file per content type's seed data
│       │   ├── singletons/*.json
│       │   ├── folders.json
│       │   ├── assets-manifest.json
│       │   └── assets-id-map.json        # emitted after first migrate-assets run
│       ├── scripts/
│       │   ├── lib/                      # sdk · auth · chunk · catch · logger · read-fixture · bottleneck · loaders
│       │   ├── seed-<collection>.ts      # one per content type
│       │   ├── seed-presets.ts
│       │   ├── seed-permissions.ts
│       │   ├── migrate-assets.ts
│       │   ├── migrate-markdown-to-blocks.ts  # one-shot; blog + tech-stack
│       │   ├── generate-types.ts         # emits packages/shared/types/directus-schema.ts
│       │   └── scaffold-port.ts          # generates port boilerplate
│       ├── tests/
│       │   ├── snapshot-shape.test.ts    # enforces 18-item checklist per collection
│       │   ├── fixture-<collection>.test.ts
│       │   ├── seed-<collection>-dry-run.test.ts
│       │   ├── mcp-policy-shape.test.ts  # ai-editor permission audit
│       │   └── lib/                      # scripts/lib/ unit tests
│       ├── Dockerfile                    # FROM directus:11.17.3 + directus-sync extension
│       ├── railway.json                  # build context + deploy config
│       ├── .env.example
│       └── package.json
├── packages/
│   └── shared/                           # cross-app types + schemas
│       ├── types/
│       │   ├── directus-schema.ts        # codegen from live CMS
│       │   ├── content.ts                # LocalizedString, Service, Project, etc.
│       │   └── index.ts
│       ├── schemas/                      # Zod schemas
│       └── package.json                  # type-only; Zod only runtime dep
├── .github/workflows/
│   ├── web.yml                           # apps/web CI (test + check + preview)
│   ├── cms.yml                           # apps/cms CI (bun test + schema-apply smoke + prod-gated apply)
│   ├── contract-test.yml                 # intra-repo integration (ephemeral Directus + web integration tests)
│   └── secret-scan.yml                   # gitleaks both apps
├── turbo.json                            # task graph + caching
├── package.json                          # root devDeps (turbo, typescript); "workspaces": ["apps/*", "packages/*"]
├── .bun-version                          # pin Bun 1.3.x for CI + local parity
├── bun.lock                              # Bun lockfile (replaces pnpm-lock.yaml)
├── .gitignore
└── README.md                             # umbrella README
```

### 4.2 yesid.dev-cms (Directus 11.17.3 on Railway)

- **Schema authoring:** directus-sync per-collection JSON files in `apps/cms/directus/`. Reviewable Git diffs replace the monolithic snapshot.yaml.
- **Content types (6):** services · projects · blog_posts (Block Editor body) · tech_stack + tech_relations + stack_scenarios · site_meta + route_seo · pages + M2A blocks (12 block_* collections) + singletons (nav_links · menu_items · error_pages · languages).
- **Per-collection config:** 18-item checklist enforced by `tests/snapshot-shape.test.ts` (see Section 8).
- **Versioning:** Global Draft on every user collection + block collection. `REVISIONS_RETENTION=90d`.
- **Files:** 6 folders (services/projects/blog/brand/about/og); 4 presets (+ AVIF if P8 green); `STORAGE_ASSET_TRANSFORM=presets` locked.
- **Access:** 4 roles × 9 capability policies. ai-editor: delete:false + write-drafts only. MCP global delete protection ON. 2FA on admin + human-editor. Conservative instance-wide rate limits.
- **Editor UX:** Insights "Content Ops" dashboard · item comments + notifications · "My drafts" bookmarks per role · AI Assistant (Anthropic with tool-search from v11.17.1) · 3 quick-action Flows.
- **Realtime:** `WEBSOCKETS_ENABLED=true` + `WEBSOCKETS_COLLAB_ENABLED=true`.
- **Revalidation:** Flow Event Hook on all content collections → Webhook op → `apps/web/api/revalidate?site=all`.
- **Ops:** Neon PITR for backups; disaster recovery in `apps/cms/docs/ops/`.

### 4.3 yesid.dev (SvelteKit on Vercel)

- **DirectusAdapter:** all 6 ports on Directus · `p-queue` + fetch-retry wrapping SDK client · `parsePort` Zod symmetry at adapter boundary · `PreviewContext` optional param threaded through every port method.
- **Named ContentPort interfaces** (no `typeof import(...)` bindings) in `packages/shared/types/content.ts`.
- **BlockRenderer.svelte** handles all Block Editor JSON block types.
- **Asset helper:** `apps/web/src/lib/directus/assets.ts`.
- **Layout-level `+layout.server.ts` fetchSiteData** — nav + meta loaded once.
- **Full-site revalidate endpoint** validates `VERCEL_BYPASS_TOKEN`.
- **Shares-adapter surface** (prepares for post-18 preview routes).
- **Tests:** contract + integration + mocked-fetch per port. Cross-repo contract CI mirrored in both repos (now intra-repo workflow).
- **Static modules deleted** in 18k.

### 4.4 packages/shared

- Zero runtime deps except Zod.
- `directus-schema.ts` generated from live CMS by `apps/cms/scripts/generate-types.ts`; committed.
- Named domain interfaces (LocalizedString, Service, Project, BlogPost, TechStackItem, HeroContent, etc.) + Zod schemas.
- Imported by both `apps/web` (adapter) and `apps/cms` (seed scripts). TS compile-time enforcement replaces runtime drift check.

---

## 5. Sub-slice decomposition

| ID | Scope | Status | Effort |
|---|---|---|---|
| **18a** | Infra + services proof (Tasks 0–7) | ✅ closed | shipped |
| **18b** | Decoupling + test split (Task 8 + research 2b) | ✅ closed | shipped |
| **18c** | **Foundations + services retrofit + monorepo pivot** | ⏸ planned | 3–4 sessions |
| **18d** | Asset pipeline (static/images/* → Directus + R2 + presets + AVIF probe) | ⏸ planned | 1 session |
| **18e** | Projects content type (+ M2M to services replacing CSV) | ⏸ planned | 1–1.5 sessions |
| **18f** | Blog content type + Block Editor + BlockRenderer.svelte + markdown-to-blocks migration | ⏸ planned | 1.5–2 sessions |
| **18g** | Tech-stack + tech_relations + stack_scenarios (Block Editor body; reuses BlockRenderer + migration script) | ⏸ planned | 1 session |
| **18h** | Meta + route SEO (singleton + route_seo collection + og_image) | ⏸ planned | 0.5 session |
| **18i** | Pages + M2A blocks (12 block collections + nav/menu/error singletons) | ⏸ planned | 2–3 sessions |
| **18j** | Polish (Insights · comments · AI Assistant · Flows · role-policy tighten) | ⏸ planned | 1 session |
| **18l** | **CMS brand styling** — Data Studio theme (logo · favicon · colors · typography via directus-sync themes/settings) | ⏸ planned | 0.5 session |
| **18k** | Close (Codex review · delete static modules · template extraction plan · memories + PR) | ⏸ planned | 1 session |

Dependency graph:

```
18c (foundations + monorepo pivot + services retrofit)
   └─► 18d (assets + AVIF probe) ──► 18e (projects) ─┐
                                     18f (blog + BlockRenderer) ──┤
                                     18g (tech-stack; reuses BlockRenderer + migration script) ──┤ parallelizable
                                     18h (meta + route_seo) ──────┘
                                                                   └──► 18i (pages + M2A) ──► 18j (polish) ──► 18l (CMS brand) ──► 18k (close)
```

18e/18f/18g/18h can run in any order after 18d. 18i depends on all content ports being adapter-flipped. 18l depends on 18d (for logo upload path) and runs after 18j polish.

---

## 6. 18c detailed scope (foundations + services retrofit + monorepo pivot)

**Largest sub-slice; 3–4 sessions; single PR on `feature/18c-foundations` branch merged into `feature/slice-18`.**

### 6.1 Phase 0 — Probes (before any code change)

Output committed to `apps/web/docs/slices/slice-18/18c-foundations/research.md`.

P1 Global Draft × Group interfaces · P2 `/shares` endpoint · P3 Block Editor JSON shape · P4 directus-sync on Railway · P5 MCP system prompt scope · P6 Turborepo + Vercel monorepo deploy · P7 Railway monorepo deploy + directus-sync Dockerfile · P9 **Bun workspace** + `@repo/shared` resolution in SvelteKit + Bun (amended from pnpm 2026-04-24). (See Section 10 for full probe specs.)

### 6.2 Phase 1 — Monorepo consolidation (amended 2026-04-24: yesid.dev IS the umbrella)

1. Pre-flight checks: Bun ≥1.3, Node ≥22, clean working tree on `feature/slice-18`.
2. `git mv` current yesid.dev root contents → `apps/web/`. Keeps at repo root: `docs/`, `.github/`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `.gitignore` (plus new monorepo files added in step 5). No new GitHub repo; no subtree import of yesid.dev (it IS the repo).
3. `git subtree add --prefix apps/cms https://github.com/mgkdante/yesid.dev-cms.git main` — preserves yesid.dev-cms history inside apps/cms.
4. Create `packages/shared/`: move `apps/web/src/lib/types.ts` content → `packages/shared/src/types/content.ts`; both apps import `@repo/shared`.
5. Root `package.json` with `"workspaces": ["packages/*"]` (apps NOT workspace packages — app independence convention) + `turbo.json` + `.bun-version` + updated `.gitignore`; `bun install` creates root `bun.lock`.
6. Rewrite CI workflows under `.github/workflows/`: `web.yml` · `cms.yml` · `contract-test.yml` (intra-repo — both apps in same repo now) · `secret-scan.yml`. No cross-repo mirror workflows needed.
7. **Existing** Vercel project (yesid.dev) → Settings → change Root Directory to `apps/web` + build command `turbo run build --filter=./apps/web`. Env vars unchanged.
8. **Existing** Railway service → Settings → Source → switch repo from `yesid.dev-cms` to `yesid.dev`; set Root Directory=`apps/cms`; switch from image-pull to Dockerfile-build (`apps/cms/Dockerfile` with directus-sync); Watch Paths=`/apps/cms/**`.
9. Smoke both deploys on `feature/slice-18` branch before cutover.
10. Archive `yesid.dev-cms` repo on GitHub (history preserved in `apps/cms/`). yesid.dev stays live + active. Update memory `project_slice_18.md` paths.

### 6.3 Phase 2 — CMS app foundations

(F1) Fix `snapshot.yaml:40` Unicode corruption (converted to directus-sync collection file during migration).
(directus-sync adoption) Install extension via `apps/cms/Dockerfile` + `EXTENSIONS_PATH=./extensions`. Migrate snapshot.yaml → directus-sync per-resource files.
(F10) Restructure `fixtures/` → `fixtures/collections/*.json` + `fixtures/singletons/*.json` + `fixtures/folders.json` + `fixtures/permissions.json`.
(F11) Fixture drift detector — `tests/fixture-drift.test.ts` compares services.json against `apps/web/src/lib/content/services.ts` (retires in 18k when static modules deleted).
(F7) `scripts/lib/` shared helpers: `sdk.ts` · `auth.ts` · `chunk-array.ts` · `catch-error.ts` (DirectusError — F8) · `logger.ts` · `read-fixture.ts` · `bottleneck.ts`.
(F9) Refactor `seed-services.ts` to use `scripts/lib/loaders.ts` skeleton-records-then-full-data pattern. Keep nuke mode behind `--reset`; `--dry-run` everywhere.
(F12) `scripts/generate-types.ts` — reads /fields + /collections via admin token, emits `packages/shared/types/directus-schema.ts`. CI `git diff --exit-code` check.
(F14) MCP system prompt — 250–400 word role-scoped prompt via `directus/settings.json`. Includes "prefer setting focal_point on hero images" per Q8.
(F15) MCP global delete protection ON + ai-editor policy `delete: false` on every content collection (seeded via `directus/permissions.json`).
(F16/F17/F18) Env vars: `STORAGE_ASSET_TRANSFORM=presets` · `WEBSOCKETS_ENABLED=true` · `WEBSOCKETS_COLLAB_ENABLED=true` · `REVISIONS_RETENTION=90d` · conservative `RATE_LIMITER_*`.
(F19) `contract-test.yml` accepts `ref` input on `workflow_dispatch`; PR-fired job uses `github.head_ref`.
(F22) CSP `FRAME_SRC='self' https://yesid.dev https://*.vercel.app` + `.env.example` entry.
(CI polish) Docker image caching (saves ~30s/run) · gitleaks opt-in on PRs.
(F21 cms-side docs) `apps/cms/README.md` Operations section refresh.

### 6.4 Phase 3 — Web app foundations

(F13 consumer) `p-queue` + fetchRetry wrapping `createDirectus(...).globals.fetch`. `{intervalCap: 10, interval: 500}` + 429-aware retry.
(F3) `parsePort` symmetry — route Directus responses through same Zod gate static uses. Import `ServiceSchema` etc. from `@repo/shared/schemas`.
(F4) Named ContentPort interfaces — extract from `typeof import(...)` bindings into `packages/shared/types/content.ts`.
(F5) `PreviewContext` param — add `ctx?: PreviewContext` to every ContentPort method. Static ignores; Directus branches on `ctx?.shareToken`.
(F6) Refactor `setup.data.ts` mock scope — target `./index`, not `./directus`. Kills `vi.importActual` pattern propagation.
(F23) Mocked-fetch contract test template — one test per port asserting `readItems` call shape. Template consumed by `scripts/scaffold-port.ts`.
(F2) Adjacency retrofit — per-request WeakMap memo + minimal-field fetch for `services.adjacent` (template for projects/blog/tech-stack).
(Asset helper) `apps/web/src/lib/directus/assets.ts` — `asset(id, preset?)` + `buildSrcSet` + typed preset union from `packages/shared/types/assets.ts`.
(F22 web) `.env.example` CSP doc.

### 6.5 Phase 4 — Services retrofit (F24)

Apply F1–F23 retroactively to live services port. Behavior unchanged; patterns align.

- Web: services port uses p-queue + parsePort + PreviewContext + memoized adjacency. ContentPort types renamed. Tests updated.
- CMS: services collection — Global Draft enabled (if P1 green) · display_template polished · archive field added · ai-editor policy tightened · fixture moved to `fixtures/collections/services.json` · seed-services.ts refactored onto `scripts/lib/` + upsert pattern.
- Services fields with rich content (sections.content, longDescription, valueProposition where rich) evaluated for Block Editor (D15) — convert if appropriate; keep Textarea where mid-length.
- Verification: `/services/[id]` live behavior unchanged · contract + integration + mocked-fetch tests green · `bun test` green both apps · visual smoke on `/services/*`.

### 6.6 Phase 5 — Docs + ceremony

(F21) `CONVENTIONS.md` at `apps/web/docs/slices/slice-18/CONVENTIONS.md` (contents per Section 8).
(F21) `docs/ops/rollback.md` — schema revert · seed re-run · Neon PITR recipe (Q11) · port flip revert.
(F21) `scripts/scaffold-port.ts` — generates stub `directus.<collection>.ts` + `<collection>.contract.test.ts` + `fixtures/collections/<collection>.json` skeleton + permissions row from a port name argument.
(D-amendments) Spec.md updates per Section 9 committed.

### 6.7 18c acceptance

- [ ] All 9 probes (P1–P9) documented in 18c research.md with findings.
- [ ] Monorepo consolidated; Vercel + Railway deploys green from new build roots; smoke tests pass.
- [ ] directus-sync operational; `directus/**.json` committed; CI green.
- [ ] D-entry amendments (Section 9) committed to slice-level spec.md.
- [ ] Services retrofit: live site unchanged; 3 test boundaries green.
- [ ] CONVENTIONS.md + rollback.md + scaffold-port.ts committed.
- [ ] `packages/shared` type-only; zero runtime deps beyond Zod; TS + Zod imports resolve in both apps.
- [ ] Codegen `directus-schema.ts` in `packages/shared/types/` committed; CI drift check green.
- [ ] `bun test` green in both apps; `bun run check` 0 errors on web.
- [ ] Neon PITR verified accessible (Q11) + documented.

---

## 7. 18d–18k sub-slice sketches

### 7.1 18d — Asset pipeline

**CMS-app-only.** 1 session.

- Migrate `apps/web/static/images/*` → Directus + R2 via `migrate-assets.ts` rewritten on `scripts/lib/`.
- 6 folders (services/projects/blog/brand/about/og).
- 4 saved presets via `seed-presets.ts` (+ AVIF if P8 green).
- `legacy_path` custom field on `directus_files` (via directus-sync; more durable than description-tag idempotency).
- AVIF live-probe (Q10 resolution).
- Emit `fixtures/assets-id-map.json` for 18e–18i consumption.

**Acceptance:** all assets uploaded; `curl cms.yesid.dev/assets/<id>?key=hero-1200` returns WebP 1200-wide; AVIF probe result documented; `assets-id-map.json` committed; 4 (or 5) presets visible in Data Studio; Public policy grants files.read folder-scoped per D10.

### 7.2 18e — Projects

**First canonical pattern-replay.** 1–1.5 sessions.

- **Schema:** `projects` (id · slug · date_published · status · sort · hero_image M2O → directus_files) · `projects_translations` (language_code · title · one_liner · description · sections · impact_metric_label) · `projects_services` M2M junction (**replaces `services.related_projects` CSV**).
- Archive config: status field; archive_field/archive_value/unarchive_value.
- Fixture: `fixtures/collections/projects.json` exported from `apps/web/src/lib/content/projects.ts`.
- Consumer: `directus.projects.ts` port (all 8 methods incl. graph utilities). Hero image via 18d's `asset()` helper. `services.related_projects` adapter logic reads through the M2M junction.
- Scaffold-port.ts used to generate boilerplate.

**Acceptance:** `/projects` + `/projects/[slug]` render from Directus; `services.related_projects` resolves via M2M junction; contract + integration + mocked-fetch tests green; SSR HTML unchanged from pre-flip.

### 7.3 18f — Blog (Block Editor adoption)

**New Svelte renderer required.** 1.5–2 sessions.

- **Schema:** `blog_posts` (id · slug · status · date_published · lang · body **[Block Editor]** · cover_image M2O · svg_illustration M2O · animation_reverse M2O · sort: date_published DESC) · `blog_posts_translations` (language_code · title · excerpt).
- Block Editor per D15 (Q1 supersedes spec Q7 Markdown).
- **New consumer component:** `apps/web/src/lib/components/blog/BlockRenderer.svelte` consumes Block Editor JSON. Block-type dispatch to per-type sub-components (heading · paragraph · image · code · list · embed · quote · divider). Block Editor JSON types in `packages/shared/types/block-editor.ts`.
- **Migration:** `scripts/migrate-markdown-to-blocks.ts` (reusable; consumed by 18g too). Reads `apps/web/src/content/blog/*.md` via `marked` AST; maps tokens to block types; writes via SDK.
- Consumer: `directus.blog.ts` port (12 methods). `html`/`svgContent`/`svgContentsForPosts`/`resolveSvgFallbackName`/`resolveAnimation` updated to use asset helper.

**Acceptance:** `/blog` + `/blog/[slug]` render from Directus with Block Editor body · Markdown-to-blocks migration verified (spot-check 3 posts) · SSR + visual parity vs pre-flip · blog SVG illustrations resolve via asset helper · tests green.

### 7.4 18g — Tech-stack (graph)

1 session. Reuses `BlockRenderer.svelte` + `migrate-markdown-to-blocks.ts`.

- **Schema:** `tech_stack` (id · slug · category · status · sort · body **[Block Editor]** — per D15 not Markdown) · `tech_stack_translations` (language_code · title) · `tech_relations` (id · from_tech M2O · to_tech M2O · connects_to_label · connection_notes — self-M2M with context) · `stack_scenarios` (id · slug · title · summary) · `stack_scenarios_translations` (language_code · summary).
- Migration: `src/content/stack/{id}.md` → Block Editor via reused migration script.
- Consumer: `directus.techStack.ts` port (12 methods incl. graph utilities). `content(id)` returns Block Editor JSON (not raw Markdown).

**Acceptance:** `/tech-stack` + `/tech-stack/[id]` render with items + relations + scenarios · graph utilities return correct adjacency · BlockRenderer renders bodies · tests green.

### 7.5 18h — Meta + route_seo

0.5 session. Smallest.

- **Schema:** `site_meta` singleton (brand name · owner · tagline · description · social links array) · `site_meta_translations` (language_code · tagline · description · owner_jobTitle) · `route_seo` collection (route_id UNIQUE · visibility · og_image M2O) · `route_seo_translations` (language_code · title · description · og_image_alt).
- Closed registry contract: `meta.forRoute` throws on unknown route_id.
- Layout-level `fetchSiteData` in `+layout.server.ts` — nav + site_meta loaded once.
- Consumer: `directus.meta.ts` port (2 methods).

**Acceptance:** every route's `<head>` SEO sourced from Directus · `meta.forRoute('/unknown')` throws · layout-level fetch visible in Network tab (one call, not 6) · tests green.

### 7.6 18i — Pages + M2A blocks

**Largest sub-slice.** 2–3 sessions.

- **Schema:**
  - `pages` (id · slug [home · about · contact · services · projects · tech-stack · blog] · title · sort)
  - `pages_blocks` M2A junction (auto-generated)
  - **12 block collections:** block_hero · block_manifesto · block_proof_reel · block_services_grid · block_cta · block_closer · block_about_content · block_contact_content · block_tech_stack_page_content · block_blog_page_content · block_projects_page_content · block_journey_panel. Each has translations junction.
  - Block collections with prose body fields use **Block Editor** per D15.
  - Singletons outside M2A: nav_links · menu_items · error_pages · languages.
- Versioning caveat: P1 probe informs Group-interface handling.
- Per-page block copies (D7).
- Adapter: per-request memoized `loadPage(slug)` helper fetches full M2A tree in one query; each `content` port method picks from memoized Map. Every block carries `id: string` for future Visual Editing `setAttr`.
- Consumer components: `apps/web/+page.svelte` files unchanged thanks to ContentPort preserving shape.

**Acceptance:** `/`, `/about`, `/contact`, `/services`, `/projects`, `/tech-stack`, `/blog` all render from Directus-M2A · all 12 block types hydrate · nav + menu + error_pages work · `bun run test` green including 19 `content.*` port methods.

### 7.7a 18l — CMS brand styling (added 2026-04-24)

0.5 session. Runs between 18j (polish) and 18k (close). Uses directus-sync authoring (D11) + 18d asset pipeline (logo upload).

- **Artifacts:**
  - Logo + favicon uploaded via `apps/cms/fixtures/brand/` → 18d migrate-assets flow.
  - `apps/cms/directus/settings.json` — `project_name`, `project_logo`, `public_background`, `public_note`, `default_theme_light`, `default_theme_dark`.
  - `apps/cms/directus/themes/yesid-light.json` + `apps/cms/directus/themes/yesid-dark.json` — custom Directus 11.17 theme JSON matching yesid.dev accent colors + Inter + JetBrains Mono typography (where Theme API permits).
  - Optional `apps/cms/directus/flows/brand-welcome.json` for editor login-page prompts.

- **Acceptance:**
  - [ ] `cms.yesid.dev` login page renders with yesid.dev logo + brand accent.
  - [ ] Data Studio sidebar + primary buttons use yesid.dev accent.
  - [ ] Typography matches where Theme API permits font-family override.
  - [ ] Light + dark themes shipped; default follows user system preference.
  - [ ] All styling authored via directus-sync (no custom extension); JSON-only; re-deployable.

- **Dependencies:** 18d (logo upload) · 18j (polish base complete).

---

### 7.7 18j — Polish

Pure polish, no foundations. 1 session.

- J1 Insights "Content Ops" dashboard (5 panels) via `directus/dashboards.json`.
- J2 Item comments workflow — ai-editor policy grants create on `directus_comments`; MCP system prompt includes "after drafting, leave a comment `@yesid`."
- J3 Notifications + SMTP — Resend HTTPS API via Directus Flow webhook op (unblocks SMTP port-587 issue from 18a).
- J4 AI Assistant — Data Studio → Settings → AI → Anthropic with tool-search. Settings committed via `directus/settings.json`.
- J5 Quick-action Flows — "Publish + deploy" · "Regenerate SEO description" · "Publish translation when source ready." Manual triggers with `require_confirmation`.
- J6 Bookmarks presets per-role.
- J7 Full-site revalidation Flow (D8 amended per Q5).
- J8 ai-editor policy tightening — D10 final pass; `tests/mcp-policy-shape.test.ts` (J11) audits.
- J9 CI Docker image caching.
- J10 `fetchSiteData` consumption pattern (already landed in 18h).
- J11 `tests/mcp-policy-shape.test.ts`.
- J12 Visual-editing sessionStorage gate — update D4 wording; implementation post-Slice-18.
- SSO/OIDC NICE → SHOULD (Q4); flag for post-Slice-18 if second editor joins.

### 7.8 18k — Close

Ceremony + cleanup. 1 session.

- K1 Codex adversarial peer review.
- K2 Delete static modules — `apps/web/src/lib/content/*.ts` + `apps/web/src/content/*.md` all gone. `packages/shared/types/content.ts` (named-interface extract) stays. Retires `fixture-drift.test.ts`.
- K3 folded into 18c (directus-sync + `directus/permissions.json` already replaces contract-test shell loop).
- K4 Template extraction plan — write `apps/web/docs/superpowers/specs/2026-04-24-template-extraction.md`. Actual extraction post-Slice-18.
- K5 Memory + PR + Vercel retire — update `project_slice_18.md` · add `project_completed_slices.md` row · open `feature/slice-18` PR on yesid.dev against `main` · merge after Codex review · retire old yesid-dev-cms Vercel project after 7-day DNS cooling.
- K6 Gitleaks CI job with allowlist for known CI creds.

---

## 8. Cross-cutting conventions (CONVENTIONS.md)

Committed to `apps/web/docs/slices/slice-18/CONVENTIONS.md` during 18c. Contents:

### 8.0 App independence — convention (leading section, amended 2026-04-24: "strict boundary + CI check" → "convention + code review")

> `apps/web` and `apps/cms` are separate concerns inside the monorepo. The ONLY cross-app coupling is: (1) `ContentAdapter` TS interface (apps/web/src/lib/adapters/types.ts), (2) directus-sync schema (apps/cms/directus/**.json), (3) shared types via `@repo/shared` workspace package.
>
> **Enforcement is by convention + natural separation, not dedicated CI:** apps are NOT workspace packages (only `packages/*` is), so cross-app imports require relative paths (`../cms/...`) that are ugly and catch in code review. No dedicated import-graph check maintained; YAGNI.
>
> Workflow: work in one app at a time except for intentional cross-app refactors. For schema changes: CMS change → smoke CI → web adoption, all within a single PR scoped to commits.

### 8.1 Field naming

- Directus-side: `snake_case`.
- Consumer-side: `camelCase` via adapter mapping (`toService(row)` etc.).
- Standard interfaces: Slug from `title` · Tags interface for tag arrays · File/Image M2O for images · Dropdown for `status` (draft/published/archived) · Integer hidden field for `sort`.

### 8.2 Per-collection 18-item checklist (enforced by snapshot-shape.test.ts)

For every user collection:

1. `meta.display_template`
2. `meta.icon`
3. `meta.note` (human + AI via MCP schema tool)
4. `meta.sort_field` (where ordered)
5. `meta.archive_field: "status"` + `archive_value: "archived"` + `unarchive_value: "draft"`
6. `meta.item_duplication_fields` (explicit list; exclude `status`, `date_published`)
7. `meta.preview_url` template (post-18 routes shape locked now)
8. `meta.versioning: true` + Global Draft enabled
9. `meta.accountability: "all"`
10. Translations junction (via Translation Generator wizard)
11. Field grouping / native Tabs for forms > 6 fields
12. Field widths (half/full pairs)
13. `meta.note` on every business field
14. `meta.required: true` on publish-required fields
15. `meta.conditions` for contextual visibility
16. `directus/presets.json` entry (default list view layout)
17. `directus/permissions.json` ai-editor row (read-all · create/update filtered `status _neq "published"` · delete:false)
18. `directus/permissions.json` comments row (ai-editor + human-editor read+create on `directus_comments`)

### 8.3 Permission patterns

9 capability policies composed onto admin / human-editor / ai-editor / Public roles. `scripts/scaffold-port.ts` auto-emits 4 permission rows per new collection.

### 8.4 Seed-script shape

```ts
#!/usr/bin/env bun
import { createClient, getAdminToken } from './lib/sdk';           // CMS-local helper
import { loadFixture } from './lib/read-fixture';
import { ServiceSchema } from '@repo/shared';                    // shared Zod schema
import { loadSkeletonRecords, loadFullData } from './lib/loaders';
import { parseErrors, DirectusError } from './lib/catch-error';
import { logger } from './lib/logger';
import type { Service } from '@repo/shared';                     // shared domain type
// ... pure transform helpers ...
export function to<Collection>Row(item: Service): <CollectionRow> { ... }
export async function seed<Collection>(items, opts) { ... }
if (import.meta.main) { main().catch(...) }
```

**Rule:** `@repo/shared` imports are **types + Zod schemas only**. Runtime helpers (SDK client construction, auth, logging, pagination) live in `apps/cms/scripts/lib/` — app-local, not cross-app. Same rule applies on the web side: adapter helpers live in `apps/web/src/lib/`, not in `packages/shared`.

Contract: upsert-by-id (not nuke) · `--dry-run` · `--reset` for full delete+recreate · skeleton-records-then-full-data for M2M circular FKs · idempotent · fixture-Zod-validated at load · pure helpers exported for unit tests.

### 8.5 Test-boundary taxonomy

**CMS app:**
- `tests/snapshot-shape.test.ts` — enforces 18-item checklist.
- `tests/fixture-<collection>.test.ts` — Zod validates fixture.
- `tests/seed-<collection>-dry-run.test.ts` — pure transform helpers.
- `tests/mcp-policy-shape.test.ts` — ai-editor permission audit (privilege-creep detection).
- `tests/fixture-drift.test.ts` — services fixture vs static module (retires in 18k).

**Web app:**
- `src/lib/adapters/directus.contract.test.ts` — structural + pure-mapping per port.
- `src/lib/adapters/directus.mocked.test.ts` — one mocked-fetch per port.
- `src/lib/adapters/directus.integration.test.ts` — env-gated live round-trip.

**Intra-repo:**
- `.github/workflows/contract-test.yml` — opt-in PR label + nightly cron.

### 8.6 Adapter port template

Every `directus.<collection>.ts` exports: typed row interface · pure `to<Collection>(row)` mapping · `fetch<Collection>s(filter?, ctx?)` with p-queue + parsePort · `const <collection>Port: <Collection>Port satisfies ContentPort` interface.

### 8.7 Rich-content field rule

| Field type | Rule | Example |
|---|---|---|
| **Input** | Single-line, ≤100 chars | title, slug, category, tag |
| **Textarea** | Single paragraph ≤500 chars, no rich formatting | excerpt, tagline, short description, alt text |
| **Block Editor** | Rich, multi-paragraph, may contain headings/code/images/lists/embeds | blog.body, tech_stack.body, sections.content, block_manifesto.body |

**Hard rule: no Markdown interface anywhere.** No `marked.parse` in consumer after 18i. Every rich field is Block Editor JSON rendered via `BlockRenderer.svelte`.

### 8.8 Translation conventions

- Every localized field on `<collection>_translations` junction, never parent.
- Junction: `language_code` M2O to `languages` + per-field columns.
- Adapter fetches with `fields: ['*', { translations: ['*'] }]`; flattens via `toLocalizedString(translations, field)` at boundary.
- Fallback: `en` → requested locale → empty string.

### 8.9 File + asset conventions

- Folders: services · projects · blog · brand · about · og.
- Legacy filenames preserved at migration; Directus assigns UUIDs.
- Alt text via `directus_files.description`; required field (validation rule).
- Focal points: default-center + MCP system prompt nudge (Q8).
- Presets: hero-1200 · card-600 · thumb-240 · og-1200 (+ AVIF if P8 green).
- **Never compose transform URLs manually in components** — always use `asset(id, preset?)` helper.

### 8.10 Flow conventions

- Event Hook Action for non-blocking (revalidation, notifications, publish side-effects).
- Event Hook Filter rarely (only pre-commit payload mutation).
- Manual trigger for editor-invoked quick actions.
- Schedule for content integrity checks + housekeeping.
- Webhook op body: `{ collection, keys, event }` minimum.
- Request URL failure path: `Throw Error` op with logged context.
- Flow logs ON in production.

### 8.11 Rollback procedures

`docs/ops/rollback.md` covers schema · seed · data loss · port flip scenarios (Section 6.5 Phase 5).

---

## 9. D-entry amendments (consolidated)

Applied to `apps/web/docs/slices/slice-18/spec.md` during 18c.

| D | Before | After | Source |
|---|---|---|---|
| D1 | Railway Hobby + BYO Neon | Unchanged | — |
| D2 | Cloudflare R2 via s3 driver | Unchanged | — |
| D3 | snapshot.yaml + apply | **directus-sync per-resource files** (`directus/collections/*.json` + roles/policies/permissions/flows/operations/presets/dashboards/panels/settings.json) | Q6 + Agent A § 1 |
| D4 | @directus/visual-editing v2 + conditional attr rendering | **+ sessionStorage gate from directus-labs/starters**; `apply()` once in `+layout.svelte` `afterNavigate` | Agent D consider #10 |
| D5 | Content Versioning on all user collections | **+ Global Draft (v11.16) enabled** + `REVISIONS_RETENTION=90d` env; P1 probe for Group-interface bug #26890 | Q2 + Agent A MUST |
| D6 | EDITOR_PREVIEW_TOKEN-based preview route | **/shares endpoint** with `PreviewContext = { shareToken, version? }`. Routes defer post-Slice-18. | Q3 + Agent C |
| D7 | M2A pages + per-page block copies | Unchanged (reaffirmed) + P1 probe informs block-collection versioning | — |
| D8 | Flow Event Hook → SvelteKit ISR bypass | **Full-site revalidation** (not per-URL); single `?site=all` invalidation endpoint | Q5 |
| D9 | /assets/:id?key= + 4 presets | **+ `STORAGE_ASSET_TRANSFORM=presets` locked** + `legacy_path` custom field (replaces description-tag marker) + AVIF variant if P8 green | Q10 + Agent A |
| D10 | Role/policy matrix with capability policies | **+ ai-editor delete:false explicitly** · **2FA enforced on admin + human-editor** · **SSO/OIDC upgraded NICE → SHOULD** (Q4) · conservative instance-wide `RATE_LIMITER_*` (Q12) | Q4, Q12 + Agent C |
| D11 | Zero custom Directus extensions | **Zero custom extensions EXCEPT directus-sync authoring tool** (Q6 amendment) | Q6 |
| D12 | Two-repo strict separation | **Turborepo monorepo in existing yesid.dev repo with two-app independence convention** (amended 2026-04-24: "strict boundary + CI check" → "convention + code review"; "yesido-platform umbrella repo" → "yesid.dev is the umbrella — git mv current root → apps/web; subtree import yesid.dev-cms → apps/cms"; apps NOT workspace packages; yesid.dev-cms archived post-cutover) | Monorepo pivot + 2026-04-24 amendments |
| **D13** (new) | — | **Turborepo + Bun workspaces** monorepo structure (amended from pnpm on 2026-04-24 post-P9 research; owner directive: project is Bun-first throughout + Bun 1.3 already installed + Vercel/Bun GA). Root `package.json` carries `"workspaces": ["apps/*", "packages/*"]`; `bun install` + `bun.lock`. Pnpm fallback held as ~1hr reversible (P9 escalation ladder). | Monorepo pivot + Bun amendment |
| **D14** (new) | — | **Shared types via `packages/shared`** (TS compile-time enforcement replaces runtime drift check) | Monorepo pivot + Q9 |
| **D15** (new) | — | **Block Editor for all rich content** (no Markdown interface; no `.md` in authoring path) | Q1 + ripple across content types |

Original spec Q5–Q7 supersession:
- Q5 (preview/draft) — shape locked in D6 Q3 amendment; implementation deferred.
- Q7 (Markdown for blog) — **superseded** by D15 + Q1 answer.
- Q8 (versioning on blocks) — absorbed into D5.
- Q9 (Flow revalidation timing) — absorbed into D8 + J7.
- Q10 (AVIF) — probe P8 in 18d; variant added to D9 if green.
- Q11 (versions policy) — absorbed into D10.
- Q12 (block reuse strategy) — D7 reaffirmed; per-page copies.

---

## 10. Probes (land in 18c research)

| # | Probe | Decision informed | How |
|---|---|---|---|
| **P1** | Global Draft v11.16 × Group interfaces (bug [directus/directus#26890](https://github.com/directus/directus/issues/26890)) | D5 rollout scope | Test collection with Group field in Data Studio → enable Global Draft → edit + promote → document status per collection type |
| **P2** | `/shares` endpoint — TTL, password, role inheritance, URL shape | D6 PreviewContext design | `POST /shares` with permutations; test anonymous vs authed reads |
| **P3** | Block Editor JSON output shape + block type catalog | D15 BlockRenderer.svelte design | Create test `blog_posts` row with rich content; inspect JSON; document block types + nesting + i18n |
| **P4** | directus-sync on Railway via custom Dockerfile | D11 amendment viability | Build `FROM directus:11.17.3 + COPY extensions/directus-sync` locally; push to Railway staging; verify extension loads + CLI works |
| **P5** | MCP `system-prompt` scope (per-role or instance-global) | F14 system prompt wording strategy | Call MCP tool with admin vs ai-editor token; compare |
| **P6** | Turborepo + Vercel monorepo deploy — `apps/web` build root + env scoping | D13 viability for web | Vercel project → Root Directory `apps/web`; test preview; verify env isolation |
| **P7** | Railway monorepo deploy — `apps/cms/Dockerfile` + directus-sync extension load | D13 + D11 viability | Railway service → Build Command + Dockerfile Path `apps/cms/Dockerfile`; deploy; smoke `/schema/apply` |
| **P8** | AVIF support — `?format=avif` returns AVIF or 400? | Q10 preset strategy | Curl during 18d; if AVIF works, add AVIF preset variant |
| **P9** | **Bun workspace** + `@repo/shared` import graph in SvelteKit + Bun runtimes (amended from pnpm 2026-04-24) | D13 + D14 workability | Test import in `apps/web` from `packages/shared`; verify `svelte-check` + `vitest` + `bun run build` + deployed bundle all resolve |

All probes output to `apps/web/docs/slices/slice-18/18c-foundations/research.md` with findings + decisions.

---

## 11. Risks + mitigations

| # | Risk | Likelihood × Impact | Mitigation |
|---|---|---|---|
| R1 | Monorepo consolidation breaks live services production | Medium × High | `feature/monorepo-pivot` branch; keep `main` deployable; ephemeral CI green before cutover |
| R2 | Turborepo caching invalidates too much | Medium × Low | remoteCache via Vercel after pivot |
| R3 | `packages/shared` accumulates runtime deps | Low × Medium | D14 constraint: type-only + Zod; CI check `apps/web/bun.lockb` doesn't pull Directus SDK through shared |
| R4 | directus-sync on Railway fails | Medium × High | P4 probe resolves before 18c commits; fallback: stay on snapshot.yaml (revert D11) |
| R5 | Markdown → Block Editor migration loses formatting | Medium × Medium | AST-based migration via `marked` parser; visual diff before/after via preview_url; spot-check 3 posts per content type |
| R6 | Full-site revalidation over-invalidates | Medium × Low | Accept for yesid.dev's low-write-volume profile; revert to per-URL if cost issue |
| R7 | Share token semantics surprise | Medium × Medium | P2 probe resolves before 18c locks adapter shape; implementation defers to post-18; if wrong, pivot to signed URL + EDITOR_PREVIEW_TOKEN post-18 |
| R8 | Services retrofit regresses live production | Medium × High | 3-boundary test split + feature branch + ephemeral smoke + human verify; hybrid adapter makes rollback a single-line revert |
| R9 | Monorepo loses paired-PR discipline | Low × Medium | CONVENTIONS.md rule: scoped commits per app in every 18d–18i PR; review rigor maintained via commit atomicity |
| R10 | Codex review at 18k surfaces design flaws too late | Low × High | Invite Codex review at end of 18c as mid-slice checkpoint; course-correct before 18d starts copying patterns |
| R11 | Template extraction post-18 hits generalization surprises | Medium × Low | K4 writes extraction plan during 18k with placeholders + CI shape; surprises land in post-slice |
| R12 | Bun workspace + SvelteKit/Vercel edge case | Low × Medium | P9 research shows canonical pattern; in-situ verify at Task 14; fallback to pnpm workspaces is ~1hr reverse pivot (P9 escalation ladder) |

---

## 12. Timeline estimate

| Sub-slice | Sessions | Notes |
|---|---:|---|
| 18c | 3–4 | Absorbs consolidation + probes + all F-items + services retrofit |
| 18d | 1 | Pattern-replay; seed script work |
| 18e | 1–1.5 | First canonical content type |
| 18f | 1.5–2 | Block Editor + BlockRenderer.svelte + markdown migration |
| 18g | 1 | Reuses BlockRenderer + migration script |
| 18h | 0.5 | Smallest |
| 18i | 2–3 | M2A novel; largest content-type sub-slice |
| 18j | 1 | Pure polish |
| 18l | 0.5 | CMS brand styling (added 2026-04-24) |
| 18k | 1 | Ceremony |
| **Total remaining** | **12.5–15.5 sessions** | — |

---

## 13. Final acceptance gates

When Slice 18 closes at 18k, ALL must be green (no waivers):

### Code + infrastructure

- [ ] `apps/web` deploys to Vercel from `apps/web` root; preview URLs work on PRs.
- [ ] `apps/cms` deploys to Railway from `apps/cms/Dockerfile`; directus-sync extension loads; `cms.yesid.dev/server/health` returns 200.
- [ ] All 6 content ports flipped to Directus — services (retrofitted) · projects · blog · tech-stack · meta · content (M2A pages).
- [ ] Static modules deleted — no `.ts` content · no `.md` content · no `marked.parse` in consumer bundle.
- [ ] `BlockRenderer.svelte` handles all Block Editor JSON block types encountered in seed data.
- [ ] directus-sync schema in `apps/cms/directus/**.json` covers all user collections; each passes 18-item checklist.
- [ ] `packages/shared/types/directus-schema.ts` committed + matches live CMS (CI drift check green).

### Tests + CI

- [ ] V1–V13 checks (Section 4.4) pass.
- [ ] `bun run test` + `bun run check` green in both apps.
- [ ] `tests/snapshot-shape.test.ts` covers all user collections.
- [ ] `tests/mcp-policy-shape.test.ts` asserts ai-editor permission matrix.
- [ ] `contract-test.yml` green on last run.
- [ ] `secret-scan.yml` gitleaks green on both apps.

### Editor UX + AI

- [ ] MCP `yesid-cms-prod` connected with 250–400 word role-scoped system prompt + global delete protection ON.
- [ ] AI Assistant (Anthropic with tool-search) configured in Data Studio.
- [ ] Insights "Content Ops" dashboard visible with 5 panels.
- [ ] Item comments + notifications workflow live.
- [ ] Quick-action Flows visible.
- [ ] Collaborative editing enabled and verified.
- [ ] 2FA enabled on admin user.

### Ops + security

- [ ] CSP `FRAME_SRC` configured.
- [ ] `STORAGE_ASSET_TRANSFORM=presets` locked.
- [ ] `REVISIONS_RETENTION=90d` set.
- [ ] Conservative `RATE_LIMITER_*` set.
- [ ] Neon PITR verified accessible + documented.
- [ ] Shared tokens rotation policy documented.

### Docs + process

- [ ] CONVENTIONS.md + docs/ops/rollback.md + scripts/scaffold-port.ts + per-sub-slice bundles committed.
- [ ] `docs/superpowers/specs/2026-04-24-template-extraction.md` committed (K4).
- [ ] Codex adversarial peer review complete; CRITICAL + HIGH addressed.
- [ ] Memory `project_slice_18.md` updated to shipped state.
- [ ] `project_completed_slices.md` row added post-merge.

### Live smoke

- [ ] `/`, `/services/*`, `/projects/*`, `/blog/*`, `/tech-stack/*`, `/about`, `/contact` render from Directus with no SSR errors.
- [ ] Lighthouse perf score ≥ 90 on `/`.
- [ ] Visual parity vs pre-migration spot-checked on 5 random routes.

---

## 14. References

### Internal

- **Audit:** [`../research/2026-04-24-slice-18-replan-audit.md`](../research/2026-04-24-slice-18-replan-audit.md) — 4 parallel research agents (Feature Audit · Adversarial Review · Editor UX + MCP · Mature Patterns).
- **Existing slice bundle:** `docs/slices/slice-18/{plan,spec,research,handoff}.md` — amended during 18c.
- **Task 2b findings:** `docs/slices/slice-18/research.md § Task 2b findings (2026-04-23)` — D4–D12 source.

### External

- [Directus docs](https://directus.io/docs) (11.17.3 pinned)
- [Directus v11.13 Native MCP Release](https://directus.io/blog/directus-v11-13-release)
- [Directus v11.15 Collaborative Editing + AI Assistant GA](https://directus.io/blog/directus-11-15-release)
- [Directus v11.16 Multimodal + Deployments](https://directus.io/blog/directus-11-16-release)
- [Directus v11.17 Background imports + translation generator](https://directus.io/blog/directus-v11-17-release)
- [directus-sync (tractr)](https://github.com/tractr/directus-sync) — 451 stars
- [directus-labs/starters](https://github.com/directus-labs/starters) — reference for p-queue + visualEditing patterns
- [directus-labs/directus-template-cli](https://github.com/directus-labs/directus-template-cli) — reference for load-data + scripts/lib patterns
- [Vercel monorepo deployment](https://vercel.com/docs/monorepos/turborepo)
- [Turborepo docs](https://turbo.build/repo/docs)

### Research agent IDs (re-queryable via SendMessage)

- A: `a565947dcd97d90d4` — Directus Feature Audit
- B: `aca7b909e811081a0` — 18a/18b Adversarial Review
- C: `a3a4ebf69c6c811e2` — Editor UX + MCP
- D: `af67bdad79d139317` — Mature Patterns

---

## 15. Spec changelog

| Date | Change | Author |
|---|---|---|
| 2026-04-24 | Initial design spec; brainstorming complete across 7 sections; all MUSTs locked; monorepo pivot decided | Yesid + Claude Code |
| 2026-04-24 | **D13 workspace tool: pnpm → Bun workspaces** (post P4/P6/P7/P9 probe completion + owner directive). Updates: § 3.3 Repo architecture + § 4.1 file tree (remove pnpm-workspace.yaml, add `.bun-version` + `bun.lock`) + § 9 D13 row. Rationale: project is Bun-first throughout; single-tool dev ergonomics; Bun 1.3 already installed + GA on Vercel; Turborepo package-manager-agnostic. Pnpm revert path documented as reversible (~1hr) via P9 escalation ladder. Full amendment log: [18c-foundations/decisions.md § Amendments](../../slices/slice-18/18c-foundations/decisions.md). | Yesid + Claude Code |
| 2026-04-24 | **Monorepo umbrella: yesido-platform new repo → existing yesid.dev repo** (no new GitHub repo). Updates: § 3.3 + § 4.1 file tree (rename root to `yesid.dev/`, relocate docs/ from apps/web/docs/ to repo root, add apps/web brand/ fold-in) + § 6.2 Phase 1 steps 1-10 rewritten + § 9 D12 amendment. Rationale: simpler, preserves domain↔name parity, Vercel project ID + Railway service reconfigured in-place, fewer migration artifacts. yesid.dev-cms repo archived post-cutover. | Yesid + Claude Code |
| 2026-04-24 | **D12: strict boundary + CI check → app independence convention + code review.** Updates: § 8.0 wording soften + § 9 D12 amendment row. Rationale: apps NOT workspace packages (only `packages/*`); cross-app imports require relative paths caught in review; dedicated lint rule YAGNI. `packages/shared` remains only legitimate cross-app surface. | Yesid + Claude Code |
| 2026-04-24 | **Added 18l sub-slice: CMS brand styling** (Data Studio theme matching yesid.dev brand). Updates: § 5 sub-slice table + § 7.7a new sub-slice sketch + § 12 timeline row. 0.5 session, runs between 18j and 18k; directus-sync-authored themes + settings; reuses 18d asset pipeline for logo upload; no new D-entries. | Yesid + Claude Code |

Future amendments append rows here with rationale + affected sections.

---

**Next step:** invoke `superpowers:writing-plans` skill to generate the detailed implementation plan derived from this design.
