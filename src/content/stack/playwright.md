---
id: playwright
name: "Playwright"
layer: testing
domains: [devops-infra, web-development]
connectsTo: [github-actions]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: playwright
proficiency: familiar
---

## What it is

Playwright is a browser automation framework by Microsoft for end-to-end testing. It controls real browsers (Chromium, Firefox, WebKit) programmatically — navigating pages, clicking buttons, filling forms, and asserting on page content. Unlike unit tests that test components in isolation, E2E tests verify that the entire application works as a user would experience it: real HTTP requests, real rendering, real interactions.

## Why I use it

Playwright catches the bugs that unit tests miss — the ones that only appear when components interact in a real browser with real data. I'm building my E2E testing practice around it because it's the most capable browser testing tool available: auto-waiting (no flaky `sleep()` calls), multi-browser support, network interception, and built-in trace viewer for debugging failures. For visual-heavy sites like yesid.dev, Playwright can verify animations, responsive layouts, and interaction flows.

## In Practice

Playwright is planned for yesid.dev's E2E testing layer — verifying critical user flows like navigating the tech stack diagram, opening detail panels, using filters, and the Build Your Stack configurator across Chrome, Firefox, and Safari. It integrates with GitHub Actions to run browser tests on every push, and its screenshot comparison can catch visual regressions that unit tests would never detect.
