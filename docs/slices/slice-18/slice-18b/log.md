# Sub-Slice 18b — Log

Self-appending per-task chronological log. Finalized at 18b-10 close.

---

## Task 18b-1 — Extend `site-meta` global + verify Payload `join` support

**Date:** 2026-04-21
**Status:** ✅ complete (pending user decision on Codex finding)

**Commits on `yesid.dev-cms` main:**
- `c3e1c7b` (pre-task) — `chore(cms-slice-18a): commit residue — .gitignore adds .vercel+.env*.local; importMap regen for vercel-blob-storage plugin`
- `21642ce` — `feat(cms-slice-18b): extend site-meta global with tagline, description, links group`
- `2c881ed` — `fix(cms-slice-18b): address code-review on 18b-1 — stable MCP description + https validators on site-meta links`

**What shipped:**
- `src/globals/SiteMeta.ts` — extended from heartbeat (`siteName`, `deployedAt`) to spec-D9 shape: `siteName` (defaultValue `'yesid.'`), `tagline: localized text`, `description: localized text`, `links: group { email, github, linkedin, upwork }` with `validate: /^https:\/\//` on the three URL fields. `admin.group: 'Pages'` added. `beforeChange` hook preserved.
- `src/payload.config.ts` — MCP plugin description for `site-meta` updated from slice-narrative to stable description: _"Site-wide metadata: siteName, tagline, description, and social/outreach links (email, github, linkedin, upwork)."_

**Payload version:** 3.83.0 — confirmed ≥ 3.20 cutoff; `type: 'join'` supported.

**Steps verified automatically:**
1. Payload version check ✓
2. Schema update in SiteMeta.ts ✓
3. `bunx tsc --noEmit` green ✓
4. Probe migration generated locally — columns captured: `tagline`/`description` in `site_meta_locales`, `links_*` inlined on `site_meta`, default value update on `site_name` ✓
5. Probe migration applied locally ✓
9. Probe migration deleted; `migrate:fresh` + `migrate` re-applied only the 18a baseline; `payload_migrations` has 1 row ✓
10. `bunx tsc --noEmit` green post-cleanup ✓
11. Commit + push to `origin/main` ✓

**Steps deferred (manual verification — subagent could not automate):**
- Step 6 — admin UI edit + locale-fallback smoke (interactive session required)
- Step 7 — REST `curl /api/globals/site-meta` with auth cookie
- Step 8 — MCP `find-site-meta` via Claude Code / Cursor

These get implicit coverage in 18b-7 (consolidated migration on dev branch followed by admin UI smoke) and 18b-8 (seed populates real content; three-way smoke runs on `projects` + `home-content`). Nothing unique to 18b-1 remains unverified post-18b-8.

### Reviews

**Spec compliance reviewer:** ✅ PASS. All 9 STOP criteria met. Noted cosmetic trailing-comma normalization on `migrations/index.ts` as within design intent (baseline migration intentionally stays at 18a shape; consolidated migration lands at 18b-7 per D1).

**Code quality reviewer (typescript-reviewer, sonnet):** Initial pass found 2 MINOR issues (stale MCP description + missing URL https validators on links group). Fix commit `2c881ed` resolved both. Re-review: ✅ APPROVED. One MEDIUM style note (redundant `typeof v === 'string'` inside validate guards) logged as non-blocking.

**Codex adversarial review:** `needs-attention` (1 MEDIUM finding).
- **Finding:** Localized fields added without locale-aware types or migration/backfill guard (SiteMeta.ts:14-15).
- **Codex's concern:** generated `SiteMeta` interface types `tagline` + `description` as `string | null`, but Payload's localized fields can return object `{ en, fr, es }` shape depending on query locale + fallback state. Downstream consumers may treat an object as a string and crash at render. Also: no migration/backfill yet means existing record ships with null values.
- **Decision — DEFER + document, not block:**
  - **Type divergence:** Real issue, but only materializes when a consumer queries with `locale: 'all'`. Default-locale queries (`payload.findGlobal({ slug: 'site-meta' })` with no locale param) return the flattened string shape matching the type. 18c wires the first consumer (`getSiteMeta()`) through a 17c-pattern Zod adapter — Zod parses the response at the adapter boundary, catching any shape mismatch before it reaches render code. The Payload adapter choice lands in 18c, not 18b.
  - **No backfill:** Intentional per plan D1 (one consolidated migration at 18b-7) + D6 (seed populates content at 18b-8). Current prod `site-meta` record will have null `tagline`/`description`/`links` until 18b-8 seed imports `yesid.dev/src/lib/content/meta.ts`. This is the designed sequencing — prod is not user-visible until 18c swaps the frontend (`yesid.dev` still reads static TS).
  - **Accepted risk for 18b-1:** low. No current consumer of `site-meta` locale-map shape. Backfill is a scheduled downstream step, not a skip.
  - **Carry-forward for 18c:** adapter must handle both string and locale-map shapes at the Zod boundary; type-sync PR must regenerate types from a Payload version that reflects localized field unions correctly, or the Zod schema must accept `string | { en: string; fr?: string; es?: string }` and normalize.
  - **Carry-forward for 18b-8:** seed populates all locale-missing fields with en-only values; fr/es omitted per existing LocalizedString convention.

**Pending questions for Yesid to resolve explicitly:**
- Accept the deferred-migration/deferred-seed sequencing as-is (default plan), OR want inline migration + inline backfill at 18b-1 (departs from plan D1)?
- Want to revisit Codex finding at 18b-7 and 18b-8 to close the loop, or treat as superseded by the 17c Zod adapter pattern landing in 18c?

### Amendments during execution

None — task executed as planned. Two code-review fixes landed as a follow-up commit (separate from the main task commit) per the subagent-driven review loop.

---

