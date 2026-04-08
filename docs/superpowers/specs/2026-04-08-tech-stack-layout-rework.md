# Tech Stack Page Layout Rework — "The Control Room" v2

**Date:** 2026-04-08
**Status:** Design approved
**Applies to:** Slice 10d (Node Interaction + Sidebar) — layout rework before continuing to 10e

---

## Problem

The original 10d implementation used a fixed overlay sidebar that wasted side margins on wide screens and provided no persistent context for first-time visitors. The diagram had no middle responsive tier for tablets/foldables, jumping straight from desktop to mobile accordion at 1024px. Connection relationships were only visible as SVG lines — no textual context explaining *what* data flows between technologies.

## Design Goals

1. **Use the margins** — persistent panel alongside the diagram from 13" laptops onwards
2. **Educate on arrival** — orientation card visible before any interaction
3. **Relations as learning tool** — show directional connections with context phrases so non-coders understand data flow ("A to Z and everything in between")
4. **Tablet/foldable tier** — middle breakpoint for 768–1279px
5. **Data-driven relations** — zero hardcoded connection descriptions; adding a tech = one markdown file

---

## Three-Tier Responsive Layout

| Tier | Breakpoint | Diagram | Panel |
|------|-----------|---------|-------|
| **Desktop** | 1280px+ (`lg`) | Full tier rows + SVG connections | Persistent right panel (always visible) |
| **Tablet** | 768–1279px (`md`) | Full tier rows + SVG connections | Overlay panel (slides in on click) |
| **Mobile** | <768px (`sm`) | Accordion per layer | Bottom sheet (slides up on tap) |

### Page Max-Width

**1600px**, centered. Prevents uncomfortably wide layouts on ultrawide monitors while giving 13" laptops (1280–1366px) full use of their screen.

### Desktop Layout (1280px+)

```
+---------------------------------------------------+
|  DIAGRAM (~70%, flex: 1)  |  PANEL (~30%, 320-380px) |
|                           |                          |
|  DEVOPS    [Bun][Docker]  |  [Orientation Card]      |
|  TESTING   [Vitest]       |  or                      |
|  FRONTEND  [Svelte][GSAP] |  [Detail Card]           |
|  ...                      |                          |
|                           |                          |
+---------------------------------------------------+
            max-width: 1600px, centered
```

