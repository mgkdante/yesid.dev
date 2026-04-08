---
title: "TDD Workflow"
domain: testing
difficulty: 2
difficulty_label: intermediate
reading_time: 11
tags:
  - learn
  - testing
  - intermediate
prerequisites:
  - "[[vitest-fundamentals]]"
date: 2026-04-08
---

# TDD Workflow


## The Analogy

TDD is like writing the expected query result BEFORE writing the query. Imagine your boss says "I need a report showing total sales by region." In TDD style, you would first write down the expected output table -- "Region A: $50k, Region B: $30k" -- then write the SQL query to produce that exact result. If the query output does not match your expected table, you know the query is wrong. You never write a query and then wonder "is this right?" because you defined "right" before you started.

## What It Is

Test-Driven Development (TDD) is a workflow where you write the test before writing the implementation. It follows three phases, always in order:

1. **RED** -- Write a test for behavior that does not exist yet. Run it. It must fail. If it passes, either the feature already exists or your test is wrong.

2. **GREEN** -- Write the minimum code to make the test pass. Do not write extra code. Do not optimize. Just make the red test turn green.

3. **REFACTOR** -- Now that the test passes, improve the code. Rename variables, extract functions, remove duplication. Run the test after each change to confirm it still passes.

This cycle repeats for each behavior you add. The result is:
- Every piece of code has at least one test (by construction, not by retroactive effort)
- You never write code without knowing what it should do
- Refactoring is safe because tests catch regressions immediately

This project targets **80% test coverage** -- meaning 80% of code paths are exercised by tests.

## Why It Matters

TDD is one of the most asked-about practices in senior engineering interviews: "Do you practice TDD? Walk me through your process." The answer demonstrates discipline and quality awareness. For clients, TDD means fewer bugs in production because every feature was defined by its expected behavior before implementation began. The alternative -- writing tests after code -- often leads to tests that confirm the code works "as written" rather than "as intended," missing edge cases.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/Footer.test.ts` | 5 tests covering all Footer behaviors | Each test was written before the corresponding Footer feature |
| `src/lib/components/ServiceCard.test.ts` | 6 tests covering props, computed values, links, SVG | Tests define the component's contract before implementation |
| `vite.config.ts` | `test: { include: ['src/**/*.{test,spec}.{js,ts}'] }` | All test files live next to source -- co-location makes TDD natural |
| `package.json` | `"test": "vitest run"` | Single command to run all tests -- fast feedback loop |

## The Mental Model

```
TDD cycle:

  ┌──────────────────────────────────────────────┐
  │                                              │
  │   RED                                        │
  │   Write test → Run → FAIL ✗                  │
  │   "The footer should show the year 2026"     │
  │        ↓                                     │
  │   GREEN                                      │
  │   Write minimal code → Run → PASS ✓          │
  │   Add {new Date().getFullYear()} to Footer   │
  │        ↓                                     │
  │   REFACTOR                                   │
  │   Clean up → Run → Still PASS ✓              │
  │   Extract year to a const, improve naming    │
  │        ↓                                     │
  │   (repeat for next behavior)                 │
  │                                              │
  └──────────────────────────────────────────────┘


SQL analogy:

  RED:      "The report should return 3 regions with totals > 0"
            Run query → ERROR: table 'regions' doesn't exist

  GREEN:    CREATE TABLE regions ...
            INSERT INTO regions VALUES ('A', 50000), ('B', 30000), ('C', 20000)
            Run query → 3 rows, all > 0 ✓

  REFACTOR: Add indexes, rename columns, normalize
            Run query → still 3 rows, all > 0 ✓


Coverage target:

  Total code paths:    100
  Tested paths:         80+    ← 80% coverage target
  Untested paths:       20     ← trivial code, type definitions, CSS

  Coverage does NOT mean "80% of files have tests."
  It means "80% of logical branches (if/else, loops) are exercised."
```

## Worked Example

```typescript
// TDD walkthrough: Building the Footer component test-first.
// (Based on the actual src/lib/components/Footer.test.ts)

// === ROUND 1: RED ===
// Before writing any Footer.svelte code, write the first test:

it('renders a footer element', () => {
  render(Footer);
  expect(screen.getByTestId('footer')).toBeInTheDocument();
});

// Run: bun run test → FAIL
// Footer.svelte doesn't exist yet (or doesn't have data-testid="footer")

// === ROUND 1: GREEN ===
// Write the minimum Footer.svelte:

// <footer data-testid="footer"></footer>

// Run: bun run test → PASS ✓

// === ROUND 2: RED ===
// Next behavior: brand name should appear

it('renders the brand name', () => {
  render(Footer);
  expect(screen.getByText(/yesid/)).toBeInTheDocument();
});

