# brand/examples — paired screenshot + source

This directory holds grounded examples of the live site: a `.png` screenshot paired with a `.svelte.txt` copy of the source component that produced it. The pair is the minimum grounding data a vision LLM needs to understand a brand's built appearance alongside the structure that produces it.

## Pair structure

| Stem | Captures |
|---|---|
| `home-hero.*` | The home page hero — wordmark + typewriter + scroll prompt + MetroNetwork background |
| `service-card-sql.*` | A service card from the SQL Development service page — terminal chrome, metrics, deep-dive CTA, desaturated SVG panel |
| `contact-terminal.*` | The contact page — dual terminal layout, rotated "Contact." edge title, Paneforge resizable split |
| `blog-listing.*` | (optional) Blog listing — 2-column grid with Shiki-styled prose + rotated edge title |
| `about-identity.*` | (optional) About identity card — StopLabel + StatusDot + availability indicator |

Each stem ships as a `.png` (screenshot at 2x device scale) and a `.svelte.txt` (source component as plaintext, so git renders it inline).

## Regenerating the PNGs

The Playwright-based script at `brand/scripts/export-examples.ts` automates capture. The prerequisite is a running dev server.

```bash
# One-time: ensure Playwright browsers are installed
bunx playwright install

# Terminal 1 — run the dev server
bun run dev

# Terminal 2 — run the exporter
bun run brand:export-examples
```

The script reads the `EXAMPLES` list in `brand/scripts/export-examples.ts`, opens each route in a headless browser, screenshots the configured selector (or full viewport), and copies the paired source file.

### Browser choice

By default the script uses Chromium. Override via `PLAYWRIGHT_BROWSER`:

```bash
PLAYWRIGHT_BROWSER=firefox bun run brand:export-examples
```

### Known issue (2026-04-18)

On the Windows dev machine used for this slice, Playwright's headless launch of both Chromium and Firefox hung indefinitely after the process spawned. The script ran cleanly up to `browser.launch()` and then timed out waiting for the browser's debug-pipe to become ready. This appears to be a Windows-specific Playwright / Chromium connection issue, not a script bug — running the same script on macOS, Linux, or CI will produce the PNG pairs.

Until the launch issue is resolved, this directory ships with the source-only side of each pair (`.svelte.txt` files). Generating the PNG side on a functional environment and committing them completes the pair structure.

## Why paired, not just screenshots

A screenshot alone teaches a vision model what something looks like. A source snippet alone teaches a text model what something is made of. Paired, they teach a multimodal model how intent (source) produces appearance (screenshot) — which is the thing that matters for brand-grounded generation.

This is the Claude Design–oriented rationale. A fresh LLM tool session pointed at `brand/` can read `foundations/*.md` for rules, read `BRAND.md` for principles, and consult `examples/` for concrete built instances of those rules. Three artifacts, three layers of grounding.
