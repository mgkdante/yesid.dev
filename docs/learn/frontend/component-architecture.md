---
title: "Component Architecture"
domain: frontend
difficulty: 2
difficulty_label: intermediate
reading_time: 9
tags:
  - learn
  - frontend
  - intermediate
prerequisites:
  - "[[svelte-components]]"
  - "[[svelte-5-runes]]"
  - "[[props-and-events]]"
date: 2026-04-08
---

# Component Architecture


## The Analogy

Like database normalization -- you break data into the smallest reusable units with well-defined interfaces. A fully normalized database has no duplication: each fact lives in one table, and relationships are defined through foreign keys. Component architecture applies the same principle to UI: each visual element lives in one component, and communication happens through props (the foreign keys of the frontend world).

## What It Is

**Component architecture** is the practice of organizing your UI into a hierarchy of components with clear responsibilities, well-defined interfaces (props), and minimal coupling. It answers three questions:

1. **What should be a component?** Anything that is reused, has its own state, or represents a distinct concept
2. **How should data flow?** Down through props, never upward through mutation
3. **Where should logic live?** In the right layer: data fetching in load functions, business logic in the script block, presentation in the markup

The two main component types:

| Type | SQL Analogy | Purpose | Example |
|------|-------------|---------|---------|
| **Smart (container)** | Stored procedure | Owns state, fetches data, manages logic | `ServiceListingPage.svelte` |
| **Dumb (presentational)** | View | Receives props, renders UI, no state management | `TagList.svelte`, `Footer.svelte` |

Smart components know about the data layer. Dumb components only know about their props. This separation means you can test, reuse, and replace dumb components without touching the data layer.

## Why It Matters

Good component architecture is the difference between a codebase that scales and one that becomes unmaintainable. When components have clear boundaries, you can change one without breaking others. When data flows predictably, bugs are easy to trace. When responsibilities are separated, new team members can understand the system quickly. This is the architecture question in every senior frontend interview.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/routes/services/[id]/+page.svelte` | Thin page: just passes `data` to `ServiceDetailPage` | The page is a container -- it receives data and delegates rendering |
| `src/lib/components/ServiceDetailPage.svelte` | Smart component that orchestrates sub-components | Owns layout logic, passes data down to children |
| `src/lib/components/TagList.svelte` | Pure presentational: receives `tags`, renders pills | No state, no data fetching -- pure rendering |
| `src/lib/components/Footer.svelte` | Presentational with one data import | Minimal component: imports site meta, renders links |
| `src/lib/components/ServiceCard.svelte` | Middle ground: receives props, owns UI state (`svgMorphed`) | Has local state for interactivity but does not fetch data |

## The Mental Model

```
Database normalization parallel:

    Unnormalized:
    +------------------------------------------------------------+
    | Orders: id, customer_name, customer_email, product_name,   |
    |         product_price, qty, order_date                      |
    +------------------------------------------------------------+
    ^^^ Everything in one table. Duplication everywhere.

    Normalized:
    Customers: id, name, email
    Products:  id, name, price
    Orders:    id, customer_id (FK), product_id (FK), qty, date
    ^^^ Each fact in one place. Relationships through keys.


Component architecture parallel:

    Unnormalized (one monolith page):
    +------------------------------------------------------------+
    | ServicePage.svelte: fetch data, manage state, render nav,  |
    |   render cards, render filters, render footer, handle       |
    |   scroll, manage animations...                              |
    +------------------------------------------------------------+
    ^^^ 800+ lines. Everything in one file. Impossible to test.

    Normalized (decomposed):
    +page.ts:           load data (stored procedure)
    +page.svelte:       thin wrapper (passes data down)
    ServiceListingPage: smart container (layout + orchestration)
    ServiceCard:        presentational + local state
    TagList:            pure presentational (receives, renders)
    Footer:             pure presentational (receives, renders)
    ^^^ Each concern in one place. Props as foreign keys.


Data flow in this project:

    +page.ts (load function)
        |
        | returns { services, svgContents, ... }
        v
    +page.svelte
        |
        | passes data.services, data.svgContents as props
        v
    ServiceListingPage (smart)
        |
        +--- ServiceCard (receives one service + svgContent)
        |       |
        |       +--- TagList (receives service.tags)
        |
        +--- ServiceNav (receives service IDs)

    Data flows DOWN. Events/callbacks flow UP.
    No component reaches into another's internals.
```

## Worked Example

Let us trace the full data flow for the service detail page:

```
Step 1: Load function fetches data
────────────────────────────────────
// src/routes/services/[id]/+page.ts
export async function load({ params, fetch }) {
  const service = getServiceById(params.id);       // primary record
  const services = getVisibleServices();            // all services
  const { prev, next } = getAdjacentServices(params.id);  // navigation
  const relatedProjects = getProjectsByService(params.id); // related data
  return { service, services, prev, next, relatedProjects, ... };
}

Step 2: Page component is a thin passthrough
─────────────────────────────────────────────
// src/routes/services/[id]/+page.svelte
let { data } = $props();

<ServiceDetailPage
  service={data.service}        // passes one prop
  services={data.services}      // passes another prop
  prev={data.prev}              // passes another prop
  next={data.next}              // passes another prop
  relatedProjects={data.relatedProjects}
/>

Step 3: Smart component orchestrates layout
────────────────────────────────────────────
// src/lib/components/ServiceDetailPage.svelte
let { service, services, prev, next, relatedProjects, ... } = $props();

