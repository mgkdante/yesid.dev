import { expect, type Locator } from '@playwright/test';

export async function expectCardContentInside(card: Locator) {
	const violations = await card.evaluate(link => {
		const failures: string[] = [];
		const cardBox = link.getBoundingClientRect();
		const selectors = [
			'[data-testid="proof-card-title"]', '[data-testid="proof-excerpt"]',
			'[data-testid="proof-metric-before"]', '[data-testid="proof-metric-value"]',
			'[data-testid="proof-metric-label"]', '[data-testid="proof-metric-overflow"]', '.line-bullet',
		];
		for (const element of link.querySelectorAll<HTMLElement>(selectors.join(','))) {
			if (!element.checkVisibility()) continue;
			const name = element.dataset.testid ?? element.className;
			if (element.dataset.testid === 'proof-metric-value') {
				const nodes = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
				while (nodes.nextNode()) {
					for (const word of nodes.currentNode.textContent!.matchAll(/\S+/g)) {
						const wordRange = document.createRange();
						wordRange.setStart(nodes.currentNode, word.index!);
						wordRange.setEnd(nodes.currentNode, word.index! + word[0].length);
						if (wordRange.getClientRects().length > 1) failures.push(name + ': word split across lines');
					}
				}
			}
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
	expect(violations, 'card text, metrics and service roundels must remain inside their clipping ancestors').toEqual([]);
}
