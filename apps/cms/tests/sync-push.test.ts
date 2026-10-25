import { describe, expect, it } from 'bun:test';
import {
	PERMISSIONS_PUSH_ACK,
	PROD_SCHEMA_PUSH_ACK,
	buildDirectusSyncPushArgs,
} from '../scripts/sync-push';

describe('sync-push guard', () => {
	const DEV_ENV = { DIRECTUS_URL: 'https://cms.dev.yesid.dev' };
	const STAGING_ENV = { DIRECTUS_URL: 'https://staging.example.test' };
	const buildStaging = (args: readonly string[]) =>
		buildDirectusSyncPushArgs(args, STAGING_ENV);

	it('guards explicit and default production targets', () => {
		for (const env of [{ DIRECTUS_URL: 'https://cms.yesid.dev' }, {}]) {
			expect(() => buildDirectusSyncPushArgs([], env)).toThrow(
				/Refusing production sync:push/,
			);
		}
	});

	it('guards every production CLI override form against a stale dev env', () => {
		for (const args of [
			['--directus-url', 'https://cms.yesid.dev'],
			['--directus-url=https://cms.yesid.dev/'],
			['-u', 'https://cms.yesid.dev/'],
			['-uhttps://cms.yesid.dev/'],
			['-duhttps://cms.yesid.dev/'],
			['-du', 'https://cms.yesid.dev/'],
			['-uhttps://cms.dev.yesid.dev', '-duhttps://cms.yesid.dev'],
			['-uhttps://CMS.YESID.DEV:443'],
			['-uhttps://cms.yesid.dev./'],
			['-uhttps://cms.yesid.dev/api'],
			['-uhttp://cms.yesid.dev'],
		]) {
			expect(() =>
				buildDirectusSyncPushArgs([...args, '--only-collections', 'settings'], DEV_ENV),
			).toThrow(/Refusing production sync:push/);
		}
	});

	it('appends one canonical exclusion without dropping the effective last value', () => {
		for (const [args, effective] of [
			[[], ''],
			[['--exclude-collections', 'dashboards,panels'], 'dashboards,panels'],
			[['-xpanels'], 'panels'],
			[['-dxpanels'], 'panels'],
			[['-fxpanels'], 'panels'],
			[['-dfxpanels'], 'panels'],
			[['-dffxpanels'], 'panels'],
			[
				['--exclude-collections', 'permissions', '-x', 'dashboards'],
				'dashboards',
			],
		] as const) {
			const value = [effective, 'permissions'].filter(Boolean).join(',');
			expect(buildStaging(args)).toEqual([...args, '--exclude-collections', value]);
		}
	});

	it('does not add exclude when only-collections already narrows away from permissions', () => {
		expect(buildStaging(['--only-collections', 'settings'])).toEqual([
			'--only-collections', 'settings',
		]);
	});

	it('refuses an explicit permissions-only push without permission ack', () => {
		for (const args of [
			['--only-collections', 'permissions'],
			['-opermissions'],
			['-dopermissions'],
			['-fopermissions'],
		]) {
			expect(() => buildStaging(args)).toThrow(/Refusing permissions sync:push/);
		}
	});

	it('uses only the last repeated collection selector', () => {
		expect(buildStaging(['-opermissions', '-osettings'])).toEqual(['-opermissions', '-osettings']);
		expect(() => buildStaging(['-osettings', '-opermissions'])).toThrow(
			/Refusing permissions sync:push/,
		);
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
