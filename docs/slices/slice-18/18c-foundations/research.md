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

*Status: not yet run.*

**Question:** Can Railway run a custom Dockerfile `FROM directus:11.17.3 + COPY extensions/directus-sync`? Does the extension load?

**Method:** Build image locally; push to Railway staging; verify extension loads + CLI works.

**Findings:** TBD

**Decision:** TBD (informs D11 amendment viability; fallback plan if probe fails)

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
| P4 | ⏸ | TBD | **yes (D11 + D3)** |
| P5 | ⏸ | TBD | F14 wording |
| P6 | ⏸ | TBD | **yes (D13)** |
| P7 | ⏸ | TBD | **yes (D13 + D11)** |
| P8 | ⏸ | TBD | 18d optional |
| P9 | ⏸ | TBD | **yes (D14)** |

Probes that block phases get run first; non-blockers can run in parallel.
