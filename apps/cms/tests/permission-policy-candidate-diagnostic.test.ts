import { describe, expect, it } from 'bun:test';
import {
	buildPolicyCandidateDiagnostics,
	formatPolicyCandidateDiagnostics,
	type DiagnosticLivePolicyRow,
} from '../scripts/lib/permission-policy-candidate-diagnostic';
import {
	PROD_CMS_URL,
	loadPolicyCandidateDiagnostics,
	parseCandidateDiagnosticArgs,
	type ReadOnlyCandidateApiRequest,
} from '../scripts/diagnose-permission-policy-candidates';
import type {
	DesiredPermissionRow,
	LivePermissionRow,
	RepoPolicyRow,
} from '../scripts/lib/permission-control-drift';

const repoPolicies: RepoPolicyRow[] = [
	{ _syncId: 'repo-ops-reference', name: 'Ops Bot content ops' },
];

function desired(
	collection: string,
	action: string,
	overrides: Partial<DesiredPermissionRow> = {},
): DesiredPermissionRow {
	return {
		policy: 'repo-ops-reference',
		collection,
		action,
		fields: ['id', 'title'],
		permissions: null,
		validation: null,
		presets: null,
		...overrides,
	};
}

function live(
	id: string,
	policy: string,
	collection: string,
	action: string,
	overrides: Partial<LivePermissionRow> = {},
): LivePermissionRow {
	return {
		id,
		policy,
		collection,
		action,
		fields: ['id', 'title'],
		permissions: null,
		validation: null,
		presets: null,
		...overrides,
	};
}

const duplicatePolicies: DiagnosticLivePolicyRow[] = [
	{
		id: 'candidate-a',
		name: 'Ops Bot content ops',
		roles: [{ role: { name: 'Content automation' } }],
		users: [{ user: { role: { name: 'Service accounts' } } }],
	},
	{
		id: 'candidate-b',
		name: 'Ops Bot content ops',
		roles: [],
		users: [],
	},
];

describe('duplicate desired-policy candidate diagnostics', () => {
	it('reports candidate evidence without nominating a live policy or using sync ids', () => {
		const diagnostics = buildPolicyCandidateDiagnostics(
			repoPolicies,
			[desired('blog_posts', 'read'), desired('directus_files', 'read')],
			duplicatePolicies,
			[
				live('permission-blog', 'candidate-a', 'blog_posts', 'read'),
				live('permission-files', 'candidate-a', 'directus_files', 'read'),
			],
		);

		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]).toMatchObject({
			policyName: 'Ops Bot content ops',
			desiredSemanticKeyCount: 2,
		});
		expect(diagnostics[0]).not.toHaveProperty('resolution');
		expect(diagnostics[0]).not.toHaveProperty('uniqueFullCoverageCandidateId');
		expect(diagnostics[0]?.candidates[0]).toEqual({
			policyId: 'candidate-a',
			roleAttachmentCount: 1,
			roleNames: ['Content automation'],
			unresolvedRoleAttachmentCount: 0,
			directUserAttachmentCount: 1,
			directUserRoleNames: ['Service accounts'],
			unresolvedDirectUserRoleCount: 0,
			permissionCount: 2,
			desiredSemanticKeyOverlap: 2,
			exactPayloadMatchCount: 2,
			untrackedPermissionCount: 0,
			mismatches: [],
		});
		expect(diagnostics[0]?.candidates[1]).toMatchObject({
			policyId: 'candidate-b',
			permissionCount: 0,
			desiredSemanticKeyOverlap: 0,
			exactPayloadMatchCount: 0,
			mismatches: [
				{ collection: 'blog_posts', action: 'read', kind: 'missing', liveCount: 0, differences: [] },
				{ collection: 'directus_files', action: 'read', kind: 'missing', liveCount: 0, differences: [] },
			],
		});

		const output = formatPolicyCandidateDiagnostics(diagnostics);
		expect(output).toContain('policy_id="candidate-a"');
		expect(output).toContain('role_names=["Content automation"]');
		expect(output).toContain('direct_user_role_names=["Service accounts"]');
		expect(output).not.toContain('RESOLUTION');
		expect(output).not.toContain('candidate_policy_id=');
		expect(output).not.toContain('full_desired_key_coverage=');
		expect(output).not.toContain('repo-ops-reference');
		expect(output).not.toContain('first_name');
		expect(output).not.toContain('last_name');
		expect(output).not.toContain('email');
	});

	it('reports both same-name candidates and payload differences without resolving them', () => {
		const diagnostics = buildPolicyCandidateDiagnostics(
			repoPolicies,
			[desired('blog_posts', 'read')],
			duplicatePolicies,
			[
				live('candidate-a-row', 'candidate-a', 'blog_posts', 'read'),
				live('candidate-b-row', 'candidate-b', 'blog_posts', 'read', { fields: ['id'] }),
			],
		);

		expect(diagnostics[0]).not.toHaveProperty('resolution');
		expect(diagnostics[0]).not.toHaveProperty('uniqueFullCoverageCandidateId');
		expect(diagnostics[0]?.candidates[1]).toMatchObject({
			exactPayloadMatchCount: 0,
			mismatches: [
				{
					collection: 'blog_posts',
					action: 'read',
					kind: 'payload',
					liveCount: 1,
					differences: ['fields'],
				},
			],
		});
		expect(formatPolicyCandidateDiagnostics(diagnostics)).not.toContain(
			'RESOLUTION',
		);
	});

	it('reports duplicate desired-key rows and untracked permissions without payload values', () => {
		const diagnostics = buildPolicyCandidateDiagnostics(
			repoPolicies,
			[desired('blog_posts', 'read')],
			duplicatePolicies,
			[
				live('duplicate-a', 'candidate-a', 'blog_posts', 'read'),
				live('duplicate-b', 'candidate-a', 'blog_posts', 'read'),
				live('extra', 'candidate-a', 'legacy_items', 'read'),
			],
		);

		expect(diagnostics[0]?.candidates[0]).toMatchObject({
			permissionCount: 3,
			desiredSemanticKeyOverlap: 1,
			exactPayloadMatchCount: 0,
			untrackedPermissionCount: 1,
			mismatches: [
				{
					collection: 'blog_posts',
					action: 'read',
					kind: 'duplicate',
					liveCount: 2,
					differences: [],
				},
			],
		});
	});
});

