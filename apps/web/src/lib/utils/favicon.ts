import type { Theme } from '@yesid/ui/state';

// The favicon is the brand mark: the dot inside its outer ring. It tracks the
// interactive orange per theme so the browser-tab icon repaints on toggle:
// light = #A05500, dark = #E07800. Built as an inline data-URI SVG (no extra
// asset fetch).
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
	return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' + `<circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="2" opacity="0.85"/>` + `<circle cx="16" cy="16" r="10.5" fill="${color}"/></svg>`;
}

function faviconHref(theme: Theme): string {
	return 'data:image/svg+xml,' + encodeURIComponent(faviconSvg(FAVICON_DOT[theme]));
}

export function setFavicon(theme: Theme): void {
	document
		.querySelectorAll('link[rel="icon"]')
		.forEach((el) => el.setAttribute('href', faviconHref(theme)));
}
