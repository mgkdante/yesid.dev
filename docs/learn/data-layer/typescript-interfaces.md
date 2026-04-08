---
title: "TypeScript Interfaces"
domain: data-layer
difficulty: 1
difficulty_label: beginner
reading_time: 12
tags:
  - learn
  - data-layer
  - beginner
prerequisites:
  - "[[typescript-strict-mode]]"
date: 2026-04-08
---

# TypeScript Interfaces


## The Analogy

An interface is a `CREATE TABLE` statement -- it defines the shape of your data before any data exists. Just like `CREATE TABLE services (id VARCHAR(50) NOT NULL, title VARCHAR(200) NOT NULL, station INT NOT NULL)` tells the database what columns a row must have, `interface Service { id: string; title: LocalizedString; station: number; }` tells TypeScript what fields an object must have. If you try to create a service object missing the `station` field, TypeScript rejects it at compile time -- the same way a database rejects an INSERT missing a NOT NULL column.

## What It Is

An **interface** is a TypeScript construct that describes the shape of an object. It lists every property the object must (or may) have, and what type each property holds. Interfaces do not produce any runtime code -- they exist only for the compiler to check your work. After TypeScript compiles to JavaScript, every interface disappears completely. Think of it as metadata: it governs what data is allowed, but it is not the data itself.

The syntax mirrors a table definition:

```typescript
interface Service {
  id: string;           // Required -- like VARCHAR(50) NOT NULL
  title: LocalizedString; // Required -- a nested "table" (another interface)
  station: number;      // Required -- like INT NOT NULL
  icon?: string;        // Optional -- like VARCHAR(100) NULL (the ? means nullable)
}
```

Every property without `?` is required. Every property with `?` is optional. This is the exact same concept as `NOT NULL` vs. allowing `NULL` in a column definition.

TypeScript also has **type aliases** (the `type` keyword) for things that are not object shapes -- unions, intersections, and literal value sets. In this project, `type Locale = 'en' | 'fr' | 'es'` is a type alias that works like a `CHECK` constraint: only those three values are legal.

## Why It Matters

**Interview value:** "Explain the difference between `interface` and `type` in TypeScript" is a top-10 frontend interview question. Being able to answer with real examples from a shipping codebase sets you apart from candidates who only know the textbook answer.

**Bug prevention:** Without interfaces, a typo in a property name (`tittle` instead of `title`) silently produces `undefined` at runtime. With an interface, the typo is caught immediately in your editor. This is the difference between a constraint violation at INSERT time and corrupt data discovered during an audit months later.

**Self-documenting code:** Interfaces serve as living documentation. When a new developer opens `types.ts`, they can see every field, every type, and every comment explaining why the field exists -- without reading a single component.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/types.ts` | Every `export interface` and `export type` declaration | This is the project's "schema file" -- every content type is defined here |
| `src/lib/data/types.ts` | The `Service` interface (line 66) | The most complex interface; shows required vs. optional fields, nested types, and array types |
| `src/lib/data/types.ts` | `type Locale = 'en' \| 'fr' \| 'es'` (line 7) | A union type acting as a CHECK constraint -- only three values are legal |
| `src/lib/data/types.ts` | `type ProjectStatus = 'public' \| 'private' \| 'wip'` (line 38) | Another CHECK constraint pattern: status must be one of three values |
| `src/lib/data/services.ts` | The `services` array (line 10) | Shows how real data objects conform to the Service interface |

## The Mental Model

```
SQL World                              TypeScript World
---------                              ----------------

CREATE TABLE services (                interface Service {
  id VARCHAR(50) NOT NULL,               id: string;
  title_en VARCHAR(200) NOT NULL,        title: LocalizedString;
  station INT NOT NULL,                  station: number;
  icon VARCHAR(100) NULL,                icon?: string;
  visible BIT DEFAULT 1                  visible?: boolean;
);                                     }

