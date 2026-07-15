import { describe, expect, it } from 'bun:test';
import {
	ASSET_DELIVERY_MODES,
	ASSET_KINDS,
	ASSET_ROLES,
	ASSET_SEMANTIC_KEY_PATTERN,
	SHA256_HEX_PATTERN,
} from '@repo/shared';
import type { SchemaStep } from '../scripts/lib/schema-apply';

const originalFetch = globalThis.fetch;
let importFetchCalls = 0;
globalThis.fetch = (async () => {
	importFetchCalls += 1;
	throw new Error('schema module import must not touch the network');
}) as typeof fetch;
const subject = await import('../scripts/setup-asset-registry-schema');
globalThis.fetch = originalFetch;

const { applyAssetRegistryPlan, buildAssetRegistryPlan, parseFlags, runAssetRegistryCli } = subject;

type Payload = Record<string, any>;

const EXPECTED_FIELDS: Record<string, readonly string[]> = {
	asset_records: [
		'id',
		'semantic_key',
		'title',
		'meaning',
		'kind',
		'role',
		'lifecycle_status',
		'code_component_key',
		'owner_type',
		'owner_key',
		'locale_policy',
		'alt_mode',
		'aspect_ratio_mode',
		'aspect_ratio_width',
		'aspect_ratio_height',
		'allowed_mime_families',
		'transform_profile',
		'delivery_mode',
		'focal_point_x',
		'focal_point_y',
		'max_bytes',
		'brand_status',
		'approved_token_slots',
		'candidate_version',
		'approved_version',
		'translations',
		'versions',
		'usages',
		'date_created',
		'date_updated',
		'user_created',
		'user_updated',
	],
	asset_records_translations: [
		'id',
		'asset_records_id',
		'languages_code',
		'alt_text',
		'caption',
		'credit',
		'og_image_alt',
	],
	asset_versions: [
		'id',
		'asset_record',
		'version_number',
		'source_mode',
		'directus_file',
		'component_key',
		'sha256',
		'mime_type',
		'format',
		'bytes',
		'width',
		'height',
		'duration_ms',
		'orientation',
		'color_profile',
		'is_animated',
		'source_hash',
		'dependency_hashes',
		'transform_profile',
		'transform_signature',
		'sanitizer_signature',
		'generator_signature',
		'toolchain_signature',
		'approval_status',
		'approved_by',
		'approved_at',
		'replaces_version',
		'replacement_reason',
		'promotion_request_id',
		'quarantine_reason',
		'sanitized_output_sha256',
		'input_hash',
		'brand_slots',
		'svg_id_prefix',
		'template_version',
		'safety_report',
		'date_created',
		'user_created',
	],
	asset_usages: [
		'id',
		'asset_record',
		'resolved_version',
		'unresolved_ref',
		'scan_run_id',
		'last_seen_manifest_sha256',
		'confidence',
		'consumer_type',
		'consumer_key',
		'source_kind',
		'source_file',
		'cms_field',
		'source_line',
		'route',
		'locale',
		'slot',
		'required',
		'delivery_mode',
		'alt_text_override',
		'alt_source',
		'active',
		'first_seen',
		'last_seen',
		'date_updated',
	],
	asset_releases: [
		'id',
		'release_key',
		'schema_version',
		'manifest',
		'manifest_sha256',
		'source_environment',
		'target_environment',
		'status',
		'repo_sha',
		'content_export_sha256',
		'expected_manifest_sha256',
		'toolchain_signature',
		'expected_live_release',
		'idempotency_key',
		'lease_owner',
		'lease_expires_at',
		'previous_release',
		'rollback_of',
		'validation_checks',
		'source_dev_receipt',
		'deployment_receipt',
		'build_ref',
		'deploy_ref',
		'error_code',
		'error_message',
		'date_created',
		'date_updated',
		'user_created',
	],
};

