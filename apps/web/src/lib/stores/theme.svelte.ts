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

// The favicon is the brand mark: the dot inside its outer ring. It tracks the
// interactive orange per theme so the browser-tab icon repaints on toggle:
// light = #A05500, dark = #E07800. Built as an inline data-URI SVG (no extra
// asset fetch) and applied in apply().
const FAVICON_DOT: Record<Theme, string> = {
	dark: '#E07800',
	light: '#A05500',
};

/**
 * The brand mark, optically cut for tab size. This is NOT a scale of the 1080px
 * mark in scripts/generate-gbp-assets.ts: that ring is a 3px hairline at 0.3
 * opacity, which lands under a tenth of a device pixel on a 16px tab and
 * vanishes. Here the stroke is 2 units (exactly 1 device px at 16px) and the dot
 * drops to r=10.5 so the gap between dot and ring survives. Ring opacity 0.85 is
 * the softest that still reads on a white tab strip at 16px.
 *
 * static/favicon.svg carries this same markup for first paint and no-JS. The
 * unit test asserts the two never drift apart.
 */
export function faviconSvg(color: string): string {
	return (
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
		`<circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="2" opacity="0.85"/>` +
		`<circle cx="16" cy="16" r="10.5" fill="${color}"/></svg>`
	);
}

function faviconHref(theme: Theme): string {
	return 'data:image/svg+xml,' + encodeURIComponent(faviconSvg(FAVICON_DOT[theme]));
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
