---
id: svelte-5
name: "Svelte 5"
layer: frontend
domains: [web-development]
connectsTo: [sveltekit, gsap, threejs-threlte]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: svelte
proficiency: expert
---

## What it is

Svelte is a UI framework that takes a fundamentally different approach from React or Vue. Instead of shipping a runtime library to the browser that interprets your components, Svelte compiles your components into efficient vanilla JavaScript at build time. Svelte 5 introduced runes — a new reactivity system using `$state`, `$derived`, and `$effect` — that makes reactive data explicit and fine-grained. The result is smaller bundles, faster updates, and code that reads almost like plain HTML with superpowers.

## Why I use it

Svelte 5's runes system is the cleanest reactivity model I've worked with. `$state` for reactive variables, `$derived` for computed values, `$effect` for side effects — there's no hook rules to memorize, no dependency arrays to get wrong, no `useCallback` wrapping. Coming from a data background where I think in terms of data flow and transformations, Svelte's model maps naturally to how I reason about UI: data in, DOM out, no hidden re-renders.

## In Practice

Every component on yesid.dev is a Svelte 5 component using runes. The tech stack diagram uses `$state` for the selected node, `$derived` for filtered connections, and `$effect` for GSAP animation lifecycle. The CollapsibleSection component uses `$state` for open/closed state with CSS transitions. Svelte 5's compile-time approach means the site ships minimal JavaScript despite having complex animations, interactive diagrams, and responsive layouts.
