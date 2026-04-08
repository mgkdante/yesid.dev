---
title: "Vitest Fundamentals"
domain: testing
difficulty: 1
difficulty_label: beginner
reading_time: 12
tags:
  - learn
  - testing
  - beginner
prerequisites:
  - "[[typescript-strict-mode]]"
date: 2026-04-08
---

# Vitest Fundamentals


## The Analogy

Tests are like SQL CHECK constraints -- they verify your code does what it claims. A CHECK constraint says "this column must be positive" and the database rejects any row that violates it. A test says "this function must return 'yesid' when given these inputs" and the test runner rejects any code that violates it. The difference: CHECK constraints run at insert time; tests run whenever you ask (`bun run test`), catching violations before they reach production.

## What It Is

Vitest is a test runner built on Vite (the same build tool this project uses for development). It executes test files, runs assertions, and reports which tests pass or fail. It is the standard testing framework for Vite-based projects like SvelteKit.

A test file has three levels of structure:

1. **`describe('group name', () => { ... })`** -- groups related tests together. Like a SQL `GROUP BY` -- it organizes tests by the thing they are testing (a component, a function, a module).

2. **`it('what it should do', () => { ... })`** -- one individual test. Each `it` block tests one specific behavior. The name should read like a sentence: "it renders a footer element", "it renders the current year."

3. **`expect(actual).toBe(expected)`** -- an assertion. This is the CHECK constraint itself. If `actual` does not match `expected`, the test fails. Vitest provides many matchers:
   - `toBe(value)` -- strict equality (`===`)
   - `toEqual(value)` -- deep equality (objects, arrays)
   - `toBeTruthy()` / `toBeFalsy()` -- truthiness check
   - `toBeInTheDocument()` -- DOM element exists (from jest-dom)
   - `toHaveAttribute('name', 'value')` -- DOM attribute check

Test files are **co-located** with the code they test. `Footer.svelte` has `Footer.test.ts` right next to it. This keeps tests discoverable -- you never need to search for where a component's tests live.

## Why It Matters

Testing is a non-negotiable interview skill. "Do you write tests?" is a screening question -- saying "no" disqualifies you from most serious teams. For clients, tests are insurance: they catch regressions (things that worked yesterday but broke today) before users do. This project requires 80% test coverage -- meaning 80% of your code paths are verified by at least one test.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/Footer.test.ts` | The full test file (37 lines) | A simple, complete example: describe block, 5 test cases, DOM assertions |
| `src/lib/components/ServiceCard.test.ts` | Mock data + render with props | Shows how to test a component that requires specific input data |
| `vite.config.ts` | The `test: { ... }` block | Configures Vitest: jsdom environment, globals enabled, setup file path |
| `package.json` | `"test": "vitest run"` | The script that runs all tests once (CI mode) |

## The Mental Model

```
SQL CHECK vs Vitest assertion:

SQL:     ALTER TABLE users ADD CONSTRAINT chk_age CHECK (age > 0);
         INSERT INTO users (age) VALUES (-1);  -- REJECTED!

Vitest:  expect(calculateAge(birthDate)).toBeGreaterThan(0);
         // If calculateAge returns -1, test FAILS!

Test file structure:

  describe('Footer')                    ← GROUP (the component being tested)
  ├── it('renders a footer element')    ← TEST (one specific behavior)
  │     expect(element).toBeInTheDocument()  ← ASSERTION (the actual check)
  ├── it('renders the brand name')
  │     expect(text).toBeInTheDocument()
  ├── it('renders the current year')
  │     expect(text).toMatch(year)
  ├── it('renders a GitHub link')
  │     expect(link).toHaveAttribute('href', url)
  └── it('renders a LinkedIn link')
        expect(link).toHaveAttribute('href', url)

Test execution flow:

  bun run test
       ↓
  Vitest finds all *.test.ts files in src/
       ↓
  Runs setup file (src/tests/setup.ts) — mocks, polyfills
       ↓
  Executes each describe/it block
       ↓
  Reports: ✓ PASS or ✗ FAIL with line numbers
