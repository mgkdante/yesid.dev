import { describe, expect, it } from 'bun:test';
import * as shared from './index';

type AssetRegistryContract = {
	readonly ASSET_KINDS: readonly string[];
	readonly ASSET_ROLES: readonly string[];
	readonly ASSET_DELIVERY_MODES: readonly string[];
	parseAssetSemanticKey(value: string): string;
	parseSha256Hex(value: string): string;
	defineAssetUsages(declarations: readonly Record<string, unknown>[]): readonly Record<string, unknown>[];
	canonicalizeAssetReleaseManifest(manifest: Record<string, unknown>): string;
	hashAssetReleaseManifest(manifest: Record<string, unknown>): Promise<string>;
};

const registry = shared as unknown as AssetRegistryContract;

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const VERSION_A = '00000000-0000-0000-0000-000000000001';
const VERSION_B = '00000000-0000-0000-0000-000000000002';
const FILE_A = '10000000-0000-0000-0000-000000000001';

function usage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		usageKey: 'route.home.hero',
		semanticKey: 'hero.route.home',
		consumerType: 'route',
		consumerKey: 'home',
		source: 'apps/web/src/routes/+page.svelte#default',
		route: '/',
		locale: null,
		slot: 'hero',
		required: true,
		deliveryMode: 'local-img',
		confidence: 'declared-dynamic',
		reason: 'Selected by the route composition layer.',
		...overrides,
	};
}

function directusEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		semanticKey: 'og.route.home.en',
		versionId: VERSION_A,
		kind: 'raster',
		role: 'og',
		source: {
			type: 'directus-file',
			fileId: FILE_A,
			sha256: SHA_A,
		},
		...overrides,
	};
}

function componentEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		semanticKey: 'blueprint.component.metro',
		versionId: VERSION_B,
		kind: 'code-component',
		role: 'blueprint',
		source: {
			type: 'repo-component',
			componentKey: 'Metro\r\nCafe\u0301',
			sha256: SHA_B,
		},
		...overrides,
	};
}

function manifest(entries: readonly Record<string, unknown>[]): Record<string, unknown> {
	return { schemaVersion: 1, entries };
}

describe('asset registry identities', () => {
	it.each([
		'hero.route.home',
		'og.blog.the-two-hour-slot.en',
		'illustration.service.web-development.hero.fr',
	])('accepts a valid semantic key: %s', (value) => {
		expect(registry.parseAssetSemanticKey(value)).toBe(value);
	});

	it.each([
		'hero.route',
		'hero.route.home.slot.en.extra',
		'Hero.route.home',
		'hero.route.home_slot',
		'hero..home',
		'.hero.route.home',
		'hero.route.home.',
		'hero.-route.home',
		'hero.route.caf\u00e9',
		' hero.route.home',
	])('rejects an invalid semantic key without coercion: %s', (value) => {
		expect(() => registry.parseAssetSemanticKey(value)).toThrow();
	});

	it('accepts only lowercase 64-character SHA-256 hex', () => {
		expect(registry.parseSha256Hex(SHA_A)).toBe(SHA_A);
		expect(registry.parseSha256Hex('0123456789abcdef'.repeat(4))).toBe(
			'0123456789abcdef'.repeat(4),
		);
	});

	it.each([
		'a'.repeat(63),
		'a'.repeat(65),
		'A'.repeat(64),
		'g'.repeat(64),
		`${'a'.repeat(64)}\n`,
		` ${'a'.repeat(64)}`,
	])('rejects an invalid SHA-256 identity without coercion', (value) => {
		expect(() => registry.parseSha256Hex(value)).toThrow();
	});

	it('exports the closed kind, role, and delivery-mode sets', () => {
		expect(registry.ASSET_KINDS).toEqual([
			'raster',
			'svg',
			'code-component',
			'font',
			'document',
			'video',
		]);
		expect(registry.ASSET_ROLES).toEqual([
			'brand',
			'icon',
			'illustration',
			'blueprint',
			'hero',
			'content',
			'background',
			'og',
			'poster',
			'font',
			'document',
			'video',
		]);
		expect(registry.ASSET_DELIVERY_MODES).toEqual([
			'local-img',
			'css-background',
			'og-meta',
			'inline-svg',
			'sanitized-svg-img',
			'tokenized-inline-svg',
			'code-component',
			'font-face',
			'download',
			'video',
			'external-url',
		]);
	});
});

