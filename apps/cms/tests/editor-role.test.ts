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
import { createHash } from 'node:crypto';
import roles from '../directus/collections/roles.json';
import policies from '../directus/collections/policies.json';
import permissions from '../directus/collections/permissions.json';
import presets from '../directus/collections/presets.json';
import settings from '../directus/collections/settings.json';
import {
	ASSET_EDITOR_POLICY_NAMES,
	ASSET_REGISTRY_COLLECTIONS,
	buildAssetEditorPresetPayloads,
	buildDesiredAssetPermissions,
	type AssetEditorPolicyName,
} from '../scripts/lib/assets/editor-presets';

type Policy = { name: string; admin_access: boolean; app_access: boolean; roles: Array<{ role: string | null }>; _syncId: string };
type Perm = { collection: string; action: string; policy: string };

const UNRELATED_PERMISSION_COUNT = 767;
const UNRELATED_PERMISSION_SHA256 = '8215ed32788bc3d687f1acadafbbbb2dcf680e2678d59ef97fd2d9d789e258fc';
const UNRELATED_PRESET_COUNT = 4;
const UNRELATED_PRESET_SHA256 = '6b39309335092f0705d137c3fc7fa86453639c56651abb30e734c56daf1fe092';

function withoutSyncId<T extends { _syncId?: string }>(row: T): Omit<T, '_syncId'> {
	const { _syncId: _ignored, ...payload } = row;
	return payload;
}

function normalizedPermissionSnapshot<
	T extends { _syncId?: string; fields: string[] },
>(row: T): Omit<T, '_syncId'> {
	const payload = withoutSyncId(row);
	return { ...payload, fields: [...payload.fields].sort() };
}

function withoutPresetSyncMetadata<
	T extends { _syncId?: string; user?: unknown },
>(row: T): Omit<T, '_syncId' | 'user'> {
	const { _syncId: _syncIdIgnored, user: _userIgnored, ...payload } = row;
	return payload;
}

function rowsSha256(rows: readonly unknown[]): string {
	return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}

function sortPermissionRows<T extends { policy: string; collection: string; action: string }>(
	rows: readonly T[],
): T[] {
	return [...rows].sort((left, right) =>
		`${left.policy}\0${left.collection}\0${left.action}`.localeCompare(
			`${right.policy}\0${right.collection}\0${right.action}`,
		),
	);
}

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
		const bar = (settings as Array<{ module_bar: Array<{ id: string; enabled: boolean }> }>)[0]!
			.module_bar;
		const byId = Object.fromEntries(bar.map((m) => [m.id, m.enabled]));
		expect(byId.visual).toBe(false);
		expect(byId.users).toBe(false);
		for (const id of ['content', 'files', 'insights', 'deployments', 'settings']) expect(byId[id]).toBe(true);
	});

	it('snapshots exactly the 31 governed asset-registry permission rows', () => {
		const policyIds = Object.fromEntries(
			ASSET_EDITOR_POLICY_NAMES.map((name) => [
				name,
				(policies as Policy[]).find((policy) => policy.name === name)?._syncId,
			]),
		) as Record<AssetEditorPolicyName, string>;
		for (const name of ASSET_EDITOR_POLICY_NAMES) expect(policyIds[name], name).toBeTruthy();

		const actual = (permissions as Array<Perm & { _syncId: string }>)
			.filter((row) => (ASSET_REGISTRY_COLLECTIONS as readonly string[]).includes(row.collection))
			.map((row) => normalizedPermissionSnapshot(row as Perm & { _syncId: string; fields: string[] }));
		const expected = buildDesiredAssetPermissions(policyIds).map((row) => ({
			...row,
			fields: [...row.fields].sort(),
		}));

		expect(actual).toHaveLength(31);
		expect(sortPermissionRows(actual)).toEqual(sortPermissionRows(expected));
	});

	it('snapshots exactly the ten role-scoped asset-registry editor bookmarks', () => {
		const managedRows = (presets as Array<{
			_syncId: string;
			role: string | null;
			user?: unknown;
			collection: string;
			bookmark: string | null;
		}>)
			.filter((row) => (ASSET_REGISTRY_COLLECTIONS as readonly string[]).includes(row.collection));
		for (const row of managedRows) {
			// directus-sync intentionally omits the per-user field from preset exports.
			expect(Object.hasOwn(row, 'user'), row.bookmark ?? row.collection).toBe(false);
		}
		const actual = managedRows
			.map(withoutPresetSyncMetadata)
			.sort((left, right) => String(left.bookmark).localeCompare(String(right.bookmark)));
		const expected = buildAssetEditorPresetPayloads('_sync_editor_role')
			.map(withoutPresetSyncMetadata)
			.sort((left, right) => left.bookmark.localeCompare(right.bookmark));

		expect(actual).toHaveLength(10);
		expect(actual).toEqual(expected);
	});

	it('gives every permission and preset a distinct, non-empty table-scoped sync identity', () => {
		const permissionRows = permissions as Array<{ collection: string; _syncId?: unknown }>;
		const presetRows = presets as Array<{ collection: string; _syncId?: unknown }>;
		const managedPermissionRows = permissionRows.filter((row) =>
			(ASSET_REGISTRY_COLLECTIONS as readonly string[]).includes(row.collection),
		);
		const managedPresetRows = presetRows.filter((row) =>
			(ASSET_REGISTRY_COLLECTIONS as readonly string[]).includes(row.collection),
		);

		expect(managedPermissionRows).toHaveLength(31);
		expect(managedPresetRows).toHaveLength(10);
		for (const rows of [permissionRows, presetRows]) {
			const ids = rows.map((row) => row._syncId);
			expect(ids.every((value) => typeof value === 'string' && value.length > 0)).toBe(true);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it('preserves every unrelated permission and preset row while adding registry configuration', () => {
		const unrelatedPermissions = (permissions as Array<{ collection: string }>).filter(
			(row) => !(ASSET_REGISTRY_COLLECTIONS as readonly string[]).includes(row.collection),
		);
		const unrelatedPresets = (presets as Array<{ collection: string }>).filter(
			(row) => !(ASSET_REGISTRY_COLLECTIONS as readonly string[]).includes(row.collection),
		);

		expect(unrelatedPermissions).toHaveLength(UNRELATED_PERMISSION_COUNT);
		expect(rowsSha256(unrelatedPermissions)).toBe(UNRELATED_PERMISSION_SHA256);
		expect(unrelatedPresets).toHaveLength(UNRELATED_PRESET_COUNT);
		expect(rowsSha256(unrelatedPresets)).toBe(UNRELATED_PRESET_SHA256);
	});
});
