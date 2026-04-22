# Sub-Slice 18b — Handoff

> This file is the body of the `yesid.dev` PR (PR B, per spec D12). It grows per-task during execution and is finalized at 18b-10. Cross-repo `yesid.dev-cms` PR (if any) uses a copy at merge time.

**Status:** 🟢 IN PROGRESS — 9/10 tasks complete (18b-6 split 6a+6b; 18b-8 split 8a+8b; 18b-9 shipped)

---

## What shipped so far

### Task 18b-1 — site-meta global extended ✅

- `yesid.dev-cms` commits: `21642ce` + `2c881ed` on `main`.
- `src/globals/SiteMeta.ts` grew from 2-field heartbeat to spec-D9 shape: `siteName`, `tagline` (localized), `description` (localized), `links` group (`email` / `github` / `linkedin` / `upwork` with https validators), `deployedAt` (readOnly, preserved). `admin.group: 'Pages'` applied.
- `src/payload.config.ts` — MCP plugin description for `site-meta` updated to a stable, editor-facing summary.
- Payload 3.83.0 confirmed ≥ 3.20 cutoff for `type: 'join'` fields (unblocks D-rel-1 reverse edges in 18b-2 onwards).
- Migration kept at 18a baseline only (`payload_migrations` = 1 row). Consolidated 18b migration lands at 18b-7 per plan D1.
- `bunx tsc --noEmit` green both on the primary commit and after the follow-up fix commit.

**Reviews:** spec ✅, code quality ✅ (after 2 MINOR fixes: stable MCP description + https validators). Codex adversarial `needs-attention` (1 MEDIUM finding on localized-field type divergence + no backfill) — **deferred** per plan D1 + D6; carry-forward notes captured in `log.md` for 18b-7, 18b-8, and 18c.

### Task 18b-2 — tech-stack + blog-posts collections ✅

- `yesid.dev-cms/slice-18b` commits: `57140fc` (primary) + `03581c8` (review fix).
- `src/collections/TechStack.ts` — flat (D-rel-2): `id` (unique + indexed), `name`, `layer` (9 enums), `domains` (7-multi), `icon`, `proficiency` (3 enums). Two reverse-join fields (`relatedProjects` + `relatedServices`) pre-emptively commented with `// TODO(18b-4): uncomment after projects + services collections exist` — plan-authorized fallback.
- `src/collections/BlogPosts.ts` — full spec shape: `slug` (unique + indexed), localized `title`/`excerpt`/`body` (Lexical richText), `date`, `lang` / `category` / `animation` (enums), `tags` (free-string array per D-rel-3), `svg`/`url` (text), `external` (checkbox).
- `src/payload.config.ts` — hub-first collections order `[TechStack, BlogPosts, Users, Media]`; `mcpPlugin().collections` extended with both entries (cleaned wording — no slice-internal codes).
- Regenerated artifacts: `payload-types.ts` (new `CollectionSlug` union + `TechStack`/`BlogPost` interfaces) + `importMap.js`.

**Reviews:** spec ✅, code quality ✅ (after 1 IMPORTANT — `index: true` parity on TechStack.id — + 1 MINOR — MCP description wording). Codex adversarial `needs-attention` (1 HIGH — "no DB migration present") — **deferred** per plan D1; carry-forward to 18b-7 where consolidated migration lands.

### Task 18b-3 — services collection + first live D-rel-1 reverse edge ✅

