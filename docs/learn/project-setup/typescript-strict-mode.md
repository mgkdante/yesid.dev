---
title: "TypeScript Strict Mode"
domain: project-setup
difficulty: 1
difficulty_label: beginner
reading_time: 10
tags:
  - learn
  - project-setup
  - beginner
date: 2026-04-08
---

# TypeScript Strict Mode


## The Analogy

TypeScript is like defining your table schema with NOT NULL, CHECK constraints, and FOREIGN KEYS before inserting data. Without it, you're using a spreadsheet -- anything goes in any cell. A column you expect to hold integers might silently contain the text "hello", and you won't know until a report breaks at 2 AM. TypeScript catches those mismatches the moment you type them, not when a user hits the bug.

## What It Is

**JavaScript** is the language that web browsers understand. It runs your website's interactivity -- button clicks, animations, data fetching. But JavaScript is dynamically typed: a variable can hold a number one moment and a string the next, and JavaScript won't complain.

**TypeScript** is a layer on top of JavaScript that adds a type system. You declare what shape your data has -- "this variable is a string", "this function returns a number", "this object must have a `name` field" -- and TypeScript checks those declarations before your code ever runs. Think of it as `CREATE TABLE` vs. dumping CSV rows into a flat file.

**Strict mode** is a configuration flag that turns on the strictest set of type checks. Without strict mode, TypeScript lets some unsafe patterns slip through (like treating `null` as if it were a valid string). With `"strict": true` in `tsconfig.json`, TypeScript enforces every check it knows about:

- Variables cannot be `null` or `undefined` unless you explicitly say so (like adding `NULL` or `NOT NULL` to a column definition).
- Function parameters must have declared types (like declaring column types in a `CREATE TABLE`).
- You cannot accidentally call a method on something that might not exist.

In SQL terms, strict mode is the difference between a database that enforces constraints and one where every column is `VARCHAR(MAX) NULL`.

## Why It Matters

**Interview value:** "What is TypeScript strict mode and why do you use it?" is a common frontend interview question. Knowing the answer -- and being able to point at real code where you use it -- sets you apart from developers who only know JavaScript.

**Bug prevention:** Strict mode catches entire categories of bugs at compile time that would otherwise only appear at runtime (when a user triggers the broken code path). In a SQL context, this is like the difference between a constraint violation at `INSERT` time vs. discovering corrupt data during an audit six months later.

**Team safety:** When multiple developers work on the same codebase, strict types act as documentation that the compiler enforces. If someone changes the shape of a data structure, every file that uses it will show errors immediately -- not silently break in production.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `tsconfig.json` | The `"strict": true` flag on line 12 | This single flag enables all strict checks project-wide |
| `src/lib/data/types.ts` | Every `interface` and `type` declaration | This is our "schema file" -- every piece of content on the site is shaped by these types |
| `src/lib/data/locale.ts` | The `resolveLocale` function signature and its return type | Shows how strict types guarantee a function never returns `undefined` |
| `tsconfig.json` | The `"checkJs": true` flag on line 6 | Even plain `.js` files get type-checked -- no escape hatch |

## The Mental Model

Think of TypeScript's workflow like a SQL query planner that runs before execution:

```
You write code
       |
       v
TypeScript reads your code + your type declarations
       |
       v
Does every variable match its declared type?
Does every function receive the right arguments?
Could anything be null when you treat it as non-null?
       |
       +--> YES to all --> Code compiles. Safe to run.
       |
       +--> NO to any  --> Red squiggly line in your editor.
                           Error message tells you exactly
                           what's wrong and where.
                           Code does NOT run until you fix it.
```

This is the key difference from JavaScript: in JS, the code runs and crashes at runtime. In TS with strict mode, the code refuses to compile until the type error is resolved. You fix bugs in your editor, not in production.

Contrast this with SQL:

