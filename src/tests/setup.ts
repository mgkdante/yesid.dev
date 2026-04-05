// Extend Vitest's expect with jest-dom matchers (toBeInTheDocument, etc.)
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom does not implement HTMLCanvasElement.getContext. lottie-web's CJS module code
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

// jsdom does not implement window.matchMedia. Provide a no-op stub so any module
// that reads (prefers-reduced-motion) at import time doesn't crash. Individual tests
// that need specific values override this with their own vi.stubGlobal / Object.defineProperty.
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {}
	})
});

// jsdom does not implement IntersectionObserver. Stub it so LottiePlayer's 'scroll'
// trigger does not throw in tests.
vi.stubGlobal(
	'IntersectionObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);

// Mock GSAP and its plugins for the jsdom test environment.
// GSAP relies on DOM measurement APIs (getBoundingClientRect, computed styles, scroll
// position) that jsdom does not fully support. Actions and components that use GSAP
// are tested for correct invocation, not for visual animation output — that belongs
// to Playwright E2E tests in slice 10.
vi.mock('gsap', () => {
	const mockTimeline = {
		to: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		fromTo: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		progress: vi.fn().mockReturnThis(),
		kill: vi.fn(),
		pause: vi.fn().mockReturnThis()
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
			timeline: vi.fn(() => mockTimeline)
		}
	};
});

vi.mock('gsap/ScrollTrigger', () => ({
	ScrollTrigger: {
		create: vi.fn(() => ({ kill: vi.fn() })),
		refresh: vi.fn(),
		getAll: vi.fn(() => []),
		killAll: vi.fn()
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

// SplitText splits text nodes into chars/words/lines for GSAP animation.
// Return stub arrays so consumers can iterate without DOM measurement.
vi.mock('gsap/SplitText', () => ({
	SplitText: vi.fn(() => ({
		chars: [],
		words: [],
		lines: [],
		revert: vi.fn()
	}))
}));

// Mock @threlte/core for component tests.
// Threlte requires WebGL context which jsdom does not provide.
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
// lottie-web uses SVG rendering and canvas APIs unavailable in jsdom.
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
