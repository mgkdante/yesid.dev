import adapter from '@sveltejs/adapter-vercel';
import { projectRunes } from '@yesid/config/svelte/project-runes.js';
import { readFileSync } from 'node:fs';
import { hashThemeScript } from './scripts/csp-script-hash.mjs';

// SvelteKit hashes its bootstrap, but app.html scripts need their own hash.
const template = readFileSync(new URL('./src/app.html', import.meta.url), 'utf8');
const themeScriptHash = hashThemeScript(template);

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
		csp: {
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', themeScriptHash],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'blob:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self', 'https://plausible.io', 'https://api.web3forms.com', 'https://transit.yesid.dev'],
				'manifest-src': ['self'],
				'frame-src': ['none'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'upgrade-insecure-requests': true
			}
		},
		prerender: {
			// '*' keeps the default crawl; the llms files are linked from nowhere,
			// so the crawler needs them as explicit entries.
			entries: ['*', '/llms.txt', '/llms-full.txt']
		}
	}
};

export default config;
