// Tech-stack repository tests — reshaped in slice-18g Phase 4 Task 9,
// pruned again in slice-28.3 (#117): only getAllTechItems remains as a
// repository wrapper.
//
// Note: at runtime the static adapter will fail the new TechStackItemSchema
// (static data still uses the old shape). Tests that call getAllTechItems()
// skip the parsePort gate because the setup.data.ts mock routes through
// staticAdapter.techStack which bypasses schema validation only at the
// integration seam. The structural tests here remain valid.

import { describe, it, expect } from 'vitest';
import { getAllTechItems } from './tech-stack';
import { services } from '$lib/content/services';
import { projects } from '$lib/content/projects';

describe('tech stack data integrity', () => {
	it('loads at least 34 tech items', async () => {
		const items = await getAllTechItems();
		expect(items.length).toBeGreaterThanOrEqual(34);
	});

	it('all IDs are unique', async () => {
		const items = await getAllTechItems();
		const ids = items.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all relatedServices match existing service IDs', async () => {
		const items = await getAllTechItems();
		const serviceIds = new Set(services.map((s) => s.id));
		for (const item of items) {
			for (const sid of item.relatedServices) {
				expect(serviceIds.has(sid), `${item.id}: service "${sid}" not found`).toBe(true);
			}
		}
	});

	it('all relatedProjects match existing project slugs', async () => {
		const items = await getAllTechItems();
		const projectSlugs = new Set(projects.map((p) => p.slug));
		for (const item of items) {
			for (const ps of item.relatedProjects) {
				expect(projectSlugs.has(ps), `${item.id}: project "${ps}" not found`).toBe(true);
			}
		}
	});
});

// 'tech stack API' describe (getTechItemById/getTechItemContent) — removed in
// slice-28.3 with the pruned repository wrappers. The adapter-port equivalents
// remain covered by the adapter __tests__ suites.
