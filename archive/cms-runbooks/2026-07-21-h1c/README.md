# Archived CMS runbooks — 2026-07-21 H1-C

This dependency-closed batch contains the completed one-shot morph-shape seed
and its dry-run helper contract. It is inert: the batch sits outside the Bun
workspaces, the CMS TypeScript project, and default test discovery.

`manifest.json` binds both archived blobs to the exact source commit, content
hash, and restoration command. Restore the full pair before using it to
bootstrap a fresh environment, then revalidate its CMS and fixture assumptions.
Relative imports intentionally resolve only after restoration.
