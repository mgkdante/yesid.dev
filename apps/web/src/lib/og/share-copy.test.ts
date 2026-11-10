import { describe, expect, it } from 'vitest';
import { SHARE_CTA, withShareCta } from './share-copy';

describe('share copy', () => {
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

	it('keeps yellow for the actions that reach Yesid', () => {
		const tones = Object.entries(SHARE_CTA).filter(([, cta]) => cta.tone === 'conversion').map(([kind]) => kind);
		expect(tones.sort()).toEqual(['contact', 'home']);
	});
});
