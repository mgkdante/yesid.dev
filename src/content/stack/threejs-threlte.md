---
id: threejs-threlte
name: "Three.js / Threlte"
layer: frontend
domains: [web-development]
connectsTo: [svelte-5, gsap]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: threejs
proficiency: proficient
---

## What it is

Three.js is a JavaScript library that makes WebGL accessible — it provides a scene graph, camera system, lighting, materials, and geometry primitives so you can create 3D graphics in the browser without writing raw shader code. Threlte is Svelte's wrapper around Three.js, letting you build 3D scenes with Svelte components instead of imperative JavaScript. A `<T.Mesh>` component in Threlte compiles to a Three.js mesh with reactive props and automatic cleanup.

## Why I use it

3D on the web is a differentiator — most portfolio sites are flat. Three.js gives me the ability to create immersive scenes that make the site memorable without requiring WebGL expertise from future maintainers. Threlte specifically fits my stack because it's Svelte-native: 3D objects are components with props, they participate in Svelte's reactivity system, and they clean up automatically when unmounted. I combine Threlte with GSAP for animation timing and scroll-linked 3D transitions.

## In Practice

On yesid.dev, Three.js / Threlte powers the hero scene — a 3D visualization that responds to mouse movement and scroll position. The Threlte scene components live in `src/lib/motion/three/`, composing meshes, lights, and cameras as Svelte components. Post-processing effects (bloom, vignette) add cinematic polish, and the entire scene respects `prefers-reduced-motion` by falling back to a static render.
