import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MenuOverlay from './MenuOverlay.svelte';
import type { NavLink } from '#lib/navigation/types.js';

const links: readonly NavLink[] = [
	{
		label: { en: 'Explore', fr: 'Explorer', es: 'Explorar' },
		subtitle: { en: 'A short hint', fr: 'Une indication', es: 'Una pista' },
		href: '/explore',
		priority: 1,
	},
	{ label: { en: 'Fallback' }, href: '/fallback', priority: 2 },
];
const menus = [
	[],
	links.slice(0, 1),
	[...links].reverse(),
	[
		...links,
		...Array.from({ length: 8 }, (_, i) => ({
			label: { en: `Section ${i}` },
			href: `/section-${i}`,
			priority: 1 as const,
		})),
	],
];

describe('MenuOverlay data contract', () => {
	it.each(menus.map((items) => [items]))(
		'renders exactly the supplied menu in order',
		(menuItems) => {
			render(MenuOverlay, { open: true, pathname: '/', menuItems });
			expect(
				[...document.querySelectorAll('[data-menu-item]')].map((a) => a.getAttribute('href')),
			).toEqual(menuItems.map((item) => item.href));
			expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
		},
	);

	it.each([
		['en', '', 'Explore', 'A short hint'],
		['fr', '/fr', 'Explorer', 'Une indication'],
		['es', '/es', 'Explorar', 'Una pista'],
	] as const)(
		'resolves labels, optional subtitles and active destinations for %s',
		(locale, prefix, label, subtitle) => {
			render(MenuOverlay, { open: true, pathname: `${prefix}/explore`, locale, menuItems: links });
			expect(screen.getByRole('link', { name: `${label} ${subtitle}` })).toHaveAttribute(
				'href',
				`${prefix}/explore`,
			);
			expect(screen.getByRole('link', { name: `${label} ${subtitle}` })).toHaveAttribute(
				'aria-current',
				'page',
			);
			expect(screen.getByRole('link', { name: 'Fallback' })).toHaveAttribute(
				'href',
				`${prefix}/fallback`,
			);
		},
	);

	it('has no modal or standalone duplicate controls when closed', () => {
		render(MenuOverlay, { open: false, pathname: '/', menuItems: links });
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(screen.queryByTestId('theme-toggle')).toBeNull();
		expect(screen.queryByTestId('language-toggle')).toBeNull();
	});
});
