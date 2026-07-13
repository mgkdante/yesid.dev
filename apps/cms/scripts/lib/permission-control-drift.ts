export interface RepoPolicyRow {
	_syncId: string;
	name: string;
}

export interface LivePolicyRow {
	id: string;
	name: string;
}

export interface PermissionPayloadSource {
	fields?: string[] | null;
	permissions?: unknown;
	validation?: unknown;
	presets?: unknown;
}

export interface DesiredPermissionRow extends PermissionPayloadSource {
	policy: string;
	collection: string;
	action: string;
}

export interface LivePermissionRow extends PermissionPayloadSource {
	id: string | number;
	policy: string | { id: string };
	collection: string;
	action: string;
}

export interface NormalizedPermissionPayload {
	fields: string[] | null;
	permissions: unknown;
	validation: unknown;
	presets: unknown;
}

export type AuditClassification =
	| 'equivalent'
	| 'mismatch'
	| 'missing'
	| 'duplicate'
	| 'untracked';

export interface PermissionAuditEntry {
	classification: AuditClassification;
	policyName: string;
	collection: string;
	action: string;
	desiredCount: number;
	livePermissionIds: Array<string | number>;
	differences: Array<keyof NormalizedPermissionPayload>;
	desired?: NormalizedPermissionPayload;
	live?: NormalizedPermissionPayload;
}

export interface PermissionAuditSummary {
	equivalent: number;
	mismatch: number;
	missing: number;
	duplicate: number;
	untracked: number;
	total: number;
}

export interface PermissionAudit {
	entries: PermissionAuditEntry[];
	summary: PermissionAuditSummary;
}

export interface ResolvedDesiredPermission {
	sourceIndex: number;
	policyName: string;
	collection: string;
	action: string;
	payload: NormalizedPermissionPayload;
}

function canonicalize(value: unknown): unknown {
	if (value === undefined || value === null) return null;
	if (Array.isArray(value)) return value.map(canonicalize);
	if (typeof value !== 'object') return value;
	const source = value as Record<string, unknown>;
	const sorted: Record<string, unknown> = {};
	for (const key of Object.keys(source).sort()) {
		sorted[key] = canonicalize(source[key]);
	}
	return sorted;
}

export function normalizePermissionPayload(
	source: PermissionPayloadSource,
): NormalizedPermissionPayload {
	return {
		fields:
			source.fields == null
				? null
				: [...new Set(source.fields)].sort((left, right) =>
						left.localeCompare(right),
					),
		permissions: canonicalize(source.permissions),
		validation: canonicalize(source.validation),
		presets: canonicalize(source.presets),
	};
}

export function permissionPayloadDifferences(
	desired: NormalizedPermissionPayload,
	live: NormalizedPermissionPayload,
): Array<keyof NormalizedPermissionPayload> {
	return (['fields', 'permissions', 'validation', 'presets'] as const).filter(
		(field) => JSON.stringify(desired[field]) !== JSON.stringify(live[field]),
	);
}

export function resolveDesiredPermissions(
	repoPolicies: readonly RepoPolicyRow[],
	desiredPermissions: readonly DesiredPermissionRow[],
): ResolvedDesiredPermission[] {
	const policyByReference = new Map<string, string>();
	const policyNames = new Set<string>();
	for (const policy of repoPolicies) {
		if (policyByReference.has(policy._syncId)) {
			throw new Error(
				`[permission-control-drift] duplicate repository policy reference ${policy._syncId}`,
			);
		}
		if (policyNames.has(policy.name)) {
			throw new Error(
				`[permission-control-drift] duplicate repository policy name ${policy.name}`,
			);
		}
		policyByReference.set(policy._syncId, policy.name);
		policyNames.add(policy.name);
	}

	return desiredPermissions.map((permission, sourceIndex) => {
		const policyName = policyByReference.get(permission.policy);
		if (!policyName) {
			throw new Error(
				`[permission-control-drift] unknown repository policy reference ${permission.policy}`,
			);
		}
		return {
			sourceIndex,
			policyName,
			collection: permission.collection,
			action: permission.action,
			payload: normalizePermissionPayload(permission),
		};
	});
}

function livePolicyMaps(livePolicies: readonly LivePolicyRow[]): {
	nameById: Map<string, string>;
	idsByName: Map<string, string>;
} {
	const nameById = new Map<string, string>();
	const idsByName = new Map<string, string>();
	for (const policy of livePolicies) {
		if (nameById.has(policy.id)) {
			throw new Error(
				`[permission-control-drift] duplicate live policy id ${policy.id}`,
			);
		}
		if (idsByName.has(policy.name)) {
			throw new Error(
				`[permission-control-drift] duplicate live policy name ${policy.name}`,
			);
		}
		nameById.set(policy.id, policy.name);
		idsByName.set(policy.name, policy.id);
	}
	return { nameById, idsByName };
}

