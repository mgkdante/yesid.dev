---
title: "Test Setup and Mocking"
domain: testing
difficulty: 2
difficulty_label: intermediate
reading_time: 14
tags:
  - learn
  - testing
  - intermediate
prerequisites:
  - "[[vitest-fundamentals]]"
date: 2026-04-08
---

# Test Setup and Mocking


## The Analogy

Test setup and mocking is like creating a test database with fake tables. In SQL, you might create a test environment where `Users` table has 5 known rows and `Payments` table is replaced by a mock that always returns "success." The real production database has millions of rows and connects to Stripe -- your test environment substitutes controlled fakes so tests are fast, isolated, and deterministic. In JavaScript, `vi.mock()` replaces real modules with fakes, and the setup file runs before every test to create that controlled environment.

## What It Is

**Test Setup** is a file that runs before every test file in the project. It configures the test environment once so you do not repeat boilerplate in every test. In this project, the setup file is `src/tests/setup.ts`.

**jsdom** is a JavaScript implementation of the browser DOM. It lets tests render HTML without opening a real browser. However, jsdom is incomplete -- it does not support WebGL (needed by Three.js/Threlte), Canvas (needed by Lottie), `matchMedia` (needed for responsive queries), or `IntersectionObserver` (needed for scroll-triggered animations). The setup file fills these gaps with **stubs**.

**Mocking** (`vi.mock()`) replaces a real module with a fake implementation during tests. This serves two purposes:
1. **Environment compatibility:** GSAP, Three.js, and Lottie require a real browser with GPU access. jsdom cannot provide this. Mocks prevent crashes.
2. **Test isolation:** You want to test that your component calls GSAP's `timeline()`, not that GSAP actually animates pixels. The mock tracks calls without executing real animations.

The `svelteTesting()` Vite plugin from `@testing-library/svelte` is also critical -- it adds `'browser'` to Vite's resolve conditions (so Svelte uses the client-side build) and configures SSR handling. This is included in `vite.config.ts`.

## Why It Matters

Understanding test infrastructure answers the interview question "How do you test code that depends on browser APIs or third-party services?" The answer is never "I skip those tests" -- it is "I mock the dependencies so tests are fast and reliable." For clients, a well-configured test setup means the entire team can run `bun run test` and get consistent results regardless of their machine, operating system, or GPU.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/tests/setup.ts` | `import '@testing-library/jest-dom/vitest'` (line 2) | Adds DOM matchers like `toBeInTheDocument()` to every test |
| `src/tests/setup.ts` | `HTMLCanvasElement.prototype.getContext` stub (lines 12-43) | Prevents lottie-web from crashing when it accesses canvas context at import time |
| `src/tests/setup.ts` | `vi.mock('gsap', ...)` (lines 74-100) | Replaces GSAP with a mock that tracks timeline/tween calls without real animation |
| `src/tests/setup.ts` | `vi.mock('@threlte/core', ...)` (lines 149-161) | Mocks the entire Threlte library since jsdom has no WebGL |
| `src/tests/setup.ts` | `vi.stubGlobal('fetch', ...)` (lines 204-213) | Intercepts Web3Forms API calls, returning fake success responses |
| `vite.config.ts` | `svelteTesting()` plugin and `setupFiles` config | Wires everything together: jsdom environment, setup file, Svelte test plugin |

## The Mental Model

```
Test environment vs real browser:

Real browser:                    jsdom (test environment):
├── DOM (full)                   ├── DOM (mostly complete)
├── CSS rendering                ├── No CSS rendering
├── WebGL / GPU                  ├── No WebGL ← mocked
├── Canvas 2D                    ├── Canvas stub ← mocked
├── matchMedia                   ├── matchMedia stub ← mocked
├── IntersectionObserver         ├── IntersectionObserver stub ← mocked
├── fetch (network)              ├── fetch stub ← mocked
└── Animation (60fps)            └── No animation ← mocked

