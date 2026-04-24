# Slice 18 Re-plan — Research Audit

> **Research pass:** 2026-04-24 · 4 parallel general-purpose Agents · `~30k words` output combined · invoked via superpowers:brainstorming.
>
> **Purpose:** Gather exhaustive input before cutting the Slice 18 re-plan. Owner directive (Q5=D): "Let the research decide. Return a ranked must/should/nice-to-have/defer list. Then I lock MUSTs from their output."
>
> **Scope already locked (Q1–Q4):** rebuild from scratch (C), everything on the table incl. live production code (C), template repo extraction post-Slice-18 (A), 9-sub-slice hybrid decomposition (C: foundations-first + retrofit + content types + polish + close).
>
> **Agent IDs** (re-queryable via `SendMessage`):
> - A: `a565947dcd97d90d4` — Directus 11.17.3 Feature Audit
> - B: `aca7b909e811081a0` — 18a/18b Adversarial Review
> - C: `a3a4ebf69c6c811e2` — Editor UX + Data Studio + MCP Workflow
> - D: `af67bdad79d139317` — Mature Directus + SvelteKit Project Patterns

---

## Agent A — Directus 11.17.3 Feature Audit × yesid.dev use case

Sourced via WebFetch of Directus docs (fetched 2026-04-24). Every capability mapped to yesid.dev's content model (6 content types + M2A pages + MCP + Visual Editing) with MUST/SHOULD/NICE/DEFER ranking + sub-slice anchor + effort estimate (S/M/L).

**Sub-slice anchors referenced:**
- **F (foundations)** — translations wiring, role/policy matrix, flows & webhooks, saved asset presets, CI, live preview, versioning conventions, folder layout (our 18c).
- **P1 projects** · **P2 blog_posts** · **P3 tech_stack** · **P4 site_meta + route_seo** · **P5 pages M2A** (our 18d–18h).
- **Polish** — custom collection layouts, Insights, notifications, comments, bookmarks (our 18j).
- **Close** — two-repo extraction, template prep (our 18k).

### Agent A — MUSTs