const EXPECTED_TYPES: Record<string, readonly string[]> = {
	uuid: [
		'asset_records.id',
		'asset_records.candidate_version',
		'asset_records.approved_version',
		'asset_records.user_created',
		'asset_records.user_updated',
		'asset_records_translations.asset_records_id',
		'asset_versions.id',
		'asset_versions.asset_record',
		'asset_versions.directus_file',
		'asset_versions.approved_by',
		'asset_versions.replaces_version',
		'asset_versions.user_created',
		'asset_usages.asset_record',
		'asset_usages.resolved_version',
		'asset_releases.id',
		'asset_releases.expected_live_release',
		'asset_releases.previous_release',
		'asset_releases.rollback_of',
		'asset_releases.user_created',
	],
	integer: [
		'asset_records.aspect_ratio_width',
		'asset_records.aspect_ratio_height',
		'asset_records.max_bytes',
		'asset_records_translations.id',
		'asset_versions.version_number',
		'asset_versions.bytes',
		'asset_versions.width',
		'asset_versions.height',
		'asset_versions.duration_ms',
		'asset_usages.source_line',
		'asset_releases.schema_version',
	],
	decimal: ['asset_records.focal_point_x', 'asset_records.focal_point_y'],
	boolean: ['asset_versions.is_animated', 'asset_usages.required', 'asset_usages.active'],
	timestamp: [
		'asset_records.date_created',
		'asset_records.date_updated',
		'asset_versions.approved_at',
		'asset_versions.date_created',
		'asset_usages.first_seen',
		'asset_usages.last_seen',
		'asset_usages.date_updated',
		'asset_releases.lease_expires_at',
		'asset_releases.date_created',
		'asset_releases.date_updated',
	],
	json: [
		'asset_records.allowed_mime_families',
		'asset_records.approved_token_slots',
		'asset_versions.dependency_hashes',
		'asset_versions.brand_slots',
		'asset_versions.safety_report',
		'asset_releases.manifest',
		'asset_releases.validation_checks',
		'asset_releases.source_dev_receipt',
		'asset_releases.deployment_receipt',
	],
	text: [
		'asset_records.meaning',
		'asset_records_translations.alt_text',
		'asset_records_translations.caption',
		'asset_records_translations.credit',
		'asset_records_translations.og_image_alt',
		'asset_versions.replacement_reason',
		'asset_versions.quarantine_reason',
		'asset_usages.alt_text_override',
		'asset_releases.error_message',
	],
	alias: ['asset_records.translations', 'asset_records.versions', 'asset_records.usages'],
	string: [
		'asset_records.semantic_key',
		'asset_records.title',
		'asset_records.kind',
		'asset_records.role',
		'asset_records.lifecycle_status',
		'asset_records.code_component_key',
		'asset_records.owner_type',
		'asset_records.owner_key',
		'asset_records.locale_policy',
		'asset_records.alt_mode',
		'asset_records.aspect_ratio_mode',
		'asset_records.transform_profile',
		'asset_records.delivery_mode',
		'asset_records.brand_status',
		'asset_records_translations.languages_code',
		'asset_versions.source_mode',
		'asset_versions.component_key',
		'asset_versions.sha256',
		'asset_versions.mime_type',
		'asset_versions.format',
		'asset_versions.orientation',
		'asset_versions.color_profile',
		'asset_versions.source_hash',
		'asset_versions.transform_profile',
		'asset_versions.transform_signature',
		'asset_versions.sanitizer_signature',
		'asset_versions.generator_signature',
		'asset_versions.toolchain_signature',
		'asset_versions.approval_status',
		'asset_versions.promotion_request_id',
		'asset_versions.sanitized_output_sha256',
		'asset_versions.input_hash',
		'asset_versions.svg_id_prefix',
		'asset_versions.template_version',
		'asset_usages.id',
		'asset_usages.unresolved_ref',
		'asset_usages.scan_run_id',
		'asset_usages.last_seen_manifest_sha256',
		'asset_usages.confidence',
		'asset_usages.consumer_type',
		'asset_usages.consumer_key',
		'asset_usages.source_kind',
		'asset_usages.source_file',
		'asset_usages.cms_field',
		'asset_usages.route',
		'asset_usages.locale',
		'asset_usages.slot',
		'asset_usages.delivery_mode',
		'asset_usages.alt_source',
		'asset_releases.release_key',
		'asset_releases.manifest_sha256',
		'asset_releases.source_environment',
		'asset_releases.target_environment',
		'asset_releases.status',
		'asset_releases.repo_sha',
		'asset_releases.content_export_sha256',
		'asset_releases.expected_manifest_sha256',
		'asset_releases.toolchain_signature',
		'asset_releases.idempotency_key',
		'asset_releases.lease_owner',
		'asset_releases.build_ref',
		'asset_releases.deploy_ref',
		'asset_releases.error_code',
	],
};