| SQL concept | TypeScript equivalent |
|-------------|----------------------|
| `CREATE TABLE` with column types | `interface` declaration |
| `NOT NULL` constraint | Property without `?` (required) |
| `NULL` (nullable column) | Property with `?` (optional) |
| `CHECK` constraint | Union type (`'public' \| 'private' \| 'wip'`) |
| `FOREIGN KEY` | A property typed as another interface |
| `COALESCE(a, b)` | The `resolveLocale()` fallback pattern |
| Query planner catching errors before execution | TypeScript compiler catching errors before runtime |

## Worked Example

Let's walk through two real files from this project: the `LocalizedString` interface in `types.ts` and the `resolveLocale` function in `locale.ts`.

### Part 1: Defining the shape (types.ts)

```typescript
// From: src/lib/data/types.ts

// Step 1: Define a union type -- like a CHECK constraint
// Only these three values are legal. Anything else is a compile error.
export type Locale = 'en' | 'fr' | 'es';

// Step 2: Define an interface -- like a CREATE TABLE
// English is required (NOT NULL). French and Spanish are optional (NULL allowed).
export interface LocalizedString {
  en: string;       // Required -- every piece of text MUST have an English version
  fr?: string;      // The ? means optional -- like a nullable column
  es?: string;      // Also optional
}
```

In SQL, this would be:

```sql
CREATE TABLE localized_string (
  en  VARCHAR(500) NOT NULL,   -- always present
  fr  VARCHAR(500) NULL,       -- might be missing
  es  VARCHAR(500) NULL        -- might be missing
);

-- The Locale type is like:
ALTER TABLE some_table ADD CONSTRAINT chk_locale
  CHECK (locale IN ('en', 'fr', 'es'));
```

### Part 2: Using the shape safely (locale.ts)

```typescript
// From: src/lib/data/locale.ts

// The function signature is a contract:
// - It MUST receive a LocalizedString (an object with at least an 'en' field)
// - It MUST receive a Locale ('en', 'fr', or 'es' -- nothing else)
// - It MUST return a string (never null, never undefined)
export function resolveLocale(localizedString: LocalizedString, locale: Locale): string {
  // localizedString[locale] might be undefined (fr and es are optional).
  // TypeScript knows this because of the ? in the interface.
  const value = localizedString[locale];

  // We check for a real, non-empty value before returning it.
  if (value && value.trim() !== '') {
    return value;
  }

  // Fallback to English -- guaranteed to exist by the interface contract.
  // This is like COALESCE(requested_locale, en) in SQL.
  return localizedString.en;
}
```

Why does this matter? Because strict mode forces us to handle the case where `fr` or `es` might be missing. Without strict mode, we could write `return localizedString[locale]` and TypeScript would stay silent -- but the function could return `undefined`, crashing any component that tries to render it as text. Strict mode makes the `if` check mandatory.

## Common Mistakes

1. **Using `any` to silence errors:**
   - **What happens:** You declare a variable as `any` (e.g., `let data: any = fetchData()`) to make a type error go away. The error disappears, but so does every safety check on that variable. You've turned your NOT NULL column back into an untyped spreadsheet cell.
   - **Fix:** Use `unknown` instead of `any`, then narrow the type with checks (like `if (typeof data === 'string')`). Or better, define an interface that describes the actual shape.
   - **Why:** `any` disables TypeScript entirely for that variable. `unknown` keeps safety on but requires you to prove what the value is before using it.

2. **Ignoring TypeScript errors instead of fixing them:**
   - **What happens:** You see a red squiggly line, add `// @ts-ignore` above it, and move on. The error is hidden but the bug remains. This is like removing a constraint from your database because an INSERT failed -- the data is still invalid, you just stopped checking.
   - **Fix:** Read the error message. TypeScript errors are precise: they tell you what type was expected, what type was found, and on which line. Fix the root cause, not the symptom.
   - **Why:** Every `// @ts-ignore` is a hole in your safety net. The bug it hides will surface at runtime, where it's harder to diagnose.

