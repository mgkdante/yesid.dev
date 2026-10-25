import { describe, it, expect, vi } from 'vitest';
import { onNavigate } from '$app/navigation';

vi.mock('$app/navigation', () => ({ onNavigate: vi.fn(), goto: vi.fn() }));
import { render, screen } from '@testing-library/svelte';
import LanguageToggle from './LanguageToggle.svelte';

describe('LanguageToggle — fingerpost signpost', () => {
	it('resets focus after a scroll-preserving locale link navigation', () => {
		render(LanguageToggle, { props: { locale: 'en', url: new URL('https://yesid.dev/about'), availableLocales: ['en', 'fr'] } });
		const link = screen.getByTestId('language-toggle');
		link.focus();
		const callback = vi.mocked(onNavigate).mock.calls.at(-1)![0];
		const navigation = { type: 'link', to: { url: new URL('https://yesid.dev/fr/about') } } as Parameters<typeof callback>[0];
		const after = callback(navigation);
		expect(document.activeElement).toBe(link);
		expect(typeof after).toBe('function');
		if (typeof after !== 'function') throw new Error('Missing focus reset callback');
		after();
		expect(document.activeElement).toBe(document.body);
		expect(link).toHaveAttribute('data-sveltekit-reset', 'false');
	});

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

	it('uses the exact translated article slug and preserves query + hash', () => {
		render(LanguageToggle, {
			props: {
				locale: 'en',
				url: new URL('https://yesid.dev/blog/english-slug?ref=home#section-2'),
				availableLocales: ['en', 'fr', 'es'],
				localeAlternates: {
					en: 'https://yesid.dev/blog/english-slug',
					fr: 'https://yesid.dev/fr/blog/slug-francais',
					es: 'https://yesid.dev/es/blog/slug-espanol',
				},
			},
		});

		expect(screen.getByTestId('language-toggle').getAttribute('href')).toBe(
			'/fr/blog/slug-francais?ref=home#section-2',
		);
	});

	it('keeps canonical yesid.dev alternates relative on local and preview hosts', () => {
		render(LanguageToggle, {
			props: {
				locale: 'en',
				url: new URL('http://localhost:4173/blog/english-slug'),
				availableLocales: ['en', 'fr', 'es'],
				localeAlternates: {
					en: 'https://yesid.dev/blog/english-slug',
					fr: 'https://yesid.dev/fr/blog/slug-francais',
					es: 'https://yesid.dev/es/blog/slug-espanol',
				},
			},
		});

		expect(screen.getByTestId('language-toggle')).toHaveAttribute(
			'href',
			'/fr/blog/slug-francais',
		);
	});

	it('falls back to the target-locale blog index when that translation is missing', () => {
		render(LanguageToggle, {
			props: {
				locale: 'fr',
				url: new URL('https://yesid.dev/fr/blog/slug-francais?ref=home#section-2'),
				availableLocales: ['en', 'fr', 'es'],
				localeAlternates: {
					en: 'https://yesid.dev/blog/english-slug',
					fr: 'https://yesid.dev/fr/blog/slug-francais',
				},
			},
		});

		const toggle = screen.getByTestId('language-toggle');
		expect(toggle.getAttribute('href')).toBe(
			'/es/blog?ref=home#section-2',
		);
		expect(toggle).not.toHaveAttribute('data-sveltekit-reset');
	});

	it('carries data-sveltekit-reset so scroll is maintained across the switch', () => {
		render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr'] },
		});
		expect(screen.getByTestId('language-toggle')).toHaveAttribute('data-sveltekit-reset', 'false');
	});
});

describe('LanguageToggle — published boards', () => {
	it('renders one board per published locale', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr', 'es'] },
		});
		const texts = Array.from(container.querySelectorAll('svg text'));
		expect(texts.length).toBe(3);
	});

	it('renders board labels in published locale order', () => {
		const { container } = render(LanguageToggle, {
			props: { locale: 'en', url: new URL('https://yesid.dev/'), availableLocales: ['en', 'fr', 'es'] },
		});
		const texts = Array.from(container.querySelectorAll('svg text'));
		expect(texts.map((t) => t.textContent)).toEqual(['EN', 'FR', 'ES']);
	});
});
