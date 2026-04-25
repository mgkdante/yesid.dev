# 18d — Decisions

| ID | Decision | Source | Status |
|---|---|---|---|
| A1 | hero-station-art duplicate (PNG + WebP): both deleted | Brainstorm 2026-04-24 | locked |
| A2 | montreal-metro.source.svg: deleted | Brainstorm 2026-04-24 | locked |
| A3 | brand logo/favicon: deferred to 18l | Brainstorm 2026-04-24 | locked |
| A4 | folder map: 14 files across 3 populated (about=12, brand=1, projects=1) + 3 empty | Brainstorm 2026-04-24 | locked |
| A5 | upload as-is (no Sharp re-encode) | Brainstorm 2026-04-24 | locked |
| B1 | `legacy_path` shape: `images/<full-relative-path>` | Brainstorm 2026-04-24 | locked |
| B2 | alt text: derived default + editor override (not publish-blocking in 18d) | Brainstorm 2026-04-24 | locked |
| B5 | AVIF probe: bootstrap 1 file → probe → branch | Brainstorm 2026-04-24 | locked |
| C1 | migration: resumable, not atomic; --reset deletes by legacy_path | Brainstorm 2026-04-24 | locked |
| C4 | manifest is single source of truth for folder/alt overrides | Brainstorm 2026-04-24 | locked |
| D | montreal-metro.svg: migrate + flip consumer in 18d | Brainstorm 2026-04-24 | locked |
| E | Lottie: full retirement in 18d | Brainstorm 2026-04-24 | locked |
| F | Approach A (schema-first) with B-borrow (bootstrap probe before full batch) | Brainstorm 2026-04-24 | locked |

## Amendments

| Date | Amendment | Source |
|---|---|---|
| 2026-04-24 | Phase 2 schema push: folder _syncIds use UUIDs (not `_sync_folder_<name>` strings) — directus-sync v3.5.1 with `preserveIds=true` for folders requires UUID format. Plan's string-based _syncId rejected with 403; resolved live in Task 7. | Task 7 subagent finding |
| 2026-04-24 | `legacy_path` field schema lives at TWO paths: `apps/cms/directus/fields/directus_files/legacy_path.json` (orphan from plan) + `apps/cms/directus/snapshot/fields/directus_files/legacy_path.json` (canonical, where directus-sync reads). Orphan cleaned up in Task 46. | Task 7 subagent finding |
| 2026-04-24 | `lottieReverse: true` lived on `database-engineering` row (not `sql-development` as plan speculated). Confirmed live in Task 3. | Task 3 subagent finding |
| 2026-04-24 | Task 3 set `lottie_reverse` to `false` (not `null`) — DB column has NOT NULL constraint. PostgreSQL column drop tolerates non-null values. | Task 3 subagent finding |
| 2026-04-24 | P8 AVIF probe RED — Sharp on Railway silently downgrades `format: "avif"` → WebP. Probe-only preset confirmed. AVIF variants NOT added; deferred to post-Directus-12 or Sharp infrastructure fix. | Task 21 |
| 2026-04-24 | Sharp transforms NOT executing on Railway deployment for any preset (not just AVIF). All 4 base presets return raw original bytes. Acceptance gate partially fails ("`?key=hero-1200` returns 200 + image/webp" passes for all sources; "1200-wide" only verifiable for sources ≤1200). Per user decision (2026-04-24, Option 1): ship 18d, defer Sharp fix. | Task 24 |
| 2026-04-24 | `apps/cms/scripts/seed-presets.ts` was rewritten (not greenfield — pre-existing version replaced). Tests rewritten to match new shape. | Task 18 subagent finding |