describe('defineAssetUsages', () => {
	it('normalizes strings, preserves order, clones records, and freezes the result', () => {
		const declarations = [
			usage({
				usageKey: 'route.home.hero-en',
				semanticKey: 'hero.route.home.en',
				locale: 'en',
				reason: 'Cafe\u0301\r\nselection',
			}),
			usage({
				usageKey: 'route.home.hero-fr',
				semanticKey: 'hero.route.home.fr',
				locale: 'fr',
				required: false,
			}),
		] as const;

		const result = registry.defineAssetUsages(declarations);

		expect(result.map((entry) => entry.usageKey)).toEqual([
			'route.home.hero-en',
			'route.home.hero-fr',
		]);
		expect(result[0]?.reason).toBe('Caf\u00e9\nselection');
		expect(result).not.toBe(declarations);
		expect(result[0]).not.toBe(declarations[0]);
		expect(Object.isFrozen(result)).toBe(true);
		expect(Object.isFrozen(result[0])).toBe(true);
	});

	it('allows distinct usages to reference the same semantic key', () => {
		const result = registry.defineAssetUsages([
			usage({ usageKey: 'route.home.hero' }),
			usage({
				usageKey: 'component.home-hero.picture',
				consumerType: 'component',
				consumerKey: 'HomeHero',
				route: null,
				source: 'apps/web/src/lib/components/home/HomeHero.svelte',
			}),
		]);

		expect(result).toHaveLength(2);
		expect(result[0]?.semanticKey).toBe(result[1]?.semanticKey);
	});

	it('rejects duplicate stable usage identities even when their assets differ', () => {
		expect(() =>
			registry.defineAssetUsages([
				usage(),
				usage({ semanticKey: 'hero.route.about', consumerKey: 'about', route: '/about' }),
			]),
		).toThrow();
	});

	it.each([
		['short usage key', { usageKey: 'route.home' }],
		['uppercase usage key', { usageKey: 'Route.home.hero' }],
		['invalid semantic key', { semanticKey: 'hero.route' }],
		['invalid consumer type', { consumerType: 'unknown' }],
		['empty consumer key', { consumerKey: '' }],
		['absolute source', { source: '/apps/web/source.ts' }],
		['backslash source', { source: 'apps\\web\\source.ts' }],
		['traversing source', { source: 'apps/web/../source.ts' }],
		['empty export source', { source: 'apps/web/source.ts#' }],
		['relative route', { route: 'about' }],
		['invalid locale', { locale: 'de' }],
		['empty slot', { slot: '' }],
		['non-boolean required flag', { required: 'yes' }],
		['invalid delivery mode', { deliveryMode: 'cdn' }],
		['inferred confidence', { confidence: 'exact-static' }],
		['empty reason', { reason: '' }],
	] as const)('rejects %s', (_label, overrides) => {
		expect(() => registry.defineAssetUsages([usage(overrides)])).toThrow();
	});
});

describe('asset release manifests', () => {
	it('canonicalizes strings, entry order, object keys, and the trailing newline', () => {
		const input = {
			entries: [
				componentEntry(),
				{
					role: 'og',
					source: { sha256: SHA_A, type: 'directus-file', fileId: FILE_A },
					kind: 'raster',
					versionId: VERSION_A,
					semanticKey: 'og.route.home.en',
				},
			],
			schemaVersion: 1,
		};
		const expected =
			`{"entries":[{"kind":"code-component","role":"blueprint","semanticKey":"blueprint.component.metro","source":{"componentKey":"Metro\\nCaf\u00e9","sha256":"${SHA_B}","type":"repo-component"},"versionId":"${VERSION_B}"},` +
			`{"kind":"raster","role":"og","semanticKey":"og.route.home.en","source":{"fileId":"${FILE_A}","sha256":"${SHA_A}","type":"directus-file"},"versionId":"${VERSION_A}"}],"schemaVersion":1}\n`;

		expect(registry.canonicalizeAssetReleaseManifest(input)).toBe(expected);
	});

	it('produces canonical bytes and hashes independent of caller ordering', async () => {
		const first = manifest([directusEntry(), componentEntry()]);
		const second = {
			entries: [
				{
					source: { sha256: SHA_B, componentKey: 'Metro\nCaf\u00e9', type: 'repo-component' },
					role: 'blueprint',
					kind: 'code-component',
					versionId: VERSION_B,
					semanticKey: 'blueprint.component.metro',
				},
				{
					source: { fileId: FILE_A, type: 'directus-file', sha256: SHA_A },
					role: 'og',
					kind: 'raster',
					versionId: VERSION_A,
					semanticKey: 'og.route.home.en',
				},
			],
			schemaVersion: 1,
		};

		const canonical = registry.canonicalizeAssetReleaseManifest(first);
		const expectedDigest = await crypto.subtle.digest(
			'SHA-256',
			new TextEncoder().encode(canonical),
		);
		const expectedHash = Array.from(new Uint8Array(expectedDigest), (byte) =>
			byte.toString(16).padStart(2, '0'),
		).join('');

		expect(registry.canonicalizeAssetReleaseManifest(second)).toBe(canonical);
		expect(await registry.hashAssetReleaseManifest(first)).toBe(expectedHash);
		expect(await registry.hashAssetReleaseManifest(second)).toBe(expectedHash);
		expect(expectedHash).toMatch(/^[0-9a-f]{64}$/);
	});

	it.each([
		['wrong schema version', { schemaVersion: 2, entries: [directusEntry()] }],
		['invalid semantic key', manifest([directusEntry({ semanticKey: 'og.route' })])],
		[
			'invalid version UUID',
			manifest([directusEntry({ versionId: 'ABCDEFAB-0000-0000-0000-000000000001' })]),
		],
		[
			'invalid Directus file UUID',
			manifest([
				directusEntry({
					source: {
						type: 'directus-file',
						fileId: 'ABCDEFAB-0000-0000-0000-000000000001',
						sha256: SHA_A,
					},
				}),
			]),
		],
		[
			'invalid release SHA-256',
			manifest([
				directusEntry({
					source: { type: 'directus-file', fileId: FILE_A, sha256: SHA_A.toUpperCase() },
				}),
			]),
		],
		[
			'duplicate semantic key',
			manifest([directusEntry(), directusEntry({ versionId: VERSION_B })]),
		],
		[
			'repository source for a non-component kind',
			manifest([
				componentEntry({
					kind: 'svg',
				}),
			]),
		],
		[
			'Directus source for a component kind',
			manifest([
				directusEntry({
					kind: 'code-component',
					role: 'blueprint',
				}),
			]),
		],
	] as const)('rejects %s', (_label, input) => {
		expect(() => registry.canonicalizeAssetReleaseManifest(input)).toThrow();
	});
});
