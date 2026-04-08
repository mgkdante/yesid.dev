---
title: "Reading Error Messages"
domain: debugging
difficulty: 1
difficulty_label: beginner
reading_time: 12
tags:
  - learn
  - debugging
  - beginner
date: 2026-04-08
---

# Reading Error Messages


## The Analogy

Like reading a SQL error -- "Msg 207, Level 16, State 1, Line 12: Invalid column name 'nmae'" tells you the error code (207), severity (Level 16), and exact location (Line 12). Frontend error messages work the same way: they tell you what went wrong (TypeError), where it happened (file path + line number), and often hint at why. The stack trace is like SQL Server's error chain -- it shows you the call stack from the crash point all the way back to the entry point, just like a SQL error might show the stored procedure call chain.

## What It Is

An **error message** in frontend development is a structured report the runtime produces when something fails. It has three parts:

1. **Error type** -- the category of failure. JavaScript has built-in error types like `TypeError` (you used a value the wrong way), `ReferenceError` (you referenced a variable that does not exist), and `SyntaxError` (your code is not valid JavaScript/TypeScript). TypeScript adds compile-time errors that catch problems before the code runs at all.

2. **Message** -- a human-readable description. "Cannot read properties of undefined (reading 'name')" means you tried to access `.name` on something that was `undefined`.

3. **Stack trace** -- a list of function calls leading to the crash, from most recent (where it broke) to oldest (where execution started). Each line shows a file path and line number. The top line is where the error actually occurred; the lines below show what called that function, what called that function, and so on.

In this project, errors surface in three places: the **terminal** (where `bun run dev` is running), the **browser console** (F12 > Console tab), and the **Vite error overlay** (a red full-screen overlay that appears directly on the page in development mode).

## Why It Matters

Every developer spends more time reading errors than writing code. In interviews, "walk me through how you debug a problem" is a common question -- and the answer starts with "I read the error message carefully." Skipping this step and guessing is the number one time waster. If you can parse a stack trace, identify the error type, and jump to the correct line, you solve problems in minutes instead of hours.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/utils/gsap.ts` | The `registerGsapPlugins()` function | If you forget to call this before using GSAP, you get a runtime error. The stack trace leads you here. |
| `src/lib/motion/actions/reveal.ts` | The `isPrefersReducedMotion()` guard at line 43 | If `window` is accessed during SSR, you get "window is not defined". This guard prevents that error. |
| `src/lib/data/types.ts` | The `LocalizedString` interface | TypeScript errors reference this when you pass a plain string where a `LocalizedString` is expected. |
| `vite.config.ts` | The `test.setupFiles` pointing to `./src/tests/setup.ts` | When test setup fails, the error message references this config. Understanding this path matters. |
| `src/tests/setup.ts` | The GSAP and browser API mocks | When a test crashes with "Cannot read properties of null", the fix is usually a missing mock here. |

## The Mental Model

```
ERROR MESSAGE ANATOMY
=====================

TypeError: Cannot read properties of undefined (reading 'name')    <-- (1) TYPE + MESSAGE
    at resolveLocale (src/lib/data/locale.ts:14:22)                 <-- (2) WHERE IT BROKE
    at AboutIdentity (src/lib/components/AboutIdentity.svelte:16:20) <-- (3) WHO CALLED IT
    at renderComponent (node_modules/svelte/...)                     <-- (4) FRAMEWORK INTERNALS
    at ...                                                          <-- (ignore these)

Reading order:
  1. Read the TYPE first  -->  TypeError = "wrong value type"
  2. Read the MESSAGE     -->  "undefined" has no property "name"
  3. Read the TOP LINE    -->  locale.ts line 14 — that is where to look
  4. Read the SECOND LINE -->  AboutIdentity.svelte line 16 called it
  5. IGNORE framework internals (node_modules/svelte/...)

SQL EQUIVALENT
==============
  Msg 207, Level 16, State 1, Procedure sp_GetUser, Line 12
  Invalid column name 'nmae'

  (1) Error code 207 = "invalid column name" --> (1) TypeError = wrong type
  (2) Line 12 in sp_GetUser                  --> (2) locale.ts:14
  (3) The calling stored procedure            --> (3) AboutIdentity.svelte:16
```

### Where errors appear in this project

```
TERMINAL (bun run dev)           BROWSER (F12 > Console)        VITE OVERLAY (on page)
========================         =======================        ======================
- TypeScript compile errors      - Runtime JavaScript errors    - Compile errors only
- SSR crashes                    - Failed network requests      - Shows file + line
- Build failures                 - Component lifecycle errors   - Click to open in editor
- Test failures (bun run test)   - Console.error() calls        - Red full-screen box
```

### Common error types

| Error Type | SQL Equivalent | What It Means |
|-----------|----------------|---------------|
| `TypeError` | Invalid data type conversion | You used a value in a way its type does not support |
| `ReferenceError` | Invalid column name | You referenced a variable/function that does not exist |
| `SyntaxError` | Incorrect syntax near... | Your code is not valid JavaScript/TypeScript |
| `TS2322` | Column type mismatch | TypeScript: you assigned a value of the wrong type |
| `TS2339` | Invalid column name (at compile time) | TypeScript: the property does not exist on this type |
| `TS2345` | Parameter type mismatch | TypeScript: argument type does not match parameter type |

## Worked Example

Here is a real TypeScript error from this project. Suppose you write a component that passes a plain string where a `LocalizedString` is expected:

```typescript
// BROKEN CODE — in a hypothetical component
import type { Service } from '$lib/data/types.js';