| Feature | Sub-slice | Rationale | Effort |
|---|---|---|---|
| **Collections & singletons with accountability toggle** | F | `site_meta`, `nav_links`, `menu_items`, `error_pages` need singleton mode. | S |
| **Fields + interfaces — Input/Textarea/Markdown/Toggle/Slug/Tags/Datetime/Color/Code/JSON/Dropdown/Hash/Icon/Header/Divider/Notice** | F, P1–P5 | Slug interface powers every `[slug]` route. Markdown for blog body. Icon reused across services/blocks. | S |
| **Relationships: M2O, O2M, M2M, M2A** | F, P1, P5 | M2O: translations parents. O2M: translations. M2M: projects↔services, tech_relations self-M2M, stack_scenarios. M2A: `pages.blocks` (D7). Structural spine. | L (M2A) / M (others) |
| **Translations interface + Generate Translations wizard** | F | Use wizard — do NOT hand-roll. `*_translations` junction + `languages` collection. | S per collection |
| **Content Versioning** | F | D5: all user collections. "Main + custom Version + promote" flow. Compare modal. Retention env-var. Global Draft (11.16) SHOULD tier. | M |
| **Live Preview URL per collection** (D6) | F | Required for Visual Editor. `preview_url` template per collection. CSP `FRAME_SRC` required. | S per collection |
| **@directus/visual-editing SDK v2** (D4) | F | v2.0.0+ validates field-level permissions. Requires 11.16+. | M |
| **Files: upload, folder hierarchy, metadata (title/description/tags/alt/focal point)** (D9) | F | Folder per content type. `focal_point_x/y` for hero crops. | S |
| **Asset transform + saved presets `/assets/:id?key=…`** (D9) | F | Presets: hero-1200, card-600, thumb-240, og-1200. **Set `STORAGE_ASSET_TRANSFORM=presets`** to block arbitrary transforms (R2 bandwidth + security). | S |
| **s3 driver → R2** (D2) | F (shipped) | Re-verify `STORAGE_S3_FORCE_PATH_STYLE=true`. | S |
| **Roles + Policies + Permissions model** (D10) | F | Admin / human-editor / ai-editor / Public. Composition. Field-level. | M |
| **Flows — Event Hook Action + Webhook operation** (D8) | F | Trigger on `items.create/update/delete/promote` → Request URL to SvelteKit ISR bypass. `items.promote` critical for versioning. Flow logs ON. | M |
| **Native MCP server scoped to `ai-editor`** | F (shipped) | Re-audit after each new collection. | S per collection |
| **Schema snapshot + apply CI** (D3) | F (shipped) | Extend per collection. `--dry-run` in PR checks. | S per collection |
| **Collection display template + list view config** | F, P1–P5 | `{{translations.title}}`. Default list layout. 10-min per collection polish. | S |
| **SDK static token auth for server-side reads** | F | Rotate via Data Studio role. | S |
| **REST API with query params (filter/fields/deep/limit)** | F | `deep[translations][_filter][language][_eq]=...` for locale filtering. | S |
| **WebSocket for collaborative editing** | F | `WEBSOCKETS_ENABLED=true`. Without Redis at single-instance; add Redis if scaling. | S |
| **Auth: static tokens + session cookies + 2FA/TOTP** | F, Close | 2FA on admin + human-editor. | S |
| **Share tokens for draft reviews** | F / P2 | Password-protected expiring URLs. MUST-tier only if external reviewer workflow needed — owner call. | S |
| **Two-repo schema/flows/seeds boundary** (D12) | Close | CI between the repos is the hour-sink. | L |
| **CORS + CSP wiring for frame embedding** | F | Without this Visual Editing + Live Preview silently break. | S |
| **Adapter seam mapping of M2A blocks → ContentPort** (D7) | P5 | Novel ground. Biggest schema piece. | L |

### Agent A — SHOULDs

Global Draft Version (11.16) · Focal point interface mandatory · Flows Transform Payload + Condition + Throw Error · Manual-trigger flow "Publish page" · Scheduled cron flow for content integrity check · Activity feed + Revisions (set to both) · Item comments · Collaborative editing GA · AI-assisted writing (11.15 GA) · Insights dashboard "content health" · Bookmarks per role · Notifications (inbox + email) · GraphQL endpoint verification · URL Preview + Autocomplete API interfaces · Block Editor evaluation for `blog_posts.body` · IP allowlisting for admin · Pressure-based rate limiter verify · Revision compare with translations probe · Import/Export (CSV/JSON) · Dry-run schema apply in CI · `STORAGE_ASSET_TRANSFORM=presets` lock.

### Agent A — NICE-TO-HAVES

Insights richer dashboards · AI Assistant image gen · Deployment Module (11.15+) · Embedded Insights in yesid.dev admin route · 2FA + SSO (OIDC) · LDAP/SAML · Marketplace extensions · Tree View interface · Repeater interface · Dashboard auto-refresh · Slider / Checkbox-Tree interfaces · Flow JWT sign/verify op · Flow Send Email op.

### Agent A — DEFERs

Custom Directus extensions (D11) · Directus 12 · Webhooks legacy · LDAP/SAML · Multi-environment staging+prod · Directus Cloud · LLM fine-tuning · Geometry/Map panels · Flow Sleep in prod paths · Flow Run Script with node_modules · Collaborative editing across multi-instance (deferred until scaling) · Block Editor for blog_posts.body (if Markdown preserved) · Directus Shares for route-level gating · Session-cookie auth for SvelteKit reads.

### Agent A — Open questions for owner

