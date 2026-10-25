import { describe, expect, it } from 'vitest';
import { llmsTxt, llmsFullTxt } from './llms';
import { blogPosts } from '#lib/content/index.js';
import { canonicalFor } from '#lib/utils/seo-defaults.js';
import { sitePages } from '#lib/content/site-pages';

// L2 (launch Phase 4, AEO): the Spanish section is how AI answer engines
// fielding Spanish queries meet native copy + the /es URLs. Both bodies
// carry it; the header announces the site trilingual.

describe('llms.txt — Spanish section (L2 Phase 4)', () => {
	it.each([['llmsTxt', llmsTxt], ['llmsFullTxt', llmsFullTxt]] as const)('%s omits archived section links', (_, render) => {
		const registry = sitePages.filter((page) => !['/blog', '/projects', '/services', '/contact'].includes(page.path));
		const body = render(registry);
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
			expect(body).toContain('## Español — soluciones digitales en Montreal, Québec');
			expect(body).toContain('Freelance Digital Solutions Developer');
			expect(body).toContain('Desarrollador freelance de soluciones digitales');
			expect(body).toContain('en español, francés e inglés');
			expect(body).toContain('https://yesid.dev/es/contact');
			expect(body).toContain('Available for remote and on-site work across Montréal.');
			// Service geography belongs to the header; case studies can name their actual locations.
			expect(body.split('## Services')[0]).not.toMatch(/Laval|Longueuil|Brossard|Gatineau|Ottawa|Sherbrooke/);
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
