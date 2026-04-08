---
title: "Playwright E2E"
domain: testing
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - testing
  - intermediate
prerequisites:
  - "[[vitest-fundamentals]]"
date: 2026-04-08
---

# Playwright E2E


## The Analogy

If Vitest is like running a SQL query against a test database, Playwright is like having a QA person sit at the production terminal and click through the actual application. They open the website in a real browser, navigate to pages, check that text is visible, click buttons, and verify the result. Playwright automates that QA person -- it launches a real Chromium browser, loads your pages, and runs assertions against what is actually rendered on screen.

## What It Is

Playwright is an end-to-end (E2E) testing framework that tests your application in a real browser. Unlike Vitest (which uses jsdom, a simulated DOM without CSS, GPU, or layout), Playwright launches actual Chromium, Firefox, or WebKit and interacts with your app the way a user would.

**E2E vs Unit tests:**
- **Unit/Component tests (Vitest):** Test individual components in isolation. Fast (milliseconds). No real browser. Cannot verify visual appearance, animations, or cross-page navigation.
- **E2E tests (Playwright):** Test the entire application assembled. Slower (seconds). Real browser. Can verify anything a user can see or do.

The Playwright test file structure:
- **`test('name', async ({ page }) => { ... })`** -- one test case. `page` is a real browser page you can navigate, click, and query.
- **`page.goto('/')`** -- navigate to a URL.
- **`page.getByText('...')`** -- find an element by its visible text.
- **`page.getByRole('heading', { level: 1 })`** -- find by accessibility role.
- **`expect(locator).toBeVisible()`** -- assert an element is visible on screen (not just in the DOM -- actually visible, with layout, opacity, and display).

The key difference from Vitest: `toBeVisible()` checks real visual rendering. In jsdom, an element with `display: none` still exists in the DOM. In Playwright, `toBeVisible()` actually checks the computed styles.

## Why It Matters

E2E tests catch bugs that unit tests cannot: broken navigation, missing content on the deployed page, CSS layout regressions, and JavaScript errors that only happen when all components are assembled. The interview question is "How do you ensure the whole app works, not just individual pieces?" For clients, E2E tests are the last safety net before users hit bugs -- they verify the experience, not just the code.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `playwright.config.ts` | The full config (11 lines) | Defines webServer (build + preview), test directory, and test file pattern |
| `playwright.config.ts` | `command: 'bun run build && bun run preview'` | E2E tests run against a production-like build, not dev server |
| `playwright.config.ts` | `port: 4173` | Vite's preview server runs on port 4173 (dev is 5173) |
| `tests/smoke.spec.ts` | 3 smoke tests | Minimal tests proving the site loads and key content is visible |
| `package.json` | `"test:e2e": "playwright test"` | The command to run E2E tests |

## The Mental Model

```
Testing layers:

  ┌───────────────────────────────────────────┐
  │  Playwright E2E (real browser)            │
  │  Tests: "Does the assembled app work?"    │
  │  Speed: seconds per test                  │
  │  Coverage: broad but shallow              │
  │  Runs: pre-deploy, CI                     │
  └───────────────────────────────────────────┘
                     ▲
                     │ catches what falls through
                     │
  ┌───────────────────────────────────────────┐
  │  Vitest (jsdom)                           │
  │  Tests: "Does each component work?"       │
  │  Speed: milliseconds per test             │
  │  Coverage: narrow but deep                │
  │  Runs: during development, CI             │
  └───────────────────────────────────────────┘


E2E test flow:

  playwright test
       ↓
  1. bun run build       ← builds the production bundle
       ↓
  2. bun run preview     ← starts a local server on port 4173
       ↓
  3. Playwright launches Chromium
       ↓
  4. page.goto('/')      ← browser navigates to the site
       ↓
  5. expect(element).toBeVisible()  ← checks real rendered output
       ↓
  6. Report: ✓ PASS or ✗ FAIL (with screenshot on failure)


SQL analogy:

  Vitest:       SELECT * FROM components WHERE id = 'footer'
                → Tests one component's output in isolation

  Playwright:   Open the production reporting dashboard
                Click "Sales Report"
                Verify the chart appears with correct data
                → Tests the whole system end-to-end
```

## Worked Example

```typescript
// From: tests/smoke.spec.ts
// Smoke tests — the minimum set of E2E tests that prove the site works.

import { test, expect } from '@playwright/test';

// Test 1: Does the home page load at all?
// SQL analogy: SELECT 1 FROM production_server — just checking the connection works
test('home page loads', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');

  // Check that the app root element rendered
  // This catches: blank page, build errors, JavaScript crashes
  await expect(page.getByTestId('app-root')).toBeVisible();
});

// Test 2: Is the key marketing text visible?
// SQL analogy: SELECT tagline FROM home_page WHERE tagline IS NOT NULL
test('tagline is visible', async ({ page }) => {
  await page.goto('/');

  // The tagline must be visible (not just in the DOM — actually rendered)
  await expect(page.getByText('Data infrastructure that moves.')).toBeVisible();
});

// Test 3: Is the main heading visible?
// SQL analogy: SELECT heading FROM home_page WHERE heading_level = 1
test('wordmark is visible', async ({ page }) => {
  await page.goto('/');

  // The <h1> must be visible — this is the brand wordmark
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

These are **smoke tests** -- the minimum viable E2E test suite. They answer one question: "Does the site load and show its core content?" If any of these fail, something is fundamentally broken (build error, missing dependency, JavaScript crash).

```typescript
// From: playwright.config.ts
// Configuration that makes E2E tests work.

