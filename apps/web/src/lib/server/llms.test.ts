import { describe, expect, it } from 'vitest';
import { llmsTxt, llmsFullTxt } from './llms';
import { blogPosts } from '$lib/content';
import { canonicalFor } from '$lib/utils/seo-defaults';

// L2 (launch Phase 4, AEO): the Spanish section is how AI answer engines
// fielding Spanish queries meet native copy + the /es URLs. Both bodies
// carry it; the header announces the site trilingual.

describe('llms.txt — Spanish section (L2 Phase 4)', () => {
	for (const [name, body] of [
		['llmsTxt', llmsTxt()],
		['llmsFullTxt', llmsFullTxt()],
	] as const) {
		it(`${name} declares the site trilingual and carries the Español section`, () => {
			expect(body).toContain('The site is trilingual');
			expect(body).toContain('https://yesid.dev/es');
			expect(body).toContain('## Español — infraestructura digital en Montreal, Québec');
			expect(body).toContain('en español, francés e inglés');
			expect(body).toContain('https://yesid.dev/es/contact');
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
