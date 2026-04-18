// Project-repository tests — moved from content/projects.test.ts in Task 17b-3.
// All functions are async now (they go through the adapter).

import { describe, it, expect } from 'vitest';
import {
	getAllProjects,
	getProjectBySlug,
	getFeaturedProjects,
	getPublicProjects,
	getAllTags,
	getProjectsByService,
	getServiceIdsForProjects,
} from './project';

describe('getProjectBySlug', () => {
	it('returns the project when a valid slug is provided', async () => {
		const project = await getProjectBySlug('yesid-dev');
		expect(project).toBeDefined();
		expect(project?.slug).toBe('yesid-dev');
	});

	it('returns undefined for a slug that does not exist', async () => {
		expect(await getProjectBySlug('this-does-not-exist')).toBeUndefined();
	});

	it('returns undefined for an empty string', async () => {
		expect(await getProjectBySlug('')).toBeUndefined();
	});
});

describe('getFeaturedProjects', () => {
	it('returns only projects where featured is true', async () => {
		const featured = await getFeaturedProjects();
		expect(featured.length).toBeGreaterThan(0);
		featured.forEach((p) => {
			expect(p.featured).toBe(true);
		});
	});

	it('does not include non-featured projects', async () => {
		const [featured, all] = await Promise.all([
			getFeaturedProjects(),
			getAllProjects(),
		]);
		const featuredSlugs = new Set(featured.map((p) => p.slug));
		all
			.filter((p) => !p.featured)
			.forEach((p) => {
				expect(featuredSlugs.has(p.slug)).toBe(false);
			});
	});
});

describe('getPublicProjects', () => {
	it('excludes private projects', async () => {
		const publicProjects = await getPublicProjects();
		publicProjects.forEach((p) => {
			expect(p.status).not.toBe('private');
		});
	});

	it('includes projects with status public', async () => {
		const publicProjects = await getPublicProjects();
		const hasPublic = publicProjects.some((p) => p.status === 'public');
		expect(hasPublic).toBe(true);
	});

	it('includes projects with status wip (work-in-progress is displayable)', async () => {
		// wip projects are visible — they show a "work in progress" badge on the UI.
		// This test only asserts that wip is not filtered out, not that wip projects
		// exist in the seed data.
		const [publicProjects, all] = await Promise.all([
			getPublicProjects(),
			getAllProjects(),
		]);
		const wipInSeed = all.filter((p) => p.status === 'wip');
		wipInSeed.forEach((p) => {
			expect(publicProjects.some((pub) => pub.slug === p.slug)).toBe(true);
		});
	});
});

describe('getAllTags', () => {
	it('returns a non-empty array', async () => {
		const tags = await getAllTags();
		expect(tags.length).toBeGreaterThan(0);
	});

	it('returns tags in alphabetical order', async () => {
		const tags = await getAllTags();
		const sorted = [...tags].sort();
		expect(tags).toEqual(sorted);
	});

	it('returns no duplicate tags', async () => {
		const tags = await getAllTags();
		const unique = new Set(tags);
		expect(tags.length).toBe(unique.size);
	});

	it('returns no empty strings', async () => {
		const tags = await getAllTags();
		tags.forEach((tag) => {
			expect(tag.trim()).not.toBe('');
		});
	});
});

describe('getProjectsByService', () => {
	it('returns projects linked to a given service ID', async () => {
		const results = await getProjectsByService('sql-development');
		expect(results.length).toBeGreaterThan(0);
		results.forEach((p) => {
			expect(p.relatedServices).toContain('sql-development');
		});
	});

	it('excludes private projects', async () => {
		const results = await getProjectsByService('sql-development');
		results.forEach((p) => {
			expect(p.status).not.toBe('private');
		});
	});

	it('returns empty array for unknown service ID', async () => {
		expect(await getProjectsByService('nonexistent')).toEqual([]);
	});
});

describe('getServiceIdsForProjects', () => {
	it('returns deduplicated sorted service IDs from public projects', async () => {
		const ids = await getServiceIdsForProjects();
		expect(ids.length).toBeGreaterThan(0);
		const sorted = [...ids].sort();
		expect(ids).toEqual(sorted);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('project optional metadata fields', () => {
	it('transit-data-pipeline has location, environment, version', async () => {
		const project = await getProjectBySlug('transit-data-pipeline');
		expect(project?.location).toBe('sherbrooke');
		expect(project?.environment).toBe('production');
		expect(project?.version).toBe('2.4.1');
	});

	it('transit-data-pipeline has impactMetrics array', async () => {
		const project = await getProjectBySlug('transit-data-pipeline');
		expect(project?.impactMetrics).toBeDefined();
		expect(project!.impactMetrics!.length).toBe(2);
		expect(project!.impactMetrics![0]).toEqual({ value: '30s', label: { en: 'Real-time refresh cycles' } });
		expect(project!.impactMetrics![1]).toEqual({ value: '99.9%', label: { en: 'Pipeline uptime' } });
	});

	it('projects without new fields still work (optional)', async () => {
		const project = await getProjectBySlug('yesid-dev');
		expect(project).toBeDefined();
		expect(project?.location).toBeUndefined();
		expect(project?.environment).toBeUndefined();
		expect(project?.version).toBeUndefined();
		expect(project?.impactMetrics).toBeUndefined();
	});
});
