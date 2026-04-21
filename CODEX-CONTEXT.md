# Codex Review Context

> **Read this BEFORE running adversarial-review.** This file lists design decisions + intentional scope guards that are NOT defects. Do not re-flag them.

This repo is in the middle of **Slice 18b — Content Model + Seed** (see `../yesid.dev/docs/slices/slice-18/slice-18b/` for the full bundle). The plan's design decisions explicitly defer certain concerns to later tasks or later slices. Findings that map to these deferrals are not actionable and don't need to be raised again.

---

## Currently deferred by design — do NOT flag

### 1. Custom `id` field as primary key on tech-stack / services / stack-scenarios collections

**Context:** 3 collections (`tech-stack`, `services`, `stack-scenarios`) declare a user-defined `{ name: 'id', type: 'text' }` field. Payload 3 uses this as the primary key, replacing the default serial ID. This matches yesid.dev's TS source where items have natural-key `id` values (e.g. `id: 'postgresql'`).

**Already-applied mitigation:** each of these 3 collections has a `beforeChange` field hook on `id` that strips `siblingData.id` when `operation === 'update'`, blocking API-level primary-key renames. Verified semantically correct against Payload runtime in spec 18b-5 review.

**Don't re-flag:** "Custom id field as PK", "id field is editable", "potential rename hazard on custom-id collections" — already addressed.

### 2. MCP update permission on public-content collections

**Context:** `@payloadcms/plugin-mcp` exposes `find` + `update` on tech-stack, services, projects, blog-posts, stack-scenarios (plus all 10 globals except users + media). Payload's access control is `isAdmin` for CUD; MCP keys are issued per-user via admin UI and inherit the user's role.

**Current posture:** only Yesid's admin user exists on `cms.yesid.dev`. MCP keys are admin-gated by identity. Editor-role users are a future slice. When editor onboarding lands, MCP permissions will be revisited (either reduce `update` on public content or add role-gating hook).

**Don't re-flag:** "MCP update bypasses collection access control", "public content writable via MCP key leak" — carry-forward for editor-role slice.

### 3. Down-migration rollback safety on migration `20260421_204630`

**Context:** The 1,311-line consolidated migration's `down()` function:
- Drops `media.alt` then in rollback restores it as `NOT NULL` without a data backfill from `media_locales`.
- Issues `DISABLE ROW LEVEL SECURITY` before drops; a partial rollback failure would leave RLS disabled.

