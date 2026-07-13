import { describe, expect, it } from 'bun:test';
import {
	buildPermissionAudit,
	formatPermissionAudit,
	normalizePermissionPayload,
	type DesiredPermissionRow,
	type LivePermissionRow,
	type LivePolicyRow,
	type RepoPolicyRow,
} from '../scripts/lib/permission-control-drift';
import {
	PROD_CMS_URL,
	loadPermissionAudit,
	parseAuditArgs,
	type ReadOnlyApiRequest,
} from '../scripts/audit-permission-control-drift';

const repoPolicies: RepoPolicyRow[] = [
	{ _syncId: 'repo-public', name: '$t:public_label' },
	{ _syncId: 'repo-editor', name: 'Human Editor' },
];

const livePolicies: LivePolicyRow[] = [
	{ id: 'live-public', name: '$t:public_label' },
	{ id: 'live-editor', name: 'Human Editor' },
];

function desired(
	policy: string,
	collection: string,
	action: string,
	overrides: Partial<DesiredPermissionRow> = {},
): DesiredPermissionRow {
	return {
		policy,
		collection,
		action,
		fields: ['id', 'title'],
		permissions: { status: { _eq: 'published' } },
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
		permissions: { status: { _eq: 'published' } },
		validation: null,
		presets: null,
		...overrides,
	};
}

describe('semantic Directus permission audit', () => {
	it('compares by policy name + collection + action, never environment ids or sync ids', () => {
		const audit = buildPermissionAudit(
			repoPolicies,
			[
				desired('repo-public', 'blog_posts', 'read', {
					fields: ['title', 'id'],
					permissions: { b: 2, a: { y: true, x: false } },
				}),
			],
			livePolicies,
			[
				live('permission-116', 'live-public', 'blog_posts', 'read', {
					fields: ['id', 'title'],
					permissions: { a: { x: false, y: true }, b: 2 },
				}),
			],
		);

		expect(audit.summary).toEqual({
			equivalent: 1,
			mismatch: 0,
			missing: 0,
			duplicate: 0,
			untracked: 0,
			total: 1,
		});
		expect(audit.entries[0]).toMatchObject({
			classification: 'equivalent',
			policyName: '$t:public_label',
			collection: 'blog_posts',
			action: 'read',
			livePermissionIds: ['permission-116'],
		});
		expect(JSON.stringify(audit)).not.toContain('repo-public');
		expect(JSON.stringify(audit)).not.toContain('live-public');
	});

	it('classifies mismatch, missing, duplicate, and untracked live rows separately', () => {
		const audit = buildPermissionAudit(
			repoPolicies,
			[
				desired('repo-public', 'equivalent', 'read'),
				desired('repo-public', 'mismatch', 'read'),
				desired('repo-public', 'missing', 'read'),
				desired('repo-editor', 'duplicate', 'update'),
			],
			livePolicies,
			[
				live('eq', 'live-public', 'equivalent', 'read'),
				live('mm', 'live-public', 'mismatch', 'read', { fields: ['id'] }),
				live('dupe-1', 'live-editor', 'duplicate', 'update'),
				live('dupe-2', 'live-editor', 'duplicate', 'update'),
				live('extra', 'live-public', 'live_only', 'read'),
			],
		);

		expect(audit.summary).toEqual({
			equivalent: 1,
			mismatch: 1,
			missing: 1,
			duplicate: 1,
			untracked: 1,
			total: 5,
		});
		expect(
			audit.entries.find((entry) => entry.collection === 'mismatch')?.differences,
		).toEqual(['fields']);
		expect(
			audit.entries.find((entry) => entry.collection === 'duplicate'),
		).toMatchObject({
			classification: 'duplicate',
			desiredCount: 1,
			livePermissionIds: ['dupe-1', 'dupe-2'],
		});
	});

	it('normalizes only semantic payload fields and preserves null versus empty object', () => {
		expect(
			normalizePermissionPayload({
				fields: ['title', 'id', 'title'],
				permissions: { b: 2, a: 1 },
				validation: undefined,
				presets: null,
			}),
		).toEqual({
			fields: ['id', 'title'],
			permissions: { a: 1, b: 2 },
			validation: null,
			presets: null,
		});
		expect(
			normalizePermissionPayload({
				fields: null,
				permissions: {},
				validation: null,
				presets: null,
			}).permissions,
		).toEqual({});
	});

	it('keeps unrelated duplicate live policy names as distinct untracked buckets', () => {
		const duplicateUntrackedPolicies: LivePolicyRow[] = [
			...livePolicies,
			{ id: 'legacy-bot-a', name: 'Legacy Bot' },
			{ id: 'legacy-bot-b', name: 'Legacy Bot' },
		];
		const audit = buildPermissionAudit(
			repoPolicies,
			[desired('repo-public', 'blog_posts', 'read')],
			duplicateUntrackedPolicies,
			[
				live('permission-116', 'live-public', 'blog_posts', 'read'),
				live('legacy-a-read', 'legacy-bot-a', 'legacy_items', 'read'),
				live('legacy-b-read', 'legacy-bot-b', 'legacy_items', 'read'),
			],
		);

		expect(audit.summary).toEqual({
			equivalent: 1,
			mismatch: 0,
			missing: 0,
			duplicate: 0,
			untracked: 2,
			total: 3,
		});
		expect(
			audit.entries
				.filter((entry) => entry.policyName === 'Legacy Bot')
				.map((entry) => entry.livePermissionIds),
		).toEqual([['legacy-a-read'], ['legacy-b-read']]);
	});

	it('refuses unresolved and desired policy-name ambiguity before comparing permissions', () => {
		expect(() =>
			buildPermissionAudit(
				repoPolicies,
				[desired('missing-policy', 'blog_posts', 'read')],
				livePolicies,
				[],
			),
		).toThrow(/unknown repository policy reference/);
		expect(() =>
			buildPermissionAudit(
				repoPolicies,
				[desired('repo-public', 'blog_posts', 'read')],
				[...livePolicies, { id: 'duplicate-name', name: '$t:public_label' }],
				[],
			),
		).toThrow(/expected exactly one live policy named "\$t:public_label"; found 2/);
	});

	it('formats every classification and an exact summary', () => {
		const audit = buildPermissionAudit(
			repoPolicies,
			[desired('repo-public', 'missing', 'read')],
			livePolicies,
			[],
		);
		const output = formatPermissionAudit(audit);
		expect(output).toContain('MISSING policy="$t:public_label" missing:read');
		expect(output).toContain(
			'summary equivalent=0 mismatch=0 missing=1 duplicate=0 untracked=0 total=1',
		);
	});
});

