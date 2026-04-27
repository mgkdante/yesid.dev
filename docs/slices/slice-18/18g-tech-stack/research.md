# 18g — Research

> Mostly empty by design — 18g reuses everything from 18f. Document any LIVE probe findings here when they invalidate plan assumptions.

## Inherited patterns from 18f (no re-research needed)

- **Block Editor JSON shape** = Editor.js `{ time, blocks, version }`. Locked in [18f decisions § AM1](../18f-blog-block-editor/decisions.md#amendments-2026-04-25--phase-2-p3-probe-findings).
- **`migrate-markdown-to-blocks.ts`** at `apps/cms/scripts/migrate-markdown-to-blocks.ts` — deterministic + idempotent. Maps markdown tokens to Editor.js blocks per AM2/AM3/AM5/AM6.
- **`@repo/shared` Block Editor types + utils**: `BlockEditorDoc`, `BlockEditorDocSchema`, `wrapPlainText`, `extractText`, `extractHeadings`, etc. — all exported, all tested.
- **`<BlockRenderer>`** at `apps/web/src/lib/components/cms/BlockRenderer.svelte` — top dispatch + 7 sub-components in `cms/blocks/`. Reused as-is by future consumer (honeycomb dashboard dialog body).
- **Adapter port template** (18c CONVENTIONS § 4): typed row interface + pure `to<Collection>(row)` mapping + `fetch<Collection>s(filter?, ctx?)` via `createQueuedFetch()` + `parsePort('<collection>.<method>', Schema, data)` Zod gate + optional `ctx?: PreviewContext`.
- **18c CMS-side conventions** (CONVENTIONS § 4): 18-item per-collection checklist (display_template, icon, note, sort_field, archive_field, preview_url, versioning, accountability, translations, grouping, widths, required, conditions, presets, ai-editor permission row, comments row, item_duplication_fields, field notes).

## P1 — Inspect 34 markdown bodies for section heading consistency (PENDING — run during Phase 2)

**Question:** do all 34 `apps/web/src/content/stack/*.md` files use exactly the same 3 H2 section headings (`## What it is`, `## In Practice`, `## Why I use it`)?

**Why it matters:** the migration script keys off these headings to split body into 3 Block Editor fields. Inconsistencies cause empty fields that need manual cleanup post-seed.

**How to probe:**

```bash
for f in apps/web/src/content/stack/*.md; do
  echo "=== $f ==="
  grep '^## ' "$f"
done
```

Expected: every file shows `## What it is`, `## Why I use it`, `## In Practice` (or close variants). Document any deviations here.

## P2 — Verify `relatedServices` + `relatedProjects` FK references (PENDING — run during Phase 2)

**Question:** do all `relatedServices` slugs in markdown frontmatter exist as `services.id` rows in current Directus, and same for `relatedProjects`?

**Why it matters:** orphan junction rows = FK constraint failures during seed.

**How to probe:**

```bash
# Pull all unique relatedServices slugs from markdown
for f in apps/web/src/content/stack/*.md; do
  awk '/^relatedServices:/,/^[a-z]+:/' "$f" | grep -oE '"[a-z0-9-]+"' | tr -d '"'
done | sort -u

# Same for relatedProjects
for f in apps/web/src/content/stack/*.md; do
  awk '/^relatedProjects:/,/^[a-z]+:/' "$f" | grep -oE '"[a-z0-9-]+"' | tr -d '"'
done | sort -u
```

Then cross-reference against live Directus:

```bash
curl -s 'https://cms.yesid.dev/items/services?fields=id&limit=-1' | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data.map(s => s.id).join('\n'))"
curl -s 'https://cms.yesid.dev/items/projects?fields=id&limit=-1' | bun -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).data.map(p => p.id).join('\n'))"
```

Document any markdown-side slugs that don't resolve. Likely orphans because the `services` schema dropped some experimental services in 18a/18b.

## Open questions (none yet)

To be populated during execution if plan assumptions break.
