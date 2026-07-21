export const ASSET_EDITOR_POLICY_NAMES = [
	'$t:public_label',
	'Build Bot — content read',
	'Human Editor',
	'Ops Bot content ops',
] as const;

export const ASSET_REGISTRY_COLLECTIONS = [
	'asset_records',
	'asset_records_translations',
	'asset_versions',
	'asset_usages',
	'asset_releases',
] as const;

export type AssetEditorPolicyName = (typeof ASSET_EDITOR_POLICY_NAMES)[number];
export type AssetRegistryCollection = (typeof ASSET_REGISTRY_COLLECTIONS)[number];
export type AssetPermissionAction = 'create' | 'read' | 'update';

export const ASSET_REGISTRY_READ_FIELDS: Record<AssetRegistryCollection, readonly string[]> = {
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

const HUMAN_RECORD_CREATE_FIELDS = [
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
] as const;

const HUMAN_RECORD_UPDATE_FIELDS = HUMAN_RECORD_CREATE_FIELDS.filter(
	(field) => field !== 'semantic_key' && field !== 'lifecycle_status',
);
const TRANSLATION_CREATE_FIELDS = [
	'asset_records_id',
	'languages_code',
	'alt_text',
	'caption',
	'credit',
	'og_image_alt',
] as const;
const TRANSLATION_UPDATE_FIELDS = ['alt_text', 'caption', 'credit', 'og_image_alt'] as const;
const HUMAN_VERSION_CREATE_FIELDS = [
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
] as const;
const HUMAN_VERSION_UPDATE_FIELDS = [
	'replacement_reason',
	'promotion_request_id',
	'quarantine_reason',
] as const;

const OPS_RECORD_CREATE_FIELDS = ASSET_REGISTRY_READ_FIELDS.asset_records.slice(1, 25);
const OPS_RECORD_UPDATE_FIELDS = [
	'lifecycle_status',
	'brand_status',
	'approved_token_slots',
	'candidate_version',
	'approved_version',
] as const;
const OPS_VERSION_CREATE_FIELDS = ASSET_REGISTRY_READ_FIELDS.asset_versions.slice(1, -2);
const OPS_VERSION_UPDATE_FIELDS = [
	'approval_status',
	'approved_by',
	'approved_at',
	'replacement_reason',
	'promotion_request_id',
	'quarantine_reason',
] as const;
const OPS_USAGE_CREATE_FIELDS = ASSET_REGISTRY_READ_FIELDS.asset_usages.slice(0, -1);
const OPS_USAGE_UPDATE_FIELDS = [
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
] as const;
const OPS_RELEASE_CREATE_FIELDS = ASSET_REGISTRY_READ_FIELDS.asset_releases.slice(1, -3);
const OPS_RELEASE_UPDATE_FIELDS = [
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
] as const;

const EDITABLE_LIFECYCLES = ['draft', 'candidate', 'ready'] as const;
const EDITABLE_APPROVAL_STATUSES = ['uploaded', 'validating', 'valid', 'rejected'] as const;

export interface AssetPermissionPayload {
	policy: string;
	collection: AssetRegistryCollection;
	action: AssetPermissionAction;
	fields: string[];
	permissions: Record<string, unknown>;
	validation: Record<string, unknown> | null;
	presets: Record<string, unknown> | null;
}

export interface AssetEditorPresetPayload {
	bookmark: string;
	role: string;
	user: null;
	collection: AssetRegistryCollection;
	search: null;
	layout: 'tabular';
	layout_query: { tabular: { fields: string[]; sort: string[] } };
	layout_options: null;
	refresh_interval: null;
	filter: Record<string, unknown> | null;
	icon: string;
	color: null;
}

export interface AssetRoleRow {
	id: string;
	name: string;
}

type RelationValue = string | { id?: unknown } | null;

export interface AssetPolicyRow {
	id: string;
	name: string;
	admin_access?: boolean;
	app_access?: boolean;
	roles?: Array<{ role?: RelationValue }>;
}

export interface AssetPermissionRow {
	id: string | number;
	policy: RelationValue;
	collection: string;
	action: string;
	fields?: unknown;
	permissions?: unknown;
	validation?: unknown;
	presets?: unknown;
}

export interface AssetPresetRow {
	id: string | number;
	bookmark?: unknown;
	role?: RelationValue;
	user?: unknown;
	collection?: unknown;
	search?: unknown;
	layout?: unknown;
	layout_query?: unknown;
	layout_options?: unknown;
	refresh_interval?: unknown;
	filter?: unknown;
	icon?: unknown;
	color?: unknown;
}

export interface AssetEditorConfigurationInput {
	roles: AssetRoleRow[];
	policies: AssetPolicyRow[];
	permissions: AssetPermissionRow[];
	presets: AssetPresetRow[];
}

export interface AssetPermissionPlanEntry {
	action: 'create' | 'noop';
	payload: AssetPermissionPayload;
	existingId: string | number | null;
}

export interface AssetPresetPlanEntry {
	action: 'create' | 'noop';
	payload: AssetEditorPresetPayload;
	existingId: string | number | null;
}

export interface AssetEditorConfigurationPlan {
	editorRole: AssetRoleRow;
	policies: Record<AssetEditorPolicyName, AssetPolicyRow>;
	permissionEntries: AssetPermissionPlanEntry[];
	presetEntries: AssetPresetPlanEntry[];
}

export interface AssetConfigurationResponse {
	status: number;
	json: unknown;
}

export type AssetConfigurationApi = (
	method: 'GET' | 'POST',
	path: string,
	body?: unknown,
) => Promise<AssetConfigurationResponse>;

function permission(
	policy: string,
	collection: AssetRegistryCollection,
	action: AssetPermissionAction,
	fields: readonly string[],
	permissions: Record<string, unknown> = {},
	validation: Record<string, unknown> | null = null,
	presets: Record<string, unknown> | null = null,
): AssetPermissionPayload {
	return {
		policy,
		collection,
		action,
		fields: [...fields],
		permissions,
		validation,
		presets,
	};
}

export function buildDesiredAssetPermissions(
	policyIds: Record<AssetEditorPolicyName, string>,
): AssetPermissionPayload[] {
	const buildPolicy = policyIds['Build Bot — content read'];
	const humanPolicy = policyIds['Human Editor'];
	const opsPolicy = policyIds['Ops Bot content ops'];
	const editableRecord = { lifecycle_status: { _in: [...EDITABLE_LIFECYCLES] } };
	const editableTranslation = {
		asset_records_id: { lifecycle_status: { _in: [...EDITABLE_LIFECYCLES] } },
	};
	const humanVersionCreate = {
		_and: [
			{ asset_record: { lifecycle_status: { _in: [...EDITABLE_LIFECYCLES] } } },
			{ source_mode: { _in: ['upload', 'code-component'] } },
			{ approval_status: { _eq: 'uploaded' } },
		],
	};
	const editableVersion = { approval_status: { _in: [...EDITABLE_APPROVAL_STATUSES] } };
	const draftUnreviewed = {
		_and: [{ lifecycle_status: { _eq: 'draft' } }, { brand_status: { _eq: 'unreviewed' } }],
	};
	const recordDefaults = { lifecycle_status: 'draft', brand_status: 'unreviewed' };

	const rows: AssetPermissionPayload[] = ASSET_REGISTRY_COLLECTIONS.map((collection) =>
		permission(buildPolicy, collection, 'read', ASSET_REGISTRY_READ_FIELDS[collection]),
	);
	rows.push(
		permission(
			humanPolicy,
			'asset_records',
			'create',
			HUMAN_RECORD_CREATE_FIELDS,
			{},
			draftUnreviewed,
			recordDefaults,
		),
		permission(humanPolicy, 'asset_records', 'read', ASSET_REGISTRY_READ_FIELDS.asset_records),
		permission(
			humanPolicy,
			'asset_records',
			'update',
			HUMAN_RECORD_UPDATE_FIELDS,
			editableRecord,
			editableRecord,
		),
		permission(
			humanPolicy,
			'asset_records_translations',
			'create',
			TRANSLATION_CREATE_FIELDS,
			{},
			editableTranslation,
		),
		permission(
			humanPolicy,
			'asset_records_translations',
			'read',
			ASSET_REGISTRY_READ_FIELDS.asset_records_translations,
		),
		permission(
			humanPolicy,
			'asset_records_translations',
			'update',
			TRANSLATION_UPDATE_FIELDS,
			editableTranslation,
			editableTranslation,
		),
		permission(
			humanPolicy,
			'asset_versions',
			'create',
			HUMAN_VERSION_CREATE_FIELDS,
			{},
			humanVersionCreate,
			{ approval_status: 'uploaded' },
		),
		permission(humanPolicy, 'asset_versions', 'read', ASSET_REGISTRY_READ_FIELDS.asset_versions),
		permission(
			humanPolicy,
			'asset_versions',
			'update',
			HUMAN_VERSION_UPDATE_FIELDS,
			editableVersion,
			editableVersion,
		),
		permission(humanPolicy, 'asset_usages', 'read', ASSET_REGISTRY_READ_FIELDS.asset_usages),
		permission(humanPolicy, 'asset_releases', 'read', ASSET_REGISTRY_READ_FIELDS.asset_releases),
	);

	const opsFields: Record<
		AssetRegistryCollection,
		{ create: readonly string[]; update: readonly string[] }
	> = {
		asset_records: { create: OPS_RECORD_CREATE_FIELDS, update: OPS_RECORD_UPDATE_FIELDS },
		asset_records_translations: {
			create: TRANSLATION_CREATE_FIELDS,
			update: TRANSLATION_UPDATE_FIELDS,
		},
		asset_versions: { create: OPS_VERSION_CREATE_FIELDS, update: OPS_VERSION_UPDATE_FIELDS },
		asset_usages: { create: OPS_USAGE_CREATE_FIELDS, update: OPS_USAGE_UPDATE_FIELDS },
		asset_releases: { create: OPS_RELEASE_CREATE_FIELDS, update: OPS_RELEASE_UPDATE_FIELDS },
	};
	for (const collection of ASSET_REGISTRY_COLLECTIONS) {
		const createValidation = collection === 'asset_records' ? draftUnreviewed : null;
		const createPresets =
			collection === 'asset_records'
				? recordDefaults
				: collection === 'asset_releases'
					? { schema_version: 1, source_environment: 'dev', status: 'draft' }
					: null;
		rows.push(
			permission(
				opsPolicy,
				collection,
				'create',
				opsFields[collection].create,
				{},
				createValidation,
				createPresets,
			),
			permission(opsPolicy, collection, 'read', ASSET_REGISTRY_READ_FIELDS[collection]),
			permission(opsPolicy, collection, 'update', opsFields[collection].update),
		);
	}
	return rows;
}

function preset(
	role: string,
	bookmark: string,
	collection: AssetRegistryCollection,
	icon: string,
	fields: readonly string[],
	sort: readonly string[],
	filter: Record<string, unknown> | null,
): AssetEditorPresetPayload {
	return {
		bookmark,
		role,
		user: null,
		collection,
		search: null,
		layout: 'tabular',
		layout_query: { tabular: { fields: [...fields], sort: [...sort] } },
		layout_options: null,
		refresh_interval: null,
		filter,
		icon,
		color: null,
	};
}

export function buildAssetEditorPresetPayloads(editorRoleId: string): AssetEditorPresetPayload[] {
	return [
		preset(
			editorRoleId,
			'Needs attention',
			'asset_records',
			'warning',
			['semantic_key', 'title', 'lifecycle_status', 'brand_status', 'owner_type', 'owner_key'],
			['lifecycle_status', 'brand_status', 'semantic_key'],
			{
				_or: [
					{ lifecycle_status: { _in: ['draft', 'candidate', 'quarantined'] } },
					{ brand_status: { _in: ['unreviewed', 'restricted'] } },
				],
			},
		),
		preset(
			editorRoleId,
			'Ready to promote',
			'asset_versions',
			'rocket_launch',
			['asset_record', 'version_number', 'approval_status', 'source_mode', 'format', 'bytes'],
			['asset_record', 'version_number', 'id'],
			{ approval_status: { _eq: 'approved' } },
		),
		preset(
			editorRoleId,
			'Live',
			'asset_records',
			'public',
			['semantic_key', 'title', 'role', 'approved_version', 'date_updated'],
			['semantic_key'],
			{ lifecycle_status: { _eq: 'live' } },
		),
		preset(
			editorRoleId,
			'Unused or orphaned',
			'asset_records',
			'link_off',
			['semantic_key', 'title', 'lifecycle_status', 'owner_type', 'owner_key', 'usages'],
			['semantic_key'],
			{ usages: { _none: { active: { _eq: true } } } },
		),
		preset(
			editorRoleId,
			'Code-owned',
			'asset_records',
			'code',
			['semantic_key', 'title', 'code_component_key', 'lifecycle_status', 'brand_status'],
			['semantic_key'],
			{ kind: { _eq: 'code-component' } },
		),
		preset(
			editorRoleId,
			'OG assets',
			'asset_records',
			'share',
			['semantic_key', 'title', 'owner_type', 'owner_key', 'lifecycle_status', 'approved_version'],
			['owner_type', 'owner_key', 'semantic_key'],
			{ role: { _eq: 'og' } },
		),
		preset(
			editorRoleId,
			'By owner',
			'asset_records',
			'account_tree',
			['owner_type', 'owner_key', 'semantic_key', 'title', 'lifecycle_status', 'brand_status'],
			['owner_type', 'owner_key', 'semantic_key'],
			null,
		),
		preset(
			editorRoleId,
			'Superseded',
			'asset_records',
			'history',
			['semantic_key', 'title', 'lifecycle_status', 'date_updated', 'approved_version'],
			['-date_updated', 'semantic_key'],
			{ lifecycle_status: { _eq: 'superseded' } },
		),
		preset(
			editorRoleId,
			'Failed',
			'asset_releases',
			'error',
			['release_key', 'status', 'target_environment', 'repo_sha', 'error_code', 'error_message', 'date_updated'],
			['-date_updated', 'release_key'],
			{ status: { _eq: 'failed' } },
		),
		preset(
			editorRoleId,
			'Rollbacks',
			'asset_releases',
			'undo',
			['release_key', 'status', 'rollback_of', 'previous_release', 'deployment_receipt', 'date_updated'],
			['-date_updated', 'release_key'],
			{ status: { _eq: 'rolled-back' } },
		),
	];
}

function relationId(value: RelationValue, label: string): string | null {
	if (value === null) return null;
	if (typeof value === 'string' && value.length > 0) return value;
	if (
		typeof value === 'object' &&
		!Array.isArray(value) &&
		typeof value.id === 'string' &&
		value.id.length > 0
	) {
		return value.id;
	}
	throw new Error(`[asset-editor-configuration] malformed ${label} relation`);
}

function resolveEditorRole(roles: readonly AssetRoleRow[]): AssetRoleRow {
	const matches = roles.filter((role) => role.name === 'Editor');
	if (matches.length !== 1) {
		throw new Error(
			`[asset-editor-configuration] expected exactly one role named "Editor"; found ${matches.length}`,
		);
	}
	return matches[0]!;
}

function resolvePolicies(
	policies: readonly AssetPolicyRow[],
): Record<AssetEditorPolicyName, AssetPolicyRow> {
	const resolved = {} as Record<AssetEditorPolicyName, AssetPolicyRow>;
	for (const name of ASSET_EDITOR_POLICY_NAMES) {
		const matches = policies.filter((policy) => policy.name === name);
		if (matches.length !== 1) {
			throw new Error(
				`[asset-editor-configuration] expected exactly one policy named "${name}"; found ${matches.length}`,
			);
		}
		resolved[name] = matches[0]!;
	}
	return resolved;
}

function validateHumanPolicy(policy: AssetPolicyRow, editorRoleId: string): void {
	const roles = policy.roles;
	if (policy.admin_access !== false || policy.app_access !== true || !Array.isArray(roles)) {
		throw new Error(
			'[asset-editor-configuration] Human Editor must have admin_access=false, app_access=true, and one Editor role attachment',
		);
	}
	let roleIds: Array<string | null>;
	try {
		roleIds = roles.map((relation) => relationId(relation.role as RelationValue, 'Human Editor role'));
	} catch {
		throw new Error('[asset-editor-configuration] Human Editor has a malformed role relation');
	}
	if (roleIds.length !== 1 || roleIds[0] !== editorRoleId) {
		throw new Error(
			'[asset-editor-configuration] Human Editor must have exactly one attachment to the Editor role',
		);
	}
}

function canonicalize(value: unknown): unknown {
	if (value === undefined || value === null) return null;
	if (Array.isArray(value)) return value.map(canonicalize);
	if (typeof value !== 'object') return value;
	const source = value as Record<string, unknown>;
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(source).sort()) result[key] = canonicalize(source[key]);
	return result;
}

