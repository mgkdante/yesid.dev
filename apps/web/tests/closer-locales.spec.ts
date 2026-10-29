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
			await expect(note.locator('svg')).toHaveClass(/ready/);
			const reducedReplay = await note.evaluate(async element => {
				const started: string[] = [];
				const record = (event: Event) => { if (event instanceof AnimationEvent) started.push(event.animationName); };
				element.addEventListener('animationstart', record);
				element.dispatchEvent(new Event('mouseenter'));
				// Observe the two render boundaries that apply a keyed replay and its styles.
				await new Promise(requestAnimationFrame);
				await new Promise(requestAnimationFrame);
				element.removeEventListener('animationstart', record);
				return started;
			});
			expect(reducedReplay).toEqual([]);
			expect(
				await note
					.locator('path')
					.evaluateAll((paths) =>
						paths.every(
							(path) =>
								getComputedStyle(path).strokeDashoffset === '0px' &&
								getComputedStyle(path).animationName === 'none',
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

	test(`${locale} writes one letter at a time across the complete ending`, async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto(locale === DEFAULT_LOCALE ? '/' : '/' + locale);
		const note = page.getByRole('img', { name: THE_END[locale], exact: true });
		await note.scrollIntoViewIfNeeded();
		await expect(note.locator('svg')).toHaveClass(/ready/);
		const sequence = await note.evaluate(async (element) => {
			element.dispatchEvent(new Event('mouseenter'));
			let maxActive = 0,
				premature = 0,
				started = false;
			let intervals: { delay: number; duration: number }[] = [];
			const deadline = performance.now() + 8000;
			while (performance.now() < deadline) {
				await new Promise(requestAnimationFrame);
				const paths = [...element.querySelectorAll('path')];
				const animations = paths.map((path) => path.getAnimations()[0]);
				if (animations.some(Boolean)) {
					started = true;
					let active = 0;
					intervals = animations.map((animation) => {
						const timing = animation.effect!.getTiming();
						return {
							delay: Number(timing.delay),
							duration: Number(timing.duration),
						};
					});
					paths.forEach((path, index) => {
						const time = Number(animations[index].currentTime);
						const { delay, duration } = intervals[index];
						if (time >= delay && time < delay + duration) active += 1;
						if (time < delay && Number(getComputedStyle(path).opacity) > 0)
							premature += 1;
					});
					maxActive = Math.max(maxActive, active);
				} else if (
					started &&
					paths.every(
						(path) =>
							parseFloat(getComputedStyle(path).strokeDashoffset) === 0 &&
							Number(getComputedStyle(path).opacity) === 1,
					)
				) {
					return { complete: true, maxActive, premature, intervals };
				}
			}
			return { complete: false, maxActive, premature, intervals };
		});
		expect(sequence.complete).toBe(true);
		expect(sequence.maxActive).toBe(1);
		expect(sequence.premature).toBe(0);
		for (let i = 1; i < sequence.intervals.length; i++) {
			expect(sequence.intervals[i].delay + 0.001).toBeGreaterThanOrEqual(
				sequence.intervals[i - 1].delay + sequence.intervals[i - 1].duration,
			);
		}
	});
}

for (const width of [390, 820, 1920]) {
	test(`${width}px ground keeps four distinct props and follows scroll without moving its anchor`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/');
		const props = page.locator('[data-slot="construction-props"]');
		await expect(props).toHaveAttribute(
			'data-state',
			width < 768 ? 'static' : 'hidden',
		);
		const samples = [];
		for (const fraction of [0.98, 0.825, 0.7, 0.825, 0.98, 0.7]) {
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
			if (width >= 768)
				await expect
					.poll(async () => Number(await props.getAttribute('data-progress')))
					.toBeCloseTo(Math.max(0, Math.min(1, (0.95 - fraction) / 0.25)), 2);
			const sample = await page
				.locator('.ground-anchor')
				.evaluate((anchor) => ({
					top: anchor.getBoundingClientRect().top,
					scroll: document.scrollingElement!.scrollTop,
					height: document
						.querySelector('.construction-extension')!
						.getBoundingClientRect().height,
				}));
			expect(Math.abs(sample.top - requested.top)).toBeLessThanOrEqual(1);
			expect(Math.abs(sample.scroll - requested.scroll)).toBeLessThanOrEqual(1);
			samples.push(sample);
		}
		if (width >= 768) {
			expect(samples[2].height).toBeGreaterThan(samples[1].height);
			expect(samples[1].height).toBeGreaterThan(samples[0].height);
			expect(
				Math.abs(samples[4].height - samples[0].height),
			).toBeLessThanOrEqual(1);
		} else {
			expect(samples.every((sample) => sample.height === 0)).toBe(true);
		}
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
		await page.goto('/about');
		await expect(props).toHaveCount(0);
	});
}
