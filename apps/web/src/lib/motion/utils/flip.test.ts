import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('motion/utils/flip', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('captureFlipState', () => {
		it('returns null when no [data-flip-id] elements exist', async () => {
			const { captureFlipState } = await import('./flip.js');

			expect(captureFlipState()).toBeNull();
		});

		// The with-elements path below stubs Flip's layout measurement while
		// keeping the real plugin symbol; visual position interpolation remains
		// a Playwright follow-up.
	});

	describe('animateFlipTransition', () => {
		it('is a no-op when batchFired is false', async () => {
			const { animateFlipTransition } = await import('./flip.js');
			const onDone = vi.fn();
			animateFlipTransition('[data-batch="test"]', null, false, onDone);
			// tick() hasn't fired — onDone should not have been called synchronously
			expect(onDone).not.toHaveBeenCalled();
		});

		it('accepts a null flipState and does not throw', async () => {
			const { animateFlipTransition } = await import('./flip.js');
			const onDone = vi.fn();
			expect(() =>
				animateFlipTransition('[data-batch="test"]', null, true, onDone),
			).not.toThrow();
		});
	});
});

describe('motion/utils/flip registration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('registers Flip on the first capture with [data-flip-id] elements', async () => {
		document.body.innerHTML = '<article data-flip-id="card-1"></article>';
		const { gsap } = await import('gsap');
		const { Flip } = await import('gsap/Flip');
		vi.spyOn(Flip, 'getState').mockReturnValue({} as ReturnType<typeof Flip.getState>);
		const { captureFlipState } = await import('./flip.js');

		captureFlipState();

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('registers once across repeated captures and capture-to-animate', async () => {
		document.body.innerHTML =
			'<article data-flip-id="card-1" data-batch="test"></article>';
		const { gsap } = await import('gsap');
		const { Flip } = await import('gsap/Flip');
		vi.spyOn(Flip, 'getState').mockReturnValue({} as ReturnType<typeof Flip.getState>);
		const flipFrom = vi
			.spyOn(Flip, 'from')
			.mockReturnValue({} as ReturnType<typeof Flip.from>);
		const { captureFlipState, animateFlipTransition } = await import('./flip.js');

		const flipState = captureFlipState();
		captureFlipState();
		animateFlipTransition('[data-batch="test"]', flipState, true, vi.fn());
		await vi.waitFor(() => expect(flipFrom).toHaveBeenCalledTimes(1));

		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('does not register on reduced-motion or zero-element paths', async () => {
		document.body.innerHTML = '<article data-flip-id="card-1"></article>';
		const { gsap } = await import('gsap');
		const { Flip } = await import('gsap/Flip');
		const getState = vi
			.spyOn(Flip, 'getState')
			.mockReturnValue({} as ReturnType<typeof Flip.getState>);
		const { captureFlipState } = await import('./flip.js');
		const realMatchMedia = window.matchMedia.bind(window);
		const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
			const result = realMatchMedia(query);
			Object.defineProperty(result, 'matches', { configurable: true, value: true });
			return result;
		});

		expect(captureFlipState()).toBeNull();
		expect(gsap.registerPlugin).not.toHaveBeenCalled();
		expect(getState).not.toHaveBeenCalled();

		matchMedia.mockImplementation(realMatchMedia);
		document.body.innerHTML = '';
		expect(captureFlipState()).toBeNull();
		expect(gsap.registerPlugin).not.toHaveBeenCalled();
		expect(getState).not.toHaveBeenCalled();

		document.body.innerHTML = '<article data-flip-id="card-1"></article>';
		captureFlipState();
		expect(gsap.registerPlugin).toHaveBeenCalledTimes(1);
	});

	it('registers the real gsap/Flip symbol', async () => {
		document.body.innerHTML = '<article data-flip-id="card-1"></article>';
		const { gsap } = await import('gsap');
		const { Flip } = await import('gsap/Flip');
		vi.spyOn(Flip, 'getState').mockReturnValue({} as ReturnType<typeof Flip.getState>);
		const { captureFlipState } = await import('./flip.js');

		captureFlipState();

		expect(gsap.registerPlugin).toHaveBeenCalledWith(Flip);
	});
});
