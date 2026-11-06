import { siteLabels } from '#lib/content/site-labels.ts';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogRow from './BlogRow.svelte';
import type { BlogPost } from '#lib/types.ts';

// Minimal BlogPost fixture for testing — only required fields populated
const makePost = (overrides?: Partial<BlogPost>): BlogPost => ({
	translationKey: 'test-post',
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
			props: { post: makePost() }
		});
		expect(getByText('Test Post Title')).toBeTruthy();
	});

	it('renders without a station number, pulsing dot or vertical line', () => {
		const { container } = render(BlogRow, {
			props: { post: makePost() }
		});
		expect(container.querySelector('[data-slot="metro-station"]')).toBeNull();
		expect(container.querySelector('[data-slot="metro-station-pulse"]')).toBeNull();
		expect(container.querySelector('[data-metro-line]')).toBeNull();
	});

	it('renders tags', () => {
		const { getByText } = render(BlogRow, {
			props: { post: makePost({ tags: ['sql', 'postgres'] }) }
		});
		expect(getByText('sql')).toBeTruthy();
		expect(getByText('postgres')).toBeTruthy();
	});

	it('renders the post date', () => {
		const { getByText } = render(BlogRow, {
			props: { post: makePost({ date: '2025-01-15' }) }
		});
		expect(getByText('2025-01-15')).toBeTruthy();
	});

	it('renders the language chip beside the date, not inside the topic tags', () => {
		const en = render(BlogRow, { props: { post: makePost({ lang: 'en' }) } });
		const metaRow = en.getByTestId('blog-meta-row');
		expect(metaRow.textContent).toContain('2025-01-15');
		expect(en.getByTestId('blog-lang-chip').textContent?.trim()).toBe(siteLabels.ui.languageNames.en.en);
		expect(metaRow.querySelector('[data-testid="blog-lang-chip"]')).toBeTruthy();
		expect(en.container.querySelector('[data-testid="blog-topic-tags"] [data-testid="blog-lang-chip"]')).toBeNull();
		en.unmount();

		const fr = render(BlogRow, {
			props: { post: makePost({ lang: 'en' }) },
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]),
		});
		expect(fr.getByTestId('blog-lang-chip').textContent?.trim()).toBe(siteLabels.ui.languageNames.en.fr);
	});

	it('localizes internal post urls from the post language, independent of the listing context', () => {
		const frContext = () => new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]);
		const enPost = render(BlogRow, {
			props: { post: makePost() },
			context: frContext(),
		});
		expect(enPost.container.querySelector('a')?.getAttribute('href')).toBe('/blog/test-post');
		enPost.unmount();

		const frPost = render(BlogRow, {
			props: { post: makePost({ lang: 'fr' }) },
		});
		expect(frPost.container.querySelector('a')?.getAttribute('href')).toBe('/fr/blog/test-post');
		frPost.unmount();

		const esPost = render(BlogRow, {
			props: { post: makePost({ lang: 'es' }) },
		});
		expect(esPost.container.querySelector('a')?.getAttribute('href')).toBe('/es/blog/test-post');
		esPost.unmount();

		const external = render(BlogRow, {
			props: {
				post: makePost({ external: true, url: 'https://medium.com/@x/post' }),
			},
			context: frContext(),
		});
		const links = external.container.querySelectorAll('a[target="_blank"]');
		expect(links[0]?.getAttribute('href')).toBe('https://medium.com/@x/post');
	});
});
