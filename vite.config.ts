import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

// svelteTesting() is a Vite plugin from @testing-library/svelte that:
//   - adds 'browser' to resolve.conditions (makes Svelte use index-client.js)
//   - adds @testing-library/svelte* to ssr.noExternal (forces Vite transform)
// It only activates when process.env.VITEST is set, so it's safe to include always.
export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	test: {
		// Two projects: "data" for pure logic tests (node, fast),
		// "dom" for component/motion tests (happy-dom, full mocks).
		// See docs/superpowers/specs/2026-04-08-testing-optimization-design.md
		projects: [
			{
				extends: true,
				test: {
					name: 'data',
					include: ['src/lib/data/**/*.test.ts', 'src/lib/styles/**/*.test.ts'],
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
