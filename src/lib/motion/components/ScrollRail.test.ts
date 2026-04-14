import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ScrollRail from './ScrollRail.svelte';

describe('ScrollRail', () => {
	it('renders the scroll rail', () => {
		render(ScrollRail);
		expect(screen.getByTestId('scroll-rail')).toBeInTheDocument();
	});

	describe('home page (pathname="/")', () => {
		it('does not render station dots (rail is in +page.svelte)', () => {
			render(ScrollRail, { props: { pathname: '/' } });
			expect(screen.queryByTestId('station-dot')).not.toBeInTheDocument();
		});

		it('does not render the simple progress bar', () => {
			render(ScrollRail, { props: { pathname: '/' } });
			expect(screen.queryByTestId('scroll-rail-progress')).not.toBeInTheDocument();
		});
	});

	describe('non-home page (pathname="/projects")', () => {
		it('renders a progress bar', () => {
			render(ScrollRail, { props: { pathname: '/projects' } });
			expect(screen.getByTestId('scroll-rail-progress')).toBeInTheDocument();
		});

		it('does not render station dots', () => {
			render(ScrollRail, { props: { pathname: '/work' } });
			expect(screen.queryByTestId('station-dot')).not.toBeInTheDocument();
		});
	});
});
