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

	test(`${locale} scroll writes the ending one letter at a time with nothing on a timer`, async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto(locale === DEFAULT_LOCALE ? '/' : '/' + locale);
		const inkAt = async (progress: number) => {
			await page.locator('.ground-anchor').evaluate((anchor, fraction) => {
				document.scrollingElement!.scrollTop += anchor.getBoundingClientRect().top - innerHeight * fraction;
			}, 0.95 - progress * 0.25);
			await expect
				.poll(async () => Number(await page.locator('[data-slot="construction-props"]').getAttribute('data-progress')))
				.toBeCloseTo(progress, 2);
			return page.locator('.closer-note').evaluate((note) => ({
				animations: note.getAnimations({ subtree: true }).length,
				ink: [...note.querySelectorAll('path')].map(
					(path) => Number(getComputedStyle(path).opacity) && 1 - parseFloat(getComputedStyle(path).strokeDashoffset),
				),
			}));
		};
		expect((await inkAt(0.58)).ink.every((ink) => ink === 0)).toBe(true);
		for (let step = 1; step < 20; step++) {
			const { animations, ink } = await inkAt(0.6 + step * 0.01);
			expect(animations).toBe(0);
			expect(ink.filter((value) => value > 0 && value < 1).length).toBeLessThanOrEqual(1);
			ink.slice(1).forEach((value, i) => expect(value).toBeLessThanOrEqual(ink[i]));
		}
		expect((await inkAt(0.82)).ink.every((ink) => ink === 1)).toBe(true);
		const halfway = (await inkAt(0.7)).ink;
		expect(halfway.includes(1) && halfway.includes(0)).toBe(true);
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
					written: [...document.querySelectorAll('.closer-note path')].filter((path) => getComputedStyle(path).opacity !== '0').length,
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
			expect(hidden.note.top).toBeGreaterThanOrEqual(hidden.sectionBottom - 1);
			expect(hidden.lamp.top).toBeGreaterThanOrEqual(hidden.sectionBottom - 1);
			expect(hidden.beam).toBeLessThanOrEqual(1);
		}
		// The ending rises unwritten, retraces its path on the way back, and has landed
		// and written itself by 0.9 while the props keep rising.
		expect(fromTop(samples[1], samples[1].note.top)).toBeGreaterThan(fromTop(samples[2], samples[2].note.top) + 1);
		expect(Math.abs(fromTop(samples[3], samples[3].note.top) - fromTop(samples[1], samples[1].note.top))).toBeLessThanOrEqual(1);
		expect(Math.abs(fromTop(samples[5], samples[5].note.top) - fromTop(samples[6], samples[6].note.top))).toBeLessThanOrEqual(1);
		expect(fromTop(samples[5], samples[5].propsTop)).toBeGreaterThan(fromTop(samples[6], samples[6].propsTop) + 1);
		expect(samples.map((sample) => sample.written)).toEqual([0, 0, letters, 0, 0, letters, letters]);
		const groundBackground = await page.locator('.construction-extension').evaluate((ground) => {
			for (let element: Element | null = ground; element; element = element.parentElement) {
				const style = getComputedStyle(element);
				if (style.backgroundImage !== 'none' || !['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor)) {
					return style.backgroundImage;
				}
			}
			return 'none';
		});
		expect(groundBackground).toContain('repeating-linear-gradient');
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
		expect(await page.evaluate(() => [['.closer-note', 'translate'], ['.closer-floodlight', 'translate'], ['.closer-beam', 'scale']].map(([selector, property]) => getComputedStyle(document.querySelector(selector)!).getPropertyValue(property)))).toEqual(['none', 'none', 'none']);
		await page.goto('/about');
		await expect(props).toHaveCount(0);
	});
}