3. **Not defining return types on functions:**
   - **What happens:** You write `function getUser(id: string) { ... }` without saying what it returns. TypeScript can often infer the return type, but if your function accidentally returns different types in different branches (a `User` object in one path, `undefined` in another), the inferred type silently becomes `User | undefined`. Callers don't know they need to check for `undefined`.
   - **Fix:** Always add explicit return types to exported functions: `function getUser(id: string): User { ... }`. Now if any code path returns the wrong type, TypeScript flags it inside the function, not at the call site.
   - **Why:** Explicit return types catch errors at the source. Compare this to a SQL view: if a view's column types are declared, you know exactly what a query against it will return.

## Break It to Learn It

### Exercise 1: Remove a required field

1. Open `src/lib/data/types.ts`
2. Find the `LocalizedString` interface (around line 12). Change `en: string;` to `en?: string;` (add a question mark to make it optional).
3. **Predict:** What will happen when you run `bun run check`?
4. **Verify:** Run `bun run check` and read the errors. You should see failures in `locale.ts` and any file that relies on `en` always being present.
5. **What you learned:** The `?` makes a property optional (nullable). Removing the guarantee that `en` exists breaks every function that depends on it -- just like removing a NOT NULL constraint breaks queries that assume the column is populated.
6. **Undo your change** -- restore `en: string;` (no question mark).

### Exercise 2: Pass the wrong type to a function

1. Open `src/lib/data/locale.ts`
2. At the bottom of the file, temporarily add this line: `const test = resolveLocale({ en: 'hello' }, 'de');`
3. **Predict:** Will TypeScript accept `'de'` as a valid locale?
4. **Verify:** Run `bun run check`. You should see an error saying `'de'` is not assignable to type `Locale` -- because the `Locale` type only allows `'en' | 'fr' | 'es'`.
5. **What you learned:** Union types act as CHECK constraints. They restrict a value to a specific set of options, and the compiler rejects anything outside that set.
6. **Undo your change** -- delete the test line.

### Exercise 3: See what strict mode prevents

1. Open `tsconfig.json`
2. Change `"strict": true` to `"strict": false`
3. **Predict:** Will `bun run check` still pass? Will the project behave differently?
4. **Verify:** Run `bun run check`. It will likely still pass -- because the code was written for strict mode and is already safe. But now TypeScript won't catch future mistakes. Try adding `let x: string = null;` to the top of `src/lib/data/locale.ts` and run `bun run check` again. With strict mode off, this assignment is silently accepted. Turn strict mode back on and the error reappears.
5. **What you learned:** Strict mode doesn't change how your code runs -- it changes what TypeScript catches at compile time. Turning it off doesn't break existing code, but it lets new bugs slip through unchecked.
6. **Undo all changes** -- restore `"strict": true` in `tsconfig.json` and remove the `let x` line from `locale.ts`.

## Connections

- **Enables:** typescript-interfaces (future learn doc in `docs/learn/data-layer/`) because strict mode makes interfaces meaningful -- without it, type declarations are advisory, not enforced
- **Enables:** svelte-components (future learn doc in `docs/learn/frontend/`) because Svelte components use TypeScript for their props, and strict mode ensures props are passed correctly

## Knowledge Check

1. What is the SQL equivalent of a TypeScript `interface`? --> See [The Analogy](#the-analogy)
2. What does the `?` after a property name mean in an interface, and what SQL concept does it map to? --> See [Worked Example](#worked-example)
3. Why is `any` dangerous, and what should you use instead? --> See [Common Mistakes](#common-mistakes)
4. What does `"strict": true` do in `tsconfig.json`? --> See [What It Is](#what-it-is)
5. How does `resolveLocale` behave like SQL's `COALESCE`? --> See [Worked Example](#worked-example)

## Go Deeper

- [TypeScript Handbook -- official docs](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript strict mode explained (typescriptlang.org)](https://www.typescriptlang.org/tsconfig/#strict)
