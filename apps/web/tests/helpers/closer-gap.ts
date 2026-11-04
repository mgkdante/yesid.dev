import type { Page } from '@playwright/test';

/** Measure from the painted hazard's bottom edge, not an inner content wrapper. */
export function measureCloserGap(page: Page) {
	return page.evaluate(() => {
		const cta = document.querySelector('[data-testid="home-cta-band"]')!;
		const closer = document.querySelector('[data-testid="closer-section"]')!;
		const section = closer.closest('.home-section')!;
		const ctaDivider = cta.previousElementSibling!;
		const divider = section.previousElementSibling!;
		for (const edge of [ctaDivider, divider]) {
			if (edge.getAttribute('data-slot') !== 'separator' || !getComputedStyle(edge).backgroundImage.includes('repeating-linear-gradient')) {
				throw new Error('Expected the actual hazard divider immediately before the section');
			}
		}
		// A zero-size baseline marker locates the real DOM baseline. Canvas then
		// supplies painted glyph ascent for the exact loaded font and first line.
		const ink = (heading: Element, firstLine: Element = heading) => {
			const style = getComputedStyle(firstLine);
			// Authored lines can wrap on phones. Measure glyphs on the first
			// rendered line rather than taking ascent from later wrapped words.
			const walker = document.createTreeWalker(firstLine, NodeFilter.SHOW_TEXT);
			let text = '', lineTop: number | undefined;
			let node: Node | null;
			lines: while ((node = walker.nextNode())) {
				for (let i = 0; i < node.textContent!.length; i++) {
					const range = document.createRange();
					range.setStart(node, i); range.setEnd(node, i + 1);
					const rect = range.getBoundingClientRect();
					if (!rect.width || (!text && !node.textContent![i].trim())) continue;
					lineTop ??= rect.top;
					if (rect.top > lineTop + 1) break lines;
					text += node.textContent![i];
				}
			}
			const height = heading.getBoundingClientRect().height;
			const marker = document.createElement('span');
			marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline;align-self:baseline';
			firstLine.prepend(marker);
			const baseline = marker.getBoundingClientRect().top;
			const probeHeight = heading.getBoundingClientRect().height;
			marker.remove();
			if (Math.abs(probeHeight - height) > 0.1) throw new Error('Baseline probe changed heading geometry');
			const context = document.createElement('canvas').getContext('2d')!;
			context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
			context.letterSpacing = style.letterSpacing;
			return { top: baseline - context.measureText(text).actualBoundingBoxAscent, baseline, font: style.fontSize, lineHeight: style.lineHeight };
		};
		const heading = cta.querySelector('.band-heading')!;
		const ctaInk = ink(heading, heading.querySelector('.band-line')!);
		const mobileHeading = section.querySelector('.home-section-heading-mobile')!;
		const stacked = getComputedStyle(mobileHeading).display !== 'none';
		const first = stacked ? mobileHeading.querySelector('.section-heading-text')! : closer.querySelector('[data-closer-board]')!;
		const firstInk = stacked ? ink(first) : null;
		const board = closer.querySelector('[data-closer-board]')!;
		return {
			ctaGap: heading.getBoundingClientRect().top - ctaDivider.getBoundingClientRect().bottom,
			ctaInkGap: ctaInk.top - ctaDivider.getBoundingClientRect().bottom,
			ctaFont: ctaInk.font, ctaLineHeight: ctaInk.lineHeight,
			ctaPadding: getComputedStyle(cta.querySelector('.cta-band')!).paddingTop,
			terminusGap: first.getBoundingClientRect().top - divider.getBoundingClientRect().bottom,
			terminusInkGap: firstInk ? firstInk.top - divider.getBoundingClientRect().bottom : null,
			first: stacked ? 'heading' : 'board',
			boardDividerGap: board.getBoundingClientRect().top - divider.getBoundingClientRect().bottom,
			sharedHeadingGap: stacked ? board.getBoundingClientRect().top - first.getBoundingClientRect().bottom : null,
			otherHeadings: [...document.querySelectorAll('.home-section-heading-mobile')].filter(el => el !== mobileHeading).map(el => ({
				text: el.textContent!.trim(), display: getComputedStyle(el).display,
				paddingTop: getComputedStyle(el).paddingTop, paddingBottom: getComputedStyle(el).paddingBottom,
				topGap: el.querySelector('.section-heading-text')!.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top,
			})),
		};
	});
}
