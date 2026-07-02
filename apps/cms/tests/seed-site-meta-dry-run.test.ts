import { describe, it, expect } from 'bun:test';
import {
	SiteMetaFixtureSchema,
	loadSiteMetaFixture,
	toSiteMetaSingletonPatch,
	toSiteMetaTranslationRows,
	type SiteMetaFixture,
} from '../scripts/seed-site-meta';

describe('seed-site-meta pure helpers', () => {
	const fixture = loadSiteMetaFixture();

	describe('loadSiteMetaFixture', () => {
		it('returns a singleton object (not an array)', () => {
			expect(Array.isArray(fixture)).toBe(false);
			expect(typeof fixture).toBe('object');
		});

		it('has id=1 (singleton convention)', () => {
			expect(fixture.id).toBe(1);
		});

		it('has all 13 expected parent fields', () => {
			expect(Object.keys(fixture).sort()).toEqual(
				[
					'id',
					'name',
					'email',
					'github_url',
					'linkedin_url',
					'upwork_url',
					'owner_name',
					'owner_locality',
					'owner_region',
					'owner_country',
					'owner_knows_about',
					'default_og_image',
					'theme_color',
					'translations',
				].sort(),
			);
		});

		it('has 3 translation rows (en/fr/es)', () => {
			expect(fixture.translations.length).toBe(3);
			const codes = fixture.translations.map((t) => t.languages_code).sort();
			expect(codes).toEqual(['en', 'es', 'fr']);
		});

		it('every fixture parses cleanly through Zod (no throw)', () => {
			// Reaching here means SiteMetaFixtureSchema.parse() succeeded —
			// loadSiteMetaFixture would have thrown on validation failure.
			expect(fixture.id).toBe(1);
		});
	});

	describe('parent field shape', () => {
		it('builds a parent-only patch for existing singleton re-runs', () => {
			const patch = toSiteMetaSingletonPatch(fixture) as Record<string, unknown>;
			expect(patch.id).toBeUndefined();
			expect(patch.translations).toBeUndefined();
			expect(Object.keys(patch).sort()).toEqual(
				[
					'name',
					'email',
					'github_url',
					'linkedin_url',
					'upwork_url',
					'owner_name',
					'owner_locality',
					'owner_region',
					'owner_country',
					'owner_knows_about',
					'default_og_image',
					'theme_color',
				].sort(),
			);
		});

		it('preserves brand name', () => {
			expect(fixture.name).toBe('yesid.');
		});

		it('preserves contact email (valid format)', () => {
			expect(fixture.email).toBe('contact@yesid.dev');
		});

		it('preserves social URLs', () => {
			expect(fixture.github_url).toBe('https://github.com/mgkdante');
			expect(fixture.linkedin_url).toBe('https://www.linkedin.com/in/otaloray/');
			expect(fixture.upwork_url).toBe(
				'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82',
			);
		});

		it('preserves owner identity', () => {
			expect(fixture.owner_name).toBe('Yesid O.');
			expect(fixture.owner_locality).toBe('Montreal');
			expect(fixture.owner_region).toBe('QC');
			expect(fixture.owner_country).toBe('CA');
		});

		it('owner_country is exactly 2 chars (ISO 3166-1 alpha-2)', () => {
			expect(fixture.owner_country.length).toBe(2);
		});

		it('owner_knows_about is a CSV string', () => {
			expect(typeof fixture.owner_knows_about).toBe('string');
			const tags = fixture.owner_knows_about.split(',').map((s) => s.trim());
			expect(tags.length).toBeGreaterThan(0);
			expect(tags).toContain('PostgreSQL');
			expect(tags).toContain('SvelteKit');
		});

		it('default_og_image is null until designer asset uploaded (P2 finding)', () => {
			expect(fixture.default_og_image).toBeNull();
		});

		it('theme_color matches hex regex', () => {
			expect(fixture.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(fixture.theme_color).toBe('#141414');
		});
	});

	describe('EN translation', () => {
		const en = fixture.translations.find((t) => t.languages_code === 'en');

		it('exists', () => {
			expect(en).toBeDefined();
		});

		it('has non-empty tagline (≤100 chars)', () => {
			expect(en!.tagline.length).toBeGreaterThan(0);
			expect(en!.tagline.length).toBeLessThanOrEqual(100);
			expect(en!.tagline).toBe('Digital infrastructure that moves.');
		});

		it('has non-empty description (≤300 chars)', () => {
			expect(en!.description.length).toBeGreaterThan(0);
			expect(en!.description.length).toBeLessThanOrEqual(300);
		});

		it('default_description is in the 50–200 SEO band', () => {
			const len = en!.default_description.length;
			expect(len).toBeGreaterThanOrEqual(50);
			expect(len).toBeLessThanOrEqual(200);
		});

		it('owner_job_title is populated', () => {
			expect(en!.owner_job_title).toBe('Freelance Digital Infrastructure Engineer');
		});
	});

	describe('translation rows', () => {
		it('builds FK-free rows for explicit delete-and-recreate upsert', () => {
			const rows = toSiteMetaTranslationRows(fixture);
			expect(rows.length).toBe(3);
			for (const row of rows as Record<string, unknown>[]) {
				expect(row.id).toBeUndefined();
				expect(row.site_meta_id).toBeUndefined();
				expect(Object.keys(row).sort()).toEqual(
					[
						'languages_code',
						'tagline',
						'description',
						'default_description',
						'owner_job_title',
					].sort(),
				);
			}
		});
	});

	describe('FR translation (full — FR launched slice-28.6)', () => {
		const fr = fixture.translations.find((t) => t.languages_code === 'fr');

		it('exists', () => {
			expect(fr).toBeDefined();
		});

		it('has owner_job_title populated', () => {
			expect(fr!.owner_job_title).toBe('Ingénieur pigiste en infrastructure numérique');
		});

		it('has populated tagline/description/default_description (fixture mirrors the live FR content)', () => {
			expect(fr!.tagline.length).toBeGreaterThan(0);
			expect(fr!.description.length).toBeGreaterThan(0);
			expect(fr!.default_description.length).toBeGreaterThan(0);
		});
	});

	describe('ES translation (partial — owner_job_title only)', () => {
		const es = fixture.translations.find((t) => t.languages_code === 'es');

		it('exists', () => {
			expect(es).toBeDefined();
		});

		it('has owner_job_title populated', () => {
			expect(es!.owner_job_title).toBe('Ingeniero independiente en infraestructura digital');
		});

		it('has empty tagline/description/default_description', () => {
			expect(es!.tagline).toBe('');
			expect(es!.description).toBe('');
			expect(es!.default_description).toBe('');
		});
	});

	describe('SiteMetaFixtureSchema rejects malformed input', () => {
		const validBase: SiteMetaFixture = fixture;

		it('rejects id !== 1', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, id: 2 }),
			).toThrow();
		});

		it('rejects invalid email format', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, email: 'not-an-email' }),
			).toThrow();
		});

		it('rejects invalid github_url', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({
					...validBase,
					github_url: 'not a url',
				}),
			).toThrow();
		});

		it('rejects 3-letter owner_country (must be exactly 2)', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, owner_country: 'CAN' }),
			).toThrow();
		});

		it('rejects invalid theme_color (no #)', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, theme_color: '141414' }),
			).toThrow();
		});

		it('rejects invalid theme_color (3-digit shorthand)', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, theme_color: '#fff' }),
			).toThrow();
		});

		it('rejects EN default_description <50 chars (out of SEO band)', () => {
			const short = {
				...validBase,
				translations: validBase.translations.map((t) =>
					t.languages_code === 'en'
						? { ...t, default_description: 'too short' }
						: t,
				),
			};
			expect(() => SiteMetaFixtureSchema.parse(short)).toThrow(
				/default_description must be 50–200 chars/,
			);
		});

		it('rejects EN default_description >200 chars (out of SEO band)', () => {
			const long = {
				...validBase,
				translations: validBase.translations.map((t) =>
					t.languages_code === 'en'
						? { ...t, default_description: 'a'.repeat(201) }
						: t,
				),
			};
			expect(() => SiteMetaFixtureSchema.parse(long)).toThrow(
				/default_description must be 50–200 chars/,
			);
		});

		it('rejects fixture missing EN translation', () => {
			const noEn = {
				...validBase,
				translations: validBase.translations.filter(
					(t) => t.languages_code !== 'en',
				),
			};
			expect(() => SiteMetaFixtureSchema.parse(noEn)).toThrow(
				/EN translation required/,
			);
		});

		it('rejects empty translations array', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, translations: [] }),
			).toThrow();
		});

		it('accepts default_og_image as null (P2 finding — no asset yet)', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, default_og_image: null }),
			).not.toThrow();
		});

		it('accepts default_og_image as a UUID string', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({
					...validBase,
					default_og_image: '74b62762-8d8d-4301-8635-f236bc23f739',
				}),
			).not.toThrow();
		});

		it('accepts linkedin_url as null (optional + nullable)', () => {
			expect(() =>
				SiteMetaFixtureSchema.parse({ ...validBase, linkedin_url: null }),
			).not.toThrow();
		});
	});
});
