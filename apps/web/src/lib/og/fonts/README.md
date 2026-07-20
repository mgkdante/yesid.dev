# Vendored OG fonts

Loaded by `../fonts.ts` and passed to Satori at render time.

| File | Source | SHA-256 | License |
|---|---|---|---|
| `Inter-Medium.ttf` | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip → `extras/ttf/Inter-Medium.ttf` | `97ad806f526e41546d46365bb3a393145f75b7b1568913db74549ad8b8dba872` | [SIL Open Font License 1.1](LICENSE-Inter.txt) |
| `Inter-Black.ttf` | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip → `extras/ttf/Inter-Black.ttf` | `6342d3ea6dc088b43867f615e807d898adf100c93edb978b8e52c5eb71a264da` | [SIL Open Font License 1.1](LICENSE-Inter.txt) |
| `JetBrainsMono-Medium.ttf` | https://github.com/JetBrains/JetBrainsMono at `v2.304` (`fonts/ttf/JetBrainsMono-Medium.ttf`) | `31c92d01a8a08528b718a43addf0ad3df0af2ca4b7b3290a452f70f358e14d3d` | [SIL Open Font License 1.1](LICENSE-JetBrains-Mono.txt) |

Vendored rather than loaded from `node_modules` so file paths are predictable across Vercel's serverless bundling and don't depend on @fontsource format changes.

Note: Inter TTFs are extracted from the `Inter-4.1.zip` release artifact because the repo's `docs/font-files/` directory does not contain pre-built TTFs at the `v4.1` tag (and on `master` only `.woff2` files are shipped). Satori cannot consume `.woff2`, so we need real `.ttf` data.