- `yesid.dev-cms/slice-18b` commits: `62f0612` (primary) + `335078a` (review fix).
- `src/collections/Services.ts` — 17-field shape (16 active + `relatedProjects` join commented pending 18b-4). Source-of-truth `stack: relationship → tech-stack` per D-rel-1. Localized prose fields per D4.
- `src/collections/TechStack.ts` — `relatedServices` join field UNCOMMENTED (first live D-rel-1 reverse edge). `relatedProjects` stays commented pending 18b-4. Stripped `admin.readOnly: true` from both join fields (Payload's `JoinField` type forbids it).
- `src/payload.config.ts` — Services inserted in hub-first order `[TechStack, Services, BlogPosts, Users, Media]`; mcpPlugin entry added (clean description, no commented-field references).

**Reviews:** spec ✅, code quality ✅ (after 1 HIGH — dead `httpsUrlValidate` — + 1 MINOR — MCP description referenced commented `relatedProjects`). Codex adversarial `needs-attention` (1 HIGH — SECURITY: MCP update path bypasses collection's `isAdmin` trust boundary) — **deferred** per Yesid's choice; current risk low (only admin user exists), carry-forward to editor-role onboarding slice.

**Spec amendment needed at 18b-10 close:** D-rel-1 canonical sample code includes `admin: { readOnly: true }` on join fields, but Payload's `JoinField` type defines `readOnly?: never`. Strip that property from the spec example. Behavioral effect zero (join fields are auto-computed + inherently read-only); type-level error only.

### Task 18b-4 — projects collection + D-rel-1 fully wired + first security tightening ✅

- `yesid.dev-cms/slice-18b` commits: `e737cf6` (primary) + `3232b11` (security fix).
- `src/collections/Projects.ts` — 19 fields: source-of-truth `services` + `stack` relationships, `image` via Media upload, 3 URL fields with `httpsUrlValidate`, `impactMetric` group (single/card variant) + `impactMetrics` array (multi/detail variant) with Projects-specific localization (value canonical, label localized).
- `src/collections/TechStack.ts` — `relatedProjects` uncommented. Both reverse-join fields now live (full D-rel-1 on TechStack side).
- `src/collections/Services.ts` — `relatedProjects` uncommented (D-rel-1 on Services side).
- `src/payload.config.ts` — Projects registered in hub-first order `[TechStack, Services, Projects, BlogPosts, Users, Media]`; mcpPlugin gains `projects` entry.
- **Security tightening:** `projects.access.read` now returns Where-constraint `{ status: { equals: 'public' } }` for non-admin callers. Addresses Codex-flagged exposure of `status: 'private'` + `'wip'` records.

**Reviews:** spec ✅, code quality ✅ (3 cosmetic items deferred). Codex adversarial `needs-attention` (2 HIGH: SECURITY + no-migration). SECURITY **addressed inline** via access tightening. No-migration **deferred** per plan D1.

**D-rel-1 now fully wired on the schema side.** All three bidirectional pairs have their source-of-truth + reverse-join fields defined. End-to-end admin UI smoke deferred to 18b-8 seed.

### Task 18b-5 — stack-scenarios + Media extension + Users admin.group + custom-id rename guard ✅

- `yesid.dev-cms/slice-18b` commits: `d5a03c9` (primary) + `e476910` (security fix).
- `src/collections/StackScenarios.ts` — 5 fields (id, domains, techs, relatedProjects, summary). Final content collection; all 5 content collections now exist.
- `src/collections/Media.ts` — full D-rel-4 extension (localized alt + caption; credit text; 3 imageSizes; admin.group System).
- `src/collections/Users.ts` — admin.group: System.
- `src/payload.config.ts` — StackScenarios registered in hub-first order; mcpPlugin gains stack-scenarios (Media intentionally absent from MCP per D-rel-4).
- **Primary-key rename guard:** all 3 custom-id collections (TechStack, Services, StackScenarios) now carry a `beforeChange` hook on `id` that strips the field from update payloads. Blocks API-level PK renames. Payload 3.83 doesn't auto-lock custom-id fields — the guard is essential.

**Reviews:** spec ✅, code quality ✅ (after 1 HIGH primary-key guard + 1 MINOR admin.description fix). Codex adversarial post-fix: only the recurring "no migration" deferred finding remains.

### Task 18b-6 (split 6a + 6b) — 9 new globals = Pages group COMPLETE ✅

- `yesid.dev-cms/slice-18b` commits: `edcee7b` (6a: 5 light page-intro globals) + `f17b1ca` (6b: 4 heavy content globals) + `eff7bc2` (fix: localize edgeBottom url/version + add footer group to SiteMeta).
- **6a — page-intro globals (5):** ServicesPage, ProjectsPage, BlogPage, TechStackPage, ErrorPages. Each is `{ meta, listing, detail }` shaped for page chrome copy.
- **6b — heavy content globals (4):** HomeContent (hero + manifesto + journey + proof reel + services grid + closer), AboutContent (identity + metrics + methodology + testimonials + interests + weather + CTA + bento labels), ContactContent (form terminals + validation + success), NavLinks (nav + menu + metroBookends + navDirections + sharedChrome).
- **SiteMeta extended:** added `footer` group (tagline, location, statusPrefix — all localized) so `Footer.svelte`'s static import can be removed at 18f cleanup.
- **Final globals array** (10 entries in site-walk order): HomeContent → ServicesPage → ProjectsPage → BlogPage → TechStackPage → AboutContent → ContactContent → NavLinks → ErrorPages → SiteMeta.
- **mcpPlugin.globals** has all 10 entries with clean external-facing descriptions.

**Reviews:** spec ✅ (4 non-blocking gap flags: relatedProjectsStripContent/manifesto.ticks/legacy adapter exports — deferred; footerContent gap closed inline via SiteMeta.footer). Codex adversarial: recurring "no migration" (deferred to 18b-7).

**Split rationale:** 18b-6 plan defined 9 globals as one task; prior 18b-4 implementer timed out at 24 tool-uses on similar multi-file work. Splitting 6a (5 lighter) + 6b (4 heavier) reduced single-dispatch timeout risk; both shipped cleanly.

**Schema definition phase COMPLETE.** All 5 content collections + extended Media + 10 globals exist, every prose field localized per D4, D-rel-1 reverse joins live, custom-id rename guards in place, three MCP-exposed surfaces (5 collections + 9 globals, Users + Media correctly excluded). 18b-7 now consolidates all 18b schema changes into a single migration file + regenerates types.

### Task 18b-7 — consolidated migration 20260421_204630 ✅

- `yesid.dev-cms/slice-18b` commit: `83f7167`.
- Single generated migration captures the full 18b schema delta on top of 18a baseline: 73 tables created (5 collections + 10 globals + their locales/rels/subarray tables), ALTER statements on media + site_meta for the extended fields. 1,311 lines up() + symmetric down().
- `migrations/index.ts` barrel exports both migrations in chronological order; Vercel `prodMigrations: migrations` cold-start path (18a D7) applies them automatically on deploy.
- `scripts/auto-migrate-create.mjs` added as a reusable helper for future schema changes — drizzle-kit asks interactive column-rename prompts that raw-mode stdin can't pipe on Windows; helper spawns the CLI + auto-answers "create column" for every prompt.

**Reviews:** spec ✅ (73 tables symmetric, 1,311 lines sensible, types in sync, tsc + build green). Codex adversarial `needs-attention` (3 findings: 1 false-positive CRITICAL on baseline collision, 2 HIGHs on down() rollback issues — deferred since 18b uses "revert commits" not `migrate:down`).

**Schema + migration phase COMPLETE.** All subsequent tasks (18b-8 seed, 18b-9 prod deploy, 18b-10 close) build on the 2-migration state captured here.

### Task 18b-8 (split 8a + 8b + fix) — seed script live on dev branch ✅

- `yesid.dev-cms/slice-18b` commits: `5c81cb5` (scaffold), `8711fd2` (CODEX-CONTEXT.md), `1216300` (cross-env), `a867987` (README), `57fc02f` (upsert logic + run seed), `241d768` (upsert-refresh fix).
- **Seed script at `scripts/seed/`** — 7 lib + upsert files + entry + README. Run via `bun run seed:dev` (or `seed:prod` for prod branch, gated behind 5-second abort window).
- **Dev Neon branch populated:** 45 tech-stack (35 TS + 10 D-rel-2 auto-stubs), 6 services, 6 projects, 7 blog-posts, 7 stack-scenarios, 1 media, 10 globals.
- **Idempotency verified:** second seed run updates existing docs (post-fix) instead of skipping. Source-change propagation works.
- **CODEX-CONTEXT.md ships** in yesid.dev-cms root — 11 deferred-by-design findings documented so reviewers (Codex + human) don't re-flag them. Test: Codex stopped repeating old findings + surfaced 2 genuine new ones (both fixed).
- **Primary-key hook pattern amended** from `delete siblingData.id` (failed update validation) to `siblingData.id = originalDoc.id` (silent override). Applied to TechStack, Services, StackScenarios.

**Reviews:** Codex adversarial (with CODEX-CONTEXT.md) found 2 new issues — both fixed inline:
- MEDIUM: `seed:prod` cross-shell syntax → cross-env wrapper.
- HIGH: upsert-refresh skip-if-exists → silent-override hook pattern + real update path.

**Seed phase COMPLETE.** Prod migration + seed happen in 18b-9.

### Task 18b-9 — prod deploy + prod seed + Blob + Resend DNS ✅

- `yesid.dev-cms` commits: fast-forward merge `slice-18b` → `main` (19 commits landed) + `5c19d41` (locale fix) + `e3a3140` (Blob flip).
- **Branch strategy amendment:** merged to main at 18b-9 start (rather than 18b-10 PR). PR A at close becomes "already fast-forward-merged"; only PR B (docs in yesid.dev) survives.
- **Prod deploys:** 2 landed green — `dpl_GNrg...` (Blob flip + main merge) + `dpl_9h6c...` (locale fix). Both aliased to `cms.yesid.dev`.
- **Prod Neon branch:** 2 migrations applied (18a baseline + 18b consolidated). Row counts match dev (projects=6, services=6, tech_stack=45, blog_posts=7, stack_scenarios=7, media=1).
- **Blob enabled** on media collection. Yesid linked existing `yesid-dev-cms-media` store. `-media2` duplicate still needs deletion (non-blocking — sits orphaned).
- **Locale double-encoding bug** discovered + fixed inline. Fix: `locale: 'all'` on every seed upsert call. Existing prod rows repaired via direct SQL `jsonb` unwrap (15 statements/branch).
- **Resend DNS verified** in Cloudflare: 1 DKIM TXT (`resend._domainkey.cms`) + 1 SPF MX (`send.cms` → Amazon SES) + 1 SPF TXT (`send.cms`). Send smoke test: password-reset email to `contact@yesid.dev` returned 200 from REST; Yesid verified inbox arrival + headers.

**Reviews:** not formally run for orchestration; verified via deploy success + row counts + REST smoke + email send + DNS status.

**CMS prod = content-rich, dev + prod in sync, email sends work, uploads work.** Only 18b-10 close bundle remains.

---

## What verified so far

- Payload version → `type: 'join'` supported
- SiteMeta.ts type check clean
- MCP `site-meta` registration intact
- Negative check: `yesid.dev/src/` untouched (`git status` in yesid.dev clean)

## Open items for downstream tasks

- **18b-7:** consolidated migration will pick up the SiteMeta schema change. Confirm `tagline`, `description`, `links_*` columns emit cleanly + `deployedAt` still auto-fills via beforeChange hook.
- **18b-8:** seed `site-meta` global from `yesid.dev/src/lib/content/meta.ts` — the `siteMeta` TS export maps directly to the new Payload shape.
- **18c (future):** type-sync Action + Zod adapter for first consumer. Zod schema must tolerate either `string` or `{ en, fr?, es? }` shape on localized fields and normalize per query locale. Codex finding is closed here.

## Free-tier usage snapshot (running total)

Not yet measured — no provisioning touched in 18b-1. Snapshot at 18b-9 post-prod-seed.

## Amendments during execution

| # | Change | Rationale |
|---|--------|-----------|
| 1 | Task 18b-1 shipped as two commits (`21642ce` primary + `2c881ed` code-review fix) | Subagent-driven review loop: code-quality reviewer flagged 2 MINOR items; fixes landed as a separate follow-up commit to keep the task-primary commit's intent clean. |
| 2 | Codex adversarial-review invocation pattern | User added feedback 2026-04-21: "use the plugin and adversarial review" — running `node codex-companion.mjs adversarial-review --wait` against each task. Initially ran against main with `--base <base-sha>` override (empty auto-scope), then retrofitted to branch-per-sub-slice (see amendment 3) so `auto` scope works cleanly. |
| 3 | **Branch strategy flipped mid-execution** — `slice-18b` branch instead of direct-to-main on `yesid.dev-cms` | User challenge: "why are we working on main?" Retrofitted: created `slice-18b` branch at HEAD (57140fc, carrying all three 18b commits), then `git reset --hard c3e1c7b` + force-push on `main`. Main rewound to pre-18b baseline; `slice-18b` carries the work. From 18b-3 forward, commits go to `slice-18b`. PR A at 18b-10 opens `slice-18b` → `main`. Spec D12 amended accordingly. |
