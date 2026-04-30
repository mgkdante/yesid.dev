import { describe, expect, it } from 'bun:test';
import {
	PERMISSIONS_PUSH_ACK,
	PROD_SCHEMA_PUSH_ACK,
	buildDirectusSyncPushArgs,
} from '../scripts/sync-push';

describe('sync-push guard', () => {
	it('refuses production pushes without explicit ack env', () => {
		expect(() =>
			buildDirectusSyncPushArgs([], { DIRECTUS_URL: 'https://cms.yesid.dev' }),
		).toThrow(/Refusing production sync:push/);
	});

	it('treats an unset DIRECTUS_URL as production because directus-sync config defaults to prod', () => {
		expect(() => buildDirectusSyncPushArgs([], {})).toThrow(
			/Refusing production sync:push/,
		);
	});

	it('adds permissions to excluded collections by default', () => {
		const args = buildDirectusSyncPushArgs([], {
			DIRECTUS_URL: 'https://staging.example.test',
		});
		expect(args).toEqual(['--exclude-collections', 'permissions']);
	});

	it('merges permissions into an existing exclude list', () => {
		const args = buildDirectusSyncPushArgs(
			['--exclude-collections', 'dashboards,panels'],
			{ DIRECTUS_URL: 'https://staging.example.test' },
		);
		expect(args).toEqual([
			'--exclude-collections',
			'dashboards,panels,permissions',
		]);
	});

	it('does not add exclude when only-collections already narrows away from permissions', () => {
		const args = buildDirectusSyncPushArgs(['--only-collections', 'settings'], {
			DIRECTUS_URL: 'https://staging.example.test',
		});
		expect(args).toEqual(['--only-collections', 'settings']);
	});

	it('refuses an explicit permissions-only push without permission ack', () => {
		expect(() =>
			buildDirectusSyncPushArgs(['--only-collections', 'permissions'], {
				DIRECTUS_URL: 'https://staging.example.test',
			}),
		).toThrow(/Refusing permissions sync:push/);
	});

	it('allows deliberate production permissions push with both acks', () => {
		const args = buildDirectusSyncPushArgs(['--only-collections', 'permissions'], {
			DIRECTUS_URL: 'https://cms.yesid.dev',
			DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH: '1',
			DIRECTUS_SYNC_PUSH_ACK: PROD_SCHEMA_PUSH_ACK,
			DIRECTUS_SYNC_INCLUDE_PERMISSIONS: '1',
			DIRECTUS_SYNC_PERMISSIONS_ACK: PERMISSIONS_PUSH_ACK,
		});
		expect(args).toEqual(['--only-collections', 'permissions']);
	});
});
