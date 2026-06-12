import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Nav from './Nav.svelte';

describe('Nav — Pill Structure', () => {
	it('renders a nav element', () => {
		render(Nav);
		expect(screen.getByTestId('nav')).toBeInTheDocument();
	});

	it('renders the pill container', () => {
		render(Nav);
		expect(screen.getByTestId('nav-pill')).toBeInTheDocument();
	});

	it('renders wordmark linking to /', () => {
		render(Nav);
		const wordmark = screen.getByTestId('nav-wordmark');
		expect(wordmark).toBeInTheDocument();
		expect(wordmark.closest('a')).toHaveAttribute('href', '/');
	});

	it('renders the orange dot in the wordmark', () => {
		render(Nav);
		const dot = screen.getByTestId('nav-period');
		expect(dot).toBeInTheDocument();
		expect(dot).toHaveTextContent('.');
	});

	it('renders wordmark-letters container for SplitText', () => {
		render(Nav);
		const letters = screen.getByTestId('nav-wordmark-letters');
		expect(letters).toBeInTheDocument();
		expect(letters.textContent).toBe('yesid');
	});

	it('renders primary nav links', () => {
		render(Nav);
		expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services');
		expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
		expect(screen.getByRole('link', { name: 'Stack' })).toHaveAttribute('href', '/tech-stack');
	});

	it('marks active link with aria-current="page"', () => {
		render(Nav, { props: { pathname: '/services' } });
		expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page');
	});

	it('does not mark inactive links with aria-current', () => {
		render(Nav, { props: { pathname: '/services' } });
		expect(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current');
	});

	it('renders the menu toggle button', () => {
		render(Nav);
		expect(screen.getByTestId('nav-menu-toggle')).toBeInTheDocument();
		expect(screen.getByTestId('nav-menu-toggle')).toHaveAttribute('aria-label', 'Open menu');
	});

	it('renders the theme toggle inside the pill', () => {
		render(Nav);
		expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
	});

});

describe('Nav — locale threading (slice-28.6)', () => {
	it('renders link labels via resolveLocale — fr prop yields fr labels', () => {
		render(Nav, {
			props: {
				pathname: '/',
				locale: 'fr',
				headerLinks: [{ label: { en: 'Projects', fr: 'Projets' }, href: '/projects', priority: 1 }],
				menuItems: [],
			},
		});
		expect(screen.getByText('Projets')).toBeInTheDocument();
		expect(screen.queryByText('Projects')).toBeNull();
	});

	it('marks the active link from a locale-prefixed pathname', () => {
		render(Nav, {
			props: {
				pathname: '/fr/projects',
				locale: 'fr',
				headerLinks: [{ label: { en: 'Projects', fr: 'Projets' }, href: '/projects', priority: 1 }],
				menuItems: [],
			},
		});
		expect(screen.getByText('Projets').closest('a')).toHaveAttribute('aria-current', 'page');
	});

	it('localizes internal link hrefs for fr', () => {
		render(Nav, {
			props: {
				pathname: '/fr',
				locale: 'fr',
				headerLinks: [{ label: { en: 'Projects', fr: 'Projets' }, href: '/projects', priority: 1 }],
				menuItems: [],
			},
		});
		expect(screen.getByText('Projets').closest('a')).toHaveAttribute('href', '/fr/projects');
		expect(screen.getByTestId('nav-wordmark').closest('a')).toHaveAttribute('href', '/fr');
	});
});
