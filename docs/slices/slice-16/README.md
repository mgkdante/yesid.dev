# Slice 16 — E2E Test Suite + Performance + Brand QA Pass

**Level 1 direction doc.**

**Status:** planned
**Depends on:** 15, 17
**Est. Sessions:** 3

## Goal

Full end-to-end test coverage for the site's critical flows. Performance verification across pages. Brand QA: colors, fonts, motion, consistency.

## Scope

Playwright E2E tests: full nav flow, train journey scroll, project detail, all pages at 3 breakpoints. Performance testing: verify frame rate during scroll on home page. Brand verification: colors, fonts, motion consistency. Fix visual/responsive/performance issues.

Optional: add easter eggs from MOTION.md §9.

## Keep in mind

- **Observability stack:** Sentry for errors, PostHog for product analytics, Vercel Analytics for web vitals.

## You'll learn

E2E testing (Playwright), performance profiling, responsive QA, accessibility verification.
