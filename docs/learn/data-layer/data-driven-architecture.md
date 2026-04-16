---
title: "Data-Driven Architecture"
domain: data-layer
difficulty: 2
difficulty_label: intermediate
reading_time: 15
tags:
  - learn
  - data-layer
  - intermediate
prerequisites:
  - "[[typescript-interfaces]]"
  - "[[typed-data-files]]"
date: 2026-04-08
---

# Data-Driven Architecture


## The Analogy

This is the difference between hardcoding a report and building it from a query. A hardcoded report has column headers typed directly into the template -- adding a column means editing the report layout, the header row, and every data cell. A query-driven report says `SELECT * FROM services ORDER BY station` -- adding a row to the table automatically extends the report. Data-driven architecture applies this principle to the entire UI: components render whatever the data layer provides, and adding content means adding one data object, not editing any component.

## What It Is

**Data-driven architecture** means that the UI is a function of the data, not a collection of manually assembled pieces. Components do not contain hardcoded text, hardcoded lists, or hardcoded structure. Instead, they receive typed data objects (via props or imports) and render them dynamically.

In practice, this means three things in this project:

1. **Content lives in data files, not components.** Every piece of user-facing text -- service names, descriptions, blog titles, navigation labels -- exists in a typed data file under `src/lib/data/`. Components import and render it; they never define it.

2. **Adding content requires zero component changes.** Adding a 7th service to the portfolio means adding one object to `services.ts`. The service listing page, the metro navigation, the filter sidebar, and every other component that displays services automatically include it because they iterate over the data array.

3. **Computed values derive from the data.** The metro line's stop numbers, the service count labels, and the navigation structure are all computed from the data arrays. Nothing is manually numbered or manually counted. Change the data, and the computations update.

## Why It Matters

**Interview value:** "How do you design a component that scales to N items without code changes?" is an architecture question. Data-driven design is the answer -- and being able to show a working example where adding a service requires exactly one file change demonstrates it concretely.

**Client value:** Clients add and remove services, projects, and blog posts constantly. If every change requires a developer to edit component code, the site is expensive to maintain. Data-driven architecture means content changes are isolated to one file, reducing cost and error risk.

**Future-proofing:** When this project eventually connects to a CMS (Payload is planned for Slice 18 — see `docs/specs/2026-04-16-cms-payload-design.md`), the interfaces stay the same -- only the data source changes. The components never know whether their data came from a TypeScript file, a Postgres database, or an API. This is the same principle as coding against an interface in SQL: your reports work whether the underlying table is local or linked.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/services.ts` | The `services` array (line 10) | The single source of truth for all services -- components iterate over this, they never define service content themselves |
| `src/lib/data/metro.ts` | The `buildMetroLine()` function (line 17) | Auto-computes the entire metro navigation from `services.length` -- adding a service auto-extends the metro line |
| `src/lib/data/metro.ts` | `formatServicesLabel()` (line 89) | Dynamically generates "STOPS 01-06 -- SERVICES" from `services.length` -- never hardcoded |
| `src/lib/data/services.ts` | `getVisibleServices()` (line 221) | Filters by `visible` flag -- hiding a service is a data change, not a code change |
| `src/lib/data/index.ts` | The barrel exports | One import point for all data -- components import from `$lib/data` and get whatever exists |

## The Mental Model

```
HARDCODED (anti-pattern):

  Component.svelte:
  ┌────────────────────────────────────┐
  │ <h2>SQL Development</h2>          │  ← Text is in the component
  │ <h2>Data Pipeline</h2>            │  ← Adding a service means
  │ <h2>Analytics</h2>                │    editing THIS file
  │ <h2>Database Engineering</h2>     │
  └────────────────────────────────────┘

  Adding "Internal Tooling" means:
  1. Edit Component.svelte (add <h2>)
  2. Edit the layout (make room)
  3. Edit the navigation (add link)
  4. Edit the metro line (add stop)
  → 4 file changes, 4 chances for bugs


