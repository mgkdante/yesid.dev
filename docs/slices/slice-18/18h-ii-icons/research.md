# 18h-ii — Research

> Probes that need to run before implementation, and findings as they're collected.

## Inherited patterns from 18a-g (no re-research needed)

- **Schema layout** — per-resource JSON files at `apps/cms/directus/snapshot/{collections,fields,relations}/`. Permissions in single `apps/cms/directus/collections/permissions.json`
- **AM4 (18g) permissions uniqueness key** — `(collection, action, policy)` is unique; the `permissions` filter is ignored for dedup. If touching `directus_comments` for the new collection, merge into the existing `_or` filter
- **Adapter port template** (CONVENTIONS § 6) — typed row + pure `to<Collection>(row)` + `parsePort('<collection>.<method>', Schema, data)` + optional `ctx?: PreviewContext`
- **Seed-script shape** (CONVENTIONS § 4) — `seed-projects.ts` archetype: lib helpers + Zod fixture + dry-run + reset + pure helpers + parseFlags + main + import.meta.main guard
- **M2O alias on parent** + `one_field` on the relation file — both required for bidirectional UI (PR #68 lesson)

## P1 — Audit current `tech_stack.icon` strings + map to Iconify (PENDING — run during Phase 1)

**Question:** for each of the 34 unique `tech_stack.icon` strings, what's the canonical iconify_id?

**Why it matters:** seed data quality. Bad mappings = broken icons in honeycomb consumer.

**How to probe:**

```bash
# Pull all unique icon strings from current tech_stack rows (live)
curl -s 'https://cms.yesid.dev/items/tech_stack?fields=id,icon&limit=-1' \
  | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data.map(t=>t.icon).sort().join('\n'))"
```

For each, manually verify against:
- https://icon-sets.iconify.design/logos/?keyword=<slug>
- https://icon-sets.iconify.design/skill-icons/?keyword=<slug>
- https://icon-sets.iconify.design/devicon/?keyword=<slug>

Document the mapping table here. Flag any icon strings without a clean Iconify match — those need `svg_override` uploads, OR negotiation with the user about the icon name.

### Expected mapping deviations

| Current `tech_stack.icon` | Bare slug works? | Likely Iconify ID | Notes |
|---|---|---|---|
| `airflow` | NO | `logos:apache-airflow` | Iconify uses `apache-airflow` |
| `cpp` | NO | `logos:c-plusplus` | |
| `csharp` | NO | `logos:c-sharp` | |
| `node-js` | NO | `logos:nodejs-icon` (or `logos:nodejs`) | hyphen variant |
| `power-bi` | NO | `logos:microsoft-power-bi` | |
| `sql-server` | NO | `logos:microsoft-sql-server` | |
| `dax` / `t-sql` / `ssis` / `ssrs` | likely NO matches | check `vscode-icons` or upload custom SVG | Microsoft analytics tooling — niche |
| `gsap` | check | possibly `logos:greensock` | |
| `threejs-threlte` | NO | `logos:threejs` (threlte is an SK lib without dedicated icon) | composite |
| Others (`react`, `python`, `postgresql`, `typescript`, `vercel`, etc.) | mostly YES | bare slug works in `logos` set | clean |

Fill in the actual mapping during Phase 1.

## P2 — Verify `directus_files` permissions allow Public read of svg_override files (PENDING)

**Question:** when an icon's `svg_override` references a directus_files row, can the Public role read that file via `/assets/<uuid>.svg`?

**Why it matters:** if not, public consumers fail to load uploaded SVGs.

**How to probe:**

```bash
# Upload a test SVG via Data Studio, get its UUID, then:
curl -s -I 'https://cms.yesid.dev/assets/<uuid>'
# expect 200 OK; if 403, need to add Public read on directus_files for icon-tagged files OR use a folder-scope filter
```

Ref 18d's pattern: `directus_files` Public read is folder-scoped (`folder._eq=<id>`). May need a dedicated `icons` folder in directus_files + filter rule.

## P3 — Community Directus extension search for Iconify picker (RESOLVED)

**Resolution:** `simple-iconify-picker@1.0.1` from `Sedatb23/directus-simple-iconify-picker`

| Attribute | Value |
|---|---|
| npm package | `simple-iconify-picker` |
| Version pinned | `1.0.1` (Dec 2025) |
| GitHub | https://github.com/Sedatb23/directus-simple-iconify-picker |
| Extension type | bundle (interface `iconify-picker` + endpoint `iconify-proxy`) |
| License | MIT |
| Listed on | dirextensions.com (Directus marketplace) |

**Maintenance signal — RISK:**
Brand new extension (initial commit 2025-12-28, v1.0.1 published 2025-12-29). Zero stars, zero open
issues, single maintainer (sedatb23). Low bus factor; no track record of patch velocity. If the
extension stalls or breaks on a Directus upgrade, the fork-or-replace path is documented in
`decisions.md` as Q-AMEND.

**Host constraint — RISK:**
Extension declares `"directus:extension.host": "^10.10.0"`. Our runtime is `directus/directus:11.17.3`.
The semver range does not cleanly satisfy 11.x. The README claims "Directus 10.0.0 or higher" and the
extension appears on dirextensions.com (the Directus marketplace), suggesting the maintainer did not
bump the host field on v1.0.1 — likely an oversight. Directus 11 compatibility is unverified at
install time. The empirical gate is Railway boot after the Dockerfile change: if the extension loads
and appears in Data Studio's interface dropdown, the host constraint is not enforced strictly. If
Directus rejects it, `decisions.md` Q-AMEND captures fork-or-replace options.

**Decision:** per D-AMEND-1, a community marketplace extension is acceptable for this slice.
Install mechanism: Dockerfile `RUN npm install` (see `apps/cms/Dockerfile` — mirrors
`directus-extension-sync@3.0.6` pattern). No custom build required at this time.

## P4 — Schema migration mechanics for tech_stack.icon (PENDING)

**Question:** what's the safest sequence for changing `tech_stack.icon` from string field to M2O FK without losing data or breaking adapter consumers?

**Why it matters:** mid-flight broken state = blocked deploys.

**How to probe:**

Verify each step against a live preview push to Directus (use a separate `tech_stack_test` collection if possible, or just operate on the live with reversibility in mind):

1. Add `tech_stack.icon_id` field (M2O → icons, nullable). Push.
2. Backfill: SQL or seed-helper sets `icon_id` for each row based on `icon` string match. Verify counts.
3. Hold for verification — both `icon` (string) and `icon_id` (M2O) coexist temporarily.
4. Drop `tech_stack.icon` string field. Push. Adapter has switched reads to `icon_id` already by this point.
5. Rename `icon_id` → `icon` (Directus rename via sync OR drop+recreate with new name).

The rename is the riskiest step — Directus's rename via directus-sync may interpret as drop-then-create, losing FK references. Test on a non-production collection first if possible.

Alternative: skip the rename, leave the field as `icon_id`. Slightly less ergonomic API URL but zero migration risk.

## Open questions (none yet)

To be populated during execution if plan assumptions break.
