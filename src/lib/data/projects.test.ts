import { describe, it, expect } from 'vitest';
import {
	getProjectBySlug,
	getFeaturedProjects,
	getPublicProjects,
	getAllTags,
	getProjectsByService,
	getServiceIdsForProjects,
	projects
} from './projects.js';

describe('getProjectBySlug', () => {
	it('returns the project when a valid slug is provided', () => {
		const project = getProjectBySlug('yesid-dev');
		expect(project).toBeDefined();
		expect(project?.slug).toBe('yesid-dev');
	});

	it('returns undefined for a slug that does not exist', () => {
		expect(getProjectBySlug('this-does-not-exist')).toBeUndefined();
	});

	it('returns undefined for an empty string', () => {
		expect(getProjectBySlug('')).toBeUndefined();
	});
});

describe('getFeaturedProjects', () => {
	it('returns only projects where featured is true', () => {
		const featured = getFeaturedProjects();
		expect(featured.length).toBeGreaterThan(0);
		featured.forEach((p) => {
			expect(p.featured).toBe(true);
		});
	});

	it('does not include non-featured projects', () => {
		const featured = getFeaturedProjects();
		const featuredSlugs = new Set(featured.map((p) => p.slug));
		projects
			.filter((p) => !p.featured)
			.forEach((p) => {
				expect(featuredSlugs.has(p.slug)).toBe(false);
			});
	});
});

describe('getPublicProjects', () => {
	it('excludes private projects', () => {
		const publicProjects = getPublicProjects();
		publicProjects.forEach((p) => {
			expect(p.status).not.toBe('private');
		});
	});

	it('includes projects with status public', () => {
		const publicProjects = getPublicProjects();
		const hasPublic = publicProjects.some((p) => p.status === 'public');
		expect(hasPublic).toBe(true);
	});

	it('includes projects with status wip (work-in-progress is displayable)', () => {
		// wip projects are visible — they show a "work in progress" badge on the UI
		// This test only asserts that wip is not filtered out, not that wip projects exist in seed data
		const publicProjects = getPublicProjects();
		const wipInSeed = projects.filter((p) => p.status === 'wip');
		wipInSeed.forEach((p) => {
			expect(publicProjects.some((pub) => pub.slug === p.slug)).toBe(true);
		});
	});
});

describe('getAllTags', () => {
	it('returns a non-empty array', () => {
		const tags = getAllTags();
		expect(tags.length).toBeGreaterThan(0);
	});

	it('returns tags in alphabetical order', () => {
		const tags = getAllTags();
		const sorted = [...tags].sort();
		expect(tags).toEqual(sorted);
	});

	it('returns no duplicate tags', () => {
		const tags = getAllTags();
		const unique = new Set(tags);
		expect(tags.length).toBe(unique.size);
	});

	it('returns no empty strings', () => {
		const tags = getAllTags();
		tags.forEach((tag) => {
			expect(tag.trim()).not.toBe('');
		});
	});
});

describe('getProjectsByService', () => {
	it('returns projects linked to a given service ID', () => {
		const results = getProjectsByService('sql-development');
		expect(results.length).toBeGreaterThan(0);
		results.forEach((p) => {
			expect(p.relatedServices).toContain('sql-development');
		});
	});

	it('excludes private projects', () => {
		const results = getProjectsByService('sql-development');
		results.forEach((p) => {
			expect(p.status).not.toBe('private');
		});
	});

	it('returns empty array for unknown service ID', () => {
		expect(getProjectsByService('nonexistent')).toEqual([]);
	});
});

describe('getServiceIdsForProjects', () => {
	it('returns deduplicated sorted service IDs from public projects', () => {
		const ids = getServiceIdsForProjects();
		expect(ids.length).toBeGreaterThan(0);
		const sorted = [...ids].sort();
		expect(ids).toEqual(sorted);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('project optional metadata fields', () => {
	it('transit-data-pipeline has location, environment, version', () => {
		const project = getProjectBySlug('transit-data-pipeline');
		expect(project?.location).toBe('sherbrooke');
		expect(project?.environment).toBe('production');
		expect(project?.version).toBe('2.4.1');
	});

	it('transit-data-pipeline has impactMetrics array', () => {
		const project = getProjectBySlug('transit-data-pipeline');
		expect(project?.impactMetrics).toBeDefined();
		expect(project!.impactMetrics!.length).toBe(2);
		expect(project!.impactMetrics![0]).toEqual({ value: '30s', label: 'Real-time refresh cycles' });
		expect(project!.impactMetrics![1]).toEqual({ value: '99.9%', label: 'Pipeline uptime' });
	});

	it('projects without new fields still work (optional)', () => {
		const project = getProjectBySlug('yesid-dev');
		expect(project).toBeDefined();
		expect(project?.location).toBeUndefined();
		expect(project?.environment).toBeUndefined();
		expect(project?.version).toBeUndefined();
		expect(project?.impactMetrics).toBeUndefined();
	});
});
