// Contract test for the static adapter implementation.
//
// Imports `staticAdapter` directly (not via ./index re-export) so this test
// stays network-free. Contract itself is enforced compile-time by the
// `ContentAdapter` annotation on each adapter implementation; this file
// verifies that the static implementation returns sane cardinality + shapes
// (non-empty where expected, undefined for not-found).
//
// The Directus adapter that once shared this contract was removed at
// slice-26 close (Directus 12 verified on both environments; the parity
// oracle it fed is fulfilled). staticAdapter is the sole implementation —
// this file is the contract's runtime coverage.

import { describe, it, expect } from 'vitest';
import { projects } from '$lib/content/projects';
import { deriveProjectFacets } from '$lib/projects/project-facets';
import { staticAdapter as adapter } from './static';

const expectedProjectFacets = deriveProjectFacets(projects);

describe('ContentAdapter contract', () => {
	describe('projects port', () => {
		it('all() returns a non-empty readonly array', async () => {
			const result = await adapter.projects.all();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('bySlug() returns undefined for unknown slug', async () => {
			const result = await adapter.projects.bySlug('__nonexistent__');
			expect(result).toBeUndefined();
			expect(await adapter.projects.bySlug('')).toBeUndefined();
		});

		it('bySlug() returns a project for a real slug', async () => {
			const all = await adapter.projects.all();
			const first = all[0];
			const found = await adapter.projects.bySlug(first.slug);
			expect(found).toBeDefined();
			expect(found?.slug).toBe(first.slug);
		});

		it('featured() returns a subset of all()', async () => {
			const [all, featured] = await Promise.all([
				adapter.projects.all(),
				adapter.projects.featured(),
			]);
			expect(featured.length).toBeLessThanOrEqual(all.length);
		});

		it('public() returns a subset of all()', async () => {
			const [all, pub] = await Promise.all([
				adapter.projects.all(),
				adapter.projects.public(),
			]);
			expect(pub.length).toBeLessThanOrEqual(all.length);
		});

		// G7 relocated these assertions from the composed-adapter repository
		// tests. They now run against staticAdapter directly; its projects port
		// is the same object reference used by the composed adapter.
		it('public() excludes private projects', async () => {
			const publicProjects = await adapter.projects.public();
			publicProjects.forEach((project) => {
				expect(project.status).not.toBe('private');
			});
		});

		it('public() includes projects with status public', async () => {
			const publicProjects = await adapter.projects.public();
			const hasPublic = publicProjects.some((project) => project.status === 'public');
			expect(hasPublic).toBe(true);
		});

		it('public() includes wip projects when present', async () => {
			// wip projects are visible — they show a "work in progress" badge on the UI.
			// This test only asserts that wip is not filtered out, not that wip projects
			// exist in the seed data.
			const [publicProjects, all] = await Promise.all([
				adapter.projects.public(),
				adapter.projects.all(),
			]);
			const wipInSeed = all.filter((project) => project.status === 'wip');
			wipInSeed.forEach((project) => {
				expect(publicProjects.some((candidate) => candidate.slug === project.slug)).toBe(true);
			});
		});

		it('byService() returns an empty array for an unknown service ID', async () => {
			expect(await adapter.projects.byService('nonexistent')).toEqual([]);
		});

		it('transit-data-pipeline has location, environment, and version', async () => {
			const project = await adapter.projects.bySlug('transit-data-pipeline');
			expect(project?.location).toBe('sherbrooke');
			expect(project?.environment).toBe('production');
			expect(project?.version).toBe('2.4.1');
		});

		it('transit-data-pipeline has the expected impact metrics', async () => {
			const project = await adapter.projects.bySlug('transit-data-pipeline');
			expect(project?.impactMetrics).toBeDefined();
			expect(project!.impactMetrics!.length).toBe(2);
			// labels are now bilingual (en + Québécois fr from the FR pass); assert en.
			expect(project!.impactMetrics![0].value).toBe('30s');
			expect(project!.impactMetrics![0].label.en).toBe('Real-time refresh cycles');
			expect(project!.impactMetrics![1].value).toBe('99.9%');
			expect(project!.impactMetrics![1].label.en).toBe('Pipeline uptime');
		});

		it('projects without optional deployment fields still work', async () => {
			const project = await adapter.projects.bySlug('yesid-dev');
			expect(project).toBeDefined();
			// yesid-dev carries none of the deployment-style metadata fields…
			expect(project?.location).toBeUndefined();
			expect(project?.environment).toBeUndefined();
			expect(project?.version).toBeUndefined();
			// …but its case study (content-projects.1) does define impact metrics, so
			// the optional fields are exercised both present and absent on one project.
			expect(project?.impactMetrics).toBeDefined();
			expect(project!.impactMetrics!.length).toBe(5);
		});

		it('allTags() matches the shared project facet derivation', async () => {
			const tags = await adapter.projects.allTags();
			expect(tags).toEqual(expectedProjectFacets.tags);
		});

		it('allStackItems() matches the shared project facet derivation', async () => {
			const items = await adapter.projects.allStackItems();
			expect(items).toEqual(expectedProjectFacets.stackItems);
		});

		it('serviceIdsForProjects() matches the shared project facet derivation', async () => {
			const ids = await adapter.projects.serviceIdsForProjects();
			expect(ids).toEqual(expectedProjectFacets.serviceIds);
		});
	});

	describe('services port', () => {
		it('all() returns a non-empty readonly array', async () => {
			const result = await adapter.services.all();
			expect(result.length).toBeGreaterThan(0);
		});

		it('byId() returns undefined for unknown id', async () => {
			const result = await adapter.services.byId('__nonexistent__');
			expect(result).toBeUndefined();
		});

		it('byId() returns a service for a real id', async () => {
			const visible = await adapter.services.visible();
			const first = visible[0];
			const found = await adapter.services.byId(first.id);
			expect(found?.id).toBe(first.id);
		});

		it('visible() returns services, filtering hidden ones', async () => {
			const [all, visible] = await Promise.all([
				adapter.services.all(),
				adapter.services.visible(),
			]);
			expect(visible.length).toBeLessThanOrEqual(all.length);
		});

		it('adjacent() returns prev/next shape', async () => {
			const all = await adapter.services.visible();
			const middle = all[Math.floor(all.length / 2)];
			const result = await adapter.services.adjacent(middle.id);
			expect(result).toHaveProperty('prev');
			expect(result).toHaveProperty('next');
		});

		it('adjacent() for first service has no prev', async () => {
			const visible = await adapter.services.visible();
			const first = visible[0];
			const { prev } = await adapter.services.adjacent(first.id);
			expect(prev).toBeUndefined();
		});

		it('adjacent() for last service has no next', async () => {
			const visible = await adapter.services.visible();
			const last = visible[visible.length - 1];
			const { next } = await adapter.services.adjacent(last.id);
			expect(next).toBeUndefined();
		});
	});

	describe('blog port', () => {
		it('all() returns a non-empty readonly array', async () => {
			const result = await adapter.blog.all();
			expect(result.length).toBeGreaterThan(0);
		});

		it('byCategory("professional") returns posts', async () => {
			const result = await adapter.blog.byCategory('professional');
			expect(Array.isArray(result)).toBe(true);
		});

		it('byCategory("personal") returns posts', async () => {
			const result = await adapter.blog.byCategory('personal');
			expect(Array.isArray(result)).toBe(true);
		});

		it('bySlug() returns undefined for unknown slug', async () => {
			const result = await adapter.blog.bySlug('__nonexistent__');
			expect(result).toBeUndefined();
		});

		it('bySlug() returns a post for a real slug', async () => {
			const all = await adapter.blog.all();
			const first = all[0];
			const found = await adapter.blog.bySlug(first.slug);
			expect(found?.slug).toBe(first.slug);
		});

		it('html() returns a string for a real slug', async () => {
			const all = await adapter.blog.all();
			const first = all[0];
			const html = await adapter.blog.html(first.slug);
			expect(typeof html).toBe('string');
		});

		it('tagsForCategory() returns an array', async () => {
			const tags = await adapter.blog.tagsForCategory('professional');
			expect(Array.isArray(tags)).toBe(true);
		});

		it('languagesForCategory() returns an array', async () => {
			const langs = await adapter.blog.languagesForCategory('professional');
			expect(Array.isArray(langs)).toBe(true);
		});

		it('latest(3) returns at most 3 posts', async () => {
			const latest = await adapter.blog.latest(3);
			expect(latest.length).toBeLessThanOrEqual(3);
		});
	});

	describe('meta port', () => {
		it('site() returns SiteMeta shape', async () => {
			const result = await adapter.meta.site();
			expect(result).toHaveProperty('name');
			expect(result).toHaveProperty('tagline');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('links');
		});
	});

	describe('techStack port', () => {
		// slice-18g: TechStackPort shrunk to all/byId/content (decisions Q1+Q2+Q5).
		// allScenarios/connections removed; Phase 5 will update the Svelte consumers.
		it('all() returns a non-empty readonly array', async () => {
			const result = await adapter.techStack.all();
			expect(result.length).toBeGreaterThan(0);
		});

		it('byId() returns undefined for unknown id', async () => {
			const result = await adapter.techStack.byId('__nonexistent__');
			expect(result).toBeUndefined();
		});

		it('content() returns a string for any id', async () => {
			const all = await adapter.techStack.all();
			const first = all[0];
			const result = await adapter.techStack.content(first.id);
			expect(typeof result).toBe('string');
		});
	});

	describe('content port', () => {
		it('hero() returns content', async () => {
			const result = await adapter.content.hero();
			expect(result).toBeDefined();
		});

		it('navLinks() returns a non-empty array', async () => {
			const result = await adapter.content.navLinks();
			expect(result.length).toBeGreaterThan(0);
		});

		it('menuItems() returns a non-empty array', async () => {
			const result = await adapter.content.menuItems();
			expect(result.length).toBeGreaterThan(0);
		});

		it('heroMock() returns HeroData shape', async () => {
			const result = await adapter.content.heroMock();
			expect(result).toHaveProperty('metrics');
			expect(result).toHaveProperty('queryRows');
			expect(result).toHaveProperty('queryTime');
		});

		it('initialHeroData() returns HeroData shape', async () => {
			const result = await adapter.content.initialHeroData();
			expect(result).toHaveProperty('metrics');
			expect(result).toHaveProperty('queryRows');
			expect(result).toHaveProperty('queryTime');
		});

		it('errorPage(404) returns ErrorPageContent shape', async () => {
			const result = await adapter.content.errorPage(404);
			expect(result).toBeDefined();
		});

		it('aboutPage() + contactPage() return content', async () => {
			const [about, contact] = await Promise.all([
				adapter.content.aboutPage(),
				adapter.content.contactPage(),
			]);
			expect(about).toBeDefined();
			expect(contact).toBeDefined();
		});
	});
});