1. `blog_posts.body`: Markdown or Block Editor?
2. Global Draft (11.16) vs per-item custom versions?
3. Share tokens for draft review — needed?
4. Editor count: 1 forever or hiring?
5. Revalidation scope: per-URL or route-group?
6. Two-repo CI topology: contract tests where?
7. Focal point: mandatory or defaulted?
8. Preview URL shape: confirm `/preview/[collection]/[id]` pattern.

### Agent A — Conflicts with existing D-entries

- **D5 Versioning on M2A blocks** — probe first; may need per-block decision due to #26890.
- **D7 M2A blocks** — per-page copies (not shared) is safer for Slice 18.
- **D8 Flows→ISR** — Deployment Module (11.15+) is separate from revalidation; keep custom flow.
- **D9 Presets** — set `STORAGE_ASSET_TRANSFORM=presets` explicitly (block arbitrary).
- **D10 Collaborative editing** — verify WS env actually on (no error if off).
- **D11 Zero extensions** — confirm `system-prompt` MCP tool is built-in (no extension needed).
- **D12 Two-repo** — extraction prep can start now at Close.

### Agent A — Features the original audit missed

1. **Archive field mechanics** — `archive_field`, `archive_value`, `unarchive_value` on collection. Lighter "soft-unpublish" than a version flip.
2. **Collection sort_field** for manual drag-reorder in Data Studio. Essential for M2A junctions.
3. **Display templates per relational field** (M2O/M2M display settings).
4. **`item_duplication_fields`** controls Save-as-Copy behavior.
5. **Flow Operation sandbox exports** — whitelist of safe lodash utilities, no I/O.
6. **`one_deselect_action` on relations** — set null / delete. Critical for M2A block ownership.
7. **`system` token bypass** — flow-side footgun; document warning.
8. **Versioning + M2O relations** — only ID diffs stored; can't roll back image uploads via versions.
9. **CSP FRAME_SRC on Directus side** — #1 reason Visual Editing silently fails.
10. **Pressure-based rate limiter** — ships on by default; 503 under load.
11. **6-field cron syntax** for Schedule triggers (includes seconds).
12. **Manual triggers + Button interface** for custom action buttons (no extension).
13. **Content Versioning retention indexes (11.13)** — set `REVISIONS_RETENTION=90d` explicitly.
14. **Files folder permissions policy** — scope ai-editor writes per-folder via `directus_files` permission filter.
15. **`items.promote` event** — Versioning-specific; revalidate flow must handle it.
16. **MCP schema tool** — live schema access; no redeploy when schema changes.
17. **Block Editor ≠ M2A blocks** — confusing naming; document.

---

## Agent B — 18a/18b Adversarial Review

Code walkthrough of live services impl + seed + tests + CI across both repos. 5 findings each for CRITICAL, PATTERN-AFFECTING, COSMETIC, VALID.

### Agent B — Executive summary

1. **`services.adjacent` fetches entire catalog twice per call.** Propagation-risk: copied to projects.adjacent, blog neighbors, tech-stack adjacency.
2. **Fixture has no drift detection.** `fixtures/services.json` can diverge from `yesid.dev/src/lib/content/services.ts`. No CI check.
3. **Contract tests thin on mapping; `typeof import` pattern will bite when static content types get deleted.**
4. **Seed auth flow** — when email/password fallback succeeds, `access_token` used as if it were a static admin token. Token refresh semantics silently ignored.
5. **Schema snapshot has non-ASCII artifact** — `display_template: 'Station {{station}} � {{id}}'` (U+FFFD replacement char; cp1252 round-trip).

### Agent B — CRITICAL findings

- **C1** `services.adjacent` double-fetch (directus.ts:256-266). Fix: per-request memo + minimal field fetch.
- **C2** `snapshot.yaml:40` Unicode corruption. Fix: edit to em-dash/middot; document Windows `chcp 65001` or snapshot via WSL.
- **C3** contract test `vi.importActual` workaround for global `setup.data.ts` mock. Fix: scope mock to `./index` or unmock per-test.

