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

const NONCANONICAL_MEDIA_INVENTORY = [
	{
		path: 'apps/web/src/app.css',
		condition: '(max-width: 479px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/app.css',
		condition: '(min-width: 1440px) and (min-height: 800px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/app.css',
		condition: '(prefers-reduced-motion: reduce)',
		occurrences: 1,
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
		path: 'apps/web/src/lib/components/home/HeroDotAnnotation.svelte',
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
		condition: '(max-height: 720px) and (--tablet-min)',
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
		path: 'apps/web/src/lib/components/layout/MenuOverlay.svelte',
		condition: '(max-height: 720px)',
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/MenuOverlay.svelte',
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
		occurrences: 1,
	},
	{
		path: 'apps/web/src/lib/components/layout/Nav.svelte',
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
		path: 'apps/web/src/lib/components/shared/DetailHeaderShell.svelte',
		condition: '(max-height: 720px)',
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
		const repoPath = relative(REPO_ROOT, path).replaceAll('\\', '/');
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

	it('preserves every noncanonical viewport, capability, and reduced-motion condition semantically', () => {
		expect(noncanonicalMediaInventory()).toEqual(NONCANONICAL_MEDIA_INVENTORY);
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

});
