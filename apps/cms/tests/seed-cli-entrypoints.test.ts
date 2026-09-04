import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CMS_ROOT = join(import.meta.dir, '..');
const BUN = Bun.which('bun') ?? 'bun';
const ASSET_MAP_PATH = join(CMS_ROOT, 'fixtures', 'assets-id-map.json');

const OFFLINE_ENTRYPOINTS = [
	'seed-blog-posts.ts',
	'seed-icons.ts',
	'seed-illustrations.ts',
	'seed-pages-and-blocks.ts',
	'seed-projects.ts',
	'seed-route-seo.ts',
	'seed-services.ts',
	'seed-tech-stack.ts',
	'seed-brand-assets.ts',
	'seed-presets.ts',
	'seed-site-meta.ts',
] as const;

const RESET_CAPABLE_ENTRYPOINTS = [
	'seed-blog-posts.ts',
	'seed-icons.ts',
	'seed-illustrations.ts',
	'seed-pages-and-blocks.ts',
	'seed-projects.ts',
	'seed-route-seo.ts',
	'seed-services.ts',
	'seed-tech-stack.ts',
] as const;

const NO_OPTIONAL_CAPABILITY_ENTRYPOINTS = [
	'seed-brand-assets.ts',
	'seed-presets.ts',
	'seed-site-meta.ts',
] as const;

interface CliResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

async function runSeedCli(
	entrypoint: string,
	args: readonly string[] = [],
	url = 'https://cms.dev.yesid.dev:1',
): Promise<CliResult> {
	const child = Bun.spawn({
		cmd: [BUN, join(CMS_ROOT, 'scripts', entrypoint), ...args],
		cwd: CMS_ROOT,
		env: {
			PATH: process.env.PATH ?? '',
			PUBLIC_DIRECTUS_URL: url,
			NO_COLOR: '1',
		},
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	return { exitCode, stdout, stderr };
}

describe('seed CLI entrypoints', () => {
	it('defaults every offline entrypoint to a credential-free, mutation-free preview', async () => {
		const assetMapBefore = readFileSync(ASSET_MAP_PATH, 'utf8');
		const results = await Promise.all(
			OFFLINE_ENTRYPOINTS.map(async (entrypoint) => ({
				entrypoint,
				result: await runSeedCli(entrypoint),
			})),
		);

		for (const { entrypoint, result } of results) {
			const output = `${result.stdout}\n${result.stderr}`;
			expect({
				entrypoint,
				exitCode: result.exitCode,
				describesMode: output.includes('mode: dry-run'),
				describesBoundary: output.includes('no mutations'),
				requestedCredentials: output.includes('Need DIRECTUS_ADMIN_TOKEN'),
				reachedNetwork: /fetch failed|ECONN|Connection refused/i.test(output),
			}).toEqual({
				entrypoint,
				exitCode: 0,
				describesMode: true,
				describesBoundary: true,
				requestedCredentials: false,
				reachedNetwork: false,
			});
		}
		expect(readFileSync(ASSET_MAP_PATH, 'utf8')).toBe(assetMapBefore);
	}, 30_000);

	it('declares reset only on destructive collection entrypoints', async () => {
		const results = await Promise.all(
			RESET_CAPABLE_ENTRYPOINTS.map(async (entrypoint) => ({
				entrypoint,
				result: await runSeedCli(entrypoint, ['--reset']),
			})),
		);

		for (const { entrypoint, result } of results) {
			expect({
				entrypoint,
				exitCode: result.exitCode,
				error: result.stderr.includes('--reset requires --apply'),
			}).toEqual({ entrypoint, exitCode: 1, error: true });
		}
	});

	it('rejects reset on entrypoints without destructive reset behavior', async () => {
		const results = await Promise.all(
			NO_OPTIONAL_CAPABILITY_ENTRYPOINTS.map(async (entrypoint) => ({
				entrypoint,
				result: await runSeedCli(entrypoint, ['--reset']),
			})),
		);

		for (const { entrypoint, result } of results) {
			expect({
				entrypoint,
				exitCode: result.exitCode,
				error: result.stderr.includes('--reset is not supported by this script'),
			}).toEqual({ entrypoint, exitCode: 1, error: true });
		}
	});

	it('prints pages help before environment checks and names both write modes', async () => {
		const result = await runSeedCli(
			'seed-pages-and-blocks.ts',
			['--help'],
			'https://cms.yesid.dev',
		);

		expect({
			exitCode: result.exitCode,
			preview: result.stdout.includes('preview; no mutations'),
			apply: result.stdout.includes('--apply'),
			reset: result.stdout.includes(
				'--apply --reset --confirm-reset=RESET-SEED-DATA',
			),
			environmentFailure: result.stderr.includes('Refusing non-dev CMS'),
		}).toEqual({
			exitCode: 0,
			preview: true,
			apply: true,
			reset: true,
			environmentFailure: false,
		});
	});

	it('allows pages verbose previews but rejects help combined with mutation', async () => {
		const [verbose, combinedHelp] = await Promise.all([
			runSeedCli('seed-pages-and-blocks.ts', ['--verbose']),
			runSeedCli('seed-pages-and-blocks.ts', ['--help', '--apply']),
		]);

		expect({
			verboseExit: verbose.exitCode,
			verbosePreview: verbose.stdout.includes('mode: dry-run'),
			combinedExit: combinedHelp.exitCode,
			combinedError: combinedHelp.stderr.includes('help must be used alone'),
		}).toEqual({
			verboseExit: 0,
			verbosePreview: true,
			combinedExit: 1,
			combinedError: true,
		});
	});

	it('rejects help on entrypoints that do not expose help', async () => {
		const result = await runSeedCli('seed-site-meta.ts', ['--help']);
		expect({
			exitCode: result.exitCode,
			error: result.stderr.includes('--help is not supported by this script'),
		}).toEqual({ exitCode: 1, error: true });
	});
});
