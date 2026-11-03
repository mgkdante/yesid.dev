import { describe, expect, it } from 'vitest';
import { projects } from '#lib/content/projects.ts';
import { blogPosts } from '#lib/content/blog.ts';
import { loadOgTitle } from './load-title';

const project = { ...projects[0]!, slug: 'fixture-project', title: { en: 'English project', fr: 'Projet français' } };
const post = { ...blogPosts[0]!, slug: 'fixture-post', title: 'Article français', lang: 'fr' as const };

describe('OG titles from catalog fixtures', () => {
	it('uses the native language carried by a blog slug', async () => {
		expect(await loadOgTitle('blog', post.slug, 'en', { posts: [post] })).toEqual({ eyebrow: 'BLOG', title: 'Article français' });
	});
	it('returns null for unknown posts and projects', async () => {
		expect(await loadOgTitle('blog', 'missing', 'en', { posts: [] })).toBeNull();
		expect(await loadOgTitle('project', 'missing', 'en', { projects: [] })).toBeNull();
	});
	it('localizes project titles and eyebrows', async () => {
		expect(await loadOgTitle('project', project.slug, 'fr', { projects: [project] })).toEqual({ eyebrow: 'PROJET', title: 'Projet français' });
	});
	it.each([undefined, '', '   '])('falls back to English for missing French copy %s', async (fr) => {
		expect(await loadOgTitle('project', project.slug, 'fr', { projects: [{ ...project, title: { en: 'English project', fr } }] })).toEqual({ eyebrow: 'PROJET', title: 'English project' });
	});
	it('returns null for private or unavailable-locale rows', async () => {
		expect(await loadOgTitle('project', project.slug, 'en', { projects: [{ ...project, status: 'private' }] })).toBeNull();
		expect(await loadOgTitle('project', project.slug, 'fr', { projects: [project], locales: ['en'] })).toBeNull();
		expect(await loadOgTitle('blog', post.slug, 'en', { posts: [post], locales: ['en'] })).toBeNull();
	});
	it('keeps wip project cards available without a marker', async () => {
		expect(await loadOgTitle('project', project.slug, 'en', { projects: [{ ...project, status: 'wip' }] })).toEqual({ eyebrow: 'PROJECT', title: 'English project' });
	});
	it('returns null for empty titles so the endpoint can stop the build', async () => {
		expect(await loadOgTitle('project', project.slug, 'en', { projects: [{ ...project, title: { en: '' } }] })).toBeNull();
		expect(await loadOgTitle('blog', post.slug, 'fr', { posts: [{ ...post, title: '' }] })).toBeNull();
	});
});
