import { describe, expect, it } from 'bun:test';
import flows from '../directus/collections/flows.json';
import operations from '../directus/collections/operations.json';

const PUBLISH_FLOW = 'd86a5982-6ab4-4474-ace8-cfd16962a9a4';
const PUBLISH_OPERATION = 'a7c9d628-b970-4f38-bb4b-0c532901d0e1';
const REMINDER_FLOW = 'c80a68ad-dabf-4ccc-95cc-e97095f51d90';

describe('D6 manual Publish flow contract', () => {
	it('declares exactly Publish site and Translation reminder on publish', () => {
		expect(flows.map((flow) => [flow._syncId, flow.name]).sort()).toEqual([
			[REMINDER_FLOW, 'Translation reminder on publish'],
			[PUBLISH_FLOW, 'Publish site'],
		].sort());
	});

	it('requires confirmation for one synchronous manual build from Site Config', () => {
		const flow = flows.find((entry) => entry._syncId === PUBLISH_FLOW);
		expect(flow).toMatchObject({
			name: 'Publish site', icon: 'rocket_launch', status: 'active',
			trigger: 'manual', accountability: 'all', operation: PUBLISH_OPERATION,
			description: "D6 manual Publish (2026-10-25): one build per editing session. Run from Site Config (build_queue) → Flows → Publish site. POSTs this environment's Vercel deploy hook ($env.VERCEL_DEPLOY_HOOK_URL, allow-listed in FLOWS_ENV_ALLOW_LIST) with buildCache=false. Edits never rebuild the site by themselves.",
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

	it('retains only the existing translation reminder subscription and operations', () => {
		const reminder = flows.find((entry) => entry._syncId === REMINDER_FLOW);
		expect(reminder).toMatchObject({
			name: 'Translation reminder on publish', status: 'active', trigger: 'event',
			operation: '_sync_op_translation_reminder_check_published',
		});
		expect(reminder?.options).toEqual({
			type: 'action', scope: ['items.update'],
			collections: [
				'pages', 'blog_posts', 'projects', 'services', 'block_about_content',
				'block_about_intro', 'block_blog_page_content', 'block_closer',
				'block_contact_content', 'block_cta', 'block_hero', 'block_manifesto',
				'block_projects_page_content', 'block_proof_reel', 'block_services_grid',
			],
		});
		expect(operations.map((operation) => operation._syncId).sort()).toEqual([
			PUBLISH_OPERATION, '_sync_op_translation_reminder_check_published',
			'_sync_op_translation_reminder_log',
		].sort());
	});
});
