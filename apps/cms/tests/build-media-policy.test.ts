import { expect, it } from 'bun:test';
import permissions from '../directus/collections/permissions.json';
import folders from '../directus/collections/folders.json';
import policies from '../directus/collections/policies.json';
import { fetchBlog } from '../scripts/lib/fetchers/blog-posts';
import type { CmsClient } from '../scripts/lib/fetchers/types';

const BUILD_BOT_POLICY = '8a69d5ef-e94b-44ec-ac4d-736fb4d328f1';
const buildBotFileGrants = () =>
	permissions.filter(row => row.policy === BUILD_BOT_POLICY && row.collection === 'directus_files');

it('Build Bot reads only delivery-folder or unfiled media with export metadata', () => {
	const policy = policies.find(row => row._syncId === BUILD_BOT_POLICY)!;
	expect(policy._syncId).toBe(BUILD_BOT_POLICY);
	expect(policy.admin_access).toBe(false);
	const grants = buildBotFileGrants();
	expect(grants).toHaveLength(1);
	expect(grants[0]).toEqual({
		collection: 'directus_files', action: 'read',
		permissions: { _or: [{ folder: { _in: [
			'5699c47c-c016-484d-ad42-ea35d75ed918', 'da9ff878-3124-43d6-9cf9-11524fc0edd9',
			'02c30511-8c14-46aa-b6f1-cf2d8999290e', '82238060-72ab-414b-8f72-a7f83b15dc59',
			'e4764c31-b8b4-4045-b066-76653bc3c884', '1868fd73-d094-45eb-9d0c-802e2b49cf23',
			'3b0880d2-9e19-4812-9b35-d16fba7c2e46',
		] } }, { folder: { _null: true } }] },
		validation: null, presets: null,
		fields: ['id', 'filename_download', 'type', 'filesize', 'width', 'height', 'folder', 'title', 'description'],
		policy: policy._syncId, _syncId: '_sync_perm_build_files_read_delivery',
	});
	expect(folders.map(row => row.name).sort()).toEqual(['about', 'blog', 'brand', 'illustrations', 'og', 'projects', 'services']);
});

it('Build Bot can read every file field the blog export requests for cover images', async () => {
	let query: { params?: { fields?: unknown[] } } | undefined;
	const client = {
		request: async (command: () => typeof query) => {
			query = command();
			return [];
		},
	} as unknown as CmsClient;
	await fetchBlog({ client });
	const cover = query?.params?.fields?.find(
		(field): field is { cover_image: string[] } => typeof field === 'object' && field !== null && 'cover_image' in field,
	);
	expect(cover?.cover_image.length).toBeGreaterThan(0);
	const granted = new Set(buildBotFileGrants().flatMap(row => row.fields ?? []));
	expect(cover!.cover_image.filter(field => !granted.has(field))).toEqual([]);
});
