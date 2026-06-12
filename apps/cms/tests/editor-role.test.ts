// apps/cms/tests/editor-role.test.ts
// JSON-invariant guard for the Editor role wiring (go2-t1d).
//
// The Editor role is the daily-driver human login: the dormant Human Editor
// policy (190 itemized collection permissions) is re-scoped (admin_access off)
// and attached to it, plus directus_files create/read/update and
// directus_folders read (app-access minimums exclude files). module_bar drops
// the dead-weight visual + users modules. Apply is orchestrator-only via the
// gated permissions push (see PR runbook).
import { describe, expect, it } from 'bun:test';
import roles from '../directus/collections/roles.json';
import policies from '../directus/collections/policies.json';
import permissions from '../directus/collections/permissions.json';
import settings from '../directus/collections/settings.json';

type Policy = { name: string; admin_access: boolean; app_access: boolean; roles: Array<{ role: string | null }>; _syncId: string };
type Perm = { collection: string; action: string; policy: string };

describe('Editor role wiring (go2-t1d)', () => {
	it('Editor role exists', () => {
		expect((roles as Array<{ name: string; _syncId: string }>).find((r) => r.name === 'Editor')?._syncId).toBe('_sync_editor_role');
	});
	it('Human Editor policy is scoped (admin off, app on) and attached to the Editor role', () => {
		const he = (policies as Policy[]).find((p) => p._syncId === '_sync_human_editor_policy')!;
		expect(he.admin_access).toBe(false);
		expect(he.app_access).toBe(true);
		expect(he.roles.map((r) => r.role)).toContain('_sync_editor_role');
	});
	it('Human Editor policy carries directus_files create/read/update + directus_folders read', () => {
		const filePerms = (permissions as Perm[]).filter(
			(p) => p.policy === '_sync_human_editor_policy' && p.collection === 'directus_files',
		);
		expect(filePerms.map((p) => p.action).sort()).toEqual(['create', 'read', 'update']);
		const folderPerms = (permissions as Perm[]).filter(
			(p) => p.policy === '_sync_human_editor_policy' && p.collection === 'directus_folders',
		);
		expect(folderPerms.map((p) => p.action)).toEqual(['read']);
	});
	it('module_bar disables visual + users, keeps content/files/insights/deployments/settings', () => {
		const bar = (settings as Array<{ module_bar: Array<{ id: string; enabled: boolean }> }>)[0].module_bar;
		const byId = Object.fromEntries(bar.map((m) => [m.id, m.enabled]));
		expect(byId.visual).toBe(false);
		expect(byId.users).toBe(false);
		for (const id of ['content', 'files', 'insights', 'deployments', 'settings']) expect(byId[id]).toBe(true);
	});
});
