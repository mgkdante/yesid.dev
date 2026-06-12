import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeCloser from './HomeCloser.svelte';
// slice-18i Phase 7C: HomeCloser now requires closer prop.
import { closerContent } from '$lib/content/site-content';
import { gsap } from '$lib/motion/utils/gsap';

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
		render(HomeCloser, { props: { closer: closerContent } });
		expect(screen.getByTestId('closer-section')).toBeInTheDocument();
	});

	it('renders the departure board with 5 rows', () => {
		render(HomeCloser, { props: { closer: closerContent } });
		const board = screen.getByTestId('closer-board');
		expect(board).toBeInTheDocument();
		const rows = screen.getAllByTestId('closer-row');
		expect(rows).toHaveLength(5);
	});

	it('renders CONTACT row linking to /contact', () => {
		render(HomeCloser, { props: { closer: closerContent } });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[0].getAttribute('href')).toBe('/contact');
		expect(rows[0].textContent).toContain('CONTACT');
		expect(rows[0].textContent).toContain('Start a project together');
	});

	it('renders EXPLORE row linking to GitHub', () => {
		render(HomeCloser, { props: { closer: closerContent } });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[1].getAttribute('href')).toContain('github.com');
		expect(rows[1].textContent).toContain('EXPLORE');
	});

	it('renders 2 READ rows with dynamic blog titles', () => {
		render(HomeCloser, { props: { closer: closerContent } });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[2].textContent).toContain('READ');
		expect(rows[3].textContent).toContain('READ');
		// Rows link to /blog/
		expect(rows[2].getAttribute('href')).toContain('/blog/');
		expect(rows[3].getAttribute('href')).toContain('/blog/');
	});

	it('renders ABOUT row linking to /about', () => {
		render(HomeCloser, { props: { closer: closerContent } });
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[4].getAttribute('href')).toBe('/about');
		expect(rows[4].textContent).toContain('ABOUT');
		expect(rows[4].textContent).toContain('Yesid');
	});

	it('renders CTA linking to /contact', () => {
		render(HomeCloser, { props: { closer: closerContent } });
		const cta = screen.getByTestId('closer-cta');
		expect(cta).toBeInTheDocument();
		expect(cta.getAttribute('href')).toBe('/contact');
		expect(cta.textContent).toContain('Initialize connection');
	});

	it('renders graffiti wrapper for dynamic SVG load', () => {
		render(HomeCloser, { props: { closer: closerContent } });
		const graffiti = screen.getByTestId('closer-graffiti');
		expect(graffiti).toBeInTheDocument();
		// SVG is loaded dynamically via fetch in onMount — not present in unit tests
		expect(graffiti.getAttribute('role')).toBe('img');
		expect(graffiti.getAttribute('aria-label')).toContain('THE END');
	});

	it('GO-w2t5: ambient breathing mounts on the closer section (MOTION-GATED factory)', () => {
		vi.mocked(gsap.to).mockClear();
		render(HomeCloser, { props: { closer: closerContent } });
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
