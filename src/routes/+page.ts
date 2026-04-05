// Disable SSR for the home page.
// Three.js, Threlte, GSAP, and lottie-web access browser APIs (window, document, WebGL)
// that are not available during server-side rendering.
// The /preview route already uses this same pattern.
export const ssr = false;