function normalizedPermissionPayload(source: {
	fields?: unknown;
	permissions?: unknown;
	validation?: unknown;
	presets?: unknown;
}): unknown {
	if (!Array.isArray(source.fields) || source.fields.some((field) => typeof field !== 'string')) {
		throw new Error('[asset-editor-configuration] malformed permission fields');
	}
	return canonicalize({
		fields: [...source.fields].sort((left, right) => left.localeCompare(right)),
		permissions: source.permissions,
		validation: source.validation,
		presets: source.presets,
	});
}

function permissionIdentity(policy: string, collection: string, action: string): string {
	return JSON.stringify([policy, collection, action]);
}

function buildPermissionEntries(
	desired: readonly AssetPermissionPayload[],
	live: readonly AssetPermissionRow[],
	managedPolicyIds: ReadonlySet<string>,
): AssetPermissionPlanEntry[] {
	const desiredByIdentity = new Map<string, AssetPermissionPayload>();
	for (const payload of desired) {
		const identity = permissionIdentity(payload.policy, payload.collection, payload.action);
		if (desiredByIdentity.has(identity)) {
			throw new Error(`[asset-editor-configuration] duplicate desired permission identity ${identity}`);
		}
		desiredByIdentity.set(identity, payload);
	}

	const registryCollections = new Set<string>(ASSET_REGISTRY_COLLECTIONS);
	const liveByIdentity = new Map<string, AssetPermissionRow[]>();
	for (const row of live) {
		if (!registryCollections.has(row.collection)) continue;
		const policy = relationId(row.policy, `permission ${row.id} policy`);
		if (policy === null) {
			throw new Error(`[asset-editor-configuration] permission ${row.id} has no policy`);
		}
		if (!managedPolicyIds.has(policy)) continue;
		const identity = permissionIdentity(policy, row.collection, row.action);
		if (!desiredByIdentity.has(identity)) {
			throw new Error(
				`[asset-editor-configuration] unexpected managed permission ${row.id} for ${row.collection}:${row.action}`,
			);
		}
		const matches = liveByIdentity.get(identity) ?? [];
		matches.push(row);
		liveByIdentity.set(identity, matches);
	}

	return desired.map((payload) => {
		const identity = permissionIdentity(payload.policy, payload.collection, payload.action);
		const matches = liveByIdentity.get(identity) ?? [];
		if (matches.length > 1) {
			throw new Error(`[asset-editor-configuration] duplicate managed permission identity ${identity}`);
		}
		if (matches.length === 0) return { action: 'create', payload, existingId: null };
		const row = matches[0]!;
		if (
			JSON.stringify(normalizedPermissionPayload(row)) !==
			JSON.stringify(normalizedPermissionPayload(payload))
		) {
			throw new Error(
				`[asset-editor-configuration] divergent managed permission ${row.id} for ${payload.collection}:${payload.action}`,
			);
		}
		return { action: 'noop', payload, existingId: row.id };
	});
}

