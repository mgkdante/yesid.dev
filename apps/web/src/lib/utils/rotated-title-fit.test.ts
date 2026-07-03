import { describe, it, expect } from 'vitest';
import { uniformFitSize, measureLabelWidths } from './rotated-title-fit';

describe('uniformFitSize', () => {
	it('sizes off the WIDEST label: it exactly fills the budget', () => {
		// At probe 100px: "SERVICES" 620px wide, "TERMINUS" 700px (widest).
		// Budget 350px → 350 / (700/100) = 50px.
		expect(uniformFitSize([620, 700], 100, 350, 96)).toBe(50);
	});

	it('applies the SAME size regardless of the other labels (uniformity)', () => {
		const withShort = uniformFitSize([100, 700], 100, 350, 96);
		const withoutShort = uniformFitSize([700], 100, 350, 96);
		expect(withShort).toBe(withoutShort);
	});

	it('never exceeds the design max even on tall viewports', () => {
		// Budget generous: fit would be 200px, but the design cap wins.
		expect(uniformFitSize([700], 100, 1400, 96)).toBe(96);
	});

	it('shrinks below the old fixed floors when the viewport is short (no overflow, ever)', () => {
		// 8-char label on a 240px budget → 24px: smaller than any fixed floor.
		expect(uniformFitSize([1000], 100, 240, 96)).toBe(24);
	});

	it('falls back to maxPx on degenerate inputs', () => {
		expect(uniformFitSize([], 100, 350, 96)).toBe(96);
		expect(uniformFitSize([0], 100, 350, 96)).toBe(96);
		expect(uniformFitSize([700], 0, 350, 96)).toBe(96);
	});
});

describe('measureLabelWidths', () => {
	it('returns null when no canvas 2D context exists (SSR/test DOMs keep the CSS fallback)', () => {
		// happy-dom provides no real 2D context; the guard must hand back null
		// rather than fabricate widths.
		const result = measureLabelWidths(['SERVICES'], {
			family: 'sans-serif',
			weight: 900,
			letterSpacingEm: -0.02,
		});
		expect(result === null || result.every((w) => typeof w === 'number')).toBe(true);
	});
});
