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
import { ogCoverage } from '@yesid/gates';

// The OG endpoint validates [slug] against this regex (Task 7). A slug
// authored in CMS that doesn't match would render a 400 at request time.
const SLUG_RE = /^[a-z0-9-]+$/;

function assertOgCoverage(type: string, identifiers: readonly string[]) {
	const coverage = ogCoverage({
		expected: [type],
		actual: ogTypeMatch(type) ? [type] : [],
		identifiers,
		isValidIdentifier: (identifier) => SLUG_RE.test(identifier),
	});

	expect(coverage.missing, `missing OG endpoint type "${type}"`).toEqual([]);
	expect(coverage.extra, `unexpected OG endpoint type "${type}"`).toEqual([]);
	expect(coverage.invalid, `${type} slugs must match ${SLUG_RE}`).toEqual([]);
}

describe('OG coverage gate', () => {
	it('every published blog post has a slug accepted by the OG endpoint', async () => {
		const posts = await getAllPosts();
		expect(posts.length).toBeGreaterThan(0);
		assertOgCoverage('blog', posts.map((post) => post.slug));
	});

	it('every published project has a slug accepted by the OG endpoint', async () => {
		const projects = await getPublicProjects();
		expect(projects.length).toBeGreaterThan(0);
		assertOgCoverage('project', projects.map((project) => project.slug));
	});
});
