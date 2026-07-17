import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const workflow = readFileSync(
	join(import.meta.dir, '..', '..', '..', '.github', 'workflows', 'cms.yml'),
	'utf8',
);
const jobsOffset = workflow.indexOf('\njobs:\n');
const secretReference = /\$\{\{\s*secrets\s*(?:\.|\[)/;
const topLevelEnvKey = /^(?:env|'env'|"env")\s*:/m;

function jobBlock(name: string, next?: string): string {
	const start = workflow.indexOf(`\n  ${name}:\n`, jobsOffset);
	if (start < 0) throw new Error(`missing workflow job: ${name}`);
	const bodyStart = start + 1;
	const remainder = workflow.slice(bodyStart);
	const nextMatch = /\n  ([a-zA-Z0-9_-]+):\n/.exec(remainder);
	const actualNext = nextMatch?.[1];
	if (next && actualNext !== next) {
		throw new Error(
			`expected workflow job ${next} after ${name}, found ${actualNext ?? 'EOF'}`,
		);
	}
	const end = nextMatch ? bodyStart + nextMatch.index : workflow.length;
	return workflow.slice(bodyStart, end).trimEnd();
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

function jobCondition(job: string): string {
	const start = job.indexOf('    if: |\n');
	const end = job.indexOf('    runs-on:', start + 1);
	if (start < 0 || end < 0) throw new Error('missing job condition boundary');
	return job.slice(start, end).trimEnd();
}

function jobPreamble(job: string): string {
	const end = job.indexOf('    steps:\n');
	if (end < 0) throw new Error('missing job steps boundary');
	return job.slice(0, end).trimEnd();
}

test('asset audit regression gate stays inside the credential-free test job', () => {
	const testJob = jobBlock('test', 'diff');
	expect(testJob).toContain('name: Verify asset audit baseline (offline, no CMS)');
	expect(testJob).toContain('run: bun run verify:assets-audit');
	expect(testJob).not.toContain('DIRECTUS_ADMIN_TOKEN');
	expect(testJob).not.toContain('PUBLIC_DIRECTUS_URL');
	expect(testJob).not.toContain('op run');
	expect(testJob).not.toContain('--update-baseline');
});

test('keeps the required PR diff check credential-free and offline', () => {
	const diff = jobBlock('diff', 'live-diff');

	expect(workflow).not.toMatch(topLevelEnvKey);
	expect(jobCondition(diff)).toBe(`    if: |
      github.event_name == 'pull_request' &&
      github.base_ref == 'main'`);
	expect(diff).toContain(
		'name: Validate committed Directus snapshot contracts (offline, no CMS)',
	);
	expect(diff).toContain('run: bun test tests/snapshot-contract.test.ts');
	expect(diff).not.toMatch(secretReference);
	for (const forbidden of [
		'workflow_dispatch',
		"github.event_name == 'push'",
		'DIRECTUS_PROD_ADMIN_TOKEN',
		'DIRECTUS_ADMIN_TOKEN',
		'https://cms.yesid.dev',
		'sync:diff',
	]) {
		expect(diff).not.toContain(forbidden);
	}
});

test('runs the live production diff only from trusted main with a step-scoped token', () => {
	const liveDiff = jobBlock('live-diff', 'push');

	expect(jobCondition(liveDiff)).toBe(`    if: |
      github.ref == 'refs/heads/main' &&
      (
        github.event_name == 'push' ||
        (
          github.event_name == 'workflow_dispatch' &&
          github.event.inputs.action == 'diff'
        )
      )`);
	expect(liveDiff).not.toContain('pull_request');
	expect(jobPreamble(liveDiff)).not.toMatch(secretReference);
	const liveStep = stepBlock(liveDiff, 'sync:diff — preview diff vs prod');
	expect(liveStep).toBe(`      - name: sync:diff — preview diff vs prod
        working-directory: apps/cms
        env:
          DIRECTUS_ADMIN_TOKEN: \${{ secrets.DIRECTUS_PROD_ADMIN_TOKEN }}
        run: bun run sync:diff`);
	expect(liveDiff.match(/DIRECTUS_PROD_ADMIN_TOKEN/g)).toHaveLength(1);
});

test('keeps every production-mutating dispatch job on main', () => {
	const mutatingJobs: Array<{ name: string; next?: string; condition: string }> = [
		{
			name: 'push',
			next: 'legal-service-area',
			condition: `    if: |
      github.event_name == 'workflow_dispatch' &&
      github.event.inputs.action == 'push' &&
      github.ref == 'refs/heads/main'`,
		},
		{
			name: 'legal-service-area',
			next: 'permission-control-audit',
			condition: `    if: |
      github.event_name == 'workflow_dispatch' &&
      github.event.inputs.action == 'legal-service-area' &&
      github.ref == 'refs/heads/main'`,
		},
		{
			name: 'permission-policy-quarantine-rename',
			next: 'public-blog-translation-key-repair',
			condition: `    if: |
      github.event_name == 'workflow_dispatch' &&
      (
        github.event.inputs.action == 'permission-policy-quarantine-preview' ||
        github.event.inputs.action == 'permission-policy-quarantine-rename'
      ) &&
      github.ref == 'refs/heads/main'`,
		},
		{
			name: 'public-blog-translation-key-repair',
			next: 'analytics-controls',
			condition: `    if: |
      github.event_name == 'workflow_dispatch' &&
      github.event.inputs.action == 'public-blog-translation-key-repair' &&
      github.ref == 'refs/heads/main'`,
		},
		{
			name: 'analytics-controls',
			condition: `    if: |
      github.event_name == 'workflow_dispatch' &&
      github.event.inputs.action == 'analytics-controls' &&
      github.ref == 'refs/heads/main'`,
		},
	];

	for (const { name, next, condition } of mutatingJobs) {
		const job = jobBlock(name, next);
		expect(jobCondition(job), name).toBe(condition);
		expect(jobPreamble(job), name).toContain('name: production');
	}
});

test('offers separate, unambiguous permission audit and targeted repair dispatch actions', () => {
	const dispatch = workflow.slice(
		workflow.indexOf('  workflow_dispatch:'),
		workflow.indexOf('\n# Cancel in-progress'),
	);
	expect(dispatch).toContain(
		'options: [diff, push, legal-service-area, analytics-controls, permission-control-audit, permission-policy-candidate-diagnostic, permission-policy-quarantine-preview, permission-policy-quarantine-rename, public-blog-translation-key-repair]',
	);
	expect(dispatch).toContain('guarded analytics-controls promotion');
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
	const repair = jobBlock('public-blog-translation-key-repair', 'analytics-controls');
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
		'32127d605e2b7accbe7ef88dfb00b8c04fd232c1e6853fd9316b0602b85b94d3',
	);
	expect(sha256(jobBlock('diff', 'live-diff'))).toBe(
		'87143ee33bb7751b1550f7f1b0cb5eef5646d53d6b6a515f1e5ce19e63f175b4',
	);
	expect(sha256(jobBlock('live-diff', 'push'))).toBe(
		'979426ca3a7cbe88205f4fde27bf22b2f02dc3277b750507f2e04b8e3e27988c',
	);
	expect(sha256(jobBlock('push', 'legal-service-area'))).toBe(
		'bddf90bcacd78590244ea3ff5fa8db0112d537f2ce3c1aa8df1245a16d12bb0b',
	);
	expect(
		sha256(jobBlock('legal-service-area', 'permission-control-audit')),
	).toBe(
		'52e838209c89fae62668ccf9570725c4d005245fdc8c33736e132dd728f9b2aa',
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
	expect(
		sha256(jobBlock('public-blog-translation-key-repair', 'analytics-controls')),
	).toBe('8e33450fcf0d0fea53a6a1cc307317128fef197df0749906b4c4cfab1c99f193');
});

test('analytics-controls is production-gated, scoped-lane-only, and exact-confirm (slice-40.1 Stage D)', () => {
	const job = jobBlock('analytics-controls');

	// Dispatch-only, behind the production environment gate, after tests.
	expect(job).toContain("github.event.inputs.action == 'analytics-controls'");
	expect(job).toContain('needs: test');
	expect(job).toContain('name: production');
	expect(job).toContain('DIRECTUS_ADMIN_TOKEN: ${{ secrets.DIRECTUS_PROD_ADMIN_TOKEN }}');

	// Scoped lanes ONLY — never a broad push, never permissions.
	expect(job).toContain('sync:push -- --no-collections');
	expect(job).toContain('sync:push -- --no-snapshot --only-collections flows');
	expect(job).not.toContain('run: bun run sync:push\n');
	expect(job).not.toContain('DIRECTUS_SYNC_INCLUDE_PERMISSIONS');
	expect(job).not.toContain('include_permissions');

	// Content lane: dry-run before AND after one exact-confirm apply.
	const applies = job.split('--confirm=APPLY_PROD_LEAN_HIGH_INTENT_ANALYTICS').length - 1;
	expect(applies).toBe(1);
	const dryRuns =
		job.split(
			'promote-lean-high-intent-analytics.ts --target=prod --dry-run',
		).length - 1;
	expect(dryRuns).toBe(2);

	// Owner flag-preservation proof: prod row must read true/true.
	expect(job).toContain('analytics_enabled');
	expect(job).toContain('analytics_consent_show_banner');
	expect(job).toContain('FLAG ASSERTION FAILED');

	// Drift audits bracket the promotion; live export + manifest verify close it.
	expect(job).toContain('audit-permission-control-drift.ts --target=prod --dry-run');
	expect(job).toContain('--module=site-labels');
	expect(job).toContain('--module=legal-pages');
	expect(job).toContain('verify-content-manifest.ts');
});
