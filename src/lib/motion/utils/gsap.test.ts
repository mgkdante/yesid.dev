import { describe, it, expect, vi, beforeEach } from 'vitest';

// gsap and its plugins are mocked globally in src/tests/setup.ts.
// This test file validates our registration wrapper, not GSAP itself.

describe('registerGsapPlugins', () => {
	beforeEach(() => {
		vi.clearAllMocks(); // Reset spy call counts so each test starts fresh.
		vi.resetModules(); // Fresh module import resets the `registered` flag to false.
	});

	it('calls gsap.registerPlugin on first call', async () => {
		const { gsap } = await import('gsap');
		const { registerGsapPlugins } = await import('./gsap.js');

		registerGsapPlugins();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('passes all plugins to registerPlugin', async () => {
		const { gsap } = await import('gsap');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		const { MotionPathPlugin } = await import('gsap/MotionPathPlugin');
		const { DrawSVGPlugin } = await import('gsap/DrawSVGPlugin');
		const { CustomEase } = await import('gsap/CustomEase');
		const { SplitText } = await import('gsap/SplitText');
		const { MorphSVGPlugin } = await import('gsap/MorphSVGPlugin');
		// @ts-ignore — Windows casing conflict between gsap/types/flip.d.ts and gsap/Flip.js
		const { Flip } = await import('gsap/Flip');
		const { registerGsapPlugins } = await import('./gsap.js');

		registerGsapPlugins();

		expect(gsap.registerPlugin).toHaveBeenCalledWith(
			ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText, MorphSVGPlugin, Flip
		);
	});

	it('is idempotent — calling twice only registers once', async () => {
		const { gsap } = await import('gsap');
		const { registerGsapPlugins } = await import('./gsap.js');

		registerGsapPlugins();
		registerGsapPlugins();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('re-exports gsap', async () => {
		const { gsap } = await import('./gsap.js');
		expect(gsap).toBeDefined();
	});

	it('re-exports ScrollTrigger', async () => {
		const { ScrollTrigger } = await import('./gsap.js');
		expect(ScrollTrigger).toBeDefined();
	});

	it('re-exports MotionPathPlugin', async () => {
		const { MotionPathPlugin } = await import('./gsap.js');
		expect(MotionPathPlugin).toBeDefined();
	});

	it('re-exports DrawSVGPlugin', async () => {
		const { DrawSVGPlugin } = await import('./gsap.js');
		expect(DrawSVGPlugin).toBeDefined();
	});

	it('re-exports CustomEase', async () => {
		const { CustomEase } = await import('./gsap.js');
		expect(CustomEase).toBeDefined();
	});

	it('re-exports SplitText', async () => {
		const { SplitText } = await import('./gsap.js');
		expect(SplitText).toBeDefined();
	});

	it('re-exports MorphSVGPlugin', async () => {
		const { MorphSVGPlugin } = await import('./gsap.js');
		expect(MorphSVGPlugin).toBeDefined();
	});

	it('re-exports Flip', async () => {
		const { Flip } = await import('./gsap.js');
		expect(Flip).toBeDefined();
	});
});
