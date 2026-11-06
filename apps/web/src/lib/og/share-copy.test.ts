import { describe, expect, it } from 'vitest';
import { SHARE_CTA, projectShareDescription, projectTagline, withShareCta } from './share-copy';

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

	it('closes a description with the invitation', () => {
		expect(withShareCta('Rows, columns and where measurement stops.', 'Read the article')).toBe('Rows, columns and where measurement stops. Read the article.');
		expect(withShareCta('No closing mark here', 'Read the article')).toBe('No closing mark here. Read the article.');
	});

	it('does not repeat an invitation the author already wrote, whichever apostrophe they typed', () => {
		const written = "Deux cartes peuvent se ressembler. Lire l'article.";
		expect(withShareCta(written, 'Lire l’article')).toBe(written);
	});

	it('leaves the text alone when the invitation would push it past the description limit', () => {
		const long = `${'x'.repeat(190)}.`;
		expect(withShareCta(long, 'Read the article')).toBe(long);
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
