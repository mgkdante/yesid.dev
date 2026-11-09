import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import LegalPage from './+page.svelte';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';
import type { BlockEditorDoc } from '#lib/types.ts';
import { catalog } from '#lib/catalog/index.ts';
import { resolvePageSeo } from '#lib/adapters/page-seo.ts';

describe('localized legal body rendering', () => {
	it.each(PUBLISHED_LOCALES)('renders the complete title and paragraphs in %s', async (locale) => {
		const paragraphs = [`Opening in ${locale}`, 'Public contact: contact@yesid.dev', `Last paragraph in ${locale}`];
		const body: BlockEditorDoc = {
			time: 0, version: '2.31.2',
			blocks: paragraphs.map((text, i) => ({ id: `p-${i}`, type: 'paragraph', data: { text } })),
		};
		const title = { en: 'English legal title', fr: 'Titre juridique français', es: 'Título legal español' };
		const fallbackBody: BlockEditorDoc = {
			...body, blocks: [{ id: 'fallback', type: 'paragraph', data: { text: 'English fallback' } }],
		};
		const data = {
			locale, themeColor: '#000000', headerLinks: [], footerLinks: [], menuItems: [], morphShapes: [],
			errorPage: catalog.content.errorPage(),
			seo: await resolvePageSeo('/legal/[slug]', locale, { slug: 'privacy' }),
			legalPage: { slug: 'fixture-legal', title, body: { en: fallbackBody, [locale]: body } },
		};
		render(LegalPage, {
			props: { data },
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]),
		});
		expect(screen.getByRole('heading', { level: 1, name: title[locale] })).toBeInTheDocument();
		const rendered = screen.getByTestId('legal-body');
		expect(within(rendered).getAllByRole('paragraph').map(p => p.textContent)).toEqual(paragraphs);
		expect(rendered).toHaveTextContent('contact@yesid.dev');
		expect(rendered).not.toHaveTextContent('admin@yesid.dev');
	});
});
