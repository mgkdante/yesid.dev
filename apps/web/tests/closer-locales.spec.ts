import { expect, test } from '@playwright/test';
import { DEFAULT_LOCALE } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';
import { THE_END } from '../src/lib/components/home/annotation-lettering';
import { closerContent } from '../src/lib/content/site-content';
import { resolveLocale } from '../src/lib/utils/locale';

for (const locale of PUBLISHED_LOCALES) {
	test(`${locale} closer is readable without JavaScript in normal motion`, async ({
		browser,
		baseURL,
	}) => {
		const context = await browser.newContext({
			baseURL,
			javaScriptEnabled: false,
			reducedMotion: 'no-preference',
		});
		const page = await context.newPage();
		try {
			await page.goto(locale === DEFAULT_LOCALE ? '/' : '/' + locale);
			const note = page.getByRole('img', {
				name: THE_END[locale],
				exact: true,
			});
			await note.scrollIntoViewIfNeeded();
			expect(
				await note
					.locator('path')
					.evaluateAll((paths) =>
						paths.every(
							(path) =>
								getComputedStyle(path).visibility === 'visible' &&
								getComputedStyle(path).strokeDashoffset === '0px',
						),
					),
			).toBe(true);
			await expect(page.locator('[data-construction-prop]')).toHaveCount(4);
			await expect(
				page.locator('[data-slot="construction-floodlight"]'),
			).toHaveAttribute('data-lit', 'true');
			for (const width of [390, 820, 1920]) {
				await page.setViewportSize({ width, height: 1180 });
				const art = await page.locator('[data-construction-prop] > svg').evaluateAll(elements =>
					elements.map(element => element.getBoundingClientRect().toJSON()).sort((a, b) => a.left - b.left));
				for (let i = 0; i < art.length; i++) {
					expect(art[i].left).toBeGreaterThanOrEqual(0);
					expect(art[i].right).toBeLessThanOrEqual(width);
					if (i) expect(art[i].left, `${width}px no-JS props stay distinct`).toBeGreaterThanOrEqual(art[i - 1].right);
				}
			}
		} finally {
			await context.close();
		}
	});

	test(
		locale +
			' closer lettering and navigation survive failed decorative requests',
		async ({ page }) => {
			const requests: string[] = [];
			page.on('request', (request) => {
				if (request.url().includes('/svg/graffiti/'))
					requests.push(request.url());
			});
			await page.route('**/svg/**', (route) => route.abort());
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(locale === DEFAULT_LOCALE ? '/' : '/' + locale);
			const note = page.getByRole('img', {
				name: THE_END[locale],
				exact: true,
			});
			await note.scrollIntoViewIfNeeded();
			await expect(note).toBeVisible();
			expect(
				await note
					.locator('path')
					.evaluateAll((paths) =>
						paths.every(
							(path) =>
								getComputedStyle(path).strokeDashoffset === '0px' &&
								getComputedStyle(path).animationName === 'none' &&
								getComputedStyle(path).opacity === '1',
						),
					),
			).toBe(true);
			await expect(
				page.getByRole('link', {
					name: resolveLocale(closerContent.cta.label, locale),
				}),
			).toHaveAttribute('href', closerContent.cta.href);
			expect(requests).toEqual([]);
		},
	);

	test(`${locale} scroll writes the ending one letter at a time across the 100vh before the reveal ends`, async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto(locale === DEFAULT_LOCALE ? '/' : '/' + locale);
		const read = () =>
			page.locator('.closer-note').evaluate(async (note) => {
				await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
				return {
					progress: Number(document.querySelector('[data-slot="construction-props"]')!.getAttribute('data-progress')),
					visible: note.getBoundingClientRect().top < innerHeight,
					offset: note.getBoundingClientRect().top - document.querySelector('.closer-core')!.getBoundingClientRect().top,
					animations: note.getAnimations({ subtree: true }).length,
					ink: [...note.querySelectorAll('path')].map(
						(path) => Number(getComputedStyle(path).opacity) && 1 - parseFloat(getComputedStyle(path).strokeDashoffset),
					),
				};
			});
		// 0 puts the ground anchor 170vh down the viewport, 1 at 70vh, where the reveal completes.
		const at = async (position: number) => {
			await page.locator('.ground-anchor').evaluate((anchor, top) => {
				document.scrollingElement!.scrollTop += anchor.getBoundingClientRect().top - innerHeight * top;
			}, 1.7 - position);
			return read();
		};
		const samples: Awaited<ReturnType<typeof read>>[] = [];
		for (let step = 0; step < 20; step++) samples.push(await at(step / 20));
		const totals = samples.map((sample) => sample.ink.reduce((sum, value) => sum + value, 0));
		const letters = samples[0].ink.length;
		for (const { animations, ink, visible } of samples) {
			expect(animations).toBe(0);
			expect(ink.some((value) => value > 0)).toBe(visible);
			expect(ink.filter((value) => value > 0 && value < 1).length).toBeLessThanOrEqual(1);
			ink.slice(1).forEach((value, i) => expect(value).toBeLessThanOrEqual(ink[i]));
		}
		// Equal scroll steps raise the ending and add ink by equal amounts, so a stroke stops wherever
		// the scroll stops, and the writing only completes as the reveal does.
		const rises = samples.slice(1).map((sample, i) => samples[i].offset - sample.offset);
		for (const rise of rises) expect(Math.abs(rise - rises[0])).toBeLessThanOrEqual(1);
		const steps = totals.slice(1).map((total, i) => total - totals[i]).filter((step, i) => totals[i] > 0 && totals[i + 1] < letters);
		expect(steps.length).toBeGreaterThan(5);
		for (const step of steps) expect(step).toBeCloseTo(steps[0], 1);
		const end = await at(1.02);
		expect([totals[19] < letters, end.ink.every((ink) => ink === 1), end.progress]).toEqual([true, true, 1]);
		const back = await at(0.7);
		expect(back.ink).toEqual(samples[14].ink);
		await page.waitForTimeout(500);
		expect((await read()).ink).toEqual(back.ink);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		expect((await at(0.5)).ink.every((ink) => ink === 1)).toBe(true);
	});
}

