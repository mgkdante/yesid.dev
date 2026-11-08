import { expect, test } from 'bun:test';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workflowJobBlock, workflowStepBlock } from './helpers/workflow-source';

const workflow = readFileSync(
	join(import.meta.dir, '..', '..', '..', '.github', 'workflows', 'cms.yml'),
	'utf8',
);
const secretReference = /\$\{\{\s*secrets\s*(?:\.|\[)/;
const topLevelEnvKey = /^(?:env|'env'|"env")\s*:/m;

function jobBlock(name: string, next?: string): string {
	const block = workflowJobBlock(workflow, name, { expectedNext: next });
	if (!block) throw new Error(`missing workflow job: ${name}`);
	return block;
}

function stepBlock(job: string, name: string, next?: string): string {
	const block = workflowStepBlock(
		job,
		name,
		next ? { beforeStep: next } : { throughJobEnd: true },
	);
	if (!block) throw new Error(`missing workflow step: ${name}`);
	return block;
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

test('keeps production configuration out of the workflow top level', () => {
	expect(workflow).not.toMatch(topLevelEnvKey);
});

test('runs the live production diff only from trusted main with a step-scoped token', () => {
	const liveDiff = jobBlock('live-diff', 'push');

	expect(jobCondition(liveDiff)).toBe(`    if: |
      !cancelled() &&
      needs.test.result == 'success' &&
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
			next: 'permission-control-audit',
			condition: `    if: |
      github.event_name == 'workflow_dispatch' &&
      github.event.inputs.action == 'push' &&
      github.ref == 'refs/heads/main'`,
		},
		{
			name: 'flows-push',
			condition: `    if: |
      github.event_name == 'workflow_dispatch' &&
      github.event.inputs.action == 'flows-push' &&
      github.ref == 'refs/heads/main'`,
		},
	];

	for (const { name, next, condition } of mutatingJobs) {
		const job = jobBlock(name, next);
		expect(jobCondition(job), name).toBe(condition);
		expect(jobPreamble(job), name).toContain('name: production');
	}
});

test('offers separate, unambiguous diff, push and permission audit dispatch actions', () => {
	const dispatch = workflow.slice(
		workflow.indexOf('  workflow_dispatch:'),
		workflow.indexOf('\n# Cancel in-progress'),
	);
	expect(dispatch).toContain(
		'options: [diff, push, flows-push, permission-control-audit]',
	);
	expect(dispatch).toContain('flows-only push');
	expect(dispatch).toContain('read-only permission audit');
});

test('permission-control-audit is production-gated, authenticated, and GET-only', () => {
	const audit = jobBlock(
		'permission-control-audit',
		'flows-push',
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
	]) {
		expect(audit).not.toContain(forbidden);
	}
});

test('flows-push keeps the production gate and pushes only the flows collection', () => {
	const parsed = Bun.YAML.parse(workflow) as any;
	const job = parsed.jobs['flows-push'];
	expect(job.needs).toBe('test');
	expect(job['timeout-minutes']).toBe(30);
	expect(job.environment).toEqual({ name: 'production', url: 'https://cms.yesid.dev' });
	expect(job.env).toEqual({
		DIRECTUS_ADMIN_TOKEN: '${{ secrets.DIRECTUS_PROD_ADMIN_TOKEN }}',
		DIRECTUS_URL: 'https://cms.yesid.dev',
	});
	expect(job.steps.slice(0, 2).map((step: any) => step.uses)).toEqual([
		'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
		'./.github/actions/setup',
	]);
	const operations = job.steps.slice(2);
	expect(operations.map((step: any) => step.run)).toEqual([
		'bun scripts/audit-permission-control-drift.ts --target=prod --dry-run',
		'bun run sync:diff',
		'bun run sync:push -- --no-snapshot --only-collections flows',
		'bun run sync:diff',
	]);
	expect(operations[0]['continue-on-error']).toBe(true);
	expect(operations[2].env).toEqual({
		DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH: '1',
		DIRECTUS_SYNC_PUSH_ACK: 'sync-push-can-delete-cms-data',
	});
	for (const step of operations) {
		expect(step['working-directory']).toBe('apps/cms');
		expect(step.if).toBeUndefined();
	}
	for (const step of operations.slice(1)) expect(step['continue-on-error']).toBeUndefined();
});
