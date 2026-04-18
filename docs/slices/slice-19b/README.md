# Slice 19b — Accessibility (A11Y) Optimization

**Level 1 direction doc.**

**Status:** planned
**Depends on:** 19
**Est. Sessions:** 2

## Goal

Full accessibility audit and remediation: WCAG 2.1 AA compliance. Lighthouse a11y target: 95+.

## Scope

- Semantic HTML audit
- ARIA landmarks + labels
- Keyboard navigation across all interactive components
- Focus management (visible focus rings, logical tab order, focus trapping in modals/overlays)
- Screen reader testing
- Color contrast verification (4.5:1 text, 3:1 UI)
- Skip-to-content link
- `prefers-reduced-motion` enforcement audit (site-wide sweep)
- Alt text for all images and SVGs
- Form accessibility (labels, error announcements, live regions)

## Why after Slice 19

Mobile optimization changes touch targets, layout, and interaction patterns. Running the a11y audit after mobile ensures the final responsive state is tested, not an intermediate one. Keyboard and screen reader testing also benefits from stable component APIs post-mobile polish.

## Target

Lighthouse accessibility score: **95+** on every public route.
