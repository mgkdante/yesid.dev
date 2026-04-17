---
title: "SSR-Inlined SVG (Vite ?raw + SVGO)"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 6
tags:
  - learn
  - motion
  - intermediate
  - slice-17e
prerequisites:
  - "[[snappy-doctrine]]"
date: 2026-04-17
slice: 17e-6
---

# SSR-Inlined SVG (Vite ?raw + SVGO)

## The Analogy

A materialized view in SQL — you compute the join once at build time and commit the result. Queries read the pre-joined table instantly instead of running the join per request. SSR-inlining an SVG is the same: you pre-optimize the SVG at build time and embed it directly into the HTML. The browser renders it immediately on first paint instead of waiting for a separate `fetch()` round trip.

## What It Is

A Vite feature where `import svgText from './file.svg?raw'` gives you the file contents as a string at build time, which you then render via `{@html svgText}` in Svelte. Combined with an SVGO optimization pass on the source file, you ship compressed SVG inside the SSR HTML.

```svelte
<script>
  import metroSvg from '$lib/motion/svg/montreal-metro.svg?raw';
</script>

<div data-testid="metro-network" bind:this={containerEl}>
  {@html metroSvg}
</div>
```

Introduced in Slice 17e-4 (D265) for `MetroNetwork.svelte` — the 15 KB Montreal metro SVG now ships inline instead of being fetched on mount.

## Why It Matters

Pre-17e-4, `MetroNetwork.svelte` did this at mount:

```ts
onMount(async () => {
  const res = await fetch('/images/montreal-metro.svg');
  const svgText = await res.text();
  containerEl.innerHTML = svgText;
  // ... then start classification + animation ...
});
```

That pattern has two SEO / LCP problems:

1. **The SVG is not in the SSR HTML.** Google's LCP metric looks for the largest-contentful element visible in the initial viewport. A blank container that becomes an SVG after a `fetch` doesn't count — LCP waits for the fetch to complete.
2. **A separate network request.** One more round trip before first paint.

Post-17e-4, the SVG ships inline in the SSR HTML. It's a valid LCP candidate. The `fetch` is gone. First paint renders the SVG.

Trade-off: HTML payload grows by ~15 KB gzipped. But that's one-time initial-paint cost, not a round trip, and most HTTP/2 connections deliver it faster than a second request anyway.

## How We Use It in This Project

Currently used for exactly one file: the hero MetroNetwork SVG.

| File | Purpose | Why inline |
|---|---|---|
| `static/images/montreal-metro.svg` | Source asset (15.1 KB, SVGO-optimized) | Committed as the canonical artifact |
| `src/lib/motion/svg/MetroNetwork.svelte` | Consumer | Imports via `?raw` + `{@html}` |
| `svgo.config.mjs` | SVGO override config | Preserves classification-critical attributes (see below) |
| `src/app.d.ts` | `declare module '*.svg?raw'` | TS ambient type |
| `.gitignore` | Excludes `*.source.svg` | Backup files stay local |

## The Mental Model

```
 Build time                             Runtime (SSR)                         Runtime (browser)
                                                                          
 static/*.svg    ──── Vite ?raw ────▶  HTML contains            ────▶     Browser parses
 (already                              <svg>...</svg>                     HTML, sees SVG,
 SVGO-optimized)                       inline                             renders it
                                                                          (no fetch, no JS)
                                                                                 │
                                                                                 ▼
                                                            JS boots, runs classification
                                                            against the already-rendered
                                                            DOM, starts animations
```

### When to inline vs when to serve static

| Use | Inline via `?raw` | Serve static |
|---|---|---|
| LCP-critical (above-fold hero) | ✅ | ❌ |
| Non-critical decorative | ❌ | ✅ |
| Size < 20 KB | Possibly | ✅ |
| Size > 30 KB | ❌ (bloats HTML) | ✅ |
| Content needs classification by JS | ✅ (no fetch latency) | ❌ |
| Lazy-visible, below-fold | ❌ | ✅ |

## Worked Example

### The SVGO pitfall

SVGO's default preset breaks the MetroNetwork SVG in two specific ways:

1. **`convertColors`** lowercases `#E07800` → `#e07800`. MetroNetwork's mount-time classification code compares `stroke === '#E07800'` to split station paths from line paths. Case change → classification fails → station animations never run.
2. **`mergePaths`** merges the 87 station `<path>` elements into one. Per-station opacity fades in Phase 3 of the hero timeline need each station as a distinct path element.