function normalizedPresetPayload(source: AssetPresetRow | AssetEditorPresetPayload): unknown {
	return canonicalize({
		bookmark: source.bookmark,
		role: source.role,
		user: source.user,
		collection: source.collection,
		search: source.search,
		layout: source.layout,
		layout_query: source.layout_query,
		layout_options: source.layout_options,
		refresh_interval: source.refresh_interval,
		filter: source.filter,
		icon: source.icon,
		color: source.color,
	});
}

function buildPresetEntries(
	desired: readonly AssetEditorPresetPayload[],
	live: readonly AssetPresetRow[],
	editorRoleId: string,
): AssetPresetPlanEntry[] {
	const managedNames = new Set(desired.map((payload) => payload.bookmark));
	const liveByName = new Map<string, AssetPresetRow[]>();
	for (const row of live) {
		if (typeof row.bookmark !== 'string' || !managedNames.has(row.bookmark)) continue;
		if (row.user !== null) {
			throw new Error(
				`[asset-editor-configuration] managed preset "${row.bookmark}" must have user=null`,
			);
		}
		const role = relationId(row.role as RelationValue, `preset ${row.id} role`);
		if (role !== editorRoleId) {
			throw new Error(
				`[asset-editor-configuration] managed preset "${row.bookmark}" has the wrong role`,
			);
		}
		const matches = liveByName.get(row.bookmark) ?? [];
		matches.push(row);
		liveByName.set(row.bookmark, matches);
	}

	return desired.map((payload) => {
		const matches = liveByName.get(payload.bookmark) ?? [];
		if (matches.length > 1) {
			throw new Error(
				`[asset-editor-configuration] duplicate managed preset "${payload.bookmark}"`,
			);
		}
		if (matches.length === 0) return { action: 'create', payload, existingId: null };
		const row = matches[0]!;
		const comparable = { ...row, role: editorRoleId };
		if (
			JSON.stringify(normalizedPresetPayload(comparable)) !==
			JSON.stringify(normalizedPresetPayload(payload))
		) {
			throw new Error(`[asset-editor-configuration] divergent managed preset "${payload.bookmark}"`);
		}
		return { action: 'noop', payload, existingId: row.id };
	});
}

