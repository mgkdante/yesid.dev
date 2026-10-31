import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeCloser from './HomeCloser.svelte';

import { closerContent } from '#lib/content/site-content.ts';
import { siteMeta } from '#lib/content/site-meta.ts';

const props = { closer: closerContent, siteMeta };

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

	it('renders the departure board with 4 rows', () => {
		render(HomeCloser, { props });
		const board = screen.getByTestId('closer-board');
		expect(board).toBeInTheDocument();
		const rows = screen.getAllByTestId('closer-row');
		expect(rows).toHaveLength(4);
	});

	it('renders the Terminus routes in the requested order', () => {
		render(HomeCloser, { props });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows.map((row) => row.getAttribute('href'))).toEqual([
			'/contact',
			'/about',
			'/blog',
			siteMeta.links.github,
		]);
		expect(rows.map((row) => row.textContent)).toEqual([
			expect.stringContaining('CONTACT'),
			expect.stringContaining('YESID'),
			expect.stringContaining('BLOG'),
			expect.stringContaining('GITHUB REPO'),
		]);
	});

	it('renders the Blog row as the listing, not individual latest posts', () => {
		render(HomeCloser, { props });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[2].getAttribute('href')).toBe('/blog');
		expect(rows[2].textContent).toContain(
			closerContent.rows.read.description.en,
		);
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

	it('keeps the authored closer and terminal links available without decorative network requests', () => {
		render(HomeCloser, { props });
		expect(screen.getByRole('img', { name: closerContent.closingLabel.en })).toBeInTheDocument();
		expect(
			screen.getByRole('link', {
				name: new RegExp(closerContent.cta.label.en),
			}),
		).toHaveAttribute('href', closerContent.cta.href);
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});
	it('keeps the stationary floodlight in the scene', () => {
		const view = render(HomeCloser, { props });
		const lamp = view.container.querySelector(
			'[data-slot="closer-floodlight"]',
		);
		expect(lamp).not.toBeNull();
		expect(lamp).toHaveAttribute('aria-hidden', 'true');
		expect(lamp!.querySelector('svg')).not.toBeNull();
	});
});
