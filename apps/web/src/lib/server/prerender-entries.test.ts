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
	legalEntries,
	ogBlogRows,
	ogProjectSlugs,
	projectEntries,
	serviceEntries,
} from './prerender-entries';
import { blogPosts } from '#lib/content/blog.ts';
import { projects } from '#lib/content/projects.ts';
import { services } from '#lib/content/services.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { PREFIX_LOCALES } from '#lib/utils/locale-routing.ts';
import type { BlogPost, Project, Service } from '#lib/types.ts';

const LANG_VALUES = ['', ...PREFIX_LOCALES];

describe('prerender-entries', () => {
	it('does not enumerate an archived static page in any locale', () => {
		expect(localeEntries('/about', sitePages.filter((page) => page.path !== '/about'))).toEqual([]);
		expect(localeEntries('/contact', sitePages)).toEqual([{ lang: '' }, { lang: 'fr' }, { lang: 'es' }]);
	});

	it('does not enumerate archived listings, detail pages or their OG cards', () => {
		const registry = sitePages.filter((page) => !['/blog', '/projects', '/services'].includes(page.path));
		expect(blogEntriesFor(blogPosts, registry)).toEqual([]);
		expect(projectEntries(registry)).toEqual([]);
		expect(serviceEntries(registry)).toEqual([]);
		expect(ogBlogRows(registry)).toEqual([]);
		expect(ogProjectSlugs(projects, registry)).toEqual([]);
		expect(localeEntries('/blog/personal', registry)).toEqual([{ lang: '' }, { lang: 'fr' }, { lang: 'es' }]);
	});

	it('does not enumerate an archived legal page in any locale', () => {
		const registry = sitePages.filter((page) => page.path !== '/legal/privacy');
		expect(legalEntries(registry).some((entry) => entry.slug === 'privacy')).toBe(false);
		expect(legalEntries(registry).some((entry) => entry.slug === 'terms')).toBe(true);
	});

	it('enumerates a service with omitted visibility like the public service loader', () => {
		expect(serviceEntries(sitePages, [{ id: 'default-visible' } as Service])).toEqual([
			{ lang: '', id: 'default-visible' }, { lang: 'fr', id: 'default-visible' }, { lang: 'es', id: 'default-visible' },
		]);
	});
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

	it('blogEntriesFor prerenders only the languages a post is available in', () => {
		const partial = [
			{ translationKey: 'partial-article', slug: 'english-only', lang: 'en' },
			{ translationKey: 'partial-article', slug: 'en-espanol', lang: 'es' },
		] as BlogPost[];

		expect(blogEntriesFor(partial)).toEqual([
			{ lang: '', slug: 'english-only' },
			{ lang: 'es', slug: 'en-espanol' },
		]);
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

	it('ogProjectSlugs includes a WIP project while excluding a private project', () => {
		const wip = { slug: 'work-in-progress', status: 'wip' } as Project;
		const hidden = { slug: 'private-project', status: 'private' } as Project;

		expect(ogProjectSlugs([wip, hidden])).toEqual(['work-in-progress']);
	});

	it('ogProjectSlugs binds generated projects by default', () => {
		expect(ogProjectSlugs()).toEqual(['transit-data-pipeline', 'cafe-arona', 'yesid-dev-design', 'yesid-dev']);
	});

	it('serviceEntries covers every visible service in every locale, and only those', () => {
		const entries = serviceEntries();
		const visible = services.filter((s) => s.visible !== false);
		expect(entries).toHaveLength(visible.length * LANG_VALUES.length);
		const hiddenIds = new Set(services.filter((s) => s.visible === false).map((s) => s.id));
		for (const entry of entries) {
			expect(hiddenIds.has(entry.id)).toBe(false);
		}
	});
});
