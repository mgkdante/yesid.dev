---
id: gsap
name: "GSAP"
layer: frontend
domains: [web-development]
connectsTo: [svelte-5, threejs-threlte]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: gsap
proficiency: expert
---

## What it is

GSAP (GreenSock Animation Platform) is a professional-grade JavaScript animation library. It animates any numeric property — CSS transforms, SVG attributes, canvas elements, even custom object values — with frame-accurate timing and buttery-smooth 60fps performance. Its plugin ecosystem includes ScrollTrigger for scroll-linked animations, DrawSVGPlugin for animating SVG path drawing, and MotionPathPlugin for moving elements along curves. GSAP is now fully free and open-source with all plugins included.

## Why I use it

CSS animations are fine for hover states and simple transitions, but they fall apart when you need choreographed sequences, scroll-linked timelines, or SVG path animations. GSAP gives me frame-level control with a clean API. I can build a staggered entrance animation, link it to scroll position, reverse it on exit, and respect `prefers-reduced-motion` — all in a few lines of code. The timeline API makes complex multi-element choreography composable and debuggable.

## In Practice

On yesid.dev, GSAP powers every motion element. The tech stack diagram uses DrawSVGPlugin to animate connection lines being drawn between nodes, MotionPathPlugin for data packet dots traveling along those lines, and ScrollTrigger for the entrance sequence where layers boot up bottom-to-top. The services page uses GSAP timelines for station reveal animations, and the home page hero sequence choreographs text, shapes, and SVG elements through a scroll-linked timeline.
