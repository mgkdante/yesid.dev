import {
	normalizePermissionPayload,
	permissionPayloadDifferences,
	resolveDesiredPermissions,
	type DesiredPermissionRow,
	type LivePermissionRow,
	type LivePolicyRow,
	type NormalizedPermissionPayload,
	type RepoPolicyRow,
} from './permission-control-drift';

interface NamedRelation {
	name?: string | null;
}

interface RoleAttachment {
	role?: NamedRelation | string | null;
}

interface DirectUserAttachment {
	user?: {
		role?: NamedRelation | string | null;
	} | string | null;
}

export interface DiagnosticLivePolicyRow extends LivePolicyRow {
	roles?: RoleAttachment[] | null;
	users?: DirectUserAttachment[] | null;
}

export type CandidateMismatchKind = 'missing' | 'duplicate' | 'payload';

export interface CandidateMismatch {
	collection: string;
	action: string;
	kind: CandidateMismatchKind;
	liveCount: number;
	differences: Array<keyof NormalizedPermissionPayload>;
}

export interface PolicyCandidateEvidence {
	policyId: string;
	roleAttachmentCount: number;
	roleNames: string[];
	unresolvedRoleAttachmentCount: number;
	directUserAttachmentCount: number;
	directUserRoleNames: string[];
	unresolvedDirectUserRoleCount: number;
	permissionCount: number;
	desiredSemanticKeyOverlap: number;
	exactPayloadMatchCount: number;
	untrackedPermissionCount: number;
	mismatches: CandidateMismatch[];
}

export interface PolicyNameCandidateDiagnostic {
	policyName: string;
	desiredSemanticKeyCount: number;
	candidates: PolicyCandidateEvidence[];
}

interface DesiredSemanticPermission {
	collection: string;
	action: string;
	payload: NormalizedPermissionPayload;
}

function semanticKey(collection: string, action: string): string {
	return JSON.stringify([collection, action]);
}

function livePolicyId(permission: LivePermissionRow): string {
	return typeof permission.policy === 'string'
		? permission.policy
		: permission.policy.id;
}

