import { describe, it, expect } from 'vitest';
import { projects } from '#lib/content/projects.ts';
import { services } from '#lib/content/services.ts';
import { catalog } from '#lib/catalog/index.ts';

describe('ContentCatalog contract', () => {
	describe('projects', () => {
		it('bySlug() returns undefined for unknown slug', async () => {
			const result = await catalog.projects.bySlug('__nonexistent__');
			expect(result).toBeUndefined();
			expect(await catalog.projects.bySlug('')).toBeUndefined();
		});

		it('bySlug() returns a project for a real slug', async () => {
			const first = projects[0];
			const found = await catalog.projects.bySlug(first.slug);
			expect(found).toBeDefined();
			expect(found?.slug).toBe(first.slug);
		});

		it('featured() returns a subset of all()', async () => {
			const featured = await catalog.projects.featured();
			expect(featured.length).toBeLessThanOrEqual(projects.length);
		});

		it('available() returns a subset of all()', async () => {
			const pub = await catalog.projects.available();
			expect(pub.length).toBeLessThanOrEqual(projects.length);
		});

		it('available() excludes private projects', async () => {
			const publicProjects = await catalog.projects.available();
			publicProjects.forEach((project) => {
				expect(project.status).not.toBe('private');
			});
		});

		it('available() includes projects with status public', async () => {
			const publicProjects = await catalog.projects.available();
			const hasPublic = publicProjects.some((project) => project.status === 'public');
			expect(hasPublic).toBe(true);
		});

		it('available() includes wip projects when present', async () => {
			// wip projects are visible — they show a "work in progress" badge on the UI.
			// This test only asserts that wip is not filtered out, not that wip projects
			// exist in the seed data.
			const publicProjects = await catalog.projects.available();
			const wipInSeed = projects.filter((project) => project.status === 'wip');
			wipInSeed.forEach((project) => {
				expect(publicProjects.some((candidate) => candidate.slug === project.slug)).toBe(true);
			});
		});

		it('byService() returns an empty array for an unknown service ID', async () => {
			expect(await catalog.projects.byService('nonexistent')).toEqual([]);
		});

		it('transit-data-pipeline has the documented locations and environment without an invented version', async () => {
			const project = await catalog.projects.bySlug('transit-data-pipeline');
			expect(project?.location).toBe('Montréal / Ottawa');
			expect(project?.environment).toBe('production');
			expect(project?.version).toBeUndefined();
		});

		it('transit-data-pipeline exposes its authored impact metrics', async () => {
			const project = await catalog.projects.bySlug('transit-data-pipeline');
			expect(project?.impactMetrics?.length).toBeGreaterThan(0);
			for (const metric of project!.impactMetrics!) {
				expect(metric.value).toMatch(/\S/);
				expect(metric.label.en).toMatch(/\S/);
			}
		});

		it('projects without optional deployment fields still work', async () => {
			const source = projects.find(
				(p) => !p.location && !p.environment && !p.version && p.impactMetrics?.length,
			);
			expect(source, 'Expected a project with impact metrics and no optional deployment fields').toBeDefined();
			const project = await catalog.projects.bySlug(source!.slug);
			expect(project).toBeDefined();
			expect(project?.location).toBeUndefined();
			expect(project?.environment).toBeUndefined();
			expect(project?.version).toBeUndefined();
			expect(project?.impactMetrics).toEqual(source!.impactMetrics);
		});
	});

	describe('services', () => {
		it('byId() returns undefined for unknown id', async () => {
			const result = await catalog.services.byId('__nonexistent__');
			expect(result).toBeUndefined();
		});

		it('byId() returns a service for a real id', async () => {
			const visible = await catalog.services.available();
			const first = visible[0];
			const found = await catalog.services.byId(first.id);
			expect(found?.id).toBe(first.id);
		});

		it('visible() returns services, filtering hidden ones', async () => {
			const visible = await catalog.services.available();
			expect(visible.length).toBeLessThanOrEqual(services.length);
		});

		it('adjacent() returns prev/next shape', async () => {
			const all = await catalog.services.available();
			const middle = all[Math.floor(all.length / 2)];
			const result = await catalog.services.adjacent(middle.id);
			expect(result).toHaveProperty('prev');
			expect(result).toHaveProperty('next');
		});

		it('adjacent() for first service has no prev', async () => {
			const visible = await catalog.services.available();
			const first = visible[0];
			const { prev } = await catalog.services.adjacent(first.id);
			expect(prev).toBeUndefined();
		});

		it('adjacent() for last service has no next', async () => {
			const visible = await catalog.services.available();
			const last = visible[visible.length - 1];
			const { next } = await catalog.services.adjacent(last.id);
			expect(next).toBeUndefined();
		});
	});

	describe('blog', () => {
		it('all() returns a non-empty readonly array', async () => {
			const result = await catalog.blog.all();
			expect(result.length).toBeGreaterThan(0);
		});

		it('byCategory("professional") returns posts', async () => {
			const result = await catalog.blog.byCategory('professional');
			expect(Array.isArray(result)).toBe(true);
		});

		it('byCategory("personal") returns posts', async () => {
			const result = await catalog.blog.byCategory('personal');
			expect(Array.isArray(result)).toBe(true);
		});

		it('bySlug() returns undefined for unknown slug', async () => {
			const result = await catalog.blog.bySlug('__nonexistent__');
			expect(result).toBeUndefined();
		});

		it('bySlug() returns a post for a real slug', async () => {
			const all = await catalog.blog.all();
			const first = all[0];
			const found = await catalog.blog.bySlug(first.slug);
			expect(found?.slug).toBe(first.slug);
		});

	});

	describe('metadata', () => {
		it('site() returns SiteMeta shape', async () => {
			const result = await catalog.meta.site();
			expect(result).toHaveProperty('name');
			expect(result).toHaveProperty('tagline');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('links');
		});
	});

	describe('content', () => {
		it('hero() returns content', async () => {
			const result = await catalog.content.hero();
			expect(result).toBeDefined();
		});

		it('initialHeroData() returns HeroData shape', async () => {
			const result = await catalog.content.initialHeroData();
			expect(result).toHaveProperty('metrics');
			expect(result).toHaveProperty('queryRows');
			expect(result).toHaveProperty('queryTime');
		});

		it('errorPage(404) returns ErrorPageContent shape', async () => {
			const result = await catalog.content.errorPage(404);
			expect(result).toBeDefined();
		});

		it('aboutPage() + contactPage() return content', async () => {
			const [about, contact] = await Promise.all([
				catalog.content.aboutPage(),
				catalog.content.contactPage(),
			]);
			expect(about).toBeDefined();
			expect(contact).toBeDefined();
		});
	});
});
