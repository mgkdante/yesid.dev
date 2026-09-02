import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
	parseProductionOnlyWriteCli,
	parseProductionWriteCli,
	requireExactAcknowledgement,
} from '../scripts/lib/prod-gate';

describe('production write gate', () => {
	test('is the single owner for every active production mutator', () => {
		for (const script of [
			'promote-blog-translations.ts',
			'promote-lean-high-intent-analytics.ts',
			'reconcile-blog-editorial-dates.ts',
			'reconcile-legal-public-contact.ts',
			'reconcile-legal-service-area.ts',
			'reconcile-permission-policy-quarantine-name.ts',
			'reconcile-public-blog-permission.ts',
			'setup-blog-translation-key.ts',
			'sync-push.ts',
		]) {
			const source = readFileSync(new URL(`../scripts/${script}`, import.meta.url), 'utf8');
			expect(source, script).toContain("from './lib/prod-gate'");
		}
	});

	test('does not rename workflow acknowledgements', () => {
		const workflow = readFileSync(new URL('../../../.github/workflows/cms.yml', import.meta.url), 'utf8');
		for (const contract of [
			"DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH: '1'",
			'DIRECTUS_SYNC_PUSH_ACK: sync-push-can-delete-cms-data',
			"DIRECTUS_SYNC_INCLUDE_PERMISSIONS: ${{ inputs.include_permissions && '1' || '' }}",
			"DIRECTUS_SYNC_PERMISSIONS_ACK: ${{ inputs.include_permissions && 'permissions-push-can-delete-parallel-work' || '' }}",
		]) {
			expect(workflow).toContain(contract);
		}
	});

	test('requires exact confirmation only for production writes', () => {
		expect(parseProductionWriteCli(['--target=dev'], 'sample', 'ship-it')).toEqual({
			target: 'dev',
			apply: false,
		});
		expect(parseProductionWriteCli(['--target=prod', '--apply', '--confirm=ship-it'], 'sample', 'ship-it')).toEqual({
			target: 'prod',
			apply: true,
		});
		expect(() => parseProductionWriteCli(['--target=prod', '--apply'], 'sample', 'ship-it')).toThrow(
			'PROD apply requires --confirm=ship-it',
		);
		expect(() => parseProductionWriteCli(['--target=dev', '--confirm=ship-it'], 'sample', 'ship-it')).toThrow(
			'--confirm is accepted only for PROD apply',
		);
	});

	test('binds production-only scripts to the exact CMS host', () => {
		expect(
			parseProductionOnlyWriteCli(
				['--target=prod', '--apply', '--confirm=ship-it'],
				'sample',
				'ship-it',
				'https://cms.yesid.dev/',
				'https://cms.yesid.dev',
			),
		).toEqual({
			apply: true,
			directusUrl: 'https://cms.yesid.dev',
		});
		expect(() =>
			parseProductionOnlyWriteCli(
				['--target=prod'],
				'sample',
				'ship-it',
				'https://attacker.example',
				'https://cms.yesid.dev',
			),
		).toThrow('Unsupported PUBLIC_DIRECTUS_URL: https://attacker.example');
	});

	test('compares acknowledgement values exactly', () => {
		expect(() => requireExactAcknowledgement('cms.yesid.dev', 'cms.yesid.dev', 'refused')).not.toThrow();
		expect(() => requireExactAcknowledgement('cms.yesid.dev/', 'cms.yesid.dev', 'refused')).toThrow('refused');
	});
});
