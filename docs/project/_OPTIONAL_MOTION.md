# Motion

> **OPTIONAL template.** Create when project has animation as a first-class concern — motion language, timing, choreography. Typical projects: marketing sites, immersive web experiences, design-heavy apps.
>
> **To activate:** rename `_OPTIONAL_MOTION.md` → `MOTION.md`. Update README.md (in this directory).

## When to create

- Project uses an animation library (GSAP, Framer Motion, Motion One, CSS keyframes at scale)
- Multiple components share motion patterns (entrance reveals, hover effects, scroll choreography)
- Project enforces motion-budget discipline (no jank, prefers-reduced-motion respected, frame budget tracked)
- Animations are part of the brand expression (not just polish)

## Doctrine

> The project's overarching motion philosophy. One paragraph.

<!-- FILL IN: e.g., "Snappy: response over decoration. Motion serves user action (tap, hover, scroll), never plays for its own sake. Entrance reveals are a no-go (they fight the scroll). Every animation respects prefers-reduced-motion." -->

## Motion library

| Field | Value |
|-------|-------|
| Primary library | <!-- FILL IN: GSAP / Framer Motion / Motion One / CSS / "n/a" --> |
| Loading strategy | <!-- FILL IN: "lazy-loaded plugins" / "single bundle" / "per-component import" --> |
| Plugins used | <!-- FILL IN: e.g., "ScrollTrigger, MorphSVG, SplitText (lazy)" --> |
| Tooling | <!-- FILL IN: "GSAP Master MCP for API verification" / "n/a" --> |

## Signature vocabulary

> The N canonical motion patterns allowed in this project. Constrains the team to a coherent motion language; banishes ad-hoc animations.

| # | Signature | Purpose | Example |
|---|-----------|---------|---------|
| 1 | <!-- FILL IN: e.g., "hover-lift" --> | <!-- "tactile response to hover on tappable" --> | <!-- "ProjectCard, ServiceStation" --> |
| 2 | <!-- FILL IN: e.g., "morph-hover" --> | <!-- "SVG path morph on hover for icon delight" --> | <!-- "BlogSvgIcon" --> |
| 3 | <!-- FILL IN: e.g., "scrub-on-scroll" --> | <!-- "scroll-linked timeline (e.g., DrawSVG stroke fills as section enters)" --> | <!-- "createDrawScrub timeline" --> |

## Performance budget

| Metric | Budget | Where measured |
|--------|--------|----------------|
| Frame rate during scroll | <!-- e.g., 60fps minimum, 50fps acceptable --> | <!-- DevTools performance panel --> |
| Bundle size delta from motion lib | <!-- e.g., "<50KB initial" --> | <!-- bundle analyzer --> |
| First content paint impact | <!-- e.g., "motion lib lazy-loaded; zero impact on FCP" --> | <!-- Lighthouse --> |

## Reduced motion

| Field | Value |
|-------|-------|
| Detection | <!-- FILL IN: e.g., "@media (prefers-reduced-motion: reduce) in CSS; matchMedia in JS" --> |
| Enforcement layer | <!-- FILL IN: e.g., "factory-level — every timeline factory checks before animating" --> |
| Fallback behavior | <!-- FILL IN: e.g., "instant final state — no transition; visual content is identical" --> |

## Shared infrastructure

| Component | Purpose |
|-----------|---------|
| <!-- FILL IN: e.g., "shared gsap.ticker" --> | <!-- "single RAF loop with IO-gated subscribers; replaces ad-hoc setInterval/RAF per component" --> |
| <!-- FILL IN: e.g., "scrub factory pattern" --> | <!-- "createDrawScrub / createCrescendoScrub / etc. — all return ScrollTrigger timelines from a config object" --> |

## Banned patterns

> Motion anti-patterns this project has decided NOT to use. Each with rationale.

| Banned | Why |
|--------|-----|
| <!-- FILL IN: e.g., "Entrance reveal on every section" --> | <!-- "fights the scroll, slows perceived load, doesn't survive prefers-reduced-motion" --> |
| <!-- FILL IN: e.g., "GSAP inside Svelte $effect()" --> | <!-- "timeline callbacks (onComplete) don't fire reliably; use Svelte actions instead" --> |
| <!-- --> | <!-- --> |

## Notes / decisions

<!-- FILL IN: motion decisions worth documenting -->
