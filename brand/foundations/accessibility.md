# foundations / accessibility

> Narrative. The rules are enforced at `docs/project/CONSTITUTION.md § 7 Accessibility`. This file describes the posture — why the rules exist, where they bite.

## Posture

Accessibility is infrastructure, not decoration. Keyboard navigation, focus management, semantic HTML, ARIA attributes, reduced-motion opt-outs — these are part of the component contract, not an afterthought. A component without a11y is an unfinished component.

The site is single-author and solo-reviewed. There is no separate a11y pass at the end. The rules run inline with development.

## Requirements (every component)

The full table lives at `docs/project/CONSTITUTION.md § 7`. The floor:

- **Keyboard navigable.** Every interactive element reachable via Tab; operable via Enter / Space.
- **Focus visible.** `:focus-visible` outline is non-optional. The site uses `outline: 2px solid var(--primary); outline-offset: 2px`.
- **No `<div onclick>`.** Interactive elements are `<button>`, `<a href>`, or a Bits UI primitive. If a `<div>` is interactive, it is a bug.
- **Zero `svelte-ignore a11y_*` suppressions.** No comments that bypass the Svelte a11y checker. If the checker flags something, the component is redesigned.
- **ARIA attributes.** Decorative elements use `aria-hidden`. Regions use `aria-label`. State uses `aria-expanded`, `aria-pressed`, etc.
- **One `<h1>` per page, no skipped levels.** Every `<section>` has a heading — `sr-only` if visually hidden.
- **Reduced motion respected.** Every animation — GSAP or CSS — reads `prefers-reduced-motion` and opts out cleanly.

## Why Bits UI

The interactive primitives (Dialog, Collapsible, Tabs, Toggle, Tooltip, Drawer) come from Bits UI — a headless library that ships the accessibility logic (focus traps, ARIA attributes, keyboard handlers, screen-reader announcements) without any styling.

The site wraps those primitives in brand-styled components under `ui/` and `brand/`. Bits UI handles a11y; yesid. handles visuals + motion. The two concerns never fight.

Not using Bits UI for an interactive primitive would mean rewriting that a11y logic from scratch. That's where most hand-rolled a11y bugs come from.

## Reduced-motion contract

Every motion primitive checks `isPrefersReducedMotion()` (from `src/lib/motion/stores/reducedMotion.ts`) and either:

1. Renders the final state synchronously and returns a no-op cleanup, or
2. Skips the animation entirely and returns a no-op cleanup.

`docs/project/MOTION.md § 10 Reduced-Motion Contract` has the per-signature behavior table. The short version: nothing moves for users with `prefers-reduced-motion: reduce`, and nothing breaks.

CSS keyframe animations — `pulse-glow`, `station-ping`, `typewriter-blink` — are all guarded in `app.css` under `@media (prefers-reduced-motion: reduce)` and set to `animation: none`.

## Touch targets

Below the `xl:` breakpoint (1024px), every interactive element is at least 44x44 px (WCAG 2.5.5 AAA). Buttons, links, tab items, filter chips, close buttons, form inputs, nav items. The visible element can be smaller; the tap target cannot.

Implementation: `min-height: 44px; min-width: 44px` or equivalent padding. Tap targets that share space use invisible padding to avoid visual clutter.

## Keyboard conventions

| Action | Key |
|---|---|
| Navigate forward | Tab |
| Navigate backward | Shift + Tab |
| Activate button / link | Enter / Space |
| Open drawer / menu | Enter / Space |
| Close drawer / menu / modal | Escape |
| Navigate tabs / segments | Arrow keys (via Bits UI) |

No custom keyboard shortcuts. The site inherits Bits UI's defaults everywhere Bits UI owns the interaction.

## Screen reader conventions

- **Decorative SVGs** use `aria-hidden="true"`. This includes the MetroNetwork hero graphic, illustrative station dots, the manifesto canvas, all blueprint line art.
- **Informative SVGs** — icons that convey meaning on their own — use `<title>` + `role="img"`. Example: the wordmark monogram in the footer uses `<title>yesid</title>`.
- **Rotated edge titles** (home Projects, home Terminus, blog listing, projects listing, contact) are real `<h2>` tags with CSS `writing-mode: vertical-rl` + `rotate: 180deg`. Screen readers read the real DOM; the visual rotation is a render-time concern.
- **Text hidden visually but needed for SR context** uses `class="sr-only"` (Tailwind utility). Never `display: none` for SR-consumable content.

## Color contrast

Text on every surface is verified at WCAG AA minimum, AAA where possible. Key pairs:

| Pair | Dark theme | Result |
|---|---|---|
| `--foreground` on `--background` | ~13.9 : 1 | AAA |
| `--primary` on `--background` | ~5.3 : 1 | AA body text |
| `--muted-foreground` on `--background` | ~3.7 : 1 | AA large text only — avoid for paragraphs |
| `--dim-foreground` on `--background` | ~2.3 : 1 | Below AA — non-text use only (dividers, borders, inactive icons) |

Full list + method: `foundations/color.md`.

## What is NOT in scope

- **Live screen-reader testing.** The site is verified structurally (heading order, ARIA roles, `aria-label` presence). It is not tested against NVDA / JAWS / VoiceOver during each slice. That is a dedicated a11y audit slice (not scheduled).
- **WCAG 2.2 AA conformance certification.** The site targets AA; it does not have an external audit signed off.
- **Internationalization (RTL, bidi, font-swaps for non-Latin scripts).** Logical properties are preferred (`padding-inline`, `margin-block`), but the site is English-only today. RTL is a future concern.

## When a change affects accessibility

Any change that:

- Adds a new interactive element → must include keyboard + focus + reduced-motion handling.
- Removes a wrapping `<section>` / `<nav>` / `<header>` → check the heading outline hasn't broken.
- Adds a new `@keyframes` → must have a `prefers-reduced-motion: reduce` branch.
- Introduces an SVG → decide `aria-hidden` vs `<title>` + `role="img"` at write-time.
- Changes a token value → re-run the contrast check for affected pairs.

If the change can't satisfy these, it isn't shippable. Redesign — don't suppress with `svelte-ignore`.
