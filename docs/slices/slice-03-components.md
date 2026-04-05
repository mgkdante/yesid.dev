# Slice 03 — Component Library

**Status:** ready
**Priority:** 1
**Estimated effort:** 1-2 sessions
**Depends on:** 01 (complete), 02 (complete)

## Objective

Build the reusable UI components that render data from the data layer. After this slice, every visual building block exists, is tested, and is ready for pages to compose.

## Context

Slice 02 created the typed data layer (Project, Service, SiteMeta with i18n support). This slice creates the components that render that data. Components receive resolved strings (plain strings after `resolveLocale()` has been called at the page level). Components are locale-agnostic. They don't know about LocalizedString. They just render what they're given.

These components will be composed into pages in slices 05-07.

## Acceptance Criteria

- [ ] `ProjectCard` component: renders a project summary (title, one-liner, tags, status badge, link to /work/[slug])
- [ ] `ProjectGrid` component: renders a grid of ProjectCards, accepts a filtered array
- [ ] `ServiceCard` component: renders a service (title, description, icon placeholder)
- [ ] `TagList` component: renders an array of string tags as styled pills/badges
- [ ] `SectionHeader` component: renders a section heading with optional subtitle
- [ ] `Hero` component: renders a hero block (heading, subheading, CTA buttons)
- [ ] All components accept typed props using Svelte 5 runes (`$props()`)
- [ ] All components use brand tokens for styling (colors from tokens.css, fonts from Tailwind @theme)
- [ ] Unit tests for each component (renders correctly with valid props, handles edge cases)
- [ ] Edge cases tested: empty arrays, missing optional fields, long text, single item in grid
- [ ] All tests pass with `bun run test`
- [ ] tree.txt updated
- [ ] Dev log written
- [ ] Handoff report written with "What Was Built", "Files Modified", and "Learn" sections

## Technical Spec

### Component Location

All components live in `src/lib/components/`. One file per component.

### Component Props

Components receive plain strings, not LocalizedString. Locale resolution happens at the page level before data reaches components. This keeps components simple and testable without needing locale context.

**ProjectCard props:**
- title (string)
- oneLiner (string)
- slug (string, for linking to /work/[slug])
- tags (string array)
- status ('public' | 'private' | 'wip')

**ProjectGrid props:**
- projects (array of objects matching ProjectCard props)

**ServiceCard props:**
- title (string)
- description (string)
- icon (optional string, for future icon implementation. Render a placeholder or the string itself for now.)

**TagList props:**
- tags (string array)

**SectionHeader props:**
- title (string)
- subtitle (optional string)

**Hero props:**
- heading (string)
- subheading (string)
- primaryCta (optional { label: string, href: string })
- secondaryCta (optional { label: string, href: string })

### Styling Guidelines

- Use brand tokens: `var(--bg-surface)`, `var(--text-primary)`, `var(--brand-primary)`, etc.
- Use Tailwind utilities from the @theme config where appropriate
- Dark theme only (no light theme logic)
- Cards should have visible borders or elevated backgrounds to stand out from the page background
- Tags/pills should use the brand accent or a subtle surface color
- Status badge: 'private' gets a muted/locked style, 'wip' gets a warning-ish style, 'public' gets no special badge (it's the default)
- Hover states on cards and links (subtle, not flashy)
- Responsive: cards stack on mobile, grid on desktop

### Tests

For each component:
- Renders with all required props
- Renders with optional props missing
- Renders correct content (title text appears, tags appear, links have correct href)
- Edge cases: empty tags array, very long title, single project in grid

### Handoff Report Format Update

In the handoff report, replace "What Yesid Should Know" with a "Learn" section structured as:

```markdown
## Learn

### [Concept name]
**What it is:** [1-2 sentence explanation]
**Why it matters:** [Connect to something Yesid knows]
**Try this:** [A specific hands-on exercise Yesid can do in his code]
**Go deeper:** [One link]
```

This format makes learning active, not passive. The "Try this" step is the most important part.

## Out of Scope

- No pages (slices 05-07)
- No layout/nav/footer (slice 04)
- No actual project data flowing through components yet (that happens when pages compose components + data)
- No icon library integration (just placeholder or string rendering for service icons)
- No animation or transitions
- No filtering logic in ProjectGrid (grid just renders what it receives; filtering is done at the page level in slice 06)

## Learn

### Svelte 5 Components
**What it is:** A `.svelte` file that encapsulates HTML, CSS, and behavior. In Svelte 5, props come in via `let { title, tags } = $props()` instead of the old `export let` syntax.
**Why it matters:** Components are to your UI what functions are to your SQL. You write a function once (`getProjectBySlug`), then call it anywhere. Same with components: build `ProjectCard` once, render it 50 times with different data.
**Try this:** After the slice is built, open `ProjectCard.svelte`. Change the border color to `var(--brand-primary)`. Save. See it update live in `bun run dev`. Then undo it.
**Go deeper:** https://svelte.dev/docs/svelte/components

### Component Testing
**What it is:** Using `@testing-library/svelte` to render a component in a simulated DOM and check that it outputs the right HTML.
**Why it matters:** When you change a component later, tests tell you if you accidentally broke something. It's like having CHECK constraints on your UI.
**Try this:** Open one of the component test files. Add a new test that checks for something specific (like a CSS class or an attribute). Run `bun run test` to see if it passes.
**Go deeper:** https://testing-library.com/docs/svelte-testing-library/intro

### Props as a Contract
**What it is:** TypeScript props define what data a component accepts, like a function signature. If you pass the wrong type, TypeScript catches it before the code runs.
**Why it matters:** It's the same concept as your SQL interfaces in slice 02. `Project` defines the shape of data. Component props define what the component needs from that data. The contract prevents mismatches.
**Try this:** In a test file, try rendering a ProjectCard without the `title` prop. See what TypeScript says.
**Go deeper:** https://www.typescriptlang.org/docs/handbook/2/objects.html

## Verification Steps

1. `bun run test` passes all new + existing tests
2. `bun run check` passes (TypeScript)
3. Each component can be imported and rendered in isolation
4. Components use brand tokens (check in browser dev tools that colors match tokens.css values)
5. tree.txt reflects new component files
