import { describe, it, expect } from 'vitest';
import { adapter } from '$lib/adapters';
import { match as ogTypeMatch } from '../params/ogType';
import { PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';
import { ogCoverage } from '@yesid/gates';
import {
	OG_BASE_SLUG_RE,
	ogImagePath,
	ogSlugParam,
	parseOgSlugParam,
	type OgLocale,
	type OgType,
} from '$lib/og/og-path';

function assertOgCoverage(type: OgType, identifiers: readonly string[]) {
	const coverage = ogCoverage({
		expected: [type],
		actual: ogTypeMatch(type) ? [type] : [],
		identifiers,
		isValidIdentifier: (identifier) => OG_BASE_SLUG_RE.test(identifier),
	});

	expect(coverage.missing, `missing OG endpoint type "${type}"`).toEqual([]);
	expect(coverage.extra, `unexpected OG endpoint type "${type}"`).toEqual([]);
	expect(coverage.invalid, `${type} base slugs must match ${OG_BASE_SLUG_RE}`).toEqual([]);
}

describe('OG coverage gate', () => {
	it('keeps the route type matcher and every published base slug inside the codec domain', async () => {
		const posts = await adapter.blog.all();
		const projects = await adapter.projects.public();

		expect(ogTypeMatch('other')).toBe(false);
		assertOgCoverage('blog', posts.map((post) => post.slug));
		assertOgCoverage('project', projects.map((project) => project.slug));
	});

	it('round-trips every published OG path and keeps the real entry matrix injective', async () => {
		const posts = await adapter.blog.all();
		const projects = await adapter.projects.public();
		const cases: Array<{ type: OgType; baseSlug: string; locale: OgLocale }> = [
			...posts.map((post) => ({
				type: 'blog' as const,
				baseSlug: post.slug,
				locale: post.lang,
			})),
			...projects.flatMap((project) =>
				PUBLISHED_LOCALES.map((locale) => ({
					type: 'project' as const,
					baseSlug: project.slug,
					locale,
				})),
			),
		];

		const paths = cases.map(({ type, baseSlug, locale }) => {
			const param = ogSlugParam(type, baseSlug, locale);
			const decoded = parseOgSlugParam(type, param);
			expect(decoded?.baseSlug).toBe(baseSlug);
			expect(decoded && ogSlugParam(type, decoded.baseSlug, decoded.locale)).toBe(param);
			if (type === 'project') expect(decoded?.locale).toBe(locale);
			return ogImagePath(type, baseSlug, locale);
		});

		expect(cases).toHaveLength(24);
		expect(new Set(paths).size).toBe(paths.length);
	});

	it('rejects unrepresentable base slugs and malformed encoded params', () => {
		expect(() => ogSlugParam('project', 'bad.slug', 'en')).toThrow(
			'[og] unencodable slug for project: "bad.slug" — must match /^[a-z0-9]+(?:-[a-z0-9]+)*$/',
		);
		expect(parseOgSlugParam('project', 'valid-slug.en')).toBeNull();
		expect(parseOgSlugParam('project', 'valid-slug.de')).toBeNull();
		expect(parseOgSlugParam('blog', 'valid-slug.fr')).toBeNull();
	});
});
