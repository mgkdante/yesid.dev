# Archived CMS runbooks — 2026-07-21 H1-B

This dependency-closed batch contains completed one-shot blog migration and
replacement tooling. It is inert: the batch sits outside the Bun workspaces,
the CMS TypeScript project, and default test discovery.

`manifest.json` binds every archived blob to the exact source commit, content
hash, and restoration command. Restore the full dependency closure before
running any file, then revalidate its CMS and content assumptions. Relative
imports intentionally resolve only after restoration.
