import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { preprocessCSS, resolveConfig, type ResolvedConfig } from 'vite';

const VITE_CONFIG = resolve(process.cwd(), 'vite.config.ts');
// Cold Vite config + plugin graph load: ~1.1s idle, ~3.5s under the full parallel suite.
const VITE_CONFIG_SETUP_TIMEOUT_MS = 20_000;

describe('canonical responsive breakpoint contract', () => {
	let config: ResolvedConfig;

	beforeAll(async () => {
		config = await resolveConfig(
			{ root: process.cwd(), configFile: VITE_CONFIG, logLevel: 'silent' },
			'serve',
			'test',
		);
	}, VITE_CONFIG_SETUP_TIMEOUT_MS);

	it('loads the vendored definitions before removing aliases in Vite PostCSS', async () => {
		const definitions = [...readFileSync(new URL(import.meta.resolve('@yesid/tokens/tokens.css')), 'utf8').matchAll(/@custom-media\s+(--(?:tablet|desktop)-(?:min|max))\s+([^;]+);/g)].map(([, alias, condition]) => ({ alias: alias!, condition: condition!.trim() }));
		const fixture = definitions.map(
			({ alias }) => `@media (${alias}) { .${alias.slice(2)} { display: block; } }`,
		).concat('@media (--tablet-min) and (--desktop-max) { .tablet-only { display: block; } }');
		const result = await preprocessCSS(
			fixture.join('\n'),
			resolve(process.cwd(), 'src/__fixtures__/BreakpointContract.svelte?type=style&lang.css'),
			config,
		);
		const conditions = [...result.code.matchAll(/@media\s+([^\{]+)\s*\{/g)].map(([, condition]) =>
			condition!.trim(),
		);

		expect(conditions).toEqual([...definitions.map(({ condition }) => condition), `${definitions.find(({ alias }) => alias === '--tablet-min')!.condition} and ${definitions.find(({ alias }) => alias === '--desktop-max')!.condition}`]);
		expect(result.code).not.toContain('@custom-media');
		expect(result.code).not.toMatch(/\(--(?:tablet|desktop)-(?:min|max)\)/);
	});

});
