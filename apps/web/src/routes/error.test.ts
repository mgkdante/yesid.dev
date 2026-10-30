import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ErrorPage from './+error.svelte';

describe('404 Error Page', () => {
	it('renders the construction scene', () => {
		render(ErrorPage);
		expect(screen.getByTestId('construction-scene')).toBeInTheDocument();
	});

	it('renders an error-page label', () => {

		render(ErrorPage);
		// Look for the structural element rather than specific copy.
		expect(screen.getByTestId('error-label')).toBeInTheDocument();
	});

	it('renders a heading', () => {

		render(ErrorPage);
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	it('renders route suggestion links with non-empty hrefs', () => {

		render(ErrorPage);
		const suggestionLinks = screen.getAllByTestId('error-suggestion-link');
		expect(suggestionLinks.length).toBeGreaterThanOrEqual(1);
		for (const link of suggestionLinks) {
			const href = link.getAttribute('href');
			expect(href).toBeTruthy();
			expect(href).toMatch(/^\//);
		}
	});

	it('renders the terminal status line', () => {
		render(ErrorPage);
		expect(screen.getByTestId('terminal-line')).toBeInTheDocument();
	});

	it('renders exactly ONE hazard tape (top) — the footer platform edge owns the bottom seam', () => {

		render(ErrorPage);
		const tapes = screen.getAllByTestId('hazard-tape');
		expect(tapes.length).toBe(1);
	});
});