describe('GET-only production candidate diagnostic adapter', () => {
	it('pins production and refuses every mutation-shaped argument', () => {
		expect(parseCandidateDiagnosticArgs(['--target=prod'], `${PROD_CMS_URL}/`)).toEqual({
			directusUrl: PROD_CMS_URL,
		});
		expect(() => parseCandidateDiagnosticArgs([], PROD_CMS_URL)).toThrow(/--target=prod/);
		expect(() => parseCandidateDiagnosticArgs(['--target=dev'], PROD_CMS_URL)).toThrow(/only --target=prod/);
		expect(() => parseCandidateDiagnosticArgs(['--target=prod', '--apply'], PROD_CMS_URL)).toThrow(/read-only/);
		expect(() => parseCandidateDiagnosticArgs(['--target=prod', '--confirm=x'], PROD_CMS_URL)).toThrow(/read-only/);
		expect(() => parseCandidateDiagnosticArgs(['--target=prod'], 'https://example.com')).toThrow(/Unsupported PUBLIC_DIRECTUS_URL/);
	});

	it('uses two GETs, expands role labels, and never requests personal user fields', async () => {
		const calls: Array<{ method: string; path: string }> = [];
		const api: ReadOnlyCandidateApiRequest = async (method, path) => {
			calls.push({ method, path });
			if (path.startsWith('/policies?')) return { status: 200, json: { data: duplicatePolicies } };
			if (path.startsWith('/permissions?')) {
				return {
					status: 200,
					json: { data: [live('permission-blog', 'candidate-a', 'blog_posts', 'read')] },
				};
			}
			throw new Error(`unexpected ${method} ${path}`);
		};

		const diagnostics = await loadPolicyCandidateDiagnostics(
			api,
			repoPolicies,
			[desired('blog_posts', 'read')],
		);

		expect(diagnostics[0]?.candidates[0]).toMatchObject({
			policyId: 'candidate-a',
			desiredSemanticKeyOverlap: 1,
			exactPayloadMatchCount: 1,
		});
		expect(diagnostics[0]).not.toHaveProperty('resolution');
		expect(calls).toHaveLength(2);
		expect(calls.every((call) => call.method === 'GET')).toBe(true);
		expect(calls[0]?.path).toContain('roles.role.name');
		expect(calls[0]?.path).toContain('users.user.role.name');
		expect(calls[0]?.path).not.toMatch(/first_name|last_name|email|token/);
		expect(calls[1]?.path).toContain('fields=id%2Cpolicy%2Ccollection%2Caction%2Cfields%2Cpermissions%2Cvalidation%2Cpresets');
	});

	it('fails closed on a live API error without inference or response-body disclosure', async () => {
		const calls: Array<{ method: string; path: string }> = [];
		const api: ReadOnlyCandidateApiRequest = async (method, path) => {
			calls.push({ method, path });
			return {
				status: 403,
				json: { errors: [{ message: 'private-upstream-detail' }] },
			};
		};

		let message = '';
		try {
			await loadPolicyCandidateDiagnostics(
				api,
				repoPolicies,
				[desired('blog_posts', 'read')],
			);
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}

		expect(message).toBe(
			'[permission-policy-candidate-diagnostic] GET /policies failed (403)',
		);
		expect(message).not.toContain('private-upstream-detail');
		expect(calls).toHaveLength(1);
		expect(calls[0]?.method).toBe('GET');
	});
});
