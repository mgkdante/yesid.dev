---
title: "Browser DevTools"
domain: debugging
difficulty: 1
difficulty_label: beginner
reading_time: 15
tags:
  - learn
  - debugging
  - beginner
date: 2026-04-08
---

# Browser DevTools


## The Analogy

Browser DevTools is like SQL Profiler -- it lets you watch what the browser is doing in real time. The **Elements** panel is like browsing table schemas (`sp_help`): you can see every element, its properties, and its relationships. The **Console** is like the Messages tab in SSMS: log output, warnings, and errors. The **Network** tab is like tracing query execution against external servers: you see every HTTP request, its payload, response time, and status code. The **Performance** tab is like an execution plan: it shows you where time is being spent frame by frame.

## What It Is

**Browser DevTools** is a built-in debugging toolkit that ships with every modern browser (Chrome, Firefox, Edge). You open it by pressing **F12** (or **Ctrl+Shift+I** on Windows). It provides panels that let you inspect and modify the live page without changing source code.

The four panels you will use most:

1. **Elements** -- shows the DOM (Document Object Model), which is the tree of HTML elements currently rendered on the page. You can click any element to see its CSS styles, computed dimensions, and position. You can even edit styles live to test changes before writing code.

2. **Console** -- shows JavaScript log output (`console.log()`), warnings, and errors. You can also type JavaScript directly into the console to query the page state, like running ad-hoc SQL queries against your database.

3. **Network** -- shows every HTTP request the page makes: HTML documents, CSS files, JavaScript bundles, images, API calls, font files. Each row shows the URL, HTTP method, status code, size, and timing. This is where you debug "my data is not loading" problems.

4. **Performance** -- records a timeline of everything the browser does: parsing, rendering, painting, JavaScript execution. This shows you frame rate drops, long-running scripts, and layout thrashing. You will not use this daily, but it is essential for animation performance debugging.

## Why It Matters

DevTools is the single most important tool in frontend development. In interviews, candidates who say "I would open DevTools and check the Console" demonstrate practical debugging skills. For client work, DevTools lets you diagnose why a page loads slowly, why a layout is broken, or why an API call fails -- all without deploying any code changes. If SQL Profiler is your most-used tool as a DBA, DevTools is the equivalent for frontend.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/AboutIdentity.svelte` | The rendered DOM structure with `use:reveal`, `use:tilt`, `use:cursorGlow` | Inspect the computed `transform` CSS property in Elements to see tilt values update live as you move your cursor |
| `src/lib/motion/actions/reveal.ts` | The `gsap.from()` call that sets `opacity: 0` initially | Elements panel shows elements at `opacity: 0` before ScrollTrigger fires -- useful for debugging "invisible element" issues |
| `src/routes/+page.svelte` | The home page with 8 metro stops | Network tab shows all the Lottie JSON files, SVGs, and 3D models loaded. Performance tab shows GSAP animation frame rate. |
| `src/lib/components/ContactPage.svelte` | The Web3Forms API submission | Network tab shows the POST request to `api.web3forms.com`, including the request body and response status |
| `src/lib/components/GradientSeparator.svelte` | The CSS `animation: gradient-flow 3s linear infinite` | Elements panel shows the live `background-position` value cycling. Performance tab shows if the animation causes repaints. |

## The Mental Model

```
F12 — OPEN DEVTOOLS
====================

+------------------------------------------------------------------+
|  Elements  |  Console  |  Network  |  Performance  |  ...        |
+------------------------------------------------------------------+

ELEMENTS PANEL (like sp_help / DESCRIBE TABLE)
==============================================
  Left pane: DOM tree (nested HTML elements)
  Right pane: Styles applied to selected element

  Click any element on the page:
    - Left pane highlights it in the DOM tree
    - Right pane shows its CSS rules (which file set each property)
    - Computed tab shows final calculated values

  Live editing:
    - Double-click any CSS value to change it temporarily
    - Changes are NOT saved — they reset on page reload
    - Use this to test "what if I changed the padding to 16px?"

CONSOLE PANEL (like SSMS Messages tab)
=======================================
  Shows:
    console.log('hello')     -->  hello              (white)
    console.warn('careful')  -->  careful             (yellow ⚠)
    console.error('broken')  -->  broken              (red ✕)
    Uncaught TypeError...    -->  runtime crash        (red ✕)

  You can type JavaScript directly:
    > document.querySelectorAll('[use\\:reveal]').length
    22
    (Like running: SELECT COUNT(*) FROM elements WHERE action = 'reveal')

NETWORK PANEL (like SQL Profiler)
==================================
  Each row = one HTTP request:
  | Name            | Status | Type   | Size  | Time   |
  |-----------------|--------|--------|-------|--------|
  | +page.svelte    | 200    | doc    | 14kB  | 45ms   |
  | app.css         | 200    | style  | 8kB   | 12ms   |
  | gsap.js         | 200    | script | 62kB  | 23ms   |
  | train.json      | 200    | json   | 4kB   | 8ms    |
  | api.web3forms   | 200    | fetch  | 120B  | 340ms  |

  Filter by type: JS, CSS, Img, Font, Fetch/XHR
  Red rows = failed requests (4xx, 5xx, network error)

PERFORMANCE PANEL (like execution plan)
=========================================
  1. Click Record (or Ctrl+E)
  2. Interact with the page (scroll, click)
  3. Click Stop
  4. Timeline shows:
     - Green bars = painting (rendering pixels)
     - Yellow bars = JavaScript execution
     - Purple bars = layout calculation
     - Red triangles = dropped frames (jank)

  Target: 60fps = each frame must complete in < 16.6ms
