import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const workflow = readFileSync(
	join(import.meta.dir, '..', '..', '..', '.github', 'workflows', 'cms.yml'),
	'utf8',
);
const jobsOffset = workflow.indexOf('\njobs:\n');

function jobBlock(name: string, next?: string): string {
	const start = workflow.indexOf(`\n  ${name}:\n`, jobsOffset);
	if (start < 0) throw new Error(`missing workflow job: ${name}`);
	const nextOffset = next
		? workflow.indexOf(`\n  ${next}:\n`, start + 1)
		: -1;
	const end = nextOffset >= 0 ? nextOffset : workflow.length;
	return workflow.slice(start + 1, end).trimEnd();
}

function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

test('offers separate, unambiguous permission audit and targeted repair dispatch actions', () => {
	const dispatch = workflow.slice(
		workflow.indexOf('  workflow_dispatch:'),
		workflow.indexOf('\n# Cancel in-progress'),
	);
	expect(dispatch).toContain(
		'options: [diff, push, legal-service-area, permission-control-audit, public-blog-translation-key-repair]',
	);
	expect(dispatch).toContain('read-only permission audit');
	expect(dispatch).toContain('targeted blog repair');
});

test('permission-control-audit is production-gated, authenticated, and GET-only', () => {
	const audit = jobBlock(
		'permission-control-audit',
		'public-blog-translation-key-repair',
	);
	expect(audit).toContain(
		"github.event.inputs.action == 'permission-control-audit'",
	);
	expect(audit).toContain("github.ref == 'refs/heads/main'");
	expect(audit).toContain('needs: test');
	expect(audit).toContain('name: production');
	expect(audit).toContain(
		'DIRECTUS_ADMIN_TOKEN: ${{ secrets.DIRECTUS_PROD_ADMIN_TOKEN }}',
	);
	expect(audit.slice(0, audit.indexOf('    steps:'))).not.toContain(
		'DIRECTUS_ADMIN_TOKEN',
	);
	expect(audit.match(/DIRECTUS_PROD_ADMIN_TOKEN/g)).toHaveLength(1);
	expect(audit).toContain('PUBLIC_DIRECTUS_URL: https://cms.yesid.dev');
	expect(audit).toContain(
		'name: Audit production Directus permissions semantically (read-only)',
	);
	expect(audit).toContain(
		'run: bun scripts/audit-permission-control-drift.ts --target=prod --dry-run',
	);
	for (const forbidden of [
		'--apply',
		'sync:push',
		'DIRECTUS_SYNC_INCLUDE_PERMISSIONS',
		'reconcile-public-blog-permission.ts',
	]) {
		expect(audit).not.toContain(forbidden);
	}
});

test('targeted repair audits before and after one exact-confirm fields-only reconciler', () => {
	const repair = jobBlock('public-blog-translation-key-repair');
	expect(repair).toContain(
		"github.event.inputs.action == 'public-blog-translation-key-repair'",
	);
	expect(repair).toContain("github.ref == 'refs/heads/main'");
	expect(repair).toContain('needs: test');
	expect(repair).toContain('name: production');
	expect(repair).toContain(
		'DIRECTUS_ADMIN_TOKEN: ${{ secrets.DIRECTUS_PROD_ADMIN_TOKEN }}',
	);
	expect(repair.slice(0, repair.indexOf('    steps:'))).not.toContain(
		'DIRECTUS_ADMIN_TOKEN',
	);
	expect(repair.match(/DIRECTUS_PROD_ADMIN_TOKEN/g)).toHaveLength(4);
	expect(repair).toContain('PUBLIC_DIRECTUS_URL: https://cms.yesid.dev');

	const auditCommand =
		'bun scripts/audit-permission-control-drift.ts --target=prod --dry-run';
	const convergenceAuditCommand = `${auditCommand} --require-converged`;
	const previewCommand =
		'bun scripts/reconcile-public-blog-permission.ts --target=prod --dry-run';
	const confirmation =
		'--confirm=APPLY_PROD_PUBLIC_BLOG_TRANSLATION_KEY_PERMISSION';
	const firstAudit = repair.indexOf(auditCommand);
	const preview = repair.indexOf(previewCommand);
	const apply = repair.indexOf(confirmation);
	const convergenceAudit = repair.indexOf(convergenceAuditCommand);

	expect(firstAudit).toBeGreaterThan(-1);
	expect(preview).toBeGreaterThan(firstAudit);
	expect(apply).toBeGreaterThan(preview);
	expect(convergenceAudit).toBeGreaterThan(apply);
	expect(repair.indexOf(auditCommand, convergenceAudit + 1)).toBe(-1);
	expect(repair.match(/--apply/g)).toHaveLength(1);
	expect(repair.match(/--confirm=/g)).toHaveLength(1);
	for (const forbidden of [
		'sync:push',
		'DIRECTUS_SYNC_INCLUDE_PERMISSIONS',
		'include_permissions',
		'reconcile-legal-service-area.ts',
	]) {
		expect(repair).not.toContain(forbidden);
	}
});

test('keeps the existing diff, push, and legal-service-area job bodies byte-stable', () => {
	expect(sha256(jobBlock('diff', 'push'))).toBe(
		'd0715689c14987b2cc2274650f8631af25968068276c87c0f756017109de09d9',
	);
	expect(sha256(jobBlock('push', 'legal-service-area'))).toBe(
		'd5bc5ebef3ad3af7eeafda95041a1ddda97cfa4b21ea2b59ab308328bf2ca49b',
	);
	expect(
		sha256(jobBlock('legal-service-area', 'permission-control-audit')),
	).toBe(
		'5219bfadbc6c718da977652ba205c03438a8684d6db248a464f0f3609de355fc',
	);
});
