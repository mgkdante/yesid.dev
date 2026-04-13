// Disable SSR for the home page.
// GSAP and lottie-web access browser APIs (window, document, WebGL)
// that are not available during server-side rendering.
export const ssr = false;
