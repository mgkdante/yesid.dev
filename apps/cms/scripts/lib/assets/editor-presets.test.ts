import { describe, expect, it } from 'bun:test';
import {
	ASSET_EDITOR_POLICY_NAMES,
	ASSET_REGISTRY_COLLECTIONS,
	ASSET_REGISTRY_READ_FIELDS,
	applyAssetEditorConfigurationPlan,
	buildAssetEditorConfigurationPlan,
	buildAssetEditorPresetPayloads,
	buildDesiredAssetPermissions,
	loadAssetEditorConfigurationPlan,
	type AssetConfigurationApi,
	type AssetEditorConfigurationInput,
} from './editor-presets';

const POLICY_IDS = {
	'$t:public_label': 'policy-public',
	'Build Bot — content read': 'policy-build',
	'Human Editor': 'policy-human',
	'Ops Bot content ops': 'policy-ops',
} as const;

const READ_FIELDS = {
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
} as const;

const HUMAN_WRITES = {
	asset_records: {
		create: [
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
			'translations',
		],
		update: [
			'title',
			'meaning',
			'kind',
			'role',
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
			'translations',
		],
	},
	asset_records_translations: {
		create: ['asset_records_id', 'languages_code', 'alt_text', 'caption', 'credit', 'og_image_alt'],
		update: ['alt_text', 'caption', 'credit', 'og_image_alt'],
	},
	asset_versions: {
		create: [
			'asset_record',
			'version_number',
			'source_mode',
			'directus_file',
			'component_key',
			'sha256',
			'approval_status',
			'replaces_version',
			'replacement_reason',
			'promotion_request_id',
			'quarantine_reason',
		],
		update: ['replacement_reason', 'promotion_request_id', 'quarantine_reason'],
	},
} as const;

function baseInput(): AssetEditorConfigurationInput {
	return {
		roles: [{ id: 'role-editor', name: 'Editor' }],
		policies: [
			{
				id: POLICY_IDS['$t:public_label'],
				name: '$t:public_label',
				admin_access: false,
				app_access: false,
				roles: [{ role: null }],
			},
			{
				id: POLICY_IDS['Build Bot — content read'],
				name: 'Build Bot — content read',
				admin_access: false,
				app_access: false,
				roles: [],
			},
			{
				id: POLICY_IDS['Human Editor'],
				name: 'Human Editor',
				admin_access: false,
				app_access: true,
				roles: [{ role: 'role-editor' }],
			},
			{
				id: POLICY_IDS['Ops Bot content ops'],
				name: 'Ops Bot content ops',
				admin_access: false,
				app_access: false,
				roles: [],
			},
		],
		permissions: [],
		presets: [],
	};
}

function desiredPermissions() {
	return buildDesiredAssetPermissions(POLICY_IDS);
}

function exactPermissionRows() {
	return desiredPermissions().map((payload, index) => ({ id: index + 1, ...structuredClone(payload) }));
}

function exactPresetRows() {
	return buildAssetEditorPresetPayloads('role-editor').map((payload, index) => ({
		id: index + 1,
		...structuredClone(payload),
	}));
}