for (const width of [390, 820, 1920]) {
	test(`${width}px props follow scroll and the ground unfolds only beside the ending`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/');
		const props = page.locator('[data-slot="construction-props"]');
		await expect(props).toHaveAttribute('data-state', 'hidden');
		const besideEnding = await page.locator('.closer-note').evaluate(
			(note) => getComputedStyle(note).position === 'absolute',
		);
		const samples = [];
		for (const fraction of [0.98, 0.825, 0.7, 0.825, 0.98, 0.725, 0.7]) {
			const requested = await page
				.locator('.ground-anchor')
				.evaluate((anchor, fraction) => {
					document.scrollingElement!.scrollTop +=
						anchor.getBoundingClientRect().top - innerHeight * fraction;
					return {
						scroll: document.scrollingElement!.scrollTop,
						top: anchor.getBoundingClientRect().top,
					};
				}, fraction);
			await expect
				.poll(async () => Number(await props.getAttribute('data-progress')))
				.toBeCloseTo(Math.max(0, Math.min(1, (0.95 - fraction) / 0.25)), 2);
			const sample = await page
				.locator('.ground-anchor')
				.evaluate((anchor) => ({
					top: anchor.getBoundingClientRect().top,
					scroll: document.scrollingElement!.scrollTop,
					ground: document
						.querySelector('.construction-extension')!
						.getBoundingClientRect().height,
					sectionHeight: document.querySelector('[data-testid="closer-section"]')!.getBoundingClientRect().height,
					sectionBottom: document.querySelector('[data-testid="closer-section"]')!.getBoundingClientRect().bottom,
					ctaBottom: document.querySelector('[data-testid="closer-cta"]')!.getBoundingClientRect().bottom,
					note: document.querySelector('.closer-note')!.getBoundingClientRect().toJSON(),
					lamp: document.querySelector('[data-slot="closer-floodlight"] svg')!.getBoundingClientRect().toJSON(),
					beam: document.querySelector('.closer-beam')!.getBoundingClientRect().height,
					board: document.querySelector('[data-closer-board]')!.getBoundingClientRect().toJSON(),
					cta: document.querySelector('[data-testid="closer-cta"]')!.getBoundingClientRect().toJSON(),
					propsTop: Math.min(...[...document.querySelectorAll('[data-construction-prop] > svg')].map((svg) => svg.getBoundingClientRect().top)),
					written: [...document.querySelectorAll('.closer-note path')].reduce(
						(sum, path) => sum + (Number(getComputedStyle(path).opacity) && 1 - parseFloat(getComputedStyle(path).strokeDashoffset)),
						0,
					),
				}));
			expect(Math.abs(sample.top - requested.top)).toBeLessThanOrEqual(1);
			expect(Math.abs(sample.scroll - requested.scroll)).toBeLessThanOrEqual(1);
			expect(sample.sectionBottom).toBeGreaterThan(sample.ctaBottom);
			samples.push(sample);
		}
		if (besideEnding) {
			expect(samples[2].ground).toBeGreaterThan(samples[1].ground);
			expect(samples[1].ground).toBeGreaterThan(samples[0].ground);
			expect(
				Math.abs(samples[4].ground - samples[0].ground),
			).toBeLessThanOrEqual(1);
			expect(Math.abs(samples[6].sectionHeight - page.viewportSize()!.height)).toBeLessThanOrEqual(1);
		} else {
			expect(samples.every((sample) => sample.ground === 0)).toBe(true);
		}
		type Sample = (typeof samples)[number];
		type Box = Sample['note'];
		const intersects = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
		const fromTop = (sample: Sample, top: number) => top - (sample.sectionBottom - sample.sectionHeight);
		const letters = await page.locator('.closer-note path').count();
		for (const sample of samples) {
			expect(intersects(sample.note, sample.board) || intersects(sample.note, sample.cta)).toBe(false);
		}
		for (const hidden of [samples[0], samples[4]]) {
			expect(hidden.lamp.top).toBeGreaterThanOrEqual(hidden.sectionBottom - 1);
			expect(hidden.beam).toBeLessThanOrEqual(1);
		}
		// The ending is still rising and writing at 0.5 and 0.9, retraces its path on the way back,
		// and lands fully written as the props finish.
		for (const rising of [samples[1], samples[5]]) {
			expect(fromTop(rising, rising.note.top)).toBeGreaterThan(fromTop(samples[2], samples[2].note.top) + 1);
			expect(rising.written).toBeLessThan(letters - 0.1);
		}
		expect(Math.abs(fromTop(samples[3], samples[3].note.top) - fromTop(samples[1], samples[1].note.top))).toBeLessThanOrEqual(1);
		expect(fromTop(samples[5], samples[5].propsTop)).toBeGreaterThan(fromTop(samples[6], samples[6].propsTop) + 1);
		expect(samples[3].written).toBeCloseTo(samples[1].written, 1);
		expect(samples[4].written).toBeCloseTo(samples[0].written, 1);
		for (const landed of [samples[2], samples[6]]) expect(landed.written).toBeGreaterThan(letters - 0.1);
		const groundPainter = await page.locator('.construction-extension').evaluate((ground) => {
			for (let element: Element | null = ground; element; element = element.parentElement) {
				const style = getComputedStyle(element);
				if (style.backgroundImage !== 'none' || !['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor)) {
					return element.tagName;
				}
			}
			return null;
		});
		// The ground paints nothing of its own, so the fixed page grid shows through it.
		expect(groundPainter).toBe('HTML');
		await expect(page.getByTestId('site-grid')).toHaveCSS('background-image', /linear-gradient/);
		const art = await props
			.locator('[data-construction-prop] > svg')
			.evaluateAll((elements) =>
				elements
					.map((element) => element.getBoundingClientRect().toJSON())
					.sort((a, b) => a.left - b.left),
			);
		expect(art).toHaveLength(4);
		for (let i = 0; i < art.length; i++) {
			expect(art[i].width).toBeGreaterThan(0);
			expect(art[i].left).toBeGreaterThanOrEqual(0);
			expect(art[i].right).toBeLessThanOrEqual(width);
			if (i) expect(art[i].left).toBeGreaterThanOrEqual(art[i - 1].right);
		}
		if (width === 390) {
			const row = await page.evaluate(() =>
				[...document.querySelectorAll('[data-construction-prop] > svg'), document.querySelector('[data-slot="closer-floodlight"] svg')!]
					.map((svg) => ({ name: (svg.parentElement as HTMLElement).dataset.constructionProp ?? 'lamp', ...svg.getBoundingClientRect().toJSON() }))
					.sort((a, b) => a.left - b.left),
			);
			expect(row.map((box) => box.name)).toEqual(['balise', 'sign', 'lamp', 'helmet', 'barricade']);
			const gaps = row.slice(1).map((box, i) => box.left - row[i].right);
			for (const gap of gaps) expect(Math.abs(gap - gaps[0]), `390px gaps ${gaps.join(', ')}`).toBeLessThanOrEqual(1);
		}
		await expect(
			page.locator(
				'[data-slot="closer-floodlight"] [data-slot="construction-floodlight"]',
			),
		).toHaveAttribute('data-lit', 'true');
		// At full reveal the scene sits exactly where reduced motion keeps it.
		const scene = () => page.evaluate(() => ['.closer-note', '[data-slot="closer-floodlight"] svg'].map((selector) => document.querySelector(selector)!.getBoundingClientRect().toJSON()));
		const landed = await scene();
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const still = await scene();
		landed.forEach((box, i) => {
			for (const side of ['left', 'top', 'width', 'height'] as const) expect(Math.abs(still[i][side] - box[side])).toBeLessThanOrEqual(1);
		});
		expect(await page.evaluate(() => [['.closer-note', 'translate'], ['[data-slot="closer-floodlight"]', 'translate'], ['.closer-beam', 'scale']].map(([selector, property]) => getComputedStyle(document.querySelector(selector)!).getPropertyValue(property)))).toEqual(['none', 'none', 'none']);
		await page.goto('/about');
		await expect(props).toHaveCount(0);
	});
}
