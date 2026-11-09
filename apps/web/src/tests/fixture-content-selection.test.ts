import { describe, expect, it } from 'vitest';
import { selectContentFixtures, fixturePost, fixtureProject, fixtureService, longTitlePost, type FixtureContent } from '../../tests/_support/content-fixtures';
import { blogPostFactory, projectFactory, serviceFactory } from './factories';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';
import { parseCodeFence } from '#lib/utils/code-fences.ts';
import type { BlockEditorDoc } from '#lib/types.ts';

const body: BlockEditorDoc = { time: 0, version: '2.31.2', blocks: [
	{ id: 'intro', type: 'paragraph', data: { text: 'Narrative fixture body.' } },
	{ id: 'heading', type: 'header', data: { level: 2, text: 'A fixture heading' } },
	{ id: 'diagram', type: 'code', data: { code: '```mermaid\nflowchart LR\n  A --> B\n```' } },
] };
const label = { en: 'Fixture', fr: 'Exemple', es: 'Ejemplo' };

function source(): FixtureContent {
	const posts = PUBLISHED_LOCALES.map(lang => blogPostFactory.build({
		slug: `a-${lang}`, translationKey: 'a-story', lang, title: 'Diagram story', category: 'professional', external: false,
	}));
	const long = blogPostFactory.build({ slug: 'z-long', translationKey: 'z-story', lang: 'en',
		title: 'A deliberate long fixture title that stresses the short laptop header', category: 'professional', external: false });
	const external = blogPostFactory.build({ slug: '0-external', translationKey: '0-external', external: true });
	const personal = blogPostFactory.build({ slug: '0-personal', translationKey: '0-personal', category: 'personal', external: false });
	const hidden = projectFactory.build({ slug: '0-hidden', status: 'private' });
	const project = projectFactory.build({ slug: 'public-fixture', status: 'public' });
	const service = serviceFactory.build({ id: 'visible-fixture', visible: true, svg: 'fixture.svg',
		sections: [{ title: label, content: label }] });
	return {
		posts: [external, personal, ...posts, long],
		bodies: Object.fromEntries([external, personal, ...posts, long].map(post => [post.slug, body])),
		projects: [hidden, project],
		services: [{ ...service, id: '0-hidden', visible: false }, service],
	};
}

function identities(selected: ReturnType<typeof selectContentFixtures>) {
	return { posts: PUBLISHED_LOCALES.map(locale => selected.post(locale).slug),
		project: selected.project.slug, service: selected.service.id, longTitle: selected.longTitlePost.slug };
}

describe('browser fixture capabilities', () => {
	it('selects the same cases after editorial arrays are reordered', () => {
		const content = source();
		const reversed = { ...content, posts: [...content.posts].reverse(), projects: [...content.projects].reverse(),
			services: [...content.services].reverse(), bodies: Object.fromEntries(Object.entries(content.bodies).reverse()) };
		expect(identities(selectContentFixtures(reversed))).toEqual(identities(selectContentFixtures(content)));
		expect(identities(selectContentFixtures(content))).toEqual({ posts: ['a-en', 'a-fr', 'a-es'],
			project: 'public-fixture', service: 'visible-fixture', longTitle: 'z-long' });
	});

	it('fails clearly when a locale no longer has a diagram', () => {
		const content = source();
		const proseOnly = { ...body, blocks: body.blocks.filter(block => block.type !== 'code') };
		expect(() => selectContentFixtures({ ...content, bodies: { ...content.bodies, 'a-es': proseOnly } }))
			.toThrow(/local es.*Mermaid diagram/);
	});

	it.each(['paragraph', 'header'])('requires the narrative %s capability', (type) => {
		const content = source();
		const bodies = Object.fromEntries(Object.entries(content.bodies).map(([slug, doc]) => [slug,
			doc ? { ...doc, blocks: doc.blocks.filter(block => block.type !== type) } : undefined]));
		expect(() => selectContentFixtures({ ...content, bodies })).toThrow(/professional post with prose, H2 headings/);
	});

	it('rejects an external post even when its body has the required blocks', () => {
		const content = source();
		expect(() => selectContentFixtures({ ...content, posts: content.posts.map(post => post.lang === 'fr' ? { ...post, external: true } : post) }))
			.toThrow(/local fr.*Mermaid diagram/);
	});

	it('fails instead of substituting an unrepresentative short header', () => {
		const content = source();
		expect(() => selectContentFixtures({ ...content, posts: content.posts.map(post => ({ ...post, title: 'Short' })) }))
			.toThrow(/English narrative post.*at least 50/);
	});

	it('does not use hidden projects or services as detail fixtures', () => {
		const content = source();
		expect(() => selectContentFixtures({ ...content, projects: content.projects.filter(project => project.status === 'private') }))
			.toThrow(/public project.*localized detail/);
		expect(() => selectContentFixtures({ ...content, services: content.services.map(service => ({ ...service, visible: false })) }))
			.toThrow(/visible service.*localized detail/);
	});

	it('validates the committed fixture capabilities used by the browser specs', async () => {
		const { blogBodies } = await import('#lib/content/blog-bodies.ts');
		for (const locale of PUBLISHED_LOCALES) {
			const post = fixturePost(locale);
			expect(post.lang).toBe(locale);
			expect(post.external).toBe(false);
			expect(blogBodies[post.slug]?.blocks.some(block => block.type === 'code'
				&& typeof block.data.code === 'string' && parseCodeFence(block.data.code).kind === 'mermaid')).toBe(true);
		}
		expect(fixtureProject.status).toBe('public');
		expect(fixtureService.visible).not.toBe(false);
		expect(longTitlePost.lang).toBe('en');
		expect(longTitlePost.title.length).toBeGreaterThanOrEqual(50);
	});
});
