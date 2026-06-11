/**
 * GO-W2.2 theme store (runes). The pre-paint script in app.html owns FIRST
 * paint; this store owns everything after hydration: toggle writes, the
 * theme-color meta, the themechange event (for canvas consumers), and the
 * system-preference listener for users with no stored choice.
 *
 * Dark is the brand default: no-JS and no-signal both resolve dark.
 */
import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

const THEME_SURFACE: Record<Theme, string> = {
	dark: '#141414', // --background (dark)
	light: '#FAFAF8', // --background (light)
};

function readDocumentTheme(): Theme {
	if (!browser) return 'dark';
	return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

let current = $state<Theme>(readDocumentTheme());

function storedChoice(): Theme | null {
	if (!browser) return null;
	try {
		const s = localStorage.getItem('theme');
		return s === 'light' || s === 'dark' ? s : null;
	} catch {
		return null;
	}
}

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
	 * SSR'd dark) and keeps "system" users live on OS preference changes.
	 * Returns a cleanup function.
	 */
	init(): () => void {
		if (!browser) return () => {};
		const docTheme = readDocumentTheme();
		if (docTheme !== current || docTheme === 'light') {
			apply(docTheme, false);
		}
		const mql = window.matchMedia('(prefers-color-scheme: light)');
		const onChange = (e: MediaQueryListEvent) => {
			if (storedChoice()) return; // explicit choice wins
			apply(e.matches ? 'light' : 'dark', false);
		};
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	},
};
