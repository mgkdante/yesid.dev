import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
	it('uses a mobile header grid so excerpt and tags get the full card width', () => {
		const source = readFileSync(resolve(process.cwd(), 'src/lib/components/blog/BlogRow.svelte'), 'utf8');

		expect(source).toContain('class="blog-row p-5 md:p-6"');
		expect(source).not.toContain('blog-row flex flex-row');
		expect(source).toContain('class="blog-row-icon relative z-10"');
		expect(source).toContain('class="blog-row-head"');
		expect(source).toContain('class="blog-excerpt mt-2 leading-relaxed text-[var(--secondary-foreground)]"');
		expect(source).toMatch(/\.card-surface\.blog-row\) \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 4rem minmax\(0, 1fr\);/);
		expect(source).toMatch(/\.blog-row-icon \{[\s\S]*grid-column: 1;[\s\S]*grid-row: 1;/);
		expect(source).toMatch(/\.blog-row-body \{[\s\S]*display: contents;/);
		expect(source).toMatch(/\.blog-row-head \{[\s\S]*grid-column: 2;[\s\S]*grid-row: 1;/);
		expect(source).toMatch(/\.blog-excerpt \{[\s\S]*-webkit-line-clamp: 4;/);
		expect(source).toMatch(/\.blog-excerpt \{[\s\S]*grid-column: 1 \/ -1;/);
		expect(source).toMatch(/\.blog-excerpt \{[\s\S]*font-size: var\(--text-card-body\);/);
		expect(source).toMatch(/\.blog-topic-tags \{[\s\S]*grid-column: 1 \/ -1;/);
		expect(source).toMatch(/:global\(\.blog-language-chip\) \{[\s\S]*border-color: var\(--accent-text\);[\s\S]*background: var\(--accent-surface\);[\s\S]*color: var\(--accent-text\);/);
		expect(source).toMatch(/@media \(min-width: 768px\) \{[\s\S]*display: flex;[\s\S]*flex-direction: row;[\s\S]*\.blog-row-body \{[\s\S]*display: block;[\s\S]*\.blog-excerpt \{[\s\S]*grid-column: auto;[\s\S]*-webkit-line-clamp: 2;/);
	});

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

	it('renders the language chip beside the date, not inside the topic tags', () => {
		const en = render(BlogRow, { props: { post: makePost({ lang: 'en' }), index: 0 } });
		const metaRow = en.getByTestId('blog-meta-row');
		expect(metaRow.textContent).toContain('2025-01-15');
		expect(en.getByTestId('blog-lang-chip').textContent?.trim()).toBe('English');
		expect(metaRow.querySelector('[data-testid="blog-lang-chip"]')).toBeTruthy();
		expect(en.container.querySelector('[data-testid="blog-topic-tags"] [data-testid="blog-lang-chip"]')).toBeNull();
		en.unmount();

		const fr = render(BlogRow, {
			props: { post: makePost({ lang: 'en' }), index: 0 },
			context: new Map([[Symbol.for('yesid.locale'), () => 'fr']]),
		});
		expect(fr.getByTestId('blog-lang-chip').textContent?.trim()).toBe('Anglais');
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
