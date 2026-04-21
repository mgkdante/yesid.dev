# yesid.dev-cms Seed Script

One-shot tool that imports existing yesid.dev content into Payload via the Local API.

## Layout

```
scripts/seed/
  index.ts              — entry (scaffold in 18b-8a; upserts wired in 18b-8b)
  lib/
    loadTs.ts           — dynamic TS module import
    loadMd.ts           — readdir + gray-matter (loadMdDir + loadBlogPosts)
    toLexical.ts        — markdown → Lexical converter (official + naive fallback)
    deriveStack.ts      — invert tech-stack reverse arrays into project/service.stack (D-rel-1)
  upsert/               — per-collection/global upsert files (added in 18b-8b)
  README.md             — this file
```

## Running

```bash
# Dev branch (current .env DATABASE_URI):
bun run seed:dev

# Prod branch (explicit gate):
SEED_TARGET=prod bun run seed:prod

# Override source repo path:
SEED_SOURCE_REPO_PATH=/custom/yesid.dev bun run seed:dev
```

**Note on Windows:** `seed:prod` uses `SEED_TARGET=prod` env var prefix — this works in Unix shells
and PowerShell 7+ (`pwsh`), but NOT in legacy Windows CMD. Always run from Git Bash or pwsh 7.

## Semantics

- **Upsert by natural key.** Re-runnable without duplicates. See spec D6.
- **Partial merge.** Seed writes ONLY the fields it imports; admin-UI-edited fields are preserved.
- **Not deletion-aware.** Content removed from yesid.dev TS/MD after seeding stays in Payload until manually deleted.
- **One-shot.** DO NOT wire into CI or build. See spec D13.

## Known-loss conversions (D7)

- Blog markdown → Lexical loses code fences, inline formatting, lists when using the naive fallback.
  If Payload's official `convertMarkdownToLexical` is present in a future version of
  `@payloadcms/richtext-lexical/migrate`, full fidelity will be preserved automatically.
- At Payload 3.83.0 the naive fallback is always used (the `migrate` export is Slate-only).
- Post-seed: Yesid re-authors affected posts in admin UI.

## Troubleshooting

- **"Sibling repo not found":** set `SEED_SOURCE_REPO_PATH` to your yesid.dev checkout.
- **"[seed] Stub-created tech-stack <id>":** a project/service referenced a tech id missing from
  yesid.dev's `src/content/stack/*.md`. Either fill the stub in admin UI or add the missing TS
  source and re-run.
- **Bun + Windows Git Bash `\r` contamination on env vars:** use literal strings; if piping,
  `tr -d '\r'` first (per spec risk 11).
- **Prod target confirmation:** `SEED_TARGET=prod bun run seed:prod` has a 5-second abort window
  before seeding runs. Ctrl-C within that window cancels.
