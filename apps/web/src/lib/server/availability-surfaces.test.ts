import { describe, expect, it } from 'vitest';
import { projects } from '#lib/content/projects.ts';
import { services } from '#lib/content/services.ts';
import { blogPosts } from '#lib/content/blog.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import type { Locale, Project, Service, BlogPost } from '#lib/types.ts';
import { canonicalFor } from '#lib/utils/seo-defaults.ts';
import { ogSlugParam } from '#lib/og/og-path.ts';
import { projectEntries, serviceEntries, blogEntriesFor } from './prerender-entries';
import { llmsTxt, llmsFullTxt } from './llms';
import { _buildSitemapEntries } from '../../routes/sitemap.xml/+server';
import { entries as ogEntries, _createOgHandler as createOgHandler } from '../../routes/og/[type=ogType]/[slug].png/+server';

const ALL: readonly Locale[] = ['en', 'fr', 'es'];
type Row = {
	name: string;
	kind: 'project' | 'service' | 'post';
	projects?: readonly Project[];
	services?: readonly Service[];
	posts?: readonly BlogPost[];
	locales: readonly Locale[];
	expected: readonly Locale[];
};
const project = (status: Project['status']): Project => ({ ...projects[0]!, slug: 'availability-project', status });
const service = (visible?: boolean): Service => ({ ...services[0]!, id: 'availability-service', visible });
const post: BlogPost = { ...blogPosts[0]!, slug: 'availability-post', lang: 'es', external: false, url: '/es/blog/availability-post' };
const rows: Row[] = [
	{ name: 'public project', kind: 'project', projects: [project('public')], locales: ALL, expected: ALL },
	{ name: 'wip project', kind: 'project', projects: [project('wip')], locales: ALL, expected: ALL },
	{ name: 'private project', kind: 'project', projects: [project('private')], locales: ALL, expected: [] },
	{ name: 'project with Spanish off', kind: 'project', projects: [project('public')], locales: ['en', 'fr'], expected: ['en', 'fr'] },
	{ name: 'project with English off', kind: 'project', projects: [project('wip')], locales: ['es'], expected: ['es'] },
	{ name: 'available service', kind: 'service', services: [service(true)], locales: ALL, expected: ALL },
	{ name: 'default service status', kind: 'service', services: [service()], locales: ALL, expected: ALL },
	{ name: 'hidden service', kind: 'service', services: [service(false)], locales: ALL, expected: [] },
	{ name: 'service with Spanish off', kind: 'service', services: [service(true)], locales: ['en', 'fr'], expected: ['en', 'fr'] },
	{ name: 'service with English off', kind: 'service', services: [service(true)], locales: ['es'], expected: ['es'] },
	{ name: 'Spanish post', kind: 'post', posts: [post], locales: ALL, expected: ['es'] },
	{ name: 'post with Spanish off', kind: 'post', posts: [post], locales: ['en', 'fr'], expected: [] },
];

describe('availability agreement at the delivered surfaces', () => {
	it.each(rows)('$name', async (row) => {
		for (const pages of [sitePages, []]) {
			const context = { projects: row.projects ?? [], services: row.services ?? [], posts: row.posts ?? [], locales: row.locales, pages };
			const expected = pages === sitePages ? row.expected : [];
			const path = row.kind === 'project' ? '/projects/availability-project' : row.kind === 'service' ? '/services/availability-service' : '/blog/availability-post';
			const sitemap = (await _buildSitemapEntries(context)).join('');
			const prerender = row.kind === 'project' ? projectEntries(context) : row.kind === 'service' ? serviceEntries(context) : blogEntriesFor(context.posts, context);
			const cards = ogEntries(context);
			for (const locale of ALL) {
				const available = expected.includes(locale);
				const url = canonicalFor(path, locale);
				expect(sitemap.includes(`<loc>${url}</loc>`), `${row.name} sitemap ${locale}`).toBe(available);
				expect(prerender.some((entry) => entry.lang === (locale === 'en' ? '' : locale)), `${row.name} prerender ${locale}`).toBe(available);
				for (const render of [llmsTxt, llmsFullTxt]) expect(render(context).includes(`${url})`), `${row.name} llms ${locale}`).toBe(available);
				if (row.kind !== 'service') {
					const type = row.kind === 'project' ? 'project' : 'blog';
					const slug = row.kind === 'project' ? 'availability-project' : 'availability-post';
					const hasCard = cards.some((entry) => entry.type === type && entry.slug === ogSlugParam(type, slug, locale));
					// Blog cards carry their row's language in the slug, without locale suffixes.
					if (row.kind === 'project' || locale === post.lang) expect(hasCard, `${row.name} OG ${locale}`).toBe(available);
				} else {
					// Service cards are committed static assets; this route generates project/blog cards only.
					expect(cards).toEqual([]);
				}
			}
		}
	});
	it('omits the Spanish section and every Spanish URL when Spanish is off', () => {
		for (const render of [llmsTxt, llmsFullTxt]) {
			const body = render({ locales: ['en', 'fr'] });
			expect(body).not.toContain('https://yesid.dev/es');
			expect(body).not.toContain('## Español');
		}
	});
	it.each([
		{ status: 'private' as const, locales: ALL, slug: 'availability-project' },
		{ status: 'public' as const, locales: ['en'] as const, slug: 'availability-project.es' },
	])('OG returns 404 for $status / $slug', async ({ status, locales, slug }) => {
		const get = createOgHandler({ projects: [project(status)], posts: [], locales });
		await expect(get({ params: { type: 'project', slug } } as Parameters<typeof get>[0])).rejects.toMatchObject({ status: 404 });
	});
	it('OG returns 404 for a post in a switched-off locale', async () => {
		const get = createOgHandler({ projects: [], posts: [post], locales: ['en'] });
		await expect(get({ params: { type: 'blog', slug: post.slug } } as Parameters<typeof get>[0])).rejects.toMatchObject({ status: 404 });
	});
	it('OG serves a PNG for an available wip project', async () => {
		const get = createOgHandler({ projects: [project('wip')], posts: [] });
		const response = await get({ params: { type: 'project', slug: 'availability-project' } } as Parameters<typeof get>[0]);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/png');
		expect([...new Uint8Array(await response.arrayBuffer()).slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
	});
});