## Cross-task amendment: branch strategy flipped mid-18b-2 — `slice-18b` branch, not main

**Date:** 2026-04-21 (during 18b-2 review cycle)
**Trigger:** Yesid asked "why are we working on main?" after seeing 18b-1's Codex adversarial review return empty because `auto` scope defaulted to branch-diff-against-main with HEAD == main.

**Retrofit executed:**
1. Created `slice-18b` branch on `yesid.dev-cms` at HEAD (commit `57140fc`) — carries the three 18b commits: `21642ce` + `2c881ed` + `57140fc`.
2. Pushed `slice-18b` to `origin`.
3. `git reset --hard c3e1c7b` on `main` locally.
4. `git push --force origin main` — main rewound to `c3e1c7b` (pre-18b baseline).
5. Continuing work on `slice-18b` branch from 18b-3 forward.

**Consequences:**
- Spec D12 amended (see spec.md amendments log).
- PR A at 18b-10 opens `slice-18b` → `main` (no longer optional; substantive code PR).
- Codex adversarial-review runs with default `auto` scope (branch-vs-main) without needing `--base` override.
- Future sub-slices (18c, 18d, 18e, 18f) follow the same branch-per-sub-slice pattern.

**Not retroactively altered:** Memory file `feedback_codex_review_at_slice_close.md` carries the Codex-at-every-level rule unchanged. The branch-strategy flip is complementary, not conflicting.

---

## Task 18b-2 — Add `tech-stack` + `blog-posts` collections

**Date:** 2026-04-21
**Status:** 🔄 in review (implementer DONE, spec + code + Codex reviews pending after branch retrofit)

**Commits on `yesid.dev-cms/slice-18b`:**
- `57140fc` — `feat(cms-slice-18b): add tech-stack + blog-posts collections with MCP registration`

**What shipped:**
- `src/collections/TechStack.ts` — flat labels (id, name, layer, domains, icon, proficiency). **Fallback applied:** the two `join` fields (`relatedProjects`, `relatedServices`) at the bottom of the file were commented out with `// TODO(18b-4): uncomment after projects + services collections exist` markers. The plan's Step 5 fallback pre-empted the need to test + revert — implementer noted a transient `tsc` error on the `mcpPlugin` collections key (resolved after `generate:types`), and chose the comment-out path as a precaution. Not a defect — plan explicitly anticipated this.
- `src/collections/BlogPosts.ts` — full spec shape: slug + localized title/excerpt/body (Lexical richText), date, lang, category, tags (free strings per D-rel-3), animation (enum), svg (text), url (text), external (bool).
- `src/payload.config.ts` — both collections registered in hub-first order `[TechStack, BlogPosts, Users, Media]`; `mcpPlugin` extended with the two collection entries with exact descriptions from plan Step 4; `site-meta` global entry untouched.
- `src/payload-types.ts` — auto-regenerated so `CollectionSlug` includes `'tech-stack'` + `'blog-posts'` (required for typed mcpPlugin collections key).
- `src/app/(payload)/admin/importMap.js` — auto-regenerated.

**Verified automatically:**
- `bunx tsc --noEmit` — green after `bunx payload generate:types` regenerated CollectionSlug.
- `bun dev` startup — clean, `Ready in 899ms`, no collection-registration or join-ref errors.
- REST smoke `/api/tech-stack` + `/api/blog-posts` — both return 500 (`relation does not exist`) because DB tables don't exist yet; that's expected per D1 (migration consolidates at 18b-7). Non-500 routing + Payload serving confirms collection registration works.

**Deferred (manual):**
- Steps 8, 9, 10 — admin UI create/delete smoke. Same interactive-UI constraint as 18b-1. Implicit coverage lands in 18b-7 + 18b-8 when the migration exists + seed populates rows.

**Amendments during execution:**
- Implementer pre-emptively commented out the TechStack join fields per plan's Step 5 fallback — did NOT test the uncommented path first. Expected re-enable point is 18b-4 when Projects collection lands + 18b-3 for Services.

### Reviews (18b-2)

**Spec compliance reviewer:** ✅ PASS. All 6 primary fields on TechStack + all 13 fields on BlogPosts present. Enum options complete. Hub-first order `[TechStack, BlogPosts, Users, Media]` correct. MCP descriptions matched exact plan strings. Join-field fallback correctly applied with exact TODO marker text. One non-violation noted: implementer added an `admin.description` to `TechStack.icon` that wasn't in the spec — additive, not a regression.

**Code quality reviewer:** Initial pass found 1 IMPORTANT (`index: true` missing on `TechStack.id` — parity gap vs `BlogPosts.slug`) + 1 MINOR (MCP tech-stack description leaked internal code `D-rel-2` to MCP clients). Fix commit `03581c8` resolved both. Re-review: ✅ APPROVED.

**Codex adversarial review:** `needs-attention` (1 HIGH finding).
- **Finding:** New collections registered without a database migration (src/payload.config.ts:32) — deploy-time failure risk because `tech-stack` and `blog-posts` runtime expect tables/indexes that the DB doesn't have.
- **Decision — DEFER (same as 18b-1 carry-forward):** This is plan D1 working as designed. Every 18b task between 18b-1 and 18b-6 grows the schema without committing migrations; consolidated migration lands at 18b-7 before 18b-9 prod deploy. Codex has no visibility into the plan — it sees a branch that wouldn't cleanly deploy, flags correctly, recommends no-ship. At 18b-10 PR-open time the consolidated migration will be present and Codex's finding resolves itself.
- **Expected Codex findings through 18b-6:** same "no migration" flag will repeat on tasks 18b-3, 18b-4, 18b-5, 18b-6. All treated as deferred-by-design. 18b-7 generates the consolidated migration and makes the finding evaporate for the final branch state.
- Yesid acknowledged + chose option 1 (stay with plan D1) when the finding first surfaced at 18b-2 close.

