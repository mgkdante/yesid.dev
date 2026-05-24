# Vendored OG fonts

Loaded by `../fonts.ts` and passed to Satori at render time.

| File | Source | License |
|---|---|---|
| `Inter-Medium.ttf` | https://github.com/rsms/inter releases/download/v4.1/Inter-4.1.zip → `extras/ttf/Inter-Medium.ttf` | SIL Open Font License 1.1 |
| `Inter-Black.ttf` | https://github.com/rsms/inter releases/download/v4.1/Inter-4.1.zip → `extras/ttf/Inter-Black.ttf` | SIL Open Font License 1.1 |
| `JetBrainsMono-Medium.ttf` | https://github.com/JetBrains/JetBrainsMono v2.304 (`fonts/ttf/JetBrainsMono-Medium.ttf`) | SIL Open Font License 1.1 |

Vendored rather than loaded from `node_modules` so file paths are predictable across Vercel's serverless bundling and don't depend on @fontsource format changes.

Note: Inter TTFs are extracted from the `Inter-4.1.zip` release artifact because the repo's `docs/font-files/` directory does not contain pre-built TTFs at the `v4.1` tag (and on `master` only `.woff2` files are shipped). Satori cannot consume `.woff2`, so we need real `.ttf` data.
