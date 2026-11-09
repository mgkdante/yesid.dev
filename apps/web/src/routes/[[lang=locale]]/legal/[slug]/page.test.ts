import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import LegalPage from './+page.svelte';
import { load } from './+page.server';
import { legalPages } from '#lib/content/legal-pages.ts';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { catalog } from '#lib/catalog/index.ts';
import { resolvePageSeo } from '#lib/adapters/page-seo.ts';

for (const locale of PUBLISHED_LOCALES) {
	describe(`${locale} legal loader and renderer`, () => {
		it.each(legalPages)('loads and renders the complete $slug document', async (expected) => {
			const loaded = await load({ params: { slug: expected.slug } });
			expect(loaded.legalPage).toEqual(expected);
			const data = {
				locale, themeColor: '#000000', headerLinks: [], footerLinks: [], menuItems: [], morphShapes: [],
				errorPage: catalog.content.errorPage(),
				seo: await resolvePageSeo('/legal/[slug]', locale, { slug: expected.slug }),
				...loaded,
			};
			render(LegalPage, {
				props: { data },
				context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]),
			});
			expect(screen.getByRole('heading', { level: 1, name: resolveLocale(expected.title, locale) })).toBeInTheDocument();
			const paragraphs = resolveLocale(expected.body, locale).blocks
				.filter(block => block.type === 'paragraph')
				.map(block => {
					const template = document.createElement('template');
					template.innerHTML = String(block.data.text);
					return template.content.textContent ?? '';
				});
			const body = screen.getByTestId('legal-body');
			expect(within(body).getAllByRole('paragraph').map(p => p.textContent)).toEqual(paragraphs);
			expect(body).toHaveTextContent('contact@yesid.dev');
			expect(body).not.toHaveTextContent('admin@yesid.dev');
		});
	});
}
