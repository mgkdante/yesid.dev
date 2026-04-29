// Contract test for the static adapter implementation.
//
// Imports `staticAdapter` directly (not via ./index re-export) so this test
// stays network-free. Contract itself is enforced compile-time by the
// `ContentAdapter` annotation on each adapter implementation; this file
// verifies that the static implementation returns sane cardinality + shapes
// (non-empty where expected, undefined for not-found).
//
// For the Directus adapter (Slice 18 Task 4+), contract enforcement is
// compile-time via `directusAdapter: ContentAdapter` in ./directus.ts. Live
// integration testing against cms.yesid.dev is out of scope for `bun run
// test` (would require env credentials + network) — covered by the seed
// script's verify step + manual browser smoke at slice close.

import { describe, it, expect } from 'vitest';
import { staticAdapter as adapter } from './static';

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

		it('allTags() returns an array', async () => {
			const tags = await adapter.projects.allTags();
			expect(Array.isArray(tags)).toBe(true);
		});

		it('allStackItems() returns an array', async () => {
			const items = await adapter.projects.allStackItems();
			expect(Array.isArray(items)).toBe(true);
		});

		it('serviceIdsForProjects() returns an array', async () => {
			const ids = await adapter.projects.serviceIdsForProjects();
			expect(Array.isArray(ids)).toBe(true);
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
