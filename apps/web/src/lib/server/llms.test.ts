import { describe, expect, it } from 'vitest';
import { llmsTxt, llmsFullTxt } from './llms';

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
	}
});