- Two-column flex layout: diagram takes remaining space, panel is fixed width
- Panel is always visible — **never causes diagram resize** (diagram width doesn't change when content changes)
- Diagram + panel are siblings in a flex container

### Tablet Layout (768–1279px)

- Full tier rows with SVG connections (same as desktop diagram)
- No persistent panel — not enough horizontal space
- Click a node: overlay panel slides in from the right (position: fixed)
- Escape / close button / backdrop click dismisses
- Tier label column narrower (5rem instead of 7rem) to save space

### Mobile Layout (<768px)

- Accordion per layer (unchanged from current)
- Tap a node: bottom sheet slides up
- Swipe down to dismiss, prev/next navigation

---

## Morphing Panel

The right panel has two states with a crossfade transition between them.

### Default State: Orientation Card

Shown when no node is selected. Purpose: orient first-time visitors.

```
+---------------------------+
|  THE CONTROL ROOM         |
|                           |
|  34 technologies across   |
|  9 infrastructure layers. |
|  Click any node to see    |
|  how it fits.             |
|                           |
|  ---- STATS ----          |
|  9 layers                 |
|  7 domains                |
|  10+ projects             |
|                           |
|  [Build Your Stack ->]    |
+---------------------------+
```

Content:
- Title: "The Control Room" (JetBrains Mono, muted)
- Intro paragraph: brief, educational tone
- Stats strip: layers, domains, projects
- CTA button: "Build Your Stack" (links to future 10f configurator)

### Selected State: Detail Card

Shown when a node is clicked. Crossfade transition from orientation card.

```
+---------------------------+
|  [PO] PostgreSQL    [x]   |
|  Expert                   |
|                           |
|  -- SENDS DATA TO --      |
|  Python                   |
|    pipeline orchestration  |
|  SvelteKit                |
|    web frontend queries    |
|  Node.js                  |
|    backend API layer       |
|                           |
|  -- RECEIVES FROM --      |
|  Docker                   |
|    containerized deploy    |
|  Alembic                  |
|    schema migrations       |
|                           |
|  -- WHAT IT IS --         |
|  An open-source relational |
|  database known for...     |
|                           |
|  -- WHY I USE IT --       |
|  ...                      |
|                           |
|  -- IN PRACTICE --        |
|  ...                      |
|                           |
|  Used in: [yesid.dev]     |
|           [Transit Data]  |
|                           |
|  [Let's build with PG ->] |
+---------------------------+
```

Sections (top to bottom):
1. **Header:** Icon + name + proficiency badge + close button
2. **Relations:** "Sends data to" + "Receives from" with context phrases (see below)
3. **Markdown content:** What it is / Why I use it / In Practice
4. **Project badges:** clickable project names
5. **CTA:** "Let's build with [name] ->"

Each relation name is **clickable** — clicking navigates to that node (updates selection, card morphs to new detail, diagram highlights update).

---

## Data-Driven Relations

### Context Phrase Generation

The context phrase for each connection is auto-derived from existing data. **Zero new fields required by default.**

**Algorithm:**

```
For connection: sourceItem -> targetItem

contextPhrase = deriveContext(sourceItem, targetItem)

function deriveContext(source, target):
  // 1. Check for custom override in frontmatter (optional field)
  if source.connectionNotes?.[target.id]:
    return source.connectionNotes[target.id]

  // 2. Find shared domains between source and target
  sharedDomains = intersection(source.domains, target.domains)
  if sharedDomains.length > 0:
    return formatDomainPhrase(sharedDomains[0])
    // e.g., "data-engineering" -> "data engineering"

  // 3. Fall back to target's primary domain + layer
  return formatLayerPhrase(target.layer, target.domains[0])
  // e.g., layer "backend" + domain "data-engineering" -> "backend data pipelines"
```

**Domain phrase mapping** (static, lives in tech-stack.ts):

```typescript
const DOMAIN_PHRASES: Record<DomainCluster, string> = {
  'data-engineering': 'data pipelines',
  'web-development': 'web applications',
  'mobile-development': 'mobile apps',
  'analytics-bi': 'analytics & reporting',
  'systems-programming': 'systems programming',
  'devops-infra': 'infrastructure',
  'internal-tooling': 'internal tools',
};
```

**Layer phrase mapping:**

```typescript
const LAYER_PHRASES: Record<InfraLayer, string> = {
  data: 'data storage',
  backend: 'backend services',
  api: 'API layer',
  frontend: 'frontend rendering',
  mobile: 'mobile interfaces',
  analytics: 'analytics processing',
  devops: 'deployment pipeline',
  testing: 'test automation',
  systems: 'systems layer',
};
```

### Optional Custom Override

For connections where the auto-generated phrase isn't descriptive enough, add an optional `connectionNotes` field to the markdown frontmatter:

```yaml
---
id: postgresql
name: PostgreSQL
# ... existing fields ...
connectionNotes:
  python: "pipeline orchestration"
  sveltekit: "server-side queries"
---
```

**Rules:**
- `connectionNotes` is entirely optional — omit it and auto-derivation kicks in
- Only override connections that need a more specific phrase
- Adding a new tech still requires zero code changes (one markdown file)

### Frontmatter Parsing Update

The `connectionNotes` field is a simple key-value map parsed from YAML-style frontmatter. Keys are target tech IDs, values are context phrase strings.

Update `parseStackItem()` in `tech-stack.ts` to extract `connectionNotes` as `Record<string, string>`.

### New Data Layer Functions

```typescript
/** Get outgoing connections with context phrases. */
export function getOutgoingRelations(id: string): readonly Relation[]

/** Get incoming connections with context phrases. */
export function getIncomingRelations(id: string): readonly Relation[]

interface Relation {
  itemId: string;
  itemName: string;
  contextPhrase: string;
}
```

---

## Component Changes

### New Components

- **StackPanel.svelte** — The morphing panel. Renders orientation card or detail card based on `selectedItem` prop. Handles crossfade transition between states. Used on desktop (persistent) and tablet (overlay).

### Modified Components

- **StackSidebar.svelte** — Renamed/refactored into StackPanel. The sidebar logic becomes part of the panel.
- **StackDiagram.svelte** — Tier label column width adjusts per breakpoint (7rem desktop, 5rem tablet).
- **StackBottomSheet.svelte** — Add relations section (same as detail card).

### Removed Components

- StackSidebar.svelte replaced by StackPanel.svelte.

### Route Page Changes

- `+page.svelte`: New three-tier layout with max-width container. Desktop = flex with persistent panel. Tablet = diagram only + overlay. Mobile = accordion + bottom sheet.

---

## Breakpoint Implementation

Using Tailwind's responsive prefixes with custom breakpoint if needed:

| Tailwind | Width | Tier |
|----------|-------|------|
| default | <768px | Mobile |
| `md:` | 768px+ | Tablet |
| `lg:` | 1280px+ | Desktop |

**Note:** Tailwind's default `lg` is 1024px. We need to adjust to 1280px. Options:
- Custom breakpoint in Tailwind config: `xl` at 1280px (use `xl:` instead of `lg:`)
- Or use Tailwind's existing `xl` (1280px) — this is actually the exact width we want

**Decision: Use `xl:` (1280px) for desktop tier.** This avoids custom config and matches our spec exactly.

| Tier | Tailwind prefix | Width |
|------|----------------|-------|
| Mobile | default | <768px |
| Tablet | `md:` | 768–1279px |
| Desktop | `xl:` | 1280px+ |

---

## Animation

### Panel Crossfade (orientation -> detail)

- Content fades out (opacity 0, 0.15s) then new content fades in (opacity 1, 0.2s)
- Panel container stays fixed — no height jump
- `prefers-reduced-motion`: instant swap, no fade

### Tablet Overlay

- Slide in from right (same as current sidebar: x 100% -> 0%, 0.35s, power2.out)
- Backdrop fade in (0.25s)
- `prefers-reduced-motion`: instant show

### Relation Click Navigation

- When a relation name is clicked, the detail card content crossfades to the new node
- Diagram highlights update simultaneously

---

## Max-Width & Spacing

```css
.tech-stack-page {
  max-width: 1600px;
  margin: 0 auto;
  padding: 3rem 1.5rem;       /* mobile */
}

@media (min-width: 768px) {   /* tablet */
  padding: 3rem 2rem;
}

@media (min-width: 1280px) {  /* desktop */
  padding: 3rem 2.5rem;
}
```

---

## Out of Scope

- Build Your Stack configurator (10f — future sub-slice)
- Hero zone + CTA zone (10g)
- Content writing (10h)
- Custom SVG icons for nodes (using 2-letter placeholders)
- Mini connection diagram inside the card (polish pass candidate)
