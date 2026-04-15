---
title: "DOM-Based Text Measurement"
domain: patterns
difficulty: 3
difficulty_label: advanced
reading_time: 7
tags:
  - learn
  - patterns
  - advanced
  - css
  - javascript
  - layout
prerequisites:
  - "[[svelte-5-runes]]"
  - "[[css-custom-properties]]"
date: 2026-04-15
---

# DOM-Based Text Measurement

## The Analogy

Imagine you need to cut a piece of wood to exactly fit a doorframe. You could calculate the length from blueprints — but blueprints don't account for the house settling, the door trim thickness, or the saw blade kerf. It's faster and more accurate to just measure the actual doorframe. DOM-based text measurement works the same way: instead of calculating text width from font metrics and character counts, we render the text in the browser and measure what the browser actually produced.

## What It Is

When you need a text element to span an exact physical dimension (e.g., a rotated label that must be exactly as tall as the viewport), you can't reliably calculate the target font-size from the font's metrics alone. Letter-spacing, font kerning, ligatures, and browser-specific rendering all affect the final dimensions.

The pattern:
1. Render the text at a known **reference font-size** (e.g., 100px)
2. Measure the rendered dimensions using `getBoundingClientRect()`
3. Calculate the **scale factor**: `targetDimension / measuredDimension`
4. Apply the scaled font-size: `referenceFontSize * scaleFactor`

This gives you a font-size that makes the text span exactly the target dimension, accounting for all rendering variables.

## Why It Matters

This pattern solves a class of "responsive typography" problems where text must match a physical constraint. Edge labels, hero text that fills a viewport, and typographic layouts where text must align with geometric elements all benefit from this approach. The alternative — hardcoding font sizes per breakpoint — is fragile and never accounts for variable content length.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/blog/BlogDetailPage.svelte` | `sizeEdgeToViewport()` function | Sizes "Begin." and "Transmission." edge labels to span exactly 100dvh when rotated |
| `src/lib/components/shells/EdgeRail.svelte` | Similar measurement pattern | Sizes the page-level EdgeRail title to viewport height |

## The Mental Model

```
Step 1: Set text to reference size (100px)
  "Begin." at 100px → measured height: 482px (when rotated, height = text length)

Step 2: Calculate scale factor
  target = window.innerHeight (e.g., 900px)
  scale = 900 / 482 = 1.867

Step 3: Apply scaled font-size
  100px * 1.867 = 186.7px
  → "Begin." at 186.7px spans exactly 900px

Step 4: Measure cross-axis for column width
  At 186.7px → measured width: 52px
  → Set grid column to 52px
```

The reference size doesn't matter (50px, 100px, 200px all work) — it just needs to be large enough for accurate measurement. 100px is conventional.

## Worked Example

```typescript
// From: src/lib/components/blog/BlogDetailPage.svelte
// Edge labels use writing-mode: vertical-rl, so rect.height = text length

const REF_SIZE = 100; // reference font-size for measurement (px)

function sizeEdgeToViewport(el: HTMLElement | undefined): number | undefined {
  if (!el || !browser) return;
  const labelEl = el.querySelector('[data-edge-text]') as HTMLElement | null;
  if (!labelEl) return;

  // Step 1: Measure at reference size
  // The actual DOM element is used — this accounts for letter-spacing,
  // font metrics, and all CSS properties automatically.
  labelEl.style.fontSize = `${REF_SIZE}px`;
  const refRect = labelEl.getBoundingClientRect();
  if (refRect.height === 0) return;

  // Step 2-3: Scale font-size so text length = viewport height
  const vh = window.innerHeight;
  const targetSize = REF_SIZE * (vh / refRect.height);
  labelEl.style.fontSize = `${targetSize}px`;

  // Step 4: Return cross-axis width for grid column sizing
  const finalRect = labelEl.getBoundingClientRect();
  return Math.ceil(finalRect.width);
}
```

The function returns the cross-axis width so the parent grid can set its edge column widths. Both edge labels are measured, and the maximum width is used for both columns (so they're symmetrical).

## Common Mistakes

1. **Measuring before the font loads:**
   - **What happens:** Measurement uses fallback font metrics, then the real font loads and dimensions change
   - **Fix:** Ensure fonts are loaded before measuring (self-hosted fonts load with the bundle, so this is usually not an issue)
   - **Why:** Different fonts at the same size produce different glyph widths

2. **Not accounting for the layout shift during measurement:**
   - **What happens:** The text briefly appears at 100px, then jumps to the final size — visible flash
   - **Fix:** Hide the container with `opacity: 0` during measurement, fade in after
   - **Why:** The measurement requires actual rendering, which the user can see

3. **Using `offsetWidth` instead of `getBoundingClientRect()`:**
   - **What happens:** Rounded pixel values cause accumulating errors
   - **Fix:** Always use `getBoundingClientRect()` for sub-pixel accuracy
   - **Why:** `offsetWidth`/`offsetHeight` round to integers; `getBoundingClientRect()` returns fractional pixels

4. **Forgetting to re-measure on resize:**
   - **What happens:** Labels are correct at initial viewport size but wrong after resize
   - **Fix:** Use a Svelte `$effect` that reruns when dependencies change, or listen for `resize` events
   - **Why:** `window.innerHeight` changes on resize, so the scale factor changes

## Connections

- **Depends on:** [[svelte-5-runes]] because `$effect` triggers the measurement reactively
- **Depends on:** [[css-custom-properties]] because the measured column widths are set as CSS custom properties
- **Related:** [[responsive-design]] because this is a responsive typography technique

## Knowledge Check

1. Why can't you calculate the font-size mathematically from the font metrics? -> See [What It Is](#what-it-is)
2. What's the purpose of the reference size? -> See [The Mental Model](#the-mental-model)
3. Why use `getBoundingClientRect()` instead of `offsetWidth`? -> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [MDN: Element.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
- [CSS Tricks: Fitting Text to a Container](https://css-tricks.com/fitting-text-to-a-container/) — overview of text-sizing approaches