export function buildAssetEditorConfigurationPlan(
	input: AssetEditorConfigurationInput,
): AssetEditorConfigurationPlan {
	const editorRole = resolveEditorRole(input.roles);
	const policies = resolvePolicies(input.policies);
	validateHumanPolicy(policies['Human Editor'], editorRole.id);
	const policyIds = Object.fromEntries(
		ASSET_EDITOR_POLICY_NAMES.map((name) => [name, policies[name].id]),
	) as Record<AssetEditorPolicyName, string>;
	const desiredPermissions = buildDesiredAssetPermissions(policyIds);
	const permissionEntries = buildPermissionEntries(
		desiredPermissions,
		input.permissions,
		new Set(Object.values(policyIds)),
	);
	const desiredPresets = buildAssetEditorPresetPayloads(editorRole.id);
	const presetEntries = buildPresetEntries(desiredPresets, input.presets, editorRole.id);
	return { editorRole, policies, permissionEntries, presetEntries };
}

function query(
	path: string,
	fields: string,
	filters: ReadonlyArray<readonly [string, string]> = [],
): string {
	const parameters = new URLSearchParams();
	parameters.set('fields', fields);
	for (const [key, value] of filters) parameters.set(key, value);
	parameters.set('limit', '-1');
	return `${path}?${parameters.toString()}`;
}

