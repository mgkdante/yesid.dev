---
title: "SVG Paint Server in SPA"
domain: patterns
difficulty: 3
difficulty_label: advanced
reading_time: 9
tags:
  - learn
  - patterns
  - advanced
prerequisites:
  - "[[sveltekit-routing]]"
date: 2026-04-08
---

# SVG Paint Server in SPA


## The Analogy

Imagine you have a SQL view that references a table by its fully qualified name: `SELECT * FROM production.dbo.orders`. If someone renames the database from `production` to `staging`, the view breaks because the reference is now invalid -- `production.dbo.orders` no longer exists. SVG gradients in a single-page app have the exact same problem. An SVG gradient is defined with `<linearGradient id="myGradient">` and referenced with `fill="url(#myGradient)"`. That `url(#myGradient)` is resolved relative to the current page URL. When SPA navigation changes the URL from `/work` to `/work/my-project`, the browser resolves `url(#myGradient)` against the new URL -- and the gradient definition is on the old page. The reference breaks, just like the renamed database.

## What It Is

SVG "paint servers" are elements like `<linearGradient>`, `<radialGradient>`, and `<pattern>` that define how to fill or stroke SVG shapes. They are referenced by fragment URL: `fill="url(#gradient-id)"`. In a traditional multi-page website, this works fine because each page load creates a fresh document with fresh gradient definitions.

In a single-page application (SPA) like SvelteKit, navigation happens client-side without a full page reload. The browser's base URL changes (from `/work` to `/work/my-project`), but the document is the same. Some browsers re-resolve `url(#id)` fragment references against the new URL, and the gradient definition from the previous "page" is no longer in the correct context. The gradient disappears -- shapes render as black or transparent.

The fix is straightforward: avoid `url(#id)` references on elements that persist across SPA navigations. Use direct color values instead (e.g., `stroke="#E07800"` instead of `stroke="url(#brandGradient)"`). If gradients are essential, use unique IDs per component instance or inline the gradient definition within the same SVG element.

## Why It Matters

