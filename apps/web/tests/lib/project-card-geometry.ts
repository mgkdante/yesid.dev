import { expect, type Locator } from '@playwright/test';

export async function expectCardContentInside(card: Locator) {
	const violations = await card.evaluate(link => {
		const failures: string[] = [];
		const cardBox = link.getBoundingClientRect();
		const selectors = ['[data-testid="proof-card-title"]', '[data-testid="proof-excerpt"]', '[data-testid="proof-card-links"] li'];
		for (const element of link.querySelectorAll<HTMLElement>(selectors.join(','))) {
			if (!element.checkVisibility()) continue;
			const name = element.dataset.testid ?? element.className;
			const range = document.createRange();
			range.selectNodeContents(element);
			const content = element.textContent?.trim() ? Array.from(range.getClientRects()) : [element.getBoundingClientRect()];
			for (const box of content) {
				if (!box.width || !box.height) failures.push(name + ': empty rendered content');
				if (box.left < cardBox.left - 1 || box.right > cardBox.right + 1 || box.top < cardBox.top - 1 || box.bottom > cardBox.bottom + 1) {
					failures.push(name + ': outside card');
				}
				let ancestor: HTMLElement | null = element;
				while (ancestor && ancestor !== link) {
					const style = getComputedStyle(ancestor);
					const bounds = ancestor.getBoundingClientRect();
					if (/hidden|clip|auto|scroll/.test(style.overflowX) && (box.left < bounds.left - 1 || box.right > bounds.right + 1)) {
						failures.push(name + ': horizontally clipped by ' + ancestor.className);
					}
					if (/hidden|clip|auto|scroll/.test(style.overflowY) && (box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1)) {
						failures.push(name + ': vertically clipped by ' + ancestor.className);
					}
					ancestor = ancestor.parentElement;
				}
			}
		}
		return failures;
	});
	expect(violations, 'card text must remain inside its clipping ancestors').toEqual([]);
}
