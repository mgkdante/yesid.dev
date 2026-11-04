import { expect, test, type Page } from '@playwright/test';

const locales = ['en', 'fr', 'es'] as const;
const widths = [320, 390, 499, 500, 639, 640, 767, 768, 1023, 1024, 1280, 1440, 1789, 1790, 1800, 1920];

async function openAbout(page: Page, locale: string) {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(locale === 'en' ? '/about' : `/${locale}/about`);
	await expect(page.getByTestId('about-metrics').getByRole('heading', { level: 2 })).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
}

async function geometry(page: Page) {
	return page.getByTestId('about-metrics').evaluate((card) => {
		const rect = (element: Element) => {
			const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
			return { left, right, top, bottom, width, height };
		};
		const text = (element: Element) => {
			const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
			const words = [];
			const lines = [];
			while (walker.nextNode()) {
				const node = walker.currentNode;
				for (const match of node.textContent!.matchAll(/\S+/gu)) {
					const range = document.createRange();
					range.setStart(node, match.index!);
					range.setEnd(node, match.index! + match[0].length);
					words.push({ word: match[0], rects: [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })) });
				}
				const range = document.createRange();
				range.selectNodeContents(node);
				lines.push(...[...range.getClientRects()].filter(rect => rect.width > 0).map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })));
			}
			return { ...rect(element), align: getComputedStyle(element).textAlign, fontSize: parseFloat(getComputedStyle(element).fontSize), words, lines };
		};
		const values = [...card.querySelectorAll('.metric-value')];
		const labels = [...card.querySelectorAll('.label-metric')];
		return {
			card: rect(card), cell: rect(card.closest('.area-metrics')!),
			content: rect(card.querySelector('h2')!.parentElement!),
			heading: rect(card.querySelector('h2')!),
			facts: values.map((value, i) => ({ column: rect(value.parentElement!), value: text(value), label: text(labels[i]), color: getComputedStyle(value).color })),
			theme: document.documentElement.dataset.theme,
		};
	});
}

async function expectLayout(page: Page, width: number) {
	const state = await geometry(page);
	const { card, facts } = state;
	expect(facts).toHaveLength(4);
	// The content needs 560px for four readable mono columns, and phones always use corners.
	const fourColumns = width >= 640 && state.content.width >= 560;
	const pairs = fourColumns ? [facts] : [facts.slice(0, 2), facts.slice(2)];
	for (const pair of pairs) {
		for (const fact of pair) {
			expect(Math.abs(fact.value.bottom - pair[0].value.bottom), `${width}px values share a bottom edge`).toBeLessThanOrEqual(1);
			expect(Math.abs(fact.label.top - pair[0].label.top), `${width}px labels share a top edge`).toBeLessThanOrEqual(1);
			expect(fact.label.top - fact.value.bottom, 'the rows meet with the existing 8px label gap').toBeCloseTo(8, 0);
		}
	}
	if (fourColumns) {
		for (let i = 1; i < facts.length; i++) expect(facts[i].column.left).toBeGreaterThan(facts[i - 1].column.right);
		expect(facts[0].value.top, 'owner refinement: shared values start just below the heading, with spare height below labels').toBeCloseTo(state.heading.bottom + 16, 0);
	} else {
		for (const i of [0, 2]) {
			expect(facts[i].column.left).toBeLessThan(card.left + card.width / 2);
			expect(facts[i + 1].column.left).toBeGreaterThan(card.left + card.width / 2);
		}
		expect(facts[2].value.top).toBeGreaterThan(Math.max(facts[0].label.bottom, facts[1].label.bottom));
		expect(facts[2].column.left).toBeCloseTo(facts[0].column.left, 0);
		expect(facts[3].column.left).toBeCloseTo(facts[1].column.left, 0);
		const middle = (state.heading.bottom + 16 + state.content.bottom) / 2;
		for (const fact of facts.slice(0, 2)) expect(fact.value.top).toBeLessThan(middle);
		for (const fact of facts.slice(2)) expect(fact.value.bottom).toBeGreaterThan(middle);
	}
	expect(Math.abs(card.height - state.cell.height), 'card stretches with its grid row').toBeLessThanOrEqual(1);
	for (const fact of facts) {
		expect(fact.color).toBe(state.theme === 'light' ? 'rgb(129, 93, 0)' : 'rgb(255, 182, 39)');
		for (const element of [fact.value, fact.label]) {
			expect(['left', 'start']).toContain(element.align);
			expect(element.left).toBeCloseTo(fact.column.left, 0);
			for (const line of element.lines) {
				expect(line.left, 'each rendered line begins at its column edge').toBeCloseTo(fact.column.left, 0);
				expect(line.right).toBeLessThanOrEqual(fact.column.right + 1);
				expect(line.left).toBeGreaterThanOrEqual(card.left);
				expect(line.right).toBeLessThanOrEqual(card.right);
				expect(line.top).toBeGreaterThanOrEqual(card.top);
				expect(line.bottom).toBeLessThanOrEqual(card.bottom);
			}
			for (const word of element.words) expect(word.rects, `word stays whole: ${word.word}`).toHaveLength(1);
		}
		expect(fact.label.fontSize, 'preserve the shared label scale').toBe(13);
	}
	return state;
}

for (const locale of locales) {
	test(`${locale} About facts align at phone, tablet, desktop and layout boundaries`, async ({ page }, testInfo) => {
		// Each project owns its range, avoiding triplicated boundary sweeps in CI.
		const projectWidths = widths.filter(width => testInfo.project.name === 'phone' ? width < 640 : testInfo.project.name === 'tablet' ? width >= 640 && width < 1024 : width >= 1024);
		await openAbout(page, locale);
		const measurements = [];
		for (const width of projectWidths) {
			await page.setViewportSize({ width, height: width < 640 ? 844 : 900 });
			measurements.push({ width, ...await expectLayout(page, width) });
		}
		await testInfo.attach(`${locale}-geometry.json`, { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
	});

	test(`${locale} About facts retain alignment and accent in both themes @theme`, async ({ page }, testInfo) => {
		await openAbout(page, locale);
		for (const [name, width, height] of [['phone', 390, 844], ['tablet', 768, 1024], ['desktop', 1440, 900], ['four-columns-min', 640, 900], ['desktop-four-columns-min', 1790, 900]] as const) {
			await page.setViewportSize({ width, height });
			await expectLayout(page, width);
			await page.getByTestId('about-metrics').screenshot({ path: testInfo.outputPath(`${locale}-${name}-${testInfo.project.name}-block.png`) });
			if (['phone', 'tablet', 'desktop'].includes(name)) await page.screenshot({ path: testInfo.outputPath(`${locale}-${name}-${testInfo.project.name}-about.png`), fullPage: true });
		}
	});
}