// This component:
// - Resolves localized text
// - Computes derived values for display
// - Lays out the page structure
// - Passes slices of data to child components

Step 4: Dumb components render specific pieces
──────────────────────────────────────────────
// TagList receives tags, renders pills
// ProofStrip receives projects, renders logos
// Each component has a clear, narrow interface
```

**The architecture principles at work:**

1. **Single responsibility:** Each component does one thing. TagList renders tags. Footer renders the footer. ServiceCard renders one service
2. **Props as contracts:** The type definitions in `$props()` are the API. Change the type? TypeScript tells you every caller that needs updating
3. **No prop drilling through too many layers:** The page passes data directly to the component that needs it, not through 5 intermediaries
4. **Local state stays local:** `svgMorphed` in ServiceCard is not visible to any parent. It is an implementation detail of the hover animation

## Common Mistakes

1. **Making everything a smart component:**
   - **What happens:** Every component imports from the data layer, making them impossible to reuse or test independently
   - **Fix:** Most components should be dumb -- receive data through props, render UI. Only page-level or section-level components should access the data layer
   - **Why:** A dumb TagList can render tags from any source: blog posts, services, projects. A smart TagList that imports blog data can only render blog tags

2. **Prop drilling (passing props through many layers just to reach a deeply nested component):**
   - **What happens:** ParentA passes `user` to ChildB, which passes it to GrandchildC, which passes it to GreatGrandchildD -- but only D uses it
   - **Fix:** Consider if the intermediate components actually need the prop. If not, restructure so the consumer receives data directly, or use Svelte's context API for truly deep trees
   - **Why:** Each prop passage adds coupling. If the shape of `user` changes, you have to update four components instead of two

3. **Components that are too small:**
   - **What happens:** You create a `<StyledParagraph>` component that just wraps a `<p>` with a class. Now you have an unnecessary abstraction
   - **Fix:** A component should represent a meaningful concept: "a tag list," "a service card," "a navigation bar" -- not "a styled paragraph"
   - **Why:** Over-decomposition adds indirection without value. Like creating a `vw_FullName` view that just does `SELECT FirstName + ' ' + LastName` -- the abstraction costs more than it saves

4. **Mixing layout and data concerns:**
   - **What happens:** A component that renders service cards also contains the CSS grid layout for the page. Now you cannot reuse the cards in a different layout
   - **Fix:** Separate the container (grid layout) from the content (individual card). The parent defines how cards are arranged; the card defines how one card looks
   - **Why:** This is the Liskov Substitution Principle applied to UI: a ServiceCard should work in any container (grid, list, carousel) without modification

## Break It to Learn It

### Exercise 1: Identify Smart vs Dumb
1. Open `src/lib/components/TagList.svelte`
2. Open `src/lib/components/ServiceCard.svelte`
3. Open `src/lib/components/ServiceListingPage.svelte`
4. **Predict:** Which are smart (own state, access data layer) and which are dumb (props only)?
5. **Verify:** TagList is pure dumb (only props). ServiceCard is dumb with local UI state (`svgMorphed`). ServiceListingPage is smart (orchestrates layout and manages scroll state)
6. **What you learned:** The spectrum is not binary. Components can have local UI state without being "smart" in the data-fetching sense

### Exercise 2: Trace a Prop's Journey
1. Start at `src/routes/blog/[slug]/+page.ts` -- find where `readingTime` is computed
2. Follow it to `src/routes/blog/[slug]/+page.svelte` -- find where `data.readingTime` is passed
3. Find which child component receives it
4. **Predict:** How many layers does `readingTime` pass through before it is displayed?
5. **Verify:** `+page.ts` computes it, `+page.svelte` passes it to `BlogDetailHeader`, which renders it. Two hops total
6. **What you learned:** Good architecture keeps prop chains short. Data goes from source to consumer with minimal intermediaries

### Exercise 3: Find the Boundary
1. Open `src/lib/components/Footer.svelte`
2. Notice it imports `siteMeta` directly from `$lib/data`
3. **Predict:** Does this make Footer a smart or dumb component? Could you use Footer without the data layer?
4. **Verify:** Footer imports one piece of global site config -- it is borderline. A purer design would pass `links` as props
5. **What you learned:** Architecture is pragmatic. Footer is used in exactly one place (the layout), so directly importing site meta is a reasonable tradeoff over adding props that would only have one caller

## Connections

- **Depends on:** [[svelte-components]] because components are the building blocks
- **Depends on:** [[svelte-5-runes]] because `$state` and `$derived` manage component-level logic
- **Depends on:** [[props-and-events]] because props define the interfaces between components
- **Related:** [[sveltekit-load-functions]] because load functions are the data source in the architecture
- **Related:** [[sveltekit-layouts]] because layouts are the highest-level architectural component
- **Related:** [[slots-and-composition]] because composition is a key architectural pattern

## Knowledge Check

1. What is the difference between a smart and a dumb component? --> See [What It Is](#what-it-is)
2. In which direction does data flow in a component tree? --> See [The Mental Model](#the-mental-model)
3. When is a component "too small" to justify its existence? --> See [Common Mistakes](#common-mistakes)
4. Where should data fetching logic live in the architecture? --> See [The Mental Model](#the-mental-model)
5. What is the database normalization parallel for component architecture? --> See [The Analogy](#the-analogy)

## Go Deeper

- [Svelte docs -- Component fundamentals](https://svelte.dev/docs/svelte/overview)
- [Patterns for organizing SvelteKit code (Huntabyte)](https://www.youtube.com/watch?v=5-ZLh7OxaEo)
