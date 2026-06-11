// Extend Vitest's expect with jest-dom matchers (toBeInTheDocument, etc.)
import '@testing-library/jest-dom/vitest';
// Configure @testing-library/svelte: sets eventWrapper to Svelte.flushSync so that
// fireEvent calls flush Svelte's reactive graph before assertions run.
// Must be imported manually because the vite plugin skips auto-setup when globals:true.
import '@testing-library/svelte/vitest';
import { vi } from 'vitest';
import { faker } from '@faker-js/faker';

// Deterministic faker output for CI reproducibility (slice-17f L1 prerequisite).
// Override per-test with `faker.seed(<n>)` if non-determinism is intentional.
// Seed value 42 is arbitrary but stable.
faker.seed(42);

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
// modules throws TypeError at top-level evaluation of any $env-importing
// module (e.g. $lib/directus/assets, the live media-URL seam). Stub them as
// empty objects; tests that need a value mock the module locally.
//
// The dormant directus-adapter mock that used to live here was removed at
// slice-26 close together with $lib/adapters/directus itself (Directus 12
// verified on both environments; the git history holds the module).
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

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

// Mock global fetch for ALL network surfaces components touch in DOM tests.
// happy-dom has no server behind it: anything that fell through to the real
// fetch used to resolve against the default http://localhost:3000 origin and
// spray "connect ECONNREFUSED 127.0.0.1:3000" + teardown AbortError stacks
// across the run (slice-28.4, audit #92). Stubbed surfaces:
//   - web3forms.com   → canned success JSON so the contact form's success
//                       animation fires.
//   - /api/weather    → JSON null ("no fresh data") so ContactPage/AboutWeather
//                       keep their SSR-baked prop (slice-28.1 onMount refresh).
//   - /svg/** assets  → minimal valid SVG (decorative illustrations fetched
//                       at mount by CloserGraffiti/CloserProps/HomeServices
//                       et al; consumers res.text() + DOMParser it).
//   - anything else   → loud rejection naming the URL. Add a branch here or
//                       stub fetch per-test when a new surface appears —
//                       never let DOM tests open real sockets.
vi.stubGlobal('fetch', async (url: string | URL | Request) => {
	const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
	if (urlStr.includes('web3forms.com')) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	// slice-28.1: ContactPage/AboutWeather refresh weather from /api/weather in
	// onMount. Default stub answers JSON null ("no fresh data") so components
	// keep their SSR-baked prop and tests stay deterministic without network.
	// Tests exercising the refresh path override globalThis.fetch locally.
	if (urlStr.includes('/api/weather')) {
		return new Response('null', {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	if (urlStr.includes('/svg/')) {
		return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>', {
			status: 200,
			headers: { 'Content-Type': 'image/svg+xml' },
		});
	}
	throw new Error(
		`[setup.dom] Unstubbed fetch in DOM test: ${urlStr} — happy-dom has no network. ` +
			'Add a branch to the fetch stub in src/tests/setup.dom.ts or vi.stubGlobal("fetch", ...) in the test.',
	);
});
