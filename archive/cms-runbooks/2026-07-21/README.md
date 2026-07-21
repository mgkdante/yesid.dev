# Archived CMS runbooks — 2026-07-21

These completed one-shot scripts and their tests are inert history. They are
outside the Bun workspaces, the CMS TypeScript project, and the default test
discovery surface. Do not execute them from this directory: their relative
imports intentionally resolve only after restoration.

`manifest.json` binds every archived file to the exact source commit and
content hash. To recover a runbook, review its current production assumptions,
then run the entry's explicit `git mv` command to restore the original path.
Restore its associated test and dependencies in the same change before use.
