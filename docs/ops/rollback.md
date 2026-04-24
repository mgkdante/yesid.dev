# Rollback procedures

> Written in Slice 18 18c Task 53. Covers the four failure modes that can hit `cms.yesid.dev` + `yesid.dev`: schema drift, bad seed data, destructive data loss, and a consumer-side port flip regression. Each section is a self-contained runbook — read top-to-bottom and execute.

## Decision tree

```
something broke after a deploy
├── live routes 5xx or 404?        → § 4 (port flip revert)
├── content looks wrong but visible? → § 2 (seed revert)
├── editors can't save? schema broke? → § 1 (schema revert)
└── data was deleted / corrupted?   → § 3 (Neon PITR)
```

## 1 · Schema revert (directus-sync)

**When:** directus-sync push introduced a bad collection/field/permission change. Data Studio shows errors, new fields missing, or permissions look wrong.

**Rollback target:** prior git commit on `main` where schema was known-good.

### Steps

```bash
cd apps/cms

# 1. Confirm the bad commit
git log --oneline apps/cms/directus/ | head -10

# 2. Checkout the directus/ directory at the known-good commit
git checkout <good-sha> -- directus/

# 3. Push to prod (reverts schema)
$env:DIRECTUS_URL = "https://cms.yesid.dev"
$env:DIRECTUS_ADMIN_EMAIL = op read "op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/username"
$env:DIRECTUS_ADMIN_PASSWORD = op read "op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password"
bun run sync:diff      # preview the revert
bun run sync:push      # apply

# 4. Commit the revert on main
cd ..
git add apps/cms/directus/
git commit -m "revert(cms): schema to <good-sha> — <reason>"
git push origin main
```

### What directus-sync can and cannot revert

| Change type | Revert semantics |
|---|---|
| Collection meta (`display_template`, `archive_field`, etc.) | ✅ Fully reversible |
| Field additions | ✅ Removes the field (but NOT the column's data) |
| Field deletions | ⚠️ Column + data already gone — data-side revert needs § 3 PITR |
| Permission rows | ✅ Fully reversible |
| Flows / operations | ✅ Fully reversible |
| Settings | ✅ Fully reversible |

**Key caveat:** directus-sync does NOT back up DATA. Only schema + config. A revert that removes a field does NOT restore the column's old values — those are gone. If data loss is in play, start at § 3 instead.

### Sanity check

```bash
# After push, diff should be empty:
bun run sync:diff
# ✅ Done!  (no changes)

# Health check the app:
curl -sI https://cms.yesid.dev/server/health | head -1
# HTTP/2 200
```

## 2 · Seed revert

**When:** a `bun run seed:<collection>` run wrote bad data (wrong fixture version, malformed transform). Content shows incorrect values on the live site.

**Precondition:** the seed script is idempotent + supports `--reset` (enforced by CONVENTIONS.md § 4).

### Steps

```bash
cd apps/cms

# 1. Restore the fixture to a known-good version
git checkout <good-sha> -- fixtures/<collection>.json

# 2. Set credentials (same env as sync:push)
$env:DIRECTUS_URL = "https://cms.yesid.dev"
$env:DIRECTUS_ADMIN_EMAIL = op read "op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/username"
$env:DIRECTUS_ADMIN_PASSWORD = op read "op://yesid-dev/thkyjj4lpbpkvdzm3tbkcltj6u/password"

# 3. Dry-run first
bun run seed:<collection> -- --dry-run

# 4. Reset + re-seed with the known-good fixture
bun run seed:<collection> -- --reset

# 5. Commit the fixture revert
cd ..
git add apps/cms/fixtures/<collection>.json
git commit -m "revert(cms fixtures): <collection> to <good-sha> — <reason>"
git push origin main
```

### --reset vs re-seed without reset

- **Without `--reset`:** upserts by ID. Fields present in fixture overwrite prod; fields absent in fixture are UNTOUCHED. Safe for partial fixes, but can leave stale fields if the prior bad seed added them.
- **With `--reset`:** deletes all rows in the collection, then re-creates from fixture. Nuclear but deterministic. Use when you suspect orphaned or partial rows from the bad seed.

**M2M circular FKs:** the seed lib's `loadSkeletonRecords` → `loadFullData` pattern handles circular references (e.g., projects ↔ services via `related_projects`). `--reset` still works, but takes ~2x as long due to the two-pass upsert.

## 3 · Data loss recovery (Neon PITR)

**When:** rows were accidentally deleted, a destructive seed ran against prod, or a DB-level migration corrupted data. The `directus_revisions` table (90-day retention per F18) may help for single-row revert, but row-count loss needs PITR.

### Precondition: Neon PITR retention

Neon default: **7 days** on free tier (yesid-dev-cms project). Production uses pooled connection string; PITR applies to the unpooled endpoint.

Check current retention:

```bash
# Via Neon MCP — see mcp__<neon-server>__describe_project tool.
# Or via dashboard: console.neon.tech → project → Settings → History retention.
```

### Steps

1. **Stop writes** — pause the Directus Railway service:

   ```bash
   # Railway dashboard → Directus CMS service → Settings → Pause service
   # OR via Railway MCP:
   #   mcp__Railway__link-service --serviceName "Directus CMS"
   #   (no direct pause-service MCP; use dashboard for this step)
   ```

2. **Create a PITR branch** in Neon at the target timestamp (just before the incident):

   ```bash
   # Via Neon CLI or dashboard:
   #   neonctl branches create --parent-branch main \
   #     --name rollback-<date> \
   #     --parent-timestamp "2026-04-24T18:00:00Z"
   # OR via Neon MCP: create_branch with parent_id + timestamp
   ```

3. **Point Directus at the PITR branch** — update Railway env var `DB_CONNECTION_STRING` to the new branch's pooled endpoint. Redeploy.

4. **Verify data integrity** — spot-check the affected collection via Data Studio. Confirm row counts match pre-incident.

5. **Decision point:**

   - **Happy with the PITR branch?** Promote to main: `neonctl branches set-default rollback-<date>` + update Railway env + redeploy.
   - **Need to merge recent legitimate writes from after the incident?** Complex — may require manual diff + replay. Likely faster to accept the data loss and forward-fix.

6. **Un-pause writes** and resume normal operations.

### What PITR recovers

- ✅ All DB rows as of the target timestamp (collections, translations, junctions, system tables)
- ✅ directus_files rows (metadata) — but NOT the actual asset bytes (stored in R2)

### What PITR does NOT recover

- ❌ R2 asset bytes — Cloudflare R2 does NOT have native PITR. If a file was deleted in R2, it's gone unless the R2 bucket has versioning enabled (it doesn't, as of 18c).
- ❌ Flow execution history after the PITR timestamp (but `directus_activity` rows ARE recovered)