describe('asset registry permission definitions', () => {
	it('locks the managed policies, collections, 31-row count, order, and action matrix', () => {
		expect(ASSET_EDITOR_POLICY_NAMES).toEqual([
			'$t:public_label',
			'Build Bot — content read',
			'Human Editor',
			'Ops Bot content ops',
		]);
		expect(ASSET_REGISTRY_COLLECTIONS).toEqual([
			'asset_records',
			'asset_records_translations',
			'asset_versions',
			'asset_usages',
			'asset_releases',
		]);
		expect(ASSET_REGISTRY_READ_FIELDS).toEqual(READ_FIELDS);

		const definitions = desiredPermissions();
		expect(definitions).toHaveLength(31);
		expect(
			definitions.map(({ policy, collection, action }) => [policy, collection, action]),
		).toEqual([
			...ASSET_REGISTRY_COLLECTIONS.map((collection) => ['policy-build', collection, 'read']),
			['policy-human', 'asset_records', 'create'],
			['policy-human', 'asset_records', 'read'],
			['policy-human', 'asset_records', 'update'],
			['policy-human', 'asset_records_translations', 'create'],
			['policy-human', 'asset_records_translations', 'read'],
			['policy-human', 'asset_records_translations', 'update'],
			['policy-human', 'asset_versions', 'create'],
			['policy-human', 'asset_versions', 'read'],
			['policy-human', 'asset_versions', 'update'],
			['policy-human', 'asset_usages', 'read'],
			['policy-human', 'asset_releases', 'read'],
			...ASSET_REGISTRY_COLLECTIONS.flatMap((collection) =>
				(['create', 'read', 'update'] as const).map((action) => ['policy-ops', collection, action]),
			),
		]);
	});

	it('uses complete explicit read fields and never grants wildcard fields or delete', () => {
		for (const row of desiredPermissions()) {
			expect(row.fields).not.toContain('*');
			expect(row.action).not.toBe('delete');
			if (row.action === 'read') expect(row.fields).toEqual([...READ_FIELDS[row.collection]]);
		}
	});

	it('locks Human Editor write fields and lifecycle, source, approval, and defaults', () => {
		const rows = desiredPermissions().filter((row) => row.policy === 'policy-human');
		const find = (collection: string, action: string) =>
			rows.find((row) => row.collection === collection && row.action === action)!;

		for (const [collection, actions] of Object.entries(HUMAN_WRITES)) {
			for (const [action, fields] of Object.entries(actions)) {
				expect(find(collection, action).fields).toEqual(fields);
			}
		}
		for (const action of ['create', 'update']) {
			expect(find('asset_records', action).fields).toContain('translations');
			expect(find('asset_records', action).fields).not.toContain('versions');
			expect(find('asset_records', action).fields).not.toContain('usages');
		}
		expect(find('asset_records', 'create')).toMatchObject({
			permissions: {},
			validation: { _and: [{ lifecycle_status: { _eq: 'draft' } }, { brand_status: { _eq: 'unreviewed' } }] },
			presets: { lifecycle_status: 'draft', brand_status: 'unreviewed' },
		});
		const editableLifecycles = { lifecycle_status: { _in: ['draft', 'candidate', 'ready'] } };
		expect(find('asset_records', 'update')).toMatchObject({
			permissions: editableLifecycles,
			validation: editableLifecycles,
			presets: null,
		});
		const translationParent = {
			asset_records_id: { lifecycle_status: { _in: ['draft', 'candidate', 'ready'] } },
		};
		expect(find('asset_records_translations', 'create')).toMatchObject({
			permissions: {},
			validation: translationParent,
			presets: null,
		});
		expect(find('asset_records_translations', 'update')).toMatchObject({
			permissions: translationParent,
			validation: translationParent,
			presets: null,
		});
		expect(find('asset_versions', 'create')).toMatchObject({
			permissions: {},
			validation: {
				_and: [
					{ asset_record: { lifecycle_status: { _in: ['draft', 'candidate', 'ready'] } } },
					{ source_mode: { _in: ['upload', 'code-component'] } },
					{ approval_status: { _eq: 'uploaded' } },
				],
			},
			presets: { approval_status: 'uploaded' },
		});
		const editableApproval = { approval_status: { _in: ['uploaded', 'validating', 'valid', 'rejected'] } };
		expect(find('asset_versions', 'update')).toMatchObject({
			permissions: editableApproval,
			validation: editableApproval,
			presets: null,
		});
	});

	it('locks Ops Bot allow lists while protecting create-once evidence', () => {
		const rows = desiredPermissions().filter((row) => row.policy === 'policy-ops');
		const find = (collection: string, action: string) =>
			rows.find((row) => row.collection === collection && row.action === action)!;
		expect(find('asset_records', 'create').fields).toEqual([
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
		]);
		expect(find('asset_records', 'update').fields).toEqual([
			'lifecycle_status',
			'brand_status',
			'approved_token_slots',
			'candidate_version',
			'approved_version',
		]);
		expect(find('asset_versions', 'update').fields).toEqual([
			'approval_status',
			'approved_by',
			'approved_at',
			'replacement_reason',
			'promotion_request_id',
			'quarantine_reason',
		]);
		expect(find('asset_usages', 'update').fields).toEqual([
			'asset_record',
			'resolved_version',
			'unresolved_ref',
			'scan_run_id',
			'last_seen_manifest_sha256',
			'confidence',
			'alt_text_override',
			'alt_source',
			'active',
			'last_seen',
		]);
		expect(find('asset_releases', 'update').fields).toEqual([
			'status',
			'lease_owner',
			'lease_expires_at',
			'validation_checks',
			'source_dev_receipt',
			'deployment_receipt',
			'build_ref',
			'deploy_ref',
			'error_code',
			'error_message',
		]);
		expect(find('asset_records', 'create')).toMatchObject({
			validation: { _and: [{ lifecycle_status: { _eq: 'draft' } }, { brand_status: { _eq: 'unreviewed' } }] },
			presets: { lifecycle_status: 'draft', brand_status: 'unreviewed' },
		});
		expect(find('asset_releases', 'create')).toMatchObject({
			presets: { schema_version: 1, source_environment: 'dev', status: 'draft' },
		});

		for (const [collection, protectedFields] of Object.entries({
			asset_records: ['semantic_key'],
			asset_versions: [
				'sha256',
				'directus_file',
				'component_key',
				'width',
				'height',
				'transform_signature',
				'sanitizer_signature',
				'generator_signature',
				'toolchain_signature',
			],
			asset_releases: ['manifest', 'manifest_sha256', 'idempotency_key', 'toolchain_signature'],
		})) {
			for (const field of protectedFields) expect(find(collection, 'update').fields).not.toContain(field);
		}
	});
});

