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
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/tests/setup.ts']
	}
});
