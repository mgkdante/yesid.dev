---
title: "Typed Data Files"
domain: data-layer
difficulty: 1
difficulty_label: beginner
reading_time: 10
tags:
  - learn
  - data-layer
  - beginner
prerequisites:
  - "[[typescript-interfaces]]"
date: 2026-04-08
---

# Typed Data Files


## The Analogy

A typed data file is like a series of `INSERT` statements that the schema validates at write time. When you type `INSERT INTO services (id, title, station) VALUES ('sql-dev', NULL, 1)`, the database immediately rejects the row because `title` is `NOT NULL`. Typed data files in TypeScript work the same way: if you try to define a service object missing a required field or with a wrong field type, the compiler flags it before the code ever runs. Every "row" is checked against the "table definition" (the interface) the moment you save the file.

## What It Is

A **typed data file** is a TypeScript file that exports a constant array (or object) with an explicit type annotation. The type annotation links the data to an interface defined elsewhere -- usually in `types.ts`. This creates a compile-time contract: every object in the array must satisfy every required field in the interface, with the correct types.

Three key TypeScript features make this work:

1. **Type annotation** (`const services: Service[]`) -- tells TypeScript "every element in this array must be a valid `Service`." Like declaring `CREATE TABLE services (...)` before inserting rows.

2. **`satisfies` keyword** -- an alternative to type annotation that preserves the specific literal types while still validating against the interface. This project uses `as const` arrays with explicit types, achieving the same effect.

3. **`readonly` arrays** (`readonly Service[]`) -- prevents code from accidentally pushing, popping, or mutating the array after it is created. Like making a table read-only: the data is defined once and never changes at runtime.

## Why It Matters

**Interview value:** "How do you ensure data consistency in a TypeScript project?" is a question that separates juniors from mid-level engineers. Answering with "typed data files validated at compile time against shared interfaces" shows architectural thinking.

**Zero-cost validation:** Unlike runtime validation (checking data with `if` statements when the app loads), typed data files are validated at build time. If the data is wrong, the project refuses to compile. There is no performance cost at runtime -- the checks happen before deployment.

**Adding content without touching components:** When a typed data file is well-designed, adding a new item means adding one object to one file. No component changes, no layout updates, no new routes. The components already know how to render any object that matches the interface.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/services.ts` | `export const services: readonly Service[]` (line 10) | The primary typed data file -- 6 services, each validated against the Service interface |
| `src/lib/data/services.ts` | The first service object (lines 11-43) | Shows every field filled in, matching the interface's required/optional contract |
| `src/lib/data/types.ts` | The `Service` interface (line 66) | The schema that `services.ts` validates against |
| `src/lib/data/projects.ts` | `export const projects: readonly Project[]` | Same pattern for projects -- different interface, same validation approach |
| `src/lib/data/content.ts` | Exported content objects | UI text content following the same typed pattern |

## The Mental Model

```
  types.ts (schema)              services.ts (data)
  ┌─────────────────┐            ┌──────────────────────────────────┐
  │ interface Service│            │ const services: readonly Service[]│
  │ {                │            │ = [                              │
  │   id: string     │◄───────── │   { id: 'sql-dev',              │ ✓ string
  │   title: Loc...  │◄───────── │     title: { en: 'SQL...' },    │ ✓ LocalizedString
  │   station: number│◄───────── │     station: 1,                 │ ✓ number
  │   icon?: string  │◄───────── │     icon: 'station-sql.json',   │ ✓ string (optional, provided)
  │   visible?: bool │◄───────── │     visible: true,              │ ✓ boolean (optional, provided)
  │ }                │            │   },                            │
  └─────────────────┘            │   { ... next service ... },     │
                                 │ ];                              │
                                 └──────────────────────────────────┘

  If you change the interface (add a required field),
  every object in the array must be updated -- or the
  project refuses to compile.

  SQL equivalent:
  ALTER TABLE services ADD COLUMN priority INT NOT NULL;
  -- Every existing row needs a value for priority.
  -- Same thing: every object in the array needs the new field.
```

## Worked Example

Let's walk through the first 43 lines of `src/lib/data/services.ts`:

```typescript
// From: src/lib/data/services.ts

// Step 1: Import the interface (the "CREATE TABLE" definition)
import type { Service } from './types.js';