import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    // Build the production bundle, then start the preview server
    // This ensures E2E tests run against the same code that deploys
    command: 'bun run build && bun run preview',
    port: 4173,
    // In CI: always start fresh. Locally: reuse existing server if running
    reuseExistingServer: !process.env.CI
  },
  testDir: 'tests',
  testMatch: '**/*.spec.ts'  // Only .spec.ts files (not .test.ts — that's Vitest)
});
```

Note the file naming convention: `.test.ts` = Vitest unit tests (in `src/`), `.spec.ts` = Playwright E2E tests (in `tests/`). This prevents Vitest from accidentally running Playwright tests.

## Common Mistakes

1. **Running E2E tests against the dev server:**
   - **What happens:** Tests pass locally but fail in CI, or tests pass on code that would not survive a production build.
   - **Fix:** Always run E2E against `bun run build && bun run preview` (the production build). This catches build-time errors, missing imports, and broken asset paths.
   - **Why:** The dev server uses Vite's HMR and on-demand transforms. The production build bundles and optimizes differently. Testing against dev gives false confidence.

2. **Writing too many E2E tests:**
   - **What happens:** The E2E suite takes 10 minutes to run. Developers stop running it locally. Bugs slip through.
   - **Fix:** E2E tests should be few and focused -- smoke tests for critical paths. Detailed behavior testing belongs in Vitest (fast, cheap). Use E2E only for things Vitest cannot test.
   - **Why:** E2E tests are slow (they launch a browser and build the project). The test pyramid says: many unit tests, some integration tests, few E2E tests.

3. **Using `page.waitForTimeout()` instead of proper assertions:**
   - **What happens:** You add `await page.waitForTimeout(3000)` hoping an animation finishes. The test is flaky -- sometimes 3 seconds is not enough.
   - **Fix:** Use `await expect(element).toBeVisible()` or `await page.waitForSelector('[data-testid="loaded"]')`. These wait for the actual condition, not a time guess.
   - **Why:** Time-based waits are the #1 cause of flaky E2E tests. Condition-based waits are deterministic.

## Break It to Learn It

### Exercise 1: Run the Smoke Tests
1. Run `bun run test:e2e` in your terminal
2. **Predict:** Playwright will build the project, start a preview server, launch a browser, run 3 tests, and report results
3. **Verify:** Watch the output -- you should see "3 passed" with execution time
4. **What you learned:** E2E tests build and serve the project first -- they test the production artifact, not source code

### Exercise 2: Add a Failing Smoke Test
1. Open `tests/smoke.spec.ts`
2. Add: `test('nonexistent page shows 404', async ({ page }) => { await page.goto('/this-does-not-exist'); await expect(page.getByText('404')).toBeVisible(); });`
3. **Predict:** This test might pass or fail depending on whether a 404 page is implemented (check if the project has one)
4. **Verify:** Run `bun run test:e2e` and observe
5. **What you learned:** E2E tests can verify error states too -- 404 pages, empty states, and edge cases
6. **Undo your change**

### Exercise 3: Compare Vitest and Playwright Speed
1. Run `bun run test` (Vitest) and note how long it takes
2. Run `bun run test:e2e` (Playwright) and note how long it takes
3. **Predict:** Playwright will be significantly slower because it builds the project and launches a real browser
4. **Verify:** Compare the times -- Vitest typically runs in 1-3 seconds, Playwright in 10-30+ seconds
5. **What you learned:** This speed difference is why you write many Vitest tests and few Playwright tests -- fast feedback drives better development

## Connections

- **Depends on:** [[vitest-fundamentals]] because understanding unit tests makes E2E tests clearer by contrast
- **Related:** [[what-to-test]] because the Vitest/Playwright boundary is the core decision in "what to test where"
- **Related:** [[component-testing]] because component tests cover the behaviors that E2E tests do not need to re-test
- **Related:** [[vercel-deployment]] because E2E tests validate the same build artifact that deploys to production

## Knowledge Check

1. What is the difference between E2E tests and unit tests? → See [What It Is](#what-it-is)
2. Why do Playwright tests run against `bun run build && bun run preview` instead of `bun run dev`? → See [Common Mistakes](#common-mistakes)
3. What is the file naming convention that separates Vitest tests from Playwright tests? → See [Worked Example](#worked-example)
4. Why should you avoid `page.waitForTimeout()` in E2E tests? → See [Common Mistakes](#common-mistakes)
5. What are smoke tests and why are they the minimum E2E suite? → See [Worked Example](#worked-example)

## Go Deeper

- [Playwright Official Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
