import { siteLabels } from '#lib/content/site-labels.ts';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import BlogDetailPage from './BlogDetailPage.svelte';
import type { BlogPost, BlockEditorDoc, TocHeading } from '#lib/types.ts';
import type { BlogPageContent } from '@repo/shared';

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

const mockBlogPage = {
	intro: { en: 'Notes from the field.' },
	heading: { en: 'Blog' },
	backToDispatches: { en: 'back to Blog' },
	backToPersonal: { en: 'back to personal' },
	personalHeading: { en: 'Personal Corner' },
	personalIntro: { en: 'Off-work notes.' },
	toPersonalLabel: { en: 'Personal Corner' },
	toPersonalSubtitle: { en: 'Off the clock' },
	toProfessionalLabel: { en: 'Back to Blog' },
	toProfessionalSubtitle: { en: 'Brand notes' },
	entryRail: {
		workWithMe: {
			title: { en: 'Work With Me' },
			prompt: { en: 'Need a system that stays editable?' },
			primary: { label: { en: 'View Services' }, href: '/services' },
			secondary: { label: { en: 'Start a Project' }, href: '/contact' },
		},
		routes: {
			title: { en: 'Pick A Route' },
			links: [
				{ label: { en: 'Case studies' }, href: '/projects' },
				{ label: { en: 'Services' }, href: '/services' },
				{ label: { en: 'Stack' }, href: '/services' },
				{ label: { en: 'About' }, href: '/about' },
				{ label: { en: 'Contact' }, href: '/contact' },
			],
		},
	},
} satisfies BlogPageContent;

describe('BlogDetailPage', () => {
	it('renders with data-testid', () => {
		const { getByTestId } = render(BlogDetailPage, {
			props: { post: makePost(), body: mockBody, headings: mockHeadings }
		});
		expect(getByTestId('blog-detail-page')).toBeTruthy();
		expect(screen.queryByTestId('blog-video-gallery')).toBeNull();
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
				blogPage: mockBlogPage,
			},
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]),
		});
		expect(french.getByRole('link', { name: 'back to Blog' })).toHaveAttribute(
			'href',
			'/fr/blog',
		);
		french.unmount();

		const spanishPersonal = render(BlogDetailPage, {
			props: {
				post: makePost({ lang: 'es', category: 'personal' }),
				body: mockBody,
				headings: mockHeadings,
				blogPage: mockBlogPage,
			},
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'es']]),
		});
		expect(spanishPersonal.getByRole('link', { name: 'back to personal' })).toHaveAttribute(
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

	it('renders the CMS-backed entry rail on the blog slug page', () => {
		render(BlogDetailPage, {
			props: {
				post: makePost(),
				body: mockBody,
				headings: mockHeadings,
				blogPage: mockBlogPage,
			}
		});

		expect(screen.getAllByText('Work With Me').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Need a system that stays editable?').length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', { name: 'View Services' })[0]).toHaveAttribute('href', '/services');
		expect(screen.getAllByRole('link', { name: 'Case studies' })[0]).toHaveAttribute('href', '/projects');
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
