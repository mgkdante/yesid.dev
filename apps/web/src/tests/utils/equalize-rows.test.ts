import { afterEach, expect, it, vi } from 'vitest';
import { equalizeRows } from '#lib/utils/equalize-rows.ts';

afterEach(() => vi.unstubAllGlobals());

it('aligns multi-column cards, clears single-column heights, and realigns after resize', () => {
	let flush: FrameRequestCallback = () => {};
	let resize: ResizeObserverCallback = () => {};
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { flush = callback; return 1; });
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
	vi.stubGlobal('ResizeObserver', class {
		constructor(callback: ResizeObserverCallback) { resize = callback; }
		observe() {}
		disconnect() {}
	});
	const node = document.createElement('div');
	node.innerHTML = '<article><p>Short</p></article><article><p>Longer text</p></article>';
	let width = 1440;
	let cardWidth = 700;
	vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => ({ width }) as DOMRect);
	vi.spyOn(node.children[0], 'getBoundingClientRect').mockImplementation(() => ({ width: cardWidth }) as DOMRect);
	const rows = [...node.querySelectorAll('p')];
	rows.forEach((row, index) => vi.spyOn(row, 'getBoundingClientRect').mockReturnValue({ height: 30 + index * 20 } as DOMRect));
	const action = equalizeRows(node, ['p']);
	flush(0);
	expect(rows.map(row => row.style.minHeight)).toEqual(['50px', '50px']);
	width = 390;
	cardWidth = 390;
	resize([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver);
	flush(0);
	expect(rows.map(row => row.style.minHeight)).toEqual(['', '']);
	for (const [containerWidth, childWidth, expected] of [[800, 390, '50px'], [1000, 1000, ''], [1440, 700, '50px']] as const) {
		width = containerWidth;
		cardWidth = childWidth;
		resize([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver);
		flush(0);
		expect(rows.map(row => row.style.minHeight)).toEqual([expected, expected]);
	}
	action?.destroy?.();
});
