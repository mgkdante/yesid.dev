import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogRow from './BlogRow.svelte';
import type { BlogPost } from '$lib/types';

// Minimal BlogPost fixture for testing — only required fields populated
const makePost = (overrides?: Partial<BlogPost>): BlogPost => ({
	slug: 'test-post',
	title: { en: 'Test Post Title' },
	excerpt: { en: 'A short excerpt for testing purposes.' },
	date: '2025-01-15',
	lang: 'en',
	category: 'professional',
	tags: ['sql', 'postgres'],
	animation: 'draw',
	svg: '/images/blog/test.svg',
	url: '/blog/test-post',
	external: false,
	...overrides
});

describe('BlogRow', () => {
	it('renders the post title', () => {
		const { getByText } = render(BlogRow, {
			props: { post: makePost(), index: 0 }
		});
		expect(getByText('Test Post Title')).toBeTruthy();
	});

	it('renders uniform padding for all rows', () => {
		const { container } = render(BlogRow, {
			props: { post: makePost(), index: 0, featured: true, accentColor: '#E07800' }
		});
		const card = container.querySelector('[data-slot="card"]');
		expect(card?.classList.contains('p-5')).toBe(true);
	});

	it('renders same padding regardless of featured prop', () => {
		const { container } = render(BlogRow, {
			props: { post: makePost(), index: 0, featured: false }
		});
		const card = container.querySelector('[data-slot="card"]');
		expect(card?.classList.contains('p-5')).toBe(true);
	});

	it('renders same padding when featured is not set', () => {
		const { container } = render(BlogRow, {
			props: { post: makePost(), index: 0 }
		});
		const card = container.querySelector('[data-slot="card"]');
		expect(card?.classList.contains('p-5')).toBe(true);
	});

	it('renders station badge with zero-padded index', () => {
		const { container } = render(BlogRow, {
			props: { post: makePost(), index: 3 }
		});
		// NumberBadge uses padStart(2, '0') on value
		const badge = container.querySelector('[aria-hidden="true"]');
		expect(badge?.textContent?.trim()).toBe('04');
	});

	it('renders metro line connector below badge', () => {
		const { container } = render(BlogRow, {
			props: { post: makePost(), index: 0 }
		});
		const line = container.querySelector('[data-metro-line]');
		expect(line).toBeTruthy();
	});

	it('renders tags', () => {
		const { getByText } = render(BlogRow, {
			props: { post: makePost({ tags: ['sql', 'postgres'] }), index: 0 }
		});
		expect(getByText('sql')).toBeTruthy();
		expect(getByText('postgres')).toBeTruthy();
	});

	it('renders the post date', () => {
		const { getByText } = render(BlogRow, {
			props: { post: makePost({ date: '2025-01-15' }), index: 0 }
		});
		expect(getByText('2025-01-15')).toBeTruthy();
	});
});