const REQUIRED_FIELDS = new Set([
	'asset_records.semantic_key',
	'asset_records.title',
	'asset_records.kind',
	'asset_records.role',
	'asset_records.lifecycle_status',
	'asset_records.owner_type',
	'asset_records.owner_key',
	'asset_records.locale_policy',
	'asset_records.alt_mode',
	'asset_records.aspect_ratio_mode',
	'asset_records.delivery_mode',
	'asset_records.brand_status',
	'asset_versions.asset_record',
	'asset_versions.version_number',
	'asset_versions.source_mode',
	'asset_versions.sha256',
	'asset_versions.approval_status',
	'asset_usages.scan_run_id',
	'asset_usages.last_seen_manifest_sha256',
	'asset_usages.confidence',
	'asset_usages.consumer_type',
	'asset_usages.consumer_key',
	'asset_usages.source_kind',
	'asset_usages.source_file',
	'asset_usages.slot',
	'asset_usages.required',
	'asset_usages.delivery_mode',
	'asset_usages.active',
	'asset_releases.release_key',
	'asset_releases.schema_version',
	'asset_releases.manifest',
	'asset_releases.manifest_sha256',
	'asset_releases.source_environment',
	'asset_releases.target_environment',
	'asset_releases.status',
	'asset_releases.idempotency_key',
]);

const INDEXED_FIELDS = new Set([
	'asset_records.kind',
	'asset_records.role',
	'asset_records.lifecycle_status',
	'asset_records.owner_type',
	'asset_records.owner_key',
	'asset_records.brand_status',
	'asset_records.candidate_version',
	'asset_records.approved_version',
	'asset_records.user_created',
	'asset_records.user_updated',
	'asset_records_translations.asset_records_id',
	'asset_records_translations.languages_code',
	'asset_versions.asset_record',
	'asset_versions.version_number',
	'asset_versions.directus_file',
	'asset_versions.sha256',
	'asset_versions.source_hash',
	'asset_versions.transform_signature',
	'asset_versions.sanitizer_signature',
	'asset_versions.generator_signature',
	'asset_versions.toolchain_signature',
	'asset_versions.approval_status',
	'asset_versions.approved_by',
	'asset_versions.replaces_version',
	'asset_versions.sanitized_output_sha256',
	'asset_versions.input_hash',
	'asset_versions.user_created',
	'asset_usages.asset_record',
	'asset_usages.resolved_version',
	'asset_usages.scan_run_id',
	'asset_usages.last_seen_manifest_sha256',
	'asset_usages.confidence',
	'asset_usages.consumer_type',
	'asset_usages.active',
	'asset_releases.manifest_sha256',
	'asset_releases.target_environment',
	'asset_releases.status',
	'asset_releases.repo_sha',
	'asset_releases.content_export_sha256',
	'asset_releases.expected_manifest_sha256',
	'asset_releases.toolchain_signature',
	'asset_releases.expected_live_release',
	'asset_releases.lease_expires_at',
	'asset_releases.previous_release',
	'asset_releases.rollback_of',
	'asset_releases.user_created',
]);

function payload(step: SchemaStep): Payload {
	return step.payload as Payload;
}

function collectionPayload(plan: readonly SchemaStep[], collection: string): Payload {
	const step = plan.find((candidate) => candidate.kind === 'collection' && candidate.target === collection);
	if (!step) throw new Error(`Missing collection step: ${collection}`);
	return payload(step);
}

function fieldPayload(plan: readonly SchemaStep[], collection: string, field: string): Payload {
	const collectionField = (collectionPayload(plan, collection).fields as Payload[]).find(
		(candidate) => candidate.field === field,
	);
	if (collectionField) return collectionField;

	const step = plan.find(
		(candidate) => candidate.kind === 'field' && candidate.target === `${collection}.${field}`,
	);
	if (!step) throw new Error(`Missing field step: ${collection}.${field}`);
	return payload(step);
}

function fieldNames(plan: readonly SchemaStep[], collection: string): string[] {
	const initial = (collectionPayload(plan, collection).fields as Payload[]).map((field) => field.field);
	const later = plan
		.filter((step) => step.kind === 'field' && step.path === `/fields/${collection}`)
		.map((step) => payload(step).field);
	return [...initial, ...later].sort();
}

function choiceValues(field: Payload): string[] {
	return field.meta.options.choices.map((choice: { value: string }) => choice.value);
}

function regexValue(field: Payload): string {
	return field.meta.validation._and[0][field.field]._regex;
}

function relationPayload(plan: readonly SchemaStep[], collection: string, field: string): Payload {
	const step = plan.find(
		(candidate) =>
			candidate.kind === 'relation' &&
			payload(candidate).collection === collection &&
			payload(candidate).field === field,
	);
	if (!step) throw new Error(`Missing relation: ${collection}.${field}`);
	return payload(step);
}

