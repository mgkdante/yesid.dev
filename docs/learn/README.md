---
title: "yesid.dev Knowledge Base"
tags:
  - learn
  - MOC
date: 2026-04-08
---
# docs/learn/ — yesid.dev Knowledge Base

This is a learning knowledge base for the yesid.dev project. It teaches every concept used in this codebase to someone who knows SQL and basic programming. Each doc explains what a concept is, why it matters professionally, shows where it's used in this project's actual code, and gives hands-on exercises to build real understanding. This is not API reference — it's the "why" behind the "what."

## How to Use It

1. Check the **prerequisites** at the top of each doc. Read those first.
2. Read the concept doc top to bottom. The analogy section anchors you, the mental model makes it click.
3. Do the **Break It to Learn It** exercises. Reading is 20% of learning — doing is the other 80%.
4. If something doesn't click, bring the specific question to Claude Code with context: "I read docs/learn/frontend/svelte-5-runes.md and I don't understand why $derived re-runs."

## Learning Paths

### "I want to understand this entire project"

Start here for a complete walkthrough of every layer:

1. `project-setup/` (all docs)
2. `data-layer/typescript-interfaces.md`
3. `frontend/` (all docs)
4. `styling/` (all docs)
5. `data-layer/` (remaining docs)
6. `motion/` (all docs)
7. `3d-graphics/` (all docs)
8. `testing/` (all docs)
9. `devops/` (all docs)
10. `patterns/` (all docs)

### "I want to build my own SvelteKit site from scratch"

The minimum viable knowledge to ship a site:

1. [[bun-runtime|Bun Runtime]]
2. [[sveltekit-project-structure|SvelteKit Project Structure]]
3. [[svelte-components|Svelte Components]]
4. [[svelte-5-runes|Svelte 5 Runes]]
5. [[sveltekit-routing|SvelteKit Routing]]
6. [[sveltekit-load-functions|SvelteKit Load Functions]]
7. [[tailwind-utility-first|Tailwind Utility-First]]
8. [[design-tokens|Design Tokens]]
9. [[responsive-design|Responsive Design]]
10. [[vitest-fundamentals|Vitest Fundamentals]]
11. [[git-workflow|Git Workflow]]
12. [[vercel-deployment|Vercel Deployment]]

### "I want to add animations to any website"

Motion design from zero to scroll-linked choreography:

1. [[gsap-fundamentals|GSAP Fundamentals]]
2. [[gsap-scrolltrigger|GSAP ScrollTrigger]]
3. [[gsap-timeline-and-stagger|GSAP Timeline and Stagger]]
4. [[svelte-actions|Svelte Actions]]
5. [[entrance-animations|Entrance Animations]]
6. [[reduced-motion-accessibility|Reduced Motion Accessibility]]
7. [[scroll-linked-content|Scroll-Linked Content]]

### "I want to prepare for frontend interviews"

Concepts that come up in technical interviews:

1. [[component-architecture|Component Architecture]]
2. [[svelte-5-runes|Svelte 5 Runes]]
3. [[data-driven-architecture|Data-Driven Architecture]]
4. [[typescript-interfaces|TypeScript Interfaces]]
5. [[css-grid-layout|CSS Grid Layout]]
6. [[responsive-design|Responsive Design]]
7. [[what-to-test|What to Test]]
8. [[tdd-workflow|TDD Workflow]]
9. [[common-mistakes|Common Mistakes]]

## Domain Index

### Project Setup
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[sveltekit-project-structure|SvelteKit Project Structure]] | 1-beginner | How SvelteKit organizes files and why each folder exists |
| [[bun-runtime|Bun Runtime]] | 1-beginner | What Bun is and why this project uses it instead of Node.js |
| [[typescript-strict-mode|TypeScript Strict Mode]] | 1-beginner | How TypeScript catches errors before code runs |
| [[package-json-scripts|Package JSON Scripts]] | 1-beginner | What each script in package.json does and when to use it |
| [[environment-and-tooling|Environment and Tooling]] | 1-beginner | Editor setup, extensions, and development environment |
| [[tailwind-configuration|Tailwind Configuration]] | 2-intermediate | How Tailwind v4 is configured with CSS-first @theme |

