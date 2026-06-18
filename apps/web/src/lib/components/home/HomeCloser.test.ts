import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeCloser from './HomeCloser.svelte';
// slice-18i Phase 7C: HomeCloser now requires closer prop.
import { closerContent } from '$lib/content/site-content';
import { siteMeta } from '$lib/content/site-meta';
import { gsap } from '$lib/motion/utils/gsap';
import type { BlogPost } from '$lib/types';

const latestPosts: BlogPost[] = [
	{
		slug: 'first-post',
		title: 'First dispatch',
		excerpt: 'A dispatch excerpt.',
		date: '2026-01-02',
		lang: 'en',
		category: 'professional',
		tags: ['sql'],
		animation: 'draw',
		svg: 'pro-code',
		url: '/blog/first-post',
		external: false,
	},
	{
		slug: 'second-post',
		title: 'Second dispatch',
		excerpt: 'Another dispatch excerpt.',
		date: '2026-01-01',
		lang: 'en',
		category: 'professional',
		tags: ['cms'],
		animation: 'draw-fill',
		svg: 'pro-pipeline',
		url: '/blog/second-post',
		external: false,
	},
];

const props = { closer: closerContent, latestPosts, siteMeta };

// Mock fetch to prevent happy-dom from making real HTTP requests during onMount
const originalFetch = globalThis.fetch;
beforeEach(() => {
	globalThis.fetch = vi.fn().mockRejectedValue(new Error('no server'));
});
afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe('HomeCloser', () => {
	it('renders the section with correct testid', () => {
		render(HomeCloser, { props });
		expect(screen.getByTestId('closer-section')).toBeInTheDocument();
	});

	it('renders the departure board with 5 rows', () => {
		render(HomeCloser, { props });
		const board = screen.getByTestId('closer-board');
		expect(board).toBeInTheDocument();
		const rows = screen.getAllByTestId('closer-row');
		expect(rows).toHaveLength(5);
	});

	it('renders fixed Terminus routes in the requested order', () => {
		render(HomeCloser, { props });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows.map((row) => row.getAttribute('href'))).toEqual([
			'/tech-stack',
			'/contact',
			'/about',
			'/blog',
			siteMeta.links.github,
		]);
		expect(rows.map((row) => row.textContent)).toEqual([
			expect.stringContaining('STACK'),
			expect.stringContaining('CONTACT'),
			expect.stringContaining('YESID'),
			expect.stringContaining('BLOG'),
			expect.stringContaining('GITHUB REPO'),
		]);
	});

	it('renders the Blog row as the listing, not individual latest posts', () => {
		render(HomeCloser, { props });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[3].getAttribute('href')).toBe('/blog');
		expect(rows[3].textContent).toContain('Writing and field notes');
		expect(screen.queryByText('First dispatch')).not.toBeInTheDocument();
		expect(screen.queryByText('Second dispatch')).not.toBeInTheDocument();
	});

	it('renders CTA linking to /contact', () => {
		render(HomeCloser, { props });
		const cta = screen.getByTestId('closer-cta');
		expect(cta).toBeInTheDocument();
		expect(cta.getAttribute('href')).toBe('/contact');
		expect(cta.textContent).toContain('Initialize connection');
	});

	it('renders graffiti wrapper for dynamic SVG load', () => {
		render(HomeCloser, { props });
		const graffiti = screen.getByTestId('closer-graffiti');
		expect(graffiti).toBeInTheDocument();
		// SVG is loaded dynamically via fetch in onMount — not present in unit tests
		expect(graffiti.getAttribute('role')).toBe('img');
		expect(graffiti.getAttribute('aria-label')).toContain('THE END');
	});

	it('GO-w2t5: ambient breathing mounts on the closer section (MOTION-GATED factory)', () => {
		vi.mocked(gsap.to).mockClear();
		render(HomeCloser, { props });
		const breathingCall = vi
			.mocked(gsap.to)
			.mock.calls.find(
				([, vars]) =>
					!!vars && Object.prototype.hasOwnProperty.call(vars, '--breathing-phase'),
			);
		expect(breathingCall).toBeTruthy();
		expect((breathingCall![0] as HTMLElement).dataset.testid).toBe('closer-section');
		expect((breathingCall![1] as Record<string, unknown>).repeat).toBe(-1);
		expect((breathingCall![1] as Record<string, unknown>).yoyo).toBe(true);
	});
});
