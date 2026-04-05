import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Nav from './Nav.svelte';

describe('Nav', () => {
	it('renders a nav element', () => {
		render(Nav);
		expect(screen.getByTestId('nav')).toBeInTheDocument();
	});

	it('renders wordmark linking to /', () => {
		render(Nav);
		const wordmark = screen.getByTestId('nav-wordmark');
		expect(wordmark).toBeInTheDocument();
		expect(wordmark.closest('a')).toHaveAttribute('href', '/');
	});

	it('renders the period in a separate span for orange styling', () => {
		render(Nav);
		const period = screen.getByTestId('nav-period');
		expect(period).toBeInTheDocument();
		expect(period).toHaveTextContent('.');
	});

	it('renders Work link with correct href', () => {
		render(Nav);
		const link = screen.getByRole('link', { name: 'Work' });
		expect(link).toHaveAttribute('href', '/work');
	});

	it('renders About link with correct href', () => {
		render(Nav);
		const link = screen.getByRole('link', { name: 'About' });
		expect(link).toHaveAttribute('href', '/about');
	});

	it('renders Contact link with correct href', () => {
		render(Nav);
		const link = screen.getByRole('link', { name: 'Contact' });
		expect(link).toHaveAttribute('href', '/contact');
	});

	it('marks the active link with aria-current="page"', () => {
		render(Nav, { props: { pathname: '/work' } });
		const link = screen.getByRole('link', { name: 'Work' });
		expect(link).toHaveAttribute('aria-current', 'page');
	});

	it('does not mark inactive links with aria-current', () => {
		render(Nav, { props: { pathname: '/work' } });
		const about = screen.getByRole('link', { name: 'About' });
		const contact = screen.getByRole('link', { name: 'Contact' });
		expect(about).not.toHaveAttribute('aria-current');
		expect(contact).not.toHaveAttribute('aria-current');
	});

	it('renders a hamburger button for mobile', () => {
		render(Nav);
		expect(screen.getByTestId('nav-hamburger')).toBeInTheDocument();
	});

	it('has a wordmark-letters container for animation', () => {
		render(Nav);
		const letters = screen.getByTestId('nav-wordmark-letters');
		expect(letters).toBeInTheDocument();
		expect(letters.textContent).toBe('yesid');
	});
});