// Step 2: Declare a typed constant array.
// "readonly" means no code can push/pop/mutate this array at runtime.
// "Service[]" means every element must match the Service interface.
// This line is the equivalent of:
//   CREATE TABLE services (...) -- schema defined
//   INSERT INTO services VALUES (...), (...), ... -- data follows
export const services: readonly Service[] = [
  {
    // id: string (NOT NULL) -- the primary key
    id: 'sql-development',

    // title: LocalizedString (NOT NULL) -- nested interface
    // { en: string } satisfies LocalizedString because 'en' is required
    title: { en: 'SQL Development & Optimization' },

    // subtitle: LocalizedString (OPTIONAL) -- has the ? in the interface
    subtitle: { en: '& Optimization' },

    // description: LocalizedString (NOT NULL)
    description: {
      en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server...'
    },

    // station: number (NOT NULL) -- sequential position
    station: 1,

    // icon: string (OPTIONAL) -- provided here, but could be omitted
    icon: 'station-sql.json',

    // svg: string (OPTIONAL)
    svg: 'service-sql.svg',

    // visible: boolean (OPTIONAL) -- defaults to true in consuming code
    visible: true,

    // relatedProjects: string[] (NOT NULL) -- an array, like a junction table
    // Each slug must match a project in projects.ts (enforced by tests, not types)
    relatedProjects: ['transit-data-pipeline', 'lorem-query-optimizer', 'lorem-database-migration'],

    // ... additional optional fields: valueProposition, deliverables, stack, sections
  },
  // ... 5 more service objects follow, each validated against the same interface
];
```

**What happens if you forget a required field?** If you delete the `station: 1` line, TypeScript immediately shows:

```
Property 'station' is missing in type '{ id: string; title: { en: string; }; ... }'
but required in type 'Service'.
```

This is the compile-time equivalent of a `NOT NULL constraint violation`. You cannot ship the code until every required field is present.

**What does `readonly` prevent?** Without `readonly`, any code anywhere could do `services.push(newService)` or `services[0].id = 'hacked'`. With `readonly`, the array is frozen: the data is what the file declares, nothing more. This is like a read-only database view -- consumers can query it but never modify it.

## Common Mistakes

1. **Not typing the array and relying on inference:**
   - **What happens:** You write `const services = [{ id: 'sql-dev', ... }]` without the `: readonly Service[]` annotation. TypeScript infers the type from the data, which means typos in property names or missing fields go undetected -- the inferred type just includes whatever you typed.
   - **Fix:** Always annotate: `const services: readonly Service[] = [...]`. This tells TypeScript to validate every object against the interface, not infer the type from the data.
   - **Why:** Without the annotation, the data defines the type. With the annotation, the interface defines the type and the data is checked against it. The second approach catches errors; the first silently accepts them.

2. **Forgetting `readonly` and mutating data at runtime:**
   - **What happens:** Some component does `services.push(dynamicService)` to add an item. Now the data is different at runtime than what the file declared. Other components that cached the array length or order break unpredictably.
   - **Fix:** Mark arrays as `readonly`. If you need dynamic data, create a new array with spread: `const extended = [...services, newService]`.
   - **Why:** Immutability is a core principle (see CLAUDE.md). Typed data files represent the application's source of truth -- they should never change at runtime.

3. **Putting helper functions in `types.ts`:**
   - **What happens:** You add `function getServiceById(id: string)` to `types.ts` alongside the interfaces. Now `types.ts` imports `services`, and `services.ts` imports `types.ts` -- a circular dependency.
   - **Fix:** Keep `types.ts` pure (only interfaces and type aliases). Put helper functions in the data file (`services.ts`) or a separate utils file.
   - **Why:** Schema definitions (DDL) and data operations (DML/queries) belong in separate files, same as in SQL.

## Break It to Learn It

### Exercise 1: Trigger a type mismatch

1. Open `src/lib/data/services.ts`
2. Find the first service object. Change `station: 1` to `station: 'first'` (string instead of number).
3. **Predict:** What error will TypeScript show?
4. **Verify:** Run `bun run check`. You should see: `Type 'string' is not assignable to type 'number'`.
5. **What you learned:** The interface enforces column types. A string cannot go into a number field, just like `INSERT INTO services (station) VALUES ('first')` would fail if `station` is `INT`.
6. **Undo your change** -- restore `station: 1`.

### Exercise 2: Remove the type annotation

1. Open `src/lib/data/services.ts`
2. Change `export const services: readonly Service[] = [` to `export const services = [` (remove the type annotation).
3. Now add a typo to the first service: change `id: 'sql-development'` to `idd: 'sql-development'`.
4. **Predict:** Will `bun run check` catch the typo?
5. **Verify:** Run `bun run check`. Without the type annotation, TypeScript infers the type from the data and accepts `idd` as a valid property name. The typo slips through.
6. **What you learned:** The type annotation is what connects data to the interface. Without it, there is no schema validation -- like inserting into an untyped flat file instead of a typed table.
7. **Undo all changes** -- restore the type annotation and fix the typo.

### Exercise 3: Try to mutate readonly data

1. Open any file that imports `services` (e.g., `src/lib/data/metro.ts`)
2. Add this line after the import: `services.push({ id: 'test', title: { en: 'Test' }, description: { en: '' }, station: 99, relatedProjects: [] });`
3. **Predict:** Will TypeScript allow `.push()` on a `readonly` array?
4. **Verify:** Run `bun run check`. You should see: `Property 'push' does not exist on type 'readonly Service[]'`.
5. **What you learned:** `readonly` makes the array immutable at the type level. This is TypeScript's way of enforcing that data files are the single source of truth.
6. **Undo your change** -- delete the line.

## Connections

- **Depends on:** [[typescript-interfaces]] because typed data files validate against interfaces -- without the interface, there is nothing to validate against
- **Enables:** [[data-driven-architecture]] because the typed data file pattern is what makes "add one object, get a new page" possible
- **Enables:** [[barrel-exports]] because data files are re-exported through the barrel for clean imports
- **Related:** [[localized-string-i18n]] because every text field in a typed data file uses the `LocalizedString` interface

## Knowledge Check

1. What is the SQL equivalent of `const services: readonly Service[] = [...]`? --> See [The Analogy](#the-analogy)
2. What happens if you define a service object without a required field like `station`? --> See [Worked Example](#worked-example)
3. Why is `readonly` important on data arrays? --> See [Common Mistakes](#common-mistakes)
4. What is the difference between typing an array (`: Service[]`) and letting TypeScript infer the type? --> See [Common Mistakes](#common-mistakes)
5. Where do helper functions go -- in `types.ts` or in the data file? --> See [Common Mistakes](#common-mistakes)

## Go Deeper

- [TypeScript Handbook: Readonly Array Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types)
- [TypeScript `satisfies` operator (TS 4.9+)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
