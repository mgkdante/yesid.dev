import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogDetailPage from './BlogDetailPage.svelte';
import type { BlogPost } from '$lib/types';

// Minimal BlogPost fixture — only required fields populated
const makePost = (overrides?: Partial<BlogPost>): BlogPost => ({
	slug: 'test-post',
	title: { en: 'Test Post Title' },
	excerpt: { en: 'A short excerpt for testing purposes.' },
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

const mockHtml = '<h2>Section One</h2><p>Content one</p><h2>Section Two</h2><p>Content two</p>';

describe('BlogDetailPage', () => {
	it('renders with data-testid', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), html: mockHtml }
		});
		expect(getByTestId('blog-detail-page')).toBeTruthy();
	});

	it('renders the blog detail header', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), html: mockHtml }
		});
		expect(getByTestId('blog-detail-header')).toBeTruthy();
	});

	it('renders blog content area', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), html: mockHtml }
		});
		expect(getByTestId('blog-content')).toBeTruthy();
	});

	it('sets --blog-accent to primary for professional posts', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), html: mockHtml }
		});
		const article = getByTestId('blog-detail-page');
		expect(article.style.getPropertyValue('--blog-accent')).toContain('--primary');
	});

	it('sets --blog-accent to accent for personal posts', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost({ category: 'personal' }), html: mockHtml }
		});
		const article = getByTestId('blog-detail-page');
		expect(article.style.getPropertyValue('--blog-accent')).toContain('--accent');
	});
});