### Agent B — PATTERN-AFFECTING findings

- **P1** No fixture drift detection between yesid.dev's services.ts and cms/fixtures/services.json.
- **P2** `ContentPort.typeof import` binds to static modules we plan to delete.
- **P3** `PreviewContext` (D6) missing from `ContentAdapter` interface.
- **P4** Nuke-and-recreate seed breaks on M2M circular FKs (Task 10 projects↔services).
- **P5** Duplicated type + Zod definitions across repos (need shared package or codegen).
- **P6** No mocked-fetch contract test (request-shape contract untested).
- **P7** Throw-based TODO stubs could be composition-based.
- **P8** Port-level hybrid might want method-level later.
- **P9** No `parsePort` (Zod) at Directus adapter boundary — symmetry broken vs static.

### Agent B — COSMETIC findings

- `let cachedClient` → could be `const`.
- `todo()` function name ambiguous; rename `throwUnimplemented`.
- `describe.skipIf` "guard" that always passes — replace with `it.skip`.
- `console.log('✓ ...')` on Windows shows `?` without `chcp 65001`.
- `createItem('services', row as unknown as DirectusServiceRow)` double-cast (SDK workaround).
- `directus.test.ts:59` test name confusing.
- `contract-test.yml:60-62` hardcodes `ref: main` — add `ref` input for feature branches.

### Agent B — VALID AS-IS (template-worthy)

1. `toLocalizedString` generic signature + edge case handling.
2. Lazy client pattern (env check on first call, not module-load).
3. Lazy client failure mode (named error).
4. `types.ts` port split (per-port interfaces).
5. `directus.contract.test.ts` `toService` pure-mapping tests.
6. `snapshot-shape.test.ts` parse + assert pattern.
7. `schema-apply.yml` bootstrap chain + comment explaining why.
8. README Operations sections (rotation + schema + paired-PR).
9. Zod schema at fixture boundary (defensive pattern).

### Agent B — Missed patterns

1. **No rollback runbook.**
2. **No generic port implementation template / scaffold-port script.**
3. **No cache invalidation story at adapter level.**
4. **No PII/secrets scan (gitleaks) in CI.**
5. **No `.env.example` (README references it heavily).**
6. **No CONVENTIONS.md / adapter-pattern doc.**
7. **No MCP permissions audit test** (privilege creep detection).
8. **No contract-test workflow `ref` input** (hardcodes main).

### Agent B — Recommendations for 18c-foundations (ordered by ROI)

1. Fix C2 (snapshot corruption) — 10 min.
2. Retrofit C1 (adjacency pattern) — settle before projects/blog copy the 2-fetch.
3. Retrofit P9 (parsePort symmetry) — route Directus through Zod.
4. Retrofit P2 (named ContentPort interfaces) — unblocks static-module deletion.
5. Add P3 (PreviewContext parameter) — cheaper to retrofit now than 6 later.
6. Fix C3 / refactor setup.data.ts — kills vi.importActual propagation.
7. Add P1 (fixture-drift detector).
8. Refactor P4 (upsert seed, not nuke).
9. Extract P5 (shared types package) — decide pnpm workspace vs codegen.
10. Add P6 (mocked-fetch contract test).
11. Add docs/ops/rollback.md + docs/patterns/adapter-conventions.md + scripts/scaffold-port.ts.
12. Parameterize contract-test workflow `ref`.

---

## Agent C — Editor UX + Data Studio + MCP Workflow

Live probe of cms.yesid.dev via MCP confirmed current feature flags, snapshot shapes, system-prompt contents. 35 collections on prod; only `services` fully configured (display template + sort field). Most editor UX is declaratively configurable in snapshot.

### Agent C — MUSTs

