import { describe, expect, it } from 'bun:test';
import { toLegalPage } from './legal-pages';
import { LegalPageSchema } from '@repo/shared';

const doc = (text: string) => ({
	time: 1751500800000,
	version: '2.31.2',
	blocks: [{ id: 'b1', type: 'paragraph', data: { text } }],
});

describe('toLegalPage (OPS1)', () => {
	it('recomposes slug, per-locale title, and per-locale body', () => {
		const out = toLegalPage({
			id: 'privacy',
			status: 'published',
			sort: 1,
			translations: [
				{ languages_code: 'en', title: 'Privacy Policy', body: doc('hello') },
				{ languages_code: 'fr', title: 'Politique de confidentialité', body: doc('bonjour') },
			],
		});
		expect(out.slug).toBe('privacy');
		expect(out.title).toEqual({ en: 'Privacy Policy', fr: 'Politique de confidentialité' });
		expect((out.body.en as { blocks: unknown[] }).blocks).toHaveLength(1);
		expect(out.body.fr).toBeDefined();
		expect(out.body.es).toBeUndefined();
		expect(() => LegalPageSchema.parse(out)).not.toThrow();
	});

	it('skips locales without a body (L1 ES lands later)', () => {
		const out = toLegalPage({
			id: 'terms',
			translations: [
				{ languages_code: 'en', title: 'Terms of Use', body: doc('terms') },
				{ languages_code: 'fr', title: 'Conditions d\'utilisation', body: null },
			],
		});
		expect(out.title.fr).toBe('Conditions d\'utilisation');
		expect(out.body.fr).toBeUndefined();
		expect(() => LegalPageSchema.parse(out)).not.toThrow();
	});
});