function responseRows(response: AssetConfigurationResponse, operation: string): unknown[] {
	if (response.status < 200 || response.status >= 300) {
		throw new Error(
			`[asset-editor-configuration] ${operation} failed (${response.status}): ${JSON.stringify(response.json)}`,
		);
	}
	const data = (response.json as { data?: unknown } | null)?.data;
	if (!Array.isArray(data)) {
		throw new Error(`[asset-editor-configuration] ${operation} returned non-array data`);
	}
	return data;
}

function rowObject(value: unknown, label: string): Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`[asset-editor-configuration] malformed ${label}: expected an object`);
	}
	return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, label: string): string {
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`[asset-editor-configuration] malformed ${label}: expected a non-empty string`);
	}
	return value;
}

function systemRowId(value: unknown, label: string): string | number {
	if (typeof value === 'string' && value.length > 0) return value;
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	throw new Error(`[asset-editor-configuration] malformed ${label}: expected a string or number id`);
}

function parseRoleRows(values: readonly unknown[]): AssetRoleRow[] {
	return values.map((value, index) => {
		const row = rowObject(value, `role row ${index}`);
		const id = nonEmptyString(row.id, `role row ${index} id`);
		const name = nonEmptyString(row.name, `role row ${index} name`);
		if (name !== 'Editor') {
			throw new Error(`[asset-editor-configuration] unexpected role row ${index} name "${name}"`);
		}
		return { id, name };
	});
}

