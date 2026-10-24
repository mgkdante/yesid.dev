import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'src');
const CONTENT = join(SRC, 'lib/content');
const LIVE = join(SRC, 'lib/live');
const THIS_TEST = join(SRC, 'tests/live-domain-boundary.test.ts');

const LIVE_SYMBOLS = new Set([
	'HeroData',
	'HeroMetric',
	'HeroQueryRow',
	'INITIAL_HERO_DATA',
	'LIVE_KPIS_URL',
	'LIVE_POLL_MS',
	'LiveHeroSnapshot',
	'STM_ROUTES',
	'fetchLiveKpis',
	'generateHeroData',
	'mapLiveKpis',
	'startLiveKpiPolling',
]);

function sourceFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		if (path === THIS_TEST || !/\.(?:svelte|ts)$/.test(entry.name)) return [];
		return [path];
	});
}

function importedNames(specifiers: string): string[] {
	return specifiers
		.split(',')
		.map((specifier) => specifier.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0])
		.filter(Boolean);
}

describe('$lib/live domain boundary', () => {
	it('owns the hero demo and live KPI modules outside generated content', () => {
		const staleContentModules = ['hero-data.ts', 'hero-data.test.ts', 'live-kpis.ts', 'live-kpis.test.ts']
			.map((name) => join(CONTENT, name))
			.filter(existsSync)
			.map((path) => relative(SRC, path));
		const missingLiveModules = ['hero-data.ts', 'hero-data.test.ts', 'live-kpis.ts', 'live-kpis.test.ts']
			.map((name) => join(LIVE, name))
			.filter((path) => !existsSync(path))
			.map((path) => relative(SRC, path));

		expect({ staleContentModules, missingLiveModules }).toEqual({
			staleContentModules: [],
			missingLiveModules: [],
		});
	});

	it('exposes live modules only through the live authority', () => {
		const liveIndexPath = join(LIVE, 'index.ts');
		expect(existsSync(liveIndexPath), 'lib/live/index.ts must exist').toBe(true);

		const liveIndex = readFileSync(liveIndexPath, 'utf8');
		const contentIndex = readFileSync(join(CONTENT, 'index.ts'), 'utf8');
		expect(liveIndex).toMatch(/export \* from ['"]\.\/hero-data['"]/);
		expect(liveIndex).toMatch(/export \* from ['"]\.\/live-kpis['"]/);
		expect(contentIndex).not.toMatch(/export \* from ['"]\.\/(?:hero-data|live-kpis)['"]/);
		expect(contentIndex).not.toMatch(/['"](?:\$lib\/live|\.\.\/live)(?:\/[^'"]*)?['"]/);
	});

	it('keeps every live symbol consumer off the content boundary', () => {
		const violations = sourceFiles(SRC).flatMap((path) => {
			const source = readFileSync(path, 'utf8');
			const reasons: string[] = [];
			if (/from\s+['"]\$lib\/content\/(?:hero-data|live-kpis)(?:\.js)?['"]/.test(source)) {
				reasons.push('imports a removed content subpath');
			}

			for (const match of source.matchAll(
				/import\s+(?:type\s+)?\{([^{}]*)\}\s+from\s+['"]\$lib\/content['"]/g,
			)) {
				const names = importedNames(match[1]).filter((name) => LIVE_SYMBOLS.has(name));
				if (names.length > 0) reasons.push(`imports live symbols from content: ${names.join(', ')}`);
			}

			return reasons.map((reason) => `${relative(SRC, path)}: ${reason}`);
		});

		expect(violations).toEqual([]);
	});

	it('keeps live-domain unit tests in the data project', () => {
		const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');
		const dataProject = config.match(/name:\s*['"]data['"]([\s\S]*?)name:\s*['"]dom['"]/)?.[1];
		expect(dataProject, 'data Vitest project must exist').toBeDefined();
		expect(dataProject).toContain("'src/lib/live/**/*.test.ts'");
	});
});
