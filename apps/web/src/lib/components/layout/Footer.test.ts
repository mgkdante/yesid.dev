import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
	it('renders a footer element', () => {
		render(Footer);
		expect(screen.getByTestId('footer')).toBeInTheDocument();
	});

	it('renders the yesid wordmark', () => {
		render(Footer);
		expect(screen.getByTestId('footer-wordmark')).toBeInTheDocument();
		expect(screen.getByTestId('footer-wordmark').textContent).toContain('yesid');
	});

	it('renders the current year in copyright', () => {
		render(Footer);
		const year = new Date().getFullYear().toString();
		const small = screen.getByText(new RegExp(`©\\s*${year}`));
		expect(small).toBeInTheDocument();
	});

	it('renders footer navigation with aria-label', () => {
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		expect(nav).toBeInTheDocument();
	});

	it('renders all 6 site navigation links', () => {
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		const links = nav.querySelectorAll('a');
		expect(links.length).toBe(6);
	});

	it('renders links to Services, Projects, Blog, Stack, About, Contact', () => {
		// slice-18m: nav order is CMS-controlled (editors set `sort` per row in
		// Directus). Assert SET membership, not order.
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		const navLinks = nav.querySelectorAll('a');
		const hrefs = Array.from(navLinks).map((a) => a.getAttribute('href'));
		expect(new Set(hrefs)).toEqual(
			new Set(['/services', '/projects', '/tech-stack', '/blog', '/about', '/contact']),
		);
	});

	it('renders GitHub social link with target=_blank', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /github/i });
		expect(link).toHaveAttribute('href', 'https://github.com/mgkdante');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
	});

	it('renders LinkedIn social link with target=_blank', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /linkedin/i });
		expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/otaloray/');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('renders the status bar with system date', () => {
		render(Footer);
		const now = new Date();
		const expectedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
		expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
	});

	it('renders system online status text', () => {
		render(Footer);
		expect(screen.getByText(/system online/)).toBeInTheDocument();
	});

	it('renders location in an address element', () => {
		render(Footer);
		const address = document.querySelector('footer address');
		expect(address).not.toBeNull();
		expect(address?.textContent).toContain('Montreal');
	});

	it('renders the digital infrastructure tagline', () => {
		render(Footer);
		expect(screen.getByText(/digital infrastructure/)).toBeInTheDocument();
	});
});

describe('Footer — locale threading (slice-28.6)', () => {
	it('renders footer nav labels via resolveLocale for fr', () => {
		render(Footer, {
			props: {
				locale: 'fr',
				footerLinks: [{ label: { en: 'Projects', fr: 'Projets' }, href: '/projects', priority: 1 }],
			},
		});
		expect(screen.getByText('Projets')).toBeInTheDocument();
	});

	it('hides the locale switcher while only one locale is published', () => {
		render(Footer);
		expect(screen.queryByTestId('footer-locale-switch')).toBeNull();
	});

	it('renders path-preserving EN|FR links when two locales are available', () => {
		render(Footer, {
			props: { locale: 'fr', pathname: '/fr/about', availableLocales: ['en', 'fr'] },
		});
		const sw = screen.getByTestId('footer-locale-switch');
		const links = sw.querySelectorAll('a');
		expect(links[0].getAttribute('href')).toBe('/about');
		expect(links[1].getAttribute('href')).toBe('/fr/about');
		expect(links[1].getAttribute('aria-current')).toBe('true');
	});

	it('localizes nav link hrefs and the wordmark for fr', () => {
		render(Footer, {
			props: {
				locale: 'fr',
				footerLinks: [{ label: { en: 'Projects', fr: 'Projets' }, href: '/projects', priority: 1 }],
			},
		});
		expect(screen.getByText('Projets').closest('a')).toHaveAttribute('href', '/fr/projects');
		expect(screen.getByTestId('footer-wordmark')).toHaveAttribute('href', '/fr');
	});
});
