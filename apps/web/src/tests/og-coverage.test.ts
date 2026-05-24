// Build-time OG coverage gate.
//
// Runs as part of the standard test suite (`bun run test`). Asserts that
// every published blog post and project has a slug accepted by the OG
// endpoint's URL pattern (/og/[type=ogType]/[slug].png), so that
// per-route OG image generation cannot silently break when content is
// authored with an unexpected slug shape or when a new content type is
// shipped without updating OG wiring.
//
// Mirrors the sitemap-coverage pattern: enumerate via the same helpers
// the route loaders use (getAllPosts, getPublicProjects), then assert
// each row's slug matches the endpoint contract.

import { describe, it, expect } from 'vitest';
import { getAllPosts } from '$lib/repositories/blog';
import { getPublicProjects } from '$lib/repositories/project';
import { match as ogTypeMatch } from '../params/ogType';

// The OG endpoint validates [slug] against this regex (Task 7). A slug
// authored in CMS that doesn't match would render a 400 at request time.
const SLUG_RE = /^[a-z0-9-]+$/;

describe('OG coverage gate', () => {
	it('every published blog post has a slug accepted by the OG endpoint', async () => {
		const posts = await getAllPosts();
		expect(posts.length).toBeGreaterThan(0);
		expect(ogTypeMatch('blog')).toBe(true);
		for (const post of posts) {
			expect(post.slug, `blog slug "${post.slug}" must match ${SLUG_RE}`).toMatch(SLUG_RE);
		}
	});

	it('every published project has a slug accepted by the OG endpoint', async () => {
		const projects = await getPublicProjects();
		expect(projects.length).toBeGreaterThan(0);
		expect(ogTypeMatch('project')).toBe(true);
		for (const project of projects) {
			expect(project.slug, `project slug "${project.slug}" must match ${SLUG_RE}`).toMatch(SLUG_RE);
		}
	});
});