export function resolveLivePolicyId(
	livePolicies: readonly LivePolicyRow[],
	policyName: string,
): string {
	const { idsByName } = livePolicyMaps(livePolicies);
	const id = idsByName.get(policyName);
	if (!id) {
		throw new Error(
			`[permission-control-drift] expected exactly one live policy named "${policyName}"; found 0`,
		);
	}
	return id;
}

function livePolicyId(permission: LivePermissionRow): string {
	return typeof permission.policy === 'string'
		? permission.policy
		: permission.policy.id;
}

function semanticKey(
	policyName: string,
	collection: string,
	action: string,
): string {
	return JSON.stringify([policyName, collection, action]);
}

interface AuditBucket {
	policyName: string;
	collection: string;
	action: string;
	desired: NormalizedPermissionPayload[];
	live: Array<{ id: string | number; payload: NormalizedPermissionPayload }>;
}

function bucketFor(
	buckets: Map<string, AuditBucket>,
	policyName: string,
	collection: string,
	action: string,
): AuditBucket {
	const key = semanticKey(policyName, collection, action);
	let bucket = buckets.get(key);
	if (!bucket) {
		bucket = {
			policyName,
			collection,
			action,
			desired: [],
			live: [],
		};
		buckets.set(key, bucket);
	}
	return bucket;
}

export function buildPermissionAudit(
	repoPolicies: readonly RepoPolicyRow[],
	desiredPermissions: readonly DesiredPermissionRow[],
	livePolicies: readonly LivePolicyRow[],
	livePermissions: readonly LivePermissionRow[],
): PermissionAudit {
	const desired = resolveDesiredPermissions(repoPolicies, desiredPermissions);
	const { nameById } = livePolicyMaps(livePolicies);
	const buckets = new Map<string, AuditBucket>();

	for (const permission of desired) {
		bucketFor(
			buckets,
			permission.policyName,
			permission.collection,
			permission.action,
		).desired.push(permission.payload);
	}
	for (const permission of livePermissions) {
		const id = livePolicyId(permission);
		const policyName = nameById.get(id);
		if (!policyName) {
			throw new Error(
				`[permission-control-drift] unknown live policy id ${id} on permission ${permission.id}`,
			);
		}
		bucketFor(
			buckets,
			policyName,
			permission.collection,
			permission.action,
		).live.push({
			id: permission.id,
			payload: normalizePermissionPayload(permission),
		});
	}

	const entries = [...buckets.values()]
		.sort((left, right) =>
			semanticKey(left.policyName, left.collection, left.action).localeCompare(
				semanticKey(right.policyName, right.collection, right.action),
			),
		)
		.map((bucket): PermissionAuditEntry => {
			const livePermissionIds = bucket.live
				.map((permission) => permission.id)
				.sort((left, right) => String(left).localeCompare(String(right)));
			const base = {
				policyName: bucket.policyName,
				collection: bucket.collection,
				action: bucket.action,
				desiredCount: bucket.desired.length,
				livePermissionIds,
			};
			if (bucket.desired.length > 1 || bucket.live.length > 1) {
				return {
					...base,
					classification: 'duplicate',
					differences: [],
				};
			}
			if (bucket.desired.length === 0) {
				return {
					...base,
					classification: 'untracked',
					differences: [],
					live: bucket.live[0]?.payload,
				};
			}
			const desiredPayload = bucket.desired[0] as NormalizedPermissionPayload;
			if (bucket.live.length === 0) {
				return {
					...base,
					classification: 'missing',
					differences: [],
					desired: desiredPayload,
				};
			}
			const livePayload = bucket.live[0]!.payload;
			const differences = permissionPayloadDifferences(
				desiredPayload,
				livePayload,
			);
			return {
				...base,
				classification:
					differences.length === 0 ? 'equivalent' : 'mismatch',
				differences,
				desired: desiredPayload,
				live: livePayload,
			};
		});

	const summary: PermissionAuditSummary = {
		equivalent: 0,
		mismatch: 0,
		missing: 0,
		duplicate: 0,
		untracked: 0,
		total: entries.length,
	};
	for (const entry of entries) summary[entry.classification] += 1;
	return { entries, summary };
}

export function formatPermissionAudit(audit: PermissionAudit): string {
	const lines = audit.entries.map((entry) => {
		const details = [
			`${entry.classification.toUpperCase()} policy=${JSON.stringify(entry.policyName)} ${entry.collection}:${entry.action}`,
			`desired=${entry.desiredCount}`,
			`live=${entry.livePermissionIds.length}`,
		];
		if (entry.livePermissionIds.length > 0) {
			details.push(
				`live_permission_ids=${JSON.stringify(entry.livePermissionIds)}`,
			);
		}
		if (entry.differences.length > 0) {
			details.push(`differences=${entry.differences.join(',')}`);
		}
		return details.join(' ');
	});
	const { summary } = audit;
	lines.push(
		`summary equivalent=${summary.equivalent} mismatch=${summary.mismatch} missing=${summary.missing} duplicate=${summary.duplicate} untracked=${summary.untracked} total=${summary.total}`,
	);
	return lines.join('\n');
}
