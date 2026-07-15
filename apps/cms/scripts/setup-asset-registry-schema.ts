#!/usr/bin/env bun
/**
 * Defines the DEV asset-registry schema without moving or publishing assets.
 * Dry-run is the default; --apply is the only mutating mode.
 */

import {
	ASSET_DELIVERY_MODES,
	ASSET_KINDS,
	ASSET_ROLES,
	ASSET_SEMANTIC_KEY_PATTERN,
	SHA256_HEX_PATTERN,
} from '@repo/shared';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import {
	type ApplyContext,
	type SchemaStep,
	isAlreadyExists,
	rest,
} from './lib/schema-apply';
import { assertDevCms, defaultDirectusUrl } from './lib/sdk';

export type { SchemaStep, SchemaStepKind } from './lib/schema-apply';

type FieldPayload = Record<string, any>;

interface FieldOptions {
	interface?: string;
	width?: 'half' | 'full';
	required?: boolean;
	readonly?: boolean;
	hidden?: boolean;
	indexed?: boolean;
	unique?: boolean;
	maxLength?: number;
	defaultValue?: unknown;
	validation?: Record<string, unknown>;
	special?: readonly string[];
	options?: Record<string, unknown>;
	display?: string;
	displayOptions?: Record<string, unknown>;
	note?: string;
	schema?: Record<string, unknown>;
}

interface AssetRegistryCliDependencies {
	resolveUrl?: () => string;
	getToken?: typeof getAdminToken;
	request?: typeof rest;
	logger?: { info(message: string): unknown };
}

const log = createLogger('asset-registry-schema');