-- The table definition is the         // The interface is the
-- contract. Every INSERT must         // contract. Every object must
-- satisfy it or the DB rejects it.    // satisfy it or TS rejects it.

INSERT INTO services                   const svc: Service = {
  (id, title_en, station)                id: 'sql-development',
VALUES                                   title: { en: 'SQL Development' },
  ('sql-dev', 'SQL Dev', 1);             station: 1
                                       };

-- Omit station? Error.               // Omit station? Error.
-- Wrong type for station? Error.      // Wrong type for station? Error.
-- Extra unknown column? Warning.      // Extra unknown property? Error.
```

Key difference from SQL: in a database, constraints are enforced at runtime (when the INSERT executes). In TypeScript, constraints are enforced at compile time (before the code ever runs). The feedback loop is tighter -- you see the error in your editor as you type.

## Worked Example

Let's walk through the `Service` interface from `src/lib/data/types.ts` line by line:

```typescript
// From: src/lib/data/types.ts (line 66)

export interface Service {
  // Like a PRIMARY KEY column -- unique identifier, not translatable.
  // kebab-case by convention: 'sql-development', 'data-pipeline'
  id: string;

  // Like a VARCHAR NOT NULL column that references another table.
  // LocalizedString is itself an interface: { en: string; fr?: string; es?: string; }
  // This is a "foreign key" to the LocalizedString "table."
  title: LocalizedString;

  // Like a TEXT NOT NULL column -- also referencing LocalizedString.
  description: LocalizedString;

  // Like an INT NOT NULL column -- sequential position in the train journey.
  // The comment says "NOT capped" -- no CHECK constraint on max value.
  station: number;

  // Like a VARCHAR(100) NULL column -- the ? makes it optional.
  // If omitted, the object simply doesn't have this field (like NULL in SQL).
  icon?: string;

  // Like a BIT NULL column with a DEFAULT. Optional, defaults to true
  // in the consuming code (not in the interface itself -- interfaces have no defaults).
  visible?: boolean;

  // Like a junction table! An array of strings referencing project slugs.
  // In SQL: a separate table services_projects(service_id, project_slug).
  // In TypeScript: an inline array on the parent object.
  relatedProjects: string[];

