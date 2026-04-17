---
title: "The Snappy Doctrine"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 6
tags:
  - learn
  - motion
  - intermediate
  - slice-17e
prerequisites:
  - "[[signature-vocabulary]]"
date: 2026-04-17
slice: 17e-6
---

# The Snappy Doctrine

## The Analogy

A good UI is like a storefront: the stock is on the shelves when the doors open. You don't stand there while a conveyor belt puts items onto shelves one by one. That's the "loading state" feeling that fade-up-on-scroll reveals create — they make your users watch your page get built.

## What It Is

A governance rule for motion on yesid.dev, codified in Slice 17e:

> **Content renders at its final state on page load. Motion triggers only on interaction, scroll-scrub, or idle ambient.**

Three triggers are permitted — nothing else:

- **Interaction** — hover, click, focus, tap. The user's explicit action.
- **Scroll-scrub** — motion bound to scroll position. The user's explicit progression.
- **Idle ambient** — always-on animation (status pulse, typewriter prompt) without user input.

Forbidden:
- Fade-ups, scale-ins, slide-in stagger reveals — any entrance that "arrives" over time.
- New `requestAnimationFrame` / `setInterval` ambient loops outside the shared ticker.
- `gsap.from({ opacity: 0 })` on mount.
- Svelte `transition:` / `animate:` directives — GSAP is the motion system.

## Why It Matters

Entrance reveals are a loading-state tell. They leak "my site is slow; watch it load" to the user. They hurt SEO too — `opacity: 0` content reads as hidden to crawlers (even if you swear you'll fade it in soon), and Google's LCP metric penalizes animated hero content that isn't visible at TTI.

The doctrine forces you to think of motion as a **reward for engagement**, not a delivery mechanism for static content. Static content ships at final state; motion rewards scroll, hover, tap.

## How We Use It in This Project

| File | What to look at | Why it matters |
|---|---|---|
| `docs/reference/CONSTITUTION.md` § 8 | "Forbidden" list + D266 clarification | Governance — PR reviewers use this as the checklist |
| `src/lib/components/home/HeroBanner.svelte` | `createHeroTimeline(pinContainer, opts)` | The scroll-scrub lane in its most elaborate form (pinned 9 phases) |
| `src/lib/components/home/Manifesto.svelte` | `startCountdown()` + IntersectionObserver | Idle-ambient lane — the countdown ticks only while the section is visible |
| `src/lib/motion/actions/boop.ts` | `boop(node, params) { ... }` | Interaction lane — no DOM mutation until hover fires |

## The Mental Model

Three lanes, one permitted exception:

```
Interaction     Scroll-scrub     Idle ambient
     │                │                │
     ▼                ▼                ▼
  [hover]          [scroll]      [shared ticker]
  [click]          [pinned]      [IO-gated]
  [focus]
     │                │                │
     ▼                ▼                ▼
  use:boop      createHeroTimeline   heroTypewriter
  use:morphHover createCrescendoScrub .pulse-glow
  use:magnetic  createDrawScrub
```

The one exception: **HomeCloser graffiti** retains an on-enter DrawSVG timeline because it is the narrative "Terminus" — the flourish reinforces arrival at the destination. This exception is single-use and amendment-gated; do not replicate it.

### D266 — Drawing motion is not a reveal

Drawing motion (`drawSVG: 0% → 100%`, morphSVG tracing, motionPath tracing) **is** doctrine-compatible on enter. The drawing IS the content — you are not fading it in, you are constructing it in front of the user. Pure fade-up / scale-in / stagger reveals remain forbidden.

## Worked Example

**Bad (forbidden):**

```ts
// src/lib/components/SomeCard.svelte
onMount(() => {
  if (!isPrefersReducedMotion()) {
    gsap.fromTo(
      cardEl,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4 }
    );
  }
});
```

This is a fade-up reveal on mount. The card "arrives" from below as it fades in. Nothing the user did triggered this — just the passage of time. Deleted in 17e-5 from `StackScenarioCard.svelte` (D267 F).

**Good (interaction-driven):**

```svelte
<!-- src/lib/components/home/HomeServices.svelte -->
<button
  use:morphHover={{ shapes: SHAPES, enabled: svgReady[i] }}
>
  <svg>...</svg>
</button>
```

The card renders at final state on load. Motion fires only when the user hovers (desktop) or taps (mobile) the SVG panel. User-earned.

## Common Mistakes

1. **Conflating "reveal" with "drawing motion"**
   - **What happens:** You think all motion on enter is forbidden, so you delete a DrawSVG animation that traces a network diagram.
   - **Fix:** Drawing motion (D266) is explicitly allowed on enter. The drawing IS the content. Pure opacity or translate fade-ups are the violation.
   - **Why:** The doctrine is about *mechanism*, not *timing*. Fading in a block of text is fake delivery; tracing the strokes of a diagram is construction.

2. **Adding a `setInterval` in a component for ambient work**
   - **What happens:** Your component burns CPU when scrolled offscreen; on mobile, the battery drains.
   - **Fix:** Use `subscribe(id, fn)` from `motion/utils/ticker.js` + IntersectionObserver gate. See [[shared-ticker-pattern]].

3. **"Just this once" entrance animations**
   - **What happens:** You add one `gsap.from({ opacity: 0 })` for a banner that "just needs to fade in". Next quarter, every new page has one. Doctrine is now dead.
   - **Fix:** Render at final state. If you really want celebration on a page, use scroll-scrub (signature 7 — crescendo) or earn it via interaction.

## Connections

- **Depends on:** [[signature-vocabulary]] — the 9 permitted motion signatures
- **Enables:** [[scrub-factory-pattern]], [[shared-ticker-pattern]], [[lazy-gsap-plugins]]
- **Related:** [[ssr-inline-svg]] — the MetroNetwork SSR inlining pattern respects the doctrine by having content at final state before JS boots

## Knowledge Check

1. Can a fade-up-on-mount be acceptable? → No. Render at final state.
2. Can a DrawSVG stroke-trace run on section enter? → Yes. D266 — drawing motion IS the content.
3. What are the three permitted motion triggers? → Interaction, scroll-scrub, idle ambient.
4. Can a `setInterval` live inside a component? → Only if IO-gated (start/stop on section visibility change).

## Go Deeper

- `docs/reference/CONSTITUTION.md` § 8 — governance
- `docs/reference/MOTION.md` v2.0 — implementation reference
- `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` § 2 — full doctrine statement