describe('read-only production permission audit adapter', () => {
	it('pins production, rejects mutation flags, and cross-checks the URL', () => {
		expect(parseAuditArgs(['--target=prod'], `${PROD_CMS_URL}/`)).toEqual({
			directusUrl: PROD_CMS_URL,
			requireConverged: false,
		});
		expect(
			parseAuditArgs(
				['--target=prod', '--require-converged'],
				PROD_CMS_URL,
			),
		).toEqual({ directusUrl: PROD_CMS_URL, requireConverged: true });
		expect(() => parseAuditArgs([], PROD_CMS_URL)).toThrow(/--target=prod/);
		expect(() => parseAuditArgs(['--target=dev'], PROD_CMS_URL)).toThrow(
			/only --target=prod/,
		);
		expect(() => parseAuditArgs(['--target=prod', '--apply'], PROD_CMS_URL)).toThrow(
			/read-only/,
		);
		expect(() => parseAuditArgs(['--target=prod'], 'https://example.com')).toThrow(
			/Unsupported PUBLIC_DIRECTUS_URL/,
		);
	});

	it('can fail a read-only run when any semantic permission drift remains', async () => {
		const subject = (await import(
			'../scripts/audit-permission-control-drift'
		)) as Record<string, unknown>;
		expect(typeof subject.assertPermissionAuditConverged).toBe('function');
		if (typeof subject.assertPermissionAuditConverged !== 'function') return;
		const assertConverged = subject.assertPermissionAuditConverged as (
			audit: ReturnType<typeof buildPermissionAudit>,
		) => void;
		const equivalent = buildPermissionAudit(
			repoPolicies,
			[desired('repo-public', 'blog_posts', 'read')],
			livePolicies,
			[live('permission-116', 'live-public', 'blog_posts', 'read')],
		);
		expect(() => assertConverged(equivalent)).not.toThrow();

		const drifted = buildPermissionAudit(
			repoPolicies,
			[desired('repo-public', 'blog_posts', 'read')],
			livePolicies,
			[
				live('permission-116', 'live-public', 'blog_posts', 'read', {
					fields: ['id'],
				}),
			],
		);
		expect(() => assertConverged(drifted)).toThrow(
			/convergence required.*mismatch=1.*missing=0.*duplicate=0.*untracked=0/,
		);
	});

	it('uses GET-only full-state queries including presets', async () => {
		const calls: Array<{ method: string; path: string }> = [];
		const api: ReadOnlyApiRequest = async (method, path) => {
			calls.push({ method, path });
			if (path.startsWith('/policies?')) {
				return { status: 200, json: { data: livePolicies } };
			}
			if (path.startsWith('/permissions?')) {
				return {
					status: 200,
					json: {
						data: [live('permission-116', 'live-public', 'blog_posts', 'read')],
					},
				};
			}
			throw new Error(`unexpected ${method} ${path}`);
		};

		const audit = await loadPermissionAudit(
			api,
			repoPolicies,
			[desired('repo-public', 'blog_posts', 'read')],
		);

		expect(audit.summary.equivalent).toBe(1);
		expect(calls).toHaveLength(2);
		expect(calls.every((call) => call.method === 'GET')).toBe(true);
		expect(calls[0]?.path).toContain('fields=id%2Cname');
		expect(calls[0]?.path).toContain('limit=-1');
		expect(calls[1]?.path).toContain('fields=id%2Cpolicy%2Ccollection%2Caction%2Cfields%2Cpermissions%2Cvalidation%2Cpresets');
		expect(calls[1]?.path).toContain('limit=-1');
	});
});
