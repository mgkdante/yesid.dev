import { describe, expect, it } from 'bun:test';
import flows from '../directus/collections/flows.json';
import operations from '../directus/collections/operations.json';

const PUBLISH_FLOW = 'd86a5982-6ab4-4474-ace8-cfd16962a9a4';
const PUBLISH_OPERATION = 'a7c9d628-b970-4f38-bb4b-0c532901d0e1';
const REMINDER_FLOW = 'c80a68ad-dabf-4ccc-95cc-e97095f51d90';

type Flow = {
	_syncId: string;
	name: string;
	trigger: string;
	operation: string | null;
};
type Operation = {
	_syncId: string;
	flow: string;
	type: string;
	resolve: string | null;
	reject: string | null;
	options: unknown;
};

function assertOnlyManualPublishRequest(flowRows: readonly Flow[], operationRows: readonly Operation[]) {
	const requests = operationRows.filter((operation) => operation.type === 'request');
	expect(requests).toHaveLength(1);
	expect(requests[0]).toMatchObject({ _syncId: PUBLISH_OPERATION, flow: PUBLISH_FLOW });
	expect(flowRows.find((flow) => flow._syncId === PUBLISH_FLOW)).toMatchObject({
		name: 'Publish site', trigger: 'manual', operation: PUBLISH_OPERATION,
	});
}

function assertAutomaticOperationsArePassive(flowRows: readonly Flow[], operationRows: readonly Operation[]) {
	const byId = new Map(operationRows.map((operation) => [operation._syncId, operation]));
	for (const flow of flowRows.filter((row) => row.trigger === 'event' || row.trigger === 'schedule')) {
		const pending = flow.operation ? [flow.operation] : [];
		const visited = new Set<string>();
		while (pending.length > 0) {
			const id = pending.pop()!;
			if (visited.has(id)) continue;
			visited.add(id);
			const operation = byId.get(id);
			if (!operation) throw new Error(`${flow.name} reaches missing operation ${id}`);
			expect(['condition', 'log', 'notification'], `${flow.name} reaches ${id}`).toContain(operation.type);
			for (const next of [operation.resolve, operation.reject]) {
				if (next) pending.push(next);
			}
		}
	}
}

function assertNoOtherDeployOptions(operationRows: readonly Operation[]) {
	for (const operation of operationRows) {
		if (operation._syncId === PUBLISH_OPERATION) continue;
		expect(JSON.stringify(operation.options), operation._syncId).not.toMatch(/vercel\.com|deploy/i);
	}
}

function reminderRequestMutation(): Operation[] {
	const rows: Operation[] = structuredClone(operations);
	const reminder = rows.find((operation) => operation._syncId === '_sync_op_translation_reminder_log')!;
	reminder.type = 'request';
	reminder.options = { method: 'POST', url: 'https://api.vercel.com/v1/integrations/deploy/x' };
	return rows;
}