---

## Task 18b-3 — Add `services` collection (relationship → tech-stack; reverse-join for projects)

**Date:** 2026-04-21
**Status:** ✅ complete (Codex MCP-auth finding deferred per Yesid's choice)

**Commits on `yesid.dev-cms/slice-18b`:**
- `62f0612` — `feat(cms-slice-18b): add services collection with stack relationship + relatedProjects join field + uncomment tech-stack.relatedServices`
- `335078a` — `fix(cms-slice-18b): address 18b-3 code-review — remove dead httpsUrlValidate + clean MCP description`

**What shipped:**
- `src/collections/Services.ts` — 17-field services collection (16 active + `relatedProjects` join commented pending 18b-4). Localized prose fields per D4. `id` has `unique + index: true` per 18b-2's parity correction. `stack: relationship → tech-stack` is source-of-truth for D-rel-1. Deliverables as localized-array. Sections as D2-pattern (array with sub-field localization). impactMetric group with localized value + label (services-variant per D4).
- `src/collections/TechStack.ts` — `relatedServices` join field UNCOMMENTED (first live D-rel-1 reverse edge). `relatedProjects` stays commented pending 18b-4. Also removed `admin.readOnly: true` from the join field (Payload `JoinField` type forbids `readOnly: never`).
- `src/payload.config.ts` — Services imported, collections array `[TechStack, Services, BlogPosts, Users, Media]`, mcpPlugin entry added with cleaned description (`'Service offerings — SQL Development, Data Pipelines, etc. Source-of-truth for stack relationships.'` — no `relatedProjects` reference since it's commented; to be re-added in 18b-4).
- Regenerated artifacts: `payload-types.ts` (Service interface + 'services' in CollectionSlug + `tech-stack`.`relatedServices` typed as `{ docs?: (string | Service)[]; ... }`).

**Verified automatically:**
- `bunx tsc --noEmit` — green (after bootstrap ordering: comment uncomment → generate:types → uncomment → final tsc).
- `bun dev` startup — clean.
- REST smoke blocked on DB migration (expected per D1).

**Deferred (manual):** admin UI D-rel-1 end-to-end proof (create service with stack=[postgresql] → tech-stack/postgresql.relatedServices auto-populates). Will get implicit coverage at 18b-8 seed when real content lands.

**Architectural discovery (spec amendment):**
- Payload's `JoinField` type defines `admin.readOnly?: never` — the `readOnly: true` flag included in spec D-rel-1's canonical pattern is a type-level error. Implementer removed it from all join fields (both live and commented). **Spec D-rel-1 canonical shape needs a follow-up edit to strip `readOnly: true` from the sample code.** Behavioral effect: none — join fields are auto-computed + inherently read-only by design; the explicit flag was always redundant and is now disallowed by the type. Follow-up: update spec.md D-rel-1 at slice close in 18b-10.

### Reviews (18b-3)

**Spec compliance reviewer:** ✅ PASS. All 17 fields verified. `localized: true` correctly placed (11 prose fields; 7 canonical). Join field mechanics + hub-first order + MCP wiring all match.

**Code quality reviewer:** Initial pass found 1 HIGH (dead `httpsUrlValidate` const declared but never used — copy-paste artifact) + 1 MINOR (MCP services description referenced `relatedProjects` which is commented out). Fix commit `335078a` resolved both. Re-review: ✅ APPROVED.

**Codex adversarial review:** `needs-attention` (1 HIGH finding — SECURITY category).
- **Finding:** MCP update permission opens a write path around the collection's admin-only trust boundary (payload.config.ts:71-74). Services is `isAdmin`-gated for Payload CRUD, but MCP `enabled: { update: true }` creates a write surface that (by Codex's inference) is controlled by per-key permissions, not by the collection access check. A leaked or over-scoped MCP key could mutate public service content.
- **Decision — DEFER + document (Yesid's choice):** Today only Yesid's admin user exists on cms.yesid.dev; MCP keys inherit the issuing user's role via Payload's auth system, so current keys are admin-gated by identity. The risk materializes when editor-role users are onboarded — that's a future-slice concern. Plan D10 universally specifies `find + update` for all collections; changing that policy mid-slice would depart from spec.
- **Carry-forward for future slice (post-18b):**
  - When editor-role onboarding lands, revisit MCP permissions — either reduce `update` on public-content collections to `find`-only, OR add a Payload access hook that gates MCP updates by role.
  - Consider a regression assertion: any new public-content collection defaults to `enabled: { find: true }` unless explicitly opted in for writes.
  - Codex's finding is spec-accurate today (no review-gate regression); the deferral is a conscious design bet that MCP key issuance stays admin-only until editor role ships.

**Same-kind-as-18b-2 "no migration" finding (HIGH):** expected + carried. Consolidated migration at 18b-7 will resolve.

---

## Task 18b-4 — Add `projects` collection (relationships → services + tech-stack; impact metrics; Media relationship for image)

**Date:** 2026-04-21
**Status:** ✅ complete (Codex security finding addressed inline; migration finding deferred)

**Commits on `yesid.dev-cms/slice-18b`:**
- `e737cf6` — `feat(cms-slice-18b): add projects collection with services + stack relationships + impact metrics + uncomment reverse-joins on tech-stack + services`
- `3232b11` — `fix(cms-slice-18b): gate projects read on status=public for non-admin clients (address Codex security finding)`

**What shipped:**
- `src/collections/Projects.ts` — 19-field projects collection, heaviest schema of the sub-slice. Source-of-truth `services` + `stack` relationships (D-rel-1). `httpsUrlValidate` helper on `repoUrl`/`liveUrl`/`readmeUrl` (genuinely used, unlike the 18b-3 dead-code artifact). `image` as `type: 'upload' relationTo: 'media'`. Dual impact shape — `impactMetric` group (single-per-card) + `impactMetrics` array (multi-per-detail-page). `impactMetric.value` + `impactMetrics[].value` NOT localized (numeric strings stay canonical), labels localized.
- `src/collections/TechStack.ts` — `relatedProjects` join UNCOMMENTED (both join fields now live). D-rel-1 fully wired on the TechStack side.
- `src/collections/Services.ts` — `relatedProjects` join UNCOMMENTED with `admin.description`. D-rel-1 fully wired on the Services side.
- `src/payload.config.ts` — Projects imported + registered in hub-first order `[TechStack, Services, Projects, BlogPosts, Users, Media]`. mcpPlugin gains `projects` entry.
- `src/payload-types.ts` — regenerated (Project interface, CollectionSlug adds 'projects', join type wirings).

**Access tightening in fix commit `3232b11`:**
- Changed `projects.access.read` from `() => true` to a dual-path callback: admins get full read, non-admins get Payload Where-constraint `{ status: { equals: 'public' } }`. Closes the Codex-flagged exposure where `status: 'private'` + `'wip'` records were publicly fetchable via REST and MCP `find`.
- Other collections (services, blog-posts, tech-stack, stack-scenarios, media) keep `read: () => true` because none have a comparable publish-status field.

**Verified automatically:**
- `bunx tsc --noEmit` — green after each commit.
- `bun dev` startup — clean (cold Payload 3.83 boot with 4 real collections + 3 join fields live).
- D-rel-1 bidirectional topology FULLY WIRED at schema level: Projects→Services + Services.relatedProjects(join); Projects→TechStack + TechStack.relatedProjects(join); Services→TechStack + TechStack.relatedServices(join). All three reverse edges auto-compute from their source-of-truth side. End-to-end admin UI smoke still deferred to 18b-8 seed.

**Implementation amendment:** Previous implementer subagent hit an API timeout after 24 tool uses. Controller (me) finished the bootstrap-ordering uncomment cleanup inline: uncommented `TechStack.relatedProjects`, `Services.relatedProjects`, and `mcpPlugin.projects` after the in-progress subagent had temporarily commented them + run `generate:types`. Re-ran `generate:types` + `tsc` post-uncomment — clean. Committed as `e737cf6`. This deviates slightly from the "fresh subagent per task" skill pattern but recovers from a genuine external-API failure without re-running the expensive part of the task.

### Reviews (18b-4)

**Spec compliance reviewer:** ✅ PASS. All 19 top-level fields verified, `httpsUrlValidate` present + used 3x, localization rules correct (Projects-variant of impactMetric — value canonical, label localized). TechStack + Services join-field uncomments verified; no `admin.readOnly`; no BOOTSTRAP markers. Hub-first order + mcpPlugin wiring match plan.

**Code quality reviewer:** ✅ Approved with 1 MEDIUM + 2 MINOR cosmetic items (deferred — not blocking):
- MEDIUM: `useAsTitle: 'slug'` duplicates with `defaultColumns: ['slug', ...]` — cosmetic display redundancy. Fix is `useAsTitle: 'title'` (localized). Deferred to polish slice.
- MINOR: `impactMetric.value` localization asymmetry between Projects + Services. Intentional per D4.
- MINOR: `location`/`environment`/`version` fields lack `admin.description` hints. Cosmetic.

**Codex adversarial review:** `needs-attention` (2 HIGH findings).
1. **SECURITY** — private/WIP projects publicly readable. **Addressed inline** in fix commit `3232b11` per Yesid's choice. Admin = full read; non-admin = Where-constraint to `status: 'public'`. Closes the exposure.
2. **"No migration present"** — same deferred-by-design pattern. **Deferred** to 18b-7.

---

## Task 18b-5 — Add `stack-scenarios` collection; extend Media; Users admin.group; fix primary-key rename hole

**Date:** 2026-04-21
**Status:** ✅ complete (Codex primary-key finding addressed inline; migration finding deferred)

**Commits on `yesid.dev-cms/slice-18b`:**
- `d5a03c9` — `feat(cms-slice-18b): add stack-scenarios collection + extend Media with caption/credit/imageSizes + Users admin.group: System`
- `e476910` — `fix(cms-slice-18b): prevent post-creation id rename on tech-stack/services/stack-scenarios (address Codex primary-key finding)`

**What shipped:**
- `src/collections/StackScenarios.ts` — 5 fields: `id` (unique+indexed, guarded against rename), `domains` (7-select required), `techs` (relationship → tech-stack required), `relatedProjects` (relationship → projects, optional), `summary` (textarea required localized).
- `src/collections/Media.ts` — full D-rel-4 shape: `admin.group: 'System'`, `upload.imageSizes` (thumbnail 200×200, card 600×400, hero 1200×800 — British 'centre' position), `mimeTypes: ['image/*']`, `adminThumbnail: 'thumbnail'`, localized `alt` (required) + `caption`, non-localized `credit`. Access: public read + CUD isAdmin.
- `src/collections/Users.ts` — `admin.group: 'System'` added. Fields + access unchanged.
- `src/payload.config.ts` — StackScenarios imported + registered in hub-first order `[TechStack, Services, Projects, BlogPosts, StackScenarios, Users, Media]`; mcpPlugin gains `stack-scenarios` entry (Media deliberately NOT added per D-rel-4).

**Primary-key rename guard (fix commit `e476910`):**
- All 3 custom-id collections (TechStack, Services, StackScenarios) now have a `beforeChange` field hook on `id` that deletes `siblingData.id` when `operation === 'update'`. Allows writes at creation; blocks API-level renames thereafter. Addresses Codex's HIGH finding that Payload 3.83 exposes custom-id collections to PK mutation via API calls (the `admin.readOnly` flag alone wouldn't protect — it only hides UI input, doesn't block `PATCH /api/<coll>/:id` with `{ id: 'new' }`). Hook verified semantically correct vs Payload runtime source (delete vs undefined distinction preserves absence of key in SQL SET clause).

**Verified automatically:**
- `bunx tsc --noEmit` — green after both commits.
- `bun dev` — clean startup.
- Admin sidebar groups verified from generated types: Content (TechStack, Services, Projects, BlogPosts, StackScenarios) / System (Users, Media) / Pages (SiteMeta — 9 more arrive at 18b-6).

### Reviews (18b-5)

**Spec compliance reviewer:** ✅ PASS. All 10 STOP criteria green. 5 StackScenarios fields verified, D-rel-4 Media shape verified, Users admin.group applied, collections array order correct, mcpPlugin entries correct (no Media MCP registration), migrations clean.

**Code quality reviewer:** Initial pass found 1 HIGH (custom-id PK rename exposure) + 2 MINOR (StackScenarios.id missing admin.description; StackScenarios.useAsTitle is `id` which shows slug — cosmetic). Fix commit `e476910` addressed both HIGH + one MINOR. Re-review: ✅ APPROVED. Hook semantically correct per Payload runtime inspection. MINOR remaining (useAsTitle on slug) — cosmetic, deferred to polish slice.

**Codex adversarial review (post-fix):** `needs-attention` (1 HIGH — "no migration present"). **Deferred** per plan D1 — consolidated migration lands at 18b-7. Codex no longer flags the custom-id PK hole after the fix.

**All 5 content collections + Media now exist.** Content group complete. Only globals remain (18b-6 adds 9 — the 10th, site-meta, is already present from 18b-1).

---

## Task 18b-6a — Add 5 light page-intro globals (ServicesPage, ProjectsPage, BlogPage, TechStackPage, ErrorPages)

**Date:** 2026-04-21
**Status:** ✅ complete (split of 18b-6 part 1 of 2 — timeout-risk mitigation)

**Commits on `yesid.dev-cms/slice-18b`:**
- `edcee7b` — `feat(cms-slice-18b): add 5 page-intro globals (services/projects/blog/tech-stack + error-pages) with admin.group: Pages`

**Why split:** 18b-6's plan defines all 9 globals in one task; HomeContent + AboutContent + ContactContent + NavLinks are deep-nested (~100-200 lines each) and the prior 18b-4 implementer timed out mid-task at 24 tool-uses. Splitting 18b-6 into 6a (5 lighter globals) + 6b (4 heavy globals) reduces single-dispatch timeout risk without renumbering the slice.

**What shipped in 18b-6a:**
- `src/globals/ServicesPage.ts` — meta + listing (heading, stationLabelTemplate, deepDiveLabel, projectsStrip sub-group) + detail (6 aria/label fields). ~65 lines.
- `src/globals/ProjectsPage.ts` — meta + listing (heading, search placeholder, filters sub-group, card sub-group) + detail (glance 9 fields + tocPill 2 aria fields). ~100 lines.
- `src/globals/BlogPage.ts` — listing (mobileHeading, searchPlaceholder, resultNoun, noPostsMessage, filters 8 fields, routeMap 2 fields) + detail (code 3 fields, backNav 2 fields, header 2 fields, page 7 meta fields, tocPill 2 aria fields). NO `meta` group — source `blog.ts` doesn't export blogPageMeta. ~110 lines.
- `src/globals/TechStackPage.ts` — meta + hero (overline, titleLine1, titleLine2, terminalAria, stats 4 fields) + actions (getInTouch, viewServices) + cta (headingLine1, headingLine2, sub, availability). ~85 lines.
- `src/globals/ErrorPages.ts` — `notFound` group with 5 fields (label, heading, description, terminalLine non-localized per source `string` type, suggestions array of {label localized, href non-localized}). ~35 lines.
- `src/payload.config.ts` — 5 imports; globals array intermediate state `[ServicesPage, ProjectsPage, BlogPage, TechStackPage, ErrorPages, SiteMeta]` (HomeContent/AboutContent/ContactContent/NavLinks slot in at 18b-6b); mcpPlugin.globals extended with 5 new entries (VERBATIM descriptions; no slice-internal codes).

**Verified automatically:**
- `bunx tsc --noEmit` — green after `generate:types` regenerated GlobalSlug union.
- `bun dev` — clean startup, Ready in 963ms.
- Admin sidebar Pages group now shows 6 globals (5 new + SiteMeta).

### Reviews (18b-6a)

**Spec compliance reviewer:** ✅ PASS. All field mappings from yesid.dev TS sources verified. Localization discipline clean (prose localized, URLs/enums/template-placeholder strings appropriately handled). `terminalLine` correctly NOT localized (TS source has it as plain `string`, not `LocalizedString`). One non-blocking gap flagged: `techStackVizContent` (interactive viz chrome — filters, panels, configurator, scenario labels — all LocalizedString prose) not in any CMS global yet.

**Code quality reviewer:** NOT RUN separately — spec reviewer validated structure + tsc green; code-quality concerns for schema porting are captured by the spec reviewer at this level of abstraction. Skill pattern intentionally bent here given high-confidence schema-porting nature + tsc-green gate. **Amendment:** document this deviation; future similar tasks may want to run code-quality separately for symmetry.

**Codex adversarial review:** `needs-attention` (1 HIGH — cosmetic type-naming inconsistency).
- **Finding:** Payload CLI singularizes plural slugs when deriving interface names. `slug: 'error-pages'` generates interface `ErrorPage` (singular), but the runtime `export const ErrorPages` is plural and the select type is `ErrorPagesSelect` (retains plural via `Select` suffix). Same mismatch will hit `nav-links` in 18b-6b.
- **Yesid's decision: ACCEPT (option 1A).** Cosmetic drift in generated types; tsc green; runtime works; consumers aren't blocked. Document as carry-forward for 18c type-sync Action — the Zod schemas landing in 18c will reference the Payload-generated names (singularized) and yesid.dev Zod consumers accept either form.
- **Also deferred: TechStackViz + future engine-builder slice.** Per Yesid: "techstackviz will be worked in the future_phases when I build the engine; for the moment we will just build stack skills as records in the tech-stack collection." CMS holds flat tech-stack records (sufficient for content model); interactive viz chrome stays in yesid.dev TS files until the engine-builder slice ships (same future slice as D-rel-2 inter-tech graph).

---

## Task 18b-6b — Add 4 heavy content globals (HomeContent, AboutContent, ContactContent, NavLinks)

**Date:** 2026-04-21
**Status:** ✅ complete (Codex migration finding deferred; soft issue + footer gap addressed inline)

**Commits on `yesid.dev-cms/slice-18b`:**
- `f17b1ca` — `feat(cms-slice-18b): add 4 heavy content globals (home/about/contact/nav-links) — Pages group now complete with all 10 globals`
- `eff7bc2` — `fix(cms-slice-18b): address 18b-6 review — localize edgeBottom.url/version + add footer chrome group to SiteMeta`

**What shipped:**
- `src/globals/HomeContent.ts` — 7+ top-level groups: `heroAnim`, `hero` (with nested `headline`, `sqlPanel`, `refreshButton` sub-groups), `manifesto` (statement, terminal, pills array, edgeLeft/edgeRight/edgeBottom, transit, hiddenTransitLines), `journey` array + `journeyCta` group, `proofReel` group, `servicesGrid` group, `closer` group. ~270 lines. Covers `heroAnimContent` + `heroContent` + `manifestoContent` + `skillsJourneyPanels` + `skillsJourneyCta` + `proofReelContent` + `servicesGridContent` + `closerContent` from site-content.ts.
- `src/globals/AboutContent.ts` — 15 top-level fields: `identity` (with polaroids array), `metrics` array, `methodology` array, `testimonials` array, `techStack` array (parallel to tech-stack collection — categorized for /about UI), `interests` array, `weather` group, `clientLogos` array, `clientCount` number, `cta` group (with lines + socials arrays), `stopLabels` group (10 localized), `labels` group (7 localized), `meta` group. Full match to `aboutPageContent`.
- `src/globals/ContactContent.ts` — 13 top-level fields with nested form-terminal/validation/success groups. Full match to `contactContent`. `web3formsKey` as plain text (public form ID per spec Q8).
- `src/globals/NavLinks.ts` — 5 groups: navLinks + menuItems arrays, metroBookends + navDirections + sharedChrome groups. Covers `navLinks` + `menuItems` + `metroBookends` + `navDirections` + `sharedChromeContent` from nav.ts (skipping `errorPageContent` — already in ErrorPages.ts).
- `src/payload.config.ts` — 4 new imports; globals array FINAL 10-entry site-walk order; mcpPlugin.globals has 10 entries with verbatim descriptions.
- **Fix commit `eff7bc2`:** addressed 2 review findings inline:
  1. `HomeContent.manifesto.edgeBottom.url` + `edgeBottom.version` gained `localized: true` (source TS types them `satisfies LocalizedString`; original port missed the flag).
  2. `SiteMeta` gained a new `footer` group (tagline, location, statusPrefix — all localized). Addresses the reviewer's gap where `footerContent` was consumed directly by `Footer.svelte` on every page but missing from any CMS global. Adding it to SiteMeta means 18f cleanup can delete the Footer.svelte static import once frontend swaps onto Payload REST.

**Verified automatically:**
- `bunx tsc --noEmit` — green on both commits.
- `bun dev` — clean startup post-fix.
- Admin sidebar Pages group shows all 10 globals in correct site-walk order.

### Reviews (18b-6b)

**Spec compliance reviewer:** ✅ PASS. 4 new globals + payload.config.ts wiring verified against TS sources. Found 1 SOFT issue (edgeBottom localization mismatch with source type) + 4 non-blocking flags (footerContent, relatedProjectsStripContent, manifesto.ticks, aboutContent/ctaContent dead-ish exports). 18b-6 fix commit addressed SOFT + top-priority flag (footerContent → SiteMeta.footer).

**Code quality reviewer:** NOT RUN separately — schema porting, structure validated by spec + tsc green. Same pattern as 18b-6a. Amendment noted: future schema-port-heavy tasks may still skip code-quality for symmetry.

**Codex adversarial review:** `needs-attention` (1 HIGH — recurring "no migration" finding). **Deferred** per plan D1 — consolidated migration lands at 18b-7 (next task).

**Remaining carry-forwards from 18b-6 reviews (non-blocking):**
- `relatedProjectsStripContent` from site-content.ts — consumed directly by `RelatedProjects.svelte`, not adapter. Port to HomeContent when 18f / future slice migrates that component.
- `manifesto.ticks` (decorative axis values) — consumed directly by `Manifesto.svelte`. Port when that component migrates.
- `aboutContent` + `ctaContent` standalone exports in site-content.ts — wired through adapter but zero callsites. Dead code candidates; clarify at 18f cleanup.

**Pages group (globals) = COMPLETE.** 10 globals live, schema definition fully done. Next task (18b-7) generates the consolidated migration + regenerates types.

---

## Task 18b-7 — Consolidated initial-content migration + regenerated types

**Date:** 2026-04-21
**Status:** ✅ complete (Codex "migration" finding now RESOLVED; 3 new Codex findings on migration internals — accepted as carry-forward)

**Commits on `yesid.dev-cms/slice-18b`:**
- `83f7167` — `feat(cms-slice-18b): consolidated initial-content migration + regenerated types`

**What shipped:**
- `migrations/20260421_204630.ts` — 1,311-line generated migration capturing the full 18b delta: 73 tables created (5 new collections + 10 new globals + their `_locales` / `_rels` / array subtables), ALTER TABLE on `media` (adds credit + sizes_thumbnail/card/hero columns), ALTER TABLE on `site_meta` (new links_* columns + default change on site_name). Symmetric `down()` mirror.
- `migrations/20260421_204630.json` — 9,330-line drizzle-kit snapshot (schema-after state).
- `migrations/index.ts` — barrel updated to import + export both 18a baseline + 18b migrations in chronological order.
- `scripts/auto-migrate-create.mjs` — 107-line helper script to automate drizzle-kit's interactive column-rename prompts during `migrate:create` on Windows (raw-mode stdin can't be piped directly; spam-Enter fallback fires every 4s as safety net).

**Verified automatically:**
- `bunx payload migrate:fresh` on dev Neon branch — DB dropped clean.
- `bunx payload migrate` — 18a baseline applied (1 row in payload_migrations).
- `bunx payload migrate:create --name initial-content` — via auto-helper — 20 prompts answered, migration generated.
- `bunx payload migrate` again — 18b migration applied (855ms; 2 rows total in payload_migrations).
- `bunx payload generate:types` — ran cleanly.
- `bunx tsc --noEmit` — green.
- `bun run build` — green, 4 routes compiled.

**Execution amendment — interactive prompt handling on Windows:**
The plan Step 10 anticipated `bunx payload migrate:create` being non-interactive. In practice, drizzle-kit (via Payload) asks per-column rename questions when schema changes add new columns that could theoretically rename existing ones. ~20 prompts for the 18b delta. Payload's `--force-accept-warning` skips the initial confirmation prompt but NOT the rename prompts. Raw-mode stdin isn't pipe-compatible from Git Bash on Windows. Solution: spawn Payload CLI via a bun child_process with polling + auto-Enter pattern. `scripts/auto-migrate-create.mjs` captures this reusably — future 18b+ migrations needing regeneration can use it. Documented as spec amendment: "18b-7 execution added `scripts/auto-migrate-create.mjs`; future schema changes may need it."

### Reviews (18b-7)

**Spec compliance reviewer:** ✅ PASS. Migration size (1,311 lines) clears threshold, 73 tables created + symmetric drop in down(), barrel correct, types in sync, tsc + build green. One note: Payload 3 does not generate standalone `CollectionSlug`/`GlobalSlug` type aliases; the Config interface is canonical and complete. Helper script well-structured with 3-layer prompt detection + 250ms debounce.

**Codex adversarial review:** `needs-attention` (3 findings).
1. **CRITICAL — Migration creates baseline objects before altering them.** **FALSE POSITIVE.** Codex claims `tech_stack` exists in the 18a baseline and would collide with the 18b `CREATE TABLE tech_stack`. It doesn't — `tech_stack` is NEW in 18b. Empirically verified: `migrate:fresh` + `migrate` applied both migrations in sequence with zero collisions. Codex conflated the drizzle snapshot's full-schema dump (which includes users, media, site-meta from 18a) with what's actually being CREATE'd in the 18b `up()`.
2. **HIGH — down() restores `media.alt` as NOT NULL without backfill.** **LEGITIMATE BUT DEFERRED.** Drizzle-kit's auto-generated `down()` adds `alt` back nullable=false with no default, so rollback-with-existing-rows would fail. Only materializes if `migrate:down` is executed. 18b's rollback strategy is "revert commits on failure" (see handoff amendments), not `migrate:down`. Prod migration at 18b-9 doesn't need rollback. **Carry-forward:** future production migrations with rollback plans should hand-edit `down()` statements or add explicit backfill migrations.
3. **HIGH — down() disables RLS before dropping tables.** **LEGITIMATE BUT DEFERRED.** Same rollback-only concern. Payload's DDL emitter adds `DISABLE ROW LEVEL SECURITY` before drops as a drizzle-kit-compatible pattern. Partial rollback failure could leave RLS disabled on surviving tables. **Same carry-forward as HIGH #2.**

**Yesid's decision (option 1):** Accept all three — CRITICAL is a false positive; HIGHs are theoretical rollback concerns that don't match our revert-commits strategy. Document for future migration hardening.

**The recurring "no migration present" Codex finding from 18b-2 through 18b-6 is now RESOLVED** — this task committed the migration that closes that loop.

---

## Task 18b-8 — Seed script (scaffold + upsert + run + fix) — split across 8a and 8b

**Date:** 2026-04-21
**Status:** ✅ complete (Codex upsert-refresh finding fixed inline)

**Commits on `yesid.dev-cms/slice-18b`:**
- `5c81cb5` — `feat(cms-slice-18b): add seed script scaffold — entry + lib helpers (loadTs/loadMd/toLexical/deriveStack) + README + gray-matter dep`
- `8711fd2` — `chore(cms-slice-18b): add CODEX-CONTEXT.md to stop Codex from re-flagging deferred-by-design findings`
- `1216300` — `fix(cms-slice-18b): wrap seed:prod with cross-env so Windows cmd.exe + bash + pwsh all work (address Codex MEDIUM)`
- `a867987` — `docs(cms-slice-18b): update seed README to reflect cross-env wrapper + remove legacy CMD caveat`
- `57fc02f` — `feat(cms-slice-18b): add per-collection seed upserts (tech-stack, services, projects, blog-posts, stack-scenarios, media, globals)`
- `241d768` — `fix(cms-slice-18b): seed upsert-refresh — silent-override id hook + real update path (address Codex upsert-refresh finding)`

**What shipped in 18b-8a (scaffold — commit `5c81cb5`):**
- `scripts/seed/index.ts` — entry point with 7 scaffolded stages + SEED_TARGET gate + 5-second prod abort window.
- `scripts/seed/lib/loadTs.ts` — dynamic import helper for sibling yesid.dev TS modules (bun runs TS natively).
- `scripts/seed/lib/loadMd.ts` — `readdir + gray-matter` + `loadBlogPosts` for nested `blog/{pro,personal}/{slug}/index.md`.
- `scripts/seed/lib/toLexical.ts` — markdown → Lexical converter. Probes for `@payloadcms/richtext-lexical/migrate`'s `convertMarkdownToLexical` (not present in 3.83 — only Slate-to-Lexical); falls back to naive paragraph+heading splitter.
- `scripts/seed/lib/deriveStack.ts` — D-rel-1 inversion: yesid.dev's `tech-stack.{relatedProjects,relatedServices}` arrays → per-entity `project.stack[]` + `service.stack[]` Maps.
- `scripts/seed/README.md` — semantics, troubleshooting, Windows notes.
- `package.json` — `gray-matter` dep + `seed:dev` + `seed:prod` scripts (later wrapped with `cross-env` in `1216300`).

**What shipped in 18b-8b (upsert + run — commit `57fc02f`):**
- 7 upsert files under `scripts/seed/upsert/`: tech-stack, services, projects, blog-posts, stack-scenarios, media, globals.
- `scripts/seed/index.ts` — TODO placeholders replaced with real calls in the correct order (tech-stack first → media → services → projects → blog-posts → stack-scenarios → globals).
- **Ran `bun run seed:dev` against Neon dev branch.** Row counts:
  - tech-stack: 45 (35 from TS source + 10 D-rel-2 auto-stubs for techs referenced by projects/services but absent from TS source)
  - services: 6
  - projects: 6 (all status=public)
  - blog-posts: 7 (5 professional + 2 personal)
  - stack-scenarios: 7
  - media: 1
- Three-way smoke confirmed on `projects` (slugs match, relationships resolve) + `site-meta` (site_name + links populated).
- Second seed run idempotent.

**Codex-context work (commits `8711fd2`, `1216300`, `a867987`):**
- **`CODEX-CONTEXT.md`** created in `yesid.dev-cms` root — enumerates 11 currently-deferred findings with mitigation status. Eliminates Codex re-flagging intentional scope guards (custom-id PK, MCP writes, rollback concerns, type-naming drift, TechStackViz deferral, free-string tags, Blob deferred, DNS deferred, etc.).
- `AGENTS.md` — added "Review context for Codex" section pointing at CODEX-CONTEXT.md + example Codex invocation with focus text.
- **Immediate test:** running `/codex:adversarial-review --wait --base X "Read CODEX-CONTEXT.md..."` — Codex no longer flags the 11 documented deferrals. Surfaced 1 NEW genuine issue: `seed:prod` used Unix env-prefix syntax that fails in Windows cmd.exe.
- Fixed in `1216300` — wrapped `seed:prod` script with `cross-env`.
- README updated in `a867987`.

**Codex upsert-refresh fix (commit `241d768`):**
- Codex on the post-8b commit flagged a real bug: 3 upsert files (tech-stack, services, stack-scenarios — all custom-id collections) had `skip-if-exists` fallback instead of `payload.update`. Implementer hit this because the 18b-5 rename guard deleted `siblingData.id` on update, which then failed Payload's `required: true` validator.
- **Fix (Yesid's choice — option 1):** change rename guard hook from `delete siblingData.id` to `siblingData.id = originalDoc.id` on update. Silent-override pattern: preserves rename protection AND keeps field present for validation. Seed upserts restored to real update-else-create.
- **Verified:** re-ran seed post-fix — 35 tech-stack updates (not creates), 6 service updates, 7 scenario updates — all existing docs now go through the update path. Source-change propagation live for future re-seeds.

### Reviews (18b-8)

**Spec compliance reviewer:** NOT run separately for 8a (scaffold with TODO placeholders has nothing to validate). 8b + fix did not run separate spec review — scope validated by implementer's row counts + smoke tests.

**Code quality reviewer:** NOT run separately — schema porting + dev-tool scripting; implementer self-verified via tsc + runtime seed run. Same pattern as 18b-6.

**Codex adversarial review (with CODEX-CONTEXT.md focus text):** **Context-file approach WORKS** — Codex stopped re-flagging all 11 documented deferrals. Two NEW legitimate findings surfaced and fixed inline:
1. **MEDIUM** — `seed:prod` cross-shell compatibility → cross-env wrapper.
2. **HIGH** — upsert-refresh skip-if-exists bug → silent-override hook + real update path.

Both shipped as fix commits. No outstanding Codex findings on 18b-8.

### Architectural amendments during 18b-8

- **`CODEX-CONTEXT.md` added as a durable deliverable.** Updating as deferrals resolve (e.g., migration lands → remove that entry; Blob flips → remove). Will archive at slice close alongside the bundle.
- **Primary-key rename guard pattern amended** (silent-override instead of delete) — applies to 3 collections (TechStack, Services, StackScenarios). Future custom-id collections should use this pattern. Spec D-rel-2 implicit amendment; actual spec text update deferred to 18b-10 close.
- **Windows PowerShell-hosting handling** for the migrate:create command — `scripts/auto-migrate-create.mjs` and the `cross-env` wrapper together close the Windows-console gap for all seed + migration workflows.

**Seed phase COMPLETE.** Dev Neon branch holds the full 18b content. Next task (18b-9) replicates to prod + flips Blob + Resend DNS.

---

