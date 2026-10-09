import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import declaration from '../directus/production/buildbot-cover-permission.json';
import { parseCoverArgs, reconcile } from '../scripts/reconcile-buildbot-cover-permission';

// Only the external CMS transport is replaced; all planning and guards run.
const beforePermission = { id: 529, policy: declaration.grant.policy, collection: 'blog_posts', action: 'read', fields: ['*'], permissions: null, validation: null, presets: null };
const permissionHash = createHash('sha256').update(JSON.stringify([{
	action: 'read', collection: 'blog_posts', fields: ['*'], id: 529,
	permissions: null, policy: declaration.grant.policy, presets: null, validation: null,
}])).digest('hex');
const spec = { ...declaration, permissionsCount: 1, permissionsSha256: permissionHash };

function cms() {
	const state = structuredClone({ ...spec.expected, permissions: [beforePermission] as any[] });
	const writes: { method: string; path: string; body: unknown }[] = [];
	const queries: URL[] = [];
	let losePost = false;
	let dropPost = false;
	const api = async (method: string, path: string, body?: unknown) => {
		const url = new URL(path, spec.target);
		if (method === 'GET') {
			queries.push(url);
			let data: unknown;
			if (/^\/permissions\/\d+$/.test(url.pathname)) data = state.permissions.find(r => r.id === Number(url.pathname.split('/').at(-1)));
			else if (url.pathname === '/access') data = url.searchParams.has('filter[policy][_eq]') ? state.recipients : state.access;
			else if (url.pathname === '/items/blog_posts') data = state.blogs;
			else data = state[url.pathname.slice(1) as keyof typeof state];
			if (!data) throw Error(`unexpected GET ${path}`);
			return { status: 200, json: { data: structuredClone(data) } };
		}
		writes.push({ method, path, body });
		if (method === 'POST' && path === '/permissions') {
			const row = { id: 900, ...(body as object) };
			if (!dropPost) state.permissions.push(row);
			if (losePost) throw Error('lost response with secret=must-not-escape');
			return { status: 200, json: { data: row } };
		}
		if (method === 'DELETE' && path === '/permissions/900') {
			state.permissions = state.permissions.filter(r => r.id !== 900);
			return { status: 204, json: null };
		}
		throw Error(`unexpected mutation ${method} ${path}`);
	};
	const saved: any[] = [];
	return { state, writes, queries, api, saved, save: async (r: unknown) => { saved.push(structuredClone(r)); }, losePost: () => { losePost = true; }, dropPost: () => { dropPost = true; } };
}

async function preview(c: ReturnType<typeof cms>, extra = {}) {
	return reconcile(spec, c.api, { apply: false, ...extra }, c.save);
}
async function apply(c: ReturnType<typeof cms>) {
	const p = await preview(c);
	return reconcile(spec, c.api, { apply: true, approvalSha256: p.planSha256 }, c.save);
}

test('production-only CLI defaults to read-only and requires exact write acknowledgement and plan hash', () => {
	expect(parseCoverArgs(['--target=prod'], spec.target).apply).toBe(false);
	for (const args of [[], ['--target=dev'], ['--target=prod','--apply'], ['--target=prod','--apply','--confirm=APPLY_PROD_BUILDBOT_COVER_PERMISSION']]) {
		expect(() => parseCoverArgs(args, spec.target)).toThrow();
	}
	expect(() => parseCoverArgs(['--target=prod'], 'https://cms-dev.yesid.dev')).toThrow();
	expect(parseCoverArgs(['--target=prod','--apply','--confirm=APPLY_PROD_BUILDBOT_COVER_PERMISSION',`--approval-sha256=${'a'.repeat(64)}`,'--receipt=apply.json'], spec.target).apply).toBe(true);
});

test('preview reads full recipient and permission inventories but sends no mutation', async () => {
	const c = cms();
	const p = await preview(c);
	expect(p.operation).toBe('create');
	expect(p.planSha256).toMatch(/^[a-f0-9]{64}$/);
	expect(c.writes).toEqual([]);
	expect(c.queries.some(q => q.pathname === '/access' && q.searchParams.get('filter[policy][_eq]') === spec.grant.policy && q.searchParams.get('limit') === '-1')).toBe(true);
	expect(c.queries.find(q => q.pathname === '/permissions')?.searchParams.has('filter[collection][_eq]')).toBe(false);
});

