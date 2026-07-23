import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import BlogDetailPage from './BlogDetailPage.svelte';
import type { BlogPost, BlockEditorDoc, TocHeading } from '$lib/types';
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
				{ label: { en: 'Stack' }, href: '/tech-stack' },
				{ label: { en: 'About' }, href: '/about' },
				{ label: { en: 'Contact' }, href: '/contact' },
			],
		},
	},
} satisfies BlogPageContent;

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

	it('uses sectionized collapsible cards instead of the old prose card shell', () => {
		const source = readFileSync(
			join(process.cwd(), 'src/lib/components/blog/BlogDetailPage.svelte'),
			'utf8',
		);

		expect(source).toContain("import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte'");
		expect(source).toContain("import { sectionizeBlogBody } from '$lib/blog/sections'");
		expect(source).not.toContain("import BlogContent from './BlogContent.svelte'");
	});

	it('uses the project/service slug rail architecture for the CMS-backed entry rail', () => {
		const source = readFileSync(
			join(process.cwd(), 'src/lib/components/blog/BlogDetailPage.svelte'),
			'utf8',
		);

		expect(source).toContain("import BlogEntryRail from './BlogEntryRail.svelte'");
		expect(source).toContain("id: 'blog-work-with-me'");
		expect(source).toContain("id: 'blog-pick-route'");
		expect(source).toContain('rail: true');
		expect(source).toContain('<aside class="entry-column">');
		expect(source).toContain('<BlogEntryRail rail={entryRail} />');
		expect(source).toContain('<BlogEntryRail rail={entryRail} mobile />');
		expect(source).toMatch(/\.entry-column\s*\{[\s\S]*display:\s*none;/);
		expect(source).toMatch(/@media \(--desktop-min\) \{[\s\S]*\.entry-column \{[\s\S]*display:\s*block;[\s\S]*grid-column:\s*3;/);
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

	it('links back to the listing in the post language', () => {
		const french = render(BlogDetailPage, {
			props: {
				post: makePost({ lang: 'fr' }),
				body: mockBody,
				headings: mockHeadings,
				blogPage: mockBlogPage,
			},
			context: new Map([[Symbol.for('yesid.locale'), () => 'fr']]),
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
			context: new Map([[Symbol.for('yesid.locale'), () => 'es']]),
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
		expect(screen.getAllByText('4 min read').length).toBeGreaterThan(0);
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

		expect(screen.getAllByText('4 min read').length).toBeGreaterThan(0);
	});

	it('centers the desktop article column in the full page while the left rail stays sticky', () => {
		const source = readFileSync(
			join(process.cwd(), 'src/lib/components/blog/BlogDetailPage.svelte'),
			'utf8',
		);

		expect(source).toMatch(
			/grid-template-columns:\s*minmax\(12rem,\s*1fr\)\s+minmax\(0,\s*46rem\)\s+minmax\(12rem,\s*1fr\);/,
		);
		expect(source).toMatch(/max-width:\s*none;/);
		expect(source).toMatch(/align-items:\s*stretch;/);
		expect(source).toMatch(/\.context-column\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?align-self:\s*stretch;/);
		expect(source).toMatch(/\.sections-column\s*\{[\s\S]*?grid-column:\s*2;/);
		expect(source).toMatch(/\.context-panel\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*5rem;/);
		expect(source).not.toMatch(
			/@media \(--desktop-min\) and \(max-width: 1279px\) \{[\s\S]*?grid-template-columns:\s*minmax\(12rem,\s*16rem\)\s+minmax\(0,\s*1fr\);/,
		);
	});
});
