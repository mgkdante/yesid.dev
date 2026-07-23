import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { preprocessCSS, resolveConfig } from 'vite';

const REPO_ROOT = resolve(process.cwd(), '../..');
const SRC_ROOT = resolve(process.cwd(), 'src');
const VITE_CONFIG = resolve(process.cwd(), 'vite.config.ts');

const BREAKPOINTS = [
	{
		alias: '--tablet-min',
		raw: '(min-width: 768px)',
		rawPattern: /\(min-width:\s*768px\)/g,
		expected: 30,
	},
	{
		alias: '--tablet-max',
		raw: '(max-width: 767px)',
		rawPattern: /\(max-width:\s*767px\)/g,
		expected: 17,
	},
	{
		alias: '--desktop-min',
		raw: '(min-width: 1024px)',
		rawPattern: /\(min-width:\s*1024px\)/g,
		expected: 43,
	},
	{
		alias: '--desktop-max',
		raw: '(max-width: 1023px)',
		rawPattern: /\(max-width:\s*1023px\)/g,
		expected: 4,
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

function mediaLines(): MediaLine[] {
	return sourceFiles().flatMap((path) =>
		readFileSync(path, 'utf8')
			.split('\n')
			.flatMap((text, index) =>
				/@media\s+/.test(text)
					? [{ path: relative(REPO_ROOT, path), lineNumber: index + 1, text }]
					: [],
			),
	);
}

function digest(records: string[]): string {
	return createHash('sha256')
		.update(`${[...records].sort().join('\n')}\n`)
		.digest('hex');
}

function canonicalize(line: string): string {
	let result = line;
	for (const breakpoint of BREAKPOINTS) {
		result = result
			.replaceAll(`(${breakpoint.alias})`, breakpoint.raw)
			.replace(breakpoint.rawPattern, breakpoint.raw);
	}
	return result;
}

function featureRecords(lines: MediaLine[]): string[] {
	const records: string[] = [];
	for (const line of lines) {
		const canonical = canonicalize(line.text);
		for (const breakpoint of BREAKPOINTS) {
			for (const match of canonical.matchAll(breakpoint.rawPattern)) {
				records.push(`${line.path}:${line.lineNumber}:${match[0]}`);
			}
		}
	}
	return records;
}

describe('canonical responsive breakpoint contract', () => {
	it('migrates the frozen 94-feature, 39-path inventory to design aliases only', () => {
		const lines = mediaLines();
		const canonicalLines = lines.filter((line) =>
			BREAKPOINTS.some(
				({ alias, rawPattern }) =>
					line.text.includes(`(${alias})`) || new RegExp(rawPattern.source).test(line.text),
			),
		);
		const paths = new Set(canonicalLines.map(({ path }) => path));

		expect(canonicalLines).toHaveLength(93);
		expect(paths.size).toBe(39);
		expect(featureRecords(canonicalLines)).toHaveLength(94);

		for (const breakpoint of BREAKPOINTS) {
			const aliasPattern = new RegExp(`\\(${breakpoint.alias}\\)`, 'g');
			const aliasCount = canonicalLines.reduce(
				(total, { text }) => total + [...text.matchAll(aliasPattern)].length,
				0,
			);
			const rawCount = lines.reduce(
				(total, { text }) => total + [...text.matchAll(breakpoint.rawPattern)].length,
				0,
			);
			expect(aliasCount, breakpoint.alias).toBe(breakpoint.expected);
			expect(rawCount, breakpoint.raw).toBe(0);
		}
	});

	it('preserves every frozen media line and noncanonical conjunct byte-for-byte', () => {
		const normalized = mediaLines().map(
			({ path, lineNumber, text }) => `${path}:${lineNumber}:${canonicalize(text)}`,
		);
		const frozenFeatures = featureRecords(mediaLines());

		expect(normalized).toHaveLength(146);
		expect(digest(normalized)).toBe(
			'394130b240b47a2f8feecc3337328afa9d45f07d5ea3bea551da1dedd54a34aa',
		);
		expect(digest(frozenFeatures)).toBe(
			'3b0160ba68e4d6f6d50edac4cfb34d4caa7b957f013aab0bce8437593342b595',
		);
	});

	it('keeps the six D1(b) max-width 768px lines outside this migration', () => {
		const excluded = mediaLines()
			.filter(({ text }) => /\(max-width:\s*768px\)/.test(text))
			.map(({ path, lineNumber, text }) => `${path}:${lineNumber}:${text}`);

		expect(excluded).toHaveLength(6);
		expect(digest(excluded)).toBe(
			'5b2d58b961b8e37eda49b92487e7dfc28b93e24cc5a46f8dd873a10d2c3d5e85',
		);
	});

	it('loads the vendored definitions before removing aliases in Vite PostCSS', async () => {
		const config = await resolveConfig(
			{ root: process.cwd(), configFile: VITE_CONFIG, logLevel: 'silent' },
			'serve',
			'test',
		);
		const fixture = BREAKPOINTS.map(
			({ alias }) => `@media (${alias}) { .${alias.slice(2)} { display: block; } }`,
		).concat(
			'@media (--tablet-min) and (--desktop-max) { .tablet-only { display: block; } }',
		);
		const result = await preprocessCSS(
			fixture.join('\n'),
			resolve(process.cwd(), 'src/__fixtures__/BreakpointContract.svelte?type=style&lang.css'),
			config,
		);
		const conditions = [...result.code.matchAll(/@media\s+([^\{]+)\s*\{/g)].map(
			([, condition]) => condition!.trim(),
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

	it('keeps the PostCSS dependency and absolute Vite wiring explicit', () => {
		const packageJson = JSON.parse(
			readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
		) as { devDependencies: Record<string, string> };
		const config = readFileSync(VITE_CONFIG, 'utf8');
		const globalDataIndex = config.indexOf('globalData({');
		const customMediaIndex = config.indexOf('customMedia({ preserve: false })');

		expect(packageJson.devDependencies['@csstools/postcss-global-data']).toBe('4.0.0');
		expect(packageJson.devDependencies['postcss-custom-media']).toBe('12.0.1');
		expect(config).toContain(
			"fileURLToPath(new URL('./vendor/design/tokens/tokens.css', import.meta.url))",
		);
		expect(globalDataIndex).toBeGreaterThan(-1);
		expect(customMediaIndex).toBeGreaterThan(globalDataIndex);
		expect(config.slice(globalDataIndex, customMediaIndex)).toContain(
			'files: [designTokensCss]',
		);
	});
});
