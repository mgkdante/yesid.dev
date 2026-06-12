// Project-repository tests — moved from content/projects.test.ts in Task 17b-3.
// All functions are async now (they go through the adapter).
// Slice-28.3 (#117): tests for the pruned wrappers (getAllProjects,
// getFeaturedProjects, getAllTags, getServiceIdsForProjects) were removed;
// the wip-visibility test now reads the full set via adapter.projects.all().

import { describe, it, expect } from 'vitest';
import { adapter } from '$lib/adapters';
import {
	getProjectBySlug,
	getPublicProjects,
	getProjectsByService,
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
			adapter.projects.all(),
		]);
		const wipInSeed = all.filter((p) => p.status === 'wip');
		wipInSeed.forEach((p) => {
			expect(publicProjects.some((pub) => pub.slug === p.slug)).toBe(true);
		});
	});
});

describe('getProjectsByService', () => {


	it('returns empty array for unknown service ID', async () => {
		expect(await getProjectsByService('nonexistent')).toEqual([]);
	});

	// ── GO2-T8-UNSKIP ──────────────────────────────────────────────────────
	// Post-consolidation baseline (GO-2 Track 3, T8 step 8b). SKIPPED until
	// the orchestrator's Gate A CMS apply + regen lands (projects.ts then
	// carries transit relatedServices ['data-pipeline','database-engineering']).
	// T8 unskip step: `describe.skip` → `describe`, then delete the
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
