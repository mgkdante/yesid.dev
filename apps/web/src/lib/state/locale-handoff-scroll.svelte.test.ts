// slice-34.4 — the foundation's default scroll restore is now Lenis-aware.
//
// Lenis is the site-wide scroll engine; a bare window.scrollTo fights it (Lenis
// keeps its own animated position and snaps the page back). lenisAwareScrollTo
// is the single Lenis-safe recipe shared by the default restore AND every
// page-level ScrollContext (home pin-fraction, prose heading): resize() to sync
// Lenis's cached limits to the just-remounted page height, then an immediate
// forced scrollTo. With no Lenis (touch / reduced motion) it falls back to the
// native window.scrollTo.

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface MockLenis {
	resize: ReturnType<typeof vi.fn>;
	scrollTo: ReturnType<typeof vi.fn>;
}

let mockLenis: MockLenis | null = null;

vi.mock('$lib/motion/utils/lenis.js', () => ({
	getLenis: () => mockLenis,
}));

import { lenisAwareScrollTo } from './locale-handoff.svelte';

describe('slice-34.4 lenisAwareScrollTo (foundation default restore)', () => {
	beforeEach(() => {
		mockLenis = null;
		vi.restoreAllMocks();
	});

	it('Lenis live: resize() FIRST, then an immediate forced scrollTo to y', () => {
		const calls: string[] = [];
		mockLenis = {
			resize: vi.fn(() => calls.push('resize')),
			scrollTo: vi.fn(() => calls.push('scrollTo')),
		};

		lenisAwareScrollTo(1234);

		// Ordering is load-bearing: resize must re-measure the remounted page's
		// height before scrollTo targets a position past the stale (shorter/taller)
		// limit, or Lenis clamps the target to the old maximum.
		expect(calls).toEqual(['resize', 'scrollTo']);
		expect(mockLenis.scrollTo).toHaveBeenCalledWith(1234, {
			immediate: true,
			force: true,
		});
	});

	it('no Lenis (touch / reduced motion): falls back to native window.scrollTo', () => {
		mockLenis = null;
		const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		lenisAwareScrollTo(880);

		expect(spy).toHaveBeenCalledWith(0, 880);
	});
});
