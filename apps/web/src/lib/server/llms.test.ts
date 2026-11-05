import { describe, expect, it } from 'vitest';
import { llmsTxt, llmsFullTxt } from './llms';
import { blogPosts, projects, services } from '#lib/content/index.ts';
import { canonicalFor } from '#lib/utils/seo-defaults.ts';
import { sitePages } from '#lib/content/site-pages.ts';

describe('llms.txt — Spanish section (L2 Phase 4)', () => {
	it('keeps service and project metric values but omits source and date proof', () => {
		const metric = { value: { en: '30 s' }, label: { en: 'synthetic test claim' }, sourceUrl: 'https://example.org/evidence', asOf: '2026-11-04' };
		const body = llmsFullTxt({ locales: ['en', 'fr', 'es'], projects: [{ ...projects[0], impactMetrics: [metric] }], services: [{ ...services[0], impactMetric: metric }] });
		expect(body).toContain('30 s (synthetic test claim)');
		expect(body).not.toContain('https://example.org/evidence');
		expect(body).not.toContain('2026-11-04');
		expect(body).not.toContain('; source:');
		expect(body).not.toContain('; as of:');
	});
	it.each([llmsTxt, llmsFullTxt])('groups project rows by locale, preserving source project order within each locale', (render) => {
		const rows = projects.slice(0, 2).map((project) => ({ ...project, status: 'public' as const }));
		const body = render({ projects: rows, locales: ['fr', 'en'] });
		const urls = body.split('## Projects (personal builds, documented like case studies)')[1].split('## Blog')[0]
			.match(/https:\/\/yesid\.dev\/(?:fr\/)?projects\/[a-z0-9-]+/g);
		expect(urls).toEqual(['fr', 'en'].flatMap((locale) => rows.map((project) =>
			`https://yesid.dev/${locale === 'en' ? '' : 'fr/'}projects/${project.slug}`)));
	});
	it.each([['llmsTxt', llmsTxt], ['llmsFullTxt', llmsFullTxt]] as const)('%s omits archived section links', (_, render) => {
		const registry = sitePages.filter((page) => !['/blog', '/projects', '/services', '/contact'].includes(page.path));
		const body = render({ pages: registry });
		expect(body).not.toMatch(/https:\/\/yesid\.dev\/(?:es\/)?(?:blog|projects|services|contact)(?:\/|\b)/);
		expect(body).toContain('Available for remote and on-site work');
	});
	for (const [name, body] of [
		['llmsTxt', llmsTxt()],
		['llmsFullTxt', llmsFullTxt()],
	] as const) {
		it(`${name} declares the site trilingual and carries the Español section`, () => {
			expect(body).toContain('The site is trilingual');
			expect(body).toContain('https://yesid.dev/es');
			expect(body).toContain('## Español — infraestructura digital en Montreal, Québec');
			expect(body).toContain('Freelance Digital Infrastructure Developer');
			expect(body).toContain('Desarrollador freelance de infraestructura digital');
			expect(body).toContain('en español, francés e inglés');
			expect(body).toContain('https://yesid.dev/es/contact');
			expect(body).toContain('Available for remote and on-site work across Montréal, Laval, Longueuil, Gatineau, and Ottawa.');
			// Service geography belongs to the header; case studies can name their actual locations.
			expect(body.split('## Services')[0]).not.toMatch(/Brossard|Sherbrooke/);
		});

		it(`${name} lists every visible service under /es with Spanish copy`, () => {
			// The four station URLs must be the /es-prefixed ones inside the section.
			const section = body.slice(body.indexOf('## Español'));
			const esServiceLinks = section.match(/\(https:\/\/yesid\.dev\/es\/services\/[a-z-]+\)/g) ?? [];
			expect(esServiceLinks.length).toBeGreaterThanOrEqual(4);
		});

		it(`${name} no longer claims blog posts are English-only`, () => {
			expect(body).not.toContain('Blog posts are the exception: English-only for now.');
			expect(body).toContain('Blog articles are available in English, French, and Spanish.');
		});

		it(`${name} lists every blog row at its locale-correct URL and names its language`, () => {
			for (const post of blogPosts) {
				const url = post.external
					? post.url
					: canonicalFor(`/blog/${post.slug}`, post.lang);
				expect(body, `${post.lang}:${post.slug}`).toContain(url);
				expect(body, `${post.lang}:${post.slug}`).toContain(
					name === 'llmsTxt' ? `(${post.lang})` : `Language: ${post.lang}.`,
				);
			}
		});
	}
});
