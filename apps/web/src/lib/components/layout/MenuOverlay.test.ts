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

	it('hides the locale switcher while only one locale is published', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/', menuItems: [] } });
		expect(screen.queryByTestId('locale-switch')).toBeNull();
	});

	it('renders path-preserving EN|FR links when two locales are available', () => {
		render(MenuOverlay, {
			props: {
				open: true,
				pathname: '/fr/about',
				locale: 'fr',
				menuItems: [],
				availableLocales: ['en', 'fr'],
			},
		});
		const sw = screen.getByTestId('locale-switch');
		const links = sw.querySelectorAll('a');
		expect(links[0].getAttribute('href')).toBe('/about');
		expect(links[1].getAttribute('href')).toBe('/fr/about');
		expect(links[1].getAttribute('aria-current')).toBe('true');
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