function parsePolicyRows(values: readonly unknown[]): AssetPolicyRow[] {
	const managedNames = new Set<string>(ASSET_EDITOR_POLICY_NAMES);
	return values.map((value, index) => {
		const row = rowObject(value, `policy row ${index}`);
		const id = nonEmptyString(row.id, `policy row ${index} id`);
		const name = nonEmptyString(row.name, `policy row ${index} name`);
		if (!managedNames.has(name)) {
			throw new Error(`[asset-editor-configuration] unexpected policy row ${index} name "${name}"`);
		}
		if (typeof row.admin_access !== 'boolean' || typeof row.app_access !== 'boolean') {
			throw new Error(`[asset-editor-configuration] malformed policy row ${index} access flags`);
		}
		if (!Array.isArray(row.roles)) {
			throw new Error(`[asset-editor-configuration] malformed policy row ${index} roles`);
		}
		const roles = row.roles.map((value, relationIndex) => {
			const relation = rowObject(value, `policy row ${index} role ${relationIndex}`);
			relationId(
				relation.role as RelationValue,
				`policy row ${index} role ${relationIndex}`,
			);
			return { role: relation.role as RelationValue };
		});
		return {
			id,
			name,
			admin_access: row.admin_access,
			app_access: row.app_access,
			roles,
		};
	});
}

