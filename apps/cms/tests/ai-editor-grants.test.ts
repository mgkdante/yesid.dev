// JSON-invariant guard for the live AI Editor grant extension (slice-43.22).
import { describe, expect, it } from 'bun:test';
import policies from '../directus/collections/policies.json';
import permissions from '../directus/collections/permissions.json';
import settings from '../directus/collections/settings.json';
// Exact 45-row payload supplied with WO-43.22; keep independent of the repo dump.
import expectedGrants from './fixtures/ai-editor-grants.json';

const POLICY_ID = '_sync_ai_editor_policy';
const aiPermissions = permissions.filter((row) => row.policy === POLICY_ID);

function permission(collection: string, action: string) {
	const rows = aiPermissions.filter((row) => row.collection === collection && row.action === action);
	expect(rows).toHaveLength(1);
	return rows[0]!;
}

describe('AI Editor grants (slice-43.22)', () => {
	it('keeps the AI Editor non-admin with no delete permissions', () => {
		const policy = policies.find((row) => row._syncId === POLICY_ID);
		expect(policy?.admin_access).toBe(false);
		expect(aiPermissions.filter((row) => row.action === 'delete')).toEqual([]);
	});

	it('holds exactly the 45 supplied grants with their sync identities and payloads', () => {
		expect(expectedGrants).toHaveLength(45);
		const collections = new Set(expectedGrants.map((row) => row.collection));
		const actual = aiPermissions.filter((row) => collections.has(row.collection));
		expect(actual).toHaveLength(45);
		for (const expected of expectedGrants) {
			const rows = permissions.filter((row) => row._syncId === expected._syncId);
			expect(rows).toEqual([expected]);
		}
	});

	it('limits file access to the supplied read fields and editable metadata', () => {
		const readFields = permission('directus_files', 'read').fields;
		for (const field of [
			'*', 'filename_disk', 'storage', 'uploaded_by', 'modified_by',
			'metadata', 'location', 'tus_id', 'tus_data',
		]) expect(readFields).not.toContain(field);
		expect(permission('directus_files', 'update').fields).toEqual([
			'title', 'description', 'tags', 'focal_point_x', 'focal_point_y',
		]);
	});

	it('allows site-label updates only through translations', () => {
		expect(permission('site_labels', 'update').fields).toEqual(['translations']);
	});

	for (const collection of ['route_seo', 'legal_pages', 'contact_channels', 'about_languages']) {
		it(`creates ${collection} as drafts and rejects publishing on create or update`, () => {
			const create = permission(collection, 'create');
			const update = permission(collection, 'update');
			const validation = { _and: [{ status: { _neq: 'published' } }] };
			expect(create.presets).toEqual({ status: 'draft' });
			expect(create.validation).toEqual(validation);
			expect(update.validation).toEqual(validation);
		});
	}

	it('keeps structural site pages read-only', () => {
		expect(aiPermissions.filter((row) => row.collection === 'site_pages').map((row) => row.action))
			.toEqual(['read']);
	});

	it('describes route SEO and file metadata without the retired technology body field', () => {
		const prompt = settings[0]!.mcp_system_prompt;
		expect(prompt).toContain('route SEO');
		expect(prompt).toContain('file metadata');
		expect(prompt).not.toContain('tech_stack.body');
	});
});
