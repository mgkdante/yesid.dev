export const ASSET_SEMANTIC_KEY_PATTERN: RegExp = Object.freeze(
	/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*){2,4}$/,
);
const USAGE_KEY_PATTERN = /^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*){2,}$/;
export const SHA256_HEX_PATTERN: RegExp = Object.freeze(/^[0-9a-f]{64}$/);
const LOWERCASE_UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

declare const assetSemanticKeyBrand: unique symbol;
declare const sha256HexBrand: unique symbol;

export type AssetSemanticKey = string & {
	readonly [assetSemanticKeyBrand]: true;
};

export type Sha256Hex = string & {
	readonly [sha256HexBrand]: true;
};

export const ASSET_KINDS = Object.freeze([
	'raster',
	'svg',
	'code-component',
	'font',
	'document',
	'video',
] as const);

export type AssetKind = (typeof ASSET_KINDS)[number];

export const ASSET_ROLES = Object.freeze([
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
] as const);

export type AssetRole = (typeof ASSET_ROLES)[number];

export const ASSET_DELIVERY_MODES = Object.freeze([
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
] as const);

export type AssetDeliveryMode = (typeof ASSET_DELIVERY_MODES)[number];

type AssetUsageConsumerType =
	| 'site'
	| 'route'
	| 'service'
	| 'project'
	| 'blog'
	| 'page-block'
	| 'component'
	| 'style'
	| 'system';

type AssetLocale = 'en' | 'fr' | 'es';

export interface AssetUsageDeclaration {
	readonly usageKey: string;
	readonly semanticKey: AssetSemanticKey;
	readonly consumerType: AssetUsageConsumerType;
	readonly consumerKey: string;
	readonly source: string;
	readonly route: string | null;
	readonly locale: AssetLocale | null;
	readonly slot: string;
	readonly required: boolean;
	readonly deliveryMode: AssetDeliveryMode;
	readonly confidence: 'declared-dynamic';
	readonly reason: string;
}

export type AssetUsageDeclarationInput = Omit<AssetUsageDeclaration, 'semanticKey'> & {
	readonly semanticKey: string;
};

export type AssetReleaseSource =
	| {
			readonly type: 'directus-file';
			readonly fileId: string;
			readonly sha256: Sha256Hex;
	  }
	| {
			readonly type: 'repo-component';
			readonly componentKey: string;
			readonly sha256: Sha256Hex;
	  };

export interface AssetReleaseEntry {
	readonly semanticKey: AssetSemanticKey;
	readonly versionId: string;
	readonly kind: AssetKind;
	readonly role: AssetRole;
	readonly source: AssetReleaseSource;
}

export interface AssetReleaseManifest {
	readonly schemaVersion: 1;
	readonly entries: readonly AssetReleaseEntry[];
}

const ASSET_KIND_SET = new Set<string>(ASSET_KINDS);
const ASSET_ROLE_SET = new Set<string>(ASSET_ROLES);
const ASSET_DELIVERY_MODE_SET = new Set<string>(ASSET_DELIVERY_MODES);
const ASSET_USAGE_CONSUMER_TYPE_SET = new Set<string>([
	'site',
	'route',
	'service',
	'project',
	'blog',
	'page-block',
	'component',
	'style',
	'system',
]);
const ASSET_LOCALE_SET = new Set<string>(['en', 'fr', 'es']);

export function parseAssetSemanticKey(value: string): AssetSemanticKey {
	if (typeof value !== 'string' || !ASSET_SEMANTIC_KEY_PATTERN.test(value)) {
		throw new TypeError(`Invalid asset semantic key: ${JSON.stringify(value)}`);
	}

	return value as AssetSemanticKey;
}

export function parseSha256Hex(value: string): Sha256Hex {
	if (typeof value !== 'string' || !SHA256_HEX_PATTERN.test(value)) {
		throw new TypeError(`Invalid lowercase SHA-256 hex: ${JSON.stringify(value)}`);
	}

	return value as Sha256Hex;
}