// Run: bun run test → FAIL (footer is empty)

// === ROUND 2: GREEN ===
// Add the brand name:

// <footer data-testid="footer">
//   <span>yesid.</span>
// </footer>

// Run: bun run test → PASS ✓ (both tests pass)

// === ROUND 3: RED ===
// Next behavior: current year

it('renders the current year', () => {
  render(Footer);
  const year = new Date().getFullYear().toString();
  expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
});

// Run: bun run test → FAIL

// === ROUND 3: GREEN ===
// Add the year:

// <footer data-testid="footer">
//   <span>yesid.</span>
//   <span>© {new Date().getFullYear()}</span>
// </footer>

// Run: bun run test → PASS ✓

// After all 5 rounds: REFACTOR
// - Extract year to a variable
// - Add proper styling
// - Group social links
// - Run tests after each change → all still pass ✓
```

The discipline is: never write code that a test does not demand. Each line of Footer.svelte exists because a test required it.

## Common Mistakes

1. **Writing the implementation first, then the test:**
   - **What happens:** The test passes immediately. You never see it fail. You do not know if the test is actually checking the right thing.
   - **Fix:** Force yourself through the RED phase. See the failure. Read the error message. Only then implement.
   - **Why:** A test that never fails is untested itself. The RED phase proves the test has teeth.

2. **Writing too much code in the GREEN phase:**
   - **What happens:** You write a test for "renders the title," then implement the entire component including animations, error handling, and responsive layout.
   - **Fix:** Write only enough code to make the current failing test pass. Nothing more. Additional behaviors get their own RED-GREEN cycle.
   - **Why:** Extra code without tests is untested code. TDD ensures every behavior has a test because every test drives one behavior.

3. **Skipping the REFACTOR phase:**
   - **What happens:** Code accumulates duplication and poor naming because you moved straight from GREEN to the next RED.
   - **Fix:** After GREEN, stop and review. Is there duplication? Are names clear? Can a function be extracted? Refactor with confidence -- the test catches regressions.
   - **Why:** The REFACTOR phase is where code quality happens. Without it, TDD produces correct but messy code.

## Break It to Learn It

### Exercise 1: Experience the RED Phase
1. Create a new test file: `src/lib/data/test-tdd-exercise.test.ts`
2. Write: `import { describe, it, expect } from 'vitest'; describe('TDD exercise', () => { it('adds two numbers', () => { expect(add(2, 3)).toBe(5); }); });`
3. **Predict:** The test will fail because the `add` function does not exist
4. **Verify:** Run `bun run test` and see the specific error message
5. **What you learned:** The RED phase gives you a precise error that tells you exactly what to implement
6. **Delete the test file** (it was just an exercise)

### Exercise 2: Experience the GREEN Phase
1. Create `src/lib/data/test-tdd-exercise.test.ts` again with the same test
2. Add at the top: `function add(a: number, b: number) { return a + b; }`
3. **Predict:** The test will pass now
4. **Verify:** Run `bun run test` and confirm
5. **What you learned:** The GREEN phase is satisfying -- you go from a clear error to a clear success
6. **Delete the test file**

### Exercise 3: Experience the REFACTOR Phase
1. Open `src/lib/components/Footer.test.ts`
2. Notice that every test calls `render(Footer)` separately
3. Think about whether a `beforeEach` block would reduce duplication
4. **Predict:** A `beforeEach(() => { render(Footer); })` would render once before each test, reducing repetition. But it also makes each test less self-contained (you cannot see the render call).
5. **What you learned:** Refactoring is a judgment call -- sometimes DRY is better, sometimes explicit repetition is clearer for test readability

## Connections

- **Depends on:** [[vitest-fundamentals]] because TDD uses Vitest as the test runner
- **Related:** [[component-testing]] because TDD drives component development test-first
- **Related:** [[what-to-test]] because TDD helps you decide what to test -- each test is driven by a specific behavior requirement
- **Related:** [[playwright-e2e]] because visual behaviors that cannot be TDD'd in Vitest can be specified in Playwright

## Knowledge Check

1. What are the three phases of TDD and what happens in each? → See [What It Is](#what-it-is)
2. Why is it important to see the test fail (RED) before implementing? → See [Common Mistakes](#common-mistakes)
3. What does "write the minimum code" mean in the GREEN phase? → See [Common Mistakes](#common-mistakes)
4. What is the project's test coverage target? → See [What It Is](#what-it-is)
5. How does TDD compare to writing the expected query result before the SQL query? → See [The Analogy](#the-analogy)

## Go Deeper

- [Vitest Official Documentation](https://vitest.dev/)
- [Martin Fowler -- Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
