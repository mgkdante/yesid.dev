---
id: vitest
name: "Vitest"
layer: testing
domains: [devops-infra, web-development]
connectsTo: [typescript, bun]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: vitest
proficiency: proficient
---

## What it is

Vitest is a fast unit testing framework built on Vite's transformation pipeline. It runs TypeScript and JSX natively (no separate compile step), supports ESM imports, and provides a Jest-compatible API — so if you know Jest, you already know Vitest. It includes snapshot testing, code coverage, watch mode, and a browser UI for exploring test results. For Vite-based projects (SvelteKit, React with Vite), Vitest shares the same config and plugin ecosystem.

## Why I use it

Vitest is fast, and speed matters when you're running tests after every code change. It uses Vite's on-demand module transformation, so only the files that changed get re-processed. Combined with Bun as the runtime, test suites that took minutes with Jest now run in seconds. I pair it with `@testing-library/svelte` for component tests and use the multi-project configuration to run different test types (unit vs. component) with optimized settings for each.

## In Practice

yesid.dev uses Vitest with a dual-project configuration: one project for component tests (using happy-dom for DOM simulation) and another for data-layer unit tests (pure TypeScript, no DOM needed). The test suite validates data integrity (all 34 tech items have valid connections, no dangling references), component behavior (filters, collapsible sections, stack panels), and type safety. Tests run on every commit via `bun run test` and in CI via GitHub Actions.
