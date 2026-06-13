import { describe, it, expect } from 'vitest';
import { HeroDataSchema } from './hero-data';
import { INITIAL_HERO_DATA, localizeHeroData } from '$lib/content/hero-data';

// Regression guard: the hero metric FR (labelI18n/subI18n) used to be stripped
// here. The static adapter validates the SSR heroData through HeroDataSchema
// (parsePort), and Zod drops unknown keys — so when the schema omitted
// labelI18n/subI18n, the FR never reached the client and localizeHeroData fell
// back to the EN label. The TS drift detector misses it (both fields optional),
// so this test is the only guard.
describe('HeroDataSchema — preserves metric i18n', () => {
	it('keeps labelI18n/subI18n when parsing the SSR heroData', () => {
		const parsed = HeroDataSchema.parse(INITIAL_HERO_DATA);
		for (const m of parsed.metrics) {
			expect(m.labelI18n, `metric ${m.key} labelI18n`).toBeDefined();
			expect(m.subI18n, `metric ${m.key} subI18n`).toBeDefined();
		}
	});

	it('localizeHeroData resolves FR metric labels off the parsed data', () => {
		const fr = localizeHeroData(HeroDataSchema.parse(INITIAL_HERO_DATA), 'fr');
		const labels = fr.metrics.map((m) => m.label);
		expect(labels).toContain('VÉHICULES SUIVIS');
		expect(labels).toContain('RETARD MOYEN');
		expect(labels).toContain('LIGNES EN DIRECT');
	});
});
