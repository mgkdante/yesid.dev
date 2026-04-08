---
title: "What to Test"
domain: testing
difficulty: 2
difficulty_label: intermediate
reading_time: 11
tags:
  - learn
  - testing
  - intermediate
prerequisites:
  - "[[component-testing]]"
date: 2026-04-08
---

# What to Test


## The Analogy

Like choosing what to put in a SQL audit trail -- test the contract, not the implementation. You audit `INSERT` and `DELETE` operations (the contract your system makes: "data was created/removed"), not internal optimizer decisions (which index was used, how the B-tree was traversed). Tests should verify what your code promises to the outside world (rendered output, return values, API responses), not how it does the work internally.

## What It Is

"What to test" is a decision framework for allocating test effort. Not every line of code needs a test -- some code is too simple, some is better tested visually, and some is too tightly coupled to implementation details. The framework has three rules:

**Rule 1: Test the contract, not the implementation.**
- Contract: "The ServiceCard renders the title from its props." (behavior)
- Implementation: "The ServiceCard uses a `<h3>` tag with `text-lg` class." (detail)
- If you test the implementation, every CSS change breaks your tests.

**Rule 2: Know your test boundaries.**
This project has two testing tools:
- **Vitest** (unit/component tests): Tests data transformations, component rendering, function return values, and invocation patterns. Runs in jsdom (simulated browser).
- **Playwright** (E2E tests): Tests visual appearance, animations, scroll behavior, and cross-page navigation. Runs in a real browser.

If you cannot test something in jsdom (animations, visual layout, hover effects), it belongs in Playwright, not Vitest.

**Rule 3: Test data, not DOM structure.**
- Good: "Does the component render all 3 stack pills from the data?"
- Bad: "Does the component have a `div` with class `flex gap-2` containing 3 `span` elements?"
- The first survives refactors. The second breaks when you change the layout.

## Why It Matters

Knowing what NOT to test is as valuable as knowing how to test. Over-testing slows development with brittle tests that break on every refactor. Under-testing lets bugs reach production. The interview question "What is your testing strategy?" separates seniors from juniors: juniors test everything or nothing; seniors test the right things at the right layer.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/Footer.test.ts` | Tests text, links, attributes -- never layout or styles | Shows contract testing: "these elements exist with correct content" |
| `src/lib/components/ServiceCard.test.ts` | Tests title, description, counter, stack pills, link href | Tests data-to-DOM mapping: "given this data, these elements appear" |
| `src/tests/setup.ts` | GSAP/Threlte mocks | Confirms that animation behavior is NOT tested in Vitest -- just invocation |
| `tests/smoke.spec.ts` | Playwright tests: page loads, tagline visible, heading visible | Confirms that visual checks happen in Playwright E2E, not Vitest |

## The Mental Model

```
The test boundary diagram:

  ┌─────────────────────────────────────────────┐
  │           Vitest (jsdom)                    │
  │                                             │
  │  ✓ Data transforms    ✓ Props → output      │
  │  ✓ Function logic     ✓ Conditional render   │
  │  ✓ Mock invocations   ✓ Link hrefs          │
  │  ✓ Error handling     ✓ Text content         │
  │                                             │
  │  ✗ Animations         ✗ Visual layout        │
  │  ✗ Scroll behavior    ✗ Hover effects        │
  │  ✗ CSS rendering      ✗ Cross-page nav       │
  └─────────────────────────────────────────────┘
                     │
                     │ (hand off to)
                     ↓
  ┌─────────────────────────────────────────────┐
  │         Playwright (real browser)            │
  │                                             │
  │  ✓ Page loads          ✓ Visual presence     │
  │  ✓ Navigation works    ✓ Animation runs      │
  │  ✓ Scroll triggers     ✓ Responsive layout   │
  └─────────────────────────────────────────────┘


Decision tree:

  "Should I test this in Vitest?"

  Does the behavior depend on → YES → Playwright
  CSS rendering, GPU, or                (E2E test)
  visual appearance?
        │
        NO
        ↓
  Is it a data transformation, → YES → Vitest
  rendered text, link href,            (unit/component test)
  or function return value?
        │
        NO
        ↓
  Is it too trivial to test? → YES → Skip it
  (e.g., a constant, a type
   definition, a CSS class)


SQL audit analogy:

  AUDIT (test):                        DON'T AUDIT:
  ─────────────                        ─────────────
  "Row was inserted"                   "Which index was used"
  "Foreign key is valid"               "How the optimizer chose"
  "Result has 3 rows"                  "Memory allocation details"

  "Title renders"                      "Title uses <h3>"
  "Link href is correct"              "Link has aria-label"*
  "Stack pills match data"            "Stack pills are in a flex container"

  * Unless accessibility IS the contract being tested
```

## Worked Example

```typescript
// From: src/lib/components/ServiceCard.test.ts
// Example of testing the contract (data → output) vs implementation.

// GOOD: Testing the contract — "given this data, this text appears"
it('renders the service title', () => {
  render(ServiceCard, {
    props: { service: mockService, svgContent: '', index: 0, total: 6 }
  });
  // CONTRACT: the title from the data object appears on screen
  expect(screen.getByText('SQL Development & Optimization')).toBeTruthy();
});

