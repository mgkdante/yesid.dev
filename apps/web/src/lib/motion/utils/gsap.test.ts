import { describe, it, expect, vi, beforeEach } from 'vitest';

// gsap and its plugins are mocked globally in src/tests/setup.ts.
// This test file validates our registration wrappers + lazy loaders,
// not GSAP itself. Post-17e-5 (D269): registerGsapPlugins has been
// deleted in favor of per-consumer lazy loading.

describe('initScrollTriggerConfig', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('registers ScrollTrigger and applies config on first call', async () => {
		const { gsap } = await import('gsap');
		const { initScrollTriggerConfig } = await import('./gsap.js');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');

		initScrollTriggerConfig();

		expect(gsap.registerPlugin).toHaveBeenCalledWith(ScrollTrigger);
		expect(ScrollTrigger.config).toHaveBeenCalledWith({ ignoreMobileResize: true });
	});

	it('is idempotent — calling twice only registers once', async () => {
		const { gsap } = await import('gsap');
		const { initScrollTriggerConfig } = await import('./gsap.js');

		initScrollTriggerConfig();
		initScrollTriggerConfig();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});
});

describe('ensureSplitTextRegistered', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('registers SplitText synchronously', async () => {
		const { gsap } = await import('gsap');
		const { ensureSplitTextRegistered } = await import('./gsap.js');
		const { SplitText } = await import('gsap/SplitText');

		ensureSplitTextRegistered();

		expect(gsap.registerPlugin).toHaveBeenCalledWith(SplitText);
	});

	it('is idempotent', async () => {
		const { gsap } = await import('gsap');
		const { ensureSplitTextRegistered } = await import('./gsap.js');

		ensureSplitTextRegistered();
		ensureSplitTextRegistered();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});
});

describe('re-exports', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('re-exports gsap', async () => {
		const { gsap } = await import('./gsap.js');
		expect(gsap).toBeDefined();
	});

	it('re-exports ScrollTrigger', async () => {
		const { ScrollTrigger } = await import('./gsap.js');
		expect(ScrollTrigger).toBeDefined();
	});

	it('re-exports SplitText', async () => {
		const { SplitText } = await import('./gsap.js');
		expect(SplitText).toBeDefined();
	});

	it('re-exports MorphSVGPlugin', async () => {
		const { MorphSVGPlugin } = await import('./gsap.js');
		expect(MorphSVGPlugin).toBeDefined();
	});
});

describe('lazy plugin loaders', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('loadDrawSVG resolves without error', async () => {
		const { loadDrawSVG } = await import('./gsap.js');
		await expect(loadDrawSVG()).resolves.toBeUndefined();
	});

	it('loadMorphSVG resolves without error', async () => {
		const { loadMorphSVG } = await import('./gsap.js');
		await expect(loadMorphSVG()).resolves.toBeUndefined();
	});

	it('loadFlip resolves without error', async () => {
		const { loadFlip } = await import('./gsap.js');
		await expect(loadFlip()).resolves.toBeUndefined();
	});

	it('loadCustomEase resolves without error', async () => {
		const { loadCustomEase } = await import('./gsap.js');
		await expect(loadCustomEase()).resolves.toBeUndefined();
	});

	it('loadMotionPathPlugin resolves without error', async () => {
		const { loadMotionPathPlugin } = await import('./gsap.js');
		await expect(loadMotionPathPlugin()).resolves.toBeUndefined();
	});

	it('loadSplitText resolves without error', async () => {
		const { loadSplitText } = await import('./gsap.js');
		await expect(loadSplitText()).resolves.toBeUndefined();
	});

	it('loadDrawSVG registers DrawSVGPlugin', async () => {
		const { gsap } = await import('gsap');
		const { loadDrawSVG } = await import('./gsap.js');

		await loadDrawSVG();

		expect(gsap.registerPlugin).toHaveBeenCalled();
	});

	it('loadDrawSVG is idempotent', async () => {
		const { gsap } = await import('gsap');
		const { loadDrawSVG } = await import('./gsap.js');

		await loadDrawSVG();
		await loadDrawSVG();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('loadMorphSVG is idempotent', async () => {
		const { gsap } = await import('gsap');
		const { loadMorphSVG } = await import('./gsap.js');

		await loadMorphSVG();
		await loadMorphSVG();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('loadFlip is idempotent', async () => {
		const { gsap } = await import('gsap');
		const { loadFlip } = await import('./gsap.js');

		await loadFlip();
		await loadFlip();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('loadCustomEase is idempotent', async () => {
		const { gsap } = await import('gsap');
		const { loadCustomEase } = await import('./gsap.js');

		await loadCustomEase();
		await loadCustomEase();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('loadMotionPathPlugin is idempotent', async () => {
		const { gsap } = await import('gsap');
		const { loadMotionPathPlugin } = await import('./gsap.js');

		await loadMotionPathPlugin();
		await loadMotionPathPlugin();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('loadSplitText is idempotent', async () => {
		const { gsap } = await import('gsap');
		const { loadSplitText } = await import('./gsap.js');

		await loadSplitText();
		await loadSplitText();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('ensureSplitTextRegistered and loadSplitText share the same registry', async () => {
		const { gsap } = await import('gsap');
		const { ensureSplitTextRegistered, loadSplitText } = await import('./gsap.js');

		ensureSplitTextRegistered();
		await loadSplitText();

		// Second call finds SplitText already registered — single registerPlugin call.
		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});
});