function sortedUnique(values: readonly string[]): string[] {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function relationName(value: NamedRelation | string | null | undefined): string | null {
	if (!value || typeof value === 'string') return null;
	return typeof value.name === 'string' && value.name.length > 0
		? value.name
		: null;
}

function policyAttachmentEvidence(policy: DiagnosticLivePolicyRow): Pick<
	PolicyCandidateEvidence,
	| 'roleAttachmentCount'
	| 'roleNames'
	| 'unresolvedRoleAttachmentCount'
	| 'directUserAttachmentCount'
	| 'directUserRoleNames'
	| 'unresolvedDirectUserRoleCount'
> {
	const roles = Array.isArray(policy.roles) ? policy.roles : [];
	const roleNames = roles
		.map((attachment) => relationName(attachment?.role))
		.filter((name): name is string => name !== null);
	const directUsers = Array.isArray(policy.users) ? policy.users : [];
	const directUserRoleNames = directUsers
		.map((attachment) => {
			const user = attachment?.user;
			return !user || typeof user === 'string'
				? null
				: relationName(user.role);
		})
		.filter((name): name is string => name !== null);
	return {
		roleAttachmentCount: roles.length,
		roleNames: sortedUnique(roleNames),
		unresolvedRoleAttachmentCount: roles.length - roleNames.length,
		directUserAttachmentCount: directUsers.length,
		directUserRoleNames: sortedUnique(directUserRoleNames),
		unresolvedDirectUserRoleCount:
			directUsers.length - directUserRoleNames.length,
	};
}

function desiredPermissionsByPolicyName(
	repoPolicies: readonly RepoPolicyRow[],
	desiredPermissions: readonly DesiredPermissionRow[],
): Map<string, Map<string, DesiredSemanticPermission>> {
	const resolved = resolveDesiredPermissions(repoPolicies, desiredPermissions);
	const byPolicyName = new Map<
		string,
		Map<string, DesiredSemanticPermission>
	>();
	for (const permission of resolved) {
		let bySemanticKey = byPolicyName.get(permission.policyName);
		if (!bySemanticKey) {
			bySemanticKey = new Map();
			byPolicyName.set(permission.policyName, bySemanticKey);
		}
		const key = semanticKey(permission.collection, permission.action);
		if (bySemanticKey.has(key)) {
			throw new Error(
				`[permission-policy-candidate-diagnostic] duplicate repository semantic key for policy ${JSON.stringify(permission.policyName)} ${permission.collection}:${permission.action}`,
			);
		}
		bySemanticKey.set(key, {
			collection: permission.collection,
			action: permission.action,
			payload: permission.payload,
		});
	}
	return byPolicyName;
}

function buildCandidateEvidence(
	policy: DiagnosticLivePolicyRow,
	desiredByKey: ReadonlyMap<string, DesiredSemanticPermission>,
	livePermissions: readonly LivePermissionRow[],
): PolicyCandidateEvidence {
	const permissions = livePermissions.filter(
		(permission) => livePolicyId(permission) === policy.id,
	);
	const liveByKey = new Map<string, LivePermissionRow[]>();
	for (const permission of permissions) {
		const key = semanticKey(permission.collection, permission.action);
		const rows = liveByKey.get(key) ?? [];
		rows.push(permission);
		liveByKey.set(key, rows);
	}

	let desiredSemanticKeyOverlap = 0;
	let exactPayloadMatchCount = 0;
	const mismatches: CandidateMismatch[] = [];
	const desiredEntries = [...desiredByKey.entries()].sort(([left], [right]) =>
		left.localeCompare(right),
	);
	for (const [key, desired] of desiredEntries) {
		const rows = liveByKey.get(key) ?? [];
		if (rows.length > 0) desiredSemanticKeyOverlap += 1;
		if (rows.length === 0) {
			mismatches.push({
				collection: desired.collection,
				action: desired.action,
				kind: 'missing',
				liveCount: 0,
				differences: [],
			});
			continue;
		}
		if (rows.length > 1) {
			mismatches.push({
				collection: desired.collection,
				action: desired.action,
				kind: 'duplicate',
				liveCount: rows.length,
				differences: [],
			});
			continue;
		}
		const differences = permissionPayloadDifferences(
			desired.payload,
			normalizePermissionPayload(rows[0]!),
		);
		if (differences.length === 0) {
			exactPayloadMatchCount += 1;
		} else {
			mismatches.push({
				collection: desired.collection,
				action: desired.action,
				kind: 'payload',
				liveCount: 1,
				differences,
			});
		}
	}

	const untrackedPermissionCount = permissions.filter(
		(permission) =>
			!desiredByKey.has(semanticKey(permission.collection, permission.action)),
	).length;
	return {
		policyId: policy.id,
		...policyAttachmentEvidence(policy),
		permissionCount: permissions.length,
		desiredSemanticKeyOverlap,
		exactPayloadMatchCount,
		untrackedPermissionCount,
		mismatches,
	};
}

export function buildPolicyCandidateDiagnostics(
	repoPolicies: readonly RepoPolicyRow[],
	desiredPermissions: readonly DesiredPermissionRow[],
	livePolicies: readonly DiagnosticLivePolicyRow[],
	livePermissions: readonly LivePermissionRow[],
): PolicyNameCandidateDiagnostic[] {
	const desiredByPolicyName = desiredPermissionsByPolicyName(
		repoPolicies,
		desiredPermissions,
	);
	const policyIds = new Set<string>();
	const liveByName = new Map<string, DiagnosticLivePolicyRow[]>();
	for (const policy of livePolicies) {
		if (policyIds.has(policy.id)) {
			throw new Error(
				`[permission-policy-candidate-diagnostic] duplicate live policy id ${policy.id}`,
			);
		}
		policyIds.add(policy.id);
		const policies = liveByName.get(policy.name) ?? [];
		policies.push(policy);
		liveByName.set(policy.name, policies);
	}

	const diagnostics: PolicyNameCandidateDiagnostic[] = [];
	for (const [policyName, desiredByKey] of desiredByPolicyName) {
		const duplicatePolicies = liveByName.get(policyName) ?? [];
		if (duplicatePolicies.length < 2) continue;
		const candidates = [...duplicatePolicies]
			.sort((left, right) => left.id.localeCompare(right.id))
			.map((policy) =>
				buildCandidateEvidence(policy, desiredByKey, livePermissions),
			);
		diagnostics.push({
			policyName,
			desiredSemanticKeyCount: desiredByKey.size,
			candidates,
		});
	}
	return diagnostics.sort((left, right) =>
		left.policyName.localeCompare(right.policyName),
	);
}

function formatMismatch(mismatch: CandidateMismatch): string {
	const identity = `${mismatch.collection}:${mismatch.action}`;
	if (mismatch.kind === 'missing') return `${identity}:missing`;
	if (mismatch.kind === 'duplicate') {
		return `${identity}:duplicate(live=${mismatch.liveCount})`;
	}
	return `${identity}:payload(${mismatch.differences.join(',')})`;
}

export function formatPolicyCandidateDiagnostics(
	diagnostics: readonly PolicyNameCandidateDiagnostic[],
): string {
	const lines: string[] = [];
	for (const diagnostic of diagnostics) {
		for (const candidate of diagnostic.candidates) {
			lines.push(
				[
					`CANDIDATE policy=${JSON.stringify(diagnostic.policyName)}`,
					`policy_id=${JSON.stringify(candidate.policyId)}`,
					`role_attachments=${candidate.roleAttachmentCount}`,
					`role_names=${JSON.stringify(candidate.roleNames)}`,
					`unresolved_role_names=${candidate.unresolvedRoleAttachmentCount}`,
					`direct_user_attachments=${candidate.directUserAttachmentCount}`,
					`direct_user_role_names=${JSON.stringify(candidate.directUserRoleNames)}`,
					`unresolved_direct_user_roles=${candidate.unresolvedDirectUserRoleCount}`,
					`permission_count=${candidate.permissionCount}`,
					`desired_semantic_key_overlap=${candidate.desiredSemanticKeyOverlap}/${diagnostic.desiredSemanticKeyCount}`,
					`exact_payload_matches=${candidate.exactPayloadMatchCount}`,
					`untracked_permissions=${candidate.untrackedPermissionCount}`,
					`mismatches=${JSON.stringify(candidate.mismatches.map(formatMismatch))}`,
				].join(' '),
			);
		}
	}
	lines.push(
		`summary duplicated_desired_policy_names=${diagnostics.length} writes_sent=0`,
	);
	return lines.join('\n');
}
