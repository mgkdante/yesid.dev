import { siteLabels } from '#lib/content/site-labels.ts';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import BlogDetailPage from './BlogDetailPage.svelte';
import type { BlogPost, BlockEditorDoc, TocHeading } from '#lib/types.ts';

vi.mock('$app/env', () => ({ browser: true, building: false }));
vi.mock('mermaid', () => ({ default: {
	initialize: vi.fn(),
	render: vi.fn(async () => ({ svg: '<svg><text>Article diagram</text></svg>' })),
} }));

// Minimal BlogPost fixture, only required fields populated.
const makePost = (overrides?: Partial<BlogPost>): BlogPost => ({
	translationKey: 'test-post',
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

const { backNav, entryRail } = siteLabels.blogChrome.detail;

describe('BlogDetailPage', () => {
	afterEach(async () => {
		cleanup();
		await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
	});

	it('renders with data-testid', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		expect(getByTestId('blog-detail-page')).toBeTruthy();
		expect(screen.queryByTestId('blog-video-gallery')).toBeNull();
		expect(screen.queryByTestId('blog-image-gallery')).toBeNull();
	});

	it.each(['en', 'fr', 'es'] as const)('renders an Images card in %s and opens inline images at their shared index without collapsing', async (locale) => {
		const images: BlockEditorDoc['blocks'] = ['First', 'Second'].map((caption) => ({
			id: caption, type: 'image', data: {
				file: { fileId: '', fileURL: '', url: `/images/${caption}.png` },
				caption, withBorder: false, withBackground: false, stretched: false,
			},
		}));
		const body = { ...mockBody, blocks: [...mockBody.blocks.slice(0, 2), ...images, { ...images[0]!, id: 'repeat' }] };
		render(BlogDetailPage, {
			props: { post: makePost({ lang: locale }), body },
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]),
		});
		const gallery = screen.getByTestId('blog-image-gallery');
		expect(within(gallery).getByRole('button', { name: locale === 'es' ? 'Imágenes' : 'Images' })).toHaveAttribute('aria-expanded', 'true');
		expect(within(gallery).getAllByTestId('project-image-gallery-trigger')).toHaveLength(2);
		const header = screen.getByRole('button', { name: /Section One/ });
		const inline = within(screen.getByTestId('blog-section-body')).getByRole('img', { name: 'Second' }).closest('button')!;
		await fireEvent.click(inline);
		expect(within(screen.getByRole('dialog')).getByRole('img', { name: 'Second' })).toBeVisible();
		expect(screen.getByRole('status')).toHaveTextContent('2 / 2');
		expect(header).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(header).toHaveAttribute('aria-expanded', 'true');
		await waitFor(() => expect(inline).toHaveFocus());
	});

	it('enlarges a rendered Mermaid diagram without collapsing its article section', async () => {
		const body: BlockEditorDoc = { ...mockBody, blocks: [
			...mockBody.blocks.slice(0, 2),
			{ id: 'diagram', type: 'code', data: { code: 'mermaid\nflowchart LR\n A --> B' } },
		] };
		render(BlogDetailPage, { props: { post: makePost(), body } });
		const header = screen.getByRole('button', { name: /Section One/ });
		const trigger = await screen.findByRole('button', { name: 'Enlarge diagram' });
		await fireEvent.click(trigger);
		expect(screen.getByTestId('article-media-diagram').querySelector('svg')).toHaveTextContent('Article diagram');
		expect(header).toHaveAttribute('aria-expanded', 'true');
		expect(screen.queryByRole('status')).toBeNull();
		await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(header).toHaveAttribute('aria-expanded', 'true');
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it('deduplicates repeated article video URLs into one localized gallery preview with focused playback', async () => {
		const body: BlockEditorDoc = {
			...mockBody,
			blocks: [
				...mockBody.blocks,
				{ id: 'video-url', type: 'paragraph', data: { text: 'https://youtu.be/M7lc1UVf-VE' } },
				{ id: 'video-anchor', type: 'paragraph', data: { text: '<a href="https://www.youtube.com/watch?v=M7lc1UVf-VE">Démonstration réelle</a>' } },
			],
		};
		render(BlogDetailPage, {
			props: { post: makePost({ lang: 'fr' }), body, headings: mockHeadings },
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]),
		});
		const gallery = screen.getByTestId('blog-video-gallery');
		expect(screen.getByTestId('blog-sections').lastElementChild).toBe(gallery);
		expect(within(gallery).getByRole('button', { name: 'Vidéos' })).toBeInTheDocument();
		const triggers = within(gallery).getAllByTestId('project-video-gallery-trigger');
		expect(triggers).toHaveLength(1);
		const trigger = triggers[0]!;
		expect(within(gallery).queryByText('Démonstration réelle')).toBeNull();
		expect(document.querySelector('iframe')).toBeNull();
		trigger.focus();
		await fireEvent.click(trigger);
		const dialog = screen.getByRole('dialog', { name: 'Démonstration réelle' });
		expect(within(dialog).getByTitle('Démonstration réelle')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1&playsinline=1');
		const close = within(dialog).getByRole('button', { name: 'Fermer la vidéo' });
		await waitFor(() => expect(close).toHaveFocus());
		await fireEvent.keyDown(close, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it('renders the blog detail header', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		expect(getByTestId('blog-detail-header')).toBeTruthy();
	});

	it('links back to the listing in the post language', () => {
		const french = render(BlogDetailPage, {
			props: {
				post: makePost({ lang: 'fr' }),
				body: mockBody,
				headings: mockHeadings,
			},
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]),
		});
		expect(french.getByRole('link', { name: backNav.toDispatches.fr! })).toHaveAttribute(
			'href',
			'/fr/blog',
		);
		french.unmount();

		const spanishPersonal = render(BlogDetailPage, {
			props: {
				post: makePost({ lang: 'es', category: 'personal' }),
				body: mockBody,
				headings: mockHeadings,
			},
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'es']]),
		});
		expect(spanishPersonal.getByRole('link', { name: backNav.toPersonal.es! })).toHaveAttribute(
			'href',
			'/es/blog/personal',
		);
	});

	it('renders the sectionized blog content area', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		expect(getByTestId('blog-sections')).toBeTruthy();
	});

	it('renders h2 body sections as shared collapsible cards', () => {
		render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});

		const sections = screen.getByTestId('blog-sections');
		expect(within(sections).getByRole('button', { name: /Section One/ })).toBeTruthy();
		expect(within(sections).getByRole('button', { name: /Section Two/ })).toBeTruthy();
		expect(within(sections).getAllByTestId('blog-section-body')).toHaveLength(2);
		expect(screen.queryByTestId('blog-content')).toBeNull();
	});

	it('renders post metadata in the shared card rail', () => {
		render(BlogDetailPage, {
			props: {
				post: makePost({ tags: ['sql', 'postgresql'] }),
				body: mockBody,
				headings: mockHeadings,
				readingTime: 4,
				wordCount: 420,
			}
		});

		expect(screen.getByTestId('blog-meta-card')).toBeTruthy();
		expect(screen.getByText('420')).toBeTruthy();
		expect(screen.getAllByText(siteLabels.blogChrome.detail.header.readingTimeLabel.en.replace('{minutes}', '4')).length).toBeGreaterThan(0);
		expect(screen.getByText('sql · postgresql')).toBeTruthy();
	});

	it('renders the entry rail from site labels on the blog slug page', () => {
		render(BlogDetailPage, {
			props: {
				post: makePost(),
				body: mockBody,
				headings: mockHeadings,
			}
		});

		const { workWithMe, routes } = entryRail;
		expect(screen.getAllByText(workWithMe.title.en).length).toBeGreaterThan(0);
		expect(screen.getAllByText(workWithMe.prompt.en).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', { name: workWithMe.primary.label.en })[0]).toHaveAttribute(
			'href',
			workWithMe.primary.href,
		);
		expect(screen.getAllByRole('link', { name: routes.links[1].label.en })[0]).toHaveAttribute(
			'href',
			routes.links[1].href,
		);
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

	it('uses the CMS-backed reading-time template in the metadata rail', () => {
		render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings, readingTime: 4 }
		});

		expect(screen.getAllByText(siteLabels.blogChrome.detail.header.readingTimeLabel.en.replace('{minutes}', '4')).length).toBeGreaterThan(0);
	});

});
