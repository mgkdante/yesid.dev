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
		expected: 31,
	},
	{
		alias: '--tablet-max',
		raw: '(max-width: 767px)',
		rawPattern: /\(max-width:\s*767px\)/g,
		expected: 24,
	},
	{
		alias: '--desktop-min',
		raw: '(min-width: 1024px)',
		rawPattern: /\(min-width:\s*1024px\)/g,
		expected: 40,
	},
	{
		alias: '--desktop-max',
		raw: '(max-width: 1023px)',
		rawPattern: /\(max-width:\s*1023px\)/g,
		expected: 6,
	},
] as const;

const RESPONSIVE_SOURCE_PATHS = [
	'apps/web/src/app.css',
	'apps/web/src/lib/components/about/AboutPage.svelte',
	'apps/web/src/lib/components/blog/BlogDetailHeader.svelte',
	'apps/web/src/lib/components/blog/BlogDetailPage.svelte',
	'apps/web/src/lib/components/blog/BlogEntryRail.svelte',
	'apps/web/src/lib/components/blog/BlogRow.svelte',
	'apps/web/src/lib/components/contact/ContactPage.svelte',
	'apps/web/src/lib/components/home/CloserFloodlight.svelte',
	'apps/web/src/lib/components/home/CloserGraffiti.svelte',
	'apps/web/src/lib/components/home/CloserProps.svelte',
	'apps/web/src/lib/components/home/CloserTerminalBoard.svelte',
	'apps/web/src/lib/components/home/FeaturedProjects.svelte',
	'apps/web/src/lib/components/home/HeroBanner.svelte',
	'apps/web/src/lib/components/home/HeroMetrics.svelte',
	'apps/web/src/lib/components/home/HeroTextContent.svelte',
	'apps/web/src/lib/components/home/HomeAboutTeaser.svelte',
	'apps/web/src/lib/components/home/HomeCloser.svelte',
	'apps/web/src/lib/components/home/HomePage.svelte',
	'apps/web/src/lib/components/home/HomeServices.svelte',
	'apps/web/src/lib/components/home/ManifestoEdgeLeft.svelte',
	'apps/web/src/lib/components/home/ManifestoTransit.svelte',
	'apps/web/src/lib/components/home/ServicesBlueprint.svelte',
	'apps/web/src/lib/components/layout/MenuOverlay.svelte',
	'apps/web/src/lib/components/layout/Nav.svelte',
	'apps/web/src/lib/components/projects/DataFlowDiagram.svelte',
	'apps/web/src/lib/components/projects/ProjectCard.svelte',
	'apps/web/src/lib/components/projects/ProjectDetailHeader.svelte',
	'apps/web/src/lib/components/projects/ProjectDetailPage.svelte',
	'apps/web/src/lib/components/projects/ProjectImageGallery.svelte',
	'apps/web/src/lib/components/services/ProjectsStrip.svelte',
	'apps/web/src/lib/components/services/ServiceCard.svelte',
	'apps/web/src/lib/components/services/ServiceDetailPage.svelte',
	'apps/web/src/lib/components/services/ServiceStackPanel.svelte',
	'apps/web/src/lib/components/services/ServiceSvgPanel.svelte',
	'apps/web/src/lib/components/shared/CtaBand.svelte',
	'apps/web/src/lib/components/shared/CtaBlueprintBackground.svelte',
	'apps/web/src/lib/components/shared/DetailHeaderShell.svelte',
	'apps/web/src/lib/components/stack-engine/BlueprintCanvas.svelte',
	'apps/web/src/lib/components/stack-engine/BuildShapeCard.svelte',
	'apps/web/src/lib/components/stack-engine/Engine.svelte',
	'apps/web/src/lib/styles/listing-header.css',
	'apps/web/src/lib/styles/listing-shell.css',
	'apps/web/src/routes/[[lang=locale]]/blog/+layout.svelte',
	'apps/web/src/routes/[[lang=locale]]/projects/+layout.svelte',
	'apps/web/src/routes/[[lang=locale]]/tech-stack/+page.svelte',
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

function forbiddenTabletMaxConditions(): MediaLine[] {
	const conditionPattern =
		/\(\s*max-width\s*:\s*768px\s*\)|\(\s*width\s*<=\s*768px\s*\)|\(\s*768px\s*>=\s*width\s*\)/g;

	// Scope: apps/web/src only; conditions outside product source are not part of this guard.
	return sourceFiles().flatMap((path) => {
		const source = readFileSync(path, 'utf8');
		return [...source.matchAll(conditionPattern)].map((match) => {
			const index = match.index ?? 0;
			return {
				path: relative(REPO_ROOT, path),
				lineNumber: source.slice(0, index).split('\n').length,
				text: match[0],
			};
		});
	});
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

function featureCount(lines: MediaLine[]): number {
	let count = 0;
	for (const line of lines) {
		const canonical = canonicalize(line.text);
		for (const breakpoint of BREAKPOINTS) {
			count += [...canonical.matchAll(breakpoint.rawPattern)].length;
		}
	}
	return count;
}

describe('canonical responsive breakpoint contract', () => {
	it('preserves the extracted 101-feature, 45-path inventory with design aliases only', () => {
		const lines = mediaLines();
		const canonicalLines = lines.filter((line) =>
			BREAKPOINTS.some(
				({ alias, rawPattern }) =>
					line.text.includes(`(${alias})`) || new RegExp(rawPattern.source).test(line.text),
			),
		);
		const paths = [...new Set(canonicalLines.map(({ path }) => path))].sort();

		expect(canonicalLines).toHaveLength(98);
		expect(paths).toEqual(RESPONSIVE_SOURCE_PATHS);
		expect(featureCount(canonicalLines)).toBe(101);

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

	it('rejects max-width 768px conditions in apps/web/src', () => {
		const offenders = forbiddenTabletMaxConditions();
		expect(
			offenders,
			offenders
				.map(({ path, lineNumber, text }) => `${path}:${lineNumber}:${text}`)
				.join('\n'),
		).toHaveLength(0);
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