DATA-DRIVEN (this project's approach):

  services.ts:
  ┌────────────────────────────────────┐
  │ [                                  │
  │   { id: 'sql-dev', station: 1 },  │
  │   { id: 'pipeline', station: 2 }, │
  │   { id: 'analytics', station: 3 },│
  │   { id: 'db-eng', station: 4 },   │
  │ ]                                  │
  └──────────────┬─────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    v            v            v
  Component    Metro        Nav
  {#each       builds       reads
  services}    stops from   service
               array.length count

  Adding "Internal Tooling" means:
  1. Add ONE object to services.ts  ← That's it.
  → 1 file change, 0 component changes
  → Metro auto-extends, nav auto-updates
```

The key insight is the arrow direction. In hardcoded architecture, the component defines the content. In data-driven architecture, the data defines the content, and the component just renders whatever it receives.

## Worked Example

Let's trace what happens when you add a new service to `services.ts` and see how it cascades through the entire application without touching any component code.

### Step 1: The data change (services.ts)

```typescript
// From: src/lib/data/services.ts
// Adding a 7th service -- just one new object in the array:
{
  id: 'cloud-infrastructure',
  title: { en: 'Cloud Infrastructure' },
  description: { en: 'AWS and GCP setup for data workloads.' },
  station: 7,           // Next sequential number
  svg: 'service-cloud.svg',
  visible: true,
  relatedProjects: [],
}
```

### Step 2: The metro line auto-extends (metro.ts)

```typescript
// From: src/lib/data/metro.ts (line 17)
function buildMetroLine(): readonly MetroStop[] {
  const stops: MetroStop[] = [];

  // Stop 00: Hero
  stops.push({ id: 'departure', stopNumber: '00', type: 'hero', ... });

  // This loop reads services.length -- which is now 7 instead of 6.
  // It automatically creates stops 01-07 instead of 01-06.
  for (let i = 0; i < services.length; i++) {
    stops.push({
      id: services[i].id,               // 'cloud-infrastructure'
      label: services[i].title,          // { en: 'Cloud Infrastructure' }
      stopNumber: String(i + 1).padStart(2, '0'),  // '07'
      type: 'service'
    });
  }

  // Fixed sections start AFTER services -- auto-numbered
  const nextNum = services.length + 1;   // Was 7, now 8
  stops.push({ stopNumber: '08', type: 'featured', ... });  // Was 07
  stops.push({ stopNumber: '09', type: 'about', ... });     // Was 08
  stops.push({ stopNumber: '10', type: 'blog', ... });      // Was 09
  stops.push({ stopNumber: 'TERMINAL', type: 'terminal', ... });

  return Object.freeze(stops);
}
```

**No manual renumbering.** The `services.length + 1` computation means every section after services automatically gets a higher number. This is the power of deriving values from data instead of hardcoding them.

### Step 3: The services label auto-updates (metro.ts)

```typescript
// From: src/lib/data/metro.ts (line 89)
export function formatServicesLabel(): string {
  const first = '01';
  const last = String(services.length).padStart(2, '0');  // '07' now
  return `STOPS ${first}–${last} — SERVICES`;
  // Output: "STOPS 01-07 -- SERVICES" (was "01-06")
}
```

### Step 4: Visible services auto-include it (services.ts)

```typescript
// From: src/lib/data/services.ts (line 221)
export function getVisibleServices(): readonly Service[] {
  return services.filter((s) => s.visible !== false);
  // Returns 7 services now instead of 6.
  // Every component that calls getVisibleServices() automatically renders it.
}
```

**Total changes: 1 object in 1 file.** Every component, every navigation element, and every label updates automatically because they are driven by the data, not by hardcoded values.

## Common Mistakes

1. **Hardcoding counts or labels in components:**
   - **What happens:** A component has `<span>6 Services</span>` or `<div>STOPS 01-06</div>` typed directly in HTML. When a 7th service is added, the component still says "6" -- stale data.
   - **Fix:** Compute from the data: `<span>{services.length} Services</span>` or use `formatServicesLabel()`.
   - **Why:** Hardcoded values are a second source of truth. When they disagree with the data, the user sees inconsistent information. A computed value is always correct because it derives from the single source.

2. **Conditionally rendering specific services by ID:**
   - **What happens:** A component has `{#if service.id === 'sql-development'}<SpecialLayout/>{/if}`. Now one service has special treatment, and adding a new service does not get the same treatment unless you edit the component.
   - **Fix:** If a service needs special behavior, add a flag to the interface (`featured?: boolean`) and check the flag, not the ID. Data-driven, not ID-driven.
   - **Why:** Checking IDs creates a hidden dependency between the component and specific data values. Checking interface properties keeps the component generic -- it works with any data that matches the interface.

3. **Storing derived values in the data file:**
   - **What happens:** You add `stopNumber: '03'` to each service in `services.ts` instead of computing it from the array index. Now reordering services means manually updating every `stopNumber`.
   - **Fix:** Derive from the data: `String(i + 1).padStart(2, '0')` (as `metro.ts` does). The index IS the stop number.
   - **Why:** Storing derived values is denormalization. In SQL terms, it is like storing `age` in a table alongside `birth_date` -- they can drift apart. Compute at read time, not at write time.

## Break It to Learn It

### Exercise 1: See auto-computation in action

1. Open `src/lib/data/services.ts`
2. Add a temporary 7th service at the end of the array: `{ id: 'test-service', title: { en: 'Test' }, description: { en: 'Test' }, station: 7, relatedProjects: [] }`
3. **Predict:** What will `formatServicesLabel()` in `metro.ts` return now?
4. **Verify:** Add `console.log(formatServicesLabel())` to the bottom of `metro.ts`, run `bun run dev`, check the terminal. It should print "STOPS 01-07 -- SERVICES" instead of "01-06".
5. **What you learned:** The label is computed from `services.length`. Adding a service automatically extends it -- no label editing needed.
6. **Undo all changes.**

### Exercise 2: Break a hardcoded assumption

1. Open `src/lib/data/metro.ts`
2. Find the line `const nextNum = services.length + 1;` (line 39). Replace it with `const nextNum = 7;` (hardcoded).
3. Now add a 7th service to `services.ts` (same as Exercise 1).
4. **Predict:** What happens to the stop numbers for Featured Work, About, and Blog?
5. **Verify:** Log `metroStops.map(s => s.stopNumber)` and run `bun run dev`. You will see that the new service gets stop 07, but Featured Work also gets 07 -- a collision. Two stops share the same number.
6. **What you learned:** Hardcoding a derived value creates a silent bug when the data changes. Computing from `services.length` prevents this class of error entirely.
7. **Undo all changes.**

### Exercise 3: Toggle visibility

1. Open `src/lib/data/services.ts`
2. Find the first service (`sql-development`). Change `visible: true` to `visible: false`.
3. **Predict:** Will `getVisibleServices()` still include it? Will `services` (the full array) still include it?
4. **Verify:** Add `console.log('visible:', getVisibleServices().length, 'total:', services.length)` to the bottom of the file and run `bun run dev`. Visible count should be 5, total should still be 6.
5. **What you learned:** Visibility is a data-layer concern, not a component concern. The component does not need `{#if service.id !== 'sql-development'}` -- it just renders `getVisibleServices()`.
6. **Undo your change** -- restore `visible: true`.

## Connections

- **Depends on:** [[typescript-interfaces]] because data-driven architecture requires typed interfaces to define the data contract
- **Depends on:** [[typed-data-files]] because the pattern requires data to live in typed files validated against interfaces
- **Related:** [[localized-string-i18n]] because every data-driven text field uses LocalizedString -- hardcoded strings cannot be translated
- **Related:** [[barrel-exports]] because components access data-driven content through the barrel file
- **Enables:** Components that render N items from data without knowing N in advance

## Knowledge Check

1. What is the SQL analogy for the difference between hardcoded and data-driven components? --> See [The Analogy](#the-analogy)
2. How many files do you change to add a 7th service to this project? --> See [Worked Example](#worked-example)
3. Why does `metro.ts` compute stop numbers instead of storing them in `services.ts`? --> See [Common Mistakes](#common-mistakes)
4. What breaks if you hardcode `const nextNum = 7` instead of computing from `services.length`? --> See [Break It to Learn It](#exercise-2-break-a-hardcoded-assumption)
5. How does `getVisibleServices()` demonstrate data-driven filtering? --> See [Break It to Learn It](#exercise-3-toggle-visibility)

## Go Deeper

- [Martin Fowler: Data-Driven Architecture](https://martinfowler.com/articles/data-oriented-programming.html)
- [TypeScript Handbook: Generics (for building generic data-driven components)](https://www.typescriptlang.org/docs/handbook/2/generics.html)