### Frontend
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[svelte-components|Svelte Components]] | 1-beginner | The building block of everything visible on the page |
| [[props-and-events|Props and Events]] | 1-beginner | How components talk to each other |
| [[svelte-5-runes|Svelte 5 Runes]] | 2-intermediate | Reactive state with $state, $derived, $effect |
| [[conditional-rendering|Conditional Rendering]] | 1-beginner | Showing and hiding content based on data |
| [[slots-and-composition|Slots and Composition]] | 2-intermediate | Building flexible, reusable component layouts |
| [[sveltekit-routing|SvelteKit Routing]] | 1-beginner | File-based routing and dynamic URLs |
| [[sveltekit-load-functions|SvelteKit Load Functions]] | 2-intermediate | Fetching data before a page renders |
| [[sveltekit-layouts|SvelteKit Layouts]] | 2-intermediate | Shared UI that wraps multiple pages |
| [[component-architecture|Component Architecture]] | 2-intermediate | How to structure and compose components at scale |
| [[responsive-design|Responsive Design]] | 2-intermediate | Making layouts work on any screen size |

### Styling
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[tailwind-utility-first|Tailwind Utility-First]] | 1-beginner | Why classes like `p-4 text-lg` replace custom CSS |
| [[css-custom-properties|CSS Custom Properties]] | 1-beginner | Variables in CSS that power theme switching |
| [[design-tokens|Design Tokens]] | 2-intermediate | The system of named values behind every visual decision |
| [[css-grid-layout|CSS Grid Layout]] | 2-intermediate | Two-dimensional layouts for cards, bento grids, dashboards |
| [[scoped-styles-in-svelte|Scoped Styles in Svelte]] | 1-beginner | How Svelte keeps component styles from leaking |
| [[dark-theme-architecture|Dark Theme Architecture]] | 2-intermediate | How the dark/light theme system works end to end |
| [[mobile-first-responsive|Mobile-First Responsive]] | 2-intermediate | Writing CSS for small screens first, enhancing up |
| [[css-scroll-snap|CSS Scroll Snap]] | 2-intermediate | Snapping scroll positions for section-by-section reveals |

### Data Layer
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[typescript-interfaces|TypeScript Interfaces]] | 1-beginner | Defining the shape of your data like a SQL schema |
| [[typed-data-files|Typed Data Files]] | 1-beginner | Seed data files that satisfy TypeScript contracts |
| [[localized-string-i18n|LocalizedString and i18n]] | 2-intermediate | Internationalization built into the data layer from day one |
| [[data-driven-architecture|Data-Driven Architecture]] | 2-intermediate | Why components never hardcode content |
| [[barrel-exports|Barrel Exports]] | 1-beginner | One import path for everything in a module |
| [[import-meta-glob|import.meta.glob]] | 2-intermediate | Loading files at build time without manual imports |
| [[markdown-content-pipeline|Markdown Content Pipeline]] | 2-intermediate | How blog posts go from .md files to rendered HTML |

### Motion and Animation
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[gsap-fundamentals|GSAP Fundamentals]] | 2-intermediate | The animation engine that powers scroll-linked motion |
| [[gsap-scrolltrigger|GSAP ScrollTrigger]] | 2-intermediate | Animations that fire when elements enter the viewport |
| [[gsap-timeline-and-stagger|GSAP Timeline and Stagger]] | 2-intermediate | Sequencing animations and staggering groups |
| [[svelte-actions|Svelte Actions]] | 2-intermediate | Reusable DOM behaviors attached with use: |
| [[tilt-magnetic-ripple|Tilt, Magnetic, Ripple]] | 2-intermediate | Interaction effects that make UI feel alive |
| [[entrance-animations|Entrance Animations]] | 2-intermediate | How elements reveal themselves on scroll |
| [[svg-animation-drawsvg|SVG Animation (DrawSVG)]] | 3-advanced | Drawing SVG paths and filling them with GSAP |
| [[svg-morph-animation|SVG Morph Animation]] | 3-advanced | Morphing between SVG shapes with MorphSVGPlugin |
| [[lottie-animations|Lottie Animations]] | 2-intermediate | Playing pre-designed JSON animations |
| [[scroll-linked-video|Scroll-Linked Video]] | 2-intermediate | Media that advances with scroll position |
| [[flip-animation|FLIP Animation]] | 3-advanced | Smooth layout transitions when filtering/sorting |
| [[reduced-motion-accessibility|Reduced Motion Accessibility]] | 1-beginner | Respecting user preferences for less motion |

