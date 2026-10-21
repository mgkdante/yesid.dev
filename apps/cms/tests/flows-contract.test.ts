import { describe, expect, it } from 'bun:test';
import flows from '../directus/collections/flows.json';
import operations from '../directus/collections/operations.json';
import dependencies from './fixtures/exporter-flow-dependencies.json';

describe('Vercel revalidate on publish flow contract', () => {
	it('configures one active subscription for statusless site_labels changes', () => {
		const matches = flows.filter((flow) => flow.name === 'Vercel revalidate on publish');
		expect(matches).toHaveLength(1);
		expect(matches[0]?.status).toBe('active');
		const collections = matches[0]?.options?.collections ?? [];
		expect(collections.filter((collection) => collection === 'site_labels')).toHaveLength(1);
	});

	it('accepts create, update and delete actions without a publication-status gate', () => {
		const flow = flows.find((entry) => entry.name === 'Vercel revalidate on publish');
		expect(flow).toMatchObject({
			status: 'active', trigger: 'event', options: { type: 'action' },
		});
		expect(new Set(flow?.options?.scope)).toEqual(
			new Set(['items.create', 'items.update', 'items.delete']),
		);
		const operation = operations.find((entry) => entry._syncId === flow?.operation);
		expect(operation).toMatchObject({
			type: 'request', resolve: null, reject: null,
			options: {
				method: 'POST',
				url: '{{$env.VERCEL_DEPLOY_HOOK_URL}}?buildCache=false&source=directus.publish',
			},
		});
	});

	// Pinned from the 2026-10-21 collection-trigger-matrix.csv, not from flows.json.
	// directus_files coverage is metadata events only, not mirrored-byte refresh.
	it.each(['items.create', 'items.update', 'items.delete'])(
		'covers all audited exporter dependencies on %s',
		(scope) => {
			const flow = flows.find((entry) => entry.name === 'Vercel revalidate on publish');
			expect(dependencies).toHaveLength(70);
			expect(new Set(dependencies).size).toBe(70);
			expect(flow?.options?.scope).toContain(scope);
			expect([...(flow?.options?.collections ?? [])].sort()).toEqual(
				[...dependencies, 'pages', 'pages_blocks'].sort(),
			);
		},
	);

	it('keeps polling disabled and the manual rebuild on its separate environment hook', () => {
		for (const name of ['Flush Build to Vercel', 'Mark Dirty on CMS Publish']) {
			expect(flows.find((entry) => entry.name === name)?.status).toBe('inactive');
		}
		const manual = flows.find((entry) => entry.name === 'Force Rebuild (this environment)');
		expect(manual).toMatchObject({
			status: 'active', trigger: 'manual', options: { collections: ['build_queue'] },
		});
		expect(operations.find((entry) => entry._syncId === manual?.operation)).toMatchObject({
			type: 'request',
			options: {
				method: 'POST',
				url: '{{$env.VERCEL_DEPLOY_HOOK_URL}}?buildCache=false&source=directus-force-rebuild',
			},
		});
	});
});
