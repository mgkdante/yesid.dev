import { describe, expect, it } from 'bun:test';
import type {
	DesiredPermissionRow,
	LivePermissionRow,
	LivePolicyRow,
	RepoPolicyRow,
} from '../scripts/lib/permission-control-drift';
import {
	PROD_CMS_URL,
	PROD_CONFIRM_PHRASE,
	PUBLIC_POLICY_NAME,
	applyAndVerifyPublicBlogPermission,
	buildPublicBlogPermissionPlan,
	createPublicBlogPermissionCms,
	formatPublicBlogPermissionPlan,
	parseReconcileArgs,
	selectDesiredPublicBlogPermission,
	type PermissionApiRequest,
	type PublicBlogPermissionCms,
} from '../scripts/reconcile-public-blog-permission';

const repoPolicies: RepoPolicyRow[] = [
	{ _syncId: 'repo-public', name: PUBLIC_POLICY_NAME },
];

const desiredRows: DesiredPermissionRow[] = [
	{
		policy: 'repo-public',
		collection: 'blog_posts',
		action: 'read',
		fields: [
			'id',
			'translation_key',
			'status',
			'title',
			'excerpt',
		],
		permissions: { status: { _eq: 'published' } },
		validation: null,
		presets: null,
	},
];

const livePolicies: LivePolicyRow[] = [
	{ id: 'live-public', name: PUBLIC_POLICY_NAME },
];

function stalePermission(
	overrides: Partial<LivePermissionRow> = {},
): LivePermissionRow {
	return {
		id: 116,
		policy: 'live-public',
		collection: 'blog_posts',
		action: 'read',
		fields: ['id', 'status', 'title', 'excerpt'],
		permissions: { status: { _eq: 'published' } },
		validation: null,
		presets: null,
		...overrides,
	};
}

function convergedPermission(): LivePermissionRow {
	return {
		...stalePermission(),
		fields: [...(desiredRows[0]!.fields ?? [])],
	};
}

function desiredTarget() {
	return selectDesiredPublicBlogPermission(repoPolicies, desiredRows);
}

describe('public blog permission CLI guard', () => {
	it('is production-only and defaults to dry-run', () => {
		expect(parseReconcileArgs(['--target=prod'], `${PROD_CMS_URL}/`)).toEqual({
			apply: false,
			directusUrl: PROD_CMS_URL,
		});
		expect(() => parseReconcileArgs([], PROD_CMS_URL)).toThrow(/--target=prod/);
		expect(() => parseReconcileArgs(['--target=dev'], PROD_CMS_URL)).toThrow(
			/only --target=prod/,
		);
	});

	it('requires the exact production confirmation and rejects irrelevant confirmation', () => {
		expect(() =>
			parseReconcileArgs(['--target=prod', '--apply'], PROD_CMS_URL),
		).toThrow(PROD_CONFIRM_PHRASE);
		expect(() =>
			parseReconcileArgs(
				['--target=prod', '--apply', '--confirm=wrong'],
				PROD_CMS_URL,
			),
		).toThrow(PROD_CONFIRM_PHRASE);
		expect(
			parseReconcileArgs(
				[
					'--target=prod',
					'--apply',
					`--confirm=${PROD_CONFIRM_PHRASE}`,
				],
				PROD_CMS_URL,
			),
		).toEqual({ apply: true, directusUrl: PROD_CMS_URL });
		expect(() =>
			parseReconcileArgs(
				['--target=prod', `--confirm=${PROD_CONFIRM_PHRASE}`],
				PROD_CMS_URL,
			),
		).toThrow(/only for PROD apply/);
	});
});