### 3D Graphics
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[threejs-scene-basics|Three.js Scene Basics]] | 2-intermediate | The 3D scene, camera, and renderer pipeline |
| [[threlte-svelte-bindings|Threlte Svelte Bindings]] | 2-intermediate | Using Three.js declaratively with Svelte components |
| [[camera-and-lighting|Camera and Lighting]] | 2-intermediate | Positioning the viewer and illuminating the scene |
| [[postprocessing-bloom|Post-Processing (Bloom)]] | 3-advanced | Adding glow effects after the scene renders |
| [[performance-budgets-3d|Performance Budgets for 3D]] | 2-intermediate | Keeping 3D fast on all devices |

### Testing
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[vitest-fundamentals|Vitest Fundamentals]] | 1-beginner | Writing and running unit tests |
| [[component-testing|Component Testing]] | 2-intermediate | Rendering Svelte components in tests |
| [[test-setup-and-mocking|Test Setup and Mocking]] | 2-intermediate | Global mocks for browser APIs and libraries |
| [[what-to-test|What to Test]] | 2-intermediate | Deciding test boundaries and avoiding wasted effort |
| [[tdd-workflow|TDD Workflow]] | 2-intermediate | Red-green-refactor test-driven development |
| [[playwright-e2e|Playwright E2E]] | 2-intermediate | End-to-end browser testing for user flows |

### DevOps
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[git-workflow|Git Workflow]] | 1-beginner | Branching, committing, and collaborating with Git |
| [[github-actions-ci|GitHub Actions CI]] | 2-intermediate | Automated testing and building on every push |
| [[vercel-deployment|Vercel Deployment]] | 1-beginner | How code goes from Git to a live URL |
| [[bun-vs-node|Bun vs Node]] | 1-beginner | Why this project chose Bun and what it means |
| [[environment-variables|Environment Variables]] | 1-beginner | Managing secrets and configuration outside code |

### Patterns
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[data-driven-components|Data-Driven Components]] | 2-intermediate | Components that render from data, not hardcoded markup |
| [[action-pattern|Action Pattern]] | 2-intermediate | Reusable DOM behaviors via Svelte use: directive |
| [[filter-reset-pattern|Filter Reset Pattern]] | 2-intermediate | Reactive filter state with reliable reset |
| [[collapsible-section-pattern|Collapsible Section Pattern]] | 2-intermediate | Smooth height animation with CSS grid |
| [[entrance-animation-guard|Entrance Animation Guard]] | 2-intermediate | Preventing hover during entrance animations |
| [[svg-paint-server-spa|SVG Paint Server SPA]] | 3-advanced | Fixing SVG gradients in single-page apps |
| [[scroll-linked-content|Scroll-Linked Content]] | 2-intermediate | Tying content state to scroll position |

### Debugging
| Doc | Difficulty | Summary |
|-----|-----------|---------|
| [[reading-error-messages|Reading Error Messages]] | 1-beginner | How to parse and act on error output |
| [[browser-devtools|Browser DevTools]] | 1-beginner | Inspecting elements, console, network, performance |
| [[svelte-devtools|Svelte DevTools]] | 1-beginner | Component tree inspection and state debugging |
| [[gsap-debugging|GSAP Debugging]] | 2-intermediate | Debugging scroll-linked animations |
| [[common-mistakes|Common Mistakes]] | 1-beginner | Errors every beginner hits and how to fix them |

## Maintenance

This knowledge base is updated at the end of every slice. When new code introduces or heavily uses a concept, the corresponding learn doc is created or updated. See `CLAUDE.md` slice closing protocol step 5b for the exact process.
