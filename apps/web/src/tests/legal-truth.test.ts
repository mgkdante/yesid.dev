import { describe, expect, it } from 'vitest';
import { legalPages } from '../lib/content/legal-pages';

for (const locale of ['en', 'fr', 'es'] as const) {
	describe(locale.toUpperCase() + ' fixture legal content', () => {
		it('keeps the private home location out of every legal page', () => {
			for (const page of legalPages) {
				const content = JSON.stringify({ title: page.title[locale], body: page.body[locale] });
				expect(content).not.toMatch(/\bGatineau\b/i);
				expect(content).not.toMatch(/\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/i);
			}
		});
		it('publishes the public contact address on every legal page', () => {
			expect(legalPages.map(page => page.slug)).toEqual(['privacy', 'terms', 'cookies', 'accessibility', 'notice']);
			for (const page of legalPages) {
				const body = JSON.stringify(page.body[locale]);
				expect(body).toContain('contact@yesid.dev');
				expect(body).not.toContain('admin@yesid.dev');
				expect(body).not.toMatch(/umami/i);
			}
		});
	});
}
