// Prerender entry builders — locale × slug expansion contract.
//
// These entries are what makes `prerender = true` at the root layout actually
// cover the site: every published locale variant and every content slug must
// appear, and unpublished content (private projects, invisible services) must
// not. Runs against the real generated content modules — the same arrays the
// sitemap builder enumerates — so a content regen that breaks coverage fails
// here first.

import { describe, expect, it } from 'vitest';
import {
	blogEntries,
	blogEntriesFor,
	localeEntries,
	projectEntries,
	serviceEntries,
} from './prerender-entries';
import { blogPosts } from '$lib/content/blog';
import { projects } from '$lib/content/projects';
import { services } from '$lib/content/services';
import { PREFIX_LOCALES } from '$lib/utils/locale-routing';
import type { BlogPost } from '$lib/types';

const LANG_VALUES = ['', ...PREFIX_LOCALES];

describe('prerender-entries', () => {
	it('localeEntries yields one entry per published locale, EN unprefixed', () => {
		expect(localeEntries()).toEqual(LANG_VALUES.map((lang) => ({ lang })));
	});

	it('blogEntries yields the exact locale slug for every translated row', () => {
		const entries = blogEntries();
		expect(entries).toHaveLength(blogPosts.length);
		for (const post of blogPosts) {
			const expectedLang = (PREFIX_LOCALES as readonly string[]).includes(post.lang)
				? post.lang
				: '';
			expect(entries).toContainEqual({ lang: expectedLang, slug: post.slug });
		}
	});

	it('blogEntriesFor rejects an incomplete translation group before prerendering', () => {
		const englishOnly = {
			translationKey: 'incomplete-article',
			slug: 'english-only',
			lang: 'en',
		} as BlogPost;

		expect(() => blogEntriesFor([englishOnly])).toThrow(
			'Missing blog translation for incomplete-article (fr)',
		);
	});

	it('projectEntries covers every non-private project in every locale', () => {
		const entries = projectEntries();
		const publicProjects = projects.filter((p) => p.status !== 'private');
		expect(entries).toHaveLength(publicProjects.length * LANG_VALUES.length);
		for (const project of publicProjects) {
			for (const lang of LANG_VALUES) {
				expect(entries).toContainEqual({ lang, slug: project.slug });
			}
		}
	});

	it('projectEntries never leaks a private project', () => {
		const privateSlugs = new Set(
			projects.filter((p) => p.status === 'private').map((p) => p.slug),
		);
		for (const entry of projectEntries()) {
			expect(privateSlugs.has(entry.slug)).toBe(false);
		}
	});

	it('serviceEntries covers every visible service in every locale, and only those', () => {
		const entries = serviceEntries();
		const visible = services.filter((s) => s.visible);
		expect(entries).toHaveLength(visible.length * LANG_VALUES.length);
		const hiddenIds = new Set(services.filter((s) => !s.visible).map((s) => s.id));
		for (const entry of entries) {
			expect(hiddenIds.has(entry.id)).toBe(false);
		}
	});
});
