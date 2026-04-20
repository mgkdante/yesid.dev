import { describe, expect, it } from 'vitest';
import { LocalizedStringSchema, PageSeoSchema } from './seo';

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

	it('accepts a full optional payload (relative ogImage.url allowed by design)', () => {
		// ogImage.url deliberately accepts relative paths — SeoHead resolves
		// them against SITE_HOST before emitting og:image. canonical, by
		// contrast, must be absolute (it ships verbatim).
		const full = {
			...validBase,
			ogImage: { url: '/og/x.png', alt: { en: 'Alt text' } },
			ogType: 'article' as const,
			noIndex: true,
		};
		expect(PageSeoSchema.safeParse(full).success).toBe(true);
	});

	it('rejects whitespace-only title.en (semantically empty)', () => {
		const result = PageSeoSchema.safeParse({ ...validBase, title: { en: '   ' } });
		expect(result.success).toBe(false);
	});
});

describe('LocalizedStringSchema', () => {
	it('accepts en-only', () => {
		expect(LocalizedStringSchema.safeParse({ en: 'Hello' }).success).toBe(true);
	});

	it('accepts en + optional locales', () => {
		const result = LocalizedStringSchema.safeParse({ en: 'Hello', fr: 'Bonjour', es: 'Hola' });
		expect(result.success).toBe(true);
	});

	it('rejects empty en', () => {
		expect(LocalizedStringSchema.safeParse({ en: '' }).success).toBe(false);
	});

	it('rejects whitespace-only en', () => {
		expect(LocalizedStringSchema.safeParse({ en: '   ' }).success).toBe(false);
		expect(LocalizedStringSchema.safeParse({ en: '\t\n' }).success).toBe(false);
	});

	it('rejects missing en', () => {
		expect(LocalizedStringSchema.safeParse({ fr: 'Bonjour' }).success).toBe(false);
	});

	it('allows empty optional locales (content not yet translated)', () => {
		// Empty-string fr/es is not a semantic error at the schema level — the
		// resolveLocale() util handles the "missing translation" fallback.
		expect(LocalizedStringSchema.safeParse({ en: 'Hello', fr: '' }).success).toBe(true);
	});
});
