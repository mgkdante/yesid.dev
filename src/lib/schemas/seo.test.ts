import { describe, expect, it } from 'vitest';
import { PageSeoSchema } from './seo';

const validLocalized = { en: 'Yesid — Digital Infrastructure' };
const validBase = {
	title: validLocalized,
	description: { en: 'A'.repeat(155) }, // within 150–160 target
	canonical: 'https://yesid.dev/about',
};

describe('PageSeoSchema', () => {
	it('accepts a minimal valid input', () => {
		const result = PageSeoSchema.safeParse(validBase);
		expect(result.success).toBe(true);
	});

	it('defaults ogType to "website" and noIndex to false', () => {
		const result = PageSeoSchema.parse(validBase);
		expect(result.ogType).toBe('website');
		expect(result.noIndex).toBe(false);
	});

	it('rejects missing title', () => {
		const { title: _t, ...bad } = validBase;
		expect(PageSeoSchema.safeParse(bad).success).toBe(false);
	});

	it('rejects a non-url canonical', () => {
		const result = PageSeoSchema.safeParse({ ...validBase, canonical: '/about' });
		expect(result.success).toBe(false);
	});

	it('rejects LocalizedString without required en', () => {
		const result = PageSeoSchema.safeParse({
			...validBase,
			title: { fr: 'Yesid' } as unknown as typeof validLocalized,
		});
		expect(result.success).toBe(false);
	});

	it('rejects description shorter than 50 chars (Zod hard-fail floor)', () => {
		const result = PageSeoSchema.safeParse({ ...validBase, description: { en: 'short' } });
		expect(result.success).toBe(false);
	});

	it('rejects description longer than 200 chars (Zod hard-fail ceiling)', () => {
		const result = PageSeoSchema.safeParse({
			...validBase,
			description: { en: 'A'.repeat(201) },
		});
		expect(result.success).toBe(false);
	});

	it('rejects title longer than 70 chars (Zod hard-fail ceiling)', () => {
		const result = PageSeoSchema.safeParse({ ...validBase, title: { en: 'A'.repeat(71) } });
		expect(result.success).toBe(false);
	});

	it('accepts a full optional payload', () => {
		const full = {
			...validBase,
			ogImage: { url: '/og/x.png', alt: { en: 'Alt text' } },
			ogType: 'article' as const,
			noIndex: true,
		};
		expect(PageSeoSchema.safeParse(full).success).toBe(true);
	});
});
