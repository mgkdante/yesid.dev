import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LanguageToggle from './LanguageToggle.svelte';

describe('LanguageToggle — fingerpost signpost', () => {
	it('renders NOTHING when fewer than 2 locales are published (today: ["en"])', () => {
		render(LanguageToggle, { props: { locale: 'en', url: new URL('https://yesid.dev/about'), availableLocales: ['en'] } });
		expect(screen.queryByTestId('language-toggle')).toBeNull();
	});

	it('en → fr: a board per locale (EN, FR), names the current for SR, links to /fr preserving the path', () => {
		render(LanguageToggle, { props: { locale: 'en', url: new URL('https://yesid.dev/about'), availableLocales: ['en', 'fr'] } });
		const el = screen.getByTestId('language-toggle');
		expect(el.getAttribute('href')).toBe('/fr/about');
		expect(el.getAttribute('aria-label')).toContain('English');
		expect(el.textContent).toContain('EN');
		expect(el.textContent).toContain('FR');
	});

	it('fr → en: cycles back to the default locale (no prefix), names Français for SR', () => {
		render(LanguageToggle, { props: { locale: 'fr', url: new URL('https://yesid.dev/fr/about'), availableLocales: ['en', 'fr'] } });
		const el = screen.getByTestId('language-toggle');
		expect(el.getAttribute('href')).toBe('/about');
		expect(el.getAttribute('aria-label')).toContain('Français');
	});

	it('cycles to the NEXT published locale in order (en → fr with three published)', () => {
		render(LanguageToggle, { props: { locale: 'en', url: new URL('https://yesid.dev/about'), availableLocales: ['en', 'fr', 'es'] } });
		expect(screen.getByTestId('language-toggle').getAttribute('href')).toBe('/fr/about');
	});

	it('self-names the current language for SR + shows every locale code, NO flags', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'es', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr', 'es'] },
		});
		const el = screen.getByTestId('language-toggle');
		expect(el.getAttribute('aria-label')).toContain('Español');
		expect(el.textContent).toContain('ES');
		expect(el.textContent).toContain('EN');
		expect(/[\u{1F1E6}-\u{1F1FF}]/u.test(container.innerHTML)).toBe(false);
	});

	it('preserves query string + hash across the switch (Montreal context-keeping)', () => {
		render(LanguageToggle, {
			props: {
				locale: 'en',
				url: new URL('https://yesid.dev/projects?service=web&tag=svelte#card-3'),
				availableLocales: ['en', 'fr'],
			},
		});
		expect(screen.getByTestId('language-toggle').getAttribute('href')).toBe(
			'/fr/projects?service=web&tag=svelte#card-3',
		);
	});

	it('carries data-sveltekit-noscroll so scroll is maintained across the switch', () => {
		render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr'] },
		});
		expect(screen.getByTestId('language-toggle')).toHaveAttribute('data-sveltekit-noscroll');
	});
});

describe('LanguageToggle — 3-board mode keeps the full letter size (operator call)', () => {
	it('every board carries the locked 15 SVG-unit letters with 3 published locales', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr', 'es'] },
		});
		const texts = Array.from(container.querySelectorAll('svg text'));
		expect(texts.length).toBe(3);
		for (const t of texts) expect(t.getAttribute('font-size')).toBe('15');
	});

	it('the 2-board post keeps its exact pre-flip geometry (viewBox 44, 36px render)', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr'] },
		});
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('viewBox')).toBe('0 0 56 44');
		expect(svg?.getAttribute('height')).toBe('36');
	});

	it('the 3-board post grows TALLER (viewBox 62) at the same on-screen scale, never wider', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr', 'es'] },
		});
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('viewBox')).toBe('0 0 56 62');
		// 62 units at the two-board scale (36/44) → 50.7px; width stays 46.
		expect(svg?.getAttribute('height')).toBe('50.7');
		expect(svg?.getAttribute('width')).toBe('46');
	});

	it('boards alternate sides of the pole: EN left, FR right, ES left (k%2)', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr', 'es'] },
		});
		const texts = Array.from(container.querySelectorAll('svg text'));
		const sides = texts.map((t) => (Number(t.getAttribute('x')) < 28 ? 'left' : 'right'));
		expect(texts.map((t) => t.textContent)).toEqual(['EN', 'FR', 'ES']);
		expect(sides).toEqual(['left', 'right', 'left']);
	});
});
