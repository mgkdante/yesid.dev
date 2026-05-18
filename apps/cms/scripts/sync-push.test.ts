import { describe, expect, it } from 'bun:test';
import {
	PROTECTED_SETTINGS_FILE_FK_FIELDS,
	mergeProtectedSettingsFields,
	syncPushWillTouchSettings,
} from './sync-push';

describe('mergeProtectedSettingsFields (slice-18k #120 per-env file FK auto-merge)', () => {
	const baseRow = {
		project_name: 'yesid.dev CMS',
		project_color: '#E07800',
		project_logo: null,
		public_foreground: null,
		public_favicon: null,
		auth_login_attempts: 25,
	};

	it('merges live values into null committed fields', () => {
		const committed = [{ ...baseRow }];
		const live = {
			project_logo: 'aaaa1111-bbbb-2222-cccc-333344445555',
			public_foreground: 'eeee5555-ffff-6666-aaaa-7777bbbb8888',
			public_favicon: 'cccc9999-dddd-0000-eeee-111122223333',
		};
		const { merged, mergedFields } = mergeProtectedSettingsFields(committed, live);
		expect(mergedFields).toEqual([...PROTECTED_SETTINGS_FILE_FK_FIELDS]);
		expect(merged[0]!.project_logo).toBe('aaaa1111-bbbb-2222-cccc-333344445555');
		expect(merged[0]!.public_foreground).toBe('eeee5555-ffff-6666-aaaa-7777bbbb8888');
		expect(merged[0]!.public_favicon).toBe('cccc9999-dddd-0000-eeee-111122223333');
	});

	it('preserves non-protected fields untouched', () => {
		const committed = [{ ...baseRow }];
		const { merged } = mergeProtectedSettingsFields(committed, {
			project_logo: 'new-uuid',
		});
		expect(merged[0]!.project_name).toBe('yesid.dev CMS');
		expect(merged[0]!.project_color).toBe('#E07800');
		expect(merged[0]!.auth_login_attempts).toBe(25);
	});

	it('no-ops when all live values are null', () => {
		const committed = [{ ...baseRow }];
		const { merged, mergedFields } = mergeProtectedSettingsFields(committed, {
			project_logo: null,
			public_foreground: null,
			public_favicon: null,
		});
		expect(mergedFields).toEqual([]);
		expect(merged[0]!.project_logo).toBeNull();
	});

	it('does NOT overwrite committed non-null values with live values', () => {
		const committed = [{ ...baseRow, project_logo: 'committed-uuid' }];
		const { merged, mergedFields } = mergeProtectedSettingsFields(committed, {
			project_logo: 'live-uuid',
		});
		expect(mergedFields).toEqual([]);
		expect(merged[0]!.project_logo).toBe('committed-uuid');
	});

	it('partial merge: only merges fields where committed is null AND live is non-null', () => {
		const committed = [{ ...baseRow, project_logo: 'committed-logo' }];
		const { merged, mergedFields } = mergeProtectedSettingsFields(committed, {
			project_logo: 'live-logo-different',
			public_foreground: 'live-foreground',
		});
		expect(mergedFields).toEqual(['public_foreground']);
		expect(merged[0]!.project_logo).toBe('committed-logo');
		expect(merged[0]!.public_foreground).toBe('live-foreground');
	});

	it('empty committed array returns unchanged + no merge', () => {
		const { merged, mergedFields } = mergeProtectedSettingsFields([], {
			project_logo: 'x',
		});
		expect(merged).toEqual([]);
		expect(mergedFields).toEqual([]);
	});
});

describe('syncPushWillTouchSettings (slice-18k #120 settings-merge gating)', () => {
	it('returns true for default args (no --exclude, no --only, no --no-collections)', () => {
		expect(syncPushWillTouchSettings([])).toBe(true);
		expect(syncPushWillTouchSettings(['--debug'])).toBe(true);
	});

	it('returns false when --no-collections is passed (snapshot-only push)', () => {
		expect(syncPushWillTouchSettings(['--no-collections'])).toBe(false);
		expect(syncPushWillTouchSettings(['--no-collections', '--debug'])).toBe(false);
	});

	it('returns false when settings is in --exclude-collections', () => {
		expect(syncPushWillTouchSettings(['--exclude-collections', 'settings'])).toBe(false);
		expect(syncPushWillTouchSettings(['-x', 'settings'])).toBe(false);
		expect(syncPushWillTouchSettings(['--exclude-collections=settings'])).toBe(false);
	});

	it('does NOT treat directus_settings as equivalent to settings (only `settings` is the valid enum value per directus-sync 3.5.1)', () => {
		// directus_settings is the system-table name; directus-sync only accepts `settings` in its CLI enum.
		// Honoring directus_settings would silently no-op the preflight on a typo'd exclude flag while
		// the underlying CLI rejects the same flag at option-parse time.
		expect(syncPushWillTouchSettings(['--exclude-collections', 'directus_settings'])).toBe(true);
		expect(syncPushWillTouchSettings(['--only-collections', 'directus_settings'])).toBe(false);
	});

	it('returns false when --only-collections is set but does NOT include settings', () => {
		expect(syncPushWillTouchSettings(['--only-collections', 'permissions'])).toBe(false);
		expect(syncPushWillTouchSettings(['-o', 'collections,fields,relations'])).toBe(false);
	});

	it('returns true when --only-collections explicitly includes settings', () => {
		expect(syncPushWillTouchSettings(['--only-collections', 'settings'])).toBe(true);
		expect(syncPushWillTouchSettings(['-o', 'permissions,settings'])).toBe(true);
		expect(syncPushWillTouchSettings(['--only-collections=settings'])).toBe(true);
	});

	it('returns false when settings is excluded via comma-list', () => {
		expect(syncPushWillTouchSettings(['--exclude-collections', 'permissions,settings'])).toBe(false);
	});
});