describe('Editor asset bookmarks', () => {
	it('locks all ten names, collections, icons, filters, columns, and sorts', () => {
		const presets = buildAssetEditorPresetPayloads('role-editor');
		expect(presets).toEqual([
			{
				bookmark: 'Needs attention',
				role: 'role-editor',
				user: null,
				collection: 'asset_records',
				search: null,
				layout: 'tabular',
				layout_query: { tabular: { fields: ['semantic_key', 'title', 'lifecycle_status', 'brand_status', 'owner_type', 'owner_key'], sort: ['lifecycle_status', 'brand_status', 'semantic_key'] } },
				layout_options: null,
				refresh_interval: null,
				filter: {
					_or: [
						{ lifecycle_status: { _in: ['draft', 'candidate', 'quarantined'] } },
						{ brand_status: { _in: ['unreviewed', 'restricted'] } },
					],
				},
				icon: 'warning',
				color: null,
			},
			{
				bookmark: 'Ready to promote',
				role: 'role-editor',
				user: null,
				collection: 'asset_versions',
				search: null,
				layout: 'tabular',
				layout_query: { tabular: { fields: ['asset_record', 'version_number', 'approval_status', 'source_mode', 'format', 'bytes'], sort: ['asset_record', 'version_number', 'id'] } },
				layout_options: null,
				refresh_interval: null,
				filter: { approval_status: { _eq: 'approved' } },
				icon: 'rocket_launch',
				color: null,
			},
			{
				bookmark: 'Live', role: 'role-editor', user: null, collection: 'asset_records', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['semantic_key', 'title', 'role', 'approved_version', 'date_updated'], sort: ['semantic_key'] } },
				layout_options: null, refresh_interval: null, filter: { lifecycle_status: { _eq: 'live' } }, icon: 'public', color: null,
			},
			{
				bookmark: 'Unused or orphaned', role: 'role-editor', user: null, collection: 'asset_records', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['semantic_key', 'title', 'lifecycle_status', 'owner_type', 'owner_key', 'usages'], sort: ['semantic_key'] } },
				layout_options: null, refresh_interval: null, filter: { usages: { _none: { active: { _eq: true } } } }, icon: 'link_off', color: null,
			},
			{
				bookmark: 'Code-owned', role: 'role-editor', user: null, collection: 'asset_records', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['semantic_key', 'title', 'code_component_key', 'lifecycle_status', 'brand_status'], sort: ['semantic_key'] } },
				layout_options: null, refresh_interval: null, filter: { kind: { _eq: 'code-component' } }, icon: 'code', color: null,
			},
			{
				bookmark: 'OG assets', role: 'role-editor', user: null, collection: 'asset_records', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['semantic_key', 'title', 'owner_type', 'owner_key', 'lifecycle_status', 'approved_version'], sort: ['owner_type', 'owner_key', 'semantic_key'] } },
				layout_options: null, refresh_interval: null, filter: { role: { _eq: 'og' } }, icon: 'share', color: null,
			},
			{
				bookmark: 'By owner', role: 'role-editor', user: null, collection: 'asset_records', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['owner_type', 'owner_key', 'semantic_key', 'title', 'lifecycle_status', 'brand_status'], sort: ['owner_type', 'owner_key', 'semantic_key'] } },
				layout_options: null, refresh_interval: null, filter: null, icon: 'account_tree', color: null,
			},
			{
				bookmark: 'Superseded', role: 'role-editor', user: null, collection: 'asset_records', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['semantic_key', 'title', 'lifecycle_status', 'date_updated', 'approved_version'], sort: ['-date_updated', 'semantic_key'] } },
				layout_options: null, refresh_interval: null, filter: { lifecycle_status: { _eq: 'superseded' } }, icon: 'history', color: null,
			},
			{
				bookmark: 'Failed', role: 'role-editor', user: null, collection: 'asset_releases', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['release_key', 'status', 'target_environment', 'repo_sha', 'error_code', 'error_message', 'date_updated'], sort: ['-date_updated', 'release_key'] } },
				layout_options: null, refresh_interval: null, filter: { status: { _eq: 'failed' } }, icon: 'error', color: null,
			},
			{
				bookmark: 'Rollbacks', role: 'role-editor', user: null, collection: 'asset_releases', search: null, layout: 'tabular',
				layout_query: { tabular: { fields: ['release_key', 'status', 'rollback_of', 'previous_release', 'deployment_receipt', 'date_updated'], sort: ['-date_updated', 'release_key'] } },
				layout_options: null, refresh_interval: null, filter: { status: { _eq: 'rolled-back' } }, icon: 'undo', color: null,
			},
		]);
	});
});

