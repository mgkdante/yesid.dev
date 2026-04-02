// Data integrity tests validate that the seed data files conform to the contracts
// defined by the TypeScript interfaces. These tests catch human errors in the data
// (duplicate slugs, empty required fields, invalid enum values) at test time rather
// than at runtime when a user is looking at a broken page.

import { describe, it, expect } from 'vitest';
import { projects } from './projects.js';
import { services } from './services.js';
import { siteMeta } from './meta.js';

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
	it('there are exactly 4 services', () => {
		// Spec requires exactly 4 — UI layout is designed around this count
		expect(services).toHaveLength(4);
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
