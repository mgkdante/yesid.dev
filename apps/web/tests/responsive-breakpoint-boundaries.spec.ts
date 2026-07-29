import { expect, test, type Page } from '@playwright/test';

test.use({ colorScheme: 'dark' });

async function settleLayout(page: Page) {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
			),
	);
}

async function responsiveState(page: Page) {
	return page.evaluate(() => {
		const nav = document.querySelector<HTMLElement>('[data-testid="nav-pill"]')!;
		const reel = document.querySelector<HTMLElement>('.embla')!;
		const slide = document.querySelector<HTMLElement>('.embla__slide')!;
		const rotatedTitle = document.querySelector<HTMLElement>('.rotated-title')!;
		const section = document.querySelector<HTMLElement>('.home-section--left')!;
		return {
			navPaddingInline: getComputedStyle(nav).paddingInline,
			slideRatio: slide.getBoundingClientRect().width / reel.getBoundingClientRect().width,
			rotatedTitleDisplay: getComputedStyle(rotatedTitle).display,
			gridTracks: getComputedStyle(section).gridTemplateColumns.split(' ').length,
		};
	});
}

async function heroBoundaryState(page: Page) {
	return page.evaluate(() => {
		const heroGrid = document.querySelector<HTMLElement>('.hero-grid')!;
		const tabletMetrics = heroGrid.querySelector<HTMLElement>(
			'[data-testid="hero-metrics-desktop"]',
		)!;
		const metricCards = Array.from(
			tabletMetrics.querySelectorAll<HTMLElement>('[data-testid="metric-card"]'),
		);
		const noSplitText = [
			...Array.from(
				heroGrid.querySelectorAll<HTMLElement>(
					'[data-testid="hero-line1"], [data-testid="hero-line2"], [data-testid="hero-subheadline"], [data-testid="hero-subtitle"]',
				),
			),
			...Array.from(
				tabletMetrics.querySelectorAll<HTMLElement>('[data-slot="metric-display"] > span'),
			),
		];
		const elements = [
			{ name: '.hero-grid', element: heroGrid, includeTextOverflow: false },
			...Array.from(heroGrid.children).map((element, index) => ({
				name: `.hero-grid > :nth-child(${index + 1})`,
				element: element as HTMLElement,
				includeTextOverflow: false,
			})),
			{
				name: '[data-testid="sql-panel"]',
				element: document.querySelector<HTMLElement>('[data-testid="sql-panel"]')!,
				includeTextOverflow: false,
			},
			...noSplitText.map((element, index) => ({
				name: `[data-no-split-text="${index + 1}"]`,
				element,
				includeTextOverflow: true,
			})),
		];

		return {
			clientWidth: document.documentElement.clientWidth,
			headlineFontSize: Number.parseFloat(
				getComputedStyle(
					heroGrid.querySelector<HTMLElement>('[data-testid="hero-line1"]')!,
				).fontSize,
			),
			gridTracks: getComputedStyle(heroGrid)
				.gridTemplateColumns.split(/\s+/)
				.map(Number.parseFloat),
			metricCards: metricCards.map((card) => {
				const rect = card.getBoundingClientRect();
				return { width: rect.width, top: rect.top, bottom: rect.bottom };
			}),
			noSplitText: noSplitText.map((element, index) => {
				const style = getComputedStyle(element);
				return {
					name: element.dataset.testid ?? `hero metric text ${index + 1}`,
					clientWidth: element.clientWidth,
					scrollWidth: element.scrollWidth,
					overflowWrap: style.overflowWrap,
					wordBreak: style.wordBreak,
					hyphens: style.hyphens,
				};
			}),
			rects: elements.map(({ name, element, includeTextOverflow }) => {
				const rect = element.getBoundingClientRect();
				return {
					name,
					left: rect.left,
					right: includeTextOverflow
						? Math.max(rect.right, rect.left + element.scrollWidth)
						: rect.right,
				};
			}),
		};
	});
}

function expectTabletHeroColumnFit(
	state: Awaited<ReturnType<typeof heroBoundaryState>>,
	viewportWidth: 768 | 1023,
) {
	expect(state.headlineFontSize, `${viewportWidth}px headline clamp floor`).toBeGreaterThanOrEqual(
		56,
	);
	expect(state.headlineFontSize, `${viewportWidth}px headline clamp ceiling`).toBeLessThanOrEqual(
		80,
	);
	for (const text of state.noSplitText) {
		expect(text.overflowWrap, `${viewportWidth}px ${text.name} overflow-wrap`).toBe('normal');
		expect(text.wordBreak, `${viewportWidth}px ${text.name} word-break`).toBe('normal');
		expect(text.hyphens, `${viewportWidth}px ${text.name} hyphens`).toBe('none');
		expect(
			text.scrollWidth,
			`${viewportWidth}px ${text.name} must fit without emergency wrapping`,
		).toBeLessThanOrEqual(text.clientWidth + 1);
	}
	expect(state.metricCards, `${viewportWidth}px hero metric card count`).toHaveLength(3);
	for (const [index, card] of state.metricCards.entries()) {
		expect(card.width, `${viewportWidth}px metric card ${index + 1} width`).toBeGreaterThan(250);
		if (index === 0) continue;
		expect(
			card.top,
			`${viewportWidth}px metric card ${index + 1} stacks below card ${index}`,
		).toBeGreaterThanOrEqual(state.metricCards[index - 1]!.bottom - 1);
	}
}

