// JSON-invariant guard for the live public-read narrowing (slice-43.26).
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import folders from '../directus/collections/folders.json';
import permissions from '../directus/collections/permissions.json';

const POLICY_ID = '_sync_default_public_policy';
const publicPermissions = permissions.filter((row) => row.policy === POLICY_ID);
const snapshotDir = join(import.meta.dir, '../directus/snapshot');

function permission(collection: string) {
	const rows = publicPermissions.filter((row) => row.collection === collection && row.action === 'read');
	expect(rows).toHaveLength(1);
	return rows[0]!;
}

function hasPublishedFilter(filter: unknown): boolean {
	if (!filter || typeof filter !== 'object') return false;
	const { status, _and } = filter as { status?: { _eq?: unknown }; _and?: unknown[] };
	return status?._eq === 'published' || (Array.isArray(_and) && _and.some(hasPublishedFilter));
}

describe('Public read policy (slice-43.26)', () => {
	for (const collection of ['nav_links', 'site_pages', 'error_pages', 'blog_posts', 'projects', 'tech_stack']) {
		it(`reads only published ${collection}`, () => {
			expect<unknown[]>([
				{ status: { _eq: 'published' } },
				{ _and: [{ status: { _eq: 'published' } }] },
			]).toContainEqual(permission(collection).permissions);
		});
	}

	it('filters every status-bearing public read except block singletons to published rows', () => {
		const statusCollections = new Set(
			readdirSync(join(snapshotDir, 'fields')).filter((collection) =>
				existsSync(join(snapshotDir, 'fields', collection, 'status.json')),
			),
		);
		const violations = publicPermissions.filter((row) => {
			if (row.action !== 'read' || !statusCollections.has(row.collection)) return false;
			const snapshot = JSON.parse(readFileSync(
				join(snapshotDir, 'collections', `${row.collection}.json`), 'utf8',
			)) as { meta: { singleton: boolean } };
			if (row.collection.startsWith('block_') && snapshot.meta.singleton) return false;
			return !hasPublishedFilter(row.permissions);
		});
		expect(violations.map((row) => row.collection)).toEqual([]);
	});

	// slice-43.28 removes the deleted empty icons folder from public file access.
	it('exposes only delivery metadata for files in the seven retained folders', () => {
		const files = permission('directus_files');
		expect(files._syncId).toBe('_sync_perm_public_files_read_folder_scoped');
		expect(files.fields).toEqual([
			'id', 'title', 'description', 'type', 'filesize', 'width', 'height', 'duration',
			'focal_point_x', 'focal_point_y', 'filename_download', 'modified_on',
		]);
		for (const field of [
			'metadata', 'location', 'uploaded_by', 'modified_by', 'storage', 'filename_disk',
			'tus_id', 'tus_data',
		]) expect(files.fields).not.toContain(field);
		const retainedFolderIds = [
			'5699c47c-c016-484d-ad42-ea35d75ed918',
			'da9ff878-3124-43d6-9cf9-11524fc0edd9',
			'02c30511-8c14-46aa-b6f1-cf2d8999290e',
			'82238060-72ab-414b-8f72-a7f83b15dc59',
			'e4764c31-b8b4-4045-b066-76653bc3c884',
			'1868fd73-d094-45eb-9d0c-802e2b49cf23',
			'3b0880d2-9e19-4812-9b35-d16fba7c2e46',
		];
		expect(files.permissions).toEqual({ _and: [{ folder: { id: { _in: retainedFolderIds } } }] });
		expect(folders.map((folder) => folder.name).sort()).toEqual([
			'about', 'blog', 'brand', 'illustrations', 'og', 'projects', 'services',
		]);
		expect(folders.map((folder) => folder._syncId).sort()).toEqual([...retainedFolderIds].sort());
	});

	it('has no create, update or delete permissions', () => {
		expect(publicPermissions.filter((row) => ['create', 'update', 'delete'].includes(row.action)))
			.toEqual([]);
	});
});
