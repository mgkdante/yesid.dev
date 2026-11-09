// Explicit fixture capabilities keep editorial ordering out of browser coverage.
import { blogPosts } from '../../src/lib/content/blog';
import { blogBodies } from '../../src/lib/content/blog-bodies';
import { projects } from '../../src/lib/content/projects';
import { services } from '../../src/lib/content/services';
import { DEFAULT_LOCALE } from '../../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../../src/lib/utils/published-locales';
import { parseCodeFence } from '../../src/lib/utils/code-fences';
import type { BlockEditorDoc, BlogPost, Locale, LocalizedString, Project, Service } from '../../src/lib/types';

export interface FixtureContent {
	posts: readonly BlogPost[];
	bodies: Readonly<Record<string, BlockEditorDoc | undefined>>;
	projects: readonly Project[];
	services: readonly Service[];
}

function required<T>(items: readonly T[], key: (item: T) => string, capability: string): T {
	const selected = [...items].sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)[0];
	if (!selected) throw new Error(`Fixture requires ${capability}`);
	return selected;
}

function localized(value: LocalizedString): boolean {
	return PUBLISHED_LOCALES.every(locale => Boolean(value[locale]?.trim()));
}

function narrative(body: BlockEditorDoc | undefined): boolean {
	if (!body) return false;
	return body.blocks.some(block => block.type === 'paragraph' && typeof block.data.text === 'string' && block.data.text.trim().length > 0)
		&& body.blocks.some(block => block.type === 'header' && block.data.level === 2
			&& typeof block.data.text === 'string' && block.data.text.trim().length > 0);
}

function diagram(body: BlockEditorDoc | undefined): boolean {
	return Boolean(body?.blocks.some(block => block.type === 'code'
		&& typeof block.data.code === 'string' && parseCodeFence(block.data.code).kind === 'mermaid'));
}

export function selectContentFixtures(content: FixtureContent) {
	const localPosts = content.posts.filter(post => !post.external && post.category === 'professional'
		&& narrative(content.bodies[post.slug]));
	const posts = PUBLISHED_LOCALES.map(locale => required(
		localPosts.filter(post => post.lang === locale && diagram(content.bodies[post.slug])),
		post => `${post.translationKey}/${post.slug}`,
		`a local ${locale} professional post with prose, H2 headings and a Mermaid diagram`,
	));
	const project = required(content.projects.filter(item => item.status === 'public'
		&& localized(item.title) && localized(item.oneLiner) && item.sections.length > 0
		&& PUBLISHED_LOCALES.every(locale => Boolean(item.description[locale]?.blocks.length))
		&& item.sections.every(section => localized(section.title)
			&& PUBLISHED_LOCALES.every(locale => Boolean(section.content[locale]?.blocks.length)))),
		item => item.slug, 'a public project with localized detail content');
	const service = required(content.services.filter(item => item.visible !== false
		&& localized(item.title) && localized(item.description) && Boolean(item.svg?.trim())
		&& item.sections && item.sections.length > 0
		&& item.sections.every(section => localized(section.title) && localized(section.content))),
		item => item.id, 'a visible service with a diagram and localized detail content');
	const longTitlePost = required(localPosts.filter(post => post.lang === DEFAULT_LOCALE && post.title.trim().length >= 50),
		post => `${post.translationKey}/${post.slug}`, 'an English narrative post with a title of at least 50 characters');
	return {
		post(locale: Locale): BlogPost {
			return required(posts.filter(post => post.lang === locale), post => post.slug, `a diagram post in ${locale}`);
		},
		project, service, longTitlePost,
	};
}

const fixtures = selectContentFixtures({ posts: blogPosts, bodies: blogBodies, projects, services });
export const fixturePost = fixtures.post;
export const fixtureProject = fixtures.project;
export const fixtureService = fixtures.service;
export const longTitlePost = fixtures.longTitlePost;

const postPath = (post: BlogPost) => `${post.lang === DEFAULT_LOCALE ? '' : `/${post.lang}`}/blog/${post.slug}`;
export const fixturePostPath = (locale: Locale) => postPath(fixturePost(locale));
export const longTitlePostPath = postPath(longTitlePost);