async function d1bBoundaryState(page: Page) {
	return page.evaluate(() => {
		const beckLine = document.querySelector<HTMLElement>('.manifesto__beck-line')!;
		const beckRect = beckLine.getBoundingClientRect();
		const fontSize = (selector: string) =>
			Number.parseFloat(
				getComputedStyle(document.querySelector<HTMLElement>(selector)!).fontSize,
			);

		return {
			metricFontSize: fontSize('.metric-value.text-title'),
			beckDisplay: getComputedStyle(beckLine).display,
			beckWidth: beckRect.width,
			beckHeight: beckRect.height,
			roundelFontSize: fontSize('.manifesto__roundel'),
			badgeFontSize: fontSize('[data-testid="manifesto-platform-badge"]'),
			heroLine1FontSize: fontSize('[data-testid="hero-line1"]'),
		};
	});
}

test('canonical aliases preserve the 767/768 and 1023/1024 layout boundaries', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript(() => {
		const today = new Date();
		localStorage.setItem(
			'yesid:hero-intro-day',
			`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
		);
	});
	await page.setViewportSize({ width: 767, height: 900 });
	await page.goto('/');
	await expect(page.getByTestId('proof-reel-section')).toBeVisible();
	await page.addStyleTag({
		content: '*,*::before,*::after{animation:none!important;transition:none!important}',
	});
	await page.evaluate(() => document.fonts.ready);
	await settleLayout(page);

	const at767 = await responsiveState(page);
	expect(at767.navPaddingInline).toBe('16px');
	expect(at767.slideRatio).toBeGreaterThan(0.9);
	const d1bAt767 = await d1bBoundaryState(page);
	expect(d1bAt767.metricFontSize).toBeLessThan(26);
	expect(d1bAt767.beckDisplay).toBe('none');
	expect(d1bAt767.roundelFontSize).toBe(7);
	expect(d1bAt767.badgeFontSize).toBe(6);

	await page.setViewportSize({ width: 768, height: 900 });
	await settleLayout(page);
	const at768 = await responsiveState(page);
	expect(at768.navPaddingInline).toBe('28px');
	expect(at768.slideRatio).toBeLessThan(0.65);
	const heroAt768 = await heroBoundaryState(page);
	for (const rect of heroAt768.rects) {
		expect(
			rect.left >= -0.5 && rect.right <= heroAt768.clientWidth + 0.5,
			`${rect.name} must stay within the 768px viewport`,
		).toBe(true);
	}
	expect(heroAt768.gridTracks).toHaveLength(3);
	expect(Math.abs(heroAt768.gridTracks[0]! - heroAt768.gridTracks[2]!)).toBeLessThanOrEqual(
		0.5,
	);
	expect(heroAt768.gridTracks[1]).toBe(1);
	expectTabletHeroColumnFit(heroAt768, 768);
	const d1bAt768 = await d1bBoundaryState(page);
	expect(d1bAt768.metricFontSize).toBeGreaterThan(26);
	expect(d1bAt768.beckDisplay).not.toBe('none');
	expect(d1bAt768.beckWidth).toBeGreaterThan(0);
	expect(d1bAt768.beckHeight).toBeGreaterThan(0);
	expect(d1bAt768.roundelFontSize).toBe(9);
	expect(d1bAt768.badgeFontSize).toBe(8);

	await page.setViewportSize({ width: 1023, height: 900 });
	await settleLayout(page);
	const at1023 = await responsiveState(page);
	expect(at1023.rotatedTitleDisplay).toBe('none');
	expect(at1023.gridTracks).toBe(1);
	const heroAt1023 = await heroBoundaryState(page);
	for (const rect of heroAt1023.rects) {
		expect(
			rect.left >= -0.5 && rect.right <= heroAt1023.clientWidth + 0.5,
			`${rect.name} must stay within the 1023px viewport`,
		).toBe(true);
	}
	expect(heroAt1023.gridTracks).toHaveLength(3);
	expect(Math.abs(heroAt1023.gridTracks[0]! - heroAt1023.gridTracks[2]!)).toBeLessThanOrEqual(
		0.5,
	);
	expect(heroAt1023.gridTracks[1]).toBe(1);
	expectTabletHeroColumnFit(heroAt1023, 1023);

	await page.setViewportSize({ width: 1024, height: 900 });
	await settleLayout(page);
	const at1024 = await responsiveState(page);
	expect(at1024.rotatedTitleDisplay).toBe('flex');
	expect(at1024.gridTracks).toBe(2);

	await page.setViewportSize({ width: 767, height: 660 });
	await settleLayout(page);
	const r4At767 = await d1bBoundaryState(page);
	// R4 register: clamp(2rem, min(10.5vw, 6svh), 3.5rem) — at 767x660 the svh term
	// wins (39.6px), far below the tablet band's 56px floor. Split at 50px: the two
	// registers' computed values cannot collide (R4 tops out at 39.6 here; the band
	// bottoms out at 56), so 50 is a stable discriminator where the static ranges
	// (R4 <=56, band >=56) share the 56px edge and a strict comparison misfires.
	expect(r4At767.heroLine1FontSize).toBeGreaterThanOrEqual(32);
	expect(r4At767.heroLine1FontSize).toBeLessThan(50);

	await page.setViewportSize({ width: 768, height: 660 });
	await settleLayout(page);
	const r4At768 = await d1bBoundaryState(page);
	expect(r4At768.heroLine1FontSize).toBeGreaterThanOrEqual(50);
});