// GOOD: Testing computed behavior — "index 0 shows as 01, total 6 shows as 06"
it('renders the station counter', () => {
  render(ServiceCard, {
    props: { service: mockService, svgContent: '', index: 0, total: 6 }
  });
  // CONTRACT: the component formats the counter correctly
  expect(screen.getByText('Service 01 / 06')).toBeTruthy();
});

// GOOD: Testing link correctness — this is the contract with the router
it('renders a "Deep dive" link with correct href', () => {
  render(ServiceCard, {
    props: { service: mockService, svgContent: '', index: 0, total: 6 }
  });
  const link = screen.getByRole('link', { name: /deep dive/i });
  // CONTRACT: the link navigates to the correct service detail page
  expect(link.getAttribute('href')).toBe('/services/sql-development');
});

// BAD (not in this codebase — shown as anti-pattern):
// it('renders title in an h3 tag', () => {
//   const { container } = render(ServiceCard, { ... });
//   expect(container.querySelector('h3.text-lg')).toBeTruthy();
// });
// This tests implementation (h3 tag, CSS class) — breaks on any markup refactor
```

## Common Mistakes

1. **Testing every CSS class and DOM tag:**
   - **What happens:** You have 100 tests. You refactor the markup from `div` to `section`. 40 tests break. None of them found a real bug.
   - **Fix:** Test text content, link targets, aria attributes (when accessibility is the contract), and data-testid elements. Let CSS and markup be implementation details.
   - **Why:** Brittle tests cost more to maintain than the bugs they catch. Tests should make refactoring safe, not impossible.

2. **Testing animations in Vitest:**
   - **What happens:** You assert that an element moved 100px to the right after calling a GSAP tween. The test fails because GSAP is mocked and does not actually move anything in jsdom.
   - **Fix:** In Vitest, test that GSAP was called: `expect(gsap.to).toHaveBeenCalledWith(element, { x: 100 })`. In Playwright, test the visual result: `await expect(element).toHaveCSS('transform', ...)`.
   - **Why:** Each tool tests at its appropriate layer. Vitest tests logic; Playwright tests pixels.

3. **Skipping tests for "simple" components:**
   - **What happens:** The Footer seems too simple to test. Someone changes the LinkedIn URL. No test catches it. The broken link ships.
   - **Fix:** Simple components get simple tests. The Footer test file is 37 lines and took 5 minutes to write. That is cheap insurance.
   - **Why:** Simple components break in simple ways (wrong URL, missing text). Simple tests catch simple breaks.

## Break It to Learn It

### Exercise 1: Write an Implementation Test (Then Delete It)
1. Open `src/lib/components/Footer.test.ts`
2. Add: `it('uses a footer tag', () => { const { container } = render(Footer); expect(container.querySelector('footer')).toBeTruthy(); });`
3. **Predict:** This test passes now. But think: if someone wraps the footer in a `<div>` with `role="contentinfo"`, this test breaks even though the behavior is identical.
4. **Verify:** Run `bun run test` -- it passes. Now consider: would `getByRole('contentinfo')` be more resilient?
5. **What you learned:** Implementation tests pass today but break on valid refactors. Contract tests survive.
6. **Delete the test you added**

### Exercise 2: Identify the Test Boundary
1. Open `tests/smoke.spec.ts` (Playwright E2E)
2. Read the three tests: page loads, tagline visible, wordmark visible
3. **Predict:** These test visual presence in a real browser -- things that Vitest cannot verify
4. **Verify:** Compare with `Footer.test.ts` (Vitest) -- Footer tests check text and links; smoke tests check that the whole page loads and elements are visible
5. **What you learned:** Vitest tests components in isolation; Playwright tests the assembled page in a real browser

### Exercise 3: Ask "What Would Break?"
1. Open `src/lib/components/ServiceCard.test.ts`
2. For each test, ask: "If this test did not exist, what bug could ship?"
3. **Predict:** Without the href test, someone could change the service URL scheme and break navigation. Without the title test, a data refactor could silently drop the title.
4. **Verify:** This is a thought exercise -- the answer is that each test protects against a specific regression
5. **What you learned:** Good tests map to specific failure scenarios, not arbitrary code coverage targets

## Connections

- **Depends on:** [[component-testing]] because you need to know how to test before deciding what to test
- **Related:** [[tdd-workflow]] because TDD forces you to decide what to test before writing code
- **Related:** [[playwright-e2e]] because understanding what NOT to test in Vitest means knowing what belongs in Playwright
- **Related:** [[test-setup-and-mocking]] because mocks define the boundary of what Vitest can and cannot verify

## Knowledge Check

1. What is the difference between testing the contract vs the implementation? → See [What It Is](#what-it-is)
2. Which testing tool should you use for animations and visual layout? → See [The Mental Model](#the-mental-model)
3. Why is testing a CSS class name a bad practice? → See [Common Mistakes](#common-mistakes)
4. How do you decide whether something is "too trivial to test"? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds -- Write Tests, Not Too Many, Mostly Integration](https://kentcdodds.com/blog/write-tests)
