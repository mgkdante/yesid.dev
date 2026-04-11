import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeCloser from './HomeCloser.svelte';

describe('HomeCloser', () => {
	it('renders the section with correct testid', () => {
		render(HomeCloser);
		expect(screen.getByTestId('closer-section')).toBeInTheDocument();
	});

	it('renders the TERMINUS heading with orange dot', () => {
		render(HomeCloser);
		const heading = screen.getByTestId('closer-heading');
		expect(heading).toBeInTheDocument();
		expect(heading.textContent).toContain('TERMINUS');
		expect(heading.textContent).toContain('.');
	});

	it('renders the subheading', () => {
		render(HomeCloser);
		const sub = screen.getByTestId('closer-subheading');
		expect(sub).toBeInTheDocument();
		expect(sub.textContent).toContain('FIN DE LIGNE');
	});

	it('renders the departure board with 5 rows', () => {
		render(HomeCloser);
		const board = screen.getByTestId('closer-board');
		expect(board).toBeInTheDocument();
		const rows = screen.getAllByTestId('closer-row');
		expect(rows).toHaveLength(5);
	});

	it('renders CONTACT row linking to /contact', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[0].getAttribute('href')).toBe('/contact');
		expect(rows[0].textContent).toContain('CONTACT');
		expect(rows[0].textContent).toContain('Start a project together');
	});

	it('renders CONNECT row linking to LinkedIn', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[1].getAttribute('href')).toContain('linkedin.com');
		expect(rows[1].textContent).toContain('CONNECT');
	});

	it('renders 2 READ rows with dynamic blog titles', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[2].textContent).toContain('READ');
		expect(rows[3].textContent).toContain('READ');
		// Rows link to /blog/
		expect(rows[2].getAttribute('href')).toContain('/blog/');
		expect(rows[3].getAttribute('href')).toContain('/blog/');
	});

	it('renders ABOUT row linking to /about', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[4].getAttribute('href')).toBe('/about');
		expect(rows[4].textContent).toContain('ABOUT');
		expect(rows[4].textContent).toContain('Yesid');
	});

	it('renders social links', () => {
		render(HomeCloser);
		const socials = screen.getByTestId('closer-socials');
		expect(socials).toBeInTheDocument();
		expect(socials.textContent).toContain('LinkedIn');
		expect(socials.textContent).toContain('GitHub');
	});

	it('renders graffiti wrapper for dynamic SVG load', () => {
		render(HomeCloser);
		const graffiti = screen.getByTestId('closer-graffiti');
		expect(graffiti).toBeInTheDocument();
		// SVG is loaded dynamically via fetch in onMount — not present in unit tests
		expect(graffiti.getAttribute('role')).toBe('img');
		expect(graffiti.getAttribute('aria-label')).toContain('THE END');
	});
});