1. **Display Template per collection** — `collections[].meta.display_template`. Human labels in all list/picker views. Cheap.
2. **List view columns + default layout** — `directus_presets` with `role=null, user=null, bookmark=null`. Prevents MVP-feeling on first open.
3. **Archive field configured** — `archive_field: "status"`, dropdown: draft/published/archived. Soft-unpublish workflow.
4. **Sort field on ordered collections** — services has `sort_field: "station"`; projects/tech_stack/nav/pages.blocks all need one.
5. **Field width + grouping + tabs** — native Tabs interface shipped in **v11.17.1** (no community extension). Split forms into SEO/relations/media tabs.
6. **Field notes + required + conditional visibility** — `meta.note`, `meta.required`, `meta.conditions`.
7. **Translation interface + languages collection** — v11.17 Translation Generator scaffolds in one click. Pin shape in F.
8. **Live Preview URL per collection** — Visual Editor dependency. Cheap per-collection.
9. **Collaborative editing enabled** — `WEBSOCKETS_ENABLED=true`. Silent degradation if off.
10. **MCP system-prompt upgrade (per-role)** — Instance-global appears to be reality in 11.17.3 (needs probe). 200–400 word prompt with content-type map + LocalizedString rule + required-before-publish list + archive-don't-delete rule + terminology.
11. **MCP global delete protection ON** — `ai-editor` defense in depth.
12. **ai-editor role scoping concrete** — read unconditional, create/update filtered to `status != "published"`, delete false, no system-collection writes.

### Agent C — SHOULDs

- Item comments + @mentions (already enabled via `directus_comments`; needs per-role permission).
- In-app notifications (already exists as collection; add SMTP for email).
- **Insights dashboard "Content Ops"** — one dashboard with pending drafts, updated this week, untranslated items, assets without alt text. 15 min to build.
- Revisions visible + retention policy — `REVISIONS_RETENTION=90d` env.
- AI Assistant configured (editor-side LLM chat) — 11.16 multimodal, 11.17 Anthropic tool-search. Different from MCP.
- `item_duplication_fields` config per type.
- Quick-action Flows ("Publish" button in editor) — Manual trigger with `require_confirmation`.
- Presets: "My drafts" bookmark per-user.
- **2FA on admin user** — manual TOTP enable.

### Agent C — NICE-TO-HAVES

