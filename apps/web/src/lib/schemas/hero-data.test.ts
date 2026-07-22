import { describe, it, expect } from 'vitest';
import { HeroDataSchema } from './hero-data';
import { INITIAL_HERO_DATA } from '$lib/live';

// Regression guard: the dashboard card LABEL/SUB copy is CMS truth now
// (siteLabels.heroDashboard, resolved in HeroMetrics by metric key). The metric
// only carries code-owned dynamic data, including the numbers the CMS
// sub-templates interpolate: {coverage} (delay card) and {total} (routes card).
// The static adapter validates the SSR heroData through HeroDataSchema
// (parsePort), and Zod DROPS unknown keys — so if the schema omitted
// coverage/total, those numbers would never reach the client and the CMS
// sub-templates would render '{coverage}% COVERAGE' / 'OF {total} TOTAL'
// literally. The TS drift detector misses it (both fields optional), so this
// test is the only guard.
describe('HeroDataSchema — preserves metric interpolation numbers', () => {
	it('keeps coverage/total when parsing the SSR heroData', () => {
		const parsed = HeroDataSchema.parse(INITIAL_HERO_DATA);
		const delay = parsed.metrics.find((m) => m.key === 'delay');
		const routes = parsed.metrics.find((m) => m.key === 'routes');
		expect(delay?.coverage, 'delay metric coverage').toBeDefined();
		expect(routes?.total, 'routes metric total').toBeDefined();
	});

	it('does not carry localized label/sub copy on the metric (CMS truth)', () => {
		const parsed = HeroDataSchema.parse(INITIAL_HERO_DATA);
		for (const m of parsed.metrics) {
			expect(m).not.toHaveProperty('label');
			expect(m).not.toHaveProperty('sub');
			expect(m).not.toHaveProperty('labelI18n');
			expect(m).not.toHaveProperty('subI18n');
		}
	});
});