describe('asset editor configuration planning', () => {
	it('creates all missing rows and converges to all noops with shuffled exact live rows', () => {
		const first = buildAssetEditorConfigurationPlan(baseInput());
		expect(first.permissionEntries.map((entry) => entry.action)).toEqual(Array(31).fill('create'));
		expect(first.presetEntries.map((entry) => entry.action)).toEqual(Array(10).fill('create'));

		const input = baseInput();
		input.permissions = exactPermissionRows().reverse();
		input.presets = exactPresetRows().reverse();
		input.roles.reverse();
		input.policies.reverse();
		const second = buildAssetEditorConfigurationPlan(input);
		expect(second.permissionEntries.map((entry) => entry.action)).toEqual(Array(31).fill('noop'));
		expect(second.presetEntries.map((entry) => entry.action)).toEqual(Array(10).fill('noop'));
		expect(second.permissionEntries.map((entry) => entry.payload)).toEqual(first.permissionEntries.map((entry) => entry.payload));
		expect(second.presetEntries.map((entry) => entry.payload)).toEqual(first.presetEntries.map((entry) => entry.payload));
	});

	it('requires one Editor role and all four exact policy names', () => {
		for (const mutate of [
			(input: AssetEditorConfigurationInput) => input.roles.splice(0),
			(input: AssetEditorConfigurationInput) => input.roles.push({ id: 'role-duplicate', name: 'Editor' }),
			(input: AssetEditorConfigurationInput) => input.policies.splice(0, 1),
			(input: AssetEditorConfigurationInput) => input.policies.push({ ...input.policies[0]!, id: 'policy-duplicate' }),
		]) {
			const input = baseInput();
			mutate(input);
			expect(() => buildAssetEditorConfigurationPlan(input)).toThrow(/exactly one/i);
		}
	});

	it('requires the Human Editor topology without accepting malformed role relations', () => {
		const human = (input: AssetEditorConfigurationInput) =>
			input.policies.find((policy) => policy.name === 'Human Editor')!;
		for (const mutate of [
			(input: AssetEditorConfigurationInput) => (human(input).admin_access = true),
			(input: AssetEditorConfigurationInput) => (human(input).app_access = false),
			(input: AssetEditorConfigurationInput) => (human(input).roles = []),
			(input: AssetEditorConfigurationInput) => (human(input).roles = [{ role: 'wrong-role' }]),
			(input: AssetEditorConfigurationInput) => (human(input).roles = [{ role: 'role-editor' }, { role: 'role-editor' }]),
			(input: AssetEditorConfigurationInput) => (human(input).roles = [{ role: {} as never }]),
		]) {
			const input = baseInput();
			mutate(input);
			expect(() => buildAssetEditorConfigurationPlan(input)).toThrow(/Human Editor/i);
		}
	});

	it('fails closed on divergent, duplicate, unexpected, or malformed managed permissions', () => {
		const exact = exactPermissionRows();
		const cases: AssetEditorConfigurationInput['permissions'][] = [
			[{ ...exact[0]!, fields: ['id'] }],
			[exact[0]!, { ...exact[0]!, id: 999 }],
			[{
				id: 999,
				policy: 'policy-human',
				collection: 'asset_records',
				action: 'delete',
				fields: ['id'],
				permissions: {},
				validation: null,
				presets: null,
			}],
			[{
				id: 999,
				policy: 'policy-public',
				collection: 'asset_records',
				action: 'read',
				fields: READ_FIELDS.asset_records,
				permissions: {},
				validation: null,
				presets: null,
			}],
			[{
				id: 999,
				policy: {} as never,
				collection: 'asset_records',
				action: 'read',
				fields: ['id'],
				permissions: {},
				validation: null,
				presets: null,
			}],
		];
		for (const permissions of cases) {
			const input = baseInput();
			input.permissions = permissions;
			expect(() => buildAssetEditorConfigurationPlan(input)).toThrow();
		}
	});

	it('canonicalizes object keys and read field order but not divergent values', () => {
		const input = baseInput();
		const rows = exactPermissionRows();
		const create = rows.find((row) => row.policy === 'policy-human' && row.collection === 'asset_records' && row.action === 'create')!;
		create.fields.reverse();
		create.validation = {
			_and: [{ lifecycle_status: { _eq: 'draft' } }, { brand_status: { _eq: 'unreviewed' } }],
		};
		input.permissions = rows;
		expect(() => buildAssetEditorConfigurationPlan(input)).not.toThrow();
	});

	it('fails closed on preset drift, duplicate managed names, wrong scope, non-null user, or malformed relations', () => {
		const exact = exactPresetRows();
		const cases: AssetEditorConfigurationInput['presets'][] = [
			[{ ...exact[0]!, icon: 'different' }],
			[exact[0]!, { ...exact[0]!, id: 999 }],
			[{ ...exact[0]!, role: 'other-role' }],
			[{ ...exact[0]!, user: 'some-user' }],
			[{ ...exact[0]!, role: {} as never }],
		];
		for (const presets of cases) {
			const input = baseInput();
			input.presets = presets;
			expect(() => buildAssetEditorConfigurationPlan(input)).toThrow();
		}
	});

	it('ignores unrelated permissions outside the registry and unrelated bookmark names', () => {
		const input = baseInput();
		input.permissions = [
			{ id: 1, policy: 'policy-human', collection: 'blog_posts', action: 'update', fields: ['title'] },
			{ id: 2, policy: 'unmanaged-policy', collection: 'asset_records', action: 'read', fields: ['*'] },
		];
		input.presets = [
			{ id: 1, bookmark: 'Published', role: null, user: null, collection: 'blog_posts' },
		];
		const plan = buildAssetEditorConfigurationPlan(input);
		expect(plan.permissionEntries).toHaveLength(31);
		expect(plan.presetEntries).toHaveLength(10);
	});
});

