import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogRow from './BlogRow.svelte';
import type { BlogPost } from '$lib/types';

// Minimal BlogPost fixture for testing — only required fields populated
const makePost = (overrides?: Partial<BlogPost>): BlogPost => ({
	slug: 'test-post',
	title: 'Test Post Title',
	excerpt: 'A short excerpt for testing purposes.',
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

	it('shows a lang chip only when the post language differs from the page locale (slice-28.6)', () => {
		const en = render(BlogRow, { props: { post: makePost({ lang: 'en' }), index: 0 } });
		expect(en.queryByTestId('blog-lang-chip')).toBeNull(); // en post on en page

		const fr = render(BlogRow, {
			props: { post: makePost({ lang: 'en' }), index: 0 },
			context: new Map([[Symbol.for('yesid.locale'), () => 'fr']]),
		});
		expect(fr.getByTestId('blog-lang-chip').textContent?.trim()).toBe('en');
	});

	it('localizes internal post urls inside a fr provider; external urls untouched (slice-28.6)', () => {
		const frContext = () => new Map([[Symbol.for('yesid.locale'), () => 'fr']]);
		const internal = render(BlogRow, {
			props: { post: makePost(), index: 0 },
			context: frContext(),
		});
		expect(internal.container.querySelector('a')?.getAttribute('href')).toBe(
			'/fr/blog/test-post',
		);
		const external = render(BlogRow, {
			props: {
				post: makePost({ external: true, url: 'https://medium.com/@x/post' }),
				index: 0,
			},
			context: frContext(),
		});
		const links = external.container.querySelectorAll('a[target="_blank"]');
		expect(links[0]?.getAttribute('href')).toBe('https://medium.com/@x/post');
	});
});
