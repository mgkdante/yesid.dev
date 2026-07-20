import adapter from '@sveltejs/adapter-vercel';
import { projectRunes } from '@yesid/config/svelte/project-runes.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: projectRunes(import.meta.dirname)
	},
	kit: {
		// Pin to Node 22 LTS. The adapter auto-detects the runtime but Bun ships
		// a newer Node.js ABI that the adapter rejects — explicit runtime avoids this.
		adapter: adapter({ runtime: 'nodejs22.x' }),
		prerender: {
			// '*' keeps the default crawl; the llms files are linked from nowhere,
			// so the crawler needs them as explicit entries.
			entries: ['*', '/llms.txt', '/llms-full.txt']
		}
	}
};

export default config;
