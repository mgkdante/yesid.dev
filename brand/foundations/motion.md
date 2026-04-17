# foundations / motion

> Narrative. The full implementation reference — actions, scrub factories, shared ticker, lazy plugin loaders, bundle budgets — lives at `docs/reference/MOTION.md`. The governance rules live at `docs/reference/CONSTITUTION.md § 8 Motion Doctrine — Snappy`.

## What motion means for the brand

Motion on yesid.dev is never decoration. It exists to do one of three jobs:

1. **Wayfinding** — tell the reader where they are or where something will take them (hover states, cursor glow tracking, magnetic attractors).
2. **Feedback** — confirm that an action happened (boop on click, morph on hover, focus ring).
3. **Emphasis** — draw the eye to something worth reading once, when the reader is already there (DrawSVG scrub tracing a blueprint, crescendo scale on the manifesto as it passes through center).

Anything that does not do one of those three jobs does not ship.

## Signatures — the nine

Motion is closed at nine signatures. A new design wanting motion either picks one of these or proposes an amendment to `docs/reference/CONSTITUTION.md § 8`.

| # | Signature | Lane | Where it fires |
|---|---|---|---|
| 1 | Boop | Interaction | Buttons, CTAs — tap-shaped impulse that resets |
| 2 | Cursor glow + magnetic | Interaction | Cards, CTAs — radial glow + subtle translation toward cursor |
| 3 | Wordmark hover | Interaction | Nav + Footer "yesid." — SplitText-driven effect pool |
| 4 | SVG morph hover | Interaction | HomeServices SVG panels — path morphing on hover / tap |
| 5 | MetroNetwork hero scrub | Scroll-scrub | Home page hero — the site's only pinned timeline |
| 6 | DrawSVG scrub | Scroll-scrub | Blueprint SVGs on listing pages — stroke-draw as the section passes |
| 7 | Crescendo scrub | Scroll-scrub | Manifesto + rotated edge titles — scale/opacity scale as the section passes |
| 8 | LED pulse | Idle ambient | Status dots, stop-label glows — always-on, IO-gated |
| 9 | Typewriter idle | Idle ambient | Hero scroll prompt — one-shot, IO-aware |

Three lanes: **Interaction** (user input triggers it), **Scroll-scrub** (scroll position drives it), **Idle ambient** (the page itself owns it). The implementation detail lives at `docs/reference/MOTION.md § 3–§ 7`.

## The Snappy Doctrine

Content renders at its final state on page load. Motion triggers only on interaction, scroll-scrub, or idle ambient.

No fade-ups on load. No scale-ins on scroll-into-view. No staggered list entrances. A page that looks finished the moment it paints is the doctrine.

The rule exists because entrance animations read as loading states to an informed reader. A well-designed static page is faster to consume than a choreographed one. The site is judged on content and craft; animated entry does neither job.

Full list of what is forbidden — and the one permitted exception (HomeCloser graffiti at the narrative terminus) — in `docs/reference/CONSTITUTION.md § 8`.

## Tokens

Durations and easings live in `src/lib/styles/tokens.css` and are mirrored by `src/lib/motion/tokens.ts` (parity-tested). CSS transitions reference them via `var(--duration-fast)` / `var(--ease-default)`; GSAP tweens import via `durationSec()` / `ease.default`.

| Token | Value | When |
|---|---|---|
| `--duration-instant` | 100ms | Flash feedback, near-tap responses |
| `--duration-fast` | 150ms | Hover, toggles, micro-interactions |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Panel open / close |
| `--duration-slower` | 500ms | Page transitions, large reveals |
| `--ease-default` | Material cubic-bezier | General purpose |
| `--ease-out` | Decelerating | Settles into rest |
| `--ease-in-out` | Symmetric | Two-way transitions |
| `--ease-bounce` | Overshoot | Playful interaction (used sparingly) |

Raw `0.3s ease` or inline `cubic-bezier(...)` in CSS is banned — use the tokens.

## Principle: one shared ticker

All ambient animation ticks share one `gsap.ticker` callback that fans out to subscribers. No component registers its own `requestAnimationFrame` or `setInterval` loop. Subscribers that only matter while their owner is visible gate themselves on an IntersectionObserver.

The implementation is at `src/lib/motion/utils/ticker.ts`. The reason: a page with ten ambient components and ten independent RAF loops burns ten times the CPU. One ticker, N subscribers, each doing the minimum work while offscreen.

## Principle: lazy GSAP plugins

GSAP ships as a core + many optional plugins. Most routes don't need every plugin. The motion layer lazy-loads each plugin on first use — `loadDrawSVG()`, `loadMorphSVG()`, `loadFlip()`, `loadCustomEase()`, `loadMotionPathPlugin()`. Three plugins stay eager (ScrollTrigger, SplitText, MorphSVGPlugin) because their consumers need them synchronously on page paint.

`docs/reference/MOTION.md § 9` has the full consumer pattern.

## Principle: reduced motion is honored

`isPrefersReducedMotion()` is checked by every motion primitive. The per-signature behavior table — what "no motion" means for each of the nine — lives at `docs/reference/MOTION.md § 10`. The short version: the user sees the final state and nothing animates. Nothing breaks, nothing half-plays.

## When motion is the right answer

| Need | Signature / tool |
|---|---|
| Confirm a click / hover landed | Signature 1 (Boop) or Signature 2 (Cursor glow + magnetic) |
| Show that scrolling is taking the reader somewhere | Signature 5, 6, or 7 (a scrub, depending on context) |
| Draw the eye to a static element that matters now | Signature 8 (LED pulse), but only if the element is live / interactive |
| Suggest that a section is loading | **No.** Render the final state. Loading states are for data, not for decoration. |
| Reward a reader for reaching the end of the page | Signature 6 + the HomeCloser exception (the one permitted entrance) |

## When motion is the wrong answer

- A section looks empty, so motion fills it → fix the content.
- A heading feels underwhelming, so motion animates it in → fix the heading's type or layout.
- A transition between two states feels abrupt → use a CSS transition on the token (`transition: ... var(--duration-normal) var(--ease-default)`), not a GSAP timeline.
- A card's appearance should "feel more alive" → it shouldn't. Static content on yesid.dev is static. Alive is reserved for hover and scroll.

## Cross-links

- Implementation reference: `docs/reference/MOTION.md`.
- Governance + forbidden list + permitted exception: `docs/reference/CONSTITUTION.md § 8`.
- Principle 4 in the brand spine: `BRAND.md § Principles` #4.
- Why the doctrine is Snappy: `decisions/2026-04-what-i-killed.md` (the fade-up death + entrance-reveal death sections).