### Mitigation: add R2 bucket versioning post-18c

Track in 18d — when the asset pipeline lands, enable R2 bucket versioning + lifecycle policy (7-day retention on non-current versions). Catches the delete-a-file case that PITR can't cover.

## 4 · Port flip revert (web-side single-line)

**When:** a service-port retrofit (18c) or a new port flip (18e onward) broke the live site. `/services/*` or another route returns 5xx / wrong content / blank pages.

**Rollback target:** the hybrid adapter in `apps/web/src/lib/adapters/index.ts` — flip one line from `directusAdapter.X` back to `staticAdapter.X`.

### Steps

```bash
cd apps/web/src/lib/adapters

# 1. Inspect the current hybrid assembly
cat index.ts
# export const adapter: ContentAdapter = {
#   services: directusAdapter.services,    // ← the line to flip
#   projects: staticAdapter.projects,
#   ...
# };

# 2. Flip to static for the failing port
```

```ts
// apps/web/src/lib/adapters/index.ts — single-line revert
export const adapter: ContentAdapter = {
  services: staticAdapter.services,   // REVERTED FROM directusAdapter.services
  projects: staticAdapter.projects,
  blog: staticAdapter.blog,
  meta: staticAdapter.meta,
  techStack: staticAdapter.techStack,
  content: staticAdapter.content,
};
```

```bash
# 3. Commit + deploy — Vercel redeploys on push to main
git add apps/web/src/lib/adapters/index.ts
git commit -m "revert(web): services port to staticAdapter — <reason>"
git push origin main

# 4. Confirm live site recovered
curl -sL -o /dev/null -w "HTTP %{http_code}\n" https://yesid.dev/services/sql-development
```

### Why this is the cheapest rollback

The static adapter (`staticAdapter`) is never deleted — it stays in the repo through every port flip. Each `index.ts` entry is independent: flipping one port back does NOT affect the others. No schema revert needed, no data change, no seed run.

**Cost:** one line of code + one deploy. Recovery time ≈ Vercel build duration (~60s).

### When to NOT revert

If the regression is fixable in <15 min (e.g., typo in a filter, missing field in fetch), fix-forward instead of reverting. Reverting a port flip after it's been live for hours risks losing accumulated edits in Directus (since the static adapter reads frozen `.ts` files, any post-flip edits won't be visible).

### Permanent revert

If a port flip reveals a deep design flaw, do NOT leave the static adapter in prod long-term. Open an issue, plan the re-flip in the next sub-slice (e.g., if 18e's projects port flip reverts, plan a 18e-patch to fix + re-flip before 18f starts). Static is a bridge, not a destination.

---

**Appendix A — references**

- Slice plan: [`../slices/slice-18/plan.md`](../slices/slice-18/plan.md)
- Conventions: [`../slices/slice-18/CONVENTIONS.md`](../slices/slice-18/CONVENTIONS.md)
- directus-sync README: [tractr/directus-sync](https://github.com/tractr/directus-sync)
- Neon PITR docs: <https://neon.tech/docs/introduction/point-in-time-restore>
