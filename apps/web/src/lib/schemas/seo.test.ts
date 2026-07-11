import { describe, expect, it } from 'vitest';
import { LocalizedStringSchema, PageSeoSchema } from './seo';
import { SchemaOrgNodeSchema } from './jsonld';

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

	it('preserves exact locale alternates and a stable locale-handoff identity', () => {
		const result = PageSeoSchema.parse({
			...validBase,
			localeAlternates: {
				en: 'https://yesid.dev/blog/source-slug',
				fr: 'https://yesid.dev/fr/blog/slug-francais',
				es: 'https://yesid.dev/es/blog/slug-espanol',
			},
			localeHandoffId: 'blog:source-article',
		});

		expect(result.localeAlternates).toEqual({
			en: 'https://yesid.dev/blog/source-slug',
			fr: 'https://yesid.dev/fr/blog/slug-francais',
			es: 'https://yesid.dev/es/blog/slug-espanol',
		});
		expect(result.localeHandoffId).toBe('blog:source-article');
	});

	it('rejects a non-URL exact locale alternate', () => {
		expect(
			PageSeoSchema.safeParse({
				...validBase,
				localeAlternates: { en: '/blog/source-slug' },
			}).success,
		).toBe(false);
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

describe('PageSeoSchema.jsonLd extension (Slice 15b)', () => {
	it('accepts a base entry with no jsonLd (backward compat with 15a)', () => {
		const result = PageSeoSchema.safeParse(validBase);
		expect(result.success).toBe(true);
	});

	it('accepts an entry with a jsonLd array', () => {
		const withJsonLd = {
			...validBase,
			jsonLd: [
				{
					'@type': 'BreadcrumbList' as const,
					'@id': 'https://yesid.dev/about#breadcrumb',
					itemListElement: [
						{
							'@type': 'ListItem' as const,
							position: 1,
							name: 'Home',
							item: 'https://yesid.dev',
						},
						{
							'@type': 'ListItem' as const,
							position: 2,
							name: 'About',
							item: 'https://yesid.dev/about',
						},
					],
				},
			],
		};
		expect(PageSeoSchema.safeParse(withJsonLd).success).toBe(true);
	});

	it('rejects an entry with malformed jsonLd (unknown @type)', () => {
		const withBad = {
			...validBase,
			jsonLd: [{ '@type': 'Unicorn', '@id': 'https://yesid.dev/#u', name: 'X' }],
		};
		expect(PageSeoSchema.safeParse(withBad).success).toBe(false);
	});

	it('accepts an empty jsonLd array', () => {
		const withEmpty = { ...validBase, jsonLd: [] };
		expect(PageSeoSchema.safeParse(withEmpty).success).toBe(true);
	});
});
