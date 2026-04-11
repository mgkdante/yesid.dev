// Extend Vitest's expect with jest-dom matchers (toBeInTheDocument, etc.)
import '@testing-library/jest-dom/vitest';
// Configure @testing-library/svelte: sets eventWrapper to Svelte.flushSync so that
// fireEvent calls flush Svelte's reactive graph before assertions run.
// Must be imported manually because the vite plugin skips auto-setup when globals:true.
import '@testing-library/svelte/vitest';
import { vi } from 'vitest';

// happy-dom does not implement HTMLCanvasElement.getContext. lottie-web's CJS module code
// accesses canvas context at import time. Provide a minimal stub to prevent the
// "Cannot set properties of null" error.
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

// happy-dom does not implement IntersectionObserver. Stub it so LottiePlayer's 'scroll'
// trigger does not throw in tests.
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
			context: vi.fn((fn: () => void) => { fn(); return { revert: vi.fn() }; })
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
		config: vi.fn()
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
		convertToPath: vi.fn(() => []),
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

// Mock @threlte/core for component tests.
// Threlte requires WebGL context which happy-dom does not provide.
vi.mock('@threlte/core', () => ({
	Canvas: vi.fn(),
	T: vi.fn(),
	useTask: vi.fn(() => vi.fn()),
	useThrelte: vi.fn(() => ({
		scene: { background: null },
		renderer: {},
		camera: { current: {} },
		size: { width: 800, height: 600 },
		renderStage: {},
		autoRender: { current: true, set: vi.fn() }
	}))
}));

// Mock @threlte/extras for component tests.
// useGltf loads GLB models which requires WebGL.
vi.mock('@threlte/extras', () => ({
	useGltf: vi.fn(() => ({ subscribe: vi.fn(), set: vi.fn() }))
}));

// Mock postprocessing for component tests.
// postprocessing requires WebGL and is used by PostProcessing.svelte.
vi.mock('postprocessing', () => ({
	EffectComposer: vi.fn(() => ({
		addPass: vi.fn(),
		removeAllPasses: vi.fn(),
		setSize: vi.fn(),
		render: vi.fn()
	})),
	EffectPass: vi.fn(),
	RenderPass: vi.fn(),
	BloomEffect: vi.fn(),
	KernelSize: { MEDIUM: 1 }
}));

// Mock lottie-web for component tests.
// lottie-web uses SVG rendering and canvas APIs unavailable in happy-dom.
vi.mock('lottie-web', () => ({
	default: {
		loadAnimation: vi.fn(() => ({
			setSpeed: vi.fn(),
			play: vi.fn(),
			stop: vi.fn(),
			goToAndStop: vi.fn(),
			destroy: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			totalFrames: 60
		}))
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