describe('public blog permission target selection and plan', () => {
	it('selects the desired row by policy name + collection + action', () => {
		const desired = desiredTarget();
		expect(desired).toMatchObject({
			policyName: PUBLIC_POLICY_NAME,
			collection: 'blog_posts',
			action: 'read',
		});
		expect(desired.payload.fields).toContain('translation_key');
		expect(JSON.stringify(desired)).not.toContain('repo-public');
	});

	it('plans one fields-only patch when translation_key is the only drift', () => {
		const desired = desiredTarget();
		const plan = buildPublicBlogPermissionPlan(
			desired,
			livePolicies,
			[stalePermission()],
		);

		expect(plan).toMatchObject({
			action: 'update',
			permissionId: 116,
			policyName: PUBLIC_POLICY_NAME,
			collection: 'blog_posts',
		});
		expect(plan.patch).toEqual({ fields: desired.payload.fields });
		expect(Object.keys(plan.patch ?? {})).toEqual(['fields']);
		expect(formatPublicBlogPermissionPlan(plan)).toContain(
			'PATCH permission=116 fields-only add=translation_key',
		);
	});

	it('is a noop when the exact desired row is already live', () => {
		const desired = desiredTarget();
		const plan = buildPublicBlogPermissionPlan(
			desired,
			livePolicies,
			[convergedPermission()],
		);
		expect(plan.action).toBe('noop');
		expect(plan.patch).toBeNull();
	});

	it('refuses missing or duplicate policies and permission rows', () => {
		const desired = desiredTarget();
		expect(() =>
			buildPublicBlogPermissionPlan(desired, [], [stalePermission()]),
		).toThrow(/exactly one live public policy/);
		expect(() =>
			buildPublicBlogPermissionPlan(
				desired,
				[...livePolicies, { id: 'other', name: PUBLIC_POLICY_NAME }],
				[stalePermission()],
			),
		).toThrow(/exactly one live public policy/);
		expect(() =>
			buildPublicBlogPermissionPlan(desired, livePolicies, []),
		).toThrow(/exactly one live blog_posts:read permission/);
		expect(() =>
			buildPublicBlogPermissionPlan(desired, livePolicies, [
				stalePermission(),
				stalePermission({ id: 117 }),
			]),
		).toThrow(/exactly one live blog_posts:read permission/);
	});

	it('refuses every unrelated field or payload drift', () => {
		const desired = desiredTarget();
		expect(() =>
			buildPublicBlogPermissionPlan(desired, livePolicies, [
				stalePermission({ fields: ['id', 'status', 'title'] }),
			]),
		).toThrow(/unrelated drift.*fields/);
		expect(() =>
			buildPublicBlogPermissionPlan(desired, livePolicies, [
				stalePermission({ permissions: {} }),
			]),
		).toThrow(/unrelated drift.*permissions/);
		expect(() =>
			buildPublicBlogPermissionPlan(desired, livePolicies, [
				stalePermission({ presets: { status: 'draft' } }),
			]),
		).toThrow(/unrelated drift.*presets/);
		expect(() =>
			buildPublicBlogPermissionPlan(desired, livePolicies, [
				stalePermission({ fields: ['excerpt', 'id', 'status', 'title'] }),
			]),
		).toThrow(/fields order/);
	});

	it('refuses a forged target descriptor even when its payload looks valid', () => {
		const desired = desiredTarget();
		expect(() =>
			buildPublicBlogPermissionPlan(
				{ ...desired, collection: 'projects' } as never,
				livePolicies,
				[stalePermission()],
			),
		).toThrow(/target identity/);
	});

	it('refuses a desired row without exactly one translation_key field', () => {
		expect(() =>
			selectDesiredPublicBlogPermission(repoPolicies, [
				{ ...desiredRows[0]!, fields: ['id', 'status'] },
			]),
		).toThrow(/translation_key/);
		expect(() =>
			selectDesiredPublicBlogPermission(repoPolicies, [
				...desiredRows,
				{ ...desiredRows[0]! },
			]),
		).toThrow(/exactly one repository permission/);
	});

	it('refuses duplicate repository policy references before selecting the target', () => {
		expect(() =>
			selectDesiredPublicBlogPermission(
				[
					...repoPolicies,
					{ _syncId: 'repo-public', name: 'Human Editor' },
				],
				desiredRows,
			),
		).toThrow(/duplicate repository policy reference repo-public/);
	});
});

