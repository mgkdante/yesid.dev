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

const NONCANONICAL_MEDIA_INVENTORY = [
	{
		path: 'apps/web/src/app.css',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 3,
	},
	{
		path: 'apps/web/src/lib/components/about/AboutLanguages.svelte',
		condition: '(max-width: 499.98px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/about/AboutPage.svelte',
		condition: '(min-width: 500px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/about/AboutTrain.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/about/WeatherScene.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/analytics/AnalyticsConsent.svelte',
		condition: '(min-width: 48rem)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/analytics/AnalyticsConsent.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/blog/BlogDetailPage.svelte',
		condition: '(--desktop-min) and (max-width: 1279px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/HeroBanner.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/HeroTextContent.svelte',
		condition: '(--tablet-max) and (max-height: 660px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/HeroTextContent.svelte',
		condition: '(max-height: 660px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/HeroTextContent.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/HomeAboutTeaser.svelte',
		condition: '(min-width: 640px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/Manifesto.svelte',
		condition: '(max-width: 640px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/Manifesto.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoEdgeBottom.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoEdgeLeft.svelte',
		condition: '(max-width: 640px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoEdgeLeft.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoEdgeRight.svelte',
		condition: '(max-width: 640px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoEdgeRight.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoEdgeTop.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoTransit.svelte',
		condition: '(max-width: 640px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/home/ManifestoTransit.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/LanguageToggle.svelte',
		condition: '(max-width: 359px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/LanguageToggle.svelte',
		condition: '(max-width: 479px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/LanguageToggle.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/Nav.svelte',
		condition: '(max-width: 359px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/Nav.svelte',
		condition: '(max-width: 479px)',
		occurrences: 2,
	},
	{
		path: 'apps/web/src/lib/components/layout/Nav.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/ThemeToggle.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/projects/ProjectCard.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/projects/ProjectHeroPreview.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/projects/ProjectListingPage.svelte',
		condition: '(min-width: 1280px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/shared/CollapsibleSection.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/shared/ErrorIllustration.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/shared/StationTabs.svelte',
		condition: '(min-width: 1280px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/stack-engine/BlueprintCanvas.svelte',
		condition: '(hover: hover)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/stack-engine/BuildShapeCard.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/stack-engine/ProductPreview.svelte',
		condition: '(max-width: 479px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/stack-engine/ShapeBlueprint.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/stack-engine/TechMatcher.svelte',
		condition: '(max-width: 1279px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/stack-engine/TechMatcher.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/routes/[[lang=locale]]/tech-stack/+page.svelte',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
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

function stylesheetBodies(path: string): string[] {
	const source = readFileSync(path, 'utf8');
	if (path.endsWith('.css')) return [source];
	return [...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)].map(
		([, body]) => body!,
	);
}

function normalizeMediaCondition(condition: string): string {
	return condition
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/\(\s+/g, '(')
		.replace(/\s+\)/g, ')')
		.replace(/\s*:\s*/g, ': ');
}

function isCanonicalAliasCondition(condition: string): boolean {
	return condition
		.split(/\s+and\s+/)
		.every((feature) => /^\(--(?:tablet|desktop)-(?:min|max)\)$/.test(feature));
}

function isNoncanonicalResponsiveCondition(condition: string): boolean {
	if (isCanonicalAliasCondition(condition)) return false;
	return /(?:min|max)-(?:width|height)|(?:any-)?(?:hover|pointer):|prefers-reduced-motion:/.test(
		condition,
	);
}

function compareText(left: string, right: string): number {
	return left === right ? 0 : left < right ? -1 : 1;
}

function noncanonicalMediaInventory() {
	const counts = new Map<string, { path: string; condition: string; occurrences: number }>();
	for (const path of sourceFiles()) {
		const repoPath = relative(REPO_ROOT, path);
		for (const body of stylesheetBodies(path)) {
			const withoutComments = body.replace(/\/\*[\s\S]*?\*\//g, '');
			for (const [, rawCondition] of withoutComments.matchAll(/@media\s+([^{}]+?)\s*\{/g)) {
				const condition = normalizeMediaCondition(rawCondition!);
				if (!isNoncanonicalResponsiveCondition(condition)) continue;
				const key = `${repoPath}\0${condition}`;
				const current = counts.get(key);
				counts.set(key, {
					path: repoPath,
					condition,
					occurrences: (current?.occurrences ?? 0) + 1,
				});
			}
		}
	}
	return [...counts.values()].sort(
		(left, right) =>
			compareText(left.path, right.path) || compareText(left.condition, right.condition),
	);
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

	it('preserves every noncanonical viewport, capability, and reduced-motion condition semantically', () => {
		expect(noncanonicalMediaInventory()).toEqual(NONCANONICAL_MEDIA_INVENTORY);
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

	it('preserves representative noncanonical layout and motion behavior through PostCSS', async () => {
		const config = await resolveConfig(
			{ root: process.cwd(), configFile: VITE_CONFIG, logLevel: 'silent' },
			'serve',
			'test',
		);
		const cases = [
			{
				path: 'apps/web/src/lib/components/analytics/AnalyticsConsent.svelte',
				condition: '(min-width: 48rem)',
				expected: [
					'.consent-layout',
					'grid-template-columns: minmax(0, 1fr) auto',
					'.consent-actions',
					'width: auto',
				],
			},
			{
				path: 'apps/web/src/lib/components/stack-engine/ProductPreview.svelte',
				condition: '(max-width: 479px)',
				expected: ['.slot-role', 'display: none', 'width: 12px', 'height: 12px'],
			},
			{
				path: 'apps/web/src/lib/components/projects/ProjectListingPage.svelte',
				condition: '(min-width: 1280px)',
				expected: ['.project-grid', 'grid-template-columns: 1fr 1fr'],
			},
			{
				path: 'apps/web/src/lib/components/analytics/AnalyticsConsent.svelte',
				condition: '(prefers-reduced-motion: reduce)',
				expected: ['.analytics-consent', 'animation: none'],
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
