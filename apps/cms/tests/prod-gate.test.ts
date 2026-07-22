import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { assertContentBatchTarget, PROD_CMS_URL, PROD_HOST_ACK } from '../scripts/content-conversion-batch';

describe('production write gate', () => {
	test('is the single owner for every active production mutator', () => {
		for (const script of [
			'content-conversion-batch.ts',
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

	test('binds the conversion acknowledgement to the exact production host', () => {
		const acknowledgement = { CONTENT_BATCH_ALLOW_PROD: PROD_HOST_ACK };
		expect(assertContentBatchTarget(PROD_CMS_URL, ['--promote-prod'], acknowledgement)).toBe(true);
		expect(assertContentBatchTarget('https://cms.dev.yesid.dev', [], {})).toBe(false);
		expect(() => assertContentBatchTarget(PROD_CMS_URL, ['--promote-prod'], {})).toThrow(
			`CONTENT_BATCH_ALLOW_PROD=${PROD_HOST_ACK}`,
		);
		expect(() =>
			assertContentBatchTarget('https://attacker.example', ['--promote-prod'], acknowledgement),
		).toThrow('accepted only for cms.yesid.dev');
	});
});
