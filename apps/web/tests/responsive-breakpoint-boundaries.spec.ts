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
		const rotatedTitle = document.querySelector<HTMLElement>('.rotated-title')!;
		const section = document.querySelector<HTMLElement>('.home-section--left')!;
		return {
			navPaddingInline: getComputedStyle(nav).paddingInline,
			rotatedTitleDisplay: getComputedStyle(rotatedTitle).display,
			gridTracks: getComputedStyle(section).gridTemplateColumns.split(' ').length,
		};
	});
}

async function expectWholeProjectCards(page: Page, width: number) {
	let lastPosition = '';
	let stableSince = 0;
	await expect.poll(async () => {
		const cards = await page.getByTestId('proof-reel-section').evaluate(section => {
			const frame = section.querySelector('.embla')!.getBoundingClientRect();
			return Array.from(section.querySelectorAll('[data-testid="proof-card"]'), card => {
				const box = card.getBoundingClientRect();
				const visible = Math.max(0, Math.min(frame.right, box.right) - Math.max(frame.left, box.left));
				return { left: box.left, width: box.width, visible, complete: visible >= box.width - 1 };
			});
		});
		const position = cards.map(card => `${card.left.toFixed(2)}:${card.width.toFixed(2)}`).join(',');
		if (position !== lastPosition) { lastPosition = position; stableSince = Date.now(); }
		return {
			hasVisibleCard: cards.some(card => card.visible > 1),
			partial: cards.filter(card => card.visible > 1 && !card.complete),
			settled: Date.now() - stableSince >= 120,
		};
	}, { message: `${width}px carousel must settle with complete project cards` }).toEqual({ hasVisibleCard: true, partial: [], settled: true });
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
				tabletMetrics.querySelectorAll<HTMLElement>('.metric-label-text, [data-slot="metric-display"] > .metric-value, [data-slot="metric-display"] > span:last-child'),
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
				element: document.querySelector<HTMLElement>('[data-testid="hero-mobile-sql"] [data-testid="sql-panel"]')!,
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
			metricCards: metricCards.map((card) => {
				const rect = card.getBoundingClientRect();
				return { width: rect.width, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
			}),
			noSplitText: noSplitText.map((element, index) => {
				return {
					name: element.dataset.testid ?? `hero metric text ${index + 1}`,
					clientWidth: element.clientWidth,
					scrollWidth: element.scrollWidth,
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
	for (const text of state.noSplitText) {
		expect(
			text.scrollWidth,
			`${viewportWidth}px ${text.name} must fit without horizontal clipping`,
		).toBeLessThanOrEqual(text.clientWidth + 1);
	}
	expect(state.metricCards.length, `${viewportWidth}px hero metrics remain present`).toBeGreaterThan(0);
	for (const [index, card] of state.metricCards.entries()) {
		expect(card.width, `${viewportWidth}px metric card ${index + 1} remains visible`).toBeGreaterThan(0);
		for (const other of state.metricCards.slice(index + 1)) {
			expect(card.left < other.right && card.right > other.left && card.top < other.bottom && card.bottom > other.top,
				`${viewportWidth}px metric cards must not overlap`).toBe(false);
		}
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
		};
	});
}

test('canonical aliases preserve the 767/768 and 1023/1024 layout boundaries', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
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
	await expectWholeProjectCards(page, 767);
	const d1bAt767 = await d1bBoundaryState(page);
	expect(d1bAt767.metricFontSize).toBeLessThan(26);
	expect(d1bAt767.beckDisplay).toBe('none');
	expect(d1bAt767.roundelFontSize).toBe(7);
	expect(d1bAt767.badgeFontSize).toBe(6);

	await page.setViewportSize({ width: 768, height: 900 });
	await settleLayout(page);
	const at768 = await responsiveState(page);
	expect(at768.navPaddingInline).toBe('28px');
	await expectWholeProjectCards(page, 768);
	const heroAt768 = await heroBoundaryState(page);
	for (const rect of heroAt768.rects) {
		expect(
			rect.left >= -0.5 && rect.right <= heroAt768.clientWidth + 0.5,
			`${rect.name} must stay within the 768px viewport`,
		).toBe(true);
	}
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
	await expectWholeProjectCards(page, 1023);
	expect(at1023.rotatedTitleDisplay).toBe('none');
	expect(at1023.gridTracks).toBe(1);
	const heroAt1023 = await heroBoundaryState(page);
	for (const rect of heroAt1023.rects) {
		expect(
			rect.left >= -0.5 && rect.right <= heroAt1023.clientWidth + 0.5,
			`${rect.name} must stay within the 1023px viewport`,
		).toBe(true);
	}
	expectTabletHeroColumnFit(heroAt1023, 1023);

	await page.setViewportSize({ width: 1024, height: 900 });
	await settleLayout(page);
	const at1024 = await responsiveState(page);
	await expectWholeProjectCards(page, 1024);
	expect(at1024.rotatedTitleDisplay).toBe('flex');
	expect(at1024.gridTracks).toBe(2);

	for (const width of [767, 768]) {
		await page.setViewportSize({ width, height: 660 });
		await settleLayout(page);
		expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
		for (const id of ['hero-cta-projects', 'hero-cta-contact']) {
			await page.getByTestId(id).scrollIntoViewIfNeeded();
			await expect(page.getByTestId(id)).toBeInViewport();
		}
	}
});