export function defineAssetUsages<const T extends readonly AssetUsageDeclarationInput[]>(
	declarations: T,
): readonly AssetUsageDeclaration[] {
	if (!Array.isArray(declarations)) {
		throw new TypeError('Asset usage declarations must be an array');
	}

	const usageKeys = new Set<string>();
	const normalized = declarations.map((declaration, index) => {
		assertRecord(declaration, `Asset usage declaration at index ${index}`);

		const usageKey = normalizeString(declaration.usageKey, 'usageKey');
		if (!USAGE_KEY_PATTERN.test(usageKey)) {
			throw new TypeError(`Invalid asset usage key: ${JSON.stringify(usageKey)}`);
		}
		if (usageKeys.has(usageKey)) {
			throw new TypeError(`Duplicate asset usage key: ${JSON.stringify(usageKey)}`);
		}
		usageKeys.add(usageKey);

		const semanticKey = parseAssetSemanticKey(
			normalizeString(declaration.semanticKey, 'semanticKey'),
		);
		const consumerType = normalizeString(declaration.consumerType, 'consumerType');
		if (!ASSET_USAGE_CONSUMER_TYPE_SET.has(consumerType)) {
			throw new TypeError(`Invalid asset usage consumer type: ${JSON.stringify(consumerType)}`);
		}

		const consumerKey = normalizeNonEmptyString(declaration.consumerKey, 'consumerKey');
		const source = normalizeString(declaration.source, 'source');
		if (!isRepoRelativeModuleReference(source)) {
			throw new TypeError(`Invalid asset usage source: ${JSON.stringify(source)}`);
		}

		const route = normalizeNullableString(declaration.route, 'route');
		if (route !== null && !route.startsWith('/')) {
			throw new TypeError(`Invalid asset usage route: ${JSON.stringify(route)}`);
		}

		const locale = normalizeNullableString(declaration.locale, 'locale');
		if (locale !== null && !ASSET_LOCALE_SET.has(locale)) {
			throw new TypeError(`Invalid asset usage locale: ${JSON.stringify(locale)}`);
		}

		const slot = normalizeNonEmptyString(declaration.slot, 'slot');
		if (typeof declaration.required !== 'boolean') {
			throw new TypeError('Asset usage required must be a boolean');
		}

		const deliveryMode = normalizeString(declaration.deliveryMode, 'deliveryMode');
		if (!ASSET_DELIVERY_MODE_SET.has(deliveryMode)) {
			throw new TypeError(`Invalid asset delivery mode: ${JSON.stringify(deliveryMode)}`);
		}

		const confidence = normalizeString(declaration.confidence, 'confidence');
		if (confidence !== 'declared-dynamic') {
			throw new TypeError('Asset usage confidence must be "declared-dynamic"');
		}

		const reason = normalizeNonEmptyString(declaration.reason, 'reason');

		return deepFreeze({
			usageKey,
			semanticKey,
			consumerType: consumerType as AssetUsageConsumerType,
			consumerKey,
			source,
			route,
			locale: locale as AssetLocale | null,
			slot,
			required: declaration.required,
			deliveryMode: deliveryMode as AssetDeliveryMode,
			confidence: confidence as 'declared-dynamic',
			reason,
		});
	});

	return Object.freeze(normalized);
}

