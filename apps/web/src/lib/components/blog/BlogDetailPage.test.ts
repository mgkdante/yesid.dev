import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
	it('uses the shared detail-page TOC system', () => {
		const source = readFileSync(
			join(process.cwd(), 'src/lib/components/blog/BlogDetailPage.svelte'),
			'utf8',
		);

		expect(source).toContain("import TocNav from '$lib/components/shared/TocNav.svelte'");
		expect(source).toContain("import TocPill from '$lib/components/shared/TocPill.svelte'");
		expect(source).toContain("observeActiveToc");
		expect(source).not.toContain("BlogTocPill");
		expect(source).not.toContain("StickyPanel");
		expect(source).not.toContain("tocSectionTitle");
	});

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

	it('renders the shared mobile TOC pill from blog headings', () => {
		render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});

		expect(screen.getByTestId('toc-pill')).toBeTruthy();
		expect(screen.queryByTestId('blog-toc-pill')).toBeNull();
	});
});
