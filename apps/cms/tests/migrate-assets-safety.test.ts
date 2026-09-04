import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
	MIGRATE_ASSETS_RESET_CONFIRMATION,
	parseMigrateAssetArgs,
} from '../scripts/migrate-assets';

const REPO_ROOT = resolve(import.meta.dir, '..', '..', '..');
const AUTHORITATIVE_MAP = resolve(
	REPO_ROOT,
	'apps/cms/fixtures/assets-id-map.json',
);
const SHARED_MAP = resolve(
	REPO_ROOT,
	'packages/shared/fixtures/assets-id-map.json',
);

describe('parseMigrateAssetArgs', () => {
	it('defaults an empty command to a non-mutating preview', () => {
		expect(parseMigrateAssetArgs([])).toEqual({
			sourceRoot: undefined,
			dryRun: true,
			reset: false,
			preserveIdsFromMap: false,
		});
	});

	it('requires --apply to select mutation mode', () => {
		expect(parseMigrateAssetArgs(['--apply'])).toEqual({
			sourceRoot: undefined,
			dryRun: false,
			reset: false,
			preserveIdsFromMap: false,
		});
	});

	it('accepts the exact confirmed destructive reset command', () => {
		expect(
			parseMigrateAssetArgs([
				'--source',
				'/tmp/assets',
				'--preserve-ids-from-map',
				'--apply',
				'--reset',
				'--confirm-reset=RESET-MIGRATED-ASSETS',
			]),
		).toEqual({
			sourceRoot: '/tmp/assets',
			dryRun: false,
			reset: true,
			preserveIdsFromMap: true,
		});
	});

	it('exports the reset confirmation required by operators', () => {
		expect(MIGRATE_ASSETS_RESET_CONFIRMATION).toBe('RESET-MIGRATED-ASSETS');
	});

	const invalidCases: readonly {
		name: string;
		argv: readonly string[];
		error: string;
	}[] = [
		{
			name: 'conflicting apply and dry-run modes',
			argv: ['--apply', '--dry-run'],
			error: 'Choose exactly one mode: --apply or --dry-run.',
		},
		{
			name: 'an unknown flag',
			argv: ['--unknown-value'],
			error: 'Unsupported migrate-assets argument.',
		},
		{
			name: 'a positional value',
			argv: ['/tmp/assets'],
			error: 'Unsupported migrate-assets argument.',
		},
		{
			name: 'a bare option separator',
			argv: ['--'],
			error: 'Unsupported migrate-assets argument.',
		},
		{
			name: 'a missing --source value',
			argv: ['--source'],
			error: '--source requires one non-empty, non-option value.',
		},
		{
			name: 'a known option as the --source value',
			argv: ['--source', '--dry-run', '--apply'],
			error: '--source requires one non-empty, non-option value.',
		},
		{
			name: 'an unknown option as the --source value',
			argv: ['--source', '--unknown'],
			error: '--source requires one non-empty, non-option value.',
		},
		{
			name: 'an empty --source value',
			argv: ['--source', ''],
			error: '--source requires one non-empty, non-option value.',
		},
		{
			name: 'duplicate --source flags',
			argv: ['--source', '/tmp/one', '--source', '/tmp/two'],
			error: '--source may only be specified once.',
		},
		{
			name: 'duplicate --apply flags',
			argv: ['--apply', '--apply'],
			error: '--apply may only be specified once.',
		},
		{
			name: 'duplicate --dry-run flags',
			argv: ['--dry-run', '--dry-run'],
			error: '--dry-run may only be specified once.',
		},
		{
			name: 'duplicate --reset flags',
			argv: [
				'--apply',
				'--reset',
				'--reset',
				'--confirm-reset=RESET-MIGRATED-ASSETS',
			],
			error: '--reset may only be specified once.',
		},
		{
			name: 'duplicate --preserve-ids-from-map flags',
			argv: ['--preserve-ids-from-map', '--preserve-ids-from-map'],
			error: '--preserve-ids-from-map may only be specified once.',
		},
		{
			name: 'duplicate reset confirmations',
			argv: [
				'--apply',
				'--reset',
				'--confirm-reset=RESET-MIGRATED-ASSETS',
				'--confirm-reset=RESET-MIGRATED-ASSETS',
			],
			error: '--confirm-reset may only be specified once.',
		},
		{
			name: 'reset without apply mode',
			argv: ['--reset', '--confirm-reset=RESET-MIGRATED-ASSETS'],
			error: '--reset requires --apply.',
		},
		{
			name: 'reset without confirmation',
			argv: ['--apply', '--reset'],
			error: '--reset requires its exact confirmation.',
		},
		{
			name: 'reset with the wrong confirmation',
			argv: ['--apply', '--reset', '--confirm-reset=not-the-confirmation'],
			error: 'Reset confirmation is invalid.',
		},
		{
			name: 'confirmation without reset',
			argv: ['--confirm-reset=RESET-MIGRATED-ASSETS'],
			error: '--confirm-reset requires --reset.',
		},
		{
			name: 'the --help flag',
			argv: ['--help'],
			error: 'Unsupported migrate-assets argument.',
		},
		{
			name: 'the -h flag',
			argv: ['-h'],
			error: 'Unsupported migrate-assets argument.',
		},
		{
			name: 'the --verbose flag',
			argv: ['--verbose'],
			error: 'Unsupported migrate-assets argument.',
		},
		{
			name: 'the -v flag',
			argv: ['-v'],
			error: 'Unsupported migrate-assets argument.',
		},
	];

	for (const { name, argv, error } of invalidCases) {
		it(`rejects ${name}`, () => {
			expect(() => parseMigrateAssetArgs(argv)).toThrow(error);
		});
	}
});

describe('migrate-assets entrypoint', () => {
	it('runs empty argv as a credential-free preview without changing id maps', () => {
		const authoritativeBefore = readFileSync(AUTHORITATIVE_MAP);
		const sharedBefore = readFileSync(SHARED_MAP);
		const result = Bun.spawnSync({
			cmd: [process.execPath, 'apps/cms/scripts/migrate-assets.ts'],
			cwd: REPO_ROOT,
			env: {
				PATH: process.env.PATH ?? '',
				PUBLIC_DIRECTUS_URL: 'https://cms.dev.yesid.dev:1',
				NO_COLOR: '1',
			},
			stdout: 'pipe',
			stderr: 'pipe',
		});
		const stdout = result.stdout.toString();
		const stderr = result.stderr.toString();
		const output = `${stdout}\n${stderr}`;

		expect(result.exitCode, output).toBe(0);
		expect(output).toContain('dry-run (preview; no mutations)');
		expect(output).toContain('DRY RUN — no uploads will happen.');
		expect(output).not.toContain('DIRECTUS_ADMIN');
		expect(output).not.toContain('fetch failed');
		expect(output).not.toContain('ECONNREFUSED');
		expect(readFileSync(AUTHORITATIVE_MAP).equals(authoritativeBefore)).toBe(true);
		expect(readFileSync(SHARED_MAP).equals(sharedBefore)).toBe(true);
	});
});