export function canonicalizeAssetReleaseManifest(manifest: AssetReleaseManifest): string {
	assertRecord(manifest, 'Asset release manifest');
	if (manifest.schemaVersion !== 1) {
		throw new TypeError('Asset release manifest schemaVersion must be 1');
	}
	if (!Array.isArray(manifest.entries)) {
		throw new TypeError('Asset release manifest entries must be an array');
	}

	const semanticKeys = new Set<string>();
	const entries = manifest.entries.map((entry, index) => {
		assertRecord(entry, `Asset release entry at index ${index}`);

		const semanticKey = parseAssetSemanticKey(
			normalizeString(entry.semanticKey, 'semanticKey'),
		);
		if (semanticKeys.has(semanticKey)) {
			throw new TypeError(`Duplicate released semantic key: ${JSON.stringify(semanticKey)}`);
		}
		semanticKeys.add(semanticKey);

		const versionId = normalizeUuid(entry.versionId, 'versionId');
		const kind = normalizeString(entry.kind, 'kind');
		if (!ASSET_KIND_SET.has(kind)) {
			throw new TypeError(`Invalid asset kind: ${JSON.stringify(kind)}`);
		}
		const role = normalizeString(entry.role, 'role');
		if (!ASSET_ROLE_SET.has(role)) {
			throw new TypeError(`Invalid asset role: ${JSON.stringify(role)}`);
		}

		assertRecord(entry.source, 'Asset release source');
		const sourceType = normalizeString(entry.source.type, 'source.type');
		const sha256 = parseSha256Hex(normalizeString(entry.source.sha256, 'source.sha256'));

		if (sourceType === 'directus-file') {
			if (kind === 'code-component') {
				throw new TypeError('A code-component release must use a repo-component source');
			}

			return {
				semanticKey,
				versionId,
				kind: kind as AssetKind,
				role: role as AssetRole,
				source: {
					type: sourceType,
					fileId: normalizeUuid(entry.source.fileId, 'source.fileId'),
					sha256,
				},
			};
		}

		if (sourceType === 'repo-component') {
			if (kind !== 'code-component') {
				throw new TypeError('A repo-component source requires kind "code-component"');
			}

			return {
				semanticKey,
				versionId,
				kind: kind as AssetKind,
				role: role as AssetRole,
				source: {
					type: sourceType,
					componentKey: normalizeNonEmptyString(entry.source.componentKey, 'source.componentKey'),
					sha256,
				},
			};
		}

		throw new TypeError(`Invalid asset release source type: ${JSON.stringify(sourceType)}`);
	});

	entries.sort((left, right) => {
		const semanticKeyOrder = compareOrdinal(left.semanticKey, right.semanticKey);
		return semanticKeyOrder || compareOrdinal(left.versionId, right.versionId);
	});

	return `${JSON.stringify(sortObjectKeys({ schemaVersion: 1, entries }))}\n`;
}

export async function hashAssetReleaseManifest(
	manifest: AssetReleaseManifest,
): Promise<Sha256Hex> {
	const canonical = canonicalizeAssetReleaseManifest(manifest);
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
	const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	);

	return parseSha256Hex(hex);
}

function normalizeString(value: unknown, field: string): string {
	if (typeof value !== 'string') {
		throw new TypeError(`${field} must be a string`);
	}

	return value.replace(/\r\n?/g, '\n').normalize('NFC');
}

function normalizeNonEmptyString(value: unknown, field: string): string {
	const normalized = normalizeString(value, field);
	if (normalized.length === 0) {
		throw new TypeError(`${field} must not be empty`);
	}

	return normalized;
}

function normalizeNullableString(value: unknown, field: string): string | null {
	return value === null ? null : normalizeString(value, field);
}

function normalizeUuid(value: unknown, field: string): string {
	const normalized = normalizeString(value, field);
	if (!LOWERCASE_UUID_PATTERN.test(normalized)) {
		throw new TypeError(`${field} must be a lowercase UUID`);
	}

	return normalized;
}

function isRepoRelativeModuleReference(value: string): boolean {
	if (value.length === 0 || value.startsWith('/') || value.includes('\\') || /[\0\r\n]/.test(value)) {
		return false;
	}

	const parts = value.split('#');
	if (parts.length > 2 || (parts.length === 2 && parts[1]?.length === 0)) {
		return false;
	}

	const modulePath = parts[0];
	if (!modulePath || /^[a-zA-Z]:\//.test(modulePath)) {
		return false;
	}

	return modulePath.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object`);
	}
}

function compareOrdinal(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function sortObjectKeys(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortObjectKeys);
	}
	if (typeof value !== 'object' || value === null) {
		return value;
	}

	return Object.fromEntries(
		Object.keys(value)
			.sort()
			.map((key) => [key, sortObjectKeys((value as Record<string, unknown>)[key])]),
	);
}

function deepFreeze<T extends object>(value: T): Readonly<T> {
	for (const nested of Object.values(value)) {
		if (typeof nested === 'object' && nested !== null && !Object.isFrozen(nested)) {
			deepFreeze(nested);
		}
	}

	return Object.freeze(value);
}