This bug is notoriously hard to diagnose. The gradient works on first load, works when you hard-refresh, but breaks on client-side navigation. In interviews or real projects, understanding that `url(#id)` is URL-relative -- not document-relative -- shows deep knowledge of how SVG rendering interacts with SPA routing. It is the kind of cross-domain knowledge (SVG spec + routing architecture) that distinguishes senior from mid-level engineers.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/WorkListingPage.svelte` | Lines 281-296: metro line SVG | Uses `stroke="#E07800"` instead of `url(#gradient)` -- the fix in action |
| `src/lib/components/WorkListingPage.svelte` | Lines 281-282: comment explaining why | Documents the decision for future developers |
| `src/lib/components/ServiceListingPage.svelte` | Lines 189-204: metro fill line | Same pattern -- direct color, no `url(#id)` reference |

## The Mental Model

```
Multi-page site (no problem):

Browser URL: /work
Document:
  <svg>
    <defs>
      <linearGradient id="metro">...</linearGradient>
    </defs>
    <line stroke="url(#metro)" />     ← resolves to /work#metro ✓
  </svg>

Click link → full page load → new document
Browser URL: /work/project-1
Document:
  <svg>
    <linearGradient id="metro">...</linearGradient>
    <line stroke="url(#metro)" />     ← resolves to /work/project-1#metro ✓
  </svg>


SPA navigation (PROBLEM):

Browser URL: /work
Document:
  <svg>
    <linearGradient id="metro">...</linearGradient>
    <line stroke="url(#metro)" />     ← resolves to /work#metro ✓
  </svg>

Client-side navigate (no page reload, same document)
Browser URL: /work/project-1
Document:
  <svg>
    <linearGradient id="metro">...</linearGradient>
    <line stroke="url(#metro)" />     ← resolves to /work/project-1#metro
  </svg>                                 but #metro was defined at /work ✗
                                         GRADIENT DISAPPEARS


The fix:

Browser URL: /work
Document:
  <svg>
    <line stroke="#E07800" />          ← direct color, no URL reference
  </svg>                                 works regardless of URL changes ✓
```

## Worked Example

```svelte
<!-- From: src/lib/components/WorkListingPage.svelte -->
<!-- The metro line connecting work cards: -->

<!-- BROKEN VERSION (what we had before the fix): -->
<svg width="2" viewBox="0 0 2 100" preserveAspectRatio="none">
  <defs>
    <linearGradient id="metro-line" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E07800" />
      <stop offset="100%" stop-color="#E07800" stop-opacity="0.3" />
    </linearGradient>
  </defs>
  <!-- This breaks on SPA navigation: url(#metro-line) resolves wrong -->
  <line x1="1" y1="0" x2="1" y2="100" stroke="url(#metro-line)" stroke-width="2" />
</svg>

<!-- FIXED VERSION (what we ship): -->
<!-- WHY: SVG line connecting stations — direct color avoids url(#id)
     paint-server resolution failures in SvelteKit SPA routing -->
<svg
  class="metro-line-svg flex-1"
  width="2"
  viewBox="0 0 2 100"
  preserveAspectRatio="none"
  aria-hidden="true"
  data-metro-line
>
  <line
    x1="1" y1="0" x2="1" y2="100"
    stroke="#E07800"
    stroke-width="2"
  />
</svg>
```

The fix is simple: replace `stroke="url(#metro-line)"` with `stroke="#E07800"`. The gradient effect was minimal (just a slight opacity fade), and the direct color is visually close enough. For cases where a gradient is essential, you would inline the gradient definition inside the same `<svg>` element and use a unique ID (e.g., `id="metro-line-{index}"`) to avoid ID collisions across component instances.

## Common Mistakes

1. **Assuming `url(#id)` is document-scoped:** Thinking that `url(#gradient)` always finds the `<defs>` block in the current document.
   - **What happens:** Works on first load, breaks after client-side navigation. Extremely confusing because refreshing the page fixes it.
   - **Fix:** Avoid `url(#id)` for paint servers in SPA apps. Use direct colors or inline the gradient definition.
   - **Why:** The browser resolves fragment URLs relative to the current page URL, which changes during SPA navigation.

2. **Using the same `id` across component instances:** Multiple `<linearGradient id="gradient">` elements on the same page.
   - **What happens:** The browser uses the first match. Some components get the right gradient, others get a different component's gradient.
   - **Fix:** If you must use `url(#id)`, make IDs unique per instance: `id="gradient-{componentId}"`.
   - **Why:** HTML/SVG IDs must be unique within a document. Multiple elements with the same ID is invalid and behavior is undefined.

3. **Debugging by checking the SVG source only:** Looking at the SVG markup and seeing the gradient is correctly defined.
   - **What happens:** You confirm the gradient exists, the reference looks right, but the gradient still does not render. The problem is invisible in the DOM inspector.
   - **Fix:** Check the current page URL. Navigate to a different page and back. If the gradient reappears, it is a paint-server SPA issue.
   - **Why:** The DOM is correct -- the URL resolution is wrong. This is a runtime resolution issue, not a markup issue.

## Break It to Learn It

### Exercise 1: Reproduce the bug
1. Open `src/lib/components/WorkListingPage.svelte`
2. Replace the metro line `<line>` element's `stroke="#E07800"` with a gradient reference. Add inside the `<svg>`:
   ```svg
   <defs><linearGradient id="metro-test"><stop stop-color="#E07800"/></linearGradient></defs>
   ```
   And change `stroke="#E07800"` to `stroke="url(#metro-test)"`
3. **Predict:** Will the metro line render on `/work`? What about after navigating to `/work/some-project` and back?
4. **Verify:** Run `bun run dev`, go to `/work`, observe the metro line, click a project card, press back
5. **What you learned:** The gradient works on initial load but may break after SPA navigation -- the `url(#id)` reference resolves against the wrong URL
6. **Undo your change**

### Exercise 2: Fix with unique IDs
1. Using the broken version from Exercise 1, change the gradient ID to include the loop index: `id="metro-test-{i}"`
2. Also update the reference: `stroke="url(#metro-test-{i})"`
3. **Predict:** Will unique IDs fix the SPA navigation issue?
4. **Verify:** Test the same navigation sequence as Exercise 1
5. **What you learned:** Unique IDs prevent cross-component collisions but do not fully fix the SPA URL resolution issue -- the fundamental problem is that `url(#id)` resolves against the page URL
6. **Undo your change**

### Exercise 3: Compare hard refresh vs SPA navigation
1. Open `bun run dev` and go to `/work`
2. Observe how the metro line looks
3. Click a project card to navigate to the detail page (SPA navigation)
4. Press the back button (SPA navigation back)
5. Now hard-refresh the page (Ctrl+Shift+R)
6. **Predict:** Does the metro line look different after hard refresh vs after back navigation?
7. **What you learned:** Hard refresh creates a fresh document with correct URL context. SPA navigation reuses the same document with a changed URL. This is the root cause of the paint-server issue.

## Connections

- **Depends on:** [[sveltekit-routing]] because SPA client-side navigation is what changes the URL without a page reload
- **Related:** [[data-driven-components]] because the metro line is part of the data-driven work listing
- **Related:** [[scroll-linked-content]] because the metro line progress in ServiceListingPage is scroll-linked and also avoids `url(#id)`

## Knowledge Check

1. Why does `url(#gradient)` break after SPA navigation but not after a hard refresh? -> See [The Mental Model](#the-mental-model)
2. What is the simplest fix for a paint-server reference in an SPA? -> See [Worked Example](#worked-example)
3. Why is this bug so hard to diagnose? -> See [Common Mistakes](#common-mistakes)
4. How is this like a broken fully qualified table reference after a database rename? -> See [The Analogy](#the-analogy)

## Go Deeper

- [MDN: SVG Paint Servers](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Fills_and_Strokes)
- [CSS Tricks: SVG Fragment Identifiers](https://css-tricks.com/svg-fragment-identifiers-work/)
