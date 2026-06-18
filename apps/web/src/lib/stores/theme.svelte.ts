/**
 * GO-W2.2 theme store (runes). The pre-paint script in app.html owns FIRST
 * paint; this store owns everything after hydration: toggle writes, the
 * theme-color meta, and the themechange event (for canvas consumers).
 *
 * Dark is the brand default: no-JS and no stored choice both resolve dark.
 */
import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

const THEME_SURFACE: Record<Theme, string> = {
	dark: '#141414', // --background (dark) — taste round 2: restored near-black board
	light: '#F3F6FB', // --background (light) — GO2-W5 warm station paper
};

// The favicon is the brand dot. It tracks the interactive orange per theme so
// the browser-tab icon repaints on toggle: light = #A05500, dark = #E07800.
// Built as an inline data-URI SVG (no extra asset fetch) and applied in apply().
const FAVICON_DOT: Record<Theme, string> = {
	dark: '#E07800',
	light: '#A05500',
};

function faviconHref(theme: Theme): string {
	const svg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
		`<circle cx="16" cy="16" r="12" fill="${FAVICON_DOT[theme]}"/></svg>`;
	return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function readDocumentTheme(): Theme {
	if (!browser) return 'dark';
	return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

let current = $state<Theme>(readDocumentTheme());

function apply(theme: Theme, persist: boolean): void {
	current = theme;
	if (!browser) return;
	document.documentElement.dataset.theme = theme;
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_SURFACE[theme]);
	document
		.querySelectorAll('link[rel="icon"]')
		.forEach((el) => el.setAttribute('href', faviconHref(theme)));
	if (persist) {
		try {
			localStorage.setItem('theme', theme);
		} catch {
			/* private mode — session-only theming is fine */
		}
	}
	document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export const themeStore = {
	get theme(): Theme {
		return current;
	},
	get isDark(): boolean {
		return current === 'dark';
	},
	set(theme: Theme): void {
		apply(theme, true);
	},
	toggle(): void {
		apply(current === 'dark' ? 'light' : 'dark', true);
	},
	/**
	 * Call once from the root layout onMount. Re-syncs with whatever the
	 * inline script applied pre-hydration (incl. meta theme-color, which is
	 * SSR'd dark). Returns a cleanup function.
	 */
	init(): () => void {
		if (!browser) return () => {};
		const docTheme = readDocumentTheme();
		if (docTheme !== current || docTheme === 'light') {
			apply(docTheme, false);
		}
		return () => {};
	},
};