What the setup file does:

  src/tests/setup.ts runs BEFORE every test file
       ↓
  1. Import jest-dom matchers (toBeInTheDocument, etc.)
  2. Import svelte testing config (flush reactivity)
  3. Stub browser APIs that jsdom lacks:
     - HTMLCanvasElement.getContext → fake context
     - window.matchMedia → returns { matches: false }
     - IntersectionObserver → no-op class
  4. Mock heavy libraries:
     - gsap → tracks calls, no real animation
     - gsap/ScrollTrigger → no-op
     - gsap/MorphSVGPlugin → no-op
     - gsap/SplitText → stub class
     - @threlte/core → fake Canvas, T, useThrelte
     - @threlte/extras → fake useGltf
     - postprocessing → fake EffectComposer
     - lottie-web → fake loadAnimation
  5. Mock fetch for Web3Forms API calls


SQL analogy:

  Real DB:    Users table → 5M rows, Payment API → Stripe
  Test DB:    Users table → 5 rows, Payment API → always returns {success: true}

  Real app:   GSAP → renders 60fps GPU animation
  Test app:   GSAP → {timeline: vi.fn(), to: vi.fn()} — just records calls
```

## Worked Example

```typescript
// From: src/tests/setup.ts
// Mock GSAP — the most complex mock in the setup file.

// WHY: GSAP relies on getBoundingClientRect, computed styles, scroll position —
// none of which work properly in jsdom. We mock it to test that our code
// CALLS GSAP correctly, not that GSAP renders correctly (that's Playwright's job).

vi.mock('gsap', () => {
  // Create a mock timeline that supports method chaining
  // Real GSAP: tl.to('.box', {x: 100}).from('.text', {opacity: 0})
  // Mock: records the calls, returns itself for chaining
  const mockTimeline = {
    to: vi.fn().mockReturnThis(),       // .to() returns the timeline (chaining)
    from: vi.fn().mockReturnThis(),     // .from() returns the timeline
    fromTo: vi.fn().mockReturnThis(),   // .fromTo() returns the timeline
    set: vi.fn().mockReturnThis(),
    progress: vi.fn().mockReturnThis(),
    kill: vi.fn(),                       // .kill() does not chain
    pause: vi.fn().mockReturnThis(),
    then: vi.fn((cb: () => void) => {   // .then() for Promise-like API
      cb();
      return mockTimeline;
    })
  };

  return {
    gsap: {
      registerPlugin: vi.fn(),
      from: vi.fn(() => ({ kill: vi.fn() })),
      to: vi.fn(() => ({ kill: vi.fn() })),
      fromTo: vi.fn(() => ({ kill: vi.fn() })),
      set: vi.fn(),
      killTweensOf: vi.fn(),
      matchMedia: vi.fn(),
      timeline: vi.fn(() => mockTimeline)  // gsap.timeline() returns our mock
    }
  };
});
```

```typescript
// From: src/tests/setup.ts
// Mock fetch for Web3Forms — intercepts API calls in tests.