describe('asset editor configuration IO', () => {
	it('loads all four system endpoints and rejects non-2xx or non-array responses', async () => {
		const calls: string[] = [];
		const input = baseInput();
		const api: AssetConfigurationApi = async (method, path) => {
			calls.push(`${method} ${path}`);
			if (path.startsWith('/roles?')) return { status: 200, json: { data: input.roles } };
			if (path.startsWith('/policies?')) return { status: 200, json: { data: input.policies } };
			if (path.startsWith('/permissions?')) return { status: 200, json: { data: input.permissions } };
			return { status: 200, json: { data: input.presets } };
		};
		expect(await loadAssetEditorConfigurationPlan(api)).toMatchObject({
			permissionEntries: { length: 31 },
			presetEntries: { length: 10 },
		});
		expect(calls).toHaveLength(4);
		expect(calls.every((call) => call.startsWith('GET '))).toBe(true);
		expect(calls.map((call) => call.split('?')[0])).toEqual([
			'GET /roles',
			'GET /policies',
			'GET /permissions',
			'GET /presets',
		]);
		const queries = calls.map((call) => new URL(`https://cms.dev.yesid.dev${call.slice(4)}`).searchParams);
		expect(queries[0]!.get('filter[name][_eq]')).toBe('Editor');
		expect(queries[1]!.get('filter[name][_in]')).toBe(ASSET_EDITOR_POLICY_NAMES.join(','));
		expect(queries[2]!.get('filter[policy][_in]')).toBe(Object.values(POLICY_IDS).join(','));
		expect(queries[2]!.get('filter[collection][_in]')).toBe(ASSET_REGISTRY_COLLECTIONS.join(','));
		expect(queries[3]!.get('filter[bookmark][_in]')).toBe(
			buildAssetEditorPresetPayloads('role-editor').map((preset) => preset.bookmark).join(','),
		);
		expect(queries[3]!.has('filter[role][_eq]')).toBe(false);

		for (const response of [
			{ status: 500, json: { errors: [{ message: 'no' }] } },
			{ status: 200, json: { data: {} } },
		]) {
			await expect(loadAssetEditorConfigurationPlan(async () => response)).rejects.toThrow();
		}
	});

	it('rejects every malformed row returned by narrowed 2xx loaders before any POST', async () => {
		const input = baseInput();
		const permission = exactPermissionRows()[0]!;
		const preset = exactPresetRows()[0]!;
		const without = (source: Record<string, unknown>, key: string) => {
			const copy = { ...source };
			delete copy[key];
			return copy;
		};
		const cases: Array<{
			label: string;
			endpoint: 'roles' | 'policies' | 'permissions' | 'presets';
			rows: unknown[];
		}> = [
			{ label: 'role missing id', endpoint: 'roles', rows: [...input.roles, { name: 'Unexpected role' }] },
			{ label: 'role empty id', endpoint: 'roles', rows: [...input.roles, { id: '', name: 'Unexpected role' }] },
			{ label: 'role missing name', endpoint: 'roles', rows: [...input.roles, { id: 'unexpected-role' }] },
			{ label: 'role empty name', endpoint: 'roles', rows: [...input.roles, { id: 'unexpected-role', name: '' }] },
			{ label: 'policy missing id', endpoint: 'policies', rows: [...input.policies, { name: 'Unexpected policy' }] },
			{ label: 'policy empty id', endpoint: 'policies', rows: [...input.policies, { id: '', name: 'Unexpected policy' }] },
			{ label: 'policy missing name', endpoint: 'policies', rows: [...input.policies, { id: 'unexpected-policy' }] },
			{ label: 'policy empty name', endpoint: 'policies', rows: [...input.policies, { id: 'unexpected-policy', name: '' }] },
			{ label: 'permission missing id', endpoint: 'permissions', rows: [without(permission, 'id')] },
			{ label: 'permission malformed id', endpoint: 'permissions', rows: [{ ...permission, id: {} }] },
			{ label: 'permission malformed policy', endpoint: 'permissions', rows: [{ ...permission, policy: {} }] },
			{ label: 'permission malformed collection', endpoint: 'permissions', rows: [{ ...permission, collection: 42 }] },
			{ label: 'permission malformed action', endpoint: 'permissions', rows: [{ ...permission, action: {} }] },
			{ label: 'permission malformed fields', endpoint: 'permissions', rows: [{ ...permission, fields: ['id', 42] }] },
			{ label: 'preset missing id', endpoint: 'presets', rows: [without(preset, 'id')] },
			{ label: 'preset malformed id', endpoint: 'presets', rows: [{ ...preset, id: {} }] },
			{ label: 'preset missing bookmark', endpoint: 'presets', rows: [without(preset, 'bookmark')] },
			{ label: 'preset empty bookmark', endpoint: 'presets', rows: [{ ...preset, bookmark: '' }] },
			{ label: 'preset missing role', endpoint: 'presets', rows: [without(preset, 'role')] },
			{ label: 'preset malformed role', endpoint: 'presets', rows: [{ ...preset, role: {} }] },
			{ label: 'preset missing user', endpoint: 'presets', rows: [without(preset, 'user')] },
			{ label: 'preset malformed user', endpoint: 'presets', rows: [{ ...preset, user: {} }] },
		];

		for (const testCase of cases) {
			let posts = 0;
			const rows = {
				roles: input.roles,
				policies: input.policies,
				permissions: input.permissions,
				presets: input.presets,
				[testCase.endpoint]: testCase.rows,
			};
			const api: AssetConfigurationApi = async (method, path) => {
				if (method === 'POST') {
					posts += 1;
					return { status: 201, json: { data: {} } };
				}
				if (path.startsWith('/roles?')) return { status: 200, json: { data: rows.roles } };
				if (path.startsWith('/policies?')) return { status: 200, json: { data: rows.policies } };
				if (path.startsWith('/permissions?')) return { status: 200, json: { data: rows.permissions } };
				return { status: 200, json: { data: rows.presets } };
			};
			await expect(loadAssetEditorConfigurationPlan(api), testCase.label).rejects.toThrow(/malformed|unexpected/i);
			expect(posts, testCase.label).toBe(0);
		}
	});

	it('posts missing permissions then presets and requires a re-read all-noop plan', async () => {
		const input = baseInput();
		let livePermissions: ReturnType<typeof exactPermissionRows> = [];
		let livePresets: ReturnType<typeof exactPresetRows> = [];
		const writes: Array<{ path: string; body: any }> = [];
		const api: AssetConfigurationApi = async (method, path, body) => {
			if (method === 'POST') {
				writes.push({ path, body });
				if (path === '/permissions') livePermissions.push({ id: livePermissions.length + 1, ...(body as any) });
				else livePresets.push({ id: livePresets.length + 1, ...(body as any) });
				return { status: 201, json: { data: { id: writes.length } } };
			}
			if (path.startsWith('/roles?')) return { status: 200, json: { data: input.roles } };
			if (path.startsWith('/policies?')) return { status: 200, json: { data: input.policies } };
			if (path.startsWith('/permissions?')) return { status: 200, json: { data: livePermissions } };
			return { status: 200, json: { data: livePresets } };
		};

		const initial = await loadAssetEditorConfigurationPlan(api);
		const verified = await applyAssetEditorConfigurationPlan(api, initial);
		expect(writes.map((write) => write.path)).toEqual([
			...Array(31).fill('/permissions'),
			...Array(10).fill('/presets'),
		]);
		expect(verified.permissionEntries.every((entry) => entry.action === 'noop')).toBe(true);
		expect(verified.presetEntries.every((entry) => entry.action === 'noop')).toBe(true);
	});

	it('issues no writes for an all-noop plan and fails on POST errors or failed convergence', async () => {
		const noopInput = baseInput();
		noopInput.permissions = exactPermissionRows();
		noopInput.presets = exactPresetRows();
		const noopPlan = buildAssetEditorConfigurationPlan(noopInput);
		let writes = 0;
		const noopApi: AssetConfigurationApi = async (method, path) => {
			if (method === 'POST') writes += 1;
			if (path.startsWith('/roles?')) return { status: 200, json: { data: noopInput.roles } };
			if (path.startsWith('/policies?')) return { status: 200, json: { data: noopInput.policies } };
			if (path.startsWith('/permissions?')) return { status: 200, json: { data: noopInput.permissions } };
			return { status: 200, json: { data: noopInput.presets } };
		};
		await applyAssetEditorConfigurationPlan(noopApi, noopPlan);
		expect(writes).toBe(0);

		const missingPlan = buildAssetEditorConfigurationPlan(baseInput());
		await expect(
			applyAssetEditorConfigurationPlan(async (method) =>
				method === 'POST'
					? { status: 403, json: { errors: [{ message: 'forbidden' }] } }
					: { status: 200, json: { data: [] } }, missingPlan),
		).rejects.toThrow(/POST \/permissions/i);

		const nonConvergingInput = baseInput();
		const nonConvergingApi: AssetConfigurationApi = async (method, path) => {
			if (method === 'POST') return { status: 201, json: { data: {} } };
			if (path.startsWith('/roles?')) return { status: 200, json: { data: nonConvergingInput.roles } };
			if (path.startsWith('/policies?')) return { status: 200, json: { data: nonConvergingInput.policies } };
			return { status: 200, json: { data: [] } };
		};
		await expect(applyAssetEditorConfigurationPlan(nonConvergingApi, missingPlan)).rejects.toThrow(/converge/i);
	});
});
