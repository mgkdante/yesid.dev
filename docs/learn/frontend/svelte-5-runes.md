---
title: "Svelte 5 Runes"
domain: frontend
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - frontend
  - intermediate
prerequisites:
  - "[[svelte-components]]"
  - "[[props-and-events]]"
date: 2026-04-08
---

# Svelte 5 Runes


## The Analogy

`$state` is a column value that can change. `$derived` is a computed column that recalculates automatically when its source columns change. `$effect` is a trigger that fires whenever the values it watches are modified. `$props` is the parameter list of a stored procedure. Together, these four runes are the reactivity engine of Svelte 5 -- they replace the entire Svelte 4 reactivity model.

## What It Is

**Runes** are special compiler directives (prefixed with `$`) that tell Svelte how to track and react to changing values. They are not JavaScript functions you call at runtime -- they are instructions to the Svelte compiler, which transforms them into efficient update code at build time.

The five core runes:

| Rune | SQL Analogy | Purpose |
|------|-------------|---------|
| `$state(initialValue)` | `DECLARE @x INT = 0` | Declares a reactive variable. When it changes, anything that reads it updates automatically. |
| `$derived(expression)` | `AS (col1 * col2) PERSISTED` | Declares a computed value. Recalculates whenever its dependencies change. Read-only. |
| `$effect(() => { ... })` | `CREATE TRIGGER` | Runs a side effect whenever the reactive values inside it change. Used for DOM manipulation, logging, API calls. |
| `$props()` | `@param1 INT, @param2 VARCHAR` | Declares the component's input parameters. Covered in the [[props-and-events]] doc. |
| `$bindable()` | `@param OUTPUT` | Declares a prop that the child can write back to the parent. Like a two-way parameter. |

The key insight: you do not manually tell Svelte "this value changed, please update the UI." The compiler tracks dependencies at build time and generates code that updates exactly the right DOM nodes when state changes. It is like having a database engine that automatically refreshes all dependent views when a base table is updated.

## Why It Matters

Runes are the most important concept in Svelte 5. Every interactive feature -- a dropdown opening, a filter applying, a counter incrementing -- uses runes. If you understand `$state`, `$derived`, and `$effect`, you can read and write any component in this project. This is also what interviewers mean when they ask "how does Svelte handle reactivity?"

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/ServiceCard.svelte` | Line 22: `let svgMorphed = $state(false)` | Simplest `$state` usage -- a boolean toggle |
| `src/lib/components/ServiceCard.svelte` | Lines 23-27: `$derived()` calls | Multiple derived values computing display strings from props |
| `src/routes/+page.svelte` | Line 37: `let localProgress = $state(0)` | `$state` tracking scroll progress as a number |
| `src/routes/+page.svelte` | Lines 48-55: `$derived()` for `serviceActiveIndex` | Complex derivation with math based on scroll state |
| `src/routes/+page.svelte` | Lines 75-79: `$effect()` | Side effect that updates DOM opacity based on scroll progress |
| `src/lib/components/Nav.svelte` | Lines 40-44: `$effect()` | Side effect that locks body scroll when mobile menu opens |
| `src/routes/+layout.svelte` | Lines 13-17: `$derived()` | Deriving boolean flags from the current URL path |

## The Mental Model

```
SQL mental model:

    CREATE TABLE PageState (
        localProgress   FLOAT       DEFAULT 0,     -- $state(0)
        menuOpen        BIT         DEFAULT 0       -- $state(false)
    );

    -- Computed columns update automatically when source columns change
    ALTER TABLE PageState ADD
        isHome       AS (CASE WHEN path = '/' THEN 1 ELSE 0 END),   -- $derived
        activeIndex  AS (FLOOR(localProgress * 8));                   -- $derived

    -- Triggers fire when watched columns change
    CREATE TRIGGER OnMenuToggle ON PageState
    AFTER UPDATE AS
        IF UPDATE(menuOpen)
            -- lock/unlock body scroll
            UPDATE BodyStyle SET overflow = CASE ... END;            -- $effect

Svelte equivalent:

    let localProgress = $state(0);        // mutable value
    let menuOpen = $state(false);         // mutable value

    let isHome = $derived(                // auto-recomputed
        $page.url.pathname === '/'
    );
    let activeIndex = $derived(           // auto-recomputed
        Math.floor(localProgress * 8)
    );

    $effect(() => {                       // auto-triggered
        document.body.style.overflow = menuOpen ? 'hidden' : '';
    });
```

**How reactivity flows:**

```
  $state changes
       |
       v
  $derived recomputes (any expression reading that state)
       |
       v
  Markup updates (any {expression} in the template)
       |
       v
  $effect runs (any effect reading that state or derived)
```

This is automatic. You never call "refresh" or "setState" -- you just assign a new value to the `$state` variable, and everything downstream updates.

## Worked Example

```svelte
<!-- From: src/lib/components/ServiceCard.svelte (simplified) -->
<!-- Renders one service with an SVG that morphs on hover -->

<script lang="ts">
  import type { Service } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';

  // $props() — the input parameters
  let { service, svgContent, index, total }: {
    service: Service;
    svgContent: string;
    index: number;
    total: number;
  } = $props();

  // $state — a mutable reactive value (like a column that can be UPDATEd)
  // This tracks whether the SVG shape has morphed.
  let svgMorphed = $state(false);

  // $derived — computed values that auto-update when dependencies change
  // Like computed columns: SELECT FORMAT(station, '00') AS stationNum
  let stationNum = $derived(String(service.station).padStart(2, '0'));
  let totalStr = $derived(String(total).padStart(2, '0'));
  let title = $derived(resolveLocale(service.title, 'en'));
  let description = $derived(resolveLocale(service.description, 'en'));
  let subtitle = $derived(
    service.subtitle ? resolveLocale(service.subtitle, 'en') : null
  );
