import { describe, expect, it } from 'bun:test';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
	type AssetEntry,
	type AssetMigrationRemote,
	type AssetMigrationRemoteFile,
	type AssetsManifest,
	MIGRATE_ASSETS_RESET_CONFIRMATION,
	deleteExistingMigratedAssets,
	migrateAssets,
	parseMigrateAssetArgs,
	verifyRemoteAssetSet,
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

	it('keeps explicit --dry-run in non-mutating preview mode', () => {
		expect(parseMigrateAssetArgs(['--dry-run'])).toEqual({
			sourceRoot: undefined,
			dryRun: true,
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

function expectCredentialFreePreview(argv: readonly string[]): void {
	const authoritativeBefore = readFileSync(AUTHORITATIVE_MAP);
	const sharedBefore = readFileSync(SHARED_MAP);
	const result = Bun.spawnSync({
		cmd: [process.execPath, 'apps/cms/scripts/migrate-assets.ts', ...argv],
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
}

describe('migrate-assets entrypoint', () => {
	it('runs empty argv as a credential-free preview without changing id maps', () => {
		expectCredentialFreePreview([]);
	});

	it('runs explicit --dry-run as a credential-free preview without changing id maps', () => {
		expectCredentialFreePreview(['--dry-run']);
	});
});

const EXPECTED_RECEIPT_DIGEST =
	'85363d6f752be4ed2c3fc185b47eb2c21ee8d755008d7de7908e86adb65d0e05';
const EXPECTED_MAP =
	'{\n\t"brand/logo.svg": "brand-id",\n\t"images/a.svg": "id-a",\n\t"images/b.svg": "id-b"\n}\n';

interface Harness {
	root: string;
	sourceRoot: string;
	outputMapPaths: readonly [string, string];
	manifest: AssetsManifest;
}

async function withHarness(
	legacyPaths: readonly string[],
	run: (harness: Harness) => Promise<void>,
): Promise<void> {
	const root = mkdtempSync(join(tmpdir(), 'migrate-assets-safety-'));
	const sourceRoot = join(root, 'source');
	const outputRoot = join(root, 'maps');
	mkdirSync(outputRoot, { recursive: true });

	const assets: AssetEntry[] = legacyPaths.map((legacyPath, index) => ({
		legacyPath,
		folder: 'images',
		title: `Asset ${index + 1}`,
		description: `Asset ${index + 1} test description`,
	}));
	for (const entry of assets) {
		const sourcePath = join(sourceRoot, entry.legacyPath);
		mkdirSync(resolve(sourcePath, '..'), { recursive: true });
		writeFileSync(
			sourcePath,
			'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"></svg>',
		);
	}

	try {
		await run({
			root,
			sourceRoot,
			outputMapPaths: [
				join(outputRoot, 'authoritative.json'),
				join(outputRoot, 'shared.json'),
			],
			manifest: {
				description: 'Lifecycle test manifest',
				sourceRoot: 'source',
				folders: { images: 'Migrated images' },
				assets,
			},
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function remoteFile(
	legacyPath: string | null,
	id: string,
): AssetMigrationRemoteFile {
	return {
		id,
		legacy_path: legacyPath,
		type: 'image/svg+xml',
		width: 10,
		height: 20,
	};
}

class InMemoryAssetRemote implements AssetMigrationRemote {
	readonly operations: string[] = [];
	readonly rows: AssetMigrationRemoteFile[];
	readonly deleteFailures = new Set<string>();
	readonly successfulDeleteWithoutRemoval = new Set<string>();
	readonly uploadIds = new Map<string, string>();
	listTransform?: (
		rows: readonly AssetMigrationRemoteFile[],
		call: number,
	) => readonly AssetMigrationRemoteFile[];
	private listCalls = 0;

	constructor(rows: readonly AssetMigrationRemoteFile[]) {
		this.rows = rows.map((row) => ({ ...row }));
	}

	async listFiles(
		legacyPaths: readonly string[],
	): Promise<readonly AssetMigrationRemoteFile[]> {
		this.listCalls += 1;
		this.operations.push(`list:${this.listCalls}`);
		const wanted = new Set(legacyPaths);
		const rows = this.rows
			.filter((row) => row.legacy_path !== null && wanted.has(row.legacy_path))
			.map((row) => ({ ...row }));
		return this.listTransform?.(rows, this.listCalls) ?? rows;
	}

	async ensureFolders(folderNames: readonly string[]): Promise<Map<string, string>> {
		this.operations.push(`ensure:${folderNames.join(',')}`);
		return new Map(folderNames.map((name) => [name, `folder-${name}`]));
	}

	async deleteFile(id: string): Promise<void> {
		this.operations.push(`delete:${id}`);
		if (this.deleteFailures.has(id)) {
			throw {
				errors: [
					{
						message: 'Injected delete failure',
						extensions: { code: 'DELETE_FAILED' },
					},
				],
			};
		}
		if (this.successfulDeleteWithoutRemoval.has(id)) return;
		const index = this.rows.findIndex((row) => row.id === id);
		if (index >= 0) this.rows.splice(index, 1);
	}

	async updateFile(
		id: string,
		patch: { type?: string; width?: number; height?: number },
	): Promise<void> {
		this.operations.push(`update:${id}`);
		const row = this.rows.find((candidate) => candidate.id === id);
		if (!row) throw new Error(`No row ${id}`);
		Object.assign(row, patch);
	}

	async uploadFile(
		entry: AssetEntry,
		_folderId: string,
		sourceRoot: string,
		desiredId?: string,
	): Promise<string> {
		this.operations.push(`upload:${entry.legacyPath}`);
		readFileSync(join(sourceRoot, entry.legacyPath));
		const id = desiredId ?? this.uploadIds.get(entry.legacyPath) ?? `id-${this.rows.length}`;
		this.rows.push(remoteFile(entry.legacyPath, id));
		return id;
	}
}

function migrationOptions(
	harness: Harness,
	overrides: Partial<{
		reset: boolean;
		preserveIds: ReadonlyMap<string, string>;
	}> = {},
) {
	return {
		directusUrl: 'https://cms.dev.yesid.dev',
		token: 'in-memory-only',
		sourceRoot: harness.sourceRoot,
		outputMapPaths: harness.outputMapPaths,
		dryRun: false,
		reset: overrides.reset ?? false,
		preserveIds: overrides.preserveIds,
	};
}

function expectNoMapFiles(outputMapPaths: readonly string[]): void {
	for (const outputPath of outputMapPaths) {
		expect(existsSync(outputPath)).toBe(false);
	}
}

describe('migrateAssets fail-closed lifecycle', () => {
	// Mutation caught: moving folder creation ahead of duplicate initial-row validation.
	it('aborts duplicate initial legacy paths before every mutation and map write', async () => {
		await withHarness(['images/a.svg'], async (harness) => {
			const remote = new InMemoryAssetRemote([
				remoteFile('images/a.svg', 'id-a'),
				remoteFile('images/a.svg', 'id-a-duplicate'),
			]);

			await expect(
				migrateAssets(harness.manifest, migrationOptions(harness), remote),
			).rejects.toThrow('duplicate remote legacy_path: images/a.svg');

			expect(remote.operations).toEqual(['list:1']);
			expect(remote.rows).toHaveLength(2);
			expectNoMapFiles(harness.outputMapPaths);
		});
	});

	// Mutation caught: checking preserved IDs after folder creation or metadata repair.
	it('aborts a preserved-ID conflict before the first remote mutation', async () => {
		await withHarness(['images/a.svg'], async (harness) => {
			const remote = new InMemoryAssetRemote([
				remoteFile('images/a.svg', 'unexpected-id'),
			]);

			await expect(
				migrateAssets(
					harness.manifest,
					migrationOptions(harness, {
						preserveIds: new Map([['images/a.svg', 'id-a']]),
					}),
					remote,
				),
			).rejects.toThrow('preserved id conflicts found');

			expect(remote.operations).toEqual(['list:1']);
			expect(remote.rows[0]?.id).toBe('unexpected-id');
			expectNoMapFiles(harness.outputMapPaths);
		});
	});

	const deleteFailureCases = [
		{
			name: 'first delete',
			failureId: 'id-a',
			expectedOperations: ['list:1', 'ensure:images', 'delete:id-a'],
			expectedSurvivors: ['id-a', 'id-b', 'id-c'],
		},
		{
			name: 'mid-sequence delete',
			failureId: 'id-b',
			expectedOperations: [
				'list:1',
				'ensure:images',
				'delete:id-a',
				'delete:id-b',
			],
			expectedSurvivors: ['id-b', 'id-c'],
		},
	] as const;

	for (const testCase of deleteFailureCases) {
		// Mutation caught: swallowing a delete error, clearing survivors, or continuing reset work.
		it(`stops at a ${testCase.name} failure and keeps the recoverable remote checkpoint`, async () => {
			await withHarness(
				['images/a.svg', 'images/b.svg', 'images/c.svg'],
				async (harness) => {
					const remote = new InMemoryAssetRemote([
						remoteFile('images/a.svg', 'id-a'),
						remoteFile('images/b.svg', 'id-b'),
						remoteFile('images/c.svg', 'id-c'),
					]);
					remote.deleteFailures.add(testCase.failureId);

					await expect(
						migrateAssets(
							harness.manifest,
							migrationOptions(harness, { reset: true }),
							remote,
						),
					).rejects.toThrow(
						`Failed to delete migrated asset images/${testCase.failureId.slice(3)}.svg`,
					);

					expect(remote.operations).toEqual([...testCase.expectedOperations]);
					expect(remote.rows.map((row) => row.id)).toEqual(
						[...testCase.expectedSurvivors],
					);
					expectNoMapFiles(harness.outputMapPaths);
				},
			);
		});
	}

	// Mutation caught: removing a checkpoint entry before its remote delete succeeds.
	it('removes only successfully deleted entries from the reset checkpoint', async () => {
		const remote = new InMemoryAssetRemote([
			remoteFile('images/a.svg', 'id-a'),
			remoteFile('images/b.svg', 'id-b'),
			remoteFile('images/c.svg', 'id-c'),
		]);
		remote.deleteFailures.add('id-b');
		const checkpoint = new Map([
			['images/a.svg', 'id-a'],
			['images/b.svg', 'id-b'],
			['images/c.svg', 'id-c'],
		]);

		await expect(
			deleteExistingMigratedAssets(checkpoint, (id) => remote.deleteFile(id)),
		).rejects.toThrow('Failed to delete migrated asset images/b.svg');

		expect([...checkpoint.entries()]).toEqual([
			['images/b.svg', 'id-b'],
			['images/c.svg', 'id-c'],
		]);
		expect(remote.rows.map((row) => row.id)).toEqual(['id-b', 'id-c']);
	});

	// Mutation caught: treating successful DELETE responses as proof of empty remote state.
	it('aborts a reset when its deletion readback remains non-empty', async () => {
		await withHarness(['images/a.svg', 'images/b.svg'], async (harness) => {
			const remote = new InMemoryAssetRemote([
				remoteFile('images/a.svg', 'id-a'),
				remoteFile('images/b.svg', 'id-b'),
			]);
			remote.successfulDeleteWithoutRemoval.add('id-b');

			await expect(
				migrateAssets(
					harness.manifest,
					migrationOptions(harness, { reset: true }),
					remote,
				),
			).rejects.toThrow('reset readback still found 1 manifest-owned remote file');

			expect(remote.operations).toEqual([
				'list:1',
				'ensure:images',
				'delete:id-a',
				'delete:id-b',
				'list:2',
			]);
			expect(remote.rows.map((row) => row.id)).toEqual(['id-b']);
			expectNoMapFiles(harness.outputMapPaths);
		});
	});

	const invalidFinalReadbacks: readonly {
		name: string;
		message: string;
		transform: (
			rows: readonly AssetMigrationRemoteFile[],
		) => readonly AssetMigrationRemoteFile[];
	}[] = [
		{
			name: 'a missing path',
			message: 'missing remote legacy_path: images/b.svg',
			transform: (rows) => rows.filter((row) => row.legacy_path !== 'images/b.svg'),
		},
		{
			name: 'a duplicate path',
			message: 'duplicate remote legacy_path: images/a.svg',
			transform: (rows) => [rows[0]!, rows[0]!, rows[1]!],
		},
		{
			name: 'an unexpected path',
			message: 'unexpected remote legacy_path: images/unexpected.svg',
			transform: (rows) => [
				...rows,
				remoteFile('images/unexpected.svg', 'unexpected-id'),
			],
		},
		{
			name: 'a null path',
			message: 'remote file unexpected-id has a null legacy_path',
			transform: (rows) => [...rows, remoteFile(null, 'unexpected-id')],
		},
		{
			name: 'a wrong ID',
			message: 'wrong remote id for images/b.svg: expected id-b, received wrong-id',
			transform: (rows) =>
				rows.map((row) =>
					row.legacy_path === 'images/b.svg' ? { ...row, id: 'wrong-id' } : row,
				),
		},
	];

	for (const testCase of invalidFinalReadbacks) {
		// Mutation caught: emitting either map before exact final-set verification succeeds.
		it(`aborts both map writes when final readback contains ${testCase.name}`, async () => {
			await withHarness(['images/a.svg', 'images/b.svg'], async (harness) => {
				const remote = new InMemoryAssetRemote([]);
				remote.uploadIds.set('images/a.svg', 'id-a');
				remote.uploadIds.set('images/b.svg', 'id-b');
				remote.listTransform = (rows, call) =>
					call === 2 ? testCase.transform(rows) : rows;

				await expect(
					migrateAssets(harness.manifest, migrationOptions(harness), remote),
				).rejects.toThrow(testCase.message);

				expect(remote.operations).toEqual([
					'list:1',
					'ensure:images',
					'upload:images/a.svg',
					'upload:images/b.svg',
					'list:2',
				]);
				expectNoMapFiles(harness.outputMapPaths);
			});
		});
	}

	// Mutation caught: hashing remote query order instead of canonical legacy-path order.
	it('returns the same hand-derived receipt for either remote row order', () => {
		const manifest: AssetsManifest = {
			description: 'Receipt test',
			sourceRoot: 'source',
			folders: { images: 'Images' },
			assets: [
				{
					legacyPath: 'images/a.svg',
					folder: 'images',
					title: 'A',
					description: 'Asset A description',
				},
				{
					legacyPath: 'images/b.svg',
					folder: 'images',
					title: 'B',
					description: 'Asset B description',
				},
			],
		};
		const expectedIds = new Map([
			['images/a.svg', 'id-a'],
			['images/b.svg', 'id-b'],
		]);
		const forward = [
			remoteFile('images/a.svg', 'id-a'),
			remoteFile('images/b.svg', 'id-b'),
		];
		const reverse = [...forward].reverse();

		for (const remoteRows of [forward, reverse]) {
			const receipt = verifyRemoteAssetSet(manifest, expectedIds, remoteRows);
			expect([...receipt.ids.entries()]).toEqual([
				['images/a.svg', 'id-a'],
				['images/b.svg', 'id-b'],
			]);
			expect(receipt.count).toBe(2);
			expect(receipt.digest).toBe(EXPECTED_RECEIPT_DIGEST);
		}
	});

	// Mutation caught: serializing pre-readback state or dropping sibling-owned map keys.
	it('writes identical maps from the converged readback and preserves brand ownership', async () => {
		await withHarness(['images/b.svg', 'images/a.svg'], async (harness) => {
			const authoritativeMap =
				'{\n\t"brand/logo.svg": "brand-id",\n\t"images/stale.svg": "stale-id"\n}\n';
			const reorderedSharedMap =
				'{"images/stale.svg":"stale-id","brand/logo.svg":"brand-id"}\n';
			writeFileSync(harness.outputMapPaths[0], authoritativeMap);
			writeFileSync(harness.outputMapPaths[1], reorderedSharedMap);
			const remote = new InMemoryAssetRemote([
				remoteFile('images/b.svg', 'id-b'),
				remoteFile('images/a.svg', 'id-a'),
			]);

			const verifiedIds = await migrateAssets(
				harness.manifest,
				migrationOptions(harness),
				remote,
			);

			expect([...verifiedIds.entries()]).toEqual([
				['images/a.svg', 'id-a'],
				['images/b.svg', 'id-b'],
			]);
			expect(readFileSync(harness.outputMapPaths[0], 'utf8')).toBe(EXPECTED_MAP);
			expect(readFileSync(harness.outputMapPaths[1], 'utf8')).toBe(EXPECTED_MAP);
			expect(
				readFileSync(harness.outputMapPaths[0]).equals(
					readFileSync(harness.outputMapPaths[1]),
				),
			).toBe(true);
		});
	});

	const divergentMapCases: readonly {
		name: string;
		authoritative: string;
		shared?: string;
	}[] = [
		{
			name: 'manifest-owned IDs differ',
			authoritative: '{"images/a.svg":"id-a"}\n',
			shared: '{"images/a.svg":"different-id"}\n',
		},
		{
			name: 'a sibling-owned key exists in only one map',
			authoritative:
				'{"brand/logo.svg":"brand-id","images/a.svg":"id-a"}\n',
			shared: '{"images/a.svg":"id-a"}\n',
		},
		{
			name: 'an exact __proto__ key exists in only one map',
			authoritative:
				'{"__proto__":"legacy-id","images/a.svg":"id-a"}\n',
			shared: '{"images/a.svg":"id-a"}\n',
		},
		{
			name: 'one of two configured maps is missing',
			authoritative: '{"images/a.svg":"id-a"}\n',
		},
	];

	for (const testCase of divergentMapCases) {
		// Mutation caught: comparing only preserved intersections or accepting a partial mirror set.
		it(`aborts before remote access when ${testCase.name}`, async () => {
			await withHarness(['images/a.svg'], async (harness) => {
				writeFileSync(harness.outputMapPaths[0], testCase.authoritative);
				if (testCase.shared !== undefined) {
					writeFileSync(harness.outputMapPaths[1], testCase.shared);
				}
				const remote = new InMemoryAssetRemote([
					remoteFile('images/a.svg', 'id-a'),
				]);

				let failure: unknown;
				try {
					await migrateAssets(
						harness.manifest,
						migrationOptions(harness),
						remote,
					);
				} catch (error) {
					failure = error;
				}

				expect(remote.operations).toEqual([]);
				expect(readFileSync(harness.outputMapPaths[0], 'utf8')).toBe(
					testCase.authoritative,
				);
				if (testCase.shared === undefined) {
					expect(existsSync(harness.outputMapPaths[1])).toBe(false);
				} else {
					expect(readFileSync(harness.outputMapPaths[1], 'utf8')).toBe(
						testCase.shared,
					);
				}
				expect(failure).toBeInstanceOf(Error);
				expect((failure as Error).message).toContain(
					'configured id-map outputs diverge',
				);
			});
		});
	}

	// Mutation caught: downgrading malformed existing map JSON into a warning.
	it('aborts malformed existing map JSON before touching the remote adapter', async () => {
		await withHarness(['images/a.svg'], async (harness) => {
			writeFileSync(harness.outputMapPaths[0], '{not-json');
			const remote = new InMemoryAssetRemote([]);

			await expect(
				migrateAssets(harness.manifest, migrationOptions(harness), remote),
			).rejects.toThrow('invalid id-map JSON');

			expect(remote.operations).toEqual([]);
			expect(readFileSync(harness.outputMapPaths[0], 'utf8')).toBe('{not-json');
			expect(existsSync(harness.outputMapPaths[1])).toBe(false);
		});
	});

	// Mutation caught: choosing one sibling-owned value when mirrored maps conflict.
	it('aborts conflicting sibling-owned map values before touching the remote adapter', async () => {
		await withHarness(['images/a.svg'], async (harness) => {
			writeFileSync(
				harness.outputMapPaths[0],
				'{"brand/logo.svg":"authoritative-id"}\n',
			);
			writeFileSync(
				harness.outputMapPaths[1],
				'{"brand/logo.svg":"conflicting-id"}\n',
			);
			const remote = new InMemoryAssetRemote([]);

			await expect(
				migrateAssets(harness.manifest, migrationOptions(harness), remote),
			).rejects.toThrow('configured id-map outputs diverge');

			expect(remote.operations).toEqual([]);
			expect(readFileSync(harness.outputMapPaths[0], 'utf8')).toContain(
				'authoritative-id',
			);
			expect(readFileSync(harness.outputMapPaths[1], 'utf8')).toContain(
				'conflicting-id',
			);
		});
	});
});
