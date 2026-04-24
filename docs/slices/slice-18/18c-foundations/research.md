# 18c — Research

> Populated during Phase 0 probes. Findings feed into Phase 1–5 decisions.

## Probe results

### P1 — Global Draft (v11.16) × Group interfaces (bug #26890)

*Status: deferred to Task 49 (services retrofit) + owner-gated test on live Directus.*

**Question:** Does enabling Global Draft on a collection with Group interface fields surface bug [#26890](https://github.com/directus/directus/issues/26890)?

**Why deferred:** Live CMS has only `services` collection migrated (no Group fields) + no test-collection infrastructure yet. Creating a throwaway test collection in prod to probe a bug would leave schema litter; cleaner to probe during Task 49 when services is being retrofitted with Global Draft — if Group fields ever land there, we observe immediately. If not, P1 runs during 18i (pages + M2A blocks) where Group fields are most likely (multi-block collection editing).

**Method (when executed):** In `apps/cms/directus/collections/_probe_group.json` via directus-sync, define a test collection `_probe_group` with one Group interface containing 3 sub-fields. Push → Data Studio → enable Content Versioning + Global Draft → create row → create version → edit via Group fields → promote → observe whether sub-field edits persist. Delete collection post-probe.

**Interim working assumption:** Global Draft works for flat collections (services, projects, blog_posts, tech_stack, site_meta, route_seo). Group-interface collections (likely only in 18i block_* collections) may need per-item custom versions if bug persists. Fallback path documented; not a 18c blocker.

**Decision:** TBD — land in `decisions.md` amendments row when probe executes.

---

### P2 — `/shares` endpoint behavior

*Status: deferred to post-18 preview routes implementation (design spec § D6: "Routes defer post-Slice-18").*

**Question:** What is the TTL / password / role-inheritance / URL shape of Directus shares?

**Why deferred:** D6 locks `PreviewContext = { shareToken, version? }` as the adapter-boundary shape for 18c (F5). Actual `/shares` creation + SvelteKit preview routes (`src/routes/shares/+server.ts` etc.) are post-Slice-18 work per the design spec. The adapter shape is fixed by contract; exact TTL/password semantics only matter when routes actually wire up.

**What we know already from Directus docs (no probe needed for 18c):**

- `POST /shares` returns `{ id, role, collection, item, date_start, date_end, password, max_uses }`. Token = share ID used as `?token=<id>` query param or X-Directus-Share header.
- TTL: enforced via `date_start` + `date_end` fields; null = no expiry.
- Password: optional; if set, consumer must include `password` in requests.
- Role: share inherits the role of the user who created it (not arbitrary role assignment). Public reads inherit Public policy if share role is Public.
- Anonymous reads: allowed when share token valid + item matches + no password OR password provided.

Enough for 18c's `PreviewContext` type definition + adapter branch (F5). Full probe when routes land post-Slice-18.

**Decision:** TBD — lands in post-Slice-18 preview-routes slice. Adapter shape locked in 18c.

---

### P3 — Block Editor JSON output shape

*Status: deferred to 18f pre-work (test `blog_posts` collection creation is 18f Task 1).*

**Question:** What block types does Block Editor support? What's the nested JSON shape? How does i18n compose?

**Why deferred:** Live CMS has no `blog_posts` collection yet (only `services` migrated per 18a). Probing requires creating the collection + a test row, which is exactly 18f's opening scope. Running P3 now would duplicate schema work that 18f will redo.

**Interim working assumption (from Directus 11 docs):** Block Editor emits `{ type: "doc", content: [{ type, attrs, content?, text? }, ...] }` tiptap-style AST. Built-in block types include heading (levels 1-6), paragraph, bulletList, orderedList, listItem, codeBlock, blockquote, hardBreak, horizontalRule, image, embed. Rich-text inline marks: bold, italic, code, link, strike.

**Implication for 18c:** `BlockRenderer.svelte` in 18f will dispatch on `node.type`. Nothing in 18c depends on the exact shape — `packages/shared/types/block-editor.ts` (referenced in design spec § 4.3 and 7.3) is a 18f deliverable.

**Method (when executed in 18f):** Create `blog_posts` + `blog_posts_translations` collections via directus-sync → Data Studio → create test row with full block diversity (all block types, nested lists, images) → read via MCP `items` tool → inspect `body` JSON → document in `packages/shared/types/block-editor.ts` with Zod schema.

**Decision:** TBD — lands during 18f opening tasks.

---

### P4 — directus-sync on Railway via custom Dockerfile

*Status: local research complete 2026-04-24; Railway-deploy verification owner-gated (pending).*

**Question:** Can Railway run a custom Dockerfile `FROM directus:11.17.3 + directus-extension-sync`? Does the extension load? Does the CLI work over HTTP from CI?

#### Architecture discovered

directus-sync is a **dual-component** system (not a single binary):

1. **CLI** (`directus-sync` npm package) — runs from CI / local dev; talks to Directus over HTTP with an admin token. Commands: `pull` · `push` · `diff`. Default config file: `directus-sync.config.js`; default local dump path: `./directus-config`. **Lives OUTSIDE the Directus container** — not in the Dockerfile.
2. **Extension** (`directus-extension-sync` npm package) — installed **INTO** the Directus instance. Exposes HTTP routes that the CLI calls to manage id mapping between environments. Without the extension, the CLI cannot push/pull schema.

The "custom Dockerfile" half of P4 is about installing the **extension** (component 2) into the Railway-hosted Directus image. CLI (component 1) stays in CI workflows (or local dev).

#### Extension npm metadata (verified via npm registry — 2026-04-24)

| Field | Value |
|---|---|
| Name | `directus-extension-sync` |
| Latest version | **3.0.6** |
| Type (per `directus:extension` manifest) | `endpoint` (adds HTTP routes) |
| Host compatibility | `^11.0.0` — matches our `11.17.3` pin ✓ |
| License | **GPL-3.0** (note: authoring tool use; not embedded in commercial product — see Risks) |
| Module format | ESM (`"type": "module"`) |
| Maintainer | Edouard Demotes-Mainard / tractr.net |

Because the `directus:extension` manifest entry is declared in `package.json`, **Directus 11 auto-discovers the extension when it's present in the container's `node_modules`** — no manual copy to `extensions/` folder required. This is the modern Directus extension install idiom.

#### Current Railway setup (sibling repo `yesid.dev-cms` at ref `main`)

- **No Dockerfile in repo.** Railway pulls `directus/directus:11.17.3` image directly; image pin configured via Railway dashboard → Settings → Source → override (per `yesid-dev-cms/README.md § 3.4`).
- `infra/directus/snapshot.yaml` authors schema (to be migrated to directus-sync per-resource files per Task 21).
- `vercel.json` exists but effectively dead (`ignoreCommand: "exit 0"`); Vercel project slated for retirement (yesid-dev-cms/README.md § 6).

**P4 flips Railway from "image pull" mode to "Dockerfile build" mode.** This is the behavior change Task 17 (monorepo phase) depends on.

#### Proposed Dockerfile (minimal — to land at `apps/cms/Dockerfile` in monorepo)

```dockerfile
# Directus 11.17.3 base + directus-extension-sync authoring endpoint.
# Extension is auto-discovered from node_modules via its directus:extension manifest.
FROM directus/directus:11.17.3

USER root
WORKDIR /directus

# Upstream Directus image uses pnpm under corepack. Use --prod to skip devDeps
# and --no-save to keep the image's lockfile untouched.
RUN corepack enable \
 && pnpm add --prod --no-save directus-extension-sync@3.0.6

USER node
```

**Railway migration steps** (owner dashboard work, documented for Task 17):

1. Railway → service → Settings → Source → switch from `Docker Image: directus/directus:11.17.3` to `Dockerfile Path: apps/cms/Dockerfile` (or `Dockerfile` at repo root pre-monorepo, for P4 validation on the sibling repo).
2. Build Command: leave blank (Dockerfile owns it).
3. Keep all existing env vars (DB / R2 / KEY / SECRET / etc.).
4. Trigger deploy.

#### Local verifiability (what can be probed without Railway)

- [x] **npm package exists at v3.0.6 with Directus 11 host compat** — verified via `curl registry.npmjs.org`.
- [ ] **`docker build -f Dockerfile .`** completes — owner to run (Docker Desktop on Windows). Expected: ~2-3min build; image size ~600MB-ish (Directus base + a few MB for the extension).
- [ ] **`docker run -p 8055:8055 --env-file .env` boots** — owner to run with a dev DB (Neon dev branch per existing README pattern). Expected: Directus logs show `extension loaded: directus-extension-sync` or similar discovery line.
- [ ] **`GET /extensions` returns the extension** — owner to curl after local boot.
- [ ] **`npx directus-sync@3 diff --config ./directus-sync.config.js`** against local Directus confirms CLI/extension handshake — owner to run.

#### Findings (local research, 2026-04-24)

- **Packaging viability: HIGH confidence green.** Standard Directus extension install pattern. `pnpm add` inside the image works with Directus 11's auto-discovery. No custom EXTENSIONS_PATH tweaking needed.
- **Railway viability: HIGH confidence green.** Railway supports Dockerfile builds natively; switching from image-pull to Dockerfile-build is a documented dashboard flip. Build time adds ~1-3min on top of base image pull.
- **License concern: LOW risk.** GPL-3.0 applies to the extension's source. We run it as an authoring tool on our CMS; we don't redistribute or modify the source. Template-extraction post-Slice-18 references the package install step, doesn't ship the code. No copyleft viral obligations triggered.
- **Abandonment risk: LOW.** 451 stars (per design spec), active maintainer (`tractr.net`), version 3.x already (mature), `host ^11.0.0` supported. If directus-sync stalls at Directus 12+ (BSL cutover, out of scope for slice-18), fallback is reverting D3 to `snapshot.yaml + directus schema apply`.

#### Decision (interim, pending owner Railway verification)

**Proceed with D3 amendment (directus-sync per-resource files) and D11 amendment (custom Dockerfile allowed for this one authoring tool).** Unblock Phase 1 monorepo planning. Owner to execute Railway-side verification in Phase 1 Task 17 (not as a blocker for phase entry, but as a gate for merging the 18c PR).

**If Railway verification fails** (extension doesn't load, Dockerfile build breaks, unclear error): revert D11 + D3 amendments; keep snapshot.yaml workflow from 18a; log failure mode in this section + `decisions.md`.

#### Open follow-ups

- CLI installation location: CI workflow (`apps/cms/.github/workflows/cms.yml`) runs `bun x directus-sync@3 push` with admin token from secrets. Local dev runs the same via `bun x`. Decided in Task 22.
- Dump path: default `./directus-config` conflicts with the plan's `apps/cms/directus/` target. Override via `directus-sync.config.js` `dumpPath: './directus'` to land files at the planned location.
- Extension version floating: pin to `3.0.6` explicitly in the Dockerfile (shown above) + in `directus-sync.config.js` for CLI parity, so image rebuilds don't silently drift.

---

### P5 — MCP system-prompt scope (per-role or instance-global)

*Status: complete 2026-04-24 via live MCP call.*

#### Current prompt retrieved from `yesid-cms-prod` MCP (ai-editor auth)

```
You are an AI editor for yesid.dev � a personal site + portfolio. Be
concise, factual, and never edit Directus system collections. Always
confirm destructive actions with the user before applying.
```

**37 words. Unicode corruption present:** `yesid.dev � a personal site` — the `�` is U+FFFD replacement character, originally an em dash ("—"). **Same F1 pattern observed in `yesid-dev-cms/infra/directus/snapshot.yaml:40`.** Both must be fixed during F14 upgrade; gitleaks/pre-commit should flag U+FFFD bytes going forward.

#### Scope determination (per-role vs instance-global)

Directus stores MCP prompt as a **single field** (`mcp_prompt`) on the `directus_settings` singleton. There is no per-role prompt field in the schema (confirmed via schema discovery: `directus_settings` is a system singleton, one row). Thus the prompt is **instance-global** by construction — same prompt returned for every authenticated MCP caller regardless of role.

**F14 implication:** write ONE prompt that either (a) is role-agnostic (works for admin + human-editor + ai-editor alike), OR (b) is role-aware in its text (e.g., `"If your session acts as ai-editor: stick to draft writing..."`). Option (a) is simpler; option (b) needed only if ai-editor needs guard-rails that admin should ignore. Lean (a) per Occam.

Cross-verification (admin token path) skipped because single-field-settings-singleton eliminates scope ambiguity at the schema level. If future Directus versions add per-role prompts (none in v11.17.3), revisit.

#### Findings

- **Scope: instance-global.** Single `directus_settings.mcp_prompt` field.
- **Current prompt is 37 words** — target per design spec F14: 250-400 words. **5–10× expansion needed.**
- **Unicode corruption present in current prompt.** Fix as part of F14 prompt rewrite.
- **Prompt upgrade pathway**: `directus/settings.json` in `apps/cms/directus/` (authored via directus-sync pull → edit → push). Committed text replaces live prompt on next CI apply (Task 35 in Phase 2).

#### Decision

**F14 strategy: write one instance-global prompt, role-agnostic, 250-400 words.** Include: yesid.dev scope (personal site + portfolio); content-type overview (services + projects + blog + tech-stack + meta + pages); tone (concise, factual); Block Editor rule (no Markdown); focal-point nudge for hero images (Q8); delete protection (never delete system collections; delete:false enforced separately at policy level); translation conventions (localized fields live on *_translations junctions); draft/publish workflow (Global Draft per D5); confirm-destructive directive.

Prompt draft lands in Task 35 (`directus/settings.json` authored).

#### Open follow-ups

- Block Unicode replacement char (U+FFFD) in pre-commit hook / CI (broader than F14 — touches F1 too).
- Consider whether a MCP auth HTTP header `X-Directus-User-Role` could let future per-role prompts work; flag as post-Slice-18 only if needed.

---

### P6 — Turborepo + Vercel monorepo deploy

*Status: local research complete 2026-04-24; Vercel preview-deploy verification owner-gated (pending).*

**Question:** Does Vercel correctly build `apps/web` from a Turborepo + pnpm-workspaces monorepo with workspace deps (`@yesido/shared`) resolved from `packages/shared`? Do env vars stay scoped so that `apps/cms/.env` can never leak?

#### Vercel's official monorepo story (verified via vercel.com/docs/monorepos/turborepo)

Vercel's Turborepo preset auto-configures every relevant field when you pick a Root Directory inside the repo. No manual project settings needed beyond pointing Vercel at `apps/web`:

| Vercel field | Value (auto or manual) |
|---|---|
| Framework Preset | **SvelteKit** (auto-detected from `apps/web/svelte.config.js`) |
| Build Command | `turbo run build` (global `turbo` pre-installed on Vercel builders) — filter auto-inferred from Root Directory |
| Output Directory | SvelteKit default: `.svelte-kit/**` + `.vercel/**` |
| Install Command | Auto-detected from lockfile (pnpm-lock.yaml → pnpm install at monorepo root) |
| Root Directory | **`apps/web`** |
| Ignored Build Step | `npx turbo-ignore --fallback=HEAD^1` (skips builds when apps/web + its deps unchanged) |

**Key mechanic:** Vercel runs the install step at the **monorepo root** (pnpm installs the entire workspace including `packages/shared`), then runs the build filtered to `apps/web`. This means `@yesido/shared` is resolved via pnpm's workspace linking (symlinks in `node_modules`), not re-published to npm.

#### Environment variable scoping (no leak risk)

- Vercel env vars are **project-scoped**, not repo-scoped. Since `apps/cms` is deployed to Railway (not Vercel), `apps/cms/.env` has zero presence in Vercel.
- Inside the Vercel project for `apps/web`, env vars are set per-environment (preview / production / development) via dashboard or `vercel env`.
- `turbo.json` `env` arrays drive **cache invalidation** (so a changed env var busts Turborepo's cache) — orthogonal to leak concerns.
- `apps/web/turbo.json` should declare only env vars the web build actually reads (`DIRECTUS_URL`, `DIRECTUS_STATIC_TOKEN`, `VERCEL_BYPASS_TOKEN`, etc.); no CMS-side vars (admin token, DB URL, R2 creds) should ever appear on the web side.

#### Current yesid.dev Vercel setup (baseline for migration)

- SvelteKit 2.50 + Svelte 5.54 + Vite 7.3 + Vitest 4.1.
- `@sveltejs/adapter-vercel@6.3.1` with explicit `runtime: 'nodejs22.x'` (svelte.config.js:24 — Bun ABI ≠ Vercel Node ABI; explicit pin avoids adapter rejection).
- **No `vercel.json` in repo** (Vercel dashboard config only). Implication: migration is dashboard-side only; no config file churn.
- `@directus/sdk@^20` already a dep (18a preparation).
- Scripts use `bun` locally — unchanged post-monorepo; Vercel still uses Node 22.x at build/runtime.

**Effective pattern:** Bun is **local-dev-only**; Vercel builds + runs SvelteKit on Node 22. Same rule carries into monorepo; `apps/web/package.json` declares `"type": "module"` + Node target; Bun handles scripts + tests.

#### packages/shared consumption — ESM + TS source (no build step)

Decision for D14 shape (subject to P9 verification):

```jsonc
// packages/shared/package.json
{
  "name": "@yesido/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./types": "./src/types/index.ts"
  },
  "dependencies": {
    "zod": "^4.3.6"
  }
}
```

- **TS source shipped directly** (no `dist/` build step). SvelteKit's Vite 7 transpiles workspace `.ts` files on consumption (confirmed by common Turborepo + SvelteKit usage).
- **Bun tests in `apps/cms`** consume the same source — Bun handles TS natively.
- Zod is the one runtime dep (keeps D14 "type-only + Zod" constraint).
- If Vite refuses workspace TS in production build → fallback is `tsc --build` step (adds `packages/shared/tsconfig.json` + `dist/` emit + update `exports` to point at `.js` + `.d.ts`). Additive fix; not a D14 revert.

#### Findings (local research, 2026-04-24)

- **Vercel Turborepo integration: GREEN.** Documented auto-configuration exactly matches our target shape (SvelteKit preset + `apps/web` root + global turbo build). Vendor-owned; multi-year track record.
- **Env var scoping: GREEN.** Project-scoped dashboard env + split hosting (Vercel for web, Railway for CMS) means `apps/cms/.env` cannot reach Vercel. Confirmed zero leak vector.
- **pnpm workspaces: GREEN.** Vercel detects pnpm-lock.yaml automatically; `workspace:*` protocol supported natively. Docs show pnpm tabs alongside npm/yarn/bun.
- **SvelteKit 2 + adapter-vercel@6 + Node 22: GREEN (unchanged).** Existing production setup. Migration = same package, same runtime, new Root Directory.
- **Turbo-ignore: GREEN.** Provided out-of-box; skips preview builds when `apps/web` + its deps are untouched (e.g., docs-only PRs) — aligns with "smoke both deploys only on consolidation branch" risk-mitigation (R1).

#### Owner verification gate (Task 16 — not probe-blocking for phase entry)

1. Create new Vercel project `yesido-platform-web` → import from `mgkdante/yesido-platform` (post Task 10 umbrella repo creation).
2. Configure Root Directory: `apps/web`. Accept Vercel's auto-detected Turborepo + SvelteKit defaults.
3. Copy env vars from existing yesid.dev project (`vercel env pull` + `vercel env add` in new project, or dashboard bulk import).
4. Trigger preview deploy from `feature/slice-18` branch.
5. Confirm: `/`, `/services/*` render; SSR 200; network tab shows single CMS request; no env var leak in page source.
6. Keep old yesid.dev Vercel project alive until cutover (Task 19) — zero-downtime DNS switch.

#### Decision (interim, pending owner Vercel verification)

**Proceed with D13 (Turborepo monorepo).** No revert conditions identified in local research. Owner verifies via preview deploy on the consolidation branch before cutover.

> **Amendment 2026-04-24:** D13 workspace tool pivoted pnpm → **Bun workspaces** per owner directive (see [P9 amendment](#amendment-2026-04-24--pivot-to-bun-workspaces-per-owner-directive) + [decisions.md amendments log](decisions.md)). Vercel's auto-detection works equivalently with `bun.lock` → `bun install`; Turborepo is package-manager-agnostic. All P6 findings above remain valid under Bun; references to "pnpm" in install mechanics above read as "Bun install" mechanically.

**If preview deploy fails** (e.g., workspace resolution breaks at build time): first remedy is tsc build step for `packages/shared` (additive). Only if that also fails → revert to two-repo (D13 rollback; big scope change, unlikely).

#### Open follow-ups

- `turbo.json` `env` array for `apps/web#build`: enumerate DIRECTUS_URL, DIRECTUS_STATIC_TOKEN, VERCEL_BYPASS_TOKEN (list finalized in Task 13).
- `turbo.json` `outputs` for SvelteKit: `[".svelte-kit/**", ".vercel/**"]` (per Vercel docs example, otherwise cache-miss chains break).
- Remote caching: defer. Opt-in post-18c if build times justify (Vercel-hosted free; 1-line turbo.json config + `turbo link`).

---

### P7 — Railway monorepo deploy + directus-sync extension

*Status: local research complete 2026-04-24; Railway monorepo-deploy verification owner-gated (pending). Combines P4 (extension install) with P6's monorepo half.*

**Question:** Can Railway deploy `apps/cms/Dockerfile` from a Turborepo monorepo? Does the Dockerfile context play nicely with the monorepo? Does the directus-extension-sync load correctly when the image is built from within a monorepo?

#### Railway's two monorepo options (verified via docs.railway.com)

**Option A — Isolated subdirectory (recommended for us):**
- Service → Settings → **Root Directory: `apps/cms`**
- Dockerfile auto-detected at `apps/cms/Dockerfile` (Railway's default behavior: look for `Dockerfile` at the Root Directory).
- **Build context** = `apps/cms/` only (per Railway docs: "Railway will only pull down files from that directory when creating new deployments").
- **Watch Paths: `/apps/cms/**`** (gitignore-style) — avoids redeploy thrash when only `apps/web/**` changes.

**Option B — Repo-root context (not needed for us):**
- Root Directory blank; `RAILWAY_DOCKERFILE_PATH=apps/cms/Dockerfile` env var set on the service.
- Build context = whole repo (lets Dockerfile `COPY ../../packages/shared` if needed).

**Decision for our case: Option A.** Our Dockerfile is pure `FROM + pnpm add` — zero `COPY` from outside `apps/cms/`. No need for repo-root context. Option A gives cleanest Watch-Path semantics and smaller build context upload.

#### Dockerfile with Option A build context (repeat from P4, unchanged by monorepo)

```dockerfile
# apps/cms/Dockerfile
FROM directus/directus:11.17.3
USER root
WORKDIR /directus
RUN corepack enable \
 && pnpm add --prod --no-save directus-extension-sync@3.0.6
USER node
```

Because build context is `apps/cms/`, the image doesn't see `packages/shared`, `apps/web`, or `pnpm-workspace.yaml` — and doesn't need to. The Directus container runs a vanilla image + one extension; everything else (seed scripts, CLI, workspace types) runs in **CI** (GitHub Actions) or **locally**, connecting to Railway's Directus over HTTP.

#### directus-sync CLI execution path (clarified)

The CLI (`directus-sync`) does **not** live in the Docker image. It runs from:

1. **GitHub Actions `cms.yml` workflow** (Task 22): `bun x directus-sync@3 push` with admin token from repo secrets. Targets `https://cms.yesid.dev`.
2. **Local authoring workflow**: `bun x directus-sync@3 pull` from `apps/cms/` to generate per-resource JSON after schema edits in Data Studio. Results committed to `apps/cms/directus/**`.

`directus-sync.config.js` (at `apps/cms/directus-sync.config.js`) defines `dumpPath: './directus'` so files land at `apps/cms/directus/collections/*.json` etc., matching plan.md Task 21 target layout.

#### Railway env var scoping (no leak risk)

- Railway env vars are **per-service within a project**. Only `apps/cms` is a Railway service; `apps/web` is deployed to Vercel.
- Zero presence → zero leak vector, symmetric with P6 analysis.
- Service-level secrets for CMS (DB connection string, R2 creds, KEY, SECRET, admin seed) stay on the Railway service and can't reach Vercel or local dev without explicit export.
- Build-time env vars required by the Dockerfile: declared via `ARG` in Dockerfile + set as Railway env. **We have none** — the Dockerfile is pure install, no build-time secrets needed.

#### Findings (local research, 2026-04-24)

- **Railway monorepo support: GREEN.** Root Directory + Watch Paths pattern documented and well-supported.
- **Dockerfile auto-detection from subdir: GREEN.** Standard Railway behavior; no flag needed when Root Directory matches Dockerfile location.
- **Extension load under monorepo context: GREEN (by construction).** Our Dockerfile doesn't reference anything outside `apps/cms/`; moving it into a monorepo doesn't change image contents or load behavior (P4 findings carry over unchanged).
- **Env var scoping: GREEN.** Per-service secrets + split hosting eliminates cross-app leak.
- **BuildKit cache mounts available** if we ever need them (not needed for minimal Dockerfile).
- **Dockerfile path env var (`RAILWAY_DOCKERFILE_PATH`) documented** as fallback if Option B ever becomes necessary.

#### Owner verification gate (Task 17 — extends P4 gate with monorepo path)

1. **Before monorepo exists (optional sibling-repo P4 standalone verify):** put the Dockerfile at `yesid.dev-cms/Dockerfile`; Railway → Settings → Source → switch to Dockerfile build; trigger deploy; confirm `/server/health` green + `GET /extensions/registration/list` shows `directus-extension-sync` loaded. This validates P4 alone before committing to D12 pivot.
2. **On monorepo consolidation branch (Task 17):** new Railway service points at `yesido-platform` repo → Root Directory=`apps/cms` → Watch Paths=`/apps/cms/**` → deploy from `feature/18c-foundations` branch → confirm `/server/health` green + extension loaded + CLI handshake (`bun x directus-sync@3 diff --config apps/cms/directus-sync.config.js`).
3. **Pre-cutover (Task 18):** smoke both deploys on consolidation branch against a staging env (non-prod Neon branch + separate R2 bucket if feasible).
4. **Cutover (Task 19):** point prod Railway service at new repo; delete old Railway service after 7-day DNS cooling.

#### Decision (interim, pending owner Railway verification)

**Proceed with D13 (monorepo) × D11 (directus-sync extension) combination via Option A Railway config.** No revert conditions identified beyond the upstream P4 risk (extension doesn't load).

If P4 Railway verification fails → P7 also fails (shared cause). Mitigation already in P4: revert D11 + D3, keep snapshot.yaml.

If Option A build context proves too narrow (e.g., future extension needs shared types) → escalate to Option B via `RAILWAY_DOCKERFILE_PATH` + repo-root context. Additive; not a D13 revert.

**Full research notes:** [`research.md § P4`](research.md#p4--directus-sync-on-railway-via-custom-dockerfile) for extension mechanics; this section for Railway monorepo mechanics.

#### Open follow-ups

- `apps/cms/directus-sync.config.js` shape finalized in Task 22 (includes `directusUrl: process.env.DIRECTUS_URL`, `directusToken: process.env.DIRECTUS_ADMIN_TOKEN`, `dumpPath: './directus'`, excludes like `directus_permissions_system` etc.).
- GitHub Actions `cms.yml` workflow uses Railway's environment switching to push to staging first, then prod (gated by approval).
- Staging Neon branch naming convention: `cms-staging` vs `cms-prod` — document in `apps/cms/docs/ops/` during Task 22 or 39.

---

### P8 — AVIF support

*Status: deferred to 18d (design spec § D9 lists P8 under "probe P8 in 18d"; confirmed correct by live-CMS state).*

**Question:** Does `cms.yesid.dev/assets/<id>?format=avif` return AVIF, or 400?

**Why deferred (confirmed by live state):** `files.read` on live CMS returned 1 file — a 46-byte R2 smoke-test `.txt`. No images exist in Directus yet; asset migration is 18d scope. Probing AVIF on a text file would yield uninformative errors.

**Method (when executed in 18d, Task 2 — first image upload):** Upload a hero-candidate image (JPG or PNG) via `migrate-assets.ts`. `curl -I 'https://cms.yesid.dev/assets/<uuid>?format=avif'` → check `Content-Type`. If `image/avif` → add AVIF variant to `seed-presets.ts` (hero-1200-avif, card-600-avif, thumb-240-avif) + verify size delta vs WebP. If 400 → document as "WebP-only stack for slice-18"; revisit post-Directus-12 (AVIF support may land in upstream Directus).

**Decision:** TBD — 18d Task 2 or 3.

---

### P9 — pnpm workspace + `@yesido/shared` in SvelteKit + Bun

*Status: design-pattern research complete 2026-04-24; full integration verifies in-situ at Task 14 (packages/shared extraction).*

**Question:** Does `@yesido/shared` (workspace package) import cleanly into `apps/web` (SvelteKit 2 + Vite 7 + Bun 1.3) and `apps/cms` (Bun script runtime)? Does `svelte-check` + `vitest` + `bun run build` all resolve workspace TS without a compile step?

#### Local environment discovery (2026-04-24)

```
pnpm: NOT installed
bun:  1.3.11
node: v25.9.0
```

**Blocking pre-req for Phase 1:** Owner installs pnpm globally before Task 13 (`npm install -g pnpm@10` or `corepack enable && corepack prepare pnpm@latest --activate`). Pin the version in root `package.json` `"packageManager": "pnpm@10.x"` to lock for CI + local parity.

This is a one-time install, documented here so it doesn't bite at Task 13 runtime.

#### Workspace shape (locked by D13 + D14)

```
yesido-platform/
├── pnpm-workspace.yaml        # packages: ['apps/*', 'packages/*']
├── package.json               # { "packageManager": "pnpm@10.x", "private": true }
├── turbo.json
├── apps/
│   ├── web/ (SvelteKit + Vite)
│   │   └── package.json       # "@yesido/shared": "workspace:*"
│   └── cms/ (Directus config + Bun scripts)
│       └── package.json       # "@yesido/shared": "workspace:*"
└── packages/
    └── shared/                # name: "@yesido/shared"
        ├── package.json
        ├── tsconfig.json (optional)
        └── src/
            ├── index.ts
            ├── schemas/
            └── types/
```

#### `packages/shared/package.json` (TS source — no build step)

```jsonc
{
  "name": "@yesido/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".":         "./src/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./types":   "./src/types/index.ts"
  },
  "dependencies": {
    "zod": "^4.3.6"
  }
}
```

- **No `"main"` field** (modern consumers use `"exports"`).
- **No `dist/` build step** — TS source is the entry. Vite + Bun both handle TS natively.
- **`zod` as the only runtime dep** (D14 constraint).
- **Private**: prevents accidental `pnpm publish` (workspace-only).

#### Resolution mechanics per consumer

| Consumer | How TS workspace import resolves |
|---|---|
| `apps/web` (SvelteKit 2 + Vite 7 build) | pnpm symlinks `apps/web/node_modules/@yesido/shared` → `packages/shared/`. Vite reads `exports` → loads `src/index.ts`. Vite's built-in esbuild transpiles TS on-the-fly (dev) + at build (prod). No extra config needed. |
| `apps/web` (vitest) | Inherits Vite config; same resolution path. No setup changes. |
| `apps/web` (`svelte-check` / tsc) | TS's `moduleResolution: "bundler"` (SvelteKit default) respects `exports` field. Walks symlink → types resolve from source `.ts` files. No build artifacts needed. |
| `apps/cms` (Bun scripts) | Bun 1.3+ handles pnpm workspace symlinks + `exports` field natively. TS transpiled on-import. No setup changes. |
| `apps/cms` (`bun test`) | Same as scripts; Bun's test runner shares Bun's module resolver. |

All four boundaries consume TS source directly — zero build output. This aligns with D14's "type-only + Zod" intent and minimizes tooling surface.

#### `apps/web/tsconfig.json` — one-line addition (SvelteKit default works)

SvelteKit 2's generated `tsconfig.json` extends `.svelte-kit/tsconfig.json` which already sets `moduleResolution: "bundler"` and `allowImportingTsExtensions: true`. Workspace TS imports work with no edits.

**Gotcha to watch for at Task 14:** If `svelte-check` emits `TS2742: The inferred type of 'X' cannot be named without a reference to '@yesido/shared'` — usually caused by `"composite": true` expectations in upstream types. Fix: add `packages/shared/tsconfig.json` with `"composite": true` + reference it from web's tsconfig via `"references": [{ "path": "../../packages/shared" }]`. Additive; not a D14 revert.

#### Considered alternative: Bun workspaces (rejected)

Since Bun is the day-to-day runtime and pnpm is not installed, we evaluated using Bun's native workspaces (`"workspaces": ["apps/*", "packages/*"]` in root package.json + `bun install`).

**Why rejected for slice-18:**
- Vercel's Turborepo preset is pnpm-first; bun-workspace support is newer + less battle-tested for deployment.
- Template-extraction post-Slice-18 (Q3=A: `yesito/directus-sveltekit-pro`) lands in broader community where pnpm monorepos are the de-facto default.
- Turborepo's remote cache integration is best-documented with pnpm.

**Why keep it on the table:** Bun-first project + single-tool ergonomics are real. If pnpm install ever becomes painful at Vercel build time, pivoting to Bun workspaces is an ~1-hour refactor (root `package.json` `workspaces` field + delete `pnpm-workspace.yaml` + regenerate lockfile). Document as a **reversible fallback** in rollback.md (Task 53).

#### Findings (2026-04-24)

- **pnpm workspace + TS source + modern `exports` field: GREEN PATTERN.** Canonical shape; thousands of real-world monorepos ship it; SvelteKit/Vite/Bun all resolve it without compile step.
- **No `dist/` build output needed:** reduces tooling surface + keeps packages/shared edits instant-reflected across apps (no rebuild lag).
- **Env gap: pnpm not installed locally.** Minor — one-line install at Task 13 start. Not a D14 threat.
- **Full integration verification: in-situ at Task 14** when `apps/web/src/lib/types.ts` moves into `packages/shared/src/types/content.ts` and apps/web imports flip to `@yesido/shared`. That's the definitive test.

#### Decision (interim)

**Proceed with D14 (packages/shared as type-only + Zod workspace package, TS source + `exports`, no build step).** Owner installs pnpm before Task 13. Task 14 is the real verification.

Fallback escalation ladder (each step additive; no D14 revert):

1. `svelte-check` emits cross-package type-inference errors → add `tsconfig composite: true` + references.
2. Vite dev HMR flaky on packages/shared edits → add `optimizeDeps.include: ['@yesido/shared']` in `apps/web/vite.config.ts`.
3. Production bundle fails to tree-shake Zod → add `packages/shared/tsconfig.json` with `"noEmit": false` + `"declaration": true` + emit to `dist/` + flip `exports` to compiled paths.
4. Bun workspaces simpler end-to-end → pivot workspace manager (documented in rollback.md).

D14 reverts only if the whole "cross-app shared package" model collapses (very unlikely given the canonical nature of the pattern).

#### Open follow-ups

- `pnpm@10` pinned in root `packageManager` field (Task 13). **SUPERSEDED by 2026-04-24 amendment below — see Bun workspaces section.**
- `apps/web/package.json` dep: `"@yesido/shared": "workspace:*"` (Task 14) — unchanged under Bun.
- If svelte-check struggles at Task 14, land `packages/shared/tsconfig.json` + `"composite": true` + references proactively.

---

#### Amendment 2026-04-24 — Pivot to Bun workspaces (per owner directive)

**Decision:** Workspace manager pivots from pnpm → **Bun workspaces**. Remaining P9 findings (TS source + `exports` field + no build step + Zod runtime + escalation ladder) carry over unchanged — workspace resolution mechanics are equivalent at the level that matters for D14.

**What changes:**

| Before (pnpm) | After (Bun) |
|---|---|
| `pnpm-workspace.yaml` at repo root defines `packages:` array | Root `package.json` has `"workspaces": ["apps/*", "packages/*"]` field; no separate yaml |
| Root `package.json` pins `"packageManager": "pnpm@10.x"` | Pin Bun version via `.bun-version` file or CI `bun-version: 1.3.x` input |
| `pnpm install` from repo root | `bun install` from repo root |
| Lockfile: `pnpm-lock.yaml` | Lockfile: `bun.lock` |
| Owner blocking pre-req: install pnpm before Task 13 | **No install pre-req** — Bun 1.3.11 already present |
| Vercel auto-detects pnpm-lock.yaml → pnpm install | Vercel auto-detects bun.lock → bun install (Bun support GA on Vercel since 2024) |
| Turborepo install flow: `pnpm add -w turbo` | Turborepo install flow: `bun add -w turbo` |

**What does NOT change:**

- `packages/shared/package.json` shape (TS source + `exports` + Zod dep).
- `apps/web/package.json` + `apps/cms/package.json` consume `"@yesido/shared": "workspace:*"` (Bun supports `workspace:*` since 1.1).
- SvelteKit + Vite + vitest + svelte-check + Bun test resolution — all identical under Bun workspaces.
- Turborepo caching (`turbo run build`) is package-manager-agnostic; env/outputs config same.
- Dockerfile internal package manager (`apps/cms/Dockerfile` uses `pnpm add --prod --no-save directus-extension-sync` via corepack inside the Directus image) — unrelated to the monorepo workspace tool; stays as-is.
- `@directus/sdk@^20` already-installed in existing yesid.dev — no change post-monorepo.

**Revised environment status:**

```
pnpm: NOT installed — NO LONGER REQUIRED
bun:  1.3.11 ✓ (meets Bun workspace + workspace:* protocol floor of 1.1)
node: v25.9.0 ✓ (for Vercel runtime compat at adapter-vercel output)
```

**Revised Task 13 scope (to be edited in plan.md):**

> Root `package.json` with `"workspaces": ["apps/*", "packages/*"]` + `turbo.json`; `bun install`; commit `bun.lock`.

Replaces prior wording "Root `package.json` + `pnpm-workspace.yaml` + `turbo.json`; `pnpm install`".

**Revised fallback escalation ladder (same steps, last-step direction flipped):**

1. `tsc` cross-package inference errors → `tsconfig composite: true` + references.
2. Vite HMR flaky → `optimizeDeps.include: ['@yesido/shared']`.
3. Bundler tree-shake issues → emit `dist/` from `packages/shared/tsconfig.json`.
4. Last resort → pivot back to pnpm workspaces (reverse of today's pivot; ~1hr).

**Why this pivot makes sense (contextual judgment):**

- Existing `yesid.dev-cms` already ships `bun.lock` + bun-prefixed scripts. Existing `yesid.dev` likewise uses Bun via scripts. Monorepo continuation of the pattern removes impedance mismatch.
- Bun 1.3.x is mature + GA + has shipped workspaces for ≥2 years.
- Vercel + Turborepo + SvelteKit + Bun is a proven combination in 2026 — no longer frontier tooling.
- Simpler onboarding for the template-extraction audience post-Slice-18: one install (Bun), one lockfile.
- Performance wins (Bun install ~3-5× faster than pnpm) compound across CI matrix runs.

---

## Phase 0 probe decision log

Populated as probes complete. Summary table + links to specific findings above.

| Probe | Status | Decision | Blocks? |
|---|---|---|---|
| P1 | ⏸ deferred | Working assumption: Global Draft works for flat collections; Group-interface collections may need per-item custom (probed in Task 49 / 18i) | no (fallback path documented) |
| P2 | ⏸ deferred | Adapter shape locked: `PreviewContext = { shareToken, version? }`; route semantics probe with post-18 implementation | no (adapter shape only; routes post-18) |
| P3 | ⏸ deferred | Working assumption: tiptap-style `{type:"doc",content:[...]}`; exact shape probed at 18f Task 1 when blog_posts collection created | 18f scope |
| P4 | 🟡 local ✓ / Railway owner-gated | **Interim green — proceed with D3 + D11 amendments; Railway verify in Task 17** | **yes (D11 + D3)** |
| P5 | ✅ complete | **Instance-global scope (single `directus_settings.mcp_prompt`); current prompt 37 words with U+FFFD corruption; F14 = write role-agnostic 250-400 word prompt** | F14 wording |
| P6 | 🟡 local ✓ / Vercel owner-gated | **Interim green — proceed with D13; Vercel preview verify in Task 16** | **yes (D13)** |
| P7 | 🟡 local ✓ / Railway owner-gated | **Interim green — proceed with D11+D13 via Option A (Root=apps/cms, Watch=/apps/cms/**); Railway verify in Task 17** | **yes (D13 + D11)** |
| P8 | ⏸ deferred | No images in live CMS yet; confirmed correct to defer per design spec § D9 (runs in 18d Task 2-3 after first image upload) | 18d optional |
| P9 | 🟡 design ✓ / in-situ verify at Task 14 | **Interim green — proceed with D14 (TS source + exports, no build step); owner installs pnpm before Task 13** | **yes (D14)** |

Probes that block phases get run first; non-blockers can run in parallel.