</script>

<!-- $state is used in the template — {svgMorphed ? 'morphed' : ''} -->
<!-- When svgMorphed changes from false to true, Svelte updates ONLY this class -->
<button
  class="service-svg-box {svgMorphed ? 'morphed' : ''}"
  onmouseenter={() => svgMorphed = true}
  onmouseleave={() => svgMorphed = false}
>
  <!-- SVG content here -->
</button>
```

**What happens step by step:**

1. Component mounts with `svgMorphed = false`
2. User hovers over the SVG button
3. `onmouseenter` fires, setting `svgMorphed = true` (simple assignment)
4. Svelte detects the `$state` changed
5. The class expression `{svgMorphed ? 'morphed' : ''}` recomputes
6. Svelte updates ONLY the `class` attribute on that one button -- nothing else in the DOM changes
7. The CSS transition for `.morphed` kicks in, creating the circle morph animation

No manual DOM manipulation. No "rerender the component." Svelte surgically updates exactly what changed.

## Common Mistakes

1. **Trying to assign to a `$derived` value:**
   - **What happens:** `stationNum = '99'` throws a compile error -- derived values are read-only
   - **Fix:** If you need to override a computed value, use `$state` instead and update it manually
   - **Why:** `$derived` is a computed column. You cannot UPDATE a computed column in SQL either -- you change the source data and the computed column recalculates

2. **Using `$effect` for things `$derived` can handle:**
   - **What happens:** You write `$effect(() => { computedValue = x * 2 })` instead of `let computedValue = $derived(x * 2)`
   - **Fix:** If your effect just computes a value from other reactive values, use `$derived` instead
   - **Why:** `$derived` is declarative and optimized. `$effect` is for side effects (DOM manipulation, API calls, logging) -- things that reach outside the component. Using `$effect` for computation is like using a trigger when a computed column would suffice

3. **Forgetting that `$state` needs reassignment, not mutation:**
   - **What happens:** You have `let items = $state([1, 2, 3])` and do `items.push(4)` -- the UI may not update
   - **Fix:** Use `items = [...items, 4]` (create a new array) or use `$state` with Svelte's fine-grained reactivity for arrays
   - **Why:** Svelte 5 does track deep mutations on `$state` arrays/objects, but explicitly creating new references is clearer and avoids subtle bugs. Think of it as INSERT INTO vs UPDATE -- be explicit about what changed

4. **Running `$effect` on the server:**
   - **What happens:** Code that accesses `document` or `window` inside `$effect` crashes during SSR
   - **Fix:** `$effect` only runs in the browser by design. But if your component is SSR'd, guard with `if (typeof document !== 'undefined')` or use `onMount` for one-time browser setup
   - **Why:** Effects are meant for browser-side interactivity, not server rendering

## Break It to Learn It

### Exercise 1: Change $derived to $state
1. Open `src/lib/components/ServiceCard.svelte`
2. Change `let stationNum = $derived(String(service.station).padStart(2, '0'))` to `let stationNum = $state(String(service.station).padStart(2, '0'))`
3. **Predict:** Will the station number still display correctly? What happens if the `service` prop changes?
4. **Verify:** Run `bun run dev`, navigate to `/services`, observe the station numbers
5. **What you learned:** `$state` captures the initial value but does not auto-recompute. `$derived` recomputes whenever dependencies change. Using `$state` here means the number would freeze at its initial value if the service prop ever changed
6. **Undo your change**

### Exercise 2: Break the Effect
1. Open `src/lib/components/Nav.svelte`
2. Comment out the `$effect` block on lines 40-44 (the one that sets `document.body.style.overflow`)
3. **Predict:** What happens when you open the mobile menu and try to scroll?
4. **Verify:** Run `bun run dev`, resize to mobile width, open the hamburger menu, try scrolling the page behind it
5. **What you learned:** `$effect` handles side effects that pure computation cannot -- here it prevents scroll behind the menu overlay
6. **Undo your change**

### Exercise 3: Add a New Derived Value
1. Open `src/lib/components/ServiceCard.svelte`
2. After line 27, add: `let titleUpper = $derived(title.toUpperCase());`
3. Replace `{title}` in the `<h2>` tag (line 43) with `{titleUpper}`
4. **Predict:** Will the title show in uppercase? Will it update if the `service` prop changes?
5. **Verify:** Run `bun run dev`, navigate to `/services`, check the service titles
6. **What you learned:** `$derived` chains work -- `titleUpper` depends on `title`, which depends on `service.title`. The whole chain recalculates automatically
7. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because runes live inside the component's script block
- **Depends on:** [[props-and-events]] because `$props()` is itself a rune
- **Enables:** [[component-architecture]] because smart components use `$state` and `$derived` to manage their internal logic
- **Related:** [[sveltekit-load-functions]] because load functions produce the initial data that `$derived` values compute from

## Knowledge Check

1. What is the difference between `$state` and `$derived`? --> See [The Mental Model](#the-mental-model)
2. When should you use `$effect` vs `$derived`? --> See [Common Mistakes](#common-mistakes)
3. How does Svelte know which DOM nodes to update when `$state` changes? --> See [What It Is](#what-it-is)
4. Can you assign a new value to a `$derived` variable? --> See [Common Mistakes](#common-mistakes)
5. What SQL concept is `$effect` most similar to? --> See [The Analogy](#the-analogy)

## Go Deeper

- [Svelte docs -- Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Svelte tutorial -- State](https://svelte.dev/tutorial/svelte/state)
- [Svelte blog -- Runes (announcement)](https://svelte.dev/blog/runes)