const originalFetch = globalThis.fetch;
vi.stubGlobal('fetch', async (url: string | URL | Request, init?: RequestInit) => {
  const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;

  // SQL analogy: IF the query targets the web3forms "table", return a canned result
  if (urlStr.includes('web3forms.com')) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // For any other URL, use the real fetch
  return originalFetch(url, init);
});
```

The fetch mock is selective: it only intercepts Web3Forms requests, letting other fetches through. This is like a test database that fakes the Payments table but uses real data for everything else.

## Common Mistakes

1. **Re-mocking in individual test files what the setup already mocks:**
   - **What happens:** You add `vi.mock('gsap', ...)` in a component test file. It might conflict with or override the global mock, causing confusing behavior.
   - **Fix:** Check `src/tests/setup.ts` first. If the module is already mocked there, just use it. Only add per-file mocks when you need a different mock behavior for a specific test.
   - **Why:** The setup file provides baseline mocks for the entire test suite. Per-file mocks should be exceptions, not duplications.

2. **Forgetting that mocks do not execute real logic:**
   - **What happens:** You write a test expecting GSAP to actually move an element, then assert on its position. The test fails because the mock does not change the DOM.
   - **Fix:** Test that GSAP was called with the right arguments (`expect(gsap.to).toHaveBeenCalledWith(...)`) rather than testing the visual result. Visual testing belongs in Playwright E2E tests.
   - **Why:** Mocks record calls -- they do not execute behavior. The test boundary is: Vitest verifies invocation, Playwright verifies output.

3. **Not understanding why a stub exists:**
   - **What happens:** You remove the `HTMLCanvasElement.getContext` stub thinking it is unnecessary. Tests crash with "Cannot set properties of null."
   - **Fix:** Read the comments in the setup file. Every stub has a comment explaining what crashes without it and why.
   - **Why:** jsdom's gaps are not obvious until something tries to use a missing API at import time. The crash often happens in a dependency's module-level code, not in your test.

## Break It to Learn It

### Exercise 1: Remove the Canvas Stub
1. Open `src/tests/setup.ts`
2. Comment out the entire `HTMLCanvasElement.prototype.getContext` block (lines 12-43)
3. **Predict:** Tests that import components using lottie-web will crash with a "Cannot set properties of null" error
4. **Verify:** Run `bun run test` and read the error output
5. **What you learned:** jsdom does not implement Canvas -- the stub prevents import-time crashes in libraries that probe canvas context
6. **Undo your change**

### Exercise 2: Break the GSAP Mock Chain
1. Open `src/tests/setup.ts`
2. In the GSAP mock, change `to: vi.fn().mockReturnThis()` to `to: vi.fn()` (remove `.mockReturnThis()`)
3. **Predict:** Any code that chains `.to().from()` will crash because `.to()` now returns `undefined` instead of the timeline
4. **Verify:** Run `bun run test` and check for "Cannot read properties of undefined" errors
5. **What you learned:** `.mockReturnThis()` enables method chaining -- GSAP's fluent API requires each method to return the timeline
6. **Undo your change**

### Exercise 3: Change the Fetch Mock Response
1. Open `src/tests/setup.ts`
2. Change `{ success: true }` to `{ success: false }` in the Web3Forms fetch mock
3. **Predict:** Tests for the contact form submission flow will now see a failure response -- any tests that assert "success" behavior will fail
4. **Verify:** Run `bun run test` and check if any contact-related tests fail
5. **What you learned:** Mock responses control the test scenario -- changing the mock lets you test error paths without needing a real API
6. **Undo your change**

## Connections

- **Depends on:** [[vitest-fundamentals]] because the setup file uses `vi.mock()` and `vi.fn()` from Vitest
- **Enables:** [[component-testing]] because component tests rely on the mocked environment that the setup file provides
- **Enables:** [[what-to-test]] because understanding what is mocked clarifies what can and cannot be tested in Vitest
- **Related:** [[playwright-e2e]] because Playwright tests in a real browser, complementing what jsdom mocks cannot cover

## Knowledge Check

1. Why does this project need a test setup file? → See [What It Is](#what-it-is)
2. What four browser APIs does jsdom lack that the setup file stubs? → See [The Mental Model](#the-mental-model)
3. What does `vi.fn().mockReturnThis()` do and why is it needed for GSAP? → See [Worked Example](#worked-example)
4. Why is the fetch mock selective (only intercepting Web3Forms URLs)? → See [Worked Example](#worked-example)
5. What is the purpose of the `svelteTesting()` Vite plugin? → See [What It Is](#what-it-is)

## Go Deeper

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Testing Library Svelte -- Vite Plugin](https://testing-library.com/docs/svelte-testing-library/setup)
