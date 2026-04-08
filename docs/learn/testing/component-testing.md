---
title: "Component Testing"
domain: testing
difficulty: 2
difficulty_label: intermediate
reading_time: 13
tags:
  - learn
  - testing
  - intermediate
prerequisites:
  - "[[vitest-fundamentals]]"
  - "[[svelte-components]]"
date: 2026-04-08
---

# Component Testing


## The Analogy

Component testing is like running a SQL query against a test database and checking the result set. You set up a component with specific input data (like INSERT test rows), render it in a simulated browser (like executing the query), then check that the right elements appear in the output (like asserting the result set has the expected rows and columns). The component is the query; the props are the parameters; the rendered DOM is the result set.

## What It Is

Component testing renders a Svelte component in a simulated browser environment (jsdom) and asserts that the correct HTML elements appear. The library `@testing-library/svelte` provides `render()` and `screen` -- the two tools you need.

**`render(Component, { props })`** -- creates the component with the given props, inserts it into jsdom's DOM, and returns query utilities. This is the equivalent of executing a parameterized query:
- `render(Footer)` -- no props (no parameters)
- `render(ServiceCard, { props: { service: mockData, ... } })` -- with props (parameterized query)

**`screen`** -- provides query methods to find elements in the rendered output. The key queries:
- `screen.getByText(/pattern/)` -- find by visible text (like `WHERE text LIKE '%pattern%'`)
- `screen.getByRole('link', { name: /github/i })` -- find by accessibility role and name
- `screen.getByTestId('footer')` -- find by `data-testid` attribute (like finding a row by primary key)
- `screen.getAllByRole('link')` -- find multiple elements (like `SELECT *` returning multiple rows)

The `getBy` prefix throws if the element is not found (test fails immediately). The `queryBy` prefix returns `null` instead of throwing (useful for asserting something does NOT exist).

## Why It Matters

Component testing is the most commonly asked skill in frontend interviews. "How do you test a React/Svelte/Vue component?" requires demonstrating that you can render with props, query the DOM, and assert on the output. For clients, component tests catch visual regressions -- if someone changes the Footer and breaks the LinkedIn link, the test catches it before deployment. This project requires tests for all new components.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/Footer.test.ts` | `render(Footer)` + `screen.getByText(...)` | Simplest example: render with no props, assert text exists |
| `src/lib/components/ServiceCard.test.ts` | `const mockService = { ... }` | Shows how to create mock data matching the TypeScript interface |
| `src/lib/components/ServiceCard.test.ts` | `render(ServiceCard, { props: { service: mockService, ... } })` | Shows how to pass props to a component under test |
| `src/lib/components/ServiceCard.test.ts` | `screen.getByRole('link', { name: /deep dive/i })` | Querying by accessibility role -- the preferred approach |

## The Mental Model

```
SQL analogy for component testing:

  1. ARRANGE: Insert test data
     SQL:     INSERT INTO services VALUES ('sql-development', 'SQL Dev', ...)
     Svelte:  const mockService = { id: 'sql-development', title: { en: 'SQL Dev' } }

  2. ACT: Execute the query
     SQL:     SELECT * FROM service_cards WHERE id = 'sql-development'
     Svelte:  render(ServiceCard, { props: { service: mockService } })

  3. ASSERT: Check the result set
     SQL:     ASSERT row_count = 1 AND title = 'SQL Dev'
     Svelte:  expect(screen.getByText('SQL Dev')).toBeTruthy()


Query priority (most to least preferred):

  screen.getByRole('link')          ← Best: how assistive tech sees it
  screen.getByText('Submit')        ← Good: what the user reads
  screen.getByLabelText('Email')    ← Good: form field labels
  screen.getByTestId('footer')      ← Last resort: data-testid attribute

  Why this order? Tests should mirror how users interact.
  Users do not know about testids. They see text and click links.


Component test lifecycle:

  render(Component, { props })
       ↓
  jsdom creates DOM elements
       ↓
  screen.getByX() queries the DOM
       ↓
  expect().toX() checks the result
       ↓
  Vitest reports PASS or FAIL
       ↓
  DOM is automatically cleaned up before next test
```

## Worked Example

```typescript
// From: src/lib/components/ServiceCard.test.ts
// Tests a component that requires structured input data.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceCard from './ServiceCard.svelte';

// Step 1: Create mock data matching the ServiceData interface
// SQL analogy: creating a test row that satisfies all NOT NULL constraints
const mockService = {
  id: 'sql-development',
  title: { en: 'SQL Development & Optimization' },
  subtitle: { en: '& Optimization' },
  description: {
    en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server.'
  },
  station: 1,
  relatedProjects: [],
  stack: ['PostgreSQL', 'SQL Server', 'T-SQL'],
  svg: 'service-sql.svg',
  visible: true
};

