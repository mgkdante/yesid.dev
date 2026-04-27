import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogDetailPage from './BlogDetailPage.svelte';
import type { BlogPost, BlockEditorDoc, TocHeading } from '$lib/types';

// Minimal BlogPost fixture — only required fields populated
const makePost = (overrides?: Partial<BlogPost>): BlogPost => ({
	slug: 'test-post',
	title: 'Test Post Title',
	excerpt: 'A short excerpt for testing purposes.',
	date: '2026-01-15',
	lang: 'en',
	category: 'professional',
	tags: ['sql', 'postgresql'],
	animation: 'draw',
	svg: '/images/blog/test.svg',
	url: '/blog/test-post',
	external: false,
	...overrides
});

const mockBody: BlockEditorDoc = {
	time: 1700000000000,
	version: '2.31.2',
	blocks: [
		{ id: 'h1', type: 'header', data: { text: 'Section One', level: 2 } },
		{ id: 'p1', type: 'paragraph', data: { text: 'Content one' } },
		{ id: 'h2', type: 'header', data: { text: 'Section Two', level: 2 } },
		{ id: 'p2', type: 'paragraph', data: { text: 'Content two' } },
	],
};

const mockHeadings: TocHeading[] = [
	{ id: 'section-one', text: 'Section One', level: 2 },
	{ id: 'section-two', text: 'Section Two', level: 2 },
];

describe('BlogDetailPage', () => {
	it('renders with data-testid', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		expect(getByTestId('blog-detail-page')).toBeTruthy();
	});

	it('renders the blog detail header', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		expect(getByTestId('blog-detail-header')).toBeTruthy();
	});

	it('renders blog content area', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		expect(getByTestId('blog-content')).toBeTruthy();
	});

	it('sets --blog-accent to primary for professional posts', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		const article = getByTestId('blog-detail-page');
		expect(article.style.getPropertyValue('--blog-accent')).toContain('--primary');
	});

	it('sets --blog-accent to accent for personal posts', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost({ category: 'personal' }), body: mockBody, headings: mockHeadings }
		});
		const article = getByTestId('blog-detail-page');
		expect(article.style.getPropertyValue('--blog-accent')).toContain('--accent');
	});
});