const myService: Service = {
    id: 'test',
    title: 'My Service',         // <-- ERROR HERE
    description: { en: 'A service' },
    station: 1,
    relatedProjects: []
};
```

TypeScript produces:

```
error TS2322: Type 'string' is not assignable to type 'LocalizedString'.

  src/lib/components/MyComponent.svelte:6:5
    6     title: 'My Service',
          ~~~~~

  The expected type comes from property 'title' which is declared here on type 'Service'

    src/lib/data/types.ts:70:2
      70     title: LocalizedString;
             ~~~~~
```

**Reading this error step by step:**

1. **Error code TS2322** -- type assignment mismatch (like trying to INSERT a VARCHAR into an INT column).
2. **"Type 'string' is not assignable to type 'LocalizedString'"** -- you gave a plain string, but the interface requires a `LocalizedString` object.
3. **Line 6 of MyComponent.svelte** -- the exact line with the problem, with `~~~~~` underlining the offending property.
4. **"declared here on type 'Service'"** -- TypeScript even tells you where the type was defined (`types.ts:70`), so you can see what shape it expects.

**The fix:**

```typescript
title: { en: 'My Service' },  // LocalizedString object, not a plain string
```

TypeScript caught this at compile time -- the page never loaded broken content. This is why `bun run check` runs the TypeScript compiler before every commit.

## Common Mistakes

1. **Only reading the first line of a stack trace**
   - **What happens:** You see "TypeError: Cannot read properties of undefined" and start guessing what is undefined, changing random variables.
   - **Fix:** Read the full top line including the file path and line number. Open that exact file at that exact line. The answer is almost always obvious once you look at the right place.
   - **Why:** The message tells you *what* broke; the file:line tells you *where*. You need both.

2. **Ignoring TypeScript errors and hoping they go away**
   - **What happens:** You see red squiggles in your editor or errors from `bun run check`, but the dev server still loads the page, so you assume it is fine. Later, the page crashes at runtime with the exact error TypeScript warned about.
   - **Fix:** Run `bun run check` and fix every error. TypeScript errors are like SQL schema validation -- they catch bugs before anything runs.
   - **Why:** TypeScript errors are compile-time guarantees. Runtime errors are production incidents. Fix the cheap ones to prevent the expensive ones.

3. **Searching the error message without including the error type**
   - **What happens:** You Google "Cannot read properties of undefined" and get ten million results, none specific to your situation.
   - **Fix:** Include the error type, the property name, and the library. Search "TypeError Cannot read properties of undefined reading 'name' SvelteKit" to get relevant results.
   - **Why:** Error messages are generic -- thousands of different bugs produce the same message. The context (type, property, framework) narrows it down.

## Break It to Learn It

### Exercise 1: Trigger a TypeError

1. Open `src/lib/motion/actions/reveal.ts`
2. On line 39, change `const { direction = 'up', delay = 0, duration = 0.7 } = params;` to `const { direction = 'up', delay = 0, duration = 0.7 } = undefined;`
3. **Predict:** What error type will appear, and where will it show up (terminal, browser, or overlay)?
4. **Verify:** Run `bun run dev`, open `http://localhost:5173/`, check all three places
5. **What you learned:** Destructuring `undefined` produces a TypeError -- the same class of error as trying to access a column on a NULL row in SQL
6. **Undo your change**

### Exercise 2: Trigger a TypeScript error

1. Open `src/lib/data/types.ts`
2. Find the `LocalizedString` interface (line 12) and change `en: string;` to `en: number;`
3. **Predict:** How many files will show TypeScript errors? Will the dev server still start?
4. **Verify:** Run `bun run check` and count the errors. Then run `bun run dev` and see if the page loads.
5. **What you learned:** TypeScript errors are compile-time checks -- changing a type definition cascades errors to every file that uses it, just like changing a column type in SQL breaks every query that references it
6. **Undo your change**

### Exercise 3: Read a stack trace

1. Open `src/lib/motion/stores/reducedMotion.ts`
2. On line 13, change `if (typeof window === 'undefined') return false;` to just `return window.matchMedia(QUERY).matches;` (remove the guard)
3. **Predict:** Will this error appear in the browser or the terminal? What error type?
4. **Verify:** Run `bun run dev` and check both places. Read the full stack trace -- which file and line does it point to?
5. **What you learned:** SSR code runs on the server where `window` does not exist. The guard was there for a reason. The error type (ReferenceError) and stack trace lead you directly to the problem.
6. **Undo your change**

## Connections

- **Enables:** [[browser-devtools]] because knowing what errors mean is required before the Console tab is useful
- **Enables:** [[common-mistakes]] because each common mistake produces a specific error message you now know how to read
- **Related:** [[svelte-devtools]] because component-level errors often need the component tree to understand context

## Knowledge Check

1. A stack trace has 8 lines. Which line do you read first, and which lines can you usually ignore? --> See [The Mental Model](#the-mental-model)
2. What is the difference between a TypeError and a ReferenceError? --> See [The Mental Model](#the-mental-model)
3. You see error TS2322 but the dev server still works. Should you fix it? --> See [Common Mistakes](#common-mistakes)
4. Where do TypeScript compile errors appear -- terminal, browser console, or Vite overlay? --> See [The Mental Model](#the-mental-model)
5. You get "Cannot read properties of undefined (reading 'name')". What does "undefined" tell you about the data? --> See [Worked Example](#worked-example)

## Go Deeper

- [MDN: JavaScript Error Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors)
- [TypeScript Error Messages Explained (Total TypeScript)](https://www.totaltypescript.com/articles/how-to-read-typescript-errors)
