// Scrub factories — scroll-driven motion tied to section scroll progress.
//
// All factories:
//   - Are synchronous. Callers preload any required GSAP plugin before invoking.
//   - Return a destroy function. Components wire `onDestroy(() => destroy?.())`.
//   - Honor prefers-reduced-motion by rendering the target's final state and
//     returning a no-op destroy.

export { createCrescendoScrub, type CrescendoOpts } from './createCrescendoScrub.js';
export { createDrawScrub, type DrawScrubOpts } from './createDrawScrub.js';