function fakeCms(reads: Array<{ policies: LivePolicyRow[]; permissions: LivePermissionRow[] }>): {
	cms: PublicBlogPermissionCms;
	patches: Array<{ id: string | number; body: unknown }>;
} {
	const patches: Array<{ id: string | number; body: unknown }> = [];
	return {
		cms: {
			read: async () => reads.shift() ?? { policies: [], permissions: [] },
			patch: async (id, body) => {
				patches.push({ id, body: structuredClone(body) });
			},
		},
		patches,
	};
}

describe('public blog permission apply verification', () => {
	it('re-reads, patches only fields, then re-GET verifies convergence', async () => {
		const desired = desiredTarget();
		const initialState = { policies: livePolicies, permissions: [stalePermission()] };
		const plan = buildPublicBlogPermissionPlan(
			desired,
			initialState.policies,
			initialState.permissions,
		);
		const { cms, patches } = fakeCms([
			initialState,
			{ policies: livePolicies, permissions: [convergedPermission()] },
		]);

		const verified = await applyAndVerifyPublicBlogPermission(cms, desired, plan);

		expect(patches).toEqual([
			{ id: 116, body: { fields: desired.payload.fields } },
		]);
		expect(verified.action).toBe('noop');
	});

	it('refuses changed pre-apply state and stale post-apply state', async () => {
		const desired = desiredTarget();
		const displayed = buildPublicBlogPermissionPlan(
			desired,
			livePolicies,
			[stalePermission()],
		);
		await expect(
			applyAndVerifyPublicBlogPermission(
				fakeCms([
					{ policies: livePolicies, permissions: [convergedPermission()] },
				]).cms,
				desired,
				displayed,
			),
		).rejects.toThrow(/state changed before apply/);
		await expect(
			applyAndVerifyPublicBlogPermission(
				fakeCms([
					{ policies: livePolicies, permissions: [stalePermission()] },
					{ policies: livePolicies, permissions: [stalePermission()] },
				]).cms,
				desired,
				displayed,
			),
		).rejects.toThrow(/post-apply verification failed/);
	});
});

describe('public blog permission Directus adapter', () => {
	it('queries the exact semantic target and PATCHes only fields', async () => {
		const desired = desiredTarget();
		const calls: Array<{ method: string; path: string; body?: unknown }> = [];
		const api: PermissionApiRequest = async (method, path, body) => {
			calls.push({ method, path, body });
			if (method === 'GET' && path.startsWith('/policies?')) {
				return { status: 200, json: { data: livePolicies } };
			}
			if (method === 'GET' && path.startsWith('/permissions?')) {
				return { status: 200, json: { data: [stalePermission()] } };
			}
			if (method === 'PATCH' && path === '/permissions/116') {
				return { status: 200, json: { data: { id: 116 } } };
			}
			throw new Error(`unexpected ${method} ${path}`);
		};
		const cms = createPublicBlogPermissionCms(api);
		await cms.read();
		await cms.patch(116, { fields: desired.payload.fields! });

		expect(calls[0]?.path).toContain('filter%5Bname%5D%5B_eq%5D=%24t%3Apublic_label');
		expect(calls[1]?.path).toContain('filter%5Bpolicy%5D%5B_eq%5D=live-public');
		expect(calls[1]?.path).toContain('filter%5Bcollection%5D%5B_eq%5D=blog_posts');
		expect(calls[1]?.path).toContain('filter%5Baction%5D%5B_eq%5D=read');
		expect(calls[1]?.path).toContain('presets');
		expect(calls[2]).toEqual({
			method: 'PATCH',
			path: '/permissions/116',
			body: { fields: desired.payload.fields },
		});
	});
});
