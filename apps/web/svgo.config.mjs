// SVGO config for one-time optimization of static/images/montreal-metro.svg.
//
// MetroNetwork.svelte classifies SVG elements at runtime by literal attribute
// match (stroke === '#E07800', fill === '#E07800', etc.) and animates each
// station path's opacity independently. The default SVGO preset breaks both:
//
//   - convertColors lowercases '#E07800' → '#e07800', defeating the ===
//     match in MetroNetwork.svelte.
//   - mergePaths merges ~87 station paths into one <path>, so stations can
//     no longer be faded in individually by the hero timeline.
//   - cleanupIds is preserved defensively in case any GSAP selector relies
//     on an id (none currently — cheap safety).
//
// Re-run: bunx svgo --config svgo.config.mjs static/images/montreal-metro.svg
export default {
  multipass: true,
  js2svg: {
    pretty: true,
    indent: 2,
  },
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertColors: false,
          mergePaths: false,
          cleanupIds: false,
        },
      },
    },
  ],
};
