import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LanguageToggle from './LanguageToggle.svelte';

describe('LanguageToggle — métro direction blind', () => {
	it('renders NOTHING when fewer than 2 locales are published (today: ["en"])', () => {
		render(LanguageToggle, { props: { locale: 'en', pathname: '/about', availableLocales: ['en'] } });
		expect(screen.queryByTestId('language-toggle')).toBeNull();
	});

	it('en → fr: shows the language self-named + the DIRECTION cap, links to /fr preserving the path', () => {
		render(LanguageToggle, { props: { locale: 'en', pathname: '/about', availableLocales: ['en', 'fr'] } });
		const el = screen.getByTestId('language-toggle');
		expect(el.getAttribute('href')).toBe('/fr/about');
		expect(el.textContent).toContain('English');
		expect(el.textContent).toContain('DIRECTION');
	});

	it('fr → en: cycles back to the default locale (no prefix), names Français', () => {
		render(LanguageToggle, { props: { locale: 'fr', pathname: '/about', availableLocales: ['en', 'fr'] } });
		const el = screen.getByTestId('language-toggle');
		expect(el.getAttribute('href')).toBe('/about');
		expect(el.textContent).toContain('Français');
	});

	it('cycles to the NEXT published locale in order (en → fr with three published)', () => {
		// Cycle order is data-driven. es is not a URL prefix yet (PREFIX_LOCALES
		// === ['fr']); when Spanish opens, 'es' joins PREFIX_LOCALES + PUBLISHED_
		// LOCALES together. Here en's next is fr → /fr/about.
		render(LanguageToggle, { props: { locale: 'en', pathname: '/about', availableLocales: ['en', 'fr', 'es'] } });
		expect(screen.getByTestId('language-toggle').getAttribute('href')).toBe('/fr/about');
	});

	it('self-names each language in its own tongue and uses NO flags', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'es', pathname: '/', availableLocales: ['en', 'fr', 'es'] },
		});
		const el = screen.getByTestId('language-toggle');
		expect(el.textContent).toContain('Español');
		expect(el.getAttribute('aria-label')).toContain('Español');
		// no regional-indicator flag glyphs anywhere in the markup
		expect(/[\u{1F1E6}-\u{1F1FF}]/u.test(container.innerHTML)).toBe(false);
	});
});
