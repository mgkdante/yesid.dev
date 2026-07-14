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

function stepBlock(job: string, name: string, next?: string): string {
	const start = job.indexOf(`      - name: ${name}\n`);
	if (start < 0) throw new Error(`missing workflow step: ${name}`);
	const nextOffset = next
		? job.indexOf(`      - name: ${next}\n`, start + 1)
		: -1;
	const end = nextOffset >= 0 ? nextOffset : job.length;
	return job.slice(start, end).trimEnd();
}

test('offers separate, unambiguous permission audit and targeted repair dispatch actions', () => {
	const dispatch = workflow.slice(
		workflow.indexOf('  workflow_dispatch:'),
		workflow.indexOf('\n# Cancel in-progress'),
	);
	expect(dispatch).toContain(
		'options: [diff, push, legal-service-area, permission-control-audit, permission-policy-candidate-diagnostic, permission-policy-quarantine-preview, permission-policy-quarantine-rename, public-blog-translation-key-repair]',
	);
	expect(dispatch).toContain('read-only permission audit');
	expect(dispatch).toContain('candidate diagnostic');
	expect(dispatch).toContain('quarantine preview or rename');
	expect(dispatch).toContain('targeted blog repair');
});

test('permission-control-audit is production-gated, authenticated, and GET-only', () => {
	const audit = jobBlock(
		'permission-control-audit',
		'permission-policy-candidate-diagnostic',
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

test('permission-policy-candidate-diagnostic is main-only, production-gated, and GET-only', () => {
	const diagnostic = jobBlock(
		'permission-policy-candidate-diagnostic',
		'permission-policy-quarantine-rename',
	);
	expect(diagnostic).toContain(
		"github.event.inputs.action == 'permission-policy-candidate-diagnostic'",
	);
	expect(diagnostic).toContain("github.ref == 'refs/heads/main'");
	expect(diagnostic).toContain('needs: test');
	expect(diagnostic).toContain('name: production');
	expect(diagnostic).toContain(
		'DIRECTUS_ADMIN_TOKEN: ${{ secrets.DIRECTUS_PROD_ADMIN_TOKEN }}',
	);
	expect(diagnostic.slice(0, diagnostic.indexOf('    steps:'))).not.toContain(
		'DIRECTUS_ADMIN_TOKEN',
	);
	expect(diagnostic.match(/DIRECTUS_PROD_ADMIN_TOKEN/g)).toHaveLength(1);
	expect(diagnostic).toContain('PUBLIC_DIRECTUS_URL: https://cms.yesid.dev');
	expect(diagnostic).toContain(
		'name: Diagnose duplicate desired-policy candidates (read-only)',
	);
	expect(diagnostic).toContain(
		'run: bun scripts/diagnose-permission-policy-candidates.ts --target=prod --dry-run',
	);
	for (const forbidden of [
		'--apply',
		'--confirm=',
		'sync:push',
		'DIRECTUS_SYNC_INCLUDE_PERMISSIONS',
		'reconcile-public-blog-permission.ts',
	]) {
		expect(diagnostic).not.toContain(forbidden);
	}
});

test('policy quarantine preview is separate and rename-only steps are statically mutation-gated', () => {
	const rename = jobBlock(
		'permission-policy-quarantine-rename',
		'public-blog-translation-key-repair',
	);
	expect(rename).toContain(
		"github.event.inputs.action == 'permission-policy-quarantine-preview'",
	);
	expect(rename).toContain(
		"github.event.inputs.action == 'permission-policy-quarantine-rename'",
	);
	expect(rename).toContain("github.ref == 'refs/heads/main'");
	expect(rename).toContain('needs: test');
	expect(rename).toContain('name: production');
	expect(rename).toContain('PUBLIC_DIRECTUS_URL: https://cms.yesid.dev');
	expect(rename.slice(0, rename.indexOf('    steps:'))).not.toContain(
		'DIRECTUS_ADMIN_TOKEN',
	);
	expect(rename.match(/DIRECTUS_PROD_ADMIN_TOKEN/g)).toHaveLength(4);

	const previewCommand =
		'bun scripts/reconcile-permission-policy-quarantine-name.ts --target=prod --dry-run';
	const previewStepName = 'Preview guarded duplicate-policy quarantine rename';
	const applyStepName = 'Apply and verify guarded duplicate-policy quarantine rename';
	const readBackStepName = 'Prove duplicate-policy quarantine rename read-back';
	const auditStepName =
		'Audit all production Directus permissions after rename (read-only)';
	const previewStep = stepBlock(rename, previewStepName, applyStepName);
	const applyStep = stepBlock(rename, applyStepName, readBackStepName);
	const readBackStep = stepBlock(rename, readBackStepName, auditStepName);
	const auditStep = stepBlock(rename, auditStepName);
	const renameOnlyCondition =
		"if: github.event.inputs.action == 'permission-policy-quarantine-rename'";
	const confirmation =
		'--confirm=APPLY_PROD_PERMISSION_POLICY_QUARANTINE_RENAME';
	const auditCommand =
		'bun scripts/audit-permission-control-drift.ts --target=prod --dry-run';
	const preview = rename.indexOf(previewCommand);
	const apply = rename.indexOf(confirmation);
	const readBack = rename.indexOf(previewCommand, preview + 1);
	const audit = rename.indexOf(auditCommand, readBack + 1);

	expect(preview).toBeGreaterThan(-1);
	expect(apply).toBeGreaterThan(preview);
	expect(readBack).toBeGreaterThan(apply);
	expect(audit).toBeGreaterThan(readBack);
	expect(previewStep).toContain(previewCommand);
	expect(previewStep).not.toContain('if:');
	expect(previewStep).not.toMatch(/--apply|--confirm=|audit-permission-control-drift/);
	for (const guardedStep of [applyStep, readBackStep, auditStep]) {
		expect(guardedStep).toContain(renameOnlyCondition);
		expect(guardedStep).not.toContain(
			'permission-policy-quarantine-preview',
		);
	}
	expect(applyStep).toContain('--apply');
	expect(applyStep).toContain(confirmation);
	expect(readBackStep).toContain(previewCommand);
	expect(auditStep).toContain(auditCommand);
	expect(rename.match(/--apply/g)).toHaveLength(1);
	expect(rename.match(/--confirm=/g)).toHaveLength(1);
	expect(rename.match(/audit-permission-control-drift\.ts/g)).toHaveLength(1);
	expect(rename).not.toContain('--require-converged');
	for (const forbidden of [
		'sync:push',
		'DIRECTUS_SYNC_INCLUDE_PERMISSIONS',
		'include_permissions',
		'reconcile-public-blog-permission.ts',
		'reconcile-legal-service-area.ts',
	]) {
		expect(rename).not.toContain(forbidden);
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

test('keeps every unrelated existing CMS job body byte-stable', () => {
	expect(sha256(jobBlock('test', 'diff'))).toBe(
		'ece34b91e13a1ae97467f9e8e4aa8ef49d21bed854c5b13f4ee5b55fa491a4ad',
	);
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
	expect(
		sha256(
			jobBlock(
				'permission-control-audit',
				'permission-policy-candidate-diagnostic',
			),
		),
	).toBe(
		'2572e65cb6c5886f475cd6d8e28fd0d938d38180658f268acf6b1802dee6dd8c',
	);
	expect(
		sha256(
			jobBlock(
				'permission-policy-candidate-diagnostic',
				'permission-policy-quarantine-rename',
			),
		),
	).toBe(
		'843d0098fa697ff183768b4d66a67b4dd8bb413584e15cce7d084ad1c6e90388',
	);
	expect(sha256(jobBlock('public-blog-translation-key-repair'))).toBe(
		'8e33450fcf0d0fea53a6a1cc307317128fef197df0749906b4c4cfab1c99f193',
	);
});
