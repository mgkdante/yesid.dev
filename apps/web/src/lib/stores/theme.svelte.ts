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
	light: '#F7F2E9', // --background (light) — GO2-W5 warm station paper
};

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
