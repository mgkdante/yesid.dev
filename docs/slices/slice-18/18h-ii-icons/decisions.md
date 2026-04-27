# 18h-ii — Decisions

| ID | Decision | Source | Status |
|---|---|---|---|
| Q1 | Collection name: `icons` (not `media`, `assets`, `svg_library`, `marks`). Keeps the editor mental model concrete; the collection is for "icons" — small visual identifiers — not generic media | User direction 2026-04-27 | locked |
| Q2 | Kebab-slug string PK (matches services / projects / tech_stack convention). NOT auto int. Readable URLs in admin, easy to debug | Mirror existing 18c+ pattern | locked |
| Q3 | Single flat collection with a `category` tag field for filtering — NOT a hierarchy of `tech_icons`/`service_icons`/`brand_icons`. Editors filter by tag if needed; cross-collection reuse trivial | YAGNI; tags scale | locked |
| Q4 | Iconify reference (`iconify_id` string field) + optional `svg_override` (M2O → directus_files). Renderer prefers svg_override, falls back to iconify_id, else placeholder. Either field can be empty individually but not both — validated at seed/adapter level (Directus can't enforce "one-of-two" natively) | User direction: "make all svgs and icons pull from same collection" | locked |
| Q5 | **Live Iconify search / typeahead in Data Studio is DEFERRED.** v1 ships with the standard Directus M2O dropdown showing pre-curated icons collection rows (filterable by name). Adding new icons to the collection requires editors to know the iconify_id (browse [icon-sets.iconify.design](https://icon-sets.iconify.design/) externally, copy the ID, paste into Data Studio). **Why deferred:** typeahead-with-live-preview requires a custom Directus interface extension. D11 (Slice 18) prohibits custom extensions except `directus-sync`. Implementing a typeahead picker would require either (a) a D11 amendment to allow this specific extension OR (b) finding a maintained community extension on the Directus marketplace. Both paths need their own evaluation slice; not scoped here. Tracked as GH issue at slice close | User asked for typeahead UX 2026-04-27; D11 conflict | locked (path forward = GH issue) |
| Q6 | Migration of `tech_stack.icon` (currently string) to M2O FK uses staged approach: add `icon_id` field, backfill via seed-helper script, verify, drop old string field, rename `icon_id` → `icon`. NOT a single-commit field-type change (Directus would lose the string data) | Defensive — preserves existing rows | locked |
| Q7 | `morph_shapes` + `illustrations` collections stay separate. NOT consolidated into `icons` in this slice. Their schemas and consumers differ (morph_shapes have animation path data; illustrations are render-context-specific blog fallbacks). Re-evaluate when their use cases converge or grow past ~50 entries each | Out of scope | locked |
| Q8 | Future collections (`services.icon`, `blog_posts.icon`, `pages.icon`, etc.) adopt the same M2O → `icons.id` pattern as those collections are touched in 18h, 18i, etc. NOT proactively migrated in this slice | Avoids cascading scope creep | locked |
| Q9 | Default `iconify_id` namespace for the seed audit = `logos`. The current `tech_stack.icon` strings (e.g., `airflow`) get mapped to `logos:apache-airflow` during P1 audit. Misses (where logos doesn't have a match) get individually mapped to `skill-icons` or `devicon` based on best-fit. NOT a global namespace switch — each icon entry holds its own full iconify_id | Per honeycomb redesign #62 audit task | locked |

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
- **Q-OPEN-3**: After v1 ships, do we proactively expose an "Icon Library" admin page in the consumer (apps/web) showing all curated icons + previews? Useful for editors before they add a new icon. Defer to honeycomb-redesign-era

## GH issues to file at close

- **Live Iconify typeahead picker (Q5 deferral)** — evaluate community Directus extensions (e.g., `directus-extension-iconify`); if none maintained, scope a custom extension behind a D11 amendment. ~1 session
- **Icon library admin page in apps/web** (Q-OPEN-3) — render all icons collection rows with iconify previews; bookmark for editors when adding new entries. ~0.25 session
- **Audit + standardize iconify_id namespaces** (Q-OPEN-2 follow-up) — once honeycomb redesign chooses a primary set (logos / skill-icons / devicon), backfill the existing icons collection to standardize. ~0.25 session

## Close

| Item | Value |
|---|---|
| PR | TBD |
| Branch | `feature/slice-18-18h-ii` |
| Worktree | `yesid.dev-18h-ii` |
| Closed date | TBD |
| Merge SHA | TBD |
| Commits | TBD |
