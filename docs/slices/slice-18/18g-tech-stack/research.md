# 18g — Research

> Mostly empty by design — 18g reuses everything from 18f. Document any LIVE probe findings here when they invalidate plan assumptions.

## Inherited patterns from 18f (no re-research needed)

- **Block Editor JSON shape** = Editor.js `{ time, blocks, version }`. Locked in [18f decisions § AM1](../18f-blog-block-editor/decisions.md#amendments-2026-04-25--phase-2-p3-probe-findings).
- **`migrate-markdown-to-blocks.ts`** at `apps/cms/scripts/migrate-markdown-to-blocks.ts` — deterministic + idempotent. Maps markdown tokens to Editor.js blocks per AM2/AM3/AM5/AM6.
- **`@repo/shared` Block Editor types + utils**: `BlockEditorDoc`, `BlockEditorDocSchema`, `wrapPlainText`, `extractText`, `extractHeadings`, etc. — all exported, all tested.
- **`<BlockRenderer>`** at `apps/web/src/lib/components/cms/BlockRenderer.svelte` — top dispatch + 7 sub-components in `cms/blocks/`. Reused as-is by future consumer (honeycomb dashboard dialog body).
- **Adapter port template** (18c CONVENTIONS § 4): typed row interface + pure `to<Collection>(row)` mapping + `fetch<Collection>s(filter?, ctx?)` via `createQueuedFetch()` + `parsePort('<collection>.<method>', Schema, data)` Zod gate + optional `ctx?: PreviewContext`.
- **18c CMS-side conventions** (CONVENTIONS § 4): 18-item per-collection checklist (display_template, icon, note, sort_field, archive_field, preview_url, versioning, accountability, translations, grouping, widths, required, conditions, presets, ai-editor permission row, comments row, item_duplication_fields, field notes).

## P1 — Inspect 34 markdown bodies for section heading consistency (RESOLVED 2026-04-27)

**Question:** do all 34 `apps/web/src/content/stack/*.md` files use exactly the same 3 H2 section headings (`## What it is`, `## In Practice`, `## Why I use it`)?

**Why it matters:** the migration script keys off these headings to split body into 3 Block Editor fields. Inconsistencies cause empty fields that need manual cleanup post-seed.

**How to probe:**

```bash
for f in apps/web/src/content/stack/*.md; do
  echo "=== $f ==="
  grep '^## ' "$f"
done
```

### Findings (2026-04-27)

34 files scanned. 4 unique H2 headings observed:

| Heading | File count |
|---|---|
| `## What it is` | 34 |
| `## In Practice` | 34 |
| `## Why I use it` | 33 |
| `## Why I chose it` | 1 — `threejs-threlte.md` |

**Single deviation:** `threejs-threlte.md` uses `## Why I chose it` instead of `## Why I use it`. Both express the same comparative-rationale intent.

**Migration script must accept BOTH heading variants** when extracting the third section → `why_i_use_it_instead`. Implementation: regex `/^##\s+Why I (use|chose) it\s*$/m` or equivalent multi-pattern split. No empty-field fallback needed; the section content is present in all 34 files (just under different heading text in 1 file).

## P2 — Verify `relatedServices` + `relatedProjects` FK references (RESOLVED 2026-04-27)

**Question:** do all `relatedServices` slugs in markdown frontmatter exist as `services.id` rows in current Directus, and same for `relatedProjects`?

**Why it matters:** orphan junction rows = FK constraint failures during seed.

**How to probe (working version — `tr ',' '\n'` instead of `sed s/,/\n/g` because BSD-flavored `sed` on Git Bash didn't expand `\n` in replacement, smushing comma-separated slugs):**

```bash
# Markdown side — inline-array frontmatter
grep -h '^relatedServices:' apps/web/src/content/stack/*.md \
  | sed -E 's/^relatedServices:[[:space:]]*\[//; s/\][[:space:]]*$//' \
  | tr ',' '\n' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' \
  | grep -v '^$' | sort -u
# Same pattern for relatedProjects.

# Directus side
curl -s 'https://cms.yesid.dev/items/services?fields=id&limit=-1' | jq -r '.data[].id' | sort
curl -s 'https://cms.yesid.dev/items/projects?fields=id&limit=-1' | jq -r '.data[].id' | sort
```

### Findings (2026-04-27)

| Source | Unique slugs | Slugs |
|---|---|---|
| `relatedServices` in markdown | 6 | `analytics-reporting`, `database-engineering`, `data-pipeline`, `internal-tooling`, `sql-development`, `web-development` |
| `services.id` in Directus | 6 | (same set) |
| `relatedProjects` in markdown | 3 | `lorem-analytics-dashboard`, `transit-data-pipeline`, `yesid-dev` |
| `projects.id` in Directus | 6 | (above 3) + `lorem-database-migration`, `lorem-query-optimizer`, `lorem-retool-admin` |

**ZERO orphans.** Every markdown FK reference resolves to an existing Directus row. Migration script does not need orphan-filtering — emit all junction rows verbatim.

### Junction-row counts (informs Phase 3 acceptance gate)

| Junction collection | Total rows expected |
|---|---|
| `tech_stack_services` | **37** |
| `tech_stack_projects` | **21** |

(Plan estimated ≈40-50 + ≈20-30; service count came in below estimate, project in range. Both well under the order of magnitude that would warrant pagination concerns.)

**Files with empty `relatedServices: []`** (5 of 34): `cpp`, `flutter`, `github-actions`, `jetpack-compose`, `rust`.
**Files with empty `relatedProjects: []`** (14 of 34): `cpp`, `csharp`, `flutter`, `java`, `jetpack-compose`, `kotlin`, `mysql`, `nextjs`, `node-js`, `react`, `rust`, `ssis`, `ssrs`, `threejs-threlte`.

### Frontmatter field audit (informs migration mapping)

All 34 files have an identical 9-field frontmatter shape:

```
id, name, icon, layer, domains, connectsTo, relatedServices, relatedProjects, proficiency
```

Per spec § Migration mapping + decisions Q1+Q2+Q5: **kept** = `id`, `name`, `icon`, `relatedServices`, `relatedProjects`. **Dropped** = `layer`, `domains`, `connectsTo`, `proficiency`. (`connectionNotes` was in the original spec but never appeared in any of the 34 files — no migration handling needed.)

## Open questions (none)

All Phase 1 probes resolved. No assumptions broken. Phase 2 schema authoring proceeds against the locked spec.
