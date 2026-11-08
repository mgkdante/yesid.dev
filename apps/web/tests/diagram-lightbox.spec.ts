import { expect, test, type Page } from '@playwright/test';

// The enlarged diagram sits in the middle of its frame and still scrolls when it is taller.
const PAGE = '/projects/transit-data-pipeline';

async function openDiagram(page: Page, viewport: { width: number; height: number }) {
	await page.setViewportSize(viewport);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(PAGE);
	const open = page.getByRole('button', { name: 'Enlarge diagram' }).first();
	await open.scrollIntoViewIfNeeded();
	await open.click();
	const frame = page.getByTestId('article-media-diagram');
	await expect(frame.locator('svg')).toBeVisible();
	return frame;
}

// Gaps between the diagram and the frame's padded content box.
function gaps(frame: Element) {
	const box = frame.getBoundingClientRect();
	const style = getComputedStyle(frame);
	const svg = frame.querySelector('svg')!.getBoundingClientRect();
	return {
		top: svg.top - (box.top + parseFloat(style.paddingTop)),
		bottom: box.bottom - parseFloat(style.paddingBottom) - svg.bottom,
		left: svg.left - (box.left + parseFloat(style.paddingLeft)),
		right: box.right - parseFloat(style.paddingRight) - svg.right,
		paddingTop: parseFloat(style.paddingTop),
		paddingBottom: parseFloat(style.paddingBottom),
		overflows: frame.scrollHeight > frame.clientHeight,
	};
}

test.describe('enlarged diagrams', () => {
	test.beforeEach(({}, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'Sets its own viewports');
	});

	test('a diagram shorter than its frame is centered both ways', async ({ page }) => {
		const frame = await openDiagram(page, { width: 390, height: 844 });
		const g = await frame.evaluate(gaps);
		expect(g.overflows, 'this diagram fits a phone frame').toBe(false);
		expect(g.paddingBottom, 'the frame pads both ends alike').toBe(g.paddingTop);
		expect(Math.abs(g.top - g.bottom), `vertical gaps ${g.top} / ${g.bottom}`).toBeLessThanOrEqual(2);
		expect(Math.abs(g.left - g.right), `horizontal gaps ${g.left} / ${g.right}`).toBeLessThanOrEqual(2);
	});

	test('a diagram taller than its frame starts at the top and scrolls to its end', async ({ page }) => {
		const frame = await openDiagram(page, { width: 1440, height: 900 });
		const start = await frame.evaluate(gaps);
		expect(start.overflows, 'this diagram is taller than a desktop frame').toBe(true);
		expect(start.top, 'nothing is cut off above the diagram').toBeGreaterThanOrEqual(-1);
		const end = await frame.evaluate((node) => {
			node.scrollTop = node.scrollHeight;
			const box = node.getBoundingClientRect();
			return box.bottom - node.querySelector('svg')!.getBoundingClientRect().bottom;
		});
		expect(end, 'the end of the diagram is reachable').toBeGreaterThanOrEqual(-1);
	});
});