```

## Worked Example

**Debugging a "missing element" on the About page using the Elements panel:**

You load `http://localhost:5173/about` and the identity card appears invisible. Here is how you use DevTools to diagnose it:

```
Step 1: Open DevTools (F12)

Step 2: Click the element selector (top-left corner of DevTools, the cursor-in-a-box icon)
        OR press Ctrl+Shift+C

Step 3: Hover over where the identity card SHOULD be on the page
        The Elements panel highlights the element:

        <div class="group bento-card relative overflow-hidden ..."
             data-testid="about-identity"
             style="opacity: 0; transform: translateY(20px);">

Step 4: Look at the inline style:
        opacity: 0         <-- This is why it is invisible!
        transform: translateY(20px)  <-- It is also shifted down 20px

Step 5: Check the Styles panel on the right:
        element.style {
            opacity: 0;              <-- Set by GSAP (gsap.from)
            transform: translateY(20px);
        }

Step 6: Diagnosis — GSAP's reveal action set opacity to 0 and is waiting
        for ScrollTrigger to fire. The element has not entered the viewport
        yet (start: 'top 80%'), so the animation has not played.

Step 7: Scroll down to trigger the animation. Watch the opacity and
        transform values change in real time in the Styles panel.
```

This is exactly like running `SELECT opacity, transform FROM elements WHERE testid = 'about-identity'` and seeing that the values explain the visual state.

## Common Mistakes

1. **Editing styles in Elements and thinking the change is saved**
   - **What happens:** You tweak a padding value in the Styles panel, the page looks perfect, you close DevTools satisfied. Next page reload, the change is gone.
   - **Fix:** DevTools edits are temporary. Once you find the right value, go to the source file and make the change there. DevTools is for experimenting, not for making permanent changes.
   - **Why:** DevTools modifies the in-memory DOM, not your source files. It is a live scratch pad, not an editor.

2. **Ignoring the Console tab when something looks wrong**
   - **What happens:** A component renders incorrectly or is missing. You spend 20 minutes reading source code. Meanwhile, the Console has a red error message that says exactly what went wrong.
   - **Fix:** Always check the Console first. It takes two seconds. Most visual bugs have a corresponding error message.
   - **Why:** JavaScript errors often prevent components from rendering. The Console tells you what the component tried to do and where it failed.

3. **Not filtering the Network tab**
   - **What happens:** You are looking for a failed API call, but the Network tab shows 80 requests (CSS, JS, fonts, images). You scroll through all of them looking for the one that matters.
   - **Fix:** Use the filter buttons at the top of the Network tab. Click "Fetch/XHR" to see only API calls. Click "JS" for scripts. Click "Img" for images.
   - **Why:** A typical page load in this project makes 40-60 requests. Filtering narrows it to the 2-3 you care about.

## Break It to Learn It

### Exercise 1: Inspect the tilt effect

1. Run `bun run dev` and open `http://localhost:5173/about` in Chrome
2. Press F12 to open DevTools, click the Elements tab
3. Use Ctrl+Shift+C to select the identity card on the page
4. **Predict:** As you move your cursor over the card, which CSS property will change in the Styles panel?
5. **Verify:** Watch the `element.style` section as you hover -- you should see `transform: perspective(800px) rotateX(...)deg rotateY(...)deg` update in real time
6. **What you learned:** DevTools shows live CSS changes driven by JavaScript -- `use:tilt` in `src/lib/motion/actions/tilt.ts` is writing these transform values on every mouse move

### Exercise 2: Find an API call in the Network tab

1. Open `http://localhost:5173/contact` with DevTools open
2. Click the Network tab and then click "Fetch/XHR" filter
3. Fill in the contact form and click submit
4. **Predict:** What URL will appear in the Network tab? What HTTP method?
5. **Verify:** Look for a POST request to `api.web3forms.com/json`. Click it to see the request body (your form data) and the response body (`{ "success": true }`)
6. **What you learned:** The Network tab is like SQL Profiler for HTTP requests -- you see exactly what data was sent and what came back, including timing

### Exercise 3: Console as a query tool

1. Open `http://localhost:5173/` with DevTools open (Console tab)
2. Type `document.querySelectorAll('[data-testid]').length` and press Enter
3. **Predict:** Will the number be more or less than 10?
4. **Verify:** The number shows how many elements have `data-testid` attributes on the home page -- these are the elements that automated tests can find
5. **What you learned:** The Console is a live JavaScript REPL -- you can query the DOM like running SELECT queries against the rendered page

## Connections

- **Depends on:** [[reading-error-messages]] because Console tab errors use the same format (error type + message + stack trace)
- **Enables:** [[gsap-debugging]] because GSAP debugging uses the Console and Elements panels extensively
- **Related:** [[svelte-devtools]] because Svelte DevTools is a browser extension that adds a panel inside DevTools

## Knowledge Check

1. How do you open DevTools? --> See [What It Is](#what-it-is)
2. An element is invisible on the page. Which DevTools panel do you check first, and what CSS property explains the invisibility? --> See [Worked Example](#worked-example)
3. You want to see only API calls in the Network tab. How do you filter? --> See [Common Mistakes](#common-mistakes)
4. You edited a CSS value in the Elements panel and it looked great. Will that change survive a page reload? --> See [Common Mistakes](#common-mistakes)
5. Which panel shows you frame rate and animation performance? --> See [The Mental Model](#the-mental-model)

## Go Deeper

- [Chrome DevTools -- Official Documentation](https://developer.chrome.com/docs/devtools)
- [Firefox DevTools User Docs](https://firefox-source-docs.mozilla.org/devtools-user/)
