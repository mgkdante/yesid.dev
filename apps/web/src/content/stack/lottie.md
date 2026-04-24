---
id: lottie
name: "Lottie"
layer: frontend
domains: [web-development]
connectsTo: [gsap, svelte-5]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: lottie
proficiency: proficient
---

## What it is

Lottie is a format and player for vector animations exported from After Effects. Designers create animations in After Effects, export them as JSON files using Bodymovin, and Lottie renders them on web, iOS, and Android. The animations are resolution-independent (vector-based), tiny in file size compared to video or GIF, and can be controlled programmatically — play, pause, reverse, seek to a specific frame, or respond to user interaction.

## Why I use it

Lottie bridges the gap between design and development. Instead of recreating complex animations in CSS or JavaScript, I import a JSON file and get pixel-perfect motion that matches the designer's intent. The animations are lightweight (typically 5-20KB), scale to any resolution, and can be synchronized with scroll position or user interaction. I use lottie-web for rendering and coordinate Lottie playback with GSAP timelines when animations need to be part of a larger choreography.

## In Practice

On yesid.dev, Lottie powers the service station icons on the services page — each station has a unique animated icon that plays on reveal and reverses on exit. The LottiePlayer component wraps lottie-web with Svelte lifecycle hooks, lazy loading, and reduced-motion support. Lottie files live in `static/lottie/` and are loaded on demand to keep the initial bundle lean.