function humanize(value: string): string {
	return value
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function choices(values: readonly string[]) {
	return values.map((value) => ({ text: humanize(value), value }));
}

function validation(field: string, rule: Record<string, unknown>): Record<string, unknown> {
	return { _and: [{ [field]: rule }] };
}

function standardField(
	field: string,
	type: string,
	sort: number,
	options: FieldOptions = {},
): FieldPayload {
	const meta: Record<string, unknown> = {
		interface: options.interface ?? 'input',
		sort,
		width: options.width ?? 'half',
	};
	if (options.required) meta.required = true;
	if (options.readonly) meta.readonly = true;
	if (options.hidden) meta.hidden = true;
	if (options.validation) meta.validation = options.validation;
	if (options.special) meta.special = [...options.special];
	if (options.options) meta.options = options.options;
	if (options.display) meta.display = options.display;
	if (options.displayOptions) meta.display_options = options.displayOptions;
	if (options.note) meta.note = options.note;

	const schema: Record<string, unknown> = {
		default_value: options.defaultValue ?? null,
		is_nullable: !options.required,
		is_unique: options.unique ?? false,
		is_indexed: options.indexed ?? false,
		...options.schema,
	};
	if (options.maxLength !== undefined) schema.max_length = options.maxLength;

	return { field, type, meta, schema };
}

function selectField(
	field: string,
	sort: number,
	values: readonly string[],
	options: Omit<FieldOptions, 'interface' | 'options'> = {},
): FieldPayload {
	return standardField(field, 'string', sort, {
		...options,
		interface: 'select-dropdown',
		options: { choices: choices(values) },
	});
}

function textField(
	field: string,
	sort: number,
	options: Omit<FieldOptions, 'interface'> = {},
): FieldPayload {
	return standardField(field, 'text', sort, {
		...options,
		interface: 'input-multiline',
		width: options.width ?? 'full',
	});
}

function jsonField(
	field: string,
	sort: number,
	options: Omit<FieldOptions, 'interface' | 'options'> = {},
): FieldPayload {
	return standardField(field, 'json', sort, {
		...options,
		interface: 'input-code',
		options: { language: 'json' },
		special: ['cast-json'],
		width: options.width ?? 'full',
	});
}

function integerField(
	field: string,
	sort: number,
	bound: 'positive' | 'non-negative' | null,
	options: Omit<FieldOptions, 'interface' | 'validation'> = {},
): FieldPayload {
	return standardField(field, 'integer', sort, {
		...options,
		interface: 'input',
		validation:
			bound === 'positive'
				? validation(field, { _gt: 0 })
				: bound === 'non-negative'
					? validation(field, { _gte: 0 })
					: undefined,
	});
}

function hashField(
	field: string,
	sort: number,
	options: Omit<FieldOptions, 'interface' | 'maxLength' | 'validation'> = {},
): FieldPayload {
	return standardField(field, 'string', sort, {
		...options,
		interface: 'input',
		maxLength: 64,
		validation: validation(field, { _regex: SHA256_HEX_PATTERN.source }),
	});
}

function relationField(
	field: string,
	sort: number,
	relatedCollection: string,
	options: Omit<FieldOptions, 'interface' | 'special' | 'schema'> & {
		schema?: Record<string, unknown>;
	} = {},
): FieldPayload {
	return standardField(field, 'uuid', sort, {
		...options,
		interface: 'select-dropdown-m2o',
		special: ['m2o'],
		display: 'related-values',
		displayOptions: { template: '{{id}}' },
		schema: {
			foreign_key_table: relatedCollection,
			foreign_key_column: 'id',
			...options.schema,
		},
	});
}

function aliasField(
	field: string,
	sort: number,
	interfaceName: 'translations' | 'list-o2m',
	special: 'translations' | 'o2m',
	readonly = false,
): FieldPayload {
	return {
		field,
		type: 'alias',
		meta: {
			interface: interfaceName,
			readonly,
			sort,
			special: [special],
			width: 'full',
			...(interfaceName === 'translations' ? { options: { languageField: 'name' } } : {}),
		},
		schema: null,
	};
}

function systemDateField(field: 'date_created' | 'date_updated', sort: number): FieldPayload {
	const special = field === 'date_created' ? 'date-created' : 'date-updated';
	return standardField(field, 'timestamp', sort, {
		interface: 'datetime',
		hidden: true,
		readonly: true,
		special: [special],
		width: 'half',
	});
}

function systemUserField(
	field: 'user_created' | 'user_updated',
	sort: number,
): FieldPayload {
	const special = field === 'user_created' ? 'user-created' : 'user-updated';
	return standardField(field, 'uuid', sort, {
		interface: 'select-dropdown-m2o',
		hidden: true,
		readonly: true,
		indexed: true,
		special: [special],
		schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' },
	});
}

function uuidPkField(): FieldPayload {
	return {
		field: 'id',
		type: 'uuid',
		meta: { hidden: true, readonly: true, special: ['uuid'] },
		schema: { is_primary_key: true, is_unique: true },
	};
}

function autoincrementPkField(): FieldPayload {
	return {
		field: 'id',
		type: 'integer',
		meta: { hidden: true, readonly: true },
		schema: { is_primary_key: true, has_auto_increment: true },
	};
}

function usagePkField(): FieldPayload {
	return {
		field: 'id',
		type: 'string',
		meta: {
			hidden: true,
			readonly: true,
			validation: validation('id', { _regex: SHA256_HEX_PATTERN.source }),
		},
		schema: {
			default_value: null,
			is_nullable: false,
			is_primary_key: true,
			is_unique: true,
			is_indexed: false,
			max_length: 64,
		},
	};
}

function collectionStep(
	collection: string,
	metadata: {
		hidden: boolean;
		icon: string;
		displayTemplate: string;
		sort?: number;
		note: string;
	},
	primaryKey: FieldPayload,
): SchemaStep {
	return {
		kind: 'collection',
		target: collection,
		method: 'POST',
		path: '/collections',
		payload: {
			collection,
			meta: {
				accountability: 'all',
				collapse: 'open',
				display_template: metadata.displayTemplate,
				group: 'brand_assets',
				hidden: metadata.hidden,
				icon: metadata.icon,
				note: metadata.note,
				singleton: false,
				...(metadata.sort === undefined ? {} : { sort: metadata.sort }),
				versioning: false,
			},
			schema: {},
			fields: [primaryKey],
		},
	};
}

function fieldStep(collection: string, field: FieldPayload): SchemaStep {
	return {
		kind: 'field',
		target: `${collection}.${field.field}`,
		method: 'POST',
		path: `/fields/${collection}`,
		payload: field,
	};
}

function relationStep(
	collection: string,
	field: string,
	relatedCollection: string,
	onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL',
	meta: Record<string, unknown> = {},
): SchemaStep {
	return {
		kind: 'relation',
		target: `${collection}.${field} -> ${relatedCollection}`,
		method: 'POST',
		path: '/relations',
		payload: {
			collection,
			field,
			related_collection: relatedCollection,
			meta: { one_field: null, one_deselect_action: 'nullify', ...meta },
			schema: { on_delete: onDelete },
		},
	};
}

function assetRecordFields(): FieldPayload[] {
	return [
		standardField('semantic_key', 'string', 2, {
			required: true,
			unique: true,
			maxLength: 160,
			validation: validation('semantic_key', { _regex: ASSET_SEMANTIC_KEY_PATTERN.source }),
			note: 'Stable three-to-five segment key used by code, CMS, and release manifests.',
			width: 'full',
		}),
		standardField('title', 'string', 3, { required: true, maxLength: 255, width: 'full' }),
		textField('meaning', 4),
		selectField('kind', 5, ASSET_KINDS, { required: true, indexed: true }),
		selectField('role', 6, ASSET_ROLES, { required: true, indexed: true }),
		selectField(
			'lifecycle_status',
			7,
			['draft', 'candidate', 'ready', 'approved', 'live', 'superseded', 'deprecated', 'quarantined'],
			{ required: true, indexed: true, defaultValue: 'draft' },
		),
		standardField('code_component_key', 'string', 8, { maxLength: 255, width: 'full' }),
		selectField(
			'owner_type',
			9,
			['site', 'route', 'service', 'project', 'blog', 'page-block', 'component'],
			{ required: true, indexed: true },
		),
		standardField('owner_key', 'string', 10, {
			required: true,
			indexed: true,
			maxLength: 255,
			width: 'full',
		}),
		selectField('locale_policy', 11, ['global', 'localized', 'usage-supplied'], {
			required: true,
			defaultValue: 'global',
		}),
		selectField('alt_mode', 12, ['decorative', 'informative', 'usage-supplied'], {
			required: true,
		}),
		selectField('aspect_ratio_mode', 13, ['any', 'exact'], {
			required: true,
			defaultValue: 'any',
		}),
		integerField('aspect_ratio_width', 14, 'positive'),
		integerField('aspect_ratio_height', 15, 'positive'),
		jsonField('allowed_mime_families', 16),
		standardField('transform_profile', 'string', 17, { maxLength: 255, width: 'full' }),
		selectField('delivery_mode', 18, ASSET_DELIVERY_MODES, { required: true, width: 'full' }),
		standardField('focal_point_x', 'decimal', 19, {
			validation: validation('focal_point_x', { _gte: 0, _lte: 1 }),
		}),
		standardField('focal_point_y', 'decimal', 20, {
			validation: validation('focal_point_y', { _gte: 0, _lte: 1 }),
		}),
		integerField('max_bytes', 21, 'non-negative'),
		selectField(
			'brand_status',
			22,
			['unreviewed', 'approved', 'third-party-original', 'restricted', 'deprecated'],
			{ required: true, indexed: true, defaultValue: 'unreviewed' },
		),
		jsonField('approved_token_slots', 23),
		relationField('candidate_version', 24, 'asset_versions', { indexed: true }),
		relationField('approved_version', 25, 'asset_versions', { indexed: true }),
		aliasField('translations', 26, 'translations', 'translations'),
		aliasField('versions', 27, 'list-o2m', 'o2m', true),
		aliasField('usages', 28, 'list-o2m', 'o2m', true),
		systemDateField('date_created', 29),
		systemDateField('date_updated', 30),
		systemUserField('user_created', 31),
		systemUserField('user_updated', 32),
	];
}

function translationFields(): FieldPayload[] {
	return [
		standardField('asset_records_id', 'uuid', 2, {
			hidden: true,
			indexed: true,
			schema: { foreign_key_table: 'asset_records', foreign_key_column: 'id' },
		}),
		standardField('languages_code', 'string', 3, {
			hidden: true,
			indexed: true,
			maxLength: 255,
			schema: { foreign_key_table: 'languages', foreign_key_column: 'code' },
		}),
		textField('alt_text', 4),
		textField('caption', 5),
		textField('credit', 6),
		textField('og_image_alt', 7),
	];
}

function assetVersionFields(): FieldPayload[] {
	return [
		relationField('asset_record', 2, 'asset_records', { required: true, indexed: true }),
		integerField('version_number', 3, 'positive', { required: true, indexed: true }),
		selectField('source_mode', 4, ['upload', 'generated', 'migrated', 'code-component'], {
			required: true,
		}),
		standardField('directus_file', 'uuid', 5, {
			interface: 'file',
			indexed: true,
			special: ['file'],
			schema: { foreign_key_table: 'directus_files', foreign_key_column: 'id' },
		}),
		standardField('component_key', 'string', 6, { maxLength: 255, width: 'full' }),
		hashField('sha256', 7, { required: true, indexed: true, width: 'full' }),
		standardField('mime_type', 'string', 8, { maxLength: 127 }),
		standardField('format', 'string', 9, { maxLength: 32 }),
		integerField('bytes', 10, 'non-negative'),
		integerField('width', 11, 'non-negative'),
		integerField('height', 12, 'non-negative'),
		integerField('duration_ms', 13, 'non-negative'),
		standardField('orientation', 'string', 14, { maxLength: 255 }),
		standardField('color_profile', 'string', 15, { maxLength: 255 }),
		standardField('is_animated', 'boolean', 16, { interface: 'boolean' }),
		hashField('source_hash', 17, { indexed: true, width: 'full' }),
		jsonField('dependency_hashes', 18),
		standardField('transform_profile', 'string', 19, { maxLength: 255, width: 'full' }),
		hashField('transform_signature', 20, { indexed: true, width: 'full' }),
		hashField('sanitizer_signature', 21, { indexed: true, width: 'full' }),
		hashField('generator_signature', 22, { indexed: true, width: 'full' }),
		hashField('toolchain_signature', 23, { indexed: true, width: 'full' }),
		selectField(
			'approval_status',
			24,
			['uploaded', 'validating', 'valid', 'rejected', 'approved', 'promoted', 'superseded'],
			{ required: true, indexed: true, defaultValue: 'uploaded' },
		),
		relationField('approved_by', 25, 'directus_users', { indexed: true }),
		standardField('approved_at', 'timestamp', 26, { interface: 'datetime' }),
		relationField('replaces_version', 27, 'asset_versions', { indexed: true }),
		textField('replacement_reason', 28),
		standardField('promotion_request_id', 'string', 29, { maxLength: 255, width: 'full' }),
		textField('quarantine_reason', 30),
		hashField('sanitized_output_sha256', 31, { indexed: true, width: 'full' }),
		hashField('input_hash', 32, { indexed: true, width: 'full' }),
		jsonField('brand_slots', 33),
		standardField('svg_id_prefix', 'string', 34, { maxLength: 255 }),
		standardField('template_version', 'string', 35, { maxLength: 255 }),
		jsonField('safety_report', 36),
		systemDateField('date_created', 37),
		systemUserField('user_created', 38),
	];
}

function assetUsageFields(): FieldPayload[] {
	return [
		relationField('asset_record', 2, 'asset_records', { indexed: true }),
		relationField('resolved_version', 3, 'asset_versions', { indexed: true }),
		standardField('unresolved_ref', 'string', 4, { maxLength: 255, width: 'full' }),
		standardField('scan_run_id', 'string', 5, {
			required: true,
			indexed: true,
			maxLength: 255,
			width: 'full',
		}),
		hashField('last_seen_manifest_sha256', 6, { required: true, indexed: true, width: 'full' }),
		selectField('confidence', 7, ['exact-static', 'resolved-generated', 'declared-dynamic', 'unknown'], {
			required: true,
			indexed: true,
		}),
		selectField(
			'consumer_type',
			8,
			['site', 'route', 'service', 'project', 'blog', 'page-block', 'component', 'style', 'system'],
			{ required: true, indexed: true },
		),
		standardField('consumer_key', 'string', 9, { required: true, maxLength: 255, width: 'full' }),
		selectField('source_kind', 10, ['repository', 'generated', 'cms', 'route', 'declaration'], {
			required: true,
		}),
		standardField('source_file', 'string', 11, {
			required: true,
			maxLength: 1024,
			width: 'full',
		}),
		standardField('cms_field', 'string', 12, { maxLength: 512, width: 'full' }),
		integerField('source_line', 13, 'positive'),
		standardField('route', 'string', 14, { maxLength: 2048, width: 'full' }),
		standardField('locale', 'string', 15, { maxLength: 35 }),
		standardField('slot', 'string', 16, { required: true, maxLength: 255 }),
		standardField('required', 'boolean', 17, { required: true, interface: 'boolean' }),
		selectField('delivery_mode', 18, ASSET_DELIVERY_MODES, { required: true, width: 'full' }),
		textField('alt_text_override', 19),
		standardField('alt_source', 'string', 20, { maxLength: 255, width: 'full' }),
		standardField('active', 'boolean', 21, {
			required: true,
			indexed: true,
			defaultValue: true,
			interface: 'boolean',
		}),
		standardField('first_seen', 'timestamp', 22, { interface: 'datetime' }),
		standardField('last_seen', 'timestamp', 23, { interface: 'datetime' }),
		systemDateField('date_updated', 24),
	];
}

function assetReleaseFields(): FieldPayload[] {
	return [
		standardField('release_key', 'string', 2, {
			required: true,
			unique: true,
			maxLength: 160,
			width: 'full',
		}),
		integerField('schema_version', 3, 'positive', { required: true, defaultValue: 1 }),
		jsonField('manifest', 4, { required: true }),
		hashField('manifest_sha256', 5, {
			required: true,
			indexed: true,
			unique: false,
			width: 'full',
		}),
		selectField('source_environment', 6, ['dev'], { required: true, defaultValue: 'dev' }),
		selectField('target_environment', 7, ['dev', 'prod'], { required: true, indexed: true }),
		selectField(
			'status',
			8,
			[
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
			{ required: true, indexed: true, defaultValue: 'draft' },
		),
		hashField('repo_sha', 9, { indexed: true, width: 'full' }),
		hashField('content_export_sha256', 10, { indexed: true, width: 'full' }),
		hashField('expected_manifest_sha256', 11, { indexed: true, width: 'full' }),
		hashField('toolchain_signature', 12, { indexed: true, width: 'full' }),
		relationField('expected_live_release', 13, 'asset_releases', { indexed: true }),
		hashField('idempotency_key', 14, { required: true, unique: true, width: 'full' }),
		standardField('lease_owner', 'string', 15, { maxLength: 255, width: 'full' }),
		standardField('lease_expires_at', 'timestamp', 16, {
			interface: 'datetime',
			indexed: true,
		}),
		relationField('previous_release', 17, 'asset_releases', { indexed: true }),
		relationField('rollback_of', 18, 'asset_releases', { indexed: true }),
		jsonField('validation_checks', 19),
		jsonField('source_dev_receipt', 20),
		jsonField('deployment_receipt', 21),
		standardField('build_ref', 'string', 22, { maxLength: 512, width: 'full' }),
		standardField('deploy_ref', 'string', 23, { maxLength: 512, width: 'full' }),
		standardField('error_code', 'string', 24, { maxLength: 255 }),
		textField('error_message', 25),
		systemDateField('date_created', 26),
		systemDateField('date_updated', 27),
		systemUserField('user_created', 28),
	];
}

export function buildAssetRegistryPlan(): SchemaStep[] {
	const collections: SchemaStep[] = [
		collectionStep(
			'asset_records',
			{
				hidden: false,
				icon: 'inventory_2',
				displayTemplate: '{{semantic_key}} — {{title}}',
				sort: 4,
				note: 'Semantic asset identities, ownership, replacement pointers, and editor policy.',
			},
			uuidPkField(),
		),
		collectionStep(
			'asset_records_translations',
			{
				hidden: true,
				icon: 'translate',
				displayTemplate: '{{languages_code}}',
				note: 'Localized accessibility, caption, credit, and OG-alt copy for asset records.',
			},
			autoincrementPkField(),
		),
		collectionStep(
			'asset_versions',
			{
				hidden: false,
				icon: 'history',
				displayTemplate: '{{asset_record.semantic_key}} · v{{version_number}}',
				sort: 5,
				note: 'Immutable asset version evidence, source integrity, approval, and replacement history.',
			},
			uuidPkField(),
		),
		collectionStep(
			'asset_usages',
			{
				hidden: false,
				icon: 'account_tree',
				displayTemplate: '{{consumer_type}} · {{consumer_key}}',
				sort: 6,
				note: 'Deterministic repository, generated, CMS, route, and declared usage evidence.',
			},
			usagePkField(),
		),
		collectionStep(
			'asset_releases',
			{
				hidden: false,
				icon: 'deployed_code_history',
				displayTemplate: '{{release_key}}',
				sort: 7,
				note: 'Immutable release envelopes and DEV-to-PROD promotion receipts.',
			},
			uuidPkField(),
		),
	];

	const fields = [
		...assetRecordFields().map((field) => fieldStep('asset_records', field)),
		...translationFields().map((field) => fieldStep('asset_records_translations', field)),
		...assetVersionFields().map((field) => fieldStep('asset_versions', field)),
		...assetUsageFields().map((field) => fieldStep('asset_usages', field)),
		...assetReleaseFields().map((field) => fieldStep('asset_releases', field)),
	];

	const relations: SchemaStep[] = [
		relationStep('asset_records', 'candidate_version', 'asset_versions', 'SET NULL'),
		relationStep('asset_records', 'approved_version', 'asset_versions', 'SET NULL'),
		relationStep('asset_records_translations', 'asset_records_id', 'asset_records', 'CASCADE', {
			one_field: 'translations',
			junction_field: 'languages_code',
		}),
		relationStep('asset_records_translations', 'languages_code', 'languages', 'CASCADE', {
			junction_field: 'asset_records_id',
		}),
		relationStep('asset_versions', 'asset_record', 'asset_records', 'RESTRICT', {
			one_field: 'versions',
		}),
		relationStep('asset_versions', 'directus_file', 'directus_files', 'RESTRICT'),
		relationStep('asset_versions', 'replaces_version', 'asset_versions', 'RESTRICT'),
		relationStep('asset_versions', 'user_created', 'directus_users', 'SET NULL'),
		relationStep('asset_versions', 'approved_by', 'directus_users', 'SET NULL'),
		relationStep('asset_usages', 'asset_record', 'asset_records', 'RESTRICT', {
			one_field: 'usages',
		}),
		relationStep('asset_usages', 'resolved_version', 'asset_versions', 'RESTRICT'),
		relationStep('asset_releases', 'expected_live_release', 'asset_releases', 'RESTRICT'),
		relationStep('asset_releases', 'previous_release', 'asset_releases', 'RESTRICT'),
		relationStep('asset_releases', 'rollback_of', 'asset_releases', 'RESTRICT'),
		relationStep('asset_records', 'user_created', 'directus_users', 'SET NULL'),
		relationStep('asset_records', 'user_updated', 'directus_users', 'SET NULL'),
		relationStep('asset_releases', 'user_created', 'directus_users', 'SET NULL'),
	];

	return [...collections, ...fields, ...relations];
}

export function parseFlags(argv: readonly string[]): { apply: boolean } {
	const allowed = new Set(['--apply', '--dry-run']);
	for (const argument of argv) {
		if (!allowed.has(argument)) throw new Error(`Unknown argument: ${argument}`);
	}
	for (const flag of allowed) {
		if (argv.filter((argument) => argument === flag).length > 1) {
			throw new Error(`Use ${flag} at most once`);
		}
	}
	if (argv.includes('--apply') && argv.includes('--dry-run')) {
		throw new Error('Choose either --dry-run or --apply');
	}
	return { apply: argv.includes('--apply') };
}

export async function applyAssetRegistryPlan(
	plan: readonly SchemaStep[],
	ctx: ApplyContext,
	request: typeof rest = rest,
): Promise<{ created: number; existing: number; failed: number }> {
	assertDevCms(ctx.directusUrl);
	let created = 0;
	let existing = 0;

	for (const step of plan) {
		const response = await request(ctx, step.method, step.path, step.payload);
		if (response.status < 400) {
			created += 1;
			continue;
		}
		if (isAlreadyExists(response.status, response.json)) {
			existing += 1;
			continue;
		}
		throw new Error(
			`${step.method} ${step.path} (${step.target}) failed (${response.status}): ${JSON.stringify(response.json)}`,
		);
	}

	return { created, existing, failed: 0 };
}

export async function runAssetRegistryCli(
	argv: readonly string[],
	dependencies: AssetRegistryCliDependencies = {},
): Promise<
	| { mode: 'dry-run'; planLength: number }
	| {
			mode: 'apply';
			planLength: number;
			result: { created: number; existing: number; failed: number };
	  }
> {
	const { apply } = parseFlags(argv);
	const url = (dependencies.resolveUrl ?? defaultDirectusUrl)();
	assertDevCms(url);
	const plan = buildAssetRegistryPlan();
	const logger = dependencies.logger ?? log;
	logger.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	logger.info(`plan: ${plan.length} steps`);
	for (const step of plan) logger.info(`  ${step.kind} ${step.method} ${step.path} -> ${step.target}`);

	if (!apply) {
		logger.info('dry-run complete. Pass --apply to create the DEV registry schema.');
		return { mode: 'dry-run', planLength: plan.length };
	}

	const token = await (dependencies.getToken ?? getAdminToken)(url, { allowBuildToken: false });
	const result = await applyAssetRegistryPlan(
		plan,
		{ directusUrl: url, token },
		dependencies.request ?? rest,
	);
	logger.info(
		`apply complete: created=${result.created} existing=${result.existing} failed=${result.failed}`,
	);
	return { mode: 'apply', planLength: plan.length, result };
}

if (import.meta.main) {
	runAssetRegistryCli(process.argv.slice(2)).catch((error) => {
		console.error('[asset-registry-schema] FAILED:', error);
		process.exit(1);
	});
}
