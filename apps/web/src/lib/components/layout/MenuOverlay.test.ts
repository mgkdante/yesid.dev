import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MenuOverlay from './MenuOverlay.svelte';

describe('MenuOverlay', () => {
	it('renders all 6 navigation links when open', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		expect(screen.getByRole('link', { name: /Services/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Projects/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Stack/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Blog/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /About/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Contact/ })).toBeInTheDocument();
	});

	it('marks the active link as current', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/projects' } });
		const projectsLink = screen.getByRole('link', { name: /Projects/ });
		expect(projectsLink).toHaveAttribute('aria-current', 'page');
	});

	it('renders metro subtitles', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		expect(screen.getByText('what I build')).toBeInTheDocument();
		expect(screen.getByText('open channel')).toBeInTheDocument();
	});

	it('has dialog role and aria-modal', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('renders bottom navigation label', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		expect(screen.getByText(/NAVIGATION/)).toBeInTheDocument();
	});

	it('does not render when closed', () => {
		render(MenuOverlay, { props: { open: false, pathname: '/' } });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});

describe('MenuOverlay — go2/w5 sheet tidy', () => {
	// The sheet previously carried a SECOND theme toggle in its footer while
	// the nav pill (still visible above the sheet) already owns one. The nav
	// keeps the only toggle; the sheet footer is line + label + locale rail.
	it('renders NO theme toggle — the nav pill owns the only one', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		expect(screen.queryByTestId('theme-toggle')).toBeNull();
	});

	// Nav link order comes from CMS data (site_pages sort, already fixed
	// live). The component must render menuItems exactly as given — any
	// client-side re-sort would override the CMS order.
	it('renders menu items in prop order — no re-sorting', () => {
		const items = [
			{ label: { en: 'Services' }, href: '/services', priority: 1 as const },
			{ label: { en: 'Projects' }, href: '/projects', priority: 1 as const },
			{ label: { en: 'Stack' }, href: '/tech-stack', priority: 2 as const },
			{ label: { en: 'Blog' }, href: '/blog', priority: 1 as const },
			{ label: { en: 'About' }, href: '/about', priority: 1 as const },
			{ label: { en: 'Contact' }, href: '/contact', priority: 1 as const },
		];
		render(MenuOverlay, { props: { open: true, pathname: '/', menuItems: items } });
		const hrefs = Array.from(document.querySelectorAll('[data-menu-item]')).map((a) =>
			a.getAttribute('href'),
		);
		expect(hrefs).toEqual([
			'/services',
			'/projects',
			'/tech-stack',
			'/blog',
			'/about',
			'/contact',
		]);
	});

	it('renders menu items in reversed prop order too (order is data-driven)', () => {
		const items = [
			{ label: { en: 'Contact' }, href: '/contact', priority: 1 as const },
			{ label: { en: 'Services' }, href: '/services', priority: 1 as const },
		];
		render(MenuOverlay, { props: { open: true, pathname: '/', menuItems: items } });
		const hrefs = Array.from(document.querySelectorAll('[data-menu-item]')).map((a) =>
			a.getAttribute('href'),
		);
		expect(hrefs).toEqual(['/contact', '/services']);
	});
});

describe('MenuOverlay — locale threading (slice-28.6)', () => {
	it('renders item label + subtitle via resolveLocale for fr', () => {
		render(MenuOverlay, {
			props: {
				open: true,
				pathname: '/fr',
				locale: 'fr',
				menuItems: [
					{
						label: { en: 'Services', fr: 'Services' },
						subtitle: { en: 'what I build', fr: 'ce que je construis' },
						href: '/services',
						priority: 1,
					},
				],
			},
		});
		expect(screen.getByText('ce que je construis')).toBeInTheDocument();
	});

	it('does not render a locale switcher — the persistent Nav LanguageToggle owns it (no double EN/FR)', () => {
		render(MenuOverlay, {
			props: { open: true, pathname: '/fr/about', locale: 'fr', menuItems: [], availableLocales: ['en', 'fr'] },
		});
		expect(screen.queryByTestId('locale-switch')).toBeNull();
	});

	it('localizes item hrefs and resolves active state from a prefixed pathname', () => {
		render(MenuOverlay, {
			props: {
				open: true,
				pathname: '/fr/services',
				locale: 'fr',
				menuItems: [
					{ label: { en: 'Services', fr: 'Services' }, href: '/services', priority: 1 },
				],
			},
		});
		const link = screen.getByRole('link', { name: /Services/ });
		expect(link).toHaveAttribute('href', '/fr/services');
		expect(link).toHaveAttribute('aria-current', 'page');
	});
});
