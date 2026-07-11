// blogPostFactory — test data for BlogPost.
//
// Mirrors BlogPostSchema in $lib/schemas/blog. Each BlogPost row owns one
// language, so title/excerpt are flat strings rather than LocalizedString.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { BlogPost } from '$lib/types';

export const blogPostFactory = new Factory<BlogPost>(() => ({
	translationKey: faker.lorem.slug(),
	slug: faker.lorem.slug(),
	title: faker.lorem.sentence(),
	excerpt: faker.lorem.paragraph(),
	date: faker.date.past().toISOString().slice(0, 10),
	dateModified: faker.date.recent().toISOString().slice(0, 10),
	lang: 'en',
	category: 'professional',
	tags: [faker.lorem.word(), faker.lorem.word()],
	animation: 'draw',
	svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
	seoTitle: faker.lorem.words(5),
	seoDescription:
		'A practical technical note with enough detail for search snippets, share previews, and structured article metadata.',
	coverImage: faker.string.uuid(),
	coverImageAlt: faker.lorem.sentence(),
	url: `/blog/${faker.lorem.slug()}`,
	external: false,
}));