```

## Worked Example

```typescript
// From: src/lib/components/Footer.test.ts
// Tests for the Footer component — 5 tests, each checking one behavior.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
  // Test 1: Does the footer element exist in the DOM?
  // SQL analogy: SELECT COUNT(*) FROM rendered_dom WHERE testid = 'footer'
  //              — expect count > 0
  it('renders a footer element', () => {
    render(Footer);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  // Test 2: Does the brand name appear?
  // SQL analogy: SELECT * FROM rendered_text WHERE value LIKE '%yesid%'
  it('renders the brand name', () => {
    render(Footer);
    expect(screen.getByText(/yesid/)).toBeInTheDocument();
  });

  // Test 3: Does the current year appear?
  // Note: uses dynamic year so the test does not break on January 1st
  it('renders the current year', () => {
    render(Footer);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  // Test 4: Is the GitHub link correct?
  // Checks both the URL and security attributes (target, rel)
  it('renders a GitHub link with correct href', () => {
    render(Footer);
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/mgkdante');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  // Test 5: Is the LinkedIn link correct?
  it('renders a LinkedIn link with correct href', () => {
    render(Footer);
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/otaloray/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
```

Each test follows the same pattern:
1. **Arrange:** `render(Footer)` -- create the component in jsdom
2. **Act:** `screen.getByX(...)` -- find an element (the query)
3. **Assert:** `expect(...).toX(...)` -- verify the result matches expectations

This is the Arrange-Act-Assert (AAA) pattern. In SQL terms: SET UP data, RUN the query, CHECK the result set.

## Common Mistakes

1. **Testing implementation instead of behavior:**
   - **What happens:** You test that a function was called with specific arguments, but the test breaks when you refactor even though the output is the same.
   - **Fix:** Test what the user sees or what the function returns. "The footer shows the year 2026" is a behavior test. "The footer calls `getFullYear()` once" is an implementation test.
   - **Why:** Implementation tests are brittle. They break on refactors that do not change behavior, creating false negatives that erode trust in the test suite.

2. **Not co-locating test files:**
   - **What happens:** Test files are in a separate `tests/` folder far from the source. When you modify a component, you forget to update its test.
   - **Fix:** Place `Footer.test.ts` right next to `Footer.svelte`. The test is always visible when you work on the component.
   - **Why:** Proximity encourages maintenance. Out of sight = out of mind.

3. **Forgetting to check for test failure first:**
   - **What happens:** You write a test and it passes immediately. But it passes because of a bug in the test, not because the code works.
   - **Fix:** Before implementing, write the test and confirm it fails (Red phase of TDD). Only then implement to make it pass (Green phase).
   - **Why:** A test that never fails never proves anything. Seeing the failure first confirms the test is actually checking something.

## Break It to Learn It

### Exercise 1: Break an Assertion
1. Open `src/lib/components/Footer.test.ts`
2. Change `expect(screen.getByText(/yesid/)).toBeInTheDocument()` to `expect(screen.getByText(/NONEXISTENT/)).toBeInTheDocument()`
3. **Predict:** The "renders the brand name" test will fail because no element contains the text "NONEXISTENT"
4. **Verify:** Run `bun run test` and read the failure output -- it will show which test failed and what was expected vs actual
5. **What you learned:** Assertions fail with descriptive messages that point you to the exact line and expectation that was violated
6. **Undo your change**

### Exercise 2: Add a New Test
1. Open `src/lib/components/Footer.test.ts`
2. Add a new test inside the describe block: `it('renders more than one link', () => { render(Footer); const links = screen.getAllByRole('link'); expect(links.length).toBeGreaterThan(1); });`
3. **Predict:** This test should pass because the footer has at least GitHub and LinkedIn links
4. **Verify:** Run `bun run test` and confirm the new test appears in output and passes
5. **What you learned:** Adding tests is straightforward -- each `it` block is independent
6. **Undo your change**

### Exercise 3: Run Tests in Watch Mode
1. Run `bun run test:watch` in your terminal
2. Open `src/lib/components/Footer.test.ts` and change any assertion to be wrong
3. **Predict:** Vitest will automatically re-run and show the failure without you needing to re-run the command
4. **Verify:** Observe the terminal -- it should update within a second of saving the file
5. **What you learned:** Watch mode (`vitest` without `run`) gives instant feedback during development
6. **Undo your change** and stop the watcher with Ctrl+C

## Connections

- **Depends on:** [[typescript-strict-mode]] because test files use TypeScript for type-safe assertions
- **Enables:** [[component-testing]] because component tests use Vitest as their runner
- **Enables:** [[test-setup-and-mocking]] because mocks are configured through Vitest's setup system
- **Enables:** [[what-to-test]] because knowing how to test leads to the question of what deserves testing
- **Enables:** [[tdd-workflow]] because TDD is a workflow built on top of Vitest fundamentals

## Knowledge Check

1. What are the three levels of structure in a test file (describe, it, expect)? → See [What It Is](#what-it-is)
2. What is the Arrange-Act-Assert pattern and how does it map to SQL? → See [Worked Example](#worked-example)
3. Why should test files be co-located with the source code they test? → See [Common Mistakes](#common-mistakes)
4. What is the difference between `toBe` and `toEqual`? → See [What It Is](#what-it-is)
5. How do you run tests in this project? → See [How We Use It in This Project](#how-we-use-it-in-this-project)

## Go Deeper

- [Vitest Official Documentation](https://vitest.dev/)
- [Testing Library Core Concepts](https://testing-library.com/docs/)
