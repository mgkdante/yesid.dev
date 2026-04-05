// Data integrity tests validate that the seed data files conform to the contracts
// defined by the TypeScript interfaces. These tests catch human errors in the data
// (duplicate slugs, empty required fields, invalid enum values) at test time rather
// than at runtime when a user is looking at a broken page.

import { describe, it, expect } from 'vitest';
import { projects } from './projects.js';
import { services } from './services.js';
import { siteMeta } from './meta.js';
import { blogPosts } from './blog.js';

const VALID_STATUSES = ['public', 'private', 'wip'] as const;

describe('projects data integrity', () => {
	it('all slugs are unique', () => {
		const slugs = projects.map((p) => p.slug);
		const uniqueSlugs = new Set(slugs);
		expect(uniqueSlugs.size).toBe(slugs.length);
	});

	it('no project has an empty slug', () => {
		projects.forEach((p) => {
			expect(p.slug.trim()).not.toBe('');
		});
	});

	it('all slugs are URL-safe (lowercase, hyphens only, no spaces or special chars)', () => {
		// slugs become URL path segments — they must not contain spaces or reserved chars
		const urlSafe = /^[a-z0-9-]+$/;
		projects.forEach((p) => {
			expect(p.slug).toMatch(urlSafe);
		});
	});

	it('all required LocalizedString fields have a non-empty English value', () => {
		projects.forEach((p) => {
			expect(p.title.en.trim()).not.toBe('');
			expect(p.oneLiner.en.trim()).not.toBe('');
			expect(p.description.en.trim()).not.toBe('');
		});
	});

	it('all status values are valid', () => {
		projects.forEach((p) => {
			expect(VALID_STATUSES).toContain(p.status);
		});
	});

	it('all projects have at least one stack entry', () => {
		projects.forEach((p) => {
			expect(p.stack.length).toBeGreaterThan(0);
		});
	});

	it('all projects have at least one tag', () => {
		projects.forEach((p) => {
			expect(p.tags.length).toBeGreaterThan(0);
		});
	});

	it('there is at least one featured project', () => {
		// The home page showcase section requires at least one featured project
		const featured = projects.filter((p) => p.featured);
		expect(featured.length).toBeGreaterThan(0);
	});
});

describe('services data integrity', () => {
	// WHY no hardcoded count: the station system is data-driven. Adding a service
	// means adding one object to services.ts — no component changes. Tests validate
	// structural integrity (unique, sequential, valid refs), not a fixed count.

	it('at least 1 service exists', () => {
		expect(services.length).toBeGreaterThanOrEqual(1);
	});

	it('all services have a non-empty English title', () => {
		services.forEach((s) => {
			expect(s.title.en.trim()).not.toBe('');
		});
	});

	it('all services have a non-empty English description', () => {
		services.forEach((s) => {
			expect(s.description.en.trim()).not.toBe('');
		});
	});

	it('all services have a unique id', () => {
		const ids = services.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all service ids are non-empty strings', () => {
		services.forEach((s) => {
			expect(s.id.trim()).not.toBe('');
		});
	});

	it('all services have unique station numbers', () => {
		const stations = services.map((s) => s.station);
		expect(new Set(stations).size).toBe(stations.length);
	});

	it('station numbers are sequential starting from 1 with no gaps', () => {
		const stations = services.map((s) => s.station).sort((a, b) => a - b);
		const expected = Array.from({ length: services.length }, (_, i) => i + 1);
		expect(stations).toEqual(expected);
	});

	it('station count equals services count (every service has a station)', () => {
		const stationCount = new Set(services.map((s) => s.station)).size;
		expect(stationCount).toBe(services.length);
	});

	it('relatedProjects is an array on every service', () => {
		services.forEach((s) => {
			expect(Array.isArray(s.relatedProjects)).toBe(true);
		});
	});

	it('all relatedProjects slugs exist in the projects array', () => {
		const validSlugs = new Set(projects.map((p) => p.slug));
		services.forEach((s) => {
			s.relatedProjects.forEach((slug) => {
				expect(validSlugs.has(slug), `slug "${slug}" in service "${s.id}" not found in projects`).toBe(true);
			});
		});
	});
});

describe('siteMeta data integrity', () => {
	it('name is yesid.', () => {
		// Brand name is non-negotiable — enforced here so a typo is caught immediately
		expect(siteMeta.name).toBe('yesid.');
	});

	it('tagline has a non-empty English value', () => {
		expect(siteMeta.tagline.en.trim()).not.toBe('');
	});

	it('description has a non-empty English value', () => {
		expect(siteMeta.description.en.trim()).not.toBe('');
	});

	it('email link is present', () => {
		expect(siteMeta.links.email.trim()).not.toBe('');
	});

	it('github link is present', () => {
		expect(siteMeta.links.github.trim()).not.toBe('');
	});
});

describe('blogPosts data integrity', () => {
	it('at least 3 blog posts exist', () => {
		expect(blogPosts.length).toBeGreaterThanOrEqual(3);
	});

	it('all slugs are unique', () => {
		const slugs = blogPosts.map((p) => p.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('all slugs are URL-safe', () => {
		const urlSafe = /^[a-z0-9-]+$/;
		blogPosts.forEach((p) => {
			expect(p.slug).toMatch(urlSafe);
		});
	});

	it('all required LocalizedString fields have non-empty English values', () => {
		blogPosts.forEach((p) => {
			expect(p.title.en.trim()).not.toBe('');
			expect(p.excerpt.en.trim()).not.toBe('');
		});
	});

	it('all dates are valid ISO date strings', () => {
		const isoDate = /^\d{4}-\d{2}-\d{2}$/;
		blogPosts.forEach((p) => {
			expect(p.date).toMatch(isoDate);
			expect(new Date(p.date).toString()).not.toBe('Invalid Date');
		});
	});

	it('all posts have at least one tag', () => {
		blogPosts.forEach((p) => {
			expect(p.tags.length).toBeGreaterThan(0);
		});
	});

	it('all posts have a non-empty url', () => {
		blogPosts.forEach((p) => {
			expect(p.url.trim()).not.toBe('');
		});
	});
});
