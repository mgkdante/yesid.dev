import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import Nav from './Nav.svelte';
import type { NavLink } from '$lib/navigation/types';

const links: readonly NavLink[] = [
	{ label: { en: 'Studio', fr: 'Atelier', es: 'Taller' }, href: '/studio', priority: 1 },
	{ label: { en: 'Notes', fr: 'Carnet', es: 'Apuntes' }, href: '/notes', priority: 2 },
	{ label: { en: 'Fallback label' }, href: '/archive', priority: 1 },
];

describe('Nav supplied navigation', () => {
	it.each([
		['en', '', ['Studio', 'Notes', 'Fallback label']],
		['fr', '/fr', ['Atelier', 'Carnet', 'Fallback label']],
		['es', '/es', ['Taller', 'Apuntes', 'Fallback label']],
	] as const)(
		'preserves supplied order, destinations, fallback and active state in %s',
		(locale, prefix, labels) => {
			render(Nav, {
				locale,
				pathname: `${prefix}/notes/example`,
				headerLinks: links,
				menuItems: [],
			});
			const nav = screen.getByTestId('nav');
			const supplied = links.map((link) => nav.querySelector(`a[href="${prefix}${link.href}"]`)!);
			expect(supplied.map((link) => link.textContent?.trim())).toEqual(labels);
			expect(supplied[1]).toHaveAttribute('aria-current', 'page');
			expect(supplied[0]).not.toHaveAttribute('aria-current');
			expect([...nav.querySelectorAll('.nav-links a')]).toEqual(supplied);
			expect(screen.getByTestId('nav-wordmark')).toHaveAttribute('href', prefix || '/');
		},
	);

	it('renders one pill with one control of each kind and a closed-menu relationship', () => {
		render(Nav, { headerLinks: [], menuItems: [] });
		const pill = screen.getByTestId('nav-pill');
		expect(screen.getAllByTestId('nav-pill')).toHaveLength(1);
		expect(within(pill).getAllByTestId('theme-toggle')).toHaveLength(1);
		expect(within(pill).getByTestId('nav-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
		expect(within(pill).getByTestId('nav-menu-toggle').getAttribute('aria-controls')).toBeTruthy();
		expect(within(pill).getByTestId('nav-menu-toggle').getAttribute('aria-label')).toBeTruthy();
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(screen.getByTestId('nav-wordmark-letters')).toHaveTextContent('yesid');
		expect(screen.getByTestId('nav-period')).toHaveTextContent('.');
	});

	it('threads exact translated slugs and query/hash to the language control', () => {
		render(Nav, {
			pathname: '/blog/example',
			url: new URL('https://yesid.dev/blog/example?tag=data#section'),
			locale: 'en',
			headerLinks: [],
			menuItems: [],
			localeAlternates: {
				en: 'https://yesid.dev/blog/example',
				fr: 'https://yesid.dev/fr/blog/exemple',
				es: 'https://yesid.dev/es/blog/ejemplo',
			},
		});
		expect(screen.getByTestId('language-toggle')).toHaveAttribute(
			'href',
			'/fr/blog/exemple?tag=data#section',
		);
	});
});
