# 18h-ii — Decisions

| ID | Decision | Source | Status |
|---|---|---|---|
| Q1 | Collection name: `icons` (not `media`, `assets`, `svg_library`, `marks`). Keeps the editor mental model concrete; the collection is for "icons" — small visual identifiers — not generic media | User direction 2026-04-27 | locked |
| Q2 | Kebab-slug string PK (matches services / projects / tech_stack convention). NOT auto int. Readable URLs in admin, easy to debug | Mirror existing 18c+ pattern | locked |
| Q3 | Single flat collection with a `category` tag field for filtering — NOT a hierarchy of `tech_icons`/`service_icons`/`brand_icons`. Editors filter by tag if needed; cross-collection reuse trivial | YAGNI; tags scale | locked |
| Q4 | Iconify reference (`iconify_id` string field) + optional `svg_override` (M2O → directus_files). Renderer prefers svg_override, falls back to iconify_id, else placeholder. Either field can be empty individually but not both — validated at seed/adapter level (Directus can't enforce "one-of-two" natively) | User direction: "make all svgs and icons pull from same collection" | locked |
| Q5 | **Editor icon-discovery UX is RESOLVED via Path D (in-stack, no Directus extension).** Pivoted away from Path B (community extension) after empirical install of `simple-iconify-picker` failed: extension declared `host: ^10.10.0` but runtime is `directus/directus:11.17.3`; Directus rejected at boot; extension never appeared in Data Studio's interface dropdown. Maintenance signals also weak (0 stars, 4 months old, single maintainer, README errors). Pivoted decision: editors get typeahead via the **built-in M2O picker** on `tech_stack.icon → icons` (search by `icons.name` — what editors actually type). Visual icon discovery happens in a new **Svelte 5 page at `apps/web/src/routes/admin/icons/+page.svelte`** showing the curated icons grid + Iconify search via the public API + click-to-copy iconify_id. Adding new icons to the collection is a rare flow (~once a month) — `icons.iconify_id` stays as plain string with placeholder + note pointing to `icon-sets.iconify.design`. Adapter-level regex validates ID format at parse. Net effect: zero ongoing extension maintenance, full editor UX via own tools, public-portfolio bonus surface. See Q-AMEND-1 for the D-AMEND-1 tightening that would have rejected the picker upfront | User direction 2026-04-27 (post-empirical install) | locked |
| Q6 | Migration of `tech_stack.icon` (currently string) to M2O FK uses staged approach: add `icon_id` field, backfill via seed-helper script, verify, drop old string field, rename `icon_id` → `icon`. NOT a single-commit field-type change (Directus would lose the string data) | Defensive — preserves existing rows | locked |
| Q7 | `morph_shapes` + `illustrations` collections stay separate. NOT consolidated into `icons` in this slice. Their schemas and consumers differ (morph_shapes have animation path data; illustrations are render-context-specific blog fallbacks). Re-evaluate when their use cases converge or grow past ~50 entries each | Out of scope | locked |
| Q8 | Future collections (`services.icon`, `blog_posts.icon`, `pages.icon`, etc.) adopt the same M2O → `icons.id` pattern as those collections are touched in 18h, 18i, etc. NOT proactively migrated in this slice | Avoids cascading scope creep | locked |
| Q9 | Default `iconify_id` namespace for the seed audit = `logos`. The current `tech_stack.icon` strings (e.g., `airflow`) get mapped to `logos:apache-airflow` during P1 audit. Misses (where logos doesn't have a match) get individually mapped to `skill-icons` or `devicon` based on best-fit. NOT a global namespace switch — each icon entry holds its own full iconify_id | Per honeycomb redesign #62 audit task | locked |

## Q-AMEND-1 — D-AMEND-1 quality bar tightening

**Original D-AMEND-1** (slice 18 plan.md, 2026-04-27 morning): "Zero CUSTOM-BUILT extensions; community-marketplace extensions allowed when listed + actively maintained (last commit < 6 months) + clear license + Directus 11.x compat. First adoption: simple-iconify-picker."

**Empirical failure** (same day, post-install): `simple-iconify-picker@1.0.1` met every stated bar (marketplace listed, last commit Dec 2025 = within 6mo, MIT license, README claimed Directus 10+) yet still failed in production: 0 stars, 4 months old, single maintainer, host constraint stuck at `^10.10.0`, README errors (wrong package name + wrong field names). Directus 11 rejected the extension silently at boot. Diagnosing + considering fork/replace took ~1 hour.

**Amended D-AMEND-1** (locked into slice 18 plan.md, 2026-04-27 evening): Default = NO extensions, custom OR community. Each adoption requires a written justification + a quality bar: **≥50 stars OR ≥1 year of maintenance OR org-backed**. For each adopted extension: file a quarterly recheck issue + name an owner.

**Effect on existing adoptions:**
- `directus-extension-sync@3.0.6` qualifies (451 stars + org-backed by tractr.net + mature) — keep as-is
- `simple-iconify-picker@1.0.1` does NOT qualify under amended bar — reverted (commits 03eaea2 + 55e6da5 stay in history; pivot commit removes Dockerfile install + rewrites docs)

**Lesson:** "marketplace listed + recent commit" is too low a bar; bus factor + real-world adoption signal (stars) catches what those criteria miss.

## Side decisions folded into design (no separate Q)

| Decision | Rationale |
|---|---|
| Use existing `directus_files` for `svg_override` (no new file collection) | Same pattern as `projects.hero_image`, `blog_posts.cover_image` — directus_files is the canonical asset boundary |
| Permissions: ai-editor + human-editor + Public read mirrors `tech_stack` matrix exactly | Pattern locked since 18e; trivially reused |
| `<IconRenderer>` is a generalization of `<TechIcon>` (PR #68), not a separate component | PR #68's TechIcon already takes a `name` string; the rename + prop-shape change to take a record is a refactor, not a rewrite |
| Seed-helper script lives in `apps/cms/scripts/seed-icons.ts` mirroring `seed-projects.ts` shape (per CONVENTIONS § 4) | Standard pattern |
| 18-item per-collection checklist applies to `icons` like any other user collection | CONVENTIONS § 2 |

## Open questions (resolve before implementation)

- **Q-OPEN-1**: Should the `icons` collection have a `translations` junction for per-locale icon names (e.g., the `name` field localized for FR/ES)? Tech names are typically universal but business-domain icons might differ. Default = NO (flat international `name`); revisit if needed
- **Q-OPEN-2**: For the seed audit (P1), should we standardize on a single namespace (e.g., all `logos:` prefix) or pick best-fit per icon? Default = best-fit per icon, accepting that the collection mixes namespaces. Editors can override anytime in Data Studio
- **Q-OPEN-3** (PROMOTED to in-scope as part of Q5 pivot): The "Icon Library" admin page in apps/web is no longer deferred — it's the editor's visual discovery surface (replaces the dropped Directus extension). Built in Phase 6 of this slice as `apps/web/src/routes/admin/icons/+page.svelte`. MVP = curated icons grid (read from `/items/icons`) + Iconify search input (Iconify public API at `https://api.iconify.design/search?query=`) + click-to-copy iconify_id. Polish (POST "Add to icons collection" button, auth gate, analytics) deferred to a follow-up GH issue if needed

## GH issues to file at close

- **Audit + standardize iconify_id namespaces** (Q-OPEN-2 follow-up) — once honeycomb redesign chooses a primary set (logos / skill-icons / devicon), backfill the existing icons collection to standardize. ~0.25 session
- (Removed) ~~Icon library admin page in apps/web~~ — promoted into Phase 6 of this slice; built in-flight, not filed for later
- (Removed) ~~Watch Simple Iconify Picker maintenance~~ — picker dropped per Q5 pivot; nothing to watch

## Close

| Item | Value |
|---|---|
| PR | [#87](https://github.com/mgkdante/yesid.dev/pull/87) |
| Branch | `feature/slice-18-18h-ii` |
| Worktree | `yesid.dev-18h-ii` |
| Closed date | 2026-04-27 |
| Merge SHA | TBD (post-review) |
| Commits | 18 (including pivot revert 45303d9 + data-repair d4ad3cc) |
