import { describe, expect, it } from 'vitest';
import { SHARE_CTA, projectShareDescription, projectTagline } from './share-copy';

const LOCALES = ['en', 'fr', 'es'] as const;
const SLUGS = ['transit-data-pipeline', 'cafe-arona', 'yesid-dev-design', 'yesid-dev'];

describe('share copy', () => {
	it.each(SLUGS)('keeps the %s description short and closes it with the invitation', (slug) => {
		const description = projectShareDescription(slug);
		for (const locale of LOCALES) {
			const text = description?.[locale] ?? '';
			expect(text.length).toBeGreaterThanOrEqual(50);
			expect(text.length).toBeLessThanOrEqual(110);
			expect(text.endsWith(`${SHARE_CTA.project.label[locale]}.`)).toBe(true);
			expect(text.startsWith(projectTagline(slug, locale) ?? 'missing')).toBe(true);
		}
	});

	it('has nothing to say about an unknown project', () => {
		expect(projectShareDescription('unknown')).toBeUndefined();
		expect(projectTagline('unknown', 'en')).toBeUndefined();
	});

	it('keeps yellow for the actions that reach Yesid', () => {
		const tones = Object.entries(SHARE_CTA).filter(([, cta]) => cta.tone === 'conversion').map(([kind]) => kind);
		expect(tones.sort()).toEqual(['contact', 'home']);
	});
});