- Share tokens `/shares` endpoint (vs EDITOR_PREVIEW_TOKEN D6 — reconsider post-18).
- Translation copy-from-source Flow (post-18).
- Semantic search (not in 11.17.3).
- Background data import (11.17 — irrelevant for Slice 18).
- IP allowlist (solo-operator doesn't need).
- AI Assistant telemetry (Braintrust/Langfuse — 11.17 feature).
- AI writing ops as discrete endpoints (not enablement-ready).
- Visual Editor Studio Module (D4).
- Keyboard shortcuts (all built-in, zero config).

### Agent C — Questions docs don't answer

1. **Share tokens vs EDITOR_PREVIEW_TOKEN (D6)** — reconsider? Owner call.
2. **`mcp_prompt` per-role or instance-global?** Docs hint, live probe shows instance-global. Test with two tokens.
3. **v11.16 global draft — auto-apply or opt-in?** Release notes say opt-in via `versioning: true`. Owner: enable for projects+blog, skip services/tech_stack/pages?
4. **Global delete protection exact field name** — `mcp_allow_deletes` or similar? Probe Settings → AI.
5. **Flow `trigger-flow` MCP tool** — only Manual triggers, or any? Probe.
6. **`directus_deployments` collection** — what's it doing on prod? Probe.
7. **AI Assistant conversations stored in browser only** — confirmed; no cross-device history for solo operator.

### Agent C — Recommended per-collection checklist

Every content type must configure: display_template · icon · note · sort_field · archive config · item_duplication_fields · preview_url · versioning · accountability · translations · field tabs/widths · notes/required/conditions · list preset · ai-editor policy · comments permission. **18 items per collection.**

### Agent C — MCP + AI integration shape

- **MCP server** = external agents (Claude Code, Cursor) as `ai-editor`. 12 tools.
- **AI Assistant** = internal Data Studio chat for human. Attached to session user.
- **Shared API key OK** (same Anthropic key), **different identity**.
- **System prompt template** (~250-400 words): identity + content model map + localization rule + status rule + delete rule + terminology + a11y rule + confirm-before-destroy + fallback.
- **Flows for AI-triggered actions**: Manual "Publish + deploy", Manual "Regenerate SEO description", Manual "Publish translation."

### Agent C — Live probes before 18j polish

P1: Confirm `mcp_prompt` field + per-role behavior.
P2: Test `trigger-flow` against non-Manual flows.
P3: `directus_deployments` origin.
P4: Global delete protection toggle.
P5: Collaborative editing live test.
P6: AI Assistant config persistence across restart.
P7: Confirm v11.17.1 native Tabs vs any installed community extension.

### Agent C — Conflicts with D-entries

- **D6 EDITOR_PREVIEW_TOKEN vs `/shares`** — keep D6 for Slice 18; post-18 evaluate.
- **D10 ai-editor role** — section "minimum permissions" fills the gap.
- **D4 Visual Editor** — preview URL per-collection isn't a D-entry but is a prereq for 18c.

---

## Agent D — Mature Directus + SvelteKit Project Patterns

Surveyed 10+ GitHub repos (directus-labs/starters 180-stars, directus-labs/directus-template-cli 180-stars, tractr/directus-sync 451-stars, bcc-code/directus-schema-sync 179-stars, directus-labs/directus-templates 98-stars, bryantgillespie/nuxt3-directus-starter 144-stars, cododel/directus-alto full-framework, kitus-starter SvelteKit+Directus+Caprover, AristideBH repos) + Railway templates + Directus docs.

### Agent D — Executive summary (10 top findings)

1. **Adopt `p-queue` + fetch-retry client pattern** (from directus-labs/starters) — protects cms.yesid.dev during M2A page load fan-outs.
2. **Adopt schema-driven type generation** (`directus-sdk-typegen` or equivalent) — drops hand-maintained `Schema` interfaces.
3. **Adopt skeleton-records-then-full-data seed** (from directus-template-cli) — replaces nuke-and-recreate for M2M circular FKs.
4. **Consider `directus-sync` for per-collection-file schema** — 451 stars. Single snapshot.yaml grows quadratically.
5. **Adopt `DirectusError` class + Bottleneck rate-limited client** — typed error parsing + rate-limit handling.
6. **Split `fixtures/` into `fixtures/collections/*.json`** — one file per resource.
7. **Keep three-boundary test split** — no mature starter has this; template-worthy.
8. **Adopt `scripts/lib/` shared lib** — sdk/auth/chunk/catch/logger/read-fixture.
9. **Adopt visual-editing opt-in via sessionStorage + query flag** — cleaner than per-component onMount.
10. **Add `generate:types` npm script + committed `directus-schema.ts`**.

### Agent D — Patterns to ADOPT

| # | Pattern | Sub-slice | Source | Effort | Template-worthy |
|---|---|---|---|---|---|
| 1 | **p-queue + fetch-retry in DirectusAdapter** | F or P5 (M2A hotspot) | directus-labs/starters | S | ✓ |
| 2 | **Schema-driven type generation** | F | directus-sdk-typegen | M | ✓ CRITICAL |
| 3 | **Skeleton-records-then-full-data seed** | P1 (projects first M2M) | directus-template-cli | M | ✓ |
| 4 | **`scripts/lib/` shared SDK + auth + util** | F | template-cli | S | ✓ CRITICAL |
| 5 | **One-file-per-resource fixtures** | F (convention before P1-P5) | directus-templates | S | ✓ |
| 6 | **`DirectusError` class + typed parsing** | F or P1 | template-cli | S | ✓ |
| 7 | **Public-policy permissions as seed fixture** | Close (D10 formalizes) | template-cli + directus-templates | M | ✓ |
| 8 | **Directus asset URL helper + preset constants** | 18d (asset pipeline) | starters | S | ✓ |

### Agent D — Patterns to CONSIDER

- **directus-sync** for schema authoring (`directus/collections/*.json`, `roles.json`, etc.). L-effort. Requires extension install — D11 conflict. Alternative: `directus-schema-sync` without extension.
- **Visual-editing sessionStorage gate** — update spec D4 wording.
- **CI Docker image caching** — save ~30s per run.
- **`fetchSiteData` pattern in +layout.server.ts** — globals/nav loaded once.
- **`p-queue` + retry in scripts-side** too (mirror of #1 for seed writes).

### Agent D — Anti-patterns to AVOID

- Nuke-and-recreate as only mode.
- Hand-rolled `Schema` interface duplication.
- Shell-loop permissions bootstrap in CI.
- Single monolithic snapshot.yaml.
- Per-page `apply()` calls (use one in afterNavigate).
- `EXTENSIONS_AUTO_RELOAD=true` in prod.
- Hardcoded CSP frame-src localhost-only (needs `https://*.vercel.app`).
- Leaving `ADMIN_EMAIL`/`ADMIN_PASSWORD` set post-first-login.

### Agent D — Current 18a/18b patterns that are already good

1. Zod-validated fixtures with unit tests (no starter does this).
2. Pure-transform helpers exported for unit testing.
3. Entry-point guard (`if (import.meta.main)`).
4. Three-boundary test taxonomy.
5. Two-repo D12 boundary (starters are monorepo-only).
6. Hybrid port-by-port adapter flip (our invention).
7. CI workflow_dispatch prod-apply with destructive-diff review.
8. `REVISIONS_RETENTION=90d` + Content Versioning on all user collections.
9. Token rotation runbook in README.
10. `scripts/seed-presets.ts` separate from snapshot apply (correct since settings aren't schema).

### Agent D — Template-repo extraction plan (post-Slice-18)

**Name:** `yesito/directus-sveltekit-pro`. Two repos: `<template>-cms` + `<template>-web`. Full directory trees in the audit.

**Generalization strategy:** yesid.dev-specific strings → placeholders.
- `cms.yesid.dev` → `{{DIRECTUS_URL}}` (env-driven ✓).
- `yesid-dev-cms` ref in `contract-test.yml:60` → `{{CONSUMER_REPO}}`.
- `op://yesid-dev/directus-admin/credential` → `{{SECRETS_REFERENCE}}` + 1P/Vault/Doppler guide.
- `VERCEL_BYPASS_TOKEN` → keep (Vercel documented target; adapter guide for Netlify etc.).
- `SUPPORTED_LOCALES: ['en','fr','es']` → template default `['en']`.
- `fixtures/services.json` content → demo "Posts + Authors" (not actual services).

**Template CI self-testing:**
- Weekly cron: run schema-apply against latest `directus/directus:11.x` (not pinned); alert on break.
- Renovate or Dependabot for SDK + typegen + visual-editing.

### Agent D — Open questions

1. Adopt `directus-sync` now or Slice 19+? D11 conflict (extension).
2. `directus-sdk-typegen` (3rd-party) vs hand-rolled generator?
3. Monorepo post-Slice-18? Every starter is monorepo; two-repo is harder template sell.
4. Permissions as seed vs snapshot. Fix in F or Close?
5. Scheduled `pg_dump` backup (Neon PITR on paid)?
6. Rate-limit MCP ai-editor (RATE_LIMITER_* env vars)?
7. AVIF presets verification — Task 9 probe or Slice 19?

---

## End of audit

Combined output: ~30k words. Consolidated pick list presented separately in the brainstorming flow. This file is append-only reference; do not modify agent outputs.
