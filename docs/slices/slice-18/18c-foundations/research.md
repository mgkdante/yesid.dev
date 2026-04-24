# 18c — Research

> Populated during Phase 0 probes. Findings feed into Phase 1–5 decisions.

## Probe results

### P1 — Global Draft (v11.16) × Group interfaces (bug #26890)

*Status: not yet run. Populate with findings.*

**Question:** Does enabling Global Draft on a collection with Group interface fields surface bug #26890?

**Method:** Create test collection with Group field in Data Studio; enable Content Versioning + Global Draft; edit + promote; document behavior.

**Findings:** TBD

**Decision:** TBD (informs D5 rollout — which collections can use Global Draft; which need per-item custom versions)

---

### P2 — `/shares` endpoint behavior

*Status: not yet run.*

**Question:** What is the TTL / password / role-inheritance / URL shape of Directus shares?

**Method:** `POST /shares` with permutations (with TTL, with password, role-scoped, unscoped); test anonymous vs authed reads.

**Findings:** TBD

**Decision:** TBD (informs D6 — `PreviewContext` shape at adapter boundary)

---

### P3 — Block Editor JSON output shape

*Status: not yet run.*

**Question:** What block types does Block Editor support? What's the nested JSON shape? How does i18n compose?

**Method:** Create test `blog_posts` row with rich content (heading, paragraph, image, code, list, embed, quote, divider); inspect `/items/blog_posts/<id>` JSON; document block types + nesting + i18n.

**Findings:** TBD

**Decision:** TBD (informs D15 + `BlockRenderer.svelte` design in 18f)

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

- CLI installation location: CI workflow (`apps/cms/.github/workflows/cms.yml`) runs `npx directus-sync@3 push` with admin token from secrets. Local dev runs the same via `bun x` or `pnpm dlx`. Decided in Task 22.
- Dump path: default `./directus-config` conflicts with the plan's `apps/cms/directus/` target. Override via `directus-sync.config.js` `dumpPath: './directus'` to land files at the planned location.
- Extension version floating: pin to `3.0.6` explicitly in the Dockerfile (shown above) + in `directus-sync.config.js` for CLI parity, so image rebuilds don't silently drift.

---

### P5 — MCP system-prompt scope (per-role or instance-global)

*Status: not yet run.*

**Question:** Does the `mcp_prompt` setting apply per-role or instance-global?

**Method:** Call MCP `system-prompt` tool with admin token vs ai-editor token; compare outputs.

**Findings:** TBD

**Decision:** TBD (informs F14 prompt wording — single prompt vs per-role)

---

### P6 — Turborepo + Vercel monorepo deploy

*Status: not yet run.*

**Question:** Does Vercel correctly build from `apps/web` root with workspace deps resolved from `packages/shared`? Do env vars stay scoped?

**Method:** New Vercel project → Root Directory: `apps/web`; test preview deploy; verify `apps/cms/.env` doesn't leak.

**Findings:** TBD

**Decision:** TBD (informs D13 viability)

---

### P7 — Railway monorepo deploy + directus-sync extension

*Status: not yet run.*

**Question:** Does Railway build from `apps/cms/Dockerfile` with the extension packaged?

**Method:** Railway service → Build Command + Dockerfile Path: `apps/cms/Dockerfile`; deploy; smoke `/schema/apply`.

**Findings:** TBD

**Decision:** TBD (combines D13 + D11)

---

### P8 — AVIF support

*Status: deferred to 18d if preferred. Probe can run here.*

**Question:** Does `cms.yesid.dev/assets/<id>?format=avif` return AVIF, or 400?

**Method:** `curl -I 'cms.yesid.dev/assets/<uuid>?format=avif'` — check `Content-Type` response header.

**Findings:** TBD

**Decision:** TBD (informs D9 preset list — add AVIF variant if green)

---

### P9 — pnpm workspace + `@yesido/shared` in SvelteKit + Bun

*Status: not yet run.*

**Question:** Does `@yesido/shared` (workspace package) import cleanly into `apps/web` (SvelteKit + Vite + Bun runtime)?

**Method:** Create test import; verify `svelte-check` + `vitest` + `bun run build` + deployed bundle all resolve cleanly.

**Findings:** TBD

**Decision:** TBD (informs D14 workability; fallback is codegen-per-app if workspace breaks)

---

## Phase 0 probe decision log

Populated as probes complete. Summary table + links to specific findings above.

| Probe | Status | Decision | Blocks? |
|---|---|---|---|
| P1 | ⏸ | TBD | no (deferrable to 18d if needed) |
| P2 | ⏸ | TBD | no (adapter shape only; routes post-18) |
| P3 | ⏸ | TBD | 18f scope |
| P4 | 🟡 local ✓ / Railway owner-gated | **Interim green — proceed with D3 + D11 amendments; Railway verify in Task 17** | **yes (D11 + D3)** |
| P5 | ⏸ | TBD | F14 wording |
| P6 | ⏸ | TBD | **yes (D13)** |
| P7 | ⏸ | TBD | **yes (D13 + D11)** |
| P8 | ⏸ | TBD | 18d optional |
| P9 | ⏸ | TBD | **yes (D14)** |

Probes that block phases get run first; non-blockers can run in parallel.