describe('ServiceCard', () => {
  // Step 2: Render with props — the component needs service data to work
  // SQL analogy: EXEC sp_render_card @service = @mockService
  it('renders the service title', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    // Step 3: Assert the title appears in the rendered output
    expect(screen.getByText('SQL Development & Optimization')).toBeTruthy();
  });

  // Test that computed values work correctly
  // The station counter shows "Service 01 / 06" — computed from index and total
  it('renders the station counter', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    // index 0 + 1 = "01", total 6 = "06"
    expect(screen.getByText('Service 01 / 06')).toBeTruthy();
  });

  // Test that array data renders correctly
  // SQL analogy: checking that a JOIN produced the right number of related rows
  it('renders stack pills', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    expect(screen.getByText('PostgreSQL')).toBeTruthy();
    expect(screen.getByText('SQL Server')).toBeTruthy();
    expect(screen.getByText('T-SQL')).toBeTruthy();
  });

  // Test navigation: the link should have the correct href
  // SQL analogy: checking that a foreign key reference is valid
  it('renders a "Deep dive" link with correct href', () => {
    render(ServiceCard, {
      props: { service: mockService, svgContent: '', index: 0, total: 6 }
    });
    const link = screen.getByRole('link', { name: /deep dive/i });
    expect(link.getAttribute('href')).toBe('/services/sql-development');
  });
});
```

Notice the mock data structure mirrors the `ServiceData` TypeScript interface. If the interface changes (someone adds a required field), this test will fail at compile time -- TypeScript catches the mismatch before the test even runs.

## Common Mistakes

1. **Querying by CSS class or tag name:**
   - **What happens:** The test passes, but it breaks when you refactor the markup (change a `div` to a `section`, rename a class).
   - **Fix:** Use `getByRole`, `getByText`, or `getByLabelText` instead. These match how users and assistive technology interact with the page, not how the HTML is structured.
   - **Why:** Testing implementation details (CSS classes, tag names) creates brittle tests. Behavior-focused queries survive refactors.

2. **Incomplete mock data:**
   - **What happens:** TypeScript error: "Property 'station' is missing in type..." or runtime error because the component accesses a property that does not exist on your mock.
   - **Fix:** Create mock data that satisfies the full TypeScript interface. Copy the interface definition and fill in every required field.
   - **Why:** Components expect specific data shapes. A partial mock is like an INSERT that violates NOT NULL constraints.

3. **Not cleaning up between tests:**
   - **What happens:** Test A renders a component, Test B runs, and Test B finds elements left over from Test A.
   - **Fix:** `@testing-library/svelte` automatically cleans up after each test when the `svelteTesting()` Vite plugin is configured (which it is in this project). You do not need manual cleanup.
   - **Why:** Test isolation is critical. Each test must start from a clean state, like a fresh database transaction.

## Break It to Learn It

### Exercise 1: Change Mock Data and Watch the Test Fail
1. Open `src/lib/components/ServiceCard.test.ts`
2. Change `title: { en: 'SQL Development & Optimization' }` to `title: { en: 'Changed Title' }`
3. **Predict:** The "renders the service title" test will fail because `getByText('SQL Development & Optimization')` cannot find the old text
4. **Verify:** Run `bun run test` and read the failure message
5. **What you learned:** Mock data and assertions must agree -- changing one without the other causes failure, just like a data integrity constraint
6. **Undo your change**

### Exercise 2: Test a Missing Element
1. Open `src/lib/components/Footer.test.ts`
2. Add a test: `it('does NOT render an admin link', () => { render(Footer); expect(screen.queryByText(/admin/i)).toBeNull(); });`
3. **Predict:** The test should pass -- there is no "admin" text in the Footer
4. **Verify:** Run `bun run test` and confirm the new test passes
5. **What you learned:** `queryByText` returns null instead of throwing -- use it when you want to assert something does NOT exist
6. **Undo your change**

### Exercise 3: Use getByRole Instead of getByText
1. Open `src/lib/components/Footer.test.ts`
2. In the "renders the brand name" test, replace `screen.getByText(/yesid/)` with `screen.getByRole('contentinfo')` (the footer role)
3. **Predict:** The test should still pass because the `<footer>` element has an implicit contentinfo role
4. **Verify:** Run `bun run test` and confirm
5. **What you learned:** `getByRole` is the preferred query because it tests accessibility semantics, not just visible text
6. **Undo your change**

## Connections

- **Depends on:** [[vitest-fundamentals]] because component tests use describe/it/expect from Vitest
- **Depends on:** [[svelte-components]] because you need to understand components to test them
- **Enables:** [[what-to-test]] because once you know how to test components, the next question is which behaviors deserve tests
- **Related:** [[test-setup-and-mocking]] because the setup file configures the jsdom environment that component tests rely on

## Knowledge Check

1. What does `render(Component, { props })` do? → See [What It Is](#what-it-is)
2. What is the preferred query priority for finding elements? → See [The Mental Model](#the-mental-model)
3. Why should you avoid querying by CSS class or tag name? → See [Common Mistakes](#common-mistakes)
4. What is the difference between `getByText` and `queryByText`? → See [What It Is](#what-it-is)
5. Why does mock data need to match the full TypeScript interface? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Testing Library Svelte Documentation](https://testing-library.com/docs/svelte-testing-library/intro)
- [Testing Library Query Priority Guide](https://testing-library.com/docs/queries/about#priority)