describe('setup-asset-registry-schema dry-run plan', () => {
	it('imports and builds a deterministic dry-run plan without network access', () => {
		expect(importFetchCalls).toBe(0);
		expect(parseFlags(['--dry-run'])).toEqual({ apply: false });
		expect(buildAssetRegistryPlan()).toEqual(buildAssetRegistryPlan());
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it('creates the five registry collections in the exact order and metadata group', () => {
		const plan = buildAssetRegistryPlan();
		const collections = plan.filter((step) => step.kind === 'collection');
		expect(collections.map((step) => step.target)).toEqual([
			'asset_records',
			'asset_records_translations',
			'asset_versions',
			'asset_usages',
			'asset_releases',
		]);

		expect(
			collections.map((step) => {
				const meta = payload(step).meta;
				return {
					accountability: meta.accountability,
					group: meta.group,
					singleton: meta.singleton,
					versioning: meta.versioning,
				};
			}),
		).toEqual(
			Array.from({ length: 5 }, () => ({
				accountability: 'all',
				group: 'brand_assets',
				singleton: false,
				versioning: false,
			})),
		);
		expect(
			collections.map((step) => ({
				target: step.target,
				icon: payload(step).meta.icon,
				display: payload(step).meta.display_template,
			})),
		).toEqual([
			{ target: 'asset_records', icon: 'inventory_2', display: '{{semantic_key}} — {{title}}' },
			{
				target: 'asset_records_translations',
				icon: 'translate',
				display: '{{languages_code}}',
			},
			{
				target: 'asset_versions',
				icon: 'history',
				display: '{{asset_record.semantic_key}} · v{{version_number}}',
			},
			{
				target: 'asset_usages',
				icon: 'account_tree',
				display: '{{consumer_type}} · {{consumer_key}}',
			},
			{ target: 'asset_releases', icon: 'deployed_code_history', display: '{{release_key}}' },
		]);
		expect(collectionPayload(plan, 'asset_records').meta.sort).toBe(4);
		expect(collectionPayload(plan, 'asset_versions').meta.sort).toBe(5);
		expect(collectionPayload(plan, 'asset_usages').meta.sort).toBe(6);
		expect(collectionPayload(plan, 'asset_releases').meta.sort).toBe(7);
		expect(collections.map((step) => payload(step).meta.hidden)).toEqual([
			false,
			true,
			false,
			false,
			false,
		]);
	});

	it('contains every approved field exactly once and no extra fields', () => {
		const plan = buildAssetRegistryPlan();
		for (const [collection, fields] of Object.entries(EXPECTED_FIELDS)) {
			expect(fieldNames(plan, collection)).toEqual([...fields].sort());
		}
	});

	it('uses the exact approved Directus field types and lengths', () => {
		const plan = buildAssetRegistryPlan();
		const expectedFieldCount = Object.values(EXPECTED_FIELDS).reduce(
			(total, fields) => total + fields.length,
			0,
		);
		expect(Object.values(EXPECTED_TYPES).flat()).toHaveLength(expectedFieldCount);
		for (const [type, targets] of Object.entries(EXPECTED_TYPES)) {
			for (const target of targets) {
				const separator = target.indexOf('.');
				const collection = target.slice(0, separator);
				const field = target.slice(separator + 1);
				expect(fieldPayload(plan, collection, field).type).toBe(type);
			}
		}

		for (const [collection, field, maxLength] of [
			['asset_records', 'semantic_key', 160],
			['asset_records', 'title', 255],
			['asset_records', 'code_component_key', 255],
			['asset_records', 'owner_key', 255],
			['asset_versions', 'mime_type', 127],
			['asset_versions', 'format', 32],
			['asset_usages', 'id', 64],
			['asset_usages', 'scan_run_id', 255],
			['asset_usages', 'consumer_key', 255],
			['asset_usages', 'source_file', 1024],
			['asset_usages', 'cms_field', 512],
			['asset_usages', 'route', 2048],
			['asset_usages', 'locale', 35],
			['asset_usages', 'slot', 255],
			['asset_releases', 'release_key', 160],
			['asset_releases', 'lease_owner', 255],
			['asset_releases', 'build_ref', 512],
			['asset_releases', 'deploy_ref', 512],
		] as const) {
			expect(fieldPayload(plan, collection, field).schema.max_length).toBe(maxLength);
		}
	});

	it('uses the shared asset enums and validation patterns verbatim', () => {
		const plan = buildAssetRegistryPlan();
		expect(choiceValues(fieldPayload(plan, 'asset_records', 'kind'))).toEqual([...ASSET_KINDS]);
		expect(choiceValues(fieldPayload(plan, 'asset_records', 'role'))).toEqual([...ASSET_ROLES]);
		expect(choiceValues(fieldPayload(plan, 'asset_records', 'delivery_mode'))).toEqual([
			...ASSET_DELIVERY_MODES,
		]);
		expect(choiceValues(fieldPayload(plan, 'asset_usages', 'delivery_mode'))).toEqual([
			...ASSET_DELIVERY_MODES,
		]);
		expect(regexValue(fieldPayload(plan, 'asset_records', 'semantic_key'))).toBe(
			ASSET_SEMANTIC_KEY_PATTERN.source,
		);
		for (const [collection, field] of [
			['asset_usages', 'id'],
			['asset_versions', 'sha256'],
			['asset_versions', 'source_hash'],
			['asset_versions', 'transform_signature'],
			['asset_versions', 'sanitizer_signature'],
			['asset_versions', 'generator_signature'],
			['asset_versions', 'toolchain_signature'],
			['asset_versions', 'sanitized_output_sha256'],
			['asset_versions', 'input_hash'],
			['asset_usages', 'last_seen_manifest_sha256'],
			['asset_releases', 'manifest_sha256'],
			['asset_releases', 'repo_sha'],
			['asset_releases', 'content_export_sha256'],
			['asset_releases', 'expected_manifest_sha256'],
			['asset_releases', 'toolchain_signature'],
			['asset_releases', 'idempotency_key'],
		] as const) {
			expect(regexValue(fieldPayload(plan, collection, field))).toBe(SHA256_HEX_PATTERN.source);
		}
	});

	it('encodes every approved select choice list', () => {
		const plan = buildAssetRegistryPlan();
		const expected: Record<string, readonly string[]> = {
			'asset_records.lifecycle_status': [
				'draft',
				'candidate',
				'ready',
				'approved',
				'live',
				'superseded',
				'deprecated',
				'quarantined',
			],
			'asset_records.owner_type': [
				'site',
				'route',
				'service',
				'project',
				'blog',
				'page-block',
				'component',
			],
			'asset_records.locale_policy': ['global', 'localized', 'usage-supplied'],
			'asset_records.alt_mode': ['decorative', 'informative', 'usage-supplied'],
			'asset_records.aspect_ratio_mode': ['any', 'exact'],
			'asset_records.brand_status': [
				'unreviewed',
				'approved',
				'third-party-original',
				'restricted',
				'deprecated',
			],
			'asset_versions.source_mode': ['upload', 'generated', 'migrated', 'code-component'],
			'asset_versions.approval_status': [
				'uploaded',
				'validating',
				'valid',
				'rejected',
				'approved',
				'promoted',
				'superseded',
			],
			'asset_usages.confidence': [
				'exact-static',
				'resolved-generated',
				'declared-dynamic',
				'unknown',
			],
			'asset_usages.consumer_type': [
				'site',
				'route',
				'service',
				'project',
				'blog',
				'page-block',
				'component',
				'style',
				'system',
			],
			'asset_usages.source_kind': ['repository', 'generated', 'cms', 'route', 'declaration'],
			'asset_releases.source_environment': ['dev'],
			'asset_releases.target_environment': ['dev', 'prod'],
			'asset_releases.status': [
				'draft',
				'validating',
				'ready',
				'promoting',
				'deployed-pending-verification',
				'live',
				'failed',
				'superseded',
				'rolled-back',
			],
		};
		for (const [target, values] of Object.entries(expected)) {
			const separator = target.indexOf('.');
			expect(choiceValues(fieldPayload(plan, target.slice(0, separator), target.slice(separator + 1)))).toEqual(
				values,
			);
		}
	});

	it('encodes approved defaults, nullability, numeric bounds, and primary keys', () => {
		const plan = buildAssetRegistryPlan();
		const schema = (collection: string, field: string) => fieldPayload(plan, collection, field).schema;

		expect(schema('asset_records', 'id')).toEqual({ is_primary_key: true, is_unique: true });
		expect(fieldPayload(plan, 'asset_records', 'id').meta.special).toEqual(['uuid']);
		expect(fieldPayload(plan, 'asset_records', 'id').meta).toMatchObject({ hidden: true, readonly: true });
		expect(schema('asset_versions', 'id')).toEqual({ is_primary_key: true, is_unique: true });
		expect(schema('asset_releases', 'id')).toEqual({ is_primary_key: true, is_unique: true });
		expect(schema('asset_records_translations', 'id')).toEqual({
			is_primary_key: true,
			has_auto_increment: true,
		});
		expect(schema('asset_usages', 'id')).toMatchObject({
			is_primary_key: true,
			is_unique: true,
			is_nullable: false,
			max_length: 64,
		});
		expect(fieldPayload(plan, 'asset_usages', 'id').meta).toMatchObject({ hidden: true, readonly: true });

		expect(schema('asset_records', 'lifecycle_status')).toMatchObject({
			default_value: 'draft',
			is_nullable: false,
		});
		expect(schema('asset_records', 'locale_policy')).toMatchObject({
			default_value: 'global',
			is_nullable: false,
		});
		expect(schema('asset_records', 'alt_mode')).toMatchObject({
			default_value: null,
			is_nullable: false,
		});
		expect(schema('asset_records', 'aspect_ratio_mode')).toMatchObject({
			default_value: 'any',
			is_nullable: false,
		});
		expect(schema('asset_records', 'brand_status')).toMatchObject({
			default_value: 'unreviewed',
			is_nullable: false,
		});
		expect(schema('asset_versions', 'approval_status')).toMatchObject({
			default_value: 'uploaded',
			is_nullable: false,
		});
		expect(schema('asset_usages', 'required')).toMatchObject({
			default_value: null,
			is_nullable: false,
		});
		expect(schema('asset_usages', 'active')).toMatchObject({
			default_value: true,
			is_nullable: false,
		});
		expect(schema('asset_releases', 'schema_version')).toMatchObject({
			default_value: 1,
			is_nullable: false,
		});
		expect(schema('asset_releases', 'source_environment')).toMatchObject({
			default_value: 'dev',
			is_nullable: false,
		});
		expect(schema('asset_releases', 'status')).toMatchObject({
			default_value: 'draft',
			is_nullable: false,
		});

		for (const [collection, field] of [
			['asset_records', 'aspect_ratio_width'],
			['asset_records', 'aspect_ratio_height'],
			['asset_versions', 'version_number'],
			['asset_usages', 'source_line'],
		] as const) {
			expect(fieldPayload(plan, collection, field).meta.validation).toEqual({
				_and: [{ [field]: { _gt: 0 } }],
			});
		}
		for (const [collection, field] of [
			['asset_records', 'max_bytes'],
			['asset_versions', 'bytes'],
			['asset_versions', 'width'],
			['asset_versions', 'height'],
			['asset_versions', 'duration_ms'],
		] as const) {
			expect(fieldPayload(plan, collection, field).meta.validation).toEqual({
				_and: [{ [field]: { _gte: 0 } }],
			});
		}
	});

	it('sets required, nullable, and indexed schema flags exactly', () => {
		const plan = buildAssetRegistryPlan();
		for (const [collection, fields] of Object.entries(EXPECTED_FIELDS)) {
			for (const field of fields) {
				const definition = fieldPayload(plan, collection, field);
				const target = `${collection}.${field}`;
				if (definition.type === 'alias' || definition.schema?.is_primary_key) continue;
				expect(definition.schema.is_nullable).toBe(!REQUIRED_FIELDS.has(target));
				if (REQUIRED_FIELDS.has(target)) expect(definition.meta.required).toBe(true);
				expect(definition.schema.is_indexed === true).toBe(INDEXED_FIELDS.has(target));
			}
		}
	});

	it('uses editor-safe aliases and standard readonly accountability fields', () => {
		const plan = buildAssetRegistryPlan();
		for (const target of EXPECTED_TYPES.json) {
			const separator = target.indexOf('.');
			expect(fieldPayload(plan, target.slice(0, separator), target.slice(separator + 1)).meta.special).toEqual([
				'cast-json',
			]);
		}
		expect(fieldPayload(plan, 'asset_records', 'translations')).toMatchObject({
			type: 'alias',
			meta: { interface: 'translations', special: ['translations'] },
			schema: null,
		});
		for (const field of ['versions', 'usages']) {
			expect(fieldPayload(plan, 'asset_records', field)).toMatchObject({
				type: 'alias',
				meta: { interface: 'list-o2m', readonly: true, special: ['o2m'] },
				schema: null,
			});
		}

		const systemFields = [
			['asset_records', 'date_created', 'date-created'],
			['asset_records', 'date_updated', 'date-updated'],
			['asset_records', 'user_created', 'user-created'],
			['asset_records', 'user_updated', 'user-updated'],
			['asset_versions', 'date_created', 'date-created'],
			['asset_versions', 'user_created', 'user-created'],
			['asset_usages', 'date_updated', 'date-updated'],
			['asset_releases', 'date_created', 'date-created'],
			['asset_releases', 'date_updated', 'date-updated'],
			['asset_releases', 'user_created', 'user-created'],
		] as const;
		for (const [collection, field, special] of systemFields) {
			expect(fieldPayload(plan, collection, field).meta).toMatchObject({
				hidden: true,
				readonly: true,
				special: [special],
			});
		}
	});

	it('limits uniqueness to the three approved domain fields plus primary keys', () => {
		const plan = buildAssetRegistryPlan();
		const uniqueDomainFields = Object.keys(EXPECTED_FIELDS).flatMap((collection) =>
			EXPECTED_FIELDS[collection]!
				.filter((field) => !fieldPayload(plan, collection, field).schema?.is_primary_key)
				.filter((field) => fieldPayload(plan, collection, field).schema?.is_unique === true)
				.map((field) => `${collection}.${field}`),
		);
		expect(uniqueDomainFields).toEqual([
			'asset_records.semantic_key',
			'asset_releases.release_key',
			'asset_releases.idempotency_key',
		]);
		expect(fieldPayload(plan, 'asset_releases', 'manifest_sha256').schema.is_unique).toBe(false);
	});

	it('creates fields only after collections and relations only after fields', () => {
		const phases = buildAssetRegistryPlan().map((step) => step.kind);
		const lastCollection = phases.lastIndexOf('collection');
		const firstField = phases.indexOf('field');
		const lastField = phases.lastIndexOf('field');
		const firstRelation = phases.indexOf('relation');
		expect(lastCollection).toBeLessThan(firstField);
		expect(lastField).toBeLessThan(firstRelation);
		expect(new Set(phases)).toEqual(new Set(['collection', 'field', 'relation']));
	});

	it('uses the exact relation targets, reverse aliases, and delete rules', () => {
		const plan = buildAssetRegistryPlan();
		const expected = [
			['asset_records', 'candidate_version', 'asset_versions', 'SET NULL'],
			['asset_records', 'approved_version', 'asset_versions', 'SET NULL'],
			['asset_records_translations', 'asset_records_id', 'asset_records', 'CASCADE'],
			['asset_records_translations', 'languages_code', 'languages', 'CASCADE'],
			['asset_versions', 'asset_record', 'asset_records', 'RESTRICT'],
			['asset_versions', 'directus_file', 'directus_files', 'RESTRICT'],
			['asset_versions', 'replaces_version', 'asset_versions', 'RESTRICT'],
			['asset_versions', 'user_created', 'directus_users', 'SET NULL'],
			['asset_versions', 'approved_by', 'directus_users', 'SET NULL'],
			['asset_usages', 'asset_record', 'asset_records', 'RESTRICT'],
			['asset_usages', 'resolved_version', 'asset_versions', 'RESTRICT'],
			['asset_releases', 'expected_live_release', 'asset_releases', 'RESTRICT'],
			['asset_releases', 'previous_release', 'asset_releases', 'RESTRICT'],
			['asset_releases', 'rollback_of', 'asset_releases', 'RESTRICT'],
			['asset_records', 'user_created', 'directus_users', 'SET NULL'],
			['asset_records', 'user_updated', 'directus_users', 'SET NULL'],
			['asset_releases', 'user_created', 'directus_users', 'SET NULL'],
		] as const;

		expect(plan.filter((step) => step.kind === 'relation')).toHaveLength(expected.length);
		for (const [collection, field, relatedCollection, onDelete] of expected) {
			const relation = relationPayload(plan, collection, field);
			expect(relation.related_collection).toBe(relatedCollection);
			expect(relation.schema.on_delete).toBe(onDelete);
		}

		expect(relationPayload(plan, 'asset_records_translations', 'asset_records_id').meta).toMatchObject({
			one_field: 'translations',
			junction_field: 'languages_code',
		});
		expect(relationPayload(plan, 'asset_records_translations', 'languages_code').meta).toMatchObject({
			junction_field: 'asset_records_id',
		});
		expect(relationPayload(plan, 'asset_versions', 'asset_record').meta.one_field).toBe('versions');
		expect(relationPayload(plan, 'asset_usages', 'asset_record').meta.one_field).toBe('usages');
	});

	it('parses only one explicit mode flag', () => {
		expect(parseFlags([])).toEqual({ apply: false });
		expect(parseFlags(['--dry-run'])).toEqual({ apply: false });
		expect(parseFlags(['--apply'])).toEqual({ apply: true });
		for (const argv of [
			['--wat'],
			['--apply', '--dry-run'],
			['--apply', '--apply'],
			['--dry-run', '--dry-run'],
		]) {
			expect(() => parseFlags(argv)).toThrow();
		}
	});

	it('keeps the CLI dry-run free of network and credential access', async () => {
		let fetchCalls = 0;
		let tokenCalls = 0;
		let requestCalls = 0;
		globalThis.fetch = (async () => {
			fetchCalls += 1;
			throw new Error('dry-run must not fetch');
		}) as typeof fetch;
		try {
			const result = await runAssetRegistryCli(['--dry-run'], {
				resolveUrl: () => 'https://cms.dev.yesid.dev',
				getToken: async () => {
					tokenCalls += 1;
					return 'x';
				},
				request: (async () => {
					requestCalls += 1;
					return { status: 204, json: null };
				}) as typeof import('../scripts/lib/schema-apply').rest,
				logger: { info: () => undefined },
			});
			expect(result).toEqual({ mode: 'dry-run', planLength: buildAssetRegistryPlan().length });
			expect({ fetchCalls, tokenCalls, requestCalls }).toEqual({
				fetchCalls: 0,
				tokenCalls: 0,
				requestCalls: 0,
			});
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('uses an admin-only token path for explicit DEV apply', async () => {
		let tokenOptions: unknown;
		const result = await runAssetRegistryCli(['--apply'], {
			resolveUrl: () => 'https://cms.dev.yesid.dev',
			getToken: async (_url, options) => {
				tokenOptions = options;
				return 'admin';
			},
			request: (async () => ({ status: 204, json: null })) as typeof import('../scripts/lib/schema-apply').rest,
			logger: { info: () => undefined },
		});
		expect(tokenOptions).toEqual({ allowBuildToken: false });
		expect(result).toEqual({
			mode: 'apply',
			planLength: buildAssetRegistryPlan().length,
			result: { created: buildAssetRegistryPlan().length, existing: 0, failed: 0 },
		});
	});

	it('guards DEV before the first request', async () => {
		let requests = 0;
		const request = (async () => {
			requests += 1;
			return { status: 204, json: null };
		}) as typeof import('../scripts/lib/schema-apply').rest;

		await expect(
			applyAssetRegistryPlan(buildAssetRegistryPlan(), { directusUrl: 'https://cms.yesid.dev', token: 'x' }, request),
		).rejects.toThrow(/Refusing non-dev CMS/);
		expect(requests).toBe(0);
	});

	it('counts successful and idempotent applies and throws on every other error', async () => {
		const plan = buildAssetRegistryPlan().slice(0, 3);
		const created = await applyAssetRegistryPlan(
			plan,
			{ directusUrl: 'https://cms.dev.yesid.dev', token: 'x' },
			(async () => ({ status: 204, json: null })) as typeof import('../scripts/lib/schema-apply').rest,
		);
		expect(created).toEqual({ created: 3, existing: 0, failed: 0 });

		const alreadyExists = (async () => ({
			status: 400,
			json: { errors: [{ extensions: { code: 'RECORD_NOT_UNIQUE' } }] },
		})) as typeof import('../scripts/lib/schema-apply').rest;
		expect(
			await applyAssetRegistryPlan(plan, { directusUrl: 'https://cms.dev.yesid.dev', token: 'x' }, alreadyExists),
		).toEqual({ created: 0, existing: 3, failed: 0 });

		const fatal = (async () => ({
			status: 403,
			json: { errors: [{ message: 'forbidden' }] },
		})) as typeof import('../scripts/lib/schema-apply').rest;
		await expect(
			applyAssetRegistryPlan(plan, { directusUrl: 'https://cms.dev.yesid.dev', token: 'x' }, fatal),
		).rejects.toThrow(/failed \(403\)/);

		const unrecognizedConflict = (async () => ({
			status: 409,
			json: { errors: [{ message: 'different conflict' }] },
		})) as typeof import('../scripts/lib/schema-apply').rest;
		await expect(
			applyAssetRegistryPlan(
				plan,
				{ directusUrl: 'https://cms.dev.yesid.dev', token: 'x' },
				unrecognizedConflict,
			),
		).rejects.toThrow(/failed \(409\)/);
	});

	it('converges on a second simulated apply where every step already exists', async () => {
		const plan = buildAssetRegistryPlan();
		let pass = 0;
		const request = (async () => {
			pass += 1;
			if (pass <= plan.length) return { status: 204, json: null };
			return {
				status: 409,
				json: { errors: [{ message: 'field already exists' }] },
			};
		}) as typeof import('../scripts/lib/schema-apply').rest;

		expect(
			await applyAssetRegistryPlan(plan, { directusUrl: 'https://cms.dev.yesid.dev', token: 'x' }, request),
		).toEqual({ created: plan.length, existing: 0, failed: 0 });
		expect(
			await applyAssetRegistryPlan(plan, { directusUrl: 'https://cms.dev.yesid.dev', token: 'x' }, request),
		).toEqual({ created: 0, existing: plan.length, failed: 0 });
	});
});
