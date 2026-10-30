import { test, expect, type Page } from '@playwright/test';

type InkFrame = { visible: boolean; ink: number; letteringInk: number; arrowInk: number };

async function settledHeroScale(page: Page): Promise<number> {
	const text = page.getByTestId('hero-text-container');
	await expect.poll(() => text.evaluate(element => getComputedStyle(element).opacity)).toBe('1');
	return text.evaluate(async element => {
		const deadline = performance.now() + 10_000;
		let anchor = Number.NaN;
		let stableSince = performance.now();
		while (performance.now() < deadline) {
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			const scale = new DOMMatrixReadOnly(getComputedStyle(element).transform).a;
			if (!Number.isFinite(anchor) || Math.abs(scale - anchor) > 0.001) {
				anchor = scale;
				stableSince = performance.now();
			} else if (performance.now() - stableSince >= 120) {
				return scale;
			}
		}
		throw new Error('Hero zoom did not settle before the near-end check');
	});
}

async function captureInk(page: Page) {
	await page.evaluate(() => {
		const frames: { visible: boolean; ink: number; letteringInk: number; arrowInk: number }[] = [];
		Reflect.set(window, 'heroInkFrames', frames);
		Reflect.set(window, 'captureHeroInk', true);
		const watch = () => {
			const svg = document.querySelector<SVGSVGElement>('[data-testid="hero-dot-annotation"]')!;
			const lettering = svg.querySelector('[data-testid="hero-annotation-label"]')!;
			let length = 0;
			let drawn = 0;
			let letteringLength = 0;
			let letteringDrawn = 0;
			let arrowLength = 0;
			let arrowDrawn = 0;
			for (const path of svg.querySelectorAll<SVGPathElement>('path')) {
				const size = path.getTotalLength();
				if (!size) continue;
				const normalizedLength = Number(path.getAttribute('pathLength')) || size;
				const ink = size * (1 - Math.max(0, Math.min(1, parseFloat(getComputedStyle(path).strokeDashoffset) / normalizedLength)));
				length += size;
				drawn += ink;
				if (lettering.contains(path)) {
					letteringLength += size;
					letteringDrawn += ink;
				} else {
					arrowLength += size;
					arrowDrawn += ink;
				}
			}
			frames.push({ visible: svg.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }),
				ink: length ? drawn / length : 0,
				letteringInk: letteringLength ? letteringDrawn / letteringLength : 0,
				arrowInk: arrowLength ? arrowDrawn / arrowLength : 0 });
			if (Reflect.get(window, 'captureHeroInk')) requestAnimationFrame(watch);
		};
		requestAnimationFrame(watch);
	});
}

async function expectProgressiveInk(page: Page) {
	const frames = () => page.evaluate(() => Reflect.get(window, 'heroInkFrames') as InkFrame[]);
	await expect.poll(async () => (await frames()).some(frame => frame.visible && frame.letteringInk > 0 && frame.letteringInk < 0.999 && frame.arrowInk < 0.999)).toBe(true);
	await expect.poll(async () => (await frames()).filter(frame => frame.visible).at(-1)?.letteringInk).toBeGreaterThanOrEqual(0.999);
	await expect.poll(async () => (await frames()).filter(frame => frame.visible).at(-1)?.ink).toBeGreaterThanOrEqual(0.999);
	await page.evaluate(() => Reflect.set(window, 'captureHeroInk', false));
	const visible = (await frames()).filter(frame => frame.visible);
	expect(visible[0].ink, 'the first visible annotation frame must not flash completed ink').toBeLessThan(0.999);
	expect(visible[0].letteringInk, 'the first visible word must not appear fully drawn').toBeLessThan(0.999);
	const partial = visible.filter(frame => frame.letteringInk > 0 && frame.letteringInk < 0.999 && frame.arrowInk < 0.999);
	expect(new Set(partial.map(frame => frame.letteringInk.toFixed(3))).size, 'lettering itself must show changing partial ink before the arrow completes').toBeGreaterThan(1);
}

test('replay pins immediately and completes after its visual scrub', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('hero-dot-replay').click();
		await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeLessThan(1);
		await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
		await expect.poll(() => page.locator('.hero-pin').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(1);
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		await expect.poll(() => page.getByTestId('hero-text-container').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
		// The scene must still progress near the end, before it settles.
		await page.evaluate(() => {
			const spacer = document.querySelector('.hero-pin')!.parentElement!;
			window.scrollTo({ top: parseFloat(getComputedStyle(spacer).paddingBottom) * 0.9, behavior: 'instant' });
		});
		await settledHeroScale(page);
		await page.evaluate(() => {
			const spacer = document.querySelector('.hero-pin')!.parentElement!;
			window.scrollTo({ top: parseFloat(getComputedStyle(spacer).paddingBottom) * 0.98, behavior: 'instant' });
		});
		expect(await settledHeroScale(page), 'the settled near-end scene must still differ from its final pose').toBeGreaterThan(1.01);
		await expect(page.getByTestId('hero-banner').getByTestId('hero-dot-annotation')).toBeHidden();
		await expect.poll(() => page.getByTestId('hero-dot').evaluate(async svg => {
			const animation = svg.getAnimations().find(candidate => candidate.playState === 'running');
			if (!animation) return false;
			const before = animation.currentTime;
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			return animation.currentTime !== before;
		}), { message: 'the dot pulses before the pin releases' }).toBe(true);
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		await expect.poll(() => page.getByTestId('hero-text-container').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
		await captureInk(page);
		const landing = await page.evaluate(async () => {
			const text = document.querySelector('[data-testid="hero-text-container"]')!;
			const headline = document.querySelector('[data-testid="hero-line1"]')!;
			const pin = document.querySelector('.hero-pin')!;
			const spacer = pin.parentElement!;
			const distance = parseFloat(getComputedStyle(spacer).paddingBottom);
			const frames: { pinned: boolean; scale: number; opacity: number; top: number; y: number }[] = [];
			const deadline = performance.now() + 10_000;
			while (performance.now() < deadline) {
				await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
				const style = getComputedStyle(text);
				const pinned = pin.parentElement!.classList.contains('pin-spacer');
				frames.push({ pinned, scale: new DOMMatrixReadOnly(style.transform).a, opacity: Number(style.opacity), top: headline.getBoundingClientRect().top, y: scrollY });
				if (frames.length === 1) window.scrollTo({ top: distance + 1, behavior: 'instant' });
				if (!pinned && frames.length > 1) break;
			}
			return { lastPinned: frames.filter(frame => frame.pinned).at(-1), settled: frames.at(-1) };
		});
		expect(landing.settled?.pinned, JSON.stringify(landing)).toBe(false);
		expect(landing.lastPinned?.opacity, JSON.stringify(landing)).toBeGreaterThanOrEqual(0.99);
		expect(landing.lastPinned?.scale, JSON.stringify(landing)).toBeLessThanOrEqual(1.01);
		expect(Math.abs(landing.lastPinned!.top - landing.settled!.top), JSON.stringify(landing)).toBeLessThanOrEqual(1);
		await expect(page.getByTestId('hero-line1')).toBeVisible();
		await expect(page.getByTestId('hero-banner').getByTestId('hero-dot-annotation')).toBeVisible();
		await expectProgressiveInk(page);
});
