import { describe, expect, it } from 'bun:test';
import {
	BUILD_BOT_POLICY_NAME,
	DEV_CMS_URL,
	PROD_CMS_URL,
	PROD_CONFIRM_PHRASE,
	REQUIRED_READ_COLLECTIONS,
	applyPermissionPlan,
	buildPermissionPlan,
	formatPermissionPlan,
	parseArgs,
	type ApiRequest,
	type PermissionRow,
	type PolicyRow,
} from '../scripts/reconcile-build-bot-tag-permissions';

const policy: PolicyRow = {
	id: 'policy-build-bot',
	name: BUILD_BOT_POLICY_NAME,
};

function permission(
	id: string,
	collection: (typeof REQUIRED_READ_COLLECTIONS)[number],
): PermissionRow {
	return {
		id,
		policy: policy.id,
		collection,
		action: 'read',
		fields: ['*'],
		permissions: {},
		validation: null,
	};
}

describe('reconcile-build-bot-tag-permissions CLI guard', () => {
	it('requires an explicit dev or prod target and defaults to dry-run', () => {
		expect(parseArgs(['--target=dev'], DEV_CMS_URL)).toEqual({
			apply: false,
			target: 'dev',
			directusUrl: DEV_CMS_URL,
		});
		expect(parseArgs(['--target=prod'], `${PROD_CMS_URL}/`)).toEqual({
			apply: false,
			target: 'prod',
			directusUrl: PROD_CMS_URL,
		});
		expect(() => parseArgs([], DEV_CMS_URL)).toThrow('Missing --target=dev|prod');
	});

	it('cross-checks PUBLIC_DIRECTUS_URL against the explicit target', () => {
		expect(() => parseArgs(['--target=dev'], PROD_CMS_URL)).toThrow(
			'PUBLIC_DIRECTUS_URL does not match --target=dev',
		);
		expect(() => parseArgs(['--target=prod'], 'https://example.com')).toThrow(
			'Unsupported PUBLIC_DIRECTUS_URL',
		);
	});

	it('requires the exact confirmation phrase for a production apply', () => {
		expect(() => parseArgs(['--target=prod', '--apply'], PROD_CMS_URL)).toThrow(
			PROD_CONFIRM_PHRASE,
		);
		expect(() =>
			parseArgs(
				['--target=prod', '--apply', '--confirm=wrong'],
				PROD_CMS_URL,
			),
		).toThrow(PROD_CONFIRM_PHRASE);
		expect(
			parseArgs(
				[
					'--target=prod',
					'--apply',
					`--confirm=${PROD_CONFIRM_PHRASE}`,
				],
				PROD_CMS_URL,
			),
		).toEqual({ apply: true, target: 'prod', directusUrl: PROD_CMS_URL });
	});

	it('allows dev writes only with --apply and rejects contradictory modes', () => {
		expect(parseArgs(['--target=dev', '--apply'], DEV_CMS_URL).apply).toBe(true);
		expect(parseArgs(['--target=dev', '--dry-run'], DEV_CMS_URL).apply).toBe(false);
		expect(() =>
			parseArgs(['--target=dev', '--dry-run', '--apply'], DEV_CMS_URL),
		).toThrow('Choose either --dry-run or --apply');
	});
});

describe('Build Bot normalized-tag read permission plan', () => {
	it('plans only the three required collections as exact create/noop operations', () => {
		const plan = buildPermissionPlan([policy], [permission('p1', 'projects_tags')]);

		expect(plan.policy).toEqual(policy);
		expect(plan.entries.map(({ collection, action }) => ({ collection, action }))).toEqual([
			{ collection: 'tags', action: 'create' },
			{ collection: 'projects_tags', action: 'noop' },
			{ collection: 'blog_posts_tags', action: 'create' },
		]);
		expect(plan.entries[0]?.payload).toEqual({
			policy: policy.id,
			collection: 'tags',
			action: 'read',
			fields: ['*'],
			permissions: {},
			validation: null,
		});
		expect(plan.entries[1]?.existingPermissionIds).toEqual(['p1']);
	});

	it('refuses missing or ambiguous Build Bot policies', () => {
		expect(() => buildPermissionPlan([], [])).toThrow(BUILD_BOT_POLICY_NAME);
		expect(() =>
			buildPermissionPlan(
				[policy, { id: 'duplicate', name: BUILD_BOT_POLICY_NAME }],
				[],
			),
		).toThrow('exactly one');
	});

	it('refuses to call a restricted existing read permission a noop', () => {
		const restricted = {
			...permission('p1', 'tags'),
			fields: ['id'],
		};

		expect(() => buildPermissionPlan([policy], [restricted])).toThrow(
			'existing tags:read permission p1 does not match the required unrestricted shape',
		);
	});

	it('prints the policy identity plus every exact create/noop decision', () => {
		const plan = buildPermissionPlan([policy], [permission('p1', 'projects_tags')]);
		const output = formatPermissionPlan(plan);

		expect(output).toContain(`policy=${BUILD_BOT_POLICY_NAME} id=${policy.id}`);
		expect(output).toContain('CREATE tags:read');
		expect(output).toContain('NOOP projects_tags:read existing_permission_ids=["p1"]');
		expect(output).toContain('CREATE blog_posts_tags:read');
		expect(output).toContain('"fields":["*"]');
		expect(output).toContain('summary create=2 noop=1');
	});
});

describe('Build Bot normalized-tag read permission apply', () => {
	it('posts only missing rows, then re-GETs and verifies all three', async () => {
		let permissions: PermissionRow[] = [permission('p1', 'projects_tags')];
		const calls: Array<{ method: string; path: string; body?: unknown }> = [];
		let nextId = 2;
		const api: ApiRequest = async (method, path, body) => {
			calls.push({ method, path, body });
			if (method === 'POST' && path === '/permissions') {
				const payload = body as Omit<PermissionRow, 'id'>;
				const row = { id: `p${nextId++}`, ...payload } satisfies PermissionRow;
				permissions = [...permissions, row];
				return { status: 200, json: { data: row } };
			}
			if (method === 'GET' && path.startsWith('/permissions?')) {
				return { status: 200, json: { data: permissions } };
			}
			throw new Error(`unexpected ${method} ${path}`);
		};

		const initial = buildPermissionPlan([policy], permissions);
		const verified = await applyPermissionPlan(api, initial);

		expect(calls.filter((call) => call.method === 'POST')).toHaveLength(2);
		expect(
			calls.filter((call) => call.method === 'POST').map((call) =>
				(call.body as { collection: string }).collection,
			),
		).toEqual(['tags', 'blog_posts_tags']);
		expect(calls.at(-1)?.method).toBe('GET');
		expect(verified.entries.every((entry) => entry.action === 'noop')).toBe(true);
	});

	it('fails verification if the re-GET does not expose a created row', async () => {
		const api: ApiRequest = async (method, path) => {
			if (method === 'POST' && path === '/permissions') {
				return { status: 200, json: { data: {} } };
			}
			if (method === 'GET' && path.startsWith('/permissions?')) {
				return { status: 200, json: { data: [] } };
			}
			throw new Error(`unexpected ${method} ${path}`);
		};

		await expect(applyPermissionPlan(api, buildPermissionPlan([policy], []))).rejects.toThrow(
			're-GET verification failed',
		);
	});
});