describe('D6 manual Publish flow contract', () => {
	it('declares exactly Publish site and Translation reminder on publish', () => {
		expect(flows.map((flow) => [flow._syncId, flow.name]).sort()).toEqual([
			[REMINDER_FLOW, 'Translation reminder on publish'],
			[PUBLISH_FLOW, 'Publish site'],
		].sort());
	});

	it('requires confirmation for one synchronous manual build from Publish site', () => {
		const flow = flows.find((entry) => entry._syncId === PUBLISH_FLOW);
		expect(flow).toMatchObject({
			name: 'Publish site', icon: 'rocket_launch', status: 'active',
			trigger: 'manual', accountability: 'all', operation: PUBLISH_OPERATION,
			description: "D6 manual Publish (2026-10-25): one build per editing session. Run from Publish site (bottom of the Content sidebar, collection build_queue) → Flows → Publish site. POSTs this environment's Vercel deploy hook ($env.VERCEL_DEPLOY_HOOK_URL, allow-listed in FLOWS_ENV_ALLOW_LIST) with buildCache=false. Edits never rebuild the site by themselves.",
		});
		expect(flow?.options).toEqual({
			collections: ['build_queue'], location: 'item', requireSelection: false,
			async: false, requireConfirmation: true,
			confirmationDescription: "Publish site: rebuild this environment's website from the current published CMS content (one build, about 3 minutes).",
		});
	});

	it('posts only the environment hook with the manual Publish payload and JSON header', () => {
		const hookOperations = operations.filter((operation) =>
			JSON.stringify(operation).includes('VERCEL_DEPLOY_HOOK'),
		);
		expect(hookOperations).toHaveLength(1);
		expect(hookOperations[0]).toMatchObject({
			_syncId: PUBLISH_OPERATION, flow: PUBLISH_FLOW,
			type: 'request', resolve: null, reject: null,
		});
		expect(hookOperations[0]?.options).toEqual({
			method: 'POST',
			url: '{{$env.VERCEL_DEPLOY_HOOK_URL}}?buildCache=false&source=directus-publish',
			headers: [{ header: 'Content-Type', value: 'application/json' }],
			body: '{"source":"directus.manual","trigger":"publish_site_flow"}',
		});
		expect(JSON.stringify(operations)).not.toContain('VERCEL_DEPLOY_HOOK_PROD');
	});

	it('has no automatic deploy requests or orphaned operations', () => {
		for (const operation of operations) {
			const flow = flows.find((entry) => entry._syncId === operation.flow);
			expect(flow, operation._syncId).toBeDefined();
			if (flow?.trigger === 'event' || flow?.trigger === 'schedule') {
				expect(JSON.stringify(operation)).not.toContain('VERCEL_DEPLOY_HOOK');
			}
		}
	});

	it('allows exactly one request, owned and entered by the manual Publish site flow', () => {
		assertOnlyManualPublishRequest(flows, operations);
	});

	it('allows only condition, log and in-app notification operations along every automatic flow branch', () => {
		assertAutomaticOperationsArePassive(flows, operations);
	});

	it('allows deploy options only on the Publish site operation', () => {
		assertNoOtherDeployOptions(operations);
	});

	it('retains only the translation reminder subscription and its check, log and notify operations', () => {
		const reminder = flows.find((entry) => entry._syncId === REMINDER_FLOW);
		expect(reminder).toMatchObject({
			name: 'Translation reminder on publish', status: 'active', trigger: 'event',
			operation: '_sync_op_translation_reminder_check_published',
		});
		expect(reminder?.options).toEqual({
			type: 'action', scope: ['items.update'],
			collections: [
				'blog_posts', 'projects', 'services', 'block_about_content',
				'block_about_intro', 'block_blog_page_content', 'block_closer',
				'block_contact_content', 'block_cta', 'block_hero', 'block_manifesto',
				'block_projects_page_content', 'block_proof_reel', 'block_services_grid',
			],
		});
		expect(operations.map((operation) => operation._syncId).sort()).toEqual([
			PUBLISH_OPERATION, '_sync_op_translation_reminder_check_published',
			'_sync_op_translation_reminder_log', '_sync_op_translation_reminder_notify',
		].sort());
	});
});

describe('automatic rebuild mutation proofs (in memory only)', () => {
	it('rejects a second request using a literal deploy URL', () => {
		expect(() => assertOnlyManualPublishRequest(flows, reminderRequestMutation())).toThrow();
	});

	it('rejects a sole request on the reminder instead of Publish site', () => {
		const rows = reminderRequestMutation();
		rows.find((operation) => operation._syncId === PUBLISH_OPERATION)!.type = 'log';
		expect(() => assertOnlyManualPublishRequest(flows, rows)).toThrow();
	});

	it('rejects a Publish request whose flow becomes automatic', () => {
		const rows = structuredClone(flows);
		rows.find((flow) => flow._syncId === PUBLISH_FLOW)!.trigger = 'event';
		expect(() => assertOnlyManualPublishRequest(rows, operations)).toThrow();
	});

	it.each([
		['event', 'resolve'], ['event', 'reject'],
		['schedule', 'resolve'], ['schedule', 'reject'],
	] as const)('rejects a request reached by an %s flow through %s', (trigger, branch) => {
		const flowRows = structuredClone(flows);
		flowRows.find((flow) => flow._syncId === REMINDER_FLOW)!.trigger = trigger;
		const operationRows = reminderRequestMutation();
		const root = operationRows.find((operation) => operation._syncId === '_sync_op_translation_reminder_check_published')!;
		root.resolve = null;
		root.reject = null;
		root[branch] = '_sync_op_translation_reminder_log';
		// Ownership cannot hide an operation reached through an automatic flow's graph.
		operationRows.find((operation) => operation._syncId === root[branch])!.flow = PUBLISH_FLOW;
		expect(() => assertAutomaticOperationsArePassive(flowRows, operationRows)).toThrow();
	});

	it.each([
		'https://api.vercel.com/v1/integrations/deploy/x',
		'https://build.example/actions/deploy',
		'https://api.vercel.com/v1/hooks/x',
	])('rejects deploy options hidden in a log operation: %s', (url) => {
		const rows: Operation[] = structuredClone(operations);
		rows.find((operation) => operation._syncId === '_sync_op_translation_reminder_log')!.options = {
			nested: { url },
		};
		expect(() => assertNoOtherDeployOptions(rows)).toThrow();
	});
});
