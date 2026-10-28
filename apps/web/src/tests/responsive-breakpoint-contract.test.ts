import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { preprocessCSS, resolveConfig, type ResolvedConfig } from 'vite';

const REPO_ROOT = resolve(process.cwd(), '../..');
const SRC_ROOT = resolve(process.cwd(), 'src');
const VITE_CONFIG = resolve(process.cwd(), 'vite.config.ts');
// Cold Vite config + plugin graph load: ~1.1s idle, ~3.5s under the full parallel suite.
const VITE_CONFIG_SETUP_TIMEOUT_MS = 20_000;

const BREAKPOINTS = [
	{
		alias: '--tablet-min',
		raw: '(min-width: 768px)',
		rawPattern: /\(\s*(?:min-width\s*:\s*768px|width\s*>=\s*768px|768px\s*<=\s*width)\s*\)/,
	},
	{
		alias: '--tablet-max',
		raw: '(max-width: 767px)',
		rawPattern: /\(\s*(?:max-width\s*:\s*767px|width\s*<=\s*767px|767px\s*>=\s*width)\s*\)/,
	},
	{
		alias: '--desktop-min',
		raw: '(min-width: 1024px)',
		rawPattern: /\(\s*(?:min-width\s*:\s*1024px|width\s*>=\s*1024px|1024px\s*<=\s*width)\s*\)/,
	},
	{
		alias: '--desktop-max',
		raw: '(max-width: 1023px)',
		rawPattern: /\(\s*(?:max-width\s*:\s*1023px|width\s*<=\s*1023px|1023px\s*>=\s*width)\s*\)/,
	},
] as const;

interface MediaLine {
	path: string;
	lineNumber: number;
	text: string;
}

function sourceFiles(directory = SRC_ROOT, files: string[] = []): string[] {
	for (const entry of readdirSync(directory).sort()) {
		const path = join(directory, entry);
		if (statSync(path).isDirectory()) sourceFiles(path, files);
		else if (/\.(?:css|svelte)$/.test(path)) files.push(path);
	}
	return files;
}

function stylesheetBodies(path: string): string[] {
	const source = readFileSync(path, 'utf8');
	if (path.endsWith('.css')) return [source];
	return [...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)].map(([, body]) => body!);
}

function mediaBlock(css: string, condition: string): string {
	const start = css.indexOf(`@media ${condition}`);
	if (start === -1) throw new Error(`Missing media condition: ${condition}`);
	const openingBrace = css.indexOf('{', start);
	let depth = 0;
	for (let index = openingBrace; index < css.length; index += 1) {
		if (css[index] === '{') depth += 1;
		if (css[index] === '}') depth -= 1;
		if (depth === 0) return css.slice(start, index + 1);
	}
	throw new Error(`Unclosed media condition: ${condition}`);
}

function forbiddenTabletMaxConditions(): MediaLine[] {
	const conditionPattern =
		/\(\s*max-width\s*:\s*768px\s*\)|\(\s*width\s*<=\s*768px\s*\)|\(\s*768px\s*>=\s*width\s*\)/g;

	// Scope: apps/web/src only; conditions outside product source are not part of this guard.
	return sourceFiles().flatMap((path) => {
		const source = readFileSync(path, 'utf8');
		return [...source.matchAll(conditionPattern)].map((match) => {
			const index = match.index ?? 0;
			return {
				path: relative(REPO_ROOT, path).replaceAll('\\', '/'),
				lineNumber: source.slice(0, index).split('\n').length,
				text: match[0],
			};
		});
	});
}

describe('canonical responsive breakpoint contract', () => {
	let config: ResolvedConfig;

	beforeAll(async () => {
		config = await resolveConfig(
			{ root: process.cwd(), configFile: VITE_CONFIG, logLevel: 'silent' },
			'serve',
			'test',
		);
	}, VITE_CONFIG_SETUP_TIMEOUT_MS);

	it('uses design aliases for canonical breakpoints in product stylesheets', () => {
		const offenders: string[] = [];
		for (const path of sourceFiles()) {
			for (const body of stylesheetBodies(path)) {
				const withoutComments = body.replace(/\/\*[\s\S]*?\*\//g, '');
				for (const [, rawCondition] of withoutComments.matchAll(/@media\s+([^{}]+?)\s*\{/g)) {
					for (const breakpoint of BREAKPOINTS) {
						if (breakpoint.rawPattern.test(rawCondition!)) {
							offenders.push(`${relative(REPO_ROOT, path).replaceAll('\\', '/')}: use (${breakpoint.alias}) instead of ${breakpoint.raw}`);
						}
					}
				}
			}
		}
		expect(offenders, offenders.join('\n')).toEqual([]);
	});

	it('rejects max-width 768px conditions in apps/web/src', () => {
		const offenders = forbiddenTabletMaxConditions();
		expect(
			offenders,
			offenders.map(({ path, lineNumber, text }) => `${path}:${lineNumber}:${text}`).join('\n'),
		).toHaveLength(0);
	});

	it('loads the vendored definitions before removing aliases in Vite PostCSS', async () => {
		const fixture = BREAKPOINTS.map(
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

		expect(conditions).toEqual([
			'(min-width: 768px)',
			'(max-width: 767px)',
			'(min-width: 1024px)',
			'(max-width: 1023px)',
			'(min-width: 768px) and (max-width: 1023px)',
		]);
		expect(result.code).not.toContain('@custom-media');
		expect(result.code).not.toMatch(/\(--(?:tablet|desktop)-(?:min|max)\)/);
	});

	it('preserves representative noncanonical layout and motion behavior through PostCSS', async () => {
		const cases = [
			{
				path: 'apps/web/src/lib/components/projects/ProjectListingPage.svelte',
				condition: '(min-width: 1280px)',
				expected: ['.project-grid', 'grid-template-columns: 1fr 1fr'],
			},
		] as const;

		for (const sample of cases) {
			const absolutePath = resolve(REPO_ROOT, sample.path);
			const result = await preprocessCSS(
				stylesheetBodies(absolutePath).join('\n'),
				`${absolutePath}?type=style&lang.css`,
				config,
			);
			const block = mediaBlock(result.code, sample.condition);
			for (const behavior of sample.expected) expect(block).toContain(behavior);
		}
	});

});