test('approved apply creates exactly one restricted rule, preserves prior rows, and saves ownership before readback', async () => {
	const c = cms();
	const r = await apply(c);
	expect(c.writes).toEqual([{ method: 'POST', path: '/permissions', body: {
		collection: 'directus_files', action: 'read', policy: '9ef59c42-2e10-43e4-b0f9-7b7c91bff997',
		permissions: { id: { _in: ['2c41a9a0-34aa-4e3b-b333-5e6dcd53497c','2d257b93-bb5c-451a-9f2e-143291d881ad','42024627-5dab-496e-9d69-18387300802e','4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d'] } },
		fields: ['id','title','description'], validation: null, presets: null,
	} }]);
	expect(c.state.permissions[0]).toEqual(beforePermission);
	expect(r.status).toBe('verified');
	expect(r.createdId).toBe(900);
	expect(c.saved.some(s => s.status === 'created' && s.createdId === 900)).toBe(true);
});

describe('frozen preimage guards', () => {
	const changes: [string, (s: ReturnType<typeof cms>['state']) => void][] = [
		['added policy recipient', s => s.recipients.push({ ...s.recipients[0]!, id: 'extra', role: 'another-role' } as any)],
		['changed account status', s => { s.users[0]!.status = 'suspended'; }],
		['role inheritance', s => { (s.roles[0] as any).parent = 'other-role'; }],
		['admin access', s => { s.policies[0]!.admin_access = true; }],
		['changed blog mapping', s => { s.blogs[0]!.cover_image.id = 'other-file'; }],
		['changed unrelated permission', s => { s.permissions[0].fields = ['id']; }],
		['new unrelated permission', s => { s.permissions.push({ ...beforePermission, id: 530 }); }],
		['conflicting target', s => { s.permissions.push({ id: 900, ...spec.grant, fields: ['*'] }); }],
		['duplicate target', s => { s.permissions.push({ id: 900, ...spec.grant }, { id: 901, ...spec.grant }); }],
	];
	for (const [label, mutate] of changes) test(`refuses ${label} without writes`, async () => {
		const c = cms(); const p = await preview(c); mutate(c.state);
		await expect(reconcile(spec, c.api, { apply: true, approvalSha256: p.planSha256 }, c.save)).rejects.toThrow();
		expect(c.writes).toEqual([]);
	});
});

test('refuses stale approval hash and preexisting exact rule is a non-owned noop', async () => {
	const c = cms();
	await expect(reconcile(spec, c.api, { apply: true, approvalSha256: 'a'.repeat(64) }, c.save)).rejects.toThrow(/approval/);
	c.state.permissions.push({ id: 900, ...spec.grant });
	const p = await preview(c);
	expect(p.operation).toBe('noop');
	expect(p.createdId).toBeNull();
	expect(c.writes).toEqual([]);
});

test('lost POST response is inspected once, never retried or claimed as rollback ownership', async () => {
	const c = cms(); c.losePost();
	await expect(apply(c)).rejects.toThrow(/uncertain/);
	expect(c.writes).toHaveLength(1);
	expect(c.saved.at(-1).status).toBe('uncertain');
	expect(c.saved.at(-1).observedId).toBe(900);
	expect(c.saved.at(-1).createdId).toBeNull();
	expect(JSON.stringify(c.saved)).not.toContain('must-not-escape');
	expect((await preview(c)).operation).toBe('noop');
});

test('failed create readback preserves receipt and never automatically deletes', async () => {
	const c = cms(); c.dropPost();
	await expect(apply(c)).rejects.toThrow();
	expect(c.saved.some(s => s.createdId === 900 && s.status === 'created')).toBe(true);
	expect(c.writes).toHaveLength(1);
});

test('rollback previews then deletes only its created row and verifies restoration', async () => {
	const c = cms(); const receipt = await apply(c);
	const p = await preview(c, { rollback: receipt });
	expect(p.operation).toBe('delete');
	expect(c.writes).toHaveLength(1);
	const r = await reconcile(spec, c.api, { apply: true, rollback: receipt, approvalSha256: p.planSha256 }, c.save);
	expect(r.status).toBe('rolled-back');
	expect(c.writes.at(-1)).toEqual({ method: 'DELETE', path: '/permissions/900', body: undefined });
	expect(c.state.permissions).toEqual([beforePermission]);
});

test('rollback refuses modified payload, foreign receipt, or missing creation ownership', async () => {
	const c = cms(); const receipt = await apply(c);
	for (const r of [{ ...receipt, createdId: 529 }, { ...receipt, createdId: null }, { ...receipt, manifestSha256: 'bad' }, { ...receipt, status: 'uncertain' }]) {
		await expect(preview(c, { rollback: r })).rejects.toThrow();
	}
	c.state.permissions[1].validation = { id: { _nnull: true } };
	await expect(preview(c, { rollback: receipt })).rejects.toThrow();
	expect(c.writes).toHaveLength(1);
});