  // --- Detail page fields (all optional for backward compat) ---
  subtitle?: LocalizedString;
  longDescription?: LocalizedString;
  valueProposition?: LocalizedString;
  deliverables?: LocalizedString[];  // Array of LocalizedString -- like a child table
  stack?: string[];
  sections?: ServiceSection[];       // Array of another interface -- nested child rows
}
```

**Why `export`?** The `export` keyword makes the interface importable from other files. Without it, `Service` would only be usable inside `types.ts`. In SQL terms, `export` is like granting `SELECT` permission on a view -- other modules can reference this type.

**Why separate types from data?** `types.ts` defines shapes (the schema). `services.ts` defines actual values (the rows). This separation mirrors the SQL practice of keeping DDL (`CREATE TABLE`) separate from DML (`INSERT`). Change the schema in one place; change the data in another.

## Common Mistakes

1. **Confusing `interface` and `type` and using them interchangeably:**
   - **What happens:** You use `type Service = { ... }` instead of `interface Service { ... }`. For object shapes, both work. But `interface` can be extended (like table inheritance) and produces clearer error messages.
   - **Fix:** Use `interface` for object shapes. Use `type` for unions (`'public' | 'private'`), intersections, and mapped types.
   - **Why:** This is a convention, not a hard rule, but following it makes your intent clear: "this is a data shape" vs. "this is a value constraint."

2. **Making everything optional with `?` to avoid errors:**
   - **What happens:** You get tired of TypeScript errors and add `?` to every property. Now every field could be `undefined`, and you need null checks everywhere. You've turned every column into `NULL` -- your "schema" enforces nothing.
   - **Fix:** Only mark a field optional if it genuinely might not exist. If every service must have an `id`, keep `id: string` without the `?`.
   - **Why:** Optional fields transfer the burden from the data definer to every consumer. With `id: string`, consumers know `id` is always present. With `id?: string`, every consumer must check `if (service.id)` first.

3. **Duplicating interface definitions across files:**
   - **What happens:** You define `interface Service { ... }` in both `services.ts` and some component file. When you add a field to one, you forget to update the other. The two definitions drift apart like two copies of a table definition in different schemas.
   - **Fix:** Define each interface once in `types.ts` and import it everywhere else. One source of truth.
   - **Why:** Same principle as database normalization: one definition, many references. Never duplicate schema definitions.

## Break It to Learn It

### Exercise 1: Add a required field

1. Open `src/lib/data/types.ts`
2. Find the `Service` interface (around line 66). Add a new required property: `priority: number;` (no `?`, so it is NOT NULL).
3. **Predict:** What will happen when you run `bun run check`?
4. **Verify:** Run `bun run check`. You should see errors in `services.ts` because every service object is now missing the required `priority` field -- just like adding a NOT NULL column to a table with existing rows.
5. **What you learned:** Adding a required field to an interface breaks every object that conforms to it. TypeScript catches this at compile time, not at runtime.
6. **Undo your change** -- remove the `priority` line.

### Exercise 2: Break a type constraint

1. Open `src/lib/data/types.ts`
2. Find the `ProjectStatus` type (line 38): `type ProjectStatus = 'public' | 'private' | 'wip';`
3. Open `src/lib/data/projects.ts` and find any project with `status: 'public'`. Change it to `status: 'archived'`.
4. **Predict:** Will TypeScript accept `'archived'` as a valid status?
5. **Verify:** Run `bun run check`. You should see an error: `'archived'` is not assignable to type `ProjectStatus`.
6. **What you learned:** Union types work like CHECK constraints. The compiler rejects values outside the allowed set.
7. **Undo your change** -- restore the original status value.

### Exercise 3: Explore optional vs. required

1. Open `src/lib/data/types.ts`
2. Find the `Service` interface. Change `id: string;` to `id?: string;` (add the `?`).
3. **Predict:** Will existing code in `services.ts` still compile? What about code that reads `service.id`?
4. **Verify:** Run `bun run check`. The data in `services.ts` will still compile (you can still provide `id`), but any code that uses `service.id` without a null check may now show errors -- because `id` could be `undefined`.
5. **What you learned:** The `?` on a property changes the contract for every consumer. It is the TypeScript equivalent of `ALTER TABLE services ALTER COLUMN id VARCHAR(50) NULL`.
6. **Undo your change** -- restore `id: string;`.

## Connections

- **Depends on:** [[typescript-strict-mode]] because strict mode is what makes interfaces enforced rather than advisory
- **Enables:** [[typed-data-files]] because data files like `services.ts` use interfaces to validate every object they define
- **Enables:** [[localized-string-i18n]] because `LocalizedString` is itself an interface -- understanding interfaces is required to understand i18n
- **Enables:** [[barrel-exports]] because barrel files re-export types defined as interfaces
- **Related:** [[data-driven-architecture]] because interfaces enable data-driven design by making the data contract explicit

## Knowledge Check

1. What is the SQL equivalent of `icon?: string;` in an interface? --> See [The Mental Model](#the-mental-model)
2. Why does this project define interfaces in `types.ts` instead of in each component? --> See [Common Mistakes](#common-mistakes)
3. What is the difference between `interface` (for object shapes) and `type` (for unions)? --> See [What It Is](#what-it-is)
4. What happens if you add a required property to an interface that already has data conforming to it? --> See [Break It to Learn It](#exercise-1-add-a-required-field)
5. How does `type Locale = 'en' | 'fr' | 'es'` act like a SQL CHECK constraint? --> See [The Mental Model](#the-mental-model)

## Go Deeper

- [TypeScript Handbook: Object Types -- official docs](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript Handbook: Everyday Types (interfaces vs. types)](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
