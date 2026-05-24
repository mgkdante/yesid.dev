import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { visualizer } from 'rollup-plugin-visualizer';

// svelteTesting() is a Vite plugin from @testing-library/svelte that:
//   - adds 'browser' to resolve.conditions (makes Svelte use index-client.js)
//   - adds @testing-library/svelte* to ssr.noExternal (forces Vite transform)
// It only activates when process.env.VITEST is set, so it's safe to include always.
export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		svelteTesting(),
		// Bundle size visualizer — emits dist/stats.html on production build.
		// Opened via `bun run bundle-size` (see package.json).
		// Dev + test unaffected (plugin runs only on build).
		visualizer({
			filename: 'dist/stats.html',
			gzipSize: true,
			brotliSize: true,
			template: 'treemap',
			open: false,
		}),
	],
	ssr: {
		// bits-ui ships .svelte files in dist/ — Vite SSR must process them
		// through the Svelte compiler instead of treating as native ESM.
		// gsap (+ plugins like Flip) ship CJS that breaks Node ESM SSR with
		// "Named export not found" / "Cannot use import statement outside a
		// module" — force Vite to bundle them so interop is resolved at build
		// time. Verified fix for /blog + /projects 500 on yesid-dev.vercel.app.
		//
		// slice-23: embla-carousel-wheel-gestures was left as a bare
		// side-effect `import "embla-carousel-wheel-gestures"` in the SSR
		// bundle (Rollup can't prove it's side-effect-free). The package's
		// "exports.import" points to a .js file with ESM `import` syntax but
		// no `"type":"module"` in its package.json, so Vercel's Node runtime
		// parses it as CJS and throws "Cannot use import statement outside a
		// module" on `/`. Inline it (+ siblings) at SSR build time to avoid
		// the runtime resolution mismatch.
		noExternal: [
			'bits-ui',
			'gsap',
			'embla-carousel',
			'embla-carousel-svelte',
			'embla-carousel-wheel-gestures',
			'embla-carousel-reactive-utils',
			'wheel-gestures',
		],
	},
	test: {
		// Two projects: "data" for pure logic tests (node, fast),
		// "dom" for component/motion tests (happy-dom, full mocks).
		// See docs/superpowers/specs/2026-04-08-testing-optimization-design.md
		projects: [
			{
				extends: true,
				test: {
					name: 'data',
					include: [
						'src/lib/adapters/**/*.test.ts',
						'src/lib/content/**/*.test.ts',
						'src/lib/directus/**/*.test.ts',
						'src/lib/repositories/**/*.test.ts',
						'src/lib/schemas/**/*.test.ts',
						'src/lib/utils/**/*.test.ts',
						'src/lib/styles/**/*.test.ts',
						'src/params/**/*.test.ts',
						'src/tests/**/*.test.ts',
					],
					// slice-17f L3+L4: utils/ tests use @testing-library/svelte render()
					// which requires a DOM. Route them to the `dom` project instead.
					exclude: ['src/tests/utils/**/*.test.ts'],
					environment: 'node',
					globals: true,
					pool: 'threads',
					setupFiles: ['./src/tests/setup.data.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'dom',
					include: [
						'src/lib/components/**/*.test.ts',
						'src/lib/motion/**/*.test.ts',
						'src/routes/**/*.test.ts',
						// slice-17f L3+L4: tests/utils/ houses render fixtures + DOM
						// assertion helpers. happy-dom env required.
						'src/tests/utils/**/*.test.ts',
					],
					environment: 'happy-dom',
					globals: true,
					pool: 'threads',
					setupFiles: ['./src/tests/setup.dom.ts'],
				},
			},
		],
	},
});