function parsePermissionRows(
	values: readonly unknown[],
	managedPolicyIds: ReadonlySet<string>,
): AssetPermissionRow[] {
	const managedCollections = new Set<string>(ASSET_REGISTRY_COLLECTIONS);
	return values.map((value, index) => {
		const row = rowObject(value, `permission row ${index}`);
		const id = systemRowId(row.id, `permission row ${index} id`);
		const policy = relationId(row.policy as RelationValue, `permission row ${index} policy`);
		if (policy === null) {
			throw new Error(`[asset-editor-configuration] malformed permission row ${index} policy`);
		}
		if (!managedPolicyIds.has(policy)) {
			throw new Error(`[asset-editor-configuration] unexpected permission row ${index} policy "${policy}"`);
		}
		const collection = nonEmptyString(row.collection, `permission row ${index} collection`);
		if (!managedCollections.has(collection)) {
			throw new Error(
				`[asset-editor-configuration] unexpected permission row ${index} collection "${collection}"`,
			);
		}
		const action = nonEmptyString(row.action, `permission row ${index} action`);
		if (
			!Array.isArray(row.fields) ||
			row.fields.some((field) => typeof field !== 'string' || field.length === 0)
		) {
			throw new Error(`[asset-editor-configuration] malformed permission row ${index} fields`);
		}
		return {
			id,
			policy: row.policy as RelationValue,
			collection,
			action,
			fields: row.fields,
			permissions: row.permissions,
			validation: row.validation,
			presets: row.presets,
		};
	});
}

function parsePresetRows(
	values: readonly unknown[],
	managedBookmarks: ReadonlySet<string>,
): AssetPresetRow[] {
	return values.map((value, index) => {
		const row = rowObject(value, `preset row ${index}`);
		const id = systemRowId(row.id, `preset row ${index} id`);
		const bookmark = nonEmptyString(row.bookmark, `preset row ${index} bookmark`);
		if (!managedBookmarks.has(bookmark)) {
			throw new Error(`[asset-editor-configuration] unexpected preset row ${index} bookmark "${bookmark}"`);
		}
		const role = relationId(row.role as RelationValue, `preset row ${index} role`);
		if (role === null) {
			throw new Error(`[asset-editor-configuration] malformed preset row ${index} role`);
		}
		if (row.user !== null) {
			throw new Error(`[asset-editor-configuration] malformed preset row ${index} user`);
		}
		return {
			id,
			bookmark,
			role: row.role as RelationValue,
			user: null,
			collection: row.collection,
			search: row.search,
			layout: row.layout,
			layout_query: row.layout_query,
			layout_options: row.layout_options,
			refresh_interval: row.refresh_interval,
			filter: row.filter,
			icon: row.icon,
			color: row.color,
		};
	});
}