**Rollback strategy:** 18b uses **"revert commits"** (`git revert` + redeploy, which rolls Payload's schema knowledge backward; DB state is managed by re-running forward migrations or by branch rollback in Neon). **NOT** `migrate:down`. These findings only materialize if `migrate:down` is executed.

**Don't re-flag:** "down() would fail with existing media rows", "RLS disabled before drops in rollback" — carry-forward for production migrations with rollback plans.

### 4. Type-name drift in generated types (`ErrorPage` vs `ErrorPages`, `NavLink` vs `NavLinks`)

**Context:** Payload CLI singularizes plural slugs when deriving interface names. Global slug `'error-pages'` generates interface `ErrorPage`; `'nav-links'` generates `NavLink`. Runtime export + select-type names preserve the plural form. Cosmetic drift only; `tsc` is green; consumers aren't blocked.

**Don't re-flag:** "ErrorPage interface name doesn't match slug", "NavLink generated type mismatch", "type-naming inconsistency". Carry-forward for 18c type-sync.

### 5. TechStack "flat labels only" — no inter-tech graph

**Context:** Per spec D-rel-2, `tech-stack` collection is intentionally flat (id, name, layer, domains, icon, proficiency + join fields). No `connections[]` or `connectsTo` field. The TS source's `connectsTo` + `connectionNotes` are skipped at seed time.

**Deferred to:** future engine-builder slice. Tech-tech relatedness stays implicit (shared projects/services).

**Don't re-flag:** "tech-stack missing connections", "no inter-tech relationship modeling", "Build-Your-Stack graph missing" — by design.

### 6. `tags` as free strings, not a `tags` collection

**Context:** Per spec D-rel-3, `project.tags` + `blog-posts.tags` are `text hasMany` fields (free strings). No `tags` collection.

**Rejected alternative (documented):** promote to a collection with relationships. Rejected because < 30 distinct tags in use, no cross-collection references, easy to promote later.

**Don't re-flag:** "tags should be a collection", "tag drift risk with free strings" — by design.

### 7. TechStackViz content + other editor-facing TS exports not yet in CMS

**Context:** yesid.dev has several TS exports that are editor-facing content but aren't ported to Payload globals yet:
- `techStackVizContent` (interactive viz chrome) — deferred to engine-builder slice per Yesid.
- `relatedProjectsStripContent` (RelatedProjects.svelte direct import) — port when component migrates to CMS adapter path.
- `manifesto.ticks` (decorative axis values in Manifesto.svelte) — port when component migrates.
- `site-content.aboutContent` + `site-content.ctaContent` (wired via adapter but no current callsites) — possibly legacy; clarify at 18f cleanup.

**Don't re-flag:** "X content missing from globals", "editor-facing content not in CMS" — these are intentional scope guards, carry-forward for later slices.

### 8. `vercelBlobStorage.collections.media = false` (or omitted) in current commits

**Context:** Media collection exists + extends per D-rel-4 (imageSizes + caption + credit). But `vercelBlobStorage({ collections: { media: true } })` isn't flipped yet. Happens at 18b-9 (prod deploy task) alongside linking the existing `yesid-dev-cms-media` Blob store + deleting the duplicate `-media2`.

**Don't re-flag:** "Media uploads won't persist to Blob", "Blob plugin collections empty" — deferred to 18b-9 per plan.

### 9. Resend sender DNS (SPF + DKIM) not yet verified

**Context:** `resendAdapter` configured in payload.config.ts with sender `no-reply@cms.yesid.dev`. Domain DNS (SPF TXT + DKIM CNAMEs via Cloudflare) lands at 18b-9.

**Don't re-flag:** "Sender DNS unverified", "email will bounce from unauthenticated sender" — deferred to 18b-9.

### 10. Locale-aware type divergence on localized fields

**Context:** Payload's generated types for `localized: true` fields show shape `string | null` (default locale return shape). With `locale: 'all'` query, the runtime returns `{ en, fr?, es? }`. Type doesn't reflect the `locale: 'all'` shape.

**Mitigation plan:** 18c ships Zod schemas at the adapter boundary. Zod normalizes `string | { en, fr?, es? }` shape at consume time. Frontend never directly relies on the generated type.

**Don't re-flag:** "Localized type says string but may be object", "consumers may crash on locale-map" — mitigated by the planned adapter layer in 18c.

### 11. Custom-id rename hooks don't prevent INSERT with mismatched id

**Context:** The `beforeChange` hook strips `siblingData.id` when `operation === 'update'`. It does NOT prevent a CREATE operation from writing whatever `id` value the caller supplies — which is the correct design (creation is the only time the caller is meant to set the id).

**Don't re-flag:** "Hook doesn't prevent initial id writes", "tech-stack id is writable at create time" — by design.

---

## What IS worth flagging

The above is a scope guard, not an invitation to ignore problems. **Do flag:**

- **New** security issues not listed above (e.g. a newly introduced `read: () => true` on a collection with private-status records, parallel to the projects.status fix in 18b-4).
- **Correctness bugs** in TypeScript code, hook logic, or SQL that would break at runtime.
- **Spec compliance drift** — fields missing, wrong localization, relationship pointing at wrong collection, etc.
- **Accidental regressions** on hooks, access control, or MCP wiring that had been correctly set in earlier commits.
- **Unintentional scope bleed** — e.g. changes to `yesid.dev/src/` (strict negative check) or new collections not in the plan.

---

## How to invoke Codex with this context

```bash
cd yesid.dev-cms
node "$CLAUDE_PLUGIN_ROOT/scripts/codex-companion.mjs" adversarial-review --wait --base <pre-task-sha> \
  "Read CODEX-CONTEXT.md first for deferred findings. Do not re-flag items listed there."
```

Focus text (everything after flags) is passed to Codex as extra instructions. The repo file `CODEX-CONTEXT.md` is part of the review context by default.
