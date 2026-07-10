import { describe, it, expect, beforeEach, vi } from 'vitest';
import staticFavicon from '../../../static/favicon.svg?raw';
import { faviconSvg, themeStore } from './theme.svelte';

function metaThemeColor(): string | null {
	return document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null;
}

describe('theme store', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.dataset.theme = 'dark';
		document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
		const meta = document.createElement('meta');
		meta.setAttribute('name', 'theme-color');
		meta.setAttribute('content', '#141414');
		document.head.appendChild(meta);
		document.head.querySelectorAll('link[rel="icon"]').forEach((l) => l.remove());
		const icon = document.createElement('link');
		icon.setAttribute('rel', 'icon');
		icon.setAttribute('href', '/favicon.svg');
		document.head.appendChild(icon);
		themeStore.set('dark');
		localStorage.clear();
	});

	it('toggle flips documentElement dataset + persists to localStorage', () => {
		themeStore.toggle();
		expect(document.documentElement.dataset.theme).toBe('light');
		expect(localStorage.getItem('theme')).toBe('light');
		themeStore.toggle();
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(localStorage.getItem('theme')).toBe('dark');
	});

	it('set("light") updates the theme-color meta to the light surface', () => {
		themeStore.set('light');
		expect(metaThemeColor()).toBe('#F3F6FB');
		themeStore.set('dark');
		expect(metaThemeColor()).toBe('#141414');
	});

	it('repaints the favicon dot with the per-theme orange on theme change', () => {
		const faviconHref = () =>
			document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '';
		themeStore.set('light');
		expect(decodeURIComponent(faviconHref())).toContain('#A05500');
		themeStore.set('dark');
		expect(decodeURIComponent(faviconHref())).toContain('#E07800');
	});

	it('paints the brand mark as dot + outer ring, recoloring both per theme', () => {
		const mark = () =>
			decodeURIComponent(document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '');

		themeStore.set('dark');
		expect(mark()).toContain('r="14" fill="none" stroke="#E07800" stroke-width="2"');
		expect(mark()).toContain('r="10.5" fill="#E07800"');

		themeStore.set('light');
		expect(mark()).toContain('r="14" fill="none" stroke="#A05500" stroke-width="2"');
		expect(mark()).toContain('r="10.5" fill="#A05500"');
	});

	it('leaves the mark background transparent (no rect, no fill on the svg root)', () => {
		const svg = faviconSvg('#E07800');
		expect(svg).not.toContain('<rect');
		expect(svg).not.toMatch(/<svg[^>]*\sfill=/);
	});

	// First paint and no-JS serve static/favicon.svg; hydration swaps in the
	// data-URI. If the two ever diverge the tab icon jumps on load.
	it('static/favicon.svg is byte-equivalent to the dark mark the store paints', () => {
		const norm = (s: string) => s.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
		expect(norm(staticFavicon)).toBe(norm(faviconSvg('#E07800')));
	});

	it('dispatches a themechange CustomEvent', () => {
		let detail: unknown = null;
		const handler = (e: Event) => {
			detail = (e as CustomEvent).detail;
		};
		document.addEventListener('themechange', handler);
		themeStore.set('light');
		document.removeEventListener('themechange', handler);
		expect(detail).toEqual({ theme: 'light' });
	});

	it('init() re-syncs from the attribute the inline script applied', () => {
		document.documentElement.dataset.theme = 'light';
		const cleanup = themeStore.init();
		expect(themeStore.theme).toBe('light');
		expect(metaThemeColor()).toBe('#F3F6FB');
		cleanup();
	});

	it('init() does not subscribe to system preference changes', () => {
		const originalMatchMedia = window.matchMedia;
		const addEventListener = vi.fn();
		const removeEventListener = vi.fn();
		window.matchMedia = vi.fn().mockReturnValue({
			matches: true,
			addEventListener,
			removeEventListener,
		} as unknown as MediaQueryList);

		try {
			const cleanup = themeStore.init();
			expect(window.matchMedia).not.toHaveBeenCalled();
			expect(addEventListener).not.toHaveBeenCalled();
			cleanup();
			expect(removeEventListener).not.toHaveBeenCalled();
			expect(document.documentElement.dataset.theme).toBe('dark');
		} finally {
			window.matchMedia = originalMatchMedia;
		}
	});
});