export async function loadAssetEditorConfigurationPlan(
	api: AssetConfigurationApi,
): Promise<AssetEditorConfigurationPlan> {
	const roles = parseRoleRows(
		responseRows(
			await api('GET', query('/roles', 'id,name', [['filter[name][_eq]', 'Editor']])),
			'GET /roles',
		),
	);
	const editorRole = resolveEditorRole(roles);
	const policies = parsePolicyRows(
		responseRows(
			await api(
				'GET',
				query('/policies', 'id,name,admin_access,app_access,roles.role', [
					['filter[name][_in]', ASSET_EDITOR_POLICY_NAMES.join(',')],
				]),
			),
			'GET /policies',
		),
	);
	const resolvedPolicies = resolvePolicies(policies);
	validateHumanPolicy(resolvedPolicies['Human Editor'], editorRole.id);
	const policyIds = ASSET_EDITOR_POLICY_NAMES.map((name) => resolvedPolicies[name].id);
	const permissions = parsePermissionRows(
		responseRows(
			await api(
				'GET',
				query('/permissions', 'id,policy,collection,action,fields,permissions,validation,presets', [
					['filter[policy][_in]', policyIds.join(',')],
					['filter[collection][_in]', ASSET_REGISTRY_COLLECTIONS.join(',')],
				]),
			),
			'GET /permissions',
		),
		new Set(policyIds),
	);
	const managedBookmarks = buildAssetEditorPresetPayloads(editorRole.id).map(
		(preset) => preset.bookmark,
	);
	const presets = parsePresetRows(
		responseRows(
			await api(
				'GET',
				query(
					'/presets',
					'id,bookmark,role,user,collection,search,layout,layout_query,layout_options,refresh_interval,filter,icon,color',
					[['filter[bookmark][_in]', managedBookmarks.join(',')]],
				),
			),
			'GET /presets',
		),
		new Set(managedBookmarks),
	);
	return buildAssetEditorConfigurationPlan({ roles, policies, permissions, presets });
}

export async function applyAssetEditorConfigurationPlan(
	api: AssetConfigurationApi,
	plan: AssetEditorConfigurationPlan,
): Promise<AssetEditorConfigurationPlan> {
	for (const entry of plan.permissionEntries) {
		if (entry.action !== 'create') continue;
		const response = await api('POST', '/permissions', entry.payload);
		if (response.status < 200 || response.status >= 300) {
			throw new Error(
				`[asset-editor-configuration] POST /permissions ${entry.payload.collection}:${entry.payload.action} failed (${response.status}): ${JSON.stringify(response.json)}`,
			);
		}
	}
	for (const entry of plan.presetEntries) {
		if (entry.action !== 'create') continue;
		const response = await api('POST', '/presets', entry.payload);
		if (response.status < 200 || response.status >= 300) {
			throw new Error(
				`[asset-editor-configuration] POST /presets "${entry.payload.bookmark}" failed (${response.status}): ${JSON.stringify(response.json)}`,
			);
		}
	}

	const verified = await loadAssetEditorConfigurationPlan(api);
	const permissionCreates = verified.permissionEntries.filter((entry) => entry.action === 'create').length;
	const presetCreates = verified.presetEntries.filter((entry) => entry.action === 'create').length;
	if (permissionCreates !== 0 || presetCreates !== 0) {
		throw new Error(
			`[asset-editor-configuration] configuration did not converge: ${permissionCreates} permissions and ${presetCreates} presets remain missing`,
		);
	}
	return verified;
}
