import { describe, it, expect } from 'vitest';
import staticFavicon from '../../../static/favicon.svg?raw';
import { faviconSvg } from './favicon';

describe('favicon', () => {
	// First paint and no-JS serve static/favicon.svg; hydration swaps in the
	// data-URI. If the two ever diverge the tab icon jumps on load.
	it('static/favicon.svg is byte-equivalent to the dark mark the store paints', () => {
		const norm = (s: string) => s.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
		expect(norm(staticFavicon)).toBe(norm(faviconSvg('#E07800')));
	});
});
