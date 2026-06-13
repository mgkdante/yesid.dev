import { describe, it, expect, beforeEach, vi } from 'vitest';
import { themeStore } from './theme.svelte';

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
		expect(metaThemeColor()).toBe('#F7F2E9');
		themeStore.set('dark');
		expect(metaThemeColor()).toBe('#141414');
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
		expect(metaThemeColor()).toBe('#F7F2E9');
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
