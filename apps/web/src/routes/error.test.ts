import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ErrorPage from './+error.svelte';

describe('404 Error Page', () => {
	it('renders the construction scene', () => {
		render(ErrorPage);
		expect(screen.getByTestId('construction-scene')).toBeInTheDocument();
	});

	it('renders the ROUTE NOT FOUND label', () => {
		render(ErrorPage);
		expect(screen.getByText('ROUTE NOT FOUND')).toBeInTheDocument();
	});

	it('renders the heading', () => {
		render(ErrorPage);
		expect(screen.getByText('This station is under construction')).toBeInTheDocument();
	});

	it('renders route suggestion links', () => {
		render(ErrorPage);
		expect(screen.getByRole('link', { name: /Services/ })).toHaveAttribute('href', '/services');
		expect(screen.getByRole('link', { name: /Projects/ })).toHaveAttribute('href', '/projects');
		expect(screen.getByRole('link', { name: /Contact/ })).toHaveAttribute('href', '/contact');
	});

	it('renders the terminal status line', () => {
		render(ErrorPage);
		expect(screen.getByTestId('terminal-line')).toBeInTheDocument();
	});

	it('renders hazard tape accents', () => {
		render(ErrorPage);
		const tapes = screen.getAllByTestId('hazard-tape');
		expect(tapes.length).toBe(2);
	});
});
