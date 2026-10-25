import { loadConfig } from '@sveltejs/load-config';
import type { Config } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';

export async function loadWebConfig() {
	const loaded = await loadConfig(fileURLToPath(new URL('../../vite.config.ts', import.meta.url)));
	if (!loaded) throw new Error('Web configuration was not found');
	if ('error' in loaded) throw loaded.error;
	// load-config exposes framework-neutral types; Kit 3 resolves flat plugin options.
	return loaded.config as Config;
}
