// Extend Vitest's expect with jest-dom matchers (toBeInTheDocument, etc.)
import '@testing-library/jest-dom/vitest';
// Configure @testing-library/svelte: sets eventWrapper to Svelte.flushSync so that
// fireEvent calls flush Svelte's reactive graph before assertions run.
// Must be imported manually because the vite plugin skips auto-setup when globals:true.
import '@testing-library/svelte/vitest';
import { vi } from 'vitest';

// happy-dom does not implement HTMLCanvasElement.getContext. Provide a minimal stub to
// prevent "Cannot set properties of null" errors from canvas-dependent code in tests.
HTMLCanvasElement.prototype.getContext = (() => {
	const noop = () => {};
	return function () {
		return {
			fillStyle: '',
			fillRect: noop,
			clearRect: noop,
			getImageData: () => ({ data: new Uint8Array(0) }),
			putImageData: noop,
			createImageData: () => ([]),
			setTransform: noop,
			drawImage: noop,
			save: noop,
			restore: noop,
			beginPath: noop,
			moveTo: noop,
			lineTo: noop,
			closePath: noop,
			stroke: noop,
			translate: noop,
			scale: noop,
			rotate: noop,
			arc: noop,
			fill: noop,
			measureText: () => ({ width: 0 }),
			transform: noop,
			rect: noop,
			clip: noop,
			canvas: { width: 0, height: 0 }
		};
	};
})() as unknown as typeof HTMLCanvasElement.prototype.getContext;

// NOTE: matchMedia stub REMOVED — happy-dom implements it natively (v9.19.0+).

// SvelteKit $env/dynamic/* virtual modules assume Node's `process.env`. In
// happy-dom (DOM-tier tests) `process` isn't defined, so importing the real
// modules throws TypeError at top-level evaluation of $lib/adapters/directus.
// Stub them as empty objects — the adapter's buildClient() only reads env
// lazily when a Directus-backed port is actually invoked, and those
// invocations are short-circuited by the directus-adapter mock below.
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

// Force the hybrid adapter's services port to resolve through staticAdapter
// during DOM tests (layout, sitemap server, component tests). Without this,
// any test that transitively invokes adapter.services.* attempts to fetch
// from cms.yesid.dev — fails fast because PUBLIC_DIRECTUS_URL is unset in
// the test env. See setup.data.ts for the same mock + detailed rationale.
vi.mock('$lib/adapters/directus', async () => {
	const original = await vi.importActual<typeof import('$lib/adapters/directus')>(
		'$lib/adapters/directus',
	);
	const { staticAdapter } = await vi.importActual<typeof import('$lib/adapters/static')>(
		'$lib/adapters/static',
	);
	return { ...original, directusAdapter: staticAdapter };
});

// happy-dom does not implement IntersectionObserver. Stub it so any Svelte
// component using IO-based scroll triggers (lazy load, scroll-driven motion,
// reveal-on-scroll patterns) can render in tests without crashing.
vi.stubGlobal(
	'IntersectionObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);

// happy-dom does not implement ResizeObserver. Stub it so StackConnections' debounced
// resize handler doesn't crash in tests.
vi.stubGlobal(
	'ResizeObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);

// Mock GSAP and its plugins for the happy-dom test environment.
// GSAP relies on DOM measurement APIs (getBoundingClientRect, computed styles, scroll
// position) that happy-dom does not fully support. Actions and components that use GSAP
// are tested for correct invocation, not for visual animation output — that belongs
// to Playwright E2E tests in slice 10.
vi.mock('gsap', () => {
	const mockTimeline = {
		to: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		fromTo: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		call: vi.fn().mockReturnThis(),
		progress: vi.fn().mockReturnThis(),
		kill: vi.fn(),
		pause: vi.fn().mockReturnThis(),
		duration: vi.fn(() => 0),
		// GSAP timelines expose a .then() Promise-like API. Stub it so any code
		// that calls tl.then(...) in tests (e.g. the page-load wordmark animation)
		// doesn't throw "tl.then is not a function".
		then: vi.fn((cb: () => void) => { cb(); return mockTimeline; })
	};
	return {
		gsap: {
			registerPlugin: vi.fn(),
			from: vi.fn(() => ({ kill: vi.fn() })),
			to: vi.fn(() => ({ kill: vi.fn() })),
			fromTo: vi.fn(() => ({ kill: vi.fn() })),
			set: vi.fn(),
			killTweensOf: vi.fn(),
			matchMedia: vi.fn(),
			timeline: vi.fn(() => mockTimeline),
			context: vi.fn((fn: () => void) => { fn(); return { revert: vi.fn() }; }),
			utils: {
				selector: vi.fn(() => vi.fn(() => []))
			},
			// ticker stubbed so motion/utils/ticker can subscribe/unsubscribe under test.
			// Tests that need to assert tick behavior can spyOn(gsap.ticker, 'add').
			ticker: {
				add: vi.fn(),
				remove: vi.fn(),
				lagSmoothing: vi.fn()
			},
			plugins: {}
		}
	};
});

vi.mock('gsap/ScrollTrigger', () => ({
	ScrollTrigger: {
		create: vi.fn(() => ({ kill: vi.fn() })),
		refresh: vi.fn(),
		getAll: vi.fn(() => []),
		killAll: vi.fn(),
		normalizeScroll: vi.fn(),
		config: vi.fn(),
		update: vi.fn(),
		// 0 = no touch, 1 = touch only, 2 = touch + pointer. Tests override per scenario.
		isTouch: 0
	}
}));

vi.mock('gsap/MotionPathPlugin', () => ({
	MotionPathPlugin: {}
}));

vi.mock('gsap/DrawSVGPlugin', () => ({
	DrawSVGPlugin: {}
}));

vi.mock('gsap/CustomEase', () => ({
	CustomEase: {
		create: vi.fn(() => 'custom')
	}
}));

// MorphSVGPlugin morphs SVG <path> elements. convertToPath converts basic
// SVG shapes (rect, circle, etc.) to path elements. In happy-dom we stub it
// as a no-op since there's no real SVG rendering.
vi.mock('gsap/MorphSVGPlugin', () => ({
	MorphSVGPlugin: {
		convertToPath: vi.fn((el: unknown) => [el]),
	}
}));

// SplitText splits text nodes into chars/words/lines for GSAP animation.
// Return a proper class stub so `new SplitText(...)` works in happy-dom tests.
// The real SplitText measures DOM nodes; in tests we only care that the
// interface (chars, words, lines, revert) exists, not the animation output.
vi.mock('gsap/SplitText', () => ({
	SplitText: class {
		chars: Element[] = [];
		words: Element[] = [];
		lines: Element[] = [];
		revert = vi.fn();
	}
}));

// Mock global fetch for Web3Forms client-side calls in tests.
// Returns a successful response so the success animation fires.
const originalFetch = globalThis.fetch;
vi.stubGlobal('fetch', async (url: string | URL | Request, init?: RequestInit) => {
	const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
	if (urlStr.includes('web3forms.com')) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return originalFetch(url, init);
});
