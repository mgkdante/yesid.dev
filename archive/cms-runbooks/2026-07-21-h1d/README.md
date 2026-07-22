# Archived CMS runbooks — 2026-07-21 H1-D

This batch contains the completed one-time `tech_stack.icon_id` backfill. It is
inert: the batch sits outside the Bun workspaces, the CMS TypeScript project,
and default test discovery. Fresh environments use the active
`seed-tech-stack.ts` bootstrap, which writes `icon_id` directly.

`manifest.json` binds the archived blob to the exact source commit, content
hash, and restoration command. Restore it only for historical recovery, then
revalidate its assumptions against the current Directus schema before use.
Relative imports intentionally resolve only after restoration.