The fix (committed in `svgo.config.mjs`):

```js
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertColors: false,   // Keep #E07800 uppercase
          mergePaths: false,       // Keep stations as distinct paths
          cleanupIds: false,       // Preserve ids used by animation selectors
        },
      },
    },
  ],
};
```

Size reduction drops from ~42% (full defaults) to ~28%, but the animation targets survive. Worth it.

### SVGO 4 CLI quirk

SVGO 4 removed the `--disable=<plugin>` CLI flag. The config file (`svgo.config.mjs`) is required, not optional. Running `bunx svgo path.svg` picks up `svgo.config.mjs` from the repo root automatically.

### Re-running SVGO after an SVG edit

```bash
# 1. Save the raw updated SVG locally (gitignored)
cp ~/Downloads/updated-map.svg static/images/montreal-metro.source.svg

# 2. Run SVGO with the repo config
bunx svgo --config=svgo.config.mjs \
  static/images/montreal-metro.source.svg \
  -o static/images/montreal-metro.svg

# 3. Sanity-check classification survived
grep -c 'stroke="#E07800"' static/images/montreal-metro.svg  # expect 8
grep -c 'fill="#E07800"'   static/images/montreal-metro.svg  # expect 87
grep -c '<path'            static/images/montreal-metro.svg  # expect 87+

# 4. Commit only the optimized file
git add static/images/montreal-metro.svg
```

## Common Mistakes

1. **Inlining a large SVG that's below the fold**
   - **What happens:** HTML payload bloats, TTFB slows, LCP moves but the inlined SVG wasn't in the viewport anyway so no LCP win.
   - **Fix:** Only inline above-fold or LCP-candidate SVGs. Decorative blueprint SVGs that are lazy-visible stay as static assets.
   - **Why:** Inlining trades network-round-trip for HTML-parse cost. The trade only pays off when the SVG is visible immediately.

2. **Running SVGO without the repo config**
   - **What happens:** Classification breaks (lowercased colors, merged paths). The hero animation runs but station fades don't.
   - **Fix:** Always invoke with `--config=svgo.config.mjs` or rely on automatic config discovery from repo root. Never pipe the SVG through an online SVGO tool — those use defaults.
   - **Why:** The overrides encode knowledge that MetroNetwork's JS depends on. Without them, the SVG is "optimized" in ways that break animation.

3. **Treating inlined SVG as a fetch replacement for unrelated cases**
   - **What happens:** You inline a 60 KB decorative blueprint on a blog detail page. HTML goes from 10 KB to 70 KB. TTFB increases. No visible win because the blueprint was lazy-visible.
   - **Fix:** Inline is for LCP-critical, size-constrained assets. Decorative + large = static file.
   - **Why:** The inline trade-off is mechanism-specific; don't pattern-match it everywhere.

4. **Forgetting the `declare module '*.svg?raw'` ambient type**
   - **What happens:** `import svg from './foo.svg?raw'` is typed `any` or fails TS check.
   - **Fix:** Add `declare module '*.svg?raw' { const content: string; export default content; }` in `src/app.d.ts`.
   - **Why:** Vite handles the import at build, but TS needs the ambient declaration to type it.

## Connections

- **Depends on:** [[snappy-doctrine]] — content at final state on load (no fade-in during fetch)
- **Enables:** LCP-candidate status for motion-owned SVGs
- **Related:** [[scrub-factory-pattern]] — `createHeroTimeline` runs against the SSR-inlined SVG subtree

## Knowledge Check

1. Why does MetroNetwork use `?raw` instead of `fetch`? → To put the SVG in the SSR HTML so it counts as an LCP candidate (no fetch-round-trip delay).
2. What 3 SVGO plugins does `svgo.config.mjs` disable and why? → `convertColors` (case-sensitive hex matters for classification), `mergePaths` (per-path animation), `cleanupIds` (id selectors).
3. When should I inline an SVG? → LCP-critical + small (< 20 KB). Decorative + large = static file.
4. What ambient type makes `import foo from './foo.svg?raw'` type-check? → `declare module '*.svg?raw'` in `src/app.d.ts`.

## Go Deeper

- `docs/reference/MOTION.md` § 13 — MetroNetwork re-optimization procedure
- Vite `?raw` docs: https://vite.dev/guide/assets.html#importing-asset-as-string
- SVGO docs: https://github.com/svg/svgo
