import { describe, expect, it } from 'bun:test';
import flows from '../directus/collections/flows.json';

describe('Vercel revalidate on publish flow contract', () => {
	it('is active and rebuilds exactly once when site_labels changes', () => {
		const matches = flows.filter((flow) => flow.name === 'Vercel revalidate on publish');
		expect(matches).toHaveLength(1);
		expect(matches[0]?.status).toBe('active');
		expect(matches[0]?.description).toBe(
			"POST to the environment's Vercel deploy hook when a configured content or site-settings row is created or updated. Triggers a full SvelteKit rebuild; statusless settings such as site_labels rebuild immediately.",
		);
		const collections = matches[0]?.options?.collections ?? [];
		expect(collections.filter((collection) => collection === 'site_labels')).toHaveLength(1);
	});
});
