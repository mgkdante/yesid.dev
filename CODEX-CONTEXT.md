# Codex Review Context

> **Scorched.** Payload 3.x removed in [slice-18 Task 1](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18).
>
> All prior deferred-by-design entries (custom-id PK hazards, MCP update permissions, down-migration rollback safety, locale-type divergence, etc.) no longer apply — the code they referenced has been deleted.

## Current state

- Empty Next.js shell. Payload code deleted. Lockfile regenerated.
- Directus install lands in slice-18 Task 3. Until then there is no backend.
- yesid.dev consumer is on `staticAdapter`; unaffected.

## Review focus for this PR (`chore: remove Payload — slice-18 restart`)

1. Zero references to Payload npm packages anywhere in the tree (verify with the grep incantation documented in the slice-18 plan; not repeated verbatim here to keep this file grep-clean).
2. `package.json` is minimal (no Payload, no Payload-era scripts).
3. `bun.lock` regenerated cleanly (no orphaned Payload packages).
4. `next.config.ts` no longer wraps with the Payload withPayload helper.
5. `eslint.config.mjs` no longer ignores the former generated-types files.

## Future review context

Directus-era deferred-by-design entries will be added as Task 3 (install) progresses. Until then this file is intentionally thin.
