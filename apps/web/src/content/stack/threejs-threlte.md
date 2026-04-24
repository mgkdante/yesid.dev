---
id: threejs-threlte
name: "Three.js / Threlte"
layer: frontend
domains: [web-development]
connectsTo: [svelte-5, gsap]
relatedServices: [web-development]
relatedProjects: []
icon: threejs
proficiency: proficient
---

## What it is

Three.js is a JavaScript library that makes WebGL accessible — it provides a scene graph, camera system, lighting, materials, and geometry primitives so you can create 3D graphics in the browser without writing raw shader code. Threlte is Svelte's wrapper around Three.js, letting you build 3D scenes with Svelte components instead of imperative JavaScript. A `<T.Mesh>` component in Threlte compiles to a Three.js mesh with reactive props and automatic cleanup.

## Why I chose it

3D on the web is a differentiator — most portfolio sites are flat. Three.js gave me the ability to create immersive scenes that make a site memorable without requiring WebGL expertise from future maintainers. Threlte specifically fit a Svelte stack: 3D objects are components with props, they participate in Svelte's reactivity system, and they clean up automatically when unmounted. I paired Threlte with GSAP for animation timing and scroll-linked 3D transitions.

## In Practice

On yesid.dev, Three.js / Threlte powered an experimental 3D hero scene during the early build — meshes, lights, and post-processing (bloom, vignette) composed as Svelte components, with mouse- and scroll-linked interactivity on top. The scene was killed after a performance and accessibility review: WebGL init cost on low-end devices, a11y gaps on the 3D canvas, and a `prefers-reduced-motion` fallback that effectively duplicated a simpler SVG path. The brief didn't need it, and the SVG + GSAP stack delivered the same feel at a fraction of the cost. Killed, not parked. See `brand/decisions/what-i-killed.md` for the full rationale (ships in Slice 17h).

> Scene components previously lived at `src/lib/motion/three/`; removed in the Slice 17 motion re-engineering.
